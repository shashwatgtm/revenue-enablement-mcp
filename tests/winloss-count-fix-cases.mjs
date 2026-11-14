const ownEight=['Deal A, won, reason: buyer confirmed the value','Deal B, won, reason: agreed rollout','Deal C, won, reason: verified scope','Deal D, lost, reason: no decision','Deal E, lost, reason: price','Deal F, lost, reason: project ended','Deal G, lost, reason: missing approval','Deal H, lost, reason: incumbent retained'];
export const CASES=[
 {id:'owner-eight-with-heading',input:'Deals:\n'+ownEight.join('\n'),expected:{total:8,won:3,lost:5,nd:0,open:0}},
 {id:'csv-header',input:'Deal,Outcome,Reason\nDeal A,Won,Agreed scope\nDeal B,Lost,No decision\nDeal C,Lost,Price',expected:{total:3,won:1,lost:2,nd:0,open:0}},
 {id:'markdown-header',input:'| Deal | Outcome | Reason |\n|---|---|---|\n| Deal A | won | value |\n| Deal B | lost | no decision |',expected:{total:2,won:1,lost:1,nd:0,open:0}},
 {id:'heading-forms',input:'# Recent deals\nWon deals\nDeals:\nDeal A: won\n## Lost deals\nDeal B: lost\nOutcomes: won, lost, no decision',expected:{total:2,won:1,lost:1,nd:0,open:0}},
 {id:'totals-and-subtotals',input:'Deal,Outcome,Reason\nDeal A,won,value\nDeal B,lost,price\nTotal,won,2\nSubtotal,lost,2\nGrand total: 1 won, 1 lost',expected:{total:2,won:1,lost:1,nd:0,open:0}},
 {id:'blank-lines',input:'\n\n- Deal A, won, value\n\n* Deal B, lost, price\n\n',expected:{total:2,won:1,lost:1,nd:0,open:0}},
 {id:'mixed-case',input:'DEAL, OUTCOME, REASON\nDeal A, WoN, VALUE\nDeal B, lOsT, NO DECISION\nDeal C, No_DeCiSiOn, PAUSED',expected:{total:3,won:1,lost:1,nd:1,open:0}},
 {id:'zero-won',input:'Deal A,lost,price\nDeal B,no decision,budget freeze',expected:{total:2,won:0,lost:1,nd:1,open:0}},
 {id:'all-lost',input:'Deal A,lost,price\nDeal B,lost,no decision\nDeal C,lost,project ended',expected:{total:3,won:0,lost:3,nd:0,open:0}},
 {id:'one-deal',input:'Deals:\nDeal A: lost',expected:{total:1,won:0,lost:1,nd:0,open:0}},
 {id:'standalone-and-reason-no-decision',input:'Deal A,no_decision,paused\nDeal B,lost,reason: no decision',expected:{total:2,won:0,lost:1,nd:1,open:0}},
 {id:'quoted-csv-and-rival-win',input:'Deal,Outcome,Reason\n"Deal A",lost,"price, no decision after review"\n"Deal B",won,"scope, incumbent lost"',expected:{total:2,won:1,lost:1,nd:0,open:0}},
 {id:'only-headers-and-unlabelled-notes',input:'Deal,Outcome,Reason\nDeals:\nWon\nNo decision\nTotal: 3 won\nWe need better follow-up',expected:{total:0,won:0,lost:0,nd:0,open:0}},
 {id:'open-explicit-outcome',input:'Deal,Status,Reason\nDeal A,open,review pending\nDeal B,won,confirmed\nUnlabelled note about a lost reason',expected:{total:2,won:1,lost:0,nd:0,open:1}},
];
