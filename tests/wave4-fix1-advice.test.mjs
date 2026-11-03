import {readFileSync as readTestPackage} from 'node:fs';
const testRepositoryName=home=>JSON.parse(readTestPackage(home+'/package.json','utf8')).name.split('/').pop();
import {pathToFileURL as localTestFileURL} from 'node:url';
const importLocalTestFile=specifier=>import(localTestFileURL(specifier).href);
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const home=process.env.WAVE4_TEST_HOME||process.cwd(),repo=process.env.WAVE4_REPO||testRepositoryName(home);let answer;
if(repo==='craft-gtm-mcp')answer=(await importLocalTestFile(home+'/dist/context.js')).answerFor;
if(repo==='craft-content-mcp')answer=(await importLocalTestFile(home+'/dist/sector.js')).answerFor;
if(repo==='revenue-enablement-mcp'){const m=await importLocalTestFile(home+'/dist/answers.js');answer=(t)=>m.answerBlocker(t,{product:'the software'}).how;}
const rows=[];
for(const v of ['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'])for(const [form,text,pattern]of [['exact','Security has not approved the purchase.','remains outstanding'],['same','Clearance from legal and procurement is still outstanding.','remains outstanding'],['opposite','Security, legal and procurement have approved the purchase.','reported complete']])test('FIX1 advice '+v+' '+form,()=>{const output=answer(v+': '+text,null);const pass=new RegExp(pattern).test(output);rows.push({v,form,text,output,pass});assert.ok(pass,output)});
test.after(()=>{if(process.env.WAVE4_RECEIPT)fs.writeFileSync(process.env.WAVE4_RECEIPT,JSON.stringify(rows,null,2)+'\n')});
