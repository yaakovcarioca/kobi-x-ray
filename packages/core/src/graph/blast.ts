import type { FileNode } from '../types.js';

export interface BlastRadius {
  /** Affected file ids in breadth-first order (the origin itself is excluded). */
  ids: number[];
  /** Distance from the origin for each entry of `ids`. */
  depths: number[];
  /** Number of files that import the origin directly. */
  direct: number;
  maxDepth: number;
}

function traverse(
  files: readonly FileNode[],
  origin: number,
  edge: 'imports' | 'importedBy',
): BlastRadius {
  const seen = new Uint8Array(files.length);
  seen[origin] = 1;
  const ids: number[] = [];
  const depths: number[] = [];
  let frontier = [origin];
  let depth = 0;
  let direct = 0;
  while (frontier.length > 0) {
    depth++;
    const next: number[] = [];
    for (const id of frontier) {
      for (const neighbour of files[id]![edge]) {
        if (seen[neighbour]) continue;
        seen[neighbour] = 1;
        ids.push(neighbour);
        depths.push(depth);
        next.push(neighbour);
      }
    }
    if (depth === 1) direct = next.length;
    frontier = next;
  }
  return { ids, depths, direct, maxDepth: depths.length ? depths[depths.length - 1]! : 0 };
}

/** Every file that could break, directly or transitively, when `origin` changes. */
export function blastRadius(files: readonly FileNode[], origin: number): BlastRadius {
  return traverse(files, origin, 'importedBy');
}

/** Every file `origin` depends on, directly or transitively. */
export function dependencyCone(files: readonly FileNode[], origin: number): BlastRadius {
  return traverse(files, origin, 'imports');
}
