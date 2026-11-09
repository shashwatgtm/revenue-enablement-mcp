import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {answerBlocker} from '../dist/answers.js';
const facts=JSON.parse(readFileSync(new URL('./fixtures/release-field-facts.json',import.meta.url)));
for(const f of facts.filter(f=>['saas','ites','telecom'].includes(f.id))){
 const ctx={product:f.product,model:f.model};
 test(`${f.id}: legal and contract blockers get a review plan`,()=>{
  for(const text of ['Legal review of the contract is pending','The contract awaits counsel approval']){
   const a=answerBlocker(text,ctx);assert.equal(a.kind,'legal');assert.match(a.how,/unresolved contract clauses/);assert.doesNotMatch(a.how,/refund/);
   assert.deepEqual(a,answerBlocker(text,ctx));
  }
  assert.equal(answerBlocker('Legal review is not required',ctx).kind,'not_confirmed');
 });
}
const pinned=[
 ['Refund approval is pending','fd5968b2b6c8ed7f4dfcd300e2d0ea6113f54982b4a77075af248f0860198617'],
 ['Procurement review is pending','63d484a0de2d09d9849de917a78ea7f652e38b8f642750dbba784a8f769ac80a'],
 ['Security review is pending','04bcc37b85fce225af6486a35441990c30435ae7012ea51293d340ec2f1168b0'],
 ['SLA approval is pending','3dd5d3280a1b7f06222ad11b24acd54839238bee7c58c34aa7a05964f6fdd8d3']
];
test('existing refund, procurement, security and SLA answers stay byte for byte',()=>{
 for(const [text,hash] of pinned)assert.equal(createHash('sha256').update(JSON.stringify(answerBlocker(text,{product:'the proposed service'}))).digest('hex'),hash);
});
