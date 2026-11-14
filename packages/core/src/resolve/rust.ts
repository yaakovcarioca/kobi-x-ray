import { ancestors, basename, dirname, stem } from '../paths.js';
import type { ImportRef } from '../types.js';
import type { RepoIndex } from './repoIndex.js';
import type { Resolution } from './resolve.js';

const child = (dir: string, name: string) => (dir === '' ? name : `${dir}/${name}`);

/** Directory where the child modules of `file` live. */
function moduleDir(file: string): string {
  const base = basename(file);
  if (base === 'mod.rs' || base === 'lib.rs' || base === 'main.rs') return dirname(file);
  return child(dirname(file), stem(file));
}

function moduleFile(index: RepoIndex, dir: string, name: string): string | null {
  const flat = child(dir, `${name}.rs`);
  if (index.files.has(flat)) return flat;
  const nested = child(dir, `${name}/mod.rs`);
  return index.files.has(nested) ? nested : null;
}

/** `src` directory of the crate that owns `file`. */
function crateRoot(index: RepoIndex, file: string): string {
  for (const crate of index.rustCrates) {
    if (crate.dir === '' || file.startsWith(crate.dir + '/')) return child(crate.dir, 'src');
  }
  for (const dir of ancestors(file)) if (basename(dir) === 'src') return dir;
  return dirname(file);
}

export function resolveRust(index: RepoIndex, from: string, ref: ImportRef): Resolution {
  if (ref.mod) {
    const hit = moduleFile(index, moduleDir(from), ref.spec);
    return { internal: hit ? [hit] : [] };
  }

  const segments = ref.spec.split('::').filter(Boolean);
  const head = segments[0];
  if (!head) return { internal: [] };

  let dir: string;
  let atCrateRoot = false;
  if (head === 'crate') {
    dir = crateRoot(index, from);
    atCrateRoot = true;
    segments.shift();
  } else if (head === 'self') {
    dir = moduleDir(from);
    segments.shift();
  } else if (head === 'super') {
    dir = moduleDir(from);
    while (segments[0] === 'super') {
      dir = dirname(dir);
      segments.shift();
    }
  } else {
    const crate = index.rustCrates.find((candidate) => candidate.name === head);
    if (!crate) return { internal: [], external: head };
    dir = child(crate.dir, 'src');
    atCrateRoot = true;
    segments.shift();
  }

  // Follow the path as deep as files exist; the remainder names items inside.
  let found: string | null = null;
  for (const segment of segments) {
    const hit = moduleFile(index, dir, segment);
    if (!hit) break;
    found = hit;
    dir = child(dir, segment);
  }
  if (!found && atCrateRoot) {
    for (const entry of ['lib.rs', 'main.rs']) {
      const candidate = child(dir, entry);
      if (index.files.has(candidate)) {
        found = candidate;
        break;
      }
    }
  }
  return { internal: found ? [found] : [] };
}
