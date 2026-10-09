// Run 21c job 3 (test first): demo_script_builder returned an outline: a configuration table, research and set-up checklists, a coaching
// list of do and don't, and steps whose spoken lines were the same for every company with the user's words squeezed in as labels.
// It is now a draft: spoken lines and on-screen steps for each feature or flow the user gave, the objections answered where they come up,
// and an opening and a close built from the pain and outcome inputs. Two invented companies of very different kinds, plain words.
// Run: node --no-warnings --test tests/run21c-draft-demo_script_builder.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "demo_script_builder", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

// Company A: a construction management platform. Company B: a business messaging platform.
const A = {
  demo_type: "first_look", primary_audience: "CFO", attendees: "Controller, Project Executives, IT Director", customer_industry: "general contractors",
  your_solution: "Quarrywise, a construction management platform for general contractors: bid management, change orders, daily logs and subcontractor payments",
  key_pain_points: "change orders approved by email and billed late, daily logs kept on paper, subcontractor payments chased by phone",
  competitor_context: "spreadsheets and a generic project tool", demo_duration: 40,
  must_show_features: "change order approval from the field; daily log on a phone; pay applications with retainage; SOC 2 Type 2 report",
  known_objections: "How does it integrate with our accounting system?; Can it fit our cost codes?; How much does it cost?",
  desired_outcome: "Agree a pilot on two live projects",
};
const B = {
  demo_type: "technical_deep_dive", primary_audience: "VP Engineering", attendees: "Security Lead, Head of Product", customer_industry: "online marketplaces",
  your_solution: "Pingwell, a business messaging platform: text messages, one time passwords and delivery reports through one API",
  key_pain_points: "one time passwords arrive late and users abandon sign-up, carrier rejections are not visible to developers",
  competitor_context: "a bulk SMS reseller", demo_duration: 25,
  must_show_features: "send a one time password through the API, delivery report for every message, sender ID registration, 99.95% delivery uptime (page claims)",
  known_objections: "Will messages reach users on every carrier?; We already send through our cloud provider; How long does integration take?",
  desired_outcome: "A technical trial on our sandbox",
};

const PLACEHOLDER = /\[[^\]\n]{1,80}\]|\{[^}\n]{1,80}\}|your product|\bTBD\b|Insert|\[Name\]|\[Company\]/i;
const FILLER = [
  "Lead with outcomes, not features", "Show everything you can do", "Talk more than listen", "Ignore attendee body language", "Avoid tough questions",
  "Research company news and priorities", "Sample data loaded", "Backup plan ready", "Customize this script based on pre-demo discovery",
  "Which of your own numbers would this change, and by how much?", "How does this compare to how you're doing it today?",
  "What's driving your interest in looking at solutions like this?", "What does success look like for you?", "Thanks everyone for joining",
  "Do not defend the price in isolation", "Show it live, with the prospect's own example if you have one", "Great, that confirms what I thought",
  "Pattern of an answer", "Leave time for questions", "Personalize examples", "Send follow-up email within 2 hours", "Update CRM with notes",
];
const HEALTH = /clinic|pharmac|healthcare|health care|hospital|patient/i;
const longLines = (t) => t.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30);

const [a, b] = [await call(A), await call(B)];
const section = (t, from, to) => t.split(from)[1].split(to)[0];

test("every input value appears in the draft, in the user's words", () => {
  for (const [t, I] of [[a, A], [b, B]]) {
    for (const v of [I.primary_audience, I.customer_industry, I.competitor_context, I.desired_outcome, I.your_solution.split(",")[0]]) assert.ok(t.toLowerCase().includes(v.toLowerCase()), v);
    // run 22: the description is not pasted back as a block; its named parts are what the steps are built from
    assert.ok(!t.includes(I.your_solution), "the whole description pasted");
    for (const part of I.attendees.split(", ")) assert.ok(t.toLowerCase().includes(part.toLowerCase()), part);
    const spoken = t.split("\n").filter((l) => /^Say: "/.test(l)).join("\n").toLowerCase();
    for (const part of I.key_pain_points.split(/, |; /)) assert.ok(spoken.includes(part.toLowerCase()), `spoken: ${part}`);
    for (const part of I.must_show_features.replace(/\s*\(page claims\)/, "").split(/, |; /)) assert.ok(t.toLowerCase().includes(part.toLowerCase()), part);
    for (const part of I.known_objections.split("; ")) assert.ok(t.includes(part), part);
    assert.ok(t.includes(String(I.demo_duration)));
  }
});

test("a figure keeps its number and its source label, and is said in a spoken line", () => {
  assert.match(b, /99\.95% delivery uptime/);
  assert.match(b, /99\.95% delivery uptime[^\n]*page claims/);
  assert.match(b.split("## Demo Script")[1], /^Say: "[^\n]*99\.95% delivery uptime/m);
});

test("no placeholder, no filler, no dashes, no healthcare words", () => {
  for (const t of [a, b]) {
    assert.doesNotMatch(t, PLACEHOLDER);
    for (const f of FILLER) assert.ok(!t.toLowerCase().includes(f.toLowerCase()), `filler: ${f}`);
    assert.doesNotMatch(t, /[–—]/);
    assert.doesNotMatch(t, HEALTH);
  }
});

test("the artifact is a script: spoken lines and on-screen steps for every feature to show", () => {
  for (const [t, I] of [[a, A], [b, B]]) {
    const flow = section(t, "### Part 3", "### Part 4");
    const feats = I.must_show_features.replace(/\s*\(page claims\)/, "").split(/, |; /).filter((x) => !/SOC 2|99\.95/.test(x));
    assert.equal((flow.match(/^On screen: /gm) || []).length, feats.length);
    assert.equal((flow.match(/^Say: "/gm) || []).length >= feats.length, true);
    for (const f of feats) {
      const step = flow.split(/\*\*Step \d+: /).find((s) => s.toLowerCase().startsWith(f.toLowerCase().slice(0, 20)));
      assert.ok(step, `a step for ${f}`);
      assert.match(step, /^On screen: /m);
      assert.match(step, /^Say: "/m);
    }
  }
});

test("a credential or uptime claim is said, not shown", () => {
  const flowA = section(a, "### Part 3", "### Part 4");
  assert.doesNotMatch(flowA, /\*\*Step \d+: SOC 2/i);
  assert.match(a.split("## Demo Script")[1], /^Say: "[^\n]*SOC 2 Type 2 report/m);
  const flowB = section(b, "### Part 3", "### Part 4");
  assert.doesNotMatch(flowB, /\*\*Step \d+: 99\.95/);
});

test("the opening and the close are built from the pains and the outcome", () => {
  const openA = section(a, "### Part 1", "### Part 2"), closeA = a.split("### Part 5")[1].split("\n## ")[0];
  assert.match(openA, /change orders approved by email and billed late/);
  assert.match(openA, /Agree a pilot on two live projects/);
  assert.match(closeA, /Agree a pilot on two live projects/);
  assert.match(closeA, /change order approval from the field/i);
  const openB = section(b, "### Part 1", "### Part 2"), closeB = b.split("### Part 5")[1].split("\n## ")[0];
  assert.match(openB, /one time passwords arrive late and users abandon sign-up/);
  assert.match(openB, /A technical trial on our sandbox/);
  assert.match(closeB, /A technical trial on our sandbox/);
  assert.match(closeB, /sender ID registration/i);
});

test("each objection is quoted and answered in spoken words where it would come up, and none is answered by the old coaching text", () => {
  for (const [t, I] of [[a, A], [b, B]]) {
    const script = t.split("## Demo Script")[1].split("\n## ")[0];
    for (const o of I.known_objections.split("; ")) {
      const at = script.indexOf(o);
      assert.ok(at > 0, o);
      const after = script.slice(at, at + 1500);
      assert.match(after, /\nSay: "/, `spoken answer after: ${o}`);
    }
  }
  // the price question belongs at the ask, the integration question with the room's IT owner
  assert.match(a.split("### Part 5")[1], /How much does it cost\?/);
  assert.match(a, /IT Director/);
  assert.doesNotMatch(a, /How to answer:|Ask first:/);
});

test("the room is used: every attendee is asked something in their own role", () => {
  const confirm = section(a, "### Part 2", "### Part 3");
  for (const who of ["Controller", "Project Executives", "IT Director"]) assert.match(confirm, new RegExp(who));
  const confirmB = section(b, "### Part 2", "### Part 3");
  for (const who of ["Security Lead", "Head of Product"]) assert.match(confirmB, new RegExp(who));
});

test("the competitor is named in a spoken line", () => {
  assert.match(section(a, "### Part 3", "### Part 4"), /Say: "[^\n]*spreadsheets and a generic project tool/);
  assert.match(section(b, "### Part 3", "### Part 4"), /Say: "[^\n]*a bulk SMS reseller/);
});

test("two different kinds of company get drafts whose lines differ almost entirely", () => {
  const la = longLines(a), lb = new Set(longLines(b));
  const same = la.filter((l) => lb.has(l));
  assert.ok(same.length / la.length < 0.25, `overlap ${same.length}/${la.length}: ${same.slice(0, 6).join(" | ")}`);
  // the sector notes follow the kind
  assert.doesNotMatch(a.split("### Sector notes")[1] || "", /one time password|carrier|SMS/i);
  assert.doesNotMatch(b.split("### Sector notes")[1] || "", /change order|retainage|subcontractor/i);
});

test("a missing input is named once and the draft still reads whole", async () => {
  const t = await call({ demo_type: "executive_overview", your_solution: "Quarrywise, a construction management platform for general contractors: bid management, change orders, daily logs and subcontractor payments" });
  // run 22: what was not given is named once, at the end, as "To sharpen this, give: ..." with what each would change
  assert.equal((t.match(/To sharpen this, give:/g) || []).length, 1);
  assert.match(t, /To sharpen this, give:[^\n]*primary_audience/);
  assert.match(t, /To sharpen this, give:[^\n]*key_pain_points/);
  assert.match(t, /To sharpen this, give:[^\n]*must_show_features/);
  assert.match(t, /To sharpen this, give:[^\n]*desired_outcome/);
  assert.doesNotMatch(t, PLACEHOLDER);
  assert.doesNotMatch(t, /[–—]/);
  assert.match(t, /^On screen: /m);
  assert.match(t, /^Say: "/m);
  for (const f of FILLER) assert.ok(!t.toLowerCase().includes(f.toLowerCase()), `filler: ${f}`);
});

test("features that do not fit in a short demo are listed, not dropped", async () => {
  const t = await call({ demo_type: "first_look", your_solution: "Pingwell", demo_duration: 4, must_show_features: "alpha view; beta view; gamma view; delta view; epsilon view" });
  const shown = (t.match(/^\*\*Step \d+: /gm) || []).length;
  assert.ok(shown >= 1 && shown < 5);
  assert.match(t, /Not used in the draft:/);
  for (const f of ["alpha view", "beta view", "gamma view", "delta view", "epsilon view"]) assert.ok(t.includes(f), f);
});

test("when no feature can be run live, the steps come from the parts named in the description", async () => {
  const t = await call({ ...B, must_show_features: "Named a leader by an analyst firm (page claims)" });
  const flow = section(t, "### Part 3", "### Part 4");
  assert.match(flow, /\*\*Step 1: (?:Text messages|One time passwords|Delivery reports)/);
  assert.match(flow, /^On screen: /m);
  assert.doesNotMatch(flow, /workflow the buyer described, end to end/i);
  assert.match(t, /Named a leader by an analyst firm/);
});
