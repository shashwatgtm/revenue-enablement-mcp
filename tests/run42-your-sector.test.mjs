// Run 42B: your_sector, the seller's own industry, on every tool. Invented sellers only (B81).
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }) }));
  return r.json();
};
const call = async (name, args) => {
  const j = await rpc("tools/call", { name, arguments: args });
  return (j.result.content || []).map((c) => c.text).join("\n");
};
const sectorLine = (t) => (t.match(/\*Sector:[^\n]*/) || [""])[0];
const SERVICES = "Voxel, a managed IT services firm: round the clock monitoring and a dedicated delivery team under a statement of work";
const BASE = { framework: "meddpicc", your_solution: SERVICES, prospect_industry: "banks and lenders" };
const VALUES = ["logistics_tech", "fintech", "saas", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "other"];

test("every tool declares an optional your_sector with the ten choices", async () => {
  const { result: { tools } } = await rpc("tools/list", {});
  assert.equal(tools.length, 12);
  for (const t of tools) {
    const p = t.inputSchema.properties.your_sector;
    assert.ok(p, t.name);
    assert.deepEqual(p.enum, VALUES);
    assert.ok(!(t.inputSchema.required || []).includes("your_sector"), t.name);
  }
});

test("your_sector decides the sector over contrary text", async () => {
  const a = await call("discovery_question_bank", { ...BASE, your_sector: "cybersecurity" });
  assert.match(sectorLine(a), /set by your_sector as cybersecurity/);
  const b = await call("discovery_question_bank", { ...BASE, your_sector: "fintech" });
  assert.match(sectorLine(b), /set by your_sector as fintech/);
  const c = await call("discovery_question_bank", { ...BASE, your_sector: "other" });
  assert.match(sectorLine(c), /neutral/);
  assert.doesNotMatch(c, /### Sector notes/);
  // a tool that reads the sector in its own module
  const d = await call("win_loss_analyzer", { analysis_type: "single_deal", deal_outcome: "lost", your_solution: SERVICES, deal_details: "lost to a larger vendor", your_sector: "telecom" });
  assert.match(sectorLine(d), /set by your_sector as telecom/);
});

test("an unknown your_sector is refused with the list of choices and is not repeated", async () => {
  const t = await call("discovery_question_bank", { ...BASE, your_sector: "<img src=x onerror=1> bogus" });
  assert.match(t, /your_sector must be one of: logistics_tech/);
  assert.doesNotMatch(t, /bogus|<img/);
});

test("without your_sector a sector comes only from the seller's own words, never from the customer or the deal text", async () => {
  // customer industry and deal text name banks and security; the seller describes a services firm
  const a = await call("win_loss_analyzer", { analysis_type: "single_deal", deal_outcome: "lost", your_solution: "Voxel, a managed services firm", deal_details: "The bank buyer asked about payments, SIEM alerts and lending; we lost on price." });
  assert.doesNotMatch(sectorLine(a), /fintech|cybersecurity/);
  // a product with a payments feature is read as the product it is, not as payments
  const b = await call("discovery_question_bank", { framework: "meddpicc", your_solution: "Routely, a route planning and dispatch platform for fleets, with a payments feature for drivers", prospect_industry: "retail" });
  assert.doesNotMatch(sectorLine(b), /fintech/);
  // a customer's industry alone gives no sector
  const c = await call("discovery_question_bank", { framework: "meddpicc", your_solution: "a consulting offer", prospect_industry: "freight forwarders and hotels" });
  assert.doesNotMatch(sectorLine(c), /logistics tech|vertical SaaS/);
});
