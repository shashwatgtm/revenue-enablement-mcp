import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const home=process.env.WAVE4_TEST_HOME||process.cwd();const child=spawn(process.execPath,[home+'/dist/index.js'],{cwd:home,stdio:['pipe','pipe','pipe']});let id=0,buf='';const pending=new Map();child.stderr.resume();child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){let line=buf.slice(0,i);buf=buf.slice(i+1);try{let m=JSON.parse(line);pending.get(m.id)?.(m)}catch{}}});
const req=(method,params)=>new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>reject(Error('Timeout '+method)),10000);pending.set(n,m=>{clearTimeout(t);pending.delete(n);resolve(m)});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n')});
await req('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wave4-reasons',version:'test'}});child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
const call=async(name,args)=>{const r=await req('tools/call',{name,arguments:args});assert.ok(!r.error&&!r.result.isError,JSON.stringify(r));return r.result.content.map(c=>c.text||'').join('\n')};
const verticals=['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'];
test.after(()=>child.kill());
const fixtures={"pricing_negotiation_guide": {"scenario": "competitor_pricing", "deal_value": 80000, "your_solution": "SaaS software for approval handoffs", "competitor_price": "Competitor quoted 10% below us", "value_delivered": "Approval time fell from four days to two days in the stated pilot."}, "account_plan_builder": {"account_name": "Account A", "industry": "software", "current_arr": 12000, "known_contacts": "Operations lead: champion; Finance director: economic buyer", "current_products": "Approval workflow", "expansion_opportunities": "Another team needs the same handoff process", "competitive_threats": "Internal tool", "your_solution": "Operations workflow software", "account_notes": "Current customer. Confirm expansion need before proposing it."}, "email_sequence_generator": {"sequence_type": "cold_outreach", "target_persona": "Operations lead", "your_solution": "SaaS software for approval handoffs", "specific_pain_point": "Missed handoffs", "social_proof": "Approval time fell from four days to two days in the stated pilot."}};
for(const v of verticals)test('R9 '+v+' above and below preserve price direction',async()=>{
 for(const [price,pattern]of [['Competitor quoted 10% above us',/Situation: Competitor quote is higher/],['Their quote is 20% more expensive than ours',/Situation: Competitor quote is higher/],['Competitor quoted 10% below us',/Situation: Competitor has lower price/],['Competitor is not cheaper',/Situation: Price direction is not clear/]]){
  const t=await call('pricing_negotiation_guide',{...fixtures.pricing_negotiation_guide,your_solution:v+' vendor',competitor_price:price});assert.match(t,pattern);
 }
});
for(const v of verticals)test('R10 '+v+' denied champions stay unconfirmed',async()=>{
 const t=await call('account_plan_builder',{...fixtures.account_plan_builder,your_solution:v+' vendor',known_contacts:'Operations lead (not a champion)'});assert.doesNotMatch(t,/Champion, as you said/);assert.match(t,/Find a champion first/);
 const a=await call('account_plan_builder',{...fixtures.account_plan_builder,your_solution:v+' vendor',known_contacts:'Operations lead (internal advocate)'});assert.match(a,/Champion, as you said/);
});
for(const v of verticals)test('R10 '+v+' denied results are held outside email bodies',async()=>{
 for(const proof of ['No customer has reported any improvement','Customers did not save any time','Costs doubled after adoption']){
 const t=await call('email_sequence_generator',{...fixtures.email_sequence_generator,your_solution:v+' vendor',social_proof:proof});assert.match(t,/Evidence held/);const emails=t.split('### Email 1:')[1]?.split('## Before you send')[0];assert.ok(emails);assert.ok(!emails.includes(proof));
 }
 const t=await call('email_sequence_generator',{...fixtures.email_sequence_generator,your_solution:v+' vendor',social_proof:'Customer processing time fell by 20% during the pilot'});assert.doesNotMatch(t,/Evidence held/);assert.match(t,/20%/);
});
