/**
 * Isomorphic entry point: everything here runs in the browser as well as in
 * Node. Filesystem and git access live in `@kobi-xray/core/node`.
 */
export type * from './types.js';
export * from './paths.js';
export { detectLanguage, grammarFor, GRAMMARS } from './languages.js';
export { shouldIgnore } from './ignore.js';
export { countLines, looksBinary, type LineCount } from './metrics/lines.js';
export { analyzeTree } from './analyze/index.js';
export { buildRepoIndex, isResolverConfig, type RepoIndex } from './resolve/repoIndex.js';
export { resolveImport, type Resolution } from './resolve/resolve.js';
export { blastRadius, dependencyCone, type BlastRadius } from './graph/blast.js';
export { rankHotspots, riskScore, type Hotspot } from './graph/hotspots.js';
export { parseGitLog, looksLikeFix, GIT_LOG_ARGS } from './git/parseLog.js';
export { TimelineReplay, type ReplayOptions } from './timeline/replay.js';
export { fileHistory, indexPaths, type FileHistory } from './timeline/history.js';
export { squarify } from './layout/squarify.js';
export { layoutCity, type CityLayout, type District, type LayoutOptions } from './layout/city.js';
export {
  fileContextMarkdown,
  districtContextMarkdown,
  type ContextOptions,
} from './export/context.js';
