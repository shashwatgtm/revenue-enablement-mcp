// Run 21c job 2 (test first): the buyer-role entry for a sales leader was written around a field sales force (orders, outlets, visits, a pilot region),
// so a VP Sales at a software or services buyer was asked how reps capture orders and plan visits. It now speaks of any sales team.
// Run: node --test tests/run21c-leftovers.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const { roleFor } = await import(new URL("../src/answers.ts", import.meta.url));

test("a sales leader is not asked about orders, outlets or visits", () => {
  for (const title of ["VP Sales", "Chief Revenue Officer", "Head of Sales"]) {
    const k = roleFor(title);
    const all = JSON.stringify(k);
    assert.doesNotMatch(all, /outlet|capture orders|plan visits|in the field|field pilot|season/i, title);
  }
});
