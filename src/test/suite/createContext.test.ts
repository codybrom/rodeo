/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock dependencies before imports
jest.mock('vscode');
jest.mock('../../utils/vscodeUtils', () => ({
	validateWorkspace: jest.fn(),
	getConfig: jest.fn(),
	showMessage: {
		info: jest.fn(),
		error: jest.fn(),
		warning: jest.fn(),
	},
	getActiveFilePath: jest.fn(),
}));
jest.mock('../../generators/contextGenerator', () => ({
	createContextGenerator: jest.fn(),
}));
jest.mock('../../providers/markedFilesProvider', () => ({
	markedFiles: new Set(),
	forceIncludedFiles: new Set(),
}));

import { createContext } from '../../commands/createContext';
import * as vscodeUtils from '../../utils/vscodeUtils';
import { createContextGenerator } from '../../generators/contextGenerator';
import { markedFiles } from '../../providers/markedFilesProvider';

describe('Create Context Command', () => {
	let mockContextGenerator: any;

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup mock context generator
		mockContextGenerator = {
			handleContextGeneration: jest.fn(),
		};
		(createContextGenerator as jest.Mock).mockReturnValue(mockContextGenerator);
	});

	describe('forWorkspace', () => {
		it('should generate context when workspace is valid', async () => {
			const mockWorkspacePath = '/test/workspace';
			const mockTokenCount = 1000;
			const mockOutputMethod = 'clipboard';

			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(
				mockWorkspacePath,
			);
			(vscodeUtils.getConfig as jest.Mock).mockReturnValue({
				outputMethod: mockOutputMethod,
				outputLanguage: 'markdown',
				includePackageJson: false,
				tokenWarningThreshold: 32000,
			});

			mockContextGenerator.handleContextGeneration.mockResolvedValue({
				tokenCount: mockTokenCount,
				outputMethod: mockOutputMethod,
			});

			await createContext.forWorkspace();

			expect(vscodeUtils.validateWorkspace).toHaveBeenCalled();
			expect(createContextGenerator).toHaveBeenCalledWith(
				mockWorkspacePath,
				expect.anything(),
			);
			expect(mockContextGenerator.handleContextGeneration).toHaveBeenCalledWith(
				expect.objectContaining({
					bypassFileTypeEnforcement: false,
					includePackageJson: false,
					outputMethod: mockOutputMethod,
					outputLanguage: 'markdown',
				}),
			);
		});

		it('should show error when no workspace is open', async () => {
			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(null);

			await createContext.forWorkspace();

			expect(vscodeUtils.validateWorkspace).toHaveBeenCalled();
			expect(vscodeUtils.showMessage.error).toHaveBeenCalledWith(
				'Please open a workspace before generating context.',
			);
			expect(createContextGenerator).not.toHaveBeenCalled();
		});

		it('should show warning when token count exceeds threshold', async () => {
			const mockWorkspacePath = '/test/workspace';
			const mockTokenCount = 50000;
			const mockOutputMethod = 'clipboard';

			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(
				mockWorkspacePath,
			);
			(vscodeUtils.getConfig as jest.Mock).mockReturnValue({
				outputMethod: mockOutputMethod,
				outputLanguage: 'markdown',
				includePackageJson: false,
				tokenWarningThreshold: 32000,
			});

			mockContextGenerator.handleContextGeneration.mockResolvedValue({
				tokenCount: mockTokenCount,
				outputMethod: mockOutputMethod,
			});

			await createContext.forWorkspace();

			expect(vscodeUtils.showMessage.warning).toHaveBeenCalledWith(
				expect.stringContaining(
					'50000 tokens, which is greater than 32000 tokens',
				),
			);
		});

		it('should handle errors gracefully', async () => {
			const mockWorkspacePath = '/test/workspace';
			const errorMessage = 'Failed to generate context';

			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(
				mockWorkspacePath,
			);
			(vscodeUtils.getConfig as jest.Mock).mockReturnValue({
				outputMethod: 'clipboard',
				outputLanguage: 'markdown',
				includePackageJson: false,
				tokenWarningThreshold: 32000,
			});

			mockContextGenerator.handleContextGeneration.mockRejectedValue(
				new Error(errorMessage),
			);

			await createContext.forWorkspace();

			expect(vscodeUtils.showMessage.error).toHaveBeenCalledWith(
				`Failed to generate workspace context: ${errorMessage}`,
			);
		});
	});

	describe('forOpenFile', () => {
		it('should generate context for open file', async () => {
			const mockFilePath = '/test/file.ts';
			const mockTokenCount = 1000;
			const mockOutputMethod = 'clipboard';

			(vscodeUtils.getActiveFilePath as jest.Mock).mockReturnValue(
				mockFilePath,
			);
			(vscodeUtils.getConfig as jest.Mock).mockReturnValue({
				outputMethod: mockOutputMethod,
				outputLanguage: 'markdown',
				includePackageJson: false,
				tokenWarningThreshold: 32000,
			});

			mockContextGenerator.handleContextGeneration.mockResolvedValue({
				tokenCount: mockTokenCount,
				outputMethod: mockOutputMethod,
			});

			await createContext.forOpenFile();

			expect(vscodeUtils.getActiveFilePath).toHaveBeenCalled();
			expect(mockContextGenerator.handleContextGeneration).toHaveBeenCalledWith(
				expect.objectContaining({
					openFilePath: mockFilePath,
					bypassFileTypeEnforcement: true,
				}),
			);
		});

		it('should return early when no file is open', async () => {
			(vscodeUtils.getActiveFilePath as jest.Mock).mockReturnValue(null);

			await createContext.forOpenFile();

			expect(vscodeUtils.getActiveFilePath).toHaveBeenCalled();
			expect(createContextGenerator).not.toHaveBeenCalled();
		});
	});

	describe('forMarkedFiles', () => {
		it('should generate context for marked files', async () => {
			const mockWorkspacePath = '/test/workspace';
			const mockMarkedFiles = ['/test/file1.ts', '/test/file2.ts'];
			const mockTokenCount = 2000;
			const mockOutputMethod = 'file';

			(vscodeUtils.validateWorkspace as jest.Mock).mockReturnValue(
				mockWorkspacePath,
			);
			(vscodeUtils.getConfig as jest.Mock).mockReturnValue({
				outputMethod: mockOutputMethod,
				outputLanguage: 'markdown',
				includePackageJson: true,
				tokenWarningThreshold: 32000,
			});

			mockContextGenerator.handleContextGeneration.mockResolvedValue({
				tokenCount: mockTokenCount,
				outputMethod: mockOutputMethod,
			});

			// Mock markedFiles
			(markedFiles as Set<string>).clear();
			mockMarkedFiles.forEach((file) => (markedFiles as Set<string>).add(file));

			await createContext.forMarkedFiles();

			expect(mockContextGenerator.handleContextGeneration).toHaveBeenCalledWith(
				{
					markedFiles: mockMarkedFiles,
					includePackageJson: true,
					outputMethod: mockOutputMethod,
					outputLanguage: 'markdown',
				},
			);
		});
	});
});
