"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRoiStructure = buildRoiStructure;
// Run 22: roi_business_case_builder without the buyer's figures, rewritten. It prints no ROI, payback or headline return (rule B81, D80: the calculation
// path with a buyer figure is unchanged and lives in index.ts). It reads as the business case laid out for this buyer: what the buyer pays (the arithmetic
// on the user's own price), the cost lines the buyer's current way of working holds (each with its own question), what the quoted results tell you to
// measure, and the questions for the driver chosen, worded for the buyer's industry and the seller's business model. What is missing is listed once, at the end.
const dealtext_ts_1 = require("./dealtext.js");
const verticals_ts_1 = require("./verticals.js");
const rw1_common_ts_1 = require("./rw1-common.js");
// the question that puts a yearly cost on one way of working, by what kind of way it is; a second line of the same kind gets a different question
const COST_Q = {
    manual: 'How many people spend how many hours a week on this, what does an hour cost, and what do the errors and delays on it cost on top?',
    legacy: 'What does it cost a year to run (support, upgrades and the people who keep it going), and what work do people do around it because it cannot do the job?',
    disconnected: 'What do the separate pieces cost in total, and how many hours a month does it take to join their output by hand?',
    inhouse: 'What does it cost a year to keep running, in people and infrastructure, and what does the work it leaves undone cost?',
    static: 'How many hours a week go on sorting out what matters, and what did the items it missed or flagged for no reason cost last year?',
    reactive: 'What did the last late warning cost (expedites, penalties, lost sales or an incident), and how often does that happen in a year?',
    guess: 'What does a wrong plan cost when it happens (idle time, overtime, expedites), and how often does it happen in a year?',
    oneByOne: 'How many people work with each partner or channel, how many hours a week does that take, and what does a change of rates or rules cost each time?',
    limited: 'What does the work around the gap cost each month, in people and in the tools bought to fill it?',
    cost: 'What did the last twelve months of fees and costs add up to, including the ones that are not in the headline price?',
    slow: 'How many days does a request wait, and what does a day of waiting cost in people or in lost business?',
    general: 'What does it cost a year in money and in people\'s time, and what do its failures cost on top?',
};
const COST_ALT = [
    'Who owns the budget for this line, and what is its yearly total in the ledger?',
    'What would stop or break if this line were removed tomorrow, and what would that cost?',
    'Which part of this line does the buyer already count, and which part is carried by people nobody has priced?',
];
// what a quoted result tells you to measure (no seat or licence idea: the business model is not assumed)
function measureOf(text, metrics = []) {
    const t = text.toLowerCase();
    // a study's return figure is not this buyer's: it tells you to measure the buyer's own cost and the share a change removes, whatever the product in the sentence is called
    if (/\broi\b|\breturn on investment\b|\bpayback\b/.test(t))
        return 'the buyer\'s own yearly cost of the current way of working and the share of it a change would remove, because a study\'s return figure is not this buyer\'s';
    if (/credential|exposed|leak|vulnerab|phish|threat|attack|takedown|fraud/.test(t) && !/return|rto/.test(t))
        return 'how many exposures, threats or attempts the buyer finds and closes today, how long that takes, and what one costs when it is used against them';
    if (/dispatch|planning time|planning/.test(t))
        return 'the time spent planning, and what that time costs';
    if (/reimburse|cycle|turnaround|lead time|time to|faster|days?\b|weeks?\b|hours?\b|minutes?\b/.test(t))
        return 'the time the process takes today, and what each day or hour costs';
    if (/cost|sav|spend|expense/.test(t))
        return 'the yearly cost of the current way of working';
    if (/forecast|confidence|explain|defend|decision|signal|strateg/.test(t))
        return 'whether the results and their explanations hold up against the buyer\'s own history and the questions their committee asks';
    if (/uptime|outage|downtime|availability/.test(t))
        return 'the cost of an outage to the buyer, and how often it happens';
    if (/coverage|calls|orders|conversion|revenue|growth|top line|market share|sales/.test(t))
        return 'the revenue or volume the buyer gains or keeps from the change';
    if (/return|rto|cancel|complaint|unpaid|churn|fraud|breach|incident|risk/.test(t))
        return 'the cost of one incident, and how often one happens';
    if (/regression|release|deploy|test(?:ing|s)?\b|build time|merge/.test(t))
        return 'the time from a change to a release today, and what a late or failed release costs';
    if (/detention|demurrage|dwell|gate wait|expedit/.test(t))
        return 'the detention, wait or expedite costs the buyer pays in a year, and what causes them';
    // delivery wording only for a result that itself speaks of deliveries, orders or shipments ("authentication time" holds the letters "on time" and is not a delivery result)
    if (/\bcarrier completion\b|\bon[- ]time\b|\bdelivery rate\b|\brto\b|\bfirst[- ]attempt\b|\bundelivered\b/.test(t) && /\bdeliver\w*|\bshipments?\b|\bparcels?\b|\bcouriers?\b|\borders?\b|\brto\b|\bcarriers?\b/.test(t))
        return 'the share of orders delivered first time and the share that come back, and what each failed delivery costs';
    if (/authenticat|log-?in|sign[- ]?in|onboarding/.test(t))
        return 'the time people lose to that step today, and what a minute of it costs across the people who do it';
    if (/audit|certif|complian|governance|access review/.test(t))
        return 'the hours and outside fees the buyer spends on audit and compliance work today';
    if (/manual|automation|automat/.test(t))
        return 'the hours of manual work in the process today, and what an hour costs';
    if (/csat|satisf|resolution|contain|deflect|tickets?|inquir/.test(t))
        return 'the cases handled each month, the handling time per case, and the cost of one case';
    if (/data usage|data used|usage|bandwidth/.test(t))
        return 'the data or other usage the buyer pays for in a year, and the share of it that is idle or wasted';
    if (/adoption|users?|customers?/.test(t))
        return 'how much of the buyer\'s own work would run through it, and what the work around it costs today';
    let best = '';
    let n = 0;
    for (const m of metrics) {
        const sc = (0, rw1_common_ts_1.shared)(text, m);
        if (sc > n) {
            n = sc;
            best = m;
        }
    }
    if (best)
        return `the buyer's own ${best}, and what a change in it is worth in a year`;
    const own = ownMeasure(text);
    if (own)
        return `the buyer's own ${own} today, and what a change in it is worth in a year`;
    return 'which of the buyer\'s own numbers would change, and what that change is worth in a year';
}
/** The thing a quoted result changes, in the result's own words: "a 57% reduction in user authentication time" gives "user authentication time". */
function ownMeasure(text) {
    const m = text.match(/\b(?:reduction|decrease|drop|fall|improvement|increase|gain|growth|rise|uplift|cut|saving|savings)\s+(?:of\s+[\d.,%x ]+\s+)?(?:in|of|to|on)\s+(?:the\s+|its\s+|their\s+)?([a-z][a-z \-]{3,44}?)(?=\s+(?:with|by|using|after|through|from|across|for|at|within|when|thanks)\b|[.,;:(]|$)/i)
        || text.match(/\b(?:cut|cuts|cutting|reduced|reduces|lowered|lowers|raised|raises|boosted|boosts|improved|improves|increased|increases|saved|saves)\s+(?:its\s+|their\s+|the\s+)?([a-z][a-z \-]{3,44}?)\s+(?:by|from|to|with|after|through)\b/i);
    const phrase = m ? m[1].trim().toLowerCase() : '';
    return phrase && phrase.split(/\s+/).length <= 6 && !/^(?:it|that|them|this|costs?)$/.test(phrase) ? phrase : '';
}
function buildRoiStructure(args, i, d) {
    const money = d.money;
    const sizeText = i.companySize === 'smb' ? 'SMB' : i.companySize.replace(/_/g, ' ');
    const given = (n) => (n === null ? null : `${money(n)} (your input)`);
    const costGiven = i.ownCost !== null;
    const pctGiven = i.ownPct !== null;
    const customer = args.customer_name || 'your customer';
    // a title such as "Retail account (Acme customer)" is a label for the buyer, not a name to repeat inside every question
    const who = /\b(?:account|customer)\b/i.test(customer) ? 'the buyer' : customer;
    const brief = (0, rw1_common_ts_1.briefOf)(args.your_solution ? i.yourSolution : '', [i.customerName, i.knownMetrics, i.currentProcess]);
    const P = brief.short || 'your solution';
    const parts = (0, rw1_common_ts_1.partsOf)(brief);
    const ctx = (0, rw1_common_ts_1.reframeSector)(d.readContext(undefined, { seller: [i.yourSolution], context: [i.knownMetrics, i.currentProcess], buyer: [args.industry, i.customerName] }), i.yourSolution);
    const v = ctx.v;
    const mr = (0, rw1_common_ts_1.readModel)(ctx.model, ctx.line, i.yourSolution, []); // the current process and the quoted results are about the buyer's alternatives and other customers, not this seller's pricing
    const usage = mr.unit;
    const model = mr.model;
    const ctxLine = mr.line;
    const mw = (0, rw1_common_ts_1.modelWords)(model, i.yourSolution, usage || undefined);
    // the way the product is priced is stated only when the user's words or inputs show it, not when the sector's usual model was assumed
    const statedModel = mr.stated && model !== 'sim';
    const industryWords = (0, rw1_common_ts_1.cleanIndustry)(args.industry) || (0, rw1_common_ts_1.cleanIndustry)((0, rw1_common_ts_1.industryFromTitle)(args.customer_name));
    const buyerCtx = (0, verticals_ts_1.buyerContextFor)(args.industry, (0, rw1_common_ts_1.industryFromTitle)(args.customer_name));
    const proof = (0, dealtext_ts_1.parseProof)((0, rw1_common_ts_1.joinSplitClaims)(i.knownMetrics));
    const costLines = d.splitItems(i.currentProcess.replace(/^today (?:they|the buyer) (?:handle|handles|do|does) it with\s+/i, ''));
    const lines = (0, rw1_common_ts_1.readThreats)(costLines);
    const unit = usage;
    const revenueCell = i.revenueGiven ? (i.annualRevenue === 0 ? '$0 (your input)' : `${money(i.annualRevenue)} (your input)`) : 'not supplied';
    const employeesCell = i.employeesGiven ? (i.employeeCount === 0 ? '0 (your input)' : `${i.employeeCount.toLocaleString('en-US')} (your input)`) : 'not supplied';
    const priceCell = i.priceGiven ? (i.solutionPrice === 0 ? '$0 (your input)' : `${money(i.solutionPrice)} (your input)`) : 'not supplied';
    const out = [];
    out.push(`# ROI Business Case: ${customer}`);
    out.push(`*Your inputs are shown as you gave them. No ROI percentage, payback period or headline return is shown, because no buyer cost or value figure was given and this tool does not make one up. What follows is the business case laid out for ${customer}, so that every number their finance contact will ask for has a place.*`);
    // ---- the case in a paragraph ----
    const what = brief.kind ? `${P} ${(0, dealtext_ts_1.describeWith)((0, rw1_common_ts_1.cleanBrief)(brief))}${parts.length ? `, with ${(0, dealtext_ts_1.joinList)(parts)}` : ''}` : brief.short ? P : ((0, rw1_common_ts_1.sellerWords)(brief) ? `What you sell, in your words, is ${(0, rw1_common_ts_1.sellerWords)(brief)}` : P);
    out.push(`## The case in brief\n\n` + `${what}. ${model && statedModel ? `The buyer pays for it as ${mw.priced}. ` : ''}${(0, rw1_common_ts_1.cleanIndustry)(args.industry) && !customer.toLowerCase().includes((0, rw1_common_ts_1.cleanIndustry)(args.industry).toLowerCase()) ? `${(0, dealtext_ts_1.upperFirst)(who)} is read here as working in ${(0, rw1_common_ts_1.cleanIndustry)(args.industry)}. ` : ''}${costLines.length ? `The way of working it would replace is ${costLines.length === 1 ? 'one cost line below, which needs' : `${costLines.length} cost lines below, each of which needs`} a yearly cost from the buyer.` : ''}`.replace(/\s{2,}/g, ' ') + `\n\n${ctxLine}`);
    // ---- the price ----
    if (i.priceGiven && i.solutionPrice > 0) {
        out.push(`## What the buyer pays\n\nAt the annual price you gave (${money(i.solutionPrice)}), the value the buyer sees must be above ${money(i.solutionPrice)} a year for any positive return, and above ${money(i.solutionPrice * 2)} a year to return the price twice over. Over three years the buyer pays ${money(i.solutionPrice * 3)} before any one-time cost. This is arithmetic on your price and says nothing about the value. Amounts are in dollars, as the price field is; if your price is in another currency, convert it first${model === 'transactions' ? `, and enter the yearly spend you expect at the buyer's volume${unit ? ` of ${unit}s` : ''}` : ''}.`);
    }
    if (i.revenueGiven || i.employeesGiven)
        out.push(`\`annual_revenue\` and \`employee_count\` describe the customer's size. They are shown below as you gave them, but this tool does not turn them into a value: that would need a rate or share only the buyer can give.`);
    const flags = [];
    const smallWords = /\b(?:smb|small|micro|d2c|startups?)\b/i.test(`${i.customerName} ${args.industry || ''}`);
    if (args.company_size === 'enterprise' && smallWords)
        flags.push('You set company_size to enterprise, but the customer is described as SMB or small in its name; check which is right, because the size changes who reviews the case and what price is realistic.');
    if (args.company_size === 'smb' && /\b(?:enterprise|large|global)\b/i.test(i.customerName))
        flags.push('You set company_size to SMB, but the customer is described as large or enterprise in its name; check which is right, because the size changes who reviews the case.');
    if (/\bIndia(?:n)?\b|\brupees?\b|\bINR\b|\blakhs?\b|\bcrores?\b/i.test(`${i.yourSolution} ${i.customerName} ${i.knownMetrics} ${i.currentProcess}`))
        flags.push('Your inputs mention India; the price field is in dollars, so if your price is in rupees, convert it first.');
    if (flags.length)
        out.push(`## Inputs to check\n\n${flags.join(' ')}`);
    // ---- the cost lines ----
    const bestPart = (text) => (0, rw1_common_ts_1.matchPart)(text, parts, brief.short);
    const partUse = new Set();
    if (costLines.length) {
        const seen = new Map();
        const rows = lines.map((l) => {
            const n = seen.get(l.id) || 0;
            seen.set(l.id, n + 1);
            const q = n === 0 ? (COST_Q[l.id] || COST_Q.general) : COST_ALT[(n - 1) % COST_ALT.length];
            const named = (0, rw1_common_ts_1.namedParts)(l.text, parts, brief.short);
            const part = named.length ? (0, dealtext_ts_1.joinList)(named) : bestPart(l.text);
            if (named.length)
                named.forEach((x) => partUse.add(x));
            else if (part)
                partUse.add(part);
            return `| ${d.cap(l.text)} | "${q}" |${parts.length ? ` ${part || 'none matches by its words'} |` : ''}`;
        });
        out.push(`## Cost lines to price\n\nEach way of working that ${P} would replace is a cost line. Put a yearly cost on each one, then add them: that sum is \`current_annual_cost\`.\n\n| Cost line | Question to price it |${parts.length ? ` Part of ${P} that answers it |` : ''}\n|---|---|${parts.length ? '---|' : ''}\n${rows.join('\n')}`);
    }
    // ---- the quoted results ----
    const credibility = (p) => /\bseries [a-e]\b|valuation|funding|\braised\s+(?:us\$|\$|€|£|₹|rs\.?\s?\d|inr|\d[\d,.]*\s?(?:m|bn|k|million|billion|crore|cr)\b|a\s+(?:series|round)|capital)|\bfunding round\b|\bround\b(?!\s+the\s+clock)|\bipo\b|acquir\w+/i.test(p.text); // "raised first attempt delivery rate" is a result; "raised $20M" is funding
    const usedMeasure = new Map();
    // a quoted change ("from three days to 10 minutes", "lowered its data usage by more than 50%") is a result even when the sentence also holds a word the reader takes for a recognition or a scale ("a customer named", "more than")
    const CHANGE = /\b(?:lower\w*|dropp?\w*|cut|reduc\w+|decreas\w+|saved?|faster|shorter|increas\w+|improv\w+|grew|grow\w*|doubl\w+|halv\w+)\b|\bfrom\b.{2,40}\bto\b|\btook\b.{1,40}\b(?:days?|hours?|minutes?|weeks?)\b/i;
    const asResult = (p) => (p.kind === 'recognition' || p.kind === 'scale') && CHANGE.test(p.text) && /\d/.test(p.text) && !/\b(?:leader|visionary|award|quadrant|certified|recogni[sz]ed)\b/i.test(p.text);
    const results = proof.filter((p) => (p.kind === 'result' || p.kind === 'quote' || p.kind === 'story' || asResult(p)) && !credibility(p));
    const others = proof.filter((p) => !results.includes(p));
    if (proof.length) {
        out.push(`## Results you quoted\n\n${results.length ? `These are reference points, not this buyer's figures. Each is another organisation's result, from ${proof.some((p) => p.label) ? 'the source you labelled' : 'your notes'}; they show the buyer what to measure, and none should be entered as the buyer's own number.\n\n| Result you quoted | What it tells you to measure |${parts.length ? ` Part of ${P} it relates to |` : ''}\n|---|---|${parts.length ? '---|' : ''}\n${results.map((p) => { const m = measureOf(p.text, v ? v.metrics : []); const part = bestPart(p.text); if (part)
            partUse.add(part); const prev = usedMeasure.get(m); if (!prev)
            usedMeasure.set(m, (0, dealtext_ts_1.proofPhrase)(p)); return `| ${(0, dealtext_ts_1.proofPhrase)(p)}${p.label ? ` (${(0, dealtext_ts_1.proofSource)(p)})` : ''} | ${prev ? `As for ${(0, rw1_common_ts_1.quoted)((0, dealtext_ts_1.clip)(prev, 40))}: ${m}` : (0, dealtext_ts_1.upperFirst)(m)} |${parts.length ? ` ${part || 'none matches by its words'} |` : ''}`; }).join('\n')}\n` : ''}${others.length ? `\nNot value figures, so not used in the calculation: ${others.map((p) => (0, dealtext_ts_1.proofPhrase)(p)).join('; ')}. Keep them for the proposal as credibility.\n` : ''}`);
    }
    else if (i.knownMetrics) {
        out.push(`## Results you quoted\n\n${i.knownMetrics}\n\nThese are text. They are not used in a calculation until you give them as the numbers named at the end.`);
    }
    // ---- the case written out, from the inputs only ----
    const lineParts = lines.map((l) => ({ line: (0, rw1_common_ts_1.lowerStart)((0, rw1_common_ts_1.stripEnd)(l.text.replace(/\s*\([^()]*\)\s*$/, ''))), part: ((n) => (n.length ? (0, dealtext_ts_1.joinList)(n) : bestPart(l.text)))((0, rw1_common_ts_1.namedParts)(l.text, parts, brief.short)) }));
    const answered = lineParts.filter((x) => x.part).slice(0, 4);
    const measured = [...new Set(results.slice(0, 3).map((p) => measureOf(p.text, v ? v.metrics : [])))].slice(0, 2);
    if (costLines.length) {
        out.push(`## The case in words\n\n${(0, dealtext_ts_1.upperFirst)(who === 'the buyer' ? customer : who)} handles it today like this: ${(0, dealtext_ts_1.joinList)(lineParts.map((x) => x.line))}. Each of these has a yearly cost that the buyer can name. ${answered.length ? `${P} answers ${(0, dealtext_ts_1.joinList)(answered.map((x) => `"${x.line}" with ${x.part}`))}. ` : ''}${i.priceGiven && i.solutionPrice > 0 ? `The price you gave is ${money(i.solutionPrice)} a year, so the case holds only if the cost of the ways of working above, less the share ${P} removes, comes out clearly above that.` : `The case holds only if the cost of the ways of working above, less the share ${P} removes, comes out clearly above the price.`}${measured.length ? ` The results you quoted show what other organisations measured: ${measured.length === 1 ? (0, rw1_common_ts_1.lowerStart)(measured[0]) : `first, ${(0, rw1_common_ts_1.lowerStart)(measured[0])}; second, ${(0, rw1_common_ts_1.lowerStart)(measured[1])}`}.` : ''} The buyer supplies the two numbers that turn this into a return: the yearly cost and the share removed.`);
    }
    const placed = parts.filter((x) => !partUse.has(x));
    if (parts.length && placed.length)
        out.push(`## Parts not yet placed in the case\n\nNo cost line or quoted result above matches ${(0, dealtext_ts_1.joinList)(placed)} by its words. Ask the buyer which cost each one would remove, so that every part of ${P} has a place in the case.`);
    // ---- what the buyer's industry adds ----
    if (buyerCtx || v) {
        const bits = [];
        if (buyerCtx)
            bits.push(`In ${buyerCtx.name}, the losses a risk case can count are ${buyerCtx.risks}. ${buyerCtx.reviews}`);
        if (v)
            bits.push(`Buyers of ${v.name} products usually measure ${v.metrics.join(', ')}; put a yearly cost on the ones the problem moves.`);
        out.push(`## What this buyer will check\n\n${bits.join(' ')}`);
    }
    // ---- the drivers ----
    const driverKeys = i.primaryValueDriver === 'multiple'
        ? ['cost_reduction', 'productivity', 'risk_mitigation'].concat(!v || ['logistics-tech', 'fintech', 'vertical-saas', 'saas', 'telecom', 'ai-native'].includes(v.id) ? ['revenue_increase'] : [])
        : [['revenue_increase', 'cost_reduction', 'productivity', 'risk_mitigation'].includes(i.primaryValueDriver) ? i.primaryValueDriver : 'cost_reduction'];
    const painShort = costLines.slice(0, 2).map((c) => (0, rw1_common_ts_1.lowerStart)(c)).join(' or ');
    const incident = v?.id === 'cybersecurity' ? 'incident or breach' : v?.id === 'fintech' ? 'failed or fraudulent payment, or audit finding' : buyerCtx ? buyerCtx.risks.split(',')[0] : 'incident';
    const driverText = (k) => {
        switch (k) {
            case 'revenue_increase': return {
                title: 'Revenue increase',
                where: `Revenue that ${who} earns or keeps because of ${P}. This is the weakest kind of case unless the buyer owns the revenue number, so ask which revenue line the product touches before any figure is written down.`,
                figure: 'the revenue the buyer expects to add or keep in a year because of this, or the revenue the problem costs them today',
                qs: [`Which of ${who}'s revenue lines does ${P} touch, and how much did that line bring in last year?`, `What did the problem${painShort ? ` (${painShort})` : ''} cost that line last year, in revenue not earned or not kept?`, `What share of it would ${P} win back, and what is that based on: their own history, a pilot, or a result quoted from another customer?`, ...(model === 'transactions' && unit ? [`How many ${unit}s does that line run in a year, and what does one failed or late ${unit} cost in revenue?`] : v ? [`Which of ${(0, rw1_common_ts_1.some)(v.metrics, 3)} moves revenue for them, and by how much for each point of change?`] : [])],
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
    out.push(`## Value drivers${industryWords ? ` for ${industryWords}` : ''}\n\n${i.primaryValueDriver === 'multiple' ? 'You chose several drivers. Each one needs its own figure from the buyer; do not add them up until each is checked.' : 'The driver you chose is described below.'}\n\n${omitted}${drivers.map((x) => `### ${x.title}\n\n${x.where}\n\n- **The buyer's figure to ask for:** ${x.figure}.\n- **Questions to ask:**\n${x.qs.map((qq) => `  - "${qq}"`).join('\n')}`).join('\n\n')}`);
    // ---- questions to collect the figures ----
    const finance = v ? v.committee.match(/finance[^;.]*/i)?.[0] : undefined;
    out.push(`## Questions to collect the figures

1. What does this problem or process cost you in a year in total (people, rework, errors, outside spend)? This is \`current_annual_cost\`.
2. What share of that cost do you expect to remove, and what is that based on? This is \`expected_improvement_percent\`.
3. If you can value the result directly, what is it worth to you in a year? This is \`annual_value_estimate\`.
4. What is the annual cost of ${P} to the buyer, all in? This is \`solution_price\`.
5. Who in finance will check these figures before the decision, and what proof will they need?${finance ? ` (In ${v.name}: ${d.lowerFirstIfCommon(finance)}.)` : ''}
6. When would the value start (${mw.setup}), and what could delay it?`);
    out.push(`## How the calculation will work

Once the buyer's figures are in, the tool calculates in this order, and shows every step:

1. **Annual value** = \`annual_value_estimate\`, or \`current_annual_cost\` × \`expected_improvement_percent\` ÷ 100.
2. **Annual investment** = \`solution_price\` (the one-time implementation cost is shown but left out of ROI, payback and three-year value).
3. **Net annual benefit** = annual value minus annual investment.
4. **ROI** = net annual benefit ÷ annual investment, shown as a percentage.
5. **Payback** (in months) = annual investment ÷ annual value × the months in a year.
6. **Three-year net value** = three years of value minus three years of investment.
7. **Sensitivity**: the same sums with half the value and with one and a half times the value.`);
    // ---- what is missing (named once, at the end) ----
    const partial = costGiven && !pctGiven
        ? `You gave current_annual_cost (${given(i.ownCost)}). Add **expected_improvement_percent**, the share of that cost the buyer expects to save, and the value can be calculated.`
        : pctGiven && !costGiven
            ? `You gave expected_improvement_percent (${i.ownPct} percent, your input). Add **current_annual_cost**, what the problem costs the buyer in a year, and the value can be calculated.`
            : 'Give one of the two options below.';
    const status = (isGiven, text) => (isGiven ? `given: ${text}` : 'missing');
    const sharpen = [];
    if (!args.customer_name)
        sharpen.push('`customer_name` (it would change the title and every question, which now say "your customer")');
    if (!args.industry && !industryWords)
        sharpen.push('`industry` (it would change the buyer-side risks and reviews in this case)');
    if (!i.currentProcess)
        sharpen.push('`current_process` (it would change the cost lines to price: one line for each way of working it replaces)');
    if (!i.knownMetrics)
        sharpen.push('`known_metrics` (it would change the reference points: results you can quote, kept apart from the buyer\'s figures)');
    if (!i.priceGiven)
        sharpen.push('`solution_price` (it would change the arithmetic on what the buyer pays, and ROI and payback would use a labelled example price)');
    if (!args.implementation_timeline)
        sharpen.push('`implementation_timeline` (it would change the start of the value; it is read as 90 days, an example)');
    out.push(`## What is missing

${partial}

| Input | What it is | Status |
|-------|------------|--------|
| \`annual_value_estimate\` | Option A: the buyer's own estimate of the annual value, in dollars | ${status(false, '')} |
| \`current_annual_cost\` | Option B: what the problem or the current process costs the buyer in a year, in dollars | ${status(costGiven, given(i.ownCost) || '')} |
| \`expected_improvement_percent\` | Option B: the share of that cost the buyer expects to save, from 0 to 100 | ${status(pctGiven, i.ownPct === null ? '' : `${i.ownPct} percent (your input)`)} |
| \`solution_price\` | Your annual price, in dollars. Without it, ROI and payback use a labelled example price | ${i.priceGiven ? `given: ${priceCell}` : 'not supplied'} |

Either option A on its own, or option B (both of its inputs), is enough to calculate the value.${i.priceGiven ? '' : ' Add `solution_price` as well.'} Then run roi_business_case_builder again.${sharpen.length ? `\n\n**To sharpen this case, give:**\n\n${sharpen.map((x) => `- ${x}`).join('\n')}` : ''}`);
    const gaveRows = [];
    if (args.customer_name)
        gaveRows.push(`| **Customer** | ${args.customer_name} |`);
    if (args.industry)
        gaveRows.push(`| **Industry** | ${/_/.test(String(args.industry)) ? (0, rw1_common_ts_1.cleanIndustry)(args.industry) : String(args.industry)} (used for wording only; no industry figures are applied) |`);
    if (args.company_size)
        gaveRows.push(`| **Company Size** | ${sizeText} |`);
    gaveRows.push(`| **Annual Revenue** | ${revenueCell} |`);
    gaveRows.push(`| **Employees** | ${employeesCell} |`);
    gaveRows.push(`| **Solution** | ${brief.short ? `${P}${brief.kind ? `, ${(0, rw1_common_ts_1.cleanBrief)(brief).kind}` : ''}` : ((0, rw1_common_ts_1.sellerWords)(brief) || i.yourSolution)} |`);
    if (i.priceGiven)
        gaveRows.push(`| **Annual price** | ${priceCell} |`);
    if (args.implementation_timeline)
        gaveRows.push(`| **Implementation timeline** | ${i.implementationTimeline} |`);
    gaveRows.push('| **Confidence Level** | Not rated: no buyer figure was given, so no value or return is calculated |');
    out.push(`## What you gave

| Item | Value |
|------|-------|
${gaveRows.join('\n')}

Next steps: put the questions above to the buyer and write down where each number comes from; run the tool again with the inputs named under "What is missing"; have the buyer's finance contact check the figures before the case goes to the economic buyer.

Suggested timings, lengths and counts: adjust them to your own.`);
    void dealtext_ts_1.joinList;
    void rw1_common_ts_1.stripEnd;
    void rw1_common_ts_1.quoted;
    return out.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
//# sourceMappingURL=rw1-roi.js.map