import type { Vertical } from './verticals.ts';
import { type Deps } from './rw-common.ts';
export declare const EMAIL_COUNTS: Record<string, number>;
/** The separate pains of a typed pain statement: each clause is used once. A long clause is cut at ", and" or "while" where both sides can stand. */
export declare function painAtoms(text: string): string[];
export declare function buildEmailSequence(args: Record<string, unknown>, D: Deps, footer: string, sectorBlock: (v: Vertical | null) => string): string;
//# sourceMappingURL=rw-email.d.ts.map