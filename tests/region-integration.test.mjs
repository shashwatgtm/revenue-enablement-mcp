import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const packageName=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).name;
const alpha=packageName.includes('gtm-alpha');
const revenue=packageName.includes('revenue-enablement');
const {default:handler}=await import(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs');
const {regionNotes,readRegionContext,NO_REGION_SUFFIX}=await import(alpha?'../netlify/lib/region-reader.js':'../dist/region-reader.js');
const {regionalInputs}=await import(alpha?'../netlify/lib/region-adapter.js':'../dist/region-adapter.js');
const {VERTICALS,SUBTYPES}=await import(alpha?'../netlify/lib/verticals.js':'../dist/verticals.js');
const baseline=JSON.parse(readFileSync(new URL('./fixtures/regions-baseline.json',import.meta.url),'utf8'));
const rpc=async(method,params)=>{const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}));return(await r.json()).result;};
const fields={case_study_generator:'your_product',newsletter_builder:'your_product',webinar_script:'your_product',content_repurposer:'source_content',thought_leadership_series:'your_take',testimonial_capture:'your_product',sales_enablement_content:'product',craft_content_improver:'content'};
test('Region wiring preserves the complete reviewed tool contract',async()=>assert.deepEqual(await rpc('tools/list',{}),baseline.contract));
test('Region wiring keeps invalid input and software referral paths unchanged',async()=>{
 assert.deepEqual(await rpc('tools/call',{name:baseline.cases[0].tool,arguments:{}}),baseline.invalid);
 assert.deepEqual(await rpc('tools/call',{name:baseline.cases[0].tool,arguments:baseline.referralArgs}),baseline.referral);
});
test('Canonical taxonomy includes all nine verticals and 57 observed subtypes',()=>{
 assert.equal(VERTICALS.length,9);assert.equal(SUBTYPES.length,57);
 assert.equal(new Set(SUBTYPES.map(s=>s.id)).size,57);
 for(const s of SUBTYPES)assert.ok(VERTICALS.some(v=>v.id===s.vertical));
});
for(const c of baseline.cases){
 test(c.tool+': removing only the exact region question restores baseline bytes',async()=>{
  const result=await rpc('tools/call',{name:c.tool,arguments:c.args});
  assert.ok(!result.isError);
  const text=result.content[0].text;
  assert.ok(text.endsWith(NO_REGION_SUFFIX));
  result.content[0].text=text.slice(0,-NO_REGION_SUFFIX.length);
  assert.deepEqual(result,c.result);
 });
 if(alpha&&c.tool==='generate_roadmap')continue; // All reviewed inputs are enums. Do not invent a hidden market field.
 for(const [country,region]of [['India','India'],['Singapore','Southeast Asia'],['United Arab Emirates','Middle East'],['United Kingdom','UK'],['Germany','Western Europe'],['United States','North America']]){
  test(c.tool+': '+country+' is read from existing inputs in three identical calls',async()=>{
   const args=structuredClone(c.args),seller='We sell payment processing fintech in '+country+'.';
   if(alpha){args.industry='fintech';args[c.tool==='epic_audit'?'challenge':'gtm_challenge']=seller;}
   else if(revenue)args.your_solution=seller;
   else {args[fields[c.tool]]=seller;delete args.your_sector;}
   const a=await rpc('tools/call',{name:c.tool,arguments:args});
   const b=await rpc('tools/call',{name:c.tool,arguments:args});
   const d=await rpc('tools/call',{name:c.tool,arguments:args});
   assert.deepEqual(a,b);assert.deepEqual(b,d);assert.ok(!a.isError);
   assert.ok(a.content[0].text.includes('### '+region));
   assert.ok(!a.content[0].text.endsWith(NO_REGION_SUFFIX));
  });
 }
}
test('Seller aliases preserve explicit market exclusions and ignore third party evidence',()=>{
 const args={your_solution:'We sell payment processing fintech in the United Kingdom.',competitor:'India incumbent',proof_points:'Singapore customer quote'};
 assert.deepEqual(readRegionContext(regionalInputs(args)).regions.map(r=>r.region_id),['uk']);
 assert.deepEqual(readRegionContext(regionalInputs({your_take:'We do not sell in India.'})).regions,[]);
 assert.deepEqual(readRegionContext(regionalInputs({content:'A customer said: We sell in Singapore.'})).regions,[]);
 assert.equal(regionNotes({company_name:'India Payments'}),NO_REGION_SUFFIX);
});
