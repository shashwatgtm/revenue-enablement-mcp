// Run 22 (writer rev-w3): competitive_trap_setter, rewritten. The competitor is read first: a named vendor, a kind of tool, or a way of working
// ("do nothing", "spreadsheets", "hire more people", "buying and maintaining devices"). A way of working or a kind of tool never gets vendor
// wording (no contract, references, support desk, renewal terms, "the vendor"); its questions are about how the buyer works today. Every weakness
// becomes a landmine question on its own topic, credentials are mentioned and never made a live test, the priority text is used where it matters
// and not repeated, figures keep their source label, and what is not given is named once at the end with what it would change. Nothing is
// invented about the competitor (B82). Text only: no network, file or environment access.
import { joinList, clip, upperFirst, aAn, splitTopLevel, parseProof } from './dealtext.ts';
import { roleFor } from './answers.ts';
import type { Vertical } from './verticals.ts';
import { readSector, productOf, isKind, partsIn, readAlt, endSentence, andList, type Deps } from './rw-common.ts';

// the one place the helpers below reach the "lower the first word" function that lives in src/index.ts
const lf = { lower: (s: string): string => s, isCommon: (w: string): boolean => false };

export const CRED_RE = /\b(?:named|leader|award|recogni\w+|analyst|quadrant|backed by|inner circle|launch partner|certified|certifications?|iso\s?\d{4,5}|soc ?2|pci|partners? with|partnerships?|trusted by|\d[\d,.+]*\s*(?:years|customers|companies|countries|engineers))\b/i;
// Run 21c (draft rewrite): the answer is a set of landmine questions built from the inputs. Each weakness becomes a question about its
// own topic (a question never quotes the note), each priority a question, each strength a criterion; a strength that answers a weakness
// is shown next to it; the figures keep their source label. Generic coaching lines are gone. Rules are about kinds of input (a charge, a
// limit, a missing capability, a delay, a manual step), never about one company.
// A place name or a possessive at the start of a phrase keeps its capital ("India's most extensive network").
export const TRAP_PLACES = /^(?:India|China|Europe|Africa|Asia|America|Americas|Japan|Germany|France|Britain|Australia|Canada|Brazil|Singapore|Dubai|London|Paris|Tokyo|Mumbai|Delhi|Bengaluru|Berlin|Sydney)(?:'s)?\b/;
export function lowerKeep(t: string): string { const x = t.trim(); return /^[A-Z][a-z]+'s?\b/.test(x) || TRAP_PLACES.test(x) ? x : lf.lower(x); }
// A long strength holds several claims: it is cut where a new claim opens after a comma (never inside a list), so each criterion is short.
export function trapClaims(s: string): string[] {
  const t = s.trim().replace(/[.]+$/, '');
  if (t.length < 110) return [t];
  const out: string[] = [];
  for (const part of t.split(/,\s+(?=(?:on|with|under|built|backed|where|so|plus|and|using|across|from|for|instead|offering|combining|including|covering|delivering|giving|providing|while)\b)/i)) {
    const x = part.trim().replace(/^(?:and|plus)\s+/i, '');
    if (out.length && x.split(/\s+/).length < 4) out[out.length - 1] += `, ${x}`; else if (x) out.push(x);
  }
  return out.slice(0, 4);
}
export const TRAP_METAPHOR = /\b(?:highway|jams?|traffic jam|roadblock|treadmill|maze|jungle|minefield|spaghetti|patchwork|house of cards|duct tape|band-?aid|silver bullet|black hole|rabbit hole|quicksand|hamster wheel|fire-?fighting|firefight\w*)\b/i;
const TRAP_STOP = /^(?:their|which|there|these|those|about|would|could|where|while|other|every|first|still|under|after|before|again)$/;
export function trapWords(s: string): string[] { return s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !TRAP_STOP.test(w)).map((w) => w.slice(0, 5)); }
export function trapShares(a: string, b: string): number { const wb = new Set(trapWords(b)); return trapWords(a).filter((w) => wb.has(w)).length; }
const TRAP_VERBS = new Set('works runs sends handles cleans re-plans replans plans approves connects syncs tracks reads writes shows gives lets keeps moves routes pulls pushes builds checks alerts flags scores matches books bills pays collects captures reports detects blocks stops finds fixes explains learns adapts scales integrates automates covers supports includes offers provides delivers replaces reduces cuts speeds raises loads stores encrypts logs audits signs files posts notifies escalates assigns updates generates predicts prioritises prioritizes validates verifies resolves ranks recommends turns takes brings combines unifies monitors enforces records measures reconciles'.split(' '));
export function trapBase(verb: string): string { return /(?:ss|sh|ch|x)es$/.test(verb) ? verb.slice(0, -2) : /ies$/.test(verb) ? `${verb.slice(0, -3)}y` : verb.replace(/s$/, ''); }
// A strength as a criterion question: a verb phrase ("Works offline ...") becomes "Which of the options work offline ...?"; a noun phrase is shown on a case of the buyer's own.
export function trapCriterion(s: string): string {
  const t = s.trim().replace(/[.]+$/, '');
  const first = (t.split(/\s+/)[0] || '').toLowerCase();
  if (/^(?:on|with|under|across|from|for|where|using)$/.test(first)) return `Which of the options work ${t}?`;
  if (/^(?:offering|providing|giving|delivering|covering|including|combining|built|backed|designed|powered)$/.test(first)) return `Which of the options are ${t}?`;
  if (TRAP_VERBS.has(first)) return `Which of the options ${lowerKeep(t.replace(/^\S+/, trapBase(first)))}?`;
  return `Which of the options can show ${lowerKeep(t)}, on one of your own cases?`;
}
// When a note is a clause whose verb is not one of the kinds below, its topic is found by the words in it and a question about that topic is asked.
const TRAP_TOPICS: { re: RegExp; topic: string; q: string }[] = [
  { re: /setup|set-up|implement|onboard|months|weeks|rollout|go-live|deploy/i, topic: 'the time from signing to the first real result', q: 'How long from signing to the first real result in each option, and what do you need to have ready? Could each show it on your own data?' },
  { re: /manual|human[- ]judged|judg|by hand|spreadsheet|modules and platforms/i, topic: 'which decisions are made by the system and which wait for a person', q: 'Which decisions does each option make by itself and which wait for a person, and how long does each take?' },
  { re: /periodic|batch|scans?|delay|lag|stale|refresh|overnight|real[- ]time/i, topic: 'how soon each option sees a change', q: 'How soon after something changes does each option show it, and what happens in between?' },
  { re: /validat|false positive|theoretical|live entry|real exposure|noise/i, topic: 'telling a real problem from a theoretical one', q: 'How does each option tell a real problem from a theoretical one, and can it show that on your own data?' },
  { re: /financial impact|quantif|cost of a finding|business impact/i, topic: 'putting a cost on a finding', q: 'Can each option express a finding in terms of what it would cost you, and how is that worked out?' },
  { re: /isolated|silo|not connected|point tools?|do not share|disconnected|several consoles|correlat/i, topic: 'whether findings or records connect', q: 'Can each option show how the pieces connect, or does your team join them by hand?' },
  { re: /drift|source of truth|governance|bypass|gates?/i, topic: 'keeping everything in step and enforcing the rules', q: 'How does each option keep specs, documents and tests in step, and where is a rule enforced?' },
  { re: /address|data|integrat|erp|tms|siem|import|sync/i, topic: 'the handling of your own data and the systems it must connect to', q: 'How does each option handle your own data and the systems it must connect to? Could each show it live?' },
  { re: /price|cost|expensive|fee|overage|charge/i, topic: 'the full cost over three years', q: 'What does each option cost over three years, including everything outside the quoted price?' },
  { re: /support|sla|service|response|uptime|outage|repair/i, topic: 'the response to an urgent issue', q: 'What happens in each option when something urgent breaks: who answers, how fast, and what does the contract promise?' },
  { re: /opaque|black box|explain|transparen|report/i, topic: 'how each option explains its decisions', q: 'How does each option explain its decisions and report results you can check yourself?' },
  { re: /scale|volume|slow|performance|latency/i, topic: 'performance at your real volumes', q: 'How does each option perform at your real volumes, and can it show that on your data?' },
  { re: /adopt|use|app|interface|ux|training/i, topic: 'everyday use by the people who will rely on it', q: 'Who uses each option every day, and what do they need to learn before it works for them?' },
];
export function trapIng(verb: string): string { let b = verb.toLowerCase(); if (/ies$/.test(b)) b = `${b.slice(0, -3)}y`; else if (/[^s]s$/.test(b)) b = b.slice(0, -1); return /[^e]e$/.test(b) ? `${b.slice(0, -1)}ing` : `${b}ing`; }
export const TRAP_CLAUSE_VERB = /\b(?:is|are|was|were|become|becomes|became|has|have|had|get|gets|got|stay|stays|remain|remains|accumulates?|falls?|leaves?|leave|lacks?|loses?|lose|breaks?|fails?|failed|misses?|slows?|drops?|struggles?|hides?|locks?|forces?|requires?|takes?|makes?|keeps?|stops?|cannot|can't|never|rely|relies|depends?|tends?|sits?|causes?|creates?|falter|faltered|use|uses|ignores?|skips?|sends?|waits?|differs?|differ|overload\w*|expires?|grows?|grow)\b/i;
const trapPlural = (s: string): boolean => { const h = s.trim().split(/\s+(?:of|for|in|on|at|from|to|with|by)\s+/)[0].trim(); return /[a-z]s$/i.test(h) && !/(?:ss|us|is|ics)$/i.test(h); };
const trapDo = (s: string): string => (trapPlural(s) ? 'do' : 'does');
// A long note holds several claims: it is cut at its commas (a clause that opens with "which", "so" or "because", or is very short, stays with the one before it).
export function trapClauses(wRaw: string): string[] {
  const w = wRaw.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  if (w.length < 90) return [w];
  const merged: string[] = [];
  for (const p of w.split(/,\s+(?:and\s+)?|\s+and\s+(?=to\s)/)) {
    const t = p.trim();
    if (!t) continue;
    if (merged.length && (/^(?:which|so|meaning|leaving|that|while|as|because|but|thereby|making|causing|increasing|slowing|if|even|or|not|with|without|then|yet|although|though|unless|until|since|than|like|such|including|especially|for example)\b/i.test(t) || t.split(/\s+/).length < 3)) { merged[merged.length - 1] += `, ${t}`; continue; }
    merged.push(t);
  }
  return merged.slice(0, 3);
}
// One weak point of the competitor, read by kind: returns the landmine question and the topic it is about. The note is never quoted.
export function trapQuestion(wRaw: string, comp: string): { q: string; topic: string } {
  const esc = comp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let w = wRaw.trim().replace(new RegExp(`^${esc}(?:'s)?\\s+`, 'i'), '').replace(/[.]+$/, '').trim();
  w = lowerKeep(w.replace(/\s*\([^)]*\)/g, '')).replace(/^(?:it|they)\s+/i, '');
  const cons = w.match(/^(.*?)\s*,?\s*\b(?:so|which means|which|meaning|because|leaving|forcing|while)\b\s+(.+)$/i);
  const main = (cons ? cons[1] : w).trim();
  const tail = cons ? cons[2].trim() : '';
  const tailSubj = tail ? (tail.split(/\s+(?:are|is|can|cannot|get|have|has|do|does|will|wait|need|must|end|stay)\b/i)[0].trim()) : '';
  const tailQ = tailSubj && tailSubj.split(/\s+/).length <= 4 ? `, and what does that mean for ${tailSubj}` : '';
  const show = ' Ask the vendor to show it on your own data, not on a slide.';
  let m: RegExpMatchArray | null;
  if ((m = main.match(/^(.+?)\s+(?:stops?|stopped|fails?|failed|breaks?|crashes|crashed|freezes?)\s+(?:working\s+|running\s+)?(?:without|when there is no|when there is not)\s+(.+)$/i)) && m[1].split(/\s+/).length <= 6) return { q: `What happens to ${m[1]} in each option without ${m[2]}, and can it be shown?`, topic: m[1] };
  if ((m = main.match(/^(?:breaks?|fails?|stalls?|stops?|slows? down|falls? over)\s+(?:down\s+)?(?:when|if|as)\s+(.+)$/i))) return { q: `What happens in each option when ${m[1]}?${tailQ ? ` And what does that mean for ${tailSubj}?` : ''} Ask the vendor to show it live.`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:makes?|made|is|are|was|were)?\s*(?:it\s+)?(?:difficult|hard|harder|impossible|a struggle|painful|slow)\s+to\s+(.+)$/i))) return { q: `How easily can you ${m[1].replace(/\s+and\s+to\s+/g, ', and ')} in each option, and how long did the last change take?${' Ask the vendor to show it on your own data.'}`, topic: m[1] };
  if ((m = main.match(/^(?:mostly |only |just |largely )?(.+?)\s+instead of\s+(.+)$/i))) return { q: `Does each option give you ${m[2]}, or only ${m[1]}? Ask the vendor to show ${aAn(m[2].replace(/s$/, ''))} on your own data.`, topic: m[2] };
  if ((m = main.match(/^(?:manual|static|fixed|hard-?coded|rule[- ]based)(?:\s+(?:or|and)\s+(?:manual|static|fixed|rule[- ]based|slow))*\s+(\w+(?:\s\w+){0,3})$/i)) && !/\bslow to\b/i.test(main) && !TRAP_CLAUSE_VERB.test(m[1])) return { q: `How does each option produce ${m[1]}, by the system or by a person, and how often is it refreshed?`, topic: m[1] };
  if ((m = main.match(/\bslow to\s+(\w+(?:\s\w+){0,4})/i))) return { q: `How quickly does each option ${m[1]}, and how long did the last change take?`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:charges?|bills?|prices?)\s+(?:extra\s+|more\s+|additional\s+)?(?:for\s+)?(.+)$/i)) && !/^(?:.*\s)?(?:is|are)\s+/.test(main.split(m[1])[0] || '')) {
    const x = m[1].trim();
    return { q: `What does each option charge ${/^per\b/i.test(x) ? x : `for ${x}`}, and what sits outside the quoted price${tailQ}?`, topic: x };
  }
  if ((m = main.match(/^(?:.*?\s)?(?:leaves?|leaving)\s+(?:you\s+with\s+)?no\s+(.+)$/i))) return { q: `Does each option give you ${m[1]}? Ask the vendor to show it on your own data.`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:creates?|causes?|produces?|forces?|brings?|adds?)\s+(.+)$/i)) && m[1].split(/\s+/).length <= 12) return { q: `Where does each option leave you with ${m[1]}, and what does it take to get past ${/\band\b|s$/.test(m[1]) ? 'them' : 'it'}?`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:limits?|restricts?|caps?)\s+(.+)$/i))) return { q: `What limits does each option put on ${m[1]}, and what does it cost to go past them?`, topic: m[1] };
  if ((m = main.match(/\b(?:relies|rely|depends|depend)\s+on\s+.+?\s+((?:misses?|skips?|overlooks?)\s+.+)$/i))) return trapQuestion(m[1], comp);
  if ((m = main.match(/^(?:.*?\s)?(?:relies on|rely on|depends on|depend on)\s+(.+)$/i))) return { q: `Which parts of each option rely on ${m[1]}, and what happens when that is missing?`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:needs?|requires?)\s+(.+)$/i))) return { q: `What does each option need from you before it works (${m[1]}), who provides it, and what does that add to the time and the cost?`, topic: m[1] };
  if (/^(?:look|looks|looking)\s+(?:only\s+)?(?:backward|backwards|back)\b/i.test(main)) return { q: 'Does each option show what is happening now, or only what already happened, and how old is the newest number?', topic: 'whether it shows the present or only the past' };
  if ((m = main.match(/^only\s+(.+?)\s+(?:can|could)\s+(.+)$/i))) return { q: `Who can ${m[2]} in each option: only ${m[1]}, or everyone who needs it?`, topic: m[2] };
  if ((m = main.match(/^(.+?)\s+(?:are|is|was|were)\s+(?:mostly\s+|only\s+|usually\s+)?trained\s+on\s+(.+?)(?:\s+(?:while|but|whereas)\b.*)?$/i))) return { q: `What was ${m[1].replace(/^(?:most|many|some)\s+/i, '')} in each option trained on (${m[2]}), and how does it perform on your own data?`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?struggles?\s+(?:with|to)\s+(.+)$/i))) return { q: `How does each option cope with ${m[1]}?${show}`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:cannot|can't|can not|could not|couldn't|unable to|fail(?:s|ed)? to|has failed to|have failed to|does not|do not|doesn't|don't|never)\s+(have\s+|offer\s+|include\s+|support\s+|provide\s+)?(.+)$/i))) {
    const verb = (m[1] || '').trim();
    const negated = /^(?:.*?\s)?(?:cannot|can't|can not|could not|couldn't|unable to|fail(?:s|ed)? to)\s/i.test(main);
    if (verb && !negated) return { q: `How does each option cover ${m[2]}? Ask for it working today, not on a roadmap.`, topic: m[2] };
    return { q: `Can each option ${verb ? `${verb} ` : ''}${m[2]}?${show}`, topic: m[2] };
  }
  if ((m = main.match(/^(?:no|without|missing|lacks?|has no|have no)\s+(.+)$/i)) || (m = main.match(/^.+?\s+(?:lacks?|has no|have no|is missing|are missing)\s+(.+)$/i))) return { q: `How does each option cover ${m[1]}? Ask for it working today, not on a roadmap.`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:misses?|skips?|overlooks?|drops?)\s+(.+)$/i))) return { q: `How does each option catch ${m[1]}, and how soon would you know if one was missed?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:takes?|needs? \w+ to)\s+(?:\w+\s+)?(?:weeks?|months?|days?|hours?|years?|long|ages|time)\b/i)) && !/\b(?:that|which|who)$/i.test(m[1].trim())) return { q: `How long ${trapDo(m[1])} ${m[1]} take in each option, and can the vendor show a recent one from the first step to the last?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:arrives?|comes?|come|appears?|appear|shows? up|show up|lands?|reach(?:es)?)\s+(?:.*\b)?(?:late|slow|delayed|overnight|days?|hours?)\b/i))) return { q: `How soon does each option give you ${m[1]}, and what do you see in the meantime?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:moves?|go|goes|are sent|is sent|travels?|runs?)\s+by\s+(email|phone|hand|spreadsheet|paper|post|fax|text|chat)\b/i))) return { q: `How ${trapDo(m[1])} ${m[1]} get from the person who raises ${trapPlural(m[1]) ? 'them' : 'it'} to the person who decides, in each option, and who waits on whom?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:waits?|sits?)\s+(?:for|on|in)\s+(.+)$/i))) return { q: `How long ${trapDo(m[1])} ${m[1]} wait for ${m[2]} in each option, and who chases ${trapPlural(m[1]) ? 'them' : 'it'}?`, topic: m[1] };
  if ((m = main.match(/^(?:nobody|no one|no-one|not everyone|few people)\s+(?:can\s+)?(sees?|knows?|gets?|finds?|trusts?|shares?|has)\s+(.+)$/i))) return { q: `Who can ${trapBase(m[1].toLowerCase())} ${m[2]} in each option, and is it one view for everyone who needs it?`, topic: m[2] };
  if ((m = main.match(/^(.+?)\s+(?:is|are|was|were|gets?|got)\s+(found|caught|discovered|noticed|spotted|fixed|handled|reported|checked|updated|reviewed|approved|entered|recorded|logged|done|raised|flagged|priced|billed|paid|chased|fixed)\b/i))) return { q: `When ${trapPlural(m[1]) ? 'are' : 'is'} ${m[1]} ${m[2].toLowerCase()} in each option, and what has it cost by then?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:is|are|stays?|remains?)\s+(?:very |too |often |still |mostly )?(slow|late|delayed|stale|periodic|batch\w*|manual|costly|expensive|opaque|rigid|limited|hard|difficult|complex|fragmented|isolated|disconnected)\b/i))) {
    const [, s, adj] = m;
    if (/slow|late|delayed|stale|periodic|batch/i.test(adj)) return { q: `How long ${trapDo(s)} ${s} take in each option, and what happens in between?`, topic: s };
    if (/manual/i.test(adj)) return { q: `Which steps of ${s} wait for a person in each option, and how long does each wait?`, topic: s };
    if (/costly|expensive/i.test(adj)) return { q: `What ${trapDo(s)} ${s} cost in each option over three years, and what sits outside the quoted price?`, topic: s };
    if (/opaque/i.test(adj)) return { q: `How does each option explain ${s}, and can you check it yourself?`, topic: s };
    if (/fragmented|isolated|disconnected/i.test(adj)) return { q: `Can each option show ${s} in one place, or does your team join the pieces by hand?`, topic: s };
    return { q: `How much of ${s} can you change yourself in each option, and how long does a change take?`, topic: s };
  }
  if ((m = main.match(/^(.+?)\s+(re-?keys?|copy|copies|retypes?|retype|exports?|imports?|rebuilds?|chase|chases|merges?|reconciles?|reconcile|pastes?|enters?|enter|compiles?|compile|collects?|collect|assembles?|assemble|updates?|update|transfers?|transfer)\s+(.+)$/i))) return { q: `Who does the work of ${trapIng(m[2])} ${m[3]} in each option, the system or your own team, and how long does it take each week?`, topic: m[3] };
  if ((m = main.match(/^(.+?)\s+(is|are|can|will|must|should)\s+(.+)$/i)) && m[1].split(/\s+/).length <= 3 && m[3].split(/\s+/).length <= 6) return { q: `${upperFirst(m[2].toLowerCase())} ${m[1]} ${m[3].replace(/^only\s+/i, '')} in each option?${show}`, topic: m[1] };
  // a noun phrase: the leading adjective or count of time is taken off, the head is asked about
  if (/\b(?:slowdowns?|lag|latency|sluggish|disconnections?|outages?|downtime|packet loss)\b/i.test(main)) return { q: 'What happens in each option when the connection slows or drops: what do your users see, and how is it measured?', topic: 'slowdowns and disconnections' };
  if (main.split(/\s+/).length >= 4) {
    const t = TRAP_TOPICS.find((x) => x.re.test(main));
    if (t) return { q: t.q, topic: t.topic };
  }
  if (main.split(/\s+/).length >= 3) {
    // a clause with a verb of its own is put to the vendor as a situation
    if (/\b(?:that|which)\b/i.test(main)) return { q: `How does each option deal with “${main}”? Ask the vendor to show it live.`, topic: main };
    if (TRAP_CLAUSE_VERB.test(main.split(/\s+/).slice(1).join(' '))) return { q: `What happens in each option when ${main.replace(/\bwere\b/gi, 'are').replace(/\bwas\b/gi, 'is')}? Ask the vendor to show it live.`, topic: main };
  }
  if ((m = main.match(/^(.+?)\s+(?:lost|dropped|broken|missing|duplicated|reset|overwritten)\s+(?:when|if|as|whenever)\s+(.+)$/i))) return { q: `When ${m[2]}, is the ${m[1]} kept in each option, and who can see it?`, topic: m[1] };
  if ((m = main.match(/^to\s+(.+)$/i))) return { q: `Can each option help you to ${m[1]}? Ask the vendor to show it on your own data.`, topic: m[1] };
  // a weak point that opens with an adjective ("costly physical devices") is asked about by what the adjective says, not as a bare topic
  if ((m = main.match(/^(costly|expensive|slow|unreliable|inaccurate|manual|limited|outdated|rigid|fragile)\s+(.{3,60})$/i)) && !TRAP_CLAUSE_VERB.test(m[2])) {
    const [, adj, thing] = m; const a = adj.toLowerCase();
    if (a === 'costly' || a === 'expensive') return { q: `What ${trapDo(thing)} ${thing} cost in each option over three years (buying, keeping up to date, replacing), and what sits outside the quoted price?`, topic: thing };
    if (a === 'slow') return { q: `How long ${trapDo(thing)} ${thing} take in each option, and what happens in between?`, topic: thing };
    if (a === 'unreliable' || a === 'inaccurate' || a === 'fragile') return { q: `How reliable and accurate is ${thing} in each option on your own cases, and where does it fail? Ask to see the failures on your data.`, topic: thing };
    if (a === 'manual') return { q: `Which steps of ${thing} wait for a person in each option, and how long does each wait?`, topic: thing };
    if (a === 'limited') return { q: `What limits does each option put on ${thing}, and what does it cost to go past them?`, topic: thing };
    return { q: `How much of ${thing} can you change yourself in each option, and how long does a change take?`, topic: thing };
  }
  let np = main.replace(/^(?:\d+\s+|several\s+|a few\s+|many\s+)?(?:months?|weeks?|days?|years?) of\s+/i, '').replace(/^(?:slow|manual|periodic|poor|weak|limited|high|long|late|heavy|complex|outdated|legacy|rigid|fragmented|isolated|opaque|expensive|costly|hidden|batch)\s+/i, '').trim();
  if (!np) np = main;
  if (/setup|set-up|implement|onboard|rollout|go-live|deploy|migration/i.test(np)) return { q: `How long ${trapDo(np)} ${np} take in each option, and can the vendor show a recent one from signing to the first real result?`, topic: np };
  if (np.split(/\s+/).length > 5 || TRAP_CLAUSE_VERB.test(np) || /\b(?:prone|built|designed|made)\s+(?:to|for)\b/i.test(np)) return { q: `How does each option deal with “${np}”?${show}`, topic: np };
  return { q: `How does each option handle ${np}?${show}`, topic: np };
}
export const TRAP_WANT_VERBS = /^(?:keep|protect|manage|streamline|raise|cut|close|reduce|increase|improve|speed|shorten|lower|grow|win|get|make|plan|launch|cover|avoid|stop|simplify|automate|scale|ship|move|find|build|run|track|see|bring|boost|connect|deliver|hit|meet|stay|retain|expand|consolidate|replace|lift|gain|save|prove|show|handle|trust|know|reach|fix|end|free|prevent|detect|respond|onboard|pay|collect|bill|price|forecast|prioriti[sz]e|verify|secure|comply|catch|clear|ship|test|release|sell|serve|support|help|let|turn|take)\b/i;

// ---------------------------------------------------------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------------------------------------------------------
function splitItems(s: unknown): string[] {
  if (typeof s !== 'string') return [];
  const parts = s.split(/\n|;/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
  if (parts.length === 1 && /,/.test(parts[0])) {
    const c = parts[0].split(/,(?!\d{3}(?!\d))/).map((x) => x.trim()).filter(Boolean);
    const sentenceLike = /^(?:the|a|an)\s/i.test(c[0] || '') && (c[0] || '').split(/\s+/).length >= 4;
    if (c.length > 1 && !sentenceLike && c.every((x) => x.split(/\s+/).length <= 6) && !c.some((x) => /^(not|but|and|or|so|which|that|built|designed|made|powered|backed|offering|with|using|including|plus|replacing)\b/i.test(x))) return c;
  }
  return parts;
}
const q = (s: string): string => `"${s.trim().replace(/^"|"$/g, '').replace(/[.]$/, '')}"`;
const GERUND: Record<string, string> = { do: 'doing', hire: 'hiring', add: 'adding', keep: 'keeping', stay: 'staying', wait: 'waiting', use: 'using', build: 'building', buy: 'buying', stick: 'sticking', continue: 'continuing', outsource: 'outsourcing', manage: 'managing', negotiate: 'negotiating' };
const CLAIM_WORDS = /\b(?:first and only|the only|only|world'?s (?:first|largest|leading|most)|first|largest|leading|best|most extensive|#1|number one|unique|fastest|cheapest)\b/i;

// A note that holds several weak points is cut where a new clause opens: after ", so", after a semicolon, and at "and" when a subject and a verb follow.
// A clause that ends in "it" or "them" takes the subject of the clause before ("insight arrives late and only analysts can get it").
const FINE_VERB = '(?:look|looks|work|works|arrive|arrives|take|takes|cost|costs|fail|fails|break|breaks|need|needs|require|requires|lack|lacks|stop|stops|slow|slows|run|runs|get|gets|can|cannot|are|is|have|has|miss|misses|force|forces|leave|leaves|rely|relies|depend|depends|charge|charges|limit|limits|hide|hides|lock|locks|struggle|struggles|sit|sits|pile|piles|drift|drifts|go|goes|become|becomes|create|creates|cause|causes|wait|waits)';
export function fineClauses(w: string): string[] {
  const re = new RegExp(`,\\s+so\\s+|;\\s+|\\s+and\\s+(?!${FINE_VERB}\\b)(?=(?:\\S+\\s+){1,3}${FINE_VERB}\\b)`, 'gi');
  const pieces: string[] = [];
  let from = 0;
  for (const m of w.matchAll(re)) {
    const i = m.index ?? 0;
    const left = w.slice(from, i);
    // "and" inside a list ("SAST, DAST and API tools slows ...") or after a very short start is not a clause break
    if (/^\s+and\s+/i.test(m[0]) && (/,\s+[^,]{1,25}$/.test(left) || left.split(/\s+/).length < 3)) continue;
    pieces.push(left);
    from = i + m[0].length;
  }
  pieces.push(w.slice(from));
  const out: string[] = [];
  for (const raw of pieces) {
    const p = raw.trim().replace(/[.]+$/, '');
    if (!p) continue;
    if (out.length && p.split(/\s+/).length < 3) { out[out.length - 1] += ` and ${p}`; continue; }
    out.push(p);
  }
  return out.map((c, i) => {
    if (i > 0 && /\s(?:it|them)$/i.test(c)) {
      const subj = out[i - 1].split(new RegExp(`\\s+(?:${FINE_VERB}|arrives?|comes?|lands?)\\b`, 'i'))[0].trim();
      if (subj && subj.split(/\s+/).length <= 3) return c.replace(/\s(?:it|them)$/i, ` ${subj}`);
    }
    return c;
  });
}
// A clause with no verb of its own that follows another ("Azure and GCP", "governance and ongoing cloud operations") continues the list before it;
// a clause that opens with "no", "without" or "lack" is a weak point of its own.
export function joinLists(cs: string[]): string[] {
  const out: string[] = [];
  for (const c of cs) {
    const verbless = !new RegExp(`\\b${FINE_VERB}\\b`, 'i').test(c) && !TRAP_CLAUSE_VERB.test(c) && !/\b(?:when|if|where|while|because|that|which|lost|switches|switch)\b/i.test(c);
    if (out.length && verbless && c.split(/\s+/).length <= 8 && !/^(?:no|not|without|lack|lacks|missing|never)\b/i.test(c)) out[out.length - 1] += `, ${c}`;
    else out.push(c);
  }
  return out;
}

export function buildTrapSetter(args: Record<string, unknown>, D: Deps, footer: string, sectorBlock: (v: Vertical | null) => string): string {
  lf.lower = D.lower;
  lf.isCommon = D.isCommon;
  const competitor = ((args.competitor as string) || '').trim();
  const competitorWeaknesses = (args.competitor_weaknesses as string) || '';
  const yourSolution = ((args.your_solution as string) || '').trim();
  const yourStrengths = (args.your_strengths as string) || '';
  const stage = (args.evaluation_stage as string) || 'mid';
  const buyerPriorities = ((args.buyer_priorities as string) || '').trim();
  const trapType = (args.trap_type as string) || 'all';
  const personaName = ((args.buyer_persona as string) || '').trim();

  const ctx = readSector(args.business_model, { seller: [yourSolution], context: [yourStrengths, competitorWeaknesses, buyerPriorities, competitor], role: [args.buyer_persona] });
  const model = ctx.model;
  const v = ctx.v;
  const software = model === null || model === 'saas' || model === 'hardware_software';
  const P = productOf(yourSolution, D);
  const name = P.name || P.ref;
  const investment = model === 'investment';
  const persona = personaName ? roleFor(personaName, investment) : null;

  // ---- what the buyer is comparing with ----
  const alt = competitor ? readAlt(competitor, D) : { text: '', kind: 'vendor' as const, handle: '' };
  const kind = alt.kind;
  const isVendor = kind === 'vendor';
  const handleWords = alt.handle.split(/\s+/);
  const gerund = (h: string): string => { const w = h.split(/\s+/); return GERUND[w[0].toLowerCase()] ? `${GERUND[w[0].toLowerCase()]} ${w.slice(1).join(' ')}`.trim() : h; };
  const approachName = handleWords.length <= 7 ? gerund(alt.handle) : 'the current approach';
  const compLabel = !competitor ? 'the competitor' : isVendor ? competitor : kind === 'approach' ? 'the current approach' : approachName;
  const here = isVendor ? competitor || 'the competitor' : kind === 'approach' ? 'the way you work today' : 'a tool of that kind';
  const toPeers = (t: string): string => t.replace(/,?\s+and can (?:the )?(?:vendor|supplier) show[^?]*\?/i, '?').replace(/\s+in each option/g, ` in ${here}`).replace(/\beach option\b/g, here).replace(/\s*Ask (?:the vendor|for it)[^.?]*[.]/g, '').replace(/\s+/g, ' ').trim();
  const nonVendor = (t: string): string => t.replace(/\s*Ask (?:the vendor|for it|to see)[^.?]*[.]\s*$/i, '').replace(/\s*Ask (?:the vendor|for it|to see)[^.?]*[.]/gi, '').replace(/the vendor/g, isVendor ? 'the vendor' : 'the supplier').trim();

  const weaknesses = splitItems(competitorWeaknesses).map((w) => w.replace(/\s*\((?:reviewers' words|a seller's words|page words|customer quote|customer words)[^)]*\)\s*$/i, '').trim());
  const weaknessLabels = splitItems(competitorWeaknesses);
  void weaknessLabels;
  const allStrengths = splitItems(yourStrengths);
  const isCred = (x: string) => { const m = x.match(CRED_RE); return !!m && (m.index || 0) <= 40; };
  // a credential is found after a long strength is cut into claims too ("..., plus Inner Circle status for ...")
  const credentials: string[] = [];
  const strengths: string[] = [];
  for (const item of allStrengths) {
    if (isCred(item)) { credentials.push(item); continue; }
    for (const claim of trapClaims(item)) {
      if (isCred(claim)) { credentials.push(claim); continue; }
      // a marketing claim ("a unique approach ... with embedded ethics, privacy and security") is sourced; what follows "with" is what the buyer can test
      const tail = CLAIM_WORDS.test(claim) ? claim.match(/\s+(?:with|offering|including)\s+(.{12,})$/i) : null;
      strengths.push(tail ? tail[1].trim() : claim);
    }
  }
  const claimsHere = allStrengths.filter((x) => CLAIM_WORDS.test(x));

  // ---- the buyer's priorities: aims (clauses) and figures with their own source label ----
  const startsWant = (x: string) => TRAP_WANT_VERBS.test(x.replace(/^(?:and|to)\s+/i, ''));
  const aims: string[] = [];
  const figureItems: string[] = [];
  for (const item of splitItems(buyerPriorities)) {
    const label = (item.match(/\(([^()]*(?:\([^()]*\))?[^()]*)\)\s*[.]?$/) || [])[1] || '';
    const body = label ? item.slice(0, item.lastIndexOf(`(${label})`)).trim() : item.trim();
    let last = false;
    for (const f of splitTopLevel(body.replace(/[.]+$/, '')).map((x) => x.replace(/^(?:and|plus)\s+/i, '').trim()).filter(Boolean)) {
      let g = f;
      // "an aim in words: a figure that backs it": the words before the colon are an aim, the rest is a figure with its own label
      const ci = g.indexOf(': ');
      if (/\d/.test(g) && ci > 0 && !/\d/.test(g.slice(0, ci)) && g.slice(0, ci).split(/\s+/).length >= 3) { aims.push(g.slice(0, ci).trim()); g = g.slice(ci + 2).trim(); }
      if (/\d/.test(g)) {
        const text = label && !/\(/.test(g) ? `${g} (${label})` : g;
        if (!figureItems.includes(text)) figureItems.push(text);
        last = false;
      } else if (last && !startsWant(f) && aims.length) aims[aims.length - 1] += `, ${f}`;
      else { aims.push(f); last = true; }
    }
  }
  const aimSource = (buyerPriorities.match(/\(([^()]*(?:page|words|quote|claim)[^()]*)\)\s*$/i) || [])[1] || '';
  const said = new Set<string>();
  const whyDone = new Set<string>();
  const aimTag = (a: string): string => lowerKeep(a).split(/:\s+|\s+(?:and|but|while)\s+/)[0].split(/\s+/).slice(0, 8).join(' ');
  // an aim is quoted in full the first time and referred to after that, so the buyer's own words are not repeated
  const wantPhrase = (a: string): string => { if (said.has(a)) return 'it bears on the aim the buyer stated'; said.add(a); const lc = lowerKeep(a); return TRAP_WANT_VERBS.test(lc) ? `they said they want to ${lc}` : `they said this matters: ${lc.replace(/:\s+/g, ', ')}`; };
  const aimAsk = (c: string, i: number): string => {
    said.add(c);
    const lc = lowerKeep(c);
    const ends = ['How would you judge that each option delivers it?', 'Which option has shown you that on your own data, and what did it measure?', 'What would you need to see in the evaluation to believe it?'];
    return TRAP_WANT_VERBS.test(lc) ? `You said you want to ${lc}. ${ends[i % 3]}` : `You told me this matters: ${lc.replace(/:\s+/g, ', ')}. ${ends[i % 3]}`;
  };

  // ---- each weakness, read by kind: a question on its own topic ----
  const usedQ = new Set<string>();
  const read = weaknesses.map((w) => {
    const hEsc = alt.handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cl = joinLists(trapClauses(w).flatMap(fineClauses)).map((c) => (alt.handle.length > 2 ? c.replace(new RegExp(`^${hEsc}\\s+`, 'i'), '') : c)).filter((c) => c.length > 2);
    const lit = v && v.id === 'logistics-tech' ? cl : cl.filter((c) => !TRAP_METAPHOR.test(c));
    const qs = (lit.length ? lit : cl).map((c) => {
      const x = trapQuestion(c, competitor || alt.handle || 'the competitor');
      // two notes that read the same way must not give the same question twice: the second is asked about its own words
      if (usedQ.has(x.q)) return { q: `How does each option deal with \u201c${c.replace(/[.]+$/, '')}\u201d?`, topic: c.replace(/[.]+$/, '') };
      usedQ.add(x.q);
      return x;
    });
    return { w, qs, topic: qs.map((x) => x.topic).join(' ') };
  });
  const strengthFor = (text: string): string => { let best = ''; let n = 0; for (const s of strengths) { const k = trapShares(text, s); if (k > n) { n = k; best = s; } } return best; };
  const aimFor = (text: string): string => { let best = ''; let n = 0; for (const a of aims) { const k = trapShares(text, a); if (k > n) { n = k; best = a; } } return best; };
  // a role or sector question that names a way of charging, shipping or renewing only fits a seller whose own words use that way
  const ownWords = `${yourSolution} ${yourStrengths} ${competitorWeaknesses} ${buyerPriorities} ${competitor}`;
  const MOTION = /\b(?:charg\w+|pric\w+|billing|invoic\w+|ship\w*|subscription\w*|renewal\w*|before (?:they (?:get|see) )?value|sign-?up|free trial|paywall)\b/i;
  const motionFit = (x: string): boolean => { const m = x.match(MOTION); return !m || new RegExp(`\\b${m[0].slice(0, Math.max(4, m[0].length - 2))}`, 'i').test(ownWords); };
  const opsFit = !persona || persona.label !== 'operations leader' || !v || ['logistics-tech', 'ites', 'vertical-saas'].includes(v.id);
  const sectorQ = v ? v.discovery.filter(motionFit).slice(0, 2).map((x) => `- "${x}"`).join('\n') : '';
  const personaQ = persona && opsFit ? persona.questions.filter((x) => motionFit(x) && !/\bthat\b/i.test(x)).slice(0, 2).map((x) => `- "${x}"`).join('\n') : '';
  const costWeak = read.filter((r) => /price|cost|fee|charge|seat|licen|overage|extra|bill/i.test(r.w));
  const supportMention = /\b(?:support|sla|24\/7|uptime|response)\b/i.test(`${yourStrengths} ${competitorWeaknesses}`);

  const shown = new Set<string>();
  const weakBlocksOf = () => read.map((r, idx) => {
    const s0 = strengthFor(`${r.w} ${r.topic}`);
    const s = s0 && !shown.has(s0) ? (shown.add(s0), s0) : '';
    const a = aimFor(`${r.w} ${s}`);
    return `**Weak point ${idx + 1} of ${compLabel} (your note, not for the buyer):** ${upperFirst(r.w)}\n${r.qs.map((x) => `**Landmine Question:** "${nonVendor(x.q)}"`).join('\n')}${s ? `\n**Then show:** ${upperFirst(s)}` : ''}${a && !whyDone.has(a) ? (() => { whyDone.add(a); return `\n**Why it matters to this buyer:** ${wantPhrase(a)}.`; })() : ''}`;
  });

  // ---- questions about the alternative itself, by what it is and how the seller charges ----
  const implementationQs = isVendor ? (model === 'investment' ? [
    `"How long from signing to the first allocation with ${compLabel}, and what do you need to provide?"`, `"What reporting do you receive each month from ${compLabel}, and who explains a bad month?"`, `"What are the full fees with ${compLabel}, including performance fees and minimums?"`,
  ] : model === 'services' ? [
    `"How will the transition to ${compLabel} run, stage by stage, and who signs off each stage?"`, `"Who are the named people on the account at ${compLabel}, and what happens if they leave?"`, `"What is in the rate card of ${compLabel}, and how are change requests priced?"`,
  ] : model === 'connectivity' ? [
    `"How many sites does ${compLabel} bring live in each wave, and what is the fallback if a cut-over fails?"`, `"What is the repair time in the contract with ${compLabel}, and how are service credits paid?"`, `"What one-time charges apply per site with ${compLabel} (installation, equipment)?"`,
  ] : [
    `"How long from signing to the first real result with ${compLabel}, and how did its customers find that against the promise?"`, `"Which of your own people does the set-up with ${compLabel} take, and for how long?"`, `"What does the price from ${compLabel} include, and what is billed separately?"`,
  ]) : kind === 'approach' ? [
    `"Who keeps ${compLabel} running today, and what happens when they are away?"`, `"What does ${compLabel} cost you in a year, in people's time and in fees?"`, `"What breaks in ${compLabel} when your volumes or your plans change?"`,
  ] : [
    `"Which tools of that kind have you tried or shortlisted, and what did the first demo not show?"`, `"What does keeping ${compLabel} running cost you in a year, in people's time and in fees?"`, `"What did you have to work around, and who does that work?"`,
  ];
  const implLabel = !isVendor ? `Questions about ${compLabel}` : model === 'investment' ? 'Onboarding and Mandate Landmines' : model === 'services' ? 'Transition Landmines' : model === 'connectivity' ? 'Rollout Landmines' : 'Implementation Landmines';

  // one scenario for each clean topic; a topic that is a clause, or a long one, points to its weak point by number instead
  const scenarioLines = (): string[] => {
    const out: string[] = [];
    read.forEach((r, wi) => {
      const clean = r.qs.filter((x) => x.topic.length <= 70 && x.topic.split(/\s+/).length <= 9 && !/\b(?:is|are|was|were|has|have|had|does|do|can|cannot|will|would|not|make|makes)\b/i.test(x.topic));
      const lines = clean.length ? clean.map((x) => `give each option the same case that tests ${/^(?:fully|easily|quickly|optimi[sz]e|leverage|manage|handle|get|see|keep|find|build|run|track|scale|change|connect|reach|cover|use|plan|ship|launch|reduce|improve|cut|move|show|answer|report|trust|know|stay|work|deploy|integrate|automate)\b/i.test(x.topic) ? `whether it can ${x.topic}` : x.topic}, and compare what each one does with it.`) : [`give each option the same case for weak point ${wi + 1}, and compare what each one does with it.`];
      for (const l of lines) if (!out.includes(l)) out.push(l);
    });
    return out.slice(0, 6);
  };
  const sections: Record<string, () => string> = {
    discovery_questions: () => `## Discovery Questions (Landmines)

Ask these as open questions, so the buyer finds the gaps of ${compLabel} in their own evaluation. The weak points are your notes and are never read out. For each answer, ask to see it live on the buyer's own data, not on a slide.

### What the buyer told you matters
${aims.length ? aims.map((a, i) => `- "${aimAsk(a, i)}"${aimSource && i === 0 ? ` (your source for the priorities: ${aimSource})` : ''}`).join('\n') : buyerPriorities ? '- The priorities you gave are figures only, so there is no aim to ask about yet. Ask the buyer what they want to achieve, then use the figures below with their source.' : '- No priorities were given, so there is no question here yet.'}
${figureItems.length ? `\nFigures you gave, with their source: ${figureItems.map((f) => q(f)).join('; ')}. Ask for the buyer's own number first, and quote these only with that source.\n` : ''}${sectorQ || personaQ ? `\n### From the evaluator's role and the sector\n${[personaQ, sectorQ].filter(Boolean).join('\n')}\n` : ''}
### Capability Landmines
${read.length ? weakBlocksOf().join('\n\n') : `No weak points were given (competitor_weaknesses), so there is no landmine yet. Add what you know about ${compLabel} and each note becomes a question here.`}

### ${implLabel}
${implementationQs.map((x) => `- ${x}`).join('\n')}
${isVendor && supportMention ? `\n### Support Landmines\n- "What does the support from ${competitor} cover outside office hours, and what does the contract promise when something urgent breaks?"` : ''}`,

    evaluation_criteria: () => { return `## Evaluation Criteria Positioning

### Criteria to Establish Early

${strengths.length ? `Agree these as criteria before anyone is shortlisted. For each one, the question to put to every option is the same: can it show this on one of your own cases?\n\n${strengths.map((s, i) => { const a = aimFor(s); return `- Criterion ${i + 1}: ${/^with\b/i.test(s) ? `Works ${lowerKeep(s)}` : upperFirst(s)}${a && a.length <= 100 ? ` (${wantPhrase(a)})` : ''}`; }).join('\n')}` : `No demonstrable strengths were given (your_strengths). Add what ${name} can show live, and each one becomes a criterion here.`}
${credentials.length ? `\n### Credentials (mention them, do not make them criteria)\n\nThese cannot be demonstrated in an evaluation. Say them in a sentence when they answer a concern:\n${credentials.map((s) => `- ${upperFirst(s)}`).join('\n')}\n` : ''}${claimsHere.length ? `\n### Claims to source\n\nThe buyer will ask for the source of: ${joinList(claimsHere.map((c) => q(clip(c, 90))))}. Have it ready, or soften the wording.\n` : ''}
### How to Suggest Criteria

"${aims.length ? (said.has(aims[0]) ? 'Before you evaluate anyone, it helps to agree the criteria that decide what you told me matters.' : `${startsWant(aims[0]) ? `You said you want to ${lowerKeep(aims[0])}.` : `You told me this matters: ${lowerKeep(aims[0]).replace(/:\s+/g, ', ')}.`} Before you evaluate anyone, it helps to agree the criteria that decide that.`) : 'Before you evaluate anyone, it helps to agree the criteria.'} ${strengths.length ? `I would suggest ${strengths.length === 1 ? 'one criterion' : `${strengths.length} criteria`} for it, and I will send ${strengths.length === 1 ? 'it' : 'them'} with the questions.` : 'I would suggest starting with the outcomes you need.'} Would it help if I shared the questions to ask every option you are looking at?"`; },

    reference_questions: () => `## Reference Call Questions

${isVendor ? `Suggest the buyer ask these questions when speaking with the references of ${competitor}:` : `Suggest the buyer ask these of people who live with ${compLabel} today (their own team, or peers who work the same way):`}

${read.length || aims.length ? [
      ...read.flatMap((r) => r.qs.map((x) => `- "${nonVendor(isVendor ? toPeers(x.q) : toPeers(x.q))}"`)),
      ...aims.slice(0, 2).map((a) => `- "${isVendor ? (startsWant(a) ? `Since you started with ${competitor}, has it helped you ${lowerKeep(a)}, and what did you measure?` : `Since you started with ${competitor}, how has it done on this: ${lowerKeep(a).replace(/:\s+/g, ', ')}? What did you measure?`) : (startsWant(a) ? `Has ${compLabel} helped you ${lowerKeep(a)}, and what did you measure?` : `How does ${here} do on this: ${lowerKeep(a).replace(/:\s+/g, ', ')}? What did you measure?`)}"`),
    ].join('\n') : `- No weak points or priorities were given, so there is nothing specific to ask a reference yet. Add competitor_weaknesses or buyer_priorities.`}`,

    technical_requirements: () => `## ${software ? 'Technical Requirements' : 'Requirements'} (Traps)

### RFP or Requirements Document

${strengths.length ? `Each requirement is accepted only if it is shown live and ${personaName ? `the ${personaName} signs off` : 'the evaluation team signs off'} the result.\n\n${strengths.map((s, i) => (s.length > 80 ? `${i + 1}. Criterion ${i + 1}, shown live on your own case` : `${i + 1}. Shown live on your own case: ${lowerKeep(s)}`)).join('\n')}` : `No demonstrable strengths were given (your_strengths). Add what ${name} can show live and each one becomes a requirement here.`}

### Evaluation Scenarios

${read.length ? `Agree the pass mark with the buyer before each test.\n\n${scenarioLines().map((l, i) => `**Scenario ${i + 1}:** ${l}`).join('\n\n')}` : `No weak points were given, so there is no scenario yet. ${aims.length ? (said.has(aims[0]) ? 'The first one to build is the test of the aim in the questions on what the buyer told you matters.' : `The first one to build is the test of what they want: ${lowerKeep(aims[0])}.`) : ''}`}`,

    commercial_terms: () => `## Commercial Terms (Positioning)

### ${isVendor ? 'Pricing Comparisons' : 'Cost Comparison'}

${!isVendor ? `When they compare ${name} with ${compLabel}, make sure they compare:\n- What ${compLabel} costs a year in people's time, fees and the cost of its failures\n- What ${name} costs over the same period, including set-up and the team's time\n- What changes for the people who do the work today` : `When they compare ${name} with ${competitor}, make sure they compare:
${model === 'investment' ? '- Management and performance fees\n- Minimum mandate size and lock-in\n- Reporting and transparency included\n- Exit terms' : model === 'services' ? '- The rate card and how change requests are priced\n- Transition costs\n- Service credits and how they are paid\n- Exit and handover terms' : model === 'connectivity' ? '- Monthly charge per site or link over the full term\n- One-time installation and equipment charges\n- Service credits for missed SLAs\n- Early termination charges' : '- Total cost of ownership (not just the licence)\n- Implementation and training costs\n- Support tiers\n- Costs as usage grows'}`}
${costWeak.length ? `\n### From your notes on ${compLabel}\n${costWeak.map((r) => `- Your note (not for the buyer): ${upperFirst(r.w)}`).join('\n')}\nFor ${costWeak.length === 1 ? 'this note' : 'these notes'}, ask for the full cost over three years in each option, including everything outside the quoted price.\n` : ''}${!isVendor ? '' : `
### Contract Terms to Check

Ask about the contract of ${competitor} (nothing here says ${competitor} has these terms; check the actual contract): does it renew automatically, can the price rise at renewal, and what are the termination rights and notice periods?
`}
### Your Own Terms

${(() => { const own = strengths.filter((s) => /\b(?:price|pricing|annual|monthly|fees?|free|included|contract|terms?|licen[cs]e|seats?|credits?|refund|trial|pilot|commitment)\b/i.test(s)); return own.length ? `Terms you gave among your strengths: ${own.map((s) => (s.length > 120 ? `criterion ${strengths.indexOf(s) + 1}` : q(s))).join('; ')}. Put them in the contract in the same words.` : 'No terms of your own were given among your strengths (your_strengths). Add the ones you can put in the contract and they appear here.'; })()}`,
  };

  // ---- the set-up ----
  const kindLine = isVendor ? '' : kind === 'approach' ? ` That is the buyer's current approach (called the current approach below), a way of working and not a vendor, so there is no contract, reference list or support desk to ask about; the questions below are about how the buyer works today.` : ` That describes a kind of tool rather than one named vendor, so the questions ask about tools of that kind and about the buyer's own experience with them; there is no single contract or reference list to ask about.`;
  const longAlt = !isVendor && alt.text.toLowerCase() !== (kind === 'approach' ? approachName : compLabel).toLowerCase() && (alt.text.length > (kind === 'approach' ? approachName : compLabel).length + 3 || /[<>(){}'"\u201c]/.test(alt.text)) ? ` You described it as ${q(clip(alt.text, 200))}.` : '';
  const soldText = yourSolution && yourSolution.length <= 200 && (!P.name || /[<>"\u201c\u201d\[\]]/.test(yourSolution)) ? ` What you said you sell: ${yourSolution.replace(/[.]+$/, '')}.` : '';
  const sold = isKind(P, D) ? ` ${endSentence(isKind(P, D))}` : '';
  const partsLine = (() => { const ps = partsIn(P); return ps.length >= 2 ? ` Its parts: ${joinList(ps.slice(0, 8))}.` : ''; })();
  let output = `# Competitive Positioning: ${yourSolution ? (P.name || P.label || 'the product') : 'the product'} vs ${!isVendor && kind === 'approach' ? approachName : compLabel}

## The set-up

${yourSolution ? upperFirst(name) : 'The product'} is in ${aAn(`${stage} stage`)} evaluation against ${!isVendor && kind === 'approach' ? approachName : compLabel}.${kindLine}${longAlt}${sold}${partsLine}${soldText}

${ctx.line}

${persona && persona.label !== 'stakeholder' ? `**Who is evaluating:** ${aAn(persona.label)}${personaName && personaName.toLowerCase() !== persona.label.toLowerCase() ? ` (${personaName})` : ''}. They care about ${persona.cares}, and worry about ${persona.worry}. Ask in those terms.\n` : (personaName ? `**Who is evaluating:** ${upperFirst(personaName)}.\n` : '')}
${v ? `${sectorBlock(v)}\n` : ''}${allStrengths.length || weaknesses.length ? `\n### Your notes (not for the buyer)\n\n${allStrengths.length ? `**Your strengths**\n${allStrengths.map((x) => `- ${x}`).join('\n')}\n\n` : ''}${weaknesses.length ? `**Weak points of ${compLabel}**\n${weaknesses.map((x) => `- ${x}`).join('\n')}\n` : ''}` : ''}
---

`;
  if (trapType === 'all') output += ['discovery_questions', 'evaluation_criteria', 'reference_questions', 'technical_requirements', 'commercial_terms'].map((k) => sections[k]()).join('\n\n---\n\n');
  else output += (sections[trapType] || sections['discovery_questions'])();

  const who = personaName ? `the ${personaName}` : 'the buyer';
  const stageLine: Record<string, string> = {
    early: strengths.length ? `Put the ${strengths.length === 1 ? 'one thing' : `${strengths.length} things`} you can show live on the buyer's criteria list before the shortlist is made, and offer to help ${who} structure the evaluation.` : `No strengths were given, so there is nothing to put on the criteria list yet.`,
    mid: strengths.length ? `Make sure your strongest criterion is one of the live tests${v ? `, and bring the proof that lands in this sector: ${lf.lower(v.proofShape).replace(/[.]+$/, '')}` : ''}. Let the buyer meet the limits of ${compLabel} in their own tests.` : `No strengths were given, so there is no live test to protect yet.`,
    late: strengths.length ? `Ask ${who} what is still open and close it with your strongest criterion${credentials.length ? `; say your credentials in one sentence if they answer a concern` : ''}. Check that the decision criteria are the ones agreed.` : `Ask ${who} what is still open and check that the decision criteria are the ones agreed.`,
    finalist: `Reduce the buyer's risk${strengths.length ? ' by showing your strongest criterion on their own case' : ''}, give ${who} access to your own executives, and close with the terms you can put in the contract.`,
  };
  output += `

---

## Stage-Specific Tactics

### ${upperFirst(stage)} Stage Recommendations

${stageLine[stage] || stageLine.mid}
`;

  // ---- what was not given, once, at the end ----
  const sharpen: string[] = [];
  if (!yourSolution) sharpen.push('`your_solution`: it would change "the product" in this draft to the name you sell and let the criteria follow its parts.');
  if (!competitor) sharpen.push('`competitor`: it would change "the competitor" to a named vendor, a kind of tool or a way of working, and the wording of every section would follow.');
  if (!weaknesses.length) sharpen.push(`\`competitor_weaknesses\`: it would change the landmine section from a prompt to one question per weak point of ${compLabel}.`);
  if (!allStrengths.length) sharpen.push('`your_strengths`: it would change the criteria, the requirements and the stage tactics from prompts to the things you can show live.');
  if (!args.evaluation_stage) sharpen.push('`evaluation_stage`: it would change the stage tactic from the mid stage that is assumed to the stage you are in.');
  if (!personaName) sharpen.push('`buyer_persona`: it would change the questions to the worries of that role and name who signs off the requirements.');
  if (!buyerPriorities) sharpen.push('`buyer_priorities`: it would add questions on what the buyer told you matters, and tie each weak point to one of them.');
  if (sharpen.length) output += `\n## To sharpen this, give:\n\nWhat was not given, and what each input would change:\n\n${sharpen.map((x) => `- ${x}`).join('\n')}\n`;
  output += `\n${footer}\n`;
  void parseProof; void andList;
  return output;
}
