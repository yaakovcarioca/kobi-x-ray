import { describe, expect, it } from 'vitest';
import { detectLanguage, grammarFor } from './languages.js';

describe('detectLanguage', () => {
  it('maps extensions to languages', () => {
    expect(detectLanguage('src/app.tsx')).toBe('typescript');
    expect(detectLanguage('lib/index.mjs')).toBe('javascript');
    expect(detectLanguage('pkg/__init__.py')).toBe('python');
    expect(detectLanguage('cmd/main.go')).toBe('go');
    expect(detectLanguage('src/lib.rs')).toBe('rust');
  });

  it('falls back to other', () => {
    expect(detectLanguage('README.md')).toBe('other');
    expect(detectLanguage('Makefile')).toBe('other');
  });
});

describe('grammarFor', () => {
  it('uses the tsx grammar for JSX flavours', () => {
    expect(grammarFor('a.tsx')).toBe('tsx');
    expect(grammarFor('a.jsx')).toBe('tsx');
    expect(grammarFor('a.ts')).toBe('typescript');
  });

  it('returns null for files without a grammar', () => {
    expect(grammarFor('styles.css')).toBeNull();
  });
});
