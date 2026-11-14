import { dirname, join } from '../paths.js';
import { isInside, type RepoIndex } from './repoIndex.js';
import type { Resolution } from './resolve.js';

const EXTENSIONS = ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.json'];

/** ESM TypeScript writes `./a.js` for a file that is `./a.ts` on disk. */
const SOURCE_FOR: Record<string, string[]> = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts'],
};

function tryFile(index: RepoIndex, base: string | null): string | null {
  if (base === null) return null;
  if (index.files.has(base)) return base;
  for (const [emitted, sources] of Object.entries(SOURCE_FOR)) {
    if (!base.endsWith(emitted)) continue;
    const bare = base.slice(0, -emitted.length);
    for (const ext of sources) if (index.files.has(bare + ext)) return bare + ext;
  }
  for (const ext of EXTENSIONS) if (index.files.has(base + ext)) return base + ext;
  for (const ext of EXTENSIONS) {
    const candidate = base === '' ? `index${ext}` : `${base}/index${ext}`;
    if (index.files.has(candidate)) return candidate;
  }
  return null;
}

function viaTsConfig(index: RepoIndex, from: string, spec: string): string | null {
  for (const config of index.tsconfigs) {
    if (!isInside(from, config.dir)) continue;
    for (const { pattern, targets } of config.paths) {
      const star = pattern.indexOf('*');
      let captured: string | null = null;
      if (star === -1) {
        if (spec === pattern) captured = '';
      } else {
        const head = pattern.slice(0, star);
        const tail = pattern.slice(star + 1);
        if (
          spec.length >= head.length + tail.length &&
          spec.startsWith(head) &&
          spec.endsWith(tail)
        ) {
          captured = spec.slice(head.length, spec.length - tail.length);
        }
      }
      if (captured === null) continue;
      for (const target of targets) {
        const hit = tryFile(index, target.replace('*', captured));
        if (hit) return hit;
      }
    }
    if (config.baseUrl !== null) {
      const hit = tryFile(index, join(config.baseUrl, spec));
      if (hit) return hit;
    }
  }
  return null;
}

function viaWorkspace(index: RepoIndex, spec: string): string | null {
  for (const { name, dir } of index.packages) {
    if (spec === name) {
      return (
        tryFile(index, `${dir}/src/index`) ??
        tryFile(index, `${dir}/index`) ??
        tryFile(index, `${dir}/src/main`)
      );
    }
    if (spec.startsWith(name + '/')) {
      const rest = spec.slice(name.length + 1);
      return tryFile(index, `${dir}/${rest}`) ?? tryFile(index, `${dir}/src/${rest}`);
    }
  }
  return null;
}

/** `@scope/pkg/deep` → `@scope/pkg`, `lodash/fp` → `lodash`. */
export function packageName(spec: string): string {
  const parts = spec.split('/');
  if (spec.startsWith('@') && parts.length > 1) return `${parts[0]}/${parts[1]}`;
  return parts[0]!;
}

export function resolveJavaScript(index: RepoIndex, from: string, spec: string): Resolution {
  // Strip bundler query suffixes such as `./icon.svg?react`.
  const clean = spec.replace(/[?#].*$/, '');
  if (clean.startsWith('.')) {
    const hit = tryFile(index, join(dirname(from), clean));
    return { internal: hit ? [hit] : [] };
  }
  if (clean.startsWith('/')) return { internal: [] };
  const hit = viaTsConfig(index, from, clean) ?? viaWorkspace(index, clean);
  if (hit) return { internal: [hit] };
  return { internal: [], external: clean.startsWith('node:') ? clean : packageName(clean) };
}
