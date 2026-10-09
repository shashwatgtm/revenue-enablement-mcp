// Run 22 round 4 (rev-w1): faults the fresh judges found on companies nobody had tuned on. Invented companies only (rule B81 for this public repo).
//  1  roi: a result about sign in time was told to be measured as "orders delivered first time" ("authentication time" matched the word list "on time")
//  2  map, an IT services firm: product language ("a weaker product", "supports today"), "Why do X choose A over B" split at the wrong words, an outcome question treated as a price question
//  3  map, a core banking platform: a payments frame (live volume against the current provider's price, a rate card, "we already have a payments provider")
//  4  account plan, a voice API for contact centres: software testing words for a call quality team, generic or circular objection answers, a stitched together threat on the wrong part
//  5  roi, several named products: a part is matched to a result by the part's own definition words
//  6  roi, a platform whose parts follow a colon: parts, deployment options and a claim split at a semicolon
//  7  roi, a shipping platform: results and parts that share no word are still placed (conversion with checkout, orders with shipping)
// Run: node --no-warnings --test tests/run22-rev-w1-round4.test.mjs
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
const rows = (t, heading) => { const s = t.split(new RegExp(`\\n## ${heading}[^\\n]*\\n`))[1] || ""; return s.split("\n## ")[0].split("\n").filter((l) => l.startsWith("|") && !/^\|[-| ]+\|$/.test(l)).slice(1); };
const cells = (row) => row.split("|").slice(1, -1).map((c) => c.trim());

// ---- 1 ----------------------------------------------------------------------------------------------------------------------------------------------
const IDENTITY = "Zelvane Access, cloud identity and access management sold as workforce identity suites: single sign on, adaptive multi factor sign in, a directory, lifecycle management and access governance";
test("1. a result about sign in time is not measured as orders delivered first time", async () => {
  const t = await call("roi_business_case_builder", { customer_name: "Financial Services account (Zelvane customer)", industry: "Financial_Services", your_solution: IDENTITY, solution_price: 150000, primary_value_driver: "risk_mitigation",
    known_metrics: "Larkwood Bank reports a 57% reduction in user authentication time with passwordless sign in (page claim); Hollin Group saves about 30 hours a week on access reviews with access governance (page claim)",
    current_process: "today they handle it with manual, spreadsheet based access reviews; identity silos and piecemeal integration" });
  assert.doesNotMatch(t, /delivered first time|failed delivery|orders delivered|come back, and what each/i);
  const row = rows(t, "Results you quoted").map(cells).find((c) => /authentication time/.test(c[0]));
  assert.ok(row, "the authentication result is listed");
  assert.match(row[1], /time/i);
});
test("1b. delivery wording appears only when the result itself speaks of deliveries, orders or shipments", async () => {
  for (const [metric, expectDelivery] of [["Northfield Pay reports on time payment of invoices rose to 97% (page claim)", false], ["A customer cut login time by 40% after onboarding (page claim)", false], ["Brightmile raised first attempt delivery rate from 71% to 88% (page claim)", true]]) {
    const t = await call("roi_business_case_builder", { customer_name: "Retail account (Zelvane customer)", industry: "Retail", your_solution: IDENTITY, solution_price: 90000, primary_value_driver: "cost_reduction", known_metrics: metric, current_process: "manual reviews" });
    assert.equal(/delivered first time/i.test(t), expectDelivery, metric);
  }
});

// ---- 2 ----------------------------------------------------------------------------------------------------------------------------------------------
const SERVICES = "Brexmoor, an IT services and consulting company that builds, modernizes and runs enterprise applications, data and cloud with its own accelerators: Cloudshift for cloud and data migration, Autorun for AIOps and automation";
const SERVICES_BLOCKERS = "How do enterprises reduce application management costs without sacrificing service quality?; Can enterprises modernize legacy applications incrementally without a full replacement program?; Why do enterprises choose Cloudshift over standard cloud migration tools and services?; Why do banks choose specialist banking IT partners over general IT firms?";
test("2. an IT services firm gets service wording and whole sentences in its blocker answers", async () => {
  const t = await call("mutual_action_plan_generator", { deal_name: "Insurance deal for Brexmoor", target_close_date: future(70), current_stage: "evaluation", buyer_champion: "technology leaders", technical_evaluators: "engineering teams, IT teams", known_requirements: "reclaim budget locked in maintenance, shrink technical debt", blockers: SERVICES_BLOCKERS, your_solution: SERVICES });
  assert.doesNotMatch(t, /weaker product|supports today|Set enterprises choose|Set banks choose/i);
  assert.doesNotMatch(t, /every charge on the page/i, "an outcome question is not a price question");
  const risk = (t.split("\n## Risks & Blockers")[1] || "").split("\n## ")[0];
  const rowOf = (q) => (risk.split("\n").find((l) => l.includes(q)) || "");
  assert.match(rowOf("Why do enterprises choose Cloudshift"), /Cloudshift and standard cloud migration tools and services/);
  assert.match(rowOf("Why do banks choose specialist"), /specialist banking IT partners and general IT firms/);
  assert.match(rowOf("reduce application management costs"), /service levels|service quality|run cost|where the cost/i);
  assert.match(rowOf("modernize legacy applications"), /stage|pilot|parallel|first application|workload/i);
});

// ---- 3 ----------------------------------------------------------------------------------------------------------------------------------------------
const CORE = "Tarnwick Core, a cloud native, composable core banking platform that connects core banking, lending, deposits, payments and AI in one core for banks, lenders and fintechs, with professional services for implementation";
const PAYMENTS = "Quillpay, a payment gateway for online merchants: checkout, payouts and refunds, priced per transaction";
test("3. a core banking platform is not planned like a payments provider", async () => {
  const t = await call("mutual_action_plan_generator", { deal_name: "neobanks deal for Tarnwick Core", target_close_date: future(70), current_stage: "evaluation", known_requirements: "launch new digital banking products faster, scale securely to millions of customers", your_solution: CORE });
  assert.doesNotMatch(t, /rate card|volume tiers|payments provider|live volume|price with the current|results and price with|test volume/i);
  const pay = await call("mutual_action_plan_generator", { deal_name: "retail deal for Quillpay", target_close_date: future(70), current_stage: "evaluation", known_requirements: "lower fees", your_solution: PAYMENTS });
  assert.match(pay, /rate card|volume tiers|current provider/i, "a payments seller keeps its usage wording");
});

// ---- 4 ----------------------------------------------------------------------------------------------------------------------------------------------
const VOICE = "Larkspeak Voice AI platform (speech-to-text, text-to-speech, Voice Agent API and Audio Intelligence APIs), voice AI built for real conversations: one platform for speech-to-text, text-to-speech, a unified Voice Agent API and audio intelligence, available in real time or batch, in the cloud or self-hosted";
const VOICE_PLAN = { account_name: "contact centers and CCaaS platforms account (Larkspeak customer)", industry: "contact centers and CCaaS platforms", current_arr: 60000,
  known_contacts: "developers (champion), VP of Product (buyer), CTO, frontline supervisors who coach agents, quality assurance and compliance teams",
  current_products: "Larkspeak Voice AI platform (speech-to-text, text-to-speech, Voice Agent API and Audio Intelligence APIs)",
  competitive_threats: "legacy ASR solutions; stitched-together speech-to-text, text-to-speech and LLM components; manual listening to calls", your_solution: VOICE,
  account_notes: "Objections: Does Larkspeak charge for silence or round up audio time?; What happens if I exceed my concurrency limit?; Can I deploy Larkspeak on-premise or in a private cloud?; Do you offer volume discounts for high-usage applications?; How do overages work on the Growth plan?." };
test("4a. a call quality team is not given software testing language", async () => {
  const t = await call("account_plan_builder", VOICE_PLAN);
  const row = rows(t, "Who decides and who influences").map(cells).find((c) => /quality assurance/.test(c[0]));
  assert.ok(row);
  assert.doesNotMatch(row.join(" "), /test coverage|fragile|test flow|release|tests the product/i);
  assert.match(row.join(" "), /calls?|scor|review/i);
  const dev = await call("account_plan_builder", { account_name: "software account (Larkspeak customer)", industry: "software", current_arr: 30000, known_contacts: "head of engineering (champion), quality assurance engineers", your_solution: VOICE });
  assert.match(dev, /test coverage|fragile test/i, "a software buyer's QA team keeps the testing wording");
});
test("4b. each objection is answered on its own question", async () => {
  const t = await call("account_plan_builder", VOICE_PLAN);
  const block = (n) => (t.split(new RegExp(`\\n### ${n}\\. `))[1] || "").split("\n### ")[0].split("\n## ")[0];
  assert.match(block(1), /billable|what counts|silence|rounded|increment/i);
  assert.doesNotMatch(block(1), /as a subscription/);
  assert.match(block(2), /limit/i); assert.match(block(2), /queue|reject|throttl|billed|raise/i);
  assert.match(block(3), /self-hosted|self hosted/i, "the input already says it can be self hosted");
  assert.match(block(3), /private cloud/i);
  assert.doesNotMatch(block(3), /dated plan/);
  assert.doesNotMatch(block(4), /more users/);
  assert.match(block(5), /overage/i);
  for (const n of [1, 2, 3, 4, 5]) assert.doesNotMatch(block(n), /^[^\n]*\n(?:For ")/, `answer ${n} does not start by repeating its question`);
  assert.equal(new Set([1, 2, 3, 4, 5].map((n) => block(n).split("\n")[1])).size, 5, "five different answers");
  assert.doesNotMatch(t, /\nFor "/);
});
test("4c. a stitched together threat points to the part that joins the pieces", async () => {
  const t = await call("account_plan_builder", VOICE_PLAN);
  assert.match(t, /"stitched-together[^"]*" points to (?:a unified )?Voice Agent API/i);
});

// ---- 5 ----------------------------------------------------------------------------------------------------------------------------------------------
const MODELS = "Orlane Voice AI platform (voice agents, analytics, biometrics, assist and the Orlane Prisma, Timbre and Evon models), Orlane is a frontier AI company that builds speech and language models for enterprise deployments; its model stack is Orlane Prisma (speech to text), Orlane Timbre (text to speech), Orlane Warp (speech to speech) and the language model Orlane Evon; the enterprise products built on them are voice agents, speech analytics, agent assist and voice biometrics";
test("5. a part is matched to a cost line or a result by the part's own definition words", async () => {
  const t = await call("roi_business_case_builder", { customer_name: "banking and fintech account (Orlane customer)", industry: "Financial_Services", your_solution: MODELS, solution_price: 120000, primary_value_driver: "cost_reduction",
    known_metrics: "Eastvale Bank cuts call costs with voice biometrics: 50 seconds saved per call (page claim); Marsh Lending boosts collections with voice agents: 38% more promises to pay (page claim); Holm Finance reviews every call with speech analytics instead of a sample (page claim)",
    current_process: "today they handle it with traditional IVR systems and voice bots with predefined flows; general purpose AI providers whose speech models are trained on clean studio audio; manual review of a sample of calls" });
  const cost = rows(t, "Cost lines to price").map(cells);
  const part = (re) => (cost.find((c) => re.test(c[0])) || [])[2] || "";
  assert.match(part(/clean studio audio/), /speech to text/i);
  assert.doesNotMatch(part(/clean studio audio/), /text to speech/i);
  assert.match(part(/manual review/i), /speech analytics|agent assist/i);
  assert.match(part(/traditional IVR/i), /voice agents/i);
  const res = rows(t, "Results you quoted").map(cells);
  const rpart = (re) => (res.find((c) => re.test(c[0])) || [])[2] || "";
  assert.match(rpart(/voice biometrics/), /biometrics/i);
  assert.match(rpart(/collections with voice agents/), /voice agents/i);
  assert.match(rpart(/speech analytics/), /speech analytics/i);
  assert.doesNotMatch(t, /placed in the case[\s\S]{0,200}speech to text/i);
});

// ---- 6 ----------------------------------------------------------------------------------------------------------------------------------------------
const DEVOPS = "Forgeline, the orchestration platform for DevSecOps: planning, source code management, built in CI/CD, container and package registry, application security testing, compliance and DORA metrics, run as Forgeline.com SaaS, Self Managed or Dedicated single tenant SaaS";
test("6. a platform whose parts follow a colon: parts, deployment options and a split claim", async () => {
  const t = await call("roi_business_case_builder", { customer_name: "Financial services account (Forgeline customer)", industry: "Financial_Services", company_size: "enterprise", your_solution: DEVOPS, solution_price: 150000, primary_value_driver: "revenue_increase",
    known_metrics: "Aldwick Systems: faster deployment capabilities contribute to business growth; 50% faster deployments and 10x increase in testing scenarios (page claim); Hilmar: 400% increase in code checks, 12x faster deployment time (page claim)",
    current_process: "today they handle it with collections of separate point tools for planning, source control, CI/CD, artifact storage and delivery; separate security and compliance scanners; tools with limited deployment options such as cloud only" });
  const cost = rows(t, "Cost lines to price").map(cells);
  assert.equal(cost[0].length, 3, "a part column exists");
  assert.match((cost.find((c) => /security and compliance scanners/.test(c[0])) || [])[2] || "", /application security testing|compliance/i);
  assert.match((cost.find((c) => /deployment options/.test(c[0])) || [])[2] || "", /Self Managed|Dedicated|deployment options/i);
  const res = rows(t, "Results you quoted").map(cells);
  assert.equal(res.filter((c) => /Aldwick/.test(c[0])).length, 1);
  assert.ok(res.some((c) => /Aldwick/.test(c[0]) && /50% faster deployments/.test(c[0])), "the figures stay with the company they belong to");
});

// ---- 7 ----------------------------------------------------------------------------------------------------------------------------------------------
const SHIPPING = "Parcelbird, ecommerce platform that helps sellers manage shipping, logistics and fulfilment from a single dashboard: domestic and cross-border shipping, fulfilment and warehousing, one-click checkout, WhatsApp marketing and financial services";
test("7. a result and a part that share no word are still placed when the meaning is the same", async () => {
  const t = await call("roi_business_case_builder", { customer_name: "online retailers account (Parcelbird customer)", industry: "Retail", your_solution: SHIPPING, solution_price: 18000, primary_value_driver: "cost_reduction",
    known_metrics: "Dunmere Foods: 46% improvement in session-based conversions and 8% increase in average order value (case study headline); Ashby Tea: ships lakhs of orders across the country and now serves 5,00,000+ customers (customer words)",
    current_process: "today they handle it with dealing with courier partners one by one, with confusing rates and limited serviceability" });
  const res = rows(t, "Results you quoted").map(cells);
  assert.match((res.find((c) => /conversions/.test(c[0])) || [])[2] || "", /checkout/i);
  assert.match((res.find((c) => /ships lakhs/.test(c[0])) || [])[2] || "", /shipping/i);
  assert.doesNotMatch(t, /none matches by its words/);
});
