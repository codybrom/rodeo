import * as path from 'path';
import * as fs from 'fs';
import {
	fileExists,
	getBasename,
	getDirname,
	getExtension,
	getRelativePath,
	isDirectory,
	listFiles,
	readFileContent,
	readPackageJson,
	resolvePath,
} from '../../utils/fileUtils';

// Mock fs module
jest.mock('fs');

describe('fileUtils', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('fileExists', () => {
		it('should return true when file exists', () => {
			(fs.existsSync as jest.Mock).mockReturnValue(true);
			
			const result = fileExists('/path/to/file.txt');
			
			expect(result).toBe(true);
			expect(fs.existsSync).toHaveBeenCalledWith('/path/to/file.txt');
		});

		it('should return false when file does not exist', () => {
			(fs.existsSync as jest.Mock).mockReturnValue(false);
			
			const result = fileExists('/path/to/nonexistent.txt');
			
			expect(result).toBe(false);
			expect(fs.existsSync).toHaveBeenCalledWith('/path/to/nonexistent.txt');
		});
	});

	describe('getBasename', () => {
		it('should return the basename of a file path', () => {
			const result = getBasename('/path/to/file.txt');
			expect(result).toBe('file.txt');
		});

		it('should return the basename of a directory path', () => {
			const result = getBasename('/path/to/directory/');
			expect(result).toBe('directory');
		});

		it('should handle paths without directory', () => {
			const result = getBasename('file.txt');
			expect(result).toBe('file.txt');
		});
	});

	describe('getDirname', () => {
		it('should return the directory name of a file path', () => {
			const result = getDirname('/path/to/file.txt');
			expect(result).toBe('/path/to');
		});

		it('should return parent directory for directory path', () => {
			const result = getDirname('/path/to/directory/');
			expect(result).toBe('/path/to');
		});

		it('should return . for file without directory', () => {
			const result = getDirname('file.txt');
			expect(result).toBe('.');
		});
	});

	describe('getExtension', () => {
		it('should return file extension without dot', () => {
			const result = getExtension('/path/to/file.txt');
			expect(result).toBe('txt');
		});

		it('should return lowercase extension', () => {
			const result = getExtension('/path/to/file.TXT');
			expect(result).toBe('txt');
		});

		it('should handle multiple dots in filename', () => {
			const result = getExtension('/path/to/file.test.js');
			expect(result).toBe('js');
		});

		it('should return empty string for files without extension', () => {
			const result = getExtension('/path/to/file');
			expect(result).toBe('');
		});

		it('should handle hidden files', () => {
			const result = getExtension('/path/to/.gitignore');
			expect(result).toBe('');
		});
	});

	describe('getRelativePath', () => {
		it('should return relative path between two paths', () => {
			const result = getRelativePath('/base/path', '/base/path/to/file.txt');
			expect(result).toBe(path.join('to', 'file.txt'));
		});

		it('should handle parent directory traversal', () => {
			const result = getRelativePath('/base/path/deep', '/base/file.txt');
			expect(result).toBe(path.join('..', '..', 'file.txt'));
		});

		it('should return empty string for same paths', () => {
			const result = getRelativePath('/same/path', '/same/path');
			expect(result).toBe('');
		});

		it('should throw error when from path is missing', () => {
			expect(() => getRelativePath('', '/to/path')).toThrow('Invalid path: both from and to paths must be provided');
		});

		it('should throw error when to path is missing', () => {
			expect(() => getRelativePath('/from/path', '')).toThrow('Invalid path: both from and to paths must be provided');
		});

		it('should throw error when both paths are missing', () => {
			expect(() => getRelativePath('', '')).toThrow('Invalid path: both from and to paths must be provided');
		});
	});

	describe('isDirectory', () => {
		it('should return true for directories', () => {
			(fs.lstatSync as jest.Mock).mockReturnValue({
				isDirectory: () => true,
			});
			
			const result = isDirectory('/path/to/dir');
			
			expect(result).toBe(true);
			expect(fs.lstatSync).toHaveBeenCalledWith('/path/to/dir');
		});

		it('should return false for files', () => {
			(fs.lstatSync as jest.Mock).mockReturnValue({
				isDirectory: () => false,
			});
			
			const result = isDirectory('/path/to/file.txt');
			
			expect(result).toBe(false);
			expect(fs.lstatSync).toHaveBeenCalledWith('/path/to/file.txt');
		});
	});

	describe('listFiles', () => {
		it('should return list of files in directory', () => {
			const mockFiles = ['file1.txt', 'file2.js', 'subdir'];
			(fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);
			
			const result = listFiles('/path/to/dir');
			
			expect(result).toEqual(mockFiles);
			expect(fs.readdirSync).toHaveBeenCalledWith('/path/to/dir');
		});

		it('should return empty array for empty directory', () => {
			(fs.readdirSync as jest.Mock).mockReturnValue([]);
			
			const result = listFiles('/empty/dir');
			
			expect(result).toEqual([]);
			expect(fs.readdirSync).toHaveBeenCalledWith('/empty/dir');
		});
	});

	describe('readFileContent', () => {
		it('should read file content as UTF-8', () => {
			const mockContent = 'File content here';
			(fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
			
			const result = readFileContent('/path/to/file.txt');
			
			expect(result).toBe(mockContent);
			expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/file.txt', 'utf8');
		});

		it('should handle multiline content', () => {
			const mockContent = 'Line 1\nLine 2\nLine 3';
			(fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
			
			const result = readFileContent('/path/to/multiline.txt');
			
			expect(result).toBe(mockContent);
		});
	});

	describe('readPackageJson', () => {
		it('should read package.json when it exists', () => {
			const mockPackageJson = '{"name": "test-project", "version": "1.0.0"}';
			(fs.existsSync as jest.Mock).mockReturnValue(true);
			(fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);
			
			const result = readPackageJson('/workspace');
			
			expect(result).toBe(mockPackageJson);
			expect(fs.existsSync).toHaveBeenCalledWith('/workspace/package.json');
			expect(fs.readFileSync).toHaveBeenCalledWith('/workspace/package.json', 'utf8');
		});

		it('should return null when package.json does not exist', () => {
			(fs.existsSync as jest.Mock).mockReturnValue(false);
			
			const result = readPackageJson('/workspace');
			
			expect(result).toBeNull();
			expect(fs.existsSync).toHaveBeenCalledWith('/workspace/package.json');
			expect(fs.readFileSync).not.toHaveBeenCalled();
		});

		it('should handle workspace paths with trailing slash', () => {
			(fs.existsSync as jest.Mock).mockReturnValue(true);
			(fs.readFileSync as jest.Mock).mockReturnValue('{}');
			
			const result = readPackageJson('/workspace/');
			
			expect(result).toBe('{}');
			expect(fs.existsSync).toHaveBeenCalledWith('/workspace/package.json');
		});
	});

	describe('resolvePath', () => {
		it('should join multiple path segments', () => {
			const result = resolvePath('/base', 'path', 'to', 'file.txt');
			expect(result).toBe(path.join('/base', 'path', 'to', 'file.txt'));
		});

		it('should handle single path segment', () => {
			const result = resolvePath('/single/path');
			expect(result).toBe('/single/path');
		});

		it('should handle relative paths', () => {
			const result = resolvePath('relative', 'path', 'file.txt');
			expect(result).toBe(path.join('relative', 'path', 'file.txt'));
		});

		it('should throw error when no paths provided', () => {
			expect(() => resolvePath()).toThrow('Invalid path: path segments must not be empty');
		});

		it('should throw error when path segment is empty', () => {
			expect(() => resolvePath('/base', '', 'file.txt')).toThrow('Invalid path: path segments must not be empty');
		});

		it('should throw error when path segment is null', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => resolvePath('/base', null as any, 'file.txt')).toThrow('Invalid path: path segments must not be empty');
		});

		it('should throw error when path segment is undefined', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => resolvePath('/base', undefined as any, 'file.txt')).toThrow('Invalid path: path segments must not be empty');
		});
	});
});