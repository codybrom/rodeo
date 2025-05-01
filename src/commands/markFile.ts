import { TreeItem, Uri, window } from 'vscode';
import {
	markedFiles,
	forceIncludedFiles,
} from '../providers/markedFilesProvider';
import type { MarkedFilesProvider } from '../providers/markedFilesProvider';
import {
	getActiveFilePath,
	getConfig,
	showMessage,
	validateWorkspace,
} from '../utils/vscodeUtils';
import {
	getBasename,
	getExtension,
	getRelativePath,
	isDirectory,
	listFiles,
	resolvePath,
} from '../utils/fileUtils';
import { initializeIgnoreFilter, isIgnored } from '../utils/ignoreUtils';

export const markFile = {
	async updateMarkedFiles(action: () => void, message: string): Promise<void> {
		action();
		showMessage.info(message);
	},

	async unmarkFile(filePath: string, markedFilesProvider: MarkedFilesProvider) {
		await this.updateMarkedFiles(
			() => markedFiles.delete(filePath),
			`Unmarked: ${getBasename(filePath)}`,
		);
		await markedFilesProvider.refresh();
	},

	isFileTypeSupported(filePath: string): boolean {
		const extension = getExtension(filePath);
		const config = getConfig();
		// Only check against supported extensions if enforceFileTypes is enabled
		return (
			!config.enforceFileTypes ||
			config.detectedFileExtensions.includes(extension)
		);
	},

	async toggleMark(markedFilesProvider: MarkedFilesProvider) {
		const filePath = getActiveFilePath();
		if (!filePath) {
			return;
		}

		const workspacePath = validateWorkspace();
		if (!workspacePath) {
			showMessage.error(
				'No workspace folder found\nPlease open a workspace or folder to use this feature',
			);
			return;
		}

		if (markedFiles.has(filePath)) {
			this.unmarkFile(filePath, markedFilesProvider);
		} else {
			await this.handleSingleFile(filePath, workspacePath, markedFilesProvider);
		}
	},

	async handleSingleFile(
		filePath: string,
		workspacePath: string,
		markedFilesProvider: MarkedFilesProvider,
	): Promise<boolean> {
		const relPath = getRelativePath(workspacePath, filePath);
		const skippedFiles: { path: string; reason: string }[] = [];

		if (isIgnored(relPath)) {
			skippedFiles.push({ path: filePath, reason: 'Ignored by patterns' });
		}

		if (!this.isFileTypeSupported(filePath)) {
			skippedFiles.push({
				path: filePath,
				reason: `Unsupported file type (.${getExtension(filePath)})`,
			});
			await this.notifySkippedFilesAndLasso(skippedFiles, markedFilesProvider);
			return false;
		}

		if (!markedFiles.has(filePath)) {
			this.updateMarkedFiles(
				() => markedFiles.add(filePath),
				`Marked: ${getBasename(filePath)}`,
			);
			await markedFilesProvider.refresh();
		} else {
			showMessage.info('Selected file is already marked.');
		}

		if (skippedFiles.length > 0) {
			await this.notifySkippedFilesAndLasso(skippedFiles, markedFilesProvider);
		}
		return true;
	},

	async notifySkippedFilesAndLasso(
		skippedFiles: { path: string; reason: string }[],
		markedFilesProvider: MarkedFilesProvider,
	) {
		if (!skippedFiles.length) {
			return;
		}
		const maxToShow = 5;
		const fileNames = skippedFiles.map((f) => getBasename(f.path));
		let fileList = fileNames.slice(0, maxToShow).join(', ');
		if (fileNames.length > maxToShow) {
			fileList += `, ...+${fileNames.length - maxToShow} more`;
		}
		const uniqueReasons = [...new Set(skippedFiles.map((f) => f.reason))];
		const reasonList = uniqueReasons.join('; ');
		const message =
			`Rodeo skipped ${skippedFiles.length} file(s): ${fileList}\n` +
			`Reasons: ${reasonList}\n\n` +
			'Lasso skipped files into context anyways?';
		const lassoBtn = '🤠 YEE HAW!';
		const dismissBtn = 'NAW (Dismiss)';
		const selection = await window.showWarningMessage(
			message,
			lassoBtn,
			dismissBtn,
		);
		if (selection === lassoBtn) {
			// Directly add skipped files, bypassing all checks and notifications!
			skippedFiles.forEach((f) => {
				markedFiles.add(f.path);
				forceIncludedFiles.add(f.path);
			});
			await markedFilesProvider.refresh();
			// Notify user of how many files were forcibly marked in this transaction
			showMessage.info(
				`Lasso'd ${skippedFiles.length} skipped file(s) into context!`,
			);
		}
		// If dismissed, do nothing
	},

	async unmarkFromTreeView(
		treeItem: TreeItem,
		markedFilesProvider: MarkedFilesProvider,
	) {
		if (!treeItem?.resourceUri?.fsPath) {
			showMessage.error(
				'Unable to unmark file\nThe selected item is not a valid file or is no longer available',
			);
			return;
		}

		const filePath = treeItem.resourceUri.fsPath;
		if (markedFiles.has(filePath)) {
			this.unmarkFile(filePath, markedFilesProvider);
		}
	},

	async markItems(uris: Uri[], markedFilesProvider: MarkedFilesProvider) {
		const workspacePath = validateWorkspace();
		if (!workspacePath) {
			return;
		}

		initializeIgnoreFilter(workspacePath);

		if (uris.length === 1 && !isDirectory(uris[0].fsPath)) {
			await this.handleSingleFile(
				uris[0].fsPath,
				workspacePath,
				markedFilesProvider,
			);
			return;
		}

		initializeIgnoreFilter(workspacePath);

		console.log(`Processing ${uris.length} files as batch`);

		const ignoredFiles = new Set<string>();
		const unsupportedFiles = new Set<string>();
		const filesToAdd = new Set<string>();
		const alreadyMarked = new Set<string>();

		// First pass: mark all selectable (not ignored, not unsupported, not already marked) files immediately
		for (const uri of uris) {
			const filePath = uri.fsPath;
			const relPath = getRelativePath(workspacePath, filePath);

			console.log(`Checking file: ${filePath}`);
			console.log(`Relative path: ${relPath}`);
			console.log(`Is ignored: ${isIgnored(relPath)}`);

			if (isIgnored(relPath)) {
				console.log(`Adding to ignored files: ${filePath}`);
				ignoredFiles.add(filePath);
				continue;
			}

			if (!isDirectory(filePath)) {
				if (!this.isFileTypeSupported(filePath)) {
					unsupportedFiles.add(filePath);
					continue;
				}
				if (markedFiles.has(filePath)) {
					alreadyMarked.add(filePath);
					continue;
				}
				// Mark immediately
				markedFiles.add(filePath);
				filesToAdd.add(filePath);
			} else {
				await this.processPath(
					filePath,
					filesToAdd,
					ignoredFiles,
					unsupportedFiles,
					alreadyMarked,
					workspacePath,
				);
			}
		}

		await markedFilesProvider.refresh();

		// Notification for initially marked files
		if (filesToAdd.size > 0) {
			showMessage.info(`Marked ${filesToAdd.size} file(s) for context.`);
		}

		const skippedFiles: { path: string; reason: string }[] = [];
		ignoredFiles.forEach((path) =>
			skippedFiles.push({ path, reason: 'Ignored by patterns' }),
		);
		unsupportedFiles.forEach((path) =>
			skippedFiles.push({
				path,
				reason: `Unsupported file type (.${getExtension(path)})`,
			}),
		);

		// Prompt to optionally lasso skipped files
		if (skippedFiles.length > 0) {
			await this.notifySkippedFilesAndLasso(skippedFiles, markedFilesProvider);
		}

		if (filesToAdd.size === 0) {
			if (
				alreadyMarked.size > 0 &&
				ignoredFiles.size === 0 &&
				unsupportedFiles.size === 0
			) {
				showMessage.info('Selected items are already marked.');
			}
			return;
		}
	},

	async processPath(
		path: string,
		filesToAdd: Set<string>,
		ignoredFiles: Set<string>,
		unsupportedFiles: Set<string>,
		alreadyMarked: Set<string>,
		workspacePath: string,
	): Promise<void> {
		const relPath = getRelativePath(workspacePath, path);

		if (isIgnored(relPath)) {
			ignoredFiles.add(path);
			return;
		}

		if (!isDirectory(path)) {
			if (!this.isFileTypeSupported(path)) {
				unsupportedFiles.add(path);
				return;
			}
			if (markedFiles.has(path)) {
				alreadyMarked.add(path);
				return;
			}
			filesToAdd.add(path);
			return;
		}

		try {
			const files = listFiles(path);
			for (const file of files) {
				const filePath = resolvePath(path, file);
				await this.processPath(
					filePath,
					filesToAdd,
					ignoredFiles,
					unsupportedFiles,
					alreadyMarked,
					workspacePath,
				);
			}
		} catch (error) {
			console.error(`Error processing directory ${path}:`, error);
			showMessage.error(
				`Failed to process directory "${getBasename(path)}"\n${error instanceof Error ? error.message : 'Unknown error'}\nPlease check folder permissions and try again`,
			);
		}
	},
};
