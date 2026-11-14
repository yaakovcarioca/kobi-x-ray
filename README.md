# Kobi X-Ray

**Codebase Time-Travel & Architecture X-Ray.** Turn any Git repository into a living, navigable 3D city: files are buildings, folders are districts, and a timeline replays every commit from the first one to `HEAD`.

```bash
npx kobi-xray
```

Run it inside a repository and the city opens in your browser. Everything is computed locally; no code leaves your machine.

## Reading the city

| What you see | What it means |
| --- | --- |
| Building | One file |
| District (platform) | One directory; nested directories stack like terraces |
| Height | Lines of code |
| Width | Fan-in: how many files import it |
| Colour (Heat mode) | Recent churn, with bug-fix commits weighted double. It cools down with a 90-day half-life |
| Blue arcs | Files the selected file imports |
| Orange arcs | Files that import the selected file |

Tall, wide and red is the combination to worry about: a large file that many others depend on and that keeps changing.

### Time travel

Drag the timeline, or press <kbd>Space</kbd>, to watch the city grow commit by commit. The strip behind the slider shows how many lines changed over time; the red part is the share coming from bug fixes.

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Play / pause |
| <kbd>←</kbd> <kbd>→</kbd> | Previous / next commit (<kbd>Shift</kbd> jumps 10) |
| <kbd>/</kbd> | Find a file |
| <kbd>Esc</kbd> | Clear the selection |

### X-Ray panel

Click a building to see its size, complexity, churn and **blast radius**: every file that can break, directly or transitively, if this one changes. **Copy context for Claude / Cursor** puts a Markdown briefing of that file (imports, dependents, blast radius, history) on your clipboard, ready to paste into an AI coding agent before a refactor. Clicking a district does the same for a whole module.

## CLI

```
kobi-xray [dir] [options]

  -p, --port <n>     Port for the local viewer (default 4777)
      --no-open      Do not open the browser
      --no-history   Skip git history (no time travel, no heat)
      --json <file>  Write the snapshot as JSON and exit
```

A snapshot written with `--json` can be opened later by dropping it on the viewer.

## Language support

Imports, function counts and cyclomatic complexity come from [tree-sitter](https://tree-sitter.github.io/) grammars compiled to WebAssembly.

| Language | Import resolution |
| --- | --- |
| TypeScript / JavaScript | Relative paths, `tsconfig` `paths` and `baseUrl`, workspace packages |
| Python | Absolute and relative imports, packages |
| Go | Module-local packages via `go.mod` |
| Rust | `mod` declarations, `crate::` / `super::` / `self::` paths, workspace crates |

Every other text file still gets a building (height and heat), just no dependency edges.

## Known limits

- Dependencies are read from the working tree, so while time travelling, arcs and fan-in reflect `HEAD`, not the past. Heights and heat are historically accurate.
- Renames are treated as a delete plus an add.
- History is read for the current branch only.

## Development

```bash
npm install
npm test            # unit tests (vitest)
npm run typecheck
npm run build       # core → web → cli
node packages/cli/dist/bin.js .
```

For work on the viewer, serve a snapshot with `node packages/cli/dist/bin.js . --no-open` and run `npm run dev`; Vite proxies `/api` to the CLI.

```
packages/core   Analysis engine: AST parsing, import resolution, git mining, layout, replay
packages/cli    The kobi-xray command: analyses a repo and serves the viewer
apps/web        The 3D viewer (React, Three.js, React Three Fiber)
```

## Roadmap

- Paste a public GitHub URL in the browser, no install
- AI explanations and refactor plans with your own API key
- Blast radius of a pull request
- Historical dependency graph during time travel

## License

[MIT](LICENSE)
