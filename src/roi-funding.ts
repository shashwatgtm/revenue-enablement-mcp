import {readMoney} from './echo-layer.ts';
import {readRegionContext} from './region-reader.ts';
import {roiFundingSubject, roiScopeDecline} from './roi-scope.ts';
import {revenueReading} from './revenue-reader-actions.ts';
import * as rules from './roi-funding-config.ts';

type Args = Record<string, unknown>;
export type FundingClock = () => Date;
export interface FundingMoney {value:number|undefined; currency:string; marked:boolean; raw:string}
const text = (x:unknown):string => typeof x==='string' ? x.trim() : '';
const num = (x:unknown):number|undefined => x!==undefined && x!==null && String(x).trim()!=='' && Number.isFinite(Number(x)) ? Number(x) : undefined;
const clean = (s:string):string => s.replace(/[\r\n|<>]/g,' ').replace(/[\u2013\u2014]/g,',').replace(/!/g,'.');
const code = (s:string):string => /^(?:Rs\.?|INR|₹)$/i.test(s)?'INR': /^(?:\$|USD)$/i.test(s)?'USD': /^(?:£|GBP)$/i.test(s)?'GBP':/^(?:€|EUR)$/i.test(s)?'EUR':/^(?:S\$|SGD)$/i.test(s)?'SGD':/^AED$/i.test(s)?'AED':'';
/** The page mirrors this small rule; a shared input list checks parity. No conversion. */
export function readFundingMoney(value:unknown, currency=''):FundingMoney {
 const raw=String(value??'').trim().replace(/\\(?=\$)/g,'');
 const mark=raw.match(/Rs\.?|INR|₹|S\$|SGD|AED|USD|GBP|EUR|\$|£|€/i);
 const normal=raw.replace(/\bGBP\b/i,'£').replace(/\bEUR\b/i,'€');
 const unsigned=normal.replace(/-\s*(?=\d)/,'');
 const parsed=readMoney(mark?unsigned:'USD '+unsigned,true);
 const valid=/^(?:(?:Rs\.?|INR|₹|S\$|SGD|AED|USD|GBP|EUR|\$|£|€)\s*)?-?\d[\d,]*(?:\.\d+)?\s*(?:lakh|crore|million|billion|thousand|k|m)?$/i.test(raw);
 return {value:valid && parsed ? parsed.value * (/-\s*\d/.test(raw)?-1:1):undefined,currency:mark?code(mark[0]):code(currency),marked:!!mark,raw};
}
export function fundingMoney(value:number,currency:string,derived=true):string {
 const n=derived?Math.round(value):value;
 if(currency==='INR') {
  if(Math.abs(n)>=1e7)return `Rs ${Number((n/1e7).toFixed(2))} crore`;
  if(Math.abs(n)>=1e5)return `Rs ${Number((n/1e5).toFixed(2))} lakh`;
  return 'Rs '+n.toLocaleString('en-IN',{maximumFractionDigits:derived?0:20});
 }
 const symbols:Record<string,string>={USD:'$',GBP:'£',EUR:'€',AED:'AED ',SGD:'S$'};
 return (symbols[currency]??'')+n.toLocaleString('en-US',{maximumFractionDigits:derived?0:20})+(symbols[currency]?'':' in the currency you used');
}
export const fundingMonths = (n:number):number => Math.floor((n+Number.EPSILON)*10+0.5)/10;
const months = (n:number):string => fundingMonths(n).toFixed(1);
const NEGATION=/\b(?:not|no|non|without|never|excluding|except|nor|neither|isn['’]t|aren['’]t|rather than|instead of|other than)\b/i;
export interface FundingClassification {kind:rules.FundingClass; group:string; reason:string; mixed:boolean}
export function classifyFunding(value:string):FundingClassification {
 const subject=/^\s*(?:a |an |the |our )?vendor\b/i.test(value)?value:roiFundingSubject(value);
 // A funder's industry and an audience description cannot turn a programme into a purchase.
 const bought=subject.split(/\b(?:for|targeting|aimed at|sold to|serving)\b/i)[0];
 const paid=/\b(?:paid (?:media|social|search|ads|advertising|campaigns?|acquisition)|social (?:media )?ads|(?:LinkedIn|Google|Meta) (?:ads|campaigns?)|sponsored posts bought as ads)\b/i.test(bought);
 const booth=/\b(?:booth|exhibition|trade[- ]?show)\s+sponsorship\b/i.test(bought);
 const hits:{kind:rules.FundingClass;group:string;word:string}[]=[];
 for(const row of rules.CLASS_TABLE) {
  if(paid && row.group==='audience')continue;
  for(const clause of bought.replace(/\bnot (?:only|just|merely)\b/gi,' ').split(/[.;:!?\n,()[\]]+|\bbut\b|\bwhile\b|\bwhereas\b/i)) {
   for(const match of clause.matchAll(row.pattern)) {
    const before=clause.slice(0,match.index);
    const after=clause.slice((match.index??0)+match[0].length);
    if(NEGATION.test(before))continue;
    if(row.group==='purchase' && /^\s+(?:firm|company|startup|business)\b/i.test(after))continue;
    if(row.group==='sponsorship' && ((booth&&rules.BOOTH_SPONSORSHIP_CLASS==='direct')||paid))continue;
    hits.push({kind:row.kind,group:row.group,word:match[0]});
   }
  }
 }
 const chosen=hits[0];
 return chosen?{kind:chosen.kind,group:chosen.group,reason:chosen.word,mixed:new Set(hits.map(h=>h.kind)).size>1}:{kind:'other',group:'other',reason:'no direct revenue line',mixed:false};
}
const GEO_NAMES:Record<string,string>={'india':'India','middle-east':'Middle East and Africa','southeast-asia':'Southeast Asia','uk':'United Kingdom','north-america':'United States','western-europe':'Western Europe'};
export function fundingGeo(args:Args,explicit:string,currency:string):string {
 if(Object.values(GEO_NAMES).includes(explicit))return explicit;
 const words=[text(args.your_solution),text(args.known_metrics),text(args.current_process)].join(' ');
 if(/\b(?:Africa|Nairobi|Kenya|Nigeria|Lagos|South Africa|Cape Town|Johannesburg)\b/i.test(explicit+' '+words))return 'Middle East and Africa';
 const regions=readRegionContext({...args,region:explicit}).regions;
 if(regions.length===1)return GEO_NAMES[regions[0].region_id]??'';
 return ({INR:'India',GBP:'United Kingdom',AED:'Middle East and Africa',SGD:'Southeast Asia'} as Record<string,string>)[currency]??'';
}
export interface FundingInputs {
 subject:string; classification:FundingClassification; fixed:boolean; guarded:boolean; S:number|undefined;N:number|undefined;A:number|undefined;L:number;G:number|undefined;C:number|undefined;W:number|undefined;fy:number|undefined;start:string;currency:string;geo:string;limitGiven:boolean;error:string;missing:string[];signs:string;period:string;
}
export function readFundingInputs(args:Args,clock:FundingClock=()=>new Date()):FundingInputs {
 const metrics=text(args.known_metrics);const fixed=/^helix-roi-v1(?:;|$)/.test(metrics);
 const fields:Record<string,string>={};
 if(fixed)for(const bit of metrics.split(';').slice(1)){const at=bit.indexOf('=');if(at>0)fields[bit.slice(0,at).trim()]=bit.slice(at+1).trim();}
 const words=[metrics,text(args.current_process),fixed?'':text(args.your_solution)].join('; ');
 const newCount=words.match(/(?<![\w.-])(-?\d+(?:\.\d+)?)\s+(?:new|expected|forecast|target)\s+(?:customers?|logos?)\b/i)??words.match(/\b(?:new|expected|forecast|target)\s+(?:customers?|logos?)\s*(?:[:=]|of|is|are)?\s*(\d+(?:\.\d+)?)/i)??words.match(/\b(\d+(?:\.\d+)?)\s+customers?\s+from this\b/i);
 const amount=String.raw`((?:(?:Rs\.?|INR|₹|S\$|SGD|AED|USD|GBP|EUR|\$|£|€)\s*)?-?\d[\d,]*(?:\.\d+)?\s*(?:lakh|crore|million|billion|thousand|k|m)?)`;
 const annual=new RegExp(String.raw`(?:at|one (?:new )?customer pays|per customer(?: per year)?\s*[:=]?|annual revenue per customer\s*[:=]?)\s*${amount}\s*(?:each|a year|per year|annually|ARR)`, 'i').exec(words);
 const spendMention=new RegExp(String.raw`(?:spend|cost|budget)\s*(?:of|is|[:=])?\s*${amount}`,'i').exec(words);
 const spend=readFundingMoney(args.solution_price??(fixed?fields.spend:spendMention?.[1]),fields.currency);
 if(!fixed && spendMention){const marked=readFundingMoney(spendMention[1]);spend.marked=marked.marked;spend.currency=marked.currency;}
 const per=readFundingMoney(fixed?fields.per_customer:annual?.[1],fields.currency);
 const metricNumber=(key:string,pattern:RegExp):number|undefined=>fixed?num(fields[key]):num(words.match(pattern)?.[1]);
 const qualifiedCount=words.match(/\b(?:expect(?:ed)?|forecast|target)\s+(-?\d+(?:\.\d+)?)\s+(?:new\s+)?(?:customers?|logos?)\b/i);
 const N=fixed?num(fields.customers):num((newCount??qualifiedCount)?.[1]); const A=per.value;
 const l=metricNumber('limit_months',/\b(?:payback )?limit\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)\s*(?:months?)?/i);
 const G=metricNumber('margin',/\b(?:gross )?margin\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)/i);
 const C=metricNumber('cycle_months',/\b(?:sales cycle|cycle|first touch to signed deal)\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)/i);
 const W=metricNumber('win_rate',/\bwin rate\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)/i);
 const currency=spend.currency||per.currency||code(fields.currency??'');const geo=fundingGeo(args,fields.geo??'',currency);
 const fyInput=metricNumber('fy_start',/\b(?:fy start|financial year start)\s*(?:month|[:=])?\s*(-?\d+)/i);
 const fy=fyInput??(geo==='India'?rules.INDIA_FY_DEFAULT_START_MONTH:undefined);
 const now=clock();const defaultStart=`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}`;
 const start=fields.start||words.match(/\bstart\s*[:=]?\s*(\d{4}-\d{2})/i)?.[1]||defaultStart;
 const L=l??rules.DEFAULT_LIMIT_MONTHS;let error='';
 for(const [label,n]of [['spend',spend.value],['new customers',N],['revenue per customer',A],['payback limit',l],['gross margin',G],['sales cycle',C],['win rate',W],['financial year start month',fyInput]] as [string,number|undefined][]){if(n!==undefined&&n<0){error=`Check your figures: ${label} cannot be negative.`;break;}}
 if(!error && ((G!==undefined&&(G===0||G>100))||(W!==undefined&&(W===0||W>100))))error=`Check your figures: ${G!==undefined&&(G===0||G>100)?'gross margin':'win rate'} must be above 0 and at most 100 percent.`;
 if(!error&&(L<1||L>60))error='Check your figures: payback limit must be from 1 to 60 months.';
 if(!error&&C!==undefined&&C>36)error='Check your figures: sales cycle cannot exceed 36 months.';
 if(!error&&fy!==undefined&&(!Number.isInteger(fy)||fy<1||fy>12))error='Check your figures: financial year start must be a month from 1 to 12.';
 if(!error&&!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(start))error='Check your figures: give the start month as year and month.';
 if(!error&&spend.value!==undefined&&A!==undefined&&((spend.currency&&per.currency&&spend.currency!==per.currency)||(!fixed&&spend.marked!==per.marked)))error='Check your figures: spend and revenue must be in the same currency.';
 const guarded=!(fixed&&N!==undefined&&A!==undefined)&&!(N!==undefined&&A!==undefined&&['revenue_increase','multiple'].includes(text(args.primary_value_driver)));
 const missing:string[]=[];for(const [k,label]of [['customers','new customers'],['per_customer','revenue per customer'],['margin','gross margin'],['cycle_months','sales cycle'],['win_rate','win rate'],['limit_months','payback limit']] )if(fixed&&fields[k]&&((k==='per_customer'?A:num(fields[k]))===undefined))missing.push(label);
 return {subject:roiFundingSubject(text(args.your_solution)),classification:classifyFunding(text(args.your_solution)),fixed,guarded,S:spend.value,N,A,L,G,C,W,fy,start,currency,geo,limitGiven:l!==undefined,error,missing,signs:fields.signs??'',period:fields.period??'MISSING'};
}
export function fundingVerdict(kind:rules.FundingClass,p:number,L:number):{row:string;words:string} {
 const rounded=fundingMonths(p);
 if(kind==='long'&&rounded<=rules.SMALL_TEST_MULTIPLE*L)return {row:'long',words:'Passes as a long build'};
 if(rounded<=L)return {row:'pass',words:`Passes your ${L} month limit`};
 if(kind==='direct'&&rounded<=rules.SMALL_TEST_MULTIPLE*L)return {row:'smaller',words:'Over your limit. A smaller test could pass'};
 return {row:'fail',words:'Does not pass at this size'};
}
export function fundingRecovery(start:string,T:number,fy:number|undefined):string {
 const [year,month]=start.split('-').map(Number);const at=new Date(Date.UTC(year,month-1+Math.floor(T),1));
 const label=at.toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'});
 if(!fy)return `On your figures it is recovered in ${label}. Which month starts your financial year?`;
 const fyYear=(y:number,m:number)=>m>=fy?y:y-1;
 if(fy===4){const first=fyYear(year,month),last=fyYear(at.getUTCFullYear(),at.getUTCMonth()+1);return `Spend starts in FY ${first}-${String(first+1).slice(-2)}. On your figures it is recovered in ${label}, which is FY ${last}-${String(last+1).slice(-2)}.`;}
 const ending=(y:number,m:number)=>{const beginning=fyYear(y,m);return new Date(Date.UTC(beginning+1,fy-2,1)).toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'});};
 return `Spend starts in the financial year ending ${ending(year,month)}. On your figures it is recovered in ${label}, in the financial year ending ${ending(at.getUTCFullYear(),at.getUTCMonth()+1)}.`;
}
const FINANCE:Record<string,string[]>={
 India:['Is the figure before GST, and can we claim the input credit?','For a foreign media or software bill, what tax do we withhold or pay ourselves?'],
 'Middle East and Africa':['Which entity pays, and in which country?','Is VAT on this recoverable for that entity?'],
 'Southeast Asia':['Which entity pays, and in which country?','Is GST or VAT on this recoverable for that entity?'],
 'United Kingdom':['Is the figure before VAT, and is the VAT recoverable?','Do we judge payback on revenue or on gross margin?'],
 'United States':['Does any state sales tax apply to this bill?'],
 'Western Europe':['Is the figure before VAT?','For a supplier in another country, who accounts for the VAT?'],
};
export function fundingRoutes(i:FundingInputs,failed=false,undecided=false):{action:string;routes:[string,string][]} {
 const book:['Book 45 minutes',string]=['Book 45 minutes',rules.BOOKING];
 const tool=(host:string,name:string):string=>`https://${host}.gtmhelix.com/tools/${name.replace(/_/g,'-')}/`;
 const plugin=(name:string):string=>`https://tools.gtmhelix.com/plugins/${['account-research','evidence-research-asset'].includes(name)?'b2b-research-market-and-account':'b2b-events-pr-and-launches'}/`;
 if(failed)return {action:'Rework the programme size before taking it to finance.',routes:[['Audit the GTM plan','https://gtmalpha.gtmhelix.com/integration'],book]};
 if(i.classification.kind==='enabler')return {action:'Check the demand programme and the purchase separately.',routes:[book]};
 if(i.classification.kind==='brand')return {action:'Pick the signs you will track before committing the amount.',routes:[['Plan the PR work',plugin('pr-launch-pack')],book]};
 if(undecided||i.classification.kind==='other')return {action:'Agree the missing assumptions before sizing the ask.',routes:[book,['Size the market',tool('icp-intelligence','tam_sam_som_calculator')]]};
 switch(i.classification.group){
  case 'media':return {action:'Check whether the paid programme is ready to scale.',routes:[['Scale Paid check','https://helix-scale-paid-check.shashwat-helix-gtm.chatgpt.site'],book]};
  case 'abm':return {action:'Prioritise the accounts before committing the spend.',routes:[['Prioritise the accounts',tool('icp-intelligence','account_prioritization')],['Research the accounts',plugin('account-research')]]};
  case 'events':return {action:'Plan the event backwards from the customers needed.',routes:[['Plan the event',plugin('event-planner')],['Plan the follow-up',plugin('event-follow-up-engine')]]};
  case 'partner':return {action:'Check the partner programme before committing the spend.',routes:[['Build the partner plan',tool('craft-gtm','partner_architect')],book]};
  case 'content':case 'search':return {action:'Check the evidence and audience for the programme.',routes:[['Build an evidence asset',plugin('evidence-research-asset')],['Check the market context',tool('craft-gtm','competitive_intel')]]};
  case 'outbound':return {action:'Check the audience and discovery questions before sizing outreach.',routes:[['Score the audience',tool('icp-intelligence','icp_scoring_model')],['Prepare discovery questions',tool('revenue-enablement','discovery_question_bank')]]};
  default:return {action:'Take the assumptions and finance questions to the budget meeting.',routes:[book]};
 }
}
export function buildRoiFunding(args:Args,clock:FundingClock=()=>new Date()):string {
 const decline=roiScopeDecline('roi_business_case_builder',args);if(decline)return decline;
 const i=readFundingInputs(args,clock);const {S,N,A,L,G,C,W}=i;const kind=i.classification.kind;
 const cash=(n:number)=>fundingMoney(n,i.currency);const given=(n:number)=>fundingMoney(n,i.currency,false);const Ls:string[]=[];
 const hasForecast=!i.guarded&&N!==undefined&&A!==undefined;const R=hasForecast?N*A:undefined;
 const P=R!==undefined&&R>0&&S!==undefined?12*S/R:undefined;
 const Pg=P!==undefined&&G!==undefined?P/(G/100):undefined;
 const invalid=i.error||(S!==undefined&&S>0&&P!==undefined&&P<0.5?'Check your figures: this says the spend comes back in under two weeks.':'');
 const eligible=kind==='direct'||kind==='long';const canJudge=eligible&&hasForecast&&S!==undefined&&S>0&&!invalid;
 const zero=canJudge&&(N===0||A===0);const decided=canJudge&&P!==undefined&&!zero;
 const base=decided?fundingVerdict(kind,P!,L):undefined;const gm=decided&&Pg!==undefined?fundingVerdict(kind,Pg,L):undefined;
 let first=invalid|| (S===undefined?'Not decided yet: give the spend.':S===0?'A spend of 0 has no payback to check.':kind==='brand'?'Not a payback decision':kind==='enabler'?'Break-even only: what must be true':kind==='other'?'Not decided yet: what must be true':zero?'Does not pass: no new revenue on your figures.':!decided?'Not decided yet: what must be true':`Pays back in ${months(P!)} months. ${base!.words}.`);
 if(decided&&!i.limitGiven)first=first.replace(`Passes your ${L} month limit`,`Passes a ${L} month limit (this tool's rule, not a benchmark)`)+" Give your finance team's limit to change it.";
 Ls.push(first,'','A calculation on your inputs. Not a forecast.');
 if(decided){
  Ls.push('','| Case | New ARR | Payback | Against the limit |','| --- | --- | --- | --- |');
  for(const [label,multiple]of [['Half arrive',0.5],['Your figures',1],['One and a half times',1.5]] as [string,number][]){const p=12*S!/(R!*multiple);Ls.push(`| ${label} | ${cash(R!*multiple)} | ${months(p)} months | ${fundingVerdict(kind,p,L).words} |`);}
  if(fundingVerdict(kind,2*P!,L).row!==base!.row)Ls.push('',`Fragile. If half the customers arrive: ${months(2*P!)} months. ${fundingVerdict(kind,2*P!,L).words}.`);
 }
 Ls.push('','### What I read',`- Funded work: ${rules.CLASS_NAMES[kind]}.`,`- Region: ${i.geo||'MISSING. Which region applies?'}`,`- Spend: ${S===undefined?'MISSING':given(S)}.`,`- Expected new customers: ${N??'MISSING'}.`,`- What one pays a year: ${A===undefined?'MISSING':given(A)}.`,`- Payback limit: ${L} months${i.limitGiven?' (your limit)':" (this tool's rule, not a benchmark)"}.`);
 if(i.classification.mixed&&!eligible)Ls.push(`Read as ${rules.CLASS_NAMES[kind]} because you mentioned ${clean(i.classification.reason)}. If this is a demand programme, say what it is without that word.`);
 if(i.missing.length)Ls.push(`Read as missing because text was given for: ${i.missing.join(', ')}.`);
 for(const [key,label]of [['annual_value_estimate','The annual value you entered'],['current_annual_cost','The cost figures you entered'],['expected_improvement_percent','The improvement percentage you entered']] )if(args[key]!==undefined)Ls.push(`${label}: ${clean(String(args[key]))}. Not used to judge this spend.`);
 if(zero)Ls.push('','On your figures this brings no new revenue, so there is no payback.');
 if(invalid&&P!==undefined)Ls.push('',`Arithmetic only: CAC ${cash(S!/N!)}; payback ${months(P)} months. No verdict.`);
 if(decided)Ls.push('',`CAC: ${cash(S!/N!)}. Expected new ARR: ${cash(R!)}.`);
 if(gm){Ls.push('','### On gross margin',`${months(Pg!)} months. ${gm.words}.`);if(gm.row!==base!.row)Ls.push('Fragile. The gross margin row changes the result.');if(base!.row==='pass'&&gm.row!=='pass')Ls.push('Passes on revenue, not on gross margin');}
 if(/\b(?:services|ITeS|outsourcing|managed services|agency)\b/i.test(text(args.your_solution))&&G===undefined)Ls.push('','Give gross margin first so finance can check the contribution as well as revenue.');
 if(kind==='brand') {
  Ls.push('','Brand awareness, AR and PR do not pay back inside a quarter, and a payback figure here would be made up. Decide it as an amount you can hold for a year, and track leading signs.');
  if(S!==undefined&&S>0&&A!==undefined&&A>0&&!invalid)Ls.push(`For scale only: covering this cost in ${L} months would take ${Math.ceil(12*S/L/A)} new customers at what one pays you.`);
  Ls.push('Signs to pick: branded search; direct traffic; share of buyers who had heard of you before the first call; analyst briefings held and reports that include you; coverage in the publications your buyers read; inbound demos naming a source.');
 }
 Ls.push('','### Recovery and financial year');
 if(i.geo==='India'&&i.fy===4)Ls.push('Financial year read as April to March (India default). Change it if yours differs.','Source: https://www.incometaxindia.gov.in/w/section-3-172');
 if(decided&&C!==undefined)Ls.push(`Months to recovery: ${months(C+P!)}.`,fundingRecovery(i.start,C+P!,i.fy));
 else if(eligible)Ls.push('Add the months from first touch to signed deal to see which financial year the money comes back in.');
 if(i.geo!=='India'&&i.fy===undefined)Ls.push('Which month starts your financial year?');
 Ls.push('','### What must be true');
 if(S!==undefined&&S>0&&!invalid&&kind!=='brand'){
  Ls.push(`Required ${i.guarded?'annual revenue':'new ARR'} at ${L} months: ${cash(12*S/L)}.`);
  if(A!==undefined&&A>0){const required=Math.ceil(12*S/L/A);Ls.push(`Required new customers: ${required}.`);if(W!==undefined)Ls.push(`Required opportunities at your ${W} percent win rate: ${Math.ceil(required/(W/100))}.`);if(decided)Ls.push(`Customers that must close for this to pass: ${required} of the ${N} you expect.`);}
 }
 const asks:string[]=[];if(S===undefined)asks.push('What will it cost?');else if(S>0&&!invalid){if(A===undefined)asks.push('What does one new customer pay a year?');if(N===undefined)asks.push('How many new customers do you expect?');else if(W===undefined&&A!==undefined)asks.push('What win rate should finance use?');}
 Ls.push(...asks.slice(0,2));
 Ls.push('','At 90 days you can read leading signs only.');
 if(rules.SHOW_GTM_FIX_RULE&&(kind==='long'||kind==='brand'||!decided&&kind!=='enabler'))Ls.push(rules.GTM_FIX_RULE);
 Ls.push('','### Lines for finance');
 if(kind==='brand')Ls.push(`Amount: ${S===undefined?'MISSING':given(S)}.`,`Period held: ${clean(i.period)}.`,`Selected signs and values today: ${clean(i.signs)||'MISSING'}.`);
 else Ls.push(`Spend: ${S===undefined?'MISSING':given(S)}.`,decided?`Revenue payback: ${months(P!)} months against ${L} months. ${gm?`Gross margin payback: ${months(Pg!)} months.`:''}`:'Expected new customers and annual revenue per customer need to be confirmed before a funding verdict.');
 for(const question of ['How many of these customers would have come without this spend?','Is the spend counted before or after recoverable tax?','Which financial year does the spend fall in, and which year does the return fall in?',...(FINANCE[i.geo]??[])])Ls.push('- '+question);
 const reading=revenueReading('roi_business_case_builder',args,'');if(reading)Ls.push('',...reading.roles);
 if(/\b(?:outbound(?: email)?|cold email|email outreach)\b/i.test(i.subject)&&['United Kingdom','United States'].includes(i.geo)){
  Ls.push('','### Outbound email note',i.geo==='United Kingdom'?'You can email corporate bodies without prior consent. Sole traders and some partnerships are treated as individuals. Keep a "do not email" list. https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/':'CAN-SPAM makes no exception for business to business email. An opt-out must be honoured within 10 business days. https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business','Checked 13 Nov 2026. Check with your counsel before you size the list.');
 }
 Ls.push('','### How this is worked out','CAC = spend / new customers. Monthly ARR per customer = annual revenue per customer / 12. Payback = 12 x spend / (new customers x annual revenue per customer). Gross margin payback = payback / (gross margin / 100). Recovery = sales cycle + payback.','Required annual revenue = 12 x spend / limit. Required customers are rounded up. Required opportunities = required customers / (win rate / 100), rounded up.','Months are rounded half up to one decimal before comparison with the limit. Money results are rounded to the nearest whole unit. Counts are rounded up.','Demand programmes pass at the limit; up to twice the limit a smaller test could pass. A long build passes up to twice the limit. Beyond twice the limit neither passes. Brand, software and unmatched GTM work have no funding verdict.',`Rules of this tool: default ${rules.DEFAULT_LIMIT_MONTHS} month limit; half and one and a half times the revenue; twice the limit for a smaller test or long build; under 0.5 months needs checking; limit from 1 to 60 months; cycle at most 36 months; gross margin and win rate above 0 and at most 100 percent.`,'Recovery is counted from the first day of the start month. Add sales cycle and payback, then round down to whole months to find the recovery month. No currency conversion.');
 if(gm&&rules.SHOW_BESSEMER_LINE)Ls.push(rules.REFERENCE_LINE);
 Ls.push('','### What this is not','This is not a forecast or an instruction to spend. It checks one programme on your inputs. It is not a market benchmark, a budget split, tax advice, legal advice or a software recommendation.');
 const route=fundingRoutes(i,base?.row==='fail',!decided&&kind!=='brand'&&kind!=='enabler');
 Ls.push('','### Next action',route.action,'','### Routes',...route.routes.map(([label,url])=>`[${label}](${url})`));
 if(i.guarded){if(['cost_reduction','productivity','risk_mitigation'].includes(text(args.primary_value_driver)))Ls.push('','This tool now checks marketing spend against new revenue.');Ls.push('','If this is your own marketing spend, give the new customers you expect and what one pays a year.');}
 // Guarded calls must never relabel old annual value fields as new revenue.
 return Ls.join('\n').replace(/\n{3,}/g,'\n\n').replace(/[\u2013\u2014]/g,',');
}
