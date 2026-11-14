# Uma semana de posts — lançamento do Kobi X-Ray

Sete posts, um por dia. As imagens e o vídeo ficam em `marketing/out/` depois de rodar os scripts (veja o [README](README.md)). Todos os números são do repositório `vitejs/vite`, medidos pela própria ferramenta.

> Antes de publicar: os posts dizem `npx kobi-xray`. Isso só funciona depois que o pacote estiver no npm e o repositório estiver público. Troque `LINK` pelo endereço do GitHub ou da landing page.

---

## Dia 1 — Lançamento (vídeo)

**Arquivo:** `out/kobi-xray-lancamento.mp4` · capa: `out/posts/dia-1-capa.png`

Eu queria enxergar dívida técnica e acoplamento sem ler 50 mil linhas de código.

Então construí um raio-X 3D com máquina do tempo para repositórios Git.

O vídeo é o repositório do Vite: 2.876 arquivos, 9.743 commits, do primeiro até hoje.

→ Cada arquivo é um prédio
→ Altura = linhas de código
→ Largura = quantos arquivos importam ele
→ Cor = onde o código mais muda (e mais quebra)

Chama Kobi X-Ray. É open source, roda na sua máquina e nenhum código sai dela.

`npx kobi-xray` dentro de qualquer repositório.

LINK

#opensource #git #softwarearchitecture #devtools #buildinpublic

---

## Dia 2 — Como ler a cidade

**Arquivo:** `out/posts/dia-2-como-ler.png`

Árvore de pastas não mostra acoplamento.

Você abre o VS Code, vê 300 pastas e não faz ideia de qual arquivo, se mexido, derruba outros 40.

No Kobi X-Ray o repositório vira uma cidade, e a leitura é direta:

• Alto → arquivo grande
• Largo → muita gente importa
• Vermelho → mudou muito, e recentemente
• Bairro → pasta

Alto, largo e vermelho ao mesmo tempo? É ali que mora o risco.

Na imagem, o Vite. O bairro vermelho é `packages/vite/src/node`.

LINK

#softwarearchitecture #techdebt #devtools

---

## Dia 3 — Máquina do tempo

**Arquivo:** `out/posts/dia-3-maquina-do-tempo.png`

`git log` mostra texto. Não mostra a história.

Na parte de baixo do Kobi X-Ray tem uma linha do tempo. Você arrasta e assiste à cidade sendo construída, commit por commit.

O Vite em três paradas:
• 2021: 371 arquivos
• 2022: 1.343 arquivos
• hoje: 2.854 arquivos

Dá para ver bairros nascendo, um arquivo crescendo sem controle até virar um arranha-céu vermelho, e depois sendo quebrado em módulos menores.

É a forma mais rápida que encontrei de entender como um projeto chegou onde está.

LINK

#git #softwareengineering #buildinpublic

---

## Dia 4 — Blast radius

**Arquivo:** `out/posts/dia-4-blast-radius.png`

Mexeu em 1 arquivo. 166 podem quebrar.

Esse é o `utils.ts` do Vite:
• 94 arquivos importam ele diretamente
• 166 dependem dele, direta ou indiretamente
• 361 commits, 171 deles correções de bug

No Kobi X-Ray você clica no prédio e os arcos acendem: laranja para quem depende dele, azul para o que ele importa. O painel conta o raio de explosão, salto por salto.

Qual é o `utils.ts` do seu projeto?

LINK

#softwarearchitecture #refactoring #devtools

---

## Dia 5 — Hotspots

**Arquivo:** `out/posts/dia-5-hotspots.png`

A dívida técnica tem endereço.

Ela não está espalhada por igual. Costuma morar em poucos arquivos que são, ao mesmo tempo, grandes, complexos, muito importados e alterados toda semana.

O Kobi X-Ray cruza três sinais para ranquear esses arquivos:

1. churn recente (commits de fix pesam o dobro)
2. complexidade ciclomática
3. quantos arquivos dependem dele

O ranking é ao vivo: arraste a linha do tempo e veja quem era o problema dois anos atrás.

LINK

#techdebt #engineeringmanagement #devtools

---

## Dia 6 — Contexto para IA

**Arquivo:** `out/posts/dia-6-contexto-ia.png`

Antes de pedir um refactor para a IA, entregue o mapa.

Agente de código sem contexto de arquitetura refatora o arquivo certo e quebra os 94 que dependem dele.

No Kobi X-Ray, um clique em "Copy context for Claude / Cursor" copia um briefing em Markdown do arquivo:
• o que ele importa
• quem depende dele
• o blast radius
• o histórico de mudanças

É determinístico: sai do grafo de dependências e do Git, sem gastar um token para gerar.

Cola no Claude Code ou no Cursor e pede o refactor.

LINK

#ai #claudecode #cursor #devtools

---

## Dia 7 — Como funciona

**Arquivo:** `out/posts/dia-7-como-funciona.png`

O Vite inteiro (2.876 arquivos, 9.743 commits) analisado em menos de 15 segundos, no meu notebook.

Como:

1. Scan: os arquivos que o Git conhece
2. Parse: tree-sitter compilado para WebAssembly extrai imports e complexidade
3. Resolve: imports viram arestas (aliases de tsconfig, workspaces, go.mod, crates)
4. Mine: um único `git log --numstat` vira a linha do tempo
5. Render: Three.js com InstancedMesh desenha todos os prédios de uma vez

Sem servidor, sem upload, sem IA no caminho. Funciona com TypeScript, JavaScript, Python, Go e Rust.

O código é aberto. Se testar no seu projeto, me manda o print da sua cidade.

LINK

#opensource #threejs #treesitter #buildinpublic
