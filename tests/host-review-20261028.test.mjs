// Host review, 28 October 2026 (proposed, not deployed): a note inside known_contacts is not a contact, a "Role only:" label is
// not part of a title, and a plain comma list of buyer process steps gives one milestone per step.
// Invented companies only (rule B81 for this public repo). Run: node --no-warnings --test tests/host-review-20261028.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  assert.ok(j.result && j.result.content, "expected a tool result, got " + JSON.stringify(j));
  return j.result.content.map((c) => c.text).join("\n");
};
const future = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

test("account_plan_builder: 'no personal contact details supplied' is not a contact row, and 'Role only:' is not part of the title", async () => {
  const t = await call("account_plan_builder", {
    account_name: "Northmill Software", industry: "Software", your_solution: "customer operations analytics",
    known_contacts: "Role only: revenue operations director; no personal contact details supplied", your_sector: "saas",
  });
  const table = t.split("## Who decides and who influences")[1].split("\n\n")[2];
  assert.match(table, /\| revenue operations director \|/i);
  assert.doesNotMatch(table, /no personal contact details supplied/);
  assert.doesNotMatch(table, /Role only:/);
  assert.doesNotMatch(t, /Meet no personal contact details supplied/);
});

test("account_plan_builder: contacts typed as before keep one row each", async () => {
  const t = await call("account_plan_builder", { account_name: "Northmill Software", known_contacts: "Head of Operations (champion); CFO (buyer); IT Director" });
  for (const c of ["Head of Operations (champion)", "CFO (buyer)", "IT Director"]) assert.ok(t.includes("| " + c + " |"), c);
});

test("mutual_action_plan_generator: 'Pilot, security review, procurement' gives three milestones, procurement in the procurement phase", async () => {
  const t = await call("mutual_action_plan_generator", {
    deal_name: "Northmill evaluation", target_close_date: future(95), current_stage: "evaluation",
    known_process_steps: "Pilot, security review, procurement", your_sector: "saas",
  });
  assert.match(t, /Buyer's process step, in your words: Pilot \|/);
  assert.match(t, /Buyer's process step, in your words: security review \|/);
  assert.match(t, /Buyer's process step, in your words: procurement \|/);
  assert.doesNotMatch(t, /in your words: Pilot, security review, procurement/);
  const procurementPhase = t.split("Procurement (")[1] || "";
  assert.match(procurementPhase.split("### Phase")[0], /in your words: procurement/);
});

test("mutual_action_plan_generator: a step that is a sentence with commas stays one step", async () => {
  const t = await call("mutual_action_plan_generator", {
    deal_name: "Northmill evaluation", target_close_date: future(95), current_stage: "evaluation",
    known_process_steps: "The steering committee meets monthly, usually in the first week, to approve new vendors",
  });
  assert.match(t, /in your words: The steering committee meets monthly, usually in the first week, to approve new vendors/);
});
