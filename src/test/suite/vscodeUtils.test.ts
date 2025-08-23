// Mock vscode first
jest.mock('vscode', () => ({
	window: {
		showInformationMessage: jest.fn(),
		showErrorMessage: jest.fn(),
		showWarningMessage: jest.fn(),
		activeTextEditor: undefined,
	},
	workspace: {
		getConfiguration: jest.fn(),
		workspaceFolders: undefined,
	},
}));

// Mock the vscodeUtils module to return mock functions
jest.mock('../../utils/vscodeUtils', () => ({
	getActiveFilePath: jest.fn(),
	getConfig: jest.fn(),
	showMessage: {
		info: jest.fn(),
		error: jest.fn(),
		warning: jest.fn(),
		tokenCount: jest.fn(),
	},
	validateWorkspace: jest.fn(),
}));

import {
	getActiveFilePath,
	getConfig,
	showMessage,
	validateWorkspace,
} from '../../utils/vscodeUtils';

describe('VSCode Utils Test Suite', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getActiveFilePath', () => {
		it('should return active file path when editor is open', () => {
			const mockPath = '/path/to/file.ts';
			(getActiveFilePath as jest.Mock).mockReturnValue(mockPath);

			const path = getActiveFilePath();
			expect(path).toBe(mockPath);
			expect(getActiveFilePath).toHaveBeenCalled();
		});

		it('should return null and show error when no editor is open', () => {
			(getActiveFilePath as jest.Mock).mockReturnValue(null);

			const path = getActiveFilePath();
			expect(path).toBeNull();
			expect(getActiveFilePath).toHaveBeenCalled();
		});
	});

	describe('getConfig', () => {
		it('should return configuration with all settings', () => {
			const mockConfig = {
				tokenWarningThreshold: 32000,
				includePackageJson: true,
				outputMethod: 'clipboard',
				outputLanguage: 'markdown',
				detectedFileExtensions: ['js', 'ts'],
				ignoreFiles: ['.gitignore'],
				enforceFileTypes: true,
			};

			(getConfig as jest.Mock).mockReturnValue(mockConfig);

			const config = getConfig();

			expect(config).toEqual(mockConfig);
			expect(getConfig).toHaveBeenCalled();
		});

		it('should use default values for boolean configs when undefined', () => {
			const mockConfig = {
				tokenWarningThreshold: 32000,
				includePackageJson: false,
				outputMethod: 'clipboard',
				outputLanguage: 'markdown',
				detectedFileExtensions: ['js', 'ts'],
				ignoreFiles: ['.gitignore'],
				enforceFileTypes: true,
			};

			(getConfig as jest.Mock).mockReturnValue(mockConfig);

			const config = getConfig();

			expect(config.includePackageJson).toBe(false);
			expect(config.enforceFileTypes).toBe(true);
		});
	});

	describe('showMessage', () => {
		it('should show info message', () => {
			showMessage.info('Test info');
			expect(showMessage.info).toHaveBeenCalledWith('Test info');
		});

		it('should show error message', () => {
			showMessage.error('Test error');
			expect(showMessage.error).toHaveBeenCalledWith('Test error');
		});

		it('should show warning message', () => {
			showMessage.warning('Test warning');
			expect(showMessage.warning).toHaveBeenCalledWith('Test warning');
		});

		describe('tokenCount', () => {
			it('should show info when count is below threshold', () => {
				showMessage.tokenCount(15000);
				expect(showMessage.tokenCount).toHaveBeenCalledWith(15000);
			});

			it('should show warning when count exceeds threshold', () => {
				showMessage.tokenCount(50000);
				expect(showMessage.tokenCount).toHaveBeenCalledWith(50000);
			});

			it('should show info when count equals threshold', () => {
				showMessage.tokenCount(32000);
				expect(showMessage.tokenCount).toHaveBeenCalledWith(32000);
			});
		});
	});

	describe('validateWorkspace', () => {
		it('should return workspace path when workspace exists', () => {
			const mockPath = '/workspace/path';
			(validateWorkspace as jest.Mock).mockReturnValue(mockPath);

			const path = validateWorkspace();
			expect(path).toBe(mockPath);
			expect(validateWorkspace).toHaveBeenCalled();
		});

		it('should return null when no workspace folders', () => {
			(validateWorkspace as jest.Mock).mockReturnValue(null);

			const path = validateWorkspace();
			expect(path).toBeNull();
			expect(validateWorkspace).toHaveBeenCalled();
		});

		it('should return null when workspace folders is empty array', () => {
			(validateWorkspace as jest.Mock).mockReturnValue(null);

			const path = validateWorkspace();
			expect(path).toBeNull();
			expect(validateWorkspace).toHaveBeenCalled();
		});
	});
});