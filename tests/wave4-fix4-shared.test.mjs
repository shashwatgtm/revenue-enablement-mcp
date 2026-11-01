import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const home=process.env.WAVE4_TEST_HOME||process.cwd(),repo=path.basename(home);const rows=[];
const mod=await import(home+'/dist/'+({'craft-gtm-mcp':'competitive-intel','craft-content-mcp':'rw-content','revenue-enablement-mcp':'rw-kit'}[repo])+'.js');
const caseStudy=repo==='craft-content-mcp'?(await import(home+'/dist/case-study-generator.js')).generateCaseStudy:null;
const vs=['Logistics tech','Fintech','SaaS','Vertical SaaS','AI native','ITeS','Telecom','Software','Cybersecurity'];
for(const v of vs)for(const[form,phrase,want]of [['exact','Setup is difficult.',true],['same','Setup leaves users stuck.',true],['opposite','Setup is not difficult.',false],['resolved','Setup issues are resolved.',false]])test(`FIX4 shared ${repo} ${v} ${form}`,()=>{
 let raw,checks;
 if(repo==='revenue-enablement-mcp'){raw=mod.readPains(phrase);checks={classification:(raw.pains.length>0)===want,retained:JSON.stringify(raw).includes(phrase.replace(/[.]$/,''))};}
 else if(repo==='craft-content-mcp'){const points=mod.readPoints(phrase);const draft=caseStudy({customer_name:'Customer account',your_product:v+' vendor',mode:'full',interview_notes:phrase,solution:'The team installed the software.',results:'No outcome figures were supplied.'});raw={points,draft};checks={classification:points.some(p=>p.role==='problem')===want,challenge:/challenge came from the interview notes/i.test(draft)===want,retained:draft.includes(phrase.replace(/[.]$/,''))};}
 else{raw=mod.generateCompetitiveIntel({your_product:v+' vendor',competitors:'Current workflow',your_strengths:'Export the review trail',competitor_details:'Current workflow: '+phrase});checks={classification:/what we have seen is:/.test(raw)===want,retained:raw.includes(phrase.replace(/[.]$/,''))};}
 rows.push({v,form,phrase,want,raw,checks});assert.ok(Object.values(checks).every(Boolean),JSON.stringify({phrase,checks,raw}));
});
test.after(()=>{if(process.env.WAVE4_RECEIPT)fs.writeFileSync(process.env.WAVE4_RECEIPT,JSON.stringify(rows,null,2)+'\n')});
