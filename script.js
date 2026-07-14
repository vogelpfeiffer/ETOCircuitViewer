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

// Registry of every marker currently on the map, used by search
// and the legend. Kept flat regardless of how many KMLs are loaded.
// Each entry: { id, marker, info, kmlFile }
const registry = [];

// ----------------------
// Create map
// ----------------------

const map = L.map("map").setView([-10.25, -48.33], 10);

const streetLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap", maxZoom: 19 }
);

const satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics", maxZoom: 19 }
);

// NOTE: EOX's free tier is licensed non-commercial only (paid EOxCloudless
// license required otherwise) — confirm with your company before making
// this the default for field use. Included here so it can be evaluated
// against Esri; sometimes has better coverage in areas Esri leaves blank,
// sometimes worse resolution. maxZoom capped at 14 (native tile limit).
const sentinelLayer = L.tileLayer(
    "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg",
    { attribution: "Sentinel-2 cloudless — EOX IT Services GmbH (non-commercial)", maxZoom: 14 }
);

streetLayer.addTo(map);

L.control.layers(
    { "Mapa de Ruas": streetLayer, "Satélite (Esri)": satelliteLayer, "Satélite (Sentinel-2)": sentinelLayer },
    null,
    { position: "topright", collapsed: false }
).addTo(map);

// ----------------------
// Load KML(s)
// ----------------------

let pendingLayers = kmlFiles.length;
const allBounds = [];

kmlFiles.forEach(kmlFile => {
    const layer = omnivore.kml("kml/" + kmlFile);

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

function buildLegend() {
    const legendEl = document.getElementById("legend");
    legendEl.innerHTML = "";

    const seen = new Map();
    registry.forEach(r => {
        const key = r.info.short + r.info.type;
        if (!seen.has(key)) seen.set(key, r.info);
    });

    seen.forEach(info => {
        const row = document.createElement("div");
        row.className = "legend-row";
        row.dataset.short = info.short;

        row.innerHTML = `
            <span class="legend-swatch legend-swatch--${info.shape}" style="--swatch-color:${info.color}"></span>
            <span class="legend-label">${info.type}</span>
        `;

        row.addEventListener("click", () => toggleTypeVisibility(info, row));
        legendEl.appendChild(row);
    });
}

function toggleTypeVisibility(info, row) {
    const hidden = row.classList.toggle("legend-row--off");
    registry
        .filter(r => r.info.short === info.short && r.info.type === info.type)
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
