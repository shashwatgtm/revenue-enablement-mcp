import {buildRoiFunding} from '../src/roi-funding.ts';
const call=async(name,args)=>buildRoiFunding(args,()=>new Date('2026-11-13'));
import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/mcp.mjs';
test("security-earliest-start", async()=>{const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "mutual_action_plan_generator", "arguments": {"deal_name": "Warehouse routing platform renewal", "target_close_date": "2026-12-15", "current_stage": "evaluation", "known_process_steps": "Security review cannot start before 2026-12-10. Legal review follows security approval. Procurement signs after legal approval.", "known_requirements": "Security review takes 10 business days.", "your_solution": "Route planning software"}}})}));const data=await r.json();const text=data.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');assert.match(text,/not feasible/); assert.match(text,/2026-12-10/); assert.doesNotMatch(text,/start it in the first week|Start .* now/);});
test("negative-net-value", async () => {
  // The seller ROI calculation was replaced by the funding guard. These old fields cannot earn a verdict.
  for (const args of [{your_solution:"an ABM programme",solution_price:60000,primary_value_driver:"revenue_increase",annual_value_estimate:180000}]) {
    const answer = await call("roi_business_case_builder", args);
    const output = typeof answer === "string" ? answer : answer.text;
    assert.doesNotMatch(output, /Passes|Does not pass|new ARR|Net Annual Benefit|3-Year Net Value/);
    assert.match(output, /A spend of 0|Not decided yet|Break-even only|outside this tool's scope/);
  }
});
