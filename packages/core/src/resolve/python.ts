import { ancestors, dirname, join } from '../paths.js';
import type { ImportRef } from '../types.js';
import type { RepoIndex } from './repoIndex.js';
import type { Resolution } from './resolve.js';

/** Directories that commonly act as an import root. */
const ROOT_DIRS = new Set(['', 'src', 'lib', 'app']);

function moduleFile(index: RepoIndex, base: string | null): string | null {
  if (base === null || base === '') return null;
  for (const candidate of [
    `${base}.py`,
    `${base}/__init__.py`,
    `${base}.pyi`,
    `${base}/__init__.pyi`,
  ]) {
    if (index.files.has(candidate)) return candidate;
  }
  return null;
}

function commonPrefix(a: string, b: string): number {
  const as = a.split('/');
  const bs = b.split('/');
  let i = 0;
  while (i < as.length && i < bs.length && as[i] === bs[i]) i++;
  return i;
}

/** Finds the module base (`pkg/mod`) an absolute dotted name refers to. */
function findAbsolute(index: RepoIndex, from: string, segments: string[]): string | null {
  const key = segments.join('/');
  let candidates = index.pyModules.get(key);
  if (!candidates) return null;

  if (segments.length === 1) {
    // `import json` must not match some unrelated `tools/json.py`: only accept
    // modules sitting at an import root or next to / above the importer.
    const near = new Set(ancestors(from));
    candidates = candidates.filter((base) => {
      const dir = dirname(base);
      return ROOT_DIRS.has(dir) || near.has(dir);
    });
  }
  if (candidates.length === 0) return null;

  const fromDir = dirname(from);
  let best = candidates[0]!;
  let bestScore = -1;
  for (const base of candidates) {
    const score = commonPrefix(base, fromDir) * 1000 - base.length;
    if (score > bestScore || bestScore === -1) {
      best = base;
      bestScore = score;
    }
  }
  return best;
}

export function resolvePython(index: RepoIndex, from: string, ref: ImportRef): Resolution {
  const segments = ref.spec ? ref.spec.split('.') : [];
  const level = ref.level ?? 0;
  let base: string | null;

  if (level > 0) {
    let dir: string = dirname(from);
    for (let i = 1; i < level; i++) {
      if (dir === '') return { internal: [] };
      dir = dirname(dir);
    }
    base = join(dir, segments.join('/'));
  } else {
    base = findAbsolute(index, from, segments);
    if (base === null) return { internal: [], external: segments[0] };
  }
  if (base === null) return { internal: [] };

  const internal: string[] = [];
  const names = ref.names ?? [];
  let submodules = 0;
  for (const name of names) {
    // `from pkg import mod` may name a submodule rather than an attribute.
    const hit = moduleFile(index, base === '' ? name : `${base}/${name}`);
    if (hit) {
      internal.push(hit);
      submodules++;
    }
  }
  if (submodules < names.length || names.length === 0) {
    const self = moduleFile(index, base);
    if (self) internal.push(self);
  }
  return { internal };
}
