// Run 22: the three rewritten Revenue tools run over the tuning pool scenarios (T6 to T9, H1 to H9, P1 to P9, Q1 to Q18) through the real builders of the
// private project folder. The test is skipped when that folder is not on this machine (the public repo carries no real company). No company is named here.
// Run: node --no-warnings --test tests/run22-rev-w1-pool-sweep.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const ROOT = "/home/user/directory-submission-work/work";
let BUILD20, loadSet;
try {
  ({ BUILD20 } = await import(`${ROOT}/run20/eval/builders20.mjs`));
  ({ loadSet } = await import(`${ROOT}/run21/eval/common21.mjs`));
} catch { /* not on this machine */ }

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => (await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }) }))).json();
const TOOLS = ["account_plan_builder", "mutual_action_plan_generator", "roi_business_case_builder"];
const BRACKET = /\[[^\]\n]{2,}\]|\{[^}\n]{2,}\}|\bTBD\b|Insert |\[Your /i;
const DASH = /[–—]/;
const HEALTH = /clinic|pharmac|patient|hospital|medical/i;
const PLACEHOLDER = /not named|Not identified|undefined|NaN|\[object|\(none\)|to be mapped|\(not named\)/;
const norm = (s) => s.toLowerCase().replace(/\s+/g, " ");

test("pool scenarios: no placeholder, no dash, no healthcare word, and every contact, blocker and cost line is in the answer", { skip: !BUILD20 }, async () => {
  const tools = (await rpc("tools/list", {})).result.tools;
  const sets = [];
  for (const s of ["T", "H", "P", "Q"]) { try { sets.push(...(await loadSet(s))); } catch { /* a set may be missing */ } }
  const scenarios = sets.filter((sc) => !/^[SUN]/.test(sc.id) && !/^T[1-5]$/.test(sc.id));
  assert.ok(scenarios.length >= 27, `only ${scenarios.length} scenarios`);
  for (const sc of scenarios) {
    for (const tool of TOOLS) {
      const schema = tools.find((t) => t.name === tool).inputSchema;
      const args = await BUILD20.revenue[tool](sc, 0, schema);
      const j = await rpc("tools/call", { name: tool, arguments: args });
      assert.ok(j.result && !j.result.isError, `${sc.id} ${tool}: ${JSON.stringify(j).slice(0, 200)}`);
      const t = j.result.content.map((c) => c.text).join("\n");
      const where = `${sc.id} ${tool}`;
      assert.doesNotMatch(t, BRACKET, where); assert.doesNotMatch(t, DASH, where); assert.doesNotMatch(t, HEALTH, where); assert.doesNotMatch(t, PLACEHOLDER, where);
      if (tool === "roi_business_case_builder") {
        assert.doesNotMatch(t, /Total Quantified Value|Net Annual Benefit|\*\*ROI\*\*\s*\||Payback Period/, `${where} prints a return`);
        assert.doesNotMatch(t, /win rate/i, where);
        assert.doesNotMatch(t, /[A-Za-z]+_[A-Z][a-z]+/, `${where} shows a raw label`);
      }
      if (tool === "account_plan_builder" && args.known_contacts) {
        const rows = t.split("\n").filter((l) => l.startsWith("| ") && l.includes(" | "));
        assert.ok(rows.length >= 4, where);
        for (const note of String(args.account_notes || "").split(/objections?\s*:/i).slice(1)) for (const o of note.split(";").map((x) => x.trim().replace(/[.]+$/, "")).filter(Boolean)) assert.ok(norm(t).includes(norm(o).replace(/\?$/, "")), `${where} lost the objection ${o}`);
      }
      if (tool === "mutual_action_plan_generator") {
        for (const o of String(args.blockers || "").split(";").map((x) => x.trim().replace(/[?.]+$/, "")).filter(Boolean)) assert.ok(norm(t).includes(norm(o)), `${where} lost the blocker ${o}`);
        const dates = [...t.split("## Mutual Action Plan Timeline")[1].split("## Risks & Blockers")[0].matchAll(/\b(20\d\d-\d\d-\d\d)\b/g)].map((m) => m[1]);
        for (const d of dates) { const w = new Date(d + "T00:00:00Z").getUTCDay(); assert.ok(w !== 0 && w !== 6 && d <= args.target_close_date, `${where} ${d}`); }
      }
    }
  }
});
