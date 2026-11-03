import {readFileSync as readTestPackage} from 'node:fs';
const testRepositoryName=home=>JSON.parse(readTestPackage(home+'/package.json','utf8')).name.split('/').pop();
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {spawn} from 'node:child_process';import path from 'node:path';
const home=process.env.WAVE4_TEST_HOME||process.cwd(),repo=testRepositoryName(home),child=spawn(process.execPath,[home+'/dist/index.js'],{cwd:home,stdio:['pipe','pipe','pipe']});let id=0,buf='';const pending=new Map(),rows=[];child.stderr.resume();child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){const line=buf.slice(0,i);buf=buf.slice(i+1);try{const m=JSON.parse(line);pending.get(m.id)?.(m)}catch{}}});
const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('Timeout '+method)),10000);pending.set(n,m=>{clearTimeout(t);pending.delete(n);resolve(m)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
await req('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wave4-fix-round',version:'test'}});child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');const schemas=new Map((await req('tools/list',{})).result.tools.map(t=>[t.name,t.inputSchema]));

const verticals=['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'];
for(const v of verticals)for(const [form,phrase,wantBig]of [['exact','Enterprise buying group',true],['same','Large buying group',true],['opposite','SMB buying group too small for enterprise',false],['opposite-alt','Small buying group below the enterprise threshold',false]])test(`FIX3 size advice ${repo} ${v} ${form}`,async()=>{
 const tool=repo==='craft-gtm-mcp'?'retention_playbook':'roi_business_case_builder';
 const args=repo==='craft-gtm-mcp'?{customer_segment:phrase,business_model:'saas_subscription',current_churn_rate:'2% monthly',product:v+' vendor'}:{customer_name:phrase,company_size:'smb',your_solution:v+' vendor',primary_value_driver:'cost_reduction',solution_price:12000};
 const schema=schemas.get(tool);for(const k of Object.keys(args))assert.ok(schema.properties[k],k);for(const k of schema.required||[])assert.ok(k in args,k);
 const raw=await req('tools/call',{name:tool,arguments:args}),text=raw.result?.content?.map(c=>c.text).join('\n')||'';
 const marker=repo==='craft-gtm-mcp'?/In this segment a purchase usually involves|These are common[^\n]+ model in /:/You set company size to SMB, but the customer is described as large or enterprise/;
 const checks={runs:!raw.error&&!raw.result?.isError,advice:marker.test(text)===wantBig};rows.push({v,form,args,wantBig,checks,raw});assert.ok(Object.values(checks).every(Boolean),JSON.stringify({phrase,checks}));
});
test.after(()=>{if(process.env.WAVE4_RECEIPT)fs.writeFileSync(process.env.WAVE4_RECEIPT,JSON.stringify(rows,null,2)+'\n');child.kill()});
