/** The user's own clauses of a text, in order, every word kept: split only where the user ended a sentence, put a semicolon or a colon, started a new
 *  line, or joined two statements with ", and", ", but" or ", so". Nothing is dropped and nothing is reworded. */
export declare function clausesOf(text: string): string[];
export interface Split {
    title: string;
    framework: string;
    sectorParts: string[];
    gaps: string[];
    gapLine: string;
}
/** Splits a tool's answer into its title line, the deliverable, the sector parts and the gap items. */
export declare function splitAnswer(answer: string): Split;
/** The six sections for one of the ten tools. An answer that is not a normal answer (no title line: a refusal or an input error) is returned as it is. */
export declare function structureAnswer(tool: string, args: Record<string, unknown>, answer: string, optionalFields?: string[]): string;
//# sourceMappingURL=structure.d.ts.map