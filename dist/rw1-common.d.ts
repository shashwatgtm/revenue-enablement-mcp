import { sentences, type Contact, type SolutionBrief } from './dealtext.ts';
import { type BusinessModel, type Vertical } from './verticals.ts';
/** What the shared helpers of index.ts give to the rewritten tools (passed in, so this file never imports index.ts). */
export interface Deps {
    cap(s: string): string;
    money(n: number): string;
    lowerFirstIfCommon(s: string): string;
    splitItems(s: unknown): string[];
    /** the milestones this server already holds for one kind of company (a sub-type with its own entry), or undefined for a generic company */
    stockEval(v: Vertical | null, investment: boolean): {
        m: string;
        who: string;
    }[] | undefined;
    readContext(explicitModel: unknown, input: {
        seller: unknown[];
        context?: unknown[];
        role?: unknown[];
        buyer?: unknown[];
    }): {
        v: Vertical | null;
        model: BusinessModel | null;
        line: string;
    };
}
export declare const stemsOf: (t: string) => Set<string>;
/** How many ideas two texts share: a shared word stem, or two words that mean about the same thing. */
export declare function shared(a: string, b: string): number;
export declare const lowerStart: (s: string) => string;
export declare const stripEnd: (s: string) => string;
/** A text the user typed, shown in quotes (kept as typed; a quote the safeguard already put around it is not doubled). */
export declare const quoted: (s: string) => string;
export declare function plural(n: number, one: string, many: string): string;
/** "a, b and c" limited to the first n items. */
export declare const some: (items: string[], n: number) => string;
/** The parts of a product, as the user's description lists them: after a colon or "made of", or after "joins", "covers", "includes", "with". */
export declare function partsOf(brief: SolutionBrief): string[];
export interface ModelWords {
    /** what the buyer pays for, in the seller's own unit */
    priced: string;
    /** the form a first proof takes */
    proof: string;
    /** what is agreed at the commercial step */
    terms: string;
    /** how an account grows */
    grow: string;
    /** what is set up before first use */
    setup: string;
}
export declare function modelWords(model: BusinessModel | null, sellerText: string, unit?: string): ModelWords;
export type Part = 'champion' | 'buyer' | 'economic' | 'blocker' | 'user' | 'influencer' | 'outside' | 'group';
export interface RoleCtx {
    P: string;
    v: Vertical | null;
    metric: string;
}
export interface RoleRead {
    part: string;
    cares: string;
    step: string;
    kind: Part | null;
}
/** What a contact is for, from the title (and from the role the user wrote in brackets, which always wins). */
export declare function readRole(c: Contact, kind: Part | null, ctx: RoleCtx, investment: boolean): RoleRead;
export interface ThreatRead {
    text: string;
    tells: string;
    ask: string;
    prove: string;
    id: string;
}
/** Reads each alternative the user listed; two alternatives of the same kind get different questions. */
export declare function readThreats(items: string[]): ThreatRead[];
export interface QACtx {
    P: string;
    parts: string[];
    model: BusinessModel | null;
    sellerText: string;
    /** the unit a usage priced deal is paid in (read from the user's words), or '' */
    unit?: string;
    v: Vertical | null;
    /** the buyer's own requirements and the alternatives they use, as short phrases */
    needs: string[];
    alternatives: string[];
}
export interface QAnswer {
    id: string;
    answer: string;
    bring: string;
    ask: string;
}
/** Answers one objection or blocker. The answer says what to do and what to bring; it states no fact about the user's product. */
export declare function answerQuestion(raw: string, ctx: QACtx): QAnswer;
/** The owner of an answer in a deal plan, by the kind of question (a key of the roles the caller knows). */
export declare function ownerKind(id: string): 'it' | 'security' | 'price' | 'champion' | 'se' | 'terms' | 'seller';
/** The buyer's industry as a clean phrase: "Financial_Services" becomes "financial services"; an empty or generic value gives ''. */
export declare function cleanIndustry(s: unknown): string;
/** The industry named in an account or deal title: "Banking account (Acme customer)" gives "Banking"; "Retail deal for Acme" gives "Retail". */
export declare function industryFromTitle(s: unknown): string;
export { sentences };
/** When the product has no clear name in the user's text, the first sentence of what the user wrote, quoted whole (cut only at a comma); '' when a name was found. */
export declare function sellerWords(brief: SolutionBrief): string;
/** The kind of product, read from the user's description, without the name repeated at its start ("Wisely, a single API led platform" gives "a single API led platform"); the brief with that kind, for describeWith. */
export declare function cleanBrief(brief: SolutionBrief): SolutionBrief;
/** A set of answers must not repeat a sentence: a sentence an earlier answer already holds is dropped (the first sentence of an answer always stays),
 *  a repeated "bring" line names its own question, and a repeated question is left out. */
export declare function dedupeAnswers<T extends {
    text: string;
    a: QAnswer;
}>(items: T[]): T[];
/** The product brief of dealtext.ts; when it finds no clear name, a first word that is written like a name (capitalised, not a common word) and that the user's other inputs also use is taken as the name. */
export declare function briefOf(text: string, evidence: string[]): SolutionBrief;
/** The unit a usage priced deal is paid in, read from what the user typed ("pay only for active SIMs", "per message"); '' when the words show none or show seats or licences. */
export declare function usageUnit(...texts: string[]): string;
/** Replaces the business model sentence of a context line when the user's pricing words show a usage priced deal. */
export declare function usageLine(line: string, unit: string): string;
//# sourceMappingURL=rw1-common.d.ts.map