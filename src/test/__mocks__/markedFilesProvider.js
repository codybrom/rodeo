/* eslint-env jest, node */
// Mock for markedFilesProvider
const markedFiles = new Set();
const forceIncludedFiles = new Set();

class MarkedFilesProvider {
	constructor() {
		// Mock the vscode module if available
		try {
			const vscode = require('vscode');
			if (vscode.window && vscode.window.registerFileDecorationProvider) {
				vscode.window.registerFileDecorationProvider(this);
			}
		} catch (e) {
			// vscode module not available in test
		}

		this.refresh = jest.fn();
		this.getChildren = jest.fn(() => {
			// Return TreeItems for marked files
			return Array.from(markedFiles).map((file) => ({
				label: file.split('/').pop(),
				resourceUri: { fsPath: file },
				collapsibleState: 0,
			}));
		});
		this.getTreeItem = jest.fn((element) => element);
		this.getTokenCountDisplay = jest.fn(() => '0');
		this.onDidChangeTreeData = jest.fn();
		this._onDidChangeTreeData = {
			event: jest.fn(),
			fire: jest.fn(),
			dispose: jest.fn(),
		};
		this.onDidChangeFileDecorations = jest.fn();
		this._onDidChangeFileDecorations = {
			event: jest.fn(),
			fire: jest.fn(),
			dispose: jest.fn(),
		};
		this.provideFileDecoration = jest.fn((uri) => {
			// Check if the file is marked (matches actual implementation)
			if (markedFiles.has(uri.fsPath)) {
				return {
					badge: '📎',
					tooltip: 'Marked for LLM Context',
					color: undefined,
				};
			}
			return undefined;
		});
	}
}

const markedFilesProvider = new MarkedFilesProvider();

module.exports = {
	markedFiles,
	forceIncludedFiles,
	markedFilesProvider,
	MarkedFilesProvider,
};
