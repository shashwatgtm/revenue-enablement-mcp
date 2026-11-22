import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import * as serverModule from '../dist/index.js';

const createServer = serverModule.createServer || serverModule.default.createServer;
let server, client;
before(async () => {
  server = createServer();
  client = new Client({ name: 'stop-harm-regression', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
});
after(async () => { await client?.close(); await server?.close(); });
const base = {
  deal_name: 'Enterprise subscription', deal_value: 100000, currency: 'USD',
  deal_stage: 'proposal', days_in_stage: 10, champion_status: 'potential_champion',
  economic_buyer: 'CFO engaged', economic_buyer_engagement: 'engaged',
  competitors: 'None', incumbent_status: 'none', blockers: 'None', blocker_status: 'none',
  next_steps: 'Confirm the terms', close_date: '2026-12-31', your_solution: 'Managed service',
};
async function coach(overrides = {}) {
  const result = await client.callTool({name: 'deal_strategy_coach', arguments: {...base, ...overrides}});
  assert.ok(!result.isError, JSON.stringify(result));
  return result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
}
const score = text => {
  const m = text.match(/(?:\*\*)?(\d+)\s*\/\s*100/);
  assert.ok(m, 'Health score must be visible'); return Number(m[1]);
};
function fixedClock(t) { t.mock.timers.enable({apis: ['Date'], now: new Date('2026-11-21T12:00:00Z')}); }
test('S6 T1: CFO sign-off conflicts with typed not engaged without adding points', async t => {
  fixedClock(t);
  const text = await coach({economic_buyer: 'CFO signed off', economic_buyer_engagement: 'not_engaged'});
  assert.match(text, /these two facts disagree/i);
  assert.match(text, /confirm which is right/i);
  assert.ok(score(text) <= 80);
});
test('S6 T1: denied and uncertain sign-off do not produce a false conflict', async t => {
  fixedClock(t);
  for (const economic_buyer of ['CFO never signed off', 'Perhaps the CFO signed off', 'CFO has not signed off']) {
    assert.doesNotMatch(await coach({economic_buyer, economic_buyer_engagement: 'not_engaged'}), /these two facts disagree/i);
  }
});
test('S6 T2: typed buyer not engaged at proposal costs at least 15 points', async t => {
  fixedClock(t);
  const engaged = score(await coach({economic_buyer: 'CFO', economic_buyer_engagement: 'engaged'}));
  const notEngaged = score(await coach({economic_buyer: 'CFO', economic_buyer_engagement: 'not_engaged'}));
  assert.ok(engaged - notEngaged >= 15);
});
for (const days of [200, 300]) test(`S6 T${days === 200 ? 3 : 4}: ${days} days in stage is not Healthy`, async t => {
  fixedClock(t); assert.doesNotMatch(await coach({days_in_stage: days}), /\bHealthy\b/);
});
test('S6 T5: a present high-risk blocker prevents Healthy', async t => {
  fixedClock(t); assert.doesNotMatch(await coach({blockers: 'Budget approval pending; cannot proceed', blocker_status: 'present'}), /\bHealthy\b/);
});
test('S6 T6: a past close date asks to re-date the deal', async t => {
  fixedClock(t);
  const text = await coach({currency: 'GBP', deal_value: 275000, close_date: '2026-09-30'});
  assert.doesNotMatch(text, /\bHealthy\b/); assert.match(text, /re-date it/i);
});
for (const [id, mention, currency, value] of [
  ['T7', 'INR 4.5 crore', 'USD', 45000000],
  ['T8', 'AED 900,000', 'USD', 900000],
  ['T9', 'Rs 1.2 crore', 'EUR', 12000000],
]) test(`S6 ${id}: conflicting currencies are explicit without a money symbol`, async t => {
  fixedClock(t);
  const text = await coach({deal_name: 'Subscription '+mention, currency, deal_value: value});
  assert.match(text, /currency to confirm/i);
  assert.doesNotMatch(text, /[$€£₹]\s*\d/);
});
test('S6 preserved: cancelled means zero, and repeated identical input is deterministic', async t => {
  fixedClock(t);
  const cancelled = await coach({project_status: 'cancelled'});
  assert.match(cancelled, /0\/100/); assert.match(cancelled, /Do not advance to signature/);
  const first = await coach(); assert.equal(await coach(), first); assert.equal(await coach(), first);
});
