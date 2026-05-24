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

  // ============================================================
  // ASSET TEMPLATES — full-size brand kit pieces (business cards,
  // social posts, letterhead, etc.). Each returns full SVG markup
  // sized to the asset's intrinsic pixel dimensions.
  // ============================================================

  function logoBlock(state, x, y, w, opts) {
    // Embeds the logo at given position. logo native viewBox is 400×200.
    var h = w / 2;
    var inner = renderLogo(state);
    return '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h
      + '" viewBox="0 0 400 200" overflow="visible">' + inner + '</svg>';
  }

  function invertedLogoBlock(state, x, y, w) {
    // Swaps c0/c2 so logo reads on a dark background.
    var alt = Object.assign({}, state, {
      palette: {
        colors: [
          state.palette.colors[2],
          state.palette.colors[1],
          state.palette.colors[0],
          state.palette.colors[3],
        ],
      },
    });
    return logoBlock(alt, x, y, w);
  }

  var ASSETS = {
    "business-card-front": function (state, n, w, h) {
      var contact = "hello@yourbrand.com · yourbrand.com";
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c3 + '"/>'
        + logoBlock(state, 60, 60, 400)
        + '<text x="' + (w - 60) + '" y="' + (h - 120) + '" text-anchor="end"'
        + '  font-family=' + JSON.stringify(n.heading)
        + '  font-weight="700" font-size="28" fill="' + n.c0 + '">' + escapeXml(n.name) + '</text>'
        + (n.tagline ? '<text x="' + (w - 60) + '" y="' + (h - 90) + '" text-anchor="end"'
          + '  font-family=' + JSON.stringify(n.body) + ' font-size="16" fill="' + n.c0 + '" opacity="0.65">'
          + escapeXml(n.tagline) + '</text>' : '')
        + '<text x="' + (w - 60) + '" y="' + (h - 50) + '" text-anchor="end"'
        + '  font-family="JetBrains Mono, monospace" font-size="13" fill="' + n.c0 + '" opacity="0.55">'
        + contact + '</text>';
    },

    "business-card-back": function (state, n, w, h) {
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c0 + '"/>'
        + invertedLogoBlock(state, (w - 500) / 2, (h - 250) / 2, 500)
        + (n.tagline ? '<text x="' + (w / 2) + '" y="' + (h - 70) + '" text-anchor="middle"'
          + '  font-family="JetBrains Mono, monospace" font-size="14" letter-spacing="3" fill="' + n.c2 + '">'
          + escapeXml(n.tagline.toUpperCase()) + '</text>' : '');
    },

    "instagram-post": function (state, n, w, h) {
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c0 + '"/>'
        + '<rect x="0" y="0" width="' + w + '" height="12" fill="' + n.c1 + '"/>'
        + invertedLogoBlock(state, (w - 700) / 2, (h - 460) / 2, 700)
        + (n.tagline ? '<text x="' + (w / 2) + '" y="' + (h - 140) + '" text-anchor="middle"'
          + '  font-family=' + JSON.stringify(n.body)
          + '  font-size="36" fill="' + n.c2 + '">' + escapeXml(n.tagline) + '</text>' : '')
        + '<text x="' + (w / 2) + '" y="' + (h - 80) + '" text-anchor="middle"'
        + '  font-family="JetBrains Mono, monospace" font-size="14" letter-spacing="4" fill="' + n.c1 + '">'
        + 'YOURBRAND.COM</text>';
    },

    "instagram-story": function (state, n, w, h) {
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c3 + '"/>'
        + '<rect x="0" y="0" width="' + w + '" height="' + (h * 0.55) + '" fill="' + n.c0 + '"/>'
        + invertedLogoBlock(state, (w - 720) / 2, h * 0.55 - 320, 720)
        + '<rect x="0" y="' + (h * 0.55) + '" width="' + w + '" height="8" fill="' + n.c1 + '"/>'
        + (n.tagline ? '<text x="' + (w / 2) + '" y="' + (h * 0.7) + '" text-anchor="middle"'
          + '  font-family=' + JSON.stringify(n.heading)
          + '  font-weight="700" font-size="56" fill="' + n.c0 + '">' + escapeXml(n.tagline) + '</text>' : '')
        + '<text x="' + (w / 2) + '" y="' + (h - 120) + '" text-anchor="middle"'
        + '  font-family="JetBrains Mono, monospace" font-size="18" letter-spacing="6" fill="' + n.c0 + '" opacity="0.55">'
        + 'YOURBRAND.COM</text>';
    },

    "fb-cover": function (state, n, w, h) {
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c3 + '"/>'
        + '<rect x="' + (w * 0.55) + '" y="0" width="' + (w * 0.45) + '" height="' + h + '" fill="' + n.c0 + '"/>'
        + logoBlock(state, 100, h / 2 - 140, 600)
        + (n.tagline ? '<text x="' + (w - 80) + '" y="' + (h / 2 + 20) + '" text-anchor="end"'
          + '  font-family=' + JSON.stringify(n.heading)
          + '  font-weight="700" font-size="42" fill="' + n.c2 + '">' + escapeXml(n.tagline) + '</text>' : '');
    },

    "twitter-header": function (state, n, w, h) {
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c0 + '"/>'
        + '<rect x="0" y="0" width="' + w + '" height="6" fill="' + n.c1 + '"/>'
        + invertedLogoBlock(state, (w - 600) / 2, (h - 360) / 2, 600)
        + (n.tagline ? '<text x="' + (w / 2) + '" y="' + (h - 80) + '" text-anchor="middle"'
          + '  font-family=' + JSON.stringify(n.body)
          + '  font-size="22" fill="' + n.c2 + '" opacity="0.75">' + escapeXml(n.tagline) + '</text>' : '');
    },

    "linkedin-banner": function (state, n, w, h) {
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c3 + '"/>'
        + '<rect x="' + (w - 4) + '" y="0" width="4" height="' + h + '" fill="' + n.c1 + '"/>'
        + logoBlock(state, 80, (h - 200) / 2, 400)
        + (n.tagline ? '<text x="' + (w - 80) + '" y="' + (h / 2 + 12) + '" text-anchor="end"'
          + '  font-family=' + JSON.stringify(n.heading)
          + '  font-weight="700" font-size="36" fill="' + n.c0 + '">' + escapeXml(n.tagline) + '</text>' : '');
    },

    "youtube-banner": function (state, n, w, h) {
      // Safe zone for all devices is ~1235×338 centered
      var sx = (w - 1235) / 2;
      var sy = (h - 338) / 2;
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c0 + '"/>'
        + '<rect x="' + sx + '" y="' + sy + '" width="1235" height="338" fill="' + n.c0 + '"/>'
        + '<rect x="' + sx + '" y="' + (sy + 338) + '" width="1235" height="4" fill="' + n.c1 + '"/>'
        + invertedLogoBlock(state, (w - 600) / 2, (h - 240) / 2, 600)
        + (n.tagline ? '<text x="' + (w / 2) + '" y="' + (sy + 338 - 24) + '" text-anchor="middle"'
          + '  font-family=' + JSON.stringify(n.body) + ' font-size="22" fill="' + n.c2 + '">'
          + escapeXml(n.tagline) + '</text>' : '');
    },

    "letterhead": function (state, n, w, h) {
      var lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c3 + '"/>'
        + logoBlock(state, 220, 220, 800)
        + '<line x1="220" y1="540" x2="' + (w - 220) + '" y2="540" stroke="' + n.c1 + '" stroke-width="3"/>'
        + '<text x="220" y="620" font-family=' + JSON.stringify(n.body)
        + '  font-size="28" fill="' + n.c0 + '">' + escapeXml(n.tagline || "Date · Recipient") + '</text>'
        + '<text x="220" y="800" font-family=' + JSON.stringify(n.body)
        + '  font-size="22" fill="' + n.c0 + '" opacity="0.8">'
        + '<tspan x="220" dy="0">' + escapeXml(lorem.slice(0, 80)) + '</tspan>'
        + '<tspan x="220" dy="34">' + escapeXml(lorem.slice(80, 160)) + '</tspan>'
        + '<tspan x="220" dy="34">' + escapeXml(lorem.slice(160, 240)) + '</tspan>'
        + '</text>'
        + '<line x1="220" y1="' + (h - 220) + '" x2="' + (w - 220) + '" y2="' + (h - 220)
        + '" stroke="' + n.c0 + '" stroke-width="1" opacity="0.2"/>'
        + '<text x="220" y="' + (h - 180) + '" font-family="JetBrains Mono, monospace"'
        + '  font-size="14" letter-spacing="2" fill="' + n.c0 + '" opacity="0.6">'
        + escapeXml(n.name.toUpperCase()) + ' · HELLO@YOURBRAND.COM · YOURBRAND.COM</text>';
    },

    "email-signature": function (state, n, w, h) {
      return ''
        + '<rect width="' + w + '" height="' + h + '" fill="' + n.c3 + '"/>'
        + logoBlock(state, 20, 35, 220)
        + '<line x1="260" y1="40" x2="260" y2="' + (h - 40) + '" stroke="' + n.c1 + '" stroke-width="2"/>'
        + '<text x="280" y="60" font-family=' + JSON.stringify(n.heading)
        + '  font-weight="700" font-size="16" fill="' + n.c0 + '">' + escapeXml(n.name) + '</text>'
        + '<text x="280" y="90" font-family=' + JSON.stringify(n.body)
        + '  font-size="13" fill="' + n.c0 + '" opacity="0.7">' + escapeXml(n.tagline || "Founder") + '</text>'
        + '<text x="280" y="135" font-family="JetBrains Mono, monospace" font-size="11" fill="' + n.c0 + '" opacity="0.6">'
        + 'hello@yourbrand.com</text>'
        + '<text x="280" y="155" font-family="JetBrains Mono, monospace" font-size="11" fill="' + n.c0 + '" opacity="0.6">'
        + 'yourbrand.com</text>';
    },
  };

  function renderAsset(state, assetDef) {
    var n = normalize(state);
    var fn = ASSETS[assetDef.id];
    var w = assetDef.width;
    var h = assetDef.height;
    if (!fn) return wrapSvg('<rect width="' + w + '" height="' + h + '" fill="' + n.c3 + '"/>', { width: w, height: h });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">'
      + fn(state, n, w, h) + '</svg>';
  }

  global.LernaBrandRender = {
    renderLogo: renderLogo,
    renderSvg: renderSvg,
    wrapSvg: wrapSvg,
    normalize: normalize,
    initials: initials,
    escapeXml: escapeXml,
    renderIcon: renderIcon,
    renderAsset: renderAsset,
    listTemplates: function () { return Object.keys(TEMPLATES); },
    listAssets: function () { return Object.keys(ASSETS); },
  };
})(typeof window !== "undefined" ? window : this);
