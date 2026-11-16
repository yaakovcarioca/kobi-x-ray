# A week of posts — Kobi X-Ray launch (English)

Seven posts, one per day. Images and video land in `marketing/out/` after running the scripts (see the [README](README.md)). Every number comes from the `vitejs/vite` repository, measured by the tool itself.

> Before posting: the copy says `npx kobi-xray`, which works now that the package is on npm. Links point to the landing page; the code is at https://github.com/yaakovcarioca/kobi-x-ray.

---

## Day 1 — Launch (video)

**File:** `out/kobi-xray-launch-en.mp4` · cover: `out/posts-en/day-1-cover.png`

I wanted to see technical debt and coupling without reading 50k lines of code.

So I built a 3D X-ray with time travel for Git repositories.

The video is the Vite repo: 2,876 files, 9,743 commits, from the first one to today.

→ Every file is a building
→ Height = lines of code
→ Width = how many files import it
→ Colour = where the code changes (and breaks) the most

It's called Kobi X-Ray. Open source, runs on your machine, no code ever leaves it.

`npx kobi-xray` inside any repository.

https://xray.yaakovcarioca.com

#opensource #git #softwarearchitecture #devtools #buildinpublic

---

## Day 2 — How to read the city

**File:** `out/posts-en/day-2-how-to-read.png`

A folder tree doesn't show coupling.

You open VS Code, see 300 folders, and have no idea which file would take 40 others down with it.

In Kobi X-Ray the repo becomes a city, and reading it is direct:

• Tall → big file
• Wide → many files import it
• Red → changed a lot, and recently
• District → folder

Tall, wide and red at the same time? That's where the risk lives.

In the image, Vite. The red district is `packages/vite/src/node`.

https://xray.yaakovcarioca.com

#softwarearchitecture #techdebt #devtools

---

## Day 3 — Time machine

**File:** `out/posts-en/day-3-time-machine.png`

`git log` shows text. It doesn't show the story.

At the bottom of Kobi X-Ray there's a timeline. Drag it and watch the city being built, commit by commit.

Vite in three stops:
• 2021: 371 files
• 2022: 1,343 files
• today: 2,854 files

You can see districts being born, one file growing out of control into a red skyscraper, and later being split into smaller modules.

It's the fastest way I've found to understand how a project got where it is.

https://xray.yaakovcarioca.com

#git #softwareengineering #buildinpublic

---

## Day 4 — Blast radius

**File:** `out/posts-en/day-4-blast-radius.png`

Touch 1 file. 166 can break.

That's Vite's `utils.ts`:
• 94 files import it directly
• 166 depend on it, directly or indirectly
• 361 commits, 171 of them bug fixes

In Kobi X-Ray you click the building and the arcs light up: orange for what depends on it, blue for what it imports. The panel counts the blast radius hop by hop.

What's the `utils.ts` of your project?

https://xray.yaakovcarioca.com

#softwarearchitecture #refactoring #devtools

---

## Day 5 — Hotspots

**File:** `out/posts-en/day-5-hotspots.png`

Technical debt has an address.

It isn't spread evenly. It tends to live in a handful of files that are, all at once, big, complex, heavily imported and changed every week.

Kobi X-Ray crosses three signals to rank them:

1. recent churn (bug-fix commits weigh double)
2. cyclomatic complexity
3. how many files depend on it

The ranking is live: drag the timeline and see who the problem was two years ago.

https://xray.yaakovcarioca.com

#techdebt #engineeringmanagement #devtools

---

## Day 6 — Context for AI

**File:** `out/posts-en/day-6-ai-context.png`

Before asking AI to refactor, hand it the map.

A coding agent with no architecture context refactors the right file and breaks the 94 that depend on it.

In Kobi X-Ray, one click on "Copy context for Claude / Cursor" copies a Markdown briefing of the file:
• what it imports
• who depends on it
• the blast radius
• its change history

It's deterministic: it comes from the dependency graph and Git, without spending a single token to generate it.

Paste it into Claude Code or Cursor and ask for the refactor.

https://xray.yaakovcarioca.com

#ai #claudecode #cursor #devtools

---

## Day 7 — How it works

**File:** `out/posts-en/day-7-how-it-works.png`

All of Vite (2,876 files, 9,743 commits) analysed in under 15 seconds, on my laptop.

How:

1. Scan: the files Git knows about
2. Parse: tree-sitter compiled to WebAssembly extracts imports and complexity
3. Resolve: imports become edges (tsconfig aliases, workspaces, go.mod, crates)
4. Mine: a single `git log --numstat` becomes the timeline
5. Render: Three.js with an InstancedMesh draws every building at once

No server, no upload, no AI in the path. Works with TypeScript, JavaScript, Python, Go and Rust.

The code is open. If you try it on your project, send me a screenshot of your city.

https://xray.yaakovcarioca.com

#opensource #threejs #treesitter #buildinpublic
