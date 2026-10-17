// Run 42B: the seller's own sector. One optional input, your_sector, on every tool. When it is given it decides the sector
// (nothing read from the text overrides it); when it is not, the sector is read from the seller's own words only, and the
// tool stays neutral when only the deal text, the job titles or the customer's industry point to one.
// This file adds no figures and no sector facts (B82): it only picks which entry of src/verticals.ts is used.
import { explainSector, profileFor, VERTICALS, SUBTYPES, SECTOR_MODEL, type Vertical, type BusinessModel } from './verticals.ts';

export const YOUR_SECTOR_VALUES = ['logistics_tech', 'fintech', 'saas', 'vertical_saas', 'ai_native', 'ites', 'telecom', 'software', 'cybersecurity', 'other'] as const;
export const YOUR_SECTOR_DESCRIPTION = "Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear.";
const ID: Record<string, string> = { logistics_tech: 'logistics-tech', fintech: 'fintech', saas: 'saas', vertical_saas: 'vertical-saas', ai_native: 'ai-native', ites: 'ites', telecom: 'telecom', software: 'software', cybersecurity: 'cybersecurity' };

let forced: string | undefined;
/** Set once per tool call (the value was already checked against the list of choices); anything else clears it. */
export function setYourSector(value: unknown): void {
  forced = typeof value === 'string' && (YOUR_SECTOR_VALUES as readonly string[]).includes(value) ? value : undefined;
}
export function sectorIsSet(): boolean { return forced !== undefined; }

export interface SellerSectorRead { vertical: Vertical | null; source: 'seller' | 'context' | 'role' | 'buyer' | null; set: boolean }
/** A sub industry (a kind of company inside the sector, with its own notes) is used only when the seller's own words name it; otherwise the sector's general entry is used. */
function generalUnlessClear(v: Vertical | null, input: Record<string, unknown>): Vertical | null {
  if (!v || !v.subtype) return v;
  const sellerTexts = Array.isArray(input.seller) ? input.seller : [];
  const a = explainSector({ seller: sellerTexts, context: [], role: [], buyer: [] });
  const b = explainSector({ seller: [], context: [], role: [], buyer: sellerTexts });
  const same = (x: Vertical | null) => !!x && x.id === v.id && x.subtype === v.subtype;
  if (same(a.vertical) || same(b.vertical)) return v;
  return VERTICALS.find((x) => x.id === v.id) ?? v;
}
export function readSellerSector(input: Record<string, unknown>): SellerSectorRead {
  if (forced) {
    let v = forced === 'other' ? null : VERTICALS.find((x) => x.id === ID[forced!]) ?? null;
    // the kind of company inside the chosen sector (a sub-type) is kept when the seller's own words name it
    if (v) {
      const r = explainSector(input);
      if (r.vertical && r.source === 'seller' && r.vertical.id === v.id) v = generalUnlessClear(r.vertical, input);
    }
    return { vertical: v, source: 'seller', set: true };
  }
  const r = explainSector(input);
  // a sector read from the deal text, the job titles or the customer's industry is not the seller's: neutral wording instead
  if (r.source === 'seller') return { vertical: generalUnlessClear(r.vertical, input), source: 'seller', set: false };
  // The reader moves the part of the seller's own description that follows "for ..." to the buyer side. Those words are still the
  // seller's own, so they are read on their own, and count when they name a sector at least twice.
  const own = explainSector({ seller: [], context: [], role: [], buyer: Array.isArray(input.seller) ? input.seller : [] });
  if (own.vertical && own.strong.length >= 2) return { vertical: generalUnlessClear(own.vertical, input), source: 'seller', set: false };
  return { vertical: null, source: null, set: false };
}
/** profileFor reads the text again (a money manager, an AI support seller); when the sector was set it is left as set. */
export function profileForSeller(v: Vertical | null, model: BusinessModel | null | undefined, input: Record<string, unknown>): Vertical | null {
  return forced ? v : profileFor(v, model, input);
}
export function sectorSetPhrase(v: Vertical | null): string {
  return v ? `set by your_sector as ${v.name}` : 'set by your_sector to other, so the wording stays neutral';
}
/** Run 42Q: when your_sector is set, the business model comes only from business_model, from the seller's own charge words, or from the
 *  set sector's usual model. A generic software word ("platform", "products", "technology") is not a charge word, and the usual model of a
 *  sector read from the text is not the set sector's: a services firm set as ITeS that mentions agentic products is still sold as services.
 *  A model read from specific words (a payment gateway, managed services, connectivity) is kept. Nothing changes when your_sector is not set. */
const CHARGE_SAAS = /\b(?:saas|subscriptions?|subscribe|per seat|per user|per month|monthly plan|annual plan|licen[cs]e[sd]?|pricing plans?)\b/i;
export function modelUnderSetSector(m: { model: BusinessModel | null; how: 'input' | 'read' | 'sector' | 'unknown' }, v: Vertical | null, input: Record<string, unknown>): { model: BusinessModel | null; how: 'input' | 'read' | 'sector' | 'unknown' } {
  if (!forced || forced === 'other' || !v || m.how === 'input') return m;
  const seller = (Array.isArray(input.seller) ? input.seller : []).filter((x): x is string => typeof x === 'string').join(' . ');
  const st = v.subtype ? SUBTYPES.find((x) => x.id === v.subtype) : undefined;
  const usual = st?.model ?? SECTOR_MODEL[v.id];
  if (m.how === 'sector' || m.how === 'unknown') return { model: usual, how: 'sector' };
  if (m.how === 'read' && m.model === 'saas' && !CHARGE_SAAS.test(seller) && usual !== 'saas') return { model: usual, how: 'sector' };
  return m;
}
