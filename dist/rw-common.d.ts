import { clip, upperFirst, splitTopLevel, type SolutionBrief } from './dealtext.ts';
import { type Vertical, type BusinessModel } from './verticals.ts';
export interface Deps {
    lower: (s: string) => string;
    cap: (s: string) => string;
    isCommon: (w: string) => boolean;
    money: (n: number) => string;
}
export interface SectorRead {
    v: Vertical | null;
    model: BusinessModel | null;
    line: string;
}
export declare function readSector(explicitModel: unknown, input: {
    seller: unknown[];
    context?: unknown[];
    role?: unknown[];
    buyer?: unknown[];
}): SectorRead;
export interface Product {
    /** the name as typed ("Routelark", "Harbor BPO", "eClerx"); '' when the text gives no name */
    name: string;
    /** what it is, from the description ("a route planning platform for third-party logistics providers"); '' when none */
    kind: string;
    /** the parts the description lists */
    parts: string[];
    /** how a sentence refers to it: the name, or "the cloud platform" when there is no name, or "the product" */
    ref: string;
    /** the name with the kind, clipped, for a title or a table ("Harbor BPO customer experience and collections services on Beacon") */
    label: string;
    full: string;
    brief: SolutionBrief;
}
export declare function productOf(solution: string, D: Deps): Product;
/** "is a route planning platform for ...", "offers digital services", or '' when the description gives no kind. */
export declare function isKind(p: Product, D: Deps): string;
/** The parts a description lists: after a colon, after "covering/including/spanning", after ", with", or in the first brackets. */
export declare function partsIn(p: Product): string[];
export type AltKind = 'vendor' | 'category' | 'approach';
export interface Alt {
    text: string;
    kind: AltKind;
    handle: string;
}
export declare function handleOf(text: string): string;
export declare function readAlt(text: string, D: Deps, named?: boolean): Alt;
export interface Source {
    type: 'own' | 'page' | 'quote' | 'title' | 'other';
    basis: string;
}
/** The kind of source a trailing label names, and the basis it gives ("from a 2025 customer survey"). */
export declare function sourceOf(label: string): Source;
/** Ends a sentence with one full stop (or keeps ? and !); never doubles one. */
export declare function endSentence(s: string): string;
/** A sentence starts with a capital unless it starts with a name written with a small first letter (eClerx). */
export declare function sentenceCase(s: string): string;
/** Splits a typed list at semicolons and new lines only. */
export declare function listItems(s: unknown): string[];
export declare const isNotGiven: (s: string) => boolean;
/** "a, b and c". */
export declare function andList(items: string[], word?: string): string;
/** Removes whole sentences that were already said (case and punctuation ignored); keeps the first. Sentences under 25 characters are never removed. */
export declare function dropRepeats(paras: string[], seen: Set<string>): string[];
export { splitTopLevel, clip, upperFirst };
//# sourceMappingURL=rw-common.d.ts.map