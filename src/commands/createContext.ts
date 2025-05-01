import { createContextGenerator } from '../generators/contextGenerator';
import { markedFiles, forceIncludedFiles } from '../providers/markedFilesProvider';
import {
	getActiveFilePath,
	getConfig,
	showMessage,
	validateWorkspace,
} from '../utils/vscodeUtils';

export const createContext = {
	async generateContext(
		workspacePath: string,
		options: {
			openFilePath?: string;
			markedFiles?: string[];
			bypassFileTypeEnforcement?: boolean;
		},
	) {
		try {
			const contextGenerator = createContextGenerator(workspacePath, forceIncludedFiles);

			const config = getConfig();
			const { tokenCount, outputMethod } =
				await contextGenerator.handleContextGeneration({
					...options,
					includePackageJson: config.includePackageJson,
					outputMethod: config.outputMethod,
					outputLanguage: config.outputLanguage,
				});

			if (tokenCount === 0) {
				return;
			}

			const threshold = config.tokenWarningThreshold;
			const message = `LLM-ready context ${outputMethod === 'clipboard' ? 'copied to clipboard' : 'opened in new window'}. (${tokenCount} tokens${tokenCount > threshold ? `, which is greater than ${threshold} tokens` : ''})`;
			if (tokenCount > threshold) {
				showMessage.warning(message);
			} else {
				showMessage.info(message);
			}
		} catch (error) {
			console.error('Error in generateContext:', error);
			throw error;
		}
	},

	async forWorkspace() {
		const workspacePath = validateWorkspace();
		if (!workspacePath) {
			console.log('No workspace path found');
			showMessage.error('Please open a workspace before generating context.');
			return;
		}

		try {
			await this.generateContext(workspacePath, {
				bypassFileTypeEnforcement: false,
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : 'An unknown error occurred';
			console.error('Workspace context generation failed:', errorMessage);
			showMessage.error(
				`Failed to generate workspace context: ${errorMessage}`,
			);
		}
	},

	async forOpenFile() {
		const openFilePath = getActiveFilePath();
		if (!openFilePath) {
			return;
		}
		await this.generateContext('', {
			openFilePath,
			bypassFileTypeEnforcement: true,
		});
	},

	async forMarkedFiles() {
		const workspacePath = validateWorkspace();
		if (!workspacePath) {
			showMessage.warning('This feature requires a workspace to be open.');
			return;
		}
		if (markedFiles.size === 0) {
			showMessage.warning(
				'No marked files. Please mark files before generating context.',
			);
			return;
		}
		await this.generateContext(workspacePath, {
			markedFiles: Array.from(markedFiles),
		});
	},
};
