# Lerna Brand

A free, open-source brand-kit generator. Open alternative to Tailor Brands.

- **What it does**: helps anyone (founders, freelancers, students) build a basic brand kit — logo, color palette, typography, printable style sheet — without paying.
- **Live**: <https://lerna-soft.github.io/lerna-brand/>
- **Status**: usable MVP.

## Features

- **10 logo templates**: wordmark variants (bold, serif, underlined, bracketed, stacked), lockups (icon left, dot left), monogram in a circle, emblem badge, abstract diamond mark.
- **20 curated palettes** with mood labels and on-card WCAG contrast badges (AAA / AA / AA Large / Fail).
- **15 typography pairings** sourced from Google Fonts (Inter, Anton, Playfair, Montserrat, Bebas, DM Serif, Space Grotesk, Syne, Oswald, Abril Fatface, Raleway, Work Sans, Archivo Black, Libre Baskerville, JetBrains Mono).
- **Live preview** as you type.
- **Exports**: SVG (vector), PNG at 512/1024/2048, square favicon, JSON manifest, and a printable A4 brand sheet.
- **Persistence**: your in-progress kit is saved to `localStorage` so you can close the tab and come back.

## Why

Tailor Brands and similar tools gate basic brand assets behind a paywall. There's no reason a starter brand kit — an SVG logo, a few font pairings, a handful of color palettes, and a one-page style guide — needs a monthly subscription. This project puts that on the open web.

## Architecture

File-based, no backend. Same approach as [devil-tv](https://github.com/lerna-soft/devil-tv):

- **Storage**: JSON files committed to this repo (`data/templates.json`, `data/palettes.json`, `data/fonts.json`). User-generated kits are downloaded to the user's machine, never stored server-side.
- **Frontend**: vanilla HTML + CSS + JS. No build step.
- **Deploy**: GitHub Pages from `main`.
- **Persistence (in-session)**: `localStorage` key `lerna-brand:state:v1`.
- **Persistence (future)**: optional save-to-GitHub via Issues API (each kit becomes an Issue, like devil-tv's catalog sync) so users can keep their kits without a database.

## Out of scope (for now)

- AI-generated logos. The promise here is **curated templates done well**, not infinite generation.
- Account system, billing, teams.
- Mockups (business cards, t-shirts). Maybe later as static SVG overlays.

## Structure

```
/
├── index.html              Landing
├── app.html                The builder
├── print.html              Printable A4 brand sheet
├── styles.css              Shared styles
├── app.js                  Builder state + UI wiring + export
├── renderer.js             Pure-function logo renderer (one fn per template)
├── data/
│   ├── templates.json      Logo SVG templates (10)
│   ├── palettes.json       Color palettes (20)
│   └── fonts.json          Curated font pairings (15)
└── assets/                 Static assets
```

## Contributing

Templates, palettes and font pairings live in `data/*.json`. The easiest way to contribute is to add an entry there — open a PR.

- **Palette**: `{ id, name, mood, colors: [primary, accent, surface, background] }`. Mind the contrast badge: aim for AA at minimum between `colors[0]` and `colors[3]`.
- **Font pair**: `{ id, name, mood, heading, body, weights }`. If you add a new Google Fonts family, update the `<link>` in `index.html`, `app.html`, and `print.html`.
- **Template**: `{ id, name, kind, description }`. The actual SVG is drawn in `renderer.js` — add a new function keyed by id.

## License

MIT.
