import { type Vertical, type BusinessModel } from './verticals.ts';
export interface DemoDeps {
    readContext: (explicitModel: unknown, input: {
        seller: unknown[];
        context?: unknown[];
        role?: unknown[];
        buyer?: unknown[];
    }) => {
        v: Vertical | null;
        model: BusinessModel | null;
        line: string;
    };
    cap: (s: string) => string;
    lowerFirstIfCommon: (s: string) => string;
    sectorNotes: (v: Vertical | null, what: 'objections') => string;
    splitItems: (s: unknown) => string[];
    /** the evidence formats a buyer of this kind of seller expects, and the next step offered in this sector */
    stock: (v: Vertical | null, modelKey: string) => {
        show: string[];
        next: string;
    };
    footer: string;
}
export declare function buildDemoScript(args: Record<string, unknown>, d: DemoDeps): string;
//# sourceMappingURL=rw-demo.d.ts.map