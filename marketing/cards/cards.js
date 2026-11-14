// One entry per social post image (1080×1350). Copy is in Portuguese; the
// numbers come from the vitejs/vite snapshot (see marketing/out/facts.json).
//
// `crop` selects a region of the 2560×1600 screenshot: x/y are the top-left
// corner and w the width, all as fractions of the source image.
// `notes` are callouts: the label sits at (lx, ly), its dot at (px, py), in
// percent of the media box.
export const CARDS = [
  {
    id: 'capa',
    kicker: 'Kobi X-Ray',
    title: 'Isto é o repositório do Vite.',
    sub: '2.876 arquivos e 9.743 commits. Cada prédio é um arquivo.',
    media: { image: 'city-heat', crop: { x: 0.2, y: 0.17, w: 0.66 } },
  },
  {
    id: 'como-ler',
    kicker: 'Como ler a cidade',
    title: 'Alto, largo e vermelho: é ali que mora o risco.',
    sub: 'Quatro codificações, nenhuma legenda para decorar.',
    media: {
      image: 'city-heat',
      crop: { x: 0.27, y: 0.2, w: 0.5 },
      notes: [
        { text: 'Altura = linhas de código', lx: 4, ly: 8, px: 30.4, py: 51.5 },
        { text: 'Cor = churn recente + correções', lx: 46, ly: 22, px: 89.5, py: 55 },
        { text: 'Largura = quantos arquivos importam', lx: 4, ly: 90, px: 34, py: 77 },
        { text: 'Bairro = pasta', lx: 66, ly: 84, px: 70, py: 62 },
      ],
    },
  },
  {
    id: 'maquina-do-tempo',
    kicker: 'Máquina do tempo',
    title: 'Seis anos de commits em três paradas.',
    sub: 'Arraste a linha do tempo e veja a cidade nascer.',
    strips: [
      {
        image: 'time-1',
        label: '2021',
        detail: 'commit 1.461 · 371 arquivos',
        crop: { x: 0.2, y: 0.52, w: 0.5 },
      },
      {
        image: 'time-2',
        label: '2022',
        detail: 'commit 4.384 · 1.343 arquivos',
        crop: { x: 0.2, y: 0.52, w: 0.5 },
      },
      {
        image: 'time-3',
        label: 'hoje',
        detail: 'commit 9.743 · 2.854 arquivos',
        crop: { x: 0.2, y: 0.52, w: 0.5 },
      },
    ],
  },
  {
    id: 'blast-radius',
    kicker: 'Blast radius',
    title: 'Mexeu em 1 arquivo. 166 podem quebrar.',
    sub: 'utils.ts do Vite: 94 dependentes diretos, 361 commits, 171 deles correções.',
    media: {
      image: 'city-blast',
      crop: { x: 0.34, y: 0.055, w: 0.66 },
      notes: [
        { text: 'laranja: quem depende dele', lx: 3, ly: 22, px: 22, py: 44 },
        { text: 'azul: o que ele importa', lx: 3, ly: 70, px: 12, py: 52 },
      ],
    },
  },
  {
    id: 'hotspots',
    kicker: 'Hotspots',
    title: 'A dívida técnica tem endereço.',
    sub: 'Ranking ao vivo dos arquivos quentes, complexos e muito importados.',
    media: {
      image: 'city-heat',
      crop: { x: 0, y: 0.05, w: 0.66 },
      notes: [{ text: 'os 8 arquivos de maior risco agora', lx: 36, ly: 14, px: 30, py: 22 }],
    },
  },
  {
    id: 'contexto-ia',
    kicker: 'Contexto para IA',
    title: 'Antes de pedir um refactor para a IA, entregue o mapa.',
    sub: 'Um clique copia o briefing do arquivo em Markdown. Zero tokens para gerar.',
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
    kicker: 'Por baixo do capô',
    title: 'O Vite inteiro, analisado em menos de 15 segundos.',
    sub: 'Tudo roda na sua máquina. Nenhum código sai dela.',
    steps: [
      ['Scan', 'arquivos do Git, respeitando o .gitignore'],
      ['Parse', 'tree-sitter em WASM: imports e complexidade'],
      ['Resolve', 'imports viram arestas do grafo de dependências'],
      ['Mine', 'um git log --numstat vira a linha do tempo'],
      ['Render', 'um InstancedMesh desenha todos os prédios'],
    ],
  },
];
