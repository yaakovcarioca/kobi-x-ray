import { basename, dirname, join } from '../paths.js';
import { parseJsonc } from './jsonc.js';

export interface TsConfig {
  dir: string;
  /** Repo-relative directory that bare specifiers resolve against, if any. */
  baseUrl: string | null;
  /** `paths` entries, each target already made repo-relative. */
  paths: Array<{ pattern: string; targets: string[] }>;
}

export interface NamedDir {
  name: string;
  dir: string;
}

/** Lookup tables shared by every language resolver. */
export interface RepoIndex {
  files: ReadonlySet<string>;
  /** Directory → files directly inside it. */
  byDir: ReadonlyMap<string, string[]>;
  /** Deepest directory first. */
  tsconfigs: TsConfig[];
  /** Workspace packages keyed by their package.json name. */
  packages: NamedDir[];
  /** go.mod module paths, longest first. */
  goModules: NamedDir[];
  /** Cargo crates, names normalised to use underscores. */
  rustCrates: NamedDir[];
  /** Python module path suffix (`pkg/mod`) → matching module bases. */
  pyModules: ReadonlyMap<string, string[]>;
}

/** Config files the resolvers want to read, by basename. */
export function isResolverConfig(path: string): boolean {
  const base = basename(path);
  return (
    base === 'package.json' ||
    base === 'go.mod' ||
    base === 'Cargo.toml' ||
    base === 'jsconfig.json' ||
    /^tsconfig(\..+)?\.json$/.test(base)
  );
}

function readTsConfig(path: string, text: string): TsConfig | null {
  const json = parseJsonc(text) as { compilerOptions?: Record<string, unknown> } | null;
  const options = json?.compilerOptions;
  if (!options) return null;
  const dir = dirname(path);
  const rawBase = typeof options.baseUrl === 'string' ? options.baseUrl : null;
  const baseUrl = rawBase === null ? null : join(dir, rawBase);
  const paths: TsConfig['paths'] = [];
  if (options.paths && typeof options.paths === 'object') {
    // Without baseUrl, `paths` targets are relative to the tsconfig itself.
    const root = baseUrl ?? dir;
    for (const [pattern, targets] of Object.entries(options.paths as Record<string, unknown>)) {
      if (!Array.isArray(targets)) continue;
      const resolved = targets
        .filter((target): target is string => typeof target === 'string')
        .map((target) => join(root, target))
        .filter((target): target is string => target !== null);
      if (resolved.length) paths.push({ pattern, targets: resolved });
    }
  }
  if (baseUrl === null && paths.length === 0) return null;
  return { dir, baseUrl, paths };
}

function indexPython(paths: Iterable<string>): Map<string, string[]> {
  const modules = new Map<string, string[]>();
  for (const path of paths) {
    if (!path.endsWith('.py') && !path.endsWith('.pyi')) continue;
    let base = path.slice(0, path.lastIndexOf('.'));
    if (base.endsWith('/__init__')) base = base.slice(0, -'/__init__'.length);
    else if (base === '__init__') continue;
    const segments = base.split('/');
    for (let i = segments.length - 1; i >= 0; i--) {
      const key = segments.slice(i).join('/');
      const list = modules.get(key);
      if (list) {
        if (!list.includes(base)) list.push(base);
      } else {
        modules.set(key, [base]);
      }
    }
  }
  return modules;
}

/**
 * Builds the lookup tables from the list of repository files and the contents
 * of the config files (see {@link isResolverConfig}).
 */
export function buildRepoIndex(paths: string[], configs: ReadonlyMap<string, string>): RepoIndex {
  const files = new Set(paths);
  const byDir = new Map<string, string[]>();
  for (const path of paths) {
    const dir = dirname(path);
    const list = byDir.get(dir);
    if (list) list.push(path);
    else byDir.set(dir, [path]);
  }

  const tsconfigs: TsConfig[] = [];
  const packages: NamedDir[] = [];
  const goModules: NamedDir[] = [];
  const rustCrates: NamedDir[] = [];

  for (const [path, text] of configs) {
    const base = basename(path);
    const dir = dirname(path);
    if (base === 'package.json') {
      const json = parseJsonc(text) as { name?: unknown } | null;
      if (json && typeof json.name === 'string' && dir !== '') packages.push({ name: json.name, dir });
    } else if (base === 'go.mod') {
      const match = /^module\s+(\S+)/m.exec(text);
      if (match) goModules.push({ name: match[1]!, dir });
    } else if (base === 'Cargo.toml') {
      const match = /\[package\][^[]*?\bname\s*=\s*"([^"]+)"/.exec(text);
      if (match) rustCrates.push({ name: match[1]!.replace(/-/g, '_'), dir });
    } else {
      const config = readTsConfig(path, text);
      if (config) tsconfigs.push(config);
    }
  }

  tsconfigs.sort((a, b) => b.dir.length - a.dir.length);
  packages.sort((a, b) => b.name.length - a.name.length);
  goModules.sort((a, b) => b.name.length - a.name.length);
  rustCrates.sort((a, b) => b.dir.length - a.dir.length);

  return { files, byDir, tsconfigs, packages, goModules, rustCrates, pyModules: indexPython(paths) };
}

/** True when `path` is inside `dir` (the root directory `''` contains everything). */
export function isInside(path: string, dir: string): boolean {
  return dir === '' || path.startsWith(dir + '/');
}
