// ==========================================================
// EQUIPMENT CLASSIFICATION
//
// Verified against 5 real production KMLs (~2,400 point
// features): equipment IDs are NOT reliably clean 10-digit
// codes. Real examples found: "PR34941045", "SS5642021",
// "341969", "444R016", "ETO281447K", "DJ_LD01014045_FICT".
// A prefix-only classifier would show all of these as grey
// "unknown" markers.
//
// What IS 100% reliable on every single placemark, in every
// file, is the <styleUrl> Daimon (the export tool) assigns —
// it always matches the Folder the placemark lives in
// (Chave, ChaveNA, ET, EP, Regulador, Capacitor, Gerador...).
// So classification is two layers:
//   1. styleUrl -> broad category (always works, defines the
//      fallback shape/color/label)
//   2. ID prefix -> precise subtype (works when the ID follows
//      the standard scheme; refines color/label further)
// ==========================================================

// ----- Layer 1: broad category, keyed by KML styleUrl -----

const STYLE_CATEGORIES = {
    "#mapDaimonChave":          { label: "Chave",                short: "CH", color: "#1565C0", shape: "square" },
    "#mapDaimonChaveNA":        { label: "Chave (Normalmente Aberta)", short: "CH", color: "#1565C0", shape: "square", open: true },
    "#mapDaimonET":             { label: "Transformador",        short: "TR", color: "#FBC02D", shape: "diamond" },
    "#mapDaimonEP":             { label: "Transformador Particular", short: "TP", color: "#FBC02D", shape: "diamond" },
    "#mapDaimonRegulador":      { label: "Regulador",            short: "VR", color: "#43A047", shape: "diamond" },
    "#mapDaimonCapacitor":      { label: "Banco de Capacitores", short: "CP", color: "#00838F", shape: "triangle" },
    "#mapDaimonCapacitorSerie": { label: "Capacitor Série",      short: "CS", color: "#00838F", shape: "triangle" },
    "#mapDaimonGerador":        { label: "Gerador",              short: "GD", color: "#EF6C00", shape: "circle" },
    "#mapDaimonReator":         { label: "Reator",                short: "RE", color: "#6D4C41", shape: "diamond" }
};

const UNKNOWN_CATEGORY = {
    label: "Equipamento Não Identificado",
    short: "?",
    color: "#757575",
    shape: "square"
};

// ----- Layer 2: precise subtype, keyed by 2-char ID prefix -----
// Only used to refine a category when the ID actually follows
// the standard scheme. Colors/shapes here should stay visually
// consistent with the category they belong to.

const EQUIPMENT_SUBTYPES = {
    // Chaves / seccionamento (category: mapDaimonChave / ChaveNA)
    "02": { type: "Chave Fusível Particular", short: "CF", color: "#0097A7", shape: "square" },
    "03": { type: "Chave Fusível",            short: "F",  color: "#1565C0", shape: "square" },
    "31": { type: "Bay Pass",                 short: "BP", color: "#1565C0", shape: "square" },
    "33": { type: "Chave Fusível Religadora", short: "FR", color: "#1565C0", shape: "square" },
    "42": { type: "Vacufuser",                short: "VF", color: "#1565C0", shape: "square" },
    "86": { type: "Chave Faca Particular",    short: "FP", color: "#1565C0", shape: "square" },
    "88": { type: "Chave Faca",               short: "F",  color: "#1565C0", shape: "square" },
    "90": { type: "Chave Unipolar",           short: "I",  color: "#1565C0", shape: "square" },
    "40": { type: "Trip Saver",               short: "TS", color: "#8E24AA", shape: "square" },
    "79": { type: "Religador",                short: "R",  color: "#E53935", shape: "circle" },

    // Transformadores (category: mapDaimonET / EP)
    "51": { type: "Trafo Aux. Religador",       short: "TA", color: "#FBC02D", shape: "diamond" },
    "52": { type: "Trafo c/ Vacufuser",         short: "TV", color: "#FBC02D", shape: "diamond" },
    "53": { type: "Trafo c/ Religadora",        short: "TR", color: "#FBC02D", shape: "diamond" },
    "54": { type: "Trafo Aux. SE",              short: "TS", color: "#FBC02D", shape: "diamond" },
    "55": { type: "Trafo Aterramento",          short: "AT", color: "#FBC02D", shape: "diamond" },
    "56": { type: "Transformador Particular",   short: "TP", color: "#FBC02D", shape: "diamond" },
    "57": { type: "Transformador Energisa",     short: "TE", color: "#FBC02D", shape: "diamond" },
    "PA": { type: "Transformador Particular",   short: "PA", color: "#FBC02D", shape: "diamond" },

    // Regulador (category: mapDaimonRegulador)
    "58": { type: "Regulador", short: "VR", color: "#43A047", shape: "diamond" }
};

// Feeder-head breaker: exactly one per circuit, named e.g.
// "DJ_LD01014045_FICT". Structurally important (defines the
// circuit's origin point) so it gets its own look rather than
// falling into the generic Chave bucket.
const FEEDER_HEAD_TYPE = {
    type: "Disjuntor (Cabeça de Circuito)",
    short: "DJ",
    color: "#B71C1C",
    shape: "hexagon"
};

const FEEDER_HEAD_PATTERN = /_FICT$/i;

/**
 * Classifies a placemark into its visual equipment type.
 * @param {string} rawId - feature name (e.g. "8800761045", "PR34941045")
 * @param {string} styleUrl - feature's styleUrl (e.g. "#mapDaimonChave")
 */
function classifyEquipment(rawId, styleUrl) {
    const name = String(rawId || "").trim();

    if (FEEDER_HEAD_PATTERN.test(name)) {
        return FEEDER_HEAD_TYPE;
    }

    const category = STYLE_CATEGORIES[styleUrl] || UNKNOWN_CATEGORY;
    const prefix = name.substring(0, 2).toUpperCase();
    const subtype = EQUIPMENT_SUBTYPES[prefix];

    if (subtype) {
        return { ...subtype, open: !!category.open };
    }

    return {
        type: category.label,
        short: category.short,
        color: category.color,
        shape: category.shape,
        open: !!category.open
    };
}
