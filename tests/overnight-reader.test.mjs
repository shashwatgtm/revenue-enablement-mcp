import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url),'utf8'));
async function call(name,args){
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}));
 const r=(await response.json()).result;assert.ok(r&&!r.isError);return r.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
}
const roles=t=>t.split('\n').filter(x=>/^(Founder|CEO|CMO|CRO|Demand generation head):/.test(x));
test('Email checks separate relevance, delivery, evidence, buyer action and contact permission',async()=>{
 const a=cases.find(x=>x.tool==='email_sequence_generator').args;const text=await call('email_sequence_generator',a),r=roles(text);
 assert.equal(r.length,5);assert.match(r[0],/Two receptionists.*denial/);assert.match(r[1],/reply owner.*Clinic scheduling software/);
 assert.match(r[2],/no measured reduction.*source and permission/);assert.match(r[3],/Practice manager.*next observation/);assert.match(r[4],/contact permission.*stop follow ups after a refusal/);
 assert.doesNotMatch(text,/An example on Two receptionists|Who looks after Two receptionists|One question on Two receptionists|Questions on Two receptionists/);assert.match(text,/An example to check/);
 const changed=roles(await call('email_sequence_generator',{...a,target_persona:'Dispatch manager',your_solution:'Dispatch exception service',specific_pain_point:'Drivers cannot find the next exception owner',social_proof:'A pilot is proposed; no customer outcome is measured.'}));
 for(let i=0;i<5;i++)assert.notEqual(r[i],changed[i]);
 assert.doesNotMatch(changed.join('\n'),/clinic|receptionists/i);
});

test('Overnight distinct case evidence checks: demo_script_builder',async()=>{
 const a=cases.find(x=>x.tool==='demo_script_builder').args; const text=await call('demo_script_builder',a), r=roles(text); assert.equal(r.length,5);
 const checks=["close alerts automatically.*disprove", "safe test environment", "recorded screen or service evidence", "alert remains open.*authorized person", "invitation list"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: discovery_question_bank',async()=>{
 const a=cases.find(x=>x.tool==='discovery_question_bank').args; const text=await call('discovery_question_bank',a), r=roles(text); assert.equal(r.length,5);
 const checks=["Missed deliveries.*counterexample", "Four hours.*scope|scope.*Four hours", "attributed notes", "recent example, frequency and approval", "fresh account.*deny"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: proposal_section_writer',async()=>{
 const a=cases.find(x=>x.tool==='proposal_section_writer').args; const text=await call('proposal_section_writer',a), r=roles(text); assert.equal(r.length,5);
 const checks=["Exceptions wait four days", "included work, exclusions", "improvement is unmeasured", "observable acceptance condition.*signatory", "new account.*matching evidence"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: deal_strategy_coach',async()=>{
 const a=cases.find(x=>x.tool==='deal_strategy_coach').args; const text=await call('deal_strategy_coach',a), r=roles(text); assert.equal(r.length,5);
 const checks=["proposal.*buyer action", "reserved.*Alert triage|reserved.*Cybersecurity", "proof.*Alert triage", "CISO has not attended.*direct confirmation", "confirmed champion.*advocacy"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: account_plan_builder',async()=>{
 const a=cases.find(x=>x.tool==='account_plan_builder').args; const text=await call('account_plan_builder',a), r=roles(text); assert.equal(r.length,5);
 const checks=["Second depot.*confirmed or denied", "24,000.*unapproved expansion", "Dispatch exception queue at one depot.*another", "Operations director.*introduction", "fresh account.*exclude expansion assumptions"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: mutual_action_plan_generator',async()=>{
 const a=cases.find(x=>x.tool==='mutual_action_plan_generator').args; const text=await call('mutual_action_plan_generator',a), r=roles(text); assert.equal(r.length,5);
 const checks=["no unexplained differences.*fail acceptance", "CFO has not approved a budget", "Head of IT.*evidence", "Procurement manager.*CFO.*2026-12-18", "buyer availability.*2026-12-18"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: win_loss_analyzer',async()=>{
 const a=cases.find(x=>x.tool==='win_loss_analyzer').args; const text=await call('win_loss_analyzer',a), r=roles(text); assert.equal(r.length,5);
 const checks=["Incumbent renewal.*comparable win and loss", "120.*48,000.*one deal", "attributed buyer notes", "NOC manager and procurement analyst.*decision maker", "separate, comparable.*stop rule"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: pricing_negotiation_guide',async()=>{
 const a=cases.find(x=>x.tool==='pricing_negotiation_guide').args; const text=await call('pricing_negotiation_guide',a), r=roles(text); assert.equal(r.length,5);
 const checks=["unmeasured benefit", "80,000.*minimum approved margin", "not been measured.*unsupported", "68000 a year.*80,000", "approved scope and period"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: champion_enablement_kit',async()=>{
 const a=cases.find(x=>x.tool==='champion_enablement_kit').args; const text=await call('champion_enablement_kit',a), r=roles(text); assert.equal(r.length,5);
 const checks=["40 hours a month.*measured savings", "CFO.*budget authority", "No pilot saving or budget approval yet.*unmeasured", "conversation with CFO.*introduction", "advocacy is confirmed"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: competitive_trap_setter',async()=>{
 const a=cases.find(x=>x.tool==='competitive_trap_setter').args; const text=await call('competitive_trap_setter',a), r=roles(text); assert.equal(r.length,5);
 const checks=["next owner and affected depot.*material", "equal scope.*Existing TMS", "not independently verified.*externally", "same example.*Existing TMS.*contrary", "unverified weakness.*targeting fact"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

test('Overnight distinct case evidence checks: roi_business_case_builder',async()=>{
 const a=cases.find(x=>x.tool==='roi_business_case_builder').args; const text=await call('roi_business_case_builder',a), r=roles(text); assert.equal(r.length,5);
 const checks=["20%.*revise scope or price", "240,000.*60,000.*hold the investment", "No headcount reduction is approved.*cash saving", "20%.*240,000.*scope and period", "60,000.*negative economics"]; checks.forEach((pattern,i)=>assert.match(r[i],new RegExp(pattern)));
 assert.match(text,/The conclusion needs review if/);assert.doesNotMatch(r.join('\n'),/undefined|NaN/);
});

 test('ROI missing improvement remains unconfirmed without a numeric placeholder',async()=>{
 const a={...cases.find(x=>x.tool==='roi_business_case_builder').args}; delete a.expected_improvement_percent;
 const text=await call('roi_business_case_builder',a),r=roles(text); assert.match(r.join('\n'),/unconfirmed improvement/);assert.doesNotMatch(r.join('\n'),/unstated%|undefined|NaN/);
 });
