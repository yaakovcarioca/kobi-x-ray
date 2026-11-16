// Renders the social post images (1080×1350 PNG) from marketing/cards/card.html.
//   node marketing/cards.mjs
// Needs the raw screenshots first: node marketing/shots.mjs <snapshot.json>
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { launch, OUT, ROOT } from './lib/studio.mjs';

// `--lang en` renders the English set into posts-en/ (day-N-*.png).
const english = process.argv.includes('--lang') && process.argv[process.argv.indexOf('--lang') + 1] === 'en';
const { CARDS } = await import(english ? './cards/cards.en.js' : './cards/cards.js');
const SLUGS_EN = {
  capa: 'cover',
  'como-ler': 'how-to-read',
  'maquina-do-tempo': 'time-machine',
  'blast-radius': 'blast-radius',
  hotspots: 'hotspots',
  'contexto-ia': 'ai-context',
  'como-funciona': 'how-it-works',
};
const POSTS = join(OUT, english ? 'posts-en' : 'posts');
mkdirSync(POSTS, { recursive: true });

// ES modules do not load from file://, so the marketing folder is served locally.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const base = join(ROOT, 'marketing');
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try {
    const body = await readFile(join(base, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(4791, '127.0.0.1', resolve));

const browser = await launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  for (const [index, card] of CARDS.entries()) {
    await page.goto(`http://127.0.0.1:4791/cards/card.html?id=${card.id}${english ? '&lang=en' : ''}`, {
      waitUntil: 'networkidle0',
    });
    await page.evaluate(() => window.cardReady);
    const name = `${english ? 'day' : 'dia'}-${index + 1}-${(english && SLUGS_EN[card.id]) || card.id}.png`;
    await page.screenshot({ path: join(POSTS, name) });
    console.log(`  ${name}`);
  }
} finally {
  await browser.close();
  server.close();
}
