type Direction = 'lower' | 'higher' | 'unclear';
export type PriceComparison = {
    direction: Direction;
    percent: number | null;
    annualGap: number | null;
};
export declare function readPriceComparison(text: string, dealValue: number): PriceComparison;
export {};
//# sourceMappingURL=price-comparison.d.ts.map