import { type SolutionBrief } from './dealtext.ts';
import { type BusinessModel } from './verticals.ts';
export declare function wordsOf(t: string, dropGeneric?: boolean): string[];
/** How many different words of `a` appear (by stem) in `b`. */
export declare function overlap(a: string, b: string, skip?: string[]): number;
export declare function groupsOf(t: string): Set<string>;
/** How two texts touch: words in common (by stem), word groups in common, and a score (words count double, groups at most two). */
export declare function fit(a: string, b: string, skip?: string[]): {
    w: number;
    g: number;
    s: number;
};
/** How close two texts are: words in common count double, shared word groups count once (at most two). */
export declare function closeness(a: string, b: string, skip?: string[]): number;
export declare const lensFor: (family: string) => string;
export interface PainSet {
    pains: string[];
    evidence: string[];
    notes: string[];
}
/** The separate pains in a typed pain statement. A comma list inside one pain stays whole ("a, b and c"); a figure after a colon is evidence, not a pain;
 *  a bracket that only says where a statement came from is a source note. */
export declare function readPains(text: string): PainSet;
/** A long pain in fewer words: cut at a natural boundary where what is left is a whole statement; a pain that cannot be cut cleanly is kept whole. */
export declare function painShort(p: string, max?: number): string;
/** Brackets that only say where a statement came from ("the page promises ...", "implied by ...") are taken out of a text; the notes are returned apart. */
export declare function splitNotes(text: string): {
    text: string;
    notes: string[];
};
/** How a pain is named after it has been played back: its own words in quotes when it is short, else "the first problem you described". */
export declare function painRef(p: string, i: number, headClause?: boolean): string;
export type PainType = 'speed' | 'risk' | 'manual' | 'experience' | 'cost' | 'compliance' | 'visibility' | 'general';
export declare function painType(p: string): PainType;
/** How to show a pain of this type: what the presenter puts on screen, what is said about it, and what is asked (a way of showing, never a claim about the
 *  product). Three wordings of each, so two steps for the same kind of pain do not repeat a sentence. */
export declare const SHOW: Record<PainType, {
    screen: string[];
    say: string[];
    ask: string[];
}>;
export interface Capability {
    name: string;
    desc: string;
    stat: string;
}
export declare const isStat: (t: string) => boolean;
/** A verb a presenter can act on: an item that starts with one is a flow to run, even when it holds a number ("send two messages"). */
export declare const DEMO_VERB: RegExp;
/** The name as the user typed it at the start of the description ("eClerx digital"). It is written once in each answer, so the full name is always there. */
export declare function productHead(brief: SolutionBrief, full: string): string;
/** The name used in running text: the typed name without a lower case word that only says what kind of firm it is. */
export declare function productName(brief: SolutionBrief, full: string): string;
export declare function toCapability(raw: string, product?: string): Capability | null;
/** What the product is, and its named parts, from the description the user typed. Several layouts are read: a list after a colon, after "across",
 *  "covering", "including", "joins", "with" and the like. Fewer than two parts means the description lists none. */
export declare function readProduct(full: string, name: string): {
    kind: string;
    caps: Capability[];
};
/** The part with what the user said it does, for reference in a sentence: "Verify (check a borrower's bank account)", "Glean Intelligence for routing work". */
export declare const capText: (c: Capability) => string;
/** The part as it is said aloud: "Verify, which checks a borrower's bank account", "Watch, sanctions and watchlist screening", "AI agents that act on exceptions". */
export declare function capSay(c: Capability): string;
export declare const upFirst: (s: string) => string;
export interface Item {
    text: string;
    label: string;
}
export declare function readMustShow(text: string): {
    flows: Item[];
    claims: Item[];
};
export interface AnswerCtx {
    P: string;
    kind: string;
    caps: Capability[];
    alts: string[];
    pains: string[];
    claims: Item[];
    outcomes: string[];
    model: BusinessModel | null;
    voice: 'seller' | 'champion';
    /** the parts shown in the demo, when the answer can point to them */
    shown?: string[];
    sectorObjections?: {
        objection: string;
        response: string;
    }[];
    sectorName?: string;
    /** the price or budget text the user gave, if any */
    budget?: string;
    /** how many answers of each kind were already written in this call (so a second answer of a kind is worded differently) */
    seen?: Record<string, number>;
    /** the people who could join a technical call, as noun phrases */
    itPerson?: string;
    securityPerson?: string;
}
export interface Answer {
    kind: string;
    say: string;
    ask: string;
    check: string;
    sector: string; /** what could go wrong, in the buyer's voice (for a risk list) */
    risk: string;
}
export declare function objectionKind(t0: string, sectorLabels?: string[]): string;
/** A buyer's question put to the seller, said back in the second person ("Can we use our own model" becomes "Can you use your own model"). */
export declare function youify(q0: string): string;
/** The first part of a value point: what comes before a colon, else the whole point up to its first bracket. */
export declare function outcomeHead(o: string): string;
/** Answers one objection in the voice asked for. Each answer uses the inputs that touch the question (the product's parts, the alternatives, the pains,
 *  the statistics with their labels) and the business model; where a fact is needed that was not given, it says so in `check` instead of claiming it. */
export declare function answerObjection(o: string, c: AnswerCtx): Answer;
/** Removes a sentence of 40 characters or more that an earlier answer already holds, and an ask that was already put, so no answer repeats another word for word. */
export declare function dedupeAnswers(list: {
    say: string;
    ask: string;
}[]): void;
//# sourceMappingURL=rw-kit.d.ts.map