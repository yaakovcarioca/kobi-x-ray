import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { shouldIgnore } from '../ignore.js';
import { isGitRepo, listGitFiles } from './git.js';

/** Recursive directory walk for folders that are not git repositories. */
async function walk(root: string): Promise<string[]> {
  const out: string[] = [];
  const pending = [''];
  while (pending.length > 0) {
    const dir = pending.pop()!;
    const entries = await readdir(join(root, dir), { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const path = dir === '' ? entry.name : `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        // Probe with a fake child so directory-level ignore rules apply early.
        if (!shouldIgnore(`${path}/x`)) pending.push(path);
      } else if (entry.isFile()) {
        out.push(path);
      }
    }
  }
  return out.sort();
}

export interface ScanResult {
  git: boolean;
  /** Repo-relative POSIX paths, before the ignore filter. */
  paths: string[];
}

/** Lists candidate files, honouring .gitignore when the folder is a git repository. */
export async function scanFiles(root: string): Promise<ScanResult> {
  if (await isGitRepo(root)) return { git: true, paths: await listGitFiles(root) };
  return { git: false, paths: await walk(root) };
}
