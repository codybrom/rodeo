import {
	getExtension,
	getBasename,
	getDirname,
	getRelativePath,
	fileExists,
	isDirectory,
	listFiles,
	readFileContent,
	readPackageJson,
	resolvePath,
} from '../../utils/fileUtils';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');

describe('File Utils Test Suite', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getExtension', () => {
		it('should extract correct extensions', () => {
			expect(getExtension('test.js')).toBe('js');
			expect(getExtension('component.tsx')).toBe('tsx');
			expect(getExtension('script.py')).toBe('py');
			expect(getExtension('.gitignore')).toBe(''); // dotfiles have no extension
			expect(getExtension('no-extension')).toBe('');
			expect(getExtension('multi.part.name.ts')).toBe('ts');
			expect(getExtension('FILE.TXT')).toBe('txt'); // should lowercase
		});
	});

	describe('getBasename', () => {
		it('should return file basename', () => {
			expect(getBasename('/path/to/file.js')).toBe('file.js');
			expect(getBasename('file.js')).toBe('file.js');
			expect(getBasename('/path/to/dir/')).toBe('dir');
		});
	});

	describe('getDirname', () => {
		it('should return directory path', () => {
			expect(getDirname('/path/to/file.js')).toBe('/path/to');
			expect(getDirname('file.js')).toBe('.');
			expect(getDirname('/path/to/dir/')).toBe('/path/to');
		});
	});

	describe('getRelativePath', () => {
		it('should compute relative paths', () => {
			expect(getRelativePath('/a/b', '/a/b/c/d')).toBe('c/d');
			expect(getRelativePath('/a/b/c', '/a/b/d')).toBe('../d');
			expect(getRelativePath('/a/b', '/a/b')).toBe('');
		});

		it('should throw error for invalid paths', () => {
			expect(() => getRelativePath('', '/path')).toThrow(
				'Invalid path: both from and to paths must be provided',
			);
			expect(() => getRelativePath('/path', '')).toThrow(
				'Invalid path: both from and to paths must be provided',
			);
			expect(() => getRelativePath('', '')).toThrow(
				'Invalid path: both from and to paths must be provided',
			);
		});
	});

	describe('fileExists', () => {
		it('should check if file exists', () => {
			(fs.existsSync as jest.Mock).mockReturnValue(true);
			expect(fileExists('/path/to/file')).toBe(true);
			expect(fs.existsSync).toHaveBeenCalledWith('/path/to/file');

			(fs.existsSync as jest.Mock).mockReturnValue(false);
			expect(fileExists('/nonexistent')).toBe(false);
		});
	});

	describe('isDirectory', () => {
		it('should check if path is directory', () => {
			(fs.lstatSync as jest.Mock).mockReturnValue({
				isDirectory: () => true,
			});
			expect(isDirectory('/path/to/dir')).toBe(true);

			(fs.lstatSync as jest.Mock).mockReturnValue({
				isDirectory: () => false,
			});
			expect(isDirectory('/path/to/file')).toBe(false);
		});
	});

	describe('listFiles', () => {
		it('should list files in directory', () => {
			const mockFiles = ['file1.js', 'file2.ts', 'dir'];
			(fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);

			expect(listFiles('/path/to/dir')).toEqual(mockFiles);
			expect(fs.readdirSync).toHaveBeenCalledWith('/path/to/dir');
		});
	});

	describe('readFileContent', () => {
		it('should read file content', () => {
			const mockContent = 'console.log("test");';
			(fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

			expect(readFileContent('/path/to/file.js')).toBe(mockContent);
			expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/file.js', 'utf8');
		});
	});

	describe('readPackageJson', () => {
		it('should read package.json when it exists', () => {
			const mockPackageJson = '{"name": "test", "version": "1.0.0"}';
			(fs.existsSync as jest.Mock).mockReturnValue(true);
			(fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

			const result = readPackageJson('/workspace');
			expect(result).toBe(mockPackageJson);
			expect(fs.existsSync).toHaveBeenCalledWith(
				path.join('/workspace', 'package.json'),
			);
		});

		it('should return null when package.json does not exist', () => {
			(fs.existsSync as jest.Mock).mockReturnValue(false);

			const result = readPackageJson('/workspace');
			expect(result).toBeNull();
		});
	});

	describe('resolvePath', () => {
		it('should resolve paths correctly', () => {
			expect(resolvePath('/a', 'b', 'c')).toBe(path.join('/a', 'b', 'c'));
			expect(resolvePath('relative', 'path')).toBe(
				path.join('relative', 'path'),
			);
		});

		it('should throw error for invalid paths', () => {
			expect(() => resolvePath()).toThrow(
				'Invalid path: path segments must not be empty',
			);
			expect(() => resolvePath('')).toThrow(
				'Invalid path: path segments must not be empty',
			);
			expect(() => resolvePath('valid', '', 'path')).toThrow(
				'Invalid path: path segments must not be empty',
			);
		});
	});
});
