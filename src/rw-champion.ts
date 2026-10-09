// Run 22 (rewrite of champion_enablement_kit). The old kit pasted an objection label into a sentence ("the owner of 'Integration effort'"), answered
// with "I do not have a fact", repeated the whole value statement under every answer, and spoke of questions "you raised" when none were given.
// This builder writes the asset in the champion's voice from the inputs: the value points once, with the vendor's claims labelled as the vendor's;
// every objection answered from the product's own parts, the alternatives, the value points and the business model (answerObjection, champion voice);
// the risks from the objections and the sector; and what was not given named once, at the end, with what it would change.
// No figure, quote or promise is added: where a fact is needed, the asset says what to confirm before it is forwarded.
import { splitTopLevel, joinList, clip, solutionBrief, aAn } from './dealtext.ts';
import { roleFor } from './answers.ts';
import { type Vertical, type BusinessModel } from './verticals.ts';
import { readProduct, splitNotes, toCapability, productName, isStat, capText, upFirst, outcomeHead, answerObjection, dedupeAnswers, youify, wordsOf, overlap, type Capability, type Item, type AnswerCtx, type Answer } from './rw-kit.ts';
import { familyOf } from './dealtext.ts';

export interface ChampDeps {
  readContext: (explicitModel: unknown, input: { seller: unknown[]; context?: unknown[]; role?: unknown[]; buyer?: unknown[] }) => { v: Vertical | null; model: BusinessModel | null; line: string };
  cap: (s: string) => string;
  lowerFirstIfCommon: (s: string) => string;
  sectorNotes: (v: Vertical | null, what: 'committee') => string;
  splitItems: (s: unknown) => string[];
  /** the pilot steps usual for this kind of seller, the next step being the first */
  steps: (v: Vertical | null, modelKey: string) => string[];
  footer: string;
}
const say = (s: string): string => s.replace(/"/g, "'");
/** A step of the stock pilot plan, said by a champion on the buyer's side. */
const own = (s: string): string => s.replace(/\bthe buyer names\b/gi, 'we name').replace(/\bthe buyer's\b/gi, 'our').replace(/\bthe buyer\b/gi, 'we').replace(/\bbuyer's\b/gi, 'our').replace(/\bbuyer\b/gi, 'our team');

interface Outcome { text: string; label: string; head: string; subs: string[]; note?: string }

export function buildChampionKit(args: Record<string, unknown>, d: ChampDeps): string {
  const given = (k: string): string => (typeof args[k] === 'string' ? (args[k] as string).trim() : '');
  const assetType = given('asset_type') || 'executive_brief';
  const championRole = splitNotes(given('champion_role')).text;
  const championName = given('champion_name');
  // a bracket that only says where a title came from is a source note: the memo uses the title without it
  const targetGiven = splitNotes(given('target_stakeholder')).text;
  const yourSolution = given('your_solution');
  const keyValuePoints = given('key_value_points');
  const knownObjections = given('known_objections');
  const competitiveContext = given('competitive_context');
  const budgetContext = given('budget_context');
  const urgencyDrivers = given('urgency_drivers');
  const championWins = given('champion_wins');
  const target = targetGiven || 'leadership';
  const ctx = d.readContext(undefined, { seller: [yourSolution], context: [keyValuePoints, knownObjections, competitiveContext], role: [target, championRole] });
  const v = ctx.v;
  const investment = ctx.model === 'investment';
  const modelKey = investment ? 'investment' : v ? v.id : '';
  const brief = solutionBrief(yourSolution);
  const P = productName(brief, yourSolution) || 'the solution';
  let product = readProduct(yourSolution, brief.name || P);
  if (product.caps.length < 2 && brief.parts.length >= 2) {
    const fromParts = brief.parts.map((x) => toCapability(x)).filter((x): x is Capability => !!x);
    if (fromParts.length >= 2) product = { kind: product.kind, caps: fromParts };
  }
  const low = d.lowerFirstIfCommon;
  // a check that starts with the product's own name or a name written in capitals keeps its capital
  const lcCheck = (t: string): string => {
    const w = (t.split(/\s+/)[0] || '').replace(/['\u2019]s?$/, '');
    const own = (P || '').toLowerCase().split(/\s+/).includes(w.toLowerCase());
    return own || /^[A-Z]{2,}|[a-z][A-Z]|\d/.test(w) ? t : `${t.charAt(0).toLowerCase()}${t.slice(1)}`;
  };
  const sameRole = !!championRole && !!targetGiven && championRole.toLowerCase() === targetGiven.toLowerCase();
  const who = [championName, championRole].filter(Boolean).join(', ');
  const fromLine = sameRole && !championName ? '' : sameRole ? championName : who;
  const sign = championName || (sameRole ? '' : championRole);
  const targetRole = roleFor(target, investment);

  // ---- the value points: once, with the vendor's claims labelled as the vendor's ----
  // one point typed as a run of three or more claims ("a, b, c and d") is listed as separate points; a short tail ("not days") stays with the one before it
  const runOfClaims = (text: string): string[] => {
    if (text.includes(': ')) return [];
    const merged: string[] = [];
    for (const piece of splitTopLevel(text).map((x) => x.replace(/^and\s+/i, '').trim()).filter(Boolean)) {
      if (merged.length && piece.split(/\s+/).length < 3) merged[merged.length - 1] = `${merged[merged.length - 1]}, ${piece}`; else merged.push(piece);
    }
    return merged.length >= 3 && merged.every((x) => x.split(/\s+/).length >= 3) ? merged : [];
  };
  const outs: Outcome[] = d.splitItems(keyValuePoints).flatMap((raw) => {
    const m = raw.replace(/[.]+$/, '').match(/^(.*?)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/);
    const label = m && /\b(?:claims?|headline|story|survey|quote|page|case study|customer|figures?|vendor|service level|own)\b/i.test(m[2]) ? m[2].trim() : '';
    const whole = (label ? m![1] : raw).replace(/[.]+$/, '').trim();
    const run = runOfClaims(whole);
    return (run.length ? run : [whole]).map((text) => outcomeOf(text, label));
  });
  function outcomeOf(text: string, label: string): Outcome {
    // a closing bracket that is a remark ("(the Zero Friction Enterprise idea)") stays with the point, not with its last item
    const nm = text.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
    const body = nm && nm[1].includes(': ') ? nm[1] : text;
    const colon = body.indexOf(': ');
    const rawSubs = colon > 0 ? splitTopLevel(body.slice(colon + 2)).map((x) => x.replace(/^and\s+/i, '').trim()).filter(Boolean) : [];
    // a short fragment that is not an action ("control and scale") is the end of the item before it
    const ACTION = /^(?:get|keep|protect|manage|streamline|raise|cut|close|reduce|increase|improve|speed|shorten|lower|grow|win|make|plan|launch|cover|avoid|stop|simplify|automate|scale|ship|move|find|build|run|track|see|bring|boost|connect|deliver|hit|meet|stay|retain|expand|consolidate|replace|lift|gain|save|prove|show|handle|trust|know|reach|fix|end|free|prevent|detect|respond|onboard|pay|collect|bill|reclaim|shrink|turn|modernize|modernise|migrate|unify|enable|ensure|give|offer|provide|use|work|spend|drive|accelerate|eliminate|standardi[sz]e|centrali[sz]e|capture|apply|test|release|secure|comply|verify|forecast|price)\b/i;
    const subs = rawSubs.reduce<string[]>((acc, x) => { if (acc.length && x.split(/\s+/).length <= 3 && !ACTION.test(x) && !/\d/.test(x)) acc[acc.length - 1] += `, ${x}`; else acc.push(x); return acc; }, []);
    // the pieces after a colon are listed apart only when they are plain items: a figure, a "with ..." tail or a long clause stays in the sentence
    const plain = subs.length >= 2 && subs.every((x) => !/\d/.test(x) && !/^with\b/i.test(x) && x.split(/\s+/).length <= 16);
    return { text, label, head: outcomeHead(text), subs: plain ? subs : [], note: plain && nm && !label ? nm[2].trim() : '' };
  }
  const outClaims: Item[] = outs.filter((o) => o.label || isStat(o.text)).map((o) => ({ text: o.text, label: o.label || 'a claim you gave' }));
  const claimy = outClaims.length > 0;
  const alts = d.splitItems(competitiveContext).map((x) => x.replace(/[.]+$/, ''));
  const bud = budgetContext.replace(/[.]+$/, '');
  const urg = urgencyDrivers.replace(/[.]+$/, '');
  const wins = championWins.replace(/[.]+$/, '');
  const typed = d.splitItems(knownObjections).map((x) => x.replace(/^"|"$/g, '').trim()).filter(Boolean);
  const fromSector = !typed.length && !!v;
  const objections = typed.length ? typed : fromSector ? v!.objections.slice(0, 3).map((o) => d.cap(o.objection)) : [];

  // ---- the answers ----
  const actx: AnswerCtx = {
    P, kind: product.kind, caps: product.caps, alts, pains: [], claims: outClaims, outcomes: outs.flatMap((o) => (o.subs.length ? o.subs : [o.text])), model: ctx.model, voice: 'champion',
    sectorObjections: v?.objections, sectorName: v?.name, budget: bud, seen: {},
  };
  const answers = objections.map((o) => ({ o, a: answerObjection(o, actx) }));
  dedupeAnswers(answers.map((x) => x.a));

  // ---- pieces of text ----
  const relText = `${keyValuePoints} ${knownObjections} ${competitiveContext}`;
  const rel = product.caps.filter((c) => overlap(`${c.name} ${c.desc}`, relText, wordsOf(P, false)) > 0).slice(0, 3);
  const kind = product.kind;
  const kindSentence = !kind || wordsOf(kind, false).every((w) => wordsOf(P, false).includes(w)) ? '' : /^(?:a|an|the)\s/i.test(kind) ? `${upFirst(P)} is ${kind.replace(/^(?:a|an|the)\s+/i, (m) => m.toLowerCase())}.` : /^[a-z]/.test(kind) ? `${upFirst(P)} is ${aAn(kind)}.` : `${upFirst(P)} is described as ${kind}.`;
  const partsSentence = product.caps.length >= 2 ? `It covers ${joinList(product.caps.slice(0, 8).map(capText))}.${rel.length && rel.length < product.caps.length ? ` The ${rel.length === 1 ? 'part' : 'parts'} closest to our points ${rel.length === 1 ? 'is' : 'are'} ${joinList(rel.map((c) => c.name))}.` : ''}` : '';
  const overview = [kindSentence || (brief.name ? `We are looking at ${P}.` : ''), partsSentence].filter(Boolean).join(' ');
  const steps = d.steps(v, modelKey).slice(0, 4).map(own);
  const stepFirst = low(steps[0] || 'agree the scope, the owners and the measure');
  const stepLast = low(steps[steps.length - 1] || 'review the result and decide the wider rollout');
  const askLine = `${bud ? `approve ${P} at ${bud}` : `approve ${P}`} and the first step: ${stepFirst}`;
  const aim = outs[0] ? low(outs[0].head) : '';
  const claimNote = claimy ? `A figure with a label in brackets comes from the vendor's own pages or stories, as labelled. It is not measured at our company.` : '';
  const noReturn = `No return figure is stated here, because none was given. Run roi_business_case_builder with our own cost figures and add the result.`;
  const outBullets = outs.map((o) => `- ${upFirst(o.subs.length ? o.head : o.text)}${o.label ? ` (${o.label})` : ''}${o.subs.length && o.note ? ` (${o.note})` : ''}${o.subs.length ? `:\n${o.subs.map((x) => `  - ${upFirst(x)}`).join('\n')}` : ''}`).join('\n');
  const altList = alts.length > 1 && alts.some((a) => /,|\band\b/i.test(a)) ? alts.join('; ') : joinList(alts);
  const altsSentence = alts.length ? `The alternatives we looked at are ${altList}.` : '';
  const stake = wins ? `Not for the reader. Your own stake, as you put it: "${say(wins)}".` : '';
  const head = (title: string): string => `# ${title}`;
  const memoLines = (subject: string): string => [subject, `To: ${target}`, fromLine ? `From: ${fromLine}` : ''].filter(Boolean).join('\n');
  const qa = (full = true): string => answers.map((x) => `### ${x.o}\n\n${x.a.say}${full && x.a.sector && v ? `\n\nUsual answer in ${v.name}: ${x.a.sector}` : ''}`).join('\n\n');
  const sectorRisks = v ? v.objections.filter((o) => !answers.some((x) => x.a.sector === o.response)).slice(0, 3) : [];
  const riskBlock = (): string => {
    const settled = new Set<string>();
    const risksSeen = new Set<string>();
    return [
      ...answers.map((x) => {
        const chk = lcCheck(x.a.check);
        const settle = settled.has(chk) ? '' : ` To settle it, confirm: ${chk}.`;
        settled.add(chk);
        const risk = risksSeen.has(x.a.risk) ? '' : x.a.risk;
        risksSeen.add(x.a.risk);
        return `### Risk: ${x.o.replace(/[?]+$/, '')}\n\n${`${risk}${settle}`.trim() || 'Covered by the risk above.'}${x.a.sector && v ? `\n\nHow this sector usually covers it: ${x.a.sector}` : ''}`;
      }),
      ...sectorRisks.map((o) => `### Risk usual in ${v!.name}: ${d.cap(o.objection)}\n\nHow it is usually covered: ${o.response}`),
    ].join('\n\n');
  };
  const plural = /s$/i.test(target.trim().split(/\s+/).pop() || '') && !/(?:ss|us|is|ics)$/i.test(target.trim());
  const readerNotes = [
    `### About the reader`,
    targetGiven ? `${d.cap(target)} ${plural ? `are ${targetRole.label}s` : `is ${aAn(targetRole.label)}`}: they care about ${targetRole.cares}, and worry about ${targetRole.worry}. They will want to see ${targetRole.needs}.` : '',
    v ? `In ${v.name} the case is usually judged on ${joinList(v.metrics.slice(0, 4))}.` : '',
    v ? d.sectorNotes(v, 'committee') : '',
  ].filter(Boolean).join('\n\n');
  const checks = answers.length ? `## Before you forward this\n\n${answers.map((x) => `- "${say(x.o.replace(/[?]+$/, ''))}": ${x.a.check}.`).join('\n')}` : '';

  // ---- what was not given, once ----
  const sharpen: string[] = [];
  if (!championName) sharpen.push('champion_name (it would sign the asset)');
  if (!championRole) sharpen.push('champion_role (it would fill the From line and the voice of the asset)');
  if (!targetGiven) sharpen.push('target_stakeholder (it would set who the asset is written for; now it is written for leadership)');
  else if (sameRole) sharpen.push(`target_stakeholder (it would change the To line and the reader notes: it now names the same role as champion_role, ${championRole}, so name the person above the champion who must approve)`);
  if (!outs.length) sharpen.push('key_value_points (it would state what the reader should expect; now no outcome is stated)');
  if (!typed.length) sharpen.push(fromSector ? `known_objections (it would replace the usual questions of ${v!.name} with the ones you expect)` : 'known_objections (it would add an answer to each; none is answered now)');
  if (!alts.length) sharpen.push('competitive_context (it would name the alternatives and the way of working today)');
  if (!bud) sharpen.push('budget_context (it would put a price in the asset; now none is stated)');
  if (!urg) sharpen.push('urgency_drivers (it would give a reason to act now and a date; now none is set)');
  if (!wins) sharpen.push('champion_wins (it would add your own stake as a note to you; now there is none)');
  if (product.caps.length < 2) sharpen.push('your_solution (list the parts of the product with a few words on what each does; it would let the answers point to the part that fits each question)');
  const sharpenLine = sharpen.length ? `To sharpen this, give: ${sharpen.join('; ')}.` : '';

  const assets: Record<string, () => string> = {
    executive_brief: () => [
      head(`Executive Brief for ${d.cap(target)}`),
      `${memoLines(`Re: Recommendation on ${P}`)}`,
      `## Recommendation\n\nI recommend that we go ahead with ${P}.${bud ? ` The cost is ${bud}.` : ''}${urg ? ` The timing: ${urg}.` : ''}`,
      overview ? `## What it is\n\n${overview}` : '',
      outs.length ? `## What we expect to get\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : '',
      alts.length ? `## What else we looked at\n\n${altsSentence}${aim ? ` I recommend ${P}; the point that decides it is ${aim}.` : ''}` : '',
      bud ? `## What it costs\n\n${bud}. ${noReturn}` : '',
      answers.length ? `## Questions you may have\n\n${qa(false)}` : "",
      `## Decision requested\n\nI am asking you to ${askLine}.`,
      stake, readerNotes, checks,
    ].filter(Boolean).join('\n\n'),

    internal_business_case: () => [
      head('Internal Business Case'),
      memoLines(`Subject: Business case for ${P}`),
      `I recommend that we approve ${P}${bud ? `, at ${bud}` : ''}.${aim ? ` The aim: ${aim}.` : ''}${urg ? ` The timing: ${urg}.` : ''} The rest of this note says what it is, what we expect to get, what it costs, what could go wrong and how I would start.`,
      alts.length ? `## Where we are today\n\n${alts.length > 1 ? `The options in front of us are ${altList}.` : `The option in front of us is ${altList}.`}` : '',
      `## What we propose\n\n${overview || `We are proposing ${P}.`}`,
      outs.length ? `## What we expect to get\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : '',
      `## What it costs\n\n${bud ? `${bud}. ` : 'No price has been given yet. '}${noReturn}`,
      answers.length ? `## Questions I expect, and my answers\n\n${qa(true)}` : '',
      answers.length || sectorRisks.length ? `## Risks\n\n${riskBlock()}` : '',
      urg ? `## Why now\n\n${d.cap(urg)}.` : '',
      `## Next steps\n\n1. ${d.cap(askLine)}.\n2. ${d.cap(low(steps[1] || stepFirst))}.\n3. ${d.cap(stepLast)}.`,
      checks, stake, readerNotes,
    ].filter(Boolean).join('\n\n'),

    objection_responses: () => [
      head('Objection Response Guide'),
      `For: ${who || 'the champion'}\nSituation: selling ${P} inside the company${targetGiven ? `, to ${target}` : ''}`,
      outs.length ? `## What the answers rest on\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : '',
      answers.length ? `## Answers to say\n\n${answers.map((x) => `### ${x.o}\n\nSay: "${say(x.a.say)}"\nIf they push: "${say(youify(x.a.ask))}"\nConfirm before you say it: ${x.a.check}.${x.a.sector && v ? `\nUsual answer in ${v.name}, not for saying aloud: ${x.a.sector}` : ''}`).join('\n\n')}` : '',
      urg && !answers.some((x) => x.a.kind === 'timing') ? `### This can wait\n\nSay: "It can wait only if we accept this: ${say(urg)}. If we wait, that is the date we are choosing to miss."` : '',
      outs.length ? `## If the room drifts\n\nSay: "Whatever we decide on the details, what we are buying is ${say(joinList(outs.map((o) => low(o.head))))}${bud ? `, for ${say(bud)}` : ''}.${alts.length ? ` ${say(altsSentence)}` : ''}"` : bud ? `## If the room drifts\n\nSay: "The figure we have is ${say(bud)}."` : '',
      stake, readerNotes,
    ].filter(Boolean).join('\n\n'),

    presentation_talking_points: () => [
      head('Presentation Talking Points'),
      `For: ${who || 'the champion'}, presenting to ${target}\nTopic: ${P}`,
      `## Opening (2 minutes)\n\nSay: "I am here to ask for a decision on ${say(P)}.${aim ? ` The aim: ${say(aim)}.` : ''}"\n\nSay: "In the next 15 minutes: where we are today, what ${say(P)} is, what we expect to get, what it costs and what I am asking you to decide."`,
      `## Where we are today (3 minutes)\n\n${alts.length ? `Say: "${say(altsSentence)}"` : `Say: "I will tell you what we use today."`}\n\n${v ? `Say: "A decision like this is judged on ${say(joinList(v.metrics.slice(0, 3)))}. I will put our own numbers against each."` : `Say: "I will put our own numbers against what we do today."`}`,
      `## What ${P} is (4 minutes)\n\n${overview ? `Say: "${say(overview)}"` : `Say: "We are looking at ${say(P)}."`}\n\n${outs.map((o, i) => `Say: "${i === 0 ? 'What we expect to get: ' : i === outs.length - 1 && outs.length > 1 ? 'And ' : 'Then '}${say(low(o.text))}${o.label ? ` (${say(o.label)})` : ''}."`).join('\n\n')}${claimNote ? `\n\nSay: "${say(claimNote)}"` : ''}`,
      `## What it costs (4 minutes)\n\n${bud ? `Say: "The figure we have is ${say(bud)}."` : `Say: "No price has been given to me, so I will bring the full price in writing."`}\n\nNote: ${noReturn}`,
      `## The decision (2 minutes)\n\nSay: "I recommend that we go ahead with ${say(P)}.${urg ? ` The reason to move now: ${say(urg)}.` : ''}"\n\nSay: "If you agree, the first step is to ${say(stepFirst)}, and the last is to ${say(stepLast)}."`,
      answers.length ? `## Questions to expect\n\n${answers.map((x) => `### ${x.o}\n\nSay: "${say(x.a.say)}"`).join('\n\n')}` : '',
      checks, stake,
    ].filter(Boolean).join('\n\n'),

    email_to_stakeholder: () => [
      head(`Email to ${target}`),
      `Subject: ${P}: a recommendation for your decision`,
      `Hi,`,
      `I am writing to recommend ${P}${kind ? `, ${/^(?:a|an|the)\s/i.test(kind) ? low(kind) : /^[a-z]/.test(kind) ? aAn(kind) : `described as ${kind}`}` : ''}${bud ? `, at ${bud}` : ''}.${urg ? ` The timing matters: ${urg}.` : ''}`,
      outs.length ? `What we expect to get:\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : '',
      alts.length ? `${altsSentence}${aim ? ` I recommend ${P}; the point that decides it is ${aim}.` : ''}` : '',
      answers.length ? `Questions I expect, with short answers:\n${answers.map((x) => `- ${x.o} ${x.a.say.split(/(?<=[.?!])\s+(?=[A-Z])/)[0]}`).join('\n')}` : '',
      `Could we take 15 minutes to go through it? I would ask you to ${askLine}.`,
      `Thanks,${sign ? `\n${sign}${championName && championRole ? `\n${championRole}` : ''}` : ''}`,
      `## Short version\n\nHi,\n\nI recommend ${P}${bud ? `, at ${bud}` : ''}.${aim ? ` The aim: ${aim}.` : ''} Could I have 15 minutes with you?${urg ? ` The timing: ${urg}.` : ''}${sign ? `\n\n${sign}` : ''}`,
      checks, stake,
    ].filter(Boolean).join('\n\n'),

    roi_one_pager: () => [
      head(`ROI One-Pager: ${P}`),
      `Prepared for ${target}${who ? ` by ${who}` : ''}`,
      `## The problem\n\n${alts.length ? `Today we are working with, or weighing, ${altList}.` : 'No current way of working was given, so none is described.'}${aim ? ` What we want instead: ${aim}.` : ''}`,
      `## The proposal\n\n${overview || `We propose ${P}.`}`,
      outs.length ? `## What we expect\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : '',
      `## Investment\n\n${bud || 'No price has been given yet.'}`,
      `## Return\n\n${noReturn}`,
      urg ? `## Why now\n\n${d.cap(urg)}.` : '',
      answers.length ? `## Questions to settle first\n\n${answers.map((x) => `- ${x.o} ${x.a.say.split(/(?<=[.?!])\s+(?=[A-Z])/)[0]}`).join('\n')}` : '',
      `## The ask\n\n${d.cap(askLine)}.`,
      `Contact: ${who || 'the champion'}`,
      checks, stake,
    ].filter(Boolean).join('\n\n'),

    competitive_comparison: () => [
      head('Competitive Comparison'),
      `${P} against the alternatives\nPrepared for: ${target}${who ? `\nBy: ${who}` : ''}`,
      `## Summary\n\n${alts.length ? `${altsSentence} ` : 'No alternative was named, so none is compared. '}${aim ? `I recommend ${P}; the point that decides it is ${aim}.` : `I recommend ${P}.`}`,
      alts.length ? `## How each option stands\n\n${(() => {
        const pool = outs.filter((o) => !o.label && !isStat(o.text)).length ? outs.filter((o) => !o.label && !isStat(o.text)) : outs;
        const used = new Set<Outcome>();
        const blocks = alts.map((a, i) => {
          const hit = pool.filter((o) => !used.has(o)).sort((x, y) => overlap(a, y.text, wordsOf(P, false)) - overlap(a, x.text, wordsOf(P, false)))[0] || pool[i % Math.max(1, pool.length)];
          if (hit) used.add(hit);
          const part = product.caps.find((c) => overlap(`${c.name} ${c.desc}`, a, wordsOf(P, false)) > 0);
          return `### Option ${i + 1}: ${a}\n\nAs we have it, this option is ${a}.${hit ? `\n\nOn ${P}'s side: ${low(hit.head)}${part ? `, through ${capText(part)}` : ''}. The test: ask this option to show ${low(hit.head)} on our own work.` : `\n\nAsk this option to run one case of ours, and compare.`}`;
        });
        return `${blocks.join('\n\n')}\n\nAll we have on each option is its description, so nothing else is claimed about it. Confirm what each one does today from its own documentation or a quote we hold, not from memory.`;
      })()}` : '',
      `## ${P}\n\n${overview || `We are looking at ${P}.`}${outs.length ? `\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : ''}${bud ? `\n\nCost: ${bud}.` : ''}`,
      answers.length ? `## Questions to put to every option\n\n${answers.map((x) => `- ${x.o}`).join('\n')}` : '',
      urg ? `## Timing\n\n${d.cap(urg)}.` : '',
      stake,
    ].filter(Boolean).join('\n\n'),

    risk_assessment: () => [
      head(`Risk Assessment: ${P}`),
      `For: ${target}${who ? `\nBy: ${who}` : ''}`,
      `Likelihood and impact are not rated here: set them from our own assessment.`,
      `## Summary\n\nThis assessment covers the risks raised against ${P} and how each one is covered.${outs.length ? ` The investment is meant to deliver:\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : ''}`,
      answers.length || sectorRisks.length ? `## The risks\n\n${(() => {
        const settled = new Set<string>(), risksSeen = new Set<string>();
        return [
          ...answers.map((x) => {
            const chk = lcCheck(x.a.check);
            const settle = settled.has(chk) ? '' : `\n\nTo settle it, confirm: ${chk}.`;
            settled.add(chk);
            const risk = risksSeen.has(x.a.risk) ? 'The same kind of risk as one above, on a different point.' : x.a.risk;
            risksSeen.add(x.a.risk);
            return `### ${x.o}\n\nWhat it means here: ${risk}\n\nHow we cover it: ${x.a.say}${settle}${x.a.sector && v ? `\n\nHow this sector usually covers it: ${x.a.sector}` : ''}`;
          }),
          ...sectorRisks.map((o) => `### Risk usual in ${v!.name}: ${d.cap(o.objection)}\n\nHow it is usually covered: ${o.response}`),
        ].join('\n\n');
      })()}` : '',
      `## The risk of doing nothing\n\n${alts.length ? `The options in front of us today are ${altList}. ` : ''}${v ? `The numbers to put against staying as we are: ${joinList(v.metrics.slice(0, 3))}.` : ''}${urg ? ` The timing: ${urg}.` : ''}`,
      `## Conclusion\n\nI recommend that we go ahead with ${P}${answers.length ? `, on the condition that the pilot settles the points above` : ''}.${bud ? ` The cost is ${bud}.` : ''}`,
      stake,
    ].filter(Boolean).join('\n\n'),
  };
  const body = (assets[assetType] || assets.executive_brief)();
  const familyKnown = familyOf(target, investment) !== 'other';
  void familyKnown; void clip;
  return `${body}\n\n${sharpenLine ? `${sharpenLine}\n\n` : ''}${d.footer}`.replace(/\n{4,}/g, '\n\n\n');
}
