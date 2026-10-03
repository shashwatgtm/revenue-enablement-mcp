// Run 18 R18-20 (owner decision D65, 2 October 2026): how every printed amount is displayed in Revenue Enablement.
//   - every printed amount has at most 2 decimals; an amount that is not a whole number of dollars prints exactly 2 decimals
//     ("$4.60", "$1,234.50"); whole amounts print as before ("$5", "$20,000"); under $1 keeps run 17's rule ("$0.56", "under $0.01");
//   - every printed total equals the sum or difference of its printed parts, where the report prints those parts: the Year 1
//     Total Investment (Solution Cost + Implementation), the Net Annual Benefit (Total Quantified Value - Annual Investment), the
//     Post-Discount Value (Deal Value - Revenue at Risk) and, in "multiple" mode, the Total Quantified Value (its four printed parts);
//   - every calculation keeps full precision (ROI, payback, ratios, 3-Year Net Value, the scenarios): only the display changes;
//   - the zero-price and zero-employee behaviour is unchanged.
// Run 20 round 1: roi_business_case_builder no longer calculates a value from revenue or employees (B81, tests/run20-roi-no-figures.test.mjs),
// so its cases below give the buyer's own annual_value_estimate: the amount the old example model gave for the same revenue
// (productivity is 1 percent of revenue: 10,000,000 gives 100,000 and 2,000,000 gives 20,000). The printed-amount rules under test
// are unchanged. Two cases that tested the old example model itself changed: the cost reduction weekly savings line (the old model's
// labour rate) and the four printed parts of "multiple" mode (there is now one printed part, the buyer's value).
// Sweep: more than 900 varied calls over every tool that prints money, plus the 2,186-price ROI sweep. The generator is seeded, so
// every run makes the same calls. Run: node --test tests/run18-money-display.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  assert.ok(j.result && j.result.content, "expected a tool result, got " + JSON.stringify(j));
  return j.result.content.map((c) => c.text).join("\n");
};

// ---- helpers -------------------------------------------------------------------------------------------------------------
const TOKEN = /-?\$[\d,]+(?:\.\d+)?/g;
const toCents = (tok) => {
  const neg = tok.startsWith("-");
  const [w, f = ""] = tok.replace(/^-?\$/, "").replace(/,/g, "").split(".");
  const c = parseInt(w, 10) * 100 + (f ? parseInt((f + "0").slice(0, 2), 10) : 0);
  return neg ? -c : c;
};
// The first money token in a text as cents, or null when the text has none or prints "under $0.01" (not a sum-able amount).
const firstCents = (text) => {
  const m = text === undefined ? null : text.match(TOKEN);
  return m ? toCents(m[0]) : null;
};
const tableRow = (text, label) => {
  const line = text.split("\n").find((l) => l.startsWith("| " + label) || l.startsWith("| **" + label + "**"));
  return line ? line.split("|").map((s) => s.trim()) : null;
};
const lineAfter = (text, prefix) => {
  const line = text.split("\n").find((l) => l.startsWith(prefix));
  return line === undefined ? undefined : line.slice(prefix.length);
};
const hasUnder = (s) => s !== undefined && /under \$0\.01/.test(s);
// Every money token printed anywhere in the text: at most 2 decimals, and exactly 2 decimals when there are any.
const badTokens = (text) => (text.match(TOKEN) || []).filter((t) => {
  const f = t.split(".")[1];
  return f !== undefined && f.length !== 2;
});

// Checks the printed relations of one ROI answer. Returns a list of problems (empty when all hold).
const roiProblems = (label, text, driver) => {
  const bad = [];
  for (const t of badTokens(text)) bad.push(`${label}: money token with a decimal count other than 2: ${t}`);
  const sol = tableRow(text, "Solution Cost"), imp = tableRow(text, "Implementation"), tot = tableRow(text, "Total Investment");
  if (!sol || !imp || !tot) { bad.push(`${label}: Investment Summary rows missing`); return bad; }
  const s = firstCents(sol[2]), i = firstCents(imp[2]), t1 = firstCents(tot[2]);
  if (s !== null && i !== null && t1 !== null && !hasUnder(imp[2]) && !hasUnder(sol[2]) && s + i !== t1) bad.push(`${label}: Year 1 Total Investment ${tot[2]} != ${sol[2]} + ${imp[2]}`);
  const tqv = tableRow(text, "Total Quantified Value"), inv = tableRow(text, "Annual Investment"), net = tableRow(text, "Net Annual Benefit");
  if (!tqv || !inv || !net) { bad.push(`${label}: Total Annual Value rows missing`); return bad; }
  const a = firstCents(tqv[2]), b = firstCents(inv[2]), n = firstCents(net[2]);
  if (a !== null && b !== null && n !== null && !hasUnder(tqv[2]) && !hasUnder(inv[2]) && !hasUnder(net[2]) && a - b !== n) bad.push(`${label}: Net Annual Benefit ${net[2]} != ${tqv[2]} - ${inv[2]}`);
  if (driver === "multiple" && a !== null && !hasUnder(tqv[2])) {
    const parts = ["- Annual Revenue Impact: ", "- Annual Cost Savings: ", "- Annual Productivity Value: ", "- Annual Risk Mitigation Value: "].map((p) => lineAfter(text, p));
    if (parts.every((p) => p !== undefined && firstCents(p) !== null && !hasUnder(p))) {
      const sum = parts.reduce((acc, p) => acc + firstCents(p), 0);
      if (sum !== a) bad.push(`${label}: multiple Total Quantified Value ${tqv[2]} != sum of printed parts ${(sum / 100).toFixed(2)}`);
    }
  }
  return bad;
};
const pricingProblems = (label, text) => {
  const bad = [];
  for (const t of badTokens(text)) bad.push(`${label}: money token with a decimal count other than 2: ${t}`);
  const dv = tableRow(text, "Deal Value"), risk = tableRow(text, "Revenue at Risk"), post = tableRow(text, "Post-Discount Value");
  if (dv && risk && post) {
    const d = firstCents(dv[2]), r = firstCents(risk[2]), p = firstCents(post[2]);
    if (d !== null && r !== null && p !== null && ![dv[2], risk[2], post[2]].some(hasUnder) && d - r !== p) bad.push(`${label}: Post-Discount Value ${post[2]} != ${dv[2]} - ${risk[2]}`);
  }
  return bad;
};

// seeded generator (mulberry32), so every run makes the same calls
let seed = 20261002;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const intIn = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
// A varied amount: whole, 1 to 4 decimals, under $1, tiny, very large.
const amount = () => {
  switch (intIn(0, 9)) {
    case 0: return intIn(1, 5000000);
    case 1: return intIn(1, 90000) / 10;
    case 2: return intIn(1, 9000000) / 100;
    case 3: return intIn(1, 9000000) / 1000;
    case 4: return intIn(1, 9000000) / 10000;
    case 5: return intIn(1, 999) / 1000;
    case 6: return pick([0.004, 0.005, 0.01, 0.555, 0.995, 0.999, 1, 1.005, 1234.5, 99.99, 6.66]);
    case 7: return intIn(1000000, 900000000) + intIn(0, 999) / 1000;
    case 8: return intIn(1, 400) * 1000 + 0.5;
    default: return intIn(1, 400000);
  }
};
const MODES = ["revenue_increase", "cost_reduction", "productivity", "risk_mitigation", "multiple"];
const INDUSTRIES = ["Technology", "Financial_Services", "Healthcare", "Manufacturing", "Retail"];
const SIZES = ["startup", "smb", "mid_market", "enterprise"];

// ---- specific cases (the findings behind D65) --------------------------------------------------------------------------------
test("P05-REV-01: price 0.555, productivity, revenue 2,000,000: Net Annual Benefit and 3-Year Net Value have 2 decimals", async () => {
  const t = await call("roi_business_case_builder", { your_solution: "F", primary_value_driver: "productivity", annual_value_estimate: 20000, solution_price: 0.555 });
  assert.match(t, /\| \*\*Net Annual Benefit\*\* \| \$19,999\.44 /); // $20,000 minus the printed $0.56
  assert.match(t, /\| \*\*3-Year Net Value\*\* \| \$59,998\.34 \|/); // exact 59,998.335, shown to 2 decimals, not 3 x the printed benefit
  assert.doesNotMatch(t, /19,999\.445|59,998\.335/);
});

test("N1: Year 1 Total Investment is the printed Solution Cost plus the printed Implementation (productivity, revenue 10,000,000)", async () => {
  const want = { 1: "$1.15", 4: "$4.60", 6: "$6.90", 6.66: "$7.66", 7: "$8" };
  for (const [p, total] of Object.entries(want)) {
    const t = await call("roi_business_case_builder", { your_solution: "Helix Platform", primary_value_driver: "productivity", annual_value_estimate: 100000, annual_revenue: 10000000, solution_price: Number(p) });
    assert.equal(tableRow(t, "Total Investment")[2], total + " (Example figure: replace with your own)", "price " + p);
    assert.deepEqual(roiProblems("price " + p, t, "productivity"), []);
  }
});

test("display rule: non-whole amounts print exactly 2 decimals, whole amounts print as before", async () => {
  assert.match(await call("account_plan_builder", { account_name: "A", current_arr: 1234.5 }), /\| \*\*Current ARR\*\* \| \$1,234\.50 \|/);
  assert.match(await call("account_plan_builder", { account_name: "A", current_arr: 5 }), /\| \*\*Current ARR\*\* \| \$5 \|/);
  assert.match(await call("account_plan_builder", { account_name: "A", current_arr: 20000 }), /\| \*\*Current ARR\*\* \| \$20,000 \|/);
  assert.match(await call("account_plan_builder", { account_name: "A", current_arr: 1234.567 }), /\| \*\*Current ARR\*\* \| \$1,234\.57 \|/);
  assert.match(await call("account_plan_builder", { account_name: "A", current_arr: 0.123 }), /\| \*\*Current ARR\*\* \| \$0\.12 \|/);
  assert.match(await call("account_plan_builder", { account_name: "A", current_arr: 0.004 }), /\| \*\*Current ARR\*\* \| under \$0\.01 \|/);
  const t = await call("roi_business_case_builder", { your_solution: "F", primary_value_driver: "cost_reduction", annual_value_estimate: 230625.25, solution_price: 5000 });
  assert.match(t, /- Annual value: your own estimate of the annual value, \$230,625\.25 = \*\*\$230,625\.25\*\*/);
  assert.match(t, /\| \*\*Total Quantified Value\*\* \| \*\*\$230,625\.25\*\*/);
  assert.match(t, /\| \*\*Net Annual Benefit\*\* \| \$225,625\.25/);
});

test("pricing_negotiation_guide: Post-Discount Value is Deal Value minus Revenue at Risk as printed", async () => {
  const t = await call("pricing_negotiation_guide", { scenario: "discount_request", deal_value: 99999, discount_requested: 12.5 });
  assert.match(t, /\| \*\*Revenue at Risk\*\* \| \$12,499\.88 \|/);
  assert.match(t, /\| \*\*Post-Discount Value\*\* \| \$87,499\.12 \|/);
});

test("'multiple' mode: Total Quantified Value is the one printed value (the buyer's figure)", async () => {
  const t = await call("roi_business_case_builder", { your_solution: "F", primary_value_driver: "multiple", current_annual_cost: 3333333, expected_improvement_percent: 33.3, annual_revenue: 3333333, employee_count: 77, solution_price: 12345.67 });
  assert.deepEqual(roiProblems("multiple", t, "multiple"), []);
  assert.match(t, /- Annual value: 33\.3% of the current annual cost you supplied \(\$3,333,333\) = \*\*\$1,109,999\.89\*\*/);
  assert.match(t, /\| \*\*Total Quantified Value\*\* \| \*\*\$1,109,999\.89\*\*/);
});

test("zero price and zero employees are unchanged", async () => {
  const z = await call("roi_business_case_builder", { your_solution: "F", primary_value_driver: "productivity", annual_value_estimate: 100000, annual_revenue: 10000000, solution_price: 0 });
  assert.match(z, /\| \*\*Solution Cost\*\* \| \$0 \(your input\) \| \$0 \(your input\) \| \$0 \(your input\) \|/);
  assert.match(z, /\| \*\*ROI\*\* \| not computed: add your annual price \|/);
  assert.match(z, /\| \*\*Total Investment\*\* \| \$0 \(Example figure/);
  const e = await call("roi_business_case_builder", { your_solution: "F", primary_value_driver: "cost_reduction", annual_value_estimate: 50000, annual_revenue: 5000000, employee_count: 0, solution_price: 50000 });
  assert.match(e, /\| \*\*Employees\*\* \| 0 \(your input\) \|/);
  assert.match(e, /\| \*\*ROI\*\* \| 0% \|/);
  assert.match(e, /\| \*\*Payback Period\*\* \| 12\.0 months \|/);
});

// ---- the sweep of varied calls -----------------------------------------------------------------------------------------------
test("sweep: more than 900 varied calls over every money-printing tool keep the display rule and the printed totals", async () => {
  let calls = 0;
  const problems = [];
  const note = (p) => { for (const x of p) problems.push(x); };
  // account plan
  for (let k = 0; k < 150; k++) {
    const args = { account_name: "Acme " + k, current_arr: amount() };
    const t = await call("account_plan_builder", args); calls++;
    for (const b of badTokens(t)) problems.push(`account_plan_builder ${JSON.stringify(args)}: ${b}`);
  }
  // deal strategy
  for (let k = 0; k < 120; k++) {
    const args = { deal_name: "Deal " + k, deal_stage: pick(["discovery", "demo", "proposal", "negotiation"]), deal_value: amount() };
    const t = await call("deal_strategy_coach", args); calls++;
    for (const b of badTokens(t)) problems.push(`deal_strategy_coach ${JSON.stringify(args)}: ${b}`);
  }
  // win/loss
  for (let k = 0; k < 120; k++) {
    const args = { analysis_type: "single_deal", deal_outcome: pick(["won", "lost"]), deal_value: amount() };
    const t = await call("win_loss_analyzer", args); calls++;
    for (const b of badTokens(t)) problems.push(`win_loss_analyzer ${JSON.stringify(args)}: ${b}`);
  }
  // pricing negotiation guide (the discount can have decimals; the value can be left out or paired with value_delivered)
  for (let k = 0; k < 250; k++) {
    const args = { scenario: "discount_request", deal_value: amount(), discount_requested: pick([5, 10, 12.5, 15, 33.3, 7.77, intIn(1, 100), intIn(1, 9999) / 100]) };
    if (k % 5 === 0) args.value_delivered = "saves time";
    const t = await call("pricing_negotiation_guide", args); calls++;
    note(pricingProblems(`pricing ${JSON.stringify(args)}`, t));
  }
  // ROI in every use case mode
  for (let k = 0; k < 400; k++) {
    const driver = MODES[k % MODES.length];
    const args = { your_solution: "F", primary_value_driver: driver, industry: pick(INDUSTRIES), company_size: pick(SIZES) };
    if (k % 2 === 0) args.annual_value_estimate = amount();
    else { args.current_annual_cost = amount(); args.expected_improvement_percent = pick([5, 10, 12.5, 33.3, 7.77, intIn(1, 100)]); }
    if (rnd() < 0.85) args.annual_revenue = amount();
    if (rnd() < 0.5) args.employee_count = pick([0, intIn(1, 5000), intIn(1, 400) + 0.5]);
    if (rnd() < 0.8) args.solution_price = pick([amount(), amount(), intIn(1, 200000), intIn(1, 20000) / 100]);
    const t = await call("roi_business_case_builder", args); calls++;
    note(roiProblems(`roi ${JSON.stringify(args)}`, t, driver));
  }
  assert.ok(calls >= 900, "calls made: " + calls);
  assert.deepEqual(problems.slice(0, 8), [], `${problems.length} problems in ${calls} calls`);
});

test("sweep: 2,186 solution prices (0.01 to 20.00 in cents, 21 to 200, and six more): the ROI figures follow the display rule", async () => {
  const prices = [];
  for (let c = 1; c <= 2000; c++) prices.push(c / 100);
  for (let w = 21; w <= 200; w++) prices.push(w);
  prices.push(99.99, 123.45, 999.99, 1234.56, 40000, 49999.99);
  assert.equal(prices.length, 2186);
  const problems = [];
  for (const p of prices) {
    const t = await call("roi_business_case_builder", { your_solution: "Helix Platform", primary_value_driver: "productivity", annual_value_estimate: 100000, annual_revenue: 10000000, solution_price: p });
    for (const x of roiProblems("price " + p, t, "productivity")) problems.push(x);
  }
  assert.deepEqual(problems.slice(0, 8), [], `${problems.length} problems in ${prices.length} prices`);
});
