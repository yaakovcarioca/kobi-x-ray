import { describe, expect, it } from 'vitest';
import type { FileNode } from '../types.js';
import { blastRadius, dependencyCone } from './blast.js';

/** Builds a graph from `[importer, imported]` pairs. */
function graph(count: number, edges: Array<[number, number]>): FileNode[] {
  const files: FileNode[] = Array.from({ length: count }, (_, id) => ({
    id,
    path: `f${id}.ts`,
    language: 'typescript',
    lines: 1,
    sloc: 1,
    complexity: 1,
    functions: 0,
    imports: [],
    importedBy: [],
    external: [],
  }));
  for (const [from, to] of edges) {
    files[from]!.imports.push(to);
    files[to]!.importedBy.push(from);
  }
  return files;
}

describe('blastRadius', () => {
  // 1 -> 0, 2 -> 0, 3 -> 1, 4 -> 3, 0 -> 5
  const files = graph(6, [
    [1, 0],
    [2, 0],
    [3, 1],
    [4, 3],
    [0, 5],
  ]);

  it('walks dependents breadth-first with depths', () => {
    const blast = blastRadius(files, 0);
    expect(blast.ids).toEqual([1, 2, 3, 4]);
    expect(blast.depths).toEqual([1, 1, 2, 3]);
    expect(blast.direct).toBe(2);
    expect(blast.maxDepth).toBe(3);
  });

  it('is empty for leaf consumers', () => {
    expect(blastRadius(files, 4)).toEqual({ ids: [], depths: [], direct: 0, maxDepth: 0 });
  });

  it('terminates on cycles', () => {
    const cyclic = graph(3, [
      [0, 1],
      [1, 2],
      [2, 0],
    ]);
    expect(blastRadius(cyclic, 0).ids).toEqual([2, 1]);
  });

  it('walks the other way for the dependency cone', () => {
    expect(dependencyCone(files, 4).ids).toEqual([3, 1, 0, 5]);
  });
});
