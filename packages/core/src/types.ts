/** Languages that get full AST analysis. Everything else is `other`. */
export type Language = 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'other';

/** A file that exists at HEAD (or in the working tree), with static analysis attached. */
export interface FileNode {
  /** Index of this file inside `Snapshot.files`. */
  id: number;
  /** Repo-relative POSIX path. */
  path: string;
  language: Language;
  /** Total line count, matching how git counts lines. */
  lines: number;
  /** Non-blank lines. */
  sloc: number;
  /** Cyclomatic complexity estimate for the whole file. 0 when not analysed. */
  complexity: number;
  /** Number of function-like declarations. */
  functions: number;
  /** Ids of the files this file imports (fan-out). */
  imports: number[];
  /** Ids of the files that import this file (fan-in). */
  importedBy: number[];
  /** External packages / modules this file depends on. */
  external: string[];
}

export interface TimelineCommit {
  hash: string;
  /** Author time, unix seconds. */
  time: number;
  /** Index into `Timeline.authors`. */
  author: number;
  subject: string;
  /** Whether the subject looks like a bug fix. */
  fix: boolean;
  /** Flat triples: [pathIndex, added, deleted, pathIndex, added, deleted, ...]. */
  changes: number[];
}

export interface Timeline {
  /** Every path that ever existed (and passed the ignore filter). */
  paths: string[];
  authors: string[];
  /** Oldest first. */
  commits: TimelineCommit[];
}

export interface RepoInfo {
  name: string;
  branch: string | null;
  head: string | null;
  /** Unix milliseconds. */
  generatedAt: number;
  /** False when the directory is not a git repository. */
  git: boolean;
}

export interface Snapshot {
  schema: 1;
  repo: RepoInfo;
  files: FileNode[];
  timeline: Timeline;
}

/** One import statement before it is resolved to a file. */
export interface ImportRef {
  /** Module specifier as written (`./a`, `a.b`, `crate::a::b`, `fmt`). */
  spec: string;
  /** Python: number of leading dots. */
  level?: number;
  /** Python: names in `from x import a, b`. */
  names?: string[];
  /** Rust: `mod foo;` declarations. */
  mod?: boolean;
}

export interface FileAnalysis {
  imports: ImportRef[];
  complexity: number;
  functions: number;
}
