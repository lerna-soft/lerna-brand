// Lerna Brand · App state and UI wiring
// Vanilla JS, no build step. Loads data from /data/*.json, renders preview, exports JSON.

(function () {
  "use strict";

  const isAppPage = document.body.dataset.page === "app";
  if (!isAppPage) return;

  const STEPS = ["template", "identity", "palette", "typography", "export"];
  const STORAGE_KEY = "lerna-brand:state:v1";

  const state = {
    step: "template",
    template: null,
    name: "",
    tagline: "",
    palette: null,
    fontPair: null,
    icon: null,
  };

  // ---------- persistence ----------
  function snapshot() {
    return {
      step: state.step,
      name: state.name,
      tagline: state.tagline,
      templateId: state.template && state.template.id,
      paletteId: state.palette && state.palette.id,
      fontId: state.fontPair && state.fontPair.id,
      iconId: state.icon && state.icon.id,
    };
  }
  let saveTimer = null;
  function persist() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot())); } catch (e) { /* quota or unavailable */ }
    }, 200);
  }
  function loadPersisted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function clearPersisted() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  const els = {
    steps: document.querySelectorAll(".step"),
    panels: document.querySelectorAll(".panel-step"),
    stepLabel: document.getElementById("preview-step-label"),
    previewLogo: document.getElementById("preview-logo"),
    previewTagline: document.getElementById("preview-tagline"),
    inputName: document.getElementById("input-name"),
    inputTagline: document.getElementById("input-tagline"),
    templateGrid: document.getElementById("template-grid"),
    paletteGrid: document.getElementById("palette-grid"),
    fontGrid: document.getElementById("font-grid"),
    btnReset: document.getElementById("action-reset"),
    btnExport: document.getElementById("action-export"),
    btnExportJson: document.getElementById("export-json"),
    exportStatus: document.getElementById("export-status"),
    exportBrandSheet: document.getElementById("export-brandsheet"),
    toast: document.getElementById("toast"),
    iconPicker: document.getElementById("icon-picker"),
    iconSearch: document.getElementById("icon-search"),
    iconClear: document.getElementById("icon-clear"),
    iconGrid: document.getElementById("icon-grid"),
  };

  let toastTimer = null;
  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 4500);
  }

  // ---------- step navigation ----------
  function goTo(step) {
    if (!STEPS.includes(step)) return;
    state.step = step;
    els.steps.forEach((el) => {
      el.classList.toggle("is-active", el.dataset.step === step);
    });
    els.panels.forEach((el) => {
      el.classList.toggle("is-active", el.dataset.panel === step);
    });
    const idx = STEPS.indexOf(step);
    const titles = ["Pick a template", "Name your brand", "Pick a palette", "Pick a font pair", "Export"];
    els.stepLabel.textContent = `Step ${idx + 1} · ${titles[idx]}`;
    persist();
  }

  els.steps.forEach((el) => {
    el.addEventListener("click", () => goTo(el.dataset.step));
  });
  document.querySelectorAll("[data-next]").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = STEPS.indexOf(state.step);
      if (idx < STEPS.length - 1) goTo(STEPS[idx + 1]);
    });
  });
  document.querySelectorAll("[data-prev]").forEach((b) => {
    b.addEventListener("click", () => {
      const idx = STEPS.indexOf(state.step);
      if (idx > 0) goTo(STEPS[idx - 1]);
    });
  });

  // ---------- preview render ----------
  function render() {
    const tagline = state.tagline.trim() || "Your tagline lives here.";

    els.previewLogo.innerHTML = window.LernaBrandRender.renderSvg(state);
    els.previewTagline.textContent = tagline;
    els.previewTagline.style.fontFamily = state.fontPair?.body || "";

    const ready = state.template && state.name && state.palette && state.fontPair;
    els.btnExport.disabled = !ready;
  }

  // ---------- input wiring ----------
  els.inputName.addEventListener("input", (e) => { state.name = e.target.value; render(); persist(); });
  els.inputTagline.addEventListener("input", (e) => { state.tagline = e.target.value; render(); persist(); });

  // ---------- contrast helpers ----------
  function hexToRgbArr(hex) {
    const v = String(hex || "").replace("#", "");
    const n = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
    const num = parseInt(n, 16);
    if (Number.isNaN(num)) return [0, 0, 0];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  function relativeLuminance(hex) {
    const rgb = hexToRgbArr(hex).map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function contrastRatio(hexA, hexB) {
    const lA = relativeLuminance(hexA);
    const lB = relativeLuminance(hexB);
    const lighter = Math.max(lA, lB);
    const darker = Math.min(lA, lB);
    return (lighter + 0.05) / (darker + 0.05);
  }
  function contrastBadge(palette) {
    // Primary text (colors[0]) vs background (colors[3]); fallback to colors[2] if [3] missing.
    const fg = palette.colors[0];
    const bg = palette.colors[3] || palette.colors[2];
    const r = contrastRatio(fg, bg);
    const label = r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA Large" : "Fail";
    const pass = r >= 4.5;
    return { ratio: r.toFixed(1), label: label, pass: pass };
  }

  // ---------- data loading ----------
  async function loadJson(path) {
    try {
      const r = await fetch(path);
      if (!r.ok) throw new Error(r.statusText);
      return await r.json();
    } catch (e) {
      console.warn(`failed to load ${path}:`, e);
      return null;
    }
  }

  function renderTemplates(items) {
    if (!items?.length) {
      els.templateGrid.innerHTML = `<p class="loading">No templates yet. Add one to <code>data/templates.json</code>.</p>`;
      return;
    }
    els.templateGrid.innerHTML = items.map((t) => `
      <button type="button" class="option" data-template-id="${t.id}">
        <span class="option-title">${t.name}</span>
        <span class="option-desc">${t.description || ""}</span>
      </button>
    `).join("");
    els.templateGrid.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.templateId;
        state.template = items.find((t) => t.id === id);
        els.templateGrid.querySelectorAll(".option").forEach((b) => b.classList.toggle("is-selected", b === btn));
        toggleIconPicker();
        render();
        persist();
      });
    });
  }

  // ---------- icon picker ----------
  function templateUsesIcon(t) {
    return t && t.kind === "lockup" && t.variant === "square";
  }
  let iconCatalog = null;
  let iconLoadPromise = null;
  async function ensureIconsLoaded() {
    if (iconCatalog) return iconCatalog;
    if (iconLoadPromise) return iconLoadPromise;
    iconLoadPromise = (async () => {
      els.iconGrid.innerHTML = '<p class="loading">Loading 5,000+ icons…</p>';
      const r = await fetch("data/icons.json");
      iconCatalog = r.ok ? await r.json() : [];
      return iconCatalog;
    })();
    return iconLoadPromise;
  }
  function renderIconGrid(filtered) {
    const cap = 120;
    const shown = filtered.slice(0, cap);
    const more = filtered.length - shown.length;
    if (!shown.length) {
      els.iconGrid.innerHTML = '<p class="loading">No icons match.</p>';
      return;
    }
    const cells = shown.map((ic) => {
      const inner = window.LernaBrandRender.renderIcon(ic, "#0a0a0a", 1, 0, 0);
      return `<button type="button" class="icon-cell" data-icon-id="${ic.id}" title="${ic.name}" aria-label="${ic.name}">
        <svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>
      </button>`;
    }).join("");
    const tail = more > 0 ? `<div class="icon-more">+${more} more — narrow your search</div>` : "";
    els.iconGrid.innerHTML = cells + tail;
    els.iconGrid.querySelectorAll(".icon-cell").forEach((b) => {
      const id = b.dataset.iconId;
      if (state.icon && state.icon.id === id) b.classList.add("is-selected");
      b.addEventListener("click", () => {
        const icon = iconCatalog.find((x) => x.id === id);
        state.icon = icon || null;
        els.iconGrid.querySelectorAll(".icon-cell").forEach((c) => c.classList.toggle("is-selected", c === b));
        render();
        persist();
      });
    });
  }
  function iconSearch(query) {
    if (!iconCatalog) return;
    const q = String(query || "").trim().toLowerCase();
    let filtered;
    if (!q) {
      // Popular defaults: take the first hundred-ish that are commonly named
      const seedNames = ["rocket", "leaf", "bolt", "heart", "star", "shield", "globe", "code", "feather", "anchor", "bulb", "flame", "compass", "diamond", "key", "map", "moon", "sun", "wave", "wind", "flag", "lock", "music", "phone", "tree", "wand", "wand-stars", "yin-yang", "atom", "bell"];
      const matched = [];
      for (const name of seedNames) {
        const f = iconCatalog.find((x) => x.id === name);
        if (f) matched.push(f);
      }
      filtered = matched.length ? matched : iconCatalog.slice(0, 120);
    } else {
      filtered = iconCatalog.filter((x) => x.id.includes(q) || x.tags.some((t) => t.includes(q)));
    }
    renderIconGrid(filtered);
  }
  let iconSearchTimer = null;
  function toggleIconPicker() {
    if (!els.iconPicker) return;
    if (templateUsesIcon(state.template)) {
      els.iconPicker.hidden = false;
      ensureIconsLoaded().then(() => iconSearch(els.iconSearch.value));
    } else {
      els.iconPicker.hidden = true;
      // clear icon when template doesn't use it
      if (state.icon) { state.icon = null; render(); persist(); }
    }
  }
  if (els.iconSearch) {
    els.iconSearch.addEventListener("input", () => {
      if (iconSearchTimer) clearTimeout(iconSearchTimer);
      iconSearchTimer = setTimeout(() => iconSearch(els.iconSearch.value), 200);
    });
  }
  if (els.iconClear) {
    els.iconClear.addEventListener("click", () => {
      state.icon = null;
      els.iconSearch.value = "";
      els.iconGrid.querySelectorAll(".icon-cell").forEach((c) => c.classList.remove("is-selected"));
      render();
      persist();
    });
  }

  function renderPalettes(items) {
    if (!items?.length) {
      els.paletteGrid.innerHTML = `<p class="loading">No palettes yet. Add one to <code>data/palettes.json</code>.</p>`;
      return;
    }
    els.paletteGrid.innerHTML = items.map((p) => {
      const c = contrastBadge(p);
      return `
      <button type="button" class="option" data-palette-id="${p.id}">
        <span class="option-title">${p.name}</span>
        <span class="palette-swatches">
          ${p.colors.map((col) => `<span style="background:${col}"></span>`).join("")}
        </span>
        <span class="option-foot">
          ${p.mood ? `<span class="option-meta">${p.mood}</span>` : "<span></span>"}
          <span class="contrast-badge ${c.pass ? "is-pass" : "is-warn"}" title="Primary text on background">${c.label} · ${c.ratio}:1</span>
        </span>
      </button>
    `;
    }).join("");
    els.paletteGrid.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.paletteId;
        state.palette = items.find((p) => p.id === id);
        els.paletteGrid.querySelectorAll(".option").forEach((b) => b.classList.toggle("is-selected", b === btn));
        render();
        persist();
      });
    });
  }

  function renderFonts(items) {
    if (!items?.length) {
      els.fontGrid.innerHTML = `<p class="loading">No font pairings yet. Add one to <code>data/fonts.json</code>.</p>`;
      return;
    }
    els.fontGrid.innerHTML = items.map((f) => `
      <button type="button" class="option" data-font-id="${f.id}">
        <span class="option-title" style="font-family:${f.heading}; font-weight:${f.weights?.heading || 700}">${f.name}</span>
        <span class="font-specimen" style="font-family:${f.body}">${f.heading.split(",")[0].replace(/['"]/g, "")} / ${f.body.split(",")[0].replace(/['"]/g, "")}</span>
        ${f.mood ? `<span class="option-meta">${f.mood}</span>` : ""}
      </button>
    `).join("");
    els.fontGrid.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.fontId;
        state.fontPair = items.find((f) => f.id === id);
        els.fontGrid.querySelectorAll(".option").forEach((b) => b.classList.toggle("is-selected", b === btn));
        render();
        persist();
      });
    });
  }

  // ---------- export helpers ----------
  function slugFromName() {
    return (state.name || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand";
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  }

  function setStatus(msg, error) {
    if (!els.exportStatus) return;
    els.exportStatus.textContent = msg || "";
    els.exportStatus.hidden = !msg;
    els.exportStatus.classList.toggle("is-error", !!error);
  }

  function isReady() {
    return !!(state.template && state.name && state.palette && state.fontPair);
  }

  function buildExportSvg(opts) {
    return window.LernaBrandRender.renderSvg(state, opts || {});
  }

  // ---------- exports ----------

  function exportKitJson() {
    if (!isReady()) return;
    const kit = {
      brand: state.name,
      tagline: state.tagline,
      template: state.template,
      palette: state.palette,
      typography: state.fontPair,
      generatedAt: new Date().toISOString(),
      tool: "lerna-brand",
    };
    const blob = new Blob([JSON.stringify(kit, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${slugFromName()}-brand-kit.json`);
    setStatus("Saved JSON manifest.");
  }

  function exportSvg() {
    if (!isReady()) return;
    const svg = buildExportSvg({ width: 1200, height: 600, background: state.palette.colors[3] });
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, `${slugFromName()}-logo.svg`);
    setStatus("Saved SVG.");
  }

  async function exportPng(size, opts) {
    if (!isReady()) return;
    opts = opts || {};
    const aspect = opts.square ? 1 : 0.5; // 0.5 = 2:1 (400x200)
    const width = size;
    const height = Math.round(size * aspect);
    try {
      setStatus("Loading fonts…");
      try { await document.fonts.ready; } catch (e) { /* not supported */ }
      const svg = buildExportSvg({
        width: opts.square ? 400 : 400,
        height: opts.square ? 400 : 200,
        background: state.palette.colors[3] || "#ffffff",
        square: opts.square,
      });
      const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error("svg image load failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = state.palette.colors[3] || "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      if (!blob) throw new Error("canvas.toBlob failed");
      const suffix = opts.square ? `-favicon-${size}` : `-${size}`;
      downloadBlob(blob, `${slugFromName()}${suffix}.png`);
      setStatus(`Saved PNG ${size}px.`);
    } catch (e) {
      console.error(e);
      setStatus("PNG export failed. Try SVG instead — fonts may not embed in PNG on some browsers.", true);
    }
  }

  function buildBrandSheetUrl() {
    if (!isReady()) return "#";
    const payload = {
      n: state.name,
      t: state.tagline,
      tpl: state.template.id,
      pal: state.palette.id,
      f: state.fontPair.id,
    };
    const hash = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return `print.html#${hash}`;
  }

  // ---------- wire export ----------
  els.btnExport.addEventListener("click", () => {
    if (!isReady()) { setStatus("Pick a template, name, palette and typography first.", true); }
    goTo("export");
  });
  if (els.btnExportJson) els.btnExportJson.addEventListener("click", exportKitJson);
  document.querySelectorAll("[data-export]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isReady()) { setStatus("Pick a template, name, palette and typography first.", true); return; }
      const kind = btn.dataset.export;
      if (kind === "svg") return exportSvg();
      if (kind === "png-512") return exportPng(512);
      if (kind === "png-1024") return exportPng(1024);
      if (kind === "png-2048") return exportPng(2048);
      if (kind === "favicon") return exportPng(64, { square: true });
    });
  });
  if (els.exportBrandSheet) {
    els.exportBrandSheet.addEventListener("click", (e) => {
      if (!isReady()) { e.preventDefault(); setStatus("Pick a template, name, palette and typography first.", true); return; }
      els.exportBrandSheet.href = buildBrandSheetUrl();
    });
  }

  // ---------- reset ----------
  els.btnReset.addEventListener("click", () => {
    if (!confirm("Reset all selections?")) return;
    Object.assign(state, { template: null, name: "", tagline: "", palette: null, fontPair: null, icon: null });
    els.inputName.value = "";
    els.inputTagline.value = "";
    document.querySelectorAll(".option.is-selected, .icon-cell.is-selected").forEach((b) => b.classList.remove("is-selected"));
    if (els.iconPicker) els.iconPicker.hidden = true;
    if (els.iconSearch) els.iconSearch.value = "";
    clearPersisted();
    setStatus("");
    goTo("template");
    render();
  });

  function restoreFromSnapshot(snap, templates, palettes, fonts) {
    if (!snap) return false;
    let restored = false;
    if (snap.name) { state.name = snap.name; els.inputName.value = snap.name; restored = true; }
    if (snap.tagline) { state.tagline = snap.tagline; els.inputTagline.value = snap.tagline; restored = true; }
    if (snap.templateId && templates) {
      state.template = templates.find((t) => t.id === snap.templateId) || null;
      if (state.template) {
        const btn = els.templateGrid.querySelector(`[data-template-id="${snap.templateId}"]`);
        if (btn) btn.classList.add("is-selected");
        restored = true;
        toggleIconPicker();
      }
    }
    if (snap.iconId) {
      ensureIconsLoaded().then((cat) => {
        const ic = cat.find((x) => x.id === snap.iconId);
        if (ic) {
          state.icon = ic;
          render();
          // mark selected if visible
          const cell = document.querySelector(`.icon-cell[data-icon-id="${snap.iconId}"]`);
          if (cell) cell.classList.add("is-selected");
        }
      });
    }
    if (snap.paletteId && palettes) {
      state.palette = palettes.find((p) => p.id === snap.paletteId) || null;
      if (state.palette) {
        const btn = els.paletteGrid.querySelector(`[data-palette-id="${snap.paletteId}"]`);
        if (btn) btn.classList.add("is-selected");
        restored = true;
      }
    }
    if (snap.fontId && fonts) {
      state.fontPair = fonts.find((f) => f.id === snap.fontId) || null;
      if (state.fontPair) {
        const btn = els.fontGrid.querySelector(`[data-font-id="${snap.fontId}"]`);
        if (btn) btn.classList.add("is-selected");
        restored = true;
      }
    }
    if (snap.step && STEPS.includes(snap.step)) goTo(snap.step);
    return restored;
  }

  // ---------- boot ----------
  (async function init() {
    const [templates, palettes, fonts] = await Promise.all([
      loadJson("data/templates.json"),
      loadJson("data/palettes.json"),
      loadJson("data/fonts.json"),
    ]);
    renderTemplates(templates);
    renderPalettes(palettes);
    renderFonts(fonts);

    const snap = loadPersisted();
    const restored = restoreFromSnapshot(snap, templates, palettes, fonts);
    if (restored) showToast("Restored from your last session. Hit Reset to start over.");

    render();
  })();
})();
