import { basename, extname } from './paths.js';

/** Directories that never contain first-party source worth visualising. */
const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'bower_components',
  'vendor',
  'third_party',
  'dist',
  'build',
  'out',
  'target',
  'coverage',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.turbo',
  '.cache',
  '.venv',
  'venv',
  '__pycache__',
  '.mypy_cache',
  '.pytest_cache',
  '.idea',
  '.vscode',
]);

/** Lockfiles are generated, huge and would dwarf every real building. */
const IGNORED_FILES = new Set([
  'package-lock.json',
  'npm-shrinkwrap.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
  'Cargo.lock',
  'go.sum',
  'poetry.lock',
  'uv.lock',
  'Pipfile.lock',
  'composer.lock',
  'Gemfile.lock',
  'flake.lock',
  '.DS_Store',
]);

const BINARY_EXTENSIONS = new Set([
  // images
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.bmp',
  '.tiff',
  '.psd',
  '.icns',
  // fonts
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  // media
  '.mp3',
  '.mp4',
  '.mov',
  '.avi',
  '.webm',
  '.wav',
  '.ogg',
  '.flac',
  // archives & binaries
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.bz2',
  '.xz',
  '.7z',
  '.rar',
  '.jar',
  '.war',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.o',
  '.a',
  '.class',
  '.pyc',
  '.wasm',
  // documents & data blobs
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.sqlite',
  '.db',
  '.parquet',
  // generated
  '.map',
  '.snap',
  '.lock',
]);

const GENERATED_SUFFIXES = [
  '.min.js',
  '.min.css',
  '.min.mjs',
  '.bundle.js',
  '.generated.ts',
  '.pb.go',
];

/** True when a repo-relative POSIX path should be left out of the city. */
export function shouldIgnore(path: string): boolean {
  const segments = path.split('/');
  for (let i = 0; i < segments.length - 1; i++) {
    if (IGNORED_DIRS.has(segments[i]!)) return true;
  }
  const base = basename(path);
  if (IGNORED_FILES.has(base)) return true;
  if (BINARY_EXTENSIONS.has(extname(path))) return true;
  const lower = base.toLowerCase();
  return GENERATED_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}
