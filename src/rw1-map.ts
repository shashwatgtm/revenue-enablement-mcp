// Run 22: mutual_action_plan_generator, rewritten. The calendar is the same one as before (working days, the phases of the stages from the
// current one to the close, more time for the evaluation). What changed is what the plan says: the business model decides the steps (a per
// message deal gets test sends, a services deal a transition, a device deal a pilot with devices), each requirement is its own criterion with
// its own test, each blocker gets an answer that fits it, and the buyer's own process steps become milestones. What was not given is listed once.
import { addWorkdays, describeWith, isoDate, joinList, onOrAfterWorkday, onOrBeforeWorkday, parseContacts, solutionBrief, upperFirst, weekdayName, workdaysBetween, type Contact } from './dealtext.ts';
import { roleFor } from './answers.ts';
import { buyerContextFor } from './verticals.ts';
import { answerQuestion, briefOf, readModel, reframeSector, sellerOffers, cleanBrief, dedupeAnswers, sellerWords, cleanIndustry, industryFromTitle, lowerStart, modelWords, ownerKind, partsOf, quoted, readRole, some, stripEnd, type Deps, type QACtx } from './rw1-common.ts';
import { concernOf, type ConcernId } from './concern-types.ts';

type Who = 'champion' | 'eb' | 'seller' | 'se' | 'both' | 'it' | 'security' | 'risk' | 'proc' | 'finance' | 'eval';
interface Step { m: string; who: Who; owner?: string }
const STAGE_ORDER = ['discovery', 'evaluation', 'proposal', 'negotiation', 'procurement'];
const STAGE_NAME: Record<string, string> = { discovery: 'Discovery', evaluation: 'Evaluation', proposal: 'Business Case & Alignment', negotiation: 'Commercial & Legal', procurement: 'Procurement' };
const STAGE_AIM: Record<string, string> = {
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
function clauses(text: string, split: (s: string) => string[]): string[] {
  const body = text.includes(': ') ? text.slice(text.indexOf(': ') + 2) : text;
  const lead = text.includes(': ') ? text.slice(0, text.indexOf(': ')).trim() : '';
  const raw = split(body).map((x) => x.replace(/^(?:and|plus|then)\s+/i, '').trim()).filter(Boolean);
  // a fragment opens a new criterion when it starts with a verb or a number; any other fragment ("not days", "from one platform for ...") belongs to the one before
  const out: string[] = [];
  for (const r of raw) {
    const startsNew = VERB_START.test(r) || /^\d/.test(r);
    if (out.length && !startsNew) out[out.length - 1] += `, ${r}`; else out.push(r);
  }
  // "X for A and Y for B" is two criteria
  const spread = out.flatMap((c) => { const m = c.match(/^(.+? for [^,]+?) and ([a-z][^,]*? for .+)$/i); return m ? [m[1], m[2]] : [c]; });
  return lead && spread.length ? [lead, ...spread] : spread.length ? spread : [text];
}

// Explicit availability and review durations outrank illustrative phase spacing.
function constrainedPlan(deal: string, target: string, notes: string, requirement: string, blockers: string): string | null {
  const clauses = `${notes}; ${requirement}; ${blockers}`.replace(/\\([.!?])/g, '$1').split(/[;\n]|(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
  const constraints: Array<{step: string; date: string; days: number | null; business: boolean; end: string | null; note: string}> = [];
  for (const clause of clauses) {
    const match = clause.match(/^(.*?)\b(?:(?:cannot|can not|can't|must not|will not|won't)\s+(?:start|begin)\s+before|(?:starts?|begins?)\s+(?:no earlier than|on or after)|(?:earliest\s+(?:start(?:\s+date)?|availability)(?:\s+is)?\s*[:=]?)|not\s+before|available\s+from)\s*(\d{4}-\d{2}-\d{2})\b/i);
    if (!match) continue;
    const start = new Date(match[2] + 'T00:00:00Z');
    if (!Number.isFinite(start.getTime()) || isoDate(start) !== match[2]) continue;
    const step = match[1].trim().replace(/[:,]$/, '') || 'Buyer step';
    const key = step.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['review','process','step','buyer'].includes(w))[0];
    const duration = clauses.find(c => (!key || c.toLowerCase().includes(key)) && /\b\d+\s+(?:(?:business|working|calendar)\s+)?days?\b/i.test(c));
    const dm = duration?.match(/\b(\d+)\s+(?:(business|working|calendar)\s+)?days?\b/i);
    const days = dm ? Number(dm[1]) : null, business = !!dm && /business|working/i.test(dm[2] || '');
    const end = days === null ? null : business ? isoDate(addWorkdays(onOrAfterWorkday(start), days)) : isoDate(new Date(start.getTime() + days * 86400000));
    constraints.push({step,date:match[2],days,business,end,note:clause});
  }
  const unresolvedTiming = clauses.filter(clause =>
    /\b(?:starts?|begins?|available|availability|cannot start|can't start|can not start)\b.{0,35}\b(?:after|before|from|on|until)\s+(?:(?:\d{1,4}[-/ ]|(?:next |this )?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|january|february|march|april|may|june|july|august|september|october|november|december)))/i.test(clause)
    && !constraints.some(c => c.note === clause));
  if (unresolvedTiming.length) return `# Mutual Action Plan: ${deal}

## Schedule held for the buyer's constraints
Requested close: ${target}. The buyer supplied timing that this tool cannot safely turn into a complete date. Confirm the year, earliest start and duration with the review owner before assigning milestones. No close feasibility or review completion date is established.

Timing supplied, preserved in your words:
${unresolvedTiming.map(c => `- ${quoted(c)}.`).join('\n')}
${constraints.length ? `\nOther dated constraints supplied:\n${constraints.map(c => `- ${c.step}: no earlier than ${c.date}; ${c.end ? `earliest completion ${c.end}` : 'completion not established without a duration'}.`).join('\n')}\n` : ''}
## Buyer process and evidence
${notes ? `Process supplied: ${quoted(notes)}.` : 'No process supplied.'}
${requirement ? `Requirements supplied: ${quoted(requirement)}.` : 'No requirements supplied.'}
${blockers ? `Blockers supplied: ${quoted(blockers)}.` : 'No additional blockers supplied.'}

## Next actions
1. The account executive asks the buyer's review owner to confirm each timing phrase as a full date and duration, including holidays and capacity.
2. The buyer confirms the order of acceptance, security, legal, procurement and signature. Keep signature after the approvals it requires.
3. The economic buyer confirms budget authority and the revised close after those dependencies are dated. Keep resources and the close uncommitted until then.

No step is instructed to start now when the buyer has supplied a later or unresolved availability date. This is a constraint review, not an approved schedule.`;
  if (!constraints.length) return null;
  const impossible = constraints.some(c => (c.end || c.date) > target);
  return `# Mutual Action Plan: ${deal}

## Schedule held for the buyer's constraints
Requested close: ${target}. ${impossible ? 'This close date is not feasible under the stated earliest start and minimum duration. Move the close or agree a real change to the constraint with its owner.' : 'The dated constraints are recorded below. The close remains unconfirmed until the buyer agrees the remaining durations and dependencies.'}

| Buyer step | Earliest start supplied | Duration supplied | Earliest completion, not a committed due date |
|---|---|---|---|
${constraints.map(c => `| ${c.step} | ${c.date} | ${c.days === null ? 'Not supplied' : `${c.days} ${c.business ? 'business' : 'calendar'} days`} | ${c.end || 'Not established without a duration'} |`).join('\n')}

Business days mean Monday to Friday and exclude the start day. Holidays were not supplied and can move completion later. A supplied earliest start is a lower bound, not an appointment.

## Buyer process and evidence
${notes ? `Process supplied: ${quoted(notes)}.` : 'No process supplied.'}
${requirement ? `Requirements supplied: ${quoted(requirement)}.` : 'No requirements supplied.'}
${blockers ? `Blockers supplied: ${quoted(blockers)}.` : 'No additional blockers supplied.'}

## Next actions
1. The account executive confirms the dates, durations and named owner of each constrained step with the buyer before circulating a committed plan.
2. The buyer's review owner starts no earlier than the supplied availability date and confirms the finish date after checking holidays and capacity.
3. The account executive and buyer sequence legal, procurement and signature after their stated prerequisites. No downstream completion date is invented while a duration or approval is missing.
4. The economic buyer agrees a revised close if the minimum completion is later than the requested close. Record that decision before making a promise.

No step is instructed to start now when the buyer has stated a later earliest start. This is a constraint review, not an approved schedule.`;
}

export function buildMutualActionPlan(args: Record<string, unknown>, d: Deps): string {
  const str = (k: string): string => (typeof args[k] === 'string' ? (args[k] as string).trim() : '');
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
  if (isNaN(closeInput.getTime())) return `target close date "${targetCloseDate}" is not a date this tool can read. Use the format YYYY-MM-DD, for example 2026-12-15.`;
  const ctx = reframeSector(d.readContext(undefined, { seller: [solutionIn || 'the solution'], context: [reqIn, evalIn, blockersIn, dealName], role: [champion, economic] }), solutionIn);
  const constraintReview = constrainedPlan(dealName, targetCloseDate, stepsIn, reqIn, blockersIn);
  if (constraintReview) return constraintReview.replace('\n\n', `\n\n${ctx.line}\n\n`);
  const today = new Date();
  // whole calendar days between the two dates (the time of day is ignored: 2026-10-09 to 2026-12-15 is 67 days at any hour)
  const daysUntilClose = Math.round((Date.UTC(closeInput.getUTCFullYear(), closeInput.getUTCMonth(), closeInput.getUTCDate()) - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / (24 * 60 * 60 * 1000));

  const industryWords = cleanIndustry(industryFromTitle(dealName));
  const v = ctx.v;
  const investment = ctx.model === 'investment';
  const brief = briefOf(solutionIn, [dealName, blockersIn, reqIn, evalIn, champion, economic]);
  const mr = readModel(ctx.model, ctx.line, solutionIn, [], [sellerOffers(reqIn, blockersIn)]);   // the seller's own words, and of the requirements and blockers only a question from its price page; the buyer's comparisons are not the seller's pricing
  const usage = mr.unit; const model = mr.model; const ctxLine = mr.line;
  const P = brief.short || 'the solution';
  const mw0 = modelWords(model, solutionIn, usage || undefined);
  const mw = v?.subtype === 'core-banking' ? { ...mw0, setup: 'the test environment, the integrations and the first product on the platform' } : mw0;
  const statedModel = mr.stated;
  // an owner led deal: the champion is the owner, no procurement contact or buying process was given. The owner decides and signs; the enterprise steps are left out.
  const OWNER_WORDS = /\b(?:owners?|founders?|proprietors?|shop ?keepers?|self[- ]employed|managing partner)\b/i;
  const ownerLed = (OWNER_WORDS.test(champion) || OWNER_WORDS.test(economic)) && !procurement && !stepsIn;
  const USERISH = /\b(?:staff|cashiers?|representatives|reps?|crew|waiters?|waitresses|clerks?|counter|front desk|field (?:teams?|staff)|drivers?|operators?)\b/i;
  const buyerCtx = buyerContextFor(industryFromTitle(dealName));

  // ---- the people ----
  const evaluators = parseContacts(evalIn, investment).map((c) => ({ ...c, raw: c.raw.replace(/^(?:and|or)\s+/i, ''), title: c.title.replace(/^(?:and|or)\s+/i, '') }));
  const pick = (fams: string[]): Contact | undefined => evaluators.find((e) => fams.includes(e.family) && !USERISH.test(e.title));
  const champName = champion || 'Buyer champion';
  const own = ownerLed ? champName : '';
  const itName = (pick(['it', 'engineering', 'data']) || pick(['security']))?.title || own || 'Buyer IT reviewer';
  const secName = (pick(['security']) || pick(['it']) || pick(['risk']) || pick(['engineering']))?.title || own || 'Buyer security reviewer';
  const riskName = (pick(['risk']) || pick(['security']))?.title || own || 'Buyer risk and compliance reviewer';
  const finName = pick(['finance'])?.title || own || 'Buyer finance contact';
  const ebName = economic || own || 'Economic buyer';
  const champRef = champion ? (/^the\s/i.test(champion) ? champion : `the ${champion}`) : 'the buyer\'s champion';
  const ebRef = economic || (ownerLed ? champRef : 'the economic buyer');
  const procName = procurement || own || 'Buyer procurement and legal';
  const whoName = (w: Who): string => ({
    champion: champName, eb: ebName, seller: 'Seller (account executive)', se: 'Seller (solutions engineer)', both: 'Both teams', it: `${itName} with Seller (solutions engineer)`,
    security: secName, risk: riskName, proc: procName, finance: finName, eval: evaluators.length ? joinList(evaluators.slice(0, 3).map((e) => e.title)) : 'Buyer technical evaluators',
  } as Record<Who, string>)[w];

  // ---- the calendar, in working days (unchanged) ----
  const start = onOrAfterWorkday(today);
  const close = onOrBeforeWorkday(closeInput);
  const closeNote = isoDate(close) !== isoDate(closeInput) ? ` (${isoDate(closeInput)} is a ${weekdayName(closeInput)}; the plan closes on ${weekdayName(close)} ${isoDate(close)})` : '';
  const N = Math.max(workdaysBetween(start, close), 0);
  const from = Math.max(ownerLed && ['negotiation', 'procurement'].includes(currentStage) ? STAGE_ORDER.indexOf('proposal') : STAGE_ORDER.indexOf(currentStage), 0);
  const phaseStages = STAGE_ORDER.slice(from).filter((x) => !(ownerLed && (x === 'negotiation' || x === 'procurement')));
  const modelKey = investment ? 'investment' : v ? v.id : '';
  const evalWeight = ['ites', 'telecom', 'investment'].includes(modelKey) ? 5 : 4;
  const weights = phaseStages.map((s) => (s === 'evaluation' ? evalWeight : 2));
  const closeWeight = 1;
  const totalW = weights.reduce((a, b) => a + b, 0) + closeWeight;
  const lens: number[] = [];
  let used = 0;
  [...weights, closeWeight].forEach((w, i, all) => {
    const len = i === all.length - 1 ? Math.max(N - used, 0) : Math.max(Math.round((N * w) / totalW), N >= 2 * all.length ? 2 : 1);
    lens.push(len);
    used += len;
  });
  let over = lens.reduce((a, b) => a + b, 0) - N;
  while (over > 0) { const k = lens.indexOf(Math.max(...lens)); if (lens[k] <= 1) break; lens[k]--; over--; }
  const bounds: { name: string; stage: string; a: Date; b: Date; len: number }[] = [];
  let cursor = start;
  [...phaseStages, 'close'].forEach((s, i) => {
    const a = cursor;
    const b = i === phaseStages.length ? close : addWorkdays(a, lens[i]);
    bounds.push({ name: s === 'close' ? (ownerLed ? 'Order & Setup' : 'Close & Launch') : (ownerLed && s === 'proposal' ? 'Offer & Agreement' : STAGE_NAME[s]), stage: s, a, b: b.getTime() > close.getTime() ? close : b, len: lens[i] });
    cursor = b.getTime() > close.getTime() ? close : b;
  });
  const dateIn = (ph: { a: Date; b: Date; len: number }, i: number, k: number): string => {
    const step = Math.max(Math.ceil(((i + 1) * Math.max(ph.len, 1)) / Math.max(k, 1)), 1);
    const dt = addWorkdays(ph.a, step);
    return isoDate(dt.getTime() > ph.b.getTime() ? ph.b : dt);
  };

  // ---- the requirements: criteria and claims ----
  const criteria: string[] = [];
  const claims: { text: string; label: string }[] = [];
  let theme = '';
  for (const item of d.splitItems(reqIn)) {
    const lm = item.match(LABEL);
    const label = lm ? lm[1].trim() : '';
    const body = lm ? item.slice(0, lm.index).trim() : item;
    const parts = clauses(body, (t) => d.splitItems(t.replace(/,\s+(?:and\s+)?/g, ';')));
    if (label) parts.forEach((p) => claims.push({ text: stripEnd(p), label }));
    else if (body.includes(': ') && parts.length > 1) { theme = theme || parts[0]; criteria.push(...parts.slice(1).map(stripEnd)); } else criteria.push(...parts.map(stripEnd));
  }
  const evaluatorFor = (text: string): string => {
    const t = text.toLowerCase();
    // the kind of person who judges it: audit and compliance criteria go to a risk reviewer, access and security to security, integration to IT or engineering
    const fams: string[][] = /compliance|audit|regulat|evidence/.test(t) ? [['risk'], ['security']] : /privilege|access|security|governed|governance|protect/.test(t) ? [['security'], ['risk'], ['it', 'engineering']] : /integrat|connect|api|import|sync|single sign|sso/.test(t) ? [['it', 'engineering', 'data']] : [];
    for (const f of fams) { const e = evaluators.find((x) => f.includes(x.family)); if (e) return e.title; }
    let best = ''; let n = 0;
    for (const e of evaluators) { if (ownerLed && USERISH.test(e.title)) continue; const s = (e.title.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => t.includes(w.slice(0, 5))).length; if (s > n) { n = s; best = e.title; } }
    return best || champName;
  };
  const testFor = (c: string): string => {
    const t = c.toLowerCase();
    if (/least privilege|entitlement|access review|excess access/.test(t)) return 'Take a sample of real accounts and list the access each holds but does not use, then show the review that removes it and the record it leaves';
    if (/\bagents?\b/.test(t) && /govern|discover|onboard|protect|identity/.test(t)) return 'Walk one AI agent through being discovered, onboarded, protected and governed, and keep the audit record of each step';
    if (/compliance|audit|certif/.test(t) && /faster|time|quick|speed|days|hours|weeks/.test(t)) return 'Time the preparation of one real audit or compliance report, with the current way and with the product, on the same scope';
    if (/\b(?:countries|regions?|sites?|languages?|locations?|scale|volume|users|applications|devices|branches)\b/.test(t)) return 'Test every item on real traffic or data, not a sample of one, and record which pass';
    if (/\b(?:integrat\w*|connect\w*|sso|single sign|api|import|sync)\b/.test(t)) return 'Connect it to the named systems with a real record and have the system owner check the result';
    if (/\b(?:security|compliance|audit|regulat\w*|governance|privacy|evidence|access)\b/.test(t)) return 'Check it against the buyer\'s own policy or control list with the reviewer present, and keep the evidence';
    if (/\b(?:cost|cheap\w*|afford\w*|fees?|price|saving|savings|save|margin|budget|spend)\b/.test(t)) return 'Price the same activity both ways on the buyer\'s own volumes, line by line';
    if (/\b(?:seconds?|minutes?|hours?|days?|weeks?|real[- ]time|faster|quick\w*|speed|within|in under)\b/.test(t)) return 'Time it on a real case against the current way, before and after';
    if (/\b(?:accura\w*|quality|errors?|reliab\w*|false|uptime|availability)\b/.test(t)) return 'Measure it on the buyer\'s own data against a pass mark agreed first';
    if (/\b(?:productivity|adopt\w*|usage|ease|easy|developers?)\b/.test(t)) return 'Let the people who will use it work with it on real tasks and ask them to rate it';
    return 'Agree the measure and the pass mark with the champion, then test it on the buyer\'s own case';
  };

  // ---- the buyer's own process steps, placed by what they are ----
  // A plain comma list of short steps ("Pilot, security review, procurement") is a list too, whatever the case of each step
  // (host review 28 Oct 2026: the shared reader keeps a comma list as one item unless every item starts with a capital).
  const commaSteps = !/[;\n]/.test(stepsIn) && /,/.test(stepsIn) && stepsIn.split(',').every((x) => { const w = x.trim().replace(/^and\s+/i, '').split(/\s+/); return w[0] !== '' && w.length <= 4; });
  const processSteps = d.splitItems(commaSteps ? stepsIn.replace(/,\s*(?:and\s+)?/g, ';') : stepsIn).map(stripEnd);
  const placeStep = (s: string): { stage: string; who: Who } => {
    const t = s.toLowerCase();
    if (/\b(?:signature|signing|sign(?:ed)? contract|contract sign(?:ed|ing)|execute (?:the )?contract)\b/.test(t)) return { stage: 'close', who: 'eb' };
    if (/security|questionnaire|vendor (?:risk )?assessment|risk assessment|due diligence|penetration|infosec/.test(t)) return { stage: 'evaluation', who: 'security' };
    if (/legal|contract|redline|data processing|dpa|terms|nda|msa/.test(t)) return { stage: 'negotiation', who: 'proc' };
    if (/procure|purchase order|\bpo\b|vendor (?:registration|onboarding|master)|payment|invoice|supplier/.test(t)) return { stage: 'procurement', who: 'proc' };
    if (/budget|business case|finance|cost/.test(t)) return { stage: 'proposal', who: 'finance' };
    if (/approv|board|committee|sign|steering/.test(t)) return { stage: 'negotiation', who: 'eb' };
    return { stage: 'evaluation', who: 'eval' };
  };
  const firstStageAtOrAfter = (stage: string): string => { if (stage === 'close') return 'close'; const i = STAGE_ORDER.indexOf(stage); const j = Math.max(i, from); return STAGE_ORDER[j] || STAGE_ORDER[from]; };
  const processBy: Record<string, Step[]> = {};
  for (const s of processSteps) { const p = placeStep(s); const stage = firstStageAtOrAfter(p.stage); (processBy[stage] ||= []).push({ m: `Buyer's process step, in your words: ${s}`, who: p.who }); }
  const securityCovered = (processBy.evaluation || []).some((s) => s.who === 'security');

  // ---- blockers ----
  const blockerItems = d.splitItems(blockersIn).filter((b) => blockerReading(b).state !== 'negated');
  const qa: QACtx = { P, parts: partsOf(brief), model, sellerText: solutionIn, stated: mr.stated, unit: usage || undefined, v, needs: criteria.slice(0, 3).map(lowerStart), alternatives: [] };
  const blockerAnswers = dedupeAnswers(blockerItems.map((b) => ({ text: b, a: answerQuestion(b, qa) })));
  // a question about one kind of buyer (banks) in a deal with another (an insurer) is said so, since the reason may not carry over
  const KINDS: [RegExp, RegExp, string][] = [[/\bbanks?\b/i, /bank|lend/i, 'banks'], [/\binsurers?\b|\binsurance (?:companies|firms)\b/i, /insur/i, 'insurers'], [/\bretailers?\b/i, /retail|commerce/i, 'retailers'], [/\bmanufacturers?\b/i, /manufactur|automotive/i, 'manufacturers'], [/\bhospitals?\b/i, /health|hospital/i, 'hospitals']];
  for (const it of blockerAnswers) {
    const asked = KINDS.find(([q]) => q.test(it.text));
    const dealKind = KINDS.find(([, ind]) => ind.test(dealName));
    if (asked && dealKind && asked !== dealKind && !asked[1].test(dealName)) it.a.answer += ` The question is about ${asked[2]} and this deal is with ${dealKind[2]}: ask whether the same reasoning holds for them before you answer.`;
  }
  const ownerFor = (id: string): string => ({ it: `${itName} with Seller (solutions engineer)`, security: `${secName} with Seller`, price: `${ebName} with Seller`, champion: `${champName} with Seller`, se: `${champName} with Seller (solutions engineer)`, terms: `${procName} with ${ebName}`, seller: `Seller with ${champName}` } as Record<string, string>)[ownerKind(id)] || `Seller with ${champName}`;

  // ---- the steps of each phase ----
  const stock = d.stockEval(v, investment) as Step[] | undefined;
  const unit = usage;
  const isMessage = unit === 'message';
  const modelEval: Record<string, Step[]> = {
    transactions: [
      { m: isMessage ? `Agree the test traffic: the message types, the destinations and the baseline to beat (the current provider's delivery rate, delivery report timing and price per message), and how long the test runs` : `Agree the test volume: ${unit ? `which ${unit}s` : 'which kinds of use'} and where they run, and the baseline to beat (the current provider's results and price${unit ? ` per ${unit}` : ''}), and how long the test runs`, who: 'both' },
      { m: isMessage ? `Complete the account and sender approvals the traffic needs and connect to ${P} in a sandbox` : `Complete the account set-up the test needs and connect the test volume to ${P}`, who: 'it' },
      { m: isMessage ? `Run test messages by destination, for the test length agreed in step 1, and compare delivery, report timing and price per message with the current provider on the same traffic` : `Run the test on live volume, for the test length agreed in step 1, and compare results and price${unit ? ` per ${unit}` : ''} with the current provider on the same volume`, who: 'champion' },
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
    sim: [
      { m: `Agree the test: which devices and countries, and the baseline to beat (the current provider's coverage, time to resolve a network issue, data used and price), and how long the test runs`, who: 'both' },
      { m: `Order the test SIMs and activate them in the buyer's devices, with the profile and the platform or API access set up`, who: 'it' },
      { m: `Run the test SIMs in the buyer's real locations, for the test length agreed in step 1, and compare coverage, time to resolve an issue and data used with the current provider`, who: 'champion' },
      { m: 'Review the results against the baseline and agree the order in which devices and countries move', who: 'both' },
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
  // a core banking platform is proved on one product or one new brand, with a migration rehearsal and the regulator told early, not with a trial of first users
  const coreBankingEval: Step[] = [
    { m: `Agree the proof of concept: one product or one new brand to run on ${P}, the baseline to beat (the time and the steps it takes to launch the same product on the current core) and the pass mark`, who: 'both' },
    { m: 'List the systems the proof of concept must connect (payments, cards, channels, data warehouse) and name an owner and an interface for each', who: 'it' },
    { m: `Configure the product on ${P} with the buyer's product team in a test environment and record the steps and the people involved`, who: 'champion' },
    { m: 'Run a migration rehearsal on a sample of accounts: mapping, balance reconciliation, cutover steps and the rollback plan', who: 'it' },
    { m: "Brief the buyer's regulatory reporting team and the regulator's contact on the proof of concept (reporting, data location and outsourcing) and agree what evidence they need", who: 'both' },
    { m: 'Review the proof of concept against the baseline and agree which products or brands move next, and in what order', who: 'both' },
  ];
  const baseEval: Step[] = ownerLed ? [] : [...(stock || (v?.subtype === 'core-banking' ? coreBankingEval : undefined) || modelEval[model || 'saas'] || modelEval.saas)];
  const userGroups = evaluators.filter((e) => USERISH.test(e.title) || (e.level === 'group' && ownerLed));
  const ownerEval: Step[] = [
    { m: `Choose one outlet or one team and a few real trading days for the trial, and agree what ${ownerLed ? champRef : 'the buyer'} wants to see at the end${criteria.length ? ` (${criteria.slice(0, 2).map(lowerStart).join('; ')})` : ''}`, who: 'both' },
    { m: `Set up the trial with a small set of real items and prices`, who: 'se' },
    ...userGroups.slice(0, 3).map((e): Step => ({ m: `Let ${e.title} try ${P} on a real working day and note what slows them or goes wrong`, who: 'eval', owner: e.title })),
  ];
  const ownerDecide: Step = { m: `Go through the trial with ${champRef} against what was agreed, and decide`, who: 'both' };
  const critSteps: Step[] = criteria.slice(0, 3).map((c) => ({ m: `Test the buyer's criterion ${quoted(c)}: ${lowerStart(testFor(c))}`, who: 'eval' as Who, owner: evaluatorFor(c) }));
  const claimStep: Step[] = claims.length && !criteria.length ? [{ m: `Agree which of the seller's claims the buyer wants tested on its own data (${joinList(claims.slice(0, 2).map((c) => quoted(c.text)))}${claims.length > 2 ? ' and the others' : ''}), and the pass mark for each`, who: 'both' }] : [];
  const evalSteps: Step[] = [...(ownerLed ? ownerEval : baseEval), ...claimStep, ...critSteps, ...(processBy.evaluation || [])];
  if (!ownerLed && !securityCovered && !evalSteps.some((s) => /security|compliance|risk/i.test(s.m))) evalSteps.push({ m: 'Security and compliance review of the vendor and its data handling', who: 'security' });
  if (buyerCtx?.id === 'financial') evalSteps.push({ m: 'Complete the third party risk assessment and the information security questionnaire the buyer requires of a new vendor', who: 'risk' });
  if (ownerLed) evalSteps.push(ownerDecide);
  else evalSteps.push(brief.short ? { m: `Reference calls with similar ${P} customers (only if one has agreed)`, who: 'champion' } : { m: 'Reference calls with similar customers (only if one has agreed)', who: 'champion' });
  const dedup = (steps: Step[]) => steps.filter((s, i) => steps.findIndex((t) => t.m === s.m) === i);
  const discoveryWho = [champion, economic, ...evaluators.map((e) => e.title)].filter(Boolean);
  const hasStage = (st: string): boolean => bounds.some((b) => b.stage === st);
  const stepsFor: Record<string, Step[]> = {
    discovery: [
      { m: discoveryWho.length ? `Hold discovery sessions with ${joinList(discoveryWho.slice(0, 5))}` : 'Hold discovery sessions with each person who will judge the deal', who: 'both' },
      { m: criteria.length ? `Write down the pass mark for each of the ${criteria.length} criteria below` : 'Write down the business requirements and the pass mark for each', who: 'champion' },
      { m: `Identify every approver and what each will check${buyerCtx ? ` (${buyerCtx.name}: ${lowerStart(buyerCtx.reviews).replace(/[.]+$/, '')})` : ''}`, who: 'seller' },
      { m: 'Agree the evaluation plan and the dates in this table', who: 'both' },
      ...(processBy.discovery || []),
    ],
    evaluation: dedup(evalSteps),
    proposal: ownerLed ? [
      { m: `Go through the offer and the price with ${ebRef}, in the owner's own numbers`, who: 'seller' },
      { m: `Agree how it is bought and paid for: ${mw.terms}`, who: 'seller' },
      { m: blockerItems.length ? `Send written answers to the ${blockerItems.length === 1 ? 'question' : `${blockerItems.length} questions`} in Risks & Blockers` : 'Confirm in writing that no question is left open', who: 'both' },
      { m: 'Agree the set-up, the import of existing data and the training, and who does each', who: 'both' },
      ...(processBy.proposal || []),
    ] : [
      { m: `Present the business case, built from the buyer's own figures, to ${ebRef}`, who: 'seller' },
      { m: 'Check the cost and value figures with the finance contact', who: 'finance' },
      ...(buyerCtx?.id === 'public-sector' ? [{ m: 'Confirm the route the purchase must follow (a tender, a framework or an approved supplier list) and any security authorisation needed before use', who: 'proc' as Who }] : []),
      { m: `Agree the commercial shape of the deal: ${mw.terms}`, who: 'seller' },
      { m: blockerItems.length ? `Send written answers to the ${blockerItems.length === 1 ? 'blocker' : `${blockerItems.length} blockers`} in Risks & Blockers` : 'Confirm in writing that no question is left open', who: 'both' },
      ...(processBy.proposal || []),
    ],
    negotiation: [
      { m: hasStage('proposal') ? "Turn the commercial shape agreed in the business case phase into contract terms and send the draft to the buyer's legal and procurement teams" : `Agree the commercial terms (${mw.terms})`, who: 'both' },
      { m: 'Complete the legal review and resolve the redlines', who: 'proc' },
      { m: `Confirm the implementation timeline and the owners on both sides: ${mw.setup}`, who: 'both' },
      { m: hasStage('procurement') ? "Obtain the economic buyer's approval of the contract terms" : 'Obtain the final approvals', who: 'eb' },
      ...(processBy.negotiation || []),
    ],
    procurement: [
      { m: 'Complete vendor registration and submit the documents the buyer\'s process asks for', who: 'proc' },
      { m: 'Finalize the payment terms', who: 'proc' },
      { m: hasStage('negotiation') ? 'Complete the purchasing approvals: the purchase order and the budget code' : 'Complete the final approvals', who: 'eb' },
      ...(processBy.procurement || []),
    ],
    close: ownerLed ? [
      { m: 'Order placed and first payment made', who: 'eb' },
      ...(processBy.close || []),
      { m: `Set-up starts: ${mw.setup}`, who: 'both' },
      { m: 'Training for the people who will use it, and a check after the first week', who: 'se' },
    ] : [
      ...(processBy.close || [{ m: 'Contract signed', who: 'eb' as Who }]),
      { m: hasStage('negotiation') ? 'Kickoff scheduled, with the owners and the dates confirmed in the commercial phase' : `Kickoff scheduled: ${mw.setup}`, who: 'both' },
      { m: criteria.length ? 'Success criteria written down from the criteria above, with the pass mark for each' : 'Success criteria written down', who: 'seller' },
    ],
  };
  // ---- each blocker adds the step, the owner and the risk its type implies (src/concern-types.ts, a fixed ordered list) ----
  // Fix 6 Nov 2026: before this, a blocker only got an answer row, and the milestones, owners and risks were the same whatever it said.
  // A blocker that matches no type gets "Add a step to resolve" in the current phase, with an owner question, never a guess.
  const firstStage = bounds[0]?.stage || 'close';
  interface BlockerRule { stage: string; owner: string; m: (q: string) => string; risk: (q: string) => string }
  const BLOCKER_RULES: Record<ConcernId, BlockerRule> = {
    'data-residency': { stage: 'evaluation', owner: 'Buyer legal or data protection reviewer', m: (q) => `Data residency review for ${q}: the seller shows, from its own documentation, where this data is stored, processed and accessed and by which subprocessors, and the buyer's legal reviewer confirms in writing that it meets the rule before any live data is used`, risk: (q) => `Data residency (${q}): until the buyer's legal reviewer accepts where the data is stored and processed, the evaluation cannot use live data, so every later date waits on that answer.` },
    privacy: { stage: 'evaluation', owner: 'Buyer data protection or privacy reviewer', m: (q) => `Privacy review for ${q}: agree which personal data would be processed, why and for how long, and how it is redacted or removed, and record the reviewer's decision`, risk: (q) => `Privacy (${q}): if the reviewer does not approve the use of personal data, the test runs on redacted or synthetic data, which changes what the evaluation proves.` },
    security: { stage: 'evaluation', owner: secName, m: (q) => `Security review for ${q}: answer the buyer's questions with the evidence the seller already holds, list any gap in writing and agree what closes it`, risk: (q) => `Security (${q}): an open security finding stops live use; start the review in the first week, beside the evaluation.` },
    compliance: { stage: 'evaluation', owner: riskName, m: (q) => `Compliance check for ${q}: go through the rule or control list it names with the compliance reviewer present, and keep the evidence for each point`, risk: (q) => `Compliance (${q}): a control the seller cannot show evidence for stops the approval; find it early.` },
    legal: { stage: 'negotiation', owner: procName, m: (q) => `Legal review for ${q}: send the buyer's legal team the clause or document it concerns and agree the position in writing`, risk: (q) => `Legal (${q}): the review runs on the buyer's lawyers' calendar; send the paper early so the redlines do not land in the last week.` },
    budget: { stage: 'proposal', owner: ebName, m: (q) => `Budget for ${q}: confirm with ${ebRef} which budget pays, who approves it and when it is released`, risk: (q) => `Budget (${q}): without an approved budget there is no order, whatever the evaluation shows; confirm the budget source before the business case phase ends.` },
    'bill-forecast': { stage: 'proposal', owner: finName, m: (q) => `Bill forecast for ${q}: build it with the finance contact from the buyer's own volumes and the price terms as written, as a low, an expected and a high month, and agree what limits the bill only if the seller offers a limit`, risk: (q) => `The bill forecast (${q}): until finance accepts a forecast built on the buyer's own volumes, the budget approval can stall; agree the volume assumptions before the business case is presented.` },
    price: { stage: 'proposal', owner: finName, m: (q) => `Price check for ${q}: compare the price with the buyer's current cost for the same scope, line by line, with the finance contact`, risk: (q) => `Price (${q}): a comparison on a different scope makes the price look higher or lower than it is; agree the scope of the comparison first.` },
    procurement: { stage: 'procurement', owner: procName, m: (q) => `Purchasing route for ${q}: confirm the vendor approval steps, the documents and the lead time with procurement`, risk: (q) => `Procurement (${q}): purchasing steps have their own lead times; ask for them now so the close date allows for them.` },
    'service-level': { stage: 'negotiation', owner: 'Both teams', m: (q) => `Service level for ${q}: agree the measure, how it is reported and what happens if it is missed, and write it into the terms`, risk: (q) => `Service level (${q}): a service level not agreed in writing becomes a dispute after signature; settle it before the contract.` },
    quality: { stage: 'evaluation', owner: 'Both teams', m: (q) => `Quality test for ${q}: agree the sample or evaluation set, the pass mark and when a person reviews the output, before any live use`, risk: (q) => `Quality (${q}): if the pass mark is not agreed before the test, a weak result restarts the evaluation.` },
    integration: { stage: 'evaluation', owner: itName, m: (q) => `Technical check for ${q}: show it working with the named system on a real record, with the system owner present, and agree the work each side does`, risk: (q) => `Technical fit (${q}): integration work needs the buyer's IT time; book it at the start of the evaluation.` },
    capacity: { stage: firstStage, owner: champName, m: (q) => `Time and people for ${q}: agree with the champion who on the buyer's side works on the evaluation and when, and fit the dates around it`, risk: (q) => `Capacity (${q}): if the buyer's people have no time, every step slips; confirm their time before the dates are shared.` },
    switching: { stage: 'evaluation', owner: champName, m: (q) => `Exit from the current way for ${q}: confirm the end date and the notice terms of what is in place now, and plan a parallel run`, risk: (q) => `Switching (${q}): the notice period on what is in place now can set the earliest start; find it out now.` },
    adoption: { stage: 'evaluation', owner: champName, m: (q) => `Adoption plan for ${q}: name the first users, the training they get and how their use is checked each week`, risk: (q) => `Adoption (${q}): low use in the trial weakens the business case; check use every week.` },
    approval: { stage: 'proposal', owner: ebName, m: (q) => `Decision on ${q}: name the person who can clear it and book that meeting before the business case phase ends`, risk: (q) => `Approval (${q}): a decision maker who has not seen the plan can stop it late; bring them in at the next phase gate.` },
    timing: { stage: firstStage, owner: champName, m: (q) => `Timing for ${q}: confirm with the champion what fixes the date and what happens if it slips`, risk: (q) => `Timing (${q}): a date the buyer does not own will slip; tie the close to the buyer's own event.` },
  };
  const ORDER = [...STAGE_ORDER, 'close'];
  const phaseFor = (stage: string): string => (bounds.find((b) => ORDER.indexOf(b.stage) >= ORDER.indexOf(stage)) || bounds[bounds.length - 1]).stage;
  // blockers of the same type share one milestone and one risk line, in the order the first of them was typed; blockers that
  // match no type share one "Add a step to resolve" milestone that names each of them
  const groups: { type: ReturnType<typeof concernOf>; items: string[] }[] = [];
  for (const b of [...new Set(blockerItems.map((x) => stripEnd(x)).filter(Boolean))]) {
    const type = concernOf(b);
    const g = groups.find((x) => (x.type ? x.type.id : '') === (type ? type.id : ''));
    if (g) g.items.push(b); else groups.push({ type, items: [b] });
  }
  const blockerPlan = groups.map(({ type, items }) => {
    const q = joinList(items.map((b) => quoted(b).replace(/\|/g, '/')));
    const rule = type ? BLOCKER_RULES[type.id] : null;
    const stage = phaseFor(rule ? rule.stage : firstStage);
    const step: Step = rule
      ? { m: rule.m(q), who: 'both', owner: rule.owner }
      : { m: items.length === 1 ? `Add a step to resolve: ${items[0].replace(/\|/g, '/')}` : `Add a step to resolve each of these: ${q}`, who: 'both', owner: `Owner to confirm: ask ${champRef} who on the buyer's side can clear ${items.length === 1 ? 'this' : 'each'}` };
    return { items, q, type, stage, step, risk: rule ? rule.risk(q) : `Unowned ${items.length === 1 ? 'blocker' : 'blockers'} (${q}): no blocker type in the fixed list matches, so the plan adds only a step to resolve ${items.length === 1 ? 'it' : 'them'}; until someone on the buyer's side owns ${items.length === 1 ? 'it' : 'each'}, ${items.length === 1 ? 'it' : 'they'} can stop the plan at any phase.` };
  });
  // where a blocker step goes in its phase: in the business case phase and the close phase it comes first (the forecast or the
  // budget before the business case is presented, anything still open before the signature); in the evaluation it goes before the
  // closing step (reference calls, the owner's decision); in the other phases it comes last. Blockers keep the order they were typed in.
  const front: Record<string, number> = {};
  for (const x of blockerPlan) {
    const list = (stepsFor[x.stage] ||= []);
    if (x.stage === 'proposal' || x.stage === 'close') { front[x.stage] = (front[x.stage] || 0) + 1; list.splice(front[x.stage] - 1, 0, x.step); }
    else if (x.stage === 'evaluation' && list.length) list.splice(list.length - 1, 0, x.step);
    else list.push(x.step);
  }
  const OWNER_AIM: Record<string, string> = { evaluation: 'Show on the buyer\'s own items and prices, with the people who will use it, that the criteria are met.', proposal: 'Agree the offer, the price and how it is bought, and answer every open question in writing.', close: 'Order, pay and set up, then check after the first week.' };
  const aimOf = (stage: string): string => (ownerLed && OWNER_AIM[stage]) || STAGE_AIM[stage];
  const phaseBlock = (ph: (typeof bounds)[number], n: number): string => {
    const steps = stepsFor[ph.stage] || [];
    const rows = steps.map((s, i) => `| ${i + 1} | ${s.m} | ${s.owner ?? whoName(s.who)} | ${dateIn(ph, i, steps.length)} | Pending |`);
    const heading = `### Phase ${n}: ${ph.name}${n === 1 ? ', the current stage' : ''} (${isoDate(ph.a)} to ${isoDate(ph.b)})`;
    const extra = ph.stage === 'evaluation' && v ? `\n**How this sector buys:** ${v.salesMotion}\n` : '';
    const window = ph.stage === 'evaluation' && ph.len > 0 && ph.len < 8 ? `\nThe evaluation has only ${ph.len} working day${ph.len === 1 ? '' : 's'}, so the test as written (${lowerStart(mw.proof)}) will not fit. Shorten it to one case, or move the close date.\n` : '';
    return `${heading}\n\n${aimOf(ph.stage)}\n\n| # | Milestone | Owner | Due Date | Status |\n|---|-----------|-------|----------|--------|\n${rows.join('\n')}\n${window}${extra}`;
  };
  const tight = N < 10 ? `\n*Only ${N} working day${N === 1 ? '' : 's'} remain before the close date, so the phases are short and several steps must run in parallel. Check that the close date is realistic.*\n` : '';

  // ---- assemble ----
  const out: string[] = [];
  out.push(`# Mutual Action Plan: ${dealName}`);
  const stageText = currentStage.replace(/_/g, ' ');
  out.push(`## Overview\n\nThis plan takes the deal ${quoted(dealName)} from the ${stageText} stage to a signed contract on ${isoDate(closeInput)}${closeNote}: ${N} working days from ${isoDate(start)}, ${daysUntilClose} calendar days.${solutionIn ? (brief.short ? ` The seller is offering ${P}${brief.kind ? `, which ${describeWith(cleanBrief(brief))}` : ''}${model && statedModel ? `, bought as ${mw.priced}` : ''}.` : ` The seller is offering what it describes in its own words as ${sellerWords(brief)}${model && statedModel ? `, bought as ${mw.priced}` : ''}.`) : ''}${industryWords ? ` The buyer works in ${lowerStart(industryWords)}, read from the deal name.` : ''}${buyerCtx ? ` ${buyerCtx.reviews} ${buyerCtx.buying}` : ''}\n\n${ctxLine}${ownerLed ? `\n\nThe champion you named is the owner, so this plan treats the owner as the one who decides and signs: there is no procurement, legal or vendor registration phase, and the people who use the product try it on a real working day.` : ''}${tight}`);

  const people: string[] = [];
  if (champion) people.push(ownerLed && !economic ? `| **Owner, champion and decision maker** | ${champion} | Decides and signs, keeps the plan alive on the buyer's side and answers the open questions with us |` : `| **Champion** | ${champion} | Keeps the plan alive on the buyer's side, gathers the evaluators and answers the open questions with us |`);
  if (economic) people.push(`| **Economic buyer** | ${economic} | Approves the business case and the final decision |`);
  const ownsOf = (e: Contact): string => USERISH.test(e.title) ? 'Tries the product on a real working day and says what slows them or goes wrong' : /\bdecision makers?\b/i.test(e.title) ? 'Decides with the owner' : upperFirst(roleFor(e.title, investment).owns);
  // evaluators must not share one sentence: a title the role reader knows gets its own part, and any text still shared names the title
  const ownsBase = evaluators.map(ownsOf);
  const rctxM = { P, v, metric: '' };
  const ownsList = evaluators.map((e, i) => {
    const t0 = ownsBase[i];
    if (ownsBase.filter((x) => x === t0).length < 2 && t0 !== 'Their own part of the evaluation') return t0;
    const r = readRole(e, null, rctxM, investment);
    const own = /^Evaluator: tests the product/.test(r.part) ? 'Tests the product on a real flow and reports what breaks' : /^Influencer: carries the developer view/.test(r.part) ? 'Carries the developer view: tries it on a real task and says what developers would adopt' : /^Reviewer who certifies/.test(r.part) ? 'Certifies on a real review request and says how long it takes and what is unclear' : /^Daily user/.test(r.part) ? 'Tries the product on a real working day and says what slows them or goes wrong' : '';
    return own || (t0 === 'Their own part of the evaluation' ? `The part of the evaluation that touches their own work (${e.title})` : `${t0}, as it concerns ${e.title}`);
  });
  evaluators.forEach((e, i) => people.push(`| **Evaluator** | ${e.title} | ${ownsList[i]} |`));
  if (procurement) people.push(`| **Procurement** | ${procurement} | The buyer's purchasing steps, the contract and the payment terms |`);
  out.push(`## Key Stakeholders\n\n${people.length ? `| Role | Name | What they own in this plan |\n|------|------|-----------|\n${people.join('\n')}\n\n` : ''}On the seller side the account executive owns the deal and the plan, a solutions engineer owns the technical validation, and an executive sponsor is called in at the phase gates and for escalation.`);

  const crit: string[] = ['## Success Criteria'];
  if (criteria.length) {
    crit.push(`${theme ? `The buyer's aim, in your words, is to ${quoted(theme)}. ` : ''}Each of the ${criteria.length} things you listed is its own criterion, with the way it will be tested in the evaluation.\n\n| Criterion | How it will be tested | Judged by |\n|-----------|-----------------------|-----------|\n${criteria.map((c) => `| ${upperFirst(c)} | ${testFor(c)} | ${evaluatorFor(c)} |`).join('\n')}`);
  }
  if (claims.length) {
    const labels = [...new Set(claims.map((c) => c.label))];
    crit.push(`These come from the seller's side (${joinList(labels)}), so they are not criteria the buyer has agreed: ${claims.map((c) => quoted(c.text)).join('; ')}. Use them as reference points, and turn each into a test on the buyer's own data before it goes into the evaluation.`);
  }
  if (!criteria.length && !claims.length) crit.push(`Until the buyer names what they will judge the deal by, the evaluation has no pass mark${v ? `; in ${v.name} buyers usually look at ${some(v.metrics, 3)}` : ''}.`);
  if (v && !criteria.length) crit.push(`What this sector measures: ${v.metrics.join(', ')}.`);
  out.push(crit.join('\n\n'));

  out.push(`## Mutual Action Plan Timeline\n${processSteps.length ? `\nThe buyer's own process, as you gave it: ${joinList(processSteps.map(quoted))}. Each step is placed as a milestone below.\n` : ''}\n${bounds.map((ph, i) => phaseBlock(ph, i + 1)).join('\n---\n\n')}`);

  const risks: string[] = ['## Risks & Blockers'];
  if (blockerAnswers.length) {
    risks.push(`Each blocker below is answered on its own question. Where an answer needs a fact about ${P}, it says what to confirm first.\n\n| Blocker | Answer | Owner | Status |\n|---------|--------|-------|--------|\n${blockerAnswers.map((b) => { const cType = concernOf(stripEnd(b.text)); const rule = cType ? BLOCKER_RULES[cType.id] : null; const ans = b.a.id === 'general' && rule ? `${rule.m(quoted(stripEnd(b.text)).replace(/\|/g, '/'))}.` : b.a.answer; const own = b.a.id === 'general' && rule ? rule.owner : ownerFor(b.a.id); return `| ${stripEnd(b.text).replace(/\|/g, '/')}${/[?]$/.test(b.text.trim()) ? '?' : ''} | ${ans} Confirm first: ${stripEnd(b.a.bring)}. | ${own} | Open |`; }).join('\n')}`);
  } else if (v) {
    risks.push(`${v.name[0].toUpperCase()}${v.name.slice(1)} buyers usually raise these objections, so prepare an answer to each before the evaluation ends:\n\n${(v.subtype === 'core-banking' && /\b(?:neo-?banks?|challenger banks?|digital[- ]only banks?|greenfield|new banks?|fintechs?|start-?ups?)\b/i.test(`${dealName} ${reqIn} ${blockersIn}`) ? v.objections.filter((o) => !/replacing a core|legacy core/i.test(o.objection)) : v.objections).slice(0, 3).map((o) => `- ${o.objection}: ${o.response}`).join('\n')}`);
  }
  if (blockerPlan.length) {
    const phaseName = (stage: string): string => { const i = bounds.findIndex((b) => b.stage === stage); return i >= 0 ? `Phase ${i + 1}: ${bounds[i].name}` : 'the first phase'; };
    risks.push(`### What each blocker adds to the plan\n\nEach blocker is read against a fixed list of blocker types. The type decides the milestone added to the timeline, its owner and the risk under What can move the close date. Blockers of one type share a milestone. A blocker that fits no type gets a step to resolve it and a question about who owns it.\n\n| Read as | Blocker | Why this type | Milestone added in |\n|---------|---------|---------------|--------------------|\n${blockerPlan.map((x) => `| ${x.type ? upperFirst(x.type.label) : 'No type matched'} | ${x.items.map((b) => b.replace(/\|/g, '/')).join('; ')} | ${x.type ? upperFirst(x.type.reason) : 'No type in the fixed list matches it'} | ${phaseName(x.stage)} |`).join('\n')}`);
  }
  const riskList: string[] = [];
  const longest = (processBy.evaluation || [])[0] || (processBy.negotiation || [])[0];
  riskList.push(`The calendar: ${N} working days for ${bounds.length - 1} stage${bounds.length === 2 ? '' : 's'}${longest ? `, and the buyer's own step "${longest.m.replace("Buyer's process step, in your words: ", '')}" is not under your control: start it in the first week` : ', with the reviews running beside the evaluation, not after it'}.`);
  riskList.push(`Losing the champion: if the champion leaves or is moved, ${evaluators[0] ? evaluators[0].title : economic ? ebName : 'the next person on the buyer\'s side'} must already know the plan; keep them in the weekly loop.`);
  riskList.push(`The evaluation shows a gap: agree the pass mark for each criterion before the test starts${criteria.length ? ` (the ${criteria.length} above)` : ''}, so a gap is a finding and not a surprise.`);
  for (const x of blockerPlan) riskList.push(x.risk);
  risks.push(`### What can move the close date\n\n${riskList.map((x) => `- ${x}`).join('\n')}`);
  out.push(risks.join('\n\n'));

  const comm = [
    `| Weekly | ${champName} and the account executive | Progress against the table above and the open questions |`,
    `| Every two weeks | ${evaluators.length ? joinList(evaluators.slice(0, 3).map((e) => e.title)) : 'The buyer\'s technical evaluators'} and the solutions engineer | Progress of the tests |`,
    `| At each phase gate (${bounds.map((b) => isoDate(b.a)).slice(1).join(', ') || isoDate(close)}) | ${ebName} and the executive sponsor | Decisions and the next phase |`,
  ];
  out.push(`## Communication Plan\n\n| Cadence | Participants | Purpose |\n|---------|--------------|---------|\n${comm.join('\n')}\n\nEscalation runs from ${champRef} to ${ebRef} first; if that does not clear it, the seller's manager goes to the buyer's executive.`);

  out.push(`## Next Actions (This Week)

| Priority | Action | Owner | Due |
|----------|--------|-------|-----|
| High | ${champion ? `Confirm the dates and owners in this plan with ${champion}` : 'Find and confirm the champion'} | AE | ${isoDate(addWorkdays(start, 1))} |
| High | ${economic ? `Book a meeting with ${economic} for the first phase gate` : 'Find out who signs, and ask for that person by name'} | AE | ${isoDate(addWorkdays(start, 2))} |
| Medium | ${champion ? `Send this plan to ${champion} to edit` : 'Share this plan with your main buyer contact'} | AE | ${isoDate(start)} |
| Medium | ${processSteps.length ? `Start ${quoted(processSteps[0])} now` : 'Ask which buyer step takes longest and start it now'} | Both | ${isoDate(addWorkdays(start, 3))} |

This only works as a mutual plan once the buyer has corrected the dates and the owners; update it as things change.`);

  const miss: string[] = [];
  if (!champion) miss.push('`buyer champion` (it would change who keeps the plan alive on the buyer\'s side and owns the first meetings)');
  if (!economic && !ownerLed) miss.push('`economic buyer` (it would change who approves the business case and owns the final approvals)');
  if (!evalIn) miss.push('`technical evaluators` (it would change the owners of the technical and security steps, which now use roles)');
  if (!procurement && !ownerLed) miss.push('`procurement contact` (it would change the owner of the legal, vendor registration and payment steps)');
  if (!reqIn) miss.push('`known requirements` (it would change the criteria table, now empty, into one row for each with a test)');
  if (!stepsIn) miss.push('`known process steps` (it would change the milestones, which would then include the buyer\'s own approvals with dates)');
  if (!blockersIn) miss.push('`blockers` (it would change the Risks & Blockers table, which would then answer each one)');
  if (!solutionIn) miss.push('`your solution` (it would change the evaluation steps to fit what you sell and how it is priced)');
  if (!args.current_stage) miss.push('`current stage` (it would change the first phase; it is read as evaluation now)');
  if (!targetCloseDate) miss.push('`target close date` (it is required; the plan used a date 60 days out as an example)');
  out.push(miss.length ? `**To sharpen this plan, give:**\n\n${miss.map((x) => `- ${x}`).join('\n')}\n\n*Last updated ${isoDate(today)}.*` : `*Last updated ${isoDate(today)}.*`);
  return out.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
