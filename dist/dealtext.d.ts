/** Splits at commas that are outside brackets and quotes. */
export declare function splitTopLevel(text: string, sep?: RegExp): string[];
/** Sentences, split only at a real sentence end: not inside a number (3.5), an abbreviation (Rs. 15, e.g.) or after a single capital. */
export declare function sentences(text: string): string[];
/** Cuts a text at a word boundary, never inside a word; adds nothing when it already fits. */
export declare function clip(text: string, max: number): string;
/** "a, b and c" from a list. */
export declare function joinList(items: string[], word?: string): string;
export declare const lowerFirstWord: (s: string) => string;
export declare const upperFirst: (s: string) => string;
export interface SolutionBrief {
    /** the product as typed before its description ("Lanehop", "Ledgerly Billing", "Brightwell from Brightwell Labs") */
    name: string;
    /** the short name used in running text ("Brightwell") */
    short: string;
    /** what it is, in the user's words ("an API platform for building and using APIs"); '' when the text gives none */
    kind: string;
    /** the parts the description lists after a colon or "made of" */
    parts: string[];
    full: string;
}
/** True for an everyday word, an adjective or a hyphenated descriptor ("Cloud-native"); false for a word that can be a name. */
export declare function isGenericWord(word: string): boolean;
export declare function solutionBrief(input: string): SolutionBrief;
/** The name of a part without its bracket: "prepaid cards (petty cash, fleet)" -> "prepaid cards". */
export declare function partLabel(part: string): string;
export type RoleFamily = 'finance' | 'security' | 'risk' | 'it' | 'engineering' | 'operations' | 'sales' | 'product' | 'marketing' | 'hr' | 'procurement' | 'executive' | 'data' | 'customer' | 'investment' | 'other';
/** The family of a job title. When the seller is an investment manager, a plain CIO is the chief investment officer. */
export declare function familyOf(title: string, investmentBuyer?: boolean): RoleFamily;
export type Level = 'exec' | 'head' | 'manager' | 'staff' | 'group';
export declare function levelOf(title: string): Level;
export interface Contact {
    raw: string;
    title: string;
    tag: string | null;
    family: RoleFamily;
    level: Level;
}
/** One contact per entry. Splits at semicolons, new lines and commas outside brackets; "Manager, Operations (champion)" stays one title. */
export declare function parseContacts(text: string, investmentBuyer?: boolean): Contact[];
/** Plain words for a stated tag ("economic buyer" stays; "buyer" is the person who decides). */
export declare function tagKind(tag: string | null): 'champion' | 'economic' | 'buyer' | 'blocker' | 'user' | 'influencer' | 'other' | null;
export interface ProofItem {
    /** the claim as typed, without its trailing label */
    text: string;
    /** what the user said it is: "customer quote", "page claim", "case study title" ... or '' */
    label: string;
    kind: 'result' | 'quote' | 'recognition' | 'scale' | 'story';
}
export declare function parseProof(text: string): ProofItem[];
/** The label to show for an item, in words a reader can check ("a customer quote on the company's website"). */
export declare function proofSource(p: ProofItem): string;
/** Picks up to `n` proof items of the preferred kinds, in order, without repeating one; recognition last. */
export declare function pickProof(items: ProofItem[], n: number, prefer?: ProofItem['kind'][], skip?: ProofItem[]): ProofItem[];
/** A proof item as a sentence-ready phrase: a customer quote keeps its speaker; the label is left out (it is listed in the checks). */
export declare function proofPhrase(p: ProofItem): string;
export declare function isWeekend(d: Date): boolean;
/** The same day, or the last working day before it. */
export declare function onOrBeforeWorkday(d: Date): Date;
/** The same day, or the next working day after it. */
export declare function onOrAfterWorkday(d: Date): Date;
/** n working days after d (negative: before). */
export declare function addWorkdays(d: Date, n: number): Date;
/** Working days between two dates, counting d2 but not d1 (0 when d2 is not after d1). */
export declare function workdaysBetween(d1: Date, d2: Date): number;
export declare const isoDate: (d: Date) => string;
export declare const weekdayName: (d: Date) => string;
/** The separate pains in a typed pain statement: split at commas outside brackets and at semicolons; "with companies stuck on ..." loses its "with". */
export declare function painClauses(text: string): string[];
/** The verb phrase that joins a product to its kind: "is a billing platform for SaaS companies", or, when the kind has no article, "is described in your input as business connectivity for banks". */
export declare function describeWith(b: SolutionBrief): string;
/** "a finance leader", "an operations leader". */
export declare function aAn(phrase: string): string;
export interface ListItem {
    text: string;
    label: string;
}
/** The items of a typed list. Semicolons and new lines split first; otherwise commas outside brackets do, and a short fragment such as "OMS" or "FMS or TMS in
 *  weeks" stays with the item before it. A closing label such as "(page claims)" belongs to every item. */
export declare function splitFeatureList(text: string): ListItem[];
/** Run 21c round 3: "our solution", "the solution" and the like stand in for a name that was not clearly given; at the start of a sentence they take a capital. */
export declare function capitaliseSolutionPhrase(text: string): string;
//# sourceMappingURL=dealtext.d.ts.map