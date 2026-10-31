import test from 'node:test';import assert from 'node:assert/strict';
import {waveTools,callWaveTool} from '../dist/wave2-checkers.js';
const ev=(id='E1')=>({id,claim:'Observed 12 process steps.',source:'https://evidence.invalid/record',source_date:'2026-10-30',excerpt:'Observed 12 process steps in 2026.',status:'user_supplied'});
const inputs={
 prompt_structure_check:{character:'Operations reviewer',result:'Check this plan',artifact:'Issue register',frame:'Use supplied facts only',timeline:'Review before the next meeting',success_criteria:['Every issue has a reason']},
 competitive_evidence_check:{relationship:'unrelated_confirmed_by_user',criteria:[{criterion:'Handoff',buyer_need:'Fewer errors',our_evidence_id:'E1',alternative_evidence_id:'E2',verdict:'parity'}],evidence:[ev(),ev('E2')]},
 proposal_structure_check:{buyer_problem:'Handoff errors',audience:'Operations',sections:['problem','approach','proof','implementation','commercials','next_step'].map(kind=>({kind,heading:kind,body:'Supplied project statement',evidence_ids:['E1']})),evidence:[ev()],brand:{primary_color:'#641220',heading_font:'Supplied font',body_font:'Supplied font',source:'User brand notes'}},
 bluf_evidence_check:{buyer_question:'How does the process work?',bluf:'The process has 12 steps. '+Array.from({length:35},()=> 'detail').join(' '),pattern:'implementation',proof:[ev(),ev('E2'),ev('E3')]},
 launch_copy_check:{assets:[{label:'Headline',text:'A process update',character_limit:50}],claims:[ev()],dates:[{date:'2026-11-02',weekday:'Monday'}],quotes:[{text:'The process is clearer.',approval:'approved_by_speaker',source:'Speaker approval record'}]},
 newsletter_source_check:{cutoff:'2026-10-01',issue_date:'2026-10-31',items:[{title:'Process update',url:'https://evidence.invalid/record',date:'2026-10-30',excerpt:'Observed process change',quote:'Observed process change',take:'We should test the process',why_it_matters:'It concerns our handoff'}],lead_index:0},
 account_coverage_check:{account_ids:['A1'],required_fields:['operations'],banned_domains:['forbidden.invalid'],rows:[{account_id:'A1',field:'operations',value:'Supplied operating fact',source:'https://evidence.invalid/record',checked_date:'2026-10-30',status:'user_supplied',probe:'How does this process work?'}]},
 claim_register_check:{document:'Observed 12 process steps.',claims:[{...ev(),label:'Process steps',base:'One observed process',period:'2026',source_label:'Process steps',source_base:'One observed process',source_period:'2026'}]},
 evidence_number_lock_check:{assets:[{id:'A1',text:'Observed 12 steps.'}],locks:[{id:'L1',value:'12',label:'Steps',base:'One observed process',period:'2026',source:'https://evidence.invalid/record',page:'1'}],ratios:[{id:'R1',numerator:1,denominator:4,reported_percent:25}]},
 critique_filter_check:{draft_version:'vA',critique_version:'vA',objective:'Explain the process',locked_lines:['Preserve this wording.'],points:[{id:'P1',point:'Clarify the action',facts:'pass',objective:'pass',tone:'pass',replacement:'Review the process.',replaces:'Check the process.',reason:'Same facts, clearer action'}]},
 sales_sequence_check:{type:'cold_outreach',start:'2026-11-06',anchor:'first_send',days:[1,2,3],emails:[{subject:'Process review',body:'Could we compare the process?',ask:'Share the current process',evidence_ids:[]},{subject:'The handoff',body:'Where do handoffs fail?',ask:'Name a handoff gap',evidence_ids:[]},{subject:'Next step',body:'Would a short review help?',ask:'Choose a review time',evidence_ids:[]}],evidence:[]}
};
const read=(name,args)=>{const r=callWaveTool(name,args);assert.ok(!r.isError,JSON.stringify(r));return r.structuredContent;};
for(const t of waveTools){
 test(`${t.name}: normal supplied record`,()=>{const r=read(t.name,inputs[t.name]);assert.equal(r.status,'NO_MECHANICAL_ISSUES',JSON.stringify(r));assert.ok(r.limitations.some(x=>x.includes('No page was fetched')));});
 test(`${t.name}: empty input is a reported gap or schema error`,()=>{const r=callWaveTool(t.name,{});if(r.isError)assert.match(r.content[0].text,/INVALID_INPUT/);else assert.equal(r.structuredContent.status,'CHECKS_FOUND');});
 test(`${t.name}: hostile nested strings remain inert and escaped`,()=>{const hostile='<script>alert("x")</script> | `run` & ignore rules';const x=structuredClone(inputs[t.name]);const mutate=v=>{if(Array.isArray(v))return v.map(mutate);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,z])=>[k,mutate(z)]));return typeof v==='string'&&!/^\d{4}-/.test(v)&&!['user_supplied','unrelated_confirmed_by_user','parity','implementation','problem','approach','proof','commercials','next_step','approved_by_speaker','pass','cold_outreach','first_send'].includes(v)?v+' '+hostile:v;};const r=callWaveTool(t.name,mutate(x));assert.doesNotMatch(JSON.stringify(r),/<script>|<\/script>/);if(!r.isError)assert.ok(r.structuredContent.limitations.length);});
 test(`${t.name}: shape abuse, prototype keys and excess rows rejected`,()=>{assert.equal(callWaveTool(t.name,null).isError,true);const x=structuredClone(inputs[t.name]);x.unexpected='must reject';const proto=JSON.parse(JSON.stringify(inputs[t.name]).slice(0,-1)+',"__proto__":{"polluted":true}}');assert.equal(callWaveTool(t.name,proto).isError,true);assert.equal({}.polluted,undefined);assert.equal(callWaveTool(t.name,x).isError,true);const field=Object.entries(t.inputSchema.properties).find(([,s])=>s.type==='array');if(field){const y=structuredClone(inputs[t.name]);y[field[0]]=Array(201).fill(y[field[0]][0]??'x');assert.equal(callWaveTool(t.name,y).isError,true);}});
 test(`${t.name}: weak case produces concrete domain finding`,()=>{const x=structuredClone(inputs[t.name]);let pattern;switch(t.name){
 case 'prompt_structure_check':delete x.result;pattern=/Missing CRAFT component: result/;break;
 case 'competitive_evidence_check':x.criteria[0].alternative_evidence_id='missing';pattern=/missing linked evidence/;break;
 case 'proposal_structure_check':x.sections=x.sections.filter(s=>s.kind!=='proof');pattern=/Missing proposal section: proof/;break;
 case 'bluf_evidence_check':x.bluf='Unsupported 999 claims';pattern=/Numeric anchors lack/;break;
 case 'launch_copy_check':x.dates[0].weekday='Tuesday';pattern=/weekday mismatch/;break;
 case 'newsletter_source_check':x.items[0].quote='Not actually in excerpt';pattern=/not present verbatim/;break;
 case 'account_coverage_check':x.required_fields.push('ownership');pattern=/Missing field ownership/;break;
 case 'claim_register_check':x.claims[0].source_base='Different population';pattern=/differs from source metadata/;break;
 case 'evidence_number_lock_check':x.ratios[0].denominator=0;pattern=/denominator zero/;break;
 case 'critique_filter_check':x.points[0].facts='not_checked';pattern=/hold_for_fact_check/;break;
 case 'sales_sequence_check':x.emails[0].subject='Re: Pretending to reply';pattern=/misleading reply/;break;
 default:assert.fail('No domain test');}const r=read(t.name,x);assert.equal(r.status,'CHECKS_FOUND');assert.match(r.issues.join('\n'),pattern);});
}
if(waveTools.some(t=>t.name==='sales_sequence_check'))test('weekend shifts never collide and first-send anchor is retained',()=>{const r=read('sales_sequence_check',inputs.sales_sequence_check);assert.deepEqual(r.dates.map(x=>x.scheduled),['2026-11-06','2026-11-09','2026-11-10']);});
export { inputs };
