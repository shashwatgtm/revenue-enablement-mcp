import test from 'node:test';import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {waveTools} from '../dist/wave2-checkers.js';import {inputs} from './wave2-checkers.test.mjs';
const entry=process.env.WAVE_SERVER_ENTRY||'index';const mod=await import(`../dist/${entry}.js`);const createServer=mod.createServer??mod.default?.createServer;
test('new checkers through real MCP client and server over in-memory transport',async()=>{
 const server=createServer();const client=new Client({name:'wave-protocol-test',version:'test'});const [a,b]=InMemoryTransport.createLinkedPair();await Promise.all([server.connect(a),client.connect(b)]);
 try{const listed=(await client.listTools()).tools;for(const t of waveTools){const definition=listed.find(x=>x.name===t.name);assert.ok(definition);assert.deepEqual(definition.inputSchema,t.inputSchema);const result=await client.callTool({name:t.name,arguments:inputs[t.name]});assert.ok(!result.isError,JSON.stringify(result));assert.equal(result.structuredContent.status,'NO_MECHANICAL_ISSUES');assert.deepEqual(JSON.parse(result.content[0].text),result.structuredContent);}}finally{await client.close();await server.close();}
});
