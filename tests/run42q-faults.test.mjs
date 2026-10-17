// Run 42Q: the recurring judge faults on the unseen set, fixed in general (no company names in code). Invented sellers only (B81).
//  1. a services firm with your_sector set to ites is sold as services unless its own words state a subscription charge;
//  2. a must-show list of integration names is one claim, not one demo step per name; the steps come from the parts that answer the pains;
//  3. a pain about bids, notes, meetings or hand-built pipelines ties to the part that answers it;
//  4. one sentence that sets the scene and then names the problem is one problem, not two;
//  5. email questions are about the product's problem, not a stock question for the persona.
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const modelLine = (t) => (t.match(/Business model: [^\n]*/) || [""])[0];
const SERVICES = "Corvane, Business services and advanced technology for large enterprises: finance and accounting, customer care, risk and compliance, data and AI, plus agentic products such as an AP suite";

test("your_sector ites: a services firm that names products and technology is sold as services", async () => {
  const t = await call("demo_script_builder", { demo_type: "first_look", customer_industry: "banks", your_solution: SERVICES, key_pain_points: "month end close takes too long", demo_duration: 30, your_sector: "ites" });
  assert.match(modelLine(t), /^Business model: services/);
  // its own charge words still decide: a subscription stated by the seller is a subscription
  const s = await call("demo_script_builder", { demo_type: "first_look", customer_industry: "banks", your_solution: `${SERVICES}, sold as a subscription per user`, key_pain_points: "month end close takes too long", demo_duration: 30, your_sector: "ites" });
  assert.match(modelLine(s), /^Business model: software subscription/);
  // business_model given wins over everything (pricing guide takes it)
  const p = await call("pricing_negotiation_guide", { scenario: "discount_request", deal_value: 100000, discount_requested: 10, your_solution: SERVICES, business_model: "saas", your_sector: "ites" });
  assert.match(modelLine(p), /from business_model/);
});

test("demo: a list of integration names is one claim; the steps answer the pains", async () => {
  const t = await call("demo_script_builder", {
    demo_type: "first_look", primary_audience: "VP of Sales", customer_industry: "sales teams",
    your_solution: "Murmur, a meeting assistant: live transcription, summaries with action items, pre-call briefs and automatic follow-ups synced to the CRM",
    key_pain_points: "Teams lose follow-ups, action items and deal details after meetings and spend hours writing them up",
    demo_duration: 30, must_show_features: "Named a must-try tool by a business paper; integrations with Zoom, Google Meet, Teams, Salesforce, HubSpot and Slack (page claims)",
  });
  assert.doesNotMatch(t, /\*\*Step \d+: (?:Google Meet|Teams|Salesforce|HubSpot|Slack)\*\*/);
  assert.match(t, /integrations with Zoom, Google Meet, Teams, Salesforce, HubSpot and Slack \(page claims\)/);
  assert.match(t, /\*\*Step 1: (?:Summaries with action items|Automatic follow-ups|Pre-call briefs and automatic follow-ups|Live transcription)/);
  assert.doesNotMatch(t, /no part of your_solution is tied to/);
});

test("demo: an unlabelled single integration flow stays a step", async () => {
  const t = await call("demo_script_builder", { demo_type: "first_look", your_solution: "Lanehop, a delivery platform: live re-planning and a driver app", key_pain_points: "routes change all day", demo_duration: 30, must_show_features: "integration with an existing TMS in weeks" });
  assert.match(t, /\*\*Step \d+: Integration with an existing TMS in weeks\*\*/);
});

test("demo: bids, meetings and hand-built pipelines tie to the part that answers them", async () => {
  const bids = await call("demo_script_builder", { demo_type: "first_look", customer_industry: "home builders", your_solution: "Framewise, software for home builders: digital takeoffs, estimating and quoting, scheduling and invoicing", key_pain_points: "slow bids that lose work", demo_duration: 30 });
  assert.doesNotMatch(bids, /no part of your_solution is tied to 'slow bids/);
  const meet = await call("demo_script_builder", { demo_type: "first_look", your_solution: "Slotly, scheduling software: booking links and routing forms, an AI notetaker with recaps", key_pain_points: "the back-and-forth of finding a time to meet", demo_duration: 30 });
  assert.doesNotMatch(meet, /no part of your_solution is tied to/);
  const pipes = await call("demo_script_builder", { demo_type: "first_look", your_solution: "Ductline, a data movement platform: fully managed connectors from SaaS apps and databases into warehouses", key_pain_points: "building and maintaining pipelines by hand is slow and costly", demo_duration: 30 });
  assert.doesNotMatch(pipes, /no part of your_solution is tied to/);
});

test("one sentence that sets the scene and then names the problem is one problem", async () => {
  const pain = "Enterprises run mission-critical and regulated processes, and AI pilots stay pilots unless they run in live production";
  const t = await call("demo_script_builder", { demo_type: "first_look", your_solution: SERVICES, key_pain_points: pain, demo_duration: 30, your_sector: "ites" });
  assert.doesNotMatch(t, /those 2 problems|second problem you described/);
  const e = await call("email_sequence_generator", { sequence_type: "cold_outreach", target_persona: "CFO", target_industry: "banks", your_solution: SERVICES, specific_pain_point: pain, your_sector: "ites" });
  assert.doesNotMatch(e, /“Enterprises run mission-critical and regulated processes”/);
  // two problems joined by "and" stay two
  const two = await call("demo_script_builder", { demo_type: "first_look", your_solution: "Lanehop, a delivery platform: live re-planning and a driver app", key_pain_points: "dispatchers re-plan routes by hand, and drivers miss delivery windows", demo_duration: 30 });
  assert.match(two, /2 problems|second problem/);
});

test("email: no stock persona question that shares nothing with the product's problem", async () => {
  const t = await call("email_sequence_generator", {
    sequence_type: "cold_outreach", target_persona: "sales", target_industry: "small businesses",
    your_solution: "Slotly, scheduling software: booking links and routing forms, an AI notetaker with recaps and follow-ups, and built-in payments",
    specific_pain_point: "The tedious back-and-forth of finding a time to meet, and the busywork before and after meetings: notes, follow-ups and payments",
    call_to_action: "20-minute call", your_sector: "saas",
  });
  assert.doesNotMatch(t, /record a deal|what is in the pipeline/i);
  assert.match(t, /the tedious back-and-forth of finding a time to meet/i);
  assert.doesNotMatch(t, /Nothing you gave speaks to/);
});

test("trap: a claim to source never ends mid phrase, and a plain list of strengths is one criterion each", async () => {
  const t = await call("competitive_trap_setter", { competitor: "fragmented tools", your_solution: "Shieldmark, a cybersecurity platform: endpoint protection, EDR and XDR",
    your_strengths: "Patented detection technology, intel from one of the largest malware labs, flexible cloud and on-premise deployment, a single platform and local support, with 99.99% availability and on-demand scale",
    evaluation_stage: "mid", buyer_persona: "IT Manager", trap_type: "all", your_sector: "cybersecurity" });
  const src = (t.match(/The buyer will ask for the source of: [^\n]*/) || [""])[0];
  assert.ok(src, "no claims to source");
  assert.doesNotMatch(src, /\b(?:and|with|or|flexible)"/);
  assert.match(src, /"99\.99% availability"/);
  const crit = (t.match(/^- Criterion \d+:/gm) || []).length;
  assert.ok(crit >= 3, "criteria: " + crit);
});
