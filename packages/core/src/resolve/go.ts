import { join } from '../paths.js';
import type { RepoIndex } from './repoIndex.js';
import type { Resolution } from './resolve.js';

/**
 * Go imports name a package (a directory), so an import fans out to every
 * non-test file of that package.
 */
export function resolveGo(index: RepoIndex, spec: string): Resolution {
  for (const { name, dir } of index.goModules) {
    if (spec !== name && !spec.startsWith(name + '/')) continue;
    const packageDir = join(dir, spec.slice(name.length));
    if (packageDir === null) return { internal: [] };
    const files = index.byDir.get(packageDir) ?? [];
    return {
      internal: files.filter((file) => file.endsWith('.go') && !file.endsWith('_test.go')),
    };
  }
  return { internal: [], external: spec };
}
