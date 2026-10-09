// Run 21c job 3 (test first): win_loss_analyzer returned a skeleton (a table of what the user gave, a list of generic investigation
// questions, an empty battle card table). It now returns a finished short write-up built from the deal inputs, and says plainly what the
// outcome and the reason would add when they are missing. Two invented companies of different kinds (a construction management platform
// and a business messaging platform). Run: node --no-warnings --test tests/run21c-draft-win_loss_analyzer.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "win_loss_analyzer", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

const A = {
  analysis_type: "single_deal", deal_outcome: "lost",
  your_solution: "Gridbeam, a construction management platform for general contractors: job costing, change orders and field daily logs",
  deal_details: "A mid-size general contractor with three live projects. The pilot ran on one project for six weeks. The deal value and cycle figures are hypothetical.",
  loss_reason: "The controller said the accounting system already does job costing and our price per project was higher",
  competitor_won: "Siteledger", deal_value: 85000, sales_cycle_days: 110,
  stakeholders_involved: "Owner (against), Controller (neutral), Project Manager (champion)",
};
const B = {
  analysis_type: "single_deal", deal_outcome: "won",
  your_solution: "Pingrelay, a business messaging platform that sends order and appointment notices over WhatsApp and SMS",
  deal_details: "A national retailer sending order notices to customers. They chose us after the template approval took two days in the pilot. The deal value and cycle figures are hypothetical.",
  competitor_won: "Textmint", deal_value: 42000, sales_cycle_days: 65,
  stakeholders_involved: "Head of Customer Support (champion), IT Security Lead (neutral), VP Operations (buyer)",
};
const A_NOOUT = {
  analysis_type: "competitor_analysis",
  your_solution: "Gridbeam, a construction management platform for general contractors: job costing, change orders and field daily logs",
  deal_details: "Gridbeam deals with general contractors; the alternatives buyers use are described as disconnected spreadsheets and manual workflows; a legacy job cost system on an office server. The deal value and cycle figures are hypothetical.",
  deal_value: 60000, sales_cycle_days: 90, stakeholders_involved: "Owner, Controller, Project Manager",
};
const B_NOOUT = {
  analysis_type: "competitor_analysis",
  your_solution: "Pingrelay, a business messaging platform that sends order and appointment notices over WhatsApp and SMS",
  deal_details: "Pingrelay deals with retailers; the alternatives buyers use are described as several separate SMS vendors; in-house scripts that call the carrier. The deal value and cycle figures are hypothetical.",
  deal_value: 30000, sales_cycle_days: 50, stakeholders_involved: "Head of Customer Support, IT Security Lead, VP Operations",
};
const A_PORT = {
  analysis_type: "deal_portfolio", your_solution: A.your_solution,
  multiple_deals: "Deal one, won, 70000 dollars, 80 days, the owner wanted job costing on phones, beat a spreadsheet process\nDeal two, lost, 90000 dollars, 120 days, price per project, lost to Siteledger\nDeal three, no decision, 40000 dollars, 200 days, controller froze the budget",
};

const BRACKET = /\[[^\]\n]*\]|\{[^}\n]*\}|your product|\bTBD\b|Insert/i;
const DASH = /[–—]/;
const HEALTH = /health|clinic|pharmac|patient|hospital|medical/i;
const FILLER = [
  "Common Root Causes to Investigate", "Loss Categories", "Recovery Opportunity", "Request honest feedback call", "Be helpful, stay relevant",
  "Did we have a true champion?", "For best results, combine this analysis with direct buyer feedback", "Value Not Proven", "Sales Execution",
  "What was the real reason (not only the stated one), and when did the deal actually turn?", "Battle card, once the outcome is known",
  "What the analysis will look at", "Stay top of mind", "Investigation Framework", "Common Causes",
];
const lines = (t) => t.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30);
const overlap = (a, b) => { const sb = new Set(lines(b)); const la = lines(a); return la.filter((l) => sb.has(l)).length / Math.max(1, la.length); };
const hasAll = (t, items, label) => { for (const s of items) assert.ok(t.toLowerCase().includes(s.toLowerCase()), `${label}: missing ${JSON.stringify(s)}`); };

test("lost deal: a finished write-up that uses every input", async () => {
  const t = await call(A);
  hasAll(t, ["Gridbeam", "Siteledger", "$85,000", "110 days", "Owner", "Controller", "Project Manager", "against", "neutral", "champion",
    "the accounting system already does job costing", "our price per project was higher", "The pilot ran on one project for six weeks", "hypothetical",
    "construction management platform for general contractors"], "lost");
  assert.match(t, /Gridbeam lost[^\n]*Siteledger/, "one sentence says who lost to whom");
  assert.match(t, /\$85,000[^\n]*110 days|110 days[^\n]*\$85,000/, "the value and the cycle are in one sentence");
  // the stated reason is read against the sector's usual reasons, in a sentence about this deal
  assert.match(t, /price|accounting|job cost/i);
  assert.doesNotMatch(t, BRACKET);
  assert.doesNotMatch(t, DASH);
  assert.doesNotMatch(t, HEALTH);
  for (const f of FILLER) assert.ok(!t.includes(f), `filler: ${f}`);
});

test("won deal: the write-up says the deal was won, against whom, and keeps the reason the user gave", async () => {
  const t = await call(B);
  hasAll(t, ["Pingrelay", "Textmint", "$42,000", "65 days", "Head of Customer Support", "IT Security Lead", "VP Operations", "champion", "neutral",
    "the template approval took two days in the pilot", "hypothetical", "WhatsApp and SMS"], "won");
  assert.match(t, /Pingrelay won[^\n]*Textmint/);
  assert.doesNotMatch(t, BRACKET);
  assert.doesNotMatch(t, DASH);
  assert.doesNotMatch(t, HEALTH);
  for (const f of FILLER) assert.ok(!t.includes(f), `filler: ${f}`);
});

test("no outcome: the write-up covers what the inputs allow and says once what the outcome and the reason would add", async () => {
  for (const [name, args, alts, people] of [["A", A_NOOUT, ["disconnected spreadsheets and manual workflows", "a legacy job cost system on an office server"], ["Owner", "Controller", "Project Manager"]],
    ["B", B_NOOUT, ["several separate SMS vendors", "in-house scripts that call the carrier"], ["Head of Customer Support", "IT Security Lead", "VP Operations"]]]) {
    const t = await call(args);
    hasAll(t, [...alts, ...people, "hypothetical", args.deal_value === 60000 ? "$60,000" : "$30,000", args.sales_cycle_days + " days"], name);
    // run 22 (rev-w3): named once at the end under "To sharpen this, give:" with what each input would change
    assert.match(t, /To sharpen this, give:[\s\S]*`deal_outcome`/, name);
    assert.equal((t.match(/To sharpen this, give:/g) || []).length, 1, `${name}: the limit is said once`);
    assert.match(t, /deal_outcome/);
    assert.match(t, /loss_reason/);
    assert.doesNotMatch(t, /\n\|---\|---\|\n\| \*\*Positioning\*\*/);
    assert.doesNotMatch(t, BRACKET);
    assert.doesNotMatch(t, DASH);
    assert.doesNotMatch(t, HEALTH);
    for (const f of FILLER) assert.ok(!t.includes(f), `${name} filler: ${f}`);
    // at least one finished sentence about this deal, not a label
    assert.match(t, new RegExp(`${args.your_solution.split(",")[0]}[^\\n]*(?:alternatives|compared|against)`, "i"), name);
  }
});

test("portfolio: the deals the user listed are counted from their own lines, nothing else is invented", async () => {
  const t = await call(A_PORT);
  hasAll(t, ["Deal one", "Deal two", "Deal three", "the owner wanted job costing on phones", "price per project", "controller froze the budget", "Siteledger"], "portfolio");
  assert.match(t, /3 deals/);
  assert.match(t, /1 won/);
  assert.match(t, /1 lost/);
  assert.match(t, /1 no decision/);
  assert.doesNotMatch(t, /\d+(?:-\d+)?%/, "no percentage is invented");
  assert.doesNotMatch(t, BRACKET);
  assert.doesNotMatch(t, DASH);
});

test("a construction platform and a messaging platform get different drafts", async () => {
  const a = await call(A), b = await call(B);
  assert.ok(overlap(a, b) < 0.25, `lost vs won overlap ${overlap(a, b)}`);
  const an = await call(A_NOOUT), bn = await call(B_NOOUT);
  assert.ok(overlap(an, bn) < 0.25, `no outcome overlap ${overlap(an, bn)}`);
  // the sector notes follow the kind of company
  assert.doesNotMatch(b, /change order|RFI|punch list|subcontractor/i);
  assert.doesNotMatch(a, /WhatsApp|SMS|template approval/i);
});

test("a sparse call still reads well: one 'Not given' line, no placeholder", async () => {
  const t = await call({ analysis_type: "single_deal", deal_outcome: "lost" });
  assert.match(t, /To sharpen this, give:/);
  assert.equal((t.match(/To sharpen this, give:/g) || []).length, 1);
  assert.doesNotMatch(t, BRACKET);
  assert.doesNotMatch(t, DASH);
  assert.doesNotMatch(t, /your solution/i);
});
