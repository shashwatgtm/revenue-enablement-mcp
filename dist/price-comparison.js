"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPriceComparison = readPriceComparison;
const unknown = () => ({ direction: 'unclear', percent: null, annualGap: null });
const operational = /\b(?:handoff|escalation|uptime|downtime|availability|accuracy|conversion|retention|churn|margin|quality|utili[sz]ation|adoption|resolution|success|failure|error|win)\b/i;
const component = /\b(?:setup|set-up|implementation|installation|onboarding|one-time|one time|upfront|deposit)\b/i;
const uncertainty = /\b(?:not confirmed|unconfirmed|unverified|unknown|unclear|cannot confirm|can't confirm|not sure|might|may be|could be|alleged)\b/i;
const moneySubject = /\b(?:competitor|rival|incumbent|their|quote|quotes|price|pricing|cost|fee|rate)\b/i;
const inverse = /^\s*(?:our|your|my)\s+(?:(?:annual|yearly|monthly|total|all-in)\s+)*(?:price|quote|cost|fee|rate)\b/i;
const lower = /^(?:cheaper|lower|below|less)/i;
function readPriceComparison(text, dealValue) {
    if (!text.trim() || uncertainty.test(text) || text.includes('?'))
        return unknown();
    const found = [];
    // Keep decimal prices intact. Clauses avoid binding one metric to another sentence.
    for (const clause of text.split(/[;\n]|[.!](?:\s|$)/).map(s => s.trim()).filter(Boolean)) {
        if (component.test(clause) || inverse.test(clause) || /\b(?:not|never|neither)\b/i.test(clause))
            continue;
        const periods = [...clause.matchAll(/\b(annual|yearly|monthly|weekly|daily)\b/gi)].map(m => /annual|yearly/i.test(m[1]) ? 'annual' : m[1].toLowerCase());
        if (new Set(periods).size > 1)
            continue;
        const matches = [...clause.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(cheaper|lower|below|less expensive|less(?: than)?|higher|above|more expensive|more(?: than)?)/gi)];
        for (const m of matches) {
            const before = clause.slice(0, m.index), after = clause.slice(m.index + m[0].length);
            if (operational.test(before) || /^\s*(?:handoff|escalation|uptime|downtime|accuracy|conversion|retention|churn|margin|quality|utili[sz]ation|error|win)\b/i.test(after))
                continue;
            if (!moneySubject.test(before) && !/^\s*(?:about|approximately|roughly|around)?\s*$/i.test(before))
                continue;
            if (/[-\d]\s*$/.test(before) || /\b(?:between|from)\b/i.test(before))
                continue;
            const percent = Number(m[1]), direction = lower.test(m[2]) ? 'lower' : 'higher';
            if (!Number.isFinite(percent) || (direction === 'lower' && percent > 100))
                continue;
            // Annual arithmetic requires the stated comparator to identify our annual
            // amount, equal to deal_value, and the same scope. A term total is insufficient.
            const ownAnnual = after.match(/^\s*(?:than\s+)?(?:our|your)\s+(?:annual|yearly)\s+(?:price|quote|fee|cost|total)\s+(?:of\s+|is\s+)?(?:USD\s*|\$)([\d,]+(?:\.\d+)?)/i);
            const annualAmount = ownAnnual ? Number(ownAnnual[1].replace(/,/g, '')) : NaN;
            const annualBasis = /\b(?:annual|yearly)\b/i.test(before) && !/\b(?:monthly|weekly|daily|per minute|per seat|per user)\b/i.test(clause) && /\bsame\s+scope\b/i.test(clause) && annualAmount === dealValue && dealValue > 0;
            found.push({ direction, percent, annualGap: annualBasis ? dealValue * percent / 100 : null });
        }
        if (!matches.length && moneySubject.test(clause) && !operational.test(clause)) {
            const directions = [...clause.matchAll(/\b(cheaper|lower|below|less expensive|higher|above|more expensive)\b/gi)].map(m => lower.test(m[1]) ? 'lower' : 'higher');
            if (directions.length === 1)
                found.push({ direction: directions[0], percent: null, annualGap: null });
        }
    }
    if (!found.length)
        return unknown();
    const first = found[0];
    if (found.some(x => x.direction !== first.direction || x.percent !== first.percent || x.annualGap !== first.annualGap))
        return unknown();
    return first;
}
//# sourceMappingURL=price-comparison.js.map