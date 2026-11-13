import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {readFundingMoney,buildRoiFunding,fundingMoney} from '../src/roi-funding.ts';
import {parseHTML} from 'linkedom';
import {PAGE_TITLE,PAGE_HEADING} from '../src/roi-funding-config.ts';
import '../public/assets/roi-funding.js';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('one money list reads identically on the page and server',()=>{
 for(const value of JSON.parse(read('./fixtures/roi-funding-money-20261113.json')))for(const currency of ['','INR','USD','GBP','EUR','AED','SGD'])assert.deepEqual(globalThis.HelixFunding.money(value,currency),readFundingMoney(value,currency),value);
});
test('static page has the funding questions, metadata, example and routes without JavaScript',()=>{
 const html=read('../public/tools/roi-business-case-builder/index.html');
 assert.equal(parseHTML(html).document.querySelectorAll('#currency option').length,6);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(html.includes(PAGE_TITLE));assert.ok(html.includes(PAGE_HEADING));assert.match(html,/No email. Your figures are not stored/);assert.match(html,/id="result-panel"/);assert.match(html,/Example. Illustrative inputs/);assert.match(html,/share\.png/);assert.doesNotMatch(html,/Industry benchmarks|Financial_Services|Healthcare|Manufacturing|route planning|\bLTV\b|[\u2013\u2014]/i);assert.match(html,/<details><summary>Sharpen it/);assert.doesNotMatch(html,/<details open/);
 const raw=JSON.parse(html.match(/id="example-output" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 const args={your_solution:'A Series B AI native firm in Hyderabad wants to fund an ABM programme for 40 target accounts in India',solution_price:9000000,primary_value_driver:'revenue_increase',known_metrics:'helix-roi-v1; customers=5; per_customer=3000000; limit_months=12; margin=70; cycle_months=5; start=2026-11; currency=INR'};
 assert.equal(raw,buildRoiFunding(args,()=>new Date('2026-11-13T00:00:00Z')));
 const png=fs.readFileSync(new URL('../public/tools/roi-business-case-builder/share.png',import.meta.url));assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
});
test('rendering escapes caller markup and input line parsing is reversible',()=>{
 assert.doesNotMatch(globalThis.HelixFunding.markdown('<img src=x onerror=alert(1)>'),/<img/);
 assert.deepEqual(globalThis.HelixFunding.parseLine('helix-roi-v1; spend=90 lakh; customers=5'),{spend:'90 lakh',customers:'5'});
 assert.throws(()=>globalThis.HelixFunding.parseLine('not a saved line'));
});
test('a hundred outputs contain only input, computed or sourced rule numbers',()=>{
 const clock=()=>new Date('2026-11-13T00:00:00Z');
 for(let k=0;k<100;k++){
  const S=100000+k*1000,N=5+k%6,A=50000+k*500,L=12,G=70,C=5,W=20,R=N*A,P=12*S/R,required=Math.ceil(12*S/L/A);
  const a={your_solution:'an ABM programme in India',solution_price:S,primary_value_driver:'revenue_increase',known_metrics:`helix-roi-v1; customers=${N}; per_customer=${A}; limit_months=${L}; margin=${G}; cycle_months=${C}; win_rate=${W}; currency=INR; start=2026-11`};
  let output=buildRoiFunding(a,clock);
  // Sourced notes and stated rules have their own attribution, audited separately.
  output=output.split('\n').filter(l=>!/^Rules of this tool:|^At 90 days|^A US venture investor|^Source:|^Spend starts in FY|^Recovery =|^Required annual revenue =|^CAC =|^How|^Which/.test(l)).join('\n');
  const allowed=[S,N,A,L,G,C,W,R,S/N,P,P/(G/100),C+P,12*S/L,required,Math.ceil(required/(W/100)),.5*R,1.5*R,2*P,P/1.5].flatMap(v=>[String(v),v.toFixed(1),fundingMoney(v,'INR'),fundingMoney(v,'INR',false)]);
  const tokens = value => value.match(/(?<![\w])\d[\d,]*(?:\.\d+)?/g)||[];
  const allowedTokens = new Set(allowed.flatMap(tokens));
  for (const token of tokens(output)) assert.ok(allowedTokens.has(token), `unattributed number ${token} in run ${k}`);

 }
});
