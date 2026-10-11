// Run 27B (test first): the worst lines of four tools on two test pools, traced to the code that wrote them (fault: field parsing, sentence
// template, dropped input). Each test is one of those lines as a failing check; plain words only, no real company (rule B81).
// The rule they share: the tool never builds a sentence from a piece of a field it could not read; it keeps the facts the user gave
// (an answer the user typed, a part of the product) and uses them; a list is never cut inside a quote or inside one statement.
// Tested in-process through netlify/functions/mcp.mjs (no network). Run: node --test tests/run27b-input.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};

const DEMO = {
  demo_type: "first_look",
  primary_audience: "VP of Product",
  attendees: "product managers, engineering leads",
  customer_industry: "software",
  your_solution: "Quillmark, a product feedback platform: a feedback inbox that gathers requests from every channel, roadmaps, prioritization and specs, plus native integrations",
  key_pain_points: "feedback sits in many tools and spreadsheets, so teams cannot see trends or agree priorities",
  demo_duration: 30,
};

test("demo_script_builder: company facts typed in must_show_features never become demo steps (a city is not a flow)", async () => {
  const r = await call("demo_script_builder", { ...DEMO, must_show_features: "founded in 2015; 400+ staff of 30+ nationalities with offices in Lisbon, Oslo, Tallinn and Riga; named on a startup list (page claims)" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /\*\*Step \d: (?:Oslo|Tallinn|Riga|Tallinn and Riga)\*\*/);
  assert.doesNotMatch(r.text, /Here is what you asked to see: (?:Oslo|Tallinn|Riga)/);
  assert.match(r.text, /\*\*Step 1: (?:Feedback inbox|Roadmaps|Prioritization|Specs|Native integrations)/i);
  assert.doesNotMatch(r.text, /\*\*Step \d: (?:Named on|Founded)/i);
});

test("demo_script_builder: a must-show item with a figure that names a part of the product shows that part", async () => {
  const r = await call("demo_script_builder", {
    ...DEMO, your_solution: "Fleetwise, five products on one platform: a transport management system (plan, dispatch and settle freight), video and camera risk detection, fleet visibility (track every vehicle in real time), fuel monitoring and a transport ERP",
    key_pain_points: "tracking data gives reports instead of actions, and maintenance, fuel and invoicing run in separate tools",
    must_show_features: "live camera analytics that flag 9+ risky driving events (page claims)",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /Not shown:[^\n]*video and camera risk detection/i);
  assert.match(r.text, /\*\*Step \d: Video and camera risk detection/i);
});

test("demo_script_builder: a market claim before a colon is not played back as the buyer's own problem; the problems after it are", async () => {
  const r = await call("demo_script_builder", {
    ...DEMO, your_solution: "Fleetwise, three products on one platform: route planning, video and camera risk detection, and fuel monitoring",
    key_pain_points: "The market has 150+ tracking vendors and few fixed the work itself: devices were bought as a checkbox, tracking data gave reports instead of actions, and maintenance, fuel and invoicing ran in separate tools",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /How does 'the market has 150\+/i);
  assert.doesNotMatch(r.text, /What they came for[\s\S]*'the market has 150\+ tracking vendors/i);
  assert.match(r.text, /devices were bought as a checkbox/);
});

test("demo_script_builder: an objection with the answer the user typed is answered with that answer, not by a template chosen from its words", async () => {
  const r = await call("demo_script_builder", {
    ...DEMO, your_solution: "Ledgerline, a banking as a service platform: businesses choose modules (payment collection, ledgers, escrow accounts), test them in a sandbox and launch with its APIs",
    key_pain_points: "integration cycles take months with cross team approvals, and compliance work continues after go live",
    known_objections: "Are customer funds held in escrow? (the page answers that funds are held under the arrangements the regulator requires, with custody documentation for enterprise contracts)",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /not a size label/);
  assert.match(r.text, /Say: "[^"\n]*funds are held under the arrangements the regulator requires/);
  assert.doesNotMatch(r.text, /Buyer may ask: "[^"\n]*\(the page answers/);
  assert.match(r.text, /funds are held under the arrangements the regulator requires/);
});

test("discovery_question_bank: a denial before a semicolon is not asked about as a problem", async () => {
  const r = await call("discovery_question_bank", {
    framework: "meddpicc", prospect_industry: "large enterprises", prospect_role: "Chief Data Officer",
    known_pain_points: "data projects do not fail because of the tools; they fail because nobody owns the pipelines",
    your_solution: "Benchwise, vetted engineers placed into client teams or delivered as a managed team, with AI build services and training",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /On "data projects do not fail because of the tools"/i);
});

test("discovery_question_bank: the person in the room is not asked to invite themselves when the sector's signer is their role", async () => {
  const r = await call("discovery_question_bank", {
    framework: "meddpicc", prospect_industry: "financial services", prospect_role: "CISO",
    known_pain_points: "security findings arrive weeks late and nobody owns the fix",
    your_solution: "Sentrywise, a cybersecurity platform that finds and fixes security risks across the company",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /Can we include the CISO in the next conversation/);
});

test("discovery_question_bank: one word of a 'from a prompt, link or document' list is not a part of the product", async () => {
  const r = await call("discovery_question_bank", {
    framework: "meddpicc", prospect_industry: "manufacturing", prospect_role: "Head of Learning",
    known_pain_points: "training videos are hard to update, and translating them is slow and expensive",
    your_solution: "Reelwise, an AI video platform: create training videos with AI presenters from a prompt, link, document or slides, translate and dub existing videos, and build video into your own product through an API",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /^- (?:Link|Document|Slides): /m);
});

test("deal_strategy_coach: a blocker typed as a statement and a question about it stays one blocker, and the answer the user typed is used", async () => {
  const r = await call("deal_strategy_coach", {
    deal_name: "help desk deal", deal_value: 15000, deal_stage: "proposal",
    blockers: "We are moving from another ticketing tool; can you help with that? (the page answers that it moves the old tickets for free); Do I need a credit card to sign up? (the page answers no, only when upgrading to a paid plan)",
    your_solution: "Inboxwise, a customer service platform: a shared inbox, ticketing, workflows and an AI copilot",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /\*\*Blocker \d: "can you help with that/i);
  assert.doesNotMatch(r.text, /\*\*Blocker 3:/);
  assert.doesNotMatch(r.text, /\*\*Blocker \d: "[^"\n]*\(the page answers/);
  assert.match(r.text, /answer you gave[^\n]*moves the old tickets for free/i);
  assert.match(r.text, /answer you gave[^\n]*only when upgrading to a paid plan/i);
});

test("account_plan_builder: an objection in the notes with the answer the user typed is answered with that answer", async () => {
  const r = await call("account_plan_builder", {
    account_name: "regional operator account", industry: "mobile network operators", current_arr: 100000,
    known_contacts: "CIO (buyer), billing architects",
    your_solution: "Chargewise, a cloud charging system for mobile operators with plan design tools",
    account_notes: "All figures in this input are hypothetical. Objections: Is it limited to one public cloud? (the page answers that it runs on two public clouds and in a private cloud on request)",
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /### \d\. "[^"\n]*\(the page answers/);
  assert.match(r.text, /answer you gave[^\n]*runs on two public clouds and in a private cloud on request/i);
});
