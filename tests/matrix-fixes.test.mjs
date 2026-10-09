// Run 15 R15-32: fixes from the edge-case matrix (evidence/run15/matrix/, triage independent-audit/run15/matrix-triage.md).
// Each case is an input the matrix ran; the answer must be truthful and plain. No valid-input number changes.
// Tested in-process through netlify/functions/mcp.mjs (no network, no deploy). Run: node --test tests/matrix-fixes.test.mjs
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
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};

test("pricing_negotiation_guide: a discount over 100% is refused in plain words", async () => {
  const r = await call("pricing_negotiation_guide", { scenario: "discount_request", deal_value: 1000, discount_requested: 150 });
  assert.equal(r.isError, true);
  assert.match(r.text, /discount_requested must be 100 or less/);
  const ok = await call("pricing_negotiation_guide", { scenario: "discount_request", deal_value: 1000, discount_requested: 100 });
  assert.equal(ok.isError, false);
});

test("mutual_action_plan_generator: a target close date in the past is refused in plain words", async () => {
  const r = await call("mutual_action_plan_generator", { deal_name: "Clinic Group A", target_close_date: "2020-01-01" });
  assert.equal(r.isError, true);
  assert.match(r.text, /target_close_date 2020-01-01 is in the past/);
});

test("email_sequence_generator: num_emails 0 is shown as given, not replaced by 5", async () => {
  const r = await call("email_sequence_generator", { sequence_type: "cold_outreach", target_persona: "COO", your_solution: "FlowOps", num_emails: 0 });
  assert.match(r.text, /## Emails: 0\n/);
  assert.doesNotMatch(r.text, /## Emails: 5\n/);
});

test("demo_script_builder: demo_duration 0 falls back to the labelled default; 1 minute is singular", async () => {
  const r = await call("demo_script_builder", { demo_type: "first_look", your_solution: "FlowOps", demo_duration: 0 });
  // run 22: the length is said in the opening line of the script (a default is labelled), not in a configuration table
  assert.match(r.text, /FlowOps, first look, 30 minutes \(default\)/);
  const one = await call("demo_script_builder", { demo_type: "first_look", your_solution: "FlowOps", demo_duration: 1 });
  assert.match(one.text, /FlowOps, first look, 1 minute\b(?!s)/);
  assert.doesNotMatch(one.text, /1 minutes/);
});

test("roi_business_case_builder: negative money prints as -$, not $-", async () => {
  const r = await call("roi_business_case_builder", { your_solution: "FlowOps", primary_value_driver: "revenue_increase", company_size: "smb", annual_value_estimate: 0.02, annual_revenue: 1, employee_count: 1, solution_price: 1 });
  assert.doesNotMatch(r.text, /\$-\d/);
  assert.match(r.text, /\| \*\*Net Annual Benefit\*\* \| -\$0\.98 /);
});

test("win_loss_analyzer: a deal value of 0 is shown as given, 1 day is singular, days get separators", async () => {
  const z = await call("win_loss_analyzer", { analysis_type: "single_deal", deal_outcome: "lost", deal_value: 0, sales_cycle_days: 1 });
  assert.match(z.text, /\| \*\*Deal Value\*\* \| \$0 \|/);
  assert.match(z.text, /\| \*\*Sales Cycle\*\* \| 1 day \|/);
  const big = await call("win_loss_analyzer", { analysis_type: "single_deal", deal_outcome: "lost", sales_cycle_days: 1000000000000 });
  assert.match(big.text, /\| \*\*Sales Cycle\*\* \| 1,000,000,000,000 days \|/);
});

// run 21c: draft rewrite. The old check read the text under the heading "Common Root Causes to Investigate"; the write-up has no such outline
// section. Its intent is kept: a loss with no stated reason must say so plainly and ask for the reason, not print an empty section.
test("win_loss_analyzer: a loss with no stated reason says what the reason would add, and prints no empty section", async () => {
  const r = await call("win_loss_analyzer", { analysis_type: "single_deal", deal_outcome: "lost" });
  // run 22 (rev-w3): what is not given is named once, at the end, under "To sharpen this, give:", with what each input would change
  assert.match(r.text, /To sharpen this, give:[\s\S]*`loss_reason`[^\n]*would change/);
  assert.equal((r.text.match(/To sharpen this, give:/g) || []).length, 1);
  assert.doesNotMatch(r.text, /##[^\n]*\n\n(?:##|$)/);
});

// Run 19 (D80, problem 2): a weakness is the seller's own note and is never read out inside a question to the buyer, so this
// test now checks that each weakness gets its own question, that the question does not quote it, and that the note is kept.
test("competitive_trap_setter: each weakness gets its own landmine question", async () => {
  const r = await call("competitive_trap_setter", { your_solution: "FlowOps", competitor: "Competitor A", trap_type: "discovery_questions", competitor_weaknesses: "Charges extra for text reminders, No two-way rescheduling" });
  const qs = [...r.text.matchAll(/\*\*Landmine Question:\*\* "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(qs.length, 2);
  assert.notEqual(qs[0], qs[1]);
  // run 21c: draft rewrite. The question now names the topic of its note ("text reminders") as the buyer would, so the check is that it
  // never reads the whole note out; the intent (the weakness is a note for the seller, shown as given) is kept.
  assert.doesNotMatch(qs[0], /Charges extra for text reminders/i);
  assert.match(r.text, /Charges extra for text reminders/);
});
