// Run 16 (R16-12, owner decision D45): roi_business_case_builder and annual_revenue or employee_count given as 0.
// It mirrors D34 (tests/roi-zero-price.test.mjs). Omitted, null and 0 are told apart with explicit checks.
//   omitted or null: today's behaviour stays exactly as it is (the missing size is estimated and labelled as an example).
//   0: the user's own input, shown as given ("$0 (your input)", "0 (your input)"). A revenue of 0 is never estimated
//     from the employee count. A figure that divides by the value that comes from that 0 prints
//     "not computed: add your annual revenue" (or "add your employee count"). A figure that does not divide by it
//     is computed with 0.
//   an ordinary value: unchanged.
// The /mcp input check counts a null member as not given, so null is not refused: it means the same as omitted.
// Run 19 R19-36 (ledger B16-18): a value you give is labelled "(your input)" and its row drops "Est."; only an estimated value keeps
// "Est." and its example label. The expectations below changed with that rule and nothing else.
// Run 42 (owner approval, 17 October 2026): without a buyer figure the tool no longer estimates a revenue, an employee count or a value
// from them, and calculates no ROI, payback or value. The cases that pinned the old estimates (estimated revenue or employees, example
// productivity and cost values, the not-computed lines that came from a 0 in that estimate) now pin that: every size input is shown as
// given (0 as 0), nothing is estimated, no ROI or example figure is printed. With the buyer's own value, a 0 still flows as before.
// Run: node --test tests/roi-zero-inputs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));

const ACCEPT = "application/json, text/event-stream";
let nextId = 1;
const call = async (args) => {
  const r = await handler(
    new Request("https://x.gtmhelix.com/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: ACCEPT },
      body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "roi_business_case_builder", arguments: args } }),
    })
  );
  const j = await r.json();
  assert.ok(j.result && j.result.content, "expected a tool result, got " + JSON.stringify(j));
  return { isError: j.result.isError === true, text: j.result.content.map((c) => c.text).join("\n") };
};

const row = (text, label) => {
  const line = text.split("\n").find((l) => l.includes(label));
  assert.ok(line, "no line with " + label);
  return line;
};
const NEEDS_REVENUE = "not computed: add your annual revenue";
const NEEDS_EMPLOYEES = "not computed: add your employee count";
const EX = "(Example figure: replace with your own)";
const sensLines = (text, label) =>
  text
    .slice(text.indexOf("### Conservative Scenario"), text.indexOf("## Risk Factors"))
    .split("\n")
    .filter((l) => l.startsWith(label));

const PROD = { your_solution: "Helix Platform", primary_value_driver: "productivity" };

// ---------- no buyer figure: sizes shown as given, nothing estimated, no return ----------
const noReturn = (text, label) => {
  assert.ok(!/\| \*\*ROI\*\* \|/.test(text), label + ": an ROI row is printed");
  assert.ok(!/\d+% ROI|months\*\* payback|Annual Productivity Value|Employees impacted|Example figure|estimated from your/.test(text), label + ": an example figure is printed");
  assert.ok(!/Infinity|NaN/.test(text));
  assert.match(text, /No ROI percentage, payback period or headline return is shown/);
};

for (const [label, rev] of [["omitted", undefined], ["null", null]]) {
  test(`annual_revenue ${label} (employees given): no revenue is estimated and no return is shown`, async () => {
    const args = { ...PROD, employee_count: 100 };
    if (rev !== undefined) args.annual_revenue = rev;
    const { isError, text } = await call(args);
    assert.equal(isError, false);
    assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | not supplied |");
    assert.equal(row(text, "| **Employees** |"), "| **Employees** | 100 (your input) |");
    assert.ok(!text.includes("$25,000,000"));
    noReturn(text, label);
  });
}

test("annual_revenue 0 (employees given): shown as $0 (your input), never estimated from the employees", async () => {
  const { isError, text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100 });
  assert.equal(isError, false);
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | $0 (your input) |");
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 100 (your input) |");
  assert.ok(!text.includes("$25,000,000"), "revenue was estimated from the employee count");
  noReturn(text, "revenue 0");
});

test("annual_revenue 0 with a price and no buyer figure: the price arithmetic only, no return", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100, solution_price: 40000 });
  noReturn(text, "revenue 0, price");
  assert.match(text, /At the annual price you gave \(\$40,000\)/);
});

test("annual_revenue 0 with the buyer's own value: every figure is computed from that value", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100, solution_price: 40000, annual_value_estimate: 100000 });
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | $0 (your input) |");
  assert.ok(row(text, "| **ROI** |").startsWith("| **ROI** | 150% |"));
  assert.ok(!text.includes("not computed"));
});

test("annual_revenue 0 with cost_reduction: the value does not come from revenue, so every figure is computed", async () => {
  const { text } = await call({ your_solution: "Helix Platform", primary_value_driver: "cost_reduction", annual_revenue: 0, employee_count: 100, solution_price: 40000 });
  assert.ok(!text.includes("not computed"));
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | $0 (your input) |");
});

test("annual_revenue and employee_count ordinary values: shown as given, not turned into a value", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 10000000, employee_count: 100 });
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | $10,000,000 (your input) |");
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 100 (your input) |");
  assert.match(text, /this tool does not turn them into a value/);
  noReturn(text, "ordinary");
});

// ---------- employee_count ----------

for (const [label, emp] of [["omitted", undefined], ["null", null]]) {
  test(`employee_count ${label} (revenue given): no employee count is estimated and no return is shown`, async () => {
    const args = { ...PROD, annual_revenue: 10000000 };
    if (emp !== undefined) args.employee_count = emp;
    const { isError, text } = await call(args);
    assert.equal(isError, false);
    assert.equal(row(text, "| **Employees** |"), "| **Employees** | not supplied |");
    noReturn(text, label);
  });
}

test("employee_count 0 (revenue given): shown as 0 (your input), never estimated from the revenue", async () => {
  const { isError, text } = await call({ ...PROD, annual_revenue: 10000000, employee_count: 0 });
  assert.equal(isError, false);
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 0 (your input) |");
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | $10,000,000 (your input) |");
  noReturn(text, "employees 0");
});

test("employee_count 0, cost_reduction, no buyer figure: no impacted employees, no savings, no return", async () => {
  const { text } = await call({ your_solution: "Helix Platform", primary_value_driver: "cost_reduction", annual_revenue: 10000000, employee_count: 0, solution_price: 40000 });
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 0 (your input) |");
  noReturn(text, "cost_reduction employees 0");
});

test("employee_count 0 and no revenue: shown as given, no revenue estimated from it", async () => {
  const { text } = await call({ ...PROD, employee_count: 0 });
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 0 (your input) |");
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | not supplied |");
  noReturn(text, "employees 0 no revenue");
});

// ---------- both 0, and 0 with a price of 0 ----------

test("annual_revenue 0 and employee_count 0: both shown as given, nothing estimated", async () => {
  const { isError, text } = await call({ ...PROD, annual_revenue: 0, employee_count: 0 });
  assert.equal(isError, false);
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | $0 (your input) |");
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 0 (your input) |");
  noReturn(text, "both 0");
});

test("a price of 0 still wins for the figures that divide by the price (D34), with the buyer's own value", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100, solution_price: 0, annual_value_estimate: 100000 });
  assert.ok(row(text, "| **ROI** |").startsWith("| **ROI** | not computed: add your annual price |"));
  assert.ok(row(text, "| **Payback Period** |").startsWith("| **Payback Period** | not computed: add your annual price |"));
  assert.equal(row(text, "**Solution Cost**"), "| **Solution Cost** | $0 (your input) | $0 (your input) | $0 (your input) |");
});

test("a price of 0 and no buyer figure: shown as given, no return", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100, solution_price: 0 });
  noReturn(text, "price 0");
  assert.equal(row(text, "| **Annual price** |"), "| **Annual price** | $0 (your input) |");
});

test("neither size input given: no estimate, no example value, the numbers to ask for are named", async () => {
  const { text } = await call({ ...PROD });
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | not supplied |");
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | not supplied |");
  noReturn(text, "neither");
  assert.match(text, /## The numbers to ask for/);
});
