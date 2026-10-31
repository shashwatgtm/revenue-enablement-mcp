"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundMoney = roundMoney;
exports.parseMoney = parseMoney;
exports.concessionMath = concessionMath;
exports.negotiation = negotiation;
const reserve_common_ts_1 = require("./reserve-common.js");
const units = { lakh: 100000, lakhs: 100000, lac: 100000, crore: 10000000, crores: 10000000, cr: 10000000 };
function roundMoney(x) { if (!Number.isFinite(x) || Math.abs(x) > 100000000000000)
    throw new Error('Money result exceeds the supported range.'); if (x === 0)
    return 0; const sign = x < 0 ? -1 : 1, v = new DataView(new ArrayBuffer(8)); v.setFloat64(0, Math.abs(x)); const bits = v.getBigUint64(0), exp = Number(bits >> 52n & 2047n), mantissa = (bits & ((1n << 52n) - 1n)) + (exp === 0 ? 0n : 1n << 52n), power = (exp === 0 ? -1022 : exp - 1023) - 52; let numerator = mantissa * 100n, denominator = 1n; if (power >= 0)
    numerator <<= BigInt(power);
else
    denominator <<= BigInt(-power); let q = numerator / denominator, rem = numerator % denominator; if (rem * 2n > denominator || rem * 2n === denominator && q % 2n === 1n)
    q++; return q === 0n ? 0 : sign * Number(q) / 100; }
function parseMoney(raw, negative = false) { const s = raw.trim().toLowerCase().replace(/[₹$]/g, '').replaceAll('rs.', '').replaceAll('inr', '').trim(), m = /^([+-]?[\d,]*\.?\d+)\s*([a-z]*)$/.exec(s); if (!m || m[2] && !units[m[2]])
    throw new Error('Money must be supplied as a number in plain units, lakh or crore.'); const n = Number(m[1].replaceAll(',', '')) * (units[m[2]] ?? 1); if (!Number.isFinite(n) || Math.abs(n) > 1000000000000)
    throw new Error('Money input is outside the supported range.'); if (n < 0 && !negative)
    throw new Error('Deal value cannot be negative.'); return Number.isInteger(n) ? n : roundMoney(n); }
function concessionMath(a) {
    if (a.mode === 'discount') {
        if (a.value === undefined || a.discount_percent === undefined)
            return { status: 'MISSING_INPUTS', missing: ['deal value', 'confirmed discount percentage'].filter((_, i) => i === 0 ? a.value === undefined : a.discount_percent === undefined) };
        const value = parseMoney(a.value), risk = roundMoney(value * a.discount_percent / 100), after = roundMoney(value - risk), trades = (a.trades ?? []).filter((t) => t.worth !== undefined).map((t) => ({ trade: t.get, worth: parseMoney(t.worth, true) }));
        return { value, discount_percent: a.discount_percent, revenue_at_risk: risk, value_after_discount: after, trades, net_after_trades: trades.length ? roundMoney(after + trades.reduce((s, t) => s + t.worth, 0)) : null, label: 'your figures; the worth of each trade is the value you put on it' };
    }
    if (a.mode === 'multiyear') {
        if (a.annual === undefined || !a.discounts?.length)
            return { status: 'MISSING_INPUTS', missing: ['annual value', 'one confirmed discount percentage per year'] };
        const annual = parseMoney(a.annual), rows = a.discounts.map((d, i) => ({ year: i + 1, list: annual, discount_percent: d, after: roundMoney(annual - annual * d / 100) })), total_at_list = roundMoney(annual * rows.length), total_after = roundMoney(rows.reduce((s, r) => s + r.after, 0));
        return { annual, years: rows.length, by_year: rows, total_at_list, total_after, given_up: roundMoney(total_at_list - total_after), label: 'your figures' };
    }
    if (a.mode === 'gap') {
        if (a.value === undefined || a.gap_percent === undefined)
            return { status: 'MISSING_INPUTS', missing: ['deal value', 'buyer-stated gap percentage'] };
        const value = parseMoney(a.value), amt = roundMoney(value * a.gap_percent / 100);
        return { value, gap_percent: a.gap_percent, gap_amount: amt, competitor_price_if_gap_holds: roundMoney(value - amt), label: 'your figures; the gap is what the buyer said, not checked' };
    }
    return null;
}
function negotiation(a) {
    if (a.deal_kind !== 'new')
        return { scope: a.deal_kind === 'renewal' ? 'RENEWAL_HANDOFF' : 'CONFIRM_NEW_DEAL', next: a.deal_kind === 'renewal' ? 'Use renewal_save_plan for the renewal.' : 'Confirm whether this is a new deal before calculating concessions.', money: null, trades: [], gaps: [], champion: null };
    if (a.deadline)
        (0, reserve_common_ts_1.requireDate)(a.deadline.date, 'Deadline date');
    const money = concessionMath(a), trades = (a.trades ?? []).map((t) => ({ ...t, worth: t.worth === undefined ? null : parseMoney(t.worth, true), worthStatus: t.worth === undefined ? 'NOT_PRICED_BY_YOU' : 'YOUR_ESTIMATE', pair: 'If you can ' + t.get + ', we can consider ' + t.give + '.', status: 'PROPOSED_NOT_AGREED' })), gaps = [];
    if ((a.mode === 'discount' && a.discount_percent > 0 || a.mode === 'multiyear' && a.discounts?.some((d) => d > 0)) && !trades.length)
        gaps.push('Pair the concession with a specific trade before making an offer.');
    if (a.mode === 'multiyear')
        for (let i = 0; i < (a.discounts ?? []).length; i++)
            if (a.discounts[i] > 0 && !trades.some((t) => t.year === i + 1))
                gaps.push('Name the trade for the concession in year ' + (i + 1) + '.');
    for (const t of trades)
        if (t.year !== undefined && (!Number.isInteger(t.year) || t.year > (a.discounts?.length ?? 1)))
            throw new Error('Trade year must refer to a supplied contract year.');
    if (!a.approval_path)
        gaps.push('Approval path not given; do not assume authority.');
    if (!a.walk_away)
        gaps.push('Seller walk-away point not given.');
    let champion = null;
    if (a.champion) {
        const c = a.champion;
        const claims = c.claims ?? [];
        const included = claims.filter((x) => x.kind === 'buyer_report' || x.kind === 'measured_here' || x.source_url && x.source_quote && x.source_quote.includes(x.claim)), excluded = claims.filter((x) => !included.includes(x));
        for (const x of included)
            if (x.source_url) {
                try {
                    const u = new URL(x.source_url);
                    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password)
                        throw new Error();
                }
                catch {
                    throw new Error('Claim source URL must be HTTP(S) without credentials; it is not fetched.');
                }
            }
        const risks = (c.risks ?? []).map((r) => ({ risk: r.risk, reduction: r.reduction ?? '[User to add: what reduces this risk]', owner: r.owner ?? '[User to add: risk owner]' }));
        champion = { status: 'DRAFT_FOR_CHAMPION_REVIEW', to: c.reader_role, from: c.champion_role, problem: c.problem ?? '[User to add: the buyer problem in their words]', proposal: c.proposal ?? '[User to add: what we propose]', cost: c.cost ?? '[User to add: the confirmed cost and terms]', measure: c.measure ?? '[User to add: how we will measure the result]', evidence: included.map((x) => ({ ...x, status: 'As supplied, not independently verified' })), risks, decision: c.decision, decisionDate: c.decision_date ?? '[User to add: decision date]', dataHandling: c.data_handling ?? '[User to add: how the product handles this data]', excludedClaims: excluded.map((x) => ({ claim: x.claim, reason: 'Vendor claim has no matching supplied source quote and URL; excluded from asset.' })), note: 'Use the supplied wording as a draft in the champion\'s voice. Confirm every fact and source before forwarding. Proposed trades are not agreed terms.' };
        if (c.decision_date)
            (0, reserve_common_ts_1.requireDate)(c.decision_date, 'Champion decision date');
    }
    return { scope: 'NEW_DEAL_SELLER_REVIEW', money, trades, gaps, champion, currency: a.currency, deadline: a.deadline ?? null, approvalPath: a.approval_path ?? null, walkAway: a.walk_away ?? null, question: a.mode === 'gap' ? 'What scope, service and terms are included in the offer the buyer described?' : 'What is driving the ask: budget timing, a competing offer or a procurement target?', netMeaning: 'Trade worth is your estimate. Net including trades is not contracted revenue.', noApprovalGranted: true };
}
(0, reserve_common_ts_1.define)('negotiation_trade_check', 'Compute new-deal concession costs from seller figures, pair every proposed concession with a trade, and structure a champion draft using only supplied facts. No typical discounts, competitor lookup or approval granted.', (0, reserve_common_ts_1.object)({ deal_kind: (0, reserve_common_ts_1.choice)('new', 'renewal', 'unknown'), mode: (0, reserve_common_ts_1.choice)('discount', 'multiyear', 'gap', 'champion'), currency: reserve_common_ts_1.text, value: reserve_common_ts_1.text, annual: reserve_common_ts_1.text, discount_percent: (0, reserve_common_ts_1.num)(0, 100), discounts: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.num)(0, 100), 20, 1), gap_percent: (0, reserve_common_ts_1.num)(0, 100), trades: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ give: reserve_common_ts_1.text, get: reserve_common_ts_1.text, worth: reserve_common_ts_1.text, year: (0, reserve_common_ts_1.num)(1, 20) }, ['give', 'get']), 30), approval_path: reserve_common_ts_1.text, walk_away: reserve_common_ts_1.text, deadline: (0, reserve_common_ts_1.object)({ kind: (0, reserve_common_ts_1.choice)('reply', 'signing'), date: reserve_common_ts_1.text }), champion: (0, reserve_common_ts_1.object)({ reader_role: reserve_common_ts_1.text, champion_role: reserve_common_ts_1.text, problem: reserve_common_ts_1.text, proposal: reserve_common_ts_1.text, cost: reserve_common_ts_1.text, measure: reserve_common_ts_1.text, decision: reserve_common_ts_1.text, decision_date: reserve_common_ts_1.text, data_handling: reserve_common_ts_1.text, claims: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ claim: reserve_common_ts_1.text, kind: (0, reserve_common_ts_1.choice)('buyer_report', 'measured_here', 'vendor_claim'), source_url: reserve_common_ts_1.text, source_quote: reserve_common_ts_1.text }, ['claim', 'kind']), 30), risks: (0, reserve_common_ts_1.array)((0, reserve_common_ts_1.object)({ risk: reserve_common_ts_1.text, reduction: reserve_common_ts_1.text, owner: reserve_common_ts_1.text }, ['risk']), 30) }, ['reader_role', 'champion_role', 'decision']) }, ['deal_kind', 'mode', 'currency']), a => { const r = negotiation(a); const asset = r.champion; return { title: 'Negotiation and champion review', summary: ['Scope: ' + r.scope, r.next ?? 'Numbers: your figures, computed by server code', 'Approval: none granted', r.question ?? 'Confirm the deal scope first'], sections: [{ heading: 'The numbers, your figures', body: r.money ? JSON.stringify(r.money) : 'No money calculation for this scope or mode.' }, { heading: 'Trade pairs to review', table: { headers: ['Proposed pair', 'Worth', 'Status'], rows: r.trades.map((t) => [t.pair, t.worth ?? 'Not priced by you', t.status]) } }, { heading: 'Champion draft', body: asset ? JSON.stringify({ to: asset.to, from: asset.from, problem: asset.problem, proposal: asset.proposal, cost: asset.cost, measure: asset.measure, evidence: asset.evidence, risks: asset.risks, decision: asset.decision, decisionDate: asset.decisionDate, dataHandling: asset.dataHandling }) : 'No champion draft supplied.' }, { heading: 'Before an offer or forwarding', body: [...r.gaps, ...(asset ? [asset.note, ...asset.excludedClaims.map((x) => x.reason)] : [])].join(' ') }], data: r, limitations: ['Money is a TypeScript port of the pinned concession arithmetic. Values use the currency you supplied; no exchange-rate conversion occurs.', 'Trade worth is a seller estimate, not additional contract revenue. Unpriced trades remain unpriced.', 'Buyer-stated competitor gaps remain unverified; computed implied price is not represented as a fetched competitor price.', 'A reply deadline remains a reply deadline. No discount, legal term, signature, message or approval is executed.', 'Champion fields keep supplied wording or placeholders. Source links and claim classifications are not independently verified.'] }; });
//# sourceMappingURL=negotiation.js.map