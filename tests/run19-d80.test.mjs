// Run 19 R19-35 (owner decision D80): the 8 problems of the real-world test, fixed in every Revenue Enablement tool.
// Written before the fixes (B43); every test here failed on the production head ee2e1426.
// Companies are the invented ones of the run 19 examples (Lanehop, Branchwire, Answerloop, Cloudmoat, Spendrill, Shelfwalk,
// Example IT Services Co); real companies are tested only in the private project repo (rule B81).
// Run: node --test tests/run19-d80.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  return r.json();
};
const call = async (name, args) => {
  const j = await rpc("tools/call", { name, arguments: args });
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};
const B75 = /\b(clinics?|patients?|hospitals?|healthcare|hipaa|ehr|appointments?|no-shows?|dental|physio\w*|ExampleCo|Example Co|Acme Notes|Clausewise|ClinicFlow|legal tech)\b/i;
const PROMISES = /guaranteed|price protection|no long-term commitment/i;
const SAAS_ONLY = /\b(MRR|free trial|freemium|self-serve sign-?up|per seat|seats?|aha moment)\b/i;

// Problem 1: no clinic text anywhere in the tool code or the tool descriptions
test("problem 1: no clinic or dummy-company word in src/ or in tools/list", async () => {
  for (const f of ["../src/index.ts", "../src/verticals.ts"]) {
    const src = readFileSync(new URL(f, import.meta.url), "utf8").replace(/Healthcare: \{|'Healthcare'|Healthcare, Manufacturing|Financial_Services, Healthcare/g, "");
    assert.doesNotMatch(src, B75, f);
  }
  const tl = await rpc("tools/list", {});
  assert.doesNotMatch(JSON.stringify(tl.result.tools).replace(/Financial_Services, Healthcare, Manufacturing/g, ""), B75);
});

// Problem 2 and 3: the trap setter never pastes the competitor's weakness into a question for the buyer, keeps every input
// Problem 7: no invented promises
test("competitive_trap_setter: weaknesses stay notes for the seller; no invented promise; sector words added", async () => {
  const r = await call("competitive_trap_setter", { competitor: "Competitor A", your_solution: "Lanehop", evaluation_stage: "mid", trap_type: "all",
    buyer_persona: "Head of Last-Mile Operations", your_strengths: "Live in six weeks without IT help\nCleans unstructured addresses automatically\nRe-plans routes during the day",
    competitor_weaknesses: "Months of setup before the first route\nStruggles with unstructured addresses" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, PROMISES);
  for (const line of r.text.split("\n").filter((l) => /^\*\*Landmine Question:\*\*|^- "/.test(l))) {
    assert.doesNotMatch(line, /Months of setup before the first route|Struggles with unstructured addresses/i, line);
  }
  assert.match(r.text, /Months of setup before the first route/); // still shown, as the seller's own note
  assert.match(r.text, /dispatch|TMS|first-attempt|cost per delivery/i); // sector knowledge the input did not spell out
});

test("competitive_trap_setter: an investment business gets no software terms", async () => {
  const r = await call("competitive_trap_setter", { competitor: "Competitor A", your_solution: "an AI investment strategy", business_model: "investment",
    competitor_weaknesses: "relies on manager judgment", your_strengths: "explainable strategies, risk reporting" });
  assert.doesNotMatch(r.text, /overage|license|implementation timeline|seats?\b/i);
  assert.match(r.text, /mandate|fees|reporting/i);
});

// Problem 4 and 6: pricing uses the given figures and the business model
test("pricing_negotiation_guide: uses the given competitor gap and value, no seats for a service business", async () => {
  const r = await call("pricing_negotiation_guide", { scenario: "discount_request", deal_value: 180000, discount_requested: 20, your_solution: "managed service desk",
    competitor_price: "about 15% lower", value_delivered: "service credits paid by the incumbent fell to zero", business_model: "services" });
  assert.match(r.text, /15%/);
  assert.doesNotMatch(r.text, /20% cheaper/);
  assert.match(r.text, /service credits paid by the incumbent fell to zero/);
  assert.doesNotMatch(r.text, SAAS_ONLY);
  assert.doesNotMatch(r.text, /does not use it: it assumes an example value instead/);
});

// Problem 2: email sentences read naturally with any pain text or call to action
test("email_sequence_generator: no pasted clause in a fixed sentence; proof used in email 3", async () => {
  const r = await call("email_sequence_generator", { sequence_type: "cold_outreach", target_persona: "Head of Last-Mile Operations", your_solution: "Lanehop",
    target_industry: "third-party logistics", specific_pain_point: "dispatchers re-plan routes by hand when orders change", key_value_prop: "routes re-planned in under a minute",
    social_proof: "first-attempt deliveries up at Example Logistics Co", call_to_action: "20-minute call", sender_context: "Account Executive at Lanehop" });
  assert.doesNotMatch(r.text, /Quick thought on dispatchers/);
  assert.doesNotMatch(r.text, /conversation about 20-minute call/);
  assert.match(r.text, /\[Your name\]\nAccount Executive at Lanehop/); // in the signature, not a bare line in the body
  assert.doesNotMatch(r.text, /\n\nAccount Executive at Lanehop\n\n/);
  assert.doesNotMatch(r.text, /struggling with dispatchers/);
  const e3 = r.text.split("### Email 3")[1].split("### Email 4")[0];
  assert.match(e3, /first-attempt deliveries up at Example Logistics Co/);
  assert.doesNotMatch(e3, /\[Result 1\]/);
});

// Problem 2, 3, 8: discovery questions in the sector's language, gaps first, no awkward echo
test("discovery_question_bank: sector questions, gaps first, no 'You mentioned none shared yet'", async () => {
  const r = await call("discovery_question_bank", { framework: "meddpicc", prospect_industry: "third-party logistics", prospect_role: "Head of Last-Mile Operations",
    known_pain_points: "failed first-attempt deliveries", known_metrics: "none shared yet", deal_stage: "discovery", your_solution: "Lanehop", gaps_to_fill: "economic buyer, decision process" });
  assert.doesNotMatch(r.text, /You mentioned none shared yet/i);
  assert.match(r.text, /cost per delivery|dispatcher|re-plan/i);
  const gapsAt = r.text.search(/Gaps to fill first/i);
  assert.ok(gapsAt > 0 && gapsAt < r.text.search(/### M|## M/), "the gaps section comes before the framework sections");
});

// Problems 5 and 6: the ROI case uses the buyer's own figures and says how sure it is honestly
test("roi_business_case_builder: the buyer's cost and improvement drive the value; confidence is honest", async () => {
  const r = await call("roi_business_case_builder", { your_solution: "Branchwire managed SD-WAN", primary_value_driver: "cost_reduction", solution_price: 240000,
    current_annual_cost: 900000, expected_improvement_percent: 30, customer_name: "Example Retail Co" });
  assert.match(r.text, /\$270,000/); // 30% of $900,000, the buyer's own figures
  const ex = await call("roi_business_case_builder", { your_solution: "Answerloop", primary_value_driver: "productivity", solution_price: 60000, annual_revenue: 20000000,
    employee_count: 120, known_metrics: "45% of tickets resolved without a human" });
  assert.doesNotMatch(ex.text, /\*\*Confidence:\*\* High|High: set because you supplied metrics/);
  assert.match(ex.text, /45% of tickets resolved without a human/);
});

// Problem 3: every blocker gets its own answer
test("deal_strategy_coach: each blocker is answered on its own", async () => {
  const r = await call("deal_strategy_coach", { deal_name: "Example Logistics Co expansion", deal_stage: "proposal", your_solution: "Lanehop",
    blockers: "we already have a TMS; our drivers will not use a new app" });
  assert.match(r.text, /we already have a TMS/i);
  assert.match(r.text, /drivers will not use a new app/i);
  assert.match(r.text, /pilot|one hub/i);
});

// Problem 3: the loss reason is read, not filed as a generic competitive loss
test("win_loss_analyzer: the loss reason and the stakeholders are analysed", async () => {
  const r = await call("win_loss_analyzer", { analysis_type: "single_deal", deal_outcome: "lost", your_solution: "Spendrill", loss_reason: "HR owned the decision and wanted a payroll bundle",
    competitor_won: "Competitor B", stakeholders_involved: "Finance Controller (supporter), CFO (neutral), HR Head (against)" });
  assert.match(r.text, /HR owned the decision and wanted a payroll bundle/);
  assert.match(r.text, /bundle/i);
  assert.match(r.text, /HR Head/);
  assert.doesNotMatch(r.text, /\[Yes or no\]/);
});

// Problem 3: the mutual action plan carries the requirements and blockers given
test("mutual_action_plan_generator: requirements and blockers given are in the plan", async () => {
  const r = await call("mutual_action_plan_generator", { deal_name: "Example Logistics Co expansion", target_close_date: "2026-12-15", your_solution: "Lanehop",
    known_requirements: "re-plans routes during the day, cleans unstructured addresses", blockers: "IT review of the TMS integration" });
  assert.match(r.text, /re-plans routes during the day/);
  assert.match(r.text, /IT review of the TMS integration/);
  assert.doesNotMatch(r.text, /\[Blocker 1\]/);
});

// Problem 3: the demo maps every must-show feature and answers every objection
test("demo_script_builder: features become steps and every objection gets its own answer", async () => {
  const r = await call("demo_script_builder", { demo_type: "first_look", your_solution: "Lanehop", demo_duration: 30,
    must_show_features: "live re-routing, address cleaning, offline driver app", known_objections: "we already have a TMS; drivers will not adopt it" });
  assert.match(r.text, /live re-routing/); assert.match(r.text, /address cleaning/); assert.match(r.text, /offline driver app/);
  assert.doesNotMatch(r.text, /\[Prepared response\]/);
  assert.doesNotMatch(r.text, /Feature 1: \[Address Pain Point 1\]/);
});

// Problem 2 and 3: the proposal keeps differentiators whole and uses the implementation approach
test("proposal_section_writer: differentiators kept whole; implementation approach used", async () => {
  const r = await call("proposal_section_writer", { section_type: "executive_summary", your_solution: "Lanehop", customer_name: "Example Logistics Co",
    key_differentiators: "Routes re-planned in under a minute, not overnight", implementation_approach: "6-week rollout in two phases" });
  assert.doesNotMatch(r.text, /\*\*not overnight\*\*/);
  assert.match(r.text, /6-week rollout in two phases/);
});

// Problem 3: the champion kit uses objections and never shows a won-deal note as timing
test("champion_enablement_kit: objections used; champion wins not shown as timing", async () => {
  const r = await call("champion_enablement_kit", { asset_type: "internal_business_case", your_solution: "Spendrill", target_stakeholder: "CFO",
    known_objections: "our ERP already has an expense module", champion_wins: "won where the finance controller owns the close" });
  assert.match(r.text, /our ERP already has an expense module/i);
  assert.match(r.text, /month of the buyer.s own transactions|gap between the ERP module/); // the fintech answer pattern, not a generic one
  assert.doesNotMatch(r.text, /\*\*Timing:\*\* won where the finance controller owns the close/);
});

// Problem 3 and 8: the account plan does not ask for what was given and adds sector knowledge
test("account_plan_builder: given contacts are used, not asked for; sector notes", async () => {
  const r = await call("account_plan_builder", { account_name: "Example Logistics Co", industry: "third-party logistics", your_solution: "Lanehop",
    known_contacts: "Head of Last-Mile Operations (champion), COO (economic buyer)" });
  assert.doesNotMatch(r.text, /Identify 2-3 potential champions/);
  assert.match(r.text, /Head of Last-Mile Operations/);
  assert.match(r.text, /cost per delivery|first-attempt|fleet/i);
});

// Run 19 R19-36 (ledger B16-18): a revenue or employee count you give is labelled as yours, and its row is not called an estimate.
test("roi_business_case_builder: given revenue and employees are labelled as your input, estimated ones keep Est.", async () => {
  const row = (text, start) => text.split("\n").find((l) => l.startsWith(start)) || "";
  const both = (await call("roi_business_case_builder", { customer_name: "Example Retail Co", industry: "Retail", your_solution: "Lanehop",
    primary_value_driver: "cost_reduction", company_size: "mid_market", annual_revenue: 60000000, employee_count: 500, solution_price: 90000 })).text;
  assert.equal(row(both, "| **Annual Revenue** |"), "| **Annual Revenue** | $60,000,000 (your input) |");
  assert.equal(row(both, "| **Employees** |"), "| **Employees** | 500 (your input) |");
  assert.ok(!both.includes("| **Est. Annual Revenue** |") && !both.includes("| **Est. Employees** |"));
  const est = (await call("roi_business_case_builder", { customer_name: "Example Retail Co", industry: "Retail", your_solution: "Lanehop",
    primary_value_driver: "cost_reduction", company_size: "mid_market", employee_count: 500, solution_price: 90000 })).text;
  assert.match(row(est, "| **Est. Annual Revenue** |"), /estimated from your employee count/);
  assert.equal(row(est, "| **Employees** |"), "| **Employees** | 500 (your input) |");
});

// Run 19 R19-36 (safety-live.md Part 4 gap 3): /mcp answers carry the same security headers as the JSON answers of /api/tools.
test("/mcp answers carry Referrer-Policy, a frame rule and a JSON content policy", async () => {
  for (const req of [new Request("https://x.gtmhelix.com/mcp", { method: "GET" }),
    new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }) })]) {
    const r = await handler(req);
    assert.equal(r.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(r.headers.get("x-frame-options"), "DENY");
    assert.equal(r.headers.get("content-security-policy"), "default-src 'none'; frame-ancestors 'none'");
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  }
});
