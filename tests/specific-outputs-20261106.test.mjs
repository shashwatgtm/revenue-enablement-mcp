// Fix 6 Nov 2026 (specific outputs): each input must change the advice it is about, not only be echoed back.
// For each finding, two inputs that differ only in that field give outputs that differ in the specific step, row, mitigation or
// wording, and in the right way. Findings from the guides coordinator (hub evidence 14 and 27).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const alpha = existsSync(new URL('../netlify/functions/mcp-sse.js', import.meta.url));
const { default: handler } = await import(alpha ? '../netlify/functions/mcp-sse.js' : '../netlify/functions/mcp.mjs');
const call = async (name, args) => {
  const r = await (await handler(new Request('https://local.invalid/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) }))).json();
  assert.ok(r.result && !r.result.isError, JSON.stringify(r));
  return r.result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
};
const future = (days) => { const d = new Date(Date.now() + days * 86400000); return d.toISOString().slice(0, 10); };
const section = (t, from, to) => { const i = t.indexOf(from); assert.ok(i >= 0, `missing ${from}`); const j = to ? t.indexOf(to, i + from.length) : -1; return t.slice(i, j > i ? j : undefined); };
const rows = (t) => t.split('\n').filter((l) => /^\| \d+ \|/.test(l));
const DASH = /[–—]/;

// ---- mutual_action_plan_generator: the blocker adds its own milestone, owner and risk ----
const MAP = { deal_name: 'Travel app outcome pilot', target_close_date: future(175), known_process_steps: 'security review; back-test on redacted conversations; sign paid pilot order; 60 day live pilot; COO decision', your_solution: 'an AI support agent priced per outcome', your_sector: 'ai_native' };
const FINANCE = 'finance wants a forecast of the monthly bill';
const EU = 'legal will not let customer conversations leave the EU';

test('MAP: a billing blocker adds a finance forecast step; an EU data blocker adds a data residency review instead', async () => {
  const fin = await call('mutual_action_plan_generator', { ...MAP, blockers: FINANCE });
  const eu = await call('mutual_action_plan_generator', { ...MAP, blockers: EU });
  const tlFin = section(fin, '## Mutual Action Plan Timeline', '## Risks & Blockers');
  const tlEu = section(eu, '## Mutual Action Plan Timeline', '## Risks & Blockers');
  // the finance blocker: a bill forecast in the business case phase, owned by the buyer's finance contact
  const finRow = rows(tlFin).find((r) => r.includes('Bill forecast for "finance wants a forecast of the monthly bill"'));
  assert.ok(finRow, tlFin);
  assert.match(finRow, /\| Buyer finance contact \|/);
  assert.ok(section(tlFin, '### Phase 2: Business Case', '\n---\n').includes('Bill forecast for'), 'the forecast belongs to the business case phase');
  assert.doesNotMatch(tlFin, /Data residency review/);
  // the EU blocker: a data residency review in the evaluation, owned by the buyer's legal or data protection reviewer
  const euRow = rows(tlEu).find((r) => r.includes('Data residency review for "legal will not let customer conversations leave the EU"'));
  assert.ok(euRow, tlEu);
  assert.match(euRow, /\| Buyer legal or data protection reviewer \|/);
  assert.ok(section(tlEu, '### Phase 1: Evaluation', '\n---\n').includes('Data residency review'), 'the residency review comes before any live data, in the evaluation');
  assert.doesNotMatch(tlEu, /Bill forecast/);
  // the milestone tables differ in more than the echoed blocker text
  const strip = (t, b) => rows(t).map((r) => r.split(b).join('<blocker>').replace(/\d{4}-\d{2}-\d{2}/g, '<date>'));
  assert.notDeepEqual(strip(tlFin, FINANCE), strip(tlEu, EU));
  // the risks follow the type
  const risksFin = section(fin, '### What can move the close date', '## Communication Plan');
  const risksEu = section(eu, '### What can move the close date', '## Communication Plan');
  assert.match(risksFin, /The bill forecast \("finance wants a forecast of the monthly bill"\)/);
  assert.match(risksEu, /Data residency \("legal will not let customer conversations leave the EU"\)/);
  assert.match(section(fin, '### What each blocker adds to the plan', '### What can move'), /\| Bill forecast \|/);
  assert.match(section(eu, '### What each blocker adds to the plan', '### What can move'), /\| Data residency \|/);
  for (const t of [fin, eu]) assert.doesNotMatch(t, DASH);
});

test('MAP: a blocker no rule knows gets an honest step to resolve it and an owner question, never nothing', async () => {
  const t = await call('mutual_action_plan_generator', { ...MAP, blockers: 'the head of brand wants to see the mascot first' });
  const row = rows(section(t, '## Mutual Action Plan Timeline', '## Risks & Blockers')).find((r) => r.includes('Add a step to resolve: the head of brand wants to see the mascot first'));
  assert.ok(row, t);
  assert.match(row, /Owner to confirm: ask the buyer's champion who on the buyer's side can clear this/);
  assert.match(t, /\| No type matched \| the head of brand wants to see the mascot first \|/);
  assert.match(t, /Unowned blocker \("the head of brand wants to see the mascot first"\)/);
});

test('MAP: several blockers each add their own step; no blocker adds none; the same input twice gives the same plan', async () => {
  const many = { ...MAP, blockers: `${FINANCE}; ${EU}; CFO has not approved a budget` };
  const t = await call('mutual_action_plan_generator', many);
  for (const s of ['Bill forecast for', 'Data residency review for', 'Budget for "CFO has not approved a budget"']) assert.ok(t.includes(s), s);
  assert.equal(await call('mutual_action_plan_generator', many), t);
  const none = await call('mutual_action_plan_generator', MAP);
  assert.doesNotMatch(none, /What each blocker adds|Bill forecast for|Data residency review for|Add a step to resolve/);
});

test('the blocker and challenge types are a fixed ordered list read from the words typed', async () => {
  const { concernOf } = await import('../src/concern-types.ts');
  const cases = [[FINANCE, 'bill-forecast'], [EU, 'data-residency'], ['data protection rules limit where contacts can be handled', 'data-residency'], ['customer data must be redacted', 'privacy'], ['the security questionnaire is not done', 'security'], ['CFO has not approved a budget', 'budget'], ['other vendors quote less on price', 'price'], ['vendor registration takes six weeks', 'procurement'], ['no agreed service level per contact', 'service-level'], ['quality on the brand scorecard has fallen with the current provider', 'quality'], ['contact volume peaks are not staffed in time', 'capacity'], ['moving work from the current provider is seen as risky', 'switching'], ['it must connect to the booking system', 'integration'], ['the head of brand wants to see the mascot first', null]];
  for (const [text, id] of cases) assert.equal(concernOf(text)?.id ?? null, id, text);
});

// ---- proposal_section_writer, success_metrics: supplied metrics become KPI rows ----
const PSW = { customer_name: 'the travel app', your_solution: 'an AI support agent priced per outcome', your_sector: 'ai_native' };
const kpiRows = (t) => section(t, '### Key Performance Indicators', '### Measurement Framework').split('\n').filter((l) => /^\| (?!KPI|-)/.test(l));

test('success metrics: each supplied metric is its own KPI row, and other metrics give other rows', async () => {
  const a = await call('proposal_section_writer', { ...PSW, section_type: 'success_metrics', success_metrics: 'QA pass rate; repeat contact within 7 days; satisfaction on automated conversations' });
  const b = await call('proposal_section_writer', { ...PSW, section_type: 'success_metrics', success_metrics: 'share of booking changes resolved without a person; escalations to a person; cost per resolved conversation' });
  assert.deepEqual(kpiRows(a).map((r) => r.split('|')[1].trim()), ['QA pass rate', 'Repeat contact within 7 days', 'Satisfaction on automated conversations']);
  assert.deepEqual(kpiRows(b).map((r) => r.split('|')[1].trim()), ['Share of booking changes resolved without a person', 'Escalations to a person', 'Cost per resolved conversation']);
  // baseline, target and timeline are left for the user when not given, and "within 7 days" is not read as a timeline
  for (const r of [...kpiRows(a), ...kpiRows(b)]) assert.match(r, /\| Not given: measure first, with the travel app \| Not given: agree with the travel app \| Not given: agree with the travel app \|$/);
  assert.doesNotMatch(section(a, '### Key Performance Indicators', '### Measurement Framework'), /Automated resolution rate \|/);
});

test('success metrics: a baseline, target and timeline the user wrote fill their cells, and nothing else is filled', async () => {
  const t = await call('proposal_section_writer', { ...PSW, section_type: 'success_metrics', success_metrics: 'escalation rate from 40% to 25% by Q3; cost per resolved conversation, target $2' });
  const r = kpiRows(t);
  assert.equal(r[0], '| Escalation rate | 40% | 25% | By Q3 |');
  assert.equal(r[1], '| Cost per resolved conversation | Not given: measure first, with the travel app | $2 | Not given: agree with the travel app |');
});

test('success metrics: with no metrics the sector rows stay as before', async () => {
  const t = await call('proposal_section_writer', { ...PSW, section_type: 'success_metrics' });
  assert.match(t, /\| Automated resolution rate \| Measure first, with the travel app \| Agree with the travel app \| Agree with the travel app \|/);
});

// ---- proposal_section_writer, risk_mitigation: a mitigation per challenge type, with an owner role ----
const RISK = { section_type: 'risk_mitigation', customer_industry: 'Consumer brands', primary_audience: 'c_suite', your_solution: 'An outsourced customer support service priced per contact resolved within an agreed service level', implementation_approach: 'staged transition with knowledge transfer and a parallel run, with exit criteria for each stage', your_sector: 'ites' };
const riskRows = (t) => section(t, '| Supplied risk or requirement |', '## Next decision').split('\n').filter((l) => /^\| (?!Supplied|-)/.test(l)).map((l) => l.split(' | ').map((c) => c.replace(/^\| |\s\|$/g, '').trim()));

test('risk mitigation: each challenge gets the mitigation and owner role of its type, and other challenges get other ones', async () => {
  const a = riskRows(await call('proposal_section_writer', { ...RISK, customer_challenges: 'outsourced support is bought by the agent hour, so cost rises with volume; no agreed service level per contact; moving work from the current provider is seen as risky' }));
  const b = riskRows(await call('proposal_section_writer', { ...RISK, customer_challenges: 'quality on the brand scorecard has fallen with the current provider; contact volume peaks are not staffed in time; data protection rules limit where contacts can be handled' }));
  assert.deepEqual(a.map((r) => r[1]), ['Bill forecast', 'Service level', 'Switching from the current way']);
  assert.deepEqual(b.map((r) => r[1]), ['Quality and accuracy', 'Capacity and staffing', 'Data residency']);
  // every row has its own mitigation and owner; none is the old "Unknown" owner or the same approach repeated on every row
  for (const set of [a, b]) {
    assert.equal(new Set(set.map((r) => r[4])).size, 3);
    assert.equal(new Set(set.map((r) => r[5])).size, 3);
    for (const r of set) assert.doesNotMatch(r[5], /^Unknown/);
  }
  assert.match(b[0][4], /calibration on a sample/); assert.match(b[0][5], /quality lead/);
  assert.match(b[1][4], /staffing plan/); assert.match(b[1][5], /operations or planning owner/);
  assert.match(b[2][4], /permitted locations/); assert.match(b[2][5], /data protection or legal reviewer/);
  assert.match(a[2][4], /^The approach you supplied: staged transition/);
  // ratings: only what the challenge supports
  assert.equal(a[2][2], 'Not assessed'); assert.equal(a[2][3], 'Not assessed');
  assert.equal(b[0][2], 'Happening now, as stated; not rated'); assert.equal(b[0][3], 'Not assessed');
});

test('risk mitigation: a rating the user states is kept as theirs; a challenge no rule knows says so honestly', async () => {
  const r = riskRows(await call('proposal_section_writer', { ...RISK, customer_challenges: 'switching providers has high likelihood and high impact; the mascot must appear on every reply' }));
  assert.equal(r[0][2], 'High (as supplied)'); assert.equal(r[0][3], 'High (as supplied)');
  assert.equal(r[1][1], 'No type matched');
  assert.match(r[1][4], /^No type in the fixed list matches this challenge/);
  assert.match(r[1][5], /^Owner to confirm/);
});

// ---- proposal_section_writer, pricing_justification: wording, emphasis and order change by audience ----
const PRICE = { ...PSW, section_type: 'pricing_justification', customer_industry: 'Online travel', customer_challenges: 'booking change contacts double in holiday peaks; cost per contact is not predictable', key_differentiators: 'billed only for conversations that pass the agreed quality check', pricing: 'a fee per resolved conversation that passes the quality check; no platform fee', implementation_approach: 'connect the help desk and booking system, back-test on redacted conversations, then a 60 day live pilot', success_metrics: 'share of booking changes resolved without a person; cost per resolved conversation' };
const h3 = (t) => section(t, '# Investment & Value', '## Reading the answer').split('\n').filter((l) => l.startsWith('### ') && !l.startsWith('### Sector notes')).map((l) => l.slice(4));

test('pricing: c_suite leads with the outcome and payback, procurement with terms, total cost and comparison, technical with effort and integration', async () => {
  const [c, p, t] = await Promise.all(['c_suite', 'procurement', 'technical'].map((primary_audience) => call('proposal_section_writer', { ...PRICE, primary_audience })));
  assert.notEqual(c, p); assert.notEqual(p, t); assert.notEqual(c, t);
  assert.deepEqual(h3(c), ['The Outcome This Investment Buys', 'Payback', 'Investment Summary', 'Investment Protection']);
  assert.deepEqual(h3(p), ['Commercial Terms', 'Total Cost', 'Comparison on the Same Scope', 'Value Justification', 'Investment Protection']);
  assert.deepEqual(h3(t), ['Implementation Effort', 'Integration and Data', 'What the Price Covers', 'Value Justification', 'Investment Protection']);
  assert.match(c, /The result the travel app would hold our solution to: Share of booking changes resolved without a person/);
  assert.match(p, /\| Implementation and set up \| What the supplied approach costs, if you charge for it: connect the help desk/);
  assert.match(t, /The approach you supplied: connect the help desk and booking system/);
  // no amount, payback period or term is written for the user
  for (const x of [c, p, t]) { assert.doesNotMatch(section(x, '# Investment & Value', '## Reading the answer'), /\$\s?\d|\d+\s?(?:months?|weeks?) payback/i); assert.doesNotMatch(x, DASH); }
});

test('pricing: other audiences and no audience keep the section as it was', async () => {
  const none = await call('proposal_section_writer', PRICE);
  const vp = await call('proposal_section_writer', { ...PRICE, primary_audience: 'vp_level' });
  assert.deepEqual(h3(none), ['Investment Summary', 'Value Justification', 'Investment Protection']);
  assert.equal(section(vp, '# Investment & Value', '## Reading the answer'), section(none, '# Investment & Value', '## Reading the answer'));
});

// ---- email_sequence_generator: a generic or possessive product name never leaves a broken subject ----
test('email: "our product" and other generic names never give a subject that ends on a possessive or a bare noun', async () => {
  const base = { target_persona: 'Practice manager at a regional clinic group', specific_pain_point: 'Two receptionists can book the same appointment slot' };
  const subjects = (t) => t.split('\n').filter((l) => l.startsWith('**Subject:** ')).map((l) => l.slice(13));
  for (const sequence_type of ['cold_outreach', 'post_demo', 'nurture']) for (const your_solution of ['our product', 'Our product', 'my platform', 'the product', 'this tool', 'our']) {
    const s = subjects(await call('email_sequence_generator', { ...base, sequence_type, your_solution }));
    assert.ok(s.length >= 3, `${sequence_type} ${your_solution}`);
    for (const x of s) assert.doesNotMatch(x, /\b(?:our|my|your|their|this|the|a|an|of|on)\??$|\bon (?:product|platform|tool)\b/i, `${sequence_type} ${your_solution}: ${x}`);
  }
  const cold = subjects(await call('email_sequence_generator', { ...base, sequence_type: 'cold_outreach', your_solution: 'our product' }));
  assert.equal(cold[0], 'A question on this problem');
  // a named product keeps its topic as before
  const named = subjects(await call('email_sequence_generator', { ...base, sequence_type: 'cold_outreach', your_solution: 'Clinic scheduling software' }));
  assert.equal(named[0], 'A question on Clinic scheduling');
});
