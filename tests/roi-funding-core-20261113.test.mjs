import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildRoiFunding,readFundingInputs,classifyFunding,readFundingMoney,fundingMonths,fundingRecovery,fundingVerdict} from '../src/roi-funding.ts';
import {createServer} from '../src/index.ts';
const probes=JSON.parse(fs.readFileSync(new URL('./fixtures/roi-funding-probes-20261113.json',import.meta.url)));
const clock=()=>new Date('2026-11-13T12:00:00Z');
const input=(more={})=>({your_solution:'an ABM programme in India',solution_price:9000000,primary_value_driver:'revenue_increase',known_metrics:'helix-roi-v1; customers=5; per_customer=3000000; limit_months=12; margin=70; cycle_months=5; currency=INR; start=2026-11',...more});
const fixed=(geo,S,A,N=5)=>({solution_price:S,primary_value_driver:'revenue_increase',known_metrics:`helix-roi-v1; customers=${N}; per_customer=${A}; limit_months=12; currency=${geo.currency}; geo=${geo.geo}`});
const classes=[['direct_lines','direct'],['long_build_lines','long'],['brand_lines','brand'],['enabler_lines','enabler'],['other_lines','other']];
for(const vertical of probes.verticals)for(const geo of probes.geos)test(`funding exact, same meaning and opposite: ${vertical}, ${geo.geo}`,()=>{
 const S=readFundingMoney(geo.spend).value,A=readFundingMoney(geo.per_customer).value;
 for(const [field,expected]of classes)for(const phrase of probes[field]){
  for(const your_solution of [`A ${vertical} firm in ${geo.places[0]} wants to fund ${phrase}`,`Our ${vertical} company wants ${phrase} in ${geo.geo}`,`${phrase} in ${geo.places.at(-1)}`]){
   assert.equal(classifyFunding(your_solution).kind,expected,your_solution);
   const a={...fixed(geo,S,A),your_solution};const out=buildRoiFunding(a,clock);
   assert.equal(out,buildRoiFunding(a,clock));
   if(['brand','enabler','other'].includes(expected))assert.doesNotMatch(out,/Passes/);
   else assert.match(out,new RegExp((12*S/(5*A)).toFixed(1).replace('.','\\.')+' months'));
  }
  const opposite=expected==='direct'?`a CRM purchase, not ${phrase}`:`an ABM programme, not ${phrase}`;
  assert.equal(classifyFunding(opposite).kind,expected==='direct'?'enabler':'direct',opposite);
 }
});
test('worked example computes every result from the supplied inputs',()=>{
 const a=input(),o=buildRoiFunding(a,clock),S=a.solution_price,N=5,A=3000000,G=70,L=12,C=5;
 const P=12*S/(N*A),req=Math.ceil(12*S/L/A);
 assert.ok(o.startsWith(`Pays back in ${P.toFixed(1)} months. Passes your ${L} month limit.`));
 assert.ok(o.includes(`${fundingMonths(P/(G/100)).toFixed(1)} months. Passes your ${L} month limit.`));
 assert.ok(o.includes(`Customers that must close for this to pass: ${req} of the ${N} you expect.`));
 assert.ok(o.includes(`Months to recovery: ${fundingMonths(C+P).toFixed(1)}.`));
 assert.match(o,/November 2027, which is FY 2027-28/);
 assert.match(o,/Fragile/);
});
test('least verdict safety for every configured safety phrase alone and mixed',()=>{
 const words=[...probes.enabler_lines,...probes.brand_lines,...probes.other_lines,'software','platform','tool','licence','subscription','seats','SaaS','data provider','database','automation','technology','stack','suite','analytics','attribution','app','vendor','marketing cloud','marketing operations','email platform','webinar platform','event app','partner portal','partner management','sponsored posts','social media','thought leadership','earned media','press outreach','a messaging project','landing pages','website refresh','launch campaigns'];
 for(const phrase of words)for(const your_solution of [phrase,`${phrase} and an ABM programme`])assert.doesNotMatch(buildRoiFunding(input({your_solution}),clock),/Passes/,your_solution);
});
test('paid beats audience and booth sponsorship is demand spend',()=>{
 for(const phrase of [...probes.paid_beats_audience,'paid social','sponsored posts bought as ads','booth sponsorship','exhibition sponsorship'])assert.equal(classifyFunding(phrase).kind,'direct',phrase);
});
test('money units and currencies',()=>{
 for(const [s,v,c]of [['90 lakh',90*1e5,''],['1.5 crore',1.5*1e7,''],['1.2m',1.2*1e6,''],['400k',400*1e3,''],['AED 400,000',400000,'AED'],['S$250,000',250000,'SGD'],['SGD 250000',250000,'SGD'],['Rs 90 lakh',90*1e5,'INR']]){const got=readFundingMoney(s);assert.equal(got.value,v,s);assert.equal(got.currency,c,s);}
});
test('chat only opens with new customers and annual revenue, never existing accounts',()=>{
 for(const known_metrics of probes.existing_customer_opposites){const o=buildRoiFunding(input({known_metrics}),clock);assert.doesNotMatch(o,/Passes|new ARR/);assert.match(o,/If this is your own marketing spend/);}
 for(const known_metrics of ['we expect 5 new customers at 3000000 each','we expect 5 customers at 3000000 a year','forecast 4 new logos at 45000 a year','target 6 new customers from this at 75000 ARR each'])assert.equal(readFundingInputs(input({known_metrics}),clock).guarded,false,known_metrics);
 for(const primary_value_driver of ['cost_reduction','productivity','risk_mitigation'])assert.equal(readFundingInputs(input({known_metrics:'5 new customers at 3000000 each',primary_value_driver}),clock).guarded,true);
});
test('ten seller fills are never funded and never relabelled',()=>{
 const cases=[...probes.seller_frame_fills,...['revenue_increase','cost_reduction','productivity','risk_mitigation','multiple'].map(primary_value_driver=>({your_solution:'our marketing service',solution_price:60000,annual_value_estimate:180000,primary_value_driver}))];
 for(const a of cases){const o=buildRoiFunding(a,clock);assert.doesNotMatch(o,/Passes|Does not pass|new ARR/,JSON.stringify(a));}
});
test('zero, missing, text and absurd numbers have explicit answers',()=>{
 assert.match(buildRoiFunding(input({solution_price:undefined}),clock),/^Not decided yet: give the spend/);
 assert.match(buildRoiFunding(input({solution_price:0}),clock),/^A spend of 0/);
 for(const [key,value,match]of [['customers',0,/^Does not pass: no new revenue/],['per_customer',0,/^Does not pass: no new revenue/],['customers',-1,/^Check your figures: new customers/],['margin',0,/^Check your figures: gross margin/],['margin',101,/^Check your figures: gross margin/],['win_rate',0,/^Check your figures: win rate/],['win_rate',101,/^Check your figures: win rate/],['limit_months',0,/^Check your figures: payback limit/],['limit_months',61,/^Check your figures: payback limit/],['cycle_months',37,/^Check your figures: sales cycle/],['customers','unknown',/^Not decided yet/]]){
  let known_metrics=input().known_metrics;known_metrics=known_metrics.replace(new RegExp(`; ${key}=[^;]*`),'');known_metrics+=`; ${key}=${value}`;assert.match(buildRoiFunding(input({known_metrics}),clock),match,key);
 }
 assert.match(buildRoiFunding(input({solution_price:-1}),clock),/^Check your figures: spend/);
 assert.match(buildRoiFunding(input({solution_price:100}),clock),/^Check your figures: this says/);
});
test('round half up before comparing with the limit',()=>{
 for(const p of [12.04,12.05,24.04,24.05]){assert.equal(fundingMonths(p),Math.floor(p*10+.5)/10);assert.equal(fundingVerdict('direct',p,12).row,p<12.05?'pass':p<24.05?'smaller':'fail');}
});
test('mixed currencies, missing geo and both FY boundaries',()=>{
 for(const [S,A]of [['Rs 90 lakh','$36000'],['£180000','45000']]){const out=buildRoiFunding(input({solution_price:S,known_metrics:`5 new customers at ${A} each`}),clock);assert.match(out,/^Check your figures: spend and revenue must be in the same currency/);assert.doesNotMatch(out,/Passes/);}
 assert.equal(readFundingInputs(input({known_metrics:'helix-roi-v1; customers=5; per_customer=3000000; currency=USD',your_solution:'an ABM programme'}),clock).geo,'');
 for(const [start,month,next]of [['2026-11','March',false],['2026-12','April',true]]){
 const T=12*1000/(5*1000)+1.8;
 assert.match(fundingRecovery(start,T,4),new RegExp(`${month} 2027, which is FY ${next?'2027-28':'2026-27'}`));
 }
});
test('through the real handler the first line is the funding verdict, contract and policy hold',async()=>{
 const handler=createServer()._requestHandlers.get('tools/call');const result=await handler({method:'tools/call',params:{name:'roi_business_case_builder',arguments:input()}});assert.match(result.content[0].text,/^Pays back in/);
 for(const your_solution of probes.out_of_scope){const o=await handler({method:'tools/call',params:{name:'roi_business_case_builder',arguments:input({your_solution})}});assert.match(o.content[0].text,/outside this tool's scope/);assert.doesNotMatch(o.content[0].text,/https:/);}
 const o=await handler({method:'tools/call',params:{name:'roi_business_case_builder',arguments:input({your_solution:'Which ABM platform should we buy?'})}});assert.match(o.content[0].text,/calendly/);assert.doesNotMatch(o.content[0].text,/Passes/);
});

test('fixed money marks survive the real handler for every currency',async()=>{
 const handler=createServer()._requestHandlers.get('tools/call');
 for(const [currency,mark]of [['INR','Rs '],['USD','$'],['GBP','£'],['EUR','€'],['AED','AED '],['SGD','S$']]){
  const arguments_={your_solution:'an ABM programme',solution_price:180000,primary_value_driver:'revenue_increase',known_metrics:`helix-roi-v1; customers=5; per_customer=${mark}45000; currency=${currency}; limit_months=12`};
  const r=await handler({method:'tools/call',params:{name:'roi_business_case_builder',arguments:arguments_}});assert.match(r.content[0].text,/^Pays back in/);
 }
 const r=await handler({method:'tools/call',params:{name:'roi_business_case_builder',arguments:{your_solution:'an ABM programme in London',solution_price:180000,primary_value_driver:'revenue_increase',known_metrics:'helix-roi-v1; customers=5; per_customer=$45000; currency=GBP; limit_months=12'}}});assert.match(r.content[0].text,/^Check your figures: spend and revenue/);
});
test('negative chat numbers and gross margin disagreement never get a hidden positive result',()=>{
 assert.match(buildRoiFunding(input({known_metrics:'-5 new customers at 3000000 a year'}),clock),/^Check your figures: new customers/);
 const o=buildRoiFunding(input({known_metrics:'helix-roi-v1; customers=5; per_customer=3000000; limit_months=12; margin=30; currency=INR'}),clock);
 const P=12*9000000/(5*3000000),Pg=P/(30/100);assert.match(o,new RegExp(`On gross margin\\n${Pg.toFixed(1).replace('.','\\.')} months`));assert.match(o,/Passes on revenue, not on gross margin/);
});
test('all safety keyword groups stay without a verdict',()=>{
 const phrases=['CDP','customer data platform','web personalisation','advertising technology','marketing cloud','marketing operations','webinar platform','event app','partner portal','partner management','sales enablement','sales engagement','buyer intent','contact data','lead data','account data','B2B data','firmographic data','technographic data','data enrichment','lead enrichment','revenue intelligence','conversation intelligence','sales intelligence','lead scoring','lead routing','lead management','sponsorship','sponsoring','sponsored content','sponsored posts','sponsored events','sponsored sessions','analyst briefings','analyst days','analyst firms','public relations','media relations','press releases','earned media','communications programme','thought leadership','AR/PR','PR agency','PR retainer','PR outreach','PR coverage','PR strategy','PR launch','PR team','podcast','newsletter','social media','influencer','out of home','OOH','billboard','brand campaign','brand building','brand refresh','brand positioning','brand programme','brand study','brand tracking','brand strategy','brand identity','brand design','brand lift','brand spend','brand reputation','rebrand','branding','go to market','GTM','fractional CMO','CMO advisory','CMO services','positioning project','messaging workshop','messaging framework','landing page','website revamp','website rebuild','website refresh','website relaunch','product launch','launch campaign'];
 for(const phrase of phrases)for(const your_solution of [phrase,phrase+' and an ABM programme'])assert.doesNotMatch(buildRoiFunding(input({your_solution}),clock),/Passes/,your_solution);
});
