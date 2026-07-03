// ==========================================================
// MARKER FACTORY
// Builds a Leaflet divIcon from a classifyEquipment() result.
// Shape carries the broad category, color carries the subtype,
// and "open" (normally-open switches) is drawn as a hollow
// ring so it reads instantly on a small screen in the field.
// ==========================================================

function buildShapeMarkup(shape, color, open) {
    if (open) {
        // Hollow ring variant: colored outline, white core, no fill.
        switch (shape) {
            case "diamond":
                return `<rect x="5" y="5" width="14" height="14" fill="#fff" stroke="${color}" stroke-width="3" transform="rotate(45 12 12)"/>`;
            case "triangle":
                return `<polygon points="12,3 21,20 3,20" fill="#fff" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`;
            case "hexagon":
                return `<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="#fff" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`;
            case "circle":
                return `<circle cx="12" cy="12" r="9" fill="#fff" stroke="${color}" stroke-width="3"/>`;
            case "square":
            default:
                return `<rect x="3" y="3" width="18" height="18" rx="3" fill="#fff" stroke="${color}" stroke-width="3"/>`;
        }
    }

    switch (shape) {
        case "diamond":
            return `<rect x="4" y="4" width="16" height="16" fill="${color}" stroke="#fff" stroke-width="2" transform="rotate(45 12 12)"/>`;
        case "triangle":
            return `<polygon points="12,2 22,20 2,20" fill="${color}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
        case "hexagon":
            return `<polygon points="12,1 22,6.5 22,17.5 12,23 2,17.5 2,6.5" fill="${color}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>`;
        case "circle":
            return `<circle cx="12" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>`;
        case "square":
        default:
            return `<rect x="2" y="2" width="20" height="20" rx="3" fill="${color}" stroke="#fff" stroke-width="2"/>`;
    }
}

/**
 * Creates a Leaflet divIcon for a given equipment type.
 * @param {object} info - result of classifyEquipment(): { shape, color, open }
 * @param {boolean} highlighted - adds the pulsing highlight class (search / ?id=)
 */
function createEquipmentIcon(info, highlighted = false) {
    const svg = `<svg width="24" height="24" viewBox="0 0 24 24">${buildShapeMarkup(info.shape, info.color, info.open)}</svg>`;
    return L.divIcon({
        className: "equip-marker" + (highlighted ? " equip-marker--highlight" : ""),
        html: svg,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        tooltipAnchor: [0, -12]
    });
}
