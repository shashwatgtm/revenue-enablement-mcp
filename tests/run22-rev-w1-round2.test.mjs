// Run 22 round 2 (rev-w1): the usage unit comes only from the user's own pricing words (no messaging word in a shipping or payments deal), a name is used only when it is
// clearly a name (never the first word of a plain description), the MAP counts calendar days from the dates and splits a comma list of requirements, and the ROI case
// uses every named part of the product. Invented companies only. Run: node --no-warnings --test tests/run22-rev-w1-round2.test.mjs
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
const MESSAGING = /\bmessages?\b|\bsms\b|\bsender\b/i;

const SHIP = "Shipwell Lite, a shipping platform for online sellers: courier choice, labels, tracking, returns and WhatsApp marketing for shoppers";
const PAY = "Paylane, a payments platform for online merchants: checkout, payouts and refunds, priced per transaction";
const MSG = "Pingrelay, a business messaging API that sends order notices over SMS and WhatsApp, priced per message";

test("a shipping seller with a WhatsApp feature gets no messaging wording in any of the three tools", async () => {
  const roi = await call("roi_business_case_builder", { customer_name: "Brightcrate Retail", industry: "Retail", your_solution: SHIP, solution_price: 18000, primary_value_driver: "cost_reduction", current_process: "today they handle it with dealing with courier partners one by one" });
  const map = await call("mutual_action_plan_generator", { deal_name: "Retail deal for Shipwell Lite", target_close_date: future(70), your_solution: SHIP, buyer_champion: "Head of Logistics", known_requirements: "ship cheaper; see every parcel in one place" });
  const plan = await call("account_plan_builder", { account_name: "Brightcrate Retail", current_arr: 18000, your_solution: SHIP, known_contacts: "Head of Logistics (champion)", competitive_threats: "dealing with courier partners one by one", account_notes: "Objections: How much does it cost?" });
  for (const [name, t] of [["roi", roi], ["map", map], ["plan", plan]]) {
    assert.doesNotMatch(t, MESSAGING, `${name} carries a messaging word`);
  }
});

test("a payments seller is priced per transaction and a messaging seller per message, only because the user said so", async () => {
  const pay = await call("mutual_action_plan_generator", { deal_name: "Retail deal for Paylane", target_close_date: future(70), your_solution: PAY, buyer_champion: "Head of Payments" });
  assert.match(pay, /per transaction/); assert.doesNotMatch(pay, MESSAGING);
  const msg = await call("mutual_action_plan_generator", { deal_name: "Retail deal for Pingrelay", target_close_date: future(70), your_solution: MSG, buyer_champion: "Lead Developer" });
  assert.match(msg, /per message/); assert.match(msg, /message/i);
  const neutral = await call("roi_business_case_builder", { customer_name: "Larkfield Marketplace", your_solution: "Gridway, a usage based freight rating engine for shippers", solution_price: 54000, primary_value_driver: "cost_reduction" });
  assert.doesNotMatch(neutral, MESSAGING);
});

test("a plain description with no name never gives its first word as a name", async () => {
  for (const sol of ["Agentic transportation management system for shippers that plans, books and tracks loads", "Cloud-native, composable core banking platform that connects payments and lending", "Operations platform for hotel groups that joins reservations, housekeeping and billing"]) {
    const first = sol.split(/[\s,]/)[0];
    const bad = new RegExp(`\\b${first}(?:'s| is described| would| have| has| is priced| can be| needs| covers| in your)`);
    for (const [tool, args] of [
      ["roi_business_case_builder", { your_solution: sol, primary_value_driver: "cost_reduction", current_process: "today they handle it with spreadsheets", customer_name: "Brightcrate Retail" }],
      ["account_plan_builder", { account_name: "Brightcrate Retail", your_solution: sol, known_contacts: "Head of Operations (champion)", account_notes: "Objections: How much does it cost?; Does it integrate with our ERP?" }],
      ["mutual_action_plan_generator", { deal_name: "Retail deal", target_close_date: future(60), your_solution: sol, blockers: "How much does it cost?" }],
    ]) {
      const t = await call(tool, args);
      assert.doesNotMatch(t, bad, `${tool}: ${sol.slice(0, 20)}`);
      assert.ok(t.includes(sol.split(/[:,]/)[0].slice(0, 25)) || /your solution|the solution/.test(t), `${tool}: the description is quoted or the words are neutral`);
    }
  }
});

test("a name written as Name, a description is still used; a name given in the customer field wins over a plain description", async () => {
  const t = await call("account_plan_builder", { account_name: "Brightcrate Retail", your_solution: "Lanehop, a routing and dispatch platform for last-mile delivery", known_contacts: "Head of Last-mile (champion)" });
  assert.match(t, /with Lanehop/);
  const u = await call("roi_business_case_builder", { customer_name: "Hotel groups account (Mewsly customer)", your_solution: "Mewsly operating system for hotels that joins reservations, housekeeping and billing", primary_value_driver: "cost_reduction" });
  assert.match(u, /Mewsly/);
});

test("the MAP counts calendar days from the dates, and a comma list of requirements is one criterion each", async () => {
  const close = future(67);
  const t = await call("mutual_action_plan_generator", { deal_name: "Public sector deal for Gatekeep", target_close_date: close, your_solution: "Gatekeep, cloud identity and access management sold as suites", buyer_champion: "IAM Engineer",
    known_requirements: "connect the right people to the right systems securely, enforce least privilege with the least friction, achieve compliance faster, and bring AI agents into the identity fabric so they can be governed" });
  assert.match(t, /: 67 working days|\b6[0-9] calendar days/);
  const m = t.match(/(\d+) calendar days/);
  const days = Math.round((Date.parse(close + "T00:00:00Z") - Date.parse(new Date().toISOString().slice(0, 10) + "T00:00:00Z")) / 86400000);
  assert.equal(Number(m[1]), days);
  assert.match(t, /Each of the 4 things you listed/);
  const rows = t.split("\n").filter((l) => /^\| (?:Connect the right people|Enforce least privilege|Achieve compliance|Bring AI agents)/.test(l));
  assert.equal(rows.length, 4, rows.join("\n"));
  assert.equal(new Set(rows.map((r) => r.split("|")[2].trim())).size >= 3, true, "the tests differ by criterion");
});

test("the ROI case names every part of the product once, ties cost lines and results to a part, and the quoted result is mapped to a measure of the sector", async () => {
  const t = await call("roi_business_case_builder", { customer_name: "Harborline Bank", industry: "Financial_Services", your_solution: "Vigilwall, a cloud attack surface platform made of exposure discovery, exposure ranking, takedowns, third party risk monitoring and a threat intelligence feed",
    solution_price: 80000, primary_value_driver: "cost_reduction", current_process: "today they handle it with a generic dark web feed; isolated alerts from separate tools; manual takedown requests by email",
    known_metrics: "Success story: leaked credentials found and closed within a day for a logistics firm (story title)" });
  const brief = t.split("## The case in brief")[1].split("## ")[0];
  for (const part of ["exposure discovery", "exposure ranking", "takedowns", "third party risk monitoring", "threat intelligence feed"]) assert.ok(brief.includes(part), `the case in brief leaves out ${part}`);
  assert.match(t, /Part of Vigilwall that answers it/);
  assert.match(t, /Part of Vigilwall it relates to/);
  assert.doesNotMatch(t, /Which of the buyer's own numbers would change, and what that change is worth in a year/);
  assert.doesNotMatch(t, /Harborline Bank's revenue|Financial_Services/);
});

test("an alternative is tied to the part of the product that answers it, by the words they share", async () => {
  const t = await call("account_plan_builder", { account_name: "Brightcrate Retail", current_arr: 90000, your_solution: "Lanehop, a logistics platform that joins transport planning, shipment visibility, yard management and AI agents that act on exceptions",
    known_contacts: "Head of Logistics (champion)", competitive_threats: "best guess dock labor planning; a legacy system that cannot detect delays in time to react" });
  assert.match(t, /"best guess dock labor planning" points to yard management/);
  assert.match(t, /"a legacy system that cannot detect delays in time to react" points to (?:shipment visibility|AI agents that act on exceptions)/);
  assert.doesNotMatch(t, /None of the parts maps/);
});

test("a quoted objection is never cut in the middle", async () => {
  const q = "What's the hidden cost of stitching together best-of-breed point tools vs. a consolidated platform?";
  const t = await call("account_plan_builder", { account_name: "Orchard Bank", your_solution: "Vigilwall, a cloud attack surface platform", account_notes: `Objections: What is the real cost of a security tool beyond the licence: integration, tuning, headcount?; ${q}` });
  assert.ok(t.includes(q), "the whole objection is kept");
});

// every Revenue tool: a description with no name never gives its first word as the name (E11 "name cut to one word")
test("no Revenue tool uses the first word of a plain description as the product name", async () => {
  const base = (sol) => ({
    account_plan_builder: { account_name: "Northwind Cargo", your_solution: sol, current_products: sol },
    discovery_question_bank: { framework: "meddpicc", your_solution: sol },
    roi_business_case_builder: { your_solution: sol, primary_value_driver: "cost_reduction" },
    mutual_action_plan_generator: { deal_name: "Northwind deal", target_close_date: future(60), your_solution: sol },
    win_loss_analyzer: { analysis_type: "single_deal", deal_outcome: "won", your_solution: sol, deal_details: "A national shipper chose us after a pilot." },
    proposal_section_writer: { section_type: "executive_summary", your_solution: sol, customer_name: "Northwind Cargo" },
    email_sequence_generator: { sequence_type: "cold_outreach", target_persona: "VP Operations", your_solution: sol },
    demo_script_builder: { demo_type: "first_look", your_solution: sol },
    champion_enablement_kit: { asset_type: "executive_brief", your_solution: sol },
    competitive_trap_setter: { competitor: "Rival Systems", your_solution: sol },
  });
  for (const sol of ["Cloud-native, composable core banking platform that connects payments, lending and deposits", "Systematic, rules based investment strategies powered by machine learning for pension funds", "Operations, data and customer experience services for telecom and media companies", "Intelligent orchestration platform for DevSecOps teams that plans, builds and ships software"]) {
    const first = sol.split(/[\s,]/)[0];
    const bad = new RegExp(`(?<![\\w-])${first}(?:'s| (?:is|was|are|has|have|can|would|will|won|lost|did|does|needs|helps|covers))\\b`);
    for (const [tool, args] of Object.entries(base(sol))) {
      const t = await call(tool, args);
      assert.doesNotMatch(t, bad, `${tool}: "${first}" is used as a name`);
    }
  }
});

test("MAP: each requirement is tested its own way and judged by the person who can judge it", async () => {
  const t = await call("mutual_action_plan_generator", { deal_name: "Public sector deal for Gatekeep", target_close_date: future(70), your_solution: "Gatekeep, cloud identity and access management sold as suites", buyer_champion: "IAM Engineer", technical_evaluators: "Security Lead, Compliance Auditor",
    known_requirements: "enforce least privilege with the least friction, achieve compliance faster, and bring AI agents into the identity fabric so they can be discovered and governed" });
  const rows = t.split("\n").filter((l) => /^\| (?:Enforce least privilege|Achieve compliance|Bring AI agents)/.test(l));
  assert.equal(rows.length, 3);
  assert.equal(new Set(rows.map((r) => r.split("|")[2].trim())).size, 3, "three different tests");
  assert.match(rows[1], /Compliance Auditor/); assert.match(rows[0], /Security Lead/);
});

test("email: a figure keeps its sentence and says whose it is", async () => {
  const t = await call("email_sequence_generator", { sequence_type: "cold_outreach", target_persona: "VP Operations", your_solution: "Acmeco, a shipping platform for sellers",
    social_proof: "Over 8 weeks with a leading private bank, the filter stopped over 30 million attacks (page claim); Northfield: 80% adoption across 7,000 employees, 3,400+ agents created (page claims)", num_emails: 5 });
  assert.ok(t.includes("Over 8 weeks with a leading private bank, the filter stopped over 30 million attacks") || t.includes("over 8 weeks with a leading private bank, the filter stopped over 30 million attacks"), "the sentence is whole");
  assert.doesNotMatch(t, /private bank\.\s/);
  const body = t.split("## Before you send")[0];
  assert.ok(body.includes("3,400+ agents created"));
  for (const m of body.matchAll(/3,400\+ agents created/g)) assert.ok(body.slice(Math.max(0, m.index - 14), m.index).includes("Northfield"), "the figure says whose it is");
});

test("champion kit: a point with a colon list and a closing remark becomes a parent bullet with whole items", async () => {
  const t = await call("champion_enablement_kit", { asset_type: "internal_business_case", your_solution: "Lanehop, a routing and dispatch platform", champion_role: "Head of Logistics", target_stakeholder: "COO",
    key_value_points: "turn routes into an asset: cut planning time, keep vans on the road and move with greater speed, control and scale (the One Route idea)", known_objections: "How do we cut cost without hurting service?" });
  const sec = t.split("## What we expect to get")[1].split("\n## ")[0];
  assert.doesNotMatch(sec, /^\s*- Control and scale/m);
  assert.match(sec, /- Turn routes into an asset \(the One Route idea\):/);
  assert.match(sec, /Keep vans on the road and move with greater speed, control and scale/);
});

test("trap setter: a weak point that opens with an adjective is asked about by what the adjective says", async () => {
  const t = await call("competitive_trap_setter", { competitor: "buying and maintaining physical devices", competitor_weaknesses: "costly physical devices", your_solution: "Devfarm, a cloud platform for testing apps on real devices", trap_type: "all" });
  assert.match(t, /What do physical devices cost in each option over three years/);
  assert.doesNotMatch(t, /How does each option handle physical devices/);
});
