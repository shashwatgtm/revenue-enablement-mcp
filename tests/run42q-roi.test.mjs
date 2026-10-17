// Run 42Q (owner approval, 17 October 2026): roi_business_case_builder shows no ROI, payback or value built from built-in example hours,
// headcount, rates or shares of revenue when the buyer gave no figure of their own. It explains the method in plain words, uses the figures
// the input gives only as stated and labelled, and asks for at most three missing numbers. With the buyer's figures it computes as before.
// Invented sellers only (B81).
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "roi_business_case_builder", arguments: args } }),
  }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const NOTES = { customer_name: "sales teams account (Murmur customer)", your_solution: "Murmur, a meeting assistant: live transcription, summaries with action items and follow-ups synced to the CRM", solution_price: 12000, primary_value_driver: "cost_reduction",
  known_metrics: "Dana Reyes, VP of Sales at Example Co: our team is getting 33% time back.; Lee Park, Head of Enablement at Sample Ltd: I use it every day. It is a superpower." };

for (const driver of ["revenue_increase", "cost_reduction", "productivity", "risk_mitigation", "multiple"]) {
  test(`no buyer figure (${driver}): no ROI, payback, value or example figure, whatever sizes are given`, async () => {
    const t = await call({ ...NOTES, primary_value_driver: driver, annual_revenue: 20000000, employee_count: 150, industry: "Technology" });
    assert.doesNotMatch(t, /\| \*\*ROI\*\* \||\d+% ROI|months\*\* payback|Example figure|Hours saved per employee|Employees impacted|Hourly cost of labor|Revenue baseline|in annual value/);
    assert.match(t, /No ROI percentage, payback period or headline return is shown/);
    assert.match(t, /## How the return will be worked out/);
  });
}

test("no buyer figure: at most three numbered asks, each naming the input it fills", async () => {
  for (const extra of [{}, { solution_price: undefined }, { current_annual_cost: 500000 }, { expected_improvement_percent: 20 }]) {
    const args = { ...NOTES, ...extra };
    if (extra.solution_price === undefined && "solution_price" in extra) delete args.solution_price;
    const t = await call(args);
    const sec = t.slice(t.indexOf("## The numbers to ask for"), t.indexOf("Then run roi_business_case_builder again"));
    const asks = sec.split("\n").filter((l) => /^\d+\. /.test(l));
    assert.ok(asks.length >= 1 && asks.length <= 3, JSON.stringify(extra) + ": " + asks.length);
    for (const a of asks) assert.match(a, /`(?:current_annual_cost|expected_improvement_percent|solution_price|annual_value_estimate)`/);
    if (extra.current_annual_cost) assert.ok(!asks.some((a) => /`current_annual_cost`/.test(a)), "asks for the cost it was given");
    if (extra.expected_improvement_percent) assert.ok(!asks.some((a) => /`expected_improvement_percent`/.test(a)), "asks for the share it was given");
  }
});

test("a figure the input gives is used as stated and labelled, never entered as the buyer's share", async () => {
  const t = await call(NOTES);
  assert.match(t, /"33% time back", from "Dana Reyes, VP of Sales at Example Co"\) are another organisation's results, as you gave them/);
  assert.doesNotMatch(t, /expected_improvement_percent[^\n]*= 33|33% of/);
  // a quote with no figure and no change is credibility, not a result to measure; the speaker's sales title does not make it a revenue result
  assert.match(t, /Not value figures[^\n]*It is a superpower/);
  assert.doesNotMatch(t.split("## Results you quoted")[1].split("##")[0], /revenue or volume/);
});

test("the current process becomes cost lines with what to count, by kind", async () => {
  const t = await call({ ...NOTES, current_process: "today they handle it with manual estimating on pencil and paper; juggling multiple software tools" });
  assert.match(t, /\| Manual estimating on pencil and paper \| The people who do it, the hours a week each spends/);
  assert.match(t, /\| Juggling multiple software tools \| What the separate pieces cost in total/);
  assert.doesNotMatch(t, /What a wrong plan costs/);
});

test("with the buyer's own figures the calculation is unchanged", async () => {
  const t = await call({ ...NOTES, current_annual_cost: 300000, expected_improvement_percent: 20 });
  assert.match(t, /### Value From Your Figures/);
  assert.match(t, /\| \*\*ROI\*\* \| 400% \|/);
  const v = await call({ ...NOTES, annual_value_estimate: 60000 });
  assert.match(v, /\| \*\*ROI\*\* \| 400% \|/);
});
