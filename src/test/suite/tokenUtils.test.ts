import {
	initializeTokenUtils,
	estimateTokenCount,
} from '../../utils/tokenUtils';
import { get_encoding } from '@dqbd/tiktoken';
import type { ExtensionContext } from 'vscode';

// Mock tiktoken module
jest.mock('@dqbd/tiktoken', () => ({
	get_encoding: jest.fn(),
}));

describe('Token Utils Test Suite', () => {
	let mockEncode: jest.Mock;
	let mockFree: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		mockEncode = jest.fn();
		mockFree = jest.fn();

		// Reset process.env
		delete process.env.TIKTOKEN_CACHE_DIR;
	});

	describe('initializeTokenUtils', () => {
		it('should initialize with extension context', () => {
			const mockContext = {
				extensionPath: '/mock/extension/path',
				subscriptions: [],
				globalState: {},
				workspaceState: {},
				extensionUri: {},
				extensionMode: 3,
				storageUri: undefined,
				globalStorageUri: {},
				logUri: {},
				secrets: {},
				environmentVariableCollection: {},
				asAbsolutePath: jest.fn(),
				storagePath: undefined,
				globalStoragePath: '',
				logPath: '',
				extension: {},
				languageModelAccessInformation: {},
			} as unknown as ExtensionContext;

			// Should not throw
			expect(() => initializeTokenUtils(mockContext)).not.toThrow();
		});
	});

	describe('estimateTokenCount', () => {
		it('should estimate token count using tiktoken', async () => {
			const mockTokens = [1, 2, 3, 4, 5]; // 5 tokens
			mockEncode.mockReturnValue(mockTokens);

			(get_encoding as jest.Mock).mockReturnValue({
				encode: mockEncode,
				free: mockFree,
			});

			const text = 'This is a test string';
			const count = await estimateTokenCount(text);

			expect(count).toBe(5);
			expect(get_encoding).toHaveBeenCalledWith('cl100k_base');
			expect(mockEncode).toHaveBeenCalledWith(text);
			expect(mockFree).toHaveBeenCalled();
		});

		it('should set TIKTOKEN_CACHE_DIR when context is available', async () => {
			const mockContext = {
				extensionPath: '/mock/extension/path',
				subscriptions: [],
				globalState: {},
				workspaceState: {},
				extensionUri: {},
				extensionMode: 3,
				storageUri: undefined,
				globalStorageUri: {},
				logUri: {},
				secrets: {},
				environmentVariableCollection: {},
				asAbsolutePath: jest.fn(),
				storagePath: undefined,
				globalStoragePath: '',
				logPath: '',
				extension: {},
				languageModelAccessInformation: {},
			} as unknown as ExtensionContext;

			initializeTokenUtils(mockContext);

			mockEncode.mockReturnValue([1, 2, 3]);
			(get_encoding as jest.Mock).mockReturnValue({
				encode: mockEncode,
				free: mockFree,
			});

			await estimateTokenCount('test');

			expect(process.env.TIKTOKEN_CACHE_DIR).toBe('/mock/extension/path/out');
		});

		it('should fallback to word count estimation on error', async () => {
			(get_encoding as jest.Mock).mockImplementation(() => {
				throw new Error('Failed to load encoding');
			});

			const text = 'This is a test string with seven words';
			const count = await estimateTokenCount(text);

			// Fallback: word count * 1.3, rounded up
			// 8 words * 1.3 = 10.4 -> 11
			expect(count).toBe(11);
			expect(mockFree).not.toHaveBeenCalled();
		});

		it('should handle empty text', async () => {
			mockEncode.mockReturnValue([]);
			(get_encoding as jest.Mock).mockReturnValue({
				encode: mockEncode,
				free: mockFree,
			});

			const count = await estimateTokenCount('');
			expect(count).toBe(0);
		});

		it('should handle text with only whitespace in fallback', async () => {
			(get_encoding as jest.Mock).mockImplementation(() => {
				throw new Error('Failed');
			});

			const count = await estimateTokenCount('   \n\t  ');
			// Whitespace splits into empty strings which get filtered, but the split still counts them
			// "   \n\t  ".split(/\s+/) = ["", "", "", ""] which filters to [] but length calculation happens before filter
			expect(count).toBe(3); // split result includes empty strings: ceil(2 * 1.3) = 3
		});

		it('should always call free() even if encode fails', async () => {
			mockEncode.mockImplementation(() => {
				throw new Error('Encode failed');
			});

			(get_encoding as jest.Mock).mockReturnValue({
				encode: mockEncode,
				free: mockFree,
			});

			const count = await estimateTokenCount('test');

			// Should fallback to word count
			expect(count).toBe(2); // 1 word * 1.3 = 1.3 -> 2
			expect(mockFree).toHaveBeenCalled();
		});
	});
});
