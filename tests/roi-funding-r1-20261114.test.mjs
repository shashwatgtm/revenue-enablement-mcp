import test from 'node:test';import assert from 'node:assert/strict';
import {readFundingInputs,buildRoiFunding,classifyFunding} from '../src/roi-funding.ts';
import {roiInScope,ROI_SCOPE_DECLINE} from '../src/roi-scope.ts';
import {createServer} from '../src/index.ts';
const clock=()=>new Date('2026-11-14T00:00:00Z');
const a=(more={})=>({your_solution:'an ABM programme in India',solution_price:9000000,primary_value_driver:'revenue_increase',known_metrics:'helix-roi-v1; customers=5; per_customer=3000000; limit_months=12; currency=INR; start=2026-11',...more});
const geos=[['India','Rs 30 lakh','INR',9000000],['Middle East and Africa','AED 200000','AED',400000],['Southeast Asia','S$60000','SGD',250000],['United Kingdom','£45000','GBP',180000],['United States','$90000','USD',240000],['Western Europe','€50000','EUR',200000]];
for(const [geo,price,currency,S]of geos)test(`R1 chat exact, same meaning and opposite in ${geo}`,()=>{
 for(const known_metrics of [`5 customers at ${price}; finance accepts 18 months; 70% gross margin; sales cycle of 5 months; win rate 25%; start Jan 2027; financial year starts April`,`we expect 5 new logos at ${price} ACV; payback within 18 months; gross margin 70%; cycle 5 months; 25% win rate; starting January; FY starts April`,`target 5 new clients; ACV of ${price}; 18 month payback limit; margin 70; sales cycle of 5; win rate 25; start January 2027; financial year starts April`]){
  const args=a({your_solution:`an ABM programme in ${geo}`,solution_price:S,known_metrics});const input=readFundingInputs(args,clock);assert.equal(input.N,5,known_metrics);assert.equal(input.L,18);assert.equal(input.G,70);assert.equal(input.C,5);assert.equal(input.W,25);assert.equal(input.start,'2027-01');assert.equal(input.fy,4);assert.equal(input.currency,currency);assert.equal(input.spendCurrencyFromText,true);assert.equal(input.error,'');
  const P=12*S/(input.N*input.A),o=buildRoiFunding(args,clock);assert.match(o,new RegExp('^Pays back in '+P.toFixed(1).replace('.','\\.')+' months'));assert.match(o,/currency taken from your text/);assert.doesNotMatch(o,/in the currency you used/);assert.equal(o,buildRoiFunding(args,clock));
 }
 for(const known_metrics of [`we have 120 customers; ARR per customer ${price}`,'40 target accounts','225 meetings last quarter']){const i=readFundingInputs(a({known_metrics}),clock);assert.equal(i.N,undefined);assert.doesNotMatch(buildRoiFunding(a({known_metrics}),clock),/^Pays back/);}
 for(const known_metrics of [`5 new customers; ARR per customer ${price}`,`5 new customers; each pays ${price} a year`,`5 new customers; annual revenue per customer: ${price}`])assert.ok(readFundingInputs(a({known_metrics}),clock).A>0,known_metrics);
});
test('R1 all rupee marks and crore units inherit the bare schema spend',()=>{
 for(const price of ['Rs 30 lakh','INR 30,00,000','₹30 lakh','Rs 0.3 crore']){const i=readFundingInputs(a({known_metrics:`5 customers at ${price}`}),clock);assert.equal(i.currency,'INR');assert.equal(i.A,30*1e5);assert.equal(i.error,'');}
 const yearOnly=readFundingInputs(a({known_metrics:'5 customers at Rs 30 lakh; financial year starts April'}),clock);assert.equal(yearOnly.start,clock().toISOString().slice(0,7));
});
test('R1 two currencies refuse a ratio but never overrule the brand or purchase headline',()=>{
 const metrics='5 new customers at $90000 ACV; spend is GBP 240000';
 assert.match(buildRoiFunding(a({known_metrics:metrics}),clock),/^Check your figures: spend and revenue/);
 for(const [your_solution,headline]of [['brand awareness in Dubai','Not a payback decision'],['sales engagement platform','Break-even only']]){const o=buildRoiFunding(a({your_solution,known_metrics:metrics}),clock);assert.ok(o.startsWith(headline));assert.doesNotMatch(o,/Passes|would take \d+ new customers|Required new customers/);}
});
test('R1 paid channel scope and the four night-review sentences are demand programmes',()=>{
 const sentences=['A cybersecurity firm in Dubai wants to fund events in the Gulf','Events in the Gulf for our cybersecurity product','LinkedIn campaign for CFOs at UK fintechs','A paid LinkedIn programme for UK fintech buyers'];
 for(const channel of ['LinkedIn','Google','Meta'])for(const word of ['programme','campaign','ads'])sentences.push(`a paid ${channel} ${word} for our software platform`);
 for(const your_solution of sentences){assert.equal(roiInScope({your_solution}),true,your_solution);assert.equal(classifyFunding(your_solution).kind,'direct',your_solution);assert.match(buildRoiFunding(a({your_solution}),clock),/^Pays back/,your_solution);}
 assert.equal(buildRoiFunding(a({your_solution:'a data warehouse'}),clock),ROI_SCOPE_DECLINE);
});
test('R1 people stay programmes while explicit purchases stay purchases',()=>{
 for(const phrase of ['outbound SDR and sales engagement programme','BDR sales engagement team','sales development and sequencing programme','appointment setting and sales engagement programme'])assert.equal(classifyFunding(phrase).kind,'direct',phrase);
 for(const phrase of ['sales engagement platform','sales enablement for an SDR programme','outbound SDR programme and sales engagement software','BDR team with sequencing licences','sales engagement seats for the SDR team']){assert.equal(classifyFunding(phrase).kind,'enabler',phrase);assert.doesNotMatch(buildRoiFunding(a({your_solution:phrase}),clock),/Passes/);}
 assert.equal(classifyFunding('Sponsoring a trade show booth in London').kind,'direct');
});
test('R1 read-back exposes refinements, counts sit by sensitivity and both recovery bases are named',()=>{
 const args=a({known_metrics:a().known_metrics+'; margin=40; cycle_months=3; win_rate=25; fy_start=4'}),o=buildRoiFunding(args,clock),P=12*args.solution_price/(5*3000000),Pg=P/(40/100),required=Math.ceil(12*args.solution_price/12/3000000);
 for(const line of ['Gross margin: 40 percent','First touch to signed deal: 3 months','Win rate: 25 percent','Financial year starts: April','Spend starts: 2026-11'])assert.ok(o.includes(line));
 assert.ok(o.indexOf('Customers that must close')<o.indexOf('### What I read'));assert.ok(o.indexOf('Required opportunities')<o.indexOf('### What I read'));
 assert.ok(o.includes(`Customers that must close for this to pass: ${required} of the ${5} you expect.`));assert.ok(o.includes(`Months to recovery on revenue: ${(3+P).toFixed(1)}`));assert.ok(o.includes(`Months to recovery on gross margin: ${(3+Pg).toFixed(1)}`));
});
test('R1 roles fit the answer and seller copy is absent',()=>{
 const checks=[['an ABM programme',a().known_metrics,['CMO','Demand generation head','Founder','CRO','CFO']],['brand awareness',a().known_metrics,['CMO','Founder','CFO']],['sales engagement platform',a().known_metrics,['Founder','CRO']],['an ABM programme','helix-roi-v1; currency=INR',['Founder','CRO']]];
 for(const [your_solution,known_metrics,roles]of checks){const o=buildRoiFunding(a({your_solution,known_metrics}),clock);assert.deepEqual([...o.matchAll(/^(CMO|Demand generation head|Founder|CRO|CFO):/gm)].map(m=>m[1]),roles);assert.doesNotMatch(o,/What you sell|Implementation|ROI >100|3x|benchmark set|buyer's CFO|from this branch/i);}
 const invalid=buildRoiFunding(a({solution_price:-1}),clock);assert.doesNotMatch(invalid,/^(?:CMO|Founder|CRO|CFO|Demand generation head):/m);
});
test('R1 allowed source names are restored and remain behind their switches',()=>{
 const o=buildRoiFunding(a({known_metrics:a().known_metrics+'; margin=70'}),clock);assert.match(o,/Bessemer Venture Partners/);assert.ok(o.indexOf('Bessemer Venture Partners')>o.indexOf('### How this is worked out'));
});
test('R1 current MCP call accepts a bare spend with one currency in text',async()=>{
 const result=await createServer()._requestHandlers.get('tools/call')({method:'tools/call',params:{name:'roi_business_case_builder',arguments:a({your_solution:'an ABM programme in the United States',solution_price:240000,known_metrics:'5 customers at $90000 ACV, finance accepts 18 months'})}});assert.match(result.content[0].text,/^Pays back/);assert.match(result.content[0].text,/Spend: \$240,000 \(currency taken from your text\)/);
});
