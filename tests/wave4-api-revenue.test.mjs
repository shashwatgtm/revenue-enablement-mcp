import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const child=spawn(process.execPath,[home+'/dist/index.js'],{cwd:home,stdio:['pipe','pipe','pipe']});let id=0,buf='';const pending=new Map();child.stderr.resume();child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){let line=buf.slice(0,i);buf=buf.slice(i+1);try{let m=JSON.parse(line);pending.get(m.id)?.(m)}catch{}}});
const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('Timeout '+method)),10000);pending.set(n,m=>{clearTimeout(t);pending.delete(n);resolve(m)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
await req('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wave4-reasons',version:'test'}});child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
const schemas=new Map((await req('tools/list',{})).result.tools.map(t=>[t.name,t.inputSchema]));
const call=async(name,args)=>{const schema=schemas.get(name);assert.ok(schema,'Unknown tool '+name);for(const [k,v]of Object.entries(args)){const field=schema.properties[k];assert.ok(field,'Unknown field '+k);assert.equal(Array.isArray(v)?'array':typeof v,field.type,'Wrong type '+k)}for(const k of schema.required||[])assert.ok(k in args,'Missing '+k);const r=await req('tools/call',{name,arguments:args});assert.ok(!r.error&&!r.result.isError,JSON.stringify(r));return r.result.content.map(c=>c.text||'').join('\n')};
const verticals=['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'];
test.after(()=>child.kill());
for(const v of verticals)test('API Revenue '+v+' company statements never become demo work',async()=>{
 const base={demo_type:'first_look',your_solution:v+' workflow software with approvals',primary_audience:'Finance lead',key_pain_points:'Slow approval handoffs'};
 for(const must_show of ['Recognized as a leader by analysts','Offices across three regions','Certified partner in a provider program','We have offices across three regions']){const t=await call('demo_script_builder',{...base,must_show_features:must_show});const steps=t.split('Demo Flow')[1]||t;assert.doesNotMatch(steps,/(?:Show|Demonstrate|Walk through) (?:recognized as|offices across|certified partner)/i);assert.match(t,/claim/i)}
});
for(const v of verticals)test('API Revenue '+v+' denied company claims are held outside spoken lines',async()=>{
 for(const must_show_features of ['We are not recognized as a leader by analysts','We have no offices across three regions','We are not a certified partner in a provider program']){
 const t=await call('demo_script_builder',{demo_type:'first_look',your_solution:v+' workflow software with approvals',primary_audience:'Finance lead',must_show_features});
 assert.match(t,/Unconfirmed input held/);const spoken=t.split('\n').filter(l=>l.startsWith('Say:')).join('\n');assert.doesNotMatch(spoken,/not recognized|no offices|not a certified partner/i);
 }
});
