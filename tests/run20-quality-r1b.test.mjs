// Run 20 round 1b (D92): the judges' findings on the 12 Revenue tools, one behaviour per test.
// Written before the fixes. Companies are invented (Lanehop, Branchwire, Spendrill ...): real companies stay in the private project repo (B81).
// Run: node --test tests/run20-quality-r1b.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const rpc = async (method, params) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  return r.json();
};
const call = async (name, args) => {
  const j = await rpc("tools/call", { name, arguments: args });
  return { isError: !!j.result.isError, text: j.result.content.map((c) => c.text).join("\n") };
};
const BRACKET = /\[(?!Your name\])[A-Z][^\]\n]{2,60}\]/;   // an unfilled placeholder such as [Challenge 1: describe current pain]
const NO_ANSWER = /Ask what lies behind it and what would change their mind/;

// ---- invented companies (one per sector) ----
const LANEHOP = "Lanehop, a routing and dispatch platform for last-mile delivery: route planning, live re-planning, driver app, proof of delivery and a control tower, for fleets of vans and bikes";
const BRANCHWIRE = "Branchwire managed SD-WAN, business connectivity for banks: managed SD-WAN, MPLS, internet leased lines and a network operations centre";
const SPENDRILL = "Spendrill, an expense and spend management platform: receipt capture, approvals, corporate cards, reimbursements and reports that post to the ledger";
const ANSWERLOOP = "Answerloop, AI agents that resolve customer support tickets: an agent platform with guardrails, a review queue and an evaluation set built from your history";
const EDGEFUND = "Edgefund from Edgefund Capital, systematic investment strategies powered by machine learning: custom portfolios for institutions and a platform that adds forecasts and explanations to an existing investment process";
const STACKPILOT = "Stackpilot, a test automation platform for engineering teams: test runs on real browsers, flaky test detection and release dashboards";
const ITSERV = "Northgate Services, managed IT services: service desk, application support and cloud operations on a monthly service fee";

// ---------------------------------------------------------------------------------------------------------------------------
// win_loss_analyzer: scored 1 on all 9 (a blank "Competitor: Not specified" template that used none of the deal inputs)
// ---------------------------------------------------------------------------------------------------------------------------
test("win_loss_analyzer competitor_analysis: deal inputs are used, no blank template, the outcome and reason are asked for", async () => {
  const r = await call("win_loss_analyzer", {
    analysis_type: "competitor_analysis",
    deal_details: "Lanehop deals with retail chains; roles involved: Chief Operating Officer, Head of Last-mile, IT; the alternatives buyers use are described as manual spreadsheet routing; a legacy TMS that plans once a day. The deal value and cycle figures are hypothetical.",
    deal_value: 150000, sales_cycle_days: 120, stakeholders_involved: "Chief Operating Officer, Head of Last-mile (champion), IT", your_solution: LANEHOP,
  });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, /Competitor: Not specified/);
  assert.doesNotMatch(r.text, /\[competitor\]|Provide win\/loss data against this competitor/);
  assert.doesNotMatch(r.text, BRACKET);
  assert.match(r.text, /\$150,000/);
  assert.match(r.text, /120 days/);
  assert.match(r.text, /manual spreadsheet routing/);
  assert.match(r.text, /a legacy TMS that plans once a day/);
  for (const who of ["Chief Operating Officer", "Head of Last-mile", "IT"]) assert.match(r.text, new RegExp(who));
  assert.match(r.text, /Lanehop/);
  // the sector's usual loss reasons (logistics tech) and a precise ask for what is missing
  assert.match(r.text, /We already have a TMS|Drivers will not use a new app/);
  assert.match(r.text, /`deal_outcome`/);
  assert.match(r.text, /`loss_reason`/);
  assert.match(r.text, /`competitor_won`/);
  assert.match(r.text, /not given|not supplied/i);
});

test("win_loss_analyzer: a different company gets its own alternatives and sector, not the logistics text", async () => {
  const r = await call("win_loss_analyzer", {
    analysis_type: "competitor_analysis", your_solution: SPENDRILL, deal_value: 30000, sales_cycle_days: 90,
    deal_details: "Spendrill deals with finance teams; the alternatives buyers use are described as manual expense filing and bill checking; corporate cards from the bank.",
    stakeholders_involved: "CFO (buyer), finance controller, HR",
  });
  assert.match(r.text, /manual expense filing and bill checking/);
  assert.match(r.text, /corporate cards from the bank/);
  assert.match(r.text, /Our ERP already does this|Security and compliance review|Migration will disrupt the close/);
  assert.doesNotMatch(r.text, /TMS|dispatch/i);
  assert.match(r.text, /CFO/);
  assert.match(r.text, /\$30,000/);
});

test("win_loss_analyzer single_deal with no outcome still gives the structure and asks for the outcome", async () => {
  const r = await call("win_loss_analyzer", { analysis_type: "single_deal", your_solution: ANSWERLOOP, deal_value: 80000, stakeholders_involved: "Head of Customer Experience (champion), CISO (against)" });
  assert.doesNotMatch(r.text, /Not specified/);
  assert.match(r.text, /`deal_outcome`/);
  assert.match(r.text, /Head of Customer Experience/);
  assert.match(r.text, /CISO/);
  assert.match(r.text, /AI gets answers wrong|Data privacy/);
});

test("win_loss_analyzer lost deal: the stated reason and the sector reasons both appear", async () => {
  const r = await call("win_loss_analyzer", { analysis_type: "single_deal", deal_outcome: "lost", your_solution: BRANCHWIRE, loss_reason: "price per site was higher than the national operator", competitor_won: "the incumbent operator", deal_value: 120000 });
  assert.match(r.text, /price per site was higher than the national operator/);
  assert.match(r.text, /the incumbent operator/);
  assert.match(r.text, /Price per site is higher than the national operator|Migration risk across many sites/);
  assert.doesNotMatch(r.text, BRACKET);
});

test("win_loss_analyzer portfolio: no invented benchmark percentages", async () => {
  const r = await call("win_loss_analyzer", { analysis_type: "deal_portfolio", your_solution: STACKPILOT });
  assert.doesNotMatch(r.text, /25-35%|25-40%|>40%|>30% cite|>2x industry/);
  assert.doesNotMatch(r.text, BRACKET);
  assert.match(r.text, /Stackpilot/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// account_plan_builder: four contacts collapsed into one "Champion" row; a CIO the user called the buyer tagged "technical influencer";
// objections echoed with no plan; placeholders; QuantumStreet read with the corporate finance committee
// ---------------------------------------------------------------------------------------------------------------------------
const rowsOf = (text, header) => {
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.startsWith(header));
  assert.ok(i >= 0, `table ${header} not found`);
  const out = [];
  for (let j = i + 2; j < lines.length && lines[j].startsWith("|"); j++) out.push(lines[j]);
  return out;
};
test("account_plan_builder: each contact is its own row with the role the user stated", async () => {
  const r = await call("account_plan_builder", { account_name: "Vaultline Bank", industry: "Financial services", current_arr: 80000, your_solution: "Vigilwall, a cloud attack surface platform: asset discovery, exposure ranking and takedowns",
    known_contacts: "analysts in SOC and security operations (champion), CISO (buyer), threat intelligence teams, brand protection",
    competitive_threats: "periodic scans that report isolated alerts; a generic dark web feed", account_notes: "Objections: Why Vigilwall over a generic dark web feed?; Does it integrate with Splunk and ServiceNow?" });
  const rows = rowsOf(r.text, "| Contact you gave");
  assert.equal(rows.length, 4, rows.join("\n"));
  assert.match(rows[0], /analysts in SOC and security operations/);
  assert.match(rows[0], /Champion/);
  assert.match(rows[1], /CISO/);
  assert.match(rows[1], /Buyer/);
  assert.doesNotMatch(rows[1], /Champion/);
  assert.match(rows[2], /threat intelligence teams/);
  assert.match(rows[3], /brand protection/);
  // objections get their own answers
  assert.doesNotMatch(r.text, NO_ANSWER);
  assert.match(r.text, /Splunk/);
  assert.match(r.text, /Confirm before you say it/);
  assert.doesNotMatch(r.text, BRACKET);
  assert.doesNotMatch(r.text, /\[your strength area\]|\[emerging requirement\]/);
});
test("account_plan_builder: a CIO the user calls the buyer is the buyer, not a technical influencer", async () => {
  const r = await call("account_plan_builder", { account_name: "Northmill Bank", industry: "Banking", your_solution: BRANCHWIRE, known_contacts: "IT Infrastructure Head (champion), CIO (buyer), Chief Commercial Officer" });
  const rows = rowsOf(r.text, "| Contact you gave");
  assert.equal(rows.length, 3);
  const cio = rows.find((x) => /\| CIO/.test(x));
  assert.match(cio, /Buyer/);
  assert.doesNotMatch(cio, /[Tt]echnical influencer/);
  assert.doesNotMatch(r.text, /\| CIO[^\n]*Technical influencer/);
});
test("account_plan_builder: an investment seller gets the investment committee, not the corporate finance one", async () => {
  const r = await call("account_plan_builder", { account_name: "Pension allocator account", industry: "Asset allocators (pensions, insurers, endowments)", your_solution: EDGEFUND,
    known_contacts: "portfolio manager (champion), CIO (buyer), risk teams, compliance committees" });
  assert.doesNotMatch(r.text, /The CFO signs|close the books|ERP integration|Finance Controller/i);
  assert.match(r.text, /investment committee|portfolio manager|explain/i);
  const cio = rowsOf(r.text, "| Contact you gave").find((x) => /\| CIO/.test(x));
  assert.match(cio, /Buyer/);
});
test("account_plan_builder: no contacts and no threats still gives specific questions, no placeholders", async () => {
  const r = await call("account_plan_builder", { account_name: "Example Retail Co", your_solution: LANEHOP });
  assert.doesNotMatch(r.text, BRACKET);
  assert.match(r.text, /Lanehop/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// deal_strategy_coach: every blocker got "Ask what lies behind it..."; an invented "win rate drops 70%+" claim; generic tactics
// ---------------------------------------------------------------------------------------------------------------------------
test("deal_strategy_coach: each blocker is answered by its kind and says what to confirm; nothing invented", async () => {
  const r = await call("deal_strategy_coach", { deal_name: "Retail deal for Spendrill", deal_value: 30000, deal_stage: "proposal", champion_status: "no_champion", your_solution: SPENDRILL,
    competitors: "manual expense filing; corporate cards from the bank",
    blockers: "How is a Spendrill card different from a bank debit card?; Does Spendrill integrate with NetSuite and Salesforce?; How long does it take to set up?" });
  assert.doesNotMatch(r.text, NO_ANSWER);
  assert.doesNotMatch(r.text, /win rate drops|70%/);
  assert.doesNotMatch(r.text, /ROI > 3x/);
  const blk = r.text.split("### Blocker Mitigation")[1].split("### Sector notes")[0];
  assert.match(blk, /bank debit card/);
  assert.match(blk, /NetSuite and Salesforce/);
  assert.match(blk, /system by system/i);
  assert.match(blk, /dated plan/i);
  assert.equal((blk.match(/Confirm before you say it/g) || []).length, 3);
  // the competitors are a table with a row each
  assert.match(r.text, /\| Manual expense filing \|/);
  assert.match(r.text, /\| Corporate cards from the bank \|/);
  assert.doesNotMatch(r.text, BRACKET);
});
test("deal_strategy_coach: a blocker nobody planned for still gets an answer built from its own words", async () => {
  const r = await call("deal_strategy_coach", { deal_name: "Pilot", deal_stage: "demo", your_solution: LANEHOP, blockers: "Our dispatchers prefer their own spreadsheets" });
  assert.doesNotMatch(r.text, NO_ANSWER);
  assert.match(r.text, /Our dispatchers prefer their own spreadsheets/);
  assert.match(r.text, /Confirm before you say it/);
});
test("deal_strategy_coach: an unknown economic buyer is asked about with the sector's usual signer", async () => {
  const r = await call("deal_strategy_coach", { deal_name: "Network deal", deal_stage: "discovery", your_solution: BRANCHWIRE });
  assert.match(r.text, /Economic Buyer Unknown/);
  assert.match(r.text, /CIO signs/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// discovery_question_bank: brackets, the whole pain pasted again and again, nothing for the prospect's role or the product's parts
// ---------------------------------------------------------------------------------------------------------------------------
test("discovery_question_bank: no placeholder, the pains are split, role and parts get questions", async () => {
  const r = await call("discovery_question_bank", { framework: "meddpicc", prospect_industry: "Banking", prospect_role: "CFO", your_solution: SPENDRILL,
    known_pain_points: "manual expense capture and bill checking, a 60 day reimbursement cycle, policy violations and cash leakage, with teams stuck on legacy systems", deal_stage: "discovery" });
  assert.doesNotMatch(r.text, BRACKET);
  assert.doesNotMatch(r.text, /\[Economic Buyer\]|\[your differentiator\]|\[stakeholder\]|\[competitor\]/);
  assert.match(r.text, /Questions for CFO/);
  assert.match(r.text, /On "manual expense capture and bill checking"/);
  assert.match(r.text, /On "a 60 day reimbursement cycle"/);
  assert.match(r.text, /Questions on what Spendrill covers/);
  assert.match(r.text, /Receipt capture: "How do you handle this today/);
  // the long pain is quoted whole only once (the context line)
  assert.equal((r.text.match(/manual expense capture and bill checking, a 60 day reimbursement cycle/g) || []).length, 1);
});
test("discovery_question_bank: a finance buyer of a SaaS-sector product is not asked about onboarding and drop-off", async () => {
  const r = await call("discovery_question_bank", { framework: "meddpicc", prospect_industry: "B2B SaaS and software", prospect_role: "CFO", your_solution: "Billwise, a billing platform for subscription companies: invoicing, subscription management, revenue recognition and collections",
    known_pain_points: "proration logic breaks and finance spends cycles reconciling" });
  assert.doesNotMatch(r.text, /Where do customers drop off/);
  assert.match(r.text, /Invoicing: "How do you handle this today/);
  assert.match(r.text, /Which finance numbers are late or reworked/);
});
test("discovery_question_bank: an investment seller is asked in investment words", async () => {
  const r = await call("discovery_question_bank", { framework: "meddpicc", prospect_industry: "Pensions and endowments", prospect_role: "CIO", your_solution: EDGEFUND, known_pain_points: "static factor models that nobody can explain" });
  assert.doesNotMatch(r.text, /month-end close|ledger|card spend|ERP/i);
  assert.match(r.text, /investment committee|your committee|risk limits|reporting/i);
});
