// Lerna Brand · SVG renderer for logo templates.
// Each template is a pure function: (state) → SVG markup string.
// Shared between the builder app (app.js) and the printable brand sheet (print.html).

(function (global) {
  "use strict";

  // ---------- utilities ----------

  function escapeXml(s) {
    return String(s == null ? "" : s).replace(/[<>&'"]/g, function (c) {
      return ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c];
    });
  }

  function initials(name, max) {
    var max_ = max || 2;
    var clean = String(name || "").trim();
    if (!clean) return "AB";
    var parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= max_) {
      return parts.slice(0, max_).map(function (p) { return p[0]; }).join("").toUpperCase();
    }
    return clean.replace(/[^a-zA-Z0-9]/g, "").slice(0, max_).toUpperCase();
  }

  function normalize(state) {
    var name = (state && state.name ? state.name : "").trim() || "Your Brand";
    var tagline = (state && state.tagline ? state.tagline : "").trim();
    var palette = (state && state.palette) || { colors: ["#0a0a0a", "#ff5a1f", "#f5f5f2", "#ffffff"] };
    var fontPair = (state && state.fontPair) || { heading: "Inter, sans-serif", body: "Inter, sans-serif", weights: { heading: 800, body: 400 } };
    var colors = palette.colors || ["#0a0a0a", "#ff5a1f", "#f5f5f2", "#ffffff"];
    return {
      name: name,
      tagline: tagline,
      c0: colors[0] || "#0a0a0a",
      c1: colors[1] || "#ff5a1f",
      c2: colors[2] || "#f5f5f2",
      c3: colors[3] || "#ffffff",
      heading: fontPair.heading || "Inter, sans-serif",
      body: fontPair.body || "Inter, sans-serif",
      hWeight: (fontPair.weights && fontPair.weights.heading) || 700,
      bWeight: (fontPair.weights && fontPair.weights.body) || 400,
      icon: state && state.icon || null,
    };
  }

  // Tabler-icon shape → minimal SVG element.
  // Geometry attrs only; the parent <g> supplies fill=none + stroke colour.
  var GEOM_KEYS = ["d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "points"];
  function shapeToSvg(s) {
    if (!s || !s.attrs) return "";
    if (s.attrs.stroke === "none" && s.attrs.fill === "none") return "";
    var parts = [];
    for (var i = 0; i < GEOM_KEYS.length; i++) {
      var k = GEOM_KEYS[i];
      if (s.attrs[k] != null) parts.push(k + '="' + s.attrs[k] + '"');
    }
    return "<" + s.tag + " " + parts.join(" ") + "/>";
  }
  function renderIcon(icon, color, scale, tx, ty) {
    if (!icon || !icon.shapes) return "";
    var body = icon.shapes.map(shapeToSvg).join("");
    return '<g transform="translate(' + tx + ' ' + ty + ') scale(' + scale + ')"'
      + ' fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
      + body + '</g>';
  }

  // ---------- templates ----------
  // Common viewBox is 400×200. Renderers return inner SVG markup;
  // wrapSvg() handles the <svg> tag.

  var TEMPLATES = {
    "wordmark-bold": function (n) {
      return ''
        + '<text x="200" y="120" text-anchor="middle"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + Math.max(700, n.hWeight) + '"'
        + '  font-size="60" letter-spacing="-1" fill="' + n.c0 + '">'
        + escapeXml(n.name.toUpperCase())
        + '</text>';
    },

    "wordmark-serif": function (n) {
      return ''
        + '<text x="200" y="125" text-anchor="middle"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + n.hWeight + '"'
        + '  font-style="italic"'
        + '  font-size="56" fill="' + n.c0 + '">'
        + escapeXml(n.name)
        + '</text>';
    },

    "wordmark-underline": function (n) {
      var label = escapeXml(n.name.toUpperCase());
      return ''
        + '<text x="200" y="105" text-anchor="middle"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + Math.max(700, n.hWeight) + '"'
        + '  font-size="52" fill="' + n.c0 + '">' + label + '</text>'
        + '<rect x="80" y="120" width="240" height="6" fill="' + n.c1 + '"/>';
    },

    "wordmark-bracket": function (n) {
      var label = escapeXml(n.name.toUpperCase());
      return ''
        + '<text x="60" y="128" font-family=' + JSON.stringify(n.heading)
        + '  font-weight="400" font-size="78" fill="' + n.c1 + '">[</text>'
        + '<text x="200" y="120" text-anchor="middle"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + Math.max(700, n.hWeight) + '"'
        + '  font-size="50" fill="' + n.c0 + '">' + label + '</text>'
        + '<text x="340" y="128" font-family=' + JSON.stringify(n.heading)
        + '  font-weight="400" font-size="78" fill="' + n.c1 + '">]</text>';
    },

    "wordmark-stacked": function (n) {
      var top = escapeXml(n.name.toUpperCase());
      var bottom = escapeXml((n.tagline || "Est. " + new Date().getFullYear()).toUpperCase());
      return ''
        + '<text x="200" y="100" text-anchor="middle"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + Math.max(700, n.hWeight) + '"'
        + '  font-size="48" letter-spacing="-1" fill="' + n.c0 + '">' + top + '</text>'
        + '<line x1="160" y1="115" x2="240" y2="115" stroke="' + n.c1 + '" stroke-width="2"/>'
        + '<text x="200" y="138" text-anchor="middle"'
        + '  font-family="JetBrains Mono, monospace"'
        + '  font-size="10" letter-spacing="4" fill="' + n.c0 + '">' + bottom + '</text>';
    },

    "lockup-icon-left": function (n) {
      var word = escapeXml(n.name.toUpperCase());
      var mark = n.icon
        ? renderIcon(n.icon, n.c1, 2.5, 56, 70)
        : '<rect x="60" y="75" width="56" height="56" rx="6" fill="' + n.c1 + '"/>'
          + '<rect x="74" y="89" width="28" height="28" fill="' + n.c3 + '"/>';
      return mark
        + '<text x="130" y="118"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + Math.max(700, n.hWeight) + '"'
        + '  font-size="44" fill="' + n.c0 + '">' + word + '</text>';
    },

    "lockup-dot-left": function (n) {
      var word = escapeXml(n.name);
      return ''
        + '<circle cx="80" cy="100" r="14" fill="' + n.c1 + '"/>'
        + '<text x="108" y="115"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + Math.max(600, n.hWeight) + '"'
        + '  font-size="44" fill="' + n.c0 + '">' + word + '</text>';
    },

    "monogram-circle": function (n) {
      var ini = escapeXml(initials(n.name));
      return ''
        + '<circle cx="200" cy="100" r="68" fill="' + n.c0 + '"/>'
        + '<text x="200" y="120" text-anchor="middle"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + Math.max(700, n.hWeight) + '"'
        + '  font-size="54" fill="' + n.c2 + '">' + ini + '</text>'
        + '<text x="200" y="185" text-anchor="middle"'
        + '  font-family="JetBrains Mono, monospace"'
        + '  font-size="10" letter-spacing="3" fill="' + n.c0 + '">' + escapeXml(n.name.toUpperCase()) + '</text>';
    },

    "emblem-badge": function (n) {
      var word = escapeXml(n.name.toUpperCase());
      var year = new Date().getFullYear();
      return ''
        + '<rect x="40" y="55" width="320" height="90" rx="45" fill="' + n.c0 + '"/>'
        + '<rect x="48" y="63" width="304" height="74" rx="37" fill="none" stroke="' + n.c2 + '" stroke-width="1.5"/>'
        + '<text x="200" y="105" text-anchor="middle"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + Math.max(700, n.hWeight) + '"'
        + '  font-size="30" fill="' + n.c2 + '">' + word + '</text>'
        + '<text x="200" y="128" text-anchor="middle"'
        + '  font-family="JetBrains Mono, monospace"'
        + '  font-size="9" letter-spacing="4" fill="' + n.c1 + '">EST · ' + year + '</text>';
    },

    "abstract-mark": function (n) {
      var word = escapeXml(n.name.toUpperCase());
      return ''
        + '<g transform="translate(200 70)">'
        + '  <rect x="-26" y="-26" width="52" height="52" transform="rotate(45)" fill="' + n.c1 + '"/>'
        + '  <rect x="-12" y="-12" width="24" height="24" transform="rotate(45)" fill="' + n.c0 + '"/>'
        + '</g>'
        + '<text x="200" y="160" text-anchor="middle"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="' + Math.max(700, n.hWeight) + '"'
        + '  font-size="28" letter-spacing="2" fill="' + n.c0 + '">' + word + '</text>';
    },
  };

  // ---------- public API ----------

  function renderLogo(state) {
    var n = normalize(state);
    var id = state && state.template && state.template.id;
    var fn = TEMPLATES[id] || TEMPLATES["wordmark-bold"];
    return fn(n);
  }

  function wrapSvg(inner, opts) {
    opts = opts || {};
    var w = opts.width || 400;
    var h = opts.height || 200;
    var bg = opts.background ? '<rect width="' + w + '" height="' + h + '" fill="' + opts.background + '"/>' : "";
    return ''
      + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '"'
      + (opts.exportSize ? ' width="' + opts.exportSize + '" height="' + Math.round(opts.exportSize * h / w) + '"' : '')
      + ' aria-hidden="true">'
      + bg
      + inner
      + '</svg>';
  }

  function renderSvg(state, opts) {
    return wrapSvg(renderLogo(state), opts);
  }

  global.LernaBrandRender = {
    renderLogo: renderLogo,
    renderSvg: renderSvg,
    wrapSvg: wrapSvg,
    normalize: normalize,
    initials: initials,
    escapeXml: escapeXml,
    renderIcon: renderIcon,
    listTemplates: function () { return Object.keys(TEMPLATES); },
  };
})(typeof window !== "undefined" ? window : this);
