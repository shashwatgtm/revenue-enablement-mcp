// Run 21c job 3 (test first): email_sequence_generator returned an outline: "Hi [First Name]", "[Your name]", "(add it here)" frames, coaching
// lines ("Sequence Tips", "Best Practices") and, for four of the eight types, a bullet list of headings. It now returns a first draft: every
// email has a subject and a full body built from the inputs, for all eight types, with no merge field.
// Two invented companies of different kinds (a construction management platform, a business messaging platform). No real names.
// Run: node --no-warnings --test tests/run21c-draft-email_sequence_generator.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "email_sequence_generator", arguments: args } }) }));
  const j = await r.json();
  return j.result.content.map((c) => c.text).join("\n");
};

const A = {
  target_persona: "Chief Financial Officer", target_industry: "general contractors",
  your_solution: "Sitegrid, a construction management platform for general contractors: project scheduling, cost control, change order tracking and subcontractor payments",
  key_value_prop: "see job cost while the project is still running; the vendor page cites 12% fewer change order disputes (page claim from a 2024 customer survey)",
  specific_pain_point: "change orders sit in email for weeks, and job cost reports arrive after the money is spent",
  social_proof: "Hollowell Builders cut pay application time from 9 days to 3 (case study title); Customer quote from the controller at Ridgeway Civil: \"We stopped chasing paper.\" (customer quote); Named a Leader in the 2025 Builders Software Grid (analyst page)",
  call_to_action: "20-minute call", tone: "consultative", sender_context: "Sitegrid sales team",
};
const B = {
  target_persona: "Head of Product", target_industry: "online retailers",
  your_solution: "Pingwise, a business messaging platform: text messages, voice calls, verified sender messages and delivery reports",
  key_value_prop: "get login codes to customers in seconds; delivery reports by route (page words)",
  specific_pain_point: "login codes arrive late and shoppers abandon checkout, and fraud filters block messages that are real",
  social_proof: "Marlowe Shop raised first attempt code delivery from 81% to 96% (customer story headline); Customer quote from the product lead at Quill Market: \"The reports told us which route was failing.\" (customer quote)",
  call_to_action: "30-minute technical walkthrough", tone: "casual", sender_context: "Solutions engineering at Pingwise",
};
const COUNTS = { cold_outreach: 5, warm_follow_up: 3, post_demo: 4, re_engagement: 3, proposal_follow_up: 4, nurture: 4, event_follow_up: 3, referral_request: 3 };
const TYPES = Object.keys(COUNTS);

const FILLER = [/Does this sound familiar/i, /Following up on my note/i, /close your file/i, /I get it: you're busy/i, /no hard feelings/i, /quick story/i, /One last thing/i,
  /Best Practices/i, /A\/B test/i, /Personalize at least one/i, /Sequence Tips/i, /Tips\b/, /open and reply rates/i, /Research before sending/i, /Worth a conversation\?/i, /Last note from me/i,
  /Breakup Tease/i, /Internal Champion Enable/i, /Create Urgency/i, /Establish context/i, /Overcome inertia/i, /Customize based on your specific/i, /Hope this finds you/i, /As you know/i,
  /fast-paced/i, /add (?:it|them) here/i, /write it in their words/i, /Hi there,\s*\n\s*I hope/i];
const emails = (t) => t.split(/\n(?=### Email \d)/).slice(1).map((e) => e.split(/\n## /)[0]);
const longLines = (t) => new Set(t.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30));
const overlap = (a, b) => { const x = longLines(a), y = longLines(b); let n = 0; for (const l of x) if (y.has(l)) n++; return n / Math.max(1, Math.min(x.size, y.size)); };

for (const type of TYPES) {
  test(`${type}: ${COUNTS[type]} emails, each with a subject and a full body, no merge field or filler`, async () => {
    for (const [name, co] of [["A", A], ["B", B]]) {
      const t = await call({ sequence_type: type, ...co });
      const es = emails(t);
      assert.equal(es.length, COUNTS[type], `${name}: ${es.length} emails`);
      for (const [i, e] of es.entries()) {
        assert.match(e, /\*\*Subject:\*\* \S/, `${name} email ${i + 1} subject`);
        const body = e.split("**Body:**")[1] || "";
        assert.ok(body.length > 260, `${name} email ${i + 1} body is ${body.length} characters`);
        assert.ok(body.split("\n").filter((l) => l.trim()).length >= 4, `${name} email ${i + 1} is too short`);
      }
      assert.doesNotMatch(t, /\[[^\]\n]*\]/, `${name} bracket placeholder`);
      assert.doesNotMatch(t, /\{[^}\n]*\}/, `${name} brace placeholder`);
      assert.doesNotMatch(t, /your product|your solution|\bTBD\b|Insert|First Name|Your name|our solution/i, `${name} placeholder words`);
      for (const re of FILLER) assert.doesNotMatch(t, re, `${name} filler ${re}`);
      assert.doesNotMatch(t, /[–—]/, `${name} dash`);
      assert.doesNotMatch(t, /clinic|pharmac|health ?care|patient|hospital/i, `${name} healthcare word`);
    }
  });
  test(`${type}: every input is in the draft, figures exact, labels kept`, async () => {
    const a = await call({ sequence_type: type, ...A }), b = await call({ sequence_type: type, ...B });
    for (const re of [/Chief Financial Officer|CFO/, /general contractors/, /Sitegrid/, /change orders sit in email for weeks/, /job cost reports arrive after the money is spent/, /20-minute call/, /Sitegrid sales team/, /see job cost while the project is still running/]) assert.match(a, re, `A ${type} ${re}`);
    for (const re of [/Head of Product/, /online retailers/, /Pingwise/, /login codes arrive late and shoppers abandon checkout/, /fraud filters block messages that are real/, /30-minute technical walkthrough/, /Solutions engineering at Pingwise/, /get login codes to customers in seconds/]) assert.match(b, re, `B ${type} ${re}`);
    // the figures, exactly as given, and the labels they came with
    for (const re of [/12% fewer change order disputes/, /from 9 days to 3/, /We stopped chasing paper/, /Hollowell Builders/, /Ridgeway Civil/, /2025 Builders Software Grid/, /page claim from a 2024 customer survey/, /case study title/, /customer quote/]) assert.match(a, re, `A ${type} ${re}`);
    for (const re of [/from 81% to 96%/, /Marlowe Shop/, /Quill Market/, /The reports told us which route was failing/, /customer story headline/, /page words/, /delivery reports by route/]) assert.match(b, re, `B ${type} ${re}`);
  });
  test(`${type}: two companies of different kinds get drafts whose long lines differ`, async () => {
    const a = await call({ sequence_type: type, ...A }), b = await call({ sequence_type: type, ...B });
    assert.ok(overlap(a, b) < 0.25, `${type} overlap ${overlap(a, b).toFixed(2)}`);
    assert.doesNotMatch(a, /message routing|one time password|opt in and opt out|artificial traffic/i, "A holds B's sector words");
    assert.doesNotMatch(b, /retainage|superintendent|punch list|pay application/i, "B holds A's sector words");
  });
}

test("the draft opens with what is not given, once, and no merge field is left", async () => {
  const t = await call({ sequence_type: "cold_outreach", target_persona: "COO", your_solution: "Flowdesk, a workflow tool for dispatch teams" });
  // run 22 (rev-w3): named once at the end under "To sharpen this, give:", with what each input would change
  assert.equal((t.match(/To sharpen this, give:/g) || []).length, 1);
  assert.match(t.split("To sharpen this, give:")[1] || "", /(?:call_to_action|sender_context|pain|proof|value)[\s\S]*would change/i);
  assert.doesNotMatch(t, /\[[^\]\n]*\]|\{[^}\n]*\}/);
  assert.doesNotMatch(t, /\bmeeting next week\b.*\bmeeting next week\b/s);
  assert.ok(emails(t).length === 5);
});

test("a given sequence keeps num_emails 0 as given (legacy contract) and says the length is fixed", async () => {
  const t = await call({ sequence_type: "cold_outreach", ...A, num_emails: 0 });
  assert.match(t, /## Emails: 0\n/);
});

test("the sector notes below the draft differ by kind", async () => {
  const a = await call({ sequence_type: "cold_outreach", ...A }), b = await call({ sequence_type: "cold_outreach", ...B });
  const na = a.split("### Sector notes")[1] || "", nb = b.split("### Sector notes")[1] || "";
  assert.ok(na && nb && na !== nb);
  assert.match(na, /change order|job cost/i);
  assert.match(nb, /delivery rate|message/i);
});
