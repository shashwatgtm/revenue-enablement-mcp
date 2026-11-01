import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const child=spawn(process.execPath,[home+'/dist/index.js'],{cwd:home,stdio:['pipe','pipe','pipe']});let id=0,buf='';const pending=new Map();child.stderr.resume();child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){let line=buf.slice(0,i);buf=buf.slice(i+1);try{let m=JSON.parse(line);pending.get(m.id)?.(m)}catch{}}});
const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('Timeout '+method)),10000);pending.set(n,m=>{clearTimeout(t);pending.delete(n);resolve(m)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
await req('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wave4-reasons',version:'test'}});child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
const call=async(args)=>{const r=await req('tools/call',{name:'deal_strategy_coach',arguments:{deal_name:'Opportunity record',deal_stage:'proposal',champion_status:'confirmed_champion',economic_buyer:'CFO',...args}});assert.ok(!r.error&&!r.result.isError);return r.result.content.map(c=>c.text||'').join('\n')};
const score=t=>Number(/Health Score: (\d+)/.exec(t)?.[1]);
for(const vertical of ['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'])test('R1 '+vertical+' exact, same meaning and opposite change scores by meaning',async()=>{
 const a={your_solution:vertical+' vendor'};const neutral=score(await call(a));
 for(const text of ['CFO engaged','The budget holder participates in the decision'])assert.equal(score(await call({...a,economic_buyer:text})),neutral+5);
 assert.equal(score(await call({...a,economic_buyer:'CFO, not engaged yet'})),neutral);
 for(const text of ['Known blockers: budget approval pending','The purchase cannot proceed until funds are approved'])assert.equal(score(await call({...a,blockers:text})),neutral-10);
 assert.equal(score(await call({...a,blockers:'No blockers; nothing stands in the way'})),neutral);
 for(const text of ['An incumbent is in the deal','They already use a rival supplier'])assert.equal(score(await call({...a,competitors:text})),neutral-10);
 assert.equal(score(await call({...a,competitors:'No incumbent'})),neutral);
});
test('R1 typed facts override text; unknown is not engaged',async()=>{const a=score(await call({}));assert.equal(score(await call({blockers:'Budget blocker',blocker_status:'none'})),a);assert.equal(score(await call({economic_buyer:'CFO engaged',economic_buyer_engagement:'not_engaged'})),a);assert.equal(score(await call({economic_buyer:'CFO engaged',economic_buyer_engagement:'unknown'})),a);assert.equal(score(await call({competitors:'Incumbent',incumbent_status:'none'})),a)});
test('N2 cancelled project holds even at closing',async()=>{const out=await call({deal_stage:'closing',blockers:'The project was cancelled and the champion left'});assert.match(out,/Hold: project cancelled/);assert.doesNotMatch(out,/Get signature|Confirmed champion|Closing Stage Strategy/)});
test.after(()=>child.kill());
