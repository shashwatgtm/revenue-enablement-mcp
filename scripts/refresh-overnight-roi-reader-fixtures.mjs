// Refresh only the requested reader sections. Abort if any calculation or core text changes.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import handler from '../netlify/functions/mcp.mjs';
const base={your_solution:'Helix Platform',primary_value_driver:'productivity',annual_revenue:10000000,annual_value_estimate:100000};
const marker='\n\n## Reading the answer';
const evidence=[];
for(const [price,name] of [[undefined,'omitted'],[0.01,'0.01'],[1,'1'],[50000,'50000']]){
 const args={...base,...(price===undefined?{}:{solution_price:price})};
 const res=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'roi_business_case_builder',arguments:args}})}));
 const body=await res.json();assert.ok(body.result&&!body.result.isError);
 const text=body.result.content.map(c=>c.text).join('\n');
 const path=new URL('../tests/fixtures/roi-own-price-'+name+'.md',import.meta.url);
 const previous=await fs.readFile(path,'utf8');
 assert.ok(previous.includes(marker)&&text.includes(marker));
 const core=previous.slice(0,previous.indexOf(marker));
 assert.equal(text.slice(0,text.indexOf(marker)),core,'Only reader text may change: '+name);
 assert.match(text.slice(text.indexOf(marker)),/Released capacity is not cash/);
 assert.match(text.slice(text.indexOf(marker)),/CEO: have finance verify/);
 await fs.writeFile(path,text);
 evidence.push({fixture:'roi-own-price-'+name+'.md',core_sha256:createHash('sha256').update(core).digest('hex'),core_unchanged:true});
}
console.log(JSON.stringify(evidence,null,2));
