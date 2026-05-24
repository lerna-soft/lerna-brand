#!/usr/bin/env node
// Builds data/icons.json from the @tabler/icons package.
// Run automatically by .github/workflows/sync-icons.yml.
//
// Strategy: read every .svg under node_modules/@tabler/icons/icons/outline,
// extract each <path d="..."/>, and emit a compact JSON record per icon
// with id, name, tags (split from id), and the raw path data.

const fs = require("fs");
const path = require("path");

const candidates = [
  "node_modules/@tabler/icons/icons/outline",
  "node_modules/@tabler/icons/icons",
];
const dir = candidates.find((d) => fs.existsSync(d));
if (!dir) {
  console.error("Could not locate @tabler/icons in node_modules.");
  console.error("Run: npm install @tabler/icons --no-save");
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".svg"));
console.error("Found", files.length, "tabler outline icons in", dir);

const SHAPE_RE = /<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*)\/?>/g;
const ATTR_RE = /(\w[\w-]*)\s*=\s*"([^"]*)"/g;

function extractShapes(svg) {
  const shapes = [];
  let m;
  while ((m = SHAPE_RE.exec(svg)) !== null) {
    const tag = m[1];
    const attrText = m[2];
    const attrs = {};
    let am;
    ATTR_RE.lastIndex = 0;
    while ((am = ATTR_RE.exec(attrText)) !== null) attrs[am[1]] = am[2];
    shapes.push({ tag, attrs });
  }
  return shapes;
}

const out = files.map((f) => {
  const id = f.replace(/\.svg$/, "");
  const svg = fs.readFileSync(path.join(dir, f), "utf8");
  const shapes = extractShapes(svg);
  return {
    id,
    name: id.replace(/-/g, " "),
    tags: id.split("-").filter(Boolean),
    shapes,
  };
});

fs.mkdirSync("data", { recursive: true });
const outFile = "data/icons.json";
fs.writeFileSync(outFile, JSON.stringify(out));
const bytes = fs.statSync(outFile).size;
console.error("Wrote", outFile, `(${out.length} icons, ${(bytes / 1024 / 1024).toFixed(2)} MB)`);
