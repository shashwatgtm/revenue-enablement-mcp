// Run 16 R16-41 (the verifier's Medium note, a D45 gap): in roi_business_case_builder the Cost Reduction figures used
// Math.max(10, employees x 0.1), so an employee count given as 0 still showed "Employees impacted: 10" and a saving.
// Run 20 round 1 (rule B81): that example model is gone. The tool no longer turns revenue or employee count into a value or an
// "employees impacted" count (it applied the uncited labour rate of five industries and a minimum of 10 employees). The D45 rule it
// protected now reads: an employee count or revenue typed as 0 is shown as the user's input, nothing is estimated from it, no
// "employees impacted" or saving is printed, and a value the buyer gave (annual_value_estimate, or current_annual_cost with
// expected_improvement_percent) is calculated as given whatever the employee count is. The cases below are the old four, re-written.
// Run: node --test tests/roi-zero-employees-cost.test.mjs
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
const BASE = { customer_name: "Branchwire", your_solution: "Lanehop", company_size: "smb", solution_price: 50000 };

test("cost_reduction with employee_count 0 and no buyer figure: shown as 0 (your input), no impacted employees, no saving, no ROI", async () => {
  const t = await call({ ...BASE, primary_value_driver: "cost_reduction", annual_revenue: 5000000, employee_count: 0 });
  assert.match(t, /\| \*\*Employees\*\* \| 0 \(your input\) \|/);
  assert.doesNotMatch(t, /Employees impacted|Annual Cost Savings|Weekly savings|Hourly cost of labor/);
  assert.doesNotMatch(t, /\*\*ROI\*\*\s*\||Payback Period|\d\s*%/);
  assert.match(t, /annual_value_estimate/);
});

test("multiple with employee_count 0 and no buyer figure: nothing is estimated from the 0", async () => {
  const t = await call({ ...BASE, primary_value_driver: "multiple", annual_revenue: 5000000, employee_count: 0 });
  assert.doesNotMatch(t, /Employees impacted|estimated from your/);
  assert.match(t, /\| \*\*Employees\*\* \| 0 \(your input\) \|/);
});

test("cost_reduction with annual_revenue 0 and no employee count: the 0 revenue is shown and no employee count is estimated from it", async () => {
  const t = await call({ ...BASE, primary_value_driver: "cost_reduction", annual_revenue: 0 });
  assert.match(t, /\| \*\*Annual Revenue\*\* \| \$0 \(your input\) \|/);
  assert.match(t, /\| \*\*Employees\*\* \| not supplied \|/);
  assert.doesNotMatch(t, /Employees impacted|estimated from your/);
});

test("with the buyer's own value, any employee count (omitted, null, 0, ordinary) leaves the calculation the same", async () => {
  const roi = [];
  for (const e of [undefined, null, 0, 45]) {
    const t = await call({ ...BASE, primary_value_driver: "cost_reduction", annual_revenue: 5000000, employee_count: e, annual_value_estimate: 200000 });
    assert.doesNotMatch(t, /Employees impacted/);
    roi.push(t.match(/\| \*\*ROI\*\* \| ([^|]*) \|/)[1]);
    assert.match(t, /\| \*\*Total Quantified Value\*\* \| \*\*\$200,000\*\* \|/);
  }
  assert.deepEqual([...new Set(roi)], ["300%"]);
});
