export declare const ROI_SCOPE_DECLINE: string;
/** Read the funded work, setting aside the funder's own industry and location. */
export declare function roiFundingSubject(text: string): string;
/** True when the investment being justified is a GTM or marketing investment. */
export declare function roiInScope(args: Record<string, unknown> | undefined): boolean;
/** The decline text when the ROI case is out of scope, otherwise undefined. */
export declare function roiScopeDecline(name: string, args: Record<string, unknown> | undefined): string | undefined;
//# sourceMappingURL=roi-scope.d.ts.map