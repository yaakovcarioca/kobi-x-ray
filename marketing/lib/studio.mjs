// Shared plumbing for the marketing captures: serves a snapshot through the
// real viewer, drives it in headless Chrome and keeps time under our control.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from '../../packages/cli/dist/server.js';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..', '..');
export const OUT = join(ROOT, 'marketing', 'out');

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

export function findBrowser() {
  const found = BROWSERS.find((path) => path && existsSync(path));
  if (!found) throw new Error('No Chrome or Edge found. Set CHROME_PATH.');
  return found;
}

export function launch() {
  return puppeteer.launch({
    executablePath: findBrowser(),
    headless: true,
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
  });
}

/** Serves the built viewer with the given snapshot file on a free port. */
export async function serveSnapshot(snapshotPath, port = 4790) {
  const webDir = join(ROOT, 'packages', 'cli', 'web');
  if (!existsSync(webDir)) throw new Error('Viewer not built. Run `npm run build` first.');
  return startServer(webDir, readFileSync(snapshotPath, 'utf8'), port);
}

/**
 * Replaces the page clock with one that only moves when `tick` is called, so
 * every animation (camera, easing, dashes) advances by an exact amount per
 * captured frame instead of by however long a screenshot happened to take.
 */
export async function installVirtualClock(page) {
  await page.evaluateOnNewDocument(() => {
    let now = 0;
    let nextId = 0;
    const callbacks = new Map();
    performance.now = () => now;
    window.requestAnimationFrame = (callback) => {
      callbacks.set(++nextId, callback);
      return nextId;
    };
    window.cancelAnimationFrame = (id) => callbacks.delete(id);
    window.__tick = (ms) => {
      now += ms;
      const due = [...callbacks.values()];
      callbacks.clear();
      for (const callback of due) callback(now);
    };
  });
}

/** Advances the virtual clock by `frames` steps of `ms` milliseconds. */
export function tick(page, frames = 1, ms = 1000 / 30) {
  return page.evaluate(
    (count, step) => {
      for (let i = 0; i < count; i++) window.__tick(step);
    },
    frames,
    ms,
  );
}

/** Opens the viewer and waits until the city is loaded and has settled. */
export async function openViewer(browser, url, viewport, query = '') {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await installVirtualClock(page);
  await page.goto(`${url}/${query}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.kobiXray?.store.getState().status === 'ready', {
    timeout: 60_000,
  });
  await settle(page);
  return page;
}

/** Lets height and colour easing finish. */
export async function settle(page, frames = 150) {
  // Let React commit pending state before the frame loop runs.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 60)));
  await tick(page, frames);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 60)));
}

/** Runs a store action by name inside the page. */
export function store(page, action, ...args) {
  return page.evaluate(
    (name, params) => window.kobiXray.store.getState()[name](...params),
    action,
    args,
  );
}

/** Path index of a file by its repo-relative path. */
export function pathIndex(page, filePath) {
  return page.evaluate(
    (target) => window.kobiXray.store.getState().model.paths.indexOf(target),
    filePath,
  );
}
