// Run 16 R16-41 (the verifier's Medium note, a D45 gap): in roi_business_case_builder the Cost Reduction figures used
// Math.max(10, employees x 0.1), so an employee count given as 0 still showed "Employees impacted: 10" and a saving.
// D45: a typed 0 is used as 0. An employee figure that is 0 because of a typed 0 (employee_count 0, or employees estimated
// from an annual revenue of 0) gives 0 impacted employees and $0 savings; payback, which divides by the value, says what
// to add. Omitted, null and ordinary values are unchanged (the minimum of 10 stays for them).
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
const BASE = { customer_name: "Example Clinic Group", your_solution: "FlowOps", company_size: "smb", solution_price: 50000 };

test("cost_reduction with employee_count 0: 0 impacted, $0 savings, payback says what to add", async () => {
  const t = await call({ ...BASE, primary_value_driver: "cost_reduction", annual_revenue: 5000000, employee_count: 0 });
  assert.match(t, /- Employees impacted: 0\n/);
  assert.match(t, /- Annual Cost Savings: \*\*\$0\*\*/);
  assert.match(t, /\| \*\*Payback Period\*\* \| not computed: add your employee count \|/);
});

test("multiple with employee_count 0: the Cost Reduction part uses 0 impacted employees", async () => {
  const t = await call({ ...BASE, primary_value_driver: "multiple", annual_revenue: 5000000, employee_count: 0 });
  assert.match(t, /- Employees impacted: 0\n/);
});

test("cost_reduction with annual_revenue 0 and no employee count: the estimate from 0 gives 0 impacted", async () => {
  const t = await call({ ...BASE, primary_value_driver: "cost_reduction", annual_revenue: 0 });
  assert.match(t, /- Employees impacted: 0\n/);
});

test("omitted, null and ordinary employee counts keep the minimum of 10", async () => {
  for (const e of [undefined, null, 45]) {
    const t = await call({ ...BASE, primary_value_driver: "cost_reduction", annual_revenue: 5000000, employee_count: e });
    const m = t.match(/- Employees impacted: (\d+)\n/);
    assert.ok(m && Number(m[1]) >= 10, String(e));
  }
});
