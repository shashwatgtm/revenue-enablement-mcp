import test from 'node:test';
import assert from 'node:assert/strict';
const {default: handler} = await import('../netlify/functions/mcp.mjs');

// 13 Nov 2026: the Pricing Negotiation Guide speaks to the seller. With no product name it said
// "our solution" in its title and notes. It now leaves the title without a name, says "what you sell"
// in notes to the seller, and "we" in lines the seller says to the buyer.
const call = async (args) => {
  const r = await handler(new Request('https://local.invalid/mcp', {method:'POST', headers:{'content-type':'application/json', accept:'application/json, text/event-stream'}, body:JSON.stringify({jsonrpc:'2.0', id:1, method:'tools/call', params:{name:'pricing_negotiation_guide', arguments:args}})}));
  const j = await r.json();
  return (j.result?.content || []).map(c => c.text).join('\n');
};
const scenarios = ['discount_request','budget_objection','competitor_pricing','procurement_pressure','multi_year_negotiation','enterprise_agreement','renewal_negotiation'];

test('no product name: no "our solution" in any scenario, in two verticals', async () => {
  for (const base of [{deal_value: 120000, discount_requested: 15, business_model: 'saas', your_sector: 'logistics_tech'}, {deal_value: 80000, discount_requested: 20, your_solution: 'We provide a managed service that reconciles bank lines to invoices for mid-size finance teams every day', business_model: 'services', your_sector: 'fintech'}])
    for (const scenario of scenarios) {
      const t = await call({scenario, ...base});
      assert.ok(!/our solution/i.test(t), scenario + ': ' + (t.match(/.{0,60}our solution.{0,40}/i) || [''])[0]);
      assert.ok(!/^# .*: (?:your offer|our solution)$/m.test(t), scenario);
    }
  const r = await call({scenario: 'renewal_negotiation', deal_value: 120000, business_model: 'saas', your_sector: 'logistics_tech'});
  assert.match(r, /You have leverage \(they already use what you sell\)/);
  assert.match(r, /I wanted to share what else we can do for you/);
  assert.match(r, /^# Renewal Negotiation Guide$/m);
});

test('a named product still names it in the title and lines', async () => {
  const t = await call({scenario: 'renewal_negotiation', deal_value: 120000, your_solution: 'Routewise, a route planning tool for regional 3PLs', business_model: 'saas', your_sector: 'logistics_tech'});
  assert.match(t, /^# Renewal Negotiation Guide: Routewise$/m);
  assert.match(t, /they already use Routewise/);
  assert.match(t, /what else Routewise can do for you/);
});
