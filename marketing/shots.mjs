// Captures real screenshots of the viewer for the landing page and the social cards.
//   node marketing/shots.mjs <snapshot.json>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, openViewer, OUT, pathIndex, serveSnapshot, settle, store } from './lib/studio.mjs';

const snapshotPath = process.argv[2];
if (!snapshotPath) {
  console.error('Usage: node marketing/shots.mjs <snapshot.json>');
  process.exit(1);
}

const RAW = join(OUT, 'raw');
mkdirSync(RAW, { recursive: true });

const viewer = await serveSnapshot(snapshotPath);
const browser = await launch();

async function shoot(page, name) {
  await page.screenshot({ path: join(RAW, `${name}.png`) });
  console.log(`  ${name}.png`);
}

try {
  // Desktop frames, 2× for crisp text when scaled into cards.
  const page = await openViewer(browser, viewer.url, {
    width: 1280,
    height: 800,
    deviceScaleFactor: 2,
  });

  const facts = await page.evaluate(() => {
    const { model } = window.kobiXray.store.getState();
    const { commits, authors } = model.snapshot.timeline;
    return {
      repo: model.snapshot.repo.name,
      files: model.files.length,
      commits: commits.length,
      authors: authors.length,
      imports: model.files.reduce((sum, file) => sum + file.imports.length, 0),
      firstCommit: commits[0].time,
      lastCommit: commits[commits.length - 1].time,
    };
  });
  writeFileSync(join(OUT, 'facts.json'), JSON.stringify(facts, null, 2));
  console.log(`  ${facts.repo}: ${facts.files} files, ${facts.commits} commits`);

  await shoot(page, 'city-heat');

  // Time travel: three moments of the same city.
  const moments = [];
  for (const [name, share] of [
    ['time-1', 0.15],
    ['time-2', 0.45],
    ['time-3', 1],
  ]) {
    await store(page, 'setPosition', Math.round(facts.commits * share));
    await settle(page);
    await shoot(page, name);
    // What the top bar and timeline say at this moment, for captions.
    moments.push(
      await page.evaluate(() => ({
        commit: window.kobiXray.store.getState().commitIndex,
        date: document.querySelector('.timeline-date')?.textContent ?? '',
        size: document.querySelector('.topbar-stats')?.textContent ?? '',
      })),
    );
  }
  writeFileSync(join(OUT, 'facts.json'), JSON.stringify({ ...facts, moments }, null, 2));

  // The riskiest file at HEAD, with its arcs and X-Ray panel.
  const hottest = await page.evaluate(() =>
    document
      .querySelector('.hotspot .hotspot-dir')
      .textContent.concat(document.querySelector('.hotspot .hotspot-name').textContent),
  );
  const target = await pathIndex(page, hottest);
  await store(page, 'select', target);
  await settle(page, 240);
  await shoot(page, 'city-blast');
  writeFileSync(
    join(OUT, 'context.md'),
    await page.evaluate(async () => {
      const { model, selected } = window.kobiXray.store.getState();
      const button = document.querySelector('.copy-context');
      // The Markdown the "Copy context" button would put on the clipboard.
      let text = '';
      navigator.clipboard.writeText = async (value) => void (text = value);
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      return text || `selected ${model.paths[selected]}`;
    }),
  );
  await store(page, 'select', null);

  for (const mode of ['complexity', 'language']) {
    await store(page, 'setColorMode', mode);
    await settle(page);
    await shoot(page, `city-${mode}`);
  }
  await page.close();
} finally {
  await browser.close();
  viewer.server.close();
}
