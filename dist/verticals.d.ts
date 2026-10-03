export type VerticalId = 'logistics-tech' | 'fintech' | 'saas' | 'vertical-saas' | 'ai-native' | 'ites' | 'telecom' | 'software' | 'cybersecurity';
export interface Objection {
    objection: string;
    response: string;
}
export interface Vertical {
    id: VerticalId;
    name: string;
    match: RegExp;
    weak: RegExp;
    vocabulary: string[];
    buyerRoles: string[];
    committee: string;
    objections: Objection[];
    salesMotion: string;
    metrics: string[];
    proofShape: string;
    discovery: string[];
}
export declare const VERTICALS: Vertical[];
/** What the reader looks at. `seller` holds the seller's own words (what it sells, its category, its product description,
 * its value points); `buyer` holds the buyer's words (target customer, industry, role) and any other context. The seller's
 * words are read first; the buyer's words only when the seller's words name no sector. */
export interface ReaderInput {
    seller?: unknown[];
    buyer?: unknown[];
}
/** The sector read, with the words that decided it and where they came from ('seller' or 'buyer'). */
export declare function explainSector(...args: unknown[]): {
    vertical: Vertical | null;
    source: 'seller' | 'buyer' | null;
    strong: string[];
    weak: string[];
};
/** The sector read from what the user typed, or null when the words do not name one. Give plain texts (each is split at its
 * buyer marker such as "for banks") or { seller: [...], buyer: [...] } to say which words are the seller's and which the
 * buyer's. The seller's words come first; the buyer's words are used only when the seller's name no sector. One strong word
 * is enough; broad words alone are not. */
export declare function detectVertical(...args: unknown[]): Vertical | null;
export type BusinessModel = 'saas' | 'services' | 'connectivity' | 'transactions' | 'marketplace' | 'hardware_software' | 'investment';
export declare const BUSINESS_MODELS: BusinessModel[];
export declare const MODEL_NAME: Record<BusinessModel, string>;
export declare const SECTOR_MODEL: Record<VerticalId, BusinessModel>;
/** The business model: the explicit input when given, else read from the SELLER's words, else the sector's usual model, else
 * null. Give plain texts or { seller: [...], buyer: [...] } as for detectVertical. */
export declare function detectModel(explicit: unknown, ...args: unknown[]): {
    model: BusinessModel | null;
    how: 'input' | 'read' | 'sector' | 'unknown';
};
/** Commercial trades a seller can ask for in return for a concession, by business model (no figures). */
export declare const MODEL_TRADES: Record<BusinessModel | 'unknown', string[]>;
/** Words that only fit a software subscription; tools never print them for another model unless the user typed them. */
export declare const SAAS_ONLY: RegExp;
//# sourceMappingURL=verticals.d.ts.map