// Run 22 round 3 (rev-w1): a template for the wrong kind of seller or buyer. (1) a pay as you go communications API read as per site, per link contracts; objections that
// were scaffolding; (6) an owner led restaurant deal planned with an enterprise template; (7) an IoT SIM planned with a fixed links frame, its strongest proof set aside;
// H1 a shipping platform case that said no part matched the courier rates pain and was a question list. Invented companies only (rule B81 for this public repo).
// Run: node --no-warnings --test tests/run22-rev-w1-round3.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  assert.ok(j.result && j.result.content, JSON.stringify(j));
  return j.result.content.map((c) => c.text).join("\n");
};
const future = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const FIXED_LINKS = /price per site|per site or link|site survey|delivery time of each link|cutover|cut-over|fallback link|wave plan|pilot sites/i;

// ---- fault 1: a pay as you go communications API --------------------------------------------------------------------------------------------------
const DIALPATH = "Dialpath communications platform (voice and SMS APIs, WhatsApp, SIP trunking, phone numbers and voice agents on a carrier network), a cloud communications platform: a carrier network connecting 150+ countries, an API suite for messaging and voice, and a platform for building voice agents";
const PLAN = {
  account_name: "online store account (Dialpath customer)", industry: "online retail", current_arr: 36000, known_contacts: "developers (champion)", current_products: DIALPATH,
  competitive_threats: "messaging providers that route messages through third party bottlenecks", your_solution: DIALPATH,
  account_notes: "Objections: What is available on pay as you go?; Can I get started with SMS on 10DLC, WhatsApp, or Verify API?; Is there a contract or commitment required?; Are there volume discounts available?; Can I set spending limits on my account?; Do prices vary by country?.",
};
test("a pay as you go API seller gets usage wording: no sites, links or cutover anywhere in the account plan", async () => {
  const t = await call("account_plan_builder", PLAN);
  assert.doesNotMatch(t, FIXED_LINKS);
  assert.doesNotMatch(t, /per site, per link/);
  assert.match(t, /rate card|volume tiers|committed monthly volume/i, "the commercial step is a usage one");
});
test("each of the six objections gets its own concrete answer, with the products and the question's own words", async () => {
  const t = await call("account_plan_builder", PLAN);
  const blocks = t.split(/\n(?=### \d+\. )/).slice(1).map((b) => b.split("\n## ")[0]);
  assert.equal(blocks.length, 6);
  for (const b of blocks) assert.doesNotMatch(b, /Answer the exact question asked in two parts|What decision does the answer to this change/, b.split("\n")[0]);
  const body = blocks.map((b) => b.split("\n").slice(1).join(" "));
  assert.equal(new Set(body).size, 6, "six different answers");
  assert.match(blocks[0], /voice and SMS APIs|SIP trunking|phone numbers/, "pay as you go: which products are on it");
  assert.match(blocks[1], /10DLC/); assert.match(blocks[1], /registered|registration|approval/i);
  assert.match(blocks[3], /volume/i); assert.doesNotMatch(blocks[3], /sites or links|cut-over/i);
  assert.match(blocks[4], /limit/i); assert.match(blocks[4], /reach|reached|stop|alert/i);
  assert.match(blocks[5], /country|countries/i);
});
test("the alternative that routes through third parties is tied to the carrier network part", async () => {
  const t = await call("account_plan_builder", PLAN);
  assert.match(t, /"messaging providers that route messages through third party bottlenecks" points to [^\n]*carrier network/);
  assert.doesNotMatch(t, /None of the parts maps/);
});

// ---- fault 6: an owner led restaurant deal ---------------------------------------------------------------------------------------------------------
const TILLMATE = "Tillmate restaurant ERP, point of sale and back office software for restaurants and bakeries: billing, inventory, purchase, accounting and loyalty, with mobile apps, on premise, in the cloud or as a hybrid";
const OWNER = {
  deal_name: "restaurants and bakeries deal for Tillmate", target_close_date: future(70), current_stage: "evaluation", buyer_champion: "business owner",
  technical_evaluators: "cashiers and billing staff, sales representatives who take orders on a mobile app, head office and branch staff",
  known_requirements: "run every operation from billing to balance sheets in one system with real-time visibility, and grow with minimal staff and little training; setup within a day or two (page claim)",
  blockers: "How do I choose the right plan for my business?; Can I cancel or switch plans whenever I want?; Can I purchase the Tillmate POS edition for desktop on a subscription model, i.e., pay for the licence year on year?; Will my data be safe and secured?",
  your_solution: TILLMATE,
};
test("an owner led deal is planned small: no procurement, legal redlines, vendor registration or separate economic buyer", async () => {
  const t = await call("mutual_action_plan_generator", OWNER);
  const tl = t.split("## Mutual Action Plan Timeline")[1].split("## Risks & Blockers")[0];
  assert.doesNotMatch(tl, /redlines|vendor registration|Phase \d: Procurement|Phase \d: Commercial & Legal|security and compliance review of the vendor/i);
  assert.doesNotMatch(t, /Economic buyer/i);
  assert.match(tl, /business owner/);
  assert.ok((tl.match(/### Phase \d/g) || []).length <= 3, "three phases at most");
});
test("cashiers and billing staff are daily users who try the product on a real day, not owners of the finance review", async () => {
  const t = await call("mutual_action_plan_generator", OWNER);
  const row = t.split("\n").find((l) => l.startsWith("| **Evaluator** | cashiers and billing staff"));
  assert.ok(row, "their row");
  assert.doesNotMatch(row, /finance review|budget approval|commercial terms/i);
  assert.match(row, /try|real day|daily|work/i);
  const tl = t.split("## Mutual Action Plan Timeline")[1].split("## Risks & Blockers")[0];
  assert.match(tl, /cashiers and billing staff/);
});
test("a question about buying a licence or a subscription is answered about the ways of buying, not as usage billing", async () => {
  const t = await call("mutual_action_plan_generator", OWNER);
  const row = t.split("\n").find((l) => l.startsWith("| Can I purchase the Tillmate POS edition"));
  assert.ok(row);
  assert.doesNotMatch(row, /billable|connected, sending|worked invoice/i);
  assert.match(row, /subscription/i); assert.match(row, /licen[cs]e/i);
});
test("a deal with a named economic buyer, procurement contact and no owner keeps the full plan", async () => {
  const t = await call("mutual_action_plan_generator", { deal_name: "Bank deal for Gridway", target_close_date: future(90), buyer_champion: "Head of Payments", economic_buyer: "CFO", procurement_contact: "Sourcing Manager", your_solution: "Gridway, a payments platform" });
  assert.match(t, /Phase \d: Procurement/); assert.match(t, /redlines/i);
});

// ---- fault 7: an IoT SIM ---------------------------------------------------------------------------------------------------------------------------
const SIMBRIDGE = "Simbridge IoT connectivity platform (global IoT SIM, SoftSIM, IoT eSIM and a connectivity management platform), a global IoT SIM that connects devices across 600+ networks on one profile, with a REST API, webhooks and network insight tools on top";
const SIM = {
  customer_name: "logistics account (Simbridge customer)", your_solution: SIMBRIDGE, solution_price: 60000, primary_value_driver: "multiple",
  known_metrics: "A customer named Pat Lee says: 'It took three days to resolve network issues with our previous provider. It only takes 10 minutes on average with Simbridge.'; A fleet customer lowered its data usage by more than 50% after gaining device transparency (page claim); Certified ISO 27001 (page claim)",
  current_process: "today they handle it with local SIMs bought country by country; roaming SIMs; eSIM platforms; providers that resell another operator's carrier deal",
};
test("an IoT SIM seller gets SIM steps, not a fixed links frame", async () => {
  const t = await call("roi_business_case_builder", SIM);
  assert.doesNotMatch(t, FIXED_LINKS);
  assert.doesNotMatch(t, /per site or link on a term contract/);
  assert.match(t, /test SIMs|SIMs in the buyer's devices|first live (?:data|SIM)/i);
});
test("a quoted change (three days to ten minutes, a drop in data used) is proof with its label, not set aside; roaming SIMs match a SIM part", async () => {
  const t = await call("roi_business_case_builder", SIM);
  const res = t.split("## Results you quoted")[1].split("\n## ")[0];
  assert.match(res, /three days to resolve network issues/); assert.match(res, /lowered its data usage by more than 50%/);
  assert.match(res, /page claim|from the company's own pages|a claim/i);
  const notValue = (res.match(/Not value figures[^\n]*/) || [""])[0];
  assert.doesNotMatch(notValue, /three days|data usage/);
  assert.match(notValue, /ISO 27001/);
  const roaming = t.split("\n").find((l) => l.startsWith("| Roaming SIMs"));
  assert.ok(roaming); assert.doesNotMatch(roaming, /none matches by its words/);
});

// ---- H1: a shipping platform ------------------------------------------------------------------------------------------------------------------------
const PARCELHOP = "Parcelhop, an ecommerce platform that helps Indian sellers manage shipping, logistics and fulfilment from one dashboard: multi courier shipping with rate comparison, fulfilment and warehousing, one click checkout and WhatsApp marketing";
const SHIP = {
  customer_name: "SMB online retailers and D2C brands account (Parcelhop customer)", industry: "Retail", company_size: "enterprise", your_solution: PARCELHOP, solution_price: 18000, primary_value_driver: "cost_reduction",
  known_metrics: "A seller: delivery rate jumped from 46% to 72% within one month (customer words)",
  current_process: "today they handle it with dealing with courier partners one by one, with confusing rates and limited serviceability (a seller's words)",
};
test("the courier rates pain is tied to the multi courier shipping part, and the case is written out in words", async () => {
  const t = await call("roi_business_case_builder", SHIP);
  const row = t.split("\n").find((l) => l.startsWith("| Dealing with courier partners"));
  assert.ok(row); assert.match(row, /multi courier shipping/); assert.doesNotMatch(row, /none matches by its words/);
  const words = t.split("## The case in words")[1];
  assert.ok(words, "a section that writes the case out");
  const sec = words.split("\n## ")[0];
  assert.match(sec, /courier partners one by one/); assert.match(sec, /\$18,000/); assert.match(sec, /multi courier shipping/);
  assert.doesNotMatch(sec, /\d\s*%\s*ROI|payback of/i);
});
test("an enterprise size on an SMB customer, and a dollar price for an Indian seller, are flagged once", async () => {
  const t = await call("roi_business_case_builder", SHIP);
  assert.match(t, /company_size[^\n]*enterprise[^\n]*SMB|SMB[^\n]*company_size[^\n]*enterprise/i);
  assert.match(t, /India[^\n]*(?:rupee|convert)/i);
});
