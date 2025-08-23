import { clearMarkedFiles } from '../../commands/clearMarkedFiles';
import { markedFiles } from '../../providers/markedFilesProvider';
import { showMessage } from '../../utils/vscodeUtils';

// Mock the dependencies
jest.mock('../../providers/markedFilesProvider', () => ({
	markedFiles: new Set(),
	MarkedFilesProvider: jest.fn(),
}));

jest.mock('../../utils/vscodeUtils', () => ({
	showMessage: {
		info: jest.fn(),
		error: jest.fn(),
		warning: jest.fn(),
	},
}));

describe('Clear Marked Files Command', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let mockProvider: any;

	beforeEach(() => {
		jest.clearAllMocks();
		// Reset the markedFiles Set
		(markedFiles as Set<string>).clear();
		(markedFiles as Set<string>).add('/file1.ts');
		(markedFiles as Set<string>).add('/file2.ts');

		// Create mock provider
		mockProvider = {
			refresh: jest.fn(),
		};
	});

	it('should clear all marked files', async () => {
		expect(markedFiles.size).toBe(2);

		await clearMarkedFiles(mockProvider);

		expect(markedFiles.size).toBe(0);
	});

	it('should refresh the provider after clearing', async () => {
		await clearMarkedFiles(mockProvider);

		expect(mockProvider.refresh).toHaveBeenCalledTimes(1);
	});

	it('should show info message after clearing', async () => {
		await clearMarkedFiles(mockProvider);

		expect(showMessage.info).toHaveBeenCalledWith('Cleared all marked files.');
	});

	it('should work when no files are marked', async () => {
		markedFiles.clear();
		expect(markedFiles.size).toBe(0);

		await clearMarkedFiles(mockProvider);

		expect(markedFiles.size).toBe(0);
		expect(mockProvider.refresh).toHaveBeenCalled();
		expect(showMessage.info).toHaveBeenCalledWith('Cleared all marked files.');
	});
});
