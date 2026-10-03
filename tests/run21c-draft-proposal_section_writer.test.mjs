// Run 21c job 3, extra (test first): the executive summary of proposal_section_writer opened with "This proposal outlines how X can help Y with the
// challenges below" and closed with the same four next steps for every company (review, schedule a working session, plan, kick off). The opening is now a
// short narrative from the challenge, the first reason, the first result and the price; the next steps are built from the scope, the rollout, the measure
// and the investment the user gave. Two invented companies of different kinds, plain words.
// Run: node --no-warnings --test tests/run21c-draft-proposal_section_writer.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "proposal_section_writer", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const A = { section_type: "executive_summary", customer_name: "Ridgeline Builders", customer_industry: "general contractors", your_solution: "Quarrywise, a construction management platform for general contractors: bid management, change orders, daily logs and subcontractor payments",
  customer_challenges: "change orders approved by email and billed late; daily logs kept on paper", key_differentiators: "change orders approved from the field in one tap; subcontractor payments tracked against retainage",
  pricing: "$90,000 a year (hypothetical)", implementation_approach: "Two live projects first, then the rest of the portfolio", success_metrics: "bill change orders within a week of approval", tone: "consultative" };
const B = { section_type: "executive_summary", customer_name: "Marketline", customer_industry: "online marketplaces", your_solution: "Pingwell, a business messaging platform: text messages, one time passwords and delivery reports through one API",
  customer_challenges: "one time passwords arrive late; carrier rejections are not visible to developers", key_differentiators: "delivery reports for every message; sender ID registration handled for you",
  pricing: "$40,000 a year (hypothetical)", implementation_approach: "A sandbox trial, then one country, then the rest", success_metrics: "one time passwords delivered in seconds (page claim)", tone: "bold" };
const [a, b] = [await call(A), await call(B)];
const GENERIC = ["Review this proposal and provide feedback", "Schedule a working session to finalize scope", "Begin implementation planning", "Kick off the project", "can help", "with the challenges below"];
const PLACEHOLDER = /\[[^\]\n]{1,80}\]|\{[^}\n]{1,80}\}|your product|\bTBD\b|Insert/i;
const longLines = (t) => t.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30);
const next = (t) => t.split("### Next Steps")[1].split("\n---")[0];
const head = (t) => t.split("### The Solution")[0];

test("no generic opening or next steps; no placeholder, dashes or healthcare words", () => {
  for (const t of [a, b]) {
    for (const g of GENERIC) assert.ok(!t.includes(g), g);
    assert.doesNotMatch(t, PLACEHOLDER);
    assert.doesNotMatch(t, /[–—]/);
    assert.doesNotMatch(t, /clinic|pharmac|healthcare|hospital|patient/i);
  }
});
test("the opening is a narrative from the first challenge, the first reason, the first result and the price", () => {
  assert.match(head(a), /change orders approved by email and billed late/);
  assert.match(head(a), /change orders approved from the field in one tap/);
  assert.match(head(a), /bill change orders within a week of approval/i);
  assert.match(head(a), /\$90,000 a year \(hypothetical\)/);
  assert.match(head(b), /one time passwords arrive late/);
  assert.match(head(b), /delivery reports for every message/);
  assert.match(head(b), /\$40,000 a year \(hypothetical\)/);
});
test("the next steps come from the scope, the rollout, the measure and the investment", () => {
  const n = next(a);
  assert.match(n, /change orders approved by email and billed late/);
  assert.match(n, /Two live projects first, then the rest of the portfolio/);
  assert.match(n, /bill change orders within a week of approval/i);
  assert.match(n, /\$90,000 a year \(hypothetical\)/);
  const m = next(b);
  assert.match(m, /A sandbox trial, then one country, then the rest/);
  assert.match(m, /\$40,000 a year \(hypothetical\)/);
  assert.match(m, /claim from the company's own pages/);
});
test("two kinds of company get next steps and openings that differ", () => {
  const la = longLines(next(a) + head(a)), lb = new Set(longLines(next(b) + head(b)));
  assert.ok(la.filter((l) => lb.has(l)).length / la.length < 0.25);
});
test("with nothing given the next steps say what to add, once, and keep no placeholder", async () => {
  const t = await call({ section_type: "executive_summary", your_solution: "Pingwell, a business messaging platform: text messages, one time passwords and delivery reports through one API" });
  assert.doesNotMatch(t, PLACEHOLDER);
  assert.ok(!t.includes("Review this proposal and provide feedback"));
  assert.match(next(t), /add customer_challenges/);
});
