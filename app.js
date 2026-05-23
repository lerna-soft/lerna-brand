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
    const name = state.name.trim() || "YOUR BRAND";
    const tagline = state.tagline.trim() || "Your tagline lives here.";
    const fontFamily = state.fontPair?.heading || "Inter, sans-serif";
    const fgColor = state.palette?.colors?.[0] || "currentColor";

    els.previewLogo.innerHTML = `
      <svg viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <text x="160" y="78" text-anchor="middle"
              font-family='${fontFamily}'
              font-weight="800" font-size="56" fill="${fgColor}">
          ${escapeXml(name.toUpperCase())}
        </text>
      </svg>
    `;
    els.previewTagline.textContent = tagline;
    els.previewTagline.style.fontFamily = state.fontPair?.body || "";

    const ready = state.template && state.name && state.palette && state.fontPair;
    els.btnExport.disabled = !ready;
  }

  function escapeXml(s) {
    return String(s).replace(/[<>&'"]/g, (c) => ({
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    })[c]);
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
        <span class="option-meta">${t.kind}</span>
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
        <span class="option-title" style="font-family:${f.heading}">${f.name}</span>
        <span style="font-family:${f.body}; font-size:12px; color:var(--fg-mute)">${f.heading.split(",")[0]} / ${f.body.split(",")[0]}</span>
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

  // ---------- export ----------
  function exportKitJson() {
    if (!state.template || !state.name || !state.palette || !state.fontPair) return;
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
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${state.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-brand-kit.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  els.btnExport.addEventListener("click", exportKitJson);
  if (els.btnExportJson) els.btnExportJson.addEventListener("click", exportKitJson);

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
