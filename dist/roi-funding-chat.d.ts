export interface FundingChat {
    customers?: number;
    perCustomer?: string;
    spend?: string;
    limit?: number;
    margin?: number;
    cycle?: number;
    win?: number;
    fy?: number;
    start?: string;
    currencies: string[];
    notRead: string[];
    unreadMonths: string[];
    unreadCounts: string[];
}
/** Currency marks are read over every caller text field, not inferred from a dollar sign's geography. */
export declare function fundingTextCurrencies(words: string): string[];
export declare function readFundingChat(words: string, now: Date): FundingChat;
//# sourceMappingURL=roi-funding-chat.d.ts.map