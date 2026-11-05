import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const base=JSON.parse(readFileSync(new URL('./fixtures/regions-baseline.json',import.meta.url)));
const cases=base.cases;
const call=async(name,args)=>{const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}));const b=await response.json();assert.ok(!b.error);assert.ok(!b.result.isError,JSON.stringify(b.result));return b.result.content.map(c=>c.text||'').join('\n');};

for(const tool of ['account_plan_builder','mutual_action_plan_generator'])for(const text of ['We do not sell lending software in India. We sell lending software in Singapore.','We sell warehouse software in Singapore. We do not sell lending software in India.'])test('M076 '+tool+' preserves full seller meaning',async()=>{
 const seed=cases.find(x=>x.tool===tool),args={...seed.args,your_solution:text,blockers:'No blockers supplied'};const out=await call(tool,args);
 assert.ok(out.includes(text.slice(0,-1)),out.slice(0,2000));assert.doesNotMatch(out,/what you sell, in your words, is [“"]We do not sell lending software in India[”"]/);
 assert.equal(await call(tool,args),out);assert.equal(await call(tool,args),out);
});

