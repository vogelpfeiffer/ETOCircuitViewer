// ==========================================================
// ETO CIRCUIT VIEWER
// Reads ?kml= and ?id= from the URL (this is the AppSheet
// integration point: a row action opens this page with those
// params set). ?kml= accepts a single file or a comma-separated
// list, so a page can show one circuit or several overlaid.
// ==========================================================

const params = new URLSearchParams(window.location.search);

// No hardcoded fallback file anymore — a silently-wrong default is worse
// than an obvious empty state. AppSheet always supplies ?kml= explicitly.
const kmlParam = params.get("kml");
const kmlFiles = kmlParam
    ? kmlParam.split(",").map(f => f.trim()).filter(Boolean)
    : [];

const selectedID = params.get("id");

if (kmlFiles.length === 0) {
    document.getElementById("map").innerHTML =
        '<div class="empty-state">Nenhum circuito especificado.<br>' +
        'Abra esta página com <code>?kml=Pasta/Arquivo.kml</code> na URL ' +
        '(é assim que o AppSheet vai chamar o mapa).</div>';
    throw new Error("No ?kml= param provided — stopping before hitting the network.");
}

// ----------------------
// Region folder name mapping
// AppSheet sends region names lowercase (e.g. "centro"), but the
// actual folders on GitHub Pages have mixed casing. Map here instead
// of renaming folders, since GitHub Pages is case-sensitive.
// ----------------------
const REGION_FOLDER_MAP = {
    "centro": "CENTRO",
    "norte": "Norte",
    "sul": "Sul"
};

function resolveKmlPath(kmlFile) {
    const slashIndex = kmlFile.indexOf("/");
    if (slashIndex === -1) return kmlFile; // no folder prefix, leave as-is

    const region = kmlFile.slice(0, slashIndex);
    const rest = kmlFile.slice(slashIndex + 1);
    const mappedRegion = REGION_FOLDER_MAP[region.toLowerCase()] || region;

    return mappedRegion + "/" + rest;
}

// Registry of every marker currently on the map, used by search
// and the legend. Kept flat regardless of how many KMLs are loaded.
// Each entry: { id, marker, info, kmlFile }
const registry = [];

// ----------------------
// Create map
// ----------------------

const map = L.map("map").setView([-10.25, -48.33], 10);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap", maxZoom: 19 }
).addTo(map);

// ----------------------
// Load KML(s)
// ----------------------

let pendingLayers = kmlFiles.length;
const allBounds = [];

kmlFiles.forEach(kmlFile => {
    const layer = omnivore.kml("kml/" + resolveKmlPath(kmlFile));

    layer.on("ready", function () {
        layer.eachLayer(l => registerFeature(l, kmlFile));

        if (layer.getBounds && layer.getBounds().isValid()) {
            allBounds.push(layer.getBounds());
        }

        pendingLayers -= 1;
        if (pendingLayers === 0) {
            finishLoading();
        }
    });

    layer.on("error", function (err) {
        console.error("Failed to load", kmlFile, err);
        pendingLayers -= 1;
        if (pendingLayers === 0) finishLoading();
    });

    layer.addTo(map);
});

function registerFeature(l, kmlFile) {
    if (!l.feature || !l.feature.properties) return;
    if (!(l instanceof L.Marker)) return; // Trecho segments are LineStrings — skip, keep as plain lines

    const { name, styleUrl } = l.feature.properties;
    const info = classifyEquipment(name, styleUrl);

    l.setIcon(createEquipmentIcon(info, false));
    l.bindTooltip(
        `<strong>${info.short}</strong> — ${info.type}<br><code>${name}</code>`,
        { direction: "top", sticky: true }
    );

    // Corporate settings deep link — only for equipment types that
    // have a matching AppSheet "Ajustes" table (Religador, Regulador).
    // No settings data lives here; clicking just hands off to
    // AppSheet, which enforces the corporate login on its own.
    const ajusteLink = buildAjusteLink(info.symbol, name);
    if (ajusteLink) {
        l.bindPopup(
            `<div class="ajuste-popup">
                <strong>${info.short}</strong> — ${info.type}<br>
                <code>${name}</code><br>
                <a href="${ajusteLink}" target="_blank" rel="noopener" class="ajuste-link">
                    📋 Ver ajustes (Corporativo)
                </a>
            </div>`
        );
    }

    registry.push({ id: String(name), marker: l, info, kmlFile });
}

function finishLoading() {
    console.log(`KML loaded: ${registry.length} equipment markers across ${kmlFiles.length} file(s)`);

    if (allBounds.length) {
        const combined = allBounds.reduce((acc, b) => acc ? acc.extend(b) : b, null);
        map.fitBounds(combined);
    }

    buildLegend();
    setupSearch();

    if (selectedID) {
        highlightById(selectedID, true);
    }
}

// ----------------------
// Highlight (used by ?id= and by search selection)
// ----------------------

let currentHighlight = null;

function highlightById(id, flyTo) {
    const match = registry.find(r => r.id === String(id));

    if (currentHighlight) {
        currentHighlight.marker.setIcon(createEquipmentIcon(currentHighlight.info, false));
    }

    if (!match) {
        console.warn("No equipment found for id:", id);
        currentHighlight = null;
        return;
    }

    match.marker.setIcon(createEquipmentIcon(match.info, true));
    match.marker.openTooltip();
    currentHighlight = match;

    if (flyTo) {
        map.flyTo(match.marker.getLatLng(), 19);
    }
}

// ----------------------
// Legend (auto-built from whatever equipment is actually loaded)
// ----------------------

// Switch-family types (Chave variants + Religador) render visibly
// differently open vs closed, so the legend shows both states as
// separate rows. Everything else collapses to a single row.
function legendNeedsStateLabel(info) {
    return info.symbol === "switch" || info.symbol === "recloser";
}

function legendKey(info) {
    const stateSuffix = legendNeedsStateLabel(info) ? (info.open ? "-NA" : "-NF") : "";
    return info.short + info.type + stateSuffix;
}

function buildLegend() {
    const legendEl = document.getElementById("legend");
    legendEl.innerHTML = "";

    const seen = new Map();
    registry.forEach(r => {
        const key = legendKey(r.info);
        if (!seen.has(key)) seen.set(key, r.info);
    });

    seen.forEach(info => {
        const row = document.createElement("div");
        row.className = "legend-row";
        row.dataset.short = info.short;

        const iconSvg = `<svg width="22" height="22" viewBox="0 0 24 24">${buildSymbolMarkup(info)}</svg>`;
        const stateLabel = legendNeedsStateLabel(info) ? (info.open ? " (Aberta/NA)" : " (Fechada/NF)") : "";

        row.innerHTML = `
            <span class="legend-icon-wrap" style="display:inline-flex;align-items:center;margin-right:6px;">${iconSvg}</span>
            <span class="legend-label">${info.type}${stateLabel}</span>
        `;

        row.addEventListener("click", () => toggleTypeVisibility(info, row));
        legendEl.appendChild(row);
    });

    if (registry.some(r => hasAjusteData(r.info.symbol))) {
        const note = document.createElement("div");
        note.className = "legend-note";
        note.style.cssText = "margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,0.15);font-size:12px;color:#555;line-height:1.4;";
        note.innerHTML = `<strong>📋</strong> no ícone = ajustes de proteção disponíveis (login corporativo)`;
        legendEl.appendChild(note);
    }
}

function toggleTypeVisibility(info, row) {
    const hidden = row.classList.toggle("legend-row--off");
    const matchState = legendNeedsStateLabel(info);
    registry
        .filter(r => r.info.short === info.short
            && r.info.type === info.type
            && (!matchState || r.info.open === info.open))
        .forEach(r => {
            const el = r.marker.getElement();
            if (el) el.style.display = hidden ? "none" : "";
        });
}

// ----------------------
// Search
// ----------------------

function setupSearch() {
    const input = document.getElementById("search-box");
    const resultsEl = document.getElementById("search-results");

    input.addEventListener("input", () => {
        const q = input.value.trim().toUpperCase();
        resultsEl.innerHTML = "";

        if (!q) {
            resultsEl.classList.remove("search-results--open");
            return;
        }

        const matches = registry
            .filter(r => r.id.toUpperCase().includes(q))
            .slice(0, 20);

        resultsEl.classList.toggle("search-results--open", matches.length > 0);

        matches.forEach(r => {
            const item = document.createElement("div");
            item.className = "search-result";
            item.innerHTML = `<span class="legend-swatch legend-swatch--${r.info.shape}" style="--swatch-color:${r.info.color}"></span> ${r.id}`;
            item.addEventListener("click", () => {
                highlightById(r.id, true);
                resultsEl.classList.remove("search-results--open");
                input.value = r.id;
            });
            resultsEl.appendChild(item);
        });
    });
}
