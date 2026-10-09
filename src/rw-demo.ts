// Run 22 (rewrite of demo_script_builder). The old tool turned whatever the user listed as "must show" into steps, so a page statistic became a demo step,
// paired steps with pains by position, and answered objections with templates. This builder works like a sales engineer preparing the call:
//  1. the product's own named parts are read from the description (rw-kit readProduct), the pains are read as separate statements (readPains);
//  2. the flows the user said must be shown are steps; statistics and credentials are proof lines said beside the part they belong to, never steps;
//  3. each part is matched to the pains and to the people in the room by the words the user gave (fit), so a person who cares about a part sees it;
//  4. each objection is answered from the inputs and the business model (answerObjection), where it would come up;
//  5. what was not given is named once, at the end, with what it would change.
// No fact about the product is added: a line says what the user's description says, or says what to confirm.
import { parseContacts, familyOf, levelOf, joinList, clip, solutionBrief, type Contact } from './dealtext.ts';
import { roleFor } from './answers.ts';
import { buyerLens, type Vertical, type BusinessModel } from './verticals.ts';
import {
  readPains, painShort, painRef, painType, SHOW, groupsOf, DEMO_VERB, readProduct, toCapability, productName, productHead, readMustShow, fit, overlap, wordsOf, lensFor, capText, capSay, upFirst,
  answerObjection, dedupeAnswers, splitNotes, type Capability, type Item, type AnswerCtx, type Answer,
} from './rw-kit.ts';

export interface DemoDeps {
  readContext: (explicitModel: unknown, input: { seller: unknown[]; context?: unknown[]; role?: unknown[]; buyer?: unknown[] }) => { v: Vertical | null; model: BusinessModel | null; line: string };
  cap: (s: string) => string;
  lowerFirstIfCommon: (s: string) => string;
  sectorNotes: (v: Vertical | null, what: 'objections') => string;
  splitItems: (s: unknown) => string[];
  /** the evidence formats a buyer of this kind of seller expects, and the next step offered in this sector */
  stock: (v: Vertical | null, modelKey: string) => { show: string[]; next: string };
  footer: string;
}

const CLOSE_KINDS = new Set(['howmuch', 'discount', 'cheapest', 'totalcost', 'terms', 'packaging', 'timing', 'proof']);
const STEP_KINDS = new Set(['offline', 'accuracy', 'canuse', 'integration', 'adoption', 'security', 'compliance', 'securecompare']);
const say = (s: string): string => s.replace(/"/g, "'");
const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
const IMPERATIVE = DEMO_VERB;
const TYPE_OPEN: Record<string, string> = {
  first_look: '',
  technical_deep_dive: 'This is a technical session, so I will go to the level your engineers need and stop where they want to look closer.',
  executive_overview: 'This is an overview, so I will keep to the outcome and not the clicks.',
  competitive_displacement: 'You are comparing options, so I will keep to what I can show on your own case.',
  expansion_upsell: 'You already know part of this, so today is about what else it can do for you.',
  proof_of_concept: 'Today I will walk through what a proof would test, so we can agree it before it starts.',
};
const NO_PAIN = {
  screen: ['Take one real case through it from its start to the result the user sees.', 'Pick one live example from your side and run it through from the beginning.', 'Run a case you chose, not one I prepared, and stop at the first thing that looks wrong.'],
  say: ['I will take one real case through it from its start to the result the user sees.', 'I will pick one live example from your side and run it through from the beginning.', 'I will run a case you choose, not one I prepared.'],
  ask: ['What would you check first on a real case?', 'Which part of this would you test hardest?', 'What would you want to see it do that you have not seen yet?'],
};
const PERSON_VARIANTS = [
  (p: string) => `how does ${p} show up for you today, and who feels it first?`,
  (p: string) => `what does ${p} cost your team today, and what have you tried?`,
  (p: string) => `what would change for you if ${p} were solved?`,
];

interface Step {
  title: string;
  /** the user's must-show text when the step is one of their flows */
  flow: Item | null;
  cap: Capability | null;
  text: string;
  pains: number[];
  painScore: Record<number, number>;
  people: number[];
  claims: Item[];
  objections: string[];
  minutes: number;
  /** the step is only a problem walked through live, because no part or flow was named */
  fromPain?: boolean;
  /** the problem a step is built from, when no part answers it */
  painIdx?: number;
}
const newStep = (title: string, flow: Item | null, cap: Capability | null, text: string): Step => ({ title, flow, cap, text, pains: [], painScore: {}, people: [], claims: [], objections: [], minutes: 0 });

export function buildDemoScript(args: Record<string, unknown>, d: DemoDeps): string {
  const given = (k: string): string => (typeof args[k] === 'string' ? (args[k] as string).trim() : '');
  const hasValue = (v: unknown): boolean => v !== undefined && v !== null && v !== '';
  const demoType = given('demo_type') || 'first_look';
  const typeLabel = d.cap(demoType.replace(/_/g, ' '));
  const primaryAudience = given('primary_audience');
  const attendees = given('attendees');
  const customerIndustry = given('customer_industry');
  const yourSolution = given('your_solution');
  const keyPainPoints = given('key_pain_points');
  const competitorGiven = given('competitor_context').replace(/[.]+$/, '');
  const competitorSplit = splitNotes(competitorGiven);
  const competitorContext = competitorSplit.text;
  const demoDuration = (args.demo_duration as number) || 30;
  const durationGiven = hasValue(args.demo_duration) && demoDuration === args.demo_duration;
  const minutesWord = demoDuration === 1 ? 'minute' : 'minutes';
  const mustShowFeatures = given('must_show_features');
  const knownObjections = given('known_objections');
  const outcomeText = given('desired_outcome').replace(/[.]+$/, '');

  const ctx = d.readContext(undefined, { seller: [yourSolution], context: [keyPainPoints, mustShowFeatures, attendees], role: [primaryAudience], buyer: [customerIndustry] });
  const v = ctx.v;
  const investment = ctx.model === 'investment';
  const modelKey = investment ? 'investment' : v ? v.id : '';
  const brief = solutionBrief(yourSolution);
  const P = productName(brief, yourSolution) || 'the product';
  const nameTyped = productHead(brief, yourSolution) || P; // written once, as typed, in the first line
  let product = readProduct(yourSolution, brief.name || P);
  if (product.caps.length < 2 && brief.parts.length >= 2) {
    const fromParts = brief.parts.map((x) => toCapability(x)).filter((x): x is Capability => !!x);
    if (fromParts.length >= 2) product = { kind: product.kind, caps: fromParts };
  }
  const lens = buyerLens(customerIndustry);
  const low = d.lowerFirstIfCommon;

  // ---- the inputs, read ----
  const painSet = readPains(keyPainPoints);
  const sourceNotes: string[] = [...painSet.notes, ...competitorSplit.notes];
  const pains = painSet.pains;
  const painWord = (i: number): string => low(pains[i]);
  // a short pain is named by its own words; a long one by "the first problem you described" (its words were played back once in the opening)
  const pRef = (i: number): string => painRef(low(pains[i]), i);
  const ms = readMustShow(mustShowFeatures);
  const claimsAll: Item[] = [...ms.claims];
  for (const e of painSet.evidence) claimsAll.push({ text: e, label: 'from your pain points' });
  const people: { title: string; given: string; contact: Contact | null; primary: boolean }[] = [];
  // a bracket after a title says where it came from ("title of a customer quoted on the stories page"); the script uses the title, the table shows the words as given
  const bare = (t: string): string => t.replace(/\s*\([^()]*\)\s*$/, '').trim() || t;
  const addPerson = (title: string, contact: Contact | null, primary: boolean): void => {
    const t = bare(title);
    if (t !== title.trim()) sourceNotes.push(title.slice(t.length).replace(/^\s*\(|\)\s*$/g, '').trim());
    if (!people.some((x) => x.title.toLowerCase() === t.toLowerCase())) people.push({ title: t, given: title, contact, primary });
  };
  if (primaryAudience) addPerson(primaryAudience, null, true);
  for (const c of parseContacts(attendees, investment)) addPerson(c.title, c, false);
  // what a person's own work is, in the words a part of a product is described by: a service agent works in the support suite, a sales user in leads and the field,
  // a marketing user in campaigns and scoring, an administrator in set-up and workflow
  const FUNCTION_WORDS: [RegExp, string][] = [
    [/\bservice\b|\bsupport\b|help ?desk|\bcare\b|\bagents?\b|\bcases?\b|contact cent|customer success/i, 'support omnichannel ticket case helpdesk'],
    [/\bsales\b|\breps?\b|account executive|\bseller|\bbdr\b|\bsdr\b|field/i, 'lead opportunity pipeline field scoring prioriti'],
    [/\bmarketing\b|\bdemand\b|campaign|growth/i, 'campaign marketing automation scoring email journey audience nurture lead'],
    [/\badmin|administrator|\bops\b|operations|configur/i, 'custom configure workflow automation field admin permission integration'],
    [/revenue|\bpricing\b|yield|rate manager/i, 'revenue management pricing rate forecast'],
    [/f&b|food|beverage|restaurant|outlet|\bpos\b|\bbar\b|kitchen|cashier/i, 'point of sale pos'],
    [/housekeep/i, 'housekeeping'],
    [/front desk|reception/i, 'reservations front desk'],
    [/\bfinance\b|account(?:s|ing|ant)/i, 'payments invoicing reconciliation billing'],
  ];
  const functionWords = (t: string): string => FUNCTION_WORDS.filter(([re]) => re.test(t)).map(([, w]) => w).join(' ');
  const personText = (t: string): string => `${t} ${lensFor(familyOf(t, investment))} ${functionWords(t)}`;

  // ---- time ----
  const demoSecs = Number(demoDuration);
  const intro = Math.floor(demoSecs * 0.15), discovery = Math.floor(demoSecs * 0.15), discussion = Math.floor(demoSecs * 0.15), close = Math.round(demoSecs * 0.05);
  const demo = demoSecs - intro - discovery - discussion - close;
  let maxSteps = Math.max(1, Math.min(7, Math.floor(demo / 3)));
  if (demoType === 'executive_overview') maxSteps = Math.min(maxSteps, 3);

  // ---- the steps ----
  const skipP = wordsOf(P, false);
  const capPool: Capability[] = [...product.caps];
  const steps: Step[] = [];
  const textOf = (flow: Item | null, cap: Capability | null): string => `${flow ? flow.text : ''} ${cap ? `${cap.name} ${cap.desc}` : ''}`.trim();
  for (const f of ms.flows) {
    const hit = capPool.map((cp, i) => ({ cp, i, s: overlap(`${cp.name} ${cp.desc}`, f.text, skipP) })).filter((x) => { const nw = wordsOf(x.cp.name); return (nw.length > 0 && overlap(x.cp.name, f.text, skipP) >= nw.length) || (x.s >= 2 && overlap(x.cp.name, f.text, skipP) >= Math.min(2, nw.length)); }).sort((a, b) => b.s - a.s)[0];
    const cp = hit ? capPool.splice(hit.i, 1)[0] : null;
    steps.push(newStep(upFirst(f.text), f, cp, textOf(f, cp)));
  }
  // how well a step answers a text: the words and groups it shares, and a bonus when the part's own name is one of the words
  const stepFit = (s: Step, target: string, withPains = false): { w: number; g: number; ng: number; s: number } => {
    const f = fit(withPains ? `${s.text} ${s.pains.map((i) => pains[i]).join(' ')}` : s.text, target, skipP);
    const bonus = s.cap ? 2 * overlap(s.cap.name, target, skipP) : 0;
    // the part's own name belongs to a word group the target touches ("Search" for a pain about finding things)
    const gt = groupsOf(target);
    const ng = s.cap ? [...groupsOf(s.cap.name)].filter((x) => gt.has(x)).length : 0;
    return { w: f.w, g: f.g, ng, s: f.s + bonus + ng };
  };
  const assign = (): void => {
    for (const s of steps) { s.pains = []; s.painScore = {}; s.people = []; }
    // each pain goes to the one step that answers it best (it must share a word with it); each person to the step or two that suit the role
    pains.forEach((p, pi) => {
      let best = -1, bs = 0;
      steps.forEach((s, si) => { const f = stepFit(s, p); const key = (f.w >= 1 ? 100 : 0) + f.s; if ((f.w >= 1 || f.ng >= 1) && (key > bs || (key === bs && best >= 0 && steps[si].pains.length < steps[best].pains.length))) { bs = key; best = si; } });
      if (best >= 0) { steps[best].pains.push(pi); steps[best].painScore[pi] = bs; }
    });
    // a step that no problem went to (its part is named but another step answered the problem first) is still tied to the problem it touches most, as a second step for it
    for (const s of steps) {
      if (s.pains.length || s.fromPain || !s.cap) continue;
      let bp = -1, bsc = 0;
      pains.forEach((p, pi) => { const f = stepFit(s, p); if ((f.w >= 1 || f.ng >= 1) && f.s > bsc) { bsc = f.s; bp = pi; } });
      if (bp >= 0) { s.pains.push(bp); s.painScore[bp] = bsc; }
    }
    for (const s of steps) s.pains.sort((a, b) => (s.painScore[b] - s.painScore[a]) || a - b);
    people.forEach((pp, qi) => {
      const sc = steps.map((s, si) => ({ si, f: stepFit(s, personText(pp.title), true) })).filter((x) => x.f.w >= 1 || x.f.g >= 1).sort((a, b) => b.f.s - a.f.s || a.si - b.si);
      const hasLens = !!lensFor(familyOf(pp.title, investment));
      sc.slice(0, 2).forEach((x, k) => { if (k === 0 || (hasLens ? x.f.s >= 1 : x.f.s >= Math.max(2, sc[0].f.s * 0.7))) steps[x.si].people.push(qi); });
    });
  };
  assign();
  // a pain is covered when a step shares a word with it; a step that only touches the same word group does not cover it
  const covered = (kind: 'pain' | 'person', idx: number): boolean => steps.some((s) => (kind === 'pain' ? s.pains.includes(idx) && (s.painScore[idx] ?? 0) >= 100 : s.people.includes(idx)));
  for (let guard = 0; guard < 12 && steps.length < maxSteps && capPool.length; guard++) {
    // add the part that answers a pain or a person not yet covered, the best first; then fill up to three steps in the order the description lists them
    const gains = capPool.map((cp, i) => {
      const probe = newStep(cp.name, null, cp, textOf(null, cp));
      let g = 0;
      pains.forEach((p, pi) => {
        const f = stepFit(probe, p);
        if (!covered('pain', pi)) { if (f.w >= 1) g += 3 * f.s; else if (f.ng >= 1) g += 1; }
        else if (f.w >= 1) { const cur = Math.max(...steps.map((st) => (st.pains.includes(pi) ? (st.painScore[pi] ?? 0) - 100 : 0))); if (f.s > cur) g += 3 * (f.s - cur); }   // a better answer to a pain already covered
        else if (f.ng >= 1 && steps.length < maxSteps && !ms.flows.length) g += 0.5;   // room is left, and the part's own name is about the same kind of thing as a problem already covered
      });
      people.forEach((pp, qi) => { if (!covered('person', qi)) { const f = stepFit(probe, personText(pp.title)); if (f.w >= 1 || f.g >= 1) g += 2 * f.s; } });
      if (g > 0 && /^[A-Z]/.test(cp.name) && !cp.stat) g += 0.5;
      return { cp, i, g };
    }).sort((a, b) => b.g - a.g || a.i - b.i);
    const top = gains[0];
    if (top.g <= 0 && steps.length >= Math.min(3, maxSteps)) break;
    const cp = capPool.splice(top.i, 1)[0];
    steps.push(newStep(upFirst(cp.name), null, cp, textOf(null, cp)));
    assign();
  }
  // a problem no part answers, with room left in the demo: a step that walks that problem live, so the room's own words are worked through
  // (only when the user named no flow of their own: the flows they asked to see are the steps they get)
  if (steps.length && steps.length < maxSteps && pains.length && !ms.flows.length) {
    const left = pains.map((_p, i) => i).filter((i) => !steps.some((st) => st.pains.includes(i)));
    for (const i of left) {
      if (steps.length >= maxSteps) break;
      const st = newStep(`A live case of the ${ORDINAL[i] || `number ${i + 1}`} problem you described`, null, null, pains[i]);
      st.fromPain = true; st.painIdx = i; steps.push(st);
    }
    assign();
    steps.forEach((st) => { if (st.fromPain && st.painIdx !== undefined) { st.pains = [st.painIdx]; st.painScore[st.painIdx] = 100; } });
  }
  if (!steps.length) {
    // no flow and no named part: one step for each pain, in the user's words
    pains.slice(0, maxSteps).forEach((p, i) => { const st = newStep(`Problem ${i + 1}${p.split(/\s+/).length <= 10 ? `: ${low(p)}` : ''}`, null, null, p); st.fromPain = true; steps.push(st); });
    if (!steps.length) ((d.stock(v, modelKey).show || []).length ? d.stock(v, modelKey).show : d.stock(null, 'generic').show).slice(0, 3).forEach((t) => steps.push(newStep(t, null, null, t)));
    assign();
    steps.forEach((s, i) => { if (s.fromPain) { s.pains = [i]; s.painScore[i] = 100; } });
  }
  // the flows the user listed come first, in the order they listed them; the parts added for the other problems follow, the first problem first
  const minPain = (x: Step): number => (x.pains.length ? Math.min(...x.pains) : 99);
  steps.sort((a, b) => (a.flow ? 0 : 1) - (b.flow ? 0 : 1) || (a.flow && b.flow ? ms.flows.indexOf(a.flow) - ms.flows.indexOf(b.flow) : minPain(a) - minPain(b)));
  const shown = steps.slice(0, maxSteps);
  const notShownFlows = steps.slice(maxSteps).map((s) => (s.flow ? s.flow.text : s.title));
  const notShownCaps0 = capPool.map((x) => x.name);
  const perStep = Math.max(1, Math.floor(demo / Math.max(1, shown.length)));
  shown.forEach((s) => { s.minutes = perStep; });
  if (steps.length > shown.length) assign();
  const pStep = (pi: number): number => shown.findIndex((s) => s.pains.includes(pi));
  const untied = pains.map((_p, i) => i).filter((i) => pStep(i) < 0);
  const ref = (s: Step): string => (s.cap && !s.flow ? s.cap.name : low(s.title));

  // ---- proof lines: a statistic belongs beside the part it is about ----
  const unattached: Item[] = [];
  const pool: { item: Item; own: number }[] = claimsAll.map((item) => ({ item, own: -1 }));
  shown.forEach((s, si) => { if (s.cap && s.cap.stat && !claimsAll.some((c) => overlap(c.text, s.cap!.stat, skipP) >= 2)) pool.push({ item: { text: `${s.cap.name} covers ${s.cap.stat}`, label: 'from the description you gave' }, own: si }); });
  for (const { item, own } of pool) {
    let best = own, bs = own >= 0 ? 99 : 0;
    // a claim belongs beside a part when it names the part, or shares two words with it (a single common word is not enough)
    if (own < 0) shown.forEach((s, si) => {
      const named = s.cap && new RegExp(`\\b${s.cap.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(item.text) ? 50 : 0;
      const f = fit(`${s.title} ${s.text} ${s.cap ? s.cap.stat : ''}`, item.text, skipP);
      const sc = named || (f.w >= 2 ? f.s : 0);
      if (sc > bs) { bs = sc; best = si; }
    });
    if (best >= 0) shown[best].claims.push(item); else unattached.push(item);
  }
  const claimSay = (items: Item[]): string => `${items.map((c) => c.text.replace(/[.]+$/, '')).join('; ')}.`;
  const claimLabels = (items: Item[]): string => [...new Set(items.map((c) => c.label || 'a claim you gave'))].join('; ');

  // ---- objections ----
  const typed = d.splitItems(knownObjections).map((o) => o.replace(/^"|"$/g, '').trim()).filter(Boolean);
  const fromSector = !typed.length && !!v;
  const objections = typed.length ? typed : fromSector ? v!.objections.slice(0, 3).map((o) => d.cap(o.objection)) : [];
  const itPerson = people.find((p) => p.contact && (p.contact.family === 'it' || p.contact.family === 'engineering'))?.title || '';
  const secPerson = people.find((p) => p.contact && (p.contact.family === 'security' || p.contact.family === 'risk'))?.title || '';
  const dsWho = (t0: string): string => { const t = t0.replace(/^the\s+/i, ''); return (/\b(?:svp|evp|cio|cto|ciso|cfo|ceo|coo|cmo|cro|board|council|panel|manager|director|head|lead|leader|leaders|chief|officer|vp|vice|president|engineer|engineers|analyst|analysts|architect|owner|owners|founder|executive|executives|controller|counsel|team|teams|committee|group|auditors?|reviewers?|administrators?|admins?|developers?|users?|agents|staff|partners?|programs?)\b/i.test(t) || (/^[A-Z]{2,5}$/.test(t) && !/^(?:IT|HR|QA|PR|GTM|R&D)$/.test(t)) ? `the ${t}` : `the ${t} team`); };
  const altItems = d.splitItems(competitorContext).map((x) => x.replace(/[.]+$/, ''));
  const actx: AnswerCtx = {
    P, kind: product.kind, caps: product.caps, alts: altItems.length ? altItems : competitorContext ? [competitorContext] : [],
    pains, claims: claimsAll, outcomes: outcomeText ? [outcomeText] : [], model: ctx.model, voice: 'seller', shown: shown.filter((s) => !s.fromPain).map((s) => (s.cap ? s.cap.name : s.title)),
    seen: {}, sectorObjections: v?.objections, sectorName: v?.name, itPerson: itPerson ? dsWho(itPerson) : '', securityPerson: secPerson ? dsWho(secPerson) : '',
  };
  const answers = new Map<string, Answer>();
  const atClose: string[] = [], atDiscussion: string[] = [];
  for (const o of objections) {
    const a = answerObjection(o, actx);
    answers.set(o, a);
    if (CLOSE_KINDS.has(a.kind)) { atClose.push(o); continue; }
    let pick = -1, best = 0;
    shown.forEach((s, si) => { const sc = overlap(`${s.title} ${s.cap ? `${s.cap.name} ${s.cap.desc}` : ''} ${s.pains.map((i) => pains[i]).join(' ')}`, o, skipP); if (sc > best) { best = sc; pick = si; } });
    if (pick >= 0 && STEP_KINDS.has(a.kind)) shown[pick].objections.push(o); else atDiscussion.push(o);
  }
  // the answers are read in the order they appear in the script, and no sentence is repeated from one answer to the next
  dedupeAnswers([...shown.flatMap((s) => s.objections), ...atDiscussion, ...atClose].map((o) => answers.get(o)!));
  // a part an answer promises to show ("I will show how it handles it: Glean Protect") is shown there, so it is not listed as left out
  const inSteps = new Set(shown.flatMap((s) => s.objections));
  const answerOf = (n: string): string | undefined => [...answers.entries()].find(([o, a]) => inSteps.has(o) && a.say.toLowerCase().includes(n.toLowerCase()))?.[0];
  const shownInAnswer = notShownCaps0.filter((n) => answerOf(n));
  const notShownCaps = notShownCaps0.filter((n) => !shownInAnswer.includes(n));
  const objectionBlock = (o: string): string => {
    const a = answers.get(o)!;
    return `Buyer may ask: "${o.replace(/[?.]+$/, '')}${/\?$/.test(o) ? '?' : ''}"\nSay: "${say(a.say)}"${a.ask ? `\nAsk: "${say(a.ask)}"` : ''}${a.sector ? `\nPlaybook for ${v ? v.name : 'this sector'}, not for saying aloud: ${a.sector}` : ''}`;
  };

  // ---- times ----
  const partMinutes = (n: number): string => (n > 0 ? `${n} minute${n === 1 ? '' : 's'}` : 'under a minute');
  const partMin = (n: number): string => (n > 0 ? `${n} min` : 'under 1 min');
  const startAt = (share: number, whole: number): string => {
    if (demoSecs >= 10) return `${whole}:00`;
    const sec = Math.round(demoSecs * share * 60);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };
  const shortNote = demoSecs < 10 ? '\n\nThis demo is short, so the parts are rounded to whole minutes and some parts take less than a minute. Keep each of those to a sentence or two.' : '';

  // ---- words about the people ----
  const roomTitles = people.filter((p) => !p.primary).map((p) => p.title);
  const who = joinList(people.map((p) => dsWho(p.title)));
  const personRef = (qi: number): string => dsWho(people[qi].title);
  const stepsOf = (qi: number): number[] => shown.map((s, si) => (s.people.includes(qi) ? si : -1)).filter((x) => x >= 0);
  const stepNames = shown.map(ref);

  // ---- the script ----
  // a statement about what organisations in general do ("most hotels manage pricing in separate tools") is not something the buyer told us: it is put to the room as a question
  const isMarket = (p: string): boolean => /^(?:most|many|some|typically|often|organi[sz]ations|enterprises|companies|businesses|teams|hotels|retailers|banks|brands|firms|today,?)\b/i.test(p.trim());
  const ownPains = pains.map((_p, i) => i).filter((i) => !isMarket(pains[i])), marketPains = pains.map((_p, i) => i).filter((i) => isMarket(pains[i]));
  const listOf = (idx: number[]): string => `${idx.map((i, k) => `${ORDINAL[k] || `number ${k + 1}`}, ${low(pains[i])}`).join('; ')}.`;
  const playback = pains.length ? listOf(ownPains) : '';
  const opening = [
    `Say: "Thanks for making the time. Over the next ${demoDuration} ${minutesWord} I will take you through ${P}${who ? `, with ${who} in the room` : ''}${customerIndustry ? `, with ${customerIndustry} in mind${lens ? `, so ${joinList(lens.words.slice(0, 3))} are the terms I will use` : ''}` : ''}."`,
    TYPE_OPEN[demoType] ? `Say: "${TYPE_OPEN[demoType]}"` : '',
    ownPains.length ? `Say: "Here is what I heard before today: ${say(playback)}"` : '',
    marketPains.length ? `Say: "Here is what we see across ${customerIndustry || 'your market'}, so tell me which of it is true for you: ${say(listOf(marketPains))}"` : '',
    unattached.length ? `Say: "For context on who is talking: ${say(claimSay(unattached.slice(0, 3)))}" *(${claimLabels(unattached.slice(0, 3))}; have the source ready)*` : '',
    `Say: "${outcomeText ? `The outcome I am aiming for in this session: ${say(outcomeText)}.` : 'What I would like by the end of this session is a clear next step that we both agree.'}"`,
    `Say: "The plan: first I confirm that I have your problem right, then ${demo} ${demo === 1 ? 'minute' : 'minutes'} of demo in ${shown.length} step${shown.length === 1 ? '' : 's'} (${say(joinList(stepNames))}), then your questions, then the next step."`,
    `Ask: "Before I share my screen: ${primaryAudience ? `${bare(primaryAudience)}, what` : 'what'} would make ${demoDuration === 1 ? 'this' : 'these'} ${demoDuration} ${minutesWord} worth it for you?"`,
  ].filter(Boolean).join('\n\n');

  const seenFam: Record<string, number> = {};
  const painAsked: Record<number, number> = {};
  const showPhrase = (s: Step): string => (s.flow ? (IMPERATIVE.test(s.flow.text) ? `how you ${low(s.flow.text)}` : low(s.flow.text)) : ref(s));
  const askFor = (qi: number): string => {
    const pp = people[qi];
    const fam = familyOf(pp.title, investment);
    const nth0 = seenFam[fam] = (seenFam[fam] ?? -1) + 1;
    const rk = roleFor(pp.title, investment);
    // the step the person is asked about before is the one closest to their own work, not the first one they are in
    const sis = stepsOf(qi).slice().sort((a, b) => stepFit(shown[b], personText(pp.title)).s - stepFit(shown[a], personText(pp.title)).s || a - b);
    const s = sis.length ? shown[sis[0]] : null;
    // a team that does not carry the cost of the product is not asked about a cost problem
    const owns = (pj: number): boolean => painType(pains[pj]) !== 'cost' || ['finance', 'it', 'executive', 'procurement', 'investment', 'other'].includes(fam) || ['exec', 'head'].includes(pp.contact ? pp.contact.level : levelOf(pp.title));
    const pi = s && s.pains.length ? (s.pains.find(owns) ?? -1) : pains.length && !s ? 0 : -1;
    const pain = pi >= 0 ? pRef(pi) : '';
    const nth = pi >= 0 ? (painAsked[pi] = (painAsked[pi] ?? -1) + 1) : nth0;
    const tied: Record<string, string> = {
      security: `What would you need to see from ${P} to approve it, and what has stopped similar tools here before?`,
      risk: `Which requirements must ${P} meet before you sign off, and what evidence do you ask for?`,
      it: `Which systems must ${P} work with, and who owns each one?`,
    };
    if (s && pain) return `Ask ${personRef(qi)}: "Before I show ${say(showPhrase(s))}: ${say(PERSON_VARIANTS[nth % 3](pain))}"`;
    if (s && tied[fam] && nth0 > 0) return `Ask ${personRef(qi)}: "Before I show ${say(showPhrase(s))}: ${rk.questions[nth0 % rk.questions.length].replace(/^./, (c) => c.toLowerCase())}"`;
    if (s && tied[fam]) return `Ask ${personRef(qi)}: "Before I show ${say(showPhrase(s))}: ${tied[fam].replace(/^./, (c) => c.toLowerCase())}"`;
    if (s && fam !== 'other') return `Ask ${personRef(qi)}: "Before I show ${say(showPhrase(s))}: ${rk.questions[nth0 % rk.questions.length].replace(/^./, (c) => c.toLowerCase())}"`;
    if (tied[fam]) return `Ask ${personRef(qi)}: "${tied[fam]}"`;
    if (fam !== 'other') return `Ask ${personRef(qi)}: "${rk.questions[nth0 % rk.questions.length]}"`;
    return pain ? `Ask ${personRef(qi)}: "${say(PERSON_VARIANTS[nth % 3](pain)).replace(/^./, (c) => c.toUpperCase())}"` : `Ask ${personRef(qi)}: "Which part of this matters most for your work?"`;
  };
  const typeQuestion: Record<string, string> = {
    first_look: pains.length > 1 ? `Of those ${pains.length} problems, which one should we solve first?` : pains.length ? 'Which part of that costs your team the most today, and who feels it first?' : 'What is the one thing you most want solved?',
    technical_deep_dive: `Which systems must ${P} work with, and who owns each one?`,
    executive_overview: pains.length ? `What result on ${say(pRef(0))} would make this worth the team's time this year?` : 'What outcome would make this worth the team\'s time this year?',
    competitive_displacement: competitorContext ? `What does ${competitorContext} do well for you today, and where does it fall short?` : 'What do you use today, and where does it fall short?',
    expansion_upsell: `Which part of ${P} works best for you today, and where else does the same problem show up?`,
    proof_of_concept: pains.length ? `What result on ${say(pRef(0))} would you need to see in a trial to call it a success?` : 'What result would you need to see in a trial to call it a success?',
  };
  const confirm = [
    keyPainPoints && pains.length ? `Say: "Before I show anything: did I get ${pains.length === 1 ? 'that problem' : `those ${pains.length} problems`} right, and what would you add so the demo stays on your problem and not mine?"` : `Say: "I have not been told your main problem, so before I show anything: what is the one thing you most want solved?"`,
    untied.length ? `Ask: "Which part of ${P} would you most want to see for ${joinList(untied.map((i) => say(pRef(i)).replace(/"/g, "'")))}?"\n*(Note for you, not for the room: no part of your_solution is tied to ${untied.length === 1 ? 'that problem' : 'those problems'}, so this question lets the room choose what to see.)*` : '',
    ...people.map((_p, qi) => askFor(qi)),
    lens ? `Ask: "${lens.checks[0]}"` : '',
    `Ask: "${typeQuestion[demoType] || typeQuestion.first_look}"`,
  ].filter(Boolean).join('\n\n');

  // the question for a step with no problem tied to it is about the step's own part: what it connects to, how it is done today, who uses it, what would earn trust
  const askUse: Record<string, number> = {};
  const partAsk = (s: Step, i: number): string => {
    const text = `${s.flow ? s.flow.text : ''} ${s.cap ? `${s.cap.name} ${s.cap.desc}` : s.title}`.toLowerCase();
    const k = /\b(?:api|sdk|cli|server|plugins?|integrations?|connectors?|webhooks?|agents?|models?|engine|dashboard|portal|app|apps|mobile|sync|import|export)\b/.test(text) ? 'tech'
      : /optimi[sz]ation|autoscal|analytics|reporting|monitor|forecast|scor(?:e|ing)|insight|benchmark|audit|reconcil|matching|capture|prioriti/.test(text) ? 'measure'
      : /training|simulation|coaching|onboarding|support|services?|operations|advisory|marketing|content|workflow|journeys?|omnichannel/.test(text) ? 'people' : 'other';
    const n = askUse[k] = (askUse[k] ?? -1) + 1;
    const who = s.people.length ? personRef(s.people[0]) : 'the people who use it';
    const V: Record<string, string[]> = {
      tech: [`What would ${ref(s)} have to connect to in what you run today, and who would look after it?`, `Which of your current systems or data would ${ref(s)} need access to, and who approves that?`],
      measure: [`How is ${ref(s)} done today, and what does it cost your team each month in time or money?`, `Which number tells you ${ref(s)} is working, and who looks at that number?`],
      people: [`How does ${who} work with ${ref(s)} today, and what would change for ${s.people.length ? 'them' : 'them'} in the first week?`, `Which team would feel ${ref(s)} most, and what are they worried about?`],
      other: [`What would you need to see in ${ref(s)} to trust it with a real case?`, pains.length ? `Which of the problems you named would ${ref(s)} change first, and who would notice?` : `Who would own ${ref(s)} after today, and what would they check first?`, `What would make ${ref(s)} worth keeping after a month?`],
    };
    return V[k][(n + i) % V[k].length];
  };

  const seenPain = new Set<number>();
  const typeUse: Record<string, number> = {};
  const usedLines = new Set<string>();
  const stepBlocks = shown.map((s, i) => {
    const main = s.pains.length ? s.pains[0] : -1;
    const ptype = main >= 0 ? painType(pains[main]) : 'general';
    const vi = typeUse[ptype] = (typeUse[ptype] ?? -1) + 1;
    const uniq = (text: string, lead: (t: string) => string): string => { if (usedLines.has(text)) text = lead(text); usedLines.add(text); return text; };
    const lowFirst = (t: string): string => t.replace(/^([A-Z])(?=[a-z])/, (c) => c.toLowerCase());
    // a step with no problem tied to it is not told "that problem": its wordings speak of the case it runs
    const wording = main < 0 && ptype === 'general' ? NO_PAIN : SHOW[ptype];
    const sh = {
      screen: uniq(wording.screen[vi % 3], (t) => `With ${ref(s)}: ${lowFirst(t)}`),
      say: uniq(wording.say[vi % 3], (t) => `For ${ref(s)}, ${t}`),
      ask: uniq(wording.ask[vi % 3], (t) => `On ${ref(s)}: ${lowFirst(t)}`),
    };
    const painNow = s.pains.slice(0, 1).map((pi) => { const again = seenPain.has(pi); seenPain.add(pi); return again ? `the same problem as before (${say(pRef(pi))})` : say(pRef(pi)); });
    const head = `**Step ${i + 1}: ${s.title}** (about ${s.minutes} ${s.minutes === 1 ? 'minute' : 'minutes'})`;
    const forLine = s.people.length ? `Step ${i + 1} is for ${joinList(s.people.map(personRef))}${painNow.length ? '' : `, because ${ref(s)} is the part closest to their work`}.` : '';
    const what = s.fromPain ? `${P} on one real case of "${say(pains[main] ?? s.title)}"` : s.flow && s.cap ? (s.flow.text.toLowerCase().includes(s.cap.name.toLowerCase()) ? s.flow.text : `${s.flow.text}, in ${capText(s.cap)}`) : s.cap ? capText(s.cap) : s.flow ? s.flow.text : `${P} on one real case of "${say(pains[main] ?? s.title)}"`;
    const caseOf = (main >= 0 && !s.fromPain ? `, run on one real case of ${say(pRef(main))}${pRef(main).startsWith('"') ? '' : ` (${say(pains[main].split(/\s+/).length <= 24 ? low(pains[main]) : painShort(low(pains[main])))})`}` : '') + (i === 0 && customerIndustry ? `${main >= 0 && !s.fromPain ? ', using' : ', using'} an example from ${customerIndustry}` : '');
    const screen = `On screen: ${what}${caseOf}. ${sh.screen}${s.flow && s.flow.label ? ` Run it only if it works live (${s.flow.label}).` : ''}`;
    let intro2: string;
    if (s.flow) intro2 = `Here is what you asked to see: ${say(s.flow.text)}${IMPERATIVE.test(s.flow.text) ? '' : ''}.`;
    else if (s.cap) intro2 = `This is ${say(capSay(s.cap))}.`;
    else intro2 = `This one is for ${say(painNow[0] || 'the problems you named')}.`;
    const told = s.fromPain ? ` ${sh.say}` : main >= 0 && isMarket(pains[main]) && !painNow[0].startsWith('the same') ? ` On ${say(painNow[0])}, which is common across ${customerIndustry || 'the market'}: ${sh.say}` : painNow.length ? (painNow[0].startsWith('the same') ? ' This is for the same problem.' : (painNow[0].startsWith('the ') ? ` Take ${say(painNow[0])}: ${sh.say}` : ` You told me ${say(painNow[0])}, so ${lowFirst(sh.say)}`)) : ` ${sh.say}`;
    const lines = [head, ...(forLine ? [forLine] : []), screen, `Say: "${intro2}${told}"`];
    // a second problem this step bears on is said too, so it is not only a name in the table
    const second = s.pains[1];
    if (second !== undefined && !seenPain.has(second) && !s.fromPain) { seenPain.add(second); lines.push(`Say: "It also bears on ${say(pRef(second))}."`); }
    if (s.claims.length) lines.push(`Say: "For the record: ${say(claimSay(s.claims))}" *(${claimLabels(s.claims)}; have the source ready)*`);
    // what a step lacks is said to the seller, never to the room
    if (s.fromPain && shown.some((x) => !x.fromPain)) lines.push(`*(Note for you, not for the room: no part of your_solution is tied to ${main >= 0 ? say(pRef(main)) : 'this problem'}, so the step walks the problem itself; decide before the call which part you will show.)*`);
    else if (s.cap && !s.cap.desc && !s.flow) lines.push(`*(Note for you, not for the room: your_solution gives only the name ${s.cap.name}, so the lines here do not say what it does.)*`);
    lines.push(`Ask: "${say(main >= 0 ? sh.ask : partAsk(s, i))}"`);
    for (const o of s.objections) lines.push(objectionBlock(o));
    return lines.join('\n');
  });
  const compareLine = competitorContext ? `Say: "You are weighing this against ${say(competitorContext)}. Which part of that comparison matters most to you? Let me show that part next."` : '';
  const flow = [`Say: "Let me share my screen. I will keep to what you asked to see, one step at a time."`, ...stepBlocks, compareLine].filter(Boolean).join('\n\n');
  const notShownAll = [...notShownFlows, ...notShownCaps];
  const discussionBlock = [
    `Say: "I will stop sharing here. What did that raise for you?"`,
    ...atDiscussion.map(objectionBlock),
    notShownCaps.length ? `Say: "There is more behind this than I showed today: ${say(joinList(notShownCaps))}. Tell me which of your problems they would help with and I will cover them next time."` : '',
  ].filter(Boolean).join('\n\n');

  const withPain = shown.filter((s) => s.pains.length), withoutPain = shown.filter((s) => !s.pains.length);
  const recap = shown.length && shown.every((s) => s.fromPain) ? `You saw ${P} on ${say(joinList(shown.map((s) => pRef(s.pains[0]))))}.` : shown.length ? [...withPain.map((s) => (s.fromPain && shown.some((x) => !x.fromPain) ? `For ${say(pRef(s.pains[0]))} you saw a live case run through ${P}.` : `For ${say(pRef(s.pains[0]))} you saw ${ref(s)}.`)), withoutPain.length ? `You also saw ${withoutPain.length <= 3 ? joinList(withoutPain.map(ref)) : `${withoutPain.length} more parts of ${P}`}.` : ''].filter(Boolean).join(' ') : `You saw ${P}.`;
  const rest = unattached.slice(3);
  const nextOpt = v ? low(d.stock(v, modelKey).next) : '';
  const closeBlock = [
    `Say: "Here is what we covered. ${say(recap)}"`,
    rest.length ? `Say: "Some more context: ${say(claimSay(rest))}" *(${claimLabels(rest)}; have the source ready)*` : '',
    ...atClose.map(objectionBlock),
    outcomeText ? `Say: "What I set out to do today: ${say(outcomeText)}. Are we there? If not, what is still missing?"` : `Say: "What would be the right next step from here, and who should be part of it?"${nextOpt ? `\nThe next step to offer, from this sector: ${nextOpt}.` : ''}`,
    `If yes. Say: "I will send a summary of what we covered and an invite for the next step. Who else${roomTitles.length ? ` besides ${joinList(roomTitles.map(dsWho))}` : ''} should be on it?"`,
    `If hesitant. Say: "Which of the problems we played back is still not answered for you?${pains.length ? ` Is it ${say(pRef(0))}, or something else?` : ''} I want you to have everything you need."`,
  ].filter(Boolean).join('\n\n');

  // ---- the end: what to send, what to confirm, what would sharpen the draft ----
  const afterLines = [
    objections.length ? `- Send the written answers to: ${objections.map((o) => o.replace(/[?.]+$/, '')).join('; ')}.` : '',
    `- Send the summary promised in the close, and brief your champion separately.`,
  ].filter(Boolean).join('\n');
  const checks = [...answers.entries()].map(([o, a]) => `- "${o.replace(/[?.]+$/, '')}": ${a.check}.`);
  const noDesc = shown.filter((s) => s.cap && !s.cap.desc && !s.flow).map((s) => s.cap!.name);
  const sharpen: string[] = [];
  if (!primaryAudience) sharpen.push('primary_audience (it would change who the opening speaks to and the first question)');
  if (!attendees) sharpen.push('attendees (it would add a row and a question for each person, and choose the parts they should see)');
  if (!customerIndustry) sharpen.push('customer_industry (it would change the questions that speak to the buyer\'s own industry)');
  if (!keyPainPoints) sharpen.push('key_pain_points (it would choose which parts are shown and what the playback says; now the steps follow the order of your description)');
  if (!competitorContext) sharpen.push('competitor_context (it would add a side by side line and sharpen the difference answers)');
  if (!durationGiven) sharpen.push('demo_duration (30 minutes used; it would change the number of steps)');
  if (!mustShowFeatures) sharpen.push(`must_show_features (it would fix the flows that are always shown; now the steps come from ${product.caps.length ? 'the parts named in your_solution' : pains.length ? 'your pain points' : 'the usual demo list of this kind of seller'})`);
  if (!knownObjections) sharpen.push(fromSector ? 'known_objections (it would replace the usual objections of the sector with the ones you expect)' : 'known_objections (it would add a spoken answer to each; none is answered now)');
  if (!outcomeText) sharpen.push('desired_outcome (it would change the close; now it agrees the next step)');
  if (product.caps.length < 2) sharpen.push('your_solution (list the parts of the product with a few words on what each does; it would make the steps the product\'s own parts)');
  else if (noDesc.length) sharpen.push(`a few words on what ${joinList(noDesc.slice(0, 4))} ${noDesc.length === 1 ? 'does' : 'do'} in your_solution (the step uses only the name, so the spoken line cannot say what ${noDesc.length === 1 ? 'it does' : 'each does'})`);
  if (notShownFlows.length) sharpen.push(`more minutes in demo_duration (${joinList(notShownFlows)} did not fit in the ${demo} ${demo === 1 ? "minute" : "minutes"} of demo)`);
  const notesLine = sourceNotes.length ? `Notes in your inputs, kept out of the spoken lines: ${sourceNotes.map((n) => `(${n})`).join('; ')}.` : '';
  const inAnswerLine = shownInAnswer.length ? `Shown only when asked: ${shownInAnswer.map((n) => `${n} (in the answer to "${answerOf(n)!.replace(/[?.]+$/, '')}")`).join('; ')}.` : '';
  const notShownLine = notShownAll.length ? `Not shown: ${notShownAll.join('; ')}.${notShownFlows.length ? ` Not used in the draft: ${notShownFlows.join('; ')} because the demo has room for ${shown.length} step${shown.length === 1 ? '' : 's'}; add minutes or move them to a follow-up session.` : ''}` : '';
  const untiedLine = untied.length ? `Not tied to a step: ${untied.map((i) => say(pRef(i))).join('; ')}. The words you gave do not link it to any part, so Part 2 asks the room.` : '';

  // ---- who sees what ----
  const whoRows = people.map((pp, qi) => {
    const sis = stepsOf(qi);
    const own = sis.flatMap((si) => shown[si].pains).filter((x, i, a) => a.indexOf(x) === i);
    const fam0 = familyOf(pp.title, investment);
    const came = own.length ? joinList(own.slice(0, 2).map((pi) => say(pRef(pi)))) : fam0 === 'other' ? 'not known yet: Part 2 asks' : roleFor(pp.title, investment).cares;
    const seen = sis.length ? sis.map((si) => `Step ${si + 1}`).join(', ') : `Every step (Step 1${shown.length > 1 ? ` to Step ${shown.length}` : ''}), then the recap in Part 5`;
    const lvl = pp.contact ? pp.contact.level : levelOf(pp.title);
    // a person who is a leader is named by the kind of leader; a team or a user by the function they work in
    const FAM_NOUN: Record<string, string> = { security: 'security', risk: 'risk', finance: 'finance', procurement: 'procurement', hr: 'people', engineering: 'engineering', data: 'data', it: 'IT', operations: 'operations', sales: 'sales', product: 'product', marketing: 'marketing', customer: 'customer service', executive: 'executive', investment: 'investment' };
    const roleCell = fam0 === 'other' ? 'attendee' : lvl !== 'staff' && lvl !== 'group' ? roleFor(pp.title, investment).label : `${FAM_NOUN[fam0] || fam0} ${/\bteams?\b/i.test(pp.title) ? 'team' : 'user'}`;
    return `| ${d.cap(pp.given)} | ${roleCell} | ${came} | ${seen} |`;
  });
  const allClaims = [...claimsAll, ...shown.filter((s) => s.cap && s.cap.stat && !claimsAll.some((c) => overlap(c.text, s.cap!.stat, skipP) >= 2)).map((s) => ({ text: `${s.cap!.name}: ${s.cap!.stat}`, label: 'from the description you gave' }))];
  const labelledFlows = shown.filter((s) => s.flow && s.flow.label).map((s) => `- ${s.flow!.text} (${s.flow!.label}; show it only if it works live)`);
  const claimList = allClaims.length || labelledFlows.length ? `## Claims to prove before you say them\n\n${[...allClaims.map((c) => `- ${c.text.replace(/[.]+$/, '')} (${c.label || 'a claim you gave'})`), ...labelledFlows].join('\n')}\n\nEach claim is said as a claim in the script, beside the part it belongs to. Do not say one you cannot source.\n\n---\n\n` : '';
  const sectorBits = v ? (() => {
    const st = d.stock(v, modelKey);
    const showList = st.show.map((x) => `  - ${x}`).join('\n');
    return `\n\n---\n\n${d.sectorNotes(v, 'objections')}${showList ? `\n- **What ${/^[aeiou]/i.test(v.name) ? 'an' : 'a'} ${v.name} buyer wants to see:** show only what ${P} really does:\n${showList}` : ''}\n- **Words this sector's buyers use:** ${v.vocabulary.join(', ')}. Use them where they are true for the prospect.`;
  })() : '';

  const kindWords = wordsOf(product.kind, false);
  const kindSentence = product.kind && kindWords.some((w) => !skipP.some((x) => x === w || w.startsWith(x) || x.startsWith(w))) ? (/^(?:a|an|the)\s/i.test(product.kind) ? `${P} is ${product.kind.replace(/^(?:a|an|the)\s+/i, (m) => m.toLowerCase())}.` : /^[a-z]/.test(product.kind) ? `${P} is ${/^[aeiou]/i.test(product.kind) ? 'an' : 'a'} ${product.kind}.` : `${P} is described as ${product.kind}.`) : '';
  const intro1 = `${nameTyped}, ${typeLabel.toLowerCase()}, ${demoDuration} ${minutesWord}${durationGiven ? '' : ' (default)'}${who ? `, for ${who}` : ''}${customerIndustry ? ` (${customerIndustry})` : ''}. ${shown.length} step${shown.length === 1 ? '' : 's'}, each built on ${product.caps.length >= 2 || ms.flows.length ? 'one of the parts or flows you named' : 'a problem you named'} and tied to the people it matters to. ${kindSentence}`.replace(/\s+/g, ' ').trim();

  return `# Demo Script: ${typeLabel}

${intro1}

${ctx.line}

---

## The plan

| Part | Time | What happens |
|------|------|--------------|
| Opening | ${partMin(intro)} | ${keyPainPoints ? 'Says what you heard' : 'Asks for the main problem'}, states the outcome |
| Confirm | ${partMin(discovery)} | Plays the problem back${people.length ? ` and asks ${people.length} ${people.length === 1 ? 'person' : 'people'}` : ''} |
| Demo | ${partMin(demo)} | ${shown.length} step${shown.length === 1 ? '' : 's'}: ${joinList(stepNames)} |
| Discussion | ${partMin(discussion)} | ${atDiscussion.length ? `${atDiscussion.length} objection${atDiscussion.length === 1 ? '' : 's'} and open questions` : 'Open questions'} |
| Close | ${partMin(close)} | ${outcomeText ? 'Tests the outcome' : 'Agrees the next step'} |${shortNote}

${[notShownLine, inAnswerLine, untiedLine, notesLine].filter(Boolean).join('\n\n')}${notShownLine || inAnswerLine || untiedLine || notesLine ? '\n\n' : ''}## Who sees what

| Person | Role | What they came for | Shown in |
|---|---|---|---|
${whoRows.length ? whoRows.join('\n') : '| The room | | The problems you named | Every step |'}

---

${claimList}## Demo Script

### Part 1: Opening (${partMinutes(intro)}, from 0:00)

${opening}

---

### Part 2: Confirm (${partMinutes(discovery)}, from ${startAt(0.15, intro)})

${confirm}

---

### Part 3: Demo (${partMinutes(demo)}, from ${startAt(0.30, intro + discovery)})

${flow}

---

### Part 4: Discussion (${partMinutes(discussion)}, from ${startAt(0.80, intro + discovery + demo)})

${discussionBlock}

---

### Part 5: Close (${partMinutes(close)}, from ${startAt(0.95, demoSecs - close)})

${closeBlock}

---

## After The Demo

${afterLines}${checks.length ? `\n\n## Check before you say it\n\n${checks.join('\n')}` : ''}${sectorBits}

${sharpen.length ? `To sharpen this, give: ${sharpen.join('; ')}.\n\n` : ''}${d.footer}`.replace(/\n{4,}/g, '\n\n\n');
}
