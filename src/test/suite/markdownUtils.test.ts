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
			content: 'console.log("Hello");'
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
			content: 'print("Hello")'
		};
		const result = formatFileComment(pythonFile);
		expect(result).toContain('```Python script.py');
		expect(result).toContain('print("Hello")');
	});
});