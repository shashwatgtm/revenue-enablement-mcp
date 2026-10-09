import { type Deps } from './rw1-common.ts';
export interface RoiStructureInput {
    customerName: string;
    industry: string;
    companySize: string;
    yourSolution: string;
    primaryValueDriver: string;
    knownMetrics: string;
    currentProcess: string;
    implementationTimeline: string;
    revenueGiven: boolean;
    employeesGiven: boolean;
    annualRevenue: number;
    employeeCount: number;
    priceGiven: boolean;
    solutionPrice: number;
    ownCost: number | null;
    ownPct: number | null;
}
export declare function buildRoiStructure(args: Record<string, unknown>, i: RoiStructureInput, d: Deps): string;
//# sourceMappingURL=rw1-roi.d.ts.map