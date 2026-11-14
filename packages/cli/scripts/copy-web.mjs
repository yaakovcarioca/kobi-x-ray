// Copies the built web viewer into the CLI package so `npx kobi-xray` can serve it.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', '..', '..', 'apps', 'web', 'dist');
const target = join(here, '..', 'web');

if (!existsSync(source)) {
  console.error('apps/web/dist not found. Build the web app first: npm run build -w @kobi-xray/web');
  process.exit(1);
}
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log('Copied web viewer into packages/cli/web');
