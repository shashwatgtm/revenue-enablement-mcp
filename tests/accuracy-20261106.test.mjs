// Accuracy fixes, 6 Nov 2026: Job 15b (rw_champion return calculation) and Job 15c (competitor_pricing quote questions and hidden costs).
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {default:handler}=await import('../netlify/functions/mcp.mjs');

const call=async(tool,args)=>{
 const r=await handler(new Request('https://example.com/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:tool,arguments:args}})}));
 const j=await r.json();assert.ok(j.result&&j.result.content,JSON.stringify(j).slice(0,300));assert.ok(!j.result.isError,j.result.content[0].text.slice(0,300));
 return j.result.content.map(c=>c.text).join('\n');
};

test('15b: when key_value_points has an annual figure and budget_context has a price, executive_brief prints the first year return',async()=>{
 const t=await call('champion_enablement_kit',{
  champion_role:'Head of Customer Operations',
  target_stakeholder:'CFO',
  your_solution:'VoiceDesk AI, a voice agent platform for borrower servicing calls',
  key_value_points:'$172,800 a year avoided',
  budget_context:'$108,000',
  asset_type:'executive_brief'
 });
 assert.ok(
  t.includes('From your own figures: $172,800 a year against a price of $108,000, a return of 1.6 times in the first year, before any costs you have not listed.'),
  'new return sentence appears with 1.6 times return'
 );
 assert.ok(
  !t.includes('No return figure is stated here, because none was given.'),
  'old no return sentence does not appear when both figures are given'
 );

 const valueOnly=await call('champion_enablement_kit',{
  champion_role:'Head of Customer Operations',
  target_stakeholder:'CFO',
  your_solution:'VoiceDesk AI, a voice agent platform for borrower servicing calls',
  key_value_points:'$172,800 a year avoided',
  asset_type:'executive_brief'
 });
 assert.ok(
  valueOnly.includes('From your own figures: $172,800 a year; a price is needed for a return.'),
  'when only the value exists, prints the value and says a price is needed for a return'
 );
});

test('15b: when neither annual value nor supported currency format is given, executive_brief keeps the existing noReturn sentence',async()=>{
 const t=await call('champion_enablement_kit',{
  champion_role:'Head of Customer Operations',
  target_stakeholder:'CFO',
  your_solution:'VoiceDesk AI, a voice agent platform for borrower servicing calls',
  key_value_points:'Shorter borrower queues and faster payment reminders across branches',
  budget_context:'$108,000',
  asset_type:'executive_brief'
 });
 assert.ok(
  t.includes('No return figure is stated here, because none was given. Work out the return from our own cost figures and add it.'),
  'existing sentence is unchanged when no annual money figure is given'
 );
 assert.ok(!t.includes('From your own figures:'),'new return line does not appear when condition is absent');
});

test('15c: when competitor_price mentions a signed quote or unit price, questions tie to the quote and unmentioned hidden costs come first',async()=>{
 const quoteLine='A signed written quote from the rival at 3.0 cents a minute, telephony included, for the same 2.4 million minutes a year';
 const t=await call('pricing_negotiation_guide',{
  scenario:'competitor_pricing',
  your_solution:'VoiceDesk AI',
  deal_value:108000,
  discount_requested:15,
  competitor_price:quoteLine,
  value_delivered:'Handles borrower reminder calls across 2.4 million minutes a year',
  your_leverage:'Direct integration with the loan servicing system',
  approval_authority:'VP of Sales'
 });
 assert.ok(t.includes(`1. "On the quote you shared ('${quoteLine}'), what does the signed quote exclude across implementation, support tier, telephony or other add ons it names or omits?"`),'first question quotes the competitor line and asks what the signed quote excludes');
 assert.ok(t.includes('2. "What contract term does that quote require, and what is the renewal price after the initial term?"'),'second question asks about term and renewal price');
 assert.ok(t.includes('3. "What volume or minute commitment sits behind that unit price, and what is the overage rate if usage goes above or below the commitment?"'),'third question asks about volume or minute commitment and overage rate');
 assert.ok(!t.includes('1. "What\'s included in that price? Let\'s compare apples to apples."'),'old generic question 1 does not appear');
 assert.ok(!t.includes('2. "Is that their initial price or after negotiation?"'),'old generic question 2 does not appear');
 assert.ok(!t.includes('3. "What about implementation, training, and support costs?"'),'old generic question 3 does not appear');
 const hiddenIdx=t.indexOf('### Hidden Costs to Surface:');
 assert.ok(hiddenIdx>=0,'Hidden Costs heading exists');
 const hiddenBlock=t.slice(hiddenIdx,t.indexOf('\n---',hiddenIdx));
 const implPos=hiddenBlock.indexOf('Implementation fees (not mentioned in the quote)');
 const supportPos=hiddenBlock.indexOf('Support tiers (not mentioned in the quote)');
 const telPos=hiddenBlock.indexOf('Telephony and platform add ons (mentioned in the quote: confirm scope in writing)');
 assert.ok(implPos>=0&&supportPos>=0&&telPos>=0,'both unmentioned and mentioned items appear in hidden costs');
 assert.ok(implPos<telPos&&supportPos<telPos,'items not mentioned in the quote appear before items mentioned in the quote');
});

test('15c: when competitor_price has no signed quote and no unit price, the generic questions and hidden cost list remain unchanged',async()=>{
 const t=await call('pricing_negotiation_guide',{
  scenario:'competitor_pricing',
  your_solution:'VoiceDesk AI',
  deal_value:108000,
  discount_requested:15,
  competitor_price:'Competitor total price is 15% lower',
  value_delivered:'Handles borrower reminder calls',
  your_leverage:'Direct integration with the loan servicing system',
  approval_authority:'VP of Sales'
 });
 assert.ok(t.includes('1. "What\'s included in that price? Let\'s compare apples to apples."'),'generic question 1 is unchanged');
 assert.ok(t.includes('2. "Is that their initial price or after negotiation?"'),'generic question 2 is unchanged');
 assert.ok(t.includes('3. "What about implementation, training, and support costs?"'),'generic question 3 is unchanged');
 assert.ok(t.includes('4. "Have you talked to their customers about total cost of ownership?"'),'generic question 4 is unchanged');
 assert.ok(!t.includes('not mentioned in the quote'),'quote specific hidden cost annotations do not appear when no quote detail is given');
});
