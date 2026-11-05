import {test} from 'node:test';
import assert from 'node:assert/strict';
import {regionalInputs} from '../src/region-adapter.ts';
import {readRegionContext,NO_REGION_SUFFIX} from '../src/region-reader.ts';
import handler from '../netlify/functions/mcp.mjs';
test('Revenue buyer industry cannot select a seller market or regulated sector',async()=>{
 const seller='Endpoint detection and response cybersecurity software';
 const absent=readRegionContext(regionalInputs({your_solution:seller,industry:'banking in India'},'buyer'));
 assert.deepEqual(absent.regions,[]);
 const args={account_name:'Test account',your_solution:'We sell '+seller+' in Germany.',industry:'banking in India'};
 const reading=readRegionContext(regionalInputs(args,'buyer'));
 assert.deepEqual(reading.regions.map(r=>r.countries),[['DE']]);
 assert.equal(reading.regions[0].vertical_id,'cybersecurity');
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'account_plan_builder',arguments:args}})}));
 const result=(await response.json()).result;assert.ok(!result.isError);
 const tail=result.content[0].text.split('## Region and industry context')[1];
 assert.ok(tail.includes('Germany'));assert.ok(!tail.includes('### India'));assert.ok(!tail.includes('Reserve Bank of India'));
});
