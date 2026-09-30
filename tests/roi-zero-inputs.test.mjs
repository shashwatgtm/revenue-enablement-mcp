// Run 16 (R16-12, owner decision D45): roi_business_case_builder and annual_revenue or employee_count given as 0.
// It mirrors D34 (tests/roi-zero-price.test.mjs). Omitted, null and 0 are told apart with explicit checks.
//   omitted or null: today's behaviour stays exactly as it is (the missing size is estimated and labelled as an example).
//   0: the user's own input, shown as given ("$0 (your input)", "0 (your input)"). A revenue of 0 is never estimated
//     from the employee count. A figure that divides by the value that comes from that 0 prints
//     "not computed: add your annual revenue" (or "add your employee count"). A figure that does not divide by it
//     is computed with 0.
//   an ordinary value: unchanged.
// The /mcp input check counts a null member as not given, so null is not refused: it means the same as omitted.
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

// ---------- annual_revenue ----------

for (const [label, rev] of [["omitted", undefined], ["null", null]]) {
  test(`annual_revenue ${label}: revenue is estimated from the employee count and labelled as an example`, async () => {
    const args = { ...PROD, employee_count: 100 };
    if (rev !== undefined) args.annual_revenue = rev;
    const { isError, text } = await call(args);
    assert.equal(isError, false);
    assert.match(row(text, "| **Est. Annual Revenue** |"), /\$25,000,000, estimated from your employee count \(Example figure: replace with your own\)/);
    assert.match(row(text, "| **Est. Employees** |"), /\| 100 \|$/);
    assert.match(row(text, "Annual Productivity Value"), /\*\*\$250,000\*\*/);
    assert.ok(!text.includes("(your input)"));
    assert.ok(!text.includes("add your annual revenue"));
  });
}

test("annual_revenue 0 (employees given): shown as $0 (your input), never estimated from the employees", async () => {
  const { isError, text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100 });
  assert.equal(isError, false);
  assert.equal(row(text, "| **Est. Annual Revenue** |"), "| **Est. Annual Revenue** | $0 (your input) |");
  assert.equal(row(text, "| **Est. Employees** |"), "| **Est. Employees** | 100 |");
  assert.ok(!text.includes("$25,000,000"), "revenue was estimated from the employee count");
  assert.ok(!/estimated from your employee count/.test(text), "revenue was estimated from the employee count");
  assert.match(row(text, "Revenue baseline:"), /Revenue baseline: \$0 \(your input\)$/);
  assert.match(row(text, "Annual Productivity Value"), /\*\*\$0\*\* \(Example figure: replace with your own\)$/);
});

test("annual_revenue 0, no price: figures that divide by the value print the not-computed line", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100 });
  assert.ok(row(text, "| **ROI** |").startsWith("| **ROI** | " + NEEDS_REVENUE + " |"));
  assert.ok(row(text, "| **Payback Period** |").startsWith("| **Payback Period** | " + NEEDS_REVENUE + " |"));
  assert.ok(row(text, "| **Value/Cost Ratio** |").startsWith("| **Value/Cost Ratio** | " + NEEDS_REVENUE + " |"));
  for (const label of ["- ROI: ", "- Payback: "]) {
    const hits = sensLines(text, label);
    assert.equal(hits.length, 2);
    for (const h of hits) assert.equal(h, label + NEEDS_REVENUE);
  }
  const summary = text.slice(text.indexOf("## One-Page Executive Summary"));
  assert.ok(!/\d+%\*\* ROI/.test(summary) && !/months\*\* payback/.test(summary));
  assert.ok(summary.includes("- **ROI:** " + NEEDS_REVENUE) && summary.includes("- **Payback:** " + NEEDS_REVENUE));
  assert.ok(!/Infinity|NaN/.test(text));
});

test("annual_revenue 0: figures that do not divide by it are computed with 0", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100 });
  assert.match(row(text, "**Total Quantified Value**"), /\*\*\$0\*\*/);
  assert.match(row(text, "**Net Annual Benefit**"), /\| \$0 /);
  assert.match(row(text, "**3-Year Net Value**"), /\| \$0 \|/);
  assert.equal(sensLines(text, "- Annual Value: ").join("|"), "- Annual Value: $0|- Annual Value: $0");
  assert.match(text, /- \*\*\$0\*\* in annual value/);
  assert.match(text, /Cost of delay: \$0\/month/);
});

test("annual_revenue 0 with a price: ROI and the ratio are computed, payback divides by the value and is not computed", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100, solution_price: 40000 });
  assert.ok(row(text, "| **ROI** |").startsWith("| **ROI** | -100% |"));
  assert.ok(row(text, "| **Value/Cost Ratio** |").startsWith("| **Value/Cost Ratio** | 0.0x |"));
  assert.ok(row(text, "| **Payback Period** |").startsWith("| **Payback Period** | " + NEEDS_REVENUE + " |"));
  assert.equal(sensLines(text, "- Payback: ").join("|"), "- Payback: " + NEEDS_REVENUE + "|- Payback: " + NEEDS_REVENUE);
});

test("annual_revenue 0 with cost_reduction: the value does not come from revenue, so every figure is computed", async () => {
  const { text } = await call({ your_solution: "Helix Platform", primary_value_driver: "cost_reduction", annual_revenue: 0, employee_count: 100, solution_price: 40000 });
  assert.ok(!text.includes("not computed"));
  assert.equal(row(text, "| **Est. Annual Revenue** |"), "| **Est. Annual Revenue** | $0 (your input) |");
});

test("annual_revenue ordinary value: shown as given, not estimated", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 10000000, employee_count: 100 });
  assert.match(row(text, "| **Est. Annual Revenue** |"), /\| \$10,000,000 \|$/);
  assert.match(row(text, "Annual Productivity Value"), /\*\*\$100,000\*\*/);
  assert.ok(!text.includes("not computed"));
  assert.ok(!text.includes("(your input)"));
});

// ---------- employee_count ----------

for (const [label, emp] of [["omitted", undefined], ["null", null]]) {
  test(`employee_count ${label}: employees are estimated from the revenue and labelled as an example`, async () => {
    const args = { ...PROD, annual_revenue: 10000000 };
    if (emp !== undefined) args.employee_count = emp;
    const { isError, text } = await call(args);
    assert.equal(isError, false);
    assert.match(row(text, "| **Est. Employees** |"), /\| 40, estimated from your annual revenue \(Example figure: replace with your own\) \|$/);
    assert.ok(!text.includes("(your input)"));
    assert.ok(!text.includes("add your employee count"));
  });
}

test("employee_count 0 (revenue given): shown as 0 (your input), never estimated from the revenue", async () => {
  const { isError, text } = await call({ ...PROD, annual_revenue: 10000000, employee_count: 0 });
  assert.equal(isError, false);
  assert.equal(row(text, "| **Est. Employees** |"), "| **Est. Employees** | 0 (your input) |");
  assert.ok(!/estimated from your annual revenue/.test(text), "employees were estimated from the revenue");
  assert.match(row(text, "| **Est. Annual Revenue** |"), /\| \$10,000,000 \|$/);
  // Nothing divides by the employee count, so the revenue figures are computed as usual.
  assert.match(row(text, "Annual Productivity Value"), /\*\*\$100,000\*\*/);
  assert.ok(!text.includes("not computed"));
});

test("employee_count 0 (revenue given), cost_reduction: the existing minimum of 10 impacted employees applies", async () => {
  const { text } = await call({ your_solution: "Helix Platform", primary_value_driver: "cost_reduction", annual_revenue: 10000000, employee_count: 0, solution_price: 40000 });
  assert.equal(row(text, "| **Est. Employees** |"), "| **Est. Employees** | 0 (your input) |");
  assert.match(row(text, "Employees impacted:"), /Employees impacted: 10$/);
  assert.ok(!text.includes("not computed"));
});

test("employee_count 0 and no revenue: revenue is 0 from 0 employees, and figures that divide by the value say add your employee count", async () => {
  const { text } = await call({ ...PROD, employee_count: 0 });
  assert.equal(row(text, "| **Est. Employees** |"), "| **Est. Employees** | 0 (your input) |");
  assert.equal(row(text, "| **Est. Annual Revenue** |"), "| **Est. Annual Revenue** | $0, estimated from your employee count " + EX + " |");
  assert.match(row(text, "**Total Quantified Value**"), /\*\*\$0\*\*/);
  assert.ok(row(text, "| **ROI** |").startsWith("| **ROI** | " + NEEDS_EMPLOYEES + " |"));
  assert.ok(row(text, "| **Payback Period** |").startsWith("| **Payback Period** | " + NEEDS_EMPLOYEES + " |"));
  assert.ok(row(text, "| **Value/Cost Ratio** |").startsWith("| **Value/Cost Ratio** | " + NEEDS_EMPLOYEES + " |"));
  assert.ok(!/Infinity|NaN/.test(text));
});

test("employee_count ordinary value: shown as given, not estimated", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 10000000, employee_count: 100 });
  assert.match(row(text, "| **Est. Employees** |"), /\| 100 \|$/);
  assert.ok(!/estimated from your annual revenue/.test(text));
});

// ---------- both 0, and 0 with a price of 0 ----------

test("annual_revenue 0 and employee_count 0: both shown as given, nothing estimated", async () => {
  const { isError, text } = await call({ ...PROD, annual_revenue: 0, employee_count: 0 });
  assert.equal(isError, false);
  assert.equal(row(text, "| **Est. Annual Revenue** |"), "| **Est. Annual Revenue** | $0 (your input) |");
  assert.equal(row(text, "| **Est. Employees** |"), "| **Est. Employees** | 0 (your input) |");
  assert.ok(!/estimated from your/.test(text.split("## Assumptions")[0]));
  assert.ok(row(text, "| **ROI** |").startsWith("| **ROI** | " + NEEDS_REVENUE + " |"));
  assert.ok(!/Infinity|NaN/.test(text));
});

test("a price of 0 still wins for the figures that divide by the price (D34), with revenue 0", async () => {
  const { text } = await call({ ...PROD, annual_revenue: 0, employee_count: 100, solution_price: 0 });
  assert.ok(row(text, "| **ROI** |").startsWith("| **ROI** | not computed: add your annual price |"));
  assert.ok(row(text, "| **Payback Period** |").startsWith("| **Payback Period** | not computed: add your annual price |"));
  assert.equal(row(text, "**Solution Cost**"), "| **Solution Cost** | $0 (your input) | $0 (your input) | $0 (your input) |");
});

test("neither size input given: today's wording is unchanged", async () => {
  const { text } = await call({ ...PROD });
  assert.equal(row(text, "| **Est. Annual Revenue** |"), "| **Est. Annual Revenue** | not supplied |");
  assert.equal(row(text, "| **Est. Employees** |"), "| **Est. Employees** | not supplied |");
  assert.match(row(text, "Annual Productivity Value"), /not computed: needs annual revenue or employee count/);
});
