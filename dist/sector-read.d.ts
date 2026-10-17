import { type Vertical, type BusinessModel } from './verticals.ts';
export declare const YOUR_SECTOR_VALUES: readonly ["logistics_tech", "fintech", "saas", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "other"];
export declare const YOUR_SECTOR_DESCRIPTION = "Optional: your company's own industry (not your customers'). When given, it decides the sector notes; when left out, the tool reads it from your words and stays neutral if they are unclear.";
/** Set once per tool call (the value was already checked against the list of choices); anything else clears it. */
export declare function setYourSector(value: unknown): void;
export declare function sectorIsSet(): boolean;
export interface SellerSectorRead {
    vertical: Vertical | null;
    source: 'seller' | 'context' | 'role' | 'buyer' | null;
    set: boolean;
}
export declare function readSellerSector(input: Record<string, unknown>): SellerSectorRead;
/** profileFor reads the text again (a money manager, an AI support seller); when the sector was set it is left as set. */
export declare function profileForSeller(v: Vertical | null, model: BusinessModel | null | undefined, input: Record<string, unknown>): Vertical | null;
export declare function sectorSetPhrase(v: Vertical | null): string;
//# sourceMappingURL=sector-read.d.ts.map