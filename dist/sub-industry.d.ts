import { type SubType, type Vertical } from './verticals.ts';
/** The sub industry of this sector the seller's own words name, or null. `sellerTexts` are the seller's own words only (never the deal text, the job
 * titles or the buyer's industry). With `chosen` (the sub industry another reader picked) it answers whether that choice stands. */
export declare function subIndustryFor(sector: string | null | undefined, sellerTexts: unknown[], chosen?: string | null): SubType | null;
/** The vertical as the seller's own words allow: a sub industry's notes are kept only when subIndustryFor allows them; otherwise the sector's general entry.
 * Business model profiles (billing, investment management, AI support) have their own seller word rules and pass through. */
export declare function gateSubIndustry(v: Vertical | null, sellerTexts: unknown[]): Vertical | null;
export declare const AI_GENERAL_NOTES: Partial<Vertical>;
/** The vertical after the sector's general notes are applied where the seller's own words name no kind of company in it. Idempotent; business model profiles pass through. */
export declare function withGeneralNotes(v: Vertical | null, sellerTexts: unknown[]): Vertical | null;
//# sourceMappingURL=sub-industry.d.ts.map