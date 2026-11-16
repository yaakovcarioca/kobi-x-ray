# kobi-xray

Turn any Git repository into a navigable 3D city: files are buildings, folders are districts, height is lines of code, width is how many files import it, and colour shows where the code changes (and breaks) the most. A timeline replays every commit from the first one to `HEAD`.

```bash
npx kobi-xray            # inside any Git repository
npx kobi-xray ../other   # or point it at a path
```

Everything is computed on your machine. No code leaves it.

- **Time travel:** drag the timeline and watch the city being built, commit by commit.
- **X-Ray panel:** click a file to see what it imports, what depends on it and its blast radius.
- **Hotspots:** a live ranking of files that are hot, complex and heavily imported.
- **Context export:** one click copies a Markdown briefing of a file for Claude, Cursor or any AI agent.

Works with TypeScript, JavaScript, Python, Go and Rust. Requires Node 20 or newer and `git` on the PATH.

Run `npx kobi-xray --help` for all options. Full documentation: https://github.com/yaakovcarioca/kobi-x-ray

MIT licensed.
