// Run 21c job 3 (test first): discovery_question_bank returned the standard MEDDPICC, BANT, SPICED, Challenger and Gap Selling lists with the
// product, pain and persona squeezed in as labels, then "Pro Tips" and "Active Listening". It now returns a question list written from the
// inputs: every section asks about the product's parts, the pain, the persona's role and the deal details that were given.
// Two invented companies of different kinds (a construction management platform, a business messaging platform). No real names.
// Run: node --no-warnings --test tests/run21c-draft-discovery_question_bank.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "discovery_question_bank", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

const A = {
  prospect_industry: "general contractors", prospect_role: "Chief Financial Officer",
  your_solution: "Sitegrid, a construction management platform for general contractors: project scheduling, cost control, change order tracking and subcontractor payments",
  known_pain_points: "change orders sit in email for weeks, and job cost reports arrive after the money is spent",
  known_metrics: "pay applications take 9 days to prepare", deal_stage: "discovery", gaps_to_fill: "economic buyer, decision process",
};
const B = {
  prospect_industry: "online retailers", prospect_role: "Head of Product",
  your_solution: "Pingwise, a business messaging platform: text messages, voice calls, verified sender messages and delivery reports",
  known_pain_points: "login codes arrive late and shoppers abandon checkout, and fraud filters block messages that are real",
  known_metrics: "checkout abandonment is 38% on mobile", deal_stage: "technical", gaps_to_fill: "budget, timeline",
};
const FRAMEWORKS = ["meddpicc", "bant", "spiced", "challenger", "gap_selling", "all"];

const FILLER = [/Pro Tips/i, /Active Listening/i, /Wait 3 seconds/i, /Red Flags to Probe/i, /magic wand/i, /Use these questions as a guide/i, /Question Sequencing/i,
  /How do you handle this today, who owns it, and what breaks/i, /What's the root cause of this problem/i, /Walk me through your approval process/i, /Can you walk me through your typical buying process/i,
  /I'm going to push back/i, /Let me suggest a different way/i, /The path forward I'd suggest is/i, /Build rapport and establish credibility/i, /Pitching too early/i,
  /Talking more than the buyer/i, /Scale 1-10/i, /fast-paced/i, /As you know/i, /What's the cost of the current situation/i, /How does this match what you're seeing/i,
  /Where do you think this applies most in your organization/i, /Quantify business case/i, /Focus Areas/i, /Key Outcome/i];
const longLines = (t) => new Set(t.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30));
const overlap = (a, b) => { const x = longLines(a), y = longLines(b); let n = 0; for (const l of x) if (y.has(l)) n++; return n / Math.max(1, Math.min(x.size, y.size)); };
const questions = (t) => t.split("\n").filter((l) => /\?/.test(l));

for (const framework of FRAMEWORKS) {
  test(`${framework}: a question list built from the inputs, no placeholder, no filler`, async () => {
    for (const [name, co] of [["A", A], ["B", B]]) {
      const t = await call({ framework, ...co });
      assert.ok(questions(t).length >= 14, `${name}: ${questions(t).length} questions`);
      assert.doesNotMatch(t, /\[[^\]\n]*\]/, `${name} bracket placeholder`);
      assert.doesNotMatch(t, /\{[^}\n]*\}/, `${name} brace placeholder`);
      assert.doesNotMatch(t, /your product|your solution|\bTBD\b|Insert/i, `${name} placeholder words`);
      for (const re of FILLER) assert.doesNotMatch(t, re, `${name} filler ${re}`);
      assert.doesNotMatch(t, /[–—]/, `${name} dash`);
      assert.doesNotMatch(t, /clinic|pharmac|health ?care|patient|hospital/i, `${name} healthcare word`);
    }
  });
  test(`${framework}: every input is in the list and the questions use the product, pain and role`, async () => {
    const a = await call({ framework, ...A }), b = await call({ framework, ...B });
    for (const re of [/general contractors/, /Chief Financial Officer/, /Sitegrid/, /change orders sit in email for weeks/, /job cost reports arrive after the money is spent/, /pay applications take 9 days to prepare/, /economic buyer/i, /decision process/i, /project scheduling/, /cost control/, /change order tracking/, /subcontractor payments/]) assert.match(a, re, `A ${framework} ${re}`);
    for (const re of [/online retailers/, /Head of Product/, /Pingwise/, /login codes arrive late and shoppers abandon checkout/, /fraud filters block messages that are real/, /checkout abandonment is 38% on mobile/, /budget/i, /timeline/i, /text messages/, /voice calls/, /verified sender messages/, /delivery reports/]) assert.match(b, re, `B ${framework} ${re}`);
    // questions, not labels: the questions themselves carry the pain and the parts
    assert.ok(questions(a).filter((l) => /change order|job cost|subcontractor|pay application/i.test(l)).length >= 8, "A questions use A's words");
    assert.ok(questions(b).filter((l) => /login code|checkout|fraud|delivery report|message/i.test(l)).length >= 8, "B questions use B's words");
    // at most a third of the questions are the kind that would be the same for any company (they carry no word of the inputs, the role or the sector notes)
    for (const [t, co] of [[a, A], [b, B]]) {
      const own = new Set(Object.values(co).join(" ").toLowerCase().match(/[a-z]{5,}/g));
      const q = questions(t), plain = q.filter((l) => !(l.toLowerCase().match(/[a-z]{5,}/g) || []).some((w) => own.has(w)));
      assert.ok(plain.length <= q.length / 3, `${framework}: ${plain.length} of ${q.length} questions carry no word of the inputs: ${plain.slice(0, 3).join(" | ")}`);
    }
  });
  test(`${framework}: two companies of different kinds get lists whose long lines differ`, async () => {
    const a = await call({ framework, ...A }), b = await call({ framework, ...B });
    assert.ok(overlap(a, b) < 0.25, `${framework} overlap ${overlap(a, b).toFixed(2)}`);
    assert.doesNotMatch(a, /message routing|one time password|artificial traffic|sender registration/i, "A holds B's sector words");
    assert.doesNotMatch(b, /retainage|superintendent|punch list|pay application|change order/i, "B holds A's sector words");
  });
}

test("the deal stage changes the opening: a technical call and a first call do not open alike", async () => {
  const t = await call({ framework: "meddpicc", ...B, deal_stage: "technical" }), f = await call({ framework: "meddpicc", ...B, deal_stage: "first_call" });
  const open = (x) => (x.split("\n## ").find((s) => /^(?:Opening|How to open)/i.test(s)) || "");
  assert.ok(open(t) && open(f), "an opening section");
  assert.notEqual(open(t), open(f));
});

test("a known metric and a gap are asked about once each, and the gaps come before the framework", async () => {
  const t = await call({ framework: "meddpicc", ...A });
  assert.ok(t.search(/Gaps to fill first/i) > 0 && t.search(/Gaps to fill first/i) < t.search(/### M|## M/));
  assert.match(t, /pay applications take 9 days to prepare/);
  assert.equal((t.match(/change orders sit in email for weeks, and job cost reports arrive after the money is spent/g) || []).length, 1, "the whole pain is quoted once");
});

test("missing inputs are said once, in one line, and the list still reads well", async () => {
  const t = await call({ framework: "bant", prospect_role: "VP Sales" });
  assert.equal((t.match(/Not given:/g) || []).length, 1);
  assert.doesNotMatch(t, /\[[^\]\n]*\]|\{[^}\n]*\}|your product|your solution/i);
  assert.ok(questions(t).length >= 8);
});
