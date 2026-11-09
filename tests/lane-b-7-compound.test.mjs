import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dealBlockerLines,blockerLines} from '../dist/answers.js';
import handler from '../netlify/functions/mcp.mjs';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id))){
 const ctx={product:f.product,model:f.model};
 test(`${f.id}: each pending concern has its own action`,async()=>{
  for(const text of ['Security review and budget sign-off are both pending','Budget approval and privacy review are outstanding']){
   const lines=dealBlockerLines(text,ctx);assert.equal(lines.length,2);assert.match(lines.join('\n'),/security documents/);assert.match(lines.join('\n'),/budget approver/);
   assert.doesNotMatch(lines.join('\n'),/Also address compare|Sentence read/);
   const response=await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'deal_strategy_coach',arguments:{deal_name:f.product+' evaluation',your_solution:f.product,blockers:text,deal_stage:'proposal',champion_status:'confirmed_champion',economic_buyer:f.buyer}}})}));
   const body=await response.json();assert.ok(body.result&&!body.result.isError,JSON.stringify(body));
   const out=body.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');assert.match(out,/budget approver/);assert.match(out,/security documents/);
  }
  const opposite='No security review or budget sign-off is pending';
  assert.deepEqual(dealBlockerLines(opposite,ctx),blockerLines(opposite,ctx));
  assert.doesNotMatch(dealBlockerLines(opposite,ctx).join('\n'),/budget approver|security documents/);
  for(const text of ['Security review is pending','Security review and data protection','Security review and budget sign-off are both pending'])assert.deepEqual(dealBlockerLines(text,ctx),dealBlockerLines(text,ctx));
  assert.deepEqual(dealBlockerLines('Security review is pending',ctx),blockerLines('Security review is pending',ctx));
 });
}
