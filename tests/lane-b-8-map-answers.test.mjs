import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
async function call(f,blockers){
 const args={deal_name:f.product+' evaluation',your_solution:f.product,target_close_date:'2026-12-18',current_stage:'evaluation',buyer_champion:f.buyer,economic_buyer:'CFO',blockers};
 const r=await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'mutual_action_plan_generator',arguments:args}})}));const b=await r.json();assert.ok(b.result&&!b.result.isError,JSON.stringify(b));return b.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
}
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id)))test(`${f.id}: a matched capacity blocker gets its actual plan rule`,async()=>{
 for(const text of ['Buyer staff capacity is constrained','The evaluation team has a staffing constraint']){
  const out=await call(f,text);const row=out.split('\n').find(l=>l.startsWith('| '+text+' |'));assert.ok(row);assert.match(row,/Time and people for/);assert.doesNotMatch(row,/bring the facts first/);assert.match(row,/written decision/);assert.equal(out,await call(f,text));
 }
 const denied='No staffing constraint is holding up the evaluation';const out=await call(f,denied);const row=out.split('\n').find(l=>l.startsWith('| '+denied+' |'));assert.ok(row);assert.doesNotMatch(row,/Time and people for/);
});
