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

test('A hypothetical value statement is not described as already delivered',async()=>{
 const value='Hypothetical cost comparison: $168,000 annual human baseline; 20% handoff retains $33,600 human cost, so avoided external labor is $134,400 before the $72,000 agent fee. This is an estimate, not a measured customer result.';
 const t=await call('Price basis unknown',{scenario:'discount_request',value_delivered:value});
 assert.doesNotMatch(t,/what this has already delivered/);assert.match(t,/value case is not established/i);assert.match(t,/estimate|hypothetical/);
 assert.match(t,/\$134,400/);
});
test('Explicitly measured value retains its source wording',async()=>{
 const t=await call('Competitor is 10% cheaper',{scenario:'discount_request',value_delivered:'Measured pilot: processing cost fell from $40,000 to $30,000 over the same quarter.'});
 assert.match(t,/processing cost fell from \$40,000 to \$30,000/);assert.doesNotMatch(t,/value case is not established/i);
});
test('Excluded exclusivity and reference obligations cannot reappear as trade rows',async()=>{
 const approval='CFO permits a two year term; no exclusivity or reference obligation.';
 for(const scenario of ['discount_request','procurement_pressure']) {
  const t=await call('Competitor is 10% cheaper',{scenario,approval_authority:approval});
  const rows=t.split('\n').filter(x=>/^\|/.test(x)&&!/Approval Authority|Who approves/.test(x)).join('\n');
  assert.doesNotMatch(rows,/exclusivity|case study|reference/i);assert.match(rows,/Committed monthly volume/);assert.match(t,/held.*approval notes/i);
 }
});
test('Reference restrictions apply to renewal and enterprise recommendations too',async()=>{
 const approval='Reference obligation is not allowed.';
 const renewal=await call('Price basis unknown',{scenario:'renewal_negotiation',approval_authority:approval});
 assert.doesNotMatch(renewal,/- Ask for a case study or reference/);assert.match(renewal,/Do not request a case study or reference/);
 const enterprise=await call('Price basis unknown',{scenario:'enterprise_agreement',approval_authority:approval});
 assert.doesNotMatch(enterprise,/- Right to case study\/reference/);assert.match(enterprise,/Keep case study and reference obligations out/);
});
test('Permitted terms and explicit absence of a prohibition are not read as exclusions',async()=>{
 for(const approval of ['Exclusivity is permitted; a case study is approved after buyer review.','No prohibition on exclusivity; reference obligations are not prohibited.']) {
  const t=await call('Competitor is 10% cheaper',{scenario:'discount_request',approval_authority:approval});
  const rows=t.split('\n').filter(x=>/^\|/.test(x)&&!/Approval Authority/.test(x)).join('\n');
  assert.match(rows,/Exclusivity for a product line/);assert.match(rows,/A case study after go-live/);
 }
});
test('Unclear or expressly prohibited terms remain held',async()=>{
 for(const approval of ['Exclusivity is prohibited; reference obligation is forbidden.','Exclusivity is not confirmed; reference rights are unclear.']) {
  const t=await call('Price basis unknown',{scenario:'discount_request',approval_authority:approval});
  const rows=t.split('\n').filter(x=>/^\|/.test(x)&&!/Approval Authority/.test(x)).join('\n');
  assert.doesNotMatch(rows,/exclusivity|case study|reference/i);
 }
});
