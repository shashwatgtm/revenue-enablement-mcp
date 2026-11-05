// Fix 6 Nov 2026 (specific outputs): one fixed, ordered list of concern types, read from a blocker or a customer challenge the
// user typed. The first type whose words match wins, so the same text always gets the same type. The type decides what the
// plan or the proposal adds for it (a milestone, an owner role, a risk, a mitigation); text that matches no type gets an honest
// "add a step to resolve" with an owner question instead of a guess. No type adds a figure, a date, a name or a fact about the
// product: each says what to confirm and who confirms it.

export type ConcernId =
  | 'data-residency' | 'privacy' | 'security' | 'compliance' | 'legal' | 'budget' | 'bill-forecast' | 'price'
  | 'procurement' | 'service-level' | 'quality' | 'integration' | 'capacity' | 'switching' | 'adoption' | 'approval' | 'timing';

export interface ConcernType { id: ConcernId; label: string; reason: string; test: RegExp }

const PLACE = String.raw`(?:the\s+)?(?:EU|EEA|European Union|Europe|UK|United Kingdom|US|USA|United States|India|Germany|France|country|region|jurisdiction|our region|their region|home country|data cent(?:er|re))`;
export const CONCERN_TYPES: ConcernType[] = [
  { id: 'data-residency', label: 'data residency', reason: 'it says where data may be stored, handled or sent, or that it must not leave a place',
    test: new RegExp(String.raw`\b(?:data residency|data locali[sz]ation|data sovereignty|sovereign (?:cloud|hosting)|cross[- ]border (?:data|transfers?)|in[- ]country (?:hosting|storage|processing)|(?:leave|leaves|leaving|outside|out of|stay in|stays in|remain in|remains in|kept in|hosted in|stored in|processed in|handled in|transferred (?:out of|outside))\s+${PLACE}\b|${PLACE}\s+(?:hosting|data cent(?:er|re)s?|region only)|where (?:the\s+)?(?:data|contacts?|calls?|conversations?|records?|files?|customer data|work) (?:can|may|must|is|are)?\s*(?:be\s+)?(?:handled|stored|processed|hosted|kept|accessed|sent))`, 'i') },
  { id: 'privacy', label: 'privacy and personal data', reason: 'it names personal data, privacy, consent, redaction or a data protection rule',
    test: /\b(?:personal data|personally identifiable|pii|privacy|data protection|gdpr|consent|hipaa|patient data|health data|redact\w*|call recordings?|anonymi[sz]\w*)\b/i },
  { id: 'security', label: 'security review', reason: 'it names security, a security questionnaire, a certificate such as SOC 2 or ISO 27001, access control or a breach',
    test: /\b(?:security|infosec|soc ?2|iso ?27001|pen(?:etration)? test\w*|questionnaire|vulnerab\w*|encrypt\w*|access (?:control|rights|reviews?)|single sign[- ]on|sso|breach\w*)\b/i },
  { id: 'compliance', label: 'compliance and regulation', reason: 'it names compliance, a regulator, an audit or a certification',
    test: /\b(?:complian\w*|regulat\w*|audit\w*|certif\w*|accredit\w*|ai act|dora|pci|sox)\b/i },
  { id: 'legal', label: 'legal and contract terms', reason: 'it names legal, a contract, a clause, liability or the paper the deal is signed on',
    test: /\b(?:legal|lawyers?|counsel|contracts?|contractual|liabilit\w*|indemnit\w*|redlines?|msa|dpa|clauses?|terms and conditions|intellectual property)\b/i },
  { id: 'budget', label: 'budget', reason: 'it says the budget is not approved, not allocated, frozen or owned by someone not yet involved',
    test: /\b(?:no budget|not (?:yet )?budgeted|unbudgeted|budget (?:is |was |has been )?(?:not|frozen|freeze|cut|cuts|unapproved|unconfirmed|pending|owner|approval|holder)|(?:approved?|approval of|release|allocate[sd]?) (?:a |the )?budget|next (?:fiscal|financial) year)\b/i },
  { id: 'bill-forecast', label: 'bill forecast', reason: 'it asks what the bill will be: a forecast, the monthly bill, usage or overage charges, or cost that moves with volume',
    test: /\b(?:forecast\w*|bills?|billing|billed|invoic\w*|monthly (?:cost|spend|charges?)|overages?|usage[- ]based|unpredictable (?:cost|costs|spend|bill)|cost (?:is |are )?(?:not )?predictab\w*|predictab\w* (?:cost|costs|spend|bill)|cost (?:rises|grows|goes up|increases) with|rises with volume|grows with volume)\b/i },
  { id: 'price', label: 'price', reason: 'it questions the price or the cost: too expensive, cheaper elsewhere, the return or the payback',
    test: /\b(?:price|prices|pricing|priced|expensive|cheaper|costs?|costly|afford\w*|spend|roi|return on investment|payback|discount\w*|business case)\b/i },
  { id: 'procurement', label: 'procurement', reason: 'it names procurement, vendor registration or approval, a tender or a purchase order',
    test: /\b(?:procurement|vendor (?:onboarding|registration|approval|set ?up)|approved (?:supplier|vendor)s?(?: list)?|supplier onboarding|tenders?|rfp|rfq|purchase orders?|purchasing)\b/i },
  { id: 'service-level', label: 'service level', reason: 'it names a service level, an SLA, uptime or a response or resolution time',
    test: /\b(?:service levels?|slas?|uptime|response times?|resolution times?|turnaround times?)\b/i },
  { id: 'quality', label: 'quality and accuracy', reason: 'it names quality, accuracy, errors, wrong answers or a scorecard',
    test: /\b(?:quality|accura\w*|hallucinat\w*|wrong answers?|errors?|mistakes?|scorecards?|guardrails?|human review|rework)\b/i },
  { id: 'integration', label: 'integration and technical fit', reason: 'it names an integration, an API, a system to connect, a migration or the technical team',
    test: /\b(?:integrat\w*|apis?|connect\w*|legacy|migrat\w*|data quality|it team|engineering|technical|help ?desk|crm|erp|systems?)\b/i },
  { id: 'capacity', label: 'capacity and staffing', reason: 'it names peaks, volume, staffing, capacity or the time people have',
    test: /\b(?:peaks?|seasonal\w*|volume spikes?|staff\w*|headcount|capacity|bandwidth|resourc\w*|no time|busy|workload|backlog)\b/i },
  { id: 'switching', label: 'switching from the current way', reason: 'it names the current provider, an incumbent, a renewal or moving work across',
    test: /\b(?:current (?:provider|vendor|supplier|tool|system|platform|partner)|incumbent|switch\w*|moving (?:the )?work|move (?:the )?work|moving from|transition\w*|cut ?over|lock[- ]in|existing (?:contract|vendor|provider|supplier)|renew\w*)\b/i },
  { id: 'adoption', label: 'adoption and change', reason: 'it names adoption, training, change or people who may not use it',
    test: /\b(?:adopt\w*|change management|training|resist\w*|habits?|users? (?:will not|won't|do not|don't)|uptake)\b/i },
  { id: 'approval', label: 'approval and sponsorship', reason: 'it names an approval, a sign off, a sponsor, the board or a senior decision maker',
    test: /\b(?:approv\w*|sign[- ]?off|signs? off|sponsor\w*|board|steering|ceo|coo|cfo|cio|cto|decision makers?|stakeholders?|buy[- ]in|alignment)\b/i },
  { id: 'timing', label: 'timing', reason: 'it names a deadline, a delay, a freeze, a holiday or other priorities',
    test: /\b(?:timelines?|deadlines?|too long|delay\w*|slow\w*|freeze|frozen|holidays?|year[- ]end|quarter[- ]end|fiscal year|next year|not a priority|other priorit\w*|reorg\w*)\b/i },
];

/** The concern type of a typed blocker or challenge: the first type in the fixed list whose words match, or null. */
export function concernOf(text: string): ConcernType | null {
  const t = String(text || '');
  return CONCERN_TYPES.find((c) => c.test.test(t)) || null;
}
