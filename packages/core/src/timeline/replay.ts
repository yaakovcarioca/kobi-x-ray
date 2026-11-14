import type { Timeline } from '../types.js';

const DAY = 86_400;

export interface ReplayOptions {
  /** Days after which a change counts half as much towards heat. */
  halfLifeDays?: number;
  /** Extra weight a bug-fix commit adds on top of a regular one. */
  fixWeight?: number;
  /** Churn score at which heat reaches ~63%. */
  saturation?: number;
}

interface Checkpoint {
  index: number;
  lines: Int32Array;
  score: Float32Array;
  lastTouch: Float64Array;
  commits: Uint32Array;
  fixes: Uint32Array;
}

/**
 * Replays a timeline commit by commit so the state of every path can be read
 * at any point in history. Seeking forward is incremental; seeking backwards
 * restarts from the nearest checkpoint.
 */
export class TimelineReplay {
  /** Line count per path (0 or less means the file does not exist). */
  readonly lines: Int32Array;
  /** Exponentially decayed churn score, valid as of `lastTouch`. */
  readonly score: Float32Array;
  /** Unix seconds of the last change per path, 0 when never touched. */
  readonly lastTouch: Float64Array;
  readonly commits: Uint32Array;
  readonly fixes: Uint32Array;

  /** Number of commits applied so far. */
  index = 0;

  private readonly halfLife: number;
  private readonly fixWeight: number;
  private readonly saturation: number;
  private readonly every: number;
  private readonly checkpoints: Checkpoint[] = [];

  constructor(
    readonly timeline: Timeline,
    options: ReplayOptions = {},
  ) {
    const n = timeline.paths.length;
    this.lines = new Int32Array(n);
    this.score = new Float32Array(n);
    this.lastTouch = new Float64Array(n);
    this.commits = new Uint32Array(n);
    this.fixes = new Uint32Array(n);
    this.halfLife = (options.halfLifeDays ?? 90) * DAY;
    this.fixWeight = options.fixWeight ?? 1;
    this.saturation = options.saturation ?? 5;
    // Roughly 32 checkpoints regardless of history size keeps memory bounded.
    this.every = Math.max(64, Math.ceil(timeline.commits.length / 32));
  }

  get length(): number {
    return this.timeline.commits.length;
  }

  /** Time of the most recently applied commit (0 before the first one). */
  get time(): number {
    return this.index === 0 ? 0 : this.timeline.commits[this.index - 1]!.time;
  }

  /** Moves to the state right after `index` commits have been applied. */
  seek(index: number): this {
    const target = Math.max(0, Math.min(this.length, Math.floor(index)));
    if (target < this.index) this.restore(target);
    while (this.index < target) this.step();
    return this;
  }

  /** Churn score of a path decayed to the current position (unbounded). */
  churn(path: number): number {
    const last = this.lastTouch[path]!;
    if (last === 0) return 0;
    const age = Math.max(0, this.time - last);
    return this.score[path]! * Math.pow(0.5, age / this.halfLife);
  }

  /** 0..1 temperature of a path at the current position. */
  heat(path: number): number {
    return 1 - Math.exp(-this.churn(path) / this.saturation);
  }

  private step(): void {
    if (this.index % this.every === 0 && this.index / this.every === this.checkpoints.length) {
      this.checkpoints.push({
        index: this.index,
        lines: this.lines.slice(),
        score: this.score.slice(),
        lastTouch: this.lastTouch.slice(),
        commits: this.commits.slice(),
        fixes: this.fixes.slice(),
      });
    }
    const commit = this.timeline.commits[this.index]!;
    const weight = 1 + (commit.fix ? this.fixWeight : 0);
    const { changes } = commit;
    for (let i = 0; i < changes.length; i += 3) {
      const path = changes[i]!;
      const next = this.lines[path]! + changes[i + 1]! - changes[i + 2]!;
      this.lines[path] = next < 0 ? 0 : next;

      const last = this.lastTouch[path]!;
      // Author dates are not strictly monotonic; never decay "into the future".
      const age = last === 0 ? 0 : Math.max(0, commit.time - last);
      this.score[path] = this.score[path]! * Math.pow(0.5, age / this.halfLife) + weight;
      this.lastTouch[path] = Math.max(last, commit.time);
      this.commits[path]! += 1;
      if (commit.fix) this.fixes[path]! += 1;
    }
    this.index++;
  }

  private restore(target: number): void {
    const slot = Math.min(Math.floor(target / this.every), this.checkpoints.length - 1);
    const checkpoint = this.checkpoints[slot];
    if (!checkpoint) {
      this.lines.fill(0);
      this.score.fill(0);
      this.lastTouch.fill(0);
      this.commits.fill(0);
      this.fixes.fill(0);
      this.index = 0;
      return;
    }
    this.lines.set(checkpoint.lines);
    this.score.set(checkpoint.score);
    this.lastTouch.set(checkpoint.lastTouch);
    this.commits.set(checkpoint.commits);
    this.fixes.set(checkpoint.fixes);
    this.index = checkpoint.index;
  }
}

/**
 * Picks a heat saturation that suits the repository: the busiest ~2% of files
 * at HEAD end up around 90% heat, so a sleepy repo and a frantic one both use
 * the whole colour ramp.
 */
export function tuneSaturation(timeline: Timeline, options: ReplayOptions = {}): number {
  const replay = new TimelineReplay(timeline, options).seek(timeline.commits.length);
  const scores: number[] = [];
  for (let path = 0; path < timeline.paths.length; path++) {
    if (replay.lines[path]! > 0) scores.push(replay.churn(path));
  }
  if (scores.length === 0) return 3;
  scores.sort((a, b) => a - b);
  const busy = scores[Math.floor(0.98 * (scores.length - 1))]!;
  // 1 - exp(-2.3) is roughly 0.9.
  return Math.min(60, Math.max(3, busy / 2.3));
}
