import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { shouldIgnore } from '../ignore.js';
import { detectLanguage, grammarFor } from '../languages.js';
import { countLines, looksBinary } from '../metrics/lines.js';
import { buildRepoIndex, isResolverConfig } from '../resolve/repoIndex.js';
import { resolveImport } from '../resolve/resolve.js';
import { indexPaths } from '../timeline/history.js';
import { TimelineReplay } from '../timeline/replay.js';
import type { FileNode, ImportRef, Snapshot, Timeline } from '../types.js';
import { readHead, readTimeline } from './git.js';
import { scanFiles } from './scan.js';
import { analyzeSource } from './treeSitter.js';

export type AnalyzePhase = 'scan' | 'parse' | 'resolve' | 'history';

export interface AnalyzeOptions {
  /** Files larger than this are left out of the city entirely. */
  maxFileBytes?: number;
  /** Files larger than this are counted but not parsed. */
  maxParseBytes?: number;
  /** Skip git history (single synthetic commit instead). */
  history?: boolean;
  onProgress?: (phase: AnalyzePhase, done: number, total: number) => void;
}

const READ_BATCH = 48;

/**
 * Reconciles the replayed history with what is actually on disk.
 *
 * Untracked files get one synthetic commit at the end. Tracked files whose
 * replayed line count drifted to zero (changes made inside merge commits are
 * not part of ) are corrected in the last real commit
 * instead, so a clean clone never shows phantom uncommitted work.
 */
function addWorkingTree(timeline: Timeline, files: FileNode[], now: number): void {
  const index = indexPaths(timeline);
  const replay = new TimelineReplay(timeline).seek(timeline.commits.length);
  const untracked: number[] = [];
  const drifted: number[] = [];
  for (const file of files) {
    if (file.lines === 0) continue;
    const known = index.get(file.path);
    if (known === undefined) {
      untracked.push(timeline.paths.length, file.lines, 0);
      timeline.paths.push(file.path);
    } else if (replay.lines[known]! <= 0) {
      drifted.push(known, file.lines, 0);
    }
  }

  const last = timeline.commits[timeline.commits.length - 1];
  if (last) last.changes.push(...drifted);
  else untracked.push(...drifted);

  if (untracked.length === 0) return;
  timeline.authors.push('working tree');
  timeline.commits.push({
    hash: 'worktree',
    time: Math.floor(now / 1000),
    author: timeline.authors.length - 1,
    subject: timeline.commits.length === 0 ? 'Files on disk' : 'Uncommitted files',
    fix: false,
    changes: untracked,
  });
}

/**
 * Analyses a directory end to end: scans files, parses the supported
 * languages, resolves imports into a dependency graph and mines git history.
 */
export async function analyzeRepo(
  rootDir: string,
  options: AnalyzeOptions = {},
): Promise<Snapshot> {
  const root = resolve(rootDir);
  const maxFileBytes = options.maxFileBytes ?? 1_000_000;
  const maxParseBytes = options.maxParseBytes ?? 400_000;
  const progress = options.onProgress ?? (() => {});
  const now = Date.now();

  progress('scan', 0, 1);
  const scan = await scanFiles(root);
  const candidates = scan.paths.filter((path) => !shouldIgnore(path));
  progress('scan', 1, 1);

  const configs = new Map<string, string>();
  const files: FileNode[] = [];
  const rawImports: ImportRef[][] = [];

  for (let start = 0; start < candidates.length; start += READ_BATCH) {
    const batch = candidates.slice(start, start + READ_BATCH);
    const buffers = await Promise.all(
      // Unreadable entries (submodules, broken symlinks, deleted files) are skipped.
      batch.map((path) => readFile(join(root, path)).catch(() => null)),
    );
    for (let i = 0; i < batch.length; i++) {
      const path = batch[i]!;
      const buffer = buffers[i];
      if (!buffer || buffer.length > maxFileBytes || looksBinary(buffer)) continue;
      const content = buffer.toString('utf8');
      if (isResolverConfig(path)) configs.set(path, content);

      const { lines, sloc } = countLines(content);
      const file: FileNode = {
        id: files.length,
        path,
        language: detectLanguage(path),
        lines,
        sloc,
        complexity: 0,
        functions: 0,
        imports: [],
        importedBy: [],
        external: [],
      };
      let imports: ImportRef[] = [];
      const grammar = grammarFor(path);
      if (grammar && buffer.length <= maxParseBytes) {
        try {
          const analysis = await analyzeSource(content, grammar);
          file.complexity = analysis.complexity;
          file.functions = analysis.functions;
          imports = analysis.imports;
        } catch {
          // A file the grammar chokes on still gets a building, just no edges.
        }
      }
      files.push(file);
      rawImports.push(imports);
    }
    progress('parse', Math.min(start + READ_BATCH, candidates.length), candidates.length);
  }

  const index = buildRepoIndex(
    files.map((file) => file.path),
    configs,
  );
  const idOf = new Map(files.map((file) => [file.path, file.id]));
  for (const file of files) {
    const targets = new Set<number>();
    const external = new Set<string>();
    for (const ref of rawImports[file.id]!) {
      const resolution = resolveImport(index, file.path, file.language, ref);
      for (const path of resolution.internal) {
        const id = idOf.get(path);
        if (id !== undefined && id !== file.id) targets.add(id);
      }
      if (resolution.external) external.add(resolution.external);
    }
    file.imports = [...targets].sort((a, b) => a - b);
    file.external = [...external].sort();
  }
  for (const file of files) for (const id of file.imports) files[id]!.importedBy.push(file.id);
  progress('resolve', files.length, files.length);

  progress('history', 0, 1);
  const wantHistory = scan.git && options.history !== false;
  const timeline: Timeline = wantHistory
    ? await readTimeline(root)
    : { paths: [], authors: [], commits: [] };
  addWorkingTree(timeline, files, now);
  progress('history', 1, 1);

  const head = scan.git ? await readHead(root) : { head: null, branch: null, slug: null };
  return {
    schema: 1,
    repo: {
      name: head.slug ?? basename(root),
      branch: head.branch,
      head: head.head,
      generatedAt: now,
      git: scan.git,
    },
    files,
    timeline,
  };
}
