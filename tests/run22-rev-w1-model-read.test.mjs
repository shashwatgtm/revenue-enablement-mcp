// Run 22 follow-up (rev-w1): the sealed pool showed three "E8 model" flags (the business model stated in the answer did not match the company's own). readModel flipped a
// subscription seller to "usage priced" or "SIM" from one product noun (API, SIM) or from words about the buyer's current alternatives. The usage and SIM reads now need the
// seller's own pricing words, mixed evidence keeps the sector model and says it is assumed. Invented sellers only (rule B81 for this public repo).
// Run: node --no-warnings --test tests/run22-rev-w1-model-read.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  assert.ok(j.result && j.result.content, JSON.stringify(j));
  return j.result.content.map((c) => c.text).join("\n");
};
const future = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const modelLine = (t) => (t.match(/Business model: [^\n]*/) || [""])[0];
const USAGE_TEXT = /usage priced|pay as you go|rate per unit of usage|volume tiers|rate card|test volume/i;
const SIM_TEXT = /test SIMs|connectivity for devices|sold by SIM|SIMs in the buyer's devices/i;

// three tools for one seller; the same seller text goes to each
const run3 = async (sol, extra = {}) => ({
  plan: await call("account_plan_builder", { account_name: "Orchard Foods account", current_arr: 40000, known_contacts: "Head of Operations (champion), CFO (buyer)", your_solution: sol, account_notes: "Objections: How much does it cost?; Does it integrate with our ERP?", competitive_threats: extra.threats || "spreadsheets", ...(extra.plan || {}) }),
  map: await call("mutual_action_plan_generator", { deal_name: "Retail deal for the seller", target_close_date: future(70), buyer_champion: "Head of Operations", economic_buyer: "CFO", your_solution: sol, blockers: "How much does it cost?", known_requirements: "see every order in one place", ...(extra.map || {}) }),
  roi: await call("roi_business_case_builder", { customer_name: "Orchard Foods account", your_solution: sol, solution_price: 40000, primary_value_driver: "cost_reduction", current_process: extra.process || "spreadsheets", ...(extra.roi || {}) }),
});

test("a software subscription with an API and per seat pricing keeps its model", async () => {
  const r = await run3("Boardwise, a meeting management platform for operations teams with a REST API and webhooks, priced per seat per month");
  for (const [k, t] of Object.entries(r)) {
    assert.doesNotMatch(modelLine(t), /usage priced|connectivity for devices/i, `${k}: ${modelLine(t)}`);
    assert.doesNotMatch(t, USAGE_TEXT, `${k} carries usage wording`);
    assert.doesNotMatch(t, SIM_TEXT, k);
  }
});

test("an API plus a per user or per month plan is mixed evidence: the sector model stays and is not stated as read from the seller", async () => {
  const r = await run3("Ledgerloop, an accounting API and dashboard for finance teams: usage based API calls on top of a per user plan billed per month");
  for (const [k, t] of Object.entries(r)) {
    assert.doesNotMatch(modelLine(t), /usage priced/i, `${k}: ${modelLine(t)}`);
    assert.doesNotMatch(t, /rate per unit of usage|rate card|test volume/i, k);
  }
  for (const k of ["plan", "map", "roi"]) assert.match(modelLine(r[k]), /assumed/i, `${k}: the sector model is said to be assumed`);
});

test("a seller that mentions SIM cards only as a customer's device is not a SIM seller", async () => {
  const r = await run3("Fleetpulse, vehicle tracking software for trucking companies; each tracker uses a SIM card that the customer supplies, and the dashboard shows every truck on a map");
  for (const [k, t] of Object.entries(r)) {
    assert.doesNotMatch(t, SIM_TEXT, `${k} treats the seller as a SIM seller`);
    assert.doesNotMatch(modelLine(t), /connectivity for devices|SIM/i, `${k}: ${modelLine(t)}`);
  }
});

test("a services firm that mentions usage reports stays a services firm", async () => {
  const r = await run3("Northgate Services, managed IT services: service desk and application support on a monthly service fee, with a monthly usage report for every client");
  for (const [k, t] of Object.entries(r)) {
    assert.doesNotMatch(modelLine(t), /usage priced/i, `${k}: ${modelLine(t)}`);
    assert.doesNotMatch(t, USAGE_TEXT, `${k} carries usage wording`);
  }
});

test("words about the buyer's current alternatives or customer results do not decide the seller's model", async () => {
  const sol = "Boardwise, a meeting management platform for operations teams, sold as a yearly subscription";
  const r = await run3(sol, { threats: "paying per transaction fees to the bank; pay as you go phone credit", process: "today they handle it with a prepaid card and per message fees from several providers", roi: { known_metrics: "A customer cut its per transaction costs in half (page claim)" }, plan: { current_products: "a prepaid card programme" } });
  for (const [k, t] of Object.entries(r)) {
    assert.doesNotMatch(modelLine(t), /usage priced|connectivity for devices/i, `${k}: ${modelLine(t)}`);
    assert.doesNotMatch(t, /rate per unit of usage|rate per transaction|test volume/i, k);
  }
});

test("the seller's own pay as you go words still give usage wording (round 3 gain), and a SIM seller still gets SIM wording", async () => {
  const pay = await call("account_plan_builder", { account_name: "Orchard Foods account", current_arr: 36000, known_contacts: "developers (champion)", your_solution: "Dialpath communications platform (voice and SMS APIs, phone numbers and voice agents on a carrier network), a cloud communications platform with an API suite and a carrier network", account_notes: "Objections: What is available on pay as you go?; Are there volume discounts available?" });
  assert.match(modelLine(pay), /usage priced|per-transaction/i);
  assert.doesNotMatch(pay, /per site, per link|price per site|cutover|site survey/i);
  const sim = await call("roi_business_case_builder", { customer_name: "logistics account (Simbridge customer)", your_solution: "Simbridge IoT connectivity platform (global IoT SIM, SoftSIM, IoT eSIM and a connectivity management platform), a global IoT SIM that connects devices across 600+ networks on one profile", solution_price: 60000, primary_value_driver: "cost_reduction", current_process: "local SIMs bought country by country" });
  assert.match(sim, /test SIMs|SIMs in the buyer's devices/i);
  assert.match(modelLine(sim), /SIM/);
});
