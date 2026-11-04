import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.mjs';
test('historical MAP render fixture remains expired under the actual current clock',async()=>{
 const response=await handler(new Request('https://local.invalid/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'mutual_action_plan_generator',arguments:{deal_name:'Historical synthetic fixture',target_close_date:'2026-11-02'}}})}));
 const message=await response.json();assert.equal(message.result.isError,true);assert.match(message.result.content.map(c=>c.text||'').join('\n'),/2026-11-02 is in the past/);
});
