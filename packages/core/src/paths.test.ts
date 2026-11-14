import { describe, expect, it } from 'vitest';
import { ancestors, basename, dirname, extname, join, stem, toPosix } from './paths.js';

describe('paths', () => {
  it('normalises windows separators', () => {
    expect(toPosix('src\\a\\b.ts')).toBe('src/a/b.ts');
  });

  it('splits directory, base, extension and stem', () => {
    expect(dirname('src/a/b.test.ts')).toBe('src/a');
    expect(dirname('b.ts')).toBe('');
    expect(basename('src/a/b.test.ts')).toBe('b.test.ts');
    expect(extname('src/a/B.TS')).toBe('.ts');
    expect(extname('.gitignore')).toBe('');
    expect(stem('src/a/b.test.ts')).toBe('b.test');
  });

  it('joins and collapses relative segments', () => {
    expect(join('src/a', '../b/./c.ts')).toBe('src/b/c.ts');
    expect(join('', './x')).toBe('x');
  });

  it('returns null when a path escapes the root', () => {
    expect(join('src', '../../x')).toBeNull();
  });

  it('lists ancestors nearest first', () => {
    expect(ancestors('a/b/c.ts')).toEqual(['a/b', 'a', '']);
    expect(ancestors('c.ts')).toEqual(['']);
  });
});
