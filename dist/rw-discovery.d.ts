import { type Vertical, type BusinessModel } from './verticals.ts';
export interface DiscoveryDeps {
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
    sectorNotes: (v: Vertical | null, what: 'committee') => string;
    splitItems: (s: unknown) => string[];
    rankMeasures: (measures: string[], pain: string, solution: string) => string[];
    proofOf: (v: Vertical) => string;
    footer: string;
}
export declare function buildDiscoveryBank(args: Record<string, unknown>, d: DiscoveryDeps): string;
//# sourceMappingURL=rw-discovery.d.ts.map