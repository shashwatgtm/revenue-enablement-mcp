// Run 22 round 6 (rev-w2): the company or product name is in every answer, verbatim. A sealed company lost it in four tools after a rule that shortened a two word name
// ("Name digital" to "Name"). Invented names of many shapes go through demo_script_builder, champion_enablement_kit and discovery_question_bank; the check is the one of the
// harness (E2): the answer, in lower case, holds the product or the company exactly as typed. All names are invented.
// Run: node --no-warnings --test tests/run22-rev-w2-names.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

const DESCS = [
  "a platform for field teams: order capture, route plans and reports",
  "technology services for banks: digital engineering, data and AI, managed services",
  "a communications API for developers, with voice and SMS",
  "cloud billing software that handles invoices, usage and renewals",
];
const WORDS = ["Digital", "Technologies", "Technology", "Tech", "Services", "Solutions", "Software", "Systems", "Group", "Global", "Labs", "Consulting", "Ventures", "International", "Holdings", "Networks", "Platform", "Cloud", "Data", "Analytics"];
// [company, product]: one word, two words, a descriptor second word in capitals and in lower case, camel case, dot, ampersand, hyphen, digit, a common first word, a company that differs from the product
const SHAPES = [
  ["Zorbix", "Zorbix"], ["Dava.Flow", "Dava.Flow"], ["Fox & Hound", "Fox & Hound"], ["Re-Source", "Re-Source"], ["Route66", "Route66"], ["Bridge", "Bridge"], ["iTrackr", "iTrackr"], ["eMarker", "eMarker"],
  ["Global Freightways", "Global Freightways"], ["Digital Harbour", "Digital Harbour"], ["North Star Analytics", "North Star"], ["Tanla Platforms", "Wisely"], ["Orbital Labs Ltd", "Orbital Cloud"], ["Open Ledger Group", "Open Ledger"],
  ["Fox & Hound Systems", "Fox & Hound Systems"], ["Cloud Kitchens Group", "Cloud Kitchens Group"], ["Pine & Co Digital", "Pine & Co Digital"], ["Sky Global Holdings", "Sky Global Holdings"],
  ...WORDS.flatMap((w) => [[`Quillnest ${w}`, `Quillnest ${w}`], [`eMarker ${w}`, `eMarker ${w}`], [`Quillnest ${w.toLowerCase()}`, `Quillnest ${w.toLowerCase()}`], [`Quillnest`, `Quillnest ${w.toLowerCase()}`]]),
];
const MINE = new Set(["demo_script_builder", "champion_enablement_kit", "discovery_question_bank"]);
const ARGS = {
  demo_script_builder: (sol) => ({ demo_type: "first_look", primary_audience: "Head of Operations", attendees: "Finance Manager, IT Manager", customer_industry: "retail", your_solution: sol, key_pain_points: "orders arrive late; reports take days", demo_duration: 30 }),
  champion_enablement_kit: (sol) => ({ asset_type: "internal_business_case", your_solution: sol, champion_role: "Head of IT", target_stakeholder: "Chief Operating Officer", key_value_points: "fewer late orders; reports in minutes", known_objections: "How much does it cost?" }),
  competitive_trap_setter: (sol) => ({ competitor: "spreadsheets and email", competitor_weaknesses: "orders arrive late; reports take days", your_solution: sol, your_strengths: "order capture in the field", evaluation_stage: "mid", buyer_persona: "Head of Operations", trap_type: "all" }),
  email_sequence_generator: (sol) => ({ sequence_type: "cold_outreach", target_persona: "Head of Operations", target_industry: "retail", your_solution: sol, key_value_prop: "fewer late orders" }),
  discovery_question_bank: (sol) => ({ framework: "meddpicc", prospect_industry: "retail", prospect_role: "Chief Operating Officer", your_solution: sol, known_pain_points: "orders arrive late; reports take days" }),
};
const solutionOf = (company, product, k) => `${product.toLowerCase().includes(company.toLowerCase()) ? product : `${product} from ${company}`}, ${DESCS[k % DESCS.length]}`;

test(`the company or the product name is in the answer exactly as typed, for ${SHAPES.length} invented shapes in five tools`, async () => {
  const lost = [];
  for (const [k, [company, product]] of SHAPES.entries()) {
    const sol = solutionOf(company, product, k);
    // (a name written with a lower case descriptor, "Quillnest digital", is only kept whole by the three tools that write the typed name once)
    const lowerDescriptor = new RegExp(`\\s(?:${WORDS.map((w) => w.toLowerCase()).join("|")})$`).test(company);
    for (const [tool, mk] of Object.entries(ARGS)) {
      if (lowerDescriptor && !MINE.has(tool)) continue;
      const low = (await call(tool, mk(sol))).toLowerCase();
      if (![company, product].some((n) => low.includes(n.toLowerCase()))) lost.push(`${tool}: ${company} | ${product}`);
    }
  }
  assert.deepEqual(lost, [], `${lost.length} answers lost the name`);
});

test("a name whose second word is a descriptor in lower case keeps the full typed name once, and the short name elsewhere", async () => {
  for (const tool of MINE) {
    const t = await call(tool, ARGS[tool]("Quillnest digital, data and customer experience services and AI products (Insightdesk, Rulecheck), operations, data and customer experience services"));
    assert.ok(t.includes("Quillnest digital"), `${tool}: the full name is written once`);
    assert.ok((t.match(/Quillnest/g) || []).length >= 2, `${tool}: the short name is used`);
  }
});
