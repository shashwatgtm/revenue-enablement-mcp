import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NO_REGION_SUFFIX} from '../dist/region-reader.js';
// 13 Nov 2026: re-pinned after the ROI scope change renamed the placeholder "Helix Platform" to "Helix ABM Platform" (in scope).
// The only change in each fixture is that name; checked by running the tool and comparing the old text with the name swapped.
const original={
  "roi-own-price-omitted.md": "6f8a5675820f6cec586ba9c29891c41b5dc25cfd",
  "roi-own-price-0.01.md": "8aa874cf49f0fa5ab7ac093828b2564076194eac",
  "roi-own-price-1.md": "8c032684b1237de5550a2304770210bdc2c2f2fd",
  "roi-own-price-50000.md": "1d53a459b83b720080b1acaf679f5f8472240d75"
};
for(const [name,sha]of Object.entries(original))test('Saved output changes only by the exact region clarification: '+name,()=>{
 const current=readFileSync(new URL('./fixtures/'+name,import.meta.url),'utf8');
 assert.ok(current.endsWith(NO_REGION_SUFFIX));
 const before=Buffer.from(current.slice(0,-NO_REGION_SUFFIX.length));
 assert.equal(createHash('sha1').update('blob '+before.length+'\0').update(before).digest('hex'),sha);
});

