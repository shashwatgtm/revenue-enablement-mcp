// Run 29G loop (test first): a sector block whose first line is a plain lead-in paragraph moves whole into section 3; no sector heading in
// section 3 is left empty and no sector paragraph is left in section 2 without its heading. Invented companies only (rule B81).
// Run: node --test tests/run29g-loop.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};
const part = (t, a, b) => t.split(a)[1].split(b)[0];
const DEFAULT_TOOL = "deal_strategy_coach", DEFAULT_ARGS = { deal_name: "regional chain rollout", deal_value: 20000, deal_stage: "proposal", your_solution: "Shelfwise, store operations software for retail chains: task manager, audit app and dashboards" };
const emptyHeadings = (s3) => { const l = s3.split("\n"); return l.filter((x, i) => x.startsWith("#### ") && (() => { const n = l.slice(i + 1).find((y) => y.trim()); return !n || n.startsWith("#"); })()); };

test("discovery_question_bank: the lead-in of a sector block moves with its heading", async () => {
  const t = await call("discovery_question_bank", { framework: "meddpicc", prospect_industry: "retail banking", prospect_role: "Head of Digital",
    your_solution: "Trailmark, product analytics software for software companies: in-app guides, surveys and usage analytics", known_pain_points: "users drop off in the first week" });
  const s2 = part(t, "\n## 2. The framework applied\n", "\n## 3. Sector checks\n"), s3 = part(t, "\n## 3. Sector checks\n", "\n## 4. Gaps\n");
  assert.deepEqual(emptyHeadings(s3), [], "a sector heading left empty in section 3");
  assert.doesNotMatch(s2, /questions are about a software company's own customers/, "a sector paragraph left in section 2 without its heading");
  assert.match(s3, /questions are about a software company's own customers/);
});

// Round 2 (from the judges' reasons on pools P5 and P6): a must-show list the user labels as claims ("(page claims)") is said as claims, never
// turned into demo steps ("hundreds of partners use ...", "most customers up and running within two weeks", "works for ...").
test("demo_script_builder: items labelled as claims are claims to prove, not steps to show", async () => {
  const t = await call("demo_script_builder", { demo_type: "first_look", primary_audience: "Head of Operations",
    your_solution: "Gridmark, billing software for electrical subcontractors: pay applications, lien waivers, compliance documents and collections",
    key_pain_points: "pay applications are rebuilt by hand every month",
    must_show_features: "launched in 2019; hundreds of partners use Gridmark; most customers up and running within two weeks; works for electrical, mechanical and plumbing subcontractors (page claims)" });
  const s2 = part(t, "\n## 2. The framework applied\n", "\n## 3. Sector checks\n");
  const steps = (s2.split("## Demo Script")[1] || "").split(/\n### Part 4/)[0];
  for (const c of ["hundreds of partners use Gridmark", "most customers up and running within two weeks", "works for electrical"]) {
    assert.doesNotMatch(steps, new RegExp(`^#### [^\\n]*${c}`, "im"), `a claim turned into a demo step: ${c}`);
    assert.doesNotMatch(steps, new RegExp(`On screen: [^\\n]*${c}`, "i"), `a claim put on screen: ${c}`);
  }
  assert.match(s2, /## Claims to prove before you say them[\s\S]*hundreds of partners use Gridmark/);
});

// Round 2 (judges on pools P5 and P6 read the imperative note to the assistant as an instruction inside a tool answer, rule B86): the note says
// what each section holds; it gives no order.
test("the note to the assistant states what the sections hold and gives no order", async () => {
  const t = await call(DEFAULT_TOOL, DEFAULT_ARGS);
  const note = t.split("\n## 6. Note to the assistant\n")[1];
  assert.ok(note && note.trim().split("\n").length >= 2);
  for (const l of note.trim().split("\n")) assert.doesNotMatch(l, /^(?:Write|Use|Add|Ask|Keep|Invent|Do not|Don't)\b/, `an order in the note: ${l}`);
  assert.match(note, /^Section 2 is /m);
});

// Round 3 (judges on pools P5 and P6): a funding round named anywhere in a must-show item ("a Series A funding", "Khosla Ventures led its A-round")
// is a claim, never a demo step.
test("demo_script_builder: a funding round is a claim, not a step", async () => {
  const t = await call("demo_script_builder", { demo_type: "first_look", primary_audience: "Head of Operations",
    your_solution: "Gridmark, billing software for electrical subcontractors: pay applications, lien waivers, compliance documents and collections",
    must_show_features: "pay applications; a Series A funding; Northpeak Ventures led its A-round (page claims)" });
  const steps = (part(t, "\n## 2. The framework applied\n", "\n## 3. Sector checks\n").split("## Demo Script")[1] || "").split(/\n### Part 4/)[0];
  for (const c of ["a Series A funding", "Northpeak Ventures led its A-round"]) assert.doesNotMatch(steps, new RegExp(`On screen: [^\\n]*${c}`, "i"), `a funding fact put on screen: ${c}`);
});

// Round 4 (judges on pools P5 and P6: "Profitable and bootstrapped without venture capital" and "mostly in North America and Europe" became demo
// steps): a fact about how the company is funded or where its customers are is a claim, never a demo step.
test("demo_script_builder: funding and customer location facts are claims, not steps", async () => {
  const t = await call("demo_script_builder", { demo_type: "first_look", primary_audience: "Head of Operations",
    your_solution: "Gridmark, billing software for electrical subcontractors: pay applications, lien waivers, compliance documents and collections",
    must_show_features: "Profitable and bootstrapped without venture capital; customers mostly in North America and Europe; pay applications (page claims)" });
  const steps = (part(t, "\n## 2. The framework applied\n", "\n## 3. Sector checks\n").split("## Demo Script")[1] || "").split(/\n### Part 4/)[0];
  for (const c of ["Profitable and bootstrapped", "mostly in North America and Europe"]) assert.doesNotMatch(steps, new RegExp(`On screen: [^\\n]*${c}`, "i"), `a company fact put on screen: ${c}`);
});

// Round 5 (judge MJ1 on pool P6: "CTOs and CXOs who put their own money in" and "leadership from enterprise software companies" stayed demo steps):
// a list of plural acronyms cut at semicolons is one item, and a fact about the leadership team is a claim.
test("demo_script_builder: investor and leadership facts cut at semicolons stay one claim, never a step", async () => {
  const t = await call("demo_script_builder", { demo_type: "first_look", primary_audience: "Head of Operations",
    your_solution: "Gridmark, billing software for electrical subcontractors: pay applications, lien waivers, compliance documents and collections",
    must_show_features: "backed by investors alongside 30+ CIOs; CTOs and CXOs who put their own money in; leadership from enterprise software companies; pay applications (page claims)" });
  const steps = (part(t, "\n## 2. The framework applied\n", "\n## 3. Sector checks\n").split("## Demo Script")[1] || "").split(/\n### Part 4/)[0];
  for (const c of ["CTOs and CXOs", "leadership from enterprise software companies"]) assert.doesNotMatch(steps, new RegExp(`On screen: [^\\n]*${c}`, "i"), `a company fact put on screen: ${c}`);
});
