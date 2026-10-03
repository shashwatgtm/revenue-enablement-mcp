// Run 21c second pass (test first): independent judges found landmine questions garbled by pasting weak-point text ("produce work for
// managers"), a metaphor turned into a literal question, a priority cut at its commas into fragments ("you want to flexible and secure
// networks"), a lower-cased place name, the criteria section repeating the whole strengths paragraph, and a wrong statement that the
// priorities were figures only. Invented companies. Run: node --no-warnings --test tests/run21c-draft2-competitive_trap_setter.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import(new URL("../netlify/functions/mcp.mjs", import.meta.url));
let nextId = 1;
const call = async (args) => {
  const r = await handler(new Request("https://x.gtmhelix.com/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name: "competitive_trap_setter", arguments: args } }) }));
  return (await r.json()).result.content.map((c) => c.text).join("\n");
};
const questions = (t) => [...t.matchAll(/\*\*Landmine Question:\*\* "([^"]+)"/g)].map((m) => m[1]);

const SUPPORT = {
  competitor: "AI tools that only solve part of the problem and work in isolation", your_solution: "Helpwell, a customer service platform with ticketing, live chat, a knowledge base and AI agents",
  competitor_weaknesses: "data that confuses agents and creates more manual work for managers, AI that needs constant retraining, and context lost when a customer switches channels",
  your_strengths: "AI agents that learn from each service interaction in a learning loop, on one unified workspace for email, chat, phone, social and messaging, with knowledge, analytics, quality assurance and integrations working together instead of separate tools",
  evaluation_stage: "mid", buyer_priorities: "faster, higher quality resolutions: agents resolve conversations end to end with fewer escalations, and can resolve up to 80% of interactions on their own (page claim)",
  buyer_persona: "Vice President of Customer Experience", trap_type: "all",
};
const NET = {
  competitor: "legacy WAN built on hardware", your_solution: "Netspan, managed SD-WAN and business connectivity with cloud and security",
  competitor_weaknesses: "a single congested highway prone to jams, slowdowns and frustrating disconnections, with sluggish cloud apps and network lag at remote offices",
  your_strengths: "Freedonia's most extensive network infrastructure combined with digital capabilities, offering personalised end to end solutions from connectivity to cloud and cybersecurity",
  evaluation_stage: "mid", buyer_priorities: "expand to new locations in half the time with smart, flexible and secure networks across locations; the page claims up to a 40% reduction in IT expenses (page claim)",
  buyer_persona: "CIO", trap_type: "all",
};

test("a pasted note is read by its kind or quoted: no 'produce work for managers', no 'handle context lost'", async () => {
  const t = await call({ ...SUPPORT, trap_type: "discovery_questions" });
  const qs = questions(t);
  assert.equal(qs.length, 3);
  assert.doesNotMatch(qs.join(" "), /produce work for managers|handle context lost|how often is it refreshed/i);
  assert.match(qs[0], /more manual work for managers/);
  assert.match(qs[2], /When a customer switches channels/);
});

test("a metaphor in a note is not asked about as if it were literal", async () => {
  const t = await call({ ...NET, trap_type: "discovery_questions" });
  const qs = questions(t).join(" ");
  assert.doesNotMatch(qs, /highway|jams/i);
  assert.match(qs, /lag|slow|remote offices|disconnect/i);
  assert.match(t, /a single congested highway prone to jams/); // still shown as the seller's note
});

test("a priority is not cut at its commas into fragments, and a figure keeps its label with the aim before it", async () => {
  const t = await call(NET);
  assert.doesNotMatch(t, /want to (?:flexible|smart)|helped you (?:flexible|smart)/i);
  assert.match(t, /expand to new locations in half the time with smart, flexible and secure networks across locations/);
  assert.match(t, /up to a 40% reduction in IT expenses \(page claim\)/);
  const s = await call(SUPPORT);
  assert.doesNotMatch(s, /figures only|no aim to ask/i);
  assert.match(s, /can resolve up to 80% of interactions on their own \(page claim\)/);
  assert.match(s, /"[^"\n]*higher quality resolutions[^"\n]*\?"/);
});

test("a place name keeps its capital", async () => {
  const t = await call(NET);
  assert.match(t, /Freedonia's most extensive/);
  assert.doesNotMatch(t, /freedonia's/);
});

test("a long strengths paragraph is not repeated in full in the criteria, the script and the requirements", async () => {
  const t = await call(SUPPORT);
  const head = SUPPORT.your_strengths.slice(0, 130);
  assert.ok(t.split(head).length - 1 <= 1, `the paragraph opening appears ${t.split(head).length - 1} times`);
  const crit = t.split("## Evaluation Criteria Positioning")[1].split("## Reference Call Questions")[0];
  assert.ok(crit.length < 1800, `criteria section is ${crit.length} characters`);
});
