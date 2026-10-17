// Run 21b step 2 (test first): discovery_question_bank named the first measure of the sector file ("how do you measure X today", "have you
// considered X as a criterion", "quantify business case (...)") for every company of a kind, whatever pain the user typed. The sector's
// measures are now ordered by the user's own pain and solution words, so each company is asked about the measure its own pain is about.
// Companies are described in plain words (no names). Run: node --test tests/run21-stock-discovery_question_bank.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "discovery_question_bank", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const line = (t, label) => (t.split("\n").find((l) => l.includes(label)) || "");

const LASTMILE = { framework: "all", prospect_industry: "online retail", prospect_role: "Head of Logistics", your_solution: "Delivery management software that plans last mile routes and gives drivers a proof of delivery app", known_pain_points: "Failed first deliveries and customers calling to ask where the parcel is", known_metrics: "none yet" };
const FREIGHT = { framework: "all", prospect_industry: "manufacturing", prospect_role: "Transport Procurement Manager", your_solution: "A freight marketplace that matches shippers with truckload carriers", known_pain_points: "Planners spend hours finding capacity and booking loads by phone", known_metrics: "none yet" };
const EXPENSE = { framework: "all", prospect_industry: "mid-size companies", prospect_role: "Finance Controller", your_solution: "Spend management software with expense claims, approvals and corporate cards", known_pain_points: "Employees submit receipts weeks late and approvals sit in inboxes", known_metrics: "none yet" };
const PAYAPI = { framework: "all", prospect_industry: "online platforms", prospect_role: "Head of Product", your_solution: "Payments API for merchants: accept cards and bank transfers and pay out to sellers", known_pain_points: "Developers wait weeks to take a first payment live", known_metrics: "none yet" };

test("logistics: a last mile company and a freight marketplace are asked about their own measure, and neither gets the other's", async () => {
  const a = await call(LASTMILE), b = await call(FREIGHT);
  assert.match(a, /How do you measure first attempt delivery rate today/);
  assert.match(b, /How do you measure time to book a load today/);
  // run 21c: draft rewrite: the old "Quantify business case (...)" outline line is now the opening line "in terms of ..."; the intent (each company's own measure first) is kept
  assert.match(a, /in terms of first attempt delivery rate/);
  assert.match(b, /in terms of time to book a load/);
  assert.match(line(a, "would move first if it were fixed"), /Which of first attempt delivery rate/); // run 21c: draft rewrite
  assert.match(line(b, "would move first if it were fixed"), /Which of time to book a load/);
  assert.doesNotMatch(a, /load fill rate|time to book a load|carrier acceptance/i);
  assert.doesNotMatch(b, /first attempt|cost per delivery|deliveries per vehicle/i);
});

test("fintech: a spend and expense company and a payments API company are asked about their own measure", async () => {
  const a = await call(EXPENSE), b = await call(PAYAPI);
  assert.match(a, /in terms of approval cycle time/); // run 21c: draft rewrite
  assert.match(b, /in terms of time to first live payment/);
  assert.match(a, /How do you measure approval cycle time today/);
  assert.match(b, /How do you measure time to first live payment today/);
  assert.doesNotMatch(a, /payment success rate|authorisation rate|chargeback/i);
  assert.doesNotMatch(b, /days to close the books|policy breach|reconciliation effort/i);
});

test("a pain that shares no word with the measures keeps the sector's usual order (nothing is dropped, nothing is invented)", async () => {
  const a = await call({ ...LASTMILE, known_pain_points: "Our operations team is overloaded" });
  assert.match(a, /How do you measure cost per delivery today/);
  assert.match(a, /in terms of cost per delivery, first attempt delivery rate or on time delivery/); // run 21c: draft rewrite
});
