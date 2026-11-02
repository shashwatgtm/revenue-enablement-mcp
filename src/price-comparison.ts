// A free-text percentage is not a price gap unless its own clause compares prices.
// Unknown or mixed quote bases stay unknown; the frozen deal_value field has no period.
type Direction = 'lower' | 'higher' | 'unclear';
export type PriceComparison = { direction: Direction; percent: number | null; annualGap: number | null };
const unknown = (): PriceComparison => ({ direction: 'unclear', percent: null, annualGap: null });
const operational = /\b(?:handoff|escalation|uptime|downtime|availability|accuracy|conversion|retention|churn|margin|quality|utili[sz]ation|adoption|resolution|success|failure|error|win|latency|speed|discount|commission|interest|tax)\b/i;
const component = /\b(?:setup|set-up|implementation|installation|onboarding|one-time|one time|upfront|deposit)\b/i;
const uncertainty = /\b(?:not confirmed|unconfirmed|unverified|unknown|unclear|cannot confirm|can't confirm|not sure|might|may be|could be|alleged\w*|if|assuming|suppose)\b/i;
const moneySubject = /\b(?:quote[sd]?|price|pricing|costs?|fees?|rate)\b/i;
const bareCompetitor = /^\s*(?:(?:our|your|the)\s+)?(?:competitor|rival|incumbent)(?:\s+(?:is|was|are))?(?:\s+(?:about|approximately|roughly|around))?\s*$/i;
const inverse = /^\s*(?:our|your|my)\s+(?:(?:annual|yearly|monthly|total|all-in)\s+)*(?:price|quote|cost|fee|rate)\b/i;
const lower = /^(?:cheaper|lower|below|less)/i;
const historical = /\b(?:old|previous|prior|historical|last year|last month)\b/i;
const foreignBase = /\bthan\s+(?!(?:ours|us|our|yours|you|your)\b)/i;
const relation = 'cheaper|lower|below|less expensive|less(?: than)?|higher|above|more expensive|more(?: than)?';

export function readPriceComparison(text: string, dealValue: number): PriceComparison {
  if (!text.trim() || uncertainty.test(text) || text.includes('?')) return unknown();
  const found: Array<PriceComparison> = [];
  // Keep decimal prices intact. Clauses avoid binding one metric to another sentence.
  for (const clause of text.split(/[;\n]|[.!](?:\s|$)/).map(s => s.trim()).filter(Boolean)) {
    if (component.test(clause) || inverse.test(clause) || historical.test(clause) || foreignBase.test(clause) || /\b(?:not|never|neither)\b/i.test(clause)) continue;
    const periods = [...clause.matchAll(/\b(annual|yearly|monthly|weekly|daily)\b/gi)].map(m => /annual|yearly/i.test(m[1]) ? 'annual' : m[1].toLowerCase());
    if (new Set(periods).size > 1) continue;
    const matches = [
      ...[...clause.matchAll(new RegExp('(\\d+(?:\\.\\d+)?)\\s*%\\s*(' + relation + ')', 'gi'))].map(m => ({ index: m.index!, text: m[0], amount: m[1], relation: m[2] })),
      ...[...clause.matchAll(new RegExp('\\b(' + relation + ')\\s+by\\s+(\\d+(?:\\.\\d+)?)\\s*%', 'gi'))].map(m => ({ index: m.index!, text: m[0], amount: m[2], relation: m[1] })),
    ];
    for (const m of matches) {
      const before = clause.slice(0, m.index), after = clause.slice(m.index + m.text.length);
      if (operational.test(before)) continue;
      if (!moneySubject.test(before) && !bareCompetitor.test(before) && !/^\s*(?:about|approximately|roughly|around)?\s*$/i.test(before)) continue;
      // A following metric or another comparator is not the seller's current quote.
      if (after.trim() && !/^\s*(?:(?:than\s+)?(?:ours|us|our|yours|you|your)\b|[,.:]|for\s+(?:the\s+)?same\b)/i.test(after)) continue;
      if (/[-\d]\s*$/.test(before) || /\b(?:between|from)\b/i.test(before)) continue;
      const percent = Number(m.amount), direction = lower.test(m.relation) ? 'lower' : 'higher';
      if (!Number.isFinite(percent) || percent <= 0 || (direction === 'lower' && percent > 100)) continue;
      // Annual arithmetic requires the stated comparator to identify our annual
      // amount, equal to deal_value, and the same scope. A term total is insufficient.
      const ownAnnual = after.match(/^\s*(?:than\s+)?(?:our|your)\s+(?:annual|yearly)\s+(?:price|quote|fee|cost|total)\s+(?:of\s+|is\s+)?(?:USD\s*|\$)([\d,]+(?:\.\d+)?)/i);
      const annualAmount = ownAnnual ? Number(ownAnnual[1].replace(/,/g, '')) : NaN;
      const annualBasis = /\b(?:annual|yearly)\b/i.test(before) && !/\b(?:monthly|weekly|daily|per minute|per seat|per user|except|excludes?|excluding|different)\b/i.test(clause) && /\bsame\s+scope\b/i.test(clause) && annualAmount === dealValue && dealValue > 0;
      found.push({ direction, percent, annualGap: annualBasis ? dealValue * percent / 100 : null });
    }
    if (!matches.length && !operational.test(clause) && !/%/.test(clause)) {
      const relations = [...clause.matchAll(/\b(cheaper|lower|below|less expensive|higher|above|more expensive)\b/gi)];
      if (relations.length === 1) {
        const m = relations[0], before = clause.slice(0, m.index), after = clause.slice(m.index! + m[0].length);
        const quoteSubject = moneySubject.test(before) || bareCompetitor.test(before);
        const ownBase = !after.trim() || /^\s*(?:(?:than\s+)?(?:ours|us|our|yours|you|your)\b|[,.:]|for\s+(?:the\s+)?same\b)/i.test(after);
        if (quoteSubject && ownBase) found.push({ direction: lower.test(m[1]) ? 'lower' : 'higher', percent: null, annualGap: null });
      }
    }
  }
  if (!found.length) return unknown();
  const first = found[0];
  if (found.some(x => x.direction !== first.direction || x.percent !== first.percent || x.annualGap !== first.annualGap)) return unknown();
  return first;
}
