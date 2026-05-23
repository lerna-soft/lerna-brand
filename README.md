# Lerna Brand

A free, open-source brand-kit generator. Open alternative to Tailor Brands.

- **What it does**: helps anyone (founders, freelancers, students) build a basic brand kit — logo, color palette, typography, sample assets — without paying.
- **Status**: scaffolding. Logo generator and exporter are roadmap.
- **Live**: <https://lerna-soft.github.io/lerna-brand/>

## Why

Tailor Brands and similar tools gate basic brand assets behind a paywall. There is no reason a starter brand kit (an SVG logo, three font pairings, six color palettes, and a one-page style guide) needs to cost monthly subscription money. This project is an attempt to put that on the open web.

## Architecture

File-based, no backend. Same approach as [devil-tv](https://github.com/lerna-soft/devil-tv):

- **Storage**: JSON files committed to this repo. Templates, palettes and fonts live in `data/`. User-generated brand kits are exported as downloadable JSON / SVG / ZIP — not stored server-side.
- **Frontend**: vanilla HTML + CSS + JS. No build step.
- **Deploy**: GitHub Pages from `master`.
- **Persistence (future)**: optional save-to-GitHub via Issues API (each kit becomes an Issue, like devil-tv's catalog sync) so users can keep their kits without a database.

## Scope · MVP

- Pick a logo template (SVG composition from `data/templates.json`).
- Customize: brand name, tagline, primary color, accent color, font pair.
- Preview live.
- Export: SVG logo, PNG (rendered client-side via canvas), JSON kit definition.

## Out of scope (for now)

- AI-generated logos. The promise here is **curated templates done well**, not infinite generation.
- Account system, billing, teams.
- Mockups (business cards, t-shirts). Maybe later as static SVG overlays.

## Structure

```
/
├── index.html              Landing
├── app.html                The generator app
├── styles.css              Shared styles
├── app.js                  App state + UI wiring
├── data/
│   ├── templates.json      Logo SVG templates
│   ├── palettes.json       Color palettes
│   └── fonts.json          Curated font pairings
└── assets/                 Static assets
```

## Contributing

Templates, palettes and font pairings live in `data/*.json`. The easiest way to contribute is to add one of those — open a PR with a new entry.

## License

MIT.
