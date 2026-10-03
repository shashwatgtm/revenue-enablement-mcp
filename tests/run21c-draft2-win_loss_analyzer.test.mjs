// Run 21c second pass (test first): independent judges found the stakeholder count wrong when a comma sits inside a title, an alternative
// wrongly classed by one word ("multiple files" is not a set of separate tools), the buyer segment from the deal notes unused, and the
// deal notes echoed back in full. Invented companies. Run: node --no-warnings --test tests/run21c-draft2-win_loss_analyzer.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "win_loss_analyzer", arguments: args } }) }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};

const SEC = {
  analysis_type: "competitor_analysis",
  your_solution: "Cloudward, a cloud security platform that secures hybrid and multi-cloud environments: workload protection, posture management and detection and response",
  deal_details: "Cloudward deals with Payments technology; roles involved: CISO, Incident Response Team Lead, CSO, Vice President IT Security, Director, Security Engineering, developers; the alternatives buyers use are described as separate point tools for posture and workload security that do not share data; cloud provider native tools that do not correlate findings across clouds. The deal value and cycle figures are hypothetical.",
  deal_value: 60000, sales_cycle_days: 90,
  stakeholders_involved: "CISO, Incident Response Team Lead, CSO, Vice President IT Security, Director, Security Engineering, developers",
};
const RETAIL = {
  analysis_type: "competitor_analysis",
  your_solution: "Routewise, a delivery planning platform: route planning, driver app and proof of delivery, for fleets of vans",
  deal_details: "Routewise deals with Retail; roles involved: Chief Operating Officer, Head of Last-mile, Group Logistics Manager; the alternatives buyers use are described as manual excel based routing that only handles a few variables; consolidating multiple files from various carriers; several separate billing vendors. The deal value and cycle figures are hypothetical.",
  deal_value: 150000, sales_cycle_days: 150, stakeholders_involved: "Chief Operating Officer, Head of Last-mile, Group Logistics Manager",
};

test("a comma inside a title does not change the stakeholder count", async () => {
  const t = await call(SEC);
  assert.match(t, /\b6 stakeholders were involved/);
  assert.doesNotMatch(t, /\b5 stakeholders/);
  assert.match(t, /\| \*\*Stakeholders\*\* \|[^\n]*Incident Response Team Lead; CSO; Vice President IT Security; Director, Security Engineering; developers/);
});

test("a task of consolidating files is not classed as a set of separate tools, a set of separate vendors still is", async () => {
  const t = await call(RETAIL);
  const line = (s) => t.split("\n").find((l) => l.startsWith("- **") && l.toLowerCase().includes(s)) || "";
  assert.ok(line("consolidating multiple files"));
  assert.doesNotMatch(line("consolidating multiple files"), /separate tools or vendors/);
  assert.match(line("several separate billing vendors"), /separate tools or vendors/);
});

test("the buyer segment from the deal notes is used in a question, and the notes are not echoed back in full", async () => {
  const t = await call(RETAIL);
  assert.ok(t.split("\n").some((l) => /^\d\./.test(l) && /\bRetail\b/.test(l)), "a review question names the segment");
  assert.doesNotMatch(t, /\n> [^\n]*roles involved/i);
  assert.doesNotMatch(t, /\n> [^\n]*alternatives buyers use are described as/i);
  assert.match(t, /hypothetical/);
  assert.match(t, /Routewise deals with Retail/);
});
