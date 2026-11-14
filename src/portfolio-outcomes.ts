/** Only explicit row outcomes count. Reasons never override the stated outcome. */
export type PortfolioOutcome = 'won' | 'lost' | 'nd' | 'open';
export interface PortfolioDeal { text: string; outcome: PortfolioOutcome }
const outcome = (s: string): PortfolioOutcome | null => {
  const v = s.trim().replace(/^["']|["']$/g, '').replace(/[.!]$/, '').toLowerCase().replace(/[_-]/g, ' ');
  return /^(?:won|win)$/.test(v) ? 'won' : /^(?:lost|loss)$/.test(v) ? 'lost' : /^no\s*decision$/.test(v) ? 'nd' : v === 'open' ? 'open' : null;
};
function cells(line: string): string[] {
  if (line.includes('|')) return line.replace(/^\||\|$/g, '').split('|').map(s => s.trim());
  const values: string[] = []; let value = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { values.push(value.trim()); value = ''; } else value += c;
  }
  values.push(value.trim()); return values;
}
export function readPortfolioDeals(input: string): PortfolioDeal[] {
  const rows: PortfolioDeal[] = []; let column: number | null = null;
  for (const raw of input.split(/\r?\n/)) {
    const text = raw.trim().replace(/^[-*+]\s+|^\d+[.)]\s+/, '');
    // MCP makes Markdown inert before this reader. Read structural markers without
    // undoing the escaping on the text that is printed in the answer.
    const syntax = text.replace(/\\([|#*+\-.)])/g, '$1').replace(/^[-*+]\s+|^\d+[.)]\s+/, '');
    if (!syntax || /^#/.test(syntax) || /^[|\s:\-]+$/.test(syntax)) continue;
    const fields = cells(syntax), first = fields[0].trim();
    if (/^(?:grand\s+total|sub[ -]?total|total|summary)\b/i.test(first)) continue;
    const header = fields.findIndex(v => /^(?:deal[ _-]?)?(?:outcome|status|result)$/i.test(v));
    if (header >= 0 && fields.some(v => /^(?:deal|deal name|name|account|opportunity|reason)$/i.test(v))) { column = header; continue; }
    if (/^(?:(?:recent|closed|won|lost|open|no[ _-]?decision)\s+)?deals?\s*:?$|^(?:outcomes?|results?|status|labels?)\s*:/i.test(syntax) || outcome(syntax)) continue;
    let result: PortfolioOutcome | null = null;
    if (column !== null && fields.length > column) result = outcome(fields[column]);
    else if (fields.length > 1) {
      // Without a header the result must be its own cell, after the deal name.
      result = outcome(fields[1]) || outcome(fields[1].replace(/^(?:outcome|status|result)\s*:\s*/i, ''));
    } else {
      // Anchored result clause, never an incidental word in a reason or a note.
      const m = syntax.match(/^(.+?)\s*(?::|\s+(?:was|is|ended|closed)(?:\s+as)?)\s*(won|win|lost|loss|no[ _-]?decision|open)(?:[.;]\s.*)?$/i);
      if (m && !/\b(?:reason|outcome|status|note|total|summary|label)\s*$/i.test(m[1])) result = outcome(m[2]);
    }
    if (result) rows.push({ text, outcome: result });
  }
  return rows;
}
