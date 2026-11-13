// 13 Nov 2026 (owner): (1) the business model and written quote lines print only in tools whose answer carries a price,
// a priced offer or a commercial plan; (2) usage count records keep the day only and are deleted after 90 days.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pricingLines, PRICED_TOOLS } from '../dist/pricing-lines.js';
import { cutoffDay, pruneUsage, KEEP_DAYS } from '../netlify/lib/usage-count.mjs';
const { default: handler } = await import('../netlify/functions/mcp.mjs');
const cases = JSON.parse(readFileSync(new URL('./fixtures/pricing-lines-20261113.json', import.meta.url)));
const QUOTE = /Any priced offer below requires a written quote and buyer agreement\./;
const MODEL = /Business model: not stated\. Tell us how you charge and the plan will adjust\./;
async function call(name, args) {
  const response = await handler(new Request('https://local.invalid/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) }));
  const message = await response.json();
  assert.ok(message.result && !message.result.isError, JSON.stringify(message).slice(0, 400));
  return message.result.content.filter(v => v.type === 'text').map(v => v.text).join('\n');
}
for (const [tool, args] of Object.entries(cases)) {
  test(`pricing lines: ${tool} ${PRICED_TOOLS.has(tool) ? 'keeps' : 'drops'} the business model and quote lines`, async () => {
    const text = await call(tool, args);
    if (PRICED_TOOLS.has(tool)) {
      assert.match(text, MODEL);
    } else {
      assert.doesNotMatch(text, QUOTE);
      assert.doesNotMatch(text, /Business model: not stated/);
      assert.match(text, /\*Sector: [^*\n]+\.\*/, 'the sector line stays');
    }
  });
}
test('pricingLines removes only the two lines and leaves the sector line', () => {
  const before = 'Intro\n*Sector: from your choice: fintech. Business model: not stated. Tell us how you charge and the plan will adjust.*\n\nAny priced offer below requires a written quote and buyer agreement.\n\n---\nBody';
  assert.equal(pricingLines('a_tool_with_no_price', before), 'Intro\n*Sector: from your choice: fintech.*\n\n---\nBody');
  assert.equal(pricingLines([...PRICED_TOOLS][0], before), before);
  const stated = '*Sector: fintech. Business model: subscription (from your answer).*';
  assert.equal(pricingLines('a_tool_with_no_price', stated), stated);
});
test('usage counts: the key holds the day only, never the time', () => {
  const source = readFileSync(new URL('../netlify/lib/usage-count.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Date\.now\(\)/);
  assert.match(source, /const key = `\$\{day\}\/\$\{server\}\/\$\{tool\}\/\$\{app\}\/\$\{route\}\/\$\{randomUUID\(\)\}`/);
  assert.match(source, /const day = new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
});
test('usage counts: records older than 90 days are deleted, newer ones stay', async () => {
  assert.equal(KEEP_DAYS, 90);
  const now = new Date('2026-11-13T10:00:00Z');
  assert.equal(cutoffDay(now), '2026-08-15');
  const keys = ['2026-08-14/s/t/claude/mcp/a', '2026-08-15/s/t/claude/mcp/b', '2026-11-13/s/t/browser/web/c', '2026-01-01/s/t/none/mcp/d', 'not-a-day/x'];
  const deleted = [];
  const store = { list: async () => ({ blobs: keys.map(key => ({ key, etag: 'e' })), directories: [] }), delete: async key => { deleted.push(key); } };
  const result = await pruneUsage(store, now);
  assert.deepEqual(deleted, ['2026-08-14/s/t/claude/mcp/a', '2026-01-01/s/t/none/mcp/d']);
  assert.deepEqual(result, { cutoff: '2026-08-15', deleted: 2 });
});
test('usage counts: the prune runs daily as a scheduled function', async () => {
  const { config } = await import('../netlify/functions/usage-prune.mjs');
  assert.equal(config.schedule, '@daily');
});
test('privacy page states the day-only record and the 90 day deletion', () => {
  for (const file of ['../public/privacy/index.html', '../PRIVACY.md']) {
    const page = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.match(page, /usage count records keep only the day of the call, not the time, and every record is deleted after 90 days\./, file);
    assert.doesNotMatch(page, /no set end date|The date and time of the call/, file);
  }
});
