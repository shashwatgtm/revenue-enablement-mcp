import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from '../dist/index.js';

test('the complete tools/list JSON remains byte identical to the pre-funding base', async () => {
  const handler = createServer()._requestHandlers.get('tools/list');
  const actual = await handler({method:'tools/list',params:{}});
  const expected = readFileSync(new URL('./fixtures/roi-funding-toolslist-base-20261113.json',import.meta.url),'utf8').trimEnd();
  assert.equal(JSON.stringify(actual),expected);
});
