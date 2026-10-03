// Run 21c addendum A1 (test first): solutionBrief() cut a plain description to its first capitalised word ("Route planning software for ..." became
// "Route", "Our platform helps ..." became "Our"), so answers said "Our won this deal", "Our's price", "Topic: Modern". A short name is now used only
// when the user clearly gave one ("Name, ..." or "Name: ..."); otherwise the whole description when it is 6 words or fewer, else "your solution" style fallbacks.
// Run: node --no-warnings --test tests/run21c-solutionbrief.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { solutionBrief } = await import(new URL("../src/dealtext.ts", import.meta.url));
const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));

const PLAIN = [
  "Route planning software for last mile delivery fleets",
  "Our platform helps logistics companies reduce delays",
  "Identity and access management for enterprises",
  "Modern workflow software for revenue teams",
  "Freight visibility platform for shippers",
  "AI agents that answer support tickets",
  "Developer platform for API testing and monitoring",
  "Messaging platform for SMS and WhatsApp",
];
const CUT = /\b(?:Route|Our|Identity|Modern|Freight|Developer|Messaging)(?:'s| won| lost| was| is| has| helps| costs| will| can| gives| needs)\b|Topic: (?:Route|Our|Identity|Modern|Freight|Developer|Messaging)\b|\b(?:Route|Our|Identity|Modern|Freight|Developer|Messaging)'s\b/;

test("a plain description gives no one-word short name", () => {
  for (const d of PLAIN) {
    const b = solutionBrief(d);
    const words = d.split(/\s+/).length;
    assert.ok(b.short === "" || b.short === d, `${d} -> "${b.short}"`);
    if (words <= 6) assert.equal(b.short, d, d);
    else assert.equal(b.short, "", d);
  }
});

test("a clear name before a comma or colon stays the short name", () => {
  assert.equal(solutionBrief("Lanehop, a route planning platform for delivery fleets").short, "Lanehop");
  assert.equal(solutionBrief("Acme CRM: a pipeline tool for sales teams").short, "Acme CRM");
  assert.equal(solutionBrief("Sarvam from Sarvam AI, an API platform for building and using APIs").short, "Sarvam");
  assert.equal(solutionBrief("Chargebee Billing, subscription billing and revenue operations").short, "Chargebee Billing");
  assert.equal(solutionBrief("monday.com: a work operating system").short, "monday.com");
  assert.equal(solutionBrief("Lanehop, a route planning platform for delivery fleets").kind, "a route planning platform for delivery fleets");
});

test("a descriptive phrase before a comma is not a name", () => {
  const b = solutionBrief("Route planning software for last mile delivery fleets, built for dispatch teams");
  // up to four capitalised-start words before a comma are read as a name, as CRAFT GTM does; the whole phrase is kept, never its first word
  assert.ok(b.short === "" || b.short.split(/\s+/).length > 1, b.short);
  assert.notEqual(b.short, "Route");
});

const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const base = (sol) => ({
  account_plan_builder: { account_name: "Northwind Cargo", your_solution: sol, current_products: sol },
  deal_strategy_coach: { deal_name: "Northwind deal", deal_stage: "evaluation", your_solution: sol, competitors: "Rival Systems" },
  discovery_question_bank: { framework: "meddpicc", your_solution: sol },
  roi_business_case_builder: { your_solution: sol, primary_value_driver: "cost_reduction" },
  mutual_action_plan_generator: { deal_name: "Northwind deal", target_close_date: "2026-12-15", your_solution: sol },
  win_loss_analyzer: { analysis_type: "single_deal", deal_outcome: "won", your_solution: sol, deal_details: "A national shipper chose us after a pilot." },
  proposal_section_writer: { section_type: "executive_summary", your_solution: sol, customer_name: "Northwind Cargo" },
  email_sequence_generator: { sequence_type: "cold_outreach", target_persona: "VP Operations", your_solution: sol },
  demo_script_builder: { demo_type: "first_look", your_solution: sol },
  pricing_negotiation_guide: { scenario: "discount_request", your_solution: sol },
  champion_enablement_kit: { asset_type: "executive_brief", your_solution: sol },
  competitive_trap_setter: { competitor: "Rival Systems", your_solution: sol },
});

test("no Revenue tool answer carries a name cut to one word", async () => {
  for (const d of PLAIN) {
    for (const [tool, args] of Object.entries(base(d))) {
      const out = await call(tool, args);
      const m = out.match(CUT);
      assert.ok(!m, `${tool} | ${d} | ${m && out.slice(Math.max(0, m.index - 40), m.index + 60)}`);
    }
  }
});

test("a clear name is still used by the tools", async () => {
  const out = await call("win_loss_analyzer", base("Lanehop, a route planning platform for delivery fleets").win_loss_analyzer);
  assert.match(out, /Lanehop/);
});

// Run 21c A2 (E11): a long pasted paragraph with a colon list, a bracket note and several sentences gave " ." (a space before a full stop) in eight tools.
test("a pasted paragraph with a colon list and a bracket note gives no space before a full stop", async () => {
  const para = "CRM for sales, marketing and service teams: lead capture, task routing, a mobile app for site visits, and a service desk. Built for sales and service teams that manage leads, including field staff. No single view of customers across sales and service, and dependence on outside tools (implied by the page's promise of one view and fewer outside tools). One view of customers, fewer outside tools and lower costs, with faster ticket resolution.";
  for (const [tool, args] of Object.entries(base(para))) {
    const out = await call(tool, args);
    const m = out.match(/(?<=\w)[ \t]+\.(?=\s|$)/);
    assert.ok(!m, `${tool}: ${m && out.slice(Math.max(0, m.index - 60), m.index + 40)}`);
  }
  const b = solutionBrief(para);
  assert.equal(b.short, "");
  for (const p of b.parts) assert.doesNotMatch(p, /\.\s+[A-Z]/, p);
});

// Run 21c round 3: with no clear name the text says "our solution", and it began sentences in lower case ("our solution is our answer").
test("a sentence that begins with the solution phrase starts with a capital", async () => {
  const sol = "Firstsource customer experience and collections services on Kairos, AI-native business operations: it designs, builds and runs customer experience, collections and back office under one contract";
  for (const tool of ["proposal_section_writer", "email_sequence_generator", "champion_enablement_kit", "win_loss_analyzer", "demo_script_builder", "competitive_trap_setter"]) {
    const out = await call(tool, base(sol)[tool]);
    const m = out.match(/(?:^|[.!?]\s+|\n)(?:[-*]\s+|#+\s+)?(?:our|your|the|this) (?:solution|product)\b/);
    assert.ok(!m, `${tool}: ${m && out.slice(Math.max(0, m.index - 20), m.index + 60)}`);
  }
});

// Run 21c round 3 (test first): with one stated pain and several features to show, the demo script said the whole pain sentence in every step and again in the recap (five times each).
test("demo_script_builder: one stated pain is spelled out once per use, not in every step", async () => {
  const pain = "site teams re-key the same change order into three tools and the budget lags the field by weeks";
  const out = await call("demo_script_builder", { demo_type: "first_look", your_solution: "Gridbeam, a construction management platform for general contractors: job costing, change orders, field daily logs, owner reports and a subcontractor portal", key_pain_points: pain, must_show_features: "job costing; change orders; field daily logs; owner reports", primary_audience: "VP Operations" });
  const n = out.split(pain).length - 1;
  assert.ok(n <= 6, `the pain sentence appears ${n} times`);
});
