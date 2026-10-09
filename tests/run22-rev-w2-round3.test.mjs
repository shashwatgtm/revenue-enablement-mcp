// Run 22 round 3 (rev-w2): a product name inside a landmine question keeps its capital ("Chrome dev tools", not "chrome dev tools").
// Run: node --no-warnings --test tests/run22-rev-w2-round3.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

test("a well-known product name that opens a weak point keeps its capital in the landmine question", async () => {
  for (const [name, weak] of [["Chrome dev tools", "Chrome dev tools were not very accurate or reliable for real device testing"], ["Safari on a laptop", "Safari on a laptop differs from Safari on a phone for real device testing"]]) {
    const t = await call("competitive_trap_setter", {
      competitor: "buying and maintaining physical devices", competitor_weaknesses: `costly physical devices; ${weak}`,
      your_solution: "Testbench, a cloud platform for testing websites and mobile apps on real browsers and real devices, with test automation and visual testing",
      your_strengths: "real devices with minimal latency", evaluation_stage: "mid", buyer_persona: "Head of Testing", trap_type: "all",
    });
    assert.ok(t.includes(name), `${name} is kept as written`);
    assert.doesNotMatch(t, new RegExp(name.charAt(0).toLowerCase() + name.slice(1)), `${name} is not lower-cased`);
  }
});
