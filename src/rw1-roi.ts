// Run 42 (owner approval, 17 October 2026; ported from run 26q): roi_business_case_builder without the buyer's figures. No example hours, headcount,
// hourly rate or share of revenue is applied: the method is explained in plain words, the figures the input gives are used only as stated and labelled,
// and at most three missing numbers are asked for.
// Run 22: roi_business_case_builder without the buyer's figures, rewritten. It prints no ROI, payback or headline return (rule B81, D80: the calculation
// path with a buyer figure is unchanged and lives in index.ts). It reads as the business case laid out for this buyer: what the buyer pays (the arithmetic
// on the user's own price), the cost lines the buyer's current way of working holds (each with its own question), what the quoted results tell you to
// measure, and the questions for the driver chosen, worded for the buyer's industry and the seller's business model. What is missing is listed once, at the end.
import { clip, describeWith, joinList, solutionBrief, parseProof, proofPhrase, proofSource, upperFirst } from './dealtext.ts';
import { buyerContextFor } from './verticals.ts';
import { briefOf, readModel, reframeSector, matchPart, namedParts, joinSplitClaims, shared, cleanBrief, sellerWords, cleanIndustry, industryFromTitle, lowerStart, modelWords, partsOf, quoted, readThreats, some, stripEnd, type Deps } from './rw1-common.ts';

export interface RoiStructureInput {
  customerName: string; industry: string; companySize: string; yourSolution: string; primaryValueDriver: string;
  knownMetrics: string; currentProcess: string; implementationTimeline: string;
  revenueGiven: boolean; employeesGiven: boolean; annualRevenue: number; employeeCount: number;
  priceGiven: boolean; solutionPrice: number; ownCost: number | null; ownPct: number | null;
}

// what to count to put a yearly cost on one way of working, by what kind of way it is; a second line of the same kind gets a different note
const COST_Q: Record<string, string> = {
  manual: 'The people who do it, the hours a week each spends, the cost of an hour, and the errors and delays on top.',
  legacy: 'The yearly cost to run it (support, upgrades and the people who keep it going), and the work done around it because it cannot do the job.',
  disconnected: 'What the separate pieces cost in total, and the hours a month it takes to join their output by hand.',
  inhouse: 'The yearly cost to keep it running, in people and infrastructure, and what the work it leaves undone costs.',
  static: 'The hours a week spent sorting out what matters, and what the items it missed or flagged for no reason cost last year.',
  reactive: 'What the last late warning cost (expedites, penalties, lost sales or an incident), times how often that happens in a year.',
  guess: 'What a wrong plan costs when it happens (idle time, overtime, expedites), times how often it happens in a year.',
  oneByOne: 'The people who work with each partner or channel, their hours a week, and what a change of rates or rules costs each time.',
  limited: 'The monthly cost of working around the gap, in people and in the tools bought to fill it.',
  cost: 'The last twelve months of fees and costs, including the ones that are not in the headline price.',
  slow: 'The days a request waits, times what a day of waiting costs in people or in lost business.',
  general: 'Its yearly cost in money and in people\'s time, plus what its failures cost.',
};
const COST_ALT = [
  'Its yearly total in the ledger, from the person who owns its budget.',
  'What would stop or break if this line were removed, and what that would cost.',
  'The part the buyer already counts, plus the part carried by people nobody has priced.',
];

// what a quoted result tells you to measure (no seat or licence idea: the business model is not assumed)
function measureOf(text: string, metrics: string[] = []): string {
  text = quoteBody(text);
  const t = text.toLowerCase();
  if (/\btime back\b|\btime saved\b|\bsav\w* (?:over |more than |about )?(?:[\d.]+|two|three|four|five|six) hours\b|\bhours? (?:a|per|each) week\b|\bdays? to hours\b/.test(t)) return 'the hours the work takes today, who does it and what an hour costs, and the share of those hours the buyer expects back';
  // a study's return figure is not this buyer's: it tells you to measure the buyer's own cost and the share a change removes, whatever the product in the sentence is called
  if (/\broi\b|\breturn on investment\b|\bpayback\b/.test(t)) return 'the buyer\'s own yearly cost of the current way of working and the share of it a change would remove, because a study\'s return figure is not this buyer\'s'; 
  if (/credential|exposed|leak|vulnerab|phish|threat|attack|takedown|fraud/.test(t) && !/return|rto/.test(t)) return 'how many exposures, threats or attempts the buyer finds and closes today, how long that takes, and what one costs when it is used against them';
  if (/dispatch|planning time|planning/.test(t)) return 'the time spent planning, and what that time costs';
  if (/reimburse|cycle|turnaround|lead time|time to|faster|\bdays?\b|weeks?\b|hours?\b|minutes?\b/.test(t)) return 'the time the process takes today, and what each day or hour costs';
  if (/cost|sav|spend|expense/.test(t)) return 'the yearly cost of the current way of working';
  if (/forecast|confidence|explain|defend|decision|signal|strateg/.test(t)) return 'whether the results and their explanations hold up against the buyer\'s own history and the questions their committee asks';
  if (/uptime|outage|downtime|availability/.test(t)) return 'the cost of an outage to the buyer, and how often it happens';
  if (/coverage|calls|orders|conversion|revenue|growth|top line|market share|sales/.test(t)) return 'the revenue or volume the buyer gains or keeps from the change';
  if (/return|rto|cancel|complaint|unpaid|churn|fraud|breach|incident|risk/.test(t)) return 'the cost of one incident, and how often one happens';
  if (/regression|release|deploy|test(?:ing|s)?\b|build time|merge/.test(t)) return 'the time from a change to a release today, and what a late or failed release costs';
  if (/detention|demurrage|dwell|gate wait|expedit/.test(t)) return 'the detention, wait or expedite costs the buyer pays in a year, and what causes them';
  // delivery wording only for a result that itself speaks of deliveries, orders or shipments ("authentication time" holds the letters "on time" and is not a delivery result)
  if (/\bcarrier completion\b|\bon[- ]time\b|\bdelivery rate\b|\brto\b|\bfirst[- ]attempt\b|\bundelivered\b/.test(t) && /\bdeliver\w*|\bshipments?\b|\bparcels?\b|\bcouriers?\b|\borders?\b|\brto\b|\bcarriers?\b/.test(t)) return 'the share of orders delivered first time and the share that come back, and what each failed delivery costs';
  if (/authenticat|log-?in|sign[- ]?in|onboarding/.test(t)) return 'the time people lose to that step today, and what a minute of it costs across the people who do it';
  if (/audit|certif|complian|governance|access review/.test(t)) return 'the hours and outside fees the buyer spends on audit and compliance work today';
  if (/manual|automation|automat/.test(t)) return 'the hours of manual work in the process today, and what an hour costs';
  if (/csat|satisf|resolution|contain|deflect|tickets?|inquir/.test(t)) return 'the cases handled each month, the handling time per case, and the cost of one case';
  if (/data usage|data used|usage|bandwidth/.test(t)) return 'the data or other usage the buyer pays for in a year, and the share of it that is idle or wasted';
  if (/adoption|users?|customers?/.test(t)) return 'how much of the buyer\'s own work would run through it, and what the work around it costs today';
  let best = ''; let n = 0;
  for (const m of metrics) { const sc = shared(text, m); if (sc > n) { n = sc; best = m; } }
  if (best) return `the buyer's own ${best}, and what a change in it is worth in a year`;
  const own = ownMeasure(text);
  if (own) return `the buyer's own ${own} today, and what a change in it is worth in a year`;
  return 'which of the buyer\'s own numbers would change, and what that change is worth in a year';
}
/** The kind of a cost line for pricing it: work done by hand is counted in hours before a word such as "estimating" makes it a judgement call; several tools juggled are separate pieces. */
function costKind(text: string, id: string): string {
  if (/\b(?:manual\w*|by hand|pencil|paper|spreadsheets?|re-?keying)\b/i.test(text)) return 'manual';
  if (/\b(?:juggl\w*|multiple|several|many|separate|disconnected|different)\b.{0,30}\b(?:tools?|systems?|apps?|software|spreadsheets?)\b/i.test(text)) return 'disconnected';
  return id;
}
/** A quote given as "Name, Title: words" is read by its words, not by the speaker's title (a sales title is not a revenue result). */
function quoteBody(text: string): string {
  const m = text.match(/^[A-Z][^:]{2,140}?:\s+(?=\S)/);
  return m && /,/.test(m[0]) ? text.slice(m[0].length) : text;
}
/** The thing a quoted result changes, in the result's own words: "a 57% reduction in user authentication time" gives "user authentication time". */
function ownMeasure(text: string): string {
  const m = text.match(/\b(?:reduction|decrease|drop|fall|improvement|increase|gain|growth|rise|uplift|cut|saving|savings)\s+(?:of\s+[\d.,%x ]+\s+)?(?:in|of|to|on)\s+(?:the\s+|its\s+|their\s+)?([a-z][a-z \-]{3,44}?)(?=\s+(?:with|by|using|after|through|from|across|for|at|within|when|thanks)\b|[.,;:(]|$)/i)
    || text.match(/\b(?:cut|cuts|cutting|reduced|reduces|lowered|lowers|raised|raises|boosted|boosts|improved|improves|increased|increases|saved|saves)\s+(?:its\s+|their\s+|the\s+)?([a-z][a-z \-]{3,44}?)\s+(?:by|from|to|with|after|through)\b/i);
  const phrase = m ? m[1].trim().toLowerCase() : '';
  return phrase && phrase.split(/\s+/).length <= 6 && !/^(?:it|that|them|this|costs?)$/.test(phrase) ? phrase : '';
}

export function buildRoiStructure(args: Record<string, unknown>, i: RoiStructureInput, d: Deps): string {
  const money = d.money;
  const sizeText = i.companySize === 'smb' ? 'SMB' : i.companySize.replace(/_/g, ' ');
  const given = (n: number | null) => (n === null ? null : `${money(n)} (your input)`);
  const costGiven = i.ownCost !== null;
  const pctGiven = i.ownPct !== null;
  const customer = (args.customer_name as string) || 'your customer';
  // a title such as "Retail account (Acme customer)" is a label for the buyer, not a name to repeat inside every question
  const who = /\b(?:account|customer)\b/i.test(customer) ? 'the buyer' : customer;
  const brief = briefOf(args.your_solution ? i.yourSolution : '', [i.customerName, i.knownMetrics, i.currentProcess]);
  const P = brief.short || 'your solution';
  const parts = partsOf(brief);
  const ctx = reframeSector(d.readContext(undefined, { seller: [i.yourSolution], context: [i.knownMetrics, i.currentProcess], buyer: [args.industry, i.customerName] }), i.yourSolution);
  const v = ctx.v;
  const mr = readModel(ctx.model, ctx.line, i.yourSolution, []);   // the current process and the quoted results are about the buyer's alternatives and other customers, not this seller's pricing
  const usage = mr.unit; const model = mr.model; const ctxLine = mr.line;
  const mw = modelWords(model, i.yourSolution, usage || undefined);
  // the way the product is priced is stated only when the user's words or inputs show it, not when the sector's usual model was assumed
  const statedModel = mr.stated && model !== 'sim';
  const industryWords = cleanIndustry(args.industry) || cleanIndustry(industryFromTitle(args.customer_name));
  const buyerCtx = buyerContextFor(args.industry, industryFromTitle(args.customer_name));
  const proof = parseProof(joinSplitClaims(i.knownMetrics));
  const costLines = d.splitItems(i.currentProcess.replace(/^today (?:they|the buyer) (?:handle|handles|do|does) it with\s+/i, ''));
  const lines = readThreats(costLines);
  const unit = usage;

  const revenueCell = i.revenueGiven ? (i.annualRevenue === 0 ? '$0 (your input)' : `${money(i.annualRevenue)} (your input)`) : 'not supplied';
  const employeesCell = i.employeesGiven ? (i.employeeCount === 0 ? '0 (your input)' : `${i.employeeCount.toLocaleString('en-US')} (your input)`) : 'not supplied';
  const priceCell = i.priceGiven ? (i.solutionPrice === 0 ? '$0 (your input)' : `${money(i.solutionPrice)} (your input)`) : 'not supplied';

  const out: string[] = [];
  out.push(`# ROI Business Case: ${customer}`);
  out.push(`*Your inputs are shown as you gave them. No ROI percentage, payback period or headline return is shown, because no buyer cost or value figure was given and this tool does not make one up. What follows is the business case laid out for ${customer}, so that every number their finance contact will ask for has a place.*`);

  // ---- the case in a paragraph ----
  const what = brief.kind ? `${P} ${describeWith(cleanBrief(brief))}${parts.length ? `, with ${joinList(parts)}` : ''}` : brief.short ? P : (sellerWords(brief) ? `What you sell, in your words, is ${sellerWords(brief)}` : P);
  out.push(`## The case in brief\n\n` + `${what.replace(/\bis (A|An|The) (?=[a-z])/, (_m, w: string) => `is ${w.toLowerCase()} `)}.${model && statedModel ? `The buyer pays for it as ${mw.priced}. ` : ''}${cleanIndustry(args.industry) && !customer.toLowerCase().includes(cleanIndustry(args.industry).toLowerCase()) ? `${upperFirst(who)} is read here as working in ${cleanIndustry(args.industry)}. ` : ''}${costLines.length ? `The way of working it would replace is ${costLines.length === 1 ? 'one cost line below, which needs' : `${costLines.length} cost lines below, each of which needs`} a yearly cost from the buyer.` : ''}`.replace(/\s{2,}/g, ' ') + `\n\n${ctxLine}`);

  // ---- the price ----
  if (i.priceGiven && i.solutionPrice > 0) {
    out.push(`## What the buyer pays\n\nAt the annual price you gave (${money(i.solutionPrice)}), the value the buyer sees must be above ${money(i.solutionPrice)} a year for any positive return, and above ${money(i.solutionPrice * 2)} a year to return the price twice over. Over three years the buyer pays ${money(i.solutionPrice * 3)} before any one-time cost. This is arithmetic on your price and says nothing about the value. Amounts are in dollars, as the price field is; if your price is in another currency, convert it first${model === 'transactions' ? `, and enter the yearly spend you expect at the buyer's volume${unit ? ` of ${unit}s` : ''}` : ''}.`);
  }
  if (i.revenueGiven || i.employeesGiven) out.push(`\`annual_revenue\` and \`employee_count\` describe the customer's size. They are shown below as you gave them, but this tool does not turn them into a value: that would need a rate or share only the buyer can give.`);

  const flags: string[] = [];
  const smallWords = /\b(?:smb|small|micro|d2c|startups?)\b/i.test(`${i.customerName} ${args.industry || ''}`);
  if (args.company_size === 'enterprise' && smallWords) flags.push('You set company_size to enterprise, but the customer is described as SMB or small in its name; check which is right, because the size changes who reviews the case and what price is realistic.');
  if (args.company_size === 'smb' && /\b(?:enterprise|large|global)\b/i.test(i.customerName)) flags.push('You set company_size to SMB, but the customer is described as large or enterprise in its name; check which is right, because the size changes who reviews the case.');
  if (/\bIndia(?:n)?\b|\brupees?\b|\bINR\b|\blakhs?\b|\bcrores?\b/i.test(`${i.yourSolution} ${i.customerName} ${i.knownMetrics} ${i.currentProcess}`)) flags.push('Your inputs mention India; the price field is in dollars, so if your price is in rupees, convert it first.');
  if (flags.length) out.push(`## Inputs to check\n\n${flags.join(' ')}`);

  // ---- the cost lines ----
  const bestPart = (text: string): string => matchPart(text, parts, brief.short);
  const partUse = new Set<string>();
  if (costLines.length) {
    const seen = new Map<string, number>();
    const rows = lines.map((l) => {
      const id = costKind(l.text, l.id);
      const n = seen.get(id) || 0; seen.set(id, n + 1);
      const q = n === 0 ? (COST_Q[id] || COST_Q.general) : COST_ALT[(n - 1) % COST_ALT.length];
      const named = namedParts(l.text, parts, brief.short);
      const part = named.length ? joinList(named) : bestPart(l.text);
      if (named.length) named.forEach((x) => partUse.add(x)); else if (part) partUse.add(part);
      return `| ${d.cap(l.text)} | ${q} |${parts.length ? ` ${part || 'none matches by its words'} |` : ''}`;
    });
    out.push(`## Cost lines to price\n\nEach way of working that ${P} would replace is a cost line. Put a yearly cost on each one, then add them: that sum is \`current_annual_cost\`.\n\n| Cost line | What to count |${parts.length ? ` Part of ${P} that answers it |` : ''}\n|---|---|${parts.length ? '---|' : ''}\n${rows.join('\n')}`);
  }

  // ---- the quoted results ----
  const credibility = (p: { text: string }): boolean => /\bseries [a-e]\b|valuation|funding|\braised\s+(?:us\$|\$|€|£|₹|rs\.?\s?\d|inr|\d[\d,.]*\s?(?:m|bn|k|million|billion|crore|cr)\b|a\s+(?:series|round)|capital)|\bfunding round\b|\bround\b(?!\s+the\s+clock)|\bipo\b|acquir\w+/i.test(p.text);   // "raised first attempt delivery rate" is a result; "raised $20M" is funding
  const usedMeasure = new Map<string, string>();
  // a quoted change ("from three days to 10 minutes", "lowered its data usage by more than 50%") is a result even when the sentence also holds a word the reader takes for a recognition or a scale ("a customer named", "more than")
  const CHANGE = /\b(?:lower\w*|dropp?\w*|cut|reduc\w+|decreas\w+|saved?|faster|shorter|increas\w+|improv\w+|grew|grow\w*|doubl\w+|halv\w+)\b|\bfrom\b.{2,40}\bto\b|\btook\b.{1,40}\b(?:days?|hours?|minutes?|weeks?)\b/i;
  const asResult = (p: { kind: string; text: string }): boolean => (p.kind === 'recognition' || p.kind === 'scale') && CHANGE.test(p.text) && /\d/.test(p.text) && !/\b(?:leader|visionary|award|quadrant|certified|recogni[sz]ed)\b/i.test(p.text);
  // a quote or result with no figure and no change in it ("I use it every day") is credibility, not something to measure
  const hasFigure = (p: { text: string }): boolean => /\d/.test(quoteBody(p.text)) || CHANGE.test(quoteBody(p.text)) || /\b(?:fewer|less|more|better|easier|higher|lower|quicker|won)\b/i.test(quoteBody(p.text));
  const results = proof.filter((p) => (p.kind === 'result' || p.kind === 'story' || p.kind === 'quote' || asResult(p)) && hasFigure(p) && !credibility(p));
  const others = proof.filter((p) => !results.includes(p));
  if (proof.length) {
    out.push(`## Results you quoted\n\n${results.length ? `These are reference points, not this buyer's figures. Each is another organisation's result, from ${proof.some((p) => p.label) ? 'the source you labelled' : 'your notes'}; they show the buyer what to measure, and none should be entered as the buyer's own number.\n\n| Result you quoted | What it tells you to measure |${parts.length ? ` Part of ${P} it relates to |` : ''}\n|---|---|${parts.length ? '---|' : ''}\n${results.map((p) => { const m = measureOf(p.text, v ? v.metrics : []); const part = bestPart(p.text); if (part) partUse.add(part); const prev = usedMeasure.get(m); if (!prev) usedMeasure.set(m, proofPhrase(p)); return `| ${proofPhrase(p)}${p.label ? ` (${proofSource(p)})` : ''} | ${prev ? `As for ${quoted(clip(prev, 40))}: ${m}` : upperFirst(m)} |${parts.length ? ` ${part || 'none matches by its words'} |` : ''}`; }).join('\n')}\n` : ''}${others.length ? `\nNot value figures, so not used in the calculation: ${others.map((p) => proofPhrase(p)).join('; ')}. Keep them for the proposal as credibility.\n` : ''}`);
  } else if (i.knownMetrics) {
    out.push(`## Results you quoted\n\n${i.knownMetrics}\n\nThese are text. They are not used in a calculation until you give them as the numbers named at the end.`);
  }

  // ---- the case written out, from the inputs only ----
  const lineParts = lines.map((l) => ({ line: lowerStart(stripEnd(l.text.replace(/\s*\([^()]*\)\s*$/, ''))), part: ((n) => (n.length ? joinList(n) : bestPart(l.text)))(namedParts(l.text, parts, brief.short)) }));
  const answered = lineParts.filter((x) => x.part).slice(0, 4);
  const measured = [...new Set(results.slice(0, 3).map((p) => measureOf(p.text, v ? v.metrics : [])))].slice(0, 2);
  if (costLines.length) {
    out.push(`## The case in words\n\n${upperFirst(who === 'the buyer' ? customer : who)} handles it today like this: ${joinList(lineParts.map((x) => x.line))}. Each of these has a yearly cost that the buyer can name. ${answered.length ? `${P} answers ${joinList(answered.map((x) => `"${x.line}" with ${x.part}`))}. ` : ''}${i.priceGiven && i.solutionPrice > 0 ? `The price you gave is ${money(i.solutionPrice)} a year, so the case holds only if the cost of the ways of working above, less the share ${P} removes, comes out clearly above that.` : `The case holds only if the cost of the ways of working above, less the share ${P} removes, comes out clearly above the price.`}${measured.length ? ` The results you quoted show what other organisations measured: ${measured.length === 1 ? lowerStart(measured[0]) : `first, ${lowerStart(measured[0])}; second, ${lowerStart(measured[1])}`}.` : ''} The buyer supplies the two numbers that turn this into a return: the yearly cost and the share removed.`);
  }

  const placed = parts.filter((x) => !partUse.has(x));
  if (parts.length && placed.length) out.push(`## Parts not yet placed in the case\n\nNo cost line or quoted result above matches ${joinList(placed)} by its words. Ask the buyer which cost each one would remove, so that every part of ${P} has a place in the case.`);

  // ---- what the buyer's industry adds ----
  if (buyerCtx || v) {
    const bits: string[] = [];
    if (buyerCtx) bits.push(`In ${buyerCtx.name}, the losses a risk case can count are ${buyerCtx.risks}. ${buyerCtx.reviews}`);
    if (v) bits.push(`Buyers of ${v.name} products usually measure ${v.metrics.join(', ')}; put a yearly cost on the ones the problem moves.`);
    out.push(`## What this buyer will check\n\n${bits.join(' ')}`);
  }

  // ---- the drivers ----
  const driverKeys = i.primaryValueDriver === 'multiple'
    ? (['cost_reduction', 'productivity', 'risk_mitigation'] as string[]).concat(!v || ['logistics-tech', 'fintech', 'vertical-saas', 'saas', 'telecom', 'ai-native'].includes(v.id) ? ['revenue_increase'] : [])
    : [['revenue_increase', 'cost_reduction', 'productivity', 'risk_mitigation'].includes(i.primaryValueDriver) ? i.primaryValueDriver : 'cost_reduction'];
  const painShort = costLines.slice(0, 2).map((c) => lowerStart(c)).join(' or ');
  const incident = v?.id === 'cybersecurity' ? 'incident or breach' : v?.id === 'fintech' ? 'failed or fraudulent payment, or audit finding' : buyerCtx ? buyerCtx.risks.split(',')[0] : 'incident';
  const driverText = (k: string): { title: string; where: string; figure: string; qs: string[] } => {
    switch (k) {
      case 'revenue_increase': return {
        title: 'Revenue increase',
        where: `Revenue that ${who} earns or keeps because of ${P}. This is the weakest kind of case unless the buyer owns the revenue number, so ask which revenue line the product touches before any figure is written down.`,
        figure: 'the revenue the buyer expects to add or keep in a year because of this, or the revenue the problem costs them today',
        qs: [`Which of ${who}'s revenue lines does ${P} touch, and how much did that line bring in last year?`, `What did the problem${painShort ? ` (${painShort})` : ''} cost that line last year, in revenue not earned or not kept?`, `What share of it would ${P} win back, and what is that based on: their own history, a pilot, or a result quoted from another customer?`, ...(model === 'transactions' && unit ? [`How many ${unit}s does that line run in a year, and what does one failed or late ${unit} cost in revenue?`] : v ? [`Which of ${some(v.metrics, 3)} moves revenue for them, and by how much for each point of change?`] : [])],
      };
      case 'productivity': return {
        title: 'Productivity',
        where: 'Time given back to people, to spend on work that earns more or costs less.',
        figure: 'the yearly cost of the time lost today, and the share of it the buyer expects to get back',
        qs: [`Which team loses the time today, how many people are in it, and what does an hour of their time cost ${who}?`, `Where does the time go${painShort ? ` (${painShort})` : ''}, and which part of it would ${P} take over?`, 'What would the team do with the time back, and is that worth money (work not hired for, faster delivery, fewer errors)?'],
      };
      case 'risk_mitigation': return {
        title: 'Risk mitigation',
        where: `Losses avoided: ${buyerCtx ? buyerCtx.risks : 'compliance incidents, outages, breaches, penalties, lost customers'}.`,
        figure: 'what one incident costs the buyer, how often it happens, and the share they expect to avoid',
        qs: [`What does one ${incident} cost ${who} when it happens (investigation time, outside help, penalties, lost customers)?`, 'How often has one happened in the last three years, and how many near misses were there?', `What share of those would ${P} have prevented or caught earlier, and how would you show it on their own history?`, ...(buyerCtx ? [`Which of the reviews described above does the buyer's risk team run on a purchase like this, and what does each cost them in time?`] : [])],
      };
      default: return {
        title: 'Cost reduction',
        where: 'Less money spent on the work or on the failure it causes today: hours, rework, errors, outside spend.',
        figure: 'what the problem or the current process costs the buyer in a year (current_annual_cost) and the share they expect to remove (expected_improvement_percent)',
        qs: [costLines.length > 1 ? 'Which of the cost lines above is the largest, and who owns its budget?' : 'Where does the cost of this problem show up in the budget today (people, outside spend, rework, fees)?', `Which part of each line would ${P} actually remove, and which part stays?`, 'What would the buyer\'s finance contact need to see to accept the saving as real: a ledger line, a headcount plan, a contract that ends?'],
      };
    }
  };
  const drivers = driverKeys.map(driverText);
  const omitted = i.primaryValueDriver === 'multiple' && !driverKeys.includes('revenue_increase')
    ? `Revenue is left out: nothing you gave ties ${P} to ${who}'s revenue. Add the driver if the buyer claims one.\n\n` : '';
  out.push(`## Value drivers${industryWords ? ` for ${industryWords}` : ''}\n\n${i.primaryValueDriver === 'multiple' ? 'You chose several drivers. Each one needs its own figure from the buyer; do not add them up until each is checked.' : 'The driver you chose is described below.'}\n\n${omitted}${drivers.map((x) => `### ${x.title}\n\n${x.where}\n\n- **Counted as:** ${x.figure}.`).join('\n\n')}`);

  // ---- the method, in plain words, and at most three numbers to ask for ----
  // a figure the input gives (a share of time back, a before and after) is used only as stated and labelled: a reference for the buyer's own share, never entered for them
  const refOf = (t: string): string => {
    const b = quoteBody(t);
    const m = b.match(/(?:over |more than |about |around |up to )?\d[\d.,]*\s?%[^.;:]{0,40}?(?=[.;:,]|$)/) || b.match(/\bfrom [^.;]{1,30}? to [^.;,]{1,30}/i) || b.match(/(?:over |more than |about )?\d[\d.,]*\+?\s?(?:hours?|days?|weeks?|minutes?)[^.;:]{0,30}?(?=[.;:,]|$)/i);
    return m ? m[0].trim() : '';
  };
  const refs = results.map((p) => ({ fig: refOf(p.text), src: proofPhrase(p) })).filter((x) => x.fig).slice(0, 2);
  const refText = refs.length ? ` The figures you quoted (${refs.map((x) => `"${x.fig}", from ${quoted(clip(x.src.replace(/:.*$/, ''), 60))}`).join('; ')}) are another organisation's results, as you gave them: use them to ask whether the buyer expects something similar, not as the buyer's own share.` : '';
  const ask: string[] = [];
  if (!costGiven) ask.push(`**What does the problem${costLines.length ? ` (${costLines.slice(0, 2).map((c) => lowerStart(stripEnd(c))).join('; ')})` : ''} cost ${who} in a year today**, in people's time, rework, errors and outside spend? This is \`current_annual_cost\`.`);
  if (!pctGiven) ask.push(`**What share of that cost does ${who} expect ${P} to remove**, and what is that based on (their own history, a pilot)?${refText} This is \`expected_improvement_percent\`.`);
  if (!i.priceGiven) ask.push(`**What will ${P} cost ${who} a year, all in?** This is \`solution_price\`.`);
  else if (ask.length < 3) ask.push(`**If ${who} can value the result directly, what is it worth to them in a year?** This is \`annual_value_estimate\`, and it can replace the two numbers above.`);
  out.push(`## How the return will be worked out

No return is shown yet because the two numbers it rests on can only come from ${who}: what the problem costs them in a year, and the share of that cost ${P} would remove. This tool does not fill them with example hours, headcount, rates or industry averages. Once ${who} gives them, the yearly value is that cost times that share (or the yearly value ${who} states directly). The return is that value less ${i.priceGiven && i.solutionPrice > 0 ? `the price you gave (${money(i.solutionPrice)} a year)` : 'the yearly price'}, compared with the price; payback is the number of months of value it takes to cover the price; and the three-year figure is three years of value less three years of price. Each is also shown at half and at one and a half times the value, so the buyer sees how much the case depends on the share they chose.

## The numbers to ask for

${ask.slice(0, 3).map((x, n) => `${n + 1}. ${x}`).join('\n')}

Then run roi_business_case_builder again with them.`);

  const sharpen: string[] = [];
  if (!args.customer_name) sharpen.push('`customer_name` (it would change the title and every question, which now say "your customer")');
  if (!args.industry && !industryWords) sharpen.push('`industry` (it would change the buyer-side risks and reviews in this case)');
  if (!i.currentProcess) sharpen.push('`current_process` (it would change the cost lines to price: one line for each way of working it replaces)');
  if (!i.knownMetrics) sharpen.push('`known_metrics` (it would change the reference points: results you can quote, kept apart from the buyer\'s figures)');
  if (sharpen.length) out.push(`**To sharpen this case, give:**\n\n${sharpen.map((x) => `- ${x}`).join('\n')}`);
  void mw; void d.lowerFirstIfCommon;

  const gaveRows: string[] = [];
  if (args.customer_name) gaveRows.push(`| **Customer** | ${args.customer_name as string} |`);
  if (args.industry) gaveRows.push(`| **Industry** | ${/_/.test(String(args.industry)) ? cleanIndustry(args.industry) : String(args.industry)} (used for wording only; no industry figures are applied) |`);
  if (args.company_size) gaveRows.push(`| **Company Size** | ${sizeText} |`);
  gaveRows.push(`| **Annual Revenue** | ${revenueCell} |`);
  gaveRows.push(`| **Employees** | ${employeesCell} |`);
  gaveRows.push(`| **Solution** | ${brief.short ? `${P}${brief.kind ? `, ${cleanBrief(brief).kind}` : ''}` : (sellerWords(brief) || i.yourSolution)} |`);
  if (i.priceGiven) gaveRows.push(`| **Annual price** | ${priceCell} |`);
  if (args.implementation_timeline) gaveRows.push(`| **Implementation timeline** | ${i.implementationTimeline} |`);
  gaveRows.push('| **Confidence Level** | Not rated: no buyer figure was given, so no value or return is calculated |');
  out.push(`## What you gave

| Item | Value |
|------|-------|
${gaveRows.join('\n')}

Next steps: put the numbers above to the buyer and write down where each one comes from; run the tool again with them; have the buyer's finance contact check the figures before the case goes to the economic buyer.

Suggested timings, lengths and counts: adjust them to your own.`);
  void joinList; void stripEnd; void quoted;
  return out.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
