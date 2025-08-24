import { getMarkdownLang, formatFileComment } from '../../utils/markdownUtils';

interface FileData {
	path: string;
	extension: string;
	content: string;
}

describe('Markdown Utils Test Suite', () => {
	it('should get correct markdown language from extension', () => {
		expect(getMarkdownLang('js')).toBe('JavaScript');
		expect(getMarkdownLang('ts')).toBe('TypeScript');
		expect(getMarkdownLang('py')).toBe('Python');
		expect(getMarkdownLang('.js')).toBe('JavaScript');
		expect(getMarkdownLang('unknown')).toBe('unknown');
	});

	it('should format file comments correctly', () => {
		const fileData: FileData = {
			path: 'test.js',
			extension: 'js',
			content: 'console.log("Hello");',
		};
		const result = formatFileComment(fileData);
		expect(result).toContain('```JavaScript test.js');
		expect(result).toContain('console.log("Hello");');
		expect(result).toContain('```');
	});

	it('should handle various file types', () => {
		const pythonFile: FileData = {
			path: 'script.py',
			extension: 'py',
			content: 'print("Hello")',
		};
		const result = formatFileComment(pythonFile);
		expect(result).toContain('```Python script.py');
		expect(result).toContain('print("Hello")');
	});

	describe('Markdown file handling', () => {
		it('should include raw markdown by default', () => {
			const mdFile: FileData = {
				path: 'readme.md',
				extension: 'md',
				content: '# Hello\nThis is markdown',
			};
			const result = formatFileComment(mdFile);
			expect(result).not.toContain('```');
			expect(result).toContain('<!-- File: readme.md -->');
			expect(result).toContain('# Hello\nThis is markdown');
		});

		it('should wrap markdown in code blocks when configured', () => {
			const mdFile: FileData = {
				path: 'readme.md',
				extension: 'md',
				content: '# Hello\nThis is markdown',
			};
			const result = formatFileComment(mdFile, {
				markdownFileHandling: 'codeblock',
			});
			expect(result).toContain('```Markdown readme.md');
			expect(result).toContain('# Hello');
		});

		it('should handle raw markdown with no file path', () => {
			const mdFile: FileData = {
				path: 'readme.md',
				extension: 'md',
				content: '# Hello\nThis is markdown',
			};
			const result = formatFileComment(mdFile, {
				markdownFileHandling: 'raw',
				filePathFormat: 'none',
			});
			expect(result).not.toContain('```');
			expect(result).not.toContain('readme.md');
			expect(result).toBe('# Hello\nThis is markdown');
		});
	});

	describe('File path formatting', () => {
		it('should include file path inline by default', () => {
			const file: FileData = {
				path: 'test.js',
				extension: 'js',
				content: 'const x = 1;',
			};
			const result = formatFileComment(file);
			expect(result).toBe('```JavaScript test.js\nconst x = 1;```');
		});

		it('should include file path as comment when configured', () => {
			const file: FileData = {
				path: 'test.js',
				extension: 'js',
				content: 'const x = 1;',
			};
			const result = formatFileComment(file, { filePathFormat: 'comment' });
			expect(result).toBe(
				'<!-- File: test.js -->\n```JavaScript\nconst x = 1;```',
			);
		});

		it('should exclude file path when configured', () => {
			const file: FileData = {
				path: 'test.js',
				extension: 'js',
				content: 'const x = 1;',
			};
			const result = formatFileComment(file, { filePathFormat: 'none' });
			expect(result).toBe('```JavaScript\nconst x = 1;```');
		});
	});
});
