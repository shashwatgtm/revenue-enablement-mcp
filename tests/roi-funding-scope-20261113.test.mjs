import test from 'node:test';import assert from 'node:assert/strict';
import {roiInScope,roiFundingSubject,ROI_SCOPE_DECLINE,roiScopeDecline} from '../dist/roi-scope.js';
const verticals=['logistics tech','fintech','SaaS','vertical SaaS','AI native','ITeS','telecom','software','cybersecurity'];
const geos=['India','Middle East and Africa','Southeast Asia','United Kingdom','United States','Western Europe'];
test('the funding subject sets aside who funds it, with exact, equivalent and opposite inputs',()=>{
 for(const v of verticals)for(const geo of geos){
  for(const clause of ['wants to fund','is planning to fund','plans to fund','will fund','is funding']){
   const text=`A ${v} firm in ${geo} ${clause} an ABM programme for 40 target accounts`;
   assert.equal(roiFundingSubject(text),'an ABM programme for 40 target accounts');assert.equal(roiInScope({your_solution:text}),true);
  }
  assert.equal(roiInScope({your_solution:`Our ${v} company wants a paid campaign in ${geo}`}),true);
  assert.equal(roiInScope({your_solution:`Our ${v} company wants a payroll system in ${geo}, not an ABM programme`}),false);
 }
});
test('paid campaigns have scope independent of the advertiser name or buyer vertical',()=>{
 for(const name of ['LinkedIn','Google','Meta'])for(const v of verticals){
  assert.equal(roiInScope({your_solution:`${name} campaign for CFOs at UK ${v} businesses`}),true);
  assert.equal(roiInScope({your_solution:`${name} ads for operations heads in India`}),true);
  assert.equal(roiInScope({your_solution:`A payroll system, not a ${name} campaign`}),false);
 }
});
test('declines retain the exact existing text and are still absent on other tools',()=>{
 assert.equal(roiScopeDecline('roi_business_case_builder',{your_solution:'a data warehouse migration'}),ROI_SCOPE_DECLINE);
 assert.equal(roiScopeDecline('account_plan_builder',{your_solution:'a data warehouse migration'}),undefined);
});

test('the three reported funding gaps are in scope', () => {
  for (const your_solution of ['A logistics tech firm in Bengaluru wants to fund an ABM programme for 40 accounts', 'A cybersecurity firm in Dubai wants to fund events in the Gulf', 'LinkedIn campaign for CFOs at UK fintechs']) assert.equal(roiInScope({your_solution}), true, your_solution);
});
