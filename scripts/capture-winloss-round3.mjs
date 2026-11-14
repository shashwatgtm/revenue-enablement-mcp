import fs from'node:fs';import{pathToFileURL}from'node:url';
import{CASES}from'../tests/winloss-count-fix-cases.mjs';
import{ROUND2_CASES}from'../tests/winloss-round2-cases.mjs';
import{ROUND3_CASES}from'../tests/winloss-round3-cases.mjs';
const [repo,output]=process.argv.slice(2);if(!repo||!output)throw Error('Usage: node scripts/capture-winloss-round3.mjs CHECKOUT OUTPUT_JSON');const{default:handler}=await import(pathToFileURL(repo+'/netlify/functions/mcp.mjs'));const records=[];
for(const c of [...CASES,...ROUND2_CASES,...ROUND3_CASES]){
 const results={};for(const mode of['deal_portfolio','loss_pattern']){const call=async()=>{const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json,text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'win_loss_analyzer',arguments:{analysis_type:mode,multiple_deals:c.input,your_solution:'Invoice approval workflow'}}})}));const j=await r.json();return j.result.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');};const output=await call();results[mode]={output,repeat:output===await call()};}
 records.push({...c,results});
}
fs.writeFileSync(output,JSON.stringify({repo,cases:records},null,2)+'\n');console.log(output+': '+records.length+' cases, both modes twice');
