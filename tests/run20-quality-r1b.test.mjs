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

// ---------------------------------------------------------------------------------------------------------------------------
// mutual_action_plan_generator: Saturday dates, a one-week evaluation, security milestones owned by the champion, generic milestones
// ---------------------------------------------------------------------------------------------------------------------------
const isoDates = (text) => [...text.matchAll(/\b(20\d\d-\d\d-\d\d)\b/g)].map((m) => m[1]);
const timeline = (text) => text.split("## Mutual Action Plan Timeline")[1].split("## Risks & Blockers")[0];
const futureDate = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
test("mutual_action_plan_generator: no milestone falls on a Saturday or Sunday, whatever the close date", async () => {
  for (const days of [74, 75, 76, 77, 78, 79, 80]) {
    const close = futureDate(days);
    const r = await call("mutual_action_plan_generator", { deal_name: "Retail deal for Lanehop", target_close_date: close, current_stage: "evaluation", your_solution: LANEHOP, buyer_champion: "Head of Last-mile", economic_buyer: "Chief Operating Officer", technical_evaluators: "IT Director, Group Logistics Manager" });
    assert.equal(r.isError, false, r.text);
    const dates = isoDates(timeline(r.text));
    assert.ok(dates.length >= 12, `only ${dates.length} dates`);
    for (const d of dates) { const w = new Date(d + "T00:00:00Z").getUTCDay(); assert.ok(w !== 0 && w !== 6, `${d} (close ${close}) is a weekend day`); }
  }
});
test("mutual_action_plan_generator: the evaluation gets real time and the security review goes to the buyer's IT or security reviewer", async () => {
  const close = futureDate(75);
  const r = await call("mutual_action_plan_generator", { deal_name: "Retail deal for Lanehop", target_close_date: close, current_stage: "evaluation", your_solution: LANEHOP,
    buyer_champion: "Head of Last-mile", economic_buyer: "Chief Operating Officer", technical_evaluators: "IT Director, Security Lead, Group Logistics Manager" });
  const head = r.text.match(/### Phase \d: Evaluation[^\n]*\((\d{4}-\d\d-\d\d) to (\d{4}-\d\d-\d\d)\)/);
  assert.ok(head, "evaluation phase heading with dates");
  let n = 0; const d = new Date(head[1] + "T00:00:00Z"); const end = new Date(head[2] + "T00:00:00Z");
  while (d < end) { d.setUTCDate(d.getUTCDate() + 1); if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) n++; }
  assert.ok(n >= 10, `the evaluation lasts only ${n} working days`);
  const sec = r.text.split("\n").find((l) => /security and compliance review/i.test(l) && l.startsWith("|"));
  assert.ok(sec, "a security review milestone");
  assert.match(sec, /Security Lead|IT Director/);
  assert.doesNotMatch(sec, /Head of Last-mile/);
  // reference calls once only
  assert.ok((r.text.match(/Reference calls?/gi) || []).length <= 2, "reference calls are not repeated in two phases");
});
test("mutual_action_plan_generator: the milestones follow how the sector buys", async () => {
  const close = futureDate(90);
  const base = { target_close_date: close, current_stage: "evaluation" };
  const log = (await call("mutual_action_plan_generator", { ...base, deal_name: "Retail deal", your_solution: LANEHOP, buyer_champion: "Head of Last-mile" })).text;
  assert.match(log, /pilot at one hub/i);
  const it = (await call("mutual_action_plan_generator", { ...base, deal_name: "BFSI deal", your_solution: ITSERV, buyer_champion: "IT Manager" })).text;
  assert.match(it, /transition/i); assert.match(it, /knowledge transfer/i); assert.match(it, /SLA/);
  const inv = (await call("mutual_action_plan_generator", { ...base, deal_name: "Pension deal", your_solution: EDGEFUND, buyer_champion: "portfolio manager", technical_evaluators: "risk teams, compliance committees" })).text;
  assert.match(inv, /investment committee/i); assert.match(inv, /due diligence|first allocation/i);
  assert.doesNotMatch(inv, /close the books|reconciliation|finance controller/i);
  const sec = (await call("mutual_action_plan_generator", { ...base, deal_name: "Bank deal", your_solution: "Vigilwall, a cloud attack surface platform: asset discovery and exposure ranking", buyer_champion: "SOC analysts" })).text;
  assert.match(sec, /proof of value/i);
  const net = (await call("mutual_action_plan_generator", { ...base, deal_name: "Branch network", your_solution: BRANCHWIRE, buyer_champion: "IT Infrastructure Head" })).text;
  assert.match(net, /site survey/i); assert.match(net, /pilot sites|wave/i);
  for (const t of [log, it, inv, sec, net]) { assert.doesNotMatch(t, BRACKET); assert.doesNotMatch(t, /\[Your name\]|\[SE name\]|\[Exec name\]/); }
});
test("mutual_action_plan_generator: each blocker is answered by its kind with an owner who can act on it", async () => {
  const r = await call("mutual_action_plan_generator", { deal_name: "Bank deal", target_close_date: futureDate(80), current_stage: "evaluation", your_solution: SPENDRILL, buyer_champion: "Finance Controller", economic_buyer: "CFO", technical_evaluators: "IT Director",
    blockers: "Does Spendrill integrate with NetSuite?; Does Spendrill support GST and e-invoicing?; How long does it take to set up?" });
  assert.doesNotMatch(r.text, NO_ANSWER);
  const rows = r.text.split("\n").filter((l) => /^\| .*(NetSuite|GST|set up)/.test(l) && /Open/.test(l));
  assert.equal(rows.length, 3, rows.join("\n"));
  assert.match(rows[0], /system by system/i); assert.match(rows[0], /IT Director/);
  assert.match(rows[1], /exact rule/i);
  assert.match(rows[2], /dated plan/i);
});

// ---------------------------------------------------------------------------------------------------------------------------
// proposal_section_writer: the product description pasted again and again, a bracket for the rollout, unsourced "first and only",
// raw customer-quote wording, placeholders in every other section
// ---------------------------------------------------------------------------------------------------------------------------
test("proposal_section_writer executive_summary: uses every input once, no bracket, claims flagged, quotes cleaned", async () => {
  const r = await call("proposal_section_writer", { section_type: "executive_summary", your_solution: LANEHOP, customer_name: "Hollybrook retail account", customer_industry: "Retail",
    customer_challenges: "manual or outdated route planning, failed deliveries and no real time visibility",
    key_differentiators: "the world's first agentic routing platform where humans govern and agents act, with forward deployed engineers who train themselves out",
    pricing: "$150,000 a year (hypothetical)", success_metrics: "plan routes faster; customers on the home page say they cut planning time by half (customer words)", tone: "consultative" });
  assert.doesNotMatch(r.text, BRACKET);
  assert.ok((r.text.match(/route planning, live re-planning, driver app/g) || []).length <= 1, "the product description is pasted more than once");
  assert.match(r.text, /Hollybrook retail account/);
  assert.match(r.text, /manual or outdated route planning/);
  assert.match(r.text, /the world's first agentic routing platform where humans govern and agents act, with forward deployed engineers who train themselves out/);
  assert.match(r.text, /\$150,000 a year \(hypothetical\)/);
  assert.match(r.text, /Claims to source/i);
  assert.match(r.text, /world's first/);
  assert.doesNotMatch(r.text, /on the home page say/);
  assert.match(r.text, /Customers report/);
  assert.match(r.text, /pilot at one hub/i, "the rollout comes from the sector when none is given");
});
test("proposal_section_writer: every section type is free of placeholders and made-up figures", async () => {
  const tools = (await rpc("tools/list", {})).result.tools;
  const types = tools.find((t) => t.name === "proposal_section_writer").inputSchema.properties.section_type.enum;
  assert.equal(types.length, 10);
  for (const t of types) {
    const r = await call("proposal_section_writer", { section_type: t, your_solution: BRANCHWIRE, customer_name: "Northmill Bank", customer_industry: "Banking", customer_challenges: "outages at branch sites; several network providers" });
    assert.equal(r.isError, false, t);
    assert.doesNotMatch(r.text, BRACKET, t);
    assert.doesNotMatch(r.text, /X{2,},X{3}|\bXX%|\$X\b|XXX\+|\bX months\b/, `${t}: made-up figure placeholder`);
    assert.match(r.text, /Branchwire/, t);
  }
});
test("proposal_section_writer: the audience changes the note at the top", async () => {
  const a = (await call("proposal_section_writer", { section_type: "executive_summary", your_solution: LANEHOP, customer_name: "Hollybrook", primary_audience: "c_suite" })).text;
  const b = (await call("proposal_section_writer", { section_type: "executive_summary", your_solution: LANEHOP, customer_name: "Hollybrook", primary_audience: "technical" })).text;
  assert.notEqual(a, b);
  assert.match(a, /Audience/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// email_sequence_generator: the whole proof block pasted into three emails, emails 4 and 5 blank frames, the product description pasted
// ---------------------------------------------------------------------------------------------------------------------------
const FIRST_NAME_OK = /\[(?:First Name|Your name)\]/g;
test("email_sequence_generator cold_outreach: one proof item per email, emails 4 and 5 are written, no placeholders", async () => {
  const proof = "Hollybrook Foods cut dispatch planning time by 66% with Lanehop (case study title); Customer quote: expanded from 500 to 4,000 trucks while improving fleet efficiency by 24% in under six months; Named a Leader in the 2026 Analyst Quadrant for Last Mile Delivery (home page)";
  const r = await call("email_sequence_generator", { sequence_type: "cold_outreach", target_persona: "Chief Operating Officer", target_industry: "Retail", your_solution: LANEHOP,
    key_value_prop: "plan routes faster and keep every delivery promise; the page claims 99.5% on time deliveries (page claim)", specific_pain_point: "last mile is the costliest phase of the supply chain, with fragmented routes and manual route planning",
    social_proof: proof, call_to_action: "20-minute call", sender_context: "Account Executive at Lanehop" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text.replace(FIRST_NAME_OK, ""), BRACKET);
  assert.doesNotMatch(r.text, /\[(?:resource|insight|challenge|Company|relevant|Result|Describe|describe|link)[^\]]*\]/);
  const body = (n) => r.text.split(`### Email ${n}`)[1].split(/\n### Email \d|\n## Sequence Tips/)[0];
  // the whole proof block is not pasted: no email holds all three items
  for (const n of [1, 2, 3, 4, 5]) assert.ok(!(/Hollybrook/.test(body(n)) && /500 to 4,000/.test(body(n))), `email ${n} pastes the whole proof block`);
  assert.match(body(2) + body(3), /66%/);
  assert.match(body(3), /500 to 4,000|66%/);
  // the label words of the inputs are not in an email a buyer reads
  for (const n of [1, 2, 3, 4, 5]) assert.doesNotMatch(body(n), /\(page claim\)|\(case study title\)|\(customer quote\)|\(home page\)/, `email ${n}`);
  // emails 4 and 5 say something
  assert.match(body(4), /last mile is the costliest phase|Chief Operating Officer|your Head of/);
  assert.ok(body(4).length > 350 && body(5).length > 350);
  assert.match(body(5), /1\. /);
  // the product description is not pasted into the emails
  assert.ok(!r.text.split("## Before you send")[0].split("## Solution:")[1].replace(/^[^\n]*\n/, "").includes("route planning, live re-planning, driver app"), "the description is pasted into an email");
  // the proof used is listed with its source for a check before sending
  assert.match(r.text, /## Before you send/);
  assert.match(r.text, /case study title/);
});
test("email_sequence_generator: other sequence types have no unfilled bracket phrases", async () => {
  for (const sequence_type of ["warm_follow_up", "post_demo", "re_engagement"]) {
    const r = await call("email_sequence_generator", { sequence_type, target_persona: "CIO", your_solution: BRANCHWIRE, specific_pain_point: "outages at branch sites" });
    assert.doesNotMatch(r.text.replace(FIRST_NAME_OK, ""), /\[[A-Za-z][^\]\n]{3,}\]/, sequence_type);
  }
});

// ---------------------------------------------------------------------------------------------------------------------------
// demo_script_builder: the description pasted six times, objections with no answer, bracket value statements, feature strings as step titles
// ---------------------------------------------------------------------------------------------------------------------------
test("demo_script_builder: short name, split features, every objection answered by its kind, no placeholder", async () => {
  const r = await call("demo_script_builder", { demo_type: "first_look", primary_audience: "Chief Operating Officer", attendees: "Head of Last-mile, IT Director", customer_industry: "Retail", your_solution: LANEHOP,
    key_pain_points: "manual or outdated route planning, failed deliveries, no real time visibility", competitor_context: "manual spreadsheet routing", demo_duration: 30,
    must_show_features: "live re-planning, driver app that works offline, integration with an existing TMS or ERP in weeks (page claims)",
    known_objections: "Does it work offline?; Does Lanehop integrate with our ERP and TMS?; How long does set up take?" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, BRACKET);
  assert.doesNotMatch(r.text, /\[Your name\]/);
  assert.ok((r.text.match(/route planning, live re-planning, driver app/g) || []).length <= 1, "description pasted more than once");
  assert.doesNotMatch(r.text, NO_ANSWER);
  const obj = r.text.split("**Anticipated Objections:**")[1].split("### Part 5")[0];
  assert.equal((obj.match(/Confirm before you say it/g) || []).length, 3);
  assert.match(obj, /with no signal|low-signal/i);          // offline
  assert.match(obj, /system by system/i);                    // integration
  assert.match(obj, /dated plan/i);                          // set up
  // features: one step each, the claim label kept out of the script and listed to prove
  assert.match(r.text, /\*\*Step 1: Live re-planning\*\*/);
  assert.match(r.text, /\*\*Step 2: Driver app that works offline\*\*/);
  assert.match(r.text, /\*\*Step 3: Integration with an existing TMS or ERP in weeks\*\*/);
  assert.match(r.text, /Claims to prove before you say them/);
  // the pains are separate, the audience and the room are used
  assert.match(r.text, /1\. Manual or outdated route planning/);
  assert.match(r.text, /Head of Last-mile/);
  assert.match(r.text, /operations leader/);
  assert.match(r.text, /A live re-plan when an order changes/);
});
test("demo_script_builder: a services seller is shown what a services buyer wants to see, and no objection frame has blanks", async () => {
  const r = await call("demo_script_builder", { demo_type: "first_look", your_solution: ITSERV, primary_audience: "CIO", customer_industry: "Banking" });
  assert.match(r.text, /sample monthly service report/i);
  assert.doesNotMatch(r.text, BRACKET);
  assert.doesNotMatch(r.text, /Typically \[timeframe\]|\[your implementation steps\]|\[system\]/);
});

// ---------------------------------------------------------------------------------------------------------------------------
// pricing_negotiation_guide: deal value and leverage ignored; software terms for an investment seller; placeholders
// ---------------------------------------------------------------------------------------------------------------------------
test("pricing_negotiation_guide budget_objection: the deal value, the leverage and the approver are used", async () => {
  const r = await call("pricing_negotiation_guide", { scenario: "budget_objection", deal_value: 150000, your_solution: LANEHOP, approval_authority: "Chief Operating Officer",
    your_leverage: "the world's first agentic routing platform where humans govern and agents act", value_delivered: "Hollybrook Foods cut dispatch planning time by 66% (case study title)" });
  assert.doesNotMatch(r.text, BRACKET);
  assert.match(r.text, /\$150,000/);
  assert.match(r.text, /the world's first agentic routing platform where humans govern and agents act/);
  assert.match(r.text, /Chief Operating Officer/);
  assert.match(r.text, /\$75,000/);            // two instalments of the deal value
  assert.match(r.text, /Hollybrook Foods cut dispatch planning time by 66%/);
  assert.match(r.text, /pilot at one hub|one hub/i);
  assert.match(r.text, /source/i);             // a "world's first" claim needs its source
});
test("pricing_negotiation_guide: an investment seller is not offered software terms", async () => {
  const r = await call("pricing_negotiation_guide", { scenario: "budget_objection", deal_value: 250000, your_solution: EDGEFUND, your_leverage: "explainable models with signal attribution" });
  assert.doesNotMatch(r.text, /monthly vs annual payment|phased implementation|per user|seats?\b/i);
  assert.match(r.text, /first allocation|tranche|phased allocation|mandate/i);
  assert.match(r.text, /\$250,000/);
  assert.doesNotMatch(r.text, BRACKET);
});
test("pricing_negotiation_guide: every scenario is free of placeholders and uses the deal value", async () => {
  const tools = (await rpc("tools/list", {})).result.tools;
  const scenarios = tools.find((t) => t.name === "pricing_negotiation_guide").inputSchema.properties.scenario.enum;
  assert.equal(scenarios.length, 7);
  for (const scenario of scenarios) {
    const r = await call("pricing_negotiation_guide", { scenario, deal_value: 90000, discount_requested: 10, your_solution: BRANCHWIRE, your_leverage: "managed end to end, one contract, one point of contact", competitor_price: "the incumbent operator quotes about 12% less" });
    assert.equal(r.isError, false, scenario);
    assert.doesNotMatch(r.text, BRACKET, scenario);
    assert.doesNotMatch(r.text, /\bX%|\bXX|\$X\b|\(Example claim/, `${scenario}: made-up figure`);
    assert.match(r.text, /\$90,000/, scenario);
    assert.match(r.text, /one contract, one point of contact/, scenario);
    assert.match(r.text, /Branchwire/, scenario);
  }
});

// ---------------------------------------------------------------------------------------------------------------------------
// champion_enablement_kit: [Challenge 1: describe current pain] and the like, objections with non-answers, the description pasted
// ---------------------------------------------------------------------------------------------------------------------------
test("champion_enablement_kit internal_business_case: no placeholder, objections answered by kind, value points used", async () => {
  const r = await call("champion_enablement_kit", { asset_type: "internal_business_case", your_solution: LANEHOP, champion_role: "Head of Last-mile", target_stakeholder: "Chief Operating Officer",
    key_value_points: "plan routes faster; keep every delivery promise", known_objections: "Do our drivers need to be online all the time?; Does it connect to our TMS?; How long until the first hub is live?",
    competitive_context: "manual spreadsheet routing; a legacy TMS that plans once a day", budget_context: "$150,000 a year (hypothetical)", urgency_drivers: "the peak season starts in November" });
  assert.equal(r.isError, false);
  assert.doesNotMatch(r.text, BRACKET);
  assert.doesNotMatch(r.text, /\$XX|X,XXX|\bXX%/);
  assert.doesNotMatch(r.text, NO_ANSWER);
  assert.ok((r.text.match(/route planning, live re-planning, driver app/g) || []).length <= 1);
  assert.match(r.text, /plan routes faster/); assert.match(r.text, /keep every delivery promise/);
  assert.match(r.text, /manual spreadsheet routing/); assert.match(r.text, /a legacy TMS that plans once a day/);
  assert.match(r.text, /\$150,000 a year \(hypothetical\)/);
  assert.match(r.text, /the peak season starts in November/);
  assert.equal((r.text.match(/Confirm before you say it/g) || []).length, 3);
  assert.match(r.text, /operations leader/);
  assert.match(r.text, /pilot hub|pilot at one hub/i);
});
test("champion_enablement_kit: the same role as champion and target is noticed", async () => {
  const r = await call("champion_enablement_kit", { asset_type: "executive_brief", your_solution: SPENDRILL, champion_role: "CFO", target_stakeholder: "CFO" });
  assert.match(r.text, /same role/i);
});
test("champion_enablement_kit: every asset type is free of placeholders and made-up figures", async () => {
  const tools = (await rpc("tools/list", {})).result.tools;
  const types = tools.find((t) => t.name === "champion_enablement_kit").inputSchema.properties.asset_type.enum;
  assert.equal(types.length, 8);
  for (const asset_type of types) {
    const r = await call("champion_enablement_kit", { asset_type, your_solution: BRANCHWIRE, champion_role: "IT Infrastructure Head", target_stakeholder: "CIO", key_value_points: "fewer outages across branch sites", known_objections: "Is the price per site higher than the national operator?" });
    assert.equal(r.isError, false, asset_type);
    assert.doesNotMatch(r.text, BRACKET, asset_type);
    assert.doesNotMatch(r.text, /\$XX|X,XXX|\bXX%|\$X\b|\bX:1|X months/, `${asset_type}: made-up figure`);
    assert.match(r.text, /Branchwire/, asset_type);
    assert.match(r.text, /fewer outages across branch sites/i, asset_type);
  }
});
