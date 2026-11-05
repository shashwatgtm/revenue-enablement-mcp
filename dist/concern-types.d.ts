export type ConcernId = 'data-residency' | 'privacy' | 'security' | 'compliance' | 'legal' | 'budget' | 'bill-forecast' | 'price' | 'procurement' | 'service-level' | 'quality' | 'integration' | 'capacity' | 'switching' | 'adoption' | 'approval' | 'timing';
export interface ConcernType {
    id: ConcernId;
    label: string;
    reason: string;
    test: RegExp;
}
export declare const CONCERN_TYPES: ConcernType[];
/** The concern type of a typed blocker or challenge: the first type in the fixed list whose words match, or null. */
export declare function concernOf(text: string): ConcernType | null;
//# sourceMappingURL=concern-types.d.ts.map