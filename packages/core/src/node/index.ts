/** Node-only entry point: filesystem scanning, git access and WASM parsing. */
export { analyzeRepo, type AnalyzeOptions, type AnalyzePhase } from './analyzeRepo.js';
export { scanFiles, type ScanResult } from './scan.js';
export { git, isGitRepo, listGitFiles, readHead, readTimeline, type HeadInfo } from './git.js';
export { analyzeSource, getParser } from './treeSitter.js';
