import type { Vertical } from './verticals.ts';
import { type Deps } from './rw-common.ts';
export declare const CRED_RE: RegExp;
export declare const TRAP_PLACES: RegExp;
export declare function lowerKeep(t: string): string;
export declare function trapClaims(s: string): string[];
export declare const TRAP_METAPHOR: RegExp;
export declare function trapWords(s: string): string[];
export declare function trapShares(a: string, b: string): number;
export declare function trapBase(verb: string): string;
export declare function trapCriterion(s: string): string;
export declare function trapIng(verb: string): string;
export declare const TRAP_CLAUSE_VERB: RegExp;
export declare function trapClauses(wRaw: string): string[];
export declare const OPEN_QS: string[];
export declare function trapQuestion(wRaw: string, comp: string): {
    q: string;
    topic: string;
};
export declare const TRAP_WANT_VERBS: RegExp;
export declare function fineClauses(w: string): string[];
export declare function joinLists(cs: string[]): string[];
export declare function buildTrapSetter(args: Record<string, unknown>, D: Deps, footer: string, sectorBlock: (v: Vertical | null) => string): string;
//# sourceMappingURL=rw-trap.d.ts.map