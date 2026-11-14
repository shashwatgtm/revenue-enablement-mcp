const n=(total,won=0,lost=0,nd=0,open=0)=>({total,won,lost,nd,open});
const one=k=>n(1,k==='won'?1:0,k==='lost'?1:0,k==='nd'?1:0,k==='open'?1:0);
export const ROUND3_CASES=[
 {id:'review-arrow-trailing-rival',group:'review',input:'3PL South -> lost to a rival on price',expected:one('lost'),outcomes:['lost']},
 {id:'review-colon-trailing-rival',group:'review',input:'3PL South: lost to a rival on price',expected:one('lost'),outcomes:['lost']},
 {id:'review-comma-trailing-incumbent',group:'review',input:'3PL South, lost to the incumbent',expected:one('lost'),outcomes:['lost']},
 {id:'review-subject-trailing-incumbent',group:'review',input:'Bank B lost to the incumbent',expected:one('lost'),outcomes:['lost']},
 {id:'review-we-won-object',group:'review',input:'We won the clinic chain',expected:one('won'),outcomes:['won']},
 {id:'review-we-lost-object-and-reason',group:'review',input:'We lost the Pune lab group on price',expected:one('lost'),outcomes:['lost']},
 {id:'review-stage-negotiation',group:'review',input:'Stage,Account,Value\nNegotiation,Bank D,5L',expected:one('open'),outcomes:['open']},
 {id:'review-two-subject-sentences',group:'review',input:'We won the clinic chain. We lost the Pune lab group on price.',expected:n(2,1,1),outcomes:['won','lost']},
];
const verticals=[['Clinic','clinic network'],['Bank','bank account'],['Logistics lead','freight contract'],['Insurer','claims contract'],['IT services lead','delivery contract']];
for(const [v,object]of verticals){
 for(const variant of ['exact','same','opposite']){
  const input=variant==='exact'?`${v} A -> lost to a rival on price`:variant==='same'?`${v} A: closed lost to the incumbent on price`:`${v} A => won on the agreed scope`;
  ROUND3_CASES.push({id:`reason-${v}-${variant}`.toLowerCase().replaceAll(' ','-'),group:`reason-${v}`,variant,input,expected:one(variant==='opposite'?'won':'lost'),outcomes:[variant==='opposite'?'won':'lost']});
  const subject=variant==='exact'?`We won the first ${object}. We lost the second ${object} on price.`:variant==='same'?`${v} A signed in March. ${v} B was lost on price.`:`We won the first ${object}. We won the second ${object} after the buyer review.`;
  ROUND3_CASES.push({id:`subjects-${v}-${variant}`.toLowerCase().replaceAll(' ','-'),group:`subjects-${v}`,variant,input:subject,expected:variant==='opposite'?n(2,2):n(2,1,1),outcomes:variant==='opposite'?['won','won']:['won','lost']});
  const arrow=variant==='exact'?'->':variant==='same'?'=>':'→';const result=variant==='opposite'?'won':'lost';
  ROUND3_CASES.push({id:`arrows-${v}-${variant}`.toLowerCase().replaceAll(' ','-'),group:`arrows-${v}`,variant,input:`${v} A ${arrow} ${result} following the commercial review`,expected:one(result),outcomes:[result]});
 }
 for(const stage of ['Negotiation','Proposal','Discovery','Qualification','Demo','Evaluation','Commit'])for(const variant of ['exact','same','opposite']){
  const input=variant==='exact'?`Stage,Account,Value\n${stage},${v} A,5L`:variant==='same'?`Outcome|Deal|Reason\n${stage.toUpperCase()}|${v} A|waiting for the buyer`:`Stage\tOpportunity\tValue\nClosed Won\t${v} A\t5L`;
  ROUND3_CASES.push({id:`stage-${v}-${stage}-${variant}`.toLowerCase().replaceAll(' ','-'),group:`stage-${v}-${stage}`,variant,input,expected:one(variant==='opposite'?'won':'open'),outcomes:[variant==='opposite'?'won':'open']});
 }
}
const aliases=[['won','won'],['win','won'],['closed won','won'],['closed-won','won'],['signed','won'],['PO received','won'],['lost','lost'],['loss','lost'],['closed lost','lost'],['closed-lost','lost'],['dropped','lost'],['went with another vendor','lost'],['went with incumbent','lost'],['no decision','nd'],['no-decision','nd'],['stalled with no decision','nd'],['project paused','nd'],['project cancelled by the buyer','nd'],['open','open'],['still open','open'],['in progress','open'],['proposal sent','open'],['pending','open']];
for(const [i,[phrase,kind]]of aliases.entries())for(const variant of ['exact','same','opposite']){
 const result=variant==='opposite'?(kind==='won'?'lost':'won'):kind,status=variant==='opposite'?result:variant==='same'?phrase.toUpperCase():phrase;
 ROUND3_CASES.push({id:`prefix-${i+1}-${variant}`,group:`prefix-${phrase}`,variant,input:`${verticals[i%5][0]} A ${variant==='same'?'→':':'} ${status} ${variant==='exact'?'following the buyer review':'after the commercial review'}`,expected:one(result),outcomes:[result]});
}
ROUND3_CASES.push(
 {id:'negation-exact',group:'negation',variant:'exact',input:'Clinic A: not won yet\nCould we have won the bank contract?\nWe have not signed the insurer contract',expected:n(0),outcomes:[]},
 {id:'negation-same',group:'negation',variant:'same',input:'Clinic A was not won on price\nIf Bank A -> won on scope\nMaybe the insurer deal was signed in March',expected:n(0),outcomes:[]},
 {id:'negation-opposite',group:'negation',variant:'opposite',input:'Clinic A was won on price\nBank A -> won on scope\nThe insurer deal was signed in March',expected:n(3,3),outcomes:['won','won','won']},
 {id:'hypothesis-before-comma-outcome',group:'uncertainty',input:'If Clinic A, won on price\nBank A, could we have won the order?\nInsurer A: won if the budget is approved',expected:n(0),outcomes:[]},
 {id:'new-plain-reason-after-colon',group:'reason-placement',input:'Clinic A: lost, reason: price\nBank B: won, reason: scope\nInsurer A: no decision, reason: project paused',expected:n(3,1,1,1),outcomes:['lost','won','nd']},
 {id:'sentences-with-numbered-lines',group:'sentences',input:'Quarter review\n1. Clinic A signed in March. Bank B lost to the incumbent.\n2) Insurer A was pending the legal reply.\nTotal: 3 deals',expected:n(3,1,1,0,1),outcomes:['won','lost','open']},
 {id:'sentence-reason-not-a-second-deal',group:'sentences',input:'Clinic A lost on price. Project paused.\nBank B won on scope. The incumbent lost this contest.',expected:n(2,1,1),outcomes:['lost','won']},
 {id:'quoted-export-remains-one-record',group:'exports',input:'Stage,Account,Reason\nClosed Lost,Clinic A,"Competitor signed the account. We lost on price."\nNegotiation,Bank B,"Proposal sent. Budget is under review."',expected:n(2,0,1,0,1),outcomes:['lost','open']},
 {id:'stage-only-in-stage-field',group:'stage-boundary',input:'Clinic A: Negotiation\nBank B, Demo\nInsurer A: outcome: Commit',expected:one('open'),outcomes:['open']},
 {id:'unknown-stage-does-not-borrow-reason',group:'stage-boundary',input:'Stage,Account,Reason\nUnclear,Clinic A,won a meeting\nNegotiation,Bank B,scope review',expected:one('open'),outcomes:['open']},
 {id:'question-not-an-outcome',group:'questions',input:'Did Clinic A win the contract?\nBank B: won?\nCould the insurer deal have closed won on scope?',expected:n(0),outcomes:[]},
 {id:'negated-rival-does-not-negate-own-win',group:'reason-negation',input:'Clinic A won because the incumbent was not chosen\nBank B lost because our scope was not approved',expected:n(2,1,1),outcomes:['won','lost']},
 {id:'no-loss-then-current-open',group:'reason-negation',input:'Clinic A: not lost, still open on the current proposal',expected:one('open'),outcomes:['open']},
 {id:'first-field-name-not-its-status',group:'field-boundary',input:'Win review opportunity, lost to the incumbent\nLoss review opportunity, won on scope',expected:n(2,1,1),outcomes:['lost','won']},
 {id:'sentence-with-comma-in-reason',group:'sentences',input:'We won the clinic chain, after a scope review. We lost the bank account on price.',expected:n(2,1,1),outcomes:['won','lost']},
 {id:'totals-are-not-sentences',group:'headings',input:'Summary: We won two accounts. We lost one on price.\nClinic A: won on scope',expected:one('won'),outcomes:['won']},
);

for(const [v,object]of verticals)for(const variant of ['exact','same','opposite'])ROUND3_CASES.push({id:`contraction-${v}-${variant}`.toLowerCase().replaceAll(' ','-'),group:`contraction-${v}`,variant,input:variant==='exact'?`We haven't won the ${object} on price`:variant==='same'?`${v} A hasn’t signed the contract in March`:`We have won the ${object} on scope`,expected:variant==='opposite'?one('won'):n(0),outcomes:variant==='opposite'?['won']:[]});
for(const variant of ['exact','same','opposite'])ROUND3_CASES.push({id:`quoted-reason-question-${variant}`,group:'quoted-reason-question',variant,input:variant==='exact'?'We won the clinic contract after the buyer asked "Can you start Monday?"':variant==='same'?'Bank A: closed won because the buyer asked "Could you begin next week?"':'We lost the insurer contract after the buyer asked "Can you match the incumbent?"',expected:one(variant==='opposite'?'lost':'won'),outcomes:[variant==='opposite'?'lost':'won']});
ROUND3_CASES.push({id:'unconfirmed-stage-question',group:'questions',input:'Stage,Account,Value\nNegotiation?,Bank A,5L',expected:n(0),outcomes:[]});

ROUND3_CASES.push(
 {id:'quoted-comma-prose-exact',group:'quoted-comma-prose',variant:'exact',input:'We won the clinic chain, after they asked "Can you start Monday?". We lost the bank account on price.',expected:n(2,1,1),outcomes:['won','lost']},
 {id:'quoted-comma-prose-same',group:'quoted-comma-prose',variant:'same',input:'Clinic A signed in March, after the buyer asked "Could you begin?". Bank B was lost to the incumbent.',expected:n(2,1,1),outcomes:['won','lost']},
 {id:'quoted-comma-prose-opposite',group:'quoted-comma-prose',variant:'opposite',input:'We lost the clinic chain, after the buyer asked "Can you match the rival?". We won the bank account on scope.',expected:n(2,1,1),outcomes:['lost','won']},
 {id:'first-stated-result-before-reason',group:'reason-precedence',variant:'exact',input:'Clinic A won on scope, no decision from the incumbent\nBank B: lost to the rival, no decision on further spend',expected:n(2,1,1),outcomes:['won','lost']},
 {id:'first-stated-result-before-reason-same',group:'reason-precedence',variant:'same',input:'Clinic A-closed-won, no decision from the incumbent\nBank B was lost on price, no decision on further spend',expected:n(2,1,1),outcomes:['won','lost']},
 {id:'first-stated-result-before-reason-opposite',group:'reason-precedence',variant:'opposite',input:'Clinic A lost on scope, no decision from the incumbent\nBank B: won on price, no decision on further spend',expected:n(2,1,1),outcomes:['lost','won']}
);

ROUND3_CASES.push(
 {id:'prefix-before-unlabelled-no-decision-reason',group:'reason-precedence',input:'Lost to the incumbent, no decision on further spend\nWon on scope, no decision from the other vendor',expected:n(2,1,1),outcomes:['lost','won']},
 {id:'bare-ambiguous-prefix',group:'uncertainty',input:'Won or lost, needs checking\nLost or won after review',expected:n(0),outcomes:[]}
);
