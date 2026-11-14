import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildRoiFunding,readFundingInputs,readFundingMoney,fundingGeo} from '../src/roi-funding.ts';
import {readFundingChat} from '../src/roi-funding-chat.ts';
import '../public/assets/roi-funding.js';
const now=()=>new Date('2026-11-13T00:00:00Z');
const geos=['India','Middle East and Africa','Southeast Asia','United Kingdom','United States','Western Europe'];
const input=(known_metrics,geo='United States',extra={})=>({your_solution:`an ABM programme in ${geo}`,solution_price:300000,primary_value_driver:'revenue_increase',known_metrics,...extra});
const n2=['we need to break even in 9 months','must recover the spend in 9 months','payback target of 9 months','finance needs it back in 9 months'];
for(const geo of geos)test(`R2 limit exact, same meaning and opposites in ${geo}`,()=>{
 const phrases=[...n2,...['payback','break even','recover the spend','back','target','limit'].flatMap(noun=>['in','within','inside','by','under'].map(prep=>`${noun} ${prep} 9 months`)), '9 month payback limit'];
 for(const phrase of phrases){const a=input(`4 new customers at $90k ACV; ${phrase}`,geo),i=readFundingInputs(a,now),o=buildRoiFunding(a,now);assert.equal(i.L,9,phrase);assert.equal(i.limitGiven,true);assert.match(o,/^Pays back in 10\.0 months\. Over your limit/);assert.doesNotMatch(o.split('\n')[0],/Passes/);assert.equal(o,buildRoiFunding(a,now));}
 for(const phrase of n2){const o=buildRoiFunding(input(`4 new customers at $90k ACV; not ${phrase}`,geo),now);assert.match(o,/^Not decided yet: which is your payback limit\?/);assert.match(o,/I read '9 months' but not what it is/);assert.doesNotMatch(o,/Passes|\| Case \|/);}
 for(const phrase of ['review again in 9 months','payback within 12 months; review again in 12 months','payback within 9 months; payback within 18 months']){const o=buildRoiFunding(input(`4 new customers at $90k ACV; ${phrase}`,geo),now);assert.match(o,/^Not decided yet: which is your payback limit/);assert.doesNotMatch(o,/Passes|\| Case \|/);}
});
for(const geo of geos)test(`R2 count exact, same meaning and opposites in ${geo}`,()=>{
 for(const noun of ['customers','clients','logos','deals','wins','accounts won'])for(const prefix of ['','new '])for(const quantity of ['4','four']){
  const a=input(`${quantity} ${prefix}${noun}; $90k per customer (per year); payback target of 9 months`,geo),i=readFundingInputs(a,now);assert.equal(i.N,4);assert.equal(i.A,90000);assert.match(buildRoiFunding(a,now),/^Pays back in 10\.0 months\. Over/);
 }
 for(const phrase of ['we have 120 customers','we have thirty customers','40 target accounts','225 meetings']){const a=input(`${phrase}; ACV $90k`,geo);assert.equal(readFundingInputs(a,now).N,undefined);assert.doesNotMatch(buildRoiFunding(a,now),/Passes/);}
 const unread=buildRoiFunding(input('4 customers at $90k ACV; 7 clients; limit 12 months',geo),now);assert.match(unread,/^Not decided yet: how many new customers/);assert.match(unread,/I read '7 clients' but not what it is/);assert.doesNotMatch(unread,/Passes|\| Case \|/);
});
test('R2 N1 buyer table, word counts and recognised timing',()=>{
 for(const [phrase,N,A]of [['30 customers, $40k each',30,40000],['30 customers, ACV of $40,000',30,40000],['30 deals at $40k ACV',30,40000],['thirty new customers',30,undefined],['four new customers',4,undefined],['30 new customers, $40k per customer per year',30,40000],['2 new customers, ARR 45 lakh each',2,45*1e5]]){const i=readFundingInputs(input(phrase),now);assert.equal(i.N,N,phrase);assert.equal(i.A,A,phrase);}
 assert.equal(readFundingInputs(input('4 new customers; total ARR $360k'),now).A,undefined);
 const words='one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety'.split(' '),values=[...Array.from({length:20},(_,i)=>i+1),30,40,50,60,70,80,90];
 words.forEach((word,j)=>assert.equal(readFundingChat(`${word} new customers`,now()).customers,values[j]));
 const i=readFundingInputs(input('we have 120 customers; 4 new customers at $90k ACV; cycle 2 months; starting in 3 months; payback within 12 months'),now);assert.deepEqual(i.unreadMonths,[]);assert.equal(i.C,2);assert.equal(i.start,'2027-02');assert.match(buildRoiFunding(input('4 new customers at $90k ACV; sales cycle nine months; payback within 12 months'),now),/^Pays back/);
});
test('R2 implicit INR, explicit currencies and immediate page echoes',()=>{
 for(const value of ['45 lakh','1.5 crore'])for(const currency of ['','USD']){assert.equal(readFundingMoney(value,currency).currency,'INR');assert.deepEqual(globalThis.HelixFunding.money(value,currency),readFundingMoney(value,currency));}
 const i=readFundingInputs(input('2 new customers, ARR 45 lakh each','India',{solution_price:5000000}),now);assert.equal(i.currency,'INR');assert.equal(i.A,45*1e5);const o=buildRoiFunding(input('2 new customers, ARR 45 lakh each','India',{solution_price:5000000}),now);assert.match(o,/Spend: Rs 50 lakh/);assert.match(o,/What one pays a year: Rs 45 lakh/);
 const ui=globalThis.HelixFunding;for(const [raw,code]of [['90 lakh','INR'],['Rs 90 lakh','INR'],['INR 9000000','INR'],['₹9000000','INR'],['$90k','USD'],['£90k','GBP'],['€90k','EUR'],['AED 90k','AED'],['S$90k','SGD']])assert.equal(ui.money(raw).currency,code);
 assert.equal(ui.moneyEcho(ui.money('90 lakh')),'Read as Rs 90 lakh');assert.equal(ui.moneyEcho(ui.money('9000000')),'Choose a currency to read 9,000,000');
});
test('R2 absurd figures expose arithmetic without a funding verdict or table',()=>{
 for(const metrics of ['helix-roi-v1; customers=1; per_customer=5000; currency=USD; limit_months=12','1 customer at $5k ACV; limit 12 months']){const o=buildRoiFunding(input(metrics,'United States',{solution_price:50*1e6}),now);assert.match(o,/^Check your figures: this says the spend comes back in more than 10 years\./);assert.match(o,/Arithmetic only: CAC \$50,000,000; payback 120000\.0 months/);assert.doesNotMatch(o,/Passes|\| Case \||Required new customers:/);assert.match(globalThis.HelixFunding.resultView(o).summaryHTML,/Arithmetic only/);}
 // The count threshold can fire below ten years; its message must remain true.
 const count=buildRoiFunding(input('helix-roi-v1; customers=1; per_customer=12000; currency=USD; limit_months=1','United States',{solution_price:110000}),now);assert.match(count,/^Check your figures: this needs more than 100 times/);assert.doesNotMatch(count,/more than 10 years|Passes|\| Case \|/);
 const edge=buildRoiFunding(input('helix-roi-v1; customers=1; per_customer=12000; currency=USD; limit_months=12','United States',{solution_price:120000}),now);assert.doesNotMatch(edge,/^Check your figures/);
});
test('R2 brand is one coverage line; differing margin results share the headline',()=>{
 const brand=buildRoiFunding(input('helix-roi-v1; customers=5; per_customer=200000; currency=AED','Middle East and Africa',{your_solution:'Analyst relations in Dubai',solution_price:400000}),now);assert.equal((brand.match(/For scale only:/g)||[]).length,1);assert.match(brand,/would take 2 new customers at what one pays you/);
 const S=7500000,N=3,A=6000000,G=32,P=12*S/(N*A),Pg=P/(G/100);const o=buildRoiFunding(input(`helix-roi-v1; customers=${N}; per_customer=${A}; currency=INR; margin=${G}; limit_months=12`,'India',{solution_price:S}),now);assert.equal(o.split('\n')[0],`Passes on revenue (${P.toFixed(1)} months). Over your limit on gross margin (${Pg.toFixed(1)} months).`);
});
test('R2 missing figures route by programme, then booking; Western European words are read',()=>{
 for(const [subject,route]of [['an ABM programme','Prioritise the accounts'],['a paid media programme','Scale Paid check'],['an outbound SDR programme','Score the audience']]){const o=buildRoiFunding(input('helix-roi-v1; currency=USD','United States',{your_solution:subject}),now),routes=o.split('### Routes')[1];assert.match(routes,new RegExp('^\\n\\['+route+'\\]'));assert.match(routes,/\[Book 45 minutes\]/);assert.doesNotMatch(routes,/Size the market/);}
 for(const name of ['Netherlands','Dutch','Germany','German','France','French','Spain','Spanish','Ireland','Irish','Belgium','Austria','Switzerland','Portugal','Italy'])assert.equal(fundingGeo({your_solution:`paid media for ${name} buyers`},'','EUR'),'Western Europe');
});
