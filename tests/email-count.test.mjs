import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../netlify/functions/mcp.mjs';

async function call(args) {
  const response = await handler(new Request('https://local.invalid/mcp', {
    method: 'POST', headers: {'content-type': 'application/json', accept: 'application/json, text/event-stream'},
    body: JSON.stringify({jsonrpc: '2.0', method: 'tools/call', id: 1,
      params: {name: 'email_sequence_generator', arguments: args}})
  }));
  const message = await response.json();
  assert.ok(message.result && !message.result.isError, JSON.stringify(message).slice(0,500));
  return message.result;
}

const scenarios = [
  [
    "B2B SaaS",
    "Subscription billing software",
    "cold_outreach"
  ],
  [
    "fintech",
    "Payment reconciliation",
    "warm_follow_up"
  ],
  [
    "HR tech",
    "Shift scheduling software",
    "post_demo"
  ],
  [
    "sales tech",
    "Call coaching software",
    "proposal_follow_up"
  ],
  [
    "ops tech",
    "Equipment maintenance planning",
    "re_engagement"
  ],
  [
    "ITeS",
    "Managed application support",
    "nurture"
  ],
  [
    "AI-native",
    "Support agent with human escalation",
    "event_follow_up"
  ],
  [
    "cybersecurity",
    "Cloud exposure management",
    "referral_request"
  ],
  [
    "martech",
    "Consent measurement software",
    "post_demo"
  ]
];
for (const [vertical, product, type] of scenarios) {
  test(vertical + ' counts the email drafts actually returned', async () => {
    const args = {your_solution: product, target_industry: vertical, target_persona: 'Finance director',
      sequence_type: type, num_emails: 7};
    const result = await call(args);
    assert.deepEqual(await call(args), result);
    const text = result.content[0].text;
    const drafts = [...text.matchAll(/^### Email (\d+)\b/gm)].map(m => Number(m[1]));
    assert.ok(drafts.length > 0);
    if (drafts.length < 5) assert.doesNotMatch(text, /emails 2, 3 and 5/);
    assert.deepEqual(drafts, Array.from({length: drafts.length}, (_, i) => i + 1));
    assert.equal(Number(text.match(/^## Emails: (\d+)/m)?.[1]), drafts.length);
  });
}
