import hljs from 'highlight.js';

export const getMarkdownLang = (extension: string): string => {
	// Remove the dot if present
	const ext = extension.replace(/^\./, '');

	// Try to get the language from highlight.js
	const language = hljs.getLanguage(ext);

	// If found, return the name, otherwise fallback to the extension
	return language?.name ?? ext;
};

export const formatFileComment = (
	file: FileData,
	options: {
		markdownFileHandling?: string;
		filePathFormat?: string;
	} = {},
): string => {
	const { markdownFileHandling = 'raw', filePathFormat = 'inline' } = options;

	// Handle markdown files specially based on configuration
	if (file.extension === 'md' && markdownFileHandling === 'raw') {
		// For raw markdown files, we still need to include file path based on filePathFormat
		switch (filePathFormat) {
			case 'comment':
				return `<!-- File: ${file.path} -->\n${file.content}`;
			case 'none':
				return file.content;
			case 'inline':
			default:
				// For raw markdown, we can't put it "inline" in a code block, so use comment format
				return `<!-- File: ${file.path} -->\n${file.content}`;
		}
	}

	// For all other files (including markdown when markdownFileHandling is 'codeblock')
	const markdownLang = getMarkdownLang(file.extension);

	switch (filePathFormat) {
		case 'comment':
			return `<!-- File: ${file.path} -->\n\`\`\`${markdownLang}\n${file.content}\`\`\``;
		case 'none':
			return `\`\`\`${markdownLang}\n${file.content}\`\`\``;
		case 'inline':
		default:
			return `\`\`\`${markdownLang} ${file.path}\n${file.content}\`\`\``;
	}
};
