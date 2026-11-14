import type { Timeline } from '../types.js';

export interface FileHistory {
  /** Indices into `timeline.commits`, oldest first. */
  commits: number[];
  fixes: number;
  added: number;
  deleted: number;
  /** Author names with their commit counts, most active first. */
  authors: Array<{ name: string; commits: number }>;
  /** Unix seconds; 0 when the path was never touched. */
  firstSeen: number;
  lastTouch: number;
}

/** Path → index lookup for a timeline. */
export function indexPaths(timeline: Timeline): Map<string, number> {
  const index = new Map<string, number>();
  timeline.paths.forEach((path, i) => index.set(path, i));
  return index;
}

/**
 * Collects the history of one or more paths, up to (and excluding) commit
 * `until`. Pass several paths to get the combined history of a directory.
 */
export function fileHistory(
  timeline: Timeline,
  paths: number | ReadonlySet<number>,
  until: number = timeline.commits.length,
): FileHistory {
  const wanted = typeof paths === 'number' ? new Set([paths]) : paths;
  const commits: number[] = [];
  const byAuthor = new Map<number, number>();
  let fixes = 0;
  let added = 0;
  let deleted = 0;

  const end = Math.min(until, timeline.commits.length);
  for (let c = 0; c < end; c++) {
    const commit = timeline.commits[c]!;
    const { changes } = commit;
    let touched = false;
    for (let i = 0; i < changes.length; i += 3) {
      if (!wanted.has(changes[i]!)) continue;
      touched = true;
      added += changes[i + 1]!;
      deleted += changes[i + 2]!;
    }
    if (!touched) continue;
    commits.push(c);
    if (commit.fix) fixes++;
    byAuthor.set(commit.author, (byAuthor.get(commit.author) ?? 0) + 1);
  }

  const authors = [...byAuthor]
    .map(([author, count]) => ({ name: timeline.authors[author] ?? 'unknown', commits: count }))
    .sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name));

  return {
    commits,
    fixes,
    added,
    deleted,
    authors,
    firstSeen: commits.length ? timeline.commits[commits[0]!]!.time : 0,
    lastTouch: commits.length ? timeline.commits[commits[commits.length - 1]!]!.time : 0,
  };
}
