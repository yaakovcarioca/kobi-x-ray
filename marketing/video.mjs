// Renders the launch video (1080×1350, 30 fps, ~32 s) by driving the real
// viewer frame by frame and piping the frames into ffmpeg.
//   node marketing/video.mjs <snapshot.json>
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import { launch, openViewer, OUT, pathIndex, serveSnapshot, store, tick } from './lib/studio.mjs';

const snapshotPath = process.argv[2];
if (!snapshotPath) {
  console.error('Usage: node marketing/video.mjs <snapshot.json>');
  process.exit(1);
}

// `--lang en` renders the English cut (kobi-xray-launch-en.mp4).
const langIndex = process.argv.indexOf('--lang');
const english = langIndex > 0 && process.argv[langIndex + 1] === 'en';
const COPY = {
  pt: {
    captions: [
      'Isto é o repositório do Vite.',
      'Cada arquivo é um prédio. Cada commit, um passo no tempo.',
      'Altura: linhas de código. Cor: onde o código mais muda.',
      'Clique em um arquivo e veja tudo o que pode quebrar.',
    ],
    tagline: 'Raio-X 3D com máquina do tempo para repositórios Git',
    footer: 'open source · roda na sua máquina',
    file: 'kobi-xray-lancamento.mp4',
  },
  en: {
    captions: [
      'This is the Vite repository.',
      'Every file is a building. Every commit, a step in time.',
      'Height: lines of code. Colour: where the code changes most.',
      'Click a file and see everything that can break.',
    ],
    tagline: '3D X-ray with time travel for Git repositories',
    footer: 'open source · runs on your machine',
    file: 'kobi-xray-launch-en.mp4',
  },
};
const copy = english ? COPY.en : COPY.pt;

const FPS = 30;
const seconds = (value) => Math.round(value * FPS);

/** The script: scene boundaries in frames, and the caption shown in each. */
const SCENES = {
  intro: [0, seconds(3)],
  travel: [seconds(3), seconds(20)],
  xray: [seconds(20), seconds(28)],
  outro: [seconds(28), seconds(32)],
};
const CAPTIONS = [
  { from: 0, to: seconds(3), text: copy.captions[0] },
  {
    from: seconds(3.4),
    to: seconds(11),
    text: copy.captions[1],
  },
  {
    from: seconds(11.4),
    to: seconds(20),
    text: copy.captions[2],
  },
  {
    from: seconds(20.4),
    to: seconds(28),
    text: copy.captions[3],
  },
];
const TOTAL = SCENES.outro[1];
const FADE = 10;

const OVERLAY_CSS = `
  .promo-caption {
    position: fixed; left: 0; right: 0; top: 44px; z-index: 40;
    padding: 22px 28px 60px;
    font: 650 31px/1.16 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif;
    letter-spacing: -0.02em; color: #fff; text-wrap: balance;
    background: linear-gradient(180deg, rgb(11 14 19 / 92%) 40%, transparent);
    pointer-events: none;
  }
  /* Keep the X-Ray panel short so the arcs stay visible above it. */
  .panel { max-height: 304px !important; overflow: hidden !important; }
  .panel .stats { display: none; }
  .panel .heat-row { margin-bottom: 0; }
  .promo-outro {
    position: fixed; inset: 0; z-index: 60; display: grid; place-content: center;
    justify-items: center; gap: 22px; background: #0b0e13; color: #fff; opacity: 0;
    font-family: 'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif;
  }
  .promo-mark { display: flex; align-items: flex-end; gap: 6px; height: 64px; }
  .promo-mark i { width: 18px; height: 32px; background: #4a5a6c; }
  .promo-mark i:nth-child(2) { height: 64px; background: #e5484d; }
  .promo-mark i:nth-child(3) { height: 46px; background: #e9a23b; }
  .promo-outro h1 { margin: 8px 0 0; font-size: 62px; font-weight: 650; letter-spacing: -0.03em; }
  .promo-outro p { margin: 0; font-size: 25px; color: #95a2b3; }
  .promo-outro code {
    margin-top: 14px; padding: 14px 26px; border: 2px solid #2f3b4b; border-radius: 12px;
    background: #11161d; font: 500 28px 'Cascadia Code', Consolas, monospace;
  }
  .promo-outro code b { color: #e9a23b; font-weight: 500; }
`;

const viewer = await serveSnapshot(snapshotPath);
const browser = await launch();
mkdirSync(OUT, { recursive: true });
const output = join(OUT, copy.file);

const ffmpeg = spawn(
  ffmpegPath,
  [
    '-y',
    '-loglevel',
    'error',
    '-f',
    'image2pipe',
    '-framerate',
    String(FPS),
    '-c:v',
    'mjpeg',
    '-i',
    '-',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '18',
    '-preset',
    'medium',
    '-movflags',
    '+faststart',
    output,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);
const encoded = new Promise((resolve, reject) => {
  ffmpeg.on('close', (code) =>
    code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
  );
});

try {
  // 720×900 CSS pixels at 1.5× gives 1080×1350 with comfortably large UI.
  const page = await openViewer(
    browser,
    viewer.url,
    { width: 720, height: 900, deviceScaleFactor: 1.5 },
    '?cinematic',
  );
  await page.addStyleTag({ content: OVERLAY_CSS });
  await page.evaluate((tagline, footer) => {
    const caption = document.createElement('div');
    caption.className = 'promo-caption';
    const outro = document.createElement('div');
    outro.className = 'promo-outro';
    outro.innerHTML =
      '<span class="promo-mark"><i></i><i></i><i></i></span><h1>Kobi X-Ray</h1>' +
      `<p>${tagline}</p>` +
      `<code><b>$</b> npx kobi-xray</code><p>${footer}</p>`;
    document.body.append(caption, outro);
    window.__promo = { caption, outro };
  }, copy.tagline, copy.footer);

  const commits = await page.evaluate(() => window.kobiXray.store.getState().model.commitCount);
  // The riskiest file at HEAD is the star of the X-Ray scene.
  const star = await pathIndex(
    page,
    await page.evaluate(
      () =>
        document.querySelector('.hotspot .hotspot-dir')?.textContent +
        document.querySelector('.hotspot .hotspot-name')?.textContent,
    ),
  );
  const fallbackStar = await page.evaluate(() => {
    const { model } = window.kobiXray.store.getState();
    let best = 0;
    model.files.forEach((file) => {
      if (file.importedBy.length > model.files[best].importedBy.length) best = file.id;
    });
    return model.pathOfFile[best];
  });

  const started = Date.now();
  for (let frame = 0; frame < TOTAL; frame++) {
    if (frame === SCENES.travel[0]) await store(page, 'setPosition', 0);
    if (frame >= SCENES.travel[0] && frame < SCENES.travel[1]) {
      // Ease in and out so the first commits and the arrival at HEAD can be read.
      const t = (frame - SCENES.travel[0]) / (SCENES.travel[1] - SCENES.travel[0] - 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      await store(page, 'setPosition', Math.round(commits * eased));
    }
    if (frame === SCENES.xray[0]) await store(page, 'select', star >= 0 ? star : fallbackStar);

    const caption = CAPTIONS.find((entry) => frame >= entry.from && frame < entry.to);
    const captionOpacity = caption
      ? Math.min(1, (frame - caption.from) / FADE, (caption.to - frame) / FADE)
      : 0;
    const outroOpacity = Math.min(1, Math.max(0, (frame - SCENES.outro[0]) / 14));
    await page.evaluate(
      (text, opacity, outro, ms) => {
        const { caption, outro: card } = window.__promo;
        if (text !== null) caption.textContent = text;
        caption.style.opacity = String(opacity);
        card.style.opacity = String(outro);
        window.__tick(ms);
      },
      caption ? caption.text : null,
      captionOpacity,
      outroOpacity,
      1000 / FPS,
    );
    // React commits state through the scheduler; give it a turn before the shot.
    if (frame === SCENES.xray[0] || frame === SCENES.travel[0]) {
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 80)));
      await tick(page, 1, 0);
    }

    const jpeg = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ffmpeg.stdin.write(jpeg))
      await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
    if (frame % 90 === 0) {
      const elapsed = ((Date.now() - started) / 1000).toFixed(0);
      console.log(`  frame ${frame}/${TOTAL} (${elapsed}s)`);
    }
  }
} finally {
  ffmpeg.stdin.end();
  await browser.close();
  viewer.server.close();
}
await encoded;
console.log(`  ${output}`);
