import {
	readFileContent,
	listFiles,
	isDirectory,
	fileExists,
	readPackageJson,
	getRelativePath,
	getExtension,
	resolvePath,
	getDirname,
} from '../utils/fileUtils';
import { formatFileComment } from '../utils/markdownUtils';
import { estimateTokenCount } from '../utils/tokenUtils';
import { extractImports } from '../utils/importParser';
import { initializeIgnoreFilter, isIgnored } from '../utils/ignoreUtils';
import { getConfig, showMessage } from '../utils/vscodeUtils';
import { env, ViewColumn, window, workspace } from 'vscode';
import {
	forceIncludedFiles,
	markedFilesProvider,
	markedFiles,
} from '../providers/markedFilesProvider';

export class ContextGenerator {
	private detectedFileExtensions: string[];
	private enforceFileTypes: boolean;
	private skippedFiles: { path: string; reason: string }[];
	private forceIncludedFiles: Set<string>;

	constructor(
		private workspacePath: string,
		forceIncludedFiles?: Set<string>,
	) {
		if (!workspacePath) {
			throw new Error('Workspace path must be provided');
		}
		const config = getConfig();
		this.detectedFileExtensions = config.detectedFileExtensions;
		this.enforceFileTypes = config.enforceFileTypes;
		this.skippedFiles = [];
		this.forceIncludedFiles = forceIncludedFiles ?? new Set();
		initializeIgnoreFilter(workspacePath);
	}

	async handleContextGeneration(
		options: ContextOptions & {
			outputMethod?: string;
			outputLanguage?: string;
		},
	): Promise<{ tokenCount: number; outputMethod: string }> {
		try {
			const outputMethod = options.outputMethod || 'clipboard';
			const outputLanguage = options.outputLanguage || 'plaintext';

			const gptContext = await this.generateContext(options);

			if (gptContext.length === 0) {
				showMessage.warning('No files were found to include in the context.');
				return { tokenCount: 0, outputMethod };
			}

			await this.handleOutput(gptContext, outputMethod, outputLanguage);

			const tokenCount = await estimateTokenCount(gptContext);
			return { tokenCount, outputMethod };
		} catch (error) {
			console.error('Error in handleContextGeneration:', error);
			throw error;
		}
	}

	async handleContextGenerationForOpenFilesWithImports(
		openFiles: string[],
		options: {
			includePackageJson?: boolean;
			outputMethod?: string;
			outputLanguage?: string;
			bypassFileTypeEnforcement?: boolean;
		},
	): Promise<{ tokenCount: number; outputMethod: string }> {
		try {
			const outputMethod = options.outputMethod || 'clipboard';
			const outputLanguage = options.outputLanguage || 'plaintext';

			const gptContext = await this.generateContextForOpenFilesWithImports(
				openFiles,
				options,
			);

			if (gptContext.length === 0) {
				showMessage.warning('No files were found to include in the context.');
				return { tokenCount: 0, outputMethod };
			}

			await this.handleOutput(gptContext, outputMethod, outputLanguage);

			const tokenCount = await estimateTokenCount(gptContext);
			return { tokenCount, outputMethod };
		} catch (error) {
			console.error(
				'Error in handleContextGenerationForOpenFilesWithImports:',
				error,
			);
			throw error;
		}
	}

	private async handleOutput(
		content: string,
		outputMethod: string,
		outputLanguage: string,
	): Promise<void> {
		console.log('handleOutput called:', {
			contentLength: content.length,
			outputMethod,
			outputLanguage,
		});

		try {
			if (outputMethod === 'newWindow') {
				const document = await workspace.openTextDocument({
					content,
					language: outputLanguage,
				});
				await window.showTextDocument(document, ViewColumn.One);
			} else if (outputMethod === 'clipboard') {
				await env.clipboard.writeText(content);
			}
		} catch (error) {
			console.error('Error in handleOutput:', error);
			throw error;
		}
	}

	public async generateContext({
		openFilePath,
		markedFiles,
		includePackageJson = false,
		bypassFileTypeEnforcement = false,
	}: ContextOptions): Promise<string> {
		this.skippedFiles = []; // Clear skippedFiles before each context generation to prevent duplicate notifications

		console.log('\n=== Starting context generation ===');
		const contextParts: string[] = [];

		try {
			if (markedFiles?.length) {
				console.log('Processing marked files');
				await this.processMarkedFiles(
					markedFiles,
					contextParts,
					bypassFileTypeEnforcement,
				);
			} else if (openFilePath) {
				console.log('Processing open file');
				await this.processOpenFile(openFilePath, contextParts);
			} else {
				console.log('Processing entire workspace');
				await this.processDirectory(this.workspacePath, contextParts);
			}

			if (includePackageJson) {
				console.log('Adding package.json');
				await this.addPackageJson(contextParts);
			}

			console.log(
				`\nContext generation complete. Files processed: ${contextParts.length}`,
			);
			await this.notifySkippedFilesAndLasso(this.skippedFiles, {
				openFilePath,
				markedFiles,
				includePackageJson,
			});
			return contextParts.join('\n');
		} catch (error) {
			console.error('Error during context generation:', error);
			throw error;
		}
	}

	public async generateContextForOpenFilesWithImports(
		openFiles: string[],
		{
			includePackageJson = false,
			bypassFileTypeEnforcement = false,
		}: {
			includePackageJson?: boolean;
			bypassFileTypeEnforcement?: boolean;
		},
	): Promise<string> {
		this.skippedFiles = []; // Clear skippedFiles before each context generation

		console.log(
			'\n=== Starting context generation for open files with imports ===',
		);
		const contextParts: string[] = [];
		const processedFiles = new Set<string>();

		try {
			// Process each open file and their imports
			for (const filePath of openFiles) {
				console.log(`Processing open file: ${filePath}`);
				const relPath = getRelativePath(this.workspacePath, filePath);

				// Add the open file itself
				if (!processedFiles.has(filePath)) {
					await this.handleSingleFile(filePath, relPath, contextParts);
					processedFiles.add(filePath);
				}

				// Process its imports
				try {
					const content = readFileContent(filePath);
					await this.processImportsForFile(
						filePath,
						content,
						contextParts,
						processedFiles,
						bypassFileTypeEnforcement,
					);
				} catch (error) {
					console.error(`Error processing imports for ${filePath}:`, error);
				}
			}

			if (includePackageJson) {
				console.log('Adding package.json');
				await this.addPackageJson(contextParts);
			}

			console.log(
				`\nContext generation complete. Files processed: ${contextParts.length}`,
			);

			await this.notifySkippedFilesAndLasso(this.skippedFiles, {
				markedFiles: openFiles,
				includePackageJson,
			});

			return contextParts.join('\n');
		} catch (error) {
			console.error(
				'Error during context generation for open files with imports:',
				error,
			);
			throw error;
		}
	}

	private createFileData(filePath: string, relPath: string): FileData {
		return {
			path: relPath,
			extension: getExtension(filePath),
			content: readFileContent(filePath),
		};
	}

	private async handleSingleFile(
		filePath: string,
		relPath: string,
		contextParts: string[],
		bypassFileTypeEnforcement = false,
	): Promise<void> {
		if (
			!bypassFileTypeEnforcement &&
			!this.forceIncludedFiles.has(filePath) &&
			isIgnored(relPath)
		) {
			this.skippedFiles.push({ path: filePath, reason: 'Ignored' });
			return;
		}

		if (!isDirectory(filePath)) {
			await this.processFile(
				filePath,
				relPath,
				contextParts,
				bypassFileTypeEnforcement,
			);
		}
	}

	private async processOpenFile(
		filePath: string,
		contextParts: string[],
	): Promise<void> {
		const relPath = getRelativePath(this.workspacePath, filePath);
		await this.handleSingleFile(filePath, relPath, contextParts);

		const content = readFileContent(filePath);
		await this.processImports(filePath, content, contextParts);
	}

	private async processImports(
		filePath: string,
		content: string,
		contextParts: string[],
	): Promise<void> {
		const imports = extractImports(content);
		for (const importPath of imports) {
			const resolvedPath = resolvePath(getDirname(filePath), importPath);
			const relPath = getRelativePath(this.workspacePath, resolvedPath);

			// For imports, we do respect ignore patterns
			if (isIgnored(relPath)) {
				this.skippedFiles.push({ path: resolvedPath, reason: 'Ignored' });
				continue;
			}

			const fileExtension = getExtension(resolvedPath);
			if (!fileExtension) {
				await this.tryProcessImportWithExtensions(resolvedPath, contextParts);
			} else if (
				this.detectedFileExtensions.includes(fileExtension) &&
				fileExists(resolvedPath)
			) {
				await this.processFile(resolvedPath, relPath, contextParts);
			} else {
				this.skippedFiles.push({
					path: resolvedPath,
					reason: 'Unsupported file type',
				});
			}
		}
	}

	private async processImportsForFile(
		filePath: string,
		content: string,
		contextParts: string[],
		processedFiles: Set<string>,
		bypassFileTypeEnforcement = false,
	): Promise<void> {
		const imports = extractImports(content);
		for (const importPath of imports) {
			const resolvedPath = resolvePath(getDirname(filePath), importPath);

			// Skip if already processed
			if (processedFiles.has(resolvedPath)) {
				continue;
			}

			const relPath = getRelativePath(this.workspacePath, resolvedPath);

			// For imports, we do respect ignore patterns
			if (isIgnored(relPath)) {
				this.skippedFiles.push({ path: resolvedPath, reason: 'Ignored' });
				continue;
			}

			const fileExtension = getExtension(resolvedPath);
			if (!fileExtension) {
				await this.tryProcessImportWithExtensionsForFile(
					resolvedPath,
					contextParts,
					processedFiles,
				);
			} else if (
				(bypassFileTypeEnforcement ||
					this.detectedFileExtensions.includes(fileExtension)) &&
				fileExists(resolvedPath)
			) {
				await this.processFile(resolvedPath, relPath, contextParts);
				processedFiles.add(resolvedPath);
			} else if (!fileExists(resolvedPath)) {
				this.skippedFiles.push({
					path: resolvedPath,
					reason: 'File not found',
				});
			} else {
				this.skippedFiles.push({
					path: resolvedPath,
					reason: 'Unsupported file type',
				});
			}
		}
	}

	private async tryProcessImportWithExtensionsForFile(
		basePath: string,
		contextParts: string[],
		processedFiles: Set<string>,
	): Promise<void> {
		for (const ext of this.detectedFileExtensions) {
			const fullPath = `${basePath}.${ext}`;

			// Skip if already processed
			if (processedFiles.has(fullPath)) {
				continue;
			}

			const relPath = getRelativePath(this.workspacePath, fullPath);

			if (fileExists(fullPath)) {
				await this.processFile(fullPath, relPath, contextParts);
				processedFiles.add(fullPath);
				break;
			}
		}
	}

	private async tryProcessImportWithExtensions(
		basePath: string,
		contextParts: string[],
	): Promise<void> {
		for (const ext of this.detectedFileExtensions) {
			const fullPath = `${basePath}.${ext}`;
			const relPath = getRelativePath(this.workspacePath, fullPath);

			if (fileExists(fullPath)) {
				await this.processFile(fullPath, relPath, contextParts);
				break;
			}
		}
	}

	private async processDirectory(
		dir: string,
		contextParts: string[],
	): Promise<void> {
		if (!dir) {
			console.log('Empty directory path provided');
			return;
		}

		// Get relative path for ignore checking
		const relPath = getRelativePath(this.workspacePath, dir);

		// Check if the directory itself should be ignored before processing
		if (isIgnored(relPath)) {
			console.log('Skipping ignored directory:', relPath);
			return;
		}

		console.log('\n--- Processing directory:', dir);

		try {
			const files = listFiles(dir);
			console.log(`Found ${files.length} files in directory`);

			for (const file of files) {
				if (!file) {
					continue; // Skip empty file names
				}

				try {
					const filePath = resolvePath(dir, file);
					const fileRelPath = getRelativePath(this.workspacePath, filePath);
					console.log('\nExamining:', fileRelPath);

					// Skip .git directory entirely
					if (file === '.git' || fileRelPath.startsWith('.git/')) {
						console.log('Skipping .git directory/file');
						continue;
					}

					// Check if file should be ignored
					if (isIgnored(fileRelPath)) {
						this.skippedFiles.push({ path: filePath, reason: 'Ignored' });
						continue;
					}

					if (isDirectory(filePath)) {
						console.log('Processing subdirectory:', fileRelPath);
						await this.processDirectory(filePath, contextParts);
						continue;
					}

					// Check file extension
					const extension = getExtension(filePath);
					if (
						this.enforceFileTypes &&
						!this.detectedFileExtensions.includes(extension)
					) {
						this.skippedFiles.push({
							path: filePath,
							reason: 'Unsupported file type',
						});
						continue;
					}

					// Process the file
					console.log('Processing file:', fileRelPath);
					await this.processFile(filePath, fileRelPath, contextParts);
					console.log('Added to context:', fileRelPath);
				} catch (error) {
					console.error(`Error processing ${file}:`, error);
				}
			}
		} catch (error) {
			console.error(`Error processing directory ${dir}:`, error);
		}
	}

	private async processMarkedFiles(
		files: string[],
		contextParts: string[],
		bypassFileTypeEnforcement = false,
	): Promise<void> {
		// Special case for single marked file
		if (files.length === 1) {
			const filePath = files[0];
			const relPath = getRelativePath(this.workspacePath, filePath);
			await this.handleSingleFile(
				filePath,
				relPath,
				contextParts,
				bypassFileTypeEnforcement,
			);
			return;
		}

		// For multiple files, trust the marking process's decisions
		for (const filePath of files) {
			const relPath = getRelativePath(this.workspacePath, filePath);
			if (!isDirectory(filePath)) {
				await this.processFile(
					filePath,
					relPath,
					contextParts,
					bypassFileTypeEnforcement,
				);
			}
		}
	}

	private async processFile(
		filePath: string,
		relPath: string,
		contextParts: string[],
		bypassFileTypeEnforcement = false,
	): Promise<void> {
		const fileExtension = getExtension(filePath);
		try {
			if (
				bypassFileTypeEnforcement ||
				this.forceIncludedFiles.has(filePath) ||
				!this.enforceFileTypes ||
				this.detectedFileExtensions.includes(fileExtension)
			) {
				const fileData = this.createFileData(filePath, relPath);
				contextParts.push(`${formatFileComment(fileData)}\n\n`);
				console.log('Successfully added to context:', relPath);
			} else {
				this.skippedFiles.push({
					path: filePath,
					reason: 'Unsupported file type',
				});
			}
		} catch (error) {
			console.error(`Error processing file ${relPath}:`, error);
		}
	}

	private async addPackageJson(contextParts: string[]): Promise<void> {
		const content = readPackageJson(this.workspacePath);
		if (content) {
			const fileData: FileData = {
				path: 'package.json',
				extension: 'json',
				content,
			};
			contextParts.push(`${formatFileComment(fileData)}\n\n`);
		}
	}

	private async notifySkippedFilesAndLasso(
		skippedFiles: { path: string; reason: string }[],
		contextOptions: ContextOptions & {
			outputMethod?: string;
			outputLanguage?: string;
		},
	): Promise<void> {
		// Filter out files already marked or forcibly included
		const { markedFiles = [] } = contextOptions;
		const filteredSkippedFiles = skippedFiles.filter(
			(f) =>
				!markedFiles.includes(f.path) && !this.forceIncludedFiles.has(f.path),
		);
		if (!filteredSkippedFiles.length) {
			return;
		}
		const skippedList = filteredSkippedFiles
			.map((f) => `• ${f.path} (${f.reason})`)
			.join('\n');
		const message = `Skipped ${filteredSkippedFiles.length} file(s):\n${skippedList}`;
		const lassoBtn = '🤠 Lasso Anyway';
		const selection = await window.showWarningMessage(message, lassoBtn);
		if (selection === lassoBtn) {
			// Re-run context generation, forcibly including these files
			await this.lassoAnyway(filteredSkippedFiles, contextOptions);
		}
	}

	private async lassoAnyway(
		skippedFiles: { path: string; reason: string }[],
		contextOptions: ContextOptions & {
			outputMethod?: string;
			outputLanguage?: string;
		},
	): Promise<void> {
		// Add skipped files to markedFiles or override ignore/type checks
		const forceIncludeFiles = skippedFiles.map((f) => f.path);
		// Ensure forcibly included files are globally tracked and reflected in UI
		forceIncludeFiles.forEach((f) => {
			markedFiles.add(f);
			forceIncludedFiles.add(f);
		});
		await markedFilesProvider.refresh(); // Ensure UI and token count update
		// Notify user of how many files were forcibly marked in this transaction
		showMessage.info(`Marked ${forceIncludeFiles.length} file(s) via lasso!`);
		await this.handleContextGeneration({
			...contextOptions,
			markedFiles: [
				...(contextOptions.markedFiles ?? []),
				...forceIncludeFiles,
			],
			// Optionally add a flag to bypass ignores/types if needed
			bypassFileTypeEnforcement: true,
		});
	}
}

export const createContextGenerator = (
	workspacePath: string,
	forceIncludedFiles?: Set<string>,
): ContextGenerator => new ContextGenerator(workspacePath, forceIncludedFiles);
