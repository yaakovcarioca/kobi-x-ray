// Renders the 1200×630 social preview (og.png) used by the landing page.
//   node marketing/og.mjs [output.png]
// Needs the raw screenshots first: node marketing/shots.mjs <snapshot.json>
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, OUT } from './lib/studio.mjs';

const output = process.argv[2] ?? join(OUT, 'og.png');
const city = readFileSync(join(OUT, 'raw', 'city-heat.png')).toString('base64');

const html = `<!doctype html><html><head><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #0b0e13;
    color: #e9eef4; font-family: 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif; }
  .scene { position: absolute; right: 0; top: 0; width: 760px; height: 630px; overflow: hidden; }
  .scene img { position: absolute; width: 1500px; left: -330px; top: -170px; }
  .fade { position: absolute; inset: 0; background:
    linear-gradient(90deg, #0b0e13 0%, #0b0e13 38%, rgb(11 14 19 / 0%) 72%),
    linear-gradient(0deg, #0b0e13 0%, rgb(11 14 19 / 0%) 22%); }
  .copy { position: absolute; left: 72px; top: 0; bottom: 0; width: 600px; display: flex;
    flex-direction: column; justify-content: center; gap: 26px; }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 30px; font-weight: 600; }
  .mark { display: flex; align-items: flex-end; gap: 4px; height: 34px; }
  .mark i { width: 10px; height: 17px; background: #4a5a6c; }
  .mark i:nth-child(2) { height: 34px; background: #e5484d; }
  .mark i:nth-child(3) { height: 24px; background: #e9a23b; }
  h1 { margin: 0; font-size: 70px; line-height: 1.04; letter-spacing: -0.03em; font-weight: 650; }
  p { margin: 0; font-size: 28px; line-height: 1.35; color: #95a2b3; }
  .cmd { align-self: flex-start; padding: 12px 22px; border: 2px solid #2f3b4b; border-radius: 12px;
    background: #11161d; font: 500 26px 'Cascadia Code', Consolas, monospace; color: #e9eef4; }
  .cmd b { color: #e9a23b; font-weight: 500; }
</style></head><body>
  <div class="scene"><img src="data:image/png;base64,${city}" alt="" /><div class="fade"></div></div>
  <div class="copy">
    <div class="brand"><span class="mark"><i></i><i></i><i></i></span>Kobi X-Ray</div>
    <h1>See your codebase as a city.</h1>
    <p>A 3D X-ray of any Git repository, with a time machine.</p>
    <div class="cmd"><b>$</b> npx kobi-xray</div>
  </div>
</body></html>`;

const browser = await launch();
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output });
  console.log(`  ${output}`);
} finally {
  await browser.close();
}
