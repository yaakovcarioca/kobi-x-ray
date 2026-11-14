import { describe, expect, it } from 'vitest';
import { COMMIT_MARK as C, FIELD_MARK as F, looksLikeFix, parseGitLog } from './parseLog.js';

const commit = (hash: string, time: number, author: string, subject: string, stats: string[]) =>
  `${C}${hash}${F}${time}${F}${author}${F}${subject}\n\n${stats.join('\n')}\n`;

describe('parseGitLog', () => {
  const raw =
    commit('a'.repeat(40), 100, 'Ana', 'init', [
      '10\t0\tsrc/a.ts',
      '5\t0\tsrc/b.ts',
      '-\t-\tlogo.png',
    ]) +
    commit('b'.repeat(40), 200, 'Bob', 'Merge branch x', []) +
    commit('c'.repeat(40), 300, 'Ana', 'fix: crash on empty input', [
      '3\t1\tsrc/a.ts',
      '900\t0\tpackage-lock.json',
    ]) +
    commit('d'.repeat(40), 400, 'Bob', 'chore: lockfile', ['1\t1\tpackage-lock.json']);

  const timeline = parseGitLog(raw);

  it('indexes paths and authors once', () => {
    expect(timeline.paths).toEqual(['src/a.ts', 'src/b.ts']);
    expect(timeline.authors).toEqual(['Ana']);
  });

  it('drops commits without relevant changes', () => {
    expect(timeline.commits.map((c) => c.subject)).toEqual(['init', 'fix: crash on empty input']);
  });

  it('stores changes as flat triples and shortens hashes', () => {
    expect(timeline.commits[0]).toMatchObject({
      hash: 'aaaaaaaaaaaa',
      time: 100,
      author: 0,
      fix: false,
      changes: [0, 10, 0, 1, 5, 0],
    });
    expect(timeline.commits[1]).toMatchObject({ fix: true, changes: [0, 3, 1] });
  });

  it('accepts a custom path filter', () => {
    const onlyB = parseGitLog(raw, (path) => path.endsWith('b.ts'));
    expect(onlyB.paths).toEqual(['src/b.ts']);
    expect(onlyB.commits).toHaveLength(1);
  });

  it('handles empty output', () => {
    expect(parseGitLog('')).toEqual({ paths: [], authors: [], commits: [] });
  });
});

describe('looksLikeFix', () => {
  it('spots fix-like subjects', () => {
    expect(looksLikeFix('Fixes #12: null deref')).toBe(true);
    expect(looksLikeFix('hotfix login')).toBe(true);
    expect(looksLikeFix('Revert "feat: x"')).toBe(true);
  });

  it('ignores lookalikes', () => {
    expect(looksLikeFix('add prefix option')).toBe(false);
    expect(looksLikeFix('feat: debugger panel')).toBe(false);
  });
});
