import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.mjs';
const base={scenario:'competitor_pricing',deal_value:72000,business_model:'transactions',your_solution:'Hypothetical voice support contract'};
let id=0;
async function call(competitor_price,extra={}) {
 const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method:'tools/call',params:{name:'pricing_negotiation_guide',arguments:{...base,competitor_price,...extra}}})}));
 const j=await r.json();assert.ok(!j.error&&!j.result.isError,JSON.stringify(j));return j.result.content.map(c=>c.text||'').join('\n');
}
test('A human handoff share is not a competitor price gap',async()=>{
 const t=await call('Hypothetical rival: $0.052 per actual minute all-in, 1.2 million minutes/year, 25% handoff at $0.14 per minute; same quality threshold and concurrency. All figures hypothetical USD.');
 assert.match(t,/Price direction is not clear/);
 assert.match(t,/25% handoff/);
 assert.doesNotMatch(t,/a gap of 25%|\$18,000 a year|competitor is 25% cheaper/i);
});
test('Explicit competitor price comparison remains recognized without assuming an annual basis',async()=>{
 const t=await call('Competitor is 25% cheaper');
 assert.match(t,/Competitor has lower price/);
 assert.match(t,/25%/);
 assert.doesNotMatch(t,/\$18,000 a year/);
 assert.match(t,/same scope.*period|scope,.*period/);
});
test('A setup-only reduction does not become a full annual deal gap',async()=>{
 const t=await call('Competitor setup price is 25% lower than our setup fee; annual subscription is unchanged.');
 assert.doesNotMatch(t,/a gap of 25%|\$18,000 a year|Situation: Competitor has lower price/);
 assert.match(t,/setup price is 25% lower/);
});
test('Operational lower or higher percentages do not establish a price direction',async()=>{
 for(const text of ['Their handoff rate is 25% lower than ours','Their uptime is 25% higher','Their price is not 25% lower than ours','Their price is 25% lower than ours? Not confirmed.']){
  const t=await call(text);assert.match(t,/Price direction is not clear/,text);assert.doesNotMatch(t,/a gap of 25%/,text);
 }
});
test('The compared percentage stays attached to the price rather than an earlier unrelated metric',async()=>{
 const t=await call('Handoff share is 25%; competitor annual price is 10% lower than our annual price of $72,000 for the same scope and volume.');
 assert.match(t,/Competitor has lower price/);
 assert.match(t,/a gap of 10%/);
 assert.match(t,/\$7,200 a year/);
 assert.doesNotMatch(t,/a gap of 25%|\$18,000 a year/);
});
test('Inverse comparison does not use the other quote as the denominator of our deal',async()=>{
 const t=await call('Our annual price is 25% higher than the competitor annual price for the same scope.');
 assert.doesNotMatch(t,/Situation: Competitor quote is higher|\$18,000 a year/);
});
test('Conflicting quotes and missing comparison bases do not produce a money gap',async()=>{
 for(const text of ['Competitor annual price is 10% lower than our annual price; competitor annual price is 20% higher than our annual price for the same scope.','Competitor monthly rate is 25% lower than our annual price.','Competitor annual setup fee is 25% lower than our annual fee for the same scope.']){
  const t=await call(text);assert.doesNotMatch(t,/a gap of|\$18,000 a year|\$7,200 a year/,text);
 }
});

test('Other vendors and historical quotes do not establish the current competitor comparison',async()=>{
 for(const text of ['Competitor is 25% cheaper than the incumbent','Competitor price is 25% lower than last year','Competitor price is 25% lower than our old quote','Competitor price is 25% lower than their previous price']) {
  const t=await call(text);assert.match(t,/Price direction is not clear/,text);assert.doesNotMatch(t,/a gap of/,text);
 }
});
test('A conditional, alleged or zero comparison does not assert a lower quote',async()=>{
 for(const text of ['Competitor is allegedly 25% cheaper','If competitor price is 25% lower than ours','Competitor price is 0% lower than ours']) {
  const t=await call(text);assert.match(t,/Price direction is not clear/,text);assert.doesNotMatch(t,/a gap of/,text);
 }
});
test('Discount size and latency are separate from the actual quote price',async()=>{
 for(const text of ['Competitor discount rate is 25% higher than ours','Competitor boasts 25% lower latency']) {
  const t=await call(text);assert.match(t,/Price direction is not clear/,text);assert.doesNotMatch(t,/a gap of/,text);
 }
});
test('Reordered percentage wording preserves an explicitly matched annual price base',async()=>{
 const t=await call('Their annual price is lower by 25% than our annual price of $72,000 for the same scope');
 assert.match(t,/Competitor has lower price/);assert.match(t,/a gap of 25%/);assert.match(t,/\$18,000 a year/);
});
test('An annual amount that differs from deal value cannot become its denominator',async()=>{
 const t=await call('Competitor annual price is 25% lower than our annual price of $36,000 for the same scope');
 assert.match(t,/Competitor has lower price/);assert.doesNotMatch(t,/\$18,000 a year|\$9,000 a year/);assert.match(t,/no annual money gap calculated/);
});
test('A stated exclusion blocks annual money inference despite a same scope label',async()=>{
 const t=await call('Competitor annual price is 25% lower than our annual price of $72,000 for the same scope, but the total excludes support');
 assert.doesNotMatch(t,/\$18,000 a year/);assert.match(t,/no annual money gap calculated/);
});
test('A qualitative current price relation can be retained without inventing a percentage',async()=>{
 for(const [text,pattern] of [['Competitor is cheaper',/Competitor has lower price/],['Their quote is higher than ours',/Competitor quote is higher/]]) {
  const t=await call(text);assert.match(t,pattern);assert.doesNotMatch(t,/a gap of/);
 }
});

test('Approval notes remain notes rather than a person name in generated sentences',async()=>{
 const approval='No one can approve this yet; Finance must confirm the named approver and the concession limit.';
 for(const scenario of ['competitor_pricing','budget_objection','procurement_pressure','enterprise_agreement']) {
  const t=await call('Competitor is 25% cheaper',{scenario,approval_authority:approval});
  assert.match(t,/No one can approve this yet/);
  assert.ok(!t.includes('case for '+approval));assert.ok(!t.includes('include '+approval));assert.ok(!t.includes('within what '+approval));assert.ok(!t.includes('named '+approval+' as the approver'));
 }
});
test('Budget and multi year scenarios do not make an unspecified deal value an annual fee',async()=>{
 const budget=await call('Competitor quote period is unspecified',{scenario:'budget_objection'});
 assert.match(budget,/same quoted period/);assert.doesNotMatch(budget,/higher than that every year/);
 const multi=await call('Competitor quote period is unspecified',{scenario:'multi_year_negotiation'});
 assert.match(multi,/quoted period must be confirmed/);assert.doesNotMatch(multi,/base for every term|1 year \| The base deal at \$72,000/);
});
test('Total cost comparison first establishes the period of the supplied deal amount',async()=>{
 const t=await call('Competitor quote period is unspecified');
 assert.match(t,/Confirm the period covered by your \$72,000/);assert.doesNotMatch(t,/total cost comparison over three years/);
});
