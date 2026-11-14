import { spawn } from 'node:child_process';
import { GIT_LOG_ARGS, parseGitLog } from '../git/parseLog.js';
import type { Timeline } from '../types.js';

/** Runs git in `cwd` and resolves with stdout. Rejects on a non-zero exit. */
export function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => out.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => err.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(out).toString('utf8'));
      else
        reject(
          new Error(
            `git ${args[0]} failed (${code}): ${Buffer.concat(err).toString('utf8').trim()}`,
          ),
        );
    });
  });
}

const tryGit = (cwd: string, args: string[]) =>
  git(cwd, args).then(
    (out) => out.trim(),
    () => null,
  );

export async function isGitRepo(root: string): Promise<boolean> {
  return (await tryGit(root, ['rev-parse', '--is-inside-work-tree'])) === 'true';
}

export interface HeadInfo {
  head: string | null;
  branch: string | null;
  /** `owner/name` derived from the origin remote, when there is one. */
  slug: string | null;
}

export async function readHead(root: string): Promise<HeadInfo> {
  const [head, branch, remote] = await Promise.all([
    tryGit(root, ['rev-parse', '--short', 'HEAD']),
    tryGit(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
    tryGit(root, ['remote', 'get-url', 'origin']),
  ]);
  const slug = remote ? (/[:/]([^/:]+\/[^/]+?)(?:\.git)?\/?$/.exec(remote)?.[1] ?? null) : null;
  return { head, branch: branch === 'HEAD' ? null : branch, slug };
}

/** Tracked plus untracked-but-not-ignored files, relative to `root`. */
export async function listGitFiles(root: string): Promise<string[]> {
  const out = await git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
  return [...new Set(out.split('\0').filter(Boolean))];
}

/** Full history of the current branch. Empty for repositories without commits. */
export async function readTimeline(root: string): Promise<Timeline> {
  try {
    return parseGitLog(await git(root, GIT_LOG_ARGS));
  } catch {
    return { paths: [], authors: [], commits: [] };
  }
}
