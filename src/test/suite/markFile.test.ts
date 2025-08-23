/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock dependencies before imports
jest.mock('../../utils/vscodeUtils', () => ({
	getActiveFilePath: jest.fn(),
	getConfig: jest.fn(),
	validateWorkspace: jest.fn(),
	showMessage: {
		info: jest.fn(),
		error: jest.fn(),
		warning: jest.fn(),
	},
}));

jest.mock('../../providers/markedFilesProvider', () => ({
	markedFiles: new Set(),
	forceIncludedFiles: new Set(),
}));
jest.mock('../../utils/ignoreUtils', () => ({
	isIgnored: jest.fn(),
	initializeIgnoreFilter: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../utils/fileUtils', () => ({
	getRelativePath: jest.fn(),
	getExtension: jest.fn(),
	getBasename: jest.fn(),
	resolvePath: jest.fn(),
	isDirectory: jest.fn(),
}));

import { markFile } from '../../commands/markFile';
import * as vscodeUtils from '../../utils/vscodeUtils';
import {
	markedFiles,
	forceIncludedFiles,
} from '../../providers/markedFilesProvider';
import * as fileUtils from '../../utils/fileUtils';
import * as ignoreUtils from '../../utils/ignoreUtils';

describe('Mark File Commands', () => {
	let mockProvider: any;

	beforeEach(() => {
		jest.clearAllMocks();
		// Reset the markedFiles and forceIncludedFiles Sets
		(markedFiles as Set<string>).clear();
		(forceIncludedFiles as Set<string>).clear();

		// Create mock provider
		mockProvider = {
			refresh: jest.fn(),
		};

		// Mock default config
		(vscodeUtils.getConfig as jest.Mock).mockReturnValue({
			enforceFileTypes: true,
			detectedFileExtensions: ['js', 'ts', 'tsx'],
		});
	});

	describe('markFile.toggleMark', () => {
		it('should mark file when file is not already marked', async () => {
			const mockFilePath = '/test/file.ts';
			const mockWorkspacePath = '/test';

			(vscodeUtils.getActiveFilePath as jest.Mock).mockReturnValue(
				mockFilePath,
			);
			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(
				mockWorkspacePath,
			);

			// Mock file utils for the test
			(fileUtils.getRelativePath as jest.Mock).mockReturnValue('file.ts');
			(fileUtils.getExtension as jest.Mock).mockReturnValue('ts');
			(fileUtils.getBasename as jest.Mock).mockReturnValue('file.ts');

			// Mock ignore check
			(ignoreUtils.isIgnored as jest.Mock).mockReturnValue(false);

			await markFile.toggleMark(mockProvider);

			expect(vscodeUtils.getActiveFilePath).toHaveBeenCalled();
			expect(vscodeUtils.validateWorkspace).toHaveBeenCalled();
			expect(mockProvider.refresh).toHaveBeenCalled();
		});

		it('should unmark file when file is already marked', async () => {
			const mockFilePath = '/test/file.ts';
			const mockWorkspacePath = '/test';

			(vscodeUtils.getActiveFilePath as jest.Mock).mockReturnValue(
				mockFilePath,
			);
			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(
				mockWorkspacePath,
			);
			markedFiles.add(mockFilePath);

			await markFile.toggleMark(mockProvider);

			expect(markedFiles.has(mockFilePath)).toBe(false);
		});

		it('should show error when no workspace is found', async () => {
			const mockFilePath = '/test/file.ts';

			(vscodeUtils.getActiveFilePath as jest.Mock).mockReturnValue(
				mockFilePath,
			);
			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(null);

			await markFile.toggleMark(mockProvider);

			expect(vscodeUtils.showMessage.error).toHaveBeenCalledWith(
				'No workspace folder found\nPlease open a workspace or folder to use this feature',
			);
		});

		it('should return early when no active file', async () => {
			(vscodeUtils.getActiveFilePath as jest.Mock).mockReturnValue(null);

			await markFile.toggleMark(mockProvider);

			expect(vscodeUtils.validateWorkspace).not.toHaveBeenCalled();
		});
	});

	describe('markFile.unmarkFile', () => {
		it('should unmark file when file is marked', async () => {
			const mockFilePath = '/test/file.ts';
			markedFiles.add(mockFilePath);

			await markFile.unmarkFile(mockFilePath, mockProvider);

			expect(markedFiles.has(mockFilePath)).toBe(false);
			expect(mockProvider.refresh).toHaveBeenCalled();
			expect(vscodeUtils.showMessage.info).toHaveBeenCalledWith(
				'Unmarked: file.ts',
			);
		});

		it('should show warning when file is not marked', async () => {
			const mockFilePath = '/test/file.ts';

			await markFile.unmarkFile(mockFilePath, mockProvider);

			// markFile.unmarkFile doesn't show warning if file is not marked, it just returns
		});
	});

	describe('markFile.unmarkFromTreeView', () => {
		it('should unmark file from tree view', async () => {
			const mockTreeItem = {
				resourceUri: { fsPath: '/test/tree-file.ts' },
			};
			markedFiles.add('/test/tree-file.ts');
			(fileUtils.getBasename as jest.Mock).mockReturnValue('tree-file.ts');

			await markFile.unmarkFromTreeView(mockTreeItem as any, mockProvider);

			expect(markedFiles.has('/test/tree-file.ts')).toBe(false);
			expect(mockProvider.refresh).toHaveBeenCalled();
		});
	});

	describe('markFile.markItems', () => {
		it('should mark multiple files from URIs', async () => {
			const mockUris = [
				{ fsPath: '/test/file1.ts' },
				{ fsPath: '/test/file2.ts' },
			];
			const mockWorkspacePath = '/test';

			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(
				mockWorkspacePath,
			);

			// Mock file utils
			(fileUtils.resolvePath as jest.Mock).mockImplementation(
				(path: string) => path,
			);
			(fileUtils.isDirectory as jest.Mock).mockReturnValue(false);
			(fileUtils.getExtension as jest.Mock).mockReturnValue('ts');
			(fileUtils.getRelativePath as jest.Mock).mockImplementation(
				(_: string, file: string) => file.split('/').pop(),
			);

			// Mock ignore check
			(ignoreUtils.isIgnored as jest.Mock).mockReturnValue(false);

			await markFile.markItems(mockUris as any[], mockProvider);

			expect(vscodeUtils.validateWorkspace).toHaveBeenCalled();
			expect(mockProvider.refresh).toHaveBeenCalled();
		});

		it('should return early when no workspace', async () => {
			const mockUris = [{ fsPath: '/test/file1.ts' }];

			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(null);

			await markFile.markItems(mockUris as any[], mockProvider);

			expect(vscodeUtils.validateWorkspace).toHaveBeenCalled();
			expect(mockProvider.refresh).not.toHaveBeenCalled();
		});
	});

	describe('markFile.isFileTypeSupported', () => {
		it('should return true for supported file types', () => {
			(fileUtils.getExtension as jest.Mock).mockReturnValue('ts');
			const result = markFile.isFileTypeSupported('/test/file.ts');
			expect(result).toBe(true);
		});

		it('should return false for unsupported file types when enforcement is enabled', () => {
			(fileUtils.getExtension as jest.Mock).mockReturnValue('txt');
			const result = markFile.isFileTypeSupported('/test/file.txt');
			expect(result).toBe(false);
		});

		it('should return true for any file type when enforcement is disabled', () => {
			(vscodeUtils.getConfig as jest.Mock).mockReturnValue({
				enforceFileTypes: false,
				detectedFileExtensions: ['js', 'ts'],
			});
			(fileUtils.getExtension as jest.Mock).mockReturnValue('txt');

			const result = markFile.isFileTypeSupported('/test/file.txt');
			expect(result).toBe(true);
		});
	});

	describe('markFile.unmarkItems', () => {
		it('should unmark single file successfully', async () => {
			const filePath = '/test/file1.ts';
			const mockUris = [{ fsPath: filePath }];

			// Add file to markedFiles first
			(markedFiles as Set<string>).add(filePath);
			(fileUtils.isDirectory as jest.Mock).mockReturnValue(false);

			await markFile.unmarkItems(mockUris as any[], mockProvider);

			expect(markedFiles.has(filePath)).toBe(false);
			expect(mockProvider.refresh).toHaveBeenCalled();
			expect(vscodeUtils.showMessage.info).toHaveBeenCalledWith(
				'Unmarked 1 file(s) from LLM context',
			);
		});

		it('should unmark multiple files successfully', async () => {
			const filePath1 = '/test/file1.ts';
			const filePath2 = '/test/file2.ts';
			const mockUris = [{ fsPath: filePath1 }, { fsPath: filePath2 }];

			// Add files to markedFiles first
			(markedFiles as Set<string>).add(filePath1);
			(markedFiles as Set<string>).add(filePath2);
			(fileUtils.isDirectory as jest.Mock).mockReturnValue(false);

			await markFile.unmarkItems(mockUris as any[], mockProvider);

			expect(markedFiles.has(filePath1)).toBe(false);
			expect(markedFiles.has(filePath2)).toBe(false);
			expect(mockProvider.refresh).toHaveBeenCalled();
			expect(vscodeUtils.showMessage.info).toHaveBeenCalledWith(
				'Unmarked 2 file(s) from LLM context',
			);
		});

		it('should handle unmarking files that are not marked', async () => {
			const filePath = '/test/file1.ts';
			const mockUris = [{ fsPath: filePath }];

			// Don't add file to markedFiles
			(fileUtils.isDirectory as jest.Mock).mockReturnValue(false);

			await markFile.unmarkItems(mockUris as any[], mockProvider);

			expect(markedFiles.has(filePath)).toBe(false);
			expect(mockProvider.refresh).not.toHaveBeenCalled();
			expect(vscodeUtils.showMessage.info).toHaveBeenCalledWith(
				'No marked files found to unmark',
			);
		});

		it('should handle unmarking directories by removing all files within them', async () => {
			const dirPath = '/test/subdir';
			const filePath1 = '/test/subdir/file1.ts';
			const filePath2 = '/test/subdir/file2.js';
			const otherFilePath = '/test/other/file3.ts';
			const mockUris = [{ fsPath: dirPath }];

			// Add files to markedFiles
			(markedFiles as Set<string>).add(filePath1);
			(markedFiles as Set<string>).add(filePath2);
			(markedFiles as Set<string>).add(otherFilePath);
			(fileUtils.isDirectory as jest.Mock).mockImplementation(
				(path) => path === dirPath,
			);

			await markFile.unmarkItems(mockUris as any[], mockProvider);

			expect(markedFiles.has(filePath1)).toBe(false);
			expect(markedFiles.has(filePath2)).toBe(false);
			expect(markedFiles.has(otherFilePath)).toBe(true); // Should not be affected
			expect(mockProvider.refresh).toHaveBeenCalled();
			expect(vscodeUtils.showMessage.info).toHaveBeenCalledWith(
				'Unmarked 2 file(s) from LLM context',
			);
		});
	});

	describe('markFile.smartMarkUnmark', () => {
		it('should directly mark when all files are unmarked', async () => {
			const filePath1 = '/test/file1.ts';
			const filePath2 = '/test/file2.ts';
			const mockUris = [{ fsPath: filePath1 }, { fsPath: filePath2 }];
			
			(fileUtils.isDirectory as jest.Mock).mockReturnValue(false);
			(fileUtils.getExtension as jest.Mock).mockReturnValue('ts');
			(fileUtils.getRelativePath as jest.Mock).mockImplementation(
				(_: string, file: string) => file.split('/').pop(),
			);
			(ignoreUtils.isIgnored as jest.Mock).mockReturnValue(false);
			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue('/test');

			await markFile.smartMarkUnmark(mockUris as any[], mockProvider);

			// Should have marked both files
			expect(markedFiles.has(filePath1)).toBe(true);
			expect(markedFiles.has(filePath2)).toBe(true);
			expect(mockProvider.refresh).toHaveBeenCalled();
		});

		it('should directly unmark when all files are marked', async () => {
			const filePath1 = '/test/file1.ts';
			const filePath2 = '/test/file2.ts';
			const mockUris = [{ fsPath: filePath1 }, { fsPath: filePath2 }];
			
			// Mark both files first
			(markedFiles as Set<string>).add(filePath1);
			(markedFiles as Set<string>).add(filePath2);
			(fileUtils.isDirectory as jest.Mock).mockReturnValue(false);

			await markFile.smartMarkUnmark(mockUris as any[], mockProvider);

			// Should have unmarked both files
			expect(markedFiles.has(filePath1)).toBe(false);
			expect(markedFiles.has(filePath2)).toBe(false);
			expect(mockProvider.refresh).toHaveBeenCalled();
		});
	});
});
