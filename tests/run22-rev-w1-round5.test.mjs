// Run 22 round 5 (rev-w1): faults of the round 4 judging. Invented companies only (rule B81 for this public repo).
//  1  map, a core banking platform: the evaluation is a proof of concept on one product or brand with a migration rehearsal and the regulator, not a trial of first users;
//     a neobank is not told "replacing a core is too risky"; milestones do not repeat across phases
//  2  map: evaluators do not share one sentence
//  3  roi: a colon list is not cut off ("DORA m"), a named product stays a part, results go to the part they are about, the case in words reads as sentences
//  4  account plan: the sector's "who signs" line is not set beside a senior contact the user named; a chief security officer is not given the incident response lead's concerns
// Run: node --no-warnings --test tests/run22-rev-w1-round5.test.mjs
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
const milestones = (t) => t.split("\n").filter((l) => /^\| \d+ \|/.test(l)).map((l) => cells(l)[1]);

// ---- 1 ----
const CORE = "Tarnwick Core, a cloud native, composable core banking platform that connects core banking, lending, deposits, payments and AI in one core for banks, lenders and fintechs, with professional services for implementation";
const coreMap = (deal, extra = {}) => call("mutual_action_plan_generator", { deal_name: deal, target_close_date: future(70), current_stage: "evaluation", known_requirements: "launch new digital banking products faster, scale securely to millions of customers", your_solution: CORE, ...extra });
test("1a. a core banking platform is proved on one product or brand with a migration rehearsal and the regulator told", async () => {
  const t = await coreMap("neobanks deal for Tarnwick Core");
  const phase1 = (t.split("### Phase 1")[1] || "").split("### Phase 2")[0];
  assert.match(phase1, /proof of concept/i); assert.match(phase1, /migration rehearsal/i); assert.match(phase1, /regulator/i);
  assert.match(phase1, /one product or one new brand/i);
  assert.doesNotMatch(t, /first users|check use every week|Run the trial on that work/i);
  assert.match(t, /Security and compliance review of the vendor/, "the vendor security review is still in the plan");
});
test("1b. a neobank is not told that replacing a core is too risky; a bank replacing its legacy core is", async () => {
  const neo = await coreMap("neobanks deal for Tarnwick Core");
  assert.doesNotMatch(neo, /Replacing a core is too risky/);
  assert.match(neo, /Our regulator must approve changes/);
  const bank = await coreMap("banks deal for Tarnwick Core");
  assert.match(bank, /Replacing a core is too risky/);
});
test("1c. no milestone is repeated across phases", async () => {
  for (const t of [await coreMap("neobanks deal for Tarnwick Core"), await call("mutual_action_plan_generator", { deal_name: "Retail deal for Boardwise", target_close_date: future(70), current_stage: "evaluation", buyer_champion: "Head of Operations", economic_buyer: "CFO", known_requirements: "see every order in one place", your_solution: "Boardwise, a meeting management platform for operations teams" })]) {
    const ms = milestones(t);
    assert.ok(ms.length >= 12);
    assert.equal(new Set(ms).size, ms.length, "a milestone appears twice");
    assert.doesNotMatch(ms.join("\n"), /final approvals[\s\S]*final approvals/i);
    const terms = ms.filter((m) => /^Agree the commercial (?:shape|terms)/i.test(m)); assert.ok(terms.length <= 1, terms.join(" | "));
    const setup = ms.filter((m) => /the access, the integrations|test environment, the integrations/i.test(m)); assert.ok(setup.length <= 1, setup.join(" | "));
  }
});

// ---- 2 ----
test("2. evaluators do not share one sentence", async () => {
  const t = await call("mutual_action_plan_generator", { deal_name: "Software deal for Postline", target_close_date: future(70), current_stage: "evaluation", buyer_champion: "Platform Engineer", technical_evaluators: "Developer Advocate, IT / Security, Product Manager, QA Engineer, Software Developer, managers who certify their team's access",
    known_requirements: "high productivity for developers, great quality for APIs", your_solution: "Postline, an API platform for building and using APIs" });
  const owns = t.split("\n").filter((l) => l.startsWith("| **Evaluator**")).map((l) => cells(l)[2]);
  assert.equal(owns.length, 6);
  assert.equal(new Set(owns).size, owns.length, owns.join("\n"));
  assert.doesNotMatch(owns.join("\n"), /Their own part of the evaluation/);
});

// ---- 3 ----
const DEVOPS = "Forgeline, the orchestration platform for DevSecOps: planning, source code management, built in CI/CD, container and package registry, application security testing, compliance, DORA metrics and Forgeline Duo Agent Platform, run as Forgeline.com SaaS, Self Managed or Dedicated single tenant SaaS";
test("3a. a colon list is read whole and a named product stays a part", async () => {
  const t = await call("roi_business_case_builder", { customer_name: "Financial services account (Forgeline customer)", industry: "Financial_Services", your_solution: DEVOPS, solution_price: 150000, primary_value_driver: "revenue_increase",
    known_metrics: "Aldwick Systems: faster deployment capabilities contribute to business growth; 50% faster deployments and 10x increase in testing scenarios (page claim); Hilmar deploys mission critical software 4x faster with Forgeline (customer story title); Scaling to 2M+ Merge Requests: How Brightcorp Uses Forgeline to Power Hiring (customer story title)",
    current_process: "today they handle it with collections of separate point tools for planning, source control, CI/CD, artifact storage and delivery; tools with limited deployment options such as cloud only; AI coding assistants that keep one developer in flow but do not connect the lifecycle" });
  assert.doesNotMatch(t, /DORA m\b(?!etrics)/);
  assert.match(t, /DORA metrics/);
  const cost = tableRows(t, "Cost lines to price").map(cells);
  assert.match(cost.find((c) => /AI coding assistants/i.test(c[0]))[2], /Duo Agent Platform/);
  const res = tableRows(t, "Results you quoted").map(cells);
  assert.match(res.find((c) => /Aldwick/.test(c[0]))[2], /CI\/CD/);
  assert.match(res.find((c) => /Hilmar/.test(c[0]))[2], /CI\/CD/);
  assert.match(res.find((c) => /Merge Requests/.test(c[0]))[2], /source code management/);
});
test("3b. the case in words reads as sentences when two results measure different things", async () => {
  const t = await call("roi_business_case_builder", { customer_name: "online retailers account (Parcelbird customer)", industry: "Retail", your_solution: "Parcelbird, ecommerce platform that helps sellers manage shipping, logistics and fulfilment: domestic and cross-border shipping, fulfilment and warehousing, one-click checkout, WhatsApp marketing and financial services", solution_price: 18000, primary_value_driver: "cost_reduction",
    known_metrics: "Dunmere Foods: delivery rate jumped from 46% to 72% within one month (customer words); Ashby Tea: 46% improvement in session-based conversions and 8% increase in average order value (case study headline)", current_process: "today they handle it with dealing with courier partners one by one" });
  const words = (t.split("## The case in words")[1] || "").split("\n## ")[0];
  assert.match(words, /measured: first, [^;]+; second, /);
  assert.doesNotMatch(words, /costs and the (?:revenue|time|share|hours|cost)/);
});

// ---- 4 ----
const SHIP = "Roadbird, a transport management platform for shippers: planning, tracking and carrier payments";
test("4a. the sector's who-signs line is not set beside a senior contact the user named", async () => {
  const withExec = await call("account_plan_builder", { account_name: "automotive account (Roadbird customer)", industry: "Automotive", current_arr: 90000, known_contacts: "Chief Supply Chain Officer, Transport Manager (champion), Logistics Analyst", your_solution: SHIP });
  assert.doesNotMatch(withExec, /Usual buying committee \([^)]*\): The [^.]* signs/);
  const none = await call("account_plan_builder", { account_name: "automotive account (Roadbird customer)", industry: "Automotive", current_arr: 90000, known_contacts: "Transport Manager (champion), Logistics Analyst", your_solution: SHIP });
  assert.match(none, /Usual buying committee/);
});
test("4b. a chief security officer is not given the incident response lead's concerns", async () => {
  const t = await call("account_plan_builder", { account_name: "payments account (Sentrybird customer)", industry: "Payments", current_arr: 60000, known_contacts: "Incident Response Team Lead (champion), CISO (buyer), CSO, Vice President IT Security", your_solution: "Sentrybird, a cloud security platform that finds exposures and detects threats" });
  const rows = tableRows(t, "Who decides and who influences").map(cells);
  const cso = rows.find((c) => c[0] === "CSO"); const ir = rows.find((c) => /Incident Response/.test(c[0]));
  assert.ok(cso && ir);
  assert.notEqual(cso[2].replace(/^Like [^:]+: /, ""), ir[2].replace(/^Like [^:]+: /, ""));
  assert.doesNotMatch(cso[2], /Like Incident Response/);
});
