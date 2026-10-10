// Run 22 (writer rev-w3): win_loss_analyzer, rewritten. The product the user named is kept in the title, the write-up and the inputs table;
// each alternative the buyer weighed is named once by a short handle (a long phrase is never said again); the stated reason is read against
// the alternatives, the people and the figures the user gave; every part of the deal that the user listed is asked about; what is missing
// (the outcome, the reason, the winner) is named once at the end with what it would change. Nothing is concluded that an input does not say
// (B82). Text only: no network, file or environment access.
import { parseContacts, tagKind, sentences, joinList, clip, upperFirst, splitTopLevel, type Contact } from './dealtext.ts';
import type { Vertical } from './verticals.ts';
import { readSector, fitSector, productOf, isKind, partsIn, readAlt, endSentence, andList, type Deps, type Alt } from './rw-common.ts';

// the kinds of alternative and what a buyer sees in each (text about kinds of choice, not about any product)
interface Kind { re: RegExp; label: string; why: string; check: string; win: string }
const KINDS: Kind[] = [
  { re: /\b(?:manual\w*|spreadsheets?|excel|diar(?:y|ies)|paper|by hand|whatsapp|email threads?)\b/i, label: 'a manual way of working', why: 'it costs nothing extra and nobody has to learn a new way of working', check: 'What did the manual way cost the buyer in hours, errors and delays, and did anyone ever put a number on it?', win: 'when the buyer saw what the manual way cost them and the work was taken off their people' },
  { re: /\b(?:point (?:tools?|solutions?)|multiple|several|separate|disconnected|siloed|best-of-breed|third-party|each (?:function|region|stage)|one firm|another builds|different (?:vendors|tools|carriers|providers))\b/i, label: 'a set of separate tools or vendors', why: 'each piece is familiar and can be replaced one at a time', check: 'Did the buyer see the cost of connecting the pieces, or only the price of each one?', win: 'when connecting the separate pieces was costing the buyer more than the pieces themselves' },
  { re: /\b(?:legacy|on-?prem\w*|old |existing|incumbent|traditional|conventional|mainframe|already (?:have|use))\b/i, label: 'an incumbent or legacy setup', why: 'it is already paid for, integrated and approved', check: 'What did the buyer say the current setup still does well, and what would switching have disturbed (data, integrations, retraining)?', win: 'when the buyer\'s problem was something the current setup could not do' },
  { re: /\b(?:in-?house|home-?grown|home-?built|build it|built (?:internally|by)|own team|diy|internal(?:ly)?)\b/i, label: 'an in-house build', why: 'their own team controls it and there is no licence or contract to buy', check: 'What does the in-house option cost to keep running, and who owns it if its builder leaves?', win: 'when the buyer counted what the in-house option costs to keep running' },
];
const kindOf = (a: Alt): Kind | null => {
  const k = KINDS.find((x) => x.re.test(a.text)) || null;
  // "separate tools or vendors" needs a word for a tool, a vendor or a system; consolidating files by hand is manual work
  if (k && k.label === 'a set of separate tools or vendors' && !/\b(?:tools?|vendors?|systems?|solutions?|apps?|applications?|platforms?|providers?|suppliers?|products?|point)\b/i.test(a.text)) {
    return /\b(?:consolidat\w+|compil\w+|merg\w+|copy\w*|re-?key\w*|reconcil\w+|collat\w+)\b/i.test(a.text) ? KINDS[0] : null;
  }
  return k;
};

function splitList(s: string): string[] {
  const parts = s.split(/\n|;/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  if (parts.length === 1 && /,/.test(parts[0])) {
    const c = parts[0].split(/,(?!\d{3}(?!\d))/).map((x) => x.trim()).filter(Boolean);
    const sentenceLike = /^(?:the|a|an)\s/i.test(c[0] || '') && (c[0] || '').split(/\s+/).length >= 8;
    if (c.length > 1 && !sentenceLike && c.every((x) => x.split(/\s+/).length <= 7) && !c.some((x) => /^(not|but|and|or|so|which|that|built|designed|made|powered|backed|offering|with|using|including|plus|replacing)\b/i.test(x))) return c;
  }
  return parts;
}
const ALT_INTRO = /(?:the\s+)?(?:alternatives?(?:\s+(?:buyers|they|customers|the buyers?)\s+use)?\s+(?:are|is|include)(?:\s+described\s+as)?|competing\s+(?:with|against)|competitors?\s*(?:are|is|include[sd]?|:)|\bversus\b|\bvs\.?|incumbents?\s*(?:is|are|:)?|compared\s+(?:with|to))\s*:?\s*/i;
const ALT_TAIL = new RegExp(`${ALT_INTRO.source}(.+?)(?:\\.\\s+[A-Z]|\\.$|$)`, 'i');

function wlContacts(text: string, investment: boolean): Contact[] {
  if (typeof text !== 'string' || !text.trim()) return [];
  const bare = /^(?:senior |sr\.? |group |regional |global )?(?:director|head|manager|vp|vice president|svp|evp|avp|lead|chief)$/i;
  const chunks: string[] = [];
  for (const line of text.split(/\n|;/)) {
    const pieces = splitTopLevel(line.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, ''));
    for (let i = 0; i < pieces.length; i++) {
      if (bare.test(pieces[i]) && i + 1 < pieces.length) { chunks.push(`${pieces[i]}, ${pieces[i + 1]}`); i++; } else chunks.push(pieces[i]);
    }
  }
  return chunks.flatMap((c) => { const one = parseContacts(c.replace(/,\s+/g, '\u0001'), investment); return one.map((x) => ({ ...x, raw: x.raw.replace(/\u0001/g, ', '), title: x.title.replace(/\u0001/g, ', ') })); });
}

const STOPW = new Set(['their', 'there', 'about', 'which', 'would', 'these', 'those', 'being', 'other', 'still', 'because', 'should', 'could', 'where', 'while', 'using', 'every', 'first', 'built', 'billing', 'system', 'systems']);
const wordsOf = (s: string): string[] => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOPW.has(w)).map((w) => w.slice(0, 5));
const shares = (a: string, b: string): number => { const wb = new Set(wordsOf(b)); return wordsOf(a).filter((w) => wb.has(w)).length; };
// Round 4: two described alternatives are one only when one holds the other or they share two long word stems ("discovery" and "disconnected" start alike and are not the same thing)
const stems6 = (s: string): string[] => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 6 && !STOPW.has(w)).map((w) => w.slice(0, 6));
const sameAlt = (a: string, b: string, named: boolean): boolean => {
  const x = a.toLowerCase().replace(/\s+/g, ' ').trim(); const y = b.toLowerCase().replace(/\s+/g, ' ').trim();
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const sb = new Set(stems6(b));
  if (stems6(a).filter((w, i, arr) => arr.indexOf(w) === i && sb.has(w)).length >= 2) return true;
  return named && shares(a, b) >= 1;
};

export function buildWinLoss(args: Record<string, unknown>, D: Deps): string {
  const analysisType = (args.analysis_type as string) || 'single_deal';
  const outcome = (args.deal_outcome as string) || '';
  const details = ((args.deal_details as string) || '').trim();
  const reason = ((args.loss_reason as string) || '').trim();
  const wonBy = ((args.competitor_won as string) || '').trim();
  const dealValue = (args.deal_value as number) || 0;
  const cycle = (args.sales_cycle_days as number) || 0;
  const stakeText = (args.stakeholders_involved as string) || '';
  const solution = ((args.your_solution as string) || '').trim();
  const multiple = ((args.multiple_deals as string) || '').trim();
  const hasV = args.deal_value !== undefined && args.deal_value !== null && args.deal_value !== '';
  const hasD = args.sales_cycle_days !== undefined && args.sales_cycle_days !== null && args.sales_cycle_days !== '';

  const ctx = readSector(undefined, { seller: [solution], context: [details, reason, stakeText, multiple] });
  const v: Vertical | null = fitSector(ctx.v, ctx.fixedLink, ctx.model, solution);
  const investment = ctx.model === 'investment';
  const P = productOf(solution, D);
  const name = P.name || P.ref;
  const isPortfolio = analysisType === 'deal_portfolio' || analysisType === 'loss_pattern';
  const days = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'day' : 'days'}`;
  const q = (s: string) => `"${s.trim().replace(/^["“”]|["“”]$/g, '').replace(/[.]$/, '')}"`;
  const lowerRole = (t: string) => t.replace(/\b([A-Z])([a-z]+)\b/g, (_m, a, b) => `${a.toLowerCase()}${b}`);

  // ---- the people: from the stakeholders input, or from "roles involved" in the notes ----
  const rolesInNotes = (details.match(/\broles involved:\s*([^;.]+)/i) || [])[1] || '';
  const contacts = wlContacts(stakeText.trim() ? stakeText : rolesInNotes, investment);
  // a deal for an API or a developer tool, with developers or engineers as most of the people involved, is a developer led deal: the roles to ask about are engineering roles
  const devRole = (c: Contact): boolean => /\b(?:developers?|engineers?|devops|sre|architects?|programmers?)\b/i.test(c.title);
  const devLed = contacts.length > 0 && contacts.filter(devRole).length * 2 >= contacts.length && /\b(?:apis?|sdks?|developers?)\b/i.test(`${solution} ${details}`);
  const against = contacts.filter((p) => tagKind(p.tag) === 'blocker');
  const backing = contacts.filter((p) => tagKind(p.tag) === 'champion' || /support/.test(p.tag || ''));
  const deciders = contacts.filter((p) => ['economic', 'buyer'].includes(tagKind(p.tag) || ''));
  const untagged = contacts.filter((p) => !p.tag);
  const ROLE_WORD = /\b(?:manager|director|vp|head|lead|leader|chief|officer|president|engineer|analyst|architect|developer|owner|controller|founder|cfo|ceo|coo|cio|cto|ciso|cmo|cro|it|hr|finance|operations|security|procurement|legal|team|support|sales|marketing|product|buyer|sponsor)\b/i;
  const ref = (c: Contact): string => (/s$/i.test(c.title.trim()) && !/\b(?:vp|operations|sales|business|logistics)$/i.test(c.title.trim()) ? c.title : ROLE_WORD.test(c.title) ? `the ${lowerRole(c.title)}` : c.title);
  const refs = (cs: Contact[], word = 'and') => andList(cs.map(ref), word);

  // ---- the alternatives: named once, by a short handle ----
  const named = wonBy && !/^(?:no decision|none|nobody|n\/a)\.?$/i.test(wonBy) ? wonBy : '';
  interface Weighed extends Alt { winner: boolean; k: Kind | null }
  const weighed: Weighed[] = [];
  const addAlt = (t: string, isNamed: boolean, winner: boolean) => {
    const text = t.trim().replace(/[.]+$/, '');
    if (!text) return;
    const dup = weighed.find((w) => sameAlt(w.text, text, isNamed));
    if (dup) { if (winner) dup.winner = true; return; }
    const a = readAlt(text, D, isNamed);
    weighed.push({ ...a, winner, k: a.kind === 'vendor' ? null : kindOf(a) });
  };
  const m = details.match(ALT_TAIL);
  if (m) splitList(m[1].replace(/\.$/, '')).forEach((a) => addAlt(a, false, false));
  if (named) splitList(wonBy).forEach((a) => addAlt(a, true, outcome === 'lost' || !outcome));
  const handles = weighed.map((w) => w.handle);

  // ---- the buyer and the notes ----
  const seg = (details.match(/\bdeals?\s+with\s+([^;:.]+?)\s*(?:;|\.|$)/i) || [])[1] || '';
  const hypothetical = /\bhypothetical\b/i.test(details) || /\bhypothetical\b/i.test(stakeText);
  const parts = partsIn(P);
  const sizeSentence = hasV && hasD ? `The deal was worth ${D.money(dealValue)} and ran ${days(cycle)}.` : hasV ? `The deal was worth ${D.money(dealValue)}.` : hasD ? `The deal ran ${days(cycle)}.` : '';
  const residual = (() => {
    let r = details;
    if (m) r = r.replace(ALT_TAIL, '');
    r = r.replace(/\broles involved:[^;.]*/i, '');
    const keep = sentences(r.replace(/(?:\s*;\s*)+/g, '. ')).filter((s) => !/hypothetical/i.test(s) && !/^\W*$/.test(s) && !(P.name && s.toLowerCase().startsWith(P.name.toLowerCase()) && s.length < 260));
    return keep.map((s) => s.replace(/[;.\s]+$/, '')).filter((s) => s.length > 3 && !/\bdeals?\s+with\b/i.test(s) && !/^\W*(?:the )?(?:alternatives?|roles)\b/i.test(s));
  })();

  // ---- the write-up ----
  const para: string[] = [];
  if (isPortfolio) {
    const deals = splitList(multiple);
    const kind = (d: string) => (/\bno[ _-]?decision\b/i.test(d) ? 'nd' : /\b(?:lost|loss)\b/i.test(d) ? 'lost' : /\b(?:won|win)\b/i.test(d) ? 'won' : 'open');
    const n = { won: 0, lost: 0, nd: 0, open: 0 };
    deals.forEach((d) => { n[kind(d) as 'won' | 'lost' | 'nd' | 'open']++; });
    if (deals.length) {
      const counts = [`${n.won} won`, `${n.lost} lost`, `${n.nd} no decision`, n.open ? `${n.open} with no outcome written` : ''].filter(Boolean);
      para.push(`**The deals you listed.** You listed ${deals.length} deal${deals.length === 1 ? '' : 's'}: ${counts.join(', ')}. These are counts of your own lines, not a benchmark.\n\n${deals.map((d) => `- ${d}`).join('\n')}`);
      if (n.won + n.lost > 0) para.push(`**Win rate on these lines.** Of the ${n.won + n.lost} deals marked won or lost, ${n.won} ${n.won === 1 ? 'was' : 'were'} won.`);
      // the competitors and reasons the lines repeat
      const lostLines = deals.filter((d) => kind(d) === 'lost' || kind(d) === 'nd');
      const rivals = new Map<string, number>();
      for (const d of deals) { const w = d.match(/\b([A-Z][A-Za-z0-9.&'-]+)\s+won\b/); if (w) rivals.set(w[1], (rivals.get(w[1]) || 0) + 1); }
      const repeated = [...rivals].filter(([, c]) => c >= 2);
      if (repeated.length) para.push(`**Who keeps winning.** ${andList(repeated.map(([r, c]) => `${r} won ${c} of these lines`))}. A rival that repeats is worth a review of its own: ask what the buyers in those deals said it did better.`);
      if (lostLines.length) para.push(`**What the lost and undecided lines say.** ${lostLines.length === 1 ? 'One line is' : `${lostLines.length} lines are`} lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.`);
    } else {
      para.push(`**The deals.** No deals were listed, so there is nothing to count. The write-up covers ${name} from the other inputs.`);
    }
    if (solution) para.push(`**What was sold.** ${[isKind(P, D) ? endSentence(isKind(P, D)) : `${name}.`].join(' ')}`);
    if (sizeSentence) para.push(`**The deal facts you gave.** ${sizeSentence}`);
    if (named) para.push(`**Who won.** You named ${named} as the competitor who won.`);
  } else {
    const winTo = named && (weighed.find((w) => w.winner) || null);
    const who = winTo ? `${winTo.handle}${winTo.handle.toLowerCase() === named.toLowerCase() ? '' : ''}` : named;
    if (outcome === 'lost') para.push(solution ? `**${upperFirst(name)} lost this deal${named ? ` to ${who}` : ''}.** ${sizeSentence}`.trim() : `**This deal was lost${named ? ` to ${who}` : ''}.** ${sizeSentence}`.trim());
    else if (outcome === 'won') para.push(solution ? `**${upperFirst(name)} won this deal${named ? `, ahead of ${who}` : ''}.** ${sizeSentence}`.trim() : `**This deal was won${named ? `, ahead of ${who}` : ''}.** ${sizeSentence}`.trim());
    else if (outcome === 'no_decision') para.push(`**This deal ended with no decision.** ${sizeSentence}`.trim());
    else if (outcome === 'mixed') para.push(`**You marked this outcome as mixed.** Split the deals into won, lost and no_decision and run the tool for each, or use \`deal_portfolio\` with a summary in \`multiple_deals\`. ${sizeSentence}`.trim());
    else para.push(`**The deal.** ${solution ? `${name} was in this deal.` : 'No facts about the deal itself were given.'} ${sizeSentence}`.trim());
    // what was sold, and to whom
    const sold: string[] = [];
    // a description that opens by saying its own name twice ("X Fabric, Fabric connects ...") is told through the kind and the parts instead
    const tail2 = P.name.split(/\s+/).slice(-2).join(' ').toLowerCase();
    const saysNameTwice = P.name.split(/\s+/).length >= 2 && solution.toLowerCase().split(tail2).length > 2;
    if (solution && solution.length <= 220 && !(saysNameTwice && isKind(P, D))) sold.push(`What was sold: ${solution.replace(/[.]+$/, '')}.`);
    else {
      if (isKind(P, D)) sold.push(endSentence(isKind(P, D)));
      if (parts.length >= 2) sold.push(`The parts ${P.name || 'it'} lists are ${joinList(parts.slice(0, 8))}.`);
    }
    if (seg) sold.push(`The buyer in this deal: ${seg}.`);
    if (hypothetical) sold.push('You marked the deal value and cycle as hypothetical, so read the figures as examples.');
    if (sold.length) para.push(sold.join(' '));
    if (residual.length) para.push(`**Other notes, in your words.** ${residual.map((r) => q(r)).join('; ')}.`);
    // what the buyer weighed
    if (weighed.length) {
      const kindsSeen = new Set<string>();
      const alsoDone = new Set<string>();
      const headOf = (a: Weighed): string => {
        const rest = a.text.toLowerCase().startsWith(a.handle.toLowerCase()) ? a.text.slice(a.handle.length).replace(/^[\s:,-]+/, '') : '';
        return a.text.length <= 60 ? `**${a.text}**` : `**${a.handle}**${rest ? ` (${rest})` : ''}`;
      };
      const generic = weighed.filter((a) => a.kind !== 'vendor' && !a.k);
      const each: string[] = [];
      for (const a of weighed) {
        const head = headOf(a);
        const won = a.winner && outcome !== 'won' ? ' It is the option you named as the winner.' : '';
        if (a.kind === 'vendor') { each.push(`- ${head} is a competing vendor.${won} Ask the buyer what it did better, in their own words, and at which stage it pulled ahead.`); continue; }
        if (a.k) {
          if (kindsSeen.has(a.k.label)) {
            // the alternatives of a kind already read are said together once, never one line each with the same words
            if (alsoDone.has(a.k.label)) continue;
            alsoDone.add(a.k.label);
            const more = weighed.filter((w2, i2) => w2.k && w2.k.label === a.k!.label && i2 >= weighed.indexOf(a));
            each.push(`- ${andList(more.map(headOf))} ${more.length === 1 ? 'is' : 'are'} also ${a.k.label}, so the same reading applies.${more.some((w2) => w2.winner && outcome !== 'won') ? ' One of them is the option you named as the winner.' : ''} Ask the buyer how ${more.length === 1 ? 'it' : 'each'} differed from the other options of this kind.`);
          }
          else { kindsSeen.add(a.k.label); each.push(`- ${head} is ${a.k.label}${a.kind === 'category' ? ', a kind of option rather than one vendor' : ''}.${won} A buyer keeps it when ${a.k.why}. ${name} can win against it ${a.k.win}. Ask the buyer: ${a.k.check}`); }
          continue;
        }
        if (generic[0] === a) {
          const group = generic;
          each.push(`- ${andList(group.map(headOf))} ${group.length === 1 ? 'is another option' : 'are other options'} the buyer used or considered.${group.some((g) => g.winner && outcome !== 'won') ? ' One of them is the option you named as the winner.' : ''} Ask the buyer what ${group.length === 1 ? 'it' : 'each'} did well, and what ${group.length === 1 ? 'it' : 'each'} failed to give them.`);
        }
      }
      const lead = weighed.length === 1 ? `The buyer weighed ${name} against ${handles[0]}.` : `The buyer weighed ${name} against ${weighed.length} alternatives.`;
      para.push(`**What the buyer weighed.** ${lead}\n\n${each.join('\n')}`);
    } else {
      para.push(`**What the buyer weighed.** No alternative was named in your inputs, so there is no comparison to read yet. The first question below asks the buyer what else they were weighing${seg ? ` as a ${seg.replace(/^an? /i, '')} buyer` : ''}; write the answer into \`deal_details\` and the comparison will follow.`);
    }
    // the reason
    if (outcome === 'lost' && reason) {
      const r = reason.toLowerCase();
      const rw = wordsOf(reason);
      const near = v ? v.objections.map((o) => ({ o, n: wordsOf(o.objection).filter((w) => rw.includes(w)).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 1).map((x) => x.o) : [];
      const readings: string[] = [];
      // the alternatives the reason names
      for (const a of weighed) if (shares(reason, a.text) >= 1 || r.includes(a.handle.toLowerCase())) readings.push(`The reason names ${a.handle} itself, so the buyer judged ${name} against ${a.kind === 'vendor' ? 'that vendor' : 'it'} and not against a better product. ${a.k ? `The usual case for ${a.k.label} is that ${a.k.why}.` : ''} Ask what ${name} would have had to show to beat it.`.replace(/\s+/g, ' '));
      // the people the reason points at
      const POINT: [RegExp, RegExp][] = [[/\bengineering|technical|developer|in-?house|build\b/, /engineer|technolog|cto|developer|architect|platform/i], [/\bfinance|budget|audit|cfo|price|cost\b/, /financ|cfo|controller|account/i], [/\bsecurity|compliance|privacy\b/, /secur|ciso|compliance|risk/i], [/\bit\b|integration|infrastructure|network\b/, /\bIT\b|information|infrastructure|cio|network/i], [/\bprocurement|legal|contract\b/, /procure|legal|counsel|vendor/i], [/\boperations|ops|site|stores?\b/, /operat|coo|supply|logistic/i]];
      // each part of the reason is read against the people it points at
      const clausesOfReason = reason.split(/,\s+and\s+|;\s+|\s+but\s+|\s+while\s+|\.\s+(?=[A-Z])/).map((x) => x.trim().replace(/[.]+$/, '')).filter((x) => x.length >= 12);
      const doneWho = new Set<string>();
      for (const cl of (clausesOfReason.length > 1 ? clausesOfReason : [reason.replace(/[.]+$/, '')])) {
        const cr = cl.toLowerCase();
        for (const [re, who2] of POINT) {
          if (!re.test(cr)) continue;
          const hit = contacts.filter((c) => who2.test(c.title));
          if (!hit.length) continue;
          const key = hit.map((c) => c.title).join('|');
          if (doneWho.has(key)) break;
          doneWho.add(key);
          const stance = hit.map((c) => (c.tag ? `${ref(c)} (${c.tag})` : ref(c)));
          readings.push(`${clausesOfReason.length > 1 ? `The part of the reason that says ${q(cl)} points at` : 'The reason points at'} ${andList(stance)}${hit.some((c) => tagKind(c.tag) === 'blocker') ? ': the objection came from inside the buying group, from someone recorded as against' : ''}. Ask what ${hit.length === 1 ? 'they' : 'each of them'} needed to see to drop it, and whether anyone on your side spoke to ${hit.length === 1 ? 'them' : 'them'} directly.`);
          break;
        }
      }
      if (/bundle|one vendor|single vendor|suite|together|all-in-one/.test(r)) readings.push(`A bundle loss: the buyer preferred one vendor for more than ${name} covers. Ask whether ${name} could have partnered for the missing part, or qualified out earlier.`);
      if (/price|cost|budget|expensive|cheaper|discount/.test(r)) readings.push(`Price or budget: ${hasV ? `at ${D.money(dealValue)} the buyer had to justify the spend` : 'the buyer had to justify the spend'}${weighed.length ? ` against ${andList(handles.slice(0, 2), 'or')}` : ''}. Check whether the value case was agreed in the buyer's own numbers before price came up${deciders.length ? `, and whether ${refs(deciders)} saw it` : ''}.`);
      if (/feature|product|capabilit|missing|gap|integrat/.test(r)) readings.push('A product or fit gap: decide whether the gap was real or a demonstration problem, and whether the requirement could have been shaped earlier.');
      if (/timing|priority|later|next year|freeze|no decision|season|quarter|migration/.test(r)) readings.push(`Timing or priority: the reason carries a timing element${/season|quarter|freeze/.test(r) ? ' (the calendar of the buyer)' : ''}. Look for the event that would have made this urgent, and whether the status quo was acceptable to them${cycle ? `; the deal ran ${days(cycle)}, so ask what changed in that time` : ''}.`);
      if (/relationship|incumbent|existing|renew|stayed|homegrown|home-grown|in-?house/.test(r) && !weighed.some((a) => shares(reason, a.text) >= 1)) readings.push('Incumbent advantage: the buyer stayed with what they know. Ask what the incumbent fixed or promised during your evaluation.');
      const seen = new Set<string>();
      const uniq = readings.filter((x) => { const k = x.slice(0, 40); if (seen.has(k)) return false; seen.add(k); return true; });
      let text = `**The stated reason.** The reason the buyer gave, in the words you recorded: ${q(reason)}.`;
      if (near.length) text += ` It is close to a usual objection in ${v!.name}: ${q(near[0].objection)}. The pattern of an answer that tends to work there: ${D.lower(near[0].response)}`;
      para.push(text);
      para.push(`**What the reason points to.**\n\n${uniq.length ? uniq.map((x) => `- ${x}`).join('\n') : '- The reason matches none of the usual patterns, so ask the buyer what sat behind it.'}`);
    } else if (reason) {
      para.push(`**The reason you gave.** ${q(reason)}.`);
    } else if (outcome === 'won' && details) {
      const why = sentences(details).find((s) => /\b(?:chose|choose|picked|selected|because|decid\w+|reason|won|after)\b/i.test(s) && !/hypothetical/i.test(s) && !/roles involved/i.test(s));
      if (why) para.push(`**Why it was won.** The reason in your notes: ${q(why)}. ${cycle ? `It took ${days(cycle)} to get there: ` : ''}check it with the buyer and write down their own words${backing.length ? `, starting with ${refs(backing)}` : ''}.`);
    }
  }
  // the people
  if (contacts.length) {
    const groups: string[] = [];
    if (backing.length) groups.push(`Backing ${name}: ${refs(backing).replace(/^the /, 'the ')}.`.replace(/\bthe the\b/g, 'the'));
    if (against.length) groups.push(`Against: ${refs(against)}.`);
    if (deciders.length) groups.push(`Recorded as the buyer: ${refs(deciders)}.`);
    if (!contacts.some((c) => c.tag)) groups.push('No position was recorded for any of them.');
    else if (!backing.length) groups.push('No champion is recorded.');
    let missing = '';
    if (v) {
      const ACR: Record<string, string> = { cfo: 'financial', coo: 'operating', cio: investment ? 'investment' : 'information', cto: 'technology', ciso: 'security', cmo: 'marketing', cro: 'revenue' };
      const sig = (t: string) => t.toLowerCase().split(/[^a-z0-9]+/).map((w) => ACR[w] || w).filter((w) => w.length > 1 && !['chief', 'officer', 'head', 'of', 'manager', 'lead', 'and', 'the', 'senior', 'sr', 'vp', 'director', 'owner', 'or'].includes(w));
      const given = new Set(contacts.flatMap((c) => sig(c.title)));
      const notNamed = devLed ? [] : v.buyerRoles.filter((role) => !/\b(?:the (?:function|team|process|business function)|who uses|that uses|that answers|the agent)\b/i.test(role) && !sig(role).some((w) => given.has(w)));
      if (notNamed.length) missing = ` This sector usually also involves ${joinList(notNamed.slice(0, 3).map(lowerRole))}; you did not list them. Were they part of the deal, and what did they think?`;
      else if (devLed) missing = ' A developer led deal usually also involves an engineering lead and whoever approves the spend; you did not list them. Were they part of the deal, and what did they think?';
    }
    para.push(`**The people.** ${contacts.length === 1 ? 'One stakeholder was' : `${contacts.length} stakeholders were`} involved: ${joinList(contacts.map((c) => c.raw))}. ${groups.join(' ')}${missing}`);
  }

  // ---- the questions for the review call, each built from an input ----
  const qs: string[] = [];
  const longHandles = handles.some((h) => /,/.test(h) || h.split(/\s+/).length > 6);
  if (handles.length >= 2) qs.push(longHandles ? `Which of the ${handles.length} alternatives above did the buyer take most seriously, and what did they say about each?` : `Which of ${andList(handles, 'or')} did the buyer take most seriously, and what did they say about each?`);
  else if (handles.length === 1) qs.push(`What did the buyer say about ${handles[0]}, and at which point did it become the real comparison?`);
  else if (!isPortfolio) qs.push(`What else was the buyer weighing besides ${name}: another provider, the way they work today, doing nothing or building it themselves, and who first brought it up?`);
  // the difference the user described between an alternative and the product is put to the buyer in the user's own words
  const described = weighed.find((a) => a.text.length > a.handle.length + 8 && /^[,\s]*(?:that|which|who|where|with|each|whose|tied|bound|locked|using|running|working|built|designed|so)\b/i.test(a.text.slice(a.handle.length)) && a.text.length <= 170);
  if (described) qs.push(`You described the alternative as ${q(described.text)}: did the buyer see that difference from ${name} for themselves, and what did ${contacts.length ? refs(contacts.slice(0, 2)) : 'the people involved'} say about it?`);
  // a buyer that runs many sites is asked whether it chose for the whole or site by site
  const siteWord = `${solution} ${details}`.match(/\b(plants?|sites?|branch(?:es)?|stores?|locations?|factories|warehouses?|offices)\b/i);
  if (siteWord && !isPortfolio) {
    const one = siteWord[1].toLowerCase().replace(/ies$/, 'y').replace(/(?:ches)$/, 'ch').replace(/s$/, '');
    qs.push(`${seg ? `Did the ${seg.toLowerCase()} buyer` : 'Did the buyer'} decide for the whole buyer or ${one} by ${one}, and who owned the choice for each?`);
  }
  if (devLed) qs.push(`${upperFirst(refs(contacts.filter(devRole).slice(0, 2)))} evaluated this: what did ${contacts.filter(devRole).length === 1 ? 'they' : 'they'} test first, and how long did it take to get a first working result?`);
  if (/\b(?:financ\w*|bank\w*|insur\w*|payments?|lending|capital markets)\b/i.test(seg)) qs.push(`The buyer is in ${seg.toLowerCase()}: did a security, compliance or data handling review sit between the evaluation and the decision, and who ran it?`);
  if (hasD) qs.push(`The deal ran ${days(cycle)}: which stage took longest, and was that the buyer's process or a stall you could have moved?`);
  if (hasV) qs.push(`The deal was worth ${D.money(dealValue)}: did the price or the size of the commitment come up as a reason, and who raised it?`);
  against.forEach((c) => qs.push(`What did ${ref(c)} need that you did not give them, and when did they turn against you?`));
  backing.forEach((c) => qs.push(`Did ${ref(c)} have the power and the material to sell this inside, and what did they say when the decision was made?`));
  deciders.forEach((c) => qs.push(`Did ${ref(c)} ever hear the case for ${name} from you directly, or only through someone else?`));
  if (untagged.length > 1) qs.push(`Which of ${untagged.length > 4 ? 'the stakeholders listed above' : refs(untagged, 'or')} spoke for ${name} and which against, and whom did the buyer listen to most?`);
  if (parts.length >= 2) qs.push(`The deal covered ${joinList(parts.slice(0, 4).map((x) => D.lower(x)))}${parts.length > 4 ? ' and more' : ''}: did the buyer judge each part on its own result or the whole on one, and which part decided it?`);
  if (v) {
    const rank = `${details} ${P.full} ${reason}`;
    const ms = v.metrics.map((x, i) => ({ x, i, n: shares(x, rank) })).sort((a, b) => b.n - a.n || a.i - b.i).slice(0, 3).map((o) => o.x);
    qs.push(`Did the buyer${seg ? ` (${seg})` : ''} judge the result on ${joinList(ms)}, or on something else?`);
  }
  // the sector kind's own words (delivery rate, sender registration, throughput ...) are put to the buyer in a developer led deal, where they are what the developers test
  if (v && devLed && v.vocabulary.length >= 3) {
    const rankText = `${details} ${P.full}`;
    const vs = v.vocabulary.map((x, i) => ({ x, i, n: shares(x, rankText) })).sort((a, b) => b.n - a.n || a.i - b.i).slice(0, 4).map((o) => D.lower(o.x));
    qs.push(`Which of ${joinList(vs)} came up in the buyer's evaluation, and how did each option do on it?`);
  }
  if (reason && outcome === 'lost') qs.push(`Was the reason you recorded the real reason or the polite one, and who inside the buyer first said it?`);
  else if (!reason && outcome !== 'won' && !isPortfolio) qs.push(`In the buyer's own words, why did they decide as they did about ${name}, and who said it first?`);
  const qBlock = qs.length ? `## Questions for the review call\n\n${qs.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\n` : '';

  // ---- sector notes, below the write-up ----
  const reasonRows = v ? v.objections.map((o) => `| ${o.objection} | ${o.response} |`).join('\n') : '';
  const sectorBlock = v ? `## Sector notes: ${v.name}\n\nThe objections this sector most often raises (from the sector notes in this tool, not from your deal). Check each against the deal: was it raised, by whom, and was it answered before the proposal?\n\n| Usual reason | Pattern of a good answer |\n|---|---|\n${reasonRows}\n\n**Who usually decides:** ${v.committee}\n\n**How deals usually run:** ${v.salesMotion}\n\n**What this sector measures:** ${v.metrics.join(', ')}.\n\n**A proof point that lands:** ${v.proofShape}\n\n` : '';

  // ---- what was not given, once, at the end ----
  const sharpen: string[] = [];
  if (!solution) sharpen.push('`your_solution`: it would change "the product" in this write-up to the name you sell and let the questions follow its parts.');
  if (!outcome && !isPortfolio) sharpen.push(`\`deal_outcome\` (won, lost or no_decision): it would change this from a description of the deal into a write-up of who the deal was won against or lost to.`);
  if (!reason && outcome !== 'won' && !isPortfolio) sharpen.push(`\`loss_reason\` (the buyer's own words and who said it): it would change this from a list of questions into a reading of why ${name} ${outcome === 'no_decision' ? 'did not get a decision' : 'lost'}, set against the alternatives and the people above.`);
  if (outcome === 'won' && !reason && !/\b(?:chose|because)\b/i.test(details) && !isPortfolio) sharpen.push(`the buyer's reason for choosing ${name}, in \`deal_details\`: it would change the win from an outcome into a reason you can repeat.`);
  if (!wonBy && outcome !== 'won' && !isPortfolio) sharpen.push(`\`competitor_won\`: it would change the comparison from the alternatives you described to the one that decided the deal${weighed.length ? ` (you described ${andList(handles.map(q))})` : ''}; write "no decision" if the buyer chose none.`);
  if (!hasV) sharpen.push('`deal_value`: it would add the price question and the size of the commitment to the review.');
  if (!hasD) sharpen.push('`sales_cycle_days`: it would add the question of which stage took longest.');
  if (!contacts.length) sharpen.push('`stakeholders_involved`: it would change the people section from a list of sector roles to the real buying group, with a question for each person.');
  else if (!contacts.some((c) => c.tag)) sharpen.push(`a position in brackets after each stakeholder, for example ${q(`${contacts[0].title} (supporter)`)} or "(against)": it would let the review ask who backed ${name} and who did not.`);
  if (!details && !isPortfolio) sharpen.push('`deal_details`: it would add the buyer, the alternatives and the notes to the write-up.');
  if (isPortfolio && !multiple) sharpen.push('`multiple_deals`: one deal per line, for example "deal name, lost, value, days, reason, who won": it would turn this into counts and patterns across the deals.');
  const sharpenBlock = sharpen.length ? `## To sharpen this, give:\n\nWhat was not given, and what each input would change:\n\n${sharpen.map((x) => `- ${x}`).join('\n')}\n\n` : '';

  // ---- the inputs as given ----
  const rows: string[] = [];
  if (solution) rows.push(`| **Solution** | ${P.label || name} |`);
  if (hasV) rows.push(`| **Deal Value** | ${D.money(dealValue)} |`);
  if (hasD) rows.push(`| **Sales Cycle** | ${days(cycle)} |`);
  if (outcome) rows.push(`| **Outcome** | ${upperFirst(outcome.replace(/_/g, ' '))} |`);
  if (reason) rows.push(`| **Stated reason** | ${D.cap(reason)} |`);
  if (wonBy) rows.push(`| **Competitor who won** | ${D.cap(wonBy)} |`);
  if (contacts.length) rows.push(`| **Stakeholders** | ${contacts.map((c) => c.raw).join('; ')} |`);
  const given = rows.length ? `## Inputs as you gave them\n\n| Item | Value |\n|---|---|\n${rows.join('\n')}\n` : '';

  const title = analysisType === 'single_deal' ? 'Win/Loss Analysis: Single Deal' : analysisType === 'competitor_analysis' ? 'Competitive Win/Loss Analysis' : analysisType === 'loss_pattern' ? 'Loss Pattern Analysis' : 'Deal Portfolio Analysis';
  const heading = P.name || P.label ? `# ${title}: ${P.name || P.label}` : `# ${title}`;
  void clip;
  return `${heading}\n\n${ctx.line}\n\n## Write-up\n\n${para.join('\n\n')}\n\n${qBlock}${sectorBlock}${given}${sharpen.length ? `\n${sharpenBlock}` : ''}`.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
