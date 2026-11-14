# Landing page

Static site for Kobi X-Ray. No build step: any static host can serve this folder as is.

```bash
npx vite landingpage
```

- `index.html`, `styles.css`: the page
- `main.js`: copy buttons, scroll reveal, the time-travel scrubber and colour lenses
- `hero.js`: the generated 3D city in the hero (three.js, loaded from a CDN)
- `assets/`: real screenshots of the viewer, captured with `node marketing/shots.mjs <snapshot.json>`
