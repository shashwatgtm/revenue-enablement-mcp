import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPortfolioDeals } from '../src/portfolio-outcomes.ts';
import handler from '../netlify/functions/mcp.mjs';
import { CASES } from './winloss-count-fix-cases.mjs';
async function call(input, mode = 'deal_portfolio') {
 const response = await handler(new Request('https://example.com/mcp', { method:'POST', headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'win_loss_analyzer',arguments:{analysis_type:mode,multiple_deals:input,your_solution:'Invoice approval workflow'}}}) }));
 const j=await response.json(); assert.ok(j.result); return j.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');
}
for (const c of CASES) test(`portfolio outcome count: ${c.id}`, async()=>{
 const rows=readPortfolioDeals(c.input), n={total:rows.length,won:0,lost:0,nd:0,open:0}; rows.forEach(r=>n[r.outcome]++); assert.deepEqual(n,c.expected);
 for(const mode of ['deal_portfolio','loss_pattern']) {
  const t=await call(c.input,mode); assert.equal(t,await call(c.input,mode),'identical repeat');
  assert.match(t,/Outcome rule: a stated won or lost outcome takes precedence over its reason/);
  if(!n.total) { assert.match(t,/No deals were listed, so there is nothing to count/); continue; }
  assert.ok(t.includes(`You listed ${n.total} deal${n.total===1?'':'s'}: ${n.won} won, ${n.lost} lost, ${n.nd} no decision`));
  if(n.open) assert.ok(t.includes(`${n.open} open`));
  if(n.won+n.lost) assert.ok(t.includes(`Of the ${n.won+n.lost} deals marked won or lost, ${n.won} ${n.won===1?'was':'were'} won.`));
  const losses=n.lost+n.nd;
  if(losses) assert.ok(t.includes(`${losses===1?'One line is':`${losses} lines are`} lost or undecided.`));
 }
});
test('same meaning preserves counts; opposite outcome changes counts without reading the reason',()=>{
 const read=s=>readPortfolioDeals(s).map(r=>r.outcome);
 assert.deepEqual(read('Deal A,lost,reason: no decision'),read('Deal A: lost'));
 assert.deepEqual(read('Deal A,won,reason: no decision'),['won']);
 assert.deepEqual(read('Deal A,no decision,reason: awaiting approval'),['nd']);
 assert.deepEqual(read('A note about a deal that was not won\nReason: lost budget'),[]);
});
