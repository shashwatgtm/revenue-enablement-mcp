// Run 22 round 3 (writer rev-w3), test first. Fresh judges scored these at 3 and named the faults:
//  - email_sequence_generator: a cut phrase ("one setup for local", "single API led intelligent") used as the topic of subjects and body lines;
//    generic project questions for a payments reader; a sales leader's questions for a sales user; a fragment as the opening line; a
//    developer persona answered like an engineering leader.
//  - competitive_trap_setter: stated priorities (in words, with a figure after a colon) treated as "figures only" so the aim was dropped; only one
//    landmine built from a note that holds several weak points; role questions from a different SaaS motion; the seller's own partner status
//    set as a buyer criterion and requirement; a garbled evaluation scenario.
// Invented companies only. Run: node --no-warnings --test tests/run22-rev-w3-round3.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => (await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }) }))).json();
const call = async (name, args) => { const j = await rpc("tools/call", { name, arguments: args }); return j.result.content.map((c) => c.text).join("\n"); };
const emails = (t) => t.split(/\n(?=### Email \d)/).slice(1).map((e) => e.split(/\n---\n|\n## /)[0]);
const subjects = (t) => emails(t).map((e) => ((e.match(/\*\*Subject:\*\* (.*)/) || [])[1] || "").trim());
const bodyOf = (e) => (e.split("**Body:**")[1] || "").trim();
const draft = (t) => t.split(/\n## (?:Before you send|To sharpen this)/)[0];

// ---- email: a cut phrase is never the topic ----
const GATE = {
  sequence_type: "cold_outreach", target_persona: "enterprise payment operations teams, and tech-savvy founders at startups", target_industry: "startups",
  your_solution: "Payrail, an online payment gateway for businesses in the Gulf: one setup for local, regional and global payment methods with hosted checkout, a unified API, card and checkout SDKs, tokenization, 3D Secure, authorize then capture, refunds and payouts to local bank accounts, run from the Railboard dashboard",
  key_value_prop: "one secure integration for local payment methods, regional expansion and direct payouts to local bank accounts, high acceptance rates, faster setup and activation, and settlements paid into a local bank account",
  specific_pain_point: "selling across the Gulf needs 20+ payment methods, local approvals, authentication and payouts to local banks, and building every local payment connection from scratch is slow; redirects to a separate authentication page cause checkout drop off",
  social_proof: "Payrail and a card network launched a passkey checkout for eCommerce (page claim)", call_to_action: "20-minute call", tone: "consultative", sender_context: "Payrail sales team",
};
const API = {
  sequence_type: "cold_outreach", target_persona: "developers who integrate the SMS API into existing applications", target_industry: "banking",
  your_solution: "Textloop, a single API led intelligent platform of platforms that unifies SMS, RCS, voice and email, with Textloop Shield anti phishing and Textloop Consent management",
  key_value_prop: "unify digital interactions through one API, deliver messages reliably with real time reporting, and protect users from phishing in real time (page claims)",
  specific_pain_point: "phishing and scam messages travel over SMS under the names of legitimate brands, victims rarely report them, and existing rule based solutions are slow to adapt; enterprises also have to manage many separate channels and partners",
  social_proof: "Named a Visionary in the 2025 Analyst Grid for messaging platforms, third year in a row; Shield showed 99%+ efficacy over a 3 month regulatory sandbox on live SMS traffic (page claim)", call_to_action: "20-minute call", tone: "consultative", sender_context: "Textloop sales team",
};
const CRM = {
  sequence_type: "cold_outreach", target_persona: "Sales user", target_industry: "Education",
  your_solution: "Leadnest, CRM for sales, marketing and service teams: lead and opportunity management, lead scoring and prioritization, workflow automation, a mobile app for field sales, and a customer support suite",
  key_value_prop: "a 360 view of customers, fewer third-party dependencies and lower costs, with more efficient ticket resolution and higher customer satisfaction (CSAT)",
  specific_pain_point: "no single 360 view of customers across marketing, sales and service, and dependence on third-party tools (implied by the page's promise of a 360 view and fewer third-party dependencies)",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Leadnest sales team",
};

test("a payments seller: no cut phrase as a topic, no generic project question, no 'startups in startups'", async () => {
  const t = await call("email_sequence_generator", GATE);
  const d = draft(t);
  assert.doesNotMatch(d, /one setup for local(?! payment| and|,)/i, "the cut phrase is used as a topic");
  for (const s of subjects(t)) assert.doesNotMatch(s, /\b(?:for local|setup for)\s*(?:in|\?|$)/i, `subject: ${s}`);
  assert.doesNotMatch(d, /plans change after work has started|which part of the day goes wrong/i, "an operations project question for a payments reader");
  assert.doesNotMatch(t, /startups in startups|at startups in startups/i);
  assert.match(t.split("\n").find((l) => l.startsWith("## Target:")), /startups/);
  // email 2 holds more than one question and an ask
  const e2 = bodyOf(emails(t)[1]);
  assert.ok(e2.split("\n\n").filter(Boolean).length >= 4, "email 2 is a single question");
  // a payments question from the sector is asked somewhere
  assert.match(d, /payment|settlement|payout|checkout|chargeback|authori[sz]ation|sandbox/i);
});

test("a developer persona on a messaging API: the product name is never cut into a topic, the reader is a developer, and email 1 asks a developer question", async () => {
  const t = await call("email_sequence_generator", API);
  assert.doesNotMatch(draft(t), /(?:on|handle|handling|owns|about|at)\s+single API led intelligent/i, "the cut product description is used as a topic");
  for (const s of subjects(t)) assert.doesNotMatch(s, /single API led/i, s);
  assert.doesNotMatch(draft(t), /engineering or platform leader/i, "a developer is not an engineering leader");
  assert.match(draft(t), /developers who integrate the SMS API/i, "the persona is named where the role is spoken to");
  const e1 = bodyOf(emails(t)[0]);
  assert.match(e1, /\?[\s\S]*\?/, "email 1 asks a question of the developer beside the ask");
  assert.match(e1, /message|delivery|sandbox|route|country|countries|login code|passcode/i);
});

test("a sales user at an education buyer: no fragment opener, no sales leader, a user's own work", async () => {
  const t = await call("email_sequence_generator", CRM);
  const d = draft(t);
  assert.doesNotMatch(d, /sales leader/i);
  assert.match(d, /works? in sales|every day|day to day|daily/i);
  const e1 = bodyOf(emails(t)[0]);
  assert.doesNotMatch(e1, /^Hello,\s+No single 360 view/i, "email 1 opens with a fragment");
  assert.match(e1, /The problem in short(?: for people in education)?: no single 360 view of customers/);
  assert.match(t, /Education|education/);
  assert.doesNotMatch(t, /implied by/i, "the label of the pain is not said to the buyer");
});

// ---- trap: priorities in words, several weak points, role questions, credentials, scenario ----
const BI = {
  competitor: "dashboards that look backward", competitor_weaknesses: "dashboards look backward and point tools work in silos, so insight arrives late and only analysts can get it",
  your_solution: "Funnelwise, a product analytics platform that combines funnels, retention, cohorts, session replay and experiments, with warehouse connectors and SDKs",
  your_strengths: "an event based data model for fast queries, AI grounded in your own data, and analytics, replay and experiments on one platform",
  evaluation_stage: "mid", buyer_priorities: "self-serve answers without SQL and faster decisions that lift retention and engagement: a commissioned study reports 3x return and 6 months to payback (page claim), and customers see a 19% average increase in active users (page claim)",
  buyer_persona: "VP of Product Management", trap_type: "all",
};
const CLOUD = {
  competitor: "running cloud infrastructure in house, which is not a core competency for many enterprises",
  competitor_weaknesses: "in house cloud management makes it difficult to optimize resources and costs and to fully leverage the benefits of the cloud ecosystem",
  your_solution: "Cirrusworks managed services, modernization engineering services: cloud, data, business automation, managed services and digital contact centres, delivered through its Skyplan playbook",
  your_strengths: "a unique modernization approach through Skyplan and Responsible-first AI with embedded ethics, privacy, security and compliance, plus Inner Circle status for Acme Maps and a launch partner role for Acme Fabric",
  evaluation_stage: "mid", buyer_priorities: "modernization driven growth through outcome based services and a co-created charter of cost management, modernization and innovation", buyer_persona: "CIO", trap_type: "all",
};
const questions = (t) => [...t.matchAll(/\*\*Landmine Question:\*\* "([^"]+)"/g)].map((m) => m[1]);

test("a stated priority in words is an aim even with a figure after a colon; the figures keep their label", async () => {
  const t = await call("competitive_trap_setter", BI);
  assert.doesNotMatch(t, /figures only|no aim to ask/i);
  assert.match(t, /"[^"\n]*self-serve answers without SQL[^"\n]*\?"/i, "the aim is a question");
  assert.match(t, /3x return and 6 months to payback \(page claim\)/);
  assert.match(t, /19% average increase in active users \(page claim\)/);
  assert.match(t, /own number|their own|buyer's own/i);
});

test("a note with several weak points gives one landmine for each", async () => {
  const t = await call("competitive_trap_setter", { ...BI, trap_type: "discovery_questions" });
  const qs = questions(t);
  assert.ok(qs.length >= 3, `only ${qs.length} landmine questions`);
  assert.equal(new Set(qs).size, qs.length);
  const all = qs.join(" ").toLowerCase();
  assert.match(all, /backward|now|past|happened|fresh|late/, "looking backward");
  assert.match(all, /silo|connect|join|together/, "work in silos");
  assert.match(all, /late|how soon|wait/, "insight arrives late");
  assert.match(all, /analyst|who can|everyone/, "only analysts can get it");
  assert.doesNotMatch(all, /\bhandle (?:dashboards|point tools) /, "a note read as a noun phrase");
});

test("role questions from a different SaaS motion are not asked of a product analytics buyer", async () => {
  const t = await call("competitive_trap_setter", BI);
  assert.doesNotMatch(t, /what or how you charge or ship|change what or how you charge/i);
  assert.match(t, /From the evaluator's role and the sector/);
});

test("the seller's own partner status is a credential, never a buyer criterion or requirement; a claim is sourced, not a criterion", async () => {
  const t = await call("competitive_trap_setter", CLOUD);
  const crit = t.split("## Evaluation Criteria Positioning")[1].split("## Reference Call Questions")[0];
  const critList = crit.split("### Claims to source")[0].split("### Credentials")[0];
  assert.doesNotMatch(critList, /Inner Circle|launch partner/i, "a credential is a criterion");
  assert.match(crit, /### Credentials[\s\S]*Inner Circle/);
  assert.doesNotMatch(critList, /\bunique\b/i, "a marketing claim is a criterion");
  assert.match(crit, /Claims to source[\s\S]*unique modernization approach/i);
  assert.match(critList, /embedded ethics, privacy, security and compliance/i, "the demonstrable part stays a criterion");
  const req = t.split("(Traps)")[1] || "";
  assert.doesNotMatch(req.split("### Evaluation Scenarios")[0], /Inner Circle|launch partner/i);
});

test("an evaluation scenario names one clean topic or points to its weak point, never two joined topics", async () => {
  const t = await call("competitive_trap_setter", CLOUD);
  const sc = t.split("### Evaluation Scenarios")[1].split("\n---")[0];
  const lines = sc.split("\n").filter((l) => /^\*\*Scenario/.test(l));
  assert.ok(lines.length >= 1);
  for (const l of lines) {
    assert.match(l, /^\*\*Scenario \d+:\*\* give each option the same case (?:that tests [^,]{3,70}|for weak point \d+)/, l);
    assert.doesNotMatch(l, /costs fully leverage|and costs fully/i, l);
  }
});

// ---- the pool scenarios the judges named (private folder; skipped where it is absent) ----
const WORK = "/home/user/directory-submission-work/work";
const havePool = existsSync(`${WORK}/run20/eval/builders20.mjs`) && existsSync(`${WORK}/run22/eval/pool2.mjs`);
test("pool: Q3, P7, H3 emails and Q6, T7 traps (real builders)", { skip: !havePool && "private work folder not present" }, async () => {
  const { BUILD20 } = await import(`${WORK}/run20/eval/builders20.mjs`);
  const { loadSet } = await import(`${WORK}/run21/eval/common21.mjs`);
  const all = []; for (const s of ["T", "H", "P", "Q"]) all.push(...(await loadSet(s)));
  const tools = (await rpc("tools/list", {})).result.tools;
  const run = async (tool, id) => { const sc = all.find((s) => s.id === id); const args = await BUILD20.revenue[tool](sc, 0, tools.find((x) => x.name === tool).inputSchema); return call(tool, args); };
  const q3 = await run("email_sequence_generator", "Q3");
  for (const s of subjects(q3)) assert.doesNotMatch(s, /one setup for local/i, s);
  assert.doesNotMatch(draft(q3), /plans change after work has started|which part of the day goes wrong/i);
  const p7 = await run("email_sequence_generator", "P7");
  for (const s of subjects(p7)) assert.doesNotMatch(s, /single API led/i, s);
  assert.doesNotMatch(draft(p7), /engineering or platform leader/i);
  const h3 = await run("email_sequence_generator", "H3");
  assert.doesNotMatch(draft(h3), /sales leader/i);
  assert.match(bodyOf(emails(h3)[0]), /The problem in short(?: for people in [^:]+)?: no single 360 view/);
  const q6 = await run("competitive_trap_setter", "Q6");
  assert.doesNotMatch(q6, /figures only|no aim to ask|what or how you charge/i);
  assert.match(q6, /self-serve answers without SQL/i);
  assert.ok(questions(q6).length >= 3, `Q6 landmines: ${questions(q6).length}`);
  const t7 = await run("competitive_trap_setter", "T7");
  const crit7 = t7.split("## Evaluation Criteria Positioning")[1].split("## Reference Call Questions")[0].split("### Credentials")[0];
  assert.doesNotMatch(crit7, /Inner Circle|launch partner/i);
  for (const l of (t7.split("### Evaluation Scenarios")[1] || "").split("\n").filter((x) => /^\*\*Scenario/.test(x))) assert.match(l, /^\*\*Scenario \d+:\*\* give each option the same case (?:that tests [^,]{3,70}|for weak point \d+)/, l);
});
