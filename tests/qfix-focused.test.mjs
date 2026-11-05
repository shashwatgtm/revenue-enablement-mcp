import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
const alpha=existsSync(new URL('../netlify/functions/mcp-sse.js',import.meta.url));
const {default:handler}=await import(alpha?'../netlify/functions/mcp-sse.js':'../netlify/functions/mcp.mjs');
const rpc=async(method,params={})=> (await (await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}))).json());
const tools=(await rpc('tools/list')).result.tools;
const bases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url)));
async function call(name,args){const r=await rpc('tools/call',{name,arguments:args});assert.ok(!r.error,JSON.stringify(r));return r.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');}
const draft=text=>(text.split('## Draft with held statements omitted')[1]||text).split('## Reading the answer')[0].split('## Before you send')[0].replace(/\n## (?:Value Quantification Matrix|Proof Point Framework)\b[\s\S]*?(?=\n## [^#]|$)/g,'');
const copyFields={case_study_generator:'challenge',newsletter_builder:'key_points',webinar_script:'key_takeaways',content_repurposer:'source_content',thought_leadership_series:'your_take',testimonial_capture:'success_story',sales_enablement_content:'value_props',craft_content_improver:'content',impact_pinpoint_value:'key_outcome',impact_craft_message:'key_benefit',impact_translate_execution:'positioning_statement',impact_full_audit:'key_differentiation',email_sequence_generator:'key_value_prop',proposal_section_writer:'customer_challenges',demo_script_builder:'key_pain_points',champion_enablement_kit:'key_value_points',competitive_trap_setter:'your_strengths',launch_commander:'product_feature'};
for(const t of tools.filter(t=>t.name in copyFields))test(`RTM04 buyer copy guard covers ${t.name}`,async()=>{
 const args=structuredClone(bases.find(c=>c.tool===t.name).args);
 const field=copyFields[t.name];assert.equal(t.inputSchema.properties[field]?.type,'string',field);
 args[field]='We stop 100% of attacks';
 const answer=await call(t.name,args);
 assert.match(answer,/Absolute claim held out/);assert.doesNotMatch(draft(answer),/We stop 100% of attacks/i);
});
if(tools.some(t=>t.name==='pmf_scorecard')){
 const base=bases.find(c=>c.tool==='pmf_scorecard').args;
 for(const n of [0,1,12,29])test(`RTM05 NPS from ${n} responses is an unscored early signal`,async()=>{
  const answer=await call('pmf_scorecard',{...base,current_metrics:`NPS 72 from ${n} responses; 39% of users very disappointed; monthly churn 15%`});
  assert.match(answer,/early signal/i);assert.match(answer,/\| NPS Score[^\n]*Not scored/);assert.doesNotMatch(answer,/\| NPS Score[^\n]*(?:EXCELLENT|9\/10)/);assert.match(answer,/39% very disappointed is below the 40% comparison line/);
 });
 for(const [share,word] of [[39,'below'],[40,'meets'],[41,'meets']])test(`RTM05 disappointment ${share}% uses the 40% boundary`,async()=>{
  const answer=await call('pmf_scorecard',{...base,current_metrics:`NPS 72 from 30 responses; ${share}% of users very disappointed; monthly churn 15%`});
  assert.match(answer,new RegExp(`${share}% very disappointed (?:is )?${word} the 40% comparison line`));assert.match(answer,/\| NPS Score[^\n]*EXCELLENT/);
 });
 test('RTM05 target and impossible disappointment shares cannot become survey facts',async()=>{
  for(const value of ['target 70% of users very disappointed','very disappointed: 101%','40% very disappointed; 10% very disappointed'])assert.match(await call('pmf_scorecard',{...base,current_metrics:'NPS 72 from 12 responses; '+value}),/Cannot score these metrics/);
 });
 test('RTM05 response count takes precedence over the size of the customer base',async()=>{
  const answer=await call('pmf_scorecard',{...base,current_metrics:'5000 customers; NPS 72 from 12 responses; 40 percent of users very disappointed'});
  assert.match(answer,/early signal/i);assert.match(answer,/40% very disappointed meets the 40% comparison line/);assert.doesNotMatch(answer,/\| NPS Score[^\n]*EXCELLENT/);
 });
}
if(tools.some(t=>t.name==='impact_pinpoint_value')){
 for(const category of ['fraud','growth','AI'])test(`RTM06 ${category} is not used as the product type`,async()=>{
  const answer=await call('impact_pinpoint_value',{product_name:'Q',category,target_customer:'banks',key_outcome:'reduce fraud 90%',unique_capability:'AI',customer_metrics:'one pilot reduced fraud 12%'});
  assert.match(answer,/product type/);assert.doesNotMatch(answer,new RegExp(`Q is (?:a|an) ${category}`,'i'));assert.match(answer,/12% is below the stated 90%/);
 });
 test('RTM06 a properly typed product still leads with the lower pilot evidence',async()=>{
  const answer=await call('impact_pinpoint_value',{product_name:'Q',category:'fraud detection software',target_customer:'banks',key_outcome:'reduce fraud 90%',unique_capability:'AI',customer_metrics:'one pilot reduced fraud 12%'});
  assert.match(answer,/12% is below the stated 90%/);assert.doesNotMatch(answer,/helps[^\n]*90%/);
 });
 test('RTM06 an unrelated larger percentage does not substantiate the claimed outcome',async()=>{
  const answer=await call('impact_pinpoint_value',{product_name:'Q',category:'fraud detection software',target_customer:'banks',key_outcome:'reduce fraud 90%',unique_capability:'AI',customer_metrics:'one pilot reduced fraud 12%; uptime 99%'});
  assert.match(answer,/12% is below the stated 90%/);assert.doesNotMatch(answer,/helps[^\n]*90%/);
 });
 test('RTM06 the evidence review retains the product identity and the held source outcome',async()=>{
  const answer=await call('impact_pinpoint_value',{product_name:'Q',category:'fraud detection software',target_customer:'banks',key_outcome:'reduce fraud 90%',unique_capability:'AI',customer_metrics:'one pilot reduced fraud 12%'});
  assert.match(answer,/# Value proposition evidence review: Q/);assert.match(answer,/Held outcome \(unverified, not buyer copy\).*reduce fraud 90%/);
  assert.ok(answer.indexOf('12%')<answer.indexOf('90%'),'the evidence leads the review');
 });
 test('RTM06 a problem category without a numeric result still asks for a product type',async()=>{
  const answer=await call('impact_pinpoint_value',{product_name:'Q',category:'fraud',target_customer:'banks',key_outcome:'review suspicious transactions',unique_capability:'AI'});
  assert.match(answer,/product type/i);assert.doesNotMatch(answer,/Q is a fraud/i);
 });
}
if(tools.some(t=>t.name==='email_sequence_generator')){
 const base=bases.find(c=>c.tool==='email_sequence_generator').args;
 for(const permission of ['','; permission not granted','; permission pending','; if permission is granted'])test(`RTM04 unapproved named endorsement is held ${permission||'without permission'}`,async()=>{
  const answer=await call('email_sequence_generator',{...base,key_value_prop:'review security alerts faster',social_proof:'used by JPMorgan'+permission});
  assert.match(answer,/Named customer social proof held out/);assert.doesNotMatch(draft(answer),/used by JPMorgan/);
 });
 test('RTM04 lower case customer names cannot bypass the permission hold',async()=>{
  const answer=await call('email_sequence_generator',{...base,key_value_prop:'review security alerts faster',social_proof:'used by jpmorgan'});
  assert.match(answer,/Named customer social proof held out/);assert.doesNotMatch(draft(answer),/jpmorgan/i);
 });
 test('RTM04 an explicitly approved specific endorsement can be drafted',async()=>{
  const answer=await call('email_sequence_generator',{...base,key_value_prop:'review security alerts faster',social_proof:'used by Acme; we have written permission to publish this endorsement in email'});
  assert.match(answer,/Acme/);assert.doesNotMatch(answer,/Named customer social proof held out/);
 });
}
