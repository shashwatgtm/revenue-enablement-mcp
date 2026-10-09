import { type Vertical, type BusinessModel } from './verticals.ts';
export interface ChampDeps {
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
    /** the pilot steps usual for this kind of seller, the next step being the first */
    steps: (v: Vertical | null, modelKey: string) => string[];
    footer: string;
}
export declare function buildChampionKit(args: Record<string, unknown>, d: ChampDeps): string;
//# sourceMappingURL=rw-champion.d.ts.map