# lerna-brand · Roadmap to Tailor Brands parity

Objective: match Tailor Brands feature-for-feature while keeping the stack 100% free, browser-only, and using GitHub Actions for async backend-y work.

8 phases, ROI-ordered. Each is intended for 1–2 working sessions.

---

## Phase 1 · Onboarding quiz + auto-generated variations

Change the first-run experience from "build it manually" to "answer 5 questions and pick from 24 generated logos".

### New / modified files
- `quiz.html` — quiz UI, redirects to `app.html?view=variations`
- `data/quiz.json` — questions + answer→tag mapping
- `app.js` — `state.preferences` + variations grid mode
- `renderer.js` — `renderThumbnail(state, opts)` for grid previews

### Schema
```json
[
  {
    "id": "industry",
    "q": "What industry are you in?",
    "options": [
      { "label": "Tech / SaaS", "tags": ["tech", "saas", "developer"] },
      { "label": "Beauty / Wellness", "tags": ["beauty", "wellness", "soft"] }
    ]
  }
]
```

### Scoring
```js
function scoreCombination(template, palette, fontPair, prefTags) {
  const allTags = [
    ...(palette.mood || "").split(" · "),
    ...(fontPair.mood || "").split(" · "),
    template.kind, template.variant
  ];
  return prefTags.reduce((acc, t) => acc + (allTags.includes(t) ? 1 : 0), 0);
}

function topVariations(templates, palettes, fonts, prefTags, n) {
  const scored = [];
  for (const t of templates) for (const p of palettes) for (const f of fonts) {
    scored.push({ t, p, f, s: scoreCombination(t, p, f, prefTags) });
  }
  scored.sort((a, b) => b.s - a.s || Math.random() - 0.5);
  return scored.slice(0, n);
}
```

### Steps
1. `quiz.html` with 5 one-question-per-screen radio forms.
2. `data/quiz.json` reusing existing `mood` / `kind` / `variant` as vocab.
3. On finish: save prefs to `localStorage` (`lerna-brand:quiz:v1`), redirect to builder.
4. In `app.js`: when `view=variations`, render 24-card grid using `renderThumbnail()`.
5. Click card → enters builder with that combo pre-selected.
6. "Regenerate" button → re-shuffle with same prefs.

---

## Phase 2 · Icon catalog (5,000+)

So `lockup-icon-left` and friends use real icons from a large catalog.

### Files
- `.github/workflows/sync-icons.yml`
- `tools/build-icons.js`
- `data/icons.json` (generated, ~2–5 MB)
- `app.js` — new "Icon" step, lazy-loads the JSON
- `renderer.js` — templates render `state.icon.paths`

### Source
**Tabler Icons** (MIT, 5,200+ outline-style SVG paths).

### `tools/build-icons.js`
```js
import fs from "fs";
import path from "path";

const dir = "node_modules/@tabler/icons/icons/outline";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".svg"));
const out = files.map(f => {
  const svg = fs.readFileSync(path.join(dir, f), "utf8");
  const paths = [...svg.matchAll(/<path[^>]*d="([^"]+)"/g)].map(m => m[1]);
  return {
    id: f.replace(".svg", ""),
    name: f.replace(".svg", "").replace(/-/g, " "),
    tags: f.replace(".svg", "").split("-"),
    paths
  };
});
fs.writeFileSync("data/icons.json", JSON.stringify(out));
```

### `.github/workflows/sync-icons.yml`
```yaml
name: Sync icons catalog
on:
  workflow_dispatch:
  schedule: [{ cron: "0 0 1 * *" }]
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install @tabler/icons --no-save
      - run: node tools/build-icons.js
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: regenerate icons catalog"
          file_pattern: data/icons.json
```

### Icon picker UI
- Lazy-load `data/icons.json` only when entering the Icon step.
- Search input with 200ms debounce, filter `tags.some(t => t.includes(query))`.
- Virtual grid (`auto-fill, 60px`) with `IntersectionObserver`.
- Click → `state.icon = { id, paths }`.

### Renderer update
```js
"lockup-icon-left": function (n) {
  const iconSvg = n.icon
    ? '<g transform="translate(60 75) scale(2.33)">'
      + n.icon.paths.map(d =>
        '<path d="' + d + '" fill="' + n.c1 + '" stroke="none"/>'
      ).join("")
      + '</g>'
    : '<rect x="60" y="75" width="56" height="56" rx="6" fill="' + n.c1 + '"/>';
  return iconSvg + /* wordmark */;
}
```

---

## Phase 3 · Custom palette + full Google Fonts catalog

### 3a · Custom palette builder
- Toggle "Custom palette" in Palette step.
- 4 `<input type="color">` for primary/accent/surface/background + hex text inputs.
- Optional HSL sliders for fine control.
- Contrast badge recomputes live.

### 3b · Full Google Fonts catalog (~1500 families)

`.github/workflows/sync-fonts.yml`:
```yaml
name: Sync Google Fonts metadata
on:
  workflow_dispatch:
  schedule: [{ cron: "0 0 1 */3 *" }]
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          curl -sL "https://fonts.google.com/metadata/fonts" \
            | tail -c +6 \
            | jq '[.familyMetadataList[] | { family, category, popularity: .defaultSort, weights: [.fonts | keys[]] }]' \
            > data/google-fonts.json
      - uses: stefanzweifel/git-auto-commit-action@v5
        with: { file_pattern: data/google-fonts.json }
```

### Font picker UI
- Two tabs: "Curated pairings" (current) | "Browse all".
- In "Browse": virtualized list, search by family/category.
- Specimen lazy-loaded by dynamically injecting `<link>` when card enters viewport.
- Independent heading and body family selection.

---

## Phase 4 · Brand assets (social + cards + mockups)

So the export is a real kit, not just a logo.

### Files
- `data/asset-templates.json` — 9 asset definitions
- `assets/mockups/*.jpg` — CC0 photo bases (t-shirt, mug, tote, laptop)
- `renderer.js` — `renderAsset(state, assetId, w, h)`
- `vendor/jszip.min.js` — vendored JSZip (~40 KB, MIT)
- `app.js` — new "Assets" step + ZIP export

### Asset definitions
```json
[
  { "id": "business-card-front", "name": "Business Card · Front", "width": 1050, "height": 600 },
  { "id": "business-card-back",  "name": "Business Card · Back",  "width": 1050, "height": 600 },
  { "id": "instagram-post",      "name": "Instagram Post",        "width": 1080, "height": 1080 },
  { "id": "instagram-story",     "name": "Instagram Story",       "width": 1080, "height": 1920 },
  { "id": "fb-cover",            "name": "Facebook Cover",        "width": 1640, "height": 924 },
  { "id": "twitter-header",      "name": "Twitter Header",        "width": 1500, "height": 500 },
  { "id": "linkedin-banner",     "name": "LinkedIn Banner",       "width": 1584, "height": 396 },
  { "id": "youtube-banner",      "name": "YouTube Banner",        "width": 2560, "height": 1440 },
  { "id": "letterhead",          "name": "Letterhead A4",         "width": 2480, "height": 3508 },
  { "id": "email-signature",     "name": "Email Signature",       "width": 600,  "height": 200 },
  { "id": "favicon-set",         "name": "Favicon set (16/32/180/512)" }
]
```

### Renderer pattern
```js
const ASSETS = {
  "instagram-post": function (n, w, h, state) {
    return ''
      + '<rect width="' + w + '" height="' + h + '" fill="' + n.c0 + '"/>'
      + '<g transform="translate(' + (w/2 - 200) + ' ' + (h/2 - 100) + ') scale(1.2)">'
      +   /* logo on dark variant */
      + '</g>'
      + '<text x="' + w/2 + '" y="' + (h - 80) + '" text-anchor="middle"'
      + '  font-family=' + JSON.stringify(n.body) + ' font-size="32" fill="' + n.c2 + '">'
      + escapeXml(n.tagline) + '</text>';
  }
};
```

### Mockups
Pre-made photo + SVG mask. Composite via `<image>` + `<g mask>` or canvas.

### ZIP export
Vendored JSZip → "Download brand kit" packs every SVG + PNG into one file.

---

## Phase 5 · Multi-page brand book (12–16 pages)

`print.html` expands to a real book.

### Page outline
1. Cover
2. Contents
3. Mission / vision (editable inputs)
4. Logo · primary
5. Logo · construction grid + clear space
6. Logo · variants (primary/dark/mono/inverted)
7. Logo · minimum sizes (16/24/32/64/128/256 px)
8. Logo · do/don't (6 visual examples)
9. Color system (HEX/RGB/CMYK/HSL/PMS-approx)
10. Color usage (60/30/10 rule diagram)
11. Type system (heading + body + scale)
12. Type usage (heading + paragraph + caption in context)
13. Imagery direction (mood board placeholder)
14. Applications (mini renders of business card / social / signature)
15. Tone of voice (adjectives picker + sample copy)
16. Colophon

### CSS
```css
@media print {
  .page { page-break-after: always; height: 297mm; padding: 24mm 18mm; }
  @page { size: A4; margin: 0; }
}
```

### Pre-print
Mini form for mission/vision/tone inputs the user wants to include. Defaults synthesized from name.

### Optional: server-side PDF via GH Action + Puppeteer
```yaml
on: { workflow_dispatch: { inputs: { kit-id: { required: true } } } }
jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm i puppeteer
      - run: node tools/render-pdf.js ${{ inputs.kit-id }}
      - uses: actions/upload-artifact@v4
        with: { name: brandbook.pdf, path: out.pdf }
```
Trigger from app via Cloudflare Worker, poll artifact URL, download async (~30 s).

---

## Phase 6 · Save / share / kit history

### 6a · Multiple local projects
- `localStorage` key `lerna-brand:projects:v1`: array of named snapshots.
- Topbar "My projects" dropdown: list, new, rename, delete.

### 6b · Share via URL
- Encode full state (including custom palette/font) as `#<base64>` in builder URL.
- Open → load state + offer "Save as new project".
- If state > 2 KB, optional Cloudflare Worker URL shortener.

### 6c · Permanent save via GitHub (optional)
Devil-tv pattern:
- Cloudflare Worker `lerna-brand-save` with `/save` endpoint creates an issue in `lerna-soft/lerna-brand-kits` (separate repo) with JSON in body.
- Returns `{ url, id }`.
- App: "Save permanently" button.
- Open kit by ID: `app.html?kit=<id>` fetches issue body, loads state.

---

## Phase 7 · Trust signals + business name generator + trademark links

### 7a · Inspiration gallery on landing
`data/samples.json` with 24 pre-built kits. Landing renders preview cards via `renderer.js`. Click → enters builder pre-loaded.

### 7b · Business name generator
```json
// data/word-banks.json
{
  "tech": {
    "prefixes": ["neo", "axiom", "zen", "spire", "loop"],
    "roots":    ["forge", "stack", "core", "bit", "node", "wave"],
    "suffixes": ["io", "labs", "hub", "kit", "ware", "base"]
  }
}
```

4 strategies in JS:
- Concatenation (prefix+root | root+suffix)
- Markov 2-gram from a real-name corpus
- Portmanteau (truncated 2-word merge)
- Made-up (alternating vowel+consonant)

UI: "industry" selector + "Generate 20 names". Each card: name, likely-available domain (`.com .io .co .app`), "Use this name" button. Domain check via `domainsdb.info` (free, no key) or out-link to `namechk.com`.

### 7c · Trademark search
Button in Identity step: `Check trademark availability →` opens USPTO TESS in new tab with prefilled query. No scraping.

---

## Phase 8 · Variations engine v2 ("AI-ish" without AI)

### Algorithm upgrades
- **Color harmonies**: detect complementary/analogous/triadic palettes from HSL.
- **Font pairing rules**: serif+sans, display+body, contrast tiers in `data/pairing-rules.json`.
- **Industry affinity matrix**: precomputed score table (industry × template × palette × font).
- **Temperature sampling**: weighted-random instead of pure top-N so regenerate produces fresh sets.

### Endless variations
- "Show 24 more" — tracks shown set, never repeats.
- Style chips: "More bold", "More minimal", "More colorful" — reweighting on the fly.

---

## Summary

| Phase | Sessions | Gap it closes |
|-------|----------|---------------|
| 1 — Quiz + shuffle | 1 | Changes the product's value proposition |
| 2 — Icon catalog | 1–2 | Matches Tailor's icon library |
| 3 — Custom colors + full Google Fonts | 1 | Matches customization depth |
| 4 — Asset templates + ZIP | 2 | Matches "brand kit" deliverable |
| 5 — Multi-page brand book | 1 | Matches the final document |
| 6 — Save / share / history | 1 | Matches persistence (without real account) |
| 7 — Trust + name gen + trademark | 1 | Matches landing + adjacent tools |
| 8 — Variations engine v2 | 1 | Matches "AI generation" feel without cost |

**Total estimate**: ~9–11 sessions of 1–3 hours.

**Stack (100% free)**:
- Frontend vanilla on GitHub Pages (free).
- GitHub Actions for catalog regeneration (free in public repos).
- Cloudflare Worker for save/share/PDF render (free tier 100k/day).
- JSZip + Lucide/Tabler/Google Fonts metadata (all MIT/CC0).

**Open decisions** (mark before starting each phase):
1. Icon catalog: **Tabler** (5 k, recommended) vs Lucide (1.4 k, more curated) vs Phosphor (9 k, multi-style).
2. Mockups: CC0 photo pack vs commission custom.
3. Permanent save: build the Cloudflare Worker or stay on URL share + localStorage.
4. Server-side PDF: needed or does `window.print()` suffice (recommendation: suffices).
5. Whether to swap Phase 7 with Phase 8 — Variations engine v2 fills the sample gallery automatically.

**Recommended starting point**: Phase 1 — biggest UX shift, foundation for everything else.
