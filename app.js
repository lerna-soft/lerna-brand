// Lerna Brand · App state and UI wiring
// Vanilla JS, no build step. Loads data from /data/*.json, renders preview, exports JSON.

(function () {
  "use strict";

  const isAppPage = document.body.dataset.page === "app";
  if (!isAppPage) return;

  const STEPS = ["template", "identity", "palette", "typography", "export"];

  const state = {
    step: "template",
    template: null,
    name: "",
    tagline: "",
    palette: null,
    fontPair: null,
  };

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
  };

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
  els.inputName.addEventListener("input", (e) => { state.name = e.target.value; render(); });
  els.inputTagline.addEventListener("input", (e) => { state.tagline = e.target.value; render(); });

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
        render();
      });
    });
  }

  function renderPalettes(items) {
    if (!items?.length) {
      els.paletteGrid.innerHTML = `<p class="loading">No palettes yet. Add one to <code>data/palettes.json</code>.</p>`;
      return;
    }
    els.paletteGrid.innerHTML = items.map((p) => `
      <button type="button" class="option" data-palette-id="${p.id}">
        <span class="option-title">${p.name}</span>
        <span class="palette-swatches">
          ${p.colors.map((c) => `<span style="background:${c}"></span>`).join("")}
        </span>
        ${p.mood ? `<span class="option-meta">${p.mood}</span>` : ""}
      </button>
    `).join("");
    els.paletteGrid.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.paletteId;
        state.palette = items.find((p) => p.id === id);
        els.paletteGrid.querySelectorAll(".option").forEach((b) => b.classList.toggle("is-selected", b === btn));
        render();
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
    Object.assign(state, { template: null, name: "", tagline: "", palette: null, fontPair: null });
    els.inputName.value = "";
    els.inputTagline.value = "";
    document.querySelectorAll(".option.is-selected").forEach((b) => b.classList.remove("is-selected"));
    goTo("template");
    render();
  });

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
    render();
  })();
})();
