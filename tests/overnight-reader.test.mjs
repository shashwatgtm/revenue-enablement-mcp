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
