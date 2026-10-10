// Run 22 round 5 (writer rev-w3), test first. Fresh judges scored these at 3 on companies nobody had tuned on:
//  * email_sequence_generator: a long marketing sentence pasted into email 1 with its figures left inside it, proof from another sector given to a bank with no bridge,
//    a middle email that reads like a template ("The second part of the problem"), email 1 pitching parts that answer a different problem than the one it opens with,
//    a developer measure offered to a founder, a problem that nothing the user gave speaks to (never said), a CIO who is not given the strongest figure first,
//    a product told only by the parts it "covers".
//  * win_loss_analyzer: a CIO and a head of IT infrastructure suggested for a developer led deal, a garbled question about countries (the seller's coverage, not the buyer's sites),
//    a chat thread and a wiki called a competing vendor, nothing for a financial services buyer, release and build measures for an API platform.
// Invented companies only. Run: node --no-warnings --test tests/run22-rev-w3-round5.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => { const j = await (await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }))).json(); return j.result.content.map((c) => c.text).join("\n"); };
const mail = (a) => call("email_sequence_generator", a);
const wl = (a) => call("win_loss_analyzer", a);
const emails = (t) => t.split(/\n(?=### Email \d)/).slice(1).map((e) => e.split(/\n---\n|\n## /)[0]);
const bodyOf = (e) => (e.split("**Body:**")[1] || "").trim();
const draft = (t) => t.split(/\n## Before you send/)[0];

// ---------------- email_sequence_generator ----------------
const BINARY = {
  sequence_type: "cold_outreach", target_persona: "security team leader or manager", target_industry: "banking, financial services and insurance",
  your_solution: "Binscan mobile application security platform (vulnerability assessment, penetration testing and store monitoring), an enterprise mobile application security testing platform that scans compiled APK and IPA binaries rather than source code, delivering automated DAST on real physical devices, binary SAST, API testing and per-build compliance evidence",
  key_value_prop: "unified, automated vulnerability testing that accelerates secure development, with a complete and actionable vulnerability assessment from first scan to store submission without switching tools: 40% faster security testing, 30% lower operational overhead and under 1% false results (page claims)",
  specific_pain_point: "outdated security tools leave mobile apps exposed: source code scanners miss issues in binaries and third party components, separate SAST, DAST and API tools slow workflows and cause errors, simulated environments do not reflect real device behavior, and excessive false positives waste security teams' time; fake apps and unauthorized versions in app stores go unnoticed",
  social_proof: "Binscan helped a global airline save $50K a year (page claim); A senior security researcher at an airline says assessing the whole mobile app ecosystem takes as little as 45 minutes (page quote); A leading global airline reports support requests resolved in less than 8 hours (page quote)",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Binscan sales team",
};
test("a binary scanner for banks: the aim is short, its figures are proof, other sector proof gets a bridge once, no template middle email, the industry is in email 1", async () => {
  const t = await mail(BINARY);
  const es = emails(t).map(bodyOf);
  assert.doesNotMatch(es[0], /with a complete and actionable/i, "the long marketing sentence is pasted");
  assert.match(es[0], /unified, automated vulnerability testing that accelerates secure development/);
  assert.match(es.join("\n"), /40% faster security testing/, "the figures that came with the aim are lost");
  const bridges = (draft(t).match(/not from banking, financial services and insurance/gi) || []).length;
  assert.equal(bridges, 1, `the bridge for proof from another sector appears ${bridges} times`);
  assert.doesNotMatch(draft(t), /The second part of the problem/);
  assert.match(es[0], /teams in banking, financial services and insurance/i);
});

const D2C = {
  sequence_type: "cold_outreach", target_persona: "Founder", target_industry: "E-commerce and D2C",
  your_solution: "Payfern, payments and banking platform: accept online and in-store payments (100+ payment methods), make payouts, business banking through partner banks, payroll, credit and loans, and international payments",
  key_value_prop: "a fast, affordable and secure way to accept and disburse payments online and own a current account",
  specific_pain_point: "high cart abandonment and return to origin (RTO) rates for ecommerce and D2C brands; hard vendor payouts, payment splitting and manual reconciliation",
  social_proof: "Knitwell increases order conversion rate by 100% with Payfern Magic Checkout (case study headline); Goodmart increases revenue by 22% with Payfern Payment Links (case study headline)",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Payfern sales team",
};
test("a D2C founder: email 1 pitches the part for the problem it opens with, no developer measure, a problem nothing speaks to is said", async () => {
  const t = await mail(D2C);
  const es = emails(t).map(bodyOf);
  assert.doesNotMatch(es[0], /international payments|payouts/i, "email 1 pitches parts for another problem");
  assert.match(es[0], /accept online and in-store payments/i);
  assert.doesNotMatch(draft(t), /time to first live payment|time to go live|webhook|sandbox/i, "a developer measure for a founder");
  assert.match(t, /Nothing you gave speaks to[^\n]*return to origin/i);
});

const KNOW = {
  sequence_type: "cold_outreach", target_persona: "CIO", target_industry: "financial services",
  your_solution: "Findwell, an enterprise search and assistant platform that connects to company tools and data: Findwell Search, Findwell Assistant (an AI coworker) and Findwell Agents, on top of Enterprise Context, 275+ app connectors, open APIs, Findwell Protect for safe AI use",
  key_value_prop: "better answers built on what the business knows, so company knowledge turns into action; 110 hours saved per user per year (page claim)",
  specific_pain_point: "company knowledge spreads across tools, teams, documents and conversations, so people cannot find what they need to do their jobs",
  social_proof: "Northbank: 80% adoption across 7,000 employees (page claim); Eastcorp: 1.5+ hours of search time saved per employee weekly (page claim); A Total Economic Impact study commissioned by an analyst firm: 141% ROI in 3 years (page claim)",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Findwell sales team",
};
test("a knowledge platform for a CIO: the strongest figure is in email 1, the hours figure is used, the product is told by what it does, a risk part is named for financial services", async () => {
  const t = await mail(KNOW);
  const es = emails(t).map(bodyOf);
  assert.match(es[0], /141% ROI/, "the strongest figure is not in email 1");
  assert.match(es.join("\n"), /110 hours saved per user per year/, "the hours figure is left out");
  assert.match(es[0], /It connects to company tools and data\./);
  assert.doesNotMatch(draft(t), /It covers (?:on top of )?Enterprise Context\.$/m);
  assert.match(es.join("\n"), /financial services[^\n]*Findwell Protect|Findwell Protect[^\n]*financial services/i);
});

// ---------------- win_loss_analyzer ----------------
const API_DEAL = {
  analysis_type: "competitor_analysis", deal_value: 36000, sales_cycle_days: 30,
  your_solution: "Payloop communications platform (voice and SMS APIs, SIP trunking, phone numbers and voice AI agents on a carrier network), a cloud communications platform in three layers: a carrier network connecting 190+ countries, an API suite for messaging and voice, and an AI agent platform for building voice agents",
  deal_details: "Payloop communications platform deals with eCommerce; roles involved: developers; the alternatives buyers use are described as messaging providers that route messages through third party bottlenecks. The deal value and cycle figures are hypothetical.",
  stakeholders_involved: "developers",
};
test("a developer led deal: engineering roles, not a CIO; no country by country question; the first test is asked about", async () => {
  const t = await wl(API_DEAL);
  assert.doesNotMatch(t, /chief information officer|\bCIO\b|head of IT infrastructure/i);
  assert.match(t, /developer led deal usually also involves an engineering lead/i);
  assert.doesNotMatch(t, /country by country|countr(?:y|ies) by/i);
  const q = t.split("## Questions for the review call")[1] || "";
  assert.match(q, /developers[^\n]*(?:test|try)[^\n]*first|first[^\n]*developers/i);
});

const TOOLS_DEAL = {
  analysis_type: "competitor_analysis", deal_value: 30000, sales_cycle_days: 60,
  your_solution: "Apiforge, an API platform for building and using APIs that simplifies each step of the API lifecycle and streamlines collaboration",
  deal_details: "Apiforge deals with Financial services; roles involved: platform leader, Platform Engineer, QA Engineer; the alternatives buyers use are described as disconnected tools for design, build, test and release, each with its own source of truth; a Chatwell thread and Pagebook links for API discovery; separate frameworks for unit, contract, load and monitoring tests. The deal value and cycle figures are hypothetical.",
  stakeholders_involved: "platform leader, Platform Engineer, QA Engineer",
};
test("a chat thread and a wiki are not a vendor; a financial services buyer is asked about its review; measures fit an API platform", async () => {
  const t = await wl(TOOLS_DEAL);
  assert.doesNotMatch(t, /Chatwell thread[^\n]*is a competing vendor/i);
  assert.match(t, /Chatwell thread/);
  const q = t.split("## Questions for the review call")[1] || "";
  assert.match(q, /financial services[^\n]*(?:security|compliance|data handling)[^\n]*review|review[^\n]*financial services/i);
  const metricQ = q.split("\n").find((l) => /judge the result on/.test(l)) || "";
  assert.doesNotMatch(metricQ, /release frequency|build time/i, metricQ);
});
