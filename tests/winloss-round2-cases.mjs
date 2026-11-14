const counts=(total,won,lost,nd,open)=>({total,won,lost,nd,open});
export const ROUND2_CASES=[
 {id:'review-numbered-dashes',group:'review',input:'Q3 deal review\n1. Insurer A - Won - faster claims\n2. Insurer B - Lost - went with incumbent\n3. Insurer C - No decision - project paused\n4. Insurer D - Lost - price\nTotal: 4 deals',expected:counts(4,1,2,1,0)},
 {id:'review-closed-and-open',group:'review',input:'hospital x: closed won\nhospital y: closed lost (budget)\nhospital z: still open, proposal sent',expected:counts(3,1,1,0,1)},
 {id:'review-text-without-outcomes',group:'review',input:'We spoke to five banks this quarter and most liked the demo.',expected:counts(0,0,0,0,0)},
];
const verticals=['Clinic','Bank','Logistics lead','Insurer'];
const formats={
 comma:(name,status,reason)=>`${name}, ${status}, ${reason}`,
 pipe:(name,status,reason)=>`| ${name} | ${status} | ${reason} |`,
 colon:(name,status,reason)=>`${name}: ${status}: ${reason}`,
 hyphen:(name,status,reason)=>`${name} - ${status} - ${reason}`,
 en_dash:(name,status,reason)=>`${name} – ${status} – ${reason}`,
 em_dash:(name,status,reason)=>`${name}—${status}—${reason}`,
 tab:(name,status,reason)=>`${name}\t${status}\t${reason}`,
 was:(name,status,reason)=>`${name} was ${status} (${reason})`,
 parentheses:(name,status,reason)=>`${name} (${status}) ${reason}`,
 square_brackets:(name,status,reason)=>`${name} [${status}] ${reason}`,
};
const lists=['1. ','2) ','- ','* '];
for(const vertical of verticals)for(const [format,row]of Object.entries(formats))for(const variant of ['exact','same','opposite']){
 const statuses=variant==='exact'?['won','lost','no decision','open']:variant==='same'?['closed-won','closed lost','stalled with no decision','still open']:['lost','lost','no decision','open'];
 const input=['Quarter review',...statuses.map((s,i)=>(variant==='same'?'✅ ':lists[i])+row(`${vertical} ${String.fromCharCode(65+i)}`,s,['confirmed scope','price','project paused','waiting for approval'][i])), 'Overall: 4 deals'].join(variant==='same'?'\r\n':'\n');
 ROUND2_CASES.push({id:`${vertical}-${format}-${variant}`.toLowerCase().replaceAll(' ','-'),group:`separator-${format}-${vertical}`,variant,input,expected:variant==='opposite'?counts(4,0,2,1,1):counts(4,1,1,1,1)});
}
const aliases=[
 ['won','won'],['win','won'],['closed won','won'],['closed-won','won'],['signed','won'],['PO received','won'],
 ['lost','lost'],['loss','lost'],['closed lost','lost'],['closed-lost','lost'],['dropped','lost'],['went with another vendor','lost'],['went with incumbent','lost'],
 ['no decision','nd'],['no-decision','nd'],['stalled with no decision','nd'],['project paused','nd'],['project cancelled by the buyer','nd'],
 ['open','open'],['still open','open'],['in progress','open'],['proposal sent','open'],['pending','open'],
];
const one=k=>counts(1,k==='won'?1:0,k==='lost'?1:0,k==='nd'?1:0,k==='open'?1:0);
for(const [i,[phrase,kind]]of aliases.entries())for(const variant of ['exact','same','opposite']){
 const opposite=kind==='won'?'lost':'won',status=variant==='exact'?phrase:variant==='same'?phrase.toUpperCase():opposite;
 ROUND2_CASES.push({id:`alias-${i+1}-${variant}`,group:`alias-${phrase}`,variant,input:variant==='same'?`Quarter review\r\n🟢 1) ${verticals[i%4]} A [${status}]\r\nSummary: one deal`:`${verticals[i%4]} A: ${status}`,expected:one(variant==='opposite'?opposite:kind)});
}
for(const vertical of verticals)for(const separator of [',','|','\t'])for(const variant of ['exact','same','opposite']){
 const status=variant==='exact'?'closed won':variant==='same'?'SIGNED':'closed lost';
 const input=[['Outcome','Account','Reason','Owner'].join(separator),[status,`${vertical} A`,'scope confirmed','Account lead'].join(separator),['closed lost',`${vertical} B`,'no decision','Deal owner'].join(separator),['still open',`${vertical} C`,'proposal sent','Deal owner'].join(separator),['Overall: 3 deals'].join(separator)].join('\r\n');
 ROUND2_CASES.push({id:`export-${vertical}-${separator===','?'csv':separator==='|'?'pipe':'tab'}-${variant}`.toLowerCase().replaceAll(' ','-'),group:`export-${vertical}-${separator}`,variant,input,expected:variant==='opposite'?counts(3,0,2,0,1):counts(3,1,1,0,1)});
}
ROUND2_CASES.push(
 {id:'unread-same-meaning',group:'unread',variant:'same',input:'Five clinics watched the demonstration this quarter. They liked the workflow.',expected:counts(0,0,0,0,0)},
 {id:'unread-opposite',group:'unread',variant:'opposite',input:'Clinic A: signed',expected:one('won')},
 {id:'blank',group:'empty',input:'   \r\n  ',expected:counts(0,0,0,0,0)},
 {id:'reason-never-overrides-lost',group:'reason',variant:'exact',input:'Bank A - closed lost - reason: no decision\nClinic A [won] reason: incumbent lost',expected:counts(2,1,1,0,0)},
 {id:'reason-same-meaning',group:'reason',variant:'same',input:'Bank A: loss (reason: project paused)\nClinic A was closed won (reason: incumbent lost)',expected:counts(2,1,1,0,0)},
 {id:'reason-opposite',group:'reason',variant:'opposite',input:'Bank A - won - reason: no decision\nClinic A [lost] reason: incumbent won',expected:counts(2,1,1,0,0)},
 {id:'negated-result',group:'negation',variant:'exact',input:'Bank A was not won.\nReason: lost budget\nWe hoped a clinic would win a grant.',expected:counts(0,0,0,0,0)},
 {id:'negated-same-meaning',group:'negation',variant:'same',input:'Bank A: not closed won\nClinic A: not signed',expected:counts(0,0,0,0,0)},
 {id:'negated-opposite',group:'negation',variant:'opposite',input:'Bank A was won\nClinic A: signed',expected:counts(2,2,0,0,0)},
 {id:'bare-labels-are-not-records',group:'headings',input:'Won deals\nClosed lost deals\nNo decision\nOpen\nOutcome,Account,Reason\n4 deals: 1 won, 2 lost, 1 open',expected:counts(0,0,0,0,0)},
 {id:'identical-records-still-count',group:'repeated-records',input:'Logistics lead A - signed\nLogistics lead A - signed',expected:counts(2,2,0,0,0)},
 {id:'status-column-not-first',group:'exports',input:'Reason,Account,Owner,Status\nno decision,Bank A,Deal owner,Closed Lost\nincumbent lost,Clinic A,Account lead,Won\nwon a demo,Insurer A,Deal owner,Pending',expected:counts(3,1,1,0,1)},
 {id:'explicit-status-after-reason',group:'explicit-status',input:'Bank A, reason: no decision, outcome: closed lost',expected:one('lost')},
 {id:'unknown-explicit-column-is-not-reason',group:'exports',input:'Account,Outcome,Reason\nClinic A,unclear,won a meeting\nBank A,closed lost,no decision',expected:one('lost')},
 {id:'different-section-format',group:'section-format',input:'Deal,Outcome,Reason\nBank A,won,scope\nMore reviewed deals\nClinic A: still open (proposal sent)\nTotal: 2 deals',expected:counts(2,1,0,0,1)},
 {id:'no-spaces-hyphen',group:'compact-dashes',input:'Bank A-Closed-Won-scope confirmed\nClinic A-No-Decision-project paused\nInsurer A-Closed-Lost-price',expected:counts(3,1,1,1,0)},
 {id:'result-before-identifier-with-header',group:'outcome-first',input:'Status\tAccount\tReason\nPO received\tClinic A\tscope\nProject cancelled by buyer\tBank A\tpriority ended',expected:counts(2,1,0,1,0)},
 {id:'ambiguous-result',group:'ambiguous',input:'Bank A: won or lost, need to confirm\nClinic A: maybe signed',expected:counts(0,0,0,0,0)},
);

for(const vertical of verticals)for(const variant of ['exact','same','opposite'])ROUND2_CASES.push({id:`natural-${vertical}-${variant}`.toLowerCase().replaceAll(' ','-'),group:`natural-${vertical}`,variant,input:variant==='exact'?`${vertical} A closed won`:variant==='same'?`${vertical} A was signed`:`${vertical} A closed lost`,expected:one(variant==='opposite'?'lost':'won')});
ROUND2_CASES.push({id:'repeated-whitespace',group:'spacing',variant:'exact',input:'Bank A: no   decision\nClinic A: CLOSED   WON',expected:counts(2,1,0,1,0)}, {id:'unlisted-bare-status-labels',group:'headings',input:'Closed won\nClosed lost\nStill open\nIn progress\nPO received',expected:counts(0,0,0,0,0)});

ROUND2_CASES.push({id:'contraction-in-explicit-outcome-column',group:'negation',variant:'same',input:"Outcome,Account,Reason\nwon't sign,Clinic A,budget\nnot signed,Bank A,waiting\nclosed won?,Insurer A,checking",expected:counts(0,0,0,0,0)});
