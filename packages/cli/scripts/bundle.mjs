// Bundles the CLI and @kobi-xray/core into a single dist/bin.js so the published
// package has no dependency on the (unpublished) workspace packages. The two
// tree-sitter packages stay external: web-tree-sitter ships a .wasm runtime and
// the grammars are resolved from node_modules at run time.
import { build } from 'esbuild';
import { chmodSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
rmSync(join(root, 'dist'), { recursive: true, force: true });

await build({
  // server.js is a second entry so the marketing scripts can serve a snapshot.
  entryPoints: [join(root, 'src', 'bin.ts'), join(root, 'src', 'server.ts')],
  outdir: join(root, 'dist'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external: ['web-tree-sitter', 'tree-sitter-wasms'],
  logLevel: 'info',
});
chmodSync(join(root, 'dist', 'bin.js'), 0o755);
