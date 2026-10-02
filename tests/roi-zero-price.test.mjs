// Run 15 (R15-12, owner decision D34): roi_business_case_builder and a solution_price of 0.
// Omitted, null and 0 are told apart with explicit checks (not truthiness).
//   omitted or null: today's labelled example price stays exactly as it is (byte-identical to the fixtures,
//     which were saved from the production code, v1.2.13, before the fix).
//   0: the price is the user's input, so nothing divides by it: ROI, payback, the value/cost ratio and the ROI and
//     payback of both sensitivity scenarios print "not computed: add your annual price"; figures that do not divide
//     by the price are computed with a price of 0; no example price is used.
// The /mcp input check counts a null member as not given (netlify/functions/mcp.mjs, wrongType), so null is not
// refused: it reaches the tool and means the same as omitted.
// Run: node --test tests/roi-zero-price.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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

// Claude chat's measurement C-REV-01 (B44): productivity, annual revenue 10,000,000.
const BASE = { your_solution: "Helix Platform", primary_value_driver: "productivity", annual_revenue: 10000000 };
// Run 19 (D80, problem 5): the fixtures were regenerated once; the only change is the honest confidence line (Low when the value
// rests on example assumptions) and, where the example ROI is very high, a note to add the buyer's own figures.
const fixture = (name) => readFileSync(new URL("./fixtures/" + name, import.meta.url), "utf8");
const row = (text, label) => {
  const line = text.split("\n").find((l) => l.includes(label));
  assert.ok(line, "no line with " + label);
  return line;
};
const NEEDS_PRICE = "not computed: add your annual price";

test("solution_price omitted: the answer is byte-identical to today's (labelled example price)", async () => {
  const { isError, text } = await call({ ...BASE });
  assert.equal(isError, false);
  assert.equal(text, fixture("roi-price-omitted.md"));
  assert.match(row(text, "**Solution Cost**"), /\(not supplied\) \(Example figure: replace with your own\) \| \$10,000 \| \$10,000 \| \$10,000 \|/);
  assert.match(row(text, "| **ROI** |"), /\| 900% \|/);
});

test("solution_price null: not refused, and read as omitted (the /mcp input check counts null as not given)", async () => {
  const { isError, text } = await call({ ...BASE, solution_price: null });
  assert.equal(isError, false);
  assert.equal(text, fixture("roi-price-omitted.md"));
});

test("solution_price 0: the Solution Cost row shows $0 (your input) and no example price is used", async () => {
  const { isError, text } = await call({ ...BASE, solution_price: 0 });
  assert.equal(isError, false);
  const cost = row(text, "**Solution Cost**");
  assert.equal(cost, "| **Solution Cost** | $0 (your input) | $0 (your input) | $0 (your input) |");
  assert.ok(!/example price/i.test(text), "an example price is still mentioned");
  assert.ok(!/\(not supplied\)/.test(cost));
  assert.ok(!/\$10,000(?![,\d])/.test(text), "the example price $10,000 is used");
  assert.ok(!/\$1,500(?![,\d])/.test(text), "the example implementation cost of 15 percent of $10,000 is used");
});

test("solution_price 0: every figure that divides by the price prints the not-computed line", async () => {
  const { text } = await call({ ...BASE, solution_price: 0 });
  assert.ok(row(text, "| **ROI** |").startsWith("| **ROI** | " + NEEDS_PRICE + " |"));
  assert.ok(row(text, "| **Payback Period** |").startsWith("| **Payback Period** | " + NEEDS_PRICE + " |"));
  assert.ok(row(text, "| **Value/Cost Ratio** |").startsWith("| **Value/Cost Ratio** | " + NEEDS_PRICE + " |"));
  const sens = text.slice(text.indexOf("### Conservative Scenario"), text.indexOf("## Risk Factors"));
  const lines = sens.split("\n");
  for (const label of ["- ROI: ", "- Payback: "]) {
    const hits = lines.filter((l) => l.startsWith(label));
    assert.equal(hits.length, 2, "expected the " + label + "line in both scenarios");
    for (const h of hits) assert.equal(h, label + NEEDS_PRICE);
  }
  // The one-page summary also prints ROI and payback: they must not show a number either.
  const summary = text.slice(text.indexOf("## One-Page Executive Summary"));
  assert.ok(!/\d+%\*\* ROI/.test(summary), "the summary still prints a ROI figure");
  assert.ok(!/months\*\* payback/.test(summary), "the summary still prints a payback figure");
  assert.ok(summary.includes(NEEDS_PRICE));
  // No ROI, payback or ratio number anywhere.
  assert.ok(!/\| \*\*ROI\*\* \| \d/.test(text));
  assert.ok(!/Infinity|NaN/.test(text));
});

test("solution_price 0: figures that do not divide by the price are computed with a price of 0", async () => {
  const { text } = await call({ ...BASE, solution_price: 0 });
  assert.match(row(text, "**Implementation**"), /\| \$0 \| \$0 \| \$0 \|$/);
  assert.match(row(text, "**Total Investment**"), /\| \$0 \(Example figure: replace with your own\) \| \$0 \| \$0 \|$/);
  assert.match(row(text, "**Total Quantified Value**"), /\*\*\$100,000\*\*/);
  assert.match(row(text, "**Annual Investment**"), /\| \$0 \|$/);
  assert.match(row(text, "**Net Annual Benefit**"), /\$100,000 /);
  assert.match(row(text, "**3-Year Net Value**"), /\| \$300,000 \|/);
  const sens = text.slice(text.indexOf("### Conservative Scenario"), text.indexOf("## Risk Factors"));
  assert.match(sens, /Conservative[\s\S]*- Annual Value: \$50,000[\s\S]*Aggressive[\s\S]*- Annual Value: \$150,000/);
  assert.match(text, /- \*\*\$100,000\*\* in annual value/);
  assert.match(text, /Cost of delay: \$8,333\/month/);
});

test('solution_price "0" (text): read as a number by the input check, so it means 0', async () => {
  const a = await call({ ...BASE, solution_price: "0" });
  const b = await call({ ...BASE, solution_price: 0 });
  assert.equal(a.text, b.text);
});

for (const [price, file] of [[0.01, "roi-price-0.01.md"], [1, "roi-price-1.md"], [50000, "roi-price-50000.md"]]) {
  test(`solution_price ${price}: figures are computed (none is "not computed"), no raw float, unchanged from today`, async () => {
    const { isError, text } = await call({ ...BASE, solution_price: price });
    assert.equal(isError, false);
    assert.ok(!text.includes("not computed"), "a figure is not computed");
    assert.ok(!/\d\.\d{6,}/.test(text), "a raw float is printed");
    assert.ok(!/Infinity|NaN/.test(text));
    assert.match(row(text, "**Solution Cost**"), /^\| \*\*Solution Cost\*\* \| \$/);
    assert.equal(text, fixture(file));
  });
}
