// Run 22 round 5, second part (writer rev-w3), test first. Fresh judges scored these at 3:
//  * email_sequence_generator: the one proof from the reader's own sector (a financial case study) came last and only as a title; copy built from one pattern; the part named against
//    a later problem was the part for the first one; "nothing speaks to" a problem that a headline (a checkout product) does speak to.
//  * win_loss_analyzer: a developer led messaging and voice API read through the general telecom notes (no delivery, registration, routing or throughput), and no question that asks
//    for the reason in the buyer's own words.
// Invented companies only. Run: node --no-warnings --test tests/run22-rev-w3-round5b.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => { const j = await (await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }))).json(); return j.result.content.map((c) => c.text).join("\n"); };
const mail = (a) => call("email_sequence_generator", a);
const wl = (a) => call("win_loss_analyzer", a);
const emails = (t) => t.split(/\n(?=### Email \d)/).slice(1).map((e) => e.split(/\n---\n|\n## /)[0]);
const bodyOf = (e) => (e.split("**Body:**")[1] || "").trim();

const BINARY = {
  sequence_type: "cold_outreach", target_persona: "security team leader or manager", target_industry: "banking, financial services and insurance",
  your_solution: "Binscan mobile application security platform (vulnerability assessment, penetration testing and store monitoring), an enterprise mobile application security testing platform that scans compiled APK and IPA binaries rather than source code",
  key_value_prop: "unified, automated vulnerability testing that accelerates secure development, from first scan to store submission without switching tools: 40% faster security testing, 30% lower operational overhead and under 1% false results (page claims)",
  specific_pain_point: "outdated security tools leave mobile apps exposed: source code scanners miss issues in binaries and third party components, separate SAST, DAST and API tools slow workflows and cause errors; fake apps and unauthorized versions in app stores go unnoticed",
  social_proof: "Binscan helped a global airline save $50K a year (page claim); Over 650 vulnerabilities were identified within 90 minutes in each app for a financial governing body (case study teaser); A senior security researcher at an airline says assessing the whole mobile app ecosystem takes as little as 45 minutes (page quote)",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Binscan sales team",
};
test("proof from the reader's own sector comes before proof from another sector, in the body of an early email", async () => {
  const t = await mail(BINARY);
  const es = emails(t).map(bodyOf);
  const at = es.findIndex((b) => /financial governing body/.test(b));
  assert.ok(at >= 1 && at <= 2, `the financial case study is in email ${at + 1}`);
  const air = es.findIndex((b) => /airline/.test(b));
  assert.ok(at <= air || air === -1, "airline proof came before the financial case study");
});

const D2C = {
  sequence_type: "cold_outreach", target_persona: "Founder", target_industry: "E-commerce and D2C",
  your_solution: "Payfern, payments and banking platform: accept online and in-store payments (100+ payment methods), make payouts, business banking through partner banks, payroll, credit and loans, and international payments",
  key_value_prop: "a fast, affordable and secure way to accept and disburse payments online and own a current account",
  specific_pain_point: "high cart abandonment and return to origin (RTO) rates for ecommerce and D2C brands; hard vendor payouts, payment splitting and manual reconciliation",
  social_proof: "Knitwell increases order conversion rate by 100% with Payfern Magic Checkout (case study headline); Goodmart increases revenue by 22% with Payfern Payment Links (case study headline)",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Payfern sales team",
};
test("the part named against a later problem is matched by that problem's own words; a checkout headline speaks to cart abandonment", async () => {
  const t = await mail(D2C);
  const es = emails(t).map(bodyOf);
  const third = es[2];
  assert.match(third, /hard vendor payouts/i);
  assert.match(third, /make payouts/i, "the payouts part is not named against the payouts problem");
  assert.doesNotMatch(third, /in-store/i, "the in-store part is named against the payouts problem");
  assert.doesNotMatch(t, /Nothing you gave speaks to[^\n]*cart abandonment/i, "a checkout headline does speak to cart abandonment");
});

const API_DEAL = {
  analysis_type: "competitor_analysis", deal_value: 36000, sales_cycle_days: 30,
  your_solution: "Payloop communications platform (voice and SMS APIs, SIP trunking, phone numbers and voice AI agents on a carrier network), a cloud communications platform with an API suite for messaging and voice",
  deal_details: "Payloop communications platform deals with eCommerce; roles involved: developers; the alternatives buyers use are described as messaging providers that route messages through third party bottlenecks. The deal value and cycle figures are hypothetical.",
  stakeholders_involved: "developers",
};
test("a developer led messaging and voice API: the messaging kind's own notes and words are used, and the reason is asked for in the buyer's words", async () => {
  const t = await wl(API_DEAL);
  assert.match(t, /Sector notes: telecom, CPaaS and messaging/);
  assert.match(t, /Price per message compared with other providers/);
  const q = t.split("## Questions for the review call")[1] || "";
  assert.match(q, /sender registration|message routing|throughput|delivery rate/i, "no question in the sector's own words");
  assert.match(q, /In the buyer's own words, why did/i);
  assert.doesNotMatch(t, /Integration with the systems we already run/, "the general telecom objections");
});
