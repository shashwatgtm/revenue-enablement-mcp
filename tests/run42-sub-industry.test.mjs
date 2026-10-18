// Run 42B (addendum 8): a sub industry's lines (a SUBTYPES entry: committee, objections, discovery, proof shape, sales motion) are used only when the
// seller's own description holds that sub industry's own words. your_sector fixes the sector, never the sub industry. The seller text here names no
// company and no sub industry; the lines checked are read from src/verticals.ts itself, so no sector fact is written in this file (B82).
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
const { SUBTYPES, VERTICALS } = await import(new URL("../src/verticals.ts", import.meta.url));
const { subIndustryFor } = await import(new URL("../src/sub-industry.ts", import.meta.url));
let nextId = 1;
const call = async (name, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const PLAIN = "A cloud platform with a console, an API and SDKs that teams use to work faster, with a free trial and per user pricing";
const WITH_AI = `${PLAIN}, and AI agents and copilots that run code in a sandbox`;
const SECTORS = ["logistics_tech", "fintech", "saas", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity"];
const TOOLS = (s) => ({
  account_plan_builder: { account_name: "A buyer", industry: "retail", your_solution: s },
  deal_strategy_coach: { deal_name: "A deal", deal_stage: "proposal", your_solution: s },
  discovery_question_bank: { framework: "meddpicc", your_solution: s, prospect_industry: "retail" },
  roi_business_case_builder: { customer_name: "A buyer", industry: "retail", your_solution: s, solution_price: 50000, primary_value_driver: "cost_reduction" },
  mutual_action_plan_generator: { deal_name: "A deal", target_close_date: "2027-03-01", your_solution: s, current_stage: "evaluation" },
  win_loss_analyzer: { analysis_type: "single_deal", deal_outcome: "lost", your_solution: s, deal_details: "lost on price" },
  proposal_section_writer: { section_type: "executive_summary", your_solution: s, customer_industry: "retail" },
  email_sequence_generator: { sequence_type: "cold_outreach", target_persona: "Head of Operations", your_solution: s, target_industry: "retail" },
  demo_script_builder: { demo_type: "first_look", your_solution: s, customer_industry: "retail" },
  pricing_negotiation_guide: { scenario: "budget_objection", your_solution: s, deal_value: 50000 },
  champion_enablement_kit: { asset_type: "internal_business_case", your_solution: s, champion_role: "Head of Operations" },
  competitive_trap_setter: { competitor: "the current tool", your_solution: s },
});
// the long lines that belong to one sub industry and not to the sector's general entry
function kindLines(vid) {
  const base = VERTICALS.find((v) => v.id === vid);
  const general = new Set([base.committee, base.salesMotion, base.proofShape, ...base.objections.map((o) => o.objection), ...base.objections.map((o) => o.response), ...base.discovery]);
  const out = [];
  for (const st of SUBTYPES.filter((x) => x.vertical === vid)) {
    const n = st.notes;
    for (const l of [n.committee, n.salesMotion, n.proofShape, ...(n.objections || []).map((o) => o.objection), ...(n.discovery || [])]) if (l && l.length > 40 && ![...general].some((g) => g.includes(l) || l.includes(g))) out.push({ kind: st.name, line: l });
  }
  return out;
}

test("the one gate: a generic label alone names no sub industry; the kind's own words do", () => {
  for (const s of [PLAIN, WITH_AI, "AI agents", "copilots", "an agentic platform"]) for (const v of SECTORS) assert.equal(subIndustryFor(v.replace("_", "-"), [s]), null, `${v}: ${s}`);
  assert.equal(subIndustryFor("ai-native", ["AI agents and copilots that act as digital workers for sales teams"])?.id, "agents-copilots");
  assert.equal(subIndustryFor("ai-native", ["a copilot for finance teams"]), null);
});

for (const text of [PLAIN, WITH_AI]) {
  test(`no sub industry specific line in any tool when the seller names no sub industry (${text === PLAIN ? "plain" : "with AI agents"})`, async () => {
    for (const sec of SECTORS) {
      const vid = sec.replace("_", "-");
      const lines = kindLines(vid);
      for (const [tool, args] of Object.entries(TOOLS(text))) {
        const out = await call(tool, { ...args, your_sector: sec });
        for (const { kind, line } of lines) assert.ok(!out.includes(line), `${sec} / ${tool}: a line of "${kind}" appears: ${line.slice(0, 80)}`);
        const sector = (out.match(/\*Sector:[^\n]*/) || [""])[0];
        for (const st of SUBTYPES.filter((x) => x.vertical === vid)) assert.ok(!sector.includes(st.name), `${sec} / ${tool}: sector line names ${st.name}`);
      }
    }
  });
}

test("a seller who does name the kind still gets it, with your_sector set", async () => {
  const out = await call("discovery_question_bank", { framework: "meddpicc", prospect_industry: "retail", your_sector: "ai_native", your_solution: "AI agents and copilots that act as digital workers for support and sales teams" });
  assert.match(out, /AI agents and copilots/);
});

test("a page claim, a group membership or a track record is never a demo step", async () => {
  const out = await call("demo_script_builder", {
    demo_type: "first_look", your_solution: "A cloud platform with GPU machines for training, storage and a console with SDKs",
    key_pain_points: "jobs wait in queues for machines", customer_industry: "retail",
    must_show_features: "Operated in production for consumer, industrial and public platforms with sustained traffic; part of a larger group (page claims)", your_sector: "ai_native",
  });
  assert.doesNotMatch(out, /\*\*Step \d+: (?:Operated|Part of|Industrial|Consumer)/i);
  assert.match(out, /Claims to prove/);
  assert.match(out, /part of a larger group/i);
});
