import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NO_REGION_SUFFIX} from '../dist/region-reader.js';
const original={
  "roi-own-price-omitted.md": "052d4e12e1f0cf6e43902ab7063dd8ce29bc69ba",
  "roi-own-price-0.01.md": "99dfb9972bb7af1492b02342cdd835e3097fd620",
  "roi-own-price-1.md": "e7bb3b8bdb1c346a7213d2b980bdbf941c6c4f00",
  "roi-own-price-50000.md": "909326d8bceeb5bea4ed2097504887cf59c0cc7f"
};
for(const [name,sha]of Object.entries(original))test('Saved output changes only by the exact region clarification: '+name,()=>{
 const current=readFileSync(new URL('./fixtures/'+name,import.meta.url),'utf8');
 assert.ok(current.endsWith(NO_REGION_SUFFIX));
 const before=Buffer.from(current.slice(0,-NO_REGION_SUFFIX.length));
 assert.equal(createHash('sha1').update('blob '+before.length+'\0').update(before).digest('hex'),sha);
});

