// Run 22 round 4 (writer rev-w3), test first. Fresh judges scored these at 3 on companies nobody had tuned on:
//  * competitive_trap_setter: criteria that are the seller's own claims (its name, "the site says"), landmine and reference questions that quote the weak point,
//    a business model assumed (per FTE, per ticket) for a freight platform, banks treated as "tools of that kind" with a demo, "own terms" made of marketing strengths,
//    a reviewers' remark turned into a fact in a question, a scenario that does not say what it tests, figures in the description never flagged for a source.
//  * email_sequence_generator: source code words for a scanner of binaries, a dangling "they", a pain pasted as one long line with two colons, subjects about payouts
//    while email 1 is about cart abandonment, a payroll quote used as proof for a different pain, a bare label for the product, four statistics stacked.
//  * win_loss_analyzer: a network operator frame for a developer API deal, lists split at commas, an alternative lost, "Which of ... or ..." read as nonsense,
//    a missing comparison section when no alternative is named, a name said twice in the solution row.
// Invented companies only. Run: node --no-warnings --test tests/run22-rev-w3-round4.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => { const j = await (await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }))).json(); return j.result.content.map((c) => c.text).join("\n"); };
const trap = (a) => call("competitive_trap_setter", a);
const mail = (a) => call("email_sequence_generator", a);
const wl = (a) => call("win_loss_analyzer", a);
const emails = (t) => t.split(/\n(?=### Email \d)/).slice(1).map((e) => e.split(/\n---\n|\n## /)[0]);
const bodyOf = (e) => (e.split("**Body:**")[1] || "").trim();
const subjects = (t) => emails(t).map((e) => ((e.match(/\*\*Subject:\*\* (.*)/) || [])[1] || "").trim());
const sec = (t, a, b) => (t.split(a)[1] || "").split(b)[0];
const questions = (t) => [...t.matchAll(/\*\*Landmine Question:\*\* "([^"]+)"/g)].map((m) => m[1]);

// ---------------- competitive_trap_setter ----------------
const FREIGHT = {
  competitor: "previous freight forwarders working through spreadsheets and long email threads",
  competitor_weaknesses: "previous forwarders gave no way to see problems coming, leaving a two-person operations team drowning in manual admin and holding extra safety stock",
  your_solution: "Cargolark AI-powered digital freight forwarding platform, the AI Freight Forwarder: Cargolark moves freight by ocean, air, road and rail with customs and consolidation, and runs it on a platform for purchase order management, shipment visibility and provider-agnostic freight management",
  your_strengths: "real freight run by Cargolark, not outsourced: it owns the operational process, the data inputs and the quality, combining execution, workflows, structured shipment data and local relationships and industry expertise that the site says no generic platform can replicate",
  evaluation_stage: "mid", buyer_priorities: "complete visibility from purchase order to final delivery with predictive ETAs, fewer exceptions through automation, and lower costs", buyer_persona: "Head of Logistics and Fulfilment", trap_type: "all",
};
test("a freight platform: criteria are buyer criteria, the weak point is not quoted, no model is assumed", async () => {
  const t = await trap(FREIGHT);
  const crit = sec(t, "### Criteria to Establish Early", "### How to Suggest Criteria").split("### Claims to source")[0];
  assert.doesNotMatch(crit, /Cargolark|the site says|not outsourced:/i, "the seller's own claim is the criterion");
  assert.match(crit, /owns the operational process, the data inputs and the quality/i);
  assert.match(crit, /Criterion 2/);
  assert.match(t, /Claims to source[\s\S]*(?:generic platform|replicate)/i, "the claim that nobody else can do it is sourced");
  assert.doesNotMatch(t, /“[^”]*(?:gave no way to see problems coming|drowning in manual admin)[^”]*”/, "the note is quoted");
  const qs = questions(t);
  assert.ok(qs.length >= 2, `only ${qs.length} landmine questions`);
  for (const q of qs) assert.doesNotMatch(q, /gave no way to see problems coming/i, q);
  assert.match(qs.join(" "), /problems coming|how early|warn/i);
  assert.match(qs.join(" "), /manual admin|hours|safety stock/i);
  assert.doesNotMatch(t, /per FTE|people-delivered|per ticket/i, "a model the inputs do not give");
  assert.match(t, /Business model: not stated/);
});

const BANKS = {
  competitor: "conventional corporate banks with slow, paperwork heavy corporate cards and accounts",
  competitor_weaknesses: "other corporate banking partners take days, if not weeks, even with a good relationship manager and a tree load of paperwork (customer quote on the page)",
  your_solution: "Payfern, payments and banking platform: accept online and in-store payments (100+ payment methods), make payouts, business banking through partner banks, payroll, credit and loans",
  your_strengths: "clean, developer-friendly APIs and hassle-free integration; payments, banking, payroll and credit on one finance platform",
  evaluation_stage: "mid", buyer_priorities: "a fast, affordable and secure way to accept and disburse payments online and own a current account", buyer_persona: "Founder", trap_type: "all",
};
test("banks are providers the buyer uses today: no tool wording, no demo, questions read clean, own terms hold only terms", async () => {
  const t = await trap(BANKS);
  assert.doesNotMatch(t, /tools? of that kind|first demo|a tool of that kind/i);
  assert.match(t, /provider/i);
  assert.doesNotMatch(t, /How long do other corporate banking partners take in/i);
  const qs = questions(t).join(" ");
  assert.match(qs, /how long|paperwork|turnaround|weeks/i);
  assert.match(qs, /paperwork/i);
  const terms = sec(t, "### Your Own Terms", "---");
  assert.doesNotMatch(terms, /hassle-free|credit on one finance platform|developer-friendly/i);
  assert.match(terms, /No terms of your own/);
});

const DEVICES = {
  competitor: "buying and maintaining physical devices",
  competitor_weaknesses: "costly physical devices; Chrome dev tools were not very accurate or reliable for real device testing (reviewers' words on the page)",
  your_solution: "Devbench, cloud platform for testing websites and mobile apps on real browsers and real devices (35,000+), with test automation, visual testing and test management",
  your_strengths: "AI agents at every step in an open and flexible test platform, on real devices with minimal latency",
  evaluation_stage: "mid", buyer_priorities: "build and release bug-free software faster and at scale (page words)", buyer_persona: "Head of Testing", trap_type: "all",
};
test("a reviewers' remark is not put to the buyer as a fact; figures in the description are flagged for a source; criteria are testable", async () => {
  const t = await trap(DEVICES);
  assert.doesNotMatch(t, /when chrome dev tools are not very accurate/i);
  assert.match(questions(t).join(" "), /how accurate and reliable/i);
  assert.match(t, /reviewers' words on the page/, "the label of the note is kept");
  assert.match(sec(t, "### Claims to source", "###"), /35,000\+/);
  const crit = sec(t, "### Criteria to Establish Early", "### How to Suggest Criteria");
  assert.match(crit, /Criterion 2/);
  assert.match(crit, /real devices/i);
  for (const l of (t.split("### Evaluation Scenarios")[1] || "").split("\n").filter((x) => /^\*\*Scenario/.test(x))) assert.doesNotMatch(l, /tests chrome dev tools were/i, l);
});

// ---------------- email_sequence_generator ----------------
const BINARY = {
  sequence_type: "cold_outreach", target_persona: "security team leader or manager", target_industry: "banking, financial services and insurance",
  your_solution: "Binscan mobile application security platform (vulnerability assessment, penetration testing and store monitoring), an enterprise mobile application security testing platform that scans compiled APK and IPA binaries rather than source code, delivering automated DAST on real physical devices, binary SAST, API testing and per-build compliance evidence",
  key_value_prop: "unified, automated vulnerability testing that accelerates secure development, from first scan to store submission without switching tools (page claims)",
  specific_pain_point: "outdated security tools leave mobile apps exposed: source code scanners miss issues in binaries and third party components, separate SAST, DAST and API tools slow workflows and cause errors, simulated environments do not reflect real device behavior, and excessive false positives waste security teams' time; fake apps and unauthorized versions in app stores go unnoticed",
  social_proof: "Binscan helped a global airline save $50K a year (page claim); A senior security researcher at an airline says assessing the whole mobile app ecosystem takes as little as 45 minutes (page quote)",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Binscan sales team",
};
test("a binary scanner: no source code questions, no dangling 'they', the pain is clauses not one long line, every clause is used", async () => {
  const t = await mail(BINARY);
  const d = t.split(/\n## Before you send/)[0];
  assert.doesNotMatch(d, /\blanguages?\b|\brepositor(?:y|ies)\b/i, "source code words for a binary scanner");
  assert.doesNotMatch(d, /How are they tested|\bthey tested\b/i);
  const e1 = bodyOf(emails(t)[0]);
  const problemLine = e1.split("\n").find((l) => /outdated security tools leave mobile apps exposed/i.test(l)) || "";
  assert.ok(problemLine && (problemLine.match(/:/g) || []).length <= 1, `the problem line holds ${(problemLine.match(/:/g) || []).length} colons: ${problemLine}`);
  assert.ok(problemLine.length < 200, `the problem line is ${problemLine.length} characters`);
  for (const re of [/source code scanners miss issues in binaries/i, /simulated environments do not reflect real device behavior/i, /excessive false positives/i, /fake apps and unauthorized versions/i]) assert.match(d, re);
  assert.match(subjects(t).join(" "), /mobile app/i);
});

const D2C = {
  sequence_type: "cold_outreach", target_persona: "Founder", target_industry: "E-commerce and D2C",
  your_solution: "Payfern, payments and banking platform: accept online and in-store payments (100+ payment methods), make payouts, business banking through partner banks, payroll, credit and loans",
  key_value_prop: "a fast, affordable and secure way to accept and disburse payments online and own a current account",
  specific_pain_point: "high cart abandonment and return to origin (RTO) rates for ecommerce and D2C brands; hard vendor payouts, payment splitting and manual reconciliation",
  social_proof: "Knitwell increases order conversion rate by 100% with Payfern Magic Checkout (case study headline); Goodmart increases revenue by 22% with Payfern Payment Links (case study headline); Quillbook: set up payroll in a few hours, saved 500+ hours and achieved 40% cost reduction (customer quote)",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Payfern sales team",
};
test("a D2C founder: subjects follow email 1, payroll proof is not used for a checkout pain, headlines are one sentence", async () => {
  const t = await mail(D2C);
  const es = emails(t);
  assert.match(subjects(t)[0], /cart abandonment/i);
  assert.doesNotMatch(subjects(t).slice(0, 3).join(" "), /payouts/i);
  assert.doesNotMatch(bodyOf(es[1]) + bodyOf(es[2]), /payroll/i, "payroll proof in the middle emails");
  assert.match(t, /payroll/, "the payroll quote is still used or listed");
  const both = es.map(bodyOf).find((b) => /Knitwell/.test(b) && /Goodmart/.test(b)) || "";
  assert.match(both, /case studies carry the titles/i);
});

const API = {
  sequence_type: "cold_outreach", target_persona: "developers who integrate the SMS API into existing applications", target_industry: "banking",
  your_solution: "Textloop, a single API led intelligent platform of platforms that unifies digital interactions across SMS, RCS, voice and email, with Textloop Shield anti phishing and Textloop Consent management",
  key_value_prop: "unify digital interactions through one API and deliver messages reliably with real time reporting (page claims)",
  specific_pain_point: "phishing and scam messages travel over SMS under the names of legitimate brands, victims rarely report them",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Textloop sales team",
};
test("a messaging API for developers: the product is described by what it does, not by a bare label", async () => {
  const e1 = bodyOf(emails(await mail(API))[0]);
  assert.match(e1, /It unifies digital interactions across SMS, RCS, voice and email/);
});

const KNOW = {
  sequence_type: "cold_outreach", target_persona: "CIO", target_industry: "financial services",
  your_solution: "Findwell, an enterprise search and assistant platform: search, assistant and agents",
  key_value_prop: "better answers built on what the business knows",
  specific_pain_point: "company knowledge spreads across tools, teams and documents, so people cannot find what they need to do their jobs",
  social_proof: "Northbank: 80% adoption across 7,000 employees (page claim); Eastcorp: 1.5+ hours of search time saved per employee weekly (page claim); Westfirm scales across 14,000 employees (page claim); Southco created 3,400+ agents (page claim); Named a Market Shaper in an analyst quadrant",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Findwell sales team",
};
test("a knowledge platform for a CIO: no 'that task' question, the last email does not stack statistics", async () => {
  const t = await mail(KNOW);
  assert.doesNotMatch(t.split("## Before you send")[0], /that task|that process/i);
  const e5 = bodyOf(emails(t)[4]);
  assert.ok((e5.match(/own site/gi) || []).length <= 2, "four site claims in the last email");
  assert.match(e5, /financial services/i);
});

// ---------------- win_loss_analyzer ----------------
const API_DEAL = {
  analysis_type: "competitor_analysis", deal_value: 36000, sales_cycle_days: 30,
  your_solution: "Payloop communications platform (voice and SMS APIs, SIP trunking, phone numbers and voice AI agents on a carrier network), a cloud communications platform with an API suite for messaging and voice",
  deal_details: "Payloop communications platform deals with eCommerce; roles involved: developers; the alternatives buyers use are described as messaging providers that route messages through third party bottlenecks. The deal value and cycle figures are hypothetical.",
  stakeholders_involved: "developers",
};
test("a developer led API deal: no network operator frame, and the difference to the alternative is asked about", async () => {
  const t = await wl(API_DEAL);
  assert.doesNotMatch(t, /per site|per link|term contract|repair time|wave plan|\bRFP\b|a few sites/i);
  assert.doesNotMatch(t, /Business model: connectivity \(per site/);
  const q = t.split("## Questions for the review call")[1] || "";
  assert.match(q, /route messages through third party bottlenecks/i);
  assert.match(q, /developers/i);
});

const TOOLS_DEAL = {
  analysis_type: "competitor_analysis", deal_value: 30000, sales_cycle_days: 60,
  your_solution: "Apiforge, an API platform for building and using APIs that simplifies each step of the API lifecycle",
  deal_details: "Apiforge deals with Financial services; roles involved: platform leader, Platform Engineer, QA Engineer; the alternatives buyers use are described as disconnected tools for design, build, test and release, each with its own source of truth; a team chat thread and wiki links for API discovery; separate frameworks for unit, contract, load and monitoring tests. The deal value and cycle figures are hypothetical.",
  stakeholders_involved: "platform leader, Platform Engineer, QA Engineer",
};
test("alternatives are never split at the commas of their own lists, none is lost, and question 1 reads", async () => {
  const t = await wl(TOOLS_DEAL);
  for (const re of [/disconnected tools for design, build, test and release/, /a team chat thread and wiki links for API discovery/, /separate frameworks for unit, contract, load and monitoring tests/]) assert.match(t, re);
  assert.doesNotMatch(t, /\*\*disconnected tools for design\*\*|\*\*separate frameworks for unit\*\*/);
  const q = (t.split("## Questions for the review call")[1] || "").split("\n").find((l) => /^1\./.test(l)) || "";
  assert.doesNotMatch(q, /for design or separate/);
  assert.match(q, /3 alternatives|alternatives above/);
});

const NOALT = {
  analysis_type: "competitor_analysis", deal_value: 250000, sales_cycle_days: 180,
  your_solution: "Gridweave Network Fabric, Network Fabric connects plants' network, cloud and IoT infrastructure: global VPN, SD-WAN, SASE, multi cloud networking and IoT connectivity",
  deal_details: "Gridweave Network Fabric deals with Manufacturing; roles involved: Head of IT Infrastructure, Director of Operations. The deal value and cycle figures are hypothetical.",
  stakeholders_involved: "Head of IT Infrastructure, Director of Operations",
};
test("no alternative named: the comparison section says so, the name is not said twice, the multi site buyer is asked", async () => {
  const t = await wl(NOALT);
  assert.match(t, /\*\*What the buyer weighed\.\*\* No alternative was named/);
  const row = (t.match(/\| \*\*Solution\*\* \| ([^|]*)\|/) || [])[1] || "";
  assert.ok((row.match(/Network Fabric/g) || []).length <= 1, `solution row: ${row}`);
  assert.match(t.split("## Questions for the review call")[1] || "", /whole buyer|all (?:of its )?sites|site by site|plant/i);
  assert.match(t.split("## Questions for the review call")[1] || "", /What else was the buyer weighing/i);
});
