// Row 10: roi_business_case_builder and account_plan_builder take the buyer's country from their `industry` field.
// customer_name is a company identity and never selects a region.
// Run: node --no-warnings --test tests/echo-industry-region-20261106.test.mjs  (after npm run build)
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {default:handler}=await import('../netlify/functions/mcp.mjs');
const QUESTION='Which region applies';
const call=async(tool,args)=>{
 const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:tool,arguments:args}})}));
 const j=await r.json();assert.ok(j.result&&j.result.content,JSON.stringify(j).slice(0,300));
 return j.result.content.map(c=>c.text).join('\n');
};
const ROI={customer_name:'the Bank',your_solution:'TBX ABM programme for transaction banking teams',solution_price:12000000,primary_value_driver:'cost_reduction',current_annual_cost:30000000,expected_improvement_percent:60};
for(const industry of ['Mid-sized private sector bank in India','Regional parcel and express delivery in India'])
 test(`roi_business_case_builder industry "${industry}" gives an India section and no question`,async()=>{
  const t=await call('roi_business_case_builder',{...ROI,industry});
  assert.ok(t.includes('- Region: India'),t.slice(-500));assert.ok(!t.includes(QUESTION));
 });
test('roi_business_case_builder: no country in industry still asks',async()=>{
 const t=await call('roi_business_case_builder',{...ROI,industry:'Mid-sized private sector bank'});
 assert.ok(t.includes(QUESTION));
});
test('roi_business_case_builder: customer_name is ignored for regions',async()=>{
 const t=await call('roi_business_case_builder',{...ROI,customer_name:'India Systems',industry:'Mid-sized private sector bank'});
 assert.ok(t.includes(QUESTION));assert.ok(!t.includes('### India'));
});
test('roi_business_case_builder: a negated country in industry gives no India section',async()=>{
 const t=await call('roi_business_case_builder',{...ROI,industry:'Banks that are not in India'});
 assert.ok(!t.includes('### India'));
});
test('account_plan_builder industry: India gives an India section and no question',async()=>{
 const t=await call('account_plan_builder',{account_name:'Acme Carrier',industry:'Regional parcel and express delivery in India'});
 assert.ok(t.includes('### India'),t.slice(-500));assert.ok(!t.includes(QUESTION));
});
