export type Row = Record<string, any>;
export type Schema = {
    type: string;
    description?: string;
    properties?: Record<string, Schema>;
    items?: Schema;
    required?: string[];
    enum?: string[];
    minItems?: number;
    maxItems?: number;
    maxLength?: number;
    minimum?: number;
    additionalProperties?: boolean;
};
export declare const text: Schema;
export declare const num: Schema;
export declare const choice: (...values: string[]) => Schema;
export declare const object: (properties: Record<string, Schema>, required?: string[]) => Schema;
export declare const array: (items: Schema, minItems?: number) => Schema;
export declare const count: (s: string) => number;
export declare const iso: (s: string) => boolean;
export declare const day: (s: string) => string;
export declare const safeUrl: (s: string) => import("url").URL | null;
export declare function validate(s: Schema, v: any, path?: string): string[];
export declare const evidence: Schema;
export declare const normalizeQuote: (value: string) => string;
export declare function canonicalUrl(value: string): string;
export type ClaimToken = {
    value: number;
    unit: string;
    kind: "percent" | "currency" | "multiplier" | "count";
    key: string;
};
export declare function claimTokens(value: string, includeSmall?: boolean): ClaimToken[];
export declare function missingClaims(claim: string, excerpt: string, onlySales?: boolean): ClaimToken[];
export declare function evidenceIssues(rows: Row[], asOf?: string, window?: number): string[];
export declare const unique: (rows: Row[], key: string) => string[];
export declare const report: (issues: string[], data: Row, limitations: string[], thin?: boolean) => {
    limitations: string[];
    status: string;
    issues: string[];
};
export declare const hasDash: (text: string) => boolean;
export declare const superlative: (text: string) => boolean;
export declare const placeholder: (text: string) => boolean;
export declare function parseEmails(text: string): {
    body: any;
}[];
export declare function parseNewsletter(text: string): {
    title: string;
    url: string;
    date: string;
    excerpt: string;
    take: string;
    why_it_matters: string;
    status: string;
}[];
export declare function readerText(result: Row, escape: (value: string) => string): string;
//# sourceMappingURL=checker-common.d.ts.map