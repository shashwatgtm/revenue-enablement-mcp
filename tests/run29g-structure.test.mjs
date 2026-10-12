// Run 29G (test first): the four tools of this server that are among the ten weakest return clean structure (owner decision D-27B-1 (a)):
// six sections in order: 1 what the user gave, quoted as typed; 2 the framework applied (the deliverable, frozen); 3 sector checks (the user's own
// words for the kind of business, the reading, the sector notes as checks); 4 gaps; 5 questions to ask next; 6 a note to the assistant.
// Also the traced lines of run 27B (independent-audit/run27b/trace.md) not yet tested: sector notes printed as facts in the deliverable, and the
// stock fallback where an input was missing. Plain words only, no real company (rule B81). Run: node --test tests/run29g-structure.test.mjs
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
const HEADS = ["## 1. What you gave", "## 2. The framework applied", "## 3. Sector checks", "## 4. Gaps", "## 5. Questions to ask next", "## 6. Note to the assistant"];
const SECTOR_HEAD = /^#{2,4} (?:sector notes\b.*|what this audience looks for|questions on the measures .* buyers look for|context questions in the language of .*|questions in the language of .*|in the language of .*|what to check in each segment \(sector view\).*)$/im;
function sections(t) {
  const at = HEADS.map((h) => t.indexOf(`\n${h}\n`));
  at.forEach((x, i) => assert.ok(x >= 0, `missing ${HEADS[i]}`));
  for (let i = 1; i < at.length; i++) assert.ok(at[i] > at[i - 1], `${HEADS[i]} out of order`);
  return HEADS.map((h, i) => t.slice(at[i] + h.length + 2, i + 1 < at.length ? at[i + 1] : t.length));
}
// Section 1 says every field once in the whole answer (design change of R29G-02, logged: the older tests, kept unedited, forbid pasting an input
// twice): a value is quoted as typed, or quoted clause by clause in order with every word kept, or pointed to section 2 when section 2 already
// quotes it whole or uses three quarters of its words or more.
const clauses = (v) => v.split(/(?<=[.!?;:])\s+|\n+|,\s+(?=(?:and|but|so|while|which means)\s)/).map((x) => x.trim()).filter(Boolean);
function saidOnce(s, k, v) {
  const line = s[0].split("\n").findIndex((l) => l.startsWith(`- ${k}`));
  assert.ok(line >= 0, `section 1 names ${k}`);
  const block = s[0].split("\n").slice(line).join("\n");
  if (block.startsWith(`- ${k}: "${v}"`)) return;
  if (block.startsWith(`- ${k}: quoted whole, as typed, in section 2`)) { assert.ok(s[1].includes(v), `${k} is quoted whole in section 2`); return; }
  if (block.startsWith(`- ${k}: in section 2, in your words`)) return;
  let at = 0;
  for (const c of clauses(v)) { const i = block.indexOf(`"${c}"`, at); assert.ok(i >= at, `section 1 quotes every clause of ${k} in order: ${c}`); at = i; }
}
function shape(t, args) {
  const s = sections(t);
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === "string") saidOnce(s, k, v);
    if (typeof v === "number") assert.ok(s[0].includes(`- ${k}: "${v}"`), `section 1 gives ${k}`);
    if (Array.isArray(v)) for (const e of v) if (typeof e === "string") assert.ok(s[0].includes(`"${e}"`), `section 1 quotes an entry of ${k}`);
  }
  assert.doesNotMatch(s[1], SECTOR_HEAD, "no sector note block left in the framework section");
  assert.doesNotMatch(s[1], /^\*?Sector: read from your inputs/m, "the sector line sits in section 3");
  assert.doesNotMatch(s[1], /^\*{0,2}To sharpen this(?: [a-z]+)?, give:/m, "the gap line sits in section 4, not in the framework");
  assert.match(s[2], /What the business is, in your words|What the business is: not stated/);
  assert.ok(s[5].trim().split("\n").length >= 2, "a short note to the assistant");
  return s;
}
const SOL = "Shelfwise, store operations software for retail chains: a task manager that sends store tasks with photo checks, an audit app for store visits, and dashboards for area managers";

test("demo_script_builder: six sections, inputs quoted as typed, the script is the framework, the sector notes are checks", async () => {
  const args = { demo_type: "first_look", primary_audience: "Head of Retail Operations", attendees: "area managers, IT lead", customer_industry: "grocery retail",
    your_solution: SOL, key_pain_points: "store tasks arrive by email and chat, so nobody knows what is done; audits are on paper", demo_duration: 30 };
  const r = await call("demo_script_builder", args);
  assert.equal(r.isError, false);
  const s = shape(r.text, args);
  assert.match(s[1], /^## Demo Script$/m);
  assert.match(s[1], /^Say: "/m);
  assert.match(s[3], /^- |^To sharpen this, give: [^\n]*\(it would/m, "gaps listed, in the tool's own line or one per line");
  assert.match(s[4], /desired outcome|known objections|outcome do you want|objections do you expect/i);
});

test("discovery_question_bank: six sections; the questions in the sector's language are checks under the reading", async () => {
  const args = { framework: "meddpicc", prospect_industry: "grocery retail", prospect_role: "Head of Retail Operations", known_pain_points: "store tasks arrive by email and chat, so nobody knows what is done", your_solution: SOL };
  const r = await call("discovery_question_bank", args);
  assert.equal(r.isError, false);
  const s = shape(r.text, args);
  assert.match(s[1], /MEDDPICC questions/);
});

test("account_plan_builder: six sections; the sector reading sits in section 3 with the user's own words", async () => {
  const args = { account_name: "regional grocery chain account", industry: "grocery retail", current_arr: 30000, known_contacts: "Head of Operations (buyer), IT lead", your_solution: SOL };
  const r = await call("account_plan_builder", args);
  assert.equal(r.isError, false);
  const s = shape(r.text, args);
  assert.match(s[1], /The next 90 days/);
  assert.match(s[2], /How the tool read it/);
});

test("deal_strategy_coach: six sections; the health score stays; how deals usually run in a sector is a check, not a fact of this deal", async () => {
  const args = { deal_name: "grocery chain store operations deal", deal_value: 20000, deal_stage: "proposal", blockers: "Is there a minimum contract?", your_solution: SOL };
  const r = await call("deal_strategy_coach", args);
  assert.equal(r.isError, false);
  const s = shape(r.text, args);
  assert.match(s[1], /Health Score: \d+\/100/);
  assert.doesNotMatch(s[1], /How deals usually run in /);
  // the economic buyer was not given: the next questions ask for it rather than a stock line
  assert.match(s[4], /economic buyer/i);
});
