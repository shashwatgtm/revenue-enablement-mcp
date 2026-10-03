// Run 21c pass 2 (test first), tools email_sequence_generator and discovery_question_bank. Fresh judges found: an empty "Questions on the pain you
// described" section with the pain replaced by "the problem you came to fix" (a pain clause over 16 words was dropped); emails that drift to product
// parts that are not in the pain; "I have no customer story to quote" lines that cannot be sent; software-company measures (renewal rate, time to
// value) for a buyer in another industry; a role section that is the same for every person of that role; part questions that do not fit the part.
// Companies are invented, in plain words. Run: node --no-warnings --test tests/run21c-draft-pass2-revenue-drafts.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (tool, args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: tool, arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};
const emails = (t) => t.split(/\n(?=### Email \d)/).slice(1).map((e) => e.split(/\n## /)[0]);
const TYPES = ["cold_outreach", "warm_follow_up", "post_demo", "re_engagement", "proposal_follow_up", "nurture", "event_follow_up", "referral_request"];

// a software seller (a CRM) writing to a buyer in education, with no proof given
const CRM = {
  target_persona: "Sales user", target_industry: "education",
  your_solution: "Leadwing, a customer relationship platform for sales, marketing and service teams: lead scoring, a mobile app for field visits, workflow automation and Helpline, a customer support suite",
  key_value_prop: "a single view of every student and fewer third-party tools",
  specific_pain_point: "no single view of students across marketing, admissions and support, and dependence on third-party tools",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Leadwing sales team",
};
for (const type of TYPES) {
  test(`${type}: with nothing to quote the emails leave the sentence out, say what to add once, and stay software-free for an education buyer`, async () => {
    const t = await call("email_sequence_generator", { sequence_type: type, ...CRM });
    assert.doesNotMatch(t, /I have no|I have nothing|nothing to quote|no customer (?:story|result|evidence)|to quote in this note/i);
    for (const [i, e] of emails(t).entries()) assert.ok((e.split("**Body:**")[1] || "").length > 130, `email ${i + 1} is thin`);
    assert.match(t, /education/i);
    assert.match(t, /single view of students across marketing, admissions and support/);
    assert.match(t.split("## Before you send")[1] || "", /social_proof/, "Before you send says what to add");
    assert.doesNotMatch(t.split("## Before you send")[0], /renewal rate|time to value|activation|expansion|drop off|onboarding|churn/i, "software measures for an education buyer");
    // parts that are not in the pain are not made the topic of the emails
    assert.doesNotMatch(t.split("## Before you send")[0].replace(/^## Solution:.*$/m, ""), /mobile app|Helpline|field visits/i, "drift to parts that are not in the pain");
  });
}

// a voice and language platform, a long single pain clause, a part that does not touch the pain
const VOICE = {
  framework: "meddpicc", prospect_industry: "retail banking", prospect_role: "Chief Digital Officer", deal_stage: "discovery",
  your_solution: "Talkwell, a voice and language AI platform: speech recognition, translation, voice agents, loyalty points and document models for regional languages",
  known_pain_points: "customers speak many regional and mixed languages and the contact centre cannot add people as fast as call volume grows without costs rising in step",
};
test("a long pain clause still gets its section, and the pain is never replaced by a filler phrase", async () => {
  for (const framework of ["meddpicc", "bant", "spiced", "challenger", "gap_selling", "all"]) {
    const t = await call("discovery_question_bank", { ...VOICE, framework });
    const section = t.split("## Questions on the pain you described")[1] || "";
    assert.match(section.split("\n---")[0], /- On .*regional and mixed languages.*\?/, `${framework}: the pain section is empty`);
    assert.doesNotMatch(t, /the problem you came to fix/, framework);
  }
});
test("the role section is built from the product and the pain, not only the stock questions of the role", async () => {
  const t = await call("discovery_question_bank", VOICE);
  const section = (t.split("## Questions for Chief Digital Officer")[1] || "").split("\n---")[0];
  assert.match(section, /language|voice|call volume/i);
  assert.match(section, /retail banking/);
});
test("parts that do not touch the pain get no question, and the note about them is plain", async () => {
  const t = await call("discovery_question_bank", VOICE);
  assert.doesNotMatch(t, /Loyalty points: /);
  assert.match(t, /Parts not asked about[^\n]*loyalty points/i);
  assert.doesNotMatch(t, /not used in the draft/i);
  assert.doesNotMatch(t, /which of your systems does it have to work with, and who owns each one/);
});
test("a software seller's own activation and expansion questions are not put to a buyer in another industry", async () => {
  const t = await call("discovery_question_bank", { framework: "meddpicc", prospect_industry: "education", prospect_role: "Sales user", deal_stage: "discovery", your_solution: CRM.your_solution, known_pain_points: CRM.specific_pain_point });
  assert.doesNotMatch(t, /drop off|activation|expansion|time to value|renewal/i);
});
test("a role the tool has no stock knowledge of gets no stock paragraph, only questions built from the inputs", async () => {
  const t = await call("discovery_question_bank", VOICE);
  assert.doesNotMatch(t, /A stakeholder cares about|a clear picture of what changes for them|How does this part of the work run today/);
});
test("the emails do not suggest an audit or compliance owner as the other person to write to", async () => {
  for (const type of ["cold_outreach", "re_engagement", "referral_request"]) {
    const t = await call("email_sequence_generator", { sequence_type: type, target_persona: "Chief Financial Officer", target_industry: "retail banking", your_solution: "Spendwise, an expense platform: receipts, approvals and corporate cards", specific_pain_point: "receipts arrive weeks late and approvals sit in inboxes", call_to_action: "20-minute call" });
    const who = (t.match(/for example your ([^?)]*)/) || [])[1] || "";
    assert.doesNotMatch(who, /audit|compliance|risk|procurement/i, `${type}: ${who}`);
  }
});
