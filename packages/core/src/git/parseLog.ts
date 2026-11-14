import { shouldIgnore } from '../ignore.js';
import type { Timeline, TimelineCommit } from '../types.js';

/** Record and field separators used in the `git log` pretty format. */
export const COMMIT_MARK = '\x01';
export const FIELD_MARK = '\x1f';

/**
 * Arguments for `git log` that produce the stream {@link parseGitLog} expects:
 * oldest commit first, one numstat line per changed file, renames expanded
 * into delete + add so line counts stay per-path.
 */
export const GIT_LOG_ARGS = [
  '-c',
  'core.quotepath=off',
  'log',
  '--reverse',
  '--no-renames',
  '--numstat',
  '--date-order',
  `--format=${COMMIT_MARK}%H${FIELD_MARK}%at${FIELD_MARK}%aN${FIELD_MARK}%s`,
];

const FIX_PATTERN = /\b(fix(e[sd])?|bug(s|fix)?|hotfix|regression|revert(s|ed)?|crash(es)?)\b/i;

export function looksLikeFix(subject: string): boolean {
  return FIX_PATTERN.test(subject);
}

/**
 * Turns raw `git log --numstat` output into a compact timeline. Commits that
 * touch nothing we keep (merges, binary-only or ignored-only changes) are dropped.
 */
export function parseGitLog(
  raw: string,
  keep: (path: string) => boolean = (path) => !shouldIgnore(path),
): Timeline {
  const paths: string[] = [];
  const pathIndex = new Map<string, number>();
  const authors: string[] = [];
  const authorIndex = new Map<string, number>();
  const commits: TimelineCommit[] = [];
  const kept = new Map<string, boolean>();

  for (const chunk of raw.split(COMMIT_MARK)) {
    if (chunk.length === 0) continue;
    const headerEnd = chunk.indexOf('\n');
    const header = headerEnd === -1 ? chunk : chunk.slice(0, headerEnd);
    const [hash, time, author = 'unknown', subject = ''] = header.split(FIELD_MARK);
    if (!hash || !time) continue;

    const changes: number[] = [];
    if (headerEnd !== -1) {
      for (const line of chunk.slice(headerEnd + 1).split('\n')) {
        const firstTab = line.indexOf('\t');
        if (firstTab <= 0) continue;
        const secondTab = line.indexOf('\t', firstTab + 1);
        if (secondTab === -1) continue;
        const added = line.slice(0, firstTab);
        // Binary files report `-` for both counts.
        if (added === '-') continue;
        const path = line.slice(secondTab + 1).replace(/\r$/, '');

        let wanted = kept.get(path);
        if (wanted === undefined) {
          wanted = keep(path);
          kept.set(path, wanted);
        }
        if (!wanted) continue;

        let index = pathIndex.get(path);
        if (index === undefined) {
          index = paths.length;
          paths.push(path);
          pathIndex.set(path, index);
        }
        changes.push(index, Number(added), Number(line.slice(firstTab + 1, secondTab)));
      }
    }
    if (changes.length === 0) continue;

    let authorId = authorIndex.get(author);
    if (authorId === undefined) {
      authorId = authors.length;
      authors.push(author);
      authorIndex.set(author, authorId);
    }
    commits.push({
      hash: hash.slice(0, 12),
      time: Number(time),
      author: authorId,
      subject,
      fix: looksLikeFix(subject),
      changes,
    });
  }

  return { paths, authors, commits };
}
