/** Currency belongs to the supplied deal, never to a default locale. */
export declare const DEAL_CURRENCIES: readonly ["INR", "USD", "GBP", "EUR", "SGD", "AED"];
export declare function dealCurrency(args: Record<string, unknown>): string | undefined;
export declare function dealMoney(value: number, args: Record<string, unknown>): string;
//# sourceMappingURL=deal-currency.d.ts.map