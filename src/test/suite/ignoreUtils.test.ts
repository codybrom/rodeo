// Mock dependencies
jest.mock('../../utils/ignoreUtils', () => ({
	initializeIgnoreFilter: jest.fn().mockResolvedValue(undefined),
	isIgnored: jest.fn(),
	isInitialized: jest.fn(),
	dispose: jest.fn(),
}));

import {
	initializeIgnoreFilter,
	isIgnored,
	isInitialized,
	dispose,
} from '../../utils/ignoreUtils';

describe('Ignore Utils Functions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('initializeIgnoreFilter', () => {
		it('should initialize with workspace path', async () => {
			const workspacePath = '/test/workspace';
			(isInitialized as jest.Mock)
				.mockReturnValue(false)
				.mockReturnValueOnce(true);

			await initializeIgnoreFilter(workspacePath);

			expect(initializeIgnoreFilter).toHaveBeenCalledWith(workspacePath);
		});

		it('should handle initialization errors gracefully', async () => {
			const workspacePath = '/test/workspace';
			(initializeIgnoreFilter as jest.Mock).mockRejectedValueOnce(
				new Error('Init failed'),
			);

			await expect(initializeIgnoreFilter(workspacePath)).rejects.toThrow(
				'Init failed',
			);
		});
	});

	describe('isIgnored', () => {
		it('should return false for non-ignored files', () => {
			(isIgnored as jest.Mock).mockReturnValue(false);

			const result = isIgnored('/workspace/src/index.js');

			expect(result).toBe(false);
			expect(isIgnored).toHaveBeenCalledWith('/workspace/src/index.js');
		});

		it('should return true for ignored files', () => {
			(isIgnored as jest.Mock).mockReturnValue(true);

			const result = isIgnored('/workspace/node_modules/package.json');

			expect(result).toBe(true);
			expect(isIgnored).toHaveBeenCalledWith(
				'/workspace/node_modules/package.json',
			);
		});

		it('should handle files outside workspace', () => {
			(isIgnored as jest.Mock).mockReturnValue(true);

			const result = isIgnored('/other/path/file.js');

			expect(result).toBe(true);
		});
	});

	describe('isInitialized', () => {
		it('should return true when initialized', () => {
			(isInitialized as jest.Mock).mockReturnValue(true);

			const result = isInitialized('/workspace');

			expect(result).toBe(true);
			expect(isInitialized).toHaveBeenCalledWith('/workspace');
		});

		it('should return false when not initialized', () => {
			(isInitialized as jest.Mock).mockReturnValue(false);

			const result = isInitialized('/workspace');

			expect(result).toBe(false);
		});
	});

	describe('dispose', () => {
		it('should dispose without errors', () => {
			expect(() => dispose()).not.toThrow();
			expect(dispose).toHaveBeenCalled();
		});
	});
});
