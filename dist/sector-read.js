"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YOUR_SECTOR_DESCRIPTION = exports.YOUR_SECTOR_VALUES = void 0;
exports.setYourSector = setYourSector;
exports.sectorIsSet = sectorIsSet;
exports.readSellerSector = readSellerSector;
exports.profileForSeller = profileForSeller;
exports.sectorSetPhrase = sectorSetPhrase;
// Run 42B: the seller's own sector. One optional input, your_sector, on every tool. When it is given it decides the sector
// (nothing read from the text overrides it); when it is not, the sector is read from the seller's own words only, and the
// tool stays neutral when only the deal text, the job titles or the customer's industry point to one.
// This file adds no figures and no sector facts (B82): it only picks which entry of src/verticals.ts is used.
const verticals_ts_1 = require("./verticals.js");
exports.YOUR_SECTOR_VALUES = ['logistics_tech', 'fintech', 'saas', 'vertical_saas', 'ai_native', 'ites', 'telecom', 'software', 'cybersecurity', 'other'];
exports.YOUR_SECTOR_DESCRIPTION = "Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear.";
const ID = { logistics_tech: 'logistics-tech', fintech: 'fintech', saas: 'saas', vertical_saas: 'vertical-saas', ai_native: 'ai-native', ites: 'ites', telecom: 'telecom', software: 'software', cybersecurity: 'cybersecurity' };
let forced;
/** Set once per tool call (the value was already checked against the list of choices); anything else clears it. */
function setYourSector(value) {
    forced = typeof value === 'string' && exports.YOUR_SECTOR_VALUES.includes(value) ? value : undefined;
}
function sectorIsSet() { return forced !== undefined; }
/** A sub industry (a kind of company inside the sector, with its own notes) is used only when the seller's own words name it; otherwise the sector's general entry is used. */
function generalUnlessClear(v, input) {
    if (!v || !v.subtype)
        return v;
    const sellerTexts = Array.isArray(input.seller) ? input.seller : [];
    const a = (0, verticals_ts_1.explainSector)({ seller: sellerTexts, context: [], role: [], buyer: [] });
    const b = (0, verticals_ts_1.explainSector)({ seller: [], context: [], role: [], buyer: sellerTexts });
    const same = (x) => !!x && x.id === v.id && x.subtype === v.subtype;
    if (same(a.vertical) || same(b.vertical))
        return v;
    return verticals_ts_1.VERTICALS.find((x) => x.id === v.id) ?? v;
}
function readSellerSector(input) {
    if (forced) {
        let v = forced === 'other' ? null : verticals_ts_1.VERTICALS.find((x) => x.id === ID[forced]) ?? null;
        // the kind of company inside the chosen sector (a sub-type) is kept when the seller's own words name it
        if (v) {
            const r = (0, verticals_ts_1.explainSector)(input);
            if (r.vertical && r.source === 'seller' && r.vertical.id === v.id)
                v = generalUnlessClear(r.vertical, input);
        }
        return { vertical: v, source: 'seller', set: true };
    }
    const r = (0, verticals_ts_1.explainSector)(input);
    // a sector read from the deal text, the job titles or the customer's industry is not the seller's: neutral wording instead
    if (r.source === 'seller')
        return { vertical: generalUnlessClear(r.vertical, input), source: 'seller', set: false };
    // The reader moves the part of the seller's own description that follows "for ..." to the buyer side. Those words are still the
    // seller's own, so they are read on their own, and count when they name a sector at least twice.
    const own = (0, verticals_ts_1.explainSector)({ seller: [], context: [], role: [], buyer: Array.isArray(input.seller) ? input.seller : [] });
    if (own.vertical && own.strong.length >= 2)
        return { vertical: generalUnlessClear(own.vertical, input), source: 'seller', set: false };
    return { vertical: null, source: null, set: false };
}
/** profileFor reads the text again (a money manager, an AI support seller); when the sector was set it is left as set. */
function profileForSeller(v, model, input) {
    return forced ? v : (0, verticals_ts_1.profileFor)(v, model, input);
}
function sectorSetPhrase(v) {
    return v ? `set by your_sector as ${v.name}` : 'set by your_sector to other, so the wording stays neutral';
}
//# sourceMappingURL=sector-read.js.map