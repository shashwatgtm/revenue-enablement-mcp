import test from 'node:test';
import assert from 'node:assert/strict';
const {roiInScope, ROI_SCOPE_DECLINE} = await import('../dist/roi-scope.js');
const {SOFTWARE_REFERRAL, SOFTWARE_OUTSIDE_SCOPE} = await import('../dist/software-policy.js');
const {default: handler} = await import('../netlify/functions/mcp.mjs');

// Owner decision, 13 Nov 2026: "The ROI for Marketing, ABM, Events, AR/PR, Content,
// SEO/AEO/GEO, Field Marketing, Martech tools, Outbound software, Media spends, Brand
// awareness, Partnership etc can be done by me; rest is completely out of scope."
// Exact, same-meaning and opposite sentences across the nine verticals.
const verticals = ['logistics tech','fintech','SaaS','vertical SaaS','AI native','ITeS','telecom','software','cybersecurity'];
const inScope = (your_solution, extra = {}) => roiInScope({your_solution, ...extra});

test('the owner\'s exact list is in scope, in every vertical', () => {
  const exact = ['a marketing programme', 'an ABM programme', 'an events programme', 'an AR/PR programme', 'a content programme', 'an SEO/AEO/GEO programme', 'field marketing', 'martech tools', 'outbound software', 'media spends', 'brand awareness', 'a partnership'];
  for (const v of verticals) for (const s of exact) assert.equal(inScope(`${s} for a ${v} company`), true, `${s} / ${v}`);
});

test('same-meaning words for the list are in scope, in every vertical', () => {
  const same = [
    'demand generation for pipeline', 'paid media on LinkedIn and Google', 'an account-based marketing pilot across 40 named accounts',
    'analyst relations to get into the Magic Quadrant', 'public relations retainer', 'two trade shows and a hosted roundtable', 'a webinar series',
    'content syndication', 'search engine optimisation', 'generative engine optimization', 'AI search visibility', 'GEO for ChatGPT answers',
    'a marketing automation platform', 'a CRM for marketing', 'a sales engagement tool for SDRs', 'intent data', 'a brand campaign',
    'a channel partner programme', 'sponsorship of an industry summit', 'a PR agency', 'cold email outreach', 'a rebrand',
  ];
  for (const v of verticals) for (const s of same) assert.equal(inScope(`${s} for a ${v} company`), true, `${s} / ${v}`);
});

const outside = {
  'logistics tech': 'route planning software for last-mile delivery', fintech: 'reconciliation software for the month-end close',
  SaaS: 'a project management tool', 'vertical SaaS': 'distributor management software for field sales of FMCG goods',
  'AI native': 'an AI agent that resolves IT service desk tickets', ITeS: 'a managed IT outsourcing contract',
  telecom: 'SD-WAN connectivity for 200 branches', software: 'a test automation platform for developers', cybersecurity: 'a SIEM for the SOC',
};

test('other investments are out of scope, in every vertical', () => {
  for (const v of verticals) {
    assert.equal(inScope(outside[v]), false, outside[v]);
    assert.equal(inScope(`${outside[v]}, sold as an annual subscription to a ${v} company`), false, v);
  }
  for (const s of ['core banking software', 'payroll software', 'a data warehouse', 'cloud hosting', 'an ERP rollout', 'telecom conference calling', 'geo-redundant storage', 'PR review automation for developers', 'Acme platform']) assert.equal(inScope(s), false, s);
});

test('opposite sentences: a negated marketing word or a marketing buyer does not bring a purchase into scope', () => {
  for (const v of verticals) for (const s of [
    `${outside[v]}, not a marketing investment`,
    `Not ABM: ${outside[v]}`,
    `${outside[v]} for marketing agencies`,
    `${outside[v]} with no events or sponsorship spend`,
  ]) assert.equal(inScope(s), false, s);
  for (const v of verticals) for (const s of [
    `an ABM programme, not ${outside[v]}`,
    `not ${outside[v]} but an outbound programme`,
    `a CRM for ${v} companies`,
    `no-code marketing automation for a ${v} company`,
  ]) assert.equal(inScope(s), true, s);
});

test('the investment being funded decides, not the funder\'s industry, in every vertical', () => {
  // Coordinator finding, 13 Nov 2026: "A logistics tech firm wants to fund an ABM programme" is in scope.
  assert.equal(inScope('A logistics tech firm wants to fund an ABM programme'), true);
  const a = (v) => (/^[AEIOU]/i.test(v) ? 'An' : 'A');
  const investments = ['an ABM programme', 'an events programme', 'a content programme', 'an SEO/AEO/GEO programme', 'paid media', 'an AR/PR programme', 'field marketing', 'martech tools', 'outbound tools', 'a brand campaign', 'a partnership programme'];
  for (const v of verticals) for (const inv of investments) for (const s of [
    `${a(v)} ${v} firm wants to fund ${inv}`,
    `Our ${v} company is investing in ${inv}`,
    `${a(v)} ${v} company budget for ${inv}`,
    `${a(v)} ${v} vendor plans ${inv} for next year`,
  ]) assert.equal(inScope(s), true, s);
  // Opposite: the same funders buying a non-GTM product, or saying no to the GTM investment.
  for (const v of verticals) for (const s of [
    `${a(v)} ${v} firm wants to fund ${outside[v]}`,
    `${a(v)} ${v} firm wants to fund ${outside[v]}, not an ABM programme`,
    `Our ${v} company is investing in ${outside[v]}`,
  ]) assert.equal(inScope(s), false, s);
});

test('a solution named without a category is read with its context', () => {
  for (const v of verticals) {
    assert.equal(inScope('Acme platform', {current_process: `The ${v} sales team runs ABM by hand across 40 accounts`}), true, v);
    assert.equal(inScope('Acme platform', {known_metrics: `Event-led pipeline is 30% of the ${v} pipeline`}), true, v);
    assert.equal(inScope('Acme platform', {known_metrics: `Payroll errors at the ${v} company fell 30%`}), false, v);
    assert.equal(inScope('Acme platform', {current_process: `The ${v} team does not run any marketing`}), false, v);
    assert.equal(inScope('Acme cloud suite', {current_process: 'The marketing team uses spreadsheets'}), false, v);
  }
});

const call = async (args) => {
  const r = await handler(new Request('https://local.invalid/mcp', {method:'POST', headers:{'content-type':'application/json', accept:'application/json, text/event-stream'}, body:JSON.stringify({jsonrpc:'2.0', id:1, method:'tools/call', params:{name:'roi_business_case_builder', arguments:args}})}));
  const j = await r.json();
  return (j.result?.content || []).map(c => c.text).join('\n');
};

test('through the MCP handler: GTM cases are built, others get the plain decline with no figures', async () => {
  const base = {customer_name: 'a mid-market B2B SaaS company', primary_value_driver: 'revenue_increase', solution_price: 120000, annual_value_estimate: 300000};
  const built = await call({...base, your_solution: 'an ABM programme for 40 target accounts'});
  assert.match(built, /Not decided yet/);
  assert.match(built, /The annual value you entered: 300000/);
  const funded = await call({...base, your_solution: 'A logistics tech firm wants to fund an ABM programme'});
  assert.match(funded, /Not decided yet/);
  for (const v of verticals) {
    const text = await call({...base, your_solution: outside[v], your_sector: v.toLowerCase().replace(/ /g, '_')});
    assert.equal(text, ROI_SCOPE_DECLINE, v);
    assert.doesNotMatch(text, /\$|\d+%/);
  }
});

test('the software policy still runs first', async () => {
  const base = {primary_value_driver: 'cost_reduction', your_solution: 'route planning software'};
  assert.equal(await call({...base, known_metrics: 'Which CRM should we buy for our telecom analytics product?'}), SOFTWARE_REFERRAL);
  assert.equal(await call({...base, known_metrics: 'Which data warehouse should we buy?'}), SOFTWARE_OUTSIDE_SCOPE);
});

test('the decline names the scope in plain words, with no link and no dash', () => {
  for (const w of ['marketing', 'ABM', 'events', 'analyst and public relations', 'content', 'SEO, AEO and GEO', 'field marketing', 'martech tools', 'outbound', 'media spend', 'brand awareness', 'partner or channel programmes']) assert.ok(ROI_SCOPE_DECLINE.includes(w), w);
  assert.doesNotMatch(ROI_SCOPE_DECLINE, /https?:|calendly|—|–/);
});
