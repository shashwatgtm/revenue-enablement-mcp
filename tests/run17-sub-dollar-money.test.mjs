// Run 17 D55 (the owner's decision, 1 October 2026): Revenue Enablement money under $1 prints 2 decimals, and a positive
// amount that rounds to $0.00 prints "under $0.01", the same rule as ICP Intelligence (run 16 N2). Every other printed number
// stays the same: an amount of $1 or more prints exactly as before.
// Also run 17 D56 (post-launch backlog item 3): win_loss_analyzer with no deal details printed the divider "---" twice.
// Run: node --test tests/run17-sub-dollar-money.test.mjs
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
  return j.result.content.map((c) => c.text).join("\n");
};

test("account_plan_builder: Current ARR under $1 prints 2 decimals or 'under $0.01'", async () => {
  assert.match(await call("account_plan_builder", { account_name: "A", current_arr: 0.123 }), /\| \*\*Current ARR\*\* \| \$0\.12 \|/);
  assert.match(await call("account_plan_builder", { account_name: "A", current_arr: 0.004 }), /\| \*\*Current ARR\*\* \| under \$0\.01 \|/);
  assert.match(await call("account_plan_builder", { account_name: "A", current_arr: 1234.5 }), /\| \*\*Current ARR\*\* \| \$1,234\.5 \|/);
});

test("deal_strategy_coach and win_loss_analyzer: Deal Value under $1", async () => {
  assert.match(await call("deal_strategy_coach", { deal_name: "D", deal_stage: "discovery", deal_value: 0.004 }), /\| \*\*Deal Value\*\* \| under \$0\.01 \|/);
  assert.match(await call("deal_strategy_coach", { deal_name: "D", deal_stage: "discovery", deal_value: 50000 }), /\| \*\*Deal Value\*\* \| \$50,000 \|/);
  assert.match(await call("win_loss_analyzer", { analysis_type: "single_deal", deal_value: 0.5 }), /\| \*\*Deal Value\*\* \| \$0\.50 \|/);
});

test("pricing_negotiation_guide: deal value and the figures built from it under $1", async () => {
  const t = await call("pricing_negotiation_guide", { scenario: "discount_request", deal_value: 0.333, discount_requested: 10 });
  assert.match(t, /\$0\.33\b/);
  assert.doesNotMatch(t, /\$0\.\d{3}/);
  const big = await call("pricing_negotiation_guide", { scenario: "discount_request", deal_value: 120000, discount_requested: 15 });
  assert.match(big, /\$120,000/);
});

test("roi_business_case_builder: a price under $1 prints 2 decimals; no money with 3 decimals", async () => {
  const t = await call("roi_business_case_builder", { your_solution: "F", primary_value_driver: "revenue_increase", solution_price: 0.555, annual_revenue: 1000000 });
  assert.match(t, /\| \*\*Solution Cost\*\* \| \$0\.56 \|/);
  assert.doesNotMatch(t, /\$0\.\d{3}/);
});

test("any other amount is unchanged: an ordinary ROI case prints the same figures", async () => {
  const t = await call("roi_business_case_builder", { your_solution: "F", primary_value_driver: "revenue_increase", solution_price: 40000, annual_revenue: 5000000, employee_count: 45 });
  assert.match(t, /\| \*\*Solution Cost\*\* \| \$40,000 \|/);
});

test("D56 item 3: win_loss_analyzer with no deal details prints one divider, not two", async () => {
  const t = await call("win_loss_analyzer", { analysis_type: "single_deal" });
  assert.doesNotMatch(t, /---\s*\n\s*---/);
});
