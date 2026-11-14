# Marketing kit

Everything here is generated from the real viewer running on a real repository, so the visuals can be refreshed whenever the product changes.

```bash
npm run build                                  # the scripts drive the built viewer
node packages/cli/dist/bin.js <repo> --json city.json
npm run marketing:shots -- city.json           # raw screenshots  → marketing/out/raw
npm run marketing:cards                        # 7 post images     → marketing/out/posts
npm run marketing:video -- city.json           # launch video      → marketing/out/*.mp4
```

- [`posts.md`](posts.md): the copy for a week of posts, one per day.
- `cards/cards.js`: text, crops and callouts of each post image.
- `lib/studio.mjs`: headless Chrome with a virtual clock, so animations advance by an exact amount per captured frame.

The scripts need Chrome or Edge installed (set `CHROME_PATH` if it is somewhere unusual). Output goes to `marketing/out/`, which is not committed.

Numbers quoted in the cards and posts come from the snapshot used to render them. After re-rendering on another repository, update `cards/cards.js` and `posts.md` from `marketing/out/facts.json`.
