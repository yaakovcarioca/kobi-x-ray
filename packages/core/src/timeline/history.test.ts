import { describe, expect, it } from 'vitest';
import type { Timeline } from '../types.js';
import { fileHistory, indexPaths } from './history.js';

const timeline: Timeline = {
  paths: ['src/a.ts', 'src/b.ts', 'docs/x.md'],
  authors: ['Ana', 'Bob'],
  commits: [
    { hash: '1', time: 10, author: 0, subject: 'init', fix: false, changes: [0, 10, 0, 1, 5, 0] },
    { hash: '2', time: 20, author: 1, subject: 'fix a', fix: true, changes: [0, 2, 1] },
    { hash: '3', time: 30, author: 1, subject: 'docs', fix: false, changes: [2, 7, 0] },
    { hash: '4', time: 40, author: 1, subject: 'more a', fix: false, changes: [0, 1, 4] },
  ],
};

describe('indexPaths', () => {
  it('maps each path to its index', () => {
    expect(indexPaths(timeline).get('src/b.ts')).toBe(1);
  });
});

describe('fileHistory', () => {
  it('summarises a single path', () => {
    expect(fileHistory(timeline, 0)).toEqual({
      commits: [0, 1, 3],
      fixes: 1,
      added: 13,
      deleted: 5,
      authors: [
        { name: 'Bob', commits: 2 },
        { name: 'Ana', commits: 1 },
      ],
      firstSeen: 10,
      lastTouch: 40,
    });
  });

  it('combines several paths without double counting commits', () => {
    const history = fileHistory(timeline, new Set([0, 1]));
    expect(history.commits).toEqual([0, 1, 3]);
    expect(history.added).toBe(18);
  });

  it('respects the time-travel cut-off', () => {
    expect(fileHistory(timeline, 0, 2).commits).toEqual([0, 1]);
  });

  it('is empty for untouched paths', () => {
    expect(fileHistory(timeline, 2, 2)).toMatchObject({ commits: [], firstSeen: 0, lastTouch: 0 });
  });
});
