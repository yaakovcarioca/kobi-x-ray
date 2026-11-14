/**
 * Minimal POSIX path helpers. Kept dependency-free so the same code runs in
 * Node and in the browser.
 */

export function toPosix(path: string): string {
  return path.replace(/\\/g, '/');
}

export function dirname(path: string): string {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i);
}

export function basename(path: string): string {
  const i = path.lastIndexOf('/');
  return i === -1 ? path : path.slice(i + 1);
}

/** Extension including the dot, lowercased. Empty for dotfiles and extensionless files. */
export function extname(path: string): string {
  const base = basename(path);
  const i = base.lastIndexOf('.');
  return i <= 0 ? '' : base.slice(i).toLowerCase();
}

/** Basename without its last extension. */
export function stem(path: string): string {
  const base = basename(path);
  const i = base.lastIndexOf('.');
  return i <= 0 ? base : base.slice(0, i);
}

/**
 * Joins segments and collapses `.` / `..`. Returns `null` when the result
 * escapes the repository root.
 */
export function join(...parts: string[]): string | null {
  const out: string[] = [];
  for (const part of parts) {
    for (const seg of part.split('/')) {
      if (seg === '' || seg === '.') continue;
      if (seg === '..') {
        if (out.length === 0) return null;
        out.pop();
      } else {
        out.push(seg);
      }
    }
  }
  return out.join('/');
}

/** All ancestor directories of a path, nearest first, ending with `''` (the root). */
export function ancestors(path: string): string[] {
  const out: string[] = [];
  let dir = dirname(path);
  while (dir !== '') {
    out.push(dir);
    dir = dirname(dir);
  }
  out.push('');
  return out;
}
