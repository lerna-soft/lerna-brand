# Lerna Brand

A free, open-source brand-kit generator. Open alternative to Tailor Brands. 100 % browser-based, no backend, no signup, no paywall.

- **Live**: <https://lerna-soft.github.io/lerna-brand/>
- **Status**: feature-complete v1 (8 phases shipped, matches Tailor's core scope without the subscription).

## What you get

| Area | What's included |
|---|---|
| **Onboarding** | 5-question quiz → 24 curated variations generated live. Style chips (Bolder · Minimal · Colorful · Warm · Cool · Serif), endless "Show 24 more", Boltzmann-weighted shuffle so regenerate produces fresh sets. |
| **Logo** | 10 templates (wordmark bold/serif/underline/bracket/stacked, lockup icon/dot, monogram, emblem badge, abstract mark). 5,093 Tabler icons searchable for icon-bearing templates. |
| **Color** | 20 curated palettes (each tagged with mood + WCAG contrast badge) **plus** a custom palette builder with HEX + color-picker for 4 roles and a live contrast read-out. |
| **Typography** | 15 curated pairings **plus** the full Google Fonts catalog (1,900+ families), browsable with virtualized lazy-loading. Pick heading and body independently. |
| **Brand assets** | 10 templates: business card front/back, IG post, IG story, Facebook cover, Twitter header, LinkedIn banner, YouTube banner, A4 letterhead, email signature. Each renders live in the export panel. |
| **Exports** | SVG (vector), PNG 512/1024/2048, favicon 64, full-kit ZIP (logo + all 10 assets + manifest.json + README, zero-dep store-mode ZIP builder). |
| **Brand book** | 14-page printable A4 brand book: cover, contents, mission/vision/values, primary mark, construction grid, variants, minimum sizes, do/don't, color system with HEX/RGB/HSL/CMYK, 60·30·10 usage, type system, type in context, applications, tone of voice. Mission/tone editable inline before printing. |
| **Persistence** | Multiple named projects in localStorage with open/delete/rename. Share via URL hash (encodes full state, including custom palette and font families) — paste the link to anyone, they see the same kit. Auto-save on every change. |
| **Adjacent tools** | Inspiration gallery on landing (24 sample kits, each clickable). Name generator with 4 strategies (concat, portmanteau, made-up, Markov 2-gram). Trademark search link prefilled with USPTO TESS. |

## Architecture

File-based, no backend. GitHub Actions handle the "async backend" pieces:

```
/
├── index.html                Landing with hero, features, inspiration gallery
├── quiz.html                 5-question quiz + variations engine v2
├── app.html                  Builder (template/identity/palette/typography/export)
├── print.html                14-page printable brand book
├── names.html                Name generator
│
├── renderer.js               Pure SVG renderer: 10 logo templates + 10 asset layouts + Tabler icon embedder
├── zip.js                    Zero-dependency store-mode ZIP builder
├── app.js                    Builder state machine, persistence, exports, projects, share
├── styles.css                All UI styles (single sheet)
│
├── data/
│   ├── templates.json        10 logo templates with tags
│   ├── palettes.json         20 curated palettes with mood
│   ├── fonts.json            15 curated font pairings with mood
│   ├── asset-templates.json  10 asset layouts with native pixel sizes
│   ├── quiz.json             Quiz questions with answer→tag mapping
│   ├── samples.json          24 pre-built kits for the inspiration gallery
│   ├── word-banks.json       Industry word banks for the name generator
│   ├── icons.json            5,093 Tabler outline icons (~2.2 MB, regen via GH Action)
│   └── google-fonts.json     1,934 Google Fonts metadata (~290 KB, regen via GH Action)
│
├── tools/
│   └── build-icons.js        Extracts every shape from @tabler/icons → data/icons.json
│
├── .github/workflows/
│   ├── sync-icons.yml        Monthly regen of data/icons.json
│   └── sync-fonts.yml        Quarterly regen of data/google-fonts.json
│
├── ROADMAP.md                The 8-phase parity plan that built this
└── README.md
```

## How "async backend" works

Anywhere we need data that's too big to hand-edit or that mutates over time, a GitHub Action regenerates it on a schedule (or `workflow_dispatch`) and auto-commits the result. The frontend just reads the static file. Pieces today:

- **Tabler icons** — `sync-icons.yml` installs `@tabler/icons` and runs `tools/build-icons.js` monthly.
- **Google Fonts metadata** — `sync-fonts.yml` curls Google's metadata endpoint and reshapes with `jq` quarterly.

The model scales: anything that's heavy to compute, slow to fetch, or licensed-but-redistributable can live in a workflow.

## Stack

- **100 % free**: GitHub Pages (hosting), GitHub Actions (catalog regeneration in public repos), Google Fonts (CDN), Tabler icons (MIT). No paid services, no API keys leave the browser.
- **No build step**: open `index.html` in a browser and it works.
- **Vanilla JS**: zero npm dependencies in the shipped code. `@tabler/icons` is only installed inside the GitHub Action.

## Contributing

Templates, palettes and font pairings live in `data/*.json`. The simplest contributions:

- **Palette**: `{ id, name, mood, colors: [primary, accent, surface, background] }` — aim for at least AA contrast between `colors[0]` and `colors[3]` (the contrast badge will tell you live).
- **Font pair**: `{ id, name, mood, heading, body, weights }`. If you add a new family, update the `<link>` in `index.html`, `app.html`, and `print.html`.
- **Template**: `{ id, name, kind, tags, description, variant? }`. The actual SVG is drawn in `renderer.js` — add a function keyed by id.
- **Sample**: append a kit triple (`tpl`, `pal`, `f`) to `data/samples.json` to surface it in the landing gallery.

## License

MIT.
