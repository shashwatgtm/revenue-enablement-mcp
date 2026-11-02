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
