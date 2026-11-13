import * as rules from './roi-funding-config.ts';
type Args = Record<string, unknown>;
export type FundingClock = () => Date;
export interface FundingMoney {
    value: number | undefined;
    currency: string;
    marked: boolean;
    raw: string;
}
/** The page mirrors this small rule; a shared input list checks parity. No conversion. */
export declare function readFundingMoney(value: unknown, currency?: string): FundingMoney;
export declare function fundingMoney(value: number, currency: string, derived?: boolean): string;
export declare const fundingMonths: (n: number) => number;
export interface FundingClassification {
    kind: rules.FundingClass;
    group: string;
    reason: string;
    mixed: boolean;
}
export declare function classifyFunding(value: string): FundingClassification;
export declare function fundingGeo(args: Args, explicit: string, currency: string): string;
export interface FundingInputs {
    subject: string;
    classification: FundingClassification;
    fixed: boolean;
    guarded: boolean;
    S: number | undefined;
    N: number | undefined;
    A: number | undefined;
    L: number;
    G: number | undefined;
    C: number | undefined;
    W: number | undefined;
    fy: number | undefined;
    start: string;
    startGiven: boolean;
    fyGiven: boolean;
    spendCurrencyFromText: boolean;
    perCurrencyFromText: boolean;
    currencyConflict: boolean;
    currency: string;
    spendCurrency: string;
    perCurrency: string;
    geo: string;
    limitGiven: boolean;
    error: string;
    missing: string[];
    signs: string;
    period: string;
}
export declare function readFundingInputs(args: Args, clock?: FundingClock): FundingInputs;
export declare function fundingVerdict(kind: rules.FundingClass, p: number, L: number): {
    row: string;
    words: string;
};
export declare function fundingRecovery(start: string, T: number, fy: number | undefined): string;
export declare function fundingRoutes(i: FundingInputs, failed?: boolean, undecided?: boolean): {
    action: string;
    routes: [string, string][];
};
export declare function buildRoiFunding(args: Args, clock?: FundingClock): string;
export {};
//# sourceMappingURL=roi-funding.d.ts.map