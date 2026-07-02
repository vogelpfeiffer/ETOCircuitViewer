// ==========================================================
// MARKER FACTORY
// Replaces Leaflet's default pin with a small SVG shape whose
// form (square / diamond / circle) and color are driven by
// EQUIPMENT_TYPES in config.js. Kept intentionally simple so
// it renders fast across dense KMLs with hundreds of points.
// ==========================================================

function buildShapeMarkup(shape, color) {
    switch (shape) {
        case "diamond":
            return `<rect x="4" y="4" width="16" height="16" fill="${color}" stroke="#fff" stroke-width="2" transform="rotate(45 12 12)"/>`;
        case "circle":
            return `<circle cx="12" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>`;
        case "square":
        default:
            return `<rect x="2" y="2" width="20" height="20" rx="3" fill="${color}" stroke="#fff" stroke-width="2"/>`;
    }
}

/**
 * Creates a Leaflet divIcon for a given equipment type.
 * @param {object} info - entry from EQUIPMENT_TYPES / DEFAULT_EQUIPMENT_TYPE
 * @param {boolean} highlighted - adds the pulsing highlight class (search / ?id=)
 */
function createEquipmentIcon(info, highlighted = false) {
    const svg = `<svg width="24" height="24" viewBox="0 0 24 24">${buildShapeMarkup(info.shape, info.color)}</svg>`;
    return L.divIcon({
        className: "equip-marker" + (highlighted ? " equip-marker--highlight" : ""),
        html: svg,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        tooltipAnchor: [0, -12]
    });
}
