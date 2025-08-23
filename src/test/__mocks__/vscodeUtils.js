/* eslint-env jest, node */
// Mock for vscodeUtils
const getConfig = jest.fn(() => ({
	enforceFileTypes: true,
	detectedFileExtensions: ['js', 'ts', 'tsx'],
	outputMethod: 'clipboard',
	outputLanguage: 'markdown',
	includePackageJson: false,
	tokenWarningThreshold: 32000,
	ignoreFiles: ['.gitignore'],
}));

const showMessage = {
	info: jest.fn(),
	error: jest.fn(),
	warning: jest.fn(),
	tokenCount: jest.fn(),
};

const getActiveFilePath = jest.fn(() => '/test/workspace/active.ts');
const validateWorkspace = jest.fn(() => '/test/workspace');

module.exports = {
	getConfig,
	showMessage,
	getActiveFilePath,
	validateWorkspace,
};