#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeRepo } from '@kobi-xray/core/node';
import { parseArgs, USAGE, UsageError } from './args.js';
import { openBrowser } from './open.js';
import { createProgress } from './progress.js';
import { startServer } from './server.js';

const here = dirname(fileURLToPath(import.meta.url));

function version(): string {
  const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')) as {
    version: string;
  };
  return pkg.version;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(USAGE);
    return;
  }
  if (options.version) {
    process.stdout.write(`${version()}\n`);
    return;
  }

  const root = resolve(options.dir);
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new UsageError(`Not a directory: ${root}`);
  }

  const started = Date.now();
  process.stderr.write(`\n  kobi-xray ${version()}\n\n`);
  const progress = createProgress();
  const snapshot = await analyzeRepo(root, {
    history: options.history,
    onProgress: (phase, done, total) => progress.update(phase, done, total),
  });
  progress.done();

  const edges = snapshot.files.reduce((sum, file) => sum + file.imports.length, 0);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  process.stderr.write(
    `  ${snapshot.repo.name}: ${snapshot.files.length} files, ${edges} imports, ` +
      `${snapshot.timeline.commits.length} commits in ${seconds}s\n`,
  );
  if (!snapshot.repo.git) {
    process.stderr.write('  Not a git repository: time travel and heat are unavailable.\n');
  }

  const json = JSON.stringify(snapshot);
  if (options.json) {
    await writeFile(resolve(options.json), json);
    process.stderr.write(`  Snapshot written to ${options.json}\n\n`);
    return;
  }

  const viewer = await startServer(join(here, '..', 'web'), json, options.port);
  process.stderr.write(`\n  City is live at ${viewer.url}\n  Press Ctrl+C to stop.\n\n`);
  if (options.open) openBrowser(viewer.url);
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) {
    process.stderr.write(`${error.message}\n\n${USAGE}`);
    process.exit(2);
  }
  process.stderr.write(
    `\n${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exit(1);
});
