const path = require('path');
const fs = require('fs');
const { shouldSkipDir, walkDir, formatBytes } = require('../scripts/optimize-images');

const ROOT = path.resolve(__dirname, '..');

describe('shouldSkipDir', () => {
  test('skips node_modules directory', () => {
    expect(shouldSkipDir(path.join(ROOT, 'node_modules'))).toBe(true);
  });

  test('skips nested node_modules directory', () => {
    expect(shouldSkipDir(path.join(ROOT, 'node_modules', 'jest'))).toBe(true);
  });

  test('skips .git directory', () => {
    expect(shouldSkipDir(path.join(ROOT, '.git'))).toBe(true);
  });

  test('skips .github directory', () => {
    expect(shouldSkipDir(path.join(ROOT, '.github'))).toBe(true);
  });

  test('skips .vscode directory', () => {
    expect(shouldSkipDir(path.join(ROOT, '.vscode'))).toBe(true);
  });

  test('skips imagenes/icons directory', () => {
    expect(shouldSkipDir(path.join(ROOT, 'imagenes', 'icons'))).toBe(true);
  });

  test('does not skip regular directories', () => {
    expect(shouldSkipDir(path.join(ROOT, 'js'))).toBe(false);
  });

  test('does not skip scripts directory', () => {
    expect(shouldSkipDir(path.join(ROOT, 'scripts'))).toBe(false);
  });

  test('does not skip imagenes directory (only icons subdir is skipped)', () => {
    expect(shouldSkipDir(path.join(ROOT, 'imagenes'))).toBe(false);
  });

  test('does not skip css directory', () => {
    expect(shouldSkipDir(path.join(ROOT, 'css'))).toBe(false);
  });
});

describe('formatBytes', () => {
  test('formats bytes under 1024 as B', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  test('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('formats bytes in KB range', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  test('formats bytes in KB range with decimals', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  test('formats bytes in MB range', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
  });

  test('formats large MB values', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });

  test('formats boundary between B and KB', () => {
    expect(formatBytes(1023)).toBe('1023 B');
  });

  test('formats boundary between KB and MB', () => {
    const val = 1024 * 1024 - 1;
    expect(formatBytes(val)).toContain('KB');
  });
});

describe('walkDir', () => {
  test('returns an array of file paths', () => {
    const jsDir = path.join(ROOT, 'js');
    const files = walkDir(jsDir);
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  test('skips node_modules', () => {
    const files = walkDir(ROOT);
    const nodeModuleFiles = files.filter(f => f.includes('node_modules'));
    expect(nodeModuleFiles).toHaveLength(0);
  });

  test('skips .git directory', () => {
    const files = walkDir(ROOT);
    const gitFiles = files.filter(f => f.includes(path.sep + '.git' + path.sep));
    expect(gitFiles).toHaveLength(0);
  });

  test('includes JS files from scripts directory', () => {
    const scriptsDir = path.join(ROOT, 'scripts');
    const files = walkDir(scriptsDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);
  });

  test('returns empty array for non-existent directory', () => {
    const files = walkDir(path.join(ROOT, 'nonexistent-dir'));
    expect(files).toEqual([]);
  });

  test('returns empty array for skipped directory', () => {
    const files = walkDir(path.join(ROOT, 'node_modules'));
    expect(files).toEqual([]);
  });
});
