// Run 21b late task (test first): the per-vertical tables of Revenue Enablement (MAP_EVAL rollout steps, DEMO_SHOW demo list) were written for one kind of
// company per vertical. For the four verticals not covered by run21-stock-rollout-steps.test.mjs (spend and expense, operators and enterprise
// connectivity, cloud security, API testing) the stock wording must appear only for the kind it was written for. Companies are plain words, no names.
// The other tables of src/index.ts are keyed by driver, audience, role or business model, not by vertical, so they are not touched.
import { test } from "node:test";
import assert from "node:assert/strict";
const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const BUILD = { section_type: "executive_summary", customer_name: "an account", customer_industry: "companies", customer_challenges: "slow manual work" };
const rollout = (s) => call("proposal_section_writer", { ...BUILD, your_solution: s });
const demo = (s) => call("demo_script_builder", { demo_type: "first_look", primary_audience: "decision maker", your_solution: s });

const CASES = [
  { vertical: "fintech",
    stock: "Spend management software with expense claims, approvals and corporate cards",
    other: "Lending platform with loan origination and credit decisioning",
    steps: /close the books|one close cycle|pilot entity or department/i,
    show: /posting in the ledger|stops doing by hand at month end/i },
  { vertical: "telecom",
    stock: "Enterprise connectivity provider with SD-WAN and managed network links for company sites",
    other: "Messaging platform for business texts and one time passwords",
    steps: /site survey|delivery time of each link|wave plan by region|incumbent|current operator/i,
    show: /monitoring view of a set of sites|outage and repair report|wave plan for a rollout/i },
  { vertical: "cybersecurity",
    stock: "Cloud security posture management that finds and ranks exposures in cloud accounts",
    other: "Email security software that blocks phishing",
    steps: /proof of value in writing|exposures found and closed|cloud accounts, SIEM/i,
    show: /Exposures found and ranked in a sample environment|finding reaches the person who can fix it/i },
  { vertical: "software",
    stock: "API testing platform for developers with automated tests, mocks and collections",
    other: "Continuous integration and deployment pipeline software for developers",
    steps: /release frequency, escaped defects|existing scripts and tests through the import path/i,
    show: /real project imported through the path|read by a team lead/i },
];

for (const c of CASES) {
  test(`${c.vertical}: rollout steps in proposal_section_writer are stock only for the kind they were written for`, async () => {
    const a = await rollout(c.stock), b = await rollout(c.other);
    assert.match(a, c.steps);
    assert.doesNotMatch(b, c.steps);
    assert.match(b, /pilot scope|baseline and the measure the buyer names/i);
  });
  test(`${c.vertical}: the demo list in demo_script_builder is stock only for the kind it was written for`, async () => {
    const a = await demo(c.stock), b = await demo(c.other);
    assert.match(a, c.show);
    assert.doesNotMatch(b, c.show);
    assert.match(b, /workflow the buyer described, end to end/i);
  });
}
