/** Read stated outcomes independently of row formatting. Printed text stays inert. */
export type PortfolioOutcome = 'won' | 'lost' | 'nd' | 'open';
export interface PortfolioDeal {
    text: string;
    outcome: PortfolioOutcome;
}
export declare function readPortfolioDeals(input: string): PortfolioDeal[];
//# sourceMappingURL=portfolio-outcomes.d.ts.map