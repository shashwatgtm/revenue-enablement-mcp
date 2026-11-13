import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/mcp.mjs';
const cases=JSON.parse(readFileSync(new URL('./fixtures/round5-reader-cases.json',import.meta.url),'utf8'));
for(const c of cases)test('Round 5 reader contract: '+c.tool,async()=>{
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:c.tool,arguments:c.args}})}));
 const r=(await response.json()).result;assert.ok(r&&!r.isError);
 const text=r.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
  if(c.tool==='roi_business_case_builder') {
    assert.match(text,/### What I read/);
    assert.match(text,/A calculation on your inputs. Not a forecast/);
    assert.doesNotMatch(text,/Passes|Does not pass|new ARR/);
    for(const role of ['CMO','Demand generation head','Founder','CRO','CFO']) assert.match(text,new RegExp('(?:^|\\n)'+role+':'));
    return;
  }
 assert.match(text,/## Reading the answer/);
 assert.match(text,/The conclusion needs review if|Change scope if/);
 for(const role of ['Founder','CEO','CMO','CRO','Demand generation head'])assert.match(text,new RegExp('(?:^|\\n)'+role+':'));
 assert.doesNotMatch(text,/_{3,}|icp firmographics\.(?:industries|company sizes|locations)|\[(?:Your name|Competitor A|YOUR WHITESPACE|target customer)\]/);
});


test('Round 5: a high rule score does not establish buyer engagement',async()=>{
 const args={deal_name:'Alert triage evaluation',deal_stage:'proposal',champion_status:'confirmed_champion',economic_buyer:'CISO has not attended a meeting',your_solution:'Alert triage software'};
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'deal_strategy_coach',arguments:args}})}));
 const r=(await response.json()).result;assert.ok(!r.isError);const text=r.content[0].text;
 assert.match(text,/Health Score: 85\/100 \(Buyer engagement unconfirmed\)/);
 assert.doesNotMatch(text,/\(Healthy\)|\*\*Advance the deal\*\*/);
 assert.match(text,/Confirm the decision maker, participation and acceptance conditions/);
});

test('Missing email sender is disclosed outside the draft instead of a fill in signature',async()=>{
 const c=cases.find(x=>x.tool==='email_sequence_generator');const args={...c.args};delete args.sender_context;
 const response=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:c.tool,arguments:args}})}));
 const result=(await response.json()).result;assert.ok(result&&!result.isError);const text=result.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');
 assert.doesNotMatch(text,/\(Add your name and role before sending\.\)/);
 assert.match(text.split('To sharpen this, give:')[1],/sender context/);
});
