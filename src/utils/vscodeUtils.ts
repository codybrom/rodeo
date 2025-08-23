import { window, workspace } from 'vscode';

export const getActiveFilePath = (): string | null => {
	if (!window.activeTextEditor) {
		showMessage.error('Please open a file to use this feature.');
		return null;
	}
	return window.activeTextEditor.document.uri.fsPath;
};

export const getAllOpenFilePaths = (): string[] => {
	const paths = new Set<string>();

	workspace.textDocuments.forEach((doc) => {
		let filePath: string | null = null;

		if (doc.uri.scheme === 'file' && !doc.isUntitled) {
			// Regular file on disk
			filePath = doc.uri.fsPath;
		} else if (doc.uri.scheme === 'git') {
			// Git diff/working tree tab - extract the actual file path
			// Git URIs typically look like: git:/path/to/repo.git/file.js?ref
			const match = doc.uri.path.match(/^\/.*\.git\/(.+)$/);
			if (match) {
				// Reconstruct the actual file path
				const workspaceFolder = workspace.workspaceFolders?.[0];
				if (workspaceFolder) {
					filePath = `${workspaceFolder.uri.fsPath}/${match[1]}`;
				}
			}
		} else if (doc.uri.query && doc.uri.query.includes('git')) {
			// Other Git-related tabs that might have file info in query
			try {
				const queryParams = new URLSearchParams(doc.uri.query);
				const originalPath = queryParams.get('path');
				if (originalPath) {
					filePath = originalPath;
				}
			} catch {
				// Ignore query parsing errors
			}
		}

		// Add valid file paths to set (deduplicates automatically)
		if (filePath && filePath !== '' && !filePath.includes('scm0/input')) {
			paths.add(filePath);
		}
	});

	return Array.from(paths);
};

export const getConfig = () => {
	const config = workspace.getConfiguration('gpt-context-generator');
	return {
		tokenWarningThreshold: config.get('tokenWarningThreshold') as number,
		includePackageJson: (config.get('includePackageJson') as boolean) ?? false,
		outputMethod: config.get('outputMethod') as string,
		outputLanguage: config.get('outputLanguage') as string,
		detectedFileExtensions: config.get('detectedFileExtensions') as string[],
		ignoreFiles: config.get('ignoreFiles') as string[],
		enforceFileTypes: (config.get('enforceFileTypes') as boolean) ?? true,
	};
};

export const showMessage = {
	info: (message: string) => window.showInformationMessage(message),
	error: (message: string) => window.showErrorMessage(message),
	warning: (message: string) => window.showWarningMessage(message),
	tokenCount: (count: number) => {
		const threshold = getConfig().tokenWarningThreshold;
		const message = `The generated context is approximately ${count} tokens${
			count > threshold ? `, which is greater than ${threshold} tokens` : ''
		}.`;
		if (count > threshold) {
			showMessage.warning(message);
		} else {
			showMessage.info(message);
		}
	},
};

export const validateWorkspace = (): string | null => {
	if (!workspace.workspaceFolders) {
		return null;
	}
	return workspace.workspaceFolders[0].uri.fsPath;
};
