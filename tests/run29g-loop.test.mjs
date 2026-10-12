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
const emptyHeadings = (s3) => { const l = s3.split("\n"); return l.filter((x, i) => x.startsWith("#### ") && (() => { const n = l.slice(i + 1).find((y) => y.trim()); return !n || n.startsWith("#"); })()); };

test("discovery_question_bank: the lead-in of a sector block moves with its heading", async () => {
  const t = await call("discovery_question_bank", { framework: "meddpicc", prospect_industry: "retail banking", prospect_role: "Head of Digital",
    your_solution: "Trailmark, product analytics software for software companies: in-app guides, surveys and usage analytics", known_pain_points: "users drop off in the first week" });
  const s2 = part(t, "\n## 2. The framework applied\n", "\n## 3. Sector checks\n"), s3 = part(t, "\n## 3. Sector checks\n", "\n## 4. Gaps\n");
  assert.deepEqual(emptyHeadings(s3), [], "a sector heading left empty in section 3");
  assert.doesNotMatch(s2, /questions are about a software company's own customers/, "a sector paragraph left in section 2 without its heading");
  assert.match(s3, /questions are about a software company's own customers/);
});
