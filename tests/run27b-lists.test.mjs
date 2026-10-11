// Run 27B (b): optional named list fields for two tools (demo_script_builder, discovery_question_bank: the tools of this server whose top fault on pool P5 after fix (g) was still input ignored, cut or garbled) (owner decision "(g) and (b) together"; input schemas of these tools only).
// Each list entry is read whole: never cut at a comma or a semicolon, and an objection or blocker keeps the answer the user already has.
// The old free text fields still work (every older test passes unchanged). Plain words only, no real company (rule B81).
// Tested in-process through netlify/functions/mcp.mjs (no network). Run: node --test tests/run27b-lists.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  return (await r.json()).result;
};
const call = async (name, args) => { const r = await rpc("tools/call", { name, arguments: args }); return { isError: !!r.isError, text: r.content.map((c) => c.text).join("\n") }; };

test("tools/list: the two tools offer the new list fields as optional inputs, and the two others do not", async () => {
  const tools = (await rpc("tools/list", {})).tools;
  const want = { demo_script_builder: ["product_parts", "pain_points_list", "must_show_list", "objections_list"], discovery_question_bank: ["product_parts", "pain_points_list"] };
  for (const name of ["account_plan_builder", "deal_strategy_coach"]) assert.ok(!Object.keys(tools.find((x) => x.name === name).inputSchema.properties).some((k) => /_list$|^product_parts$/.test(k)), name);
  for (const [name, fields] of Object.entries(want)) {
    const t = tools.find((x) => x.name === name);
    for (const f of fields) { assert.equal(t.inputSchema.properties[f].type, "array", `${name}.${f}`); assert.ok(!t.inputSchema.required.includes(f), `${name}.${f} optional`); }
  }
});

test("demo_script_builder: list entries are read whole (a part, a flow, an objection with its answer)", async () => {
  const r = await call("demo_script_builder", {
    demo_type: "first_look", primary_audience: "Head of Operations", customer_industry: "retail", your_solution: "Shelfwise, store operations software",
    product_parts: ["Task manager, which sends store tasks, photo checks and deadlines to each store", "Audit app for visits, scores and follow ups"],
    must_show_list: ["send a task to 40 stores, with a photo check, and see who finished"],
    pain_points_list: ["store tasks arrive by email, chat and phone, so nobody knows what is done"],
    objections_list: [{ question: "Does it work offline; and what happens to photos taken offline?", answer: "photos are kept on the phone and sent when the signal returns" }],
  });
  assert.equal(r.isError, false);
  assert.match(r.text, /\*\*Step \d: Send a task to 40 stores, with a photo check, and see who finished\*\*/);
  assert.match(r.text, /Buyer may ask: "Does it work offline, and what happens to photos taken offline\?"/);
  assert.match(r.text, /The short answer: photos are kept on the phone and sent when the signal returns/);
  assert.match(r.text, /Task manager/);
});

test("discovery_question_bank: each pain point entry is asked about whole, and the parts are the entries", async () => {
  const r = await call("discovery_question_bank", {
    framework: "meddpicc", prospect_industry: "retail", prospect_role: "Head of Operations", your_solution: "Shelfwise, store operations software",
    pain_points_list: ["store tasks arrive by email, chat and phone; nobody knows what is done", "audits are on paper, so fixes wait weeks"],
    product_parts: ["Task manager for store tasks and photo checks", "Audit app for visits and scores"],
  });
  assert.equal(r.isError, false);
  assert.match(r.text, /store tasks arrive by email, chat and phone; nobody knows what is done/);
  assert.match(r.text, /^- Task manager/m);
});
