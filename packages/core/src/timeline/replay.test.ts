import { describe, expect, it } from 'vitest';
import type { Timeline, TimelineCommit } from '../types.js';
import { TimelineReplay, tuneSaturation } from './replay.js';

const DAY = 86_400;
const commit = (time: number, changes: number[], fix = false): TimelineCommit => ({
  hash: `h${time}`,
  time,
  author: 0,
  subject: '',
  fix,
  changes,
});

const timeline: Timeline = {
  paths: ['a.ts', 'b.ts'],
  authors: ['Ana'],
  commits: [
    commit(1 * DAY, [0, 100, 0]),
    commit(2 * DAY, [0, 20, 10, 1, 50, 0]),
    commit(3 * DAY, [1, 0, 50], true),
    commit(400 * DAY, [0, 5, 0]),
  ],
};

describe('TimelineReplay', () => {
  it('accumulates line counts commit by commit', () => {
    const replay = new TimelineReplay(timeline);
    expect(Array.from(replay.seek(1).lines)).toEqual([100, 0]);
    expect(Array.from(replay.seek(2).lines)).toEqual([110, 50]);
    expect(Array.from(replay.seek(3).lines)).toEqual([110, 0]);
  });

  it('seeks backwards to the same state as a fresh replay', () => {
    const replay = new TimelineReplay(timeline);
    replay.seek(4);
    replay.seek(2);
    const fresh = new TimelineReplay(timeline).seek(2);
    expect(Array.from(replay.lines)).toEqual(Array.from(fresh.lines));
    expect(Array.from(replay.score)).toEqual(Array.from(fresh.score));
    expect(replay.index).toBe(2);
  });

  it('clamps out-of-range positions', () => {
    const replay = new TimelineReplay(timeline);
    expect(replay.seek(99).index).toBe(4);
    expect(replay.seek(-5).index).toBe(0);
    expect(replay.time).toBe(0);
  });

  it('tracks commit and fix counts per path', () => {
    const replay = new TimelineReplay(timeline).seek(4);
    expect(Array.from(replay.commits)).toEqual([3, 2]);
    expect(Array.from(replay.fixes)).toEqual([0, 1]);
  });

  it('heats up on change and cools down with time', () => {
    const replay = new TimelineReplay(timeline);
    expect(replay.heat(0)).toBe(0);
    const early = replay.seek(2).heat(0);
    expect(early).toBeGreaterThan(0.2);
    // b.ts was last touched ~397 days before the final commit.
    replay.seek(4);
    expect(replay.heat(1)).toBeLessThan(0.05);
    expect(replay.heat(0)).toBeGreaterThan(replay.heat(1));
  });

  it('weights bug fixes more than regular commits', () => {
    const plain: Timeline = { ...timeline, commits: [commit(DAY, [0, 1, 0])] };
    const fixed: Timeline = { ...timeline, commits: [commit(DAY, [0, 1, 0], true)] };
    expect(new TimelineReplay(fixed).seek(1).heat(0)).toBeGreaterThan(
      new TimelineReplay(plain).seek(1).heat(0),
    );
  });

  it('stays consistent across checkpoints on long histories', () => {
    const commits = Array.from({ length: 1000 }, (_, i) => commit((i + 1) * DAY, [i % 2, 3, 1]));
    const long: Timeline = { paths: ['a', 'b'], authors: ['x'], commits };
    const replay = new TimelineReplay(long);
    replay.seek(1000);
    replay.seek(333);
    expect(Array.from(replay.lines)).toEqual([334, 332]);
    replay.seek(64);
    expect(Array.from(replay.lines)).toEqual([64, 64]);
  });
});

describe('tuneSaturation', () => {
  it('never drops below the floor for quiet repositories', () => {
    expect(tuneSaturation(timeline)).toBe(3);
    expect(tuneSaturation({ paths: [], authors: [], commits: [] })).toBe(3);
  });

  it('rises with churn so busy files do not all saturate', () => {
    const commits = Array.from({ length: 200 }, (_, i) => commit(DAY + i * 3600, [0, 2, 1]));
    const busy: Timeline = { paths: ['a'], authors: ['x'], commits };
    const saturation = tuneSaturation(busy);
    expect(saturation).toBeGreaterThan(20);
    const heat = new TimelineReplay(busy, { saturation }).seek(200).heat(0);
    expect(heat).toBeGreaterThan(0.85);
    expect(heat).toBeLessThan(0.95);
  });
});
