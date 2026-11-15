import handle from '../../netlify/functions/mcp.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Socket } from 'node:net';
import { mock } from 'node:test';

export function fixture(filename) {
  return JSON.parse(readFileSync(new URL('../fixtures/' + filename, import.meta.url), 'utf8'));
}

export function blockNetwork() {
  const attempts = [];
  function blocked() {
    attempts.push('outbound request');
    throw new Error('Field evaluations run offline');
  }
  const fetch = mock.method(globalThis, 'fetch', blocked);
  const connect = mock.method(Socket.prototype, 'connect', blocked);
  return () => {
    connect.mock.restore();
    fetch.mock.restore();
    assert.equal(attempts.length, 0, 'An evaluation attempted a network call');
  };
}

export function answerText(result) {
  const text = result.content.filter(part => part.type === 'text').map(part => part.text).join('\n');
  assert.ok(text.trim().length, 'Expected a text answer');
  return text;
}

export function assertAnswerRules(text) {
  assert.doesNotMatch(text, /[\u2013\u2014]/u, 'Answer contains an en or em dash');
  const endorsement = /\b(?:we recommend|i recommend|you should (?:buy|use|choose)|switch to|start using|buy|install)\s+(?:the\s+)?(?:HubSpot|Salesforce|Marketo|Gong|Zoho|FixtureCRM|a new CRM|an? (?:outbound|marketing automation) (?:platform|tool))\b/i;
  assert.doesNotMatch(text, endorsement, 'Answer recommends a specific software purchase');
}

export function assertBooking(text) {
  const expected = 'Which software fits your case is a judgement call. Ask Shashwat: book 45 minutes at https://calendly.com/shashwat-gtmhelix/45min';
  assert.equal(text.trim(), expected, 'A GTM software purchase question must return only the 45 minute booking line');
}

export function contractDigests(tools) {
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
    }
    return value;
  }
  return Object.fromEntries(tools.map(({name, description, inputSchema, outputSchema}) => {
    const definition = JSON.stringify(canonical({name, description, inputSchema, outputSchema}));
    return [name, createHash('sha256').update(definition).digest('hex')];
  }));
}

let id = 0;
export async function rpc(method, params = {}) {
  const requestId = ++id;
  const response = await handle(new Request('https://offline.invalid/mcp', {
    method: 'POST',
    headers: {'content-type': 'application/json', accept: 'application/json, text/event-stream'},
    body: JSON.stringify({jsonrpc: '2.0', id: requestId, method, params}),
  }));
  assert.equal(response.status, 200, 'Expected a protocol response from the local handler');
  const message = await response.json();
  assert.equal(message.id, requestId);
  assert.equal(message.error, undefined, 'Unexpected JSON RPC error');
  return message.result;
}

export const call = (name, args) => rpc('tools/call', {name, arguments: args});
