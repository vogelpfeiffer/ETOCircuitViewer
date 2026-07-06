// ==========================================================
// MARKER FACTORY (V2 — real engineering pictograms)
//
// Builds a Leaflet divIcon from a classifyEquipment() result.
// Each equipment family gets a dedicated IEC/ABNT-style glyph
// instead of a generic shape. Two families carry a real
// open/closed visual state (not just a color swap), since that
// distinction has operational meaning in the field:
//
//   - "switch"   family: disconnector blade physically drawn
//                touching (closed/NF) or lifted away (open/NA)
//   - "recloser": gray box / white box + "R", with a small
//                open-state indicator dash
//
// Every other family (transformer, regulator, capacitor,
// generator, reactor, breaker, unknown) is drawn the same way
// regardless of state, since "open" doesn't apply to them.
// ==========================================================

// ----------------------
// Shared backdrop helpers
// ----------------------

// Neutral backdrop for non-switching equipment: white card, thin
// colored border, glyph drawn in the category color on top.
function neutralBackdrop(color) {
    return `<rect x="1" y="1" width="22" height="22" rx="5" fill="#fff" stroke="${color}" stroke-width="2"/>`;
}

// Fill-swap backdrop for switching equipment: solid color card
// when closed (energized-looking), white card with colored
// border when open — reinforced by the glyph itself also
// changing shape (see drawSwitchGlyph).
function switchBackdrop(color, open) {
    if (open) {
        return `<rect x="1" y="1" width="22" height="22" rx="4" fill="#fff" stroke="${color}" stroke-width="2.2"/>`;
    }
    return `<rect x="1" y="1" width="22" height="22" rx="4" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
}

// ----------------------
// Glyph drawers (one per "symbol" value from config.js)
// All operate in a 24x24 viewBox.
// ----------------------

function glyphTransformer(c) {
    return `<circle cx="9" cy="12" r="5" fill="none" stroke="${c}" stroke-width="2"/>
            <circle cx="15" cy="12" r="5" fill="none" stroke="${c}" stroke-width="2"/>`;
}

function glyphRegulator(c) {
    return `<path d="M4,12 q1.5,-5 3,0 q1.5,5 3,0 q1.5,-5 3,0 q1.5,5 3,0" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="3" y1="19" x2="19" y2="3" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>
            <polygon points="19,3 14.3,4.6 17.4,7.7" fill="${c}"/>`;
}

function glyphCapacitorBank(c) {
    return `<line x1="12" y1="3" x2="12" y2="9" stroke="${c}" stroke-width="1.8"/>
            <line x1="6" y1="9" x2="18" y2="9" stroke="${c}" stroke-width="2.2"/>
            <line x1="6" y1="13" x2="18" y2="13" stroke="${c}" stroke-width="2.2"/>
            <line x1="12" y1="13" x2="12" y2="19" stroke="${c}" stroke-width="1.8"/>
            <line x1="8" y1="19" x2="16" y2="19" stroke="${c}" stroke-width="1.8"/>`;
}

function glyphCapacitorSeries(c) {
    return `<line x1="3" y1="12" x2="9" y2="12" stroke="${c}" stroke-width="2"/>
            <line x1="9" y1="5" x2="9" y2="19" stroke="${c}" stroke-width="2.2"/>
            <line x1="15" y1="5" x2="15" y2="19" stroke="${c}" stroke-width="2.2"/>
            <line x1="15" y1="12" x2="21" y2="12" stroke="${c}" stroke-width="2"/>`;
}

function glyphGenerator(c) {
    return `<circle cx="12" cy="12" r="8" fill="none" stroke="${c}" stroke-width="1.8"/>
            <path d="M6.5,12 q2.5,-5 5.5,0 q2.5,5 5.5,0" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
}

function glyphReactor(c) {
    return `<line x1="2" y1="12" x2="5" y2="12" stroke="${c}" stroke-width="1.8"/>
            <path d="M5,12 a2.5,4.5 0 0 1 3.5,0 a2.5,4.5 0 0 1 3.5,0 a2.5,4.5 0 0 1 3.5,0 a2.5,4.5 0 0 1 3.5,0"
                  fill="none" stroke="${c}" stroke-width="1.8"/>
            <line x1="19" y1="12" x2="22" y2="12" stroke="${c}" stroke-width="1.8"/>`;
}

function glyphBreaker(c) {
    // Classic breaker pictogram: square contact box + diagonal
    // slash. Feeder head is structurally fixed, no open state.
    return `<rect x="6" y="6" width="12" height="12" fill="none" stroke="${c}" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="${c}" stroke-width="2"/>`;
}

function glyphUnknown(c) {
    return `<text x="12" y="16.5" font-size="12" font-weight="700" text-anchor="middle"
                  fill="${c}" font-family="Arial, sans-serif">?</text>`;
}

// ----- Religador: dedicated render, not part of the switch family -----
function glyphRecloser(open) {
    const boxFill = open ? "#fff" : "#9E9E9E";
    const boxStroke = "#616161";
    const textFill = "#000";
    const openDash = open
        ? `<line x1="7" y1="19" x2="17" y2="19" stroke="${boxStroke}" stroke-width="1.4" stroke-dasharray="2,1.5"/>`
        : "";
    return `<rect x="1" y="1" width="22" height="22" rx="4" fill="${boxFill}" stroke="${boxStroke}" stroke-width="2"/>
            <text x="12" y="16.5" font-size="13" font-weight="700" text-anchor="middle"
                  fill="${textFill}" font-family="Arial, sans-serif">R</text>
            ${openDash}`;
}

// ----- Switch family: base disconnector blade + optional accessory -----

function drawSwitchGlyph(c, open) {
    if (open) {
        // Blade lifted away from the top contact: physical gap visible.
        // Faint dashed line traces where the blade would sit if closed.
        return `<circle cx="5" cy="18" r="1.7" fill="${c}"/>
                <circle cx="19" cy="6" r="1.7" fill="${c}"/>
                <line x1="5" y1="18" x2="19" y2="6" stroke="${c}" stroke-width="1" stroke-dasharray="1.5,2" stroke-opacity="0.45"/>
                <line x1="5" y1="18" x2="13.5" y2="4.5" stroke="${c}" stroke-width="2.3" stroke-linecap="round"/>`;
    }
    // Blade touching both contacts: circuit closed.
    return `<circle cx="5" cy="18" r="1.7" fill="${c}"/>
            <circle cx="19" cy="6" r="1.7" fill="${c}"/>
            <line x1="5" y1="18" x2="19" y2="6" stroke="${c}" stroke-width="2.3" stroke-linecap="round"/>`;
}

function drawUnipolarGlyph(c, open) {
    if (open) {
        return `<circle cx="12" cy="6" r="1.7" fill="${c}"/>
                <line x1="12" y1="6" x2="12" y2="6" stroke="${c}"/>
                <line x1="12" y1="6" x2="6" y2="17" stroke="${c}" stroke-width="2.3" stroke-linecap="round"/>`;
    }
    return `<circle cx="12" cy="6" r="1.7" fill="${c}"/>
            <line x1="12" y1="6" x2="12" y2="18" stroke="${c}" stroke-width="2.3" stroke-linecap="round"/>`;
}

function drawAccessory(accessory, c) {
    switch (accessory) {
        case "fuse":
            return `<rect x="9" y="9.3" width="6" height="5.4" rx="2" fill="#fff" stroke="${c}" stroke-width="1.4"/>`;
        case "fuseRecloser":
            return `<rect x="9" y="9.3" width="6" height="5.4" rx="2" fill="#fff" stroke="${c}" stroke-width="1.4"/>
                    <polygon points="12,17.5 10,20.5 14,20.5" fill="${c}"/>`;
        case "vacuum":
            return `<rect x="9.5" y="7.5" width="5" height="9" rx="2.5" fill="#fff" stroke="${c}" stroke-width="1.4"/>`;
        case "tripsaver":
            return `<path d="M9,15.5 q3,-6.5 6,0" fill="none" stroke="${c}" stroke-width="1.5"/>`;
        case "bypass":
            return `<path d="M8.5,13 a3.2,3.2 0 0 1 6.3,0" fill="none" stroke="${c}" stroke-width="1.5"/>`;
        default:
            return "";
    }
}

// ----------------------
// Dispatch: symbol -> full glyph markup (backdrop + drawing)
// ----------------------

function buildSymbolMarkup(info) {
    const { symbol, color, open, accessory } = info;

    // Religador: fully separate render, ignores the generic backdrop helpers.
    if (symbol === "recloser") {
        return glyphRecloser(!!open);
    }

    if (symbol === "switch") {
        const backdrop = switchBackdrop(color, !!open);
        const glyphColor = open ? color : "#fff";
        const baseGlyph = accessory === "unipolar"
            ? drawUnipolarGlyph(glyphColor, !!open)
            : drawSwitchGlyph(glyphColor, !!open);
        const accessoryGlyph = accessory && accessory !== "unipolar"
            ? drawAccessory(accessory, open ? color : "#333")
            : "";
        return backdrop + baseGlyph + accessoryGlyph;
    }

    // Non-switching families: neutral backdrop + static glyph.
    const backdrop = neutralBackdrop(color);
    switch (symbol) {
        case "transformer":      return backdrop + glyphTransformer(color);
        case "regulator":        return backdrop + glyphRegulator(color);
        case "capacitorBank":    return backdrop + glyphCapacitorBank(color);
        case "capacitorSeries":  return backdrop + glyphCapacitorSeries(color);
        case "generator":        return backdrop + glyphGenerator(color);
        case "reactor":          return backdrop + glyphReactor(color);
        case "breaker":          return backdrop + glyphBreaker(color);
        case "unknown":
        default:                return backdrop + glyphUnknown(color);
    }
}

/**
 * Creates a Leaflet divIcon for a given equipment type.
 * @param {object} info - result of classifyEquipment(): { symbol, color, open, accessory }
 * @param {boolean} highlighted - adds the pulsing highlight class (search / ?id=)
 */
function createEquipmentIcon(info, highlighted = false) {
    const svg = `<svg width="24" height="24" viewBox="0 0 24 24">${buildSymbolMarkup(info)}</svg>`;
    return L.divIcon({
        className: "equip-marker" + (highlighted ? " equip-marker--highlight" : ""),
        html: svg,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        tooltipAnchor: [0, -12]
    });
}
