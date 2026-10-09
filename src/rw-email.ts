// Run 22 (writer rev-w3): email_sequence_generator, rewritten. Every email is written from the inputs in whole sentences:
// the pain is cut into clauses and each clause is used once, a figure is split from its list and used once with the source it came
// with said in the sentence (not only in the checklist), a customer quote keeps its speaker, an award is never the opening, the
// persona is never made plural by adding a letter, and an executive is asked who else should join, not whether the topic is theirs.
// What is not given is named once, at the end, with what it would change. Nothing is invented (B82): no figure, customer, date or promise
// that the user did not give. Text only: no network, file or environment access.
import { parseProof, proofPhrase, familyOf, levelOf, joinList, clip, upperFirst, splitTopLevel, type ProofItem } from './dealtext.ts';
import { roleFor } from './answers.ts';
import type { Vertical } from './verticals.ts';
import { readSector, productOf, isKind, partsIn, sourceOf, endSentence, sentenceCase, listItems, isNotGiven, andList, dropRepeats, type Deps, type Product, type Source } from './rw-common.ts';

export const EMAIL_COUNTS: Record<string, number> = { cold_outreach: 5, warm_follow_up: 3, post_demo: 4, re_engagement: 3, proposal_follow_up: 4, nurture: 4, event_follow_up: 3, referral_request: 3 };
const TITLES: Record<string, string> = { cold_outreach: 'Cold Outreach', warm_follow_up: 'Warm Follow-Up', post_demo: 'Post-Demo', re_engagement: 'Re-Engagement', proposal_follow_up: 'Proposal follow up', nurture: 'Nurture', event_follow_up: 'Event follow up', referral_request: 'Referral request' };

const VERB = /\b(?:is|are|was|were|has|have|had|does|do|did|can|cannot|can't|will|would|travel\w*|pile\w*|spread\w*|tak(?:e|es)|slow\w*|fail\w*|arriv\w+|los(?:e|es)|runs?|work\w*|forc(?:e|es)|break\w*|leav(?:e|es)|cost\w*|gets?|need\w*|rel(?:y|ies)|struggl\w+|goes|go|com(?:e|es)|becom\w+|stay\w*|remain\w*|hold\w*|miss\w*|sits?|drop\w*|chase\w*|sends?|lack\w*|wait\w*|fall\w*|generat\w+|giv(?:e|es)|mak(?:e|es)|show\w*|spend\w*|rise|rises|grow\w*|depend\w*|creat\w+|bring\w*|expos\w+|hid(?:e|es)|wast\w+|lag\w*|fragment\w*|trust\w*|use[sd]?|prevent\w*|resolv\w+|reduc\w+|cut|cuts|sav(?:e|es|ed)|increas\w+|deliver\w*|rais\w+|improv\w+|lower\w*|keep|keeps|stop|stops|turn|turns|ship|ships)\b/i;
const clauseLike = (a: string): boolean => /^(?:when|if|because|as|while|after|before|once|since|every)\b/i.test(a) || VERB.test(a.split(/\s+/).slice(0, 8).join(' '));

/** The separate pains of a typed pain statement: each clause is used once. A long clause is cut at ", and" or "while" where both sides can stand. */
export function painAtoms(text: string): string[] {
  const clean = text.replace(/\s*\((?:page claim|customer words|customer quote|a seller's words|implied by[^)]*|reviewers' words[^)]*)\)/gi, '').replace(/[.]+$/, '').trim();
  const segs = clean.split(/;|\.\s+(?=[A-Z“"'])/).map((s) => s.trim().replace(/^(?:and|while|also|plus)\s+/i, '')).filter(Boolean);
  const out: string[] = [];
  const balanced = (s: string) => (s.match(/\(/g) || []).length === (s.match(/\)/g) || []).length;
  const split = (s: string, depth = 0): string[] => {
    if (s.length <= 130 || depth > 2) return [s];
    for (const m of s.matchAll(/,\s+(?:and|while|but)\s+|\s+while\s+/gi)) {
      const i = m.index ?? 0;
      const left = s.slice(0, i), right = s.slice(i + m[0].length);
      if (left.length >= 40 && right.length >= 30 && balanced(left) && balanced(right)) return [...split(left, depth + 1), ...split(right.replace(/^(?:and|while|but)\s+/i, ''), depth + 1)];
    }
    return [s];
  };
  for (const s of segs) for (const x of split(s)) if (x.trim().length > 3 && !out.includes(x.trim())) out.push(x.trim());
  return out.slice(0, 6);
}

const STEM_STOP = new Set(['sale', 'serv', 'cust', 'mark', 'team', 'tool', 'data', 'mana', 'syst', 'plat', 'proc', 'work', 'with', 'more', 'from', 'that', 'this', 'have', 'they', 'your', 'their', 'into', 'over', 'only', 'also', 'each', 'such', 'than', 'solu', 'prod', 'busi', 'comp', 'enab', 'help', 'real', 'time', 'fast', 'lowe', 'fewe', 'high', 'effi', 'when', 'what', 'ente', 'need', 'many', 'much', 'across']);
const stems = (t: string): Set<string> => new Set((t.toLowerCase().match(/[a-z]{4,}/g) || []).map((w) => w.replace(/s$/, '').slice(0, 4)).filter((w) => !STEM_STOP.has(w)));
const overlap = (a: string, b: string): number => { const sb = stems(b); return [...stems(a)].filter((w) => sb.has(w)).length; };
interface Atom { text: string; kind: ProofItem['kind']; label: string; src: Source; item: ProofItem; score: number }
/** A list of figures ("a 3.7%, 49% more work, 15 days faster") is cut into atoms, each used once; atoms with the same figures count as one. */
function atomsOf(items: ProofItem[], rank: string): Atom[] {
  const out: Atom[] = [];
  const sig = (t: string) => (t.match(/\d[\d,.]*/g) || []).map((n) => n.replace(/[,.]+$/, '')).sort().join('|');
  const seen = new Set<string>();
  for (const it of items) {
    let pieces = [it.text];
    if (it.kind === 'result' || it.kind === 'scale') {
      const stripped = it.text.replace(/^(?:the )?(?:vendor |company |product )?(?:page|pages|site|website)\s+(?:cites|claims|says|shows|reports|states)\s+/i, '').replace(/^(?:examples? (?:the )?pages? give (?:are|is)\s+)/i, '');
      const commaParts = splitTopLevel(stripped).map((x) => x.replace(/^(?:and|plus)\s+/i, '').trim());
      // a list of figures is cut; a sentence that carries several figures ("X achieved 95%, cut time by 99% and saw ...") stays whole
      // a later part that opens with a capital ("..., ATP prevented over 30 million attacks") is the rest of one sentence, not another figure
      // a list of figures has a figure at the start of every part after the first ("3.7%, 49% more work, 15 days faster"); any other later part is the rest of the sentence
      const figureList = commaParts.slice(1).every((x) => /^(?:an? |the )?(?:up to |an average of |about |over |more than |nearly |almost )?[$£€]?\d/i.test(x));
      const dependent = !figureList || commaParts.slice(1).some((x) => /^[A-Z][A-Za-z0-9]*\s/.test(x) || (/^[a-z]/.test(x) && !/^\d/.test(x) && !/^(?:an?|the)\s/.test(x) && /^(?:saw|decreased|reduced|increased|cut|raised|improved|lowered|achieved|grew|saved|automated|added|boosted|and|which|so|with)\b/.test(x)));
      const parts = dependent ? [stripped] : commaParts.flatMap((x) => { const m2 = commaParts.length >= 2 ? x.match(/^(.*\d.*?)\s+and\s+((?:\d|[a-z]+ing\b).*\d.*)$/) : null; return m2 && m2[1].split(/\s+/).length >= 3 && m2[2].split(/\s+/).length >= 3 ? [m2[1], m2[2]] : [x]; });
      // each figure says whose it is: "Zillow: 80% adoption, 3,400+ agents created" is cut into "Zillow: 80% adoption" and "Zillow: 3,400+ agents created"
      const lead = (stripped.match(/^([A-Z][A-Za-z0-9.&' -]{1,40}?):\s/) || [])[1];
      if (parts.length >= 2 && parts.every((x) => /\d/.test(x))) pieces = parts.map((x, i) => (i > 0 && lead && !x.startsWith(lead) ? `${lead}: ${x}` : x));
      else pieces = [stripped];
    }
    for (const p of pieces) {
      const s = sig(p);
      const key = s || p.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (seen.has(key)) continue;
      seen.add(key);
      let kind = it.kind;
      if (kind === 'recognition' && /["“'‘][^"”'’]{20,}["”'’]/.test(p)) kind = 'quote';
      else if (kind !== 'quote' && kind !== 'recognition' && /\b(?:partner of the year|award|winner|ranked|recogni[sz]ed|certified|named a|visionary|magic quadrant|forrester|gartner|idc\b|g2\b)/i.test(p) && !/\d\s?%/.test(p)) kind = 'recognition';
      out.push({ text: p.replace(/[.]+$/, '').trim(), kind, label: it.label, src: sourceOf(it.label), item: it, score: overlap(p, rank) });
    }
  }
  return out;
}

const QUOTE_BODY = /^["“'‘](.+?)["”'’]\.?$/s;
function quoteParts(text: string): { who: string; about: string; quote: string; direct: boolean } {
  let m = text.match(/^(?:customer\s+)?(?:quote|words)\s+(?:from|by)\s+([^:]+?):\s*(.+)$/i);
  let who = '', rest = '';
  if (m) { who = m[1]; rest = m[2]; }
  else if ((m = text.match(/^(?:a |one )?customer(?: named)?\s+(.+?)\s+(?:says?|said)\s*:?\s*(.+)$/i))) { who = m[1]; rest = m[2]; }
  else if ((m = text.match(/^([^:"“]{3,80}):\s*(["“'‘].+)$/))) { who = m[1]; rest = m[2]; }
  else rest = text;
  const [w, about] = who.split(/,\s+on\s+/);
  const body = rest.trim();
  const qm = body.match(QUOTE_BODY);
  return { who: (w || '').trim(), about: (about || '').trim(), quote: (qm ? qm[1] : body).trim(), direct: !!qm };
}

export function buildEmailSequence(args: Record<string, unknown>, D: Deps, footer: string, sectorBlock: (v: Vertical | null) => string): string {
  const sequenceType = (args.sequence_type as string) || 'cold_outreach';
  const personaRaw = ((args.target_persona as string) || '').trim();
  const persona = isNotGiven(personaRaw) ? '' : personaRaw;
  const industry = ((args.target_industry as string) || '').trim();
  const solution = ((args.your_solution as string) || '').trim();
  const valueText = ((args.key_value_prop as string) || '').trim();
  const painText = ((args.specific_pain_point as string) || '').trim();
  const proofText = ((args.social_proof as string) || '').trim();
  const ctaIn = ((args.call_to_action as string) || '').trim();
  const tone = (args.tone as string) || 'professional';
  const senderIn = ((args.sender_context as string) || '').trim();

  const ctx = readSector(undefined, { seller: [solution], context: [valueText, painText], role: [persona], buyer: [industry] });
  const P = productOf(solution, D);
  const v = ctx.v;
  const investment = ctx.model === 'investment';
  const sellerSw = !!v && v.id === 'saas' && !/software|saas|technology|internet|app\b/i.test(industry);
  const vv = v && !sellerSw ? v : null;
  const fam = persona ? familyOf(persona, investment) : 'other';
  const lvl = persona ? levelOf(persona) : 'staff';
  const rk = roleFor(persona || 'stakeholder', investment);
  const technical = ['engineering', 'it', 'security', 'data'].includes(fam);
  const senior = lvl === 'exec' || lvl === 'head';
  const indLow = industry ? D.lower(industry) : '';
  // the industry is not said twice when the persona already holds it ("founders at startups" in "startups")
  const indInPersona = !!indLow && persona.toLowerCase().includes(indLow);
  const inIndSubj = indLow && !indInPersona && indLow.length <= 24 ? (/(?:ers|ors|ists|ants)$/i.test(indLow) ? ` at ${indLow}` : ` in ${indLow}`) : '';
  const inInd = indLow && !indInPersona ? (/(?:ers|ors|ists|ants)$/i.test(indLow) ? ` at ${indLow}` : ` in ${indLow}`) : '';
  const anOf = (w: string) => `${/^(?:[aeiou]|8\b|8\d|11|18)/i.test(w.trim()) ? 'an' : 'a'} ${w.trim()}`;
  const name = P.name || P.ref;

  // ---- the pain, in clauses used once each ----
  const atomsP = painAtoms(painText);
  let pi = 0;
  const nextPain = (): string => atomsP[pi++] || '';
  // a clause with no verb of its own ("no single view of ...", "too many tools", "slow setup") is introduced, never used as an opening line
  const fragment = (a: string): boolean => (/^(?:\d|[a-z]+ing\b)/i.test(a) && !/^(?:when|if|while|as)\b/i.test(a)) || /^(?:no|not|lack|lacking|too|poor|slow|manual|high|low|limited|missing|weak|siloed|disconnected|fragmented|rising|growing|long|late|costly|expensive|inefficient|outdated|legacy|dependence|reliance)\b/i.test(a);
  const painStatement = (a: string): string => (fragment(a) ? endSentence(`The problem in short${inInd ? ` for people${inInd}` : ''}: ${a}`) : endSentence(sentenceCase(a)));
  const painRef = (a: string): string => `“${clip(a, 110)}”`;

  // ---- the product ----
  const parts = partsIn(P);
  const painAndValue = `${painText} ${valueText}`;
  const nearAll = parts.map((x, i) => ({ x, i, n: overlap(x, painAndValue) })).filter((o) => o.n > 0).sort((a, b) => b.n - a.n || a.i - b.i).map((o) => o.x);
  // a part that is a cut piece of a longer item ("one setup for local" from "one setup for local, regional and global payment methods") is never a topic
  const cleanPart = (x: string): boolean => x.length <= 28 && !/^(?:one|two|three|single|all|any|every)\b/i.test(x) && !/\b(?:for|to|of|with|and|or|the|a|an|on|in|local|regional|global|national|domestic|international|digital|cloud|secure|unified|single)$/i.test(x);
  const nearClean = nearAll.filter((x) => cleanPart(x) && !/\band\b/i.test(x));
  const nearParts = nearClean.length ? nearClean : nearAll.filter((x) => cleanPart(x) || x.length <= 40);
  const kindShort = P.kind ? clip(P.kind.replace(/^(?:a|an|the)\s+/i, '').split(/\s+(?:for|that|which|with|of|covering|including|made)\s+/i)[0], 40) : '';
  const kindTopicRaw = kindShort.replace(/\s+(?:platform|service|services|software|tool|tools|solution|solutions|system|product|products|suite|application|app)$/i, '').trim();
  // the kind is a topic only when it is a short noun phrase of plain words ("CI/CD", "IoT connectivity"), not a run of adjectives ("single API led intelligent")
  const kindTopic = kindTopicRaw.split(/\s+/).length <= 3 && !/\b(?:single|intelligent|led|first|leading|unified|modern|next|new|smart|powerful|complete|connected|global|integrated|end|based|native)\b/i.test(kindTopicRaw) ? kindTopicRaw : '';
  const measuresRanked = vv ? vv.metrics.map((m, i) => ({ m, i, n: overlap(m, `${painText} ${valueText}`) })).sort((a, b) => b.n - a.n || a.i - b.i).map((o) => o.m) : [];
  // a word of the sector's own vocabulary that the user used in the pain (first) or in the value (second) names the topic best
  const stemWords = (t: string): Set<string> => new Set((t.toLowerCase().match(/[a-z]{4,}/g) || []).map((w) => w.slice(0, 5)));
  const vocabHit = (text: string): string => {
    if (!vv) return '';
    const have = stemWords(text);
    let best = ''; let bestN = 0;
    for (const c of [...vv.vocabulary, ...vv.metrics]) {
      const all = (c.toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !/^(?:per|the|and|for|off)$/.test(w));
      const ws = all.map((w) => w.slice(0, 5));
      if (!ws.length) continue;
      const hit = ws.filter((w) => have.has(w)).length;
      if (hit === 0 || hit / ws.length < 0.75 || (ws.length >= 2 && hit < 2)) continue;
      const score = hit * 10 - c.length / 100;
      if (score > bestN) { bestN = score; best = c; }
    }
    if (!best) return '';
    // the user's own plural ("payouts") is kept when the sector word is the singular ("payout")
    const last = (best.toLowerCase().match(/[a-z]+$/) || [''])[0];
    const pl = last && text.toLowerCase().match(new RegExp(`\\b${last}(?:s|es)\\b`));
    return pl ? best.replace(new RegExp(`${last}$`, 'i'), pl[0]) : best;
  };
  // the words before the first verb of the first pain clause ("selling across MENA", "phishing and scam messages")
  const painSubject = (): string => {
    const a = (painAtoms(painText)[0] || '').replace(/^(?:when|if|because|as|while|no|most|many|the|our|their)\s+/i, '');
    const m = a.match(VERB);
    const head = (m && m.index ? a.slice(0, m.index) : a).trim().split(/\s+/).slice(0, 5).join(' ').replace(/[,;:]+$/, '');
    const generic = /^(?:processes|things|people|teams|companies|costs|businesses|organi[sz]ations|enterprises|customers|users|it|they|this|that|work|data|tools|systems)$/i.test(head);
    return head.length >= 5 && (head.split(/\s+/).length >= 2 || head.length >= 7) && !generic && !/\d/.test(head) && !/\b(?:and|or|of|the|a|an|to|for|with)$/i.test(head) ? head : '';
  };
  const topic = vocabHit(painText) || painSubject() || vocabHit(valueText) || nearParts.find((x) => cleanPart(x)) || kindTopic || measuresRanked[0] || 'this problem';
  const whatIs = isKind(P, D) ? endSentence(isKind(P, D)) : '';
  const covers = nearParts.length ? endSentence(`${whatIs ? 'It' : name} covers ${nearParts.length > 3 ? `${nearParts.slice(0, 3).join(', ')} and more` : joinList(nearParts)}`) : '';

  // ---- the value: the aim, and the figures that came with it ----
  const valueItems = listItems(valueText).map((x) => parseProof(x)[0] || { text: x, label: '', kind: 'story' as const });
  const mainItem = valueItems.find((x) => !x.label) || valueItems[0];
  const aim = (mainItem?.text || '').replace(/[.]+$/, '').trim();
  const aimSrc = mainItem ? sourceOf(mainItem.label) : sourceOf('');
  const aimLine = aim ? endSentence(aimSrc.type === 'page' ? `On its own site, ${name} puts the aim this way: ${aim}${aimSrc.basis ? ` (${aimSrc.basis})` : ''}` : `What we aim for with ${name}: ${aim}`) : '';
  const valueClaims = valueItems.filter((x) => x.label && x !== mainItem);

  // ---- the proof: split into atoms, ranked for this reader, each used once ----
  const proofItems = parseProof(proofText);
  const rank = `${painText} ${persona} ${industry} ${(vv?.metrics || []).join(' ')}`;
  const bag0 = [...proofItems, ...valueClaims];
  const bag = atomsOf(bag0, rank);
  const usedItems: ProofItem[] = [];
  const usedNow = (a: Atom) => { if (!usedItems.includes(a.item)) usedItems.push(a.item); };
  const take = (kinds: ProofItem['kind'][], n: number): Atom[] => {
    const out: Atom[] = [];
    for (const k of kinds) {
      for (const a of bag.filter((x) => x.kind === k).sort((x, y) => y.score - x.score)) { if (out.length < n) { out.push(a); bag.splice(bag.indexOf(a), 1); } }
    }
    out.forEach(usedNow);
    return out;
  };
  const lowerKeep = (t: string): string => (P.name && t.toLowerCase().startsWith(P.name.toLowerCase()) ? t : D.isCommon((t.split(/\s+/)[0] || '').replace(/[,:;]+$/, '')) ? D.lower(t) : t);
  let siteUses = 0;
  const siteLead = (): string => { const k = siteUses++ % 3; const who = P.name ? (/s$/i.test(P.name) ? `${P.name}'` : `${P.name}'s`) : 'The company\'s'; return k === 0 ? `${who} own site reports:` : k === 1 ? `On its own site, ${P.name || 'the company'} lists:` : `According to ${who} own site:`; };
  const one = (a: Atom): string => {
    const t = a.text;
    if (a.kind === 'recognition') {
      if (/^named\b/i.test(t)) return endSentence(`${name} was ${lowerKeep(t)}`);
      if (/^certified\b/i.test(t)) return endSentence(`${name} is ${lowerKeep(t)}`);
      return P.name && t.toLowerCase().startsWith(P.name.toLowerCase()) ? endSentence(t) : endSentence(`Recognition: ${t}`);
    }
    if (a.src.type === 'quote' || a.kind === 'quote') {
      const q = quoteParts(t);
      if (!q.direct) return endSentence(sentenceCase(t.replace(/^(?:customer\s+)?(?:quote|words)\s+(?:from|by)\s+/i, '')));
      const spoken = /[.?!]$/.test(q.quote) ? q.quote : `${q.quote}.`;
      return q.who ? `In the words of ${q.who}${q.about ? `, on ${q.about}` : ''}: “${spoken}”` : `One customer put it this way: “${spoken}”`;
    }
    if (a.src.type === 'title') return endSentence(`One ${name} case study carries the title “${t}”`);
    if (a.src.type === 'other') return endSentence(`${sentenceCase(t)} (${a.label})`);
    // a phrase typed in small letters is a fragment, not a sentence: it gets a lead-in and keeps its words as typed
    return /^[a-z]/.test(t) && !/^[a-z]+[A-Z]/.test(t) ? endSentence(`${a.kind === 'story' ? 'One example' : 'On record'}: ${t}`) : endSentence(sentenceCase(t));
  };
  // facts that share a source are said together once ("X's own site reports: a; b (basis)"), never one sentence each with the same lead
  const facts = (as: Atom[]): string => {
    const out: string[] = [];
    const pageGroups = new Map<string, Atom[]>();
    for (const a of as) if (a.src.type === 'page' && a.kind !== 'recognition' && a.kind !== 'quote') pageGroups.set(`${bag0.indexOf(a.item)}|${a.label}`, [...(pageGroups.get(`${bag0.indexOf(a.item)}|${a.label}`) || []), a]);
    for (const g of pageGroups.values()) out.push(endSentence(`${siteLead()} ${g.map((x) => lowerKeep(x.text)).join('; ')}${g[0].src.basis ? ` (${g[0].src.basis})` : ''}`));
    const rest2 = as.filter((a) => !(a.src.type === 'page' && a.kind !== 'recognition' && a.kind !== 'quote'));
    const quotes = rest2.filter((a) => a.kind === 'quote' || a.src.type === 'quote');
    const others = rest2.filter((a) => !quotes.includes(a));
    if (others.length) out.push(others.map(one).join(' '));
    for (const q of quotes) out.push(one(q));
    return out.join('\n\n');
  };

  // ---- the people and the questions ----
  const otherRoles = vv ? vv.buyerRoles.filter((r) => !/\b(?:the (?:function|team|process|business function|contractor|service business|property management company)|who uses|that uses|that answers|the agent|the AI|who manages|department head)\b/i.test(r) && familyOf(r, investment) !== fam && !['risk', 'procurement'].includes(familyOf(r, investment))).sort((x, y) => Number(/ or /.test(x)) - Number(/ or /.test(y))).slice(0, 2).map((r) => r.replace(/\b([A-Z])([a-z]+)\b/g, (_m, a, b) => `${a.toLowerCase()}${b}`)) : [];
  // a user is spoken to as someone who works in the field every day; a practitioner persona ("developers who integrate the SMS API") is named as typed
  const isUser = /\buser\b/i.test(persona);
  const practitioner = !isUser && !senior && !!persona && (/\b(?:developers?|engineers?|analysts?|agents|admins?|administrators?|teams|specialists|operators|managers)\b/i.test(persona) || /s$/i.test(persona.trim()));
  const famWord = fam === 'it' ? 'IT' : fam === 'other' ? 'this field' : fam;
  // role questions are written for one kind of work: operations questions belong to physical operations, and a question that names a way of charging, shipping or renewing only fits a seller whose own words use it
  const ownWords = `${solution} ${valueText} ${painText} ${proofText}`;
  const MOTION = /\b(?:charg\w+|pric\w+|billing|invoic\w+|ship\w*|subscription\w*|renewal\w*|before value|sign-?up|free trial|paywall)\b/i;
  const motionFit = (x: string): boolean => { const m = x.match(MOTION); return !m || new RegExp(`\\b${m[0].replace(/\w+$/, (w) => w.slice(0, Math.max(4, w.length - 2)))}`, 'i').test(ownWords); };
  const opsFit = fam !== 'operations' || !vv || ['logistics-tech', 'ites', 'vertical-saas'].includes(vv.id);
  let roleQs = persona && opsFit ? rk.questions.filter((x) => !/\bthat\b/i.test(x) && motionFit(x)) : [];
  const sectorQs = vv ? vv.discovery.filter(motionFit) : roleQs;
  const qPool = [...(technical || practitioner || !opsFit ? sectorQs : roleQs), ...(technical || practitioner || !opsFit ? roleQs : sectorQs)].filter((x, i, a) => a.indexOf(x) === i);
  let qi = 0;
  const nextQ = (): string => qPool.length ? qPool[qi++ % qPool.length] : '';
  const freshQ = (): string => (qi < qPool.length ? qPool[qi++] : '');
  const measures = vv ? vv.metrics.map((m, i) => ({ m, i, n: overlap(m, `${painText} ${aim}`) })).sort((a, b) => b.n - a.n || a.i - b.i).slice(0, 3).map((o) => o.m) : [];
  const personaPlain = D.lower(persona).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const careLine = isUser ? endSentence(`For someone who works in ${famWord} every day, the test of a change is whether it makes the day's work quicker and easier to record`)
    : practitioner && personaPlain.length <= 80 ? endSentence(`For ${personaPlain}, the test of a change is whether it fits the tools and the work already in place`)
    : persona && rk.label !== 'stakeholder' && opsFit ? endSentence(`For ${anOf(rk.label)}, what usually matters is ${rk.cares}`) : '';
  const measuresLine = measures.length ? endSentence(`The measures${inInd ? ` ${inInd.trim()}` : ''} that usually show whether this is working are ${joinList(measures)}`) : '';
  const roleLead = isUser ? ` to someone who works in ${famWord} every day` : practitioner && personaPlain.length <= 80 ? ` to ${/s\b/i.test(personaPlain.split(/\s+/)[0]) || /s$/i.test(personaPlain.split(/\s+(?:who|that|at|in|of)\s+/)[0]) ? '' : 'a '}${personaPlain}` : persona && rk.label !== 'stakeholder' && opsFit ? ` to ${anOf(rk.label)}` : '';
  const qLead = (q: string): string => (q ? `The question that usually decides whether a change like this matters${roleLead} is this: ${q}` : '');
  const objs = vv ? vv.objections.slice(0, 2) : [];
  const toYou = (t: string) => t.replace(/on the buyer side/gi, 'on your side').replace(/the buyer's/gi, 'your').replace(/the buyer/gi, 'your team');
  const objPara = (o: { objection: string; response: string }, i: number): string => endSentence(`${i === 0 ? 'A concern worth naming before you raise it' : 'Another'}: ${D.lower(o.objection).replace(/[.]+$/, '')}. We would ${toYou(D.lower(o.response)).replace(/[.]+$/, '')}`);

  // ---- tone, sender, ask ----
  const hello = tone === 'casual' ? 'Hi,' : 'Hello,';
  const closing = ({ professional: 'Regards,', casual: 'Thanks,', urgent: 'Regards,', consultative: 'Best regards,', provocative: 'Regards,' } as Record<string, string>)[tone] || 'Regards,';
  const senderLine = senderIn || `The ${name} team`;
  const sig = `${closing}\n${senderLine}`;
  const ctaRaw = (ctaIn || 'short call').replace(/[.?!]+$/, '');
  const ctaVerb = /^(book|see|join|register|reply|try|get|schedule|watch|read|download|start|meet|talk|chat|review|attend|visit|sign|take)\b/i.test(ctaRaw);
  const ctaText = ctaVerb ? D.lower(ctaRaw) : (/^(a|an|the|one|our|my)\b/i.test(ctaRaw) ? D.lower(ctaRaw) : anOf(D.lower(ctaRaw)));
  const WHEN = tone === 'urgent' ? ['this week', 'early next week', 'by the end of next week', 'this month'] : ['next week', 'in the next two weeks', 'later this month', 'at a time that suits you'];
  const ask = (i: number): string => {
    const when = WHEN[i % WHEN.length];
    if (ctaVerb) {
      if (tone === 'casual') return `Want to ${ctaText} ${when}?`;
      if (tone === 'urgent') return `Can we ${ctaText} ${when}?`;
      if (tone === 'provocative') return `If I am wrong, it costs little to ${ctaText} and find out. ${upperFirst(when)}?`;
      if (tone === 'professional') return `I would welcome the chance to ${ctaText} ${when}.`;
      return `Would you like to ${ctaText} ${when}?`;
    }
    if (tone === 'casual') return `Up for ${ctaText} ${when}?`;
    if (tone === 'urgent') return `Can we fit in ${ctaText} ${when}?`;
    if (tone === 'provocative') return `If I am wrong about this, ${ctaText} will show it quickly. ${upperFirst(when)}?`;
    if (tone === 'professional') return `I would welcome ${ctaText} ${when}.`;
    return `Would ${ctaText} ${when} be a useful way to look at this?`;
  };

  // ---- the emails ----
  const emails: string[] = [];
  const seenSentences = new Set<string>();
  const mail = (day: string, title: string, subject: string, paras: string[]) => {
    const n = emails.length + 1;
    const seenQ = new Set<string>();
    const kept = dropRepeats(paras.filter(Boolean).filter((x) => { const k = x.split(': ').pop() || x; if (/\?$/.test(k)) { if (seenQ.has(k)) return false; seenQ.add(k); } return true; }), seenSentences);
    emails.push(`### Email ${n}: ${title}${day ? ` (${day})` : ''}\n\n**Subject:** ${clip(subject, 70)}\n\n**Body:**\n\n${hello}\n\n${kept.join('\n\n')}\n\n${sig}`);
  };
  const rest = (n = 3): string => { const r = bag.splice(0, n); r.forEach(usedNow); return r.length ? facts(r) : ''; };
  const lateRecognition = (): Atom[] => take(['recognition'], 1);
  const subjPain = (a: string, fallback: string): string => (a && clauseLike(a) && a.length <= 60 ? sentenceCase(a) : fallback);
  const openPain = (): string => {
    const a = nextPain();
    if (!a) return `I am writing${inInd ? ` to people${inInd}` : ''} about ${topic}.${nextQ() ? ` ${nextQ()}` : ''}`;
    return tone === 'provocative' ? `A direct question: ${painRef(a)} Is that true on your side?` : painStatement(a);
  };
  const stayWith = (a: string): string => (a ? `I have written a few times about ${painRef(a)}` : `I have written a few times about ${topic}`);

  const builders: Record<string, () => void> = {
    cold_outreach: () => {
      const first = atomsP[0] || '';
      mail('Day 1', 'Opening', subjPain(first, `A question on ${topic}`), [openPain(), [whatIs, covers].filter(Boolean).join(' '), aimLine, technical || practitioner ? endSentence(`A question to start with: ${nextQ()}`) : '', ask(0)]);
      const r2 = take(technical ? ['result', 'scale', 'story'] : ['result', 'scale'], 2);
      mail('Day 3', 'Result and question', r2.length ? `A result on ${topic}` : `One question on ${topic}`, [r2.length ? facts(r2) : measuresLine, qLead(nextQ()), ask(1)]);
      const r3 = take(['quote', 'story'], 2);
      const p2 = nextPain();
      const p3 = nextPain();
      mail('Day 7', r3.some((x) => x.kind === 'quote') ? 'In a customer\'s words' : r3.length ? 'An example' : 'Another angle', r3.some((x) => x.kind === 'quote') ? `What a customer said about ${topic}` : r3.length ? `An example on ${topic}` : `${upperFirst(topic)} on the ground`, [
        r3.length ? facts(r3) : measuresLine,
        p2 ? `${clauseLike(p2) ? `The second part of the problem: ${p2}.` : `The second part of the problem is this: ${p2}.`}${p3 ? ` And a third part: ${p3}.` : ''}` : (r3.length ? '' : endSentence(`A question from the same place: ${nextQ()}`)),
        !r3.length && p2 ? qLead(nextQ()) : '',
        nearParts[0] ? endSentence(`Within ${name}, the part that speaks to this is ${nearParts[0]}`) : '',
        ask(2)]);
      const roles = otherRoles.length ? andList(otherRoles.map((r) => `your ${r}`), 'or') : '';
      mail('Day 12', senior ? 'Who else?' : 'Right person?', senior ? `Who should look at ${topic} with you?` : `Who looks after ${topic}${inIndSubj}?`, [
        `I have written a few times about ${atomsP[0] && atomsP[0].length <= 120 ? `“${atomsP[0]}”` : topic} and have not heard back, so I will ask plainly: ${senior ? `is there someone on your side${roles ? `, for example ${roles},` : ''} who should look at this with you, or is it better left for now?` : `is this yours, or does it sit with someone else${roles ? `, for example ${roles}` : ''}?`}`,
        `If the problem is real but the timing is wrong, tell me which quarter suits you and I will come back then.`]);
      const r5 = lateRecognition();
      const leftover = rest(3);
      mail('Day 17', 'Questions to keep', `Questions on ${topic}${inIndSubj}`, [
        `This is my last note. Here are the questions to ask before changing how you handle ${topic}, useful even if we never speak:\n${(() => { const f = [freshQ(), freshQ(), freshQ()].filter(Boolean); if (!f.length) f.push(nextQ()); return f.filter((x, i, a) => x && a.indexOf(x) === i).map((x, i) => `${i + 1}. ${x}`).join('\n'); })()}`,
        r5.length ? facts(r5) : '', leftover,
        `If you want to talk any of it through, reply and I will make the time for ${ctaText}.`]);
    },
    warm_follow_up: () => {
      const a1 = nextPain();
      mail('same day or next morning', 'After the call', `Next step on ${topic}`, [
        a1 ? `Thank you for the conversation. What I took from it: ${a1}.` : `Thank you for the conversation about ${topic}.`,
        [whatIs, aimLine].filter(Boolean).join(' '),
        `The next step I would suggest is simple. ${ask(0)}`]);
      const r2 = take(['result', 'scale'], 2);
      mail('Day 3', 'Something useful', `For ${persona && rk.label !== 'stakeholder' ? anOf(rk.label) : 'your team'}: ${measures[0] || topic}`, [
        nextPain() ? `We also touched on this: ${atomsP[pi - 1]}.` : '', endSentence(`One question I have been thinking about since we spoke: ${nextQ()}`), measuresLine, r2.length ? facts(r2) : '']);
      const r3 = take(['quote', 'story', 'recognition'], 2);
      mail('Day 7', 'Checking in', `Checking in on ${topic}`, [
        r3.length ? facts(r3) : endSentence(`A question I would put to your own team: ${nextQ()}`), rest(), r3.length ? careLine : measuresLine, r3.length ? '' : aimLine, ask(1)]);
    },
    post_demo: () => {
      mail('same day', 'Thank you', `Thank you for the demo of ${name}`, [
        `Thank you for the time today. You saw ${name}${nearParts.length ? `, which covers ${nearParts.length > 3 ? `${nearParts.slice(0, 3).join(', ')} and more` : joinList(nearParts)}` : ''}.`,
        atomsP[0] ? `The problem we set out to address: ${atomsP[0]}.` : '', aimLine,
        `If anything about ${topic} was unclear after the demo, send me the question and I will answer it in writing.`]);
      mail('Day 2', 'Likely concerns', objs[0] ? `Before you decide: ${D.lower(objs[0].objection).replace(/[.]+$/, '')}` : `Questions after the demo of ${name}`, [
        objs.length ? objs.map((o, i) => objPara(o, i)).join('\n\n') : endSentence(`A question to settle before you decide: ${nextQ()}`), ask(1)]);
      const r3 = take(['quote', 'story', 'result'], 2);
      mail('Day 5', 'Team material', otherRoles[0] ? `For your ${otherRoles[0]}: ${topic}` : `Material for your team on ${topic}`, [
        `As you take ${name} to the people on your side${otherRoles.length ? `, such as your ${joinList(otherRoles)}` : ''}, I can prepare what each one will ask about.${measures[0] ? ` ${upperFirst(measures[0])} is usually where people start.` : ''}`,
        r3.length ? facts(r3) : '']);
      const r4 = take(['recognition', 'scale', 'result'], 1);
      mail('Day 10', 'Next step', `Next step on ${name}`, [
        `I would like to agree the next step with you. ${ask(2)}`, r4.length ? facts(r4) : '', rest(),
        `If budget or timing holds ${name} back, tell me which and I will plan around it.`]);
    },
    re_engagement: () => {
      const a1 = nextPain();
      mail('', 'Still a problem?', a1 && a1.length <= 60 && clauseLike(a1) ? `Is this still true: ${D.lower(a1)}?` : `Is ${topic} still on your list?`, [
        a1 ? `When we last spoke, the problem was this: ${a1}.` : `When we last spoke, ${topic} was on the table.`,
        `I do not know what has changed on your side since, so I will ask: has it become more of a priority, less, or has someone else taken it on${otherRoles.length ? ` (for example your ${joinList(otherRoles, 'or')})` : ''}?`, ask(0)]);
      const r2 = take(['result', 'scale', 'quote', 'story'], 2);
      mail('', 'What is new', `What ${name} has to show on ${topic}`, [r2.length ? facts(r2) : endSentence(`A question while you think about it: ${nextQ()}`), aimLine]);
      const r3 = take(['recognition'], 1);
      mail('', 'A direct question', `Close the loop on ${topic}?`, [
        `I do not want to keep writing if ${topic} is off your list. Is it still something you are working on, or should I check back at a different time?`, r3.length ? facts(r3) : '', rest(), ask(2)]);
    },
    proposal_follow_up: () => {
      mail('Day 1', 'The proposal', `Your proposal for ${topic}`, [
        `I have sent the proposal for ${name}${inInd ? `, written for people${inInd}` : ''}. ${atomsP[0] ? `It starts from the problem you described: ${atomsP[0]}.` : `It starts from ${topic}.`}`,
        [whatIs, covers].filter(Boolean).join(' '), aimLine,
        `${ask(0)} I would walk through it section by section and take your questions as we go.`]);
      mail('Day 3', 'Questions', objs[0] ? `On the proposal: ${D.lower(objs[0].objection).replace(/[.]+$/, '')}` : `Questions on the proposal for ${topic}`, [
        objs.length ? objs.map((o, i) => objPara(o, i)).join('\n\n') : '', endSentence(`One question for whoever reviews it: ${nextQ()}`), measuresLine,
        !objs.length && atomsP[1] ? `The second part of the problem, which the proposal also covers: ${atomsP[1]}.` : '']);
      const r3 = take(['result', 'quote', 'story', 'scale'], 2);
      mail('Day 7', 'Reviewers', otherRoles[0] ? `Who else reviews the proposal: your ${otherRoles[0]}?` : `Evidence for the proposal on ${topic}`, [
        r3.length ? facts(r3) : [whatIs, aimLine].filter(Boolean).join(' '),
        otherRoles.length ? `Who on your side besides you reviews it: your ${joinList(otherRoles, 'or')}? I can prepare a short version for each.` : `Who on your side besides you reviews it? I can prepare a short version for each.`]);
      const r4 = take(['recognition'], 1);
      mail('Day 12', 'Decision', `Where the proposal for ${name} stands`, [
        `I would like to know where the proposal stands. What has to happen on your side before a decision on ${name}, and by when?`,
        endSentence(`A question to settle before a decision: ${nextQ()}`), r4.length ? facts(r4) : '', rest(), ask(1)]);
    },
    nurture: () => {
      const a1 = nextPain();
      mail('Week 1', 'The problem', `How to look at ${topic}`, [
        a1 ? `This note is about one problem: ${a1}.` : `This note is about ${topic}.`, measuresLine, endSentence(`A question to start with: ${nextQ()}`)]);
      mail('Week 2', 'One part', nearParts[0] ? `${upperFirst(nearParts[0])}: what it does` : `What ${name} does`, [
        [whatIs, covers].filter(Boolean).join(' '), nearParts[0] ? `For the problem above, ${nearParts[0]} is the part to look at first.` : '', aimLine, endSentence(`A question for you: ${nextQ()}`)]);
      const r3 = take(['result', 'quote', 'story', 'scale'], 2);
      mail('Week 4', 'A customer', r3.length ? `What a customer saw on ${topic}` : `${upperFirst(topic)} for people${inInd}`, [
        r3.length ? facts(r3) : [careLine, measuresLine].filter(Boolean).join(' '), nextPain() ? `The other half of the problem: ${atomsP[pi - 1]}.` : '', r3.length ? '' : aimLine, endSentence(`A question for you: ${nextQ()}`)]);
      const r4 = take(['recognition'], 1);
      mail('Week 6', 'An open door', `If ${topic} is on your list`, [
        `If ${topic} is on your list, ${ctaVerb ? `you can ${ctaText}` : `I am happy to set up ${ctaText}`} at a time that suits you.`, r4.length ? facts(r4) : '', rest(), endSentence(`A last question: ${nextQ()}`)]);
    },
    event_follow_up: () => {
      const a1 = nextPain();
      mail('next day', 'After the event', `Good to meet you at the event: ${topic}`, [
        a1 ? `It was good to meet you at the event. The problem I wanted to follow up on: ${a1}.` : `It was good to meet you at the event. I wanted to follow up on ${topic}.`,
        [whatIs, aimLine].filter(Boolean).join(' '), ask(0)]);
      const r2 = take(['result', 'scale', 'quote', 'story'], 2);
      mail('Day 4', 'Follow-up', `Following the event: ${topic}`, [r2.length ? facts(r2) : [measuresLine, endSentence(`A question for you: ${nextQ()}`)].filter(Boolean).join(' '), covers, !r2.length && nextPain() ? `The second part of the problem: ${atomsP[pi - 1]}.` : careLine]);
      const r3 = take(['recognition'], 1);
      mail('Day 9', 'A direct ask', `Still worth ${ctaVerb ? 'a conversation' : ctaText}?`, [
        `I met a lot of people at the event and I would rather ask than guess: is ${topic} something you are working on?`, r3.length ? facts(r3) : '', rest(), ask(1)]);
    },
    referral_request: () => {
      mail('Day 1', 'Introduction', `An introduction on ${topic}?`, [
        `I am looking to speak with people${inInd} about ${atomsP[0] ? painRef(atomsP[0]) : topic}.`,
        `Is that you, or is there someone you would point me to${otherRoles.length ? `, perhaps your ${joinList(otherRoles, 'or')}` : ''}?`,
        `I would ask them for ${ctaText}, nothing more.`]);
      const r2 = take(['result', 'scale', 'quote', 'story'], 1);
      mail('Day 4', 'A note to forward', `A note to forward on ${topic}`, [
        `Here are a few lines about ${name} that you can forward as they are.`,
        [whatIs, aimLine, atomsP[0] ? `The problem it starts from: ${atomsP[0]}.` : '', r2.length ? facts(r2) : ''].filter(Boolean).join(' '),
        `They can reply to me directly for ${ctaText}.`]);
      const r3 = take(['recognition', 'quote', 'story', 'result', 'scale'], 1);
      mail('Day 9', 'Last ask', `Thank you, and one last ask on ${topic}`, [
        `If nobody comes to mind for ${topic}, a one-line reply saying so helps me too.`, r3.length ? facts(r3) : '', rest(),
        `And if you are the right person after all: ${ask(2)}`]);
    },
  };

  const build = builders[sequenceType];
  if (!build) return `Sequence type '${sequenceType}' not recognized. Available sequence types: ${Object.keys(builders).join(', ')}`;
  build();

  // ---- what the sender checks, then what was not given (once, at the end) ----
  const checks: string[] = [`Add the recipient's name after "${hello.replace(',', '')}" if you have it; the emails do not guess it.`];
  if (sequenceType === 'event_follow_up') checks.push('Name the event in email 1; the emails do not guess it.');
  const everyItem = [...(mainItem && mainItem.label ? [mainItem] : []), ...proofItems, ...valueClaims].filter((x, i, a) => a.indexOf(x) === i);
  if (everyItem.length) checks.push(`Check these before sending. Each is used as you gave it, with the source it came with:\n${everyItem.map((p) => `- ${proofPhrase(p)} (${p.label || 'as you gave it'})${usedItems.includes(p) || bag.every((b2) => b2.item !== p) ? '' : ' (not used in these emails: add it where it fits)'}`).join('\n')}`);
  const sharpen: string[] = [];
  if (!persona) sharpen.push('`target_persona` (a role): it would change the questions and the worries in the emails from general ones to those of that role, and the subject lines to suit it.');
  if (!industry) sharpen.push('`target_industry`: it would change the emails from the persona alone to the sector\'s own roles and measures.');
  if (!painText) sharpen.push('`specific_pain_point`: it would change email 1 from a question about the topic to the problem in your words, and give email 3 a second angle.');
  if (!valueText) sharpen.push('`key_value_prop`: it would change the emails from saying what the product is to saying what you aim for.');
  if (!proofText) sharpen.push('`social_proof` (a result, a customer quote or an award you may name): it would change emails 2, 3 and 5 from questions to quoted evidence; without it no email quotes a result or a customer.');
  if (!ctaIn) sharpen.push('`call_to_action`: it would change the ask from a short call to your own wording.');
  if (!senderIn) sharpen.push(`\`sender_context\` (your name and role): it would change the signature from "The ${name} team" to you.`);
  const sharpenBlock = sharpen.length ? `\n\n## To sharpen this, give:\n\nWhat was not given, and what each input would change:\n\n${sharpen.map((x) => `- ${x}`).join('\n')}` : '';

  const fixed = EMAIL_COUNTS[sequenceType] || emails.length;
  const emailsText = args.num_emails !== undefined && args.num_emails !== null && args.num_emails !== '' ? (args.num_emails as number).toLocaleString('en-US') : `${fixed}`;
  const fixedNote = args.num_emails !== undefined && args.num_emails !== null && args.num_emails !== '' ? `\n*This sequence type has ${fixed} emails and num_emails is not used yet: add or remove emails to match the number you need.*` : '';
  const notes = ctx.v ? `\n\n---\n\n${sellerSw ? `### Sector notes: ${ctx.v.name}\n- The notes for this sector describe a software company's own customers, so they are left out for a buyer${indLow ? ` in ${indLow}` : ' in another industry'}.` : sectorBlock(ctx.v)}` : '';
  const solutionLine = solution.length <= 160 ? solution : P.label || clip(solution, 120);
  return `# ${TITLES[sequenceType] || sequenceType} Sequence

## Target: ${persona ? `${persona}${indLow && !indInPersona ? ` in ${indLow}` : ''}` : indLow ? `buyers in ${indLow}` : 'not given'}
## Solution: ${solutionLine}
## Tone: ${tone}
## Emails: ${emailsText}${fixedNote}

${emails.join('\n\n---\n\n')}

---

## Before you send

${checks.join('\n\n')}${notes}${sharpenBlock}

${footer}`;
}
