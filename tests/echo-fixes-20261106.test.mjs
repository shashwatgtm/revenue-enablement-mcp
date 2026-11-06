// Echo fixes, 6 Nov 2026. Each pair is the base and changed input of one echo finding (tests/fixtures/echo-pairs-20261106.json,
// taken from ECHO-INPUTS.md). The changed run must differ in a conclusion, score, ranking or recommended action that follows
// from the change, not only in echoed words. Deterministic: the same input gives the same output.
// Run: node --no-warnings --test tests/echo-fixes-20261106.test.mjs  (after npm run build)
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {default:handler}=await import('../netlify/functions/mcp.mjs');
const pairs=JSON.parse(readFileSync(new URL('./fixtures/echo-pairs-20261106.json',import.meta.url),'utf8'));
const row=n=>pairs.find(p=>p.row===n);
const call=async(tool,args)=>{
 const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:tool,arguments:args}})}));
 const j=await r.json();assert.ok(j.result&&j.result.content,JSON.stringify(j).slice(0,300));assert.ok(!j.result.isError,j.result.content[0].text.slice(0,300));
 return j.result.content.map(c=>c.text).join('\n');
};
const run=async n=>{const p=row(n);return {base:await call(p.tool,p.base),changed:await call(p.tool,p.changed),p};};
const noDashes=t=>{assert.ok(!/[—–]/.test(t),'em or en dash in output');assert.ok(!/ - /.test(t.replace(/\n\s*- /g,'\n')),'spaced hyphen used as a dash');};
const section=(t,start,end)=>{const a=t.indexOf(start);assert.ok(a>=0,'missing '+start);const b=end?t.indexOf(end,a+start.length):-1;return t.slice(a,b<0?undefined:b);};

test('Row 1: a procurement reader gets procurement concerns, not the vendor risk body with a new name',async()=>{
 const {base,changed}=await run(1);
 const sc=section(changed,'## Reader view: Head of Procurement','\n## Summary');
 for(const w of [/termination/i,/exit/i,/renewing|price against/i,/due diligence/i,/commercial terms/i])assert.match(sc,w);
 assert.match(changed,/Ask Head of Procurement for the vendor onboarding checklist/);
 assert.match(changed,/\*\*The ask to Head of Procurement:\*\*/);
 const sb=section(base,'## Reader view: Head of Vendor Risk','\n## Summary');
 assert.match(sb,/materiality|outsourcing/i);assert.match(base,/outsourcing risk questionnaire/);
 assert.doesNotMatch(sb,/termination rights/i);assert.doesNotMatch(sc,/outsourcing risk questionnaire/);
 // Not only the name: the two texts still differ after the reader name is neutralised.
 const norm=t=>t.replace(/Head of (?:Vendor Risk|Procurement)/g,'X');
 assert.notEqual(norm(base),norm(changed));
 assert.notEqual(sb.replace(/Head of Vendor Risk/g,'X'),sc.replace(/Head of Procurement/g,'X'));
 noDashes(changed);
});

test('Row 2: new loss and refusal objections change the objection handling and the next step',async()=>{
 const {base,changed}=await run(2);
 const q=section(changed,'## Questions you may have','\n## Objections and the next step');
 assert.match(q,/### who holds the call recordings/);
 assert.match(q,/recordings and transcripts/);assert.match(q,/retention period/);
 assert.match(q,/### whether the voice agent meets the lender's call hours and retention rules/);
 assert.match(q,/calling windows/);assert.match(q,/compliance owner/);
 assert.doesNotMatch(changed,/why not stay with the call centre/);assert.doesNotMatch(changed,/usage costs could grow without limit/);
 assert.doesNotMatch(changed,/price depends on what you use/);
 assert.match(base,/price depends on what you use/);assert.doesNotMatch(base,/recordings and transcripts/);
 const nextOf=t=>(t.match(/\*\*Recommended next step:\*\*[^\n]*/)||[''])[0];
 assert.ok(nextOf(changed)&&nextOf(base)&&nextOf(changed)!==nextOf(base));
 assert.match(nextOf(changed),/data terms|recordings/);
 assert.match(changed,/\*\*If the answer is no:\*\*/);
 // The stakeholder block still reflects the CFO reader.
 assert.match(changed,/## Reader view: CFO/);
 noDashes(changed);
});

test('Row 3: a close date three months earlier flags schedule risk, names the critical path and what to cut',async()=>{
 const {p}=await run(3);
 // The dates in ECHO-INPUTS.md are 175 and 84 days from 6 Nov 2026. Keep the same offsets from today so the test does not age.
 const day=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
 const base=await call(p.tool,{...p.base,target_close_date:day(175)});
 const changed=await call(p.tool,{...p.changed,target_close_date:day(84)});
 const sc=section(changed,'## Schedule risk against the close date','\n## Key Stakeholders');
 assert.match(sc,/the date is at risk/);assert.match(sc,/short by 4 weeks/);
 assert.match(sc,/Critical path:[^\n]*materiality[^\n]*committee|Critical path:[^\n]*security[^\n]*materiality/is);
 for(const w of [/materiality/i,/security/i,/committee/i])assert.match(sc.match(/\*\*Critical path:\*\*[^\n]*/)[0],w);
 assert.match(sc,/Steps that no longer fit/);assert.match(sc,/What to cut or run in parallel/);
 assert.match(sc,/Cut the masked data test to one flow/);assert.match(sc,/Book the committee date now/);
 const sb=section(base,'## Schedule risk against the close date','\n## Key Stakeholders');
 assert.match(sb,/the date holds only if steps run in parallel/);assert.doesNotMatch(sb,/the date is at risk/);
 noDashes(changed);
});

test('Row 5: a signed quote gives the direction, the gap, and a recommendation with a walk away point',async()=>{
 const {base,changed}=await run(5);
 assert.match(changed,/## Situation: Competitor has lower price\n/);
 assert.match(changed,/4\.5 cents a minute/);assert.match(changed,/Theirs is lower by 1\.5 cents a minute, a third less/);
 assert.match(changed,/\$36,000 a year/);assert.match(changed,/\*\*Recommendation: hold on value and trade terms\. Do not match\.\*\*/);
 assert.match(changed,/\*\*Walk away point:\*\*/);assert.match(changed,/Hold on value/);assert.match(changed,/Trade terms/);assert.match(changed,/Match:/);
 assert.doesNotMatch(changed,/Price direction is not clear/);
 // Without a signed quote the answer is indicative and asks for the signed quote.
 assert.match(base,/indicative, no signed quote/);assert.match(base,/ask for the signed quote/);assert.doesNotMatch(base,/\$36,000/);
 assert.doesNotMatch(base,/Do not match/);
 noDashes(changed);
});

test('Row 5: with no volume, the direction still comes from the unit prices and the annual gap names its input',async()=>{
 const p=row(5);
 const t=await call(p.tool,{...p.changed,competitor_price:'A signed written quote from the rival at 3.0 cents a minute, telephony included',value_delivered:'Illustrative, buyer team estimate: the outsourced call centre would cost about $192,000 a year',your_leverage:'Our committed rate is 4.5 cents a minute and includes telephony and the platform fee'});
 assert.match(t,/Theirs is lower by 1\.5 cents a minute, a third less/);
 assert.match(t,/The annual gap needs the yearly volume: give it in value_delivered or competitor_price/);
 assert.doesNotMatch(t,/\$36,000/);
 const none=await call(p.tool,{...p.changed,competitor_price:'A signed written quote from the rival at 3.0 cents a minute, telephony included',value_delivered:'Illustrative, buyer team estimate: the outsourced call centre would cost about $192,000 a year'});
 assert.match(none,/Price direction is not clear/);assert.match(none,/value_delivered or competitor_price/);
});

test('Row 7: the persona changes the angle, the asks, the proof framing and the subjects across the sequence',async()=>{
 const {base,changed}=await run(7);
 const subs=t=>[...t.matchAll(/\*\*Subject:\*\* ([^\n]*)/g)].map(m=>m[1]);
 const sb=subs(base),sc=subs(changed);
 assert.equal(sb.length,5);assert.equal(sc.length,5);
 let differ=0;for(let i=0;i<5;i++)if(sb[i]!==sc[i])differ++;
 assert.ok(differ>=4,`subjects that differ: ${differ}`);
 assert.match(changed,/What after-hours internet leads costs the group/);
 assert.match(changed,/the question is profit, not tools/);assert.match(changed,/rooftops/);
 assert.match(changed,/A one line reply is enough/);assert.doesNotMatch(base,/A one line reply is enough/);
 assert.match(changed,/the figure to weigh is where peers are putting their money/);assert.doesNotMatch(base,/where peers are putting their money/);
 assert.match(changed,/what is one of them worth to the group/);
 assert.match(changed,/## How this sequence is angled for Dealer Principal/);
 assert.match(base,/who picks it up/);
 noDashes(changed);
});

test('Row 8: procurement and c_suite get different order, emphasis and asks',async()=>{
 const {base,changed}=await run(8);
 const order=['### Price structure and total cost over the term','### Compliance and data','### Contract terms and exit','### Comparison points','### What we ask of procurement'].map(h=>changed.indexOf(h));
 assert.ok(order.every(i=>i>0),JSON.stringify(order));assert.deepEqual([...order].sort((a,b)=>a-b),order);
 assert.match(changed,/Rs 40 lakh \+ 3 x Rs 1\.2 crore = Rs 4 crore/);assert.match(changed,/an example term, replace it with the contract term/);
 assert.match(changed,/data stored in India and a full audit trail/);assert.match(changed,/Termination rights/);assert.match(changed,/reference/i);
 assert.doesNotMatch(changed,/### Our Recommendation/);assert.doesNotMatch(changed,/### Expected Outcomes/);
 assert.match(base,/### The Opportunity/);assert.match(base,/### Expected Outcomes/);
 assert.match(base,/### The decision we ask for/);assert.doesNotMatch(changed,/### The decision we ask for/);
 assert.doesNotMatch(base,/### Price structure and total cost over the term/);
 assert.ok(base.indexOf('### Investment Overview')>base.indexOf('### Expected Outcomes'),'c_suite keeps outcomes before the investment');
 assert.equal((changed.match(/## Proposal for the Bank/g)||[]).length,1);
 noDashes(changed);
});

test('Row 9: the weeks drive the phase table, so 20 weeks ends at week 20 and the extra weeks are explained',async()=>{
 const {base,changed}=await run(9);
 assert.match(changed,/The plan runs 20 weeks and goes live in week 20/);
 for(const w of ['Weeks 1 to 2','Weeks 3 to 10','Weeks 11 to 16','Weeks 17 to 20'])assert.ok(changed.includes(`(${w})`),w);
 assert.doesNotMatch(changed,/Weeks 1-2|Weeks 3-6|Weeks 7-10|Weeks 11-12/);
 assert.match(changed,/Phase 3: Security review and user acceptance testing/);
 assert.match(changed,/\*\*First value date:\*\* not before week 20/);assert.match(changed,/first reading in week 24/);
 assert.match(base,/The plan runs 14 weeks and goes live in week 14/);
 for(const w of ['Weeks 1 to 2','Weeks 3 to 8','Weeks 9 to 12','Weeks 13 to 14'])assert.ok(base.includes(`(${w})`),w);
 assert.match(base,/first reading in week 18/);
 noDashes(changed);
});

test('Row 9: with only a go live week, the phases are scaled to it',async()=>{
 const p=row(9);
 const t=await call(p.tool,{...p.changed,implementation_approach:'Illustrative: go-live in week 20'});
 assert.match(t,/The plan runs 20 weeks and goes live in week 20/);
 assert.match(t,/\(Weeks 17 to 20\)|\(Weeks 18 to 20\)|\(Weeks 19 to 20\)/);
 assert.match(t,/scaled from the go live week/);
});

test('Same input, same output',async()=>{
 const p=row(7);
 assert.equal(await call(p.tool,p.changed),await call(p.tool,p.changed));
});
