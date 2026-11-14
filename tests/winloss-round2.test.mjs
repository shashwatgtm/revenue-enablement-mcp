import { test } from 'node:test';import assert from'node:assert/strict';
import handler from'../netlify/functions/mcp.mjs';import{readPortfolioDeals}from'../src/portfolio-outcomes.ts';import{ROUND2_CASES}from'./winloss-round2-cases.mjs';
export async function call(input,mode){const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json,text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'win_loss_analyzer',arguments:{analysis_type:mode,multiple_deals:input,your_solution:'Invoice approval workflow'}}})}));const j=await r.json();assert.ok(j.result&&!j.result.isError);return j.result.content.filter(x=>x.type==='text').map(x=>x.text).join('\n');}
for(const c of ROUND2_CASES)test(`round 2 row and outcome class: ${c.id}`,async()=>{
 const rows=readPortfolioDeals(c.input),n={total:rows.length,won:0,lost:0,nd:0,open:0};for(const r of rows)n[r.outcome]++;assert.deepEqual(n,c.expected,'direct parser counts');
 for(const mode of['deal_portfolio','loss_pattern']){const t=await call(c.input,mode);assert.equal(t,await call(c.input,mode),'real MCP repeats byte for byte');
  if(!n.total){if(c.input.trim()){assert.match(t,/I could not read a won, lost, open or no decision outcome on any line\. Write one per deal, for example: Deal A, lost, price\./);assert.doesNotMatch(t,/No deals were listed/);}else assert.match(t,/No deals were listed/);continue;}
  assert.ok(t.includes(`You listed ${n.total} deal${n.total===1?'':'s'}: ${n.won} won, ${n.lost} lost, ${n.nd} no decision`));if(n.open)assert.ok(t.includes(`${n.open} open.`));
  const denominator=n.won+n.lost;if(denominator)assert.ok(t.includes(`Of the ${denominator} deals marked won or lost, ${n.won} ${n.won===1?'was':'were'} won.`));else assert.doesNotMatch(t,/\*\*Win rate on these lines/);
  const losses=n.lost+n.nd;if(losses)assert.ok(t.includes(`${losses===1?'One line is':`${losses} lines are`} lost or undecided.`));else assert.doesNotMatch(t,/\*\*What the lost and undecided lines say/);
 }
});
