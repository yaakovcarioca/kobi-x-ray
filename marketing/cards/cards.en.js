// English copy of the social post images. Same ids, crops and callout positions
// as cards.js; only the words (and number formatting) change.
export const FOOTER = 'open source · runs locally';

export const CARDS = [
  {
    id: 'capa',
    kicker: 'Kobi X-Ray',
    title: 'This is the Vite repository.',
    sub: '2,876 files and 9,743 commits. Every building is a file.',
    media: { image: 'city-heat', crop: { x: 0.2, y: 0.17, w: 0.66 } },
  },
  {
    id: 'como-ler',
    kicker: 'How to read the city',
    title: 'Tall, wide and red: that is where the risk lives.',
    sub: 'Four encodings, no legend to memorise.',
    media: {
      image: 'city-heat',
      crop: { x: 0.27, y: 0.2, w: 0.5 },
      notes: [
        { text: 'Height = lines of code', lx: 4, ly: 8, px: 30.4, py: 51.5 },
        { text: 'Colour = recent churn + fixes', lx: 46, ly: 22, px: 89.5, py: 55 },
        { text: 'Width = files that import it', lx: 4, ly: 90, px: 34, py: 77 },
        { text: 'District = folder', lx: 66, ly: 84, px: 70, py: 62 },
      ],
    },
  },
  {
    id: 'maquina-do-tempo',
    kicker: 'Time machine',
    title: 'Six years of commits in three stops.',
    sub: 'Drag the timeline and watch the city being built.',
    strips: [
      {
        image: 'time-1',
        label: '2021',
        detail: 'commit 1,461 · 371 files',
        crop: { x: 0.2, y: 0.52, w: 0.5 },
      },
      {
        image: 'time-2',
        label: '2022',
        detail: 'commit 4,384 · 1,343 files',
        crop: { x: 0.2, y: 0.52, w: 0.5 },
      },
      {
        image: 'time-3',
        label: 'today',
        detail: 'commit 9,743 · 2,854 files',
        crop: { x: 0.2, y: 0.52, w: 0.5 },
      },
    ],
  },
  {
    id: 'blast-radius',
    kicker: 'Blast radius',
    title: 'Touch 1 file. 166 can break.',
    sub: "Vite's utils.ts: 94 direct dependents, 361 commits, 171 of them bug fixes.",
    media: {
      image: 'city-blast',
      crop: { x: 0.34, y: 0.055, w: 0.66 },
      notes: [
        { text: 'orange: what depends on it', lx: 3, ly: 22, px: 22, py: 44 },
        { text: 'blue: what it imports', lx: 3, ly: 70, px: 12, py: 52 },
      ],
    },
  },
  {
    id: 'hotspots',
    kicker: 'Hotspots',
    title: 'Technical debt has an address.',
    sub: 'A live ranking of files that are hot, complex and heavily imported.',
    media: {
      image: 'city-heat',
      crop: { x: 0, y: 0.05, w: 0.66 },
      notes: [{ text: 'the 8 riskiest files right now', lx: 36, ly: 14, px: 30, py: 22 }],
    },
  },
  {
    id: 'contexto-ia',
    kicker: 'Context for AI',
    title: 'Before asking AI to refactor, hand it the map.',
    sub: 'One click copies the file briefing as Markdown. Zero tokens to generate it.',
    code: [
      '# X-Ray context: `packages/vite/src/node/utils.ts`',
      '',
      '## Summary',
      '- Size: 1989 lines, 154 functions',
      '- Cyclomatic complexity (whole file): 325',
      '- Fan-in: 94 files import it',
      '- Churn: 361 commits (171 bug fixes)',
      '',
      '## Imported by (direct dependents)',
      '- `packages/vite/src/node/build.ts` — 2002 lines',
      '- `packages/vite/src/node/config.ts` — 2971 lines',
      '- …and 92 more',
      '',
      '## Blast radius',
      '166 files depend on this file directly or',
      'transitively (94 direct, up to 3 hops away).',
    ],
  },
  {
    id: 'como-funciona',
    kicker: 'Under the hood',
    title: 'All of Vite, analysed in under 15 seconds.',
    sub: 'Everything runs on your machine. No code leaves it.',
    steps: [
      ['Scan', 'files Git knows about, honouring .gitignore'],
      ['Parse', 'tree-sitter in WASM: imports and complexity'],
      ['Resolve', 'imports become dependency graph edges'],
      ['Mine', 'one git log --numstat becomes the timeline'],
      ['Render', 'one InstancedMesh draws every building'],
    ],
  },
];
