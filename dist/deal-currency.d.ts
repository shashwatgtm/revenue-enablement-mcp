/** Currency belongs to the supplied deal, never to a default locale. */
export declare const DEAL_CURRENCIES: readonly ["INR", "USD", "GBP", "EUR", "SGD", "AED"];
export declare function dealCurrency(args: Record<string, unknown>): string | undefined;
/** Stop-the-harm S6 (22 Nov 2026): the currency chosen in the field and a different currency named in the text. */
export declare function dealCurrencyConflict(args: Record<string, unknown>): {
    chosen: string;
    text: string[];
} | null;
export declare function dealMoney(value: number, args: Record<string, unknown>): string;
//# sourceMappingURL=deal-currency.d.ts.map