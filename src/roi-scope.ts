// Owner decision, 13 Nov 2026: the ROI Business Case Builder builds cases for GTM and
// marketing investments only (marketing, ABM, events, AR/PR, content, SEO/AEO/GEO, field
// marketing, martech tools, outbound software, media spend, brand awareness, partnerships).
// Anything else gets a short plain decline: no case, no figures. Exact rules only: keyword
// sets with word boundaries, read clause by clause, with a negated mention ("not a
// marketing tool") ignored. The software policy (software-policy.ts) still runs first.

export const ROI_SCOPE_DECLINE = [
  '# ROI case not built: outside this tool\'s scope',
  '',
  'This tool builds ROI cases for GTM and marketing investments only: marketing and demand generation, ABM, events, analyst and public relations, content, SEO, AEO and GEO, field marketing, martech tools, outbound and sales engagement software, media spend, brand awareness, and partner or channel programmes.',
  '',
  'What you described is not one of these, so no case and no figures are given.',
  '',
  'If it is one of these investments, say so in Your solution (for example: an ABM programme for 40 target accounts) and run it again.',
].join('\n');

const N = String.raw`(?:programmes?|programs?)`;
// GTM and marketing investments, case-insensitive.
const IN_SCOPE = new RegExp(String.raw`\b(?:` + [
  // Marketing, demand generation, field and growth marketing, martech
  String.raw`marketing(?![- ]authori[sz]ation)|martech|demand[- ]gen(?:eration)?|lead[- ]gen(?:eration)?|pipeline generation|go[- ]to[- ]market|GTM|fractional CMO|CMO (?:services|advisory)`,
  String.raw`CRM|CDP|customer data platforms?|email (?:campaigns?|nurture|nurturing)|nurture (?:${N}|campaigns?|streams?|journeys?)|landing pages?|web(?:site)? personali[sz]ation|website (?:redesign|revamp|rebuild|refresh|relaunch)`,
  String.raw`product launch(?:es)?|launch campaigns?|positioning (?:workshops?|projects?|${N})|messaging (?:frameworks?|workshops?|projects?)`,
  // ABM
  String.raw`ABM|account[- ]based (?:marketing|selling|advertising|engagement|experience|${N})`,
  // Events
  String.raw`events?(?![- ](?:logs?|streams?|processing|sourcing|bus|handlers?|telemetry))|(?:virtual|hybrid|in[- ]person|field|customer|partner|hosted|owned|industry|flagship|user) events?|events? (?:${N}|marketing|sponsorships?|strategy|calendar|series|budget|presence|booths?|spend)|event[- ]led|trade[- ]?shows?|exhibitions?|expos?|conferences?(?![- ]?(?:call|calls|calling|bridges?|rooms?|systems?|phones?))|summits?|roundtables?|webinars?|(?:exhibition|trade[- ]?show|expo|conference) booths?|sponsorships?|sponsoring|sponsored (?:content|posts?|events?|sessions?)`,
  // Analyst and public relations, content
  String.raw`analyst relations|analyst (?:${N}|briefings?|days?|firms?)|Magic Quadrant|Forrester Wave|public relations|media relations|press (?:releases?|coverage|outreach|office)|earned media|thought leadership|communications (?:${N}|agency|agencies|campaigns?)`,
  String.raw`content (?:marketing|syndication|${N}|strategy|production|agency|agencies|studio|hub|calendar|creation|writing|series|engine|assets?|campaigns?|distribution|amplification)|podcasts?|newsletters?|social media|influencers?`,
  // SEO, AEO, GEO and AI search visibility
  String.raw`SEO|AEO|search engine optimi[sz]ation|answer engine optimi[sz]ation|generative engine optimi[sz]ation|AI search (?:visibility|optimi[sz]ation)|AI visibility|LLM visibility|organic search|search visibility|search rankings?`,
  // Media spend and brand
  String.raw`paid (?:media|search|social|ads|advertising|campaigns?|acquisition)|(?:LinkedIn|Google|Meta) (?:campaigns?|ads)|social media ads|sponsored posts bought as ads|media (?:spends?|buying|budgets?|plans?|mix|campaigns?)|ad ?spends?|advertising|adverts?|ads|PPC|pay[- ]per[- ]click|programmatic (?:advertising|ads|media|buying|display|campaigns?)|retargeting|out[- ]of[- ]home|OOH|billboards?`,
  String.raw`brand (?:awareness|campaigns?|building|refresh|positioning|${N}|study|tracking|strategy|identity|design|lift|spend|reputation)|rebrand(?:ing)?|branding`,
  // Partnerships and channel
  String.raw`partner(?:ship)?s? (?:${N}|marketing|ecosystem|recruitment|enablement|portal|management)|partnerships?|channel (?:${N}|partners?|marketing|sales|incentives?)|reseller (?:${N}|network|recruitment)|co[- ]?marketing|co[- ]?sell(?:ing)?|affiliate (?:${N}|marketing)|alliances?|referral ${N}|ecosystem (?:${N}|partners?)`,
  // Outbound and sales engagement tools, intent data
  String.raw`outbound|sales engagement|sales enablement|cold (?:email|emailing|calling|outreach)|SDRs?|BDRs?|sales development|appointment setting|prospecting|dial(?:l)?ers?|intent data|buyer intent|(?:contact|lead|account|B2B|firmographic|technographic) data|data enrichment|lead enrichment|revenue intelligence|conversation intelligence|sales intelligence|lead scoring|lead routing|lead management`,
].join('|') + String.raw`)\b`, 'gi');
// Acronyms that are only marketing in capitals ("geo", "abx" and "pr" are not).
const IN_SCOPE_CAPS = /\b(?:GEO|ABX|AR\/PR|PR\/AR|AR and PR|PR and AR|PR (?:agency|agencies|firm|campaigns?|programmes?|programs?|retainer|outreach|coverage|push|plan|strategy|launch|team))\b/g;

// Other investments. Used only to stop a customer description ("payroll software for
// marketing agencies") or context notes from pulling a non-GTM purchase into scope.
const OUT_OF_SCOPE = new RegExp(String.raw`\b(?:` + [
  String.raw`route (?:planning|optimi[sz]ation)|routing|fleet|last[- ]mile|delivery|deliveries|dispatch|logistics|freight|shipping|warehous\w*|WMS|TMS|supply chain|inventory|procurement|sourcing`,
  String.raw`payroll|HRIS|HRMS|HCM|ATS|applicant tracking|recruit\w*|hiring|ERP|accounting|bookkeeping|reconciliation|(?:financial|month[- ]end) close|treasury|accounts (?:payable|receivable)|billing|invoic\w*|payments?|lending|loans?|insurance|underwriting|claims|trading|KYC|AML|fraud|compliance|GRC|tax`,
  String.raw`SIEM|SOAR|EDR|XDR|MDR|security|cybersecurity|firewalls?|endpoints?|identity|IAM|zero trust|vulnerabilit\w*|penetration test\w*|cloud|hosting|data cent(?:er|re)s?|servers?|storage|backups?|disaster recovery|data warehouses?|data lakes?|lakehouses?|BI|business intelligence|observability|APM|monitoring|DevOps|CI\/CD|test automation|QA|developer tools?`,
  String.raw`ITSM|help ?desks?|service desks?|ticketing|managed services|IT outsourcing|BPO|contact cent(?:er|re)s?|CCaaS|CPaaS|telephony|connectivity|SD-WAN|broadband|fib(?:re|er)|leased lines?|5G|networks?|networking|IoT`,
  String.raw`distributor management|DMS|retail execution|beat planning|manufacturing|MES|robotics|predictive maintenance|energy|solar|EV|healthcare|EHR|EMR|clinical|hospitals?|legal|contract management|CLM|e-?signatures?|document management|project management|LMS|learning management|e-?learning|POS|point of sale|e-?commerce|field service|workforce management|expense management|spend management|customer support|customer service|customer success`,
  String.raw`(?:security|threat|log|network|product|data|IoT|telemetry|video|clinical|fraud|risk|supply[ -]chain|logistics|fleet|HR|people|workforce|BI|embedded|geospatial|location|streaming|operational|manufacturing|energy|financial|spend|procurement|infrastructure|application|cloud) analytics`,
].join('|') + String.raw`)\b`, 'gi');

// A mention after one of these words in the same clause does not count.
const NEGATION = /\b(?:not|no|non|without|never|excluding|except|nor|neither|isn['’]t|aren['’]t|wasn['’]t|rather than|instead of|other than)\b/i;
// "for", "to", "sold to" and similar start the purpose or the buyer: "payroll software for
// marketing agencies" is payroll, "CRM for logistics companies" is a CRM.
const PURPOSE = /\b(?:for|to|used by|sold to|serving|aimed at|targeting|that helps|which helps|helping)\b/i;

function normalise(text: string): string {
  return text
    .replace(/\b(?:no|low)[- ]code\b/gi, ' ')
    .replace(/\bnon[- ]?profits?\b/gi, ' ')
    .replace(/\bnot (?:just|only|merely|limited to)\b/gi, ' ');
}

function mentions(text: string, ...patterns: RegExp[]): boolean {
  for (const clause of normalise(text).split(/[.;:!?\n,()[\]]+|\bbut\b|\bwhile\b|\bwhereas\b/i)) {
    for (const pattern of patterns) {
      for (const match of clause.matchAll(pattern)) {
        const before = clause.slice(0, match.index).split(/\s+/).filter(Boolean).slice(-4).join(' ');
        if (!NEGATION.test(before)) return true;
      }
    }
  }
  return false;
}
const inScope = (text: string): boolean => mentions(text, IN_SCOPE, IN_SCOPE_CAPS);
const outOfScope = (text: string): boolean => mentions(text, OUT_OF_SCOPE);

// The company that funds the investment is not the investment: "a logistics tech firm" or
// "our telecom company" is set aside, so its industry words cannot decline an ABM programme.
// A company phrase with GTM words ("a PR agency") is kept.
const WORD = String.raw`(?!(?:for|to|of|with|and|or|but|that|which|who|in|on|at|by|from|than|wants?|plans|needs?)\b)[\w-]+`;
const COMPANY = new RegExp(String.raw`\b(?:(?:a|an|the|our|my|their|its|this|that)\s+)?(?:${WORD}\s+){0,4}(?:compan(?:y|ies)|firms?|business(?:es)?|providers?|vendors?|startups?|scale-?ups?|operators?|banks?|insurers?|lenders?|retailers?|manufacturers?|carriers?|telcos?|players?|sellers?|enterprises?|organi[sz]ations?)(?:['’]s)?\b`, 'gi');
const withoutCompany = (text: string): string => text.replace(COMPANY, phrase => ((inScope(phrase) || /data providers?/i.test(phrase)) ? phrase : ' '));

/** Read the funded work, setting aside the funder's own industry and location. */
export function roiFundingSubject(text: string): string {
  const value = text.trim();
  const who = /^(?:a|an|the|our|my|we|i|this|that)\b.{0,220}?\b(?:wants?\s+(?:to\s+)?|(?:is|are)\s+planning\s+to\s+|plans?\s+to\s+|will\s+fund\s+|(?:is|are)\s+funding\s+)(?:fund\s+|invest\s+in\s+|buy\s+|launch\s+)?/i.exec(value);
  if (who && !NEGATION.test(who[0])) return value.slice(who[0].length).trim();
  return withoutCompany(value.replace(/^funding\s+/i, ''));
}
// "wants to fund an ABM programme", "is investing in brand awareness": the words after a
// funding verb name the investment, whatever the funder's industry.
const FUNDING = /\b(?:fund(?:s|ed|ing)?|invest(?:s|ed|ing)?(?: in)?|launch(?:es|ed|ing)?|buy(?:s|ing)?|spend(?:s|ing)? on|commission(?:s|ed|ing)?|sponsor(?:s|ed|ing)?|want(?:s|ed)?|plans|planned|needs?|budget(?:s|ed|ing)? for)\b/gi;
function fundsGtm(text: string): boolean {
  for (const match of text.matchAll(FUNDING)) {
    const before = text.slice(0, match.index).split(/\s+/).filter(Boolean).slice(-3).join(' ');
    if (!NEGATION.test(before) && inScope(text.slice((match.index ?? 0) + match[0].length).split(/[.;!?\n]/)[0])) return true;
  }
  return false;
}

/** Analyst report signals reuse the scope vocabulary, without adding vendor identities elsewhere. */
export function roiAnalystReportWords(text: string): string | undefined {
  for (const clause of normalise(text).split(/[.;:!?\n,()[\]]+|\bbut\b|\bwhile\b|\bwhereas\b/i)) {
    for (const match of clause.matchAll(IN_SCOPE)) {
      if (/\b(?:quadrant|wave)\b/i.test(match[0]) && !NEGATION.test(clause.slice(0, match.index))) return match[0];
    }
  }
  return undefined;
}

/** True when the investment being justified is a GTM or marketing investment. */
export function roiInScope(args: Record<string, unknown> | undefined): boolean {
  const text = (v: unknown): string => (typeof v === 'string' ? v : '');
  const solution = roiFundingSubject(text(args?.your_solution));
  if (fundsGtm(solution)) return true;
  const purpose = solution.search(PURPOSE);
  const head = purpose > 0 ? solution.slice(0, purpose) : solution;
  // What is being bought comes first: its own words decide before the buyer description.
  if (inScope(head)) return true;
  if (outOfScope(head)) return false;
  if (inScope(solution)) return true;
  if (outOfScope(solution)) return false;
  // A solution named without a category ("Acme platform") is read with its context.
  return inScope([text(args?.known_metrics), text(args?.current_process)].join('\n'));
}

/** The decline text when the ROI case is out of scope, otherwise undefined. */
export function roiScopeDecline(name: string, args: Record<string, unknown> | undefined): string | undefined {
  return name === 'roi_business_case_builder' && !roiInScope(args) ? ROI_SCOPE_DECLINE : undefined;
}
