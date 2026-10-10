// Run 22 round 5 small (rev-w1). Invented companies only (rule B81 for this public repo).
//  1  account plan: a long competitor phrase is not repeated in every objection answer; a camel case product name keeps its capitals; "product owners" are not senior decision makers;
//     a pain about stitched together tools points to the platform and the parts it names; sales and customer service teams of a freight visibility deal are not support agents
//  2  roi: a pain naming several parts is answered by all of them, and the parts it names are not listed as unplaced; every answered cost line is in the case in words; a study's return figure is not "audit hours"
//  3  map: the security review is owned by the IT or security evaluator, not by engineering; "Why do banks choose ..." in an insurer deal says so
// Run: node --no-warnings --test tests/run22-rev-w1-round5b.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  assert.ok(j.result && j.result.content, JSON.stringify(j));
  return j.result.content.map((c) => c.text).join("\n");
};
const future = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const tableRows = (t, heading) => { const s = t.split(new RegExp(`\\n## ${heading}[^\\n]*\\n`))[1] || ""; return s.split("\n## ")[0].split("\n").filter((l) => l.startsWith("|") && !/^\|[-| ]+\|$/.test(l)).slice(1); };
const cells = (row) => row.split("|").slice(1, -1).map((c) => c.trim());
const section = (t, heading) => (t.split(new RegExp(`\\n## ${heading}[^\\n]*\\n`))[1] || "").split("\n## ")[0];

const DEVOPS = "BuildForge, the orchestration platform for DevSecOps: planning, source code management, built in CI/CD, container and package registry, application security testing, compliance, DORA metrics and BuildForge Duo Agent Platform, run as BuildForge.com SaaS, Self Managed or Dedicated single tenant SaaS";
const THREATS = "collections of separate point tools for planning, source control, CI/CD, artifact storage and delivery; separate security and compliance scanners; tools with limited deployment options such as cloud only; AI coding assistants that keep one developer in flow but do not connect the lifecycle";

test("1a. objection answers name a long alternative once, short; a camel case name keeps its capitals; product owners are not senior decision makers", async () => {
  const t = await call("account_plan_builder", { account_name: "Financial services account (BuildForge customer)", industry: "Financial services", current_arr: 150000, known_contacts: "DevOps leaders (champion), CIO (buyer), CTO, developers, product owners", current_products: "BuildForge", competitive_threats: THREATS, your_solution: DEVOPS, account_notes: "Objections: How is BuildForge different?; How does BuildForge integrate with existing tools?." });
  const obj = section(t, "Objections to expect");
  assert.doesNotMatch(obj, /artifact storage and delivery/);
  assert.doesNotMatch(t, /\bbuildForge\b/);
  const row = tableRows(t, "Who decides and who influences").map(cells).find((c) => /product owners/.test(c[0]));
  assert.doesNotMatch(row[1], /Senior decision maker/);
});
test("1b. a pain about stitched together tools points to the platform and the parts it names", async () => {
  const t = await call("account_plan_builder", { account_name: "Financial services account (BuildForge customer)", industry: "Financial services", current_arr: 150000, known_contacts: "DevOps leaders (champion), CIO (buyer)", current_products: "BuildForge", competitive_threats: THREATS, your_solution: DEVOPS });
  const line = t.split("\n").find((l) => l.startsWith('- "collections of separate point tools'));
  assert.match(line, /points to BuildForge as one platform, which brings together planning, source code management and built in CI\/CD/);
  assert.doesNotMatch(line, /Agent Platform/);
});
test("1c. sales and customer service teams of a freight visibility deal are not support agents", async () => {
  const t = await call("account_plan_builder", { account_name: "Automotive account (Roadbird customer)", industry: "Automotive", current_arr: 250000, known_contacts: "Transport Excellence Manager (champion), Chief Supply Chain Officer (buyer), sales teams, customer service teams", your_solution: "Roadbird, a decision intelligence platform for shippers that joins transportation management, shipment visibility on every mode and yard management, on one network of carriers", competitive_threats: "a legacy logistics solution that cannot detect delays" });
  const rows = tableRows(t, "Who decides and who influences").map(cells);
  const cs = rows.find((c) => /customer service/.test(c[0])); const sales = rows.find((c) => /sales teams/.test(c[0]));
  assert.doesNotMatch(cs.join(" "), /quality check|agents judge|handling time/i);
  assert.match(cs.join(" "), /where the goods are|late shipment|enquir/i);
  assert.match(sales.join(" "), /order status|delivery date|promise/i);
  const support = await call("account_plan_builder", { account_name: "software account (Callnest customer)", industry: "software", current_arr: 20000, known_contacts: "customer service teams", your_solution: "Callnest, a help desk platform with AI agents for support teams" });
  assert.doesNotMatch(support, /where the goods are/);
});

test("2a. a pain naming several parts is answered by all of them and they are not listed as unplaced", async () => {
  const t = await call("roi_business_case_builder", { customer_name: "Financial services account (BuildForge customer)", industry: "Financial_Services", company_size: "enterprise", your_solution: DEVOPS, solution_price: 150000, primary_value_driver: "revenue_increase",
    known_metrics: "Hilmar deploys mission critical software 4x faster with BuildForge (customer story title)", current_process: `today they handle it with ${THREATS}` });
  const cost = tableRows(t, "Cost lines to price").map(cells);
  const part = (re) => (cost.find((c) => re.test(c[0])) || [])[2] || "";
  assert.match(part(/separate point tools/i), /planning/); assert.match(part(/separate point tools/i), /source code management/); assert.match(part(/separate point tools/i), /CI\/CD/);
  assert.match(part(/security and compliance scanners/i), /application security testing/); assert.match(part(/security and compliance scanners/i), /compliance/);
  const unplaced = section(t, "Parts not yet placed in the case");
  assert.doesNotMatch(unplaced, /\bplanning\b|source code management|built in CI\/CD|\bcompliance\b/);
  const words = section(t, "The case in words");
  assert.match(words, /AI coding assistants[^"]*" with BuildForge Duo Agent Platform/i, "the fourth cost line is in the case in words");
});
test("2b. a study's return figure is not tied to audit hours", async () => {
  const t = await call("roi_business_case_builder", { customer_name: "Public sector account (Zelvane customer)", industry: "Public sector", your_solution: "Zelvane Access, cloud identity and access management: single sign on, adaptive MFA and access governance", solution_price: 150000, primary_value_driver: "risk_mitigation",
    known_metrics: "A Forrester-style study says Zelvane Identity Governance can result in 211% ROI (page claim)", current_process: "manual access reviews" });
  const row = tableRows(t, "Results you quoted").map(cells).find((c) => /211% ROI/.test(c[0]));
  assert.match(row[1], /own yearly cost/);
  assert.doesNotMatch(row[1], /audit/i);
});

test("3. the security review is owned by the IT evaluator, not by engineering; a question about banks in an insurer deal says so", async () => {
  const t = await call("mutual_action_plan_generator", { deal_name: "Insurance deal for Brexmoor", target_close_date: future(70), current_stage: "evaluation", buyer_champion: "technology leaders", technical_evaluators: "leadership team, engineering teams, product teams, IT teams",
    known_requirements: "reclaim budget locked in maintenance, shrink technical debt", blockers: "Why do banks choose specialist banking IT partners over general IT firms?; Why do enterprises choose Cloudshift over standard cloud migration tools and services?",
    your_solution: "Brexmoor, an IT services and consulting company that builds, modernizes and runs enterprise applications: Cloudshift for cloud and data migration" });
  const sec = t.split("\n").find((l) => /Security and compliance review of the vendor/.test(l));
  assert.match(sec, /\| IT teams \|/);
  assert.doesNotMatch(sec, /engineering teams/);
  const banks = t.split("\n").find((l) => l.startsWith("| Why do banks"));
  assert.match(banks, /question is about banks and this deal is with insurers/);
  const ent = t.split("\n").find((l) => l.startsWith("| Why do enterprises"));
  assert.doesNotMatch(ent, /question is about/);
});
