# Marketing kit

Everything here is generated from the real viewer running on a real repository, so the visuals can be refreshed whenever the product changes.

```bash
npm run build                                  # the scripts drive the built viewer
node packages/cli/dist/bin.js <repo> --json city.json
npm run marketing:shots -- city.json           # raw screenshots  → marketing/out/raw
npm run marketing:cards                        # 7 post images     → marketing/out/posts
npm run marketing:video -- city.json           # launch video      → marketing/out/*.mp4
npm run marketing:og                           # 1200×630 social preview → marketing/out/og.png

# English edition (same visuals, English copy)
npm run marketing:cards -- --lang en           # → marketing/out/posts-en
npm run marketing:video -- city.json --lang en # → marketing/out/kobi-xray-launch-en.mp4
```

- [`posts.md`](posts.md) (Portuguese) and [`posts.en.md`](posts.en.md) (English): the copy for a week of posts, one per day.
- `cards/cards.js` and `cards/cards.en.js`: text, crops and callouts of each post image.
- `lib/studio.mjs`: headless Chrome with a virtual clock, so animations advance by an exact amount per captured frame.

The scripts need Chrome or Edge installed (set `CHROME_PATH` if it is somewhere unusual). Output goes to `marketing/out/`, which is not committed.

Numbers quoted in the cards and posts come from the snapshot used to render them. After re-rendering on another repository, update `cards/cards.js`, `cards/cards.en.js` and the posts from `marketing/out/facts.json`.

The landing page lives in its own repository (`kobi-x-ray-landingpage`). Its screenshots are the PNGs from `marketing/out/raw`, converted to WebP.
