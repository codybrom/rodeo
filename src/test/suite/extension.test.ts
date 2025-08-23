import * as assert from 'assert';

// vscode mock is provided by jest.config.js moduleNameMapper

// Mock utilities before they're imported
jest.mock('../../utils/vscodeUtils', () => ({
	validateWorkspace: jest.fn(() => '/test'),
	getConfig: jest.fn(() => ({
		detectedFileExtensions: ['ts', 'js'],
		enforceFileTypes: true,
	})),
	showMessage: {
		info: jest.fn(),
		error: jest.fn(),
		warning: jest.fn(),
	},
}));

jest.mock('../../utils/tokenUtils', () => ({
	initializeTokenUtils: jest.fn(),
	estimateTokenCount: jest.fn(() => 100),
}));

jest.mock('../../utils/ignoreUtils', () => ({
	initializeIgnoreFilter: jest.fn(),
	isIgnored: jest.fn(() => false),
}));

describe('Extension Test Suite', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should export activate function', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const extension = require('../../extension');
		assert.strictEqual(typeof extension.activate, 'function');
	});

	it('should export deactivate function', () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const extension = require('../../extension');
		assert.strictEqual(typeof extension.deactivate, 'function');
	});

	it.skip('should activate extension', () => {
		// Skipped: Extension activation requires vscode destructured imports to work
		// which is not supported in this Jest/TypeScript setup
	});

	it.skip('should handle deactivation', () => {
		// Skipped: Extension deactivation test requires loading extension module
		// which has vscode destructured import issues in Jest/TypeScript setup
	});
});
