// Run 21b (test first): the rollout and demo steps (MAP_EVAL, DEMO_SHOW) were written for one kind of company per vertical. A construction platform got
// "agree the pilot region ... secondary sales, productive calls, outlet coverage" (retail execution wording). Now the stock steps are used only for the
// kind they were written for; every other company of the vertical gets the generic steps. Plain words, no names.
import { test } from "node:test";
import assert from "node:assert/strict";
const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const BUILD = { section_type: "executive_summary", customer_name: "an account", customer_industry: "contractors", customer_challenges: "teams work from disconnected spreadsheets" };
const CONSTRUCTION = { ...BUILD, your_solution: "Construction management software for general contractors: project management, cost management and quality and safety" };
const FMCG = { ...BUILD, your_solution: "Field sales automation and distributor management software for consumer brands, with beat planning and order capture in the outlet" };
const STOCK = /secondary sales|productive calls|outlet coverage|distributor \(DMS\)|weak mobile signal/i;

test("proposal_section_writer: a construction platform gets generic rollout steps, a retail execution seller keeps its own", async () => {
  const a = await call("proposal_section_writer", CONSTRUCTION), b = await call("proposal_section_writer", FMCG);
  assert.match(a, /vertical SaaS, construction/i);
  assert.doesNotMatch(a, STOCK);
  assert.match(a, /pilot scope|baseline|measure the buyer names/i);
  assert.match(b, STOCK);
});

test("demo_script_builder: the demo list of a construction platform is not the retail execution one", async () => {
  const base = { demo_type: "first_look", primary_audience: "decision maker" };
  const a = await call("demo_script_builder", { ...base, your_solution: CONSTRUCTION.your_solution });
  const b = await call("demo_script_builder", { ...base, your_solution: FMCG.your_solution });
  assert.doesNotMatch(a, /low-end phone|beat plan|trade scheme|secondary sales by outlet/i);
  assert.match(b, /low-end phone|beat plan|secondary sales by outlet/i);
});

test("a last mile seller keeps the hub pilot, another logistics company gets the generic pilot", async () => {
  const lm = await call("proposal_section_writer", { ...BUILD, your_solution: "Last mile delivery management software with route planning, dispatch and proof of delivery" });
  const vis = await call("proposal_section_writer", { ...BUILD, your_solution: "Freight visibility platform that tracks shipments in real time across carriers" });
  assert.match(lm, /pilot hub|first-attempt|cost per delivery/i);
  assert.doesNotMatch(vis, /pilot hub|first-attempt delivery|driver app/i);
});
