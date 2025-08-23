/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/test/**',
		'!src/extension.ts', // Extension activation is hard to test
	],
	moduleNameMapper: {
		vscode: '<rootDir>/src/test/__mocks__/vscode.js',
		// Use more flexible patterns to catch all variations
		'.*providers/markedFilesProvider.*': '<rootDir>/src/test/__mocks__/markedFilesProvider.js',
		'.*utils/vscodeUtils.*': '<rootDir>/src/test/__mocks__/vscodeUtils.js',
	},
	clearMocks: true,
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
};