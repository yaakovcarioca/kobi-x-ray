import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TimelineReplay } from '../timeline/replay.js';
import type { Snapshot } from '../types.js';
import { analyzeRepo } from './analyzeRepo.js';

let root: string;
let snapshot: Snapshot;

const write = (path: string, content: string) => {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
};
const git = (...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], {
    cwd: root,
    stdio: 'pipe',
  });

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'kobi-xray-'));
  git('init', '-q', '-b', 'main');

  write('src/util.ts', 'export const add = (a: number, b: number) => a + b;\n');
  write('src/index.ts', "import { add } from './util.js';\nexport const two = add(1, 1);\n");
  write('package-lock.json', '{}\n');
  git('add', '.');
  git('commit', '-q', '-m', 'init');

  write('src/util.ts', 'export const add = (a: number, b: number) => {\n  if (a < 0) return b;\n  return a + b;\n};\n');
  git('commit', '-q', '-am', 'fix: negative numbers');

  write('src/untracked.ts', "import 'left-pad';\nimport './util';\n");
  snapshot = await analyzeRepo(root);
}, 60_000);

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('analyzeRepo', () => {
  const byPath = (path: string) => snapshot.files.find((file) => file.path === path)!;

  it('scans source files and skips ignored ones', () => {
    expect(snapshot.files.map((file) => file.path).sort()).toEqual([
      'src/index.ts',
      'src/untracked.ts',
      'src/util.ts',
    ]);
    expect(snapshot.repo).toMatchObject({ git: true, branch: 'main' });
  });

  it('builds the dependency graph in both directions', () => {
    const util = byPath('src/util.ts');
    expect(byPath('src/index.ts').imports).toEqual([util.id]);
    expect(util.importedBy.sort()).toEqual([byPath('src/index.ts').id, byPath('src/untracked.ts').id].sort());
    expect(byPath('src/untracked.ts').external).toEqual(['left-pad']);
  });

  it('measures size and complexity', () => {
    const util = byPath('src/util.ts');
    expect(util.lines).toBe(4);
    expect(util.complexity).toBe(2);
    expect(util.functions).toBe(1);
  });

  it('mines history and appends uncommitted files', () => {
    const { timeline } = snapshot;
    expect(timeline.commits.map((commit) => commit.subject)).toEqual([
      'init',
      'fix: negative numbers',
      'Uncommitted files',
    ]);
    expect(timeline.commits[1]!.fix).toBe(true);
    expect(timeline.paths).not.toContain('package-lock.json');
  });

  it('replays to the same line counts as the working tree', () => {
    const replay = new TimelineReplay(snapshot.timeline).seek(snapshot.timeline.commits.length);
    for (const file of snapshot.files) {
      const index = snapshot.timeline.paths.indexOf(file.path);
      expect(replay.lines[index]).toBe(file.lines);
    }
  });
});
