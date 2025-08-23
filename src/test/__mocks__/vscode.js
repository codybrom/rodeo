/* eslint-env jest, node */
// VS Code API mock for Jest testing
const vscode = {
	window: {
		showInformationMessage: jest.fn(),
		showErrorMessage: jest.fn(),
		showWarningMessage: jest.fn(),
		createOutputChannel: jest.fn(() => ({
			appendLine: jest.fn(),
			append: jest.fn(),
			clear: jest.fn(),
			show: jest.fn(),
			hide: jest.fn(),
			dispose: jest.fn(),
		})),
		activeTextEditor: undefined,
		showTextDocument: jest.fn(),
		createTreeView: jest.fn(),
		registerFileDecorationProvider: jest.fn(() => ({ dispose: jest.fn() })),
	},
	workspace: {
		getConfiguration: jest.fn((section) => ({
			get: jest.fn((key) => {
				// Mock configuration values
				const configs = {
					'gpt-context-generator': {
						enforceFileTypes: true,
						detectedFileExtensions: ['js', 'ts', 'tsx', 'jsx', 'py'],
						tokenWarningThreshold: 32000,
						outputMethod: 'clipboard',
						includePackageJson: false,
						ignoreFiles: ['.gitignore'],
						outputLanguage: 'markdown',
					},
				};
				return configs[section]?.[key];
			}),
			update: jest.fn(),
		})),
		workspaceFolders: undefined,
		fs: {
			readFile: jest.fn(),
			writeFile: jest.fn(),
		},
		onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
		onDidRenameFiles: jest.fn(() => ({ dispose: jest.fn() })),
		createFileSystemWatcher: jest.fn(() => ({
			onDidChange: jest.fn(() => ({ dispose: jest.fn() })),
			onDidCreate: jest.fn(() => ({ dispose: jest.fn() })),
			onDidDelete: jest.fn(() => ({ dispose: jest.fn() })),
			dispose: jest.fn(),
		})),
		openTextDocument: jest.fn(() =>
			Promise.resolve({
				uri: { fsPath: '/mock/document.md' },
			}),
		),
	},
	commands: {
		registerCommand: jest.fn(),
		executeCommand: jest.fn(),
		getCommands: jest.fn(() => Promise.resolve([])),
	},
	extensions: {
		getExtension: jest.fn((id) => ({
			isActive: false,
			activate: jest.fn(() => Promise.resolve()),
			exports: {},
			extensionPath: '/mock/path',
			id,
			packageJSON: {},
		})),
	},
	Uri: {
		file: jest.fn((path) => ({ fsPath: path, scheme: 'file' })),
		parse: jest.fn((str) => ({ fsPath: str, scheme: 'file' })),
	},
	ViewColumn: {
		One: 1,
		Two: 2,
		Three: 3,
	},
	RelativePattern: class RelativePattern {
		constructor(base, pattern) {
			this.base = base;
			this.pattern = pattern;
		}
	},
	FileDecoration: class FileDecoration {
		constructor(badge, tooltip, color) {
			this.badge = badge;
			this.tooltip = tooltip;
			this.color = color;
		}
	},
	FileSystemWatcher: class FileSystemWatcher {
		onDidChange = jest.fn(() => ({ dispose: jest.fn() }));
		onDidCreate = jest.fn(() => ({ dispose: jest.fn() }));
		onDidDelete = jest.fn(() => ({ dispose: jest.fn() }));
		dispose = jest.fn();
	},
	Event: jest.fn(),
	env: {
		clipboard: {
			writeText: jest.fn(),
			readText: jest.fn(),
		},
	},
	TreeItem: class TreeItem {
		constructor(label, collapsibleState) {
			this.label = label;
			this.collapsibleState = collapsibleState;
		}
	},
	TreeItemCollapsibleState: {
		None: 0,
		Collapsed: 1,
		Expanded: 2,
	},
	EventEmitter: class EventEmitter {
		constructor() {
			this.event = jest.fn();
		}
		fire() {}
		dispose() {}
	},
	ThemeIcon: class ThemeIcon {
		constructor(id) {
			this.id = id;
		}
	},
	Disposable: {
		from: jest.fn((...disposables) => ({
			dispose: jest.fn(() => {
				disposables.forEach((d) => d?.dispose?.());
			}),
		})),
	},
};

module.exports = vscode;
