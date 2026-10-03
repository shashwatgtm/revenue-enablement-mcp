import { type RoleFamily } from './dealtext.ts';
export interface BlockerContext {
    /** the product's short name, or '' */
    product: string;
    /** the sector's usual objections with the pattern of a good answer (from verticals.ts) */
    sectorObjections?: {
        objection: string;
        response: string;
    }[];
    sectorName?: string;
    model?: string | null;
}
export interface BlockerAnswer {
    kind: string;
    how: string;
    confirm: string;
    ask: string;
    /** the sector's own pattern when the objection matches one of the sector's usual objections */
    sector: string;
}
/** Named things in a question: "Salesforce CRM", "NetSuite ERP", "ASC 606", "IFRS 15". */
export declare function namedThings(text: string, skip?: string[]): string[];
/** Answers one objection, blocker or buyer question by its kind, from the user's own words and the sector's usual objections. */
export declare function answerBlocker(text: string, ctx: BlockerContext): BlockerAnswer;
/** The answer as lines for a list item. */
export declare function blockerLines(text: string, ctx: BlockerContext): string[];
/** The answer in one cell or one sentence. */
export declare function blockerShort(text: string, ctx: BlockerContext): string;
export interface RoleKnowledge {
    label: string;
    cares: string;
    worry: string;
    /** what this role needs to see before it says yes */
    needs: string;
    questions: string[];
    /** the next step with a contact of this kind, for an account plan */
    nextStep: string;
    /** what this role is usually asked to check or own in a deal (used to assign milestone owners) */
    owns: string;
}
export declare const ROLE_KNOWLEDGE: Record<RoleFamily, RoleKnowledge>;
/** The role knowledge for a job title. */
export declare function roleFor(title: string, investmentBuyer?: boolean): RoleKnowledge;
export declare const INVESTMENT_OVERLAY: {
    buyerRoles: string[];
    committee: string;
    objections: {
        objection: string;
        response: string;
    }[];
    metrics: string[];
    proofShape: string;
    discovery: string[];
    salesMotion: string;
    vocabulary: string[];
};
//# sourceMappingURL=answers.d.ts.map