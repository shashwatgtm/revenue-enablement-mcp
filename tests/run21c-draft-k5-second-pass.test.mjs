// Run 21c second pass for demo_script_builder and the executive summary of proposal_section_writer (test first). Fresh judges named these faults:
// a credibility claim ("over 7 million developers") turned into the demo step; one long step that never shows the pain; attendee functions
// phrased as "the Product, the Engineering"; "which of 2 problems" asked when one was given; the solution description pasted whole; a research
// annotation left inside client text; the differentiators bolded as one long blob; industry unused; to-do lines inside proposal text.
// Invented companies, plain words. Run: node --no-warnings --test tests/run21c-draft-k5-second-pass.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const section = (t, from, to) => t.split(from)[1].split(to)[0];

const DEVFLEET = {
  demo_type: "first_look", primary_audience: "Head of Testing", attendees: "Head of Release Engineering, Sr. Director of QA, Delivery Manager", customer_industry: "retail banking",
  your_solution: "Devfleet, cloud platform for testing apps on real phones and tablets (900+), with automated tests, visual checks, accessibility checks and test reports",
  key_pain_points: "testing before each release is slow and uneven: apps must work on thousands of phone models, operating system versions and screen sizes, and the lab covers a small share of them",
  competitor_context: "a shelf of physical test phones", demo_duration: 30,
  must_show_features: "trusted by 20,000+ teams, over 3 million testers, 120+ integrations, round the clock support (page claims)",
};
const LEDGERLY = {
  demo_type: "first_look", primary_audience: "CFO", attendees: "Product, Engineering, Sales, Finance", customer_industry: "software companies",
  your_solution: "Ledgerly, billing platform for software companies: usage billing, invoicing, subscription management, quoting and revenue recognition",
  key_pain_points: "prices mix flat fees with usage and change deal by deal, and most billing tools were not built for that, so invoices come out wrong, proration breaks and Finance spends days reconciling",
  competitor_context: "billing built in a spreadsheet", demo_duration: 30,
  must_show_features: "supports hybrid usage pricing, a 99.9% uptime SLA, SOC 2 Type 2 report (page claims)",
};

test("a credibility claim is not a demo step; the steps come from the parts of the description", async () => {
  const t = await call("demo_script_builder", DEVFLEET);
  const flow = section(t, "### Part 3", "### Part 4");
  assert.doesNotMatch(flow, /\*\*Step \d+: (?:Over 3 million|Trusted by|120\+|Round the clock)/i);
  assert.match(flow, /over 3 million testers/);               // still said, in the said-not-shown line
  assert.match(flow, /\*\*Step 1: (?:Automated tests|Visual checks|Accessibility checks|Test reports)/);
  assert.ok((flow.match(/^\*\*Step \d+: /gm) || []).length >= 3, "a 16 minute demo is not one long step");
});
test("the steps show the pain the buyer named and the industry is used", async () => {
  const t = await call("demo_script_builder", DEVFLEET);
  const flow = section(t, "### Part 3", "### Part 4");
  assert.match(flow, /On screen: [^\n]*(?:thousands of phone models|small share of them|slow and uneven)/);
  assert.match(flow, /retail banking/);
});
test("attendee functions are phrased as teams, not as 'the Product'", async () => {
  const t = await call("demo_script_builder", LEDGERLY);
  assert.doesNotMatch(t, /the Product,|the Engineering(?! team)|the Sales,|the Finance in the room|the Finance and/);
  assert.match(t, /the Product team/);
  assert.match(t, /the Finance team/);
  assert.match(t, /Ask the Product team:/);
});
test("one stated problem is not asked as 'which of 2 problems'", async () => {
  const t = await call("demo_script_builder", DEVFLEET);
  assert.doesNotMatch(t, /which one should we solve first/);
  const many = await call("demo_script_builder", { ...DEVFLEET, key_pain_points: "slow releases; uneven coverage; no view of results" });
  assert.match(many, /Of those 3 problems, which one should we solve first/);
});
test("a long single sentence of pain is cut at 'so' so the effect is shown as its own problem", async () => {
  const t = await call("demo_script_builder", LEDGERLY);
  const flow = section(t, "### Part 3", "### Part 4");
  assert.match(flow, /invoices come out wrong, proration breaks and Finance spends days reconciling/);
  assert.ok((flow.match(/^\*\*Step \d+: /gm) || []).length >= 3);
});

const GLEANLIKE = {
  section_type: "executive_summary", customer_name: "Lakeside Savings account", customer_industry: "Financial services",
  your_solution: "Askwell, an enterprise AI platform that connects to company tools and data: Askwell Search, Askwell Assistant and Askwell Agents, on top of a context layer, 200+ app connectors and open APIs",
  customer_challenges: "company knowledge spreads across tools and teams, so people cannot find what they need, and AI without company context gives generic answers (implied by the page's promise of one answer layer)",
  key_differentiators: "context from a knowledge graph built on 60+ signals, permissions enforced from every source system in real time, model choice across providers instead of one vendor, and deployment as SaaS or in the customer's own cloud",
  pricing: "$300,000 a year (hypothetical)", success_metrics: "better answers built on what the business knows; 110 hours saved per user per year (page claim)", tone: "consultative", primary_audience: "c_suite",
};
test("proposal: the solution is described, not pasted whole", async () => {
  const t = await call("proposal_section_writer", GLEANLIKE);
  const sol = section(t, "### The Solution", "### The Opportunity");
  assert.doesNotMatch(sol, /connects to company tools and data: Askwell Search/);
  assert.match(sol, /Askwell is an enterprise AI platform/);
  assert.match(sol, /Askwell Search/);
  assert.match(sol, /200\+ app connectors/);
});
test("proposal: a research annotation never sits inside client-facing text and is listed once for the seller", async () => {
  const t = await call("proposal_section_writer", GLEANLIKE);
  const client = t.split("### Before you send")[0];
  assert.doesNotMatch(client, /implied by the page/);
  const notes = t.split("### Before you send")[1];
  assert.match(notes, /implied by the page's promise of one answer layer/);
  assert.equal((t.match(/implied by the page/g) || []).length, 1);
});
test("proposal: the differentiators are separate recommendation points, not one bold blob", async () => {
  const t = await call("proposal_section_writer", GLEANLIKE);
  const rec = section(t, "### Our Recommendation", "### Expected Outcomes");
  assert.doesNotMatch(rec, /\*\*/);
  for (const d of ["context from a knowledge graph built on 60+ signals", "permissions enforced from every source system in real time", "model choice across providers instead of one vendor", "deployment as SaaS or in the customer's own cloud"]) assert.match(rec, new RegExp(`^- ${d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"));
});
test("proposal: the opening has no doubled brackets, uses the industry once, and no to-do sits in client text", async () => {
  const t = await call("proposal_section_writer", GLEANLIKE);
  const client = t.split("### Before you send")[0];
  assert.doesNotMatch(client, /\)\s*\(/);
  assert.match(client.split("### The Solution")[0], /Financial services/);
  assert.doesNotMatch(client, /Add one piece of evidence|add it or soften/);
  assert.doesNotMatch(client, /In AI native|In enterprise AI|In [a-z ]+, buyers usually judge/);
});
test("proposal: no placeholder, dashes or health words; nothing given is lost", async () => {
  const t = await call("proposal_section_writer", GLEANLIKE);
  assert.doesNotMatch(t, /\[[^\]\n]{1,80}\]|\{[^}\n]{1,80}\}|your product|\bTBD\b|Insert/i);
  assert.doesNotMatch(t, /[–—]/);
  assert.doesNotMatch(t, /clinic|pharmac|healthcare|hospital|patient/i);
  for (const v of ["$300,000 a year (hypothetical)", "110 hours saved per user per year", "Lakeside Savings account", "deployment as SaaS or in the customer's own cloud"]) assert.ok(t.includes(v), v);
});

test("proposal: a list with a short item is not cut into fragments; one point reads in the singular; a long first challenge is cut in the opening", async () => {
  const t = await call("proposal_section_writer", { ...GLEANLIKE, customer_challenges: "no single view of customers across marketing, sales and service, and dependence on outside tools", key_differentiators: "one answer layer over every tool the team uses" });
  const opp = section(t, "### The Opportunity", "### Our Recommendation");
  assert.match(opp, /- no single view of customers across marketing, sales and service, and dependence on outside tools/);
  assert.match(t, /Add one piece of evidence for the point under Our Recommendation/);
  assert.doesNotMatch(t, /the 1 point|on the 1 point/);
  const long = await call("proposal_section_writer", { ...GLEANLIKE, customer_challenges: "a duality in technology adoption: extreme focus on cost containment by clients on one side and deep motivation to modernize and innovate on the other, while legacy applications, infrastructure and data centers need to move to cloud native solutions" });
  const open = long.split("### The Solution")[0];
  assert.match(open, /told us about one problem: a duality in technology adoption\./);
  assert.ok(open.length < 700);
  assert.match(long.split("### Next Steps")[1].split("---")[0], /listed under The Opportunity/);
  assert.doesNotMatch(long, /services's kind/);
});
