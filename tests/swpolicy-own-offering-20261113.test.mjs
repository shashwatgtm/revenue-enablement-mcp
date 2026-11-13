import test from 'node:test';
import assert from 'node:assert/strict';
const {classifySoftwareQuestion, SOFTWARE_REFERRAL, SOFTWARE_OUTSIDE_SCOPE} = await import('../dist/software-policy.js');
const {default: handler} = await import('../netlify/functions/mcp.mjs');

// 13 Nov 2026, ported from GTM Alpha (de2915e) plus the owner's analytics rule.
// A GTM question about the user's own software or analytics product is answered.
// Choosing software for the user to buy is referred (GTM stack, including plain,
// marketing, sales, demand generation and customer success analytics) or declined
// (data warehouse, SIEM, BI and other technology). Exact, same-meaning, negated and
// opposite sentences across the nine verticals.
const verticals = ['logistics tech','fintech','vertical SaaS','AI native','ITeS','telecom','cybersecurity','software','SaaS'];

test('own offering described as software or analytics is a GTM question, in every vertical', () => {
  for (const v of verticals) for (const q of [
    `Choose between partner-led and outbound for a ${v} analytics product.`,
    `Which route should we take for our ${v} analytics software: partners or outbound sales?`,
    `We are not asking which software to buy; choose partner-led or outbound for our ${v} analytics product.`,
    `Compare PLG and sales-led for our ${v} developer tools startup.`,
    `Choose between partner-led and outbound for our ${v} marketing analytics product.`,
  ]) assert.equal(classifySoftwareQuestion({next_steps: q}), 'none', q);
});

test('choosing GTM software, including analytics, goes to the booking in every vertical', () => {
  const kinds = ['marketing analytics', 'sales analytics', 'demand generation analytics', 'customer success analytics'];
  verticals.forEach((v, i) => {
    for (const q of [
      `Choose between two CRM platforms for our ${v} analytics product.`,
      `Which CRM should we buy for our ${v} analytics product?`,
      `HubSpot or Salesforce for our ${v} startup?`,
      `For our ${v} product, recommend a sales engagement tool.`,
      `What is the best analytics tool for our ${v} company?`,
      `Which ${kinds[i % 4]} software should we buy for our ${v} team?`,
      `Recommend an analytics platform for our ${v} go-to-market team.`,
    ]) assert.equal(classifySoftwareQuestion({next_steps: q}), 'gtm', q);
  });
  assert.equal(classifySoftwareQuestion({next_steps: 'What is the best analytics tool for us?'}), 'gtm');
});

test('other technology, including BI and non-GTM analytics, keeps the plain decline in every vertical', () => {
  for (const v of verticals) for (const q of [
    `Which data warehouse should we buy for our ${v} analytics product?`,
    `Should we choose Snowflake or BigQuery for our ${v} analytics platform?`,
    `Choose between Datadog and New Relic for our ${v} SaaS platform.`,
    `Which data warehouse should we buy for marketing analytics at our ${v} company?`,
    `Recommend a BI tool for our ${v} company.`,
    `Which security analytics platform should we buy for the SOC at our ${v} company?`,
  ]) assert.equal(classifySoftwareQuestion({next_steps: q}), 'outside', q);
  assert.equal(classifySoftwareQuestion({next_steps: 'Should we use Segment or mParticle?'}), 'outside');
});

test('GTM questions about software, analytics and AI products are answered', () => {
  for (const q of [
    'Which channel should we lead with for our AI analytics product sold to banks?',
    'Choose a pricing model for our cybersecurity software sold to mid-size banks.',
    'Which segment should we target first with our analytics platform: retail banks or insurers?',
    'What is the best go-to-market for analytics software sold to telcos?',
    'Pick inbound or outbound for our AI app that helps ITeS firms run service desks.',
    'Which is better for a cloud security platform: channel partners or direct sales?',
  ]) assert.equal(classifySoftwareQuestion({next_steps: q}), 'none', q);
});

const call = async (name, args) => {
  const r = await handler(new Request('https://local.invalid/mcp', {method:'POST', headers:{'content-type':'application/json', accept:'application/json, text/event-stream'}, body:JSON.stringify({jsonrpc:'2.0', id:1, method:'tools/call', params:{name, arguments:args}})}));
  const j = await r.json();
  return (j.result?.content || []).map(c => c.text).join('\n');
};

test('through the MCP handler: own product answered, CRM and analytics referred, warehouse declined', async () => {
  const q = 'Choose between partner-led and outbound for a telecom analytics product.';
  const text = await call('deal_strategy_coach', {deal_name: 'Northwind Freight', deal_stage: 'discovery', next_steps: q});
  assert.ok(!text.includes(SOFTWARE_OUTSIDE_SCOPE) && !text.includes(SOFTWARE_REFERRAL), text.slice(0, 160));
  assert.equal(await call('win_loss_analyzer', {analysis_type: 'single_deal', deal_details: 'Which CRM should we buy for our telecom analytics product?'}), SOFTWARE_REFERRAL);
  assert.equal(await call('win_loss_analyzer', {analysis_type: 'single_deal', deal_details: 'What is the best analytics tool for us?'}), SOFTWARE_REFERRAL);
  assert.equal(await call('win_loss_analyzer', {analysis_type: 'single_deal', deal_details: 'Which data warehouse should we buy for our telecom analytics product?'}), SOFTWARE_OUTSIDE_SCOPE);
});
