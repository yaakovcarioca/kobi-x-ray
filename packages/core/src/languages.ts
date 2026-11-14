import { extname } from './paths.js';
import type { Language } from './types.js';

const BY_EXTENSION: Record<string, Language> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.pyi': 'python',
  '.go': 'go',
  '.rs': 'rust',
};

export function detectLanguage(path: string): Language {
  if (path.endsWith('.d.ts')) return 'typescript';
  return BY_EXTENSION[extname(path)] ?? 'other';
}

/** Tree-sitter grammar to use for a path, or `null` when the file is not analysed. */
export function grammarFor(path: string): string | null {
  const ext = extname(path);
  switch (BY_EXTENSION[ext]) {
    case 'typescript':
      return ext === '.tsx' ? 'tsx' : 'typescript';
    case 'javascript':
      // The TSX grammar is a superset that also copes with Flow-less JSX.
      return ext === '.jsx' ? 'tsx' : 'javascript';
    case 'python':
      return 'python';
    case 'go':
      return 'go';
    case 'rust':
      return 'rust';
    default:
      return null;
  }
}

export const GRAMMARS = ['typescript', 'tsx', 'javascript', 'python', 'go', 'rust'] as const;
