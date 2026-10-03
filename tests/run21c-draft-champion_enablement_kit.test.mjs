// Run 21c job 3 (test first): champion_enablement_kit returned an outline for every asset type: tables to fill ("Rate it", "The buyer's own number"),
// coaching lines ("Listen first", "Acknowledge"), the same price defence under an objection about cost codes, a generic reply to an objection about
// residential tools, and the product description pasted into the overview and cut mid sentence. Each of the 8 asset types is now the finished asset:
// a memo a champion could forward, spoken answers to each objection, a spoken talk, an email, one-page copy, a comparison, a risk write-up.
// Two invented companies of very different kinds, plain words.
// Run: node --no-warnings --test tests/run21c-draft-champion_enablement_kit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "champion_enablement_kit", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

const TYPES = ["executive_brief", "internal_business_case", "objection_responses", "presentation_talking_points", "email_to_stakeholder", "roi_one_pager", "competitive_comparison", "risk_assessment"];

// Company A: a construction management platform. Company B: a business messaging platform.
const A = {
  champion_name: "Marcus Bell", champion_role: "Director of Preconstruction", target_stakeholder: "CFO",
  your_solution: "Quarrywise, a construction management platform for general contractors: bid management, change orders, daily logs and subcontractor payments",
  key_value_points: "change orders approved from the field in one tap; daily logs finished on a phone and never re-typed; 12 days faster close-out on one project (customer story headline)",
  known_objections: "How does it integrate with our accounting system?; Can it fit our cost codes and workflows?; Why do commercial builders move off residential tools?; How much does it cost?",
  competitive_context: "a residential project tool built for narrow tasks; shared spreadsheets and email threads",
  budget_context: "$90,000 a year (hypothetical annual cost)", urgency_drivers: "the new tower project breaks ground in March",
  champion_wins: "closes the books on the tower project without a late change order surprise",
};
const B = {
  champion_name: "Priya Nair", champion_role: "Head of Platform Engineering", target_stakeholder: "VP Engineering",
  your_solution: "Pingwell, a business messaging platform: text messages, one time passwords and delivery reports through one API",
  key_value_points: "one time passwords delivered in seconds (page claim); a delivery report for every message sent; 99.95% delivery uptime (page claim)",
  known_objections: "Will messages reach users on every carrier?; We already send through our cloud provider; How long does integration take?",
  competitive_context: "a bulk SMS reseller; our cloud provider's messaging add-on",
  budget_context: "$30,000 a year (hypothetical annual cost)", urgency_drivers: "the sign-up flow relaunches in the spring",
  champion_wins: "ends the late one time password complaints from support",
};

const PLACEHOLDER = /\[[^\]\n]{1,80}\]|\{[^}\n]{1,80}\}|your product|\bTBD\b|Insert|\[Name\]|\[Company\]/i;
// the generic lines of the old output
const FILLER = [
  "Put a number from your own data against each row", "Rate it", "Listen first", "Show you heard them", "Respond with evidence", "If they push back",
  "Do not defend the price in isolation", "Pattern of an answer", "How to answer", "Describe it in one or two lines", "Approve the investment", "Begin implementation",
  "is described in your input as", "I wanted to bring a recommendation to your attention", "enter it from the finance team's data", "Remember this when pushing through objections",
  "A clear reason is worth more than a long defence", "Ask first", "Explain the cause in the buyer's terms first", "Keep momentum", "What the current way costs in a year",
  "Hours spent on the workaround", "Would you be available for a 15-minute discussion this week", "answer with evidence, and ask what would settle it",
];
const HEALTH = /clinic|pharmac|healthcare|health care|hospital|patient/i;
const longLines = (t) => t.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30);

const out = {};
for (const type of TYPES) out[type] = { a: await call({ asset_type: type, ...A }), b: await call({ asset_type: type, ...B }) };

const words = (s) => s.toLowerCase().replace(/[^a-z0-9%$.,' -]/g, " ").replace(/\s+/g, " ").trim();
const has = (t, s) => words(t).includes(words(s));
const oneBlock = (t, objection) => {
  const lines = t.split("\n");
  const i = lines.findIndex((l) => /^###? /.test(l) && l.includes(objection.replace(/[?]$/, "")));
  assert.ok(i >= 0, `no heading for ${objection}`);
  let j = i + 1;
  while (j < lines.length && !/^##/.test(lines[j]) && !/^---/.test(lines[j])) j++;
  return lines.slice(i + 1, j).join("\n");
};

test("every input appears in every asset type, in the user's words, with figures and labels kept", () => {
  for (const type of TYPES) for (const [t, I] of [[out[type].a, A], [out[type].b, B]]) {
    for (const k of ["champion_name", "target_stakeholder", "budget_context"]) assert.ok(has(t, I[k]), `${type}: ${k}`);
    for (const part of I.key_value_points.split("; ")) assert.ok(has(t, part), `${type}: value ${part}`);
    for (const part of I.competitive_context.split("; ")) assert.ok(has(t, part), `${type}: ${part}`);
    for (const part of I.known_objections.split("; ")) assert.ok(has(t, part.replace(/[?]$/, "")), `${type}: ${part}`);
    assert.ok(has(t, I.urgency_drivers), `${type}: urgency`);
    assert.ok(has(t, I.champion_wins), `${type}: wins`);
    assert.ok(has(t, I.champion_role), `${type}: role`);
    assert.ok(has(t, I.your_solution.split(",")[0]), `${type}: product`);
  }
});

test("a figure keeps its number and its source label", () => {
  for (const type of TYPES) {
    assert.match(out[type].a, /12 days faster close-out on one project[^\n]*customer story headline/, type);
    assert.match(out[type].b, /99\.95% delivery uptime[^\n]*page claim/, type);
    assert.match(out[type].b, /delivered in seconds[^\n]*page claim/, type);
  }
});

test("the product description is never cut and never pasted whole into the overview", async () => {
  const long = "Buildwell, a connected construction platform for project management from preconstruction to closeout, covering project execution, cost management, resource management, quality and safety, analytics, payments for subcontractors and AI agents that read specs, drawings, submittals and contracts";
  for (const type of ["internal_business_case", "executive_brief", "roi_one_pager"]) {
    const t = await call({ asset_type: type, your_solution: long, target_stakeholder: "President and CFO", key_value_points: "keep projects on schedule" });
    assert.ok(has(t, "AI agents that read specs, drawings, submittals and contracts"), `${type}: the end of the description`);
    assert.ok(has(t, "payments for subcontractors"), type);
    assert.ok(!t.includes(long), `${type}: pasted whole`);
    assert.ok(!/cost management\. *\n/.test(t) && !/covering project execution, cost management\./.test(t), type);
    // no line ends in the middle of a word or a list
    for (const l of t.split("\n")) assert.doesNotMatch(l.trim(), /\b(?:and|or|the|of|to|for|with|a)[.,]?$/i, `${type}: line ends mid phrase: ${l}`);
  }
});

test("no placeholder, no filler, no dashes, no healthcare words", () => {
  for (const type of TYPES) for (const t of [out[type].a, out[type].b]) {
    assert.doesNotMatch(t, PLACEHOLDER, type);
    for (const f of FILLER) assert.ok(!t.toLowerCase().includes(f.toLowerCase()), `${type}: filler: ${f}`);
    assert.doesNotMatch(t, /[–—]/, type);
    assert.doesNotMatch(t, HEALTH, type);
  }
});

test("two kinds of company get drafts whose lines differ almost entirely", () => {
  for (const type of TYPES) {
    const la = longLines(out[type].a), lb = new Set(longLines(out[type].b));
    assert.ok(la.length > 5, type);
    assert.ok(la.filter((l) => lb.has(l)).length / la.length < 0.25, `${type}: overlap`);
  }
});

test("each objection is answered by what it is about, in the objection's own words", () => {
  for (const type of ["objection_responses", "internal_business_case", "executive_brief", "risk_assessment"]) {
    const t = out[type].a;
    const cost = oneBlock(t, "Can it fit our cost codes and workflows");
    assert.doesNotMatch(cost, /price|pricing|how much|per seat|\$90,000/i, `${type}: cost codes answered with a price defence`);
    assert.match(cost, /cost codes/i, type);
    assert.match(cost, /workflows/i, type);
    const res = oneBlock(t, "Why do commercial builders move off residential tools");
    assert.match(res, /residential/i, type);
    assert.match(res, /narrow tasks/i, `${type}: uses the alternative's words`);
    assert.match(res, /commercial builders/i, type);
    const acc = oneBlock(t, "How does it integrate with our accounting system");
    assert.match(acc, /accounting system/i, type);
    assert.doesNotMatch(acc, /price|how much/i, type);
    const price = oneBlock(t, "How much does it cost");
    assert.match(price, /\$90,000 a year \(hypothetical annual cost\)/, type);
    const x = out[type].b;
    assert.match(oneBlock(x, "Will messages reach users on every carrier"), /every carrier/i, type);
    assert.match(oneBlock(x, "We already send through our cloud provider"), /cloud provider/i, type);
    assert.match(oneBlock(x, "How long does integration take"), /integration/i, type);
    assert.doesNotMatch(oneBlock(x, "Will messages reach users on every carrier"), /price|how much/i, type);
  }
});

test("the objection answers differ from one objection to the next", () => {
  const t = out.objection_responses.a;
  const answers = ["How does it integrate with our accounting system", "Can it fit our cost codes and workflows", "Why do commercial builders move off residential tools", "How much does it cost"].map((o) => oneBlock(t, o));
  for (let i = 0; i < answers.length; i++) for (let j = i + 1; j < answers.length; j++) {
    const si = new Set(longLines(answers[i])), sj = longLines(answers[j]);
    assert.ok(!sj.some((l) => si.has(l) && !/^(?:Say|If they|Confirm)/.test(l)), `answers ${i} and ${j} share a line`);
  }
});

test("objection_responses: spoken answers, a follow-up line and what to confirm, for every objection", () => {
  for (const [t, I] of [[out.objection_responses.a, A], [out.objection_responses.b, B]]) {
    for (const o of I.known_objections.split("; ")) {
      const blk = oneBlock(t, o.replace(/[?]$/, ""));
      assert.match(blk, /^Say: "/m, o);
      assert.match(blk, /^If they push: "/m, o);
      assert.match(blk, /^Confirm before you say it: /m, o);
    }
  }
});

test("internal_business_case: a memo with To, From, a subject, the ask first, and the figures flagged as page claims", () => {
  const t = out.internal_business_case.b;
  assert.match(t, /^Subject: /m);
  assert.match(t, /^To: VP Engineering/m);
  assert.match(t, /^From: Priya Nair, Head of Platform Engineering/m);
  const first = t.split("\n").filter((l) => l.trim() && !/^(?:#|Subject|To|From|Not given)/.test(l))[0];
  assert.match(first, /Pingwell/);
  assert.match(t, /vendor's own page|vendor page|claims on the vendor/i);
  assert.match(t, /\$30,000 a year \(hypothetical annual cost\)/);
  assert.match(t, /the sign-up flow relaunches in the spring/);
});

test("email_to_stakeholder: a subject, a greeting, short paragraphs, a close and a signature", () => {
  for (const [t, I] of [[out.email_to_stakeholder.a, A], [out.email_to_stakeholder.b, B]]) {
    assert.match(t, /^Subject: .+/m);
    assert.match(t, /^Hi,?$|^Hello,?$|^Hi /m);
    assert.ok(t.trimEnd().includes(I.champion_name));
    const body = t.split(/^Subject: /m)[1];
    assert.ok(body.split("\n\n").length >= 4);
  }
});

test("presentation_talking_points: spoken lines with a time for each part", () => {
  for (const t of [out.presentation_talking_points.a, out.presentation_talking_points.b]) {
    assert.ok((t.match(/^Say: "/gm) || []).length >= 6);
    assert.ok((t.match(/\(\d+ minutes?\)/g) || []).length >= 5);
  }
});

test("roi_one_pager: finished copy that says plainly that no return figure was given", () => {
  for (const t of [out.roi_one_pager.a, out.roi_one_pager.b]) {
    assert.match(t, /no return figure|no figure for the return|return is not stated/i);
    assert.doesNotMatch(t, /\|/);
  }
});

test("competitive_comparison: one section for each alternative, built from the alternative's own words", () => {
  const t = out.competitive_comparison.a;
  for (const alt of A.competitive_context.split("; ")) assert.ok(t.split("\n").some((l) => /^###? /.test(l) && has(l, alt)), alt);
  assert.match(oneBlock(t, "a residential project tool built for narrow tasks"), /narrow tasks/);
  assert.doesNotMatch(t, /\|\s*Rate/);
});

test("risk_assessment: every risk has what it means here and how it is covered, and the conclusion names the conditions", () => {
  for (const [t, I] of [[out.risk_assessment.a, A], [out.risk_assessment.b, B]]) {
    for (const o of I.known_objections.split("; ")) assert.ok(has(t, o.replace(/[?]$/, "")), o);
    assert.match(t, /^## Conclusion/m);
    assert.match(t, /^Likelihood and impact are not rated here/m);
  }
});

test("thin inputs: what is missing is said once, near the top, and the draft still reads", async () => {
  for (const type of TYPES) {
    const t = await call({ asset_type: type, your_solution: "Tallyhub, an invoicing tool for freelancers" });
    assert.equal((t.match(/Not given:/g) || []).length, 1, type);
    assert.ok(t.split("\n").findIndex((l) => l.startsWith("Not given:")) < 8, type);
    assert.doesNotMatch(t, PLACEHOLDER, type);
    assert.doesNotMatch(t, /\((?:urgency_drivers|budget_context|key_value_points|competitive_context)\)/, type);
    assert.doesNotMatch(t, /[–—]/, type);
    assert.ok(t.length > 600, type);
  }
});
