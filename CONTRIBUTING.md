# Contributing to Kobi X-Ray

Thanks for your interest in improving Kobi X-Ray. This guide covers how to set up the project, how it is organised and what we expect from a pull request.

## Reporting bugs and requesting features

Open an [issue](https://github.com/yaakovcarioca/kobi-x-ray/issues). For a bug, include:

- the output of `kobi-xray --version`, your Node.js version and your operating system;
- what you ran and what you expected to happen;
- if the problem depends on a repository, its name (if public) or a description of its languages and size.

For a feature, describe the problem you want to solve before the solution. For anything larger than a small fix, please wait for a maintainer to agree on the approach before you start coding.

## Development setup

You need Node.js 20 or newer and `git`.

```bash
git clone https://github.com/yaakovcarioca/kobi-x-ray.git
cd kobi-x-ray
npm install
```

| Command                               | What it does                                   |
| ------------------------------------- | ---------------------------------------------- |
| `npm test`                            | Runs the test suite (vitest)                   |
| `npm run typecheck`                   | Type-checks every workspace                    |
| `npm run build`                       | Builds core, then the web viewer, then the CLI |
| `npm run format`                      | Formats the code with Prettier                 |
| `node packages/cli/dist/bin.js <dir>` | Analyses a repository with your local build    |

To work on the viewer, serve a snapshot with `node packages/cli/dist/bin.js . --no-open`, then run `npm run dev`. Vite proxies `/api` to the CLI.

## Project layout

```
packages/core   Analysis engine: parsing, import resolution, git mining, layout, replay
packages/cli    The kobi-xray command; bundles core into a single file for npm
apps/web        The 3D viewer (React, Three.js, React Three Fiber)
marketing       Scripts that render screenshots, posts and the launch video
```

`packages/core` has no UI dependencies and does most of the work, so most changes to analysis belong there.

### Adding a language

1. Add a grammar spec under `packages/core/src/analyze/` (see `go.ts` for a small example) and register it in `analyze/index.ts` and `languages.ts`.
2. Add an import resolver under `packages/core/src/resolve/` and register it in `resolve.ts`.
3. Add tests next to the existing ones in `analyze.test.ts` and `resolve.test.ts`.
4. Add the language to the table in the README.

## Pull requests

- Branch from `main` and keep each pull request focused on one change.
- Add or update tests for behaviour changes. `npm test`, `npm run typecheck` and `npm run build` must pass; CI runs the same commands.
- Run `npm run format` before committing.
- Write commit messages in the [Conventional Commits](https://www.conventionalcommits.org/) style, for example `fix(core): resolve tsconfig paths in nested workspaces`.
- Explain what changed and why in the pull request description. Include a screenshot for visual changes.

## Licence

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
