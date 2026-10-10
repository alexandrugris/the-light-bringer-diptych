# The Light Bringer

An illustrated website for **The Light Bringer** and **The Others**, a poetic diptych by Alexandru Gris.

The poems and reading notes come from the [original publication](https://blog.alexandrugris.ro/2026/04/the-light-bringer-poetic-reflection-of.html). The reading notes preserve the author's words; the connections between notes and individual verses are editorial.

## Run locally

This is a static website built with HTML, CSS, and JavaScript. No build step or package installation is required.

From the repository directory, run:

```sh
python3 -m http.server 8000 --directory dist
```

Open [http://localhost:8000](http://localhost:8000) for the poems, or [http://localhost:8000/notes.html](http://localhost:8000/notes.html) for the reading notes.

## Files

- `dist/index.html` — the illustrated poems.
- `dist/notes.html` — the annotated reading page.
- `dist/content.js` — poem text, original notes, and verse references.
- `dist/site.js` — rendering, poem navigation, and annotation interactions.
- `dist/styles.css` — typography, artwork layout, and responsive styles.
- `dist/assets/` — the crayon illustrations and the Gemini visualization discussed in note 05 and collected at the bottom of the main poem page.

On desktop, selecting a numbered verse opens its notes with a visual connector. On mobile, the notes expand directly beneath the selected verse.

The [visual direction](DESIGN.md) borrows the original Gemini image's hopeful illustrated science-fiction framing.

## Hosting

Serve the contents of `dist/` with any static web host. The entry points are `index.html` and `notes.html`; all local asset paths are relative. The fonts are loaded from Google Fonts.

The [hosted edition](https://the-light-bringer-diptych.ambercoin8.chatgpt.site) is managed separately through Sites.
