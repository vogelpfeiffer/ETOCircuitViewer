// ==========================================================
// EQUIPMENT TYPE REGISTRY
// Prefix = first 2 characters of the equipment ID (10-digit
// codes are numeric, "PA" codes are alphanumeric — both are
// read as a 2-character string, so this works for either).
//
// To add a new equipment type: add one line here. Nothing
// else in the app needs to change.
// ==========================================================

const EQUIPMENT_TYPES = {
    // Chaves / seccionamento
    "02": { type: "Chave Fusível Particular", short: "CF", color: "#0097A7", shape: "square" },
    "03": { type: "Chave Fusível",            short: "F",  color: "#1565C0", shape: "square" },
    "31": { type: "Bay Pass",                 short: "BP", color: "#1565C0", shape: "square" },
    "33": { type: "Chave Fusível Religadora", short: "FR", color: "#1565C0", shape: "square" },
    "42": { type: "Vacufuser",                short: "VF", color: "#1565C0", shape: "square" },
    "86": { type: "Chave Faca Particular",    short: "FP", color: "#1565C0", shape: "square" },
    "88": { type: "Chave Faca",               short: "F",  color: "#1565C0", shape: "square" },
    "90": { type: "Chave Unipolar",           short: "I",  color: "#1565C0", shape: "square" },
    "40": { type: "Trip Saver",               short: "TS", color: "#8E24AA", shape: "square" },

    // Transformadores
    "51": { type: "Trafo Aux. Religador",       short: "TA", color: "#FBC02D", shape: "diamond" },
    "52": { type: "Trafo c/ Vacufuser",         short: "TV", color: "#FBC02D", shape: "diamond" },
    "53": { type: "Trafo c/ Religadora",        short: "TR", color: "#FBC02D", shape: "diamond" },
    "54": { type: "Trafo Aux. SE",              short: "TS", color: "#FBC02D", shape: "diamond" },
    "55": { type: "Trafo Aterramento",          short: "AT", color: "#FBC02D", shape: "diamond" },
    "56": { type: "Transformador Particular",   short: "TP", color: "#FBC02D", shape: "diamond" },
    "57": { type: "Transformador Energisa",     short: "TE", color: "#FBC02D", shape: "diamond" },
    "PA": { type: "Transformador Particular",   short: "PA", color: "#FBC02D", shape: "diamond" },

    // Reguladores / religadores
    "58": { type: "Regulador", short: "VR", color: "#43A047", shape: "diamond" },
    "79": { type: "Religador", short: "R",  color: "#E53935", shape: "circle" }
};

const DEFAULT_EQUIPMENT_TYPE = {
    type: "Equipamento Não Identificado",
    short: "?",
    color: "#757575",
    shape: "square"
};

/**
 * Resolves an equipment ID (feature name) to its type definition.
 * Falls back to DEFAULT_EQUIPMENT_TYPE for unmapped prefixes so
 * unknown/new equipment never breaks rendering — it just shows
 * as a grey square until someone adds it to EQUIPMENT_TYPES above.
 */
function getEquipmentInfo(rawId) {
    if (!rawId) return DEFAULT_EQUIPMENT_TYPE;
    const prefix = String(rawId).trim().toUpperCase().substring(0, 2);
    return EQUIPMENT_TYPES[prefix] || DEFAULT_EQUIPMENT_TYPE;
}
