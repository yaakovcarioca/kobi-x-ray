import type { ImportRef, Language } from '../types.js';
import { resolveGo } from './go.js';
import { resolveJavaScript } from './javascript.js';
import { resolvePython } from './python.js';
import type { RepoIndex } from './repoIndex.js';
import { resolveRust } from './rust.js';

export interface Resolution {
  /** Repository files the import points at. */
  internal: string[];
  /** Third-party package or standard library module, when not internal. */
  external?: string;
}

const NOTHING: Resolution = { internal: [] };

/** Resolves one import of `from` to repository files or an external package. */
export function resolveImport(
  index: RepoIndex,
  from: string,
  language: Language,
  ref: ImportRef,
): Resolution {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return resolveJavaScript(index, from, ref.spec);
    case 'python':
      return resolvePython(index, from, ref);
    case 'go':
      return resolveGo(index, ref.spec);
    case 'rust':
      return resolveRust(index, from, ref);
    default:
      return NOTHING;
  }
}
