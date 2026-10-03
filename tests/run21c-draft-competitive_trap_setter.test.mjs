// Run 21c job 3 (test first): competitive_trap_setter returned an outline (generic discovery, reference and support questions, a list
// of coaching lines) with the user's weaknesses and strengths as labels. It now returns a set of landmine questions built from the
// inputs: each weakness becomes a question about its own topic, each strength a criterion, each priority a question, and the
// figures keep their source label. Two invented companies of different kinds. Run: node --no-warnings --test tests/run21c-draft-competitive_trap_setter.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "competitive_trap_setter", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

const A = {
  competitor: "Siteledger", your_solution: "Gridbeam, a construction management platform for general contractors: job costing, change orders and field daily logs",
  competitor_weaknesses: "Charges per seat so subcontractors are left out; Change orders move by email and wait for a reply; No daily log on a phone",
  your_strengths: "Unlimited subcontractor logins on one annual price; Change orders approved from the site in one tap; Works offline on a weak signal",
  evaluation_stage: "late", buyer_priorities: "close change orders in days, keep job cost current while the project runs; the home page cites a 12% drop in rework (customer story headline)",
  buyer_persona: "Director of Operations", trap_type: "all",
};
const B = {
  competitor: "Textmint", your_solution: "Pingrelay, a business messaging platform that sends order and appointment notices over WhatsApp and SMS",
  competitor_weaknesses: "Approval of message templates takes weeks; Delivery reports arrive hours late; No shared inbox for customer replies",
  your_strengths: "Template approval handled in two days; Live delivery status for every message; One shared inbox for replies",
  evaluation_stage: "mid", buyer_priorities: "raise the share of customers who read the notice, cut support calls about order status; the case study headline says delivery rate rose to 98% (case study headline)",
  buyer_persona: "Head of Customer Support", trap_type: "all",
};
const WAY = { competitor: "disconnected spreadsheets and phone calls", your_solution: A.your_solution, competitor_weaknesses: "Nobody sees the same numbers; Rework is found at closeout", your_strengths: "One job cost view for the office and the field", evaluation_stage: "early", buyer_persona: "Controller", trap_type: "all" };

const BRACKET = /\[[^\]\n]*\]|\{[^}\n]*\}|your product|\bTBD\b|Insert/i;
const DASH = /[–—]/;
const HEALTH = /health|clinic|pharmac|patient|hospital|medical/i;
const FILLER = [
  "Never go negative", "Have you defined must-haves versus nice-to-haves", "What other options are you evaluating, and what criteria are you using",
  "What's most important to you in making this decision", "Knowing what you know now, would you", "How does the actual experience compare to what you expected",
  "What surprised you after you started", "Offer only the terms you actually have", "Use these tactics professionally and honestly", "Provide proof points and references",
  "Make sure your differentiators are being tested", "How will you test the scenario you care most about", "What is NOT included in the quoted price",
  "What level of support is included", "Who from their team will be involved in implementation", "How long have you been using it", "Could each vendor show it live, with your own data",
  "Which of the options can show this on our own scenario", "The vendor must demonstrate this live, on our own data, during the evaluation", "Help your champion make the case internally",
];
const lines = (t) => t.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30);
const overlap = (a, b) => { const sb = new Set(lines(b)); const la = lines(a); return la.filter((l) => sb.has(l)).length / Math.max(1, la.length); };
const has = (t, s, label) => assert.ok(t.toLowerCase().includes(s.toLowerCase()), `${label}: missing ${JSON.stringify(s)}`);
const split = (s) => s.split(";").map((x) => x.trim());
const questions = (t) => [...t.matchAll(/\*\*Landmine Question:\*\* "([^"]+)"/g)].map((m) => m[1]);
const content = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !/^(?:their|which|there|these|those|about|would|could|where|while|other)$/.test(w));

test("every input appears, and the figure keeps its source label", async () => {
  for (const [name, args] of [["A", A], ["B", B]]) {
    const t = await call(args);
    for (const k of ["competitor", "evaluation_stage", "buyer_persona"]) has(t, args[k], name + " " + k);
    has(t, args.your_solution.split(",")[0], name + " solution");
    for (const w of split(args.competitor_weaknesses)) has(t, w, name + " weakness");
    for (const s of split(args.your_strengths)) has(t, s, name + " strength");
    for (const p of args.buyer_priorities.split(/[,;]/).map((x) => x.trim())) if (!/\d/.test(p)) has(t, p, name + " priority");
    const fig = args.buyer_priorities.match(/(\d+%[^(]*)\(([^)]*)\)/);
    has(t, fig[1].trim(), name + " figure");
    has(t, fig[2].trim(), name + " figure label");
    assert.doesNotMatch(t, BRACKET, name);
    assert.doesNotMatch(t, DASH, name);
    assert.doesNotMatch(t, HEALTH, name);
    for (const f of FILLER) assert.ok(!t.includes(f), `${name} filler: ${f}`);
  }
});

test("each weakness gets its own question, about its own topic, and the question does not quote the note", async () => {
  for (const [name, args] of [["A", A], ["B", B]]) {
    const t = await call({ ...args, trap_type: "discovery_questions" });
    const qs = questions(t);
    const ws = split(args.competitor_weaknesses);
    assert.equal(qs.length, ws.length, name);
    assert.equal(new Set(qs).size, qs.length, name + " distinct");
    ws.forEach((w, i) => {
      assert.ok(!qs[i].toLowerCase().includes(w.toLowerCase()), `${name}: question quotes the note: ${qs[i]}`);
      const shared = content(w).filter((x) => qs[i].toLowerCase().includes(x.slice(0, 5)));
      assert.ok(shared.length >= 1, `${name}: question ${JSON.stringify(qs[i])} shares no topic word with ${JSON.stringify(w)}`);
    });
  }
});

test("each priority becomes a question, each strength a criterion, each landmine is tied to a strength when one fits", async () => {
  const t = await call(A);
  assert.match(t, /"[^"\n]*close change orders in days[^"\n]*\?"/i);
  assert.match(t, /"[^"\n]*keep job cost current while the project runs[^"\n]*\?"/i);
  const crit = t.split("## Evaluation Criteria Positioning")[1].split("## Reference Call Questions")[0];
  for (const s of split(A.your_strengths)) has(crit, s, "criterion");
  // the weakness about per seat charges is tied to the strength about logins on one price
  const disc = t.split("## Discovery Questions (Landmines)")[1].split("## Evaluation Criteria Positioning")[0];
  assert.match(disc, /Charges per seat[\s\S]{0,700}Unlimited subcontractor logins on one annual price/);
});

test("a way of working is not asked about a contract or references from a vendor", async () => {
  const t = await call(WAY);
  has(t, "disconnected spreadsheets and phone calls", "way");
  has(t, "Nobody sees the same numbers", "way");
  has(t, "One job cost view for the office and the field", "way");
  assert.doesNotMatch(t, /renew automatically|termination rights|customers who've been through/i);
  // each note is asked about by its kind: "nobody sees ..." and "X is found at ..." are not turned into "how does each option handle ..."
  assert.match(t, /"Who can see the same numbers in each option[^"\n]*\?"/);
  assert.match(t, /"When is rework found in each option[^"\n]*\?"/);
  assert.doesNotMatch(t, /handle nobody|handle rework is/i);
  assert.doesNotMatch(t, BRACKET);
  assert.doesNotMatch(t, DASH);
});

test("a construction platform and a messaging platform get different drafts", async () => {
  const a = await call(A), b = await call(B);
  assert.ok(overlap(a, b) < 0.25, `overlap ${overlap(a, b)}`);
  assert.doesNotMatch(b, /change order|RFI|punch list|subcontractor|job cost/i);
  assert.doesNotMatch(a, /WhatsApp|SMS|template/i);
  // the sector notes differ by kind
  const na = a.split("### Sector notes")[1] || "", nb = b.split("### Sector notes")[1] || "";
  assert.notEqual(na, nb);
});

test("every trap type is a finished section with no placeholder", async () => {
  for (const trap_type of ["discovery_questions", "evaluation_criteria", "reference_questions", "technical_requirements", "commercial_terms"]) {
    for (const base of [A, B]) {
      const t = await call({ ...base, trap_type });
      assert.doesNotMatch(t, BRACKET, trap_type);
      assert.doesNotMatch(t, DASH, trap_type);
      for (const f of FILLER) assert.ok(!t.includes(f), `${trap_type} filler: ${f}`);
      for (const w of split(base.competitor_weaknesses)) has(t, w, `${trap_type} weakness`);
      for (const s of split(base.your_strengths)) has(t, s, `${trap_type} strength`);
    }
  }
});

test("a sparse call says once what is not given and keeps no placeholder", async () => {
  const t = await call({ competitor: "Textmint", your_solution: B.your_solution });
  assert.equal((t.match(/Not given:/g) || []).length, 1);
  assert.doesNotMatch(t, BRACKET);
  assert.doesNotMatch(t, DASH);
  assert.doesNotMatch(t, /your solution/i);
});
