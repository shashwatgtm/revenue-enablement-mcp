// Run 21c round 3 (test first): a shipping and fulfilment platform for small online sellers was read as enterprise logistics, so answers named a COO, a head of
// supply chain and a one site pilot (judges, six findings over three rounds). It now has its own sub-type: the founder or owner decides, the operations or
// e-commerce lead runs shipping, a trial on live orders decides. Companies are described in plain words (no names). Run: node --test tests/run21c-seller-shipping.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

const mod = await import(new URL("../src/verticals.ts", import.meta.url));
const { detectVertical } = mod;
const read = (text) => { const v = detectVertical({ seller: [text] }); return { id: v ? v.id : null, sub: v ? v.subtype || null : null, v }; };

test("an e-commerce shipping platform for small sellers reads as its own kind", () => {
  for (const t of [
    "an ecommerce platform that helps sellers manage shipping, logistics and fulfilment from a single dashboard: domestic and cross-border shipping, fulfilment and warehousing",
    "a shipping aggregator for online sellers with several courier partners, cash on delivery and return handling",
    "shipping software for small online stores: compare courier rates, print labels and track orders",
  ]) {
    const r = read(t);
    assert.equal(r.id, "logistics-tech", t);
    assert.equal(r.sub, "seller-shipping", t);
  }
});

test("its notes speak to a small online seller, not an enterprise logistics buyer", () => {
  const r = read("an ecommerce platform that helps sellers manage shipping, logistics and fulfilment from a single dashboard");
  const all = JSON.stringify(r.v);
  assert.match(all, /founder|owner/i);
  assert.doesNotMatch(all, /Chief Operating Officer|pilot at one site|Head of Supply Chain/);
  assert.doesNotMatch(all, /\d+%|\$\d/, "no statistic or figure (B82)");
});

test("other logistics kinds keep their own entries", () => {
  assert.equal(read("warehouse management software and order fulfilment automation for distribution centres").sub, "warehousing");
  assert.equal(read("route optimization software and proof of delivery for last mile delivery fleets").sub, "last-mile");
  assert.equal(read("a freight marketplace that matches shippers with trucks and carriers").sub, "freight-marketplace");
});
