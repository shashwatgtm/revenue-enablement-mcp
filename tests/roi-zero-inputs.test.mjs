// Run 16 (R16-12, owner decision D45): roi_business_case_builder and annual_revenue or employee_count given as 0.
// It mirrors D34 (tests/roi-zero-price.test.mjs). Omitted, null and 0 are told apart with explicit checks.
//   omitted or null: the row says "not supplied".
//   0: the user's own input, shown as given ("$0 (your input)", "0 (your input)"). Nothing is estimated from it.
//   an ordinary value: shown as given, labelled "(your input)".
// The /mcp input check counts a null member as not given, so null is not refused: it means the same as omitted.
// Run 19 R19-36 (ledger B16-18): a value you give is labelled "(your input)".
// Run 20 round 1 (rule B81, tests/run20-roi-no-figures.test.mjs): revenue and employee count are the customer's size, not a value
// figure. The tool no longer estimates the missing one from the other (it used an uncited revenue-per-employee table) and no longer
// turns either into a value (a fixed share of revenue). So: with the buyer's own annual_value_estimate (here 100,000, the amount
// the old model gave for a revenue of 10,000,000) the answer is calculated as before and the size rows are labelled; without a buyer
// figure the answer prints no ROI, payback or value and names the missing inputs. The old checks of "not computed: add your annual
// revenue" for a value that came from a revenue of 0 are gone with that value; the price-0 rule (D34) is unchanged.
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
const NEEDS_PRICE = "not computed: add your annual price";

const PROD = { your_solution: "Helix Platform", primary_value_driver: "productivity" };
const WITH_VALUE = { ...PROD, annual_value_estimate: 100000 };
const noReturn = (text) => {
  assert.ok(!/\*\*ROI\*\*\s*\||Payback Period|Total Quantified Value|\d\s*%/.test(text), "the answer prints a return");
  assert.ok(text.includes("annual_value_estimate") && text.includes("current_annual_cost") && text.includes("expected_improvement_percent"), "the missing inputs are not named");
  assert.ok(!/estimated from your|Infinity|NaN/.test(text));
};

// ---------- annual_revenue ----------

for (const [label, rev] of [["omitted", undefined], ["null", null]]) {
  test(`annual_revenue ${label}: the row says not supplied, no revenue is estimated from the employee count`, async () => {
    const args = { ...WITH_VALUE, employee_count: 100 };
    if (rev !== undefined) args.annual_revenue = rev;
    const { isError, text } = await call(args);
    assert.equal(isError, false);
    assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | not supplied |");
    assert.match(row(text, "| **Employees** |"), /\| 100 \(your input\) \|$/);
    assert.match(row(text, "**Total Quantified Value**"), /\*\*\$100,000\*\*/);
    assert.ok(!text.includes("$25,000,000") && !/estimated from your/.test(text));
  });
}

test("annual_revenue 0 (employees given), no buyer figure: shown as $0 (your input), never estimated; no return is printed", async () => {
  const { isError, text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100 });
  assert.equal(isError, false);
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | $0 (your input) |");
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 100 (your input) |");
  noReturn(text);
});

test("annual_revenue 0 (employees given), with the buyer's value: both rows labelled, the value is the buyer's, nothing is estimated", async () => {
  const { text } = await call({ ...WITH_VALUE, annual_revenue: 0, employee_count: 100 });
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | $0 (your input) |");
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 100 (your input) |");
  assert.ok(!/estimated from your employee count/.test(text), "revenue was estimated from the employee count");
  assert.match(row(text, "**Total Quantified Value**"), /\*\*\$100,000\*\*/);
  assert.match(row(text, "| **ROI** |"), /\| 900% \|/);
});

test("annual_revenue ordinary value: shown as given, not estimated, not turned into a value", async () => {
  const a = await call({ ...WITH_VALUE, annual_revenue: 10000000, employee_count: 100 });
  assert.match(row(a.text, "| **Annual Revenue** |"), /\| \$10,000,000 \(your input\) \|$/);
  assert.match(row(a.text, "**Total Quantified Value**"), /\*\*\$100,000\*\*/);
  assert.ok(!a.text.includes("not computed"));
  assert.ok(!a.text.includes("| **Est. "), "nothing is estimated");
  const b = await call({ ...PROD, annual_revenue: 10000000, employee_count: 100 });
  noReturn(b.text);
  assert.match(row(b.text, "| **Annual Revenue** |"), /\| \$10,000,000 \(your input\) \|$/);
});

// ---------- employee_count ----------

for (const [label, emp] of [["omitted", undefined], ["null", null]]) {
  test(`employee_count ${label}: the row says not supplied, no count is estimated from the revenue`, async () => {
    const args = { ...WITH_VALUE, annual_revenue: 10000000 };
    if (emp !== undefined) args.employee_count = emp;
    const { isError, text } = await call(args);
    assert.equal(isError, false);
    assert.equal(row(text, "| **Employees** |"), "| **Employees** | not supplied |");
    assert.ok(!/estimated from your annual revenue/.test(text));
  });
}

test("employee_count 0 (revenue given): shown as 0 (your input), never estimated from the revenue", async () => {
  const { isError, text } = await call({ ...WITH_VALUE, annual_revenue: 10000000, employee_count: 0 });
  assert.equal(isError, false);
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 0 (your input) |");
  assert.ok(!/estimated from your annual revenue/.test(text), "employees were estimated from the revenue");
  assert.match(row(text, "| **Annual Revenue** |"), /\| \$10,000,000 \(your input\) \|$/);
  assert.match(row(text, "**Total Quantified Value**"), /\*\*\$100,000\*\*/);
  assert.ok(!text.includes("not computed"));
});

test("employee_count 0 and no buyer figure: shown as 0 (your input); the answer names the missing inputs and prints no return", async () => {
  const { text } = await call({ ...PROD, employee_count: 0 });
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 0 (your input) |");
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | not supplied |");
  noReturn(text);
});

test("employee_count ordinary value: shown as given, not estimated", async () => {
  const { text } = await call({ ...WITH_VALUE, annual_revenue: 10000000, employee_count: 100 });
  assert.match(row(text, "| **Employees** |"), /\| 100 \(your input\) \|$/);
  assert.ok(!/estimated from your annual revenue/.test(text));
});

// ---------- both 0, and 0 with a price of 0 ----------

test("annual_revenue 0 and employee_count 0: both shown as given, nothing estimated", async () => {
  const { isError, text } = await call({ ...PROD, annual_revenue: 0, employee_count: 0 });
  assert.equal(isError, false);
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | $0 (your input) |");
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | 0 (your input) |");
  noReturn(text);
});

test("a price of 0 still wins for the figures that divide by the price (D34), with revenue 0", async () => {
  const { text } = await call({ ...WITH_VALUE, annual_revenue: 0, employee_count: 100, solution_price: 0 });
  assert.ok(row(text, "| **ROI** |").startsWith("| **ROI** | " + NEEDS_PRICE + " |"));
  assert.ok(row(text, "| **Payback Period** |").startsWith("| **Payback Period** | " + NEEDS_PRICE + " |"));
  assert.equal(row(text, "**Solution Cost**"), "| **Solution Cost** | $0 (your input) | $0 (your input) | $0 (your input) |");
});

test("a price of 0 and no buyer figure: the answer shows the price as the user's input and prints no return", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100, solution_price: 0 });
  assert.match(row(text, "| **Annual price** |"), /\$0 \(your input\)/);
  noReturn(text);
});

test("neither size input given: the rows say not supplied", async () => {
  const { text } = await call({ ...WITH_VALUE });
  assert.equal(row(text, "| **Annual Revenue** |"), "| **Annual Revenue** | not supplied |");
  assert.equal(row(text, "| **Employees** |"), "| **Employees** | not supplied |");
  const none = await call({ ...PROD });
  assert.equal(row(none.text, "| **Annual Revenue** |"), "| **Annual Revenue** | not supplied |");
  noReturn(none.text);
});
