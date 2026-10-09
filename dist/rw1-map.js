"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMutualActionPlan = buildMutualActionPlan;
// Run 22: mutual_action_plan_generator, rewritten. The calendar is the same one as before (working days, the phases of the stages from the
// current one to the close, more time for the evaluation). What changed is what the plan says: the business model decides the steps (a per
// message deal gets test sends, a services deal a transition, a device deal a pilot with devices), each requirement is its own criterion with
// its own test, each blocker gets an answer that fits it, and the buyer's own process steps become milestones. What was not given is listed once.
const dealtext_ts_1 = require("./dealtext.js");
const answers_ts_1 = require("./answers.js");
const verticals_ts_1 = require("./verticals.js");
const rw1_common_ts_1 = require("./rw1-common.js");
const STAGE_ORDER = ['discovery', 'evaluation', 'proposal', 'negotiation', 'procurement'];
const STAGE_NAME = { discovery: 'Discovery', evaluation: 'Evaluation', proposal: 'Business Case & Alignment', negotiation: 'Commercial & Legal', procurement: 'Procurement' };
const STAGE_AIM = {
    discovery: 'Agree what the buyer will judge the deal by and who must say yes.',
    evaluation: 'Show on the buyer\'s own case that the criteria are met, and start the reviews that take longest.',
    proposal: 'Put the result in a business case the economic buyer can approve, and answer every open question in writing.',
    negotiation: 'Settle the terms and the legal text.',
    procurement: 'Complete the buyer\'s purchasing steps.',
    close: 'Sign, and agree how the first weeks run.',
};
// ---- the requirements: one criterion each, and the claims kept apart ----
const LABEL = /\s*\(([^()]*\b(?:claims?|words|quote|story|stories|title|headline|figures?|survey)\b[^()]*)\)\s*[.]?$/i;
const VERB_START = /^(?:get|keep|protect|manage|streamline|raise|cut|close|reduce|increase|improve|speed|shorten|lower|grow|win|make|plan|launch|cover|avoid|stop|simplify|automate|scale|ship|move|find|build|run|track|see|bring|boost|connect|deliver|hit|meet|stay|retain|expand|consolidate|replace|lift|gain|save|prove|show|handle|trust|know|reach|fix|end|free|prevent|detect|respond|onboard|pay|collect|bill|price|forecast|prioriti[sz]e|verify|secure|comply|catch|clear|test|release|sell|serve|support|help|let|turn|take|put|resolve|act|enforce|achieve|predict|disrupt|unify|own|accept|disburse|avail|ask|answer|send|receive|enable|ensure|give|offer|provide|use|work|migrate|move|reclaim|shrink|raise|scale|keep)\b/i;
function clauses(text, split) {
    const body = text.includes(': ') ? text.slice(text.indexOf(': ') + 2) : text;
    const lead = text.includes(': ') ? text.slice(0, text.indexOf(': ')).trim() : '';
    const raw = split(body).map((x) => x.replace(/^(?:and|plus|then)\s+/i, '').trim()).filter(Boolean);
    const out = [];
    for (const r of raw) {
        const startsNew = VERB_START.test(r) || /^\d/.test(r) || /^(?:up to|an average|one|a |an |the )/i.test(r) || r.split(/\s+/).length > 3;
        if (out.length && !startsNew)
            out[out.length - 1] += `, ${r}`;
        else
            out.push(r);
    }
    return lead && out.length ? [lead, ...out] : out.length ? out : [text];
}
function buildMutualActionPlan(args, d) {
    const str = (k) => (typeof args[k] === 'string' ? args[k].trim() : '');
    const dealName = str('deal_name') || 'Deal';
    const targetCloseDate = str('target_close_date');
    const currentStage = str('current_stage') || 'evaluation';
    const champion = str('buyer_champion');
    const economic = str('economic_buyer');
    const evalIn = str('technical_evaluators');
    const procurement = str('procurement_contact');
    const reqIn = str('known_requirements');
    const stepsIn = str('known_process_steps');
    const blockersIn = str('blockers');
    const solutionIn = str('your_solution');
    const closeInput = targetCloseDate ? new Date(targetCloseDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    if (isNaN(closeInput.getTime()))
        return `target_close_date "${targetCloseDate}" is not a date this tool can read. Use the format YYYY-MM-DD, for example 2026-12-15.`;
    const today = new Date();
    const daysUntilClose = Math.round((closeInput.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    const industryWords = (0, rw1_common_ts_1.cleanIndustry)((0, rw1_common_ts_1.industryFromTitle)(dealName));
    const ctx = d.readContext(undefined, { seller: [solutionIn || 'the solution'], context: [reqIn, evalIn, blockersIn, dealName], role: [champion, economic] });
    const v = ctx.v;
    const investment = ctx.model === 'investment';
    const brief = (0, rw1_common_ts_1.briefOf)(solutionIn, [dealName, blockersIn, reqIn, evalIn, champion, economic]);
    const usage = ctx.model === 'saas' || !ctx.model ? (0, rw1_common_ts_1.usageUnit)(solutionIn, reqIn, blockersIn) : '';
    const model = usage ? 'transactions' : ctx.model;
    const ctxLine = usage ? (0, rw1_common_ts_1.usageLine)(ctx.line, usage) : ctx.line;
    const P = brief.short || 'the solution';
    const mw = (0, rw1_common_ts_1.modelWords)(model, solutionIn, usage || undefined);
    const buyerCtx = (0, verticals_ts_1.buyerContextFor)((0, rw1_common_ts_1.industryFromTitle)(dealName));
    // ---- the people ----
    const evaluators = (0, dealtext_ts_1.parseContacts)(evalIn, investment).map((c) => ({ ...c, raw: c.raw.replace(/^(?:and|or)\s+/i, ''), title: c.title.replace(/^(?:and|or)\s+/i, '') }));
    const pick = (fams) => evaluators.find((e) => fams.includes(e.family));
    const itName = (pick(['it', 'engineering', 'data']) || pick(['security']))?.title || 'Buyer IT reviewer';
    const secName = (pick(['security']) || pick(['it', 'engineering']) || pick(['risk']))?.title || 'Buyer security reviewer';
    const riskName = (pick(['risk']) || pick(['security']))?.title || 'Buyer risk and compliance reviewer';
    const finName = pick(['finance'])?.title || 'Buyer finance contact';
    const champName = champion || 'Buyer champion';
    const ebName = economic || 'Economic buyer';
    const champRef = champion || 'the buyer\'s champion';
    const ebRef = economic || 'the economic buyer';
    const procName = procurement || 'Buyer procurement and legal';
    const whoName = (w) => ({
        champion: champName, eb: ebName, seller: 'Seller (account executive)', se: 'Seller (solutions engineer)', both: 'Both teams', it: `${itName} with Seller (solutions engineer)`,
        security: secName, risk: riskName, proc: procName, finance: finName, eval: evaluators.length ? (0, dealtext_ts_1.joinList)(evaluators.slice(0, 3).map((e) => e.title)) : 'Buyer technical evaluators',
    }[w]);
    // ---- the calendar, in working days (unchanged) ----
    const start = (0, dealtext_ts_1.onOrAfterWorkday)(today);
    const close = (0, dealtext_ts_1.onOrBeforeWorkday)(closeInput);
    const closeNote = (0, dealtext_ts_1.isoDate)(close) !== (0, dealtext_ts_1.isoDate)(closeInput) ? ` (${(0, dealtext_ts_1.isoDate)(closeInput)} is a ${(0, dealtext_ts_1.weekdayName)(closeInput)}; the plan closes on ${(0, dealtext_ts_1.weekdayName)(close)} ${(0, dealtext_ts_1.isoDate)(close)})` : '';
    const N = Math.max((0, dealtext_ts_1.workdaysBetween)(start, close), 0);
    const from = Math.max(STAGE_ORDER.indexOf(currentStage), 0);
    const phaseStages = STAGE_ORDER.slice(from);
    const modelKey = investment ? 'investment' : v ? v.id : '';
    const evalWeight = ['ites', 'telecom', 'investment'].includes(modelKey) ? 5 : 4;
    const weights = phaseStages.map((s) => (s === 'evaluation' ? evalWeight : 2));
    const closeWeight = 1;
    const totalW = weights.reduce((a, b) => a + b, 0) + closeWeight;
    const lens = [];
    let used = 0;
    [...weights, closeWeight].forEach((w, i, all) => {
        const len = i === all.length - 1 ? Math.max(N - used, 0) : Math.max(Math.round((N * w) / totalW), N >= 2 * all.length ? 2 : 1);
        lens.push(len);
        used += len;
    });
    let over = lens.reduce((a, b) => a + b, 0) - N;
    while (over > 0) {
        const k = lens.indexOf(Math.max(...lens));
        if (lens[k] <= 1)
            break;
        lens[k]--;
        over--;
    }
    const bounds = [];
    let cursor = start;
    [...phaseStages, 'close'].forEach((s, i) => {
        const a = cursor;
        const b = i === phaseStages.length ? close : (0, dealtext_ts_1.addWorkdays)(a, lens[i]);
        bounds.push({ name: s === 'close' ? 'Close & Launch' : STAGE_NAME[s], stage: s, a, b: b.getTime() > close.getTime() ? close : b, len: lens[i] });
        cursor = b.getTime() > close.getTime() ? close : b;
    });
    const dateIn = (ph, i, k) => {
        const step = Math.max(Math.ceil(((i + 1) * Math.max(ph.len, 1)) / Math.max(k, 1)), 1);
        const dt = (0, dealtext_ts_1.addWorkdays)(ph.a, step);
        return (0, dealtext_ts_1.isoDate)(dt.getTime() > ph.b.getTime() ? ph.b : dt);
    };
    // ---- the requirements: criteria and claims ----
    const criteria = [];
    const claims = [];
    let theme = '';
    for (const item of d.splitItems(reqIn)) {
        const lm = item.match(LABEL);
        const label = lm ? lm[1].trim() : '';
        const body = lm ? item.slice(0, lm.index).trim() : item;
        const parts = clauses(body, (s) => d.splitItems(s.replace(/,\s+(?:and\s+)?/g, ';')));
        if (label)
            parts.forEach((p) => claims.push({ text: (0, rw1_common_ts_1.stripEnd)(p), label }));
        else if (body.includes(': ') && parts.length > 1) {
            theme = theme || parts[0];
            criteria.push(...parts.slice(1).map(rw1_common_ts_1.stripEnd));
        }
        else
            criteria.push(...(body.includes(': ') ? parts : [(0, rw1_common_ts_1.stripEnd)(body)]));
    }
    const evaluatorFor = (text) => {
        let best = '';
        let n = 0;
        for (const e of evaluators) {
            const s = (e.title.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => text.toLowerCase().includes(w.slice(0, 5))).length;
            if (s > n) {
                n = s;
                best = e.title;
            }
        }
        return best || champName;
    };
    const testFor = (c) => {
        const t = c.toLowerCase();
        if (/\b(?:countries|regions?|sites?|languages?|locations?|scale|volume|users|applications|devices|branches)\b/.test(t))
            return 'Test every item on real traffic or data, not a sample of one, and record which pass';
        if (/\b(?:integrat\w*|connect\w*|sso|single sign|api|import|sync)\b/.test(t))
            return 'Connect it to the named systems with a real record and have the system owner check the result';
        if (/\b(?:security|compliance|audit|regulat\w*|governance|least privilege|privacy|evidence|access)\b/.test(t))
            return 'Check it against the buyer\'s own policy or control list with the reviewer present, and keep the evidence';
        if (/\b(?:cost|cheap\w*|afford\w*|fees?|price|saving|savings|save|margin|budget|spend)\b/.test(t))
            return 'Price the same activity both ways on the buyer\'s own volumes, line by line';
        if (/\b(?:seconds?|minutes?|hours?|days?|weeks?|real[- ]time|faster|quick\w*|speed|within|in under)\b/.test(t))
            return 'Time it on a real case against the current way, before and after';
        if (/\b(?:accura\w*|quality|errors?|reliab\w*|false|uptime|availability)\b/.test(t))
            return 'Measure it on the buyer\'s own data against a pass mark agreed first';
        if (/\b(?:productivity|adopt\w*|usage|ease|easy|developers?)\b/.test(t))
            return 'Let the people who will use it work with it on real tasks and ask them to rate it';
        return 'Agree the measure and the pass mark with the champion, then test it on the buyer\'s own case';
    };
    // ---- the buyer's own process steps, placed by what they are ----
    const processSteps = d.splitItems(stepsIn).map(rw1_common_ts_1.stripEnd);
    const placeStep = (s) => {
        const t = s.toLowerCase();
        if (/security|questionnaire|vendor (?:risk )?assessment|risk assessment|due diligence|penetration|infosec/.test(t))
            return { stage: 'evaluation', who: 'security' };
        if (/legal|contract|redline|data processing|dpa|terms|nda|msa/.test(t))
            return { stage: 'negotiation', who: 'proc' };
        if (/procure|purchase order|\bpo\b|vendor (?:registration|onboarding|master)|payment|invoice|supplier/.test(t))
            return { stage: 'procurement', who: 'proc' };
        if (/budget|business case|finance|cost/.test(t))
            return { stage: 'proposal', who: 'finance' };
        if (/approv|board|committee|sign|steering/.test(t))
            return { stage: 'negotiation', who: 'eb' };
        return { stage: 'evaluation', who: 'eval' };
    };
    const firstStageAtOrAfter = (stage) => { const i = STAGE_ORDER.indexOf(stage); const j = Math.max(i, from); return STAGE_ORDER[j] || STAGE_ORDER[from]; };
    const processBy = {};
    for (const s of processSteps) {
        const p = placeStep(s);
        const stage = firstStageAtOrAfter(p.stage);
        (processBy[stage] ||= []).push({ m: `Buyer's process step, in your words: ${s}`, who: p.who });
    }
    const securityCovered = (processBy.evaluation || []).some((s) => s.who === 'security');
    // ---- blockers ----
    const blockerItems = d.splitItems(blockersIn);
    const qa = { P, parts: (0, rw1_common_ts_1.partsOf)(brief), model, sellerText: solutionIn, unit: usage || undefined, v, needs: criteria.slice(0, 3).map(rw1_common_ts_1.lowerStart), alternatives: [] };
    const blockerAnswers = (0, rw1_common_ts_1.dedupeAnswers)(blockerItems.map((b) => ({ text: b, a: (0, rw1_common_ts_1.answerQuestion)(b, qa) })));
    const ownerFor = (id) => ({ it: `${itName} with Seller (solutions engineer)`, security: `${secName} with Seller`, price: `${ebName} with Seller`, champion: `${champName} with Seller`, se: `${champName} with Seller (solutions engineer)`, terms: `${procName} with ${ebName}`, seller: `Seller with ${champName}` }[(0, rw1_common_ts_1.ownerKind)(id)] || `Seller with ${champName}`);
    // ---- the steps of each phase ----
    const stock = d.stockEval(v, investment);
    const unit = usage || (/\b(?:messages?|sms|whatsapp|rcs)\b/i.test(solutionIn) ? 'message' : 'transaction');
    const isMessage = unit === 'message';
    const modelEval = {
        transactions: [
            { m: isMessage ? `Agree the test traffic: the message types, the destinations and the baseline to beat (the current provider's delivery rate, delivery report timing and price per message)` : `Agree the test volume: which ${unit}s and where they run, and the baseline to beat (the current provider's results and price per ${unit})`, who: 'both' },
            { m: isMessage ? `Complete the account and sender approvals the traffic needs and connect to ${P} in a sandbox` : `Complete the account set-up the test needs and connect the test ${unit}s to ${P}`, who: 'it' },
            { m: isMessage ? `Run test messages by destination for a full week and compare delivery, report timing and price per message with the current provider on the same traffic` : `Run the test on live ${unit}s for a full cycle and compare results and price per ${unit} with the current provider on the same volume`, who: 'champion' },
            { m: isMessage ? 'Review the results against the baseline and agree the order in which routes and countries move' : 'Review the results against the baseline and agree the order in which the rest move', who: 'both' },
        ],
        services: [
            { m: 'Agree the scope of services and the service level design (measures, reporting and credits)', who: 'both' },
            { m: 'Draft the transition plan: knowledge transfer from the current provider, a parallel run and exit criteria for each stage', who: 'se' },
            { m: 'Agree the governance: monthly reports, review meetings and escalation', who: 'both' },
        ],
        connectivity: [
            { m: 'Survey the pilot sites and confirm the delivery time of each link', who: 'se' },
            { m: 'Agree the pilot sites (the worst served first) and the baseline for uptime and repair time', who: 'both' },
            { m: 'Bring the pilot sites live and compare uptime and repair time with the current operator for the same sites', who: 'champion' },
            { m: 'Draft the wave plan by region, with a fallback link and a rollback rule for each wave', who: 'both' },
        ],
        hardware_software: [
            { m: 'Choose the pilot site and agree the baseline and the measure the devices must improve', who: 'both' },
            { m: `Deliver and install the pilot devices and connect them to the ${P} software`, who: 'it' },
            { m: 'Run the pilot for a full cycle at that site and read the data every week with the champion', who: 'champion' },
            { m: 'Review the pilot against the baseline and agree the order in which the other sites are fitted', who: 'both' },
        ],
        marketplace: [
            { m: 'Choose the category or region for the pilot and agree what a healthy week of trading looks like', who: 'both' },
            { m: 'Seed the first listings and connect the buyer\'s systems that create them', who: 'it' },
            { m: 'Run the pilot for a full cycle and track completed transactions from both sides', who: 'champion' },
            { m: 'Review the pilot against the agreed measure and agree the next categories or regions', who: 'both' },
        ],
        saas: [
            { m: 'Choose the team and the real project or workflow for the trial, and agree the baseline and the measure before it starts', who: 'both' },
            { m: 'Connect the tools the trial must work with and set up the first users', who: 'it' },
            { m: 'Run the trial on that work and check use every week', who: 'champion' },
            { m: 'Review the result against the baseline and agree what the rollout covers and in what order', who: 'both' },
        ],
    };
    const baseEval = [...(stock || modelEval[model || 'saas'] || modelEval.saas)];
    const critSteps = criteria.slice(0, 3).map((c) => ({ m: `Test the buyer's criterion ${(0, rw1_common_ts_1.quoted)(c)}: ${(0, rw1_common_ts_1.lowerStart)(testFor(c))}`, who: 'eval', owner: evaluatorFor(c) }));
    const evalSteps = [...baseEval, ...critSteps, ...(processBy.evaluation || [])];
    if (!securityCovered && !evalSteps.some((s) => /security|compliance|risk/i.test(s.m)))
        evalSteps.push({ m: 'Security and compliance review of the vendor and its data handling', who: 'security' });
    if (buyerCtx?.id === 'financial')
        evalSteps.push({ m: 'Complete the third party risk assessment and the information security questionnaire the buyer requires of a new vendor', who: 'risk' });
    evalSteps.push(brief.short ? { m: `Reference calls with similar ${P} customers (only if one has agreed)`, who: 'champion' } : { m: 'Reference calls with similar customers (only if one has agreed)', who: 'champion' });
    const dedup = (steps) => steps.filter((s, i) => steps.findIndex((t) => t.m === s.m) === i);
    const discoveryWho = [champion, economic, ...evaluators.map((e) => e.title)].filter(Boolean);
    const stepsFor = {
        discovery: [
            { m: discoveryWho.length ? `Hold discovery sessions with ${(0, dealtext_ts_1.joinList)(discoveryWho.slice(0, 5))}` : 'Hold discovery sessions with each person who will judge the deal', who: 'both' },
            { m: criteria.length ? `Write down the pass mark for each of the ${criteria.length} criteria below` : 'Write down the business requirements and the pass mark for each', who: 'champion' },
            { m: `Identify every approver and what each will check${buyerCtx ? ` (${buyerCtx.name}: ${(0, rw1_common_ts_1.lowerStart)(buyerCtx.reviews).replace(/[.]+$/, '')})` : ''}`, who: 'seller' },
            { m: 'Agree the evaluation plan and the dates in this table', who: 'both' },
            ...(processBy.discovery || []),
        ],
        evaluation: dedup(evalSteps),
        proposal: [
            { m: `Present the business case, built from the buyer's own figures, to ${ebRef}`, who: 'seller' },
            { m: 'Check the cost and value figures with the finance contact', who: 'finance' },
            ...(buyerCtx?.id === 'public-sector' ? [{ m: 'Confirm the route the purchase must follow (a tender, a framework or an approved supplier list) and any security authorisation needed before use', who: 'proc' }] : []),
            { m: `Agree the commercial shape of the deal: ${mw.terms}`, who: 'seller' },
            { m: blockerItems.length ? `Send written answers to the ${blockerItems.length === 1 ? 'blocker' : `${blockerItems.length} blockers`} in Risks & Blockers` : 'Confirm in writing that no question is left open', who: 'both' },
            ...(processBy.proposal || []),
        ],
        negotiation: [
            { m: `Agree the commercial terms (${mw.terms})`, who: 'both' },
            { m: 'Complete the legal review and resolve the redlines', who: 'proc' },
            { m: `Confirm the implementation timeline and the owners on both sides: ${mw.setup}`, who: 'both' },
            { m: 'Obtain the final approvals', who: 'eb' },
            ...(processBy.negotiation || []),
        ],
        procurement: [
            { m: 'Complete vendor registration and submit the documents the buyer\'s process asks for', who: 'proc' },
            { m: 'Finalize the payment terms', who: 'proc' },
            { m: 'Complete the final approvals', who: 'eb' },
            ...(processBy.procurement || []),
        ],
        close: [
            { m: 'Contract signed', who: 'eb' },
            { m: `Kickoff scheduled: ${mw.setup}`, who: 'both' },
            { m: criteria.length ? 'Success criteria written down from the criteria above, with the pass mark for each' : 'Success criteria written down', who: 'seller' },
        ],
    };
    const phaseBlock = (ph, n) => {
        const steps = stepsFor[ph.stage] || [];
        const rows = steps.map((s, i) => `| ${i + 1} | ${s.m} | ${s.owner ?? whoName(s.who)} | ${dateIn(ph, i, steps.length)} | Pending |`);
        const heading = `### Phase ${n}: ${ph.name}${n === 1 ? ', the current stage' : ''} (${(0, dealtext_ts_1.isoDate)(ph.a)} to ${(0, dealtext_ts_1.isoDate)(ph.b)})`;
        const extra = ph.stage === 'evaluation' && v ? `\n**How this sector buys:** ${v.salesMotion}\n` : '';
        const window = ph.stage === 'evaluation' && ph.len > 0 && ph.len < 8 ? `\nThe evaluation has only ${ph.len} working day${ph.len === 1 ? '' : 's'}, so the test as written (${(0, rw1_common_ts_1.lowerStart)(mw.proof)}) will not fit. Shorten it to one case, or move the close date.\n` : '';
        return `${heading}\n\n${STAGE_AIM[ph.stage]}\n\n| # | Milestone | Owner | Due Date | Status |\n|---|-----------|-------|----------|--------|\n${rows.join('\n')}\n${window}${extra}`;
    };
    const tight = N < 10 ? `\n*Only ${N} working day${N === 1 ? '' : 's'} remain before the close date, so the phases are short and several steps must run in parallel. Check that the close date is realistic.*\n` : '';
    // ---- assemble ----
    const out = [];
    out.push(`# Mutual Action Plan: ${dealName}`);
    const stageText = currentStage.replace(/_/g, ' ');
    out.push(`## Overview\n\nThis plan takes the deal ${(0, rw1_common_ts_1.quoted)(dealName)} from the ${stageText} stage to a signed contract on ${(0, dealtext_ts_1.isoDate)(closeInput)}${closeNote}: ${N} working days from ${(0, dealtext_ts_1.isoDate)(start)}, ${daysUntilClose} calendar days.${solutionIn ? (brief.short ? ` The seller is offering ${P}${brief.kind ? `, which ${(0, dealtext_ts_1.describeWith)((0, rw1_common_ts_1.cleanBrief)(brief))}` : ''}${model ? `, bought as ${mw.priced}` : ''}.` : ` The seller is offering what it describes in its own words as ${(0, rw1_common_ts_1.sellerWords)(brief)}${model ? `, bought as ${mw.priced}` : ''}.`) : ''}${industryWords ? ` The buyer works in ${(0, rw1_common_ts_1.lowerStart)(industryWords)}, read from the deal name.` : ''}${buyerCtx ? ` ${buyerCtx.reviews} ${buyerCtx.buying}` : ''}\n\n${ctxLine}${tight}`);
    const people = [];
    if (champion)
        people.push(`| **Champion** | ${champion} | Keeps the plan alive on the buyer's side, gathers the evaluators and answers the open questions with us |`);
    if (economic)
        people.push(`| **Economic buyer** | ${economic} | Approves the business case and the final decision |`);
    for (const e of evaluators)
        people.push(`| **Evaluator** | ${e.title} | ${(0, dealtext_ts_1.upperFirst)((0, answers_ts_1.roleFor)(e.title, investment).owns)} |`);
    if (procurement)
        people.push(`| **Procurement** | ${procurement} | The buyer's purchasing steps, the contract and the payment terms |`);
    out.push(`## Key Stakeholders\n\n${people.length ? `| Role | Name | What they own in this plan |\n|------|------|-----------|\n${people.join('\n')}\n\n` : ''}On the seller side the account executive owns the deal and the plan, a solutions engineer owns the technical validation, and an executive sponsor is called in at the phase gates and for escalation.`);
    const crit = ['## Success Criteria'];
    if (criteria.length) {
        crit.push(`${theme ? `The buyer's aim, in your words, is to ${(0, rw1_common_ts_1.quoted)(theme)}. ` : ''}Each of the ${criteria.length} things you listed is its own criterion, with the way it will be tested in the evaluation.\n\n| Criterion | How it will be tested | Judged by |\n|-----------|-----------------------|-----------|\n${criteria.map((c) => `| ${(0, dealtext_ts_1.upperFirst)(c)} | ${testFor(c)} | ${evaluatorFor(c)} |`).join('\n')}`);
    }
    if (claims.length) {
        const labels = [...new Set(claims.map((c) => c.label))];
        crit.push(`These come from the seller's side (${(0, dealtext_ts_1.joinList)(labels)}), so they are not criteria the buyer has agreed: ${claims.map((c) => (0, rw1_common_ts_1.quoted)(c.text)).join('; ')}. Use them as reference points, and turn each into a test on the buyer's own data before it goes into the evaluation.`);
    }
    if (!criteria.length && !claims.length)
        crit.push(`Until the buyer names what they will judge the deal by, the evaluation has no pass mark${v ? `; in ${v.name} buyers usually look at ${(0, rw1_common_ts_1.some)(v.metrics, 3)}` : ''}.`);
    if (v && !criteria.length)
        crit.push(`What this sector measures: ${v.metrics.join(', ')}.`);
    out.push(crit.join('\n\n'));
    out.push(`## Mutual Action Plan Timeline\n${processSteps.length ? `\nThe buyer's own process, as you gave it: ${(0, dealtext_ts_1.joinList)(processSteps.map(rw1_common_ts_1.quoted))}. Each step is placed as a milestone below.\n` : ''}\n${bounds.map((ph, i) => phaseBlock(ph, i + 1)).join('\n---\n\n')}`);
    const risks = ['## Risks & Blockers'];
    if (blockerAnswers.length) {
        risks.push(`Each blocker below is answered on its own question. Where an answer needs a fact about ${P}, it says what to confirm first.\n\n| Blocker | Answer | Owner | Status |\n|---------|--------|-------|--------|\n${blockerAnswers.map((b) => `| ${(0, rw1_common_ts_1.stripEnd)(b.text).replace(/\|/g, '/')}${/[?]$/.test(b.text.trim()) ? '?' : ''} | ${b.a.answer} Confirm first: ${(0, rw1_common_ts_1.stripEnd)(b.a.bring)}. | ${ownerFor(b.a.id)} | Open |`).join('\n')}`);
    }
    else if (v) {
        risks.push(`${v.name[0].toUpperCase()}${v.name.slice(1)} buyers usually raise these objections, so prepare an answer to each before the evaluation ends:\n\n${v.objections.slice(0, 3).map((o) => `- ${o.objection}: ${o.response}`).join('\n')}`);
    }
    const riskList = [];
    const longest = (processBy.evaluation || [])[0] || (processBy.negotiation || [])[0];
    riskList.push(`The calendar: ${N} working days for ${bounds.length - 1} stage${bounds.length === 2 ? '' : 's'}${longest ? `, and the buyer's own step "${longest.m.replace("Buyer's process step, in your words: ", '')}" is not under your control: start it in the first week` : ', with the reviews running beside the evaluation, not after it'}.`);
    riskList.push(`Losing the champion: if the champion leaves or is moved, ${evaluators[0] ? evaluators[0].title : economic ? ebName : 'the next person on the buyer\'s side'} must already know the plan; keep them in the weekly loop.`);
    riskList.push(`The evaluation shows a gap: agree the pass mark for each criterion before the test starts${criteria.length ? ` (the ${criteria.length} above)` : ''}, so a gap is a finding and not a surprise.`);
    risks.push(`### What can move the close date\n\n${riskList.map((x) => `- ${x}`).join('\n')}`);
    out.push(risks.join('\n\n'));
    const comm = [
        `| Weekly | ${champName} and the account executive | Progress against the table above and the open questions |`,
        `| Every two weeks | ${evaluators.length ? (0, dealtext_ts_1.joinList)(evaluators.slice(0, 3).map((e) => e.title)) : 'The buyer\'s technical evaluators'} and the solutions engineer | Progress of the tests |`,
        `| At each phase gate (${bounds.map((b) => (0, dealtext_ts_1.isoDate)(b.a)).slice(1).join(', ') || (0, dealtext_ts_1.isoDate)(close)}) | ${ebName} and the executive sponsor | Decisions and the next phase |`,
    ];
    out.push(`## Communication Plan\n\n| Cadence | Participants | Purpose |\n|---------|--------------|---------|\n${comm.join('\n')}\n\nEscalation runs from ${champRef} to ${ebRef} first; if that does not clear it, the seller's manager goes to the buyer's executive.`);
    out.push(`## Next Actions (This Week)

| Priority | Action | Owner | Due |
|----------|--------|-------|-----|
| High | ${champion ? `Confirm the dates and owners in this plan with ${champion}` : 'Find and confirm the champion'} | AE | ${(0, dealtext_ts_1.isoDate)((0, dealtext_ts_1.addWorkdays)(start, 1))} |
| High | ${economic ? `Book a meeting with ${economic} for the first phase gate` : 'Find out who signs, and ask for that person by name'} | AE | ${(0, dealtext_ts_1.isoDate)((0, dealtext_ts_1.addWorkdays)(start, 2))} |
| Medium | ${champion ? `Send this plan to ${champion} to edit` : 'Share this plan with your main buyer contact'} | AE | ${(0, dealtext_ts_1.isoDate)(start)} |
| Medium | ${processSteps.length ? `Start ${(0, rw1_common_ts_1.quoted)(processSteps[0])} now` : 'Ask which buyer step takes longest and start it now'} | Both | ${(0, dealtext_ts_1.isoDate)((0, dealtext_ts_1.addWorkdays)(start, 3))} |

This only works as a mutual plan once the buyer has corrected the dates and the owners; update it as things change.`);
    const miss = [];
    if (!champion)
        miss.push('`buyer_champion` (it would change who keeps the plan alive on the buyer\'s side and owns the first meetings)');
    if (!economic)
        miss.push('`economic_buyer` (it would change who approves the business case and owns the final approvals)');
    if (!evalIn)
        miss.push('`technical_evaluators` (it would change the owners of the technical and security steps, which now use roles)');
    if (!procurement)
        miss.push('`procurement_contact` (it would change the owner of the legal, vendor registration and payment steps)');
    if (!reqIn)
        miss.push('`known_requirements` (it would change the criteria table, now empty, into one row for each with a test)');
    if (!stepsIn)
        miss.push('`known_process_steps` (it would change the milestones, which would then include the buyer\'s own approvals with dates)');
    if (!blockersIn)
        miss.push('`blockers` (it would change the Risks & Blockers table, which would then answer each one)');
    if (!solutionIn)
        miss.push('`your_solution` (it would change the evaluation steps to fit what you sell and how it is priced)');
    if (!args.current_stage)
        miss.push('`current_stage` (it would change the first phase; it is read as evaluation now)');
    if (!targetCloseDate)
        miss.push('`target_close_date` (it is required; the plan used a date 60 days out as an example)');
    out.push(miss.length ? `**To sharpen this plan, give:**\n\n${miss.map((x) => `- ${x}`).join('\n')}\n\n*Last updated ${(0, dealtext_ts_1.isoDate)(today)}.*` : `*Last updated ${(0, dealtext_ts_1.isoDate)(today)}.*`);
    return out.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
//# sourceMappingURL=rw1-map.js.map