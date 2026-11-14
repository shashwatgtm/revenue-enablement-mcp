import{test}from'node:test';import assert from'node:assert/strict';import handler from'../netlify/functions/mcp.mjs';import{readPortfolioDeals}from'../src/portfolio-outcomes.ts';import{ROUND3_CASES}from'./winloss-round3-cases.mjs';
async function call(input,mode){const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json,text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'win_loss_analyzer',arguments:{analysis_type:mode,multiple_deals:input,your_solution:'Invoice approval workflow'}}})}));const j=await r.json();assert.ok(j.result&&!j.result.isError);return j.result.content.filter(c=>c.type==='text').map(c=>c.text).join('\n');}
for(const c of ROUND3_CASES)test(`round 3 prefix, subject and stage class: ${c.id}`,async()=>{
 const rows=readPortfolioDeals(c.input),n={total:rows.length,won:0,lost:0,nd:0,open:0};for(const row of rows)n[row.outcome]++;
 assert.deepEqual(n,c.expected);assert.deepEqual(rows.map(r=>r.outcome),c.outcomes,'each record keeps its own stated outcome');
 for(const mode of['deal_portfolio','loss_pattern']){const t=await call(c.input,mode);assert.equal(t,await call(c.input,mode));if(!n.total){assert.match(t,/I could not read a won, lost, open or no decision outcome on any line/);assert.doesNotMatch(t,/No deals were listed/);continue;}
  assert.ok(t.includes(`You listed ${n.total} deal${n.total===1?'':'s'}: ${n.won} won, ${n.lost} lost, ${n.nd} no decision`));if(n.open)assert.ok(t.includes(`${n.open} open.`));
  const denominator=n.won+n.lost;if(denominator)assert.ok(t.includes(`Of the ${denominator} deals marked won or lost, ${n.won} ${n.won===1?'was':'were'} won.`));else assert.doesNotMatch(t,/\*\*Win rate on these lines/);
  const lost=n.lost+n.nd;if(lost)assert.ok(t.includes(`${lost===1?'One line is':`${lost} lines are`} lost or undecided.`));else assert.doesNotMatch(t,/\*\*What the lost and undecided lines say/);
 }
});
