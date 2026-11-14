import { describe, expect, it } from 'vitest';
import { rankHotspots } from '../graph/hotspots.js';
import type { FileNode, Snapshot } from '../types.js';
import { districtContextMarkdown, fileContextMarkdown } from './context.js';

function file(id: number, path: string, imports: number[] = []): FileNode {
  return {
    id,
    path,
    language: 'typescript',
    lines: 100 * (id + 1),
    sloc: 80 * (id + 1),
    complexity: 5 * (id + 1),
    functions: id,
    imports,
    importedBy: [],
    external: id === 0 ? ['zod'] : [],
  };
}

function snapshot(): Snapshot {
  const files = [
    file(0, 'src/core/auth.ts'),
    file(1, 'src/core/session.ts', [0]),
    file(2, 'src/api/login.ts', [1]),
    file(3, 'src/api/logout.ts', [1, 0]),
  ];
  for (const f of files) for (const id of f.imports) files[id]!.importedBy.push(f.id);
  return {
    schema: 1,
    repo: { name: 'acme/app', branch: 'main', head: 'abc1234', generatedAt: 0, git: true },
    files,
    timeline: {
      paths: files.map((f) => f.path),
      authors: ['Ana'],
      commits: [
        { hash: '1', time: 1_700_000_000, author: 0, subject: 'init', fix: false, changes: [0, 100, 0] },
        { hash: '2', time: 1_700_086_400, author: 0, subject: 'fix auth', fix: true, changes: [0, 4, 2] },
      ],
    },
  };
}

describe('fileContextMarkdown', () => {
  const markdown = fileContextMarkdown(snapshot(), 0);

  it('describes the file, its churn and its neighbours', () => {
    expect(markdown).toContain('# X-Ray context: `src/core/auth.ts`');
    expect(markdown).toContain('Repository: **acme/app** (main @ abc1234)');
    expect(markdown).toContain('Fan-in: 2 files import it');
    expect(markdown).toContain('Churn: 2 commits (1 bug fixes), +104/-2 lines');
    expect(markdown).toContain('- `src/core/session.ts` — 200 lines, complexity 10, fan-in 2');
    expect(markdown).toContain('`zod`');
  });

  it('reports the transitive blast radius', () => {
    expect(markdown).toContain('3 files depend on this file directly or transitively (2 direct, up to 2 hops away).');
    expect(markdown).toContain('- `src/api/login.ts` (2 hops)');
  });

  it('truncates long lists', () => {
    const short = fileContextMarkdown(snapshot(), 0, { maxList: 1 });
    expect(short).toContain('…and 1 more');
  });

  it('returns an empty string for unknown files', () => {
    expect(fileContextMarkdown(snapshot(), 99)).toBe('');
  });
});

describe('districtContextMarkdown', () => {
  it('summarises boundary crossings', () => {
    const markdown = districtContextMarkdown(snapshot(), 'src/core');
    expect(markdown).toContain('- 2 files, 300 lines');
    expect(markdown).toContain('- 1 imports stay inside the module');
    expect(markdown).toContain('- `src/api/logout.ts` (2 imports)');
    expect(markdown).toContain('_No dependencies outside the module._');
  });
});

describe('rankHotspots', () => {
  it('ranks hot, depended-upon files first and skips cold ones', () => {
    const { files } = snapshot();
    const heat = [0.9, 0.9, 0, 0.2];
    const ranked = rankHotspots(files, (id) => heat[id]!);
    expect(ranked.map((h) => h.id)).toEqual([1, 0, 3]);
  });
});
