// Run 20 round 1 (rule B81, D80 problem 6, R19-35 follow-up): roi_business_case_builder and the buyer's own figures.
// The buyer's own figures are annual_value_estimate, or current_annual_cost with expected_improvement_percent. Revenue and
// employee count describe the customer's size; they are not a value figure and this tool no longer turns them into one
// (it applied a fixed share of revenue and an uncited table of five industries).
//   - Without a buyer figure the answer prints no ROI percentage, no payback period, no headline return and no benchmark
//     table. It names the missing inputs (exact input names), the value drivers for the stated driver and industry, the
//     questions that collect the figures and how the calculation will work.
//   - With a buyer figure the calculation is exactly the old one (D80: no change to calculation). The old answers were
//     saved from origin/run20 (e8c7987) in tests/fixtures/roi-figures-before/ before the edit; every section of the new
//     answer except the Executive Summary table and the Assumptions list must equal the old one, character for character.
// Run: node --test tests/run20-roi-no-figures.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "roi_business_case_builder", arguments: args } }),
  }));
  const j = await r.json();
  assert.ok(j.result && j.result.content, "expected a tool result, got " + JSON.stringify(j));
  return { isError: j.result.isError === true, text: j.result.content.map((c) => c.text).join("\n") };
};

// Invented companies only (rule B81 for this public repo). No figure below is typed with a percent sign, so any percent in a
// no-figures answer is one the tool printed.
const BASE = { your_solution: "Lanehop", customer_name: "Branchwire", industry: "Retail", company_size: "enterprise", primary_value_driver: "cost_reduction" };
const NO_RETURN = [
  [/\d\s*%/, "a percentage"],
  [/\*\*ROI\*\*\s*\|/, "an ROI row"],
  [/\*\*Payback Period\*\*/, "a payback row"],
  [/\*\*[^*]+\*\*\s+(?:ROI|payback)/i, "a bold headline return"],
  [/\d(?:\.\d+)?\s+months/i, "a payback in months"],
  [/Value\/Cost Ratio/, "a value/cost ratio"],
  [/Total Quantified Value/, "a quantified value"],
  [/Net Annual Benefit/, "a net benefit"],
  [/3-Year Net Value/, "a three-year value"],
  [/Conservative Scenario|Aggressive Scenario/, "a sensitivity scenario"],
  [/benchmark/i, "a benchmark"],
  [/revenue per employee|cost of manual work|churn rate/i, "an industry figure"],
  [/Infinity|NaN/, "a broken number"],
];
const MISSING = ["annual_value_estimate", "current_annual_cost", "expected_improvement_percent"];

test("no buyer figure: no ROI, no payback, no headline, no benchmark; the missing inputs are named", async () => {
  const { isError, text } = await call({ ...BASE });
  assert.equal(isError, false);
  for (const [re, what] of NO_RETURN) assert.doesNotMatch(text, re, `the answer prints ${what}`);
  for (const name of MISSING) assert.ok(text.includes(name), `${name} is not named`);
  assert.match(text, /No ROI|no ROI|no return/i);
});

test("no buyer figure: the structure of the case is there (drivers, questions, how the calculation works)", async () => {
  const { text } = await call({ ...BASE });
  assert.match(text, /## Value drivers/);
  assert.match(text, /### Cost reduction/);
  assert.doesNotMatch(text, /### Revenue increase|### Productivity|### Risk mitigation/, "only the stated driver is described");
  assert.match(text, /## Questions to collect the figures/);
  assert.match(text, /## How the calculation will work/);
  assert.match(text, /current_annual_cost[^\n]*(?:×|x|times)[^\n]*expected_improvement_percent/);
  assert.match(text, /Retail/, "the stated industry is used in the wording");
  assert.match(text, /Branchwire/);
});

test("no buyer figure, driver multiple: all four drivers are described", async () => {
  const { text } = await call({ ...BASE, primary_value_driver: "multiple" });
  for (const d of ["Revenue increase", "Cost reduction", "Productivity", "Risk mitigation"]) assert.ok(text.includes(`### ${d}`), d);
  for (const [re, what] of NO_RETURN) assert.doesNotMatch(text, re, `the answer prints ${what}`);
});

test("no buyer figure, only the solution and driver: still no return, and nothing is a bracket to fill", async () => {
  const { isError, text } = await call({ your_solution: "Lanehop", primary_value_driver: "productivity" });
  assert.equal(isError, false);
  for (const [re, what] of NO_RETURN) assert.doesNotMatch(text, re, `the answer prints ${what}`);
  for (const name of MISSING) assert.ok(text.includes(name), name);
});

test("revenue, employees and a price are shown as the user's input but are not turned into a value", async () => {
  const { text } = await call({ ...BASE, annual_revenue: 40000000, employee_count: 300, solution_price: 80000 });
  for (const [re, what] of NO_RETURN) assert.doesNotMatch(text, re, `the answer prints ${what}`);
  assert.match(text, /\$40,000,000 \(your input\)/);
  assert.match(text, /300 \(your input\)/);
  assert.match(text, /\$80,000 \(your input\)/);
  for (const name of MISSING) assert.ok(text.includes(name), name);
  assert.doesNotMatch(text, /estimated from your/);
});

test("a typed zero revenue or zero employees is still shown as the user's input and nothing is estimated from it", async () => {
  const { text } = await call({ ...BASE, annual_revenue: 0, employee_count: 0 });
  assert.match(text, /\$0 \(your input\)/);
  assert.match(text, /\| 0 \(your input\)/);
  for (const [re, what] of NO_RETURN) assert.doesNotMatch(text, re, `the answer prints ${what}`);
});

test("only a current cost: the answer names expected_improvement_percent as the one input still missing", async () => {
  const { text } = await call({ ...BASE, current_annual_cost: 900000 });
  for (const [re, what] of NO_RETURN) assert.doesNotMatch(text, re, `the answer prints ${what}`);
  assert.match(text, /\$900,000 \(your input\)/);
  const missing = text.slice(text.indexOf("## What is missing"), text.indexOf("## What you gave"));
  assert.match(missing, /expected_improvement_percent[^\n]*missing/i);
  assert.doesNotMatch(missing, /current_annual_cost[^\n]*missing/i);
});

test("only an improvement percent: the answer names current_annual_cost as the one input still missing", async () => {
  const { text } = await call({ ...BASE, expected_improvement_percent: 30 });
  assert.doesNotMatch(text, /\*\*ROI\*\*\s*\||Payback Period|Total Quantified Value/);
  const missing = text.slice(text.indexOf("## What is missing"), text.indexOf("## What you gave"));
  assert.match(missing, /current_annual_cost[^\n]*missing/i);
  assert.doesNotMatch(missing, /expected_improvement_percent[^\n]*missing/i);
});

test("the text the user typed (current process, known metrics) is shown and is not turned into a figure", async () => {
  const { text } = await call({ ...BASE, current_process: "Dispatchers re-key orders by hand", known_metrics: "Two hours of rework a day" });
  assert.match(text, /Dispatchers re-key orders by hand/);
  assert.match(text, /Two hours of rework a day/);
  for (const [re, what] of NO_RETURN) assert.doesNotMatch(text, re, `the answer prints ${what}`);
});

test("the industry input is accepted as any text and used for wording only (no table, no fallback sentence)", async () => {
  for (const industry of ["Retail", "Healthcare", "Logistics", "Cybersecurity", "anything at all"]) {
    const { isError, text } = await call({ ...BASE, industry });
    assert.equal(isError, false, industry);
    assert.ok(text.includes(industry), industry);
    assert.doesNotMatch(text, /matched none of the built-in sets|Benchmark set|built-in/i, industry);
  }
  const a = await call({ ...BASE, industry: "Retail" });
  const b = await call({ ...BASE, industry: "Manufacturing" });
  const strip = (t, i) => t.split(i).join("X");
  assert.equal(strip(a.text, "Retail"), strip(b.text, "Manufacturing"), "the industry changes words, never figures");
});

test("the uncited industry table is gone from the code", () => {
  const src = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
  for (const word of ["revenue_per_employee", "cost_of_manual_work_per_hour", "average_churn_rate", "sales_cycle_days: 45", "sizeMultipliers"]) {
    assert.ok(!src.includes(word), `${word} is still in src/index.ts`);
  }
});

// ---- the buyer's own figures: the calculation is the old one -------------------------------------------------------------

const CASES = {
  cost_pct_price: { your_solution: "Lanehop", primary_value_driver: "cost_reduction", customer_name: "Branchwire", industry: "Technology", company_size: "mid_market", current_annual_cost: 900000, expected_improvement_percent: 30, solution_price: 60000, implementation_timeline: "10 weeks" },
  cost_pct_noprice: { your_solution: "Lanehop", primary_value_driver: "multiple", customer_name: "Branchwire", current_annual_cost: 900000, expected_improvement_percent: 30 },
  estimate_price: { your_solution: "Lanehop", primary_value_driver: "revenue_increase", customer_name: "Branchwire", industry: "Retail", company_size: "enterprise", annual_value_estimate: 1250000, solution_price: 80000, annual_revenue: 40000000, employee_count: 300 },
  estimate_rev_only: { your_solution: "Lanehop", primary_value_driver: "productivity", annual_value_estimate: 500000, solution_price: 25000, annual_revenue: 10000000, known_metrics: "Dispatchers spend 3 hours a day on rework", current_process: "Spreadsheets" },
  estimate_emp_only: { your_solution: "Lanehop", primary_value_driver: "risk_mitigation", annual_value_estimate: 200000, employee_count: 120, industry: "Healthcare" },
  cost_zero_pct: { your_solution: "Lanehop", primary_value_driver: "cost_reduction", current_annual_cost: 400000, expected_improvement_percent: 0, solution_price: 30000 },
  estimate_price0: { your_solution: "Lanehop", primary_value_driver: "cost_reduction", annual_value_estimate: 300000, solution_price: 0 },
  estimate_zero: { your_solution: "Lanehop", primary_value_driver: "cost_reduction", annual_value_estimate: 0, solution_price: 30000, annual_revenue: 0 },
  estimate_hi_roi: { your_solution: "Lanehop", primary_value_driver: "cost_reduction", annual_value_estimate: 9000000, solution_price: 1000 },
};
const sections = (t) => t.split(/\n(?=## )/);
const name = (s) => s.split("\n")[0];

test("the saved old answers cover every case", () => {
  assert.deepEqual(readdirSync(new URL("./fixtures/roi-figures-before/", import.meta.url)).map((f) => f.replace(/\.md$/, "")).sort(), Object.keys(CASES).sort());
});

for (const [key, args] of Object.entries(CASES)) {
  test(`buyer figures (${key}): every calculated line equals the old answer`, async () => {
    const old = readFileSync(new URL(`./fixtures/roi-figures-before/${key}.md`, import.meta.url), "utf8");
    const { isError, text } = await call(args);
    assert.equal(isError, false);
    const a = sections(old), b = sections(text);
    assert.deepEqual(b.map(name), a.map(name), "the same sections in the same order");
    for (let i = 0; i < a.length; i++) {
      if (/^## (?:Executive Summary|Assumptions)/.test(a[i])) continue; // profile rows and the assumption list: checked by hand and below
      // One display line changed on purpose: when the buyer's value is 0 the one-page summary used to say "needs annual revenue or
      // employee count", which is wrong now that no value comes from revenue or employees. No number or calculation changed.
      const was = a[i].replace("- not computed: needs annual revenue or employee count", "- not computed: the annual value you gave is 0");
      assert.equal(b[i], was, `section ${name(a[i])} changed`);
    }
    // The pieces of the two skipped sections that carry numbers or labels the calculation depends on:
    for (const re of [/\| \*\*Confidence Level\*\* \|[^\n]*/, /\| \*\*Solution\*\* \|[^\n]*/, /\| \*\*Industry\*\* \|[^\n]*/, /\| \*\*Company Size\*\* \|[^\n]*/, /1\. Implementation timeline:[^\n]*/, /2\. Full value realization:[^\n]*/]) {
      assert.equal((text.match(re) || [null])[0], (old.match(re) || [null])[0], String(re));
    }
    assert.match(text, /\*\*ROI\*\* \|/);
  });
  test(`buyer figures (${key}): no size estimate and no benchmark sentence in the answer any more`, async () => {
    const { text } = await call(args);
    assert.doesNotMatch(text, /estimated from your|Benchmark set|Company size multiplier/);
    assert.doesNotMatch(text, /\| \*\*Est\. (?:Annual Revenue|Employees)\*\*/);
  });
}

test("buyer figures: the worked numbers (current cost 900,000 and 30 percent, price 60,000) are the old ones", async () => {
  const { text } = await call(CASES.cost_pct_price);
  assert.match(text, /Annual value: 30% of the current annual cost you supplied \(\$900,000\) = \*\*\$270,000\*\*/);
  assert.match(text, /\| \*\*ROI\*\* \| 350% \|/);
  assert.match(text, /\| \*\*Payback Period\*\* \| 2\.7 months \|/);
  assert.match(text, /\| \*\*3-Year Net Value\*\* \| \$630,000 \|/);
  assert.match(text, /\| \*\*Value\/Cost Ratio\*\* \| 4\.5x \|/);
});
