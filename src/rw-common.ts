// Run 22 (writer rev-w3): helpers shared by the rewritten email_sequence_generator, win_loss_analyzer and competitive_trap_setter.
// Text only: no figure, no statistic, no named company (B82), no network, file or environment access. The functions that live in
// src/index.ts (lowerFirstIfCommon, cap, isCommonWord, money) are handed in as Deps so that this file never imports index.ts.
import { solutionBrief, clip, upperFirst, splitTopLevel, partLabel, type SolutionBrief } from './dealtext.ts';
import { explainSector, detectModel, profileFor, MODEL_NAME, VERTICALS, type Vertical, type BusinessModel } from './verticals.ts';

export interface Deps {
  lower: (s: string) => string;
  cap: (s: string) => string;
  isCommon: (w: string) => boolean;
  money: (n: number) => string;
}

// ---------------------------------------------------------------------------------------------------------------------------
// The sector and the business model, read from the inputs (the same reading as the other Revenue tools)
// ---------------------------------------------------------------------------------------------------------------------------
export interface SectorRead { v: Vertical | null; model: BusinessModel | null; line: string }
export function readSector(explicitModel: unknown, input: { seller: unknown[]; context?: unknown[]; role?: unknown[]; buyer?: unknown[] }): SectorRead {
  const read = explainSector(input);
  const m = detectModel(explicitModel, input);
  const v = profileFor(read.vertical, m.model, input);
  const via = read.source === 'context' ? ' (from the deal details: your own description names no sector)' : read.source === 'role' ? ' (from the buyer job titles: your own description names no sector)' : read.source === 'buyer' ? ' (from the buyer\'s industry: your own description names no sector, so describe what you sell for notes that fit it)' : '';
  const sector = v ? `read from your inputs as ${v.name}${via}` : 'not clear from your inputs (name the industry for sector notes)';
  const model = m.model ? `${MODEL_NAME[m.model]} (${m.how === 'input' ? 'from business_model' : m.how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})` : 'not clear from your inputs; set business_model (saas, services, connectivity, transactions, marketplace, hardware_software or investment) for advice that fits it';
  return { v, model: m.model, line: `*Sector: ${sector}. Business model: ${model}.*` };
}

// ---------------------------------------------------------------------------------------------------------------------------
// The product: a name that survives however the description is written
// ---------------------------------------------------------------------------------------------------------------------------
export interface Product {
  /** the name as typed ("Routelark", "Harbor BPO", "iLoop"); '' when the text gives no name */
  name: string;
  /** what it is, from the description ("a route planning platform for third-party logistics providers"); '' when none */
  kind: string;
  /** the parts the description lists */
  parts: string[];
  /** how a sentence refers to it: the name, or "the cloud platform" when there is no name, or "the product" */
  ref: string;
  /** the name with the kind, clipped, for a title or a table ("Harbor BPO customer experience and collections services on Beacon") */
  label: string;
  full: string;
  brief: SolutionBrief;
}
const NOT_NAME = /^(?:the|a|an|our|your|my|this|that|we|it|ai|api|apis|sms|iot|b2b|b2c|saas|cloud|managed|digital|enterprise|voice|data|security|software|platform|tool|tools|service|services|solution|solutions|product|system|systems|network|mobile|global|smart|modern|open|unified|single|new|free|full|end|real|one|all|any|each|every|no|not|ignore|identity|freight|route|routing|developer|developers|messaging|payments?|billing|workflow|supply|fleet|delivery|testing|monitoring|analytics|learning|video|customer|sales|marketing|automation|intelligence|visibility|compliance|risk|fraud|access|document|documents|knowledge|search|code|devops|infrastructure|connectivity|logistics|warehouse|inventory|retail|banking|insurance|lending|expense|expenses|spend|invoice|invoicing|procurement|hr|payroll|recruiting|support|helpdesk|ticketing|crm|erp|cpaas|bpo|ites)$/i;
const sectorWord = (w: string): boolean => VERTICALS.some((v) => v.match.test(w) || v.weak.test(w));
function kindFrom(rest: string): string {
  let k = rest.replace(/^[,:\s-]+/, '').replace(/^(?:is|are)\s+/i, '');
  const cut = k.search(/\s+\(|:\s|;\s|\s[-\u2013\u2014]\s|\s+(?:that|which|where|who|with)\s+|,\s+(?:a|an|the)\s+[A-Z]|,\s+(?:plus|with|built|designed|made|powered|delivered|backed|covering|including|spanning|for)\b/);
  if (cut > 0) k = k.slice(0, cut);
  k = k.replace(/[.,;:\s]+$/, '').trim();
  if (k.length > 120) { const c = k.lastIndexOf(', ', 120); k = c > 30 ? k.slice(0, c) : clip(k, 120); }
  return k;
}
const tidyEnd = (t: string): string => t.replace(/[\s,;:(-]+$/, '').replace(/\s+(?:and|or|the|a|an|of|to|for|with|in|on|by|at|from|as|into|across|per|that|which)$/i, '').trim();
export function productOf(solution: string, D: Deps): Product {
  const full = (solution || '').trim().replace(/\s+/g, ' ');
  const brief = solutionBrief(full);
  if (!full) return { name: '', kind: '', parts: [], ref: 'the product', label: '', full: '', brief };
  const named = !!brief.name && full.length > brief.name.length + 2 && full.startsWith(brief.name);
  let name = '';
  let kind = '';
  if (named) { name = brief.short; kind = kindFrom(brief.kind.replace(new RegExp(`^${brief.short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?\\s*`, 'i'), '')); }
  else {
    const t0 = full.split(/\s+/)[0].replace(/[,;:]+$/, '');
    const proper = /^[A-Za-z][A-Za-z0-9.&'+-]*$/.test(t0) && (/^[A-Z]/.test(t0) || /^[a-z]+[A-Z]/.test(t0)) && !D.isCommon(t0) && !NOT_NAME.test(t0) && !(/^[A-Za-z]+$/.test(t0) && sectorWord(t0));
    if (proper) {
      const toks = full.split(/\s+/);
      let run = [t0.replace(/'s$/, '')];
      for (const t of toks.slice(1, 3)) {
        const w = t.replace(/[,;:]+$/, '');
        const acronym = /^[A-Z]{2,5}$/.test(w) && !/^(?:AI|API|SMS|IOT|B2B|B2C|SAAS|CRM|ERP|HR|IT)$/.test(w);
        const word = /^[A-Z][a-z]*[A-Z0-9.][A-Za-z0-9.&'+]*$/.test(w) && !D.isCommon(w) && !NOT_NAME.test(w);
        if ((acronym || word) && !/[,;:]$/.test(toks[toks.indexOf(t) - 1] || '')) run.push(w); else break;
      }
      name = run.join(' ');
      kind = kindFrom(full.slice(run.join(' ').length).replace(/^[,;:\s]+/, ''));
    }
    else kind = kindFrom(full);
  }
  const head = kind.split(/\s+(?:for|to|that|with|of|in|on|from|which|who)\s+/i)[0].split(/\s+/).slice(0, 4).join(' ').replace(/^(?:a|an|the)\s+/i, '');
  const headNoun = head.replace(/^(?:our|your|my)\s+/i, '');
  const ref = name || (headNoun && headNoun.length > 2 && !/^[“"'(]/.test(headNoun) && /\b(?:software|platform|tool|app|apps|system|service|services|solution|suite|api|cloud|engine|assistant|agents?|network|product)$/i.test(headNoun) ? `the ${headNoun}` : 'the product');
  const kindBare = kind.replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim();
  const joined = name ? (kindBare ? `${name}${/^(?:a|an|the)\s/i.test(kindBare) ? ',' : ''} ${kindBare}` : name) : '';
  const label = name ? tidyEnd(clip(joined, 140)) : (full.length <= 120 ? full : tidyEnd(clip(kind || full, 140)));
  return { name, kind, parts: brief.parts, ref, label, full, brief };
}
/** "is a route planning platform for ...", "offers digital services", or '' when the description gives no kind. */
export function isKind(p: Product, D: Deps): string {
  let k = p.kind.replace(new RegExp(`^${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim();
  if (!p.name || !k) return '';
  // a kind written in title case ("Human Risk Management Platform") is a common noun phrase, not a name
  if (k.split(/\s+/).filter((w) => /^[A-Z][a-z]+$/.test(w)).length >= 3) k = k.replace(/\b([A-Z])([a-z]+)\b/g, (_m, a: string, b: string) => `${a.toLowerCase()}${b}`);
  // a description that already is a sentence ("Digital Fabric connects enterprises' network, cloud ...") is kept as it is
  if (/^(?:\S+\s+){0,4}(?:connects?|runs?|builds?|helps?|lets?|gives?|offers?|provides?|delivers?|unifies|brings|enables?|powers?|turns?|makes?|designs?|covers?|automates?|protects?|detects?|identifies|manages|monitors|tracks|sends|routes|plans)\b/i.test(k) && !/^(?:a|an|the)\s/i.test(k)) return k.replace(/[.]+$/, '');
  if (/^(?:a|an|the)\s/i.test(k)) return `${p.name} is ${D.lower(k)}`;
  const headPhrase = k.split(/\s+(?:for|to|that|which|with|of|in|on|from|across|built|made)\s+/i)[0];
  const last = (headPhrase.split(/\s+/).pop() || '').toLowerCase();
  const plural = /s$/.test(last) && !/(?:ss|us|is)$/.test(last);
  if (/^[A-Z][A-Za-z']*(?:'s)\b/.test(k) || (/^[A-Z]/.test(k) && !D.isCommon(k.split(/\s+/)[0]) && /'s\b/.test(k.split(/\s+/)[0]))) return `${p.name} is ${k}`;
  return plural ? `${p.name} offers ${D.lower(k)}` : `${p.name} is ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${D.lower(k)}`;
}

/** The parts a description lists: after a colon, after "covering/including/spanning", after ", with", or in the first brackets. */
export function partsIn(p: Product): string[] {
  if (p.parts.length) return p.parts.map(partLabel).filter(Boolean);
  const m = p.full.match(/,?\s+(?:covering|including|spanning)\s+(.+)$/i);
  const listFrom = (src: string): string[] => {
    const items: string[] = [];
    for (const raw of splitTopLevel(src.replace(/[.]+$/, ''))) {
      const t = raw.replace(/^and\s+/i, '').trim();
      if (!t || /\b(?:that|which|who|read|reads|delivered|built|powered|made|backed|plus)\b|(?:^|\band\s)with\b/i.test(t) || t.split(/\s+/).length > 6) break;
      items.push(partLabel(t));
    }
    return items;
  };
  if (m) { const items = listFrom(m[1]); if (items.length >= 3) return items.slice(0, 12); }
  const w = p.full.match(/,\s+with\s+(.+)$/i);
  if (w) { const items = listFrom(w[1]); if (items.length >= 3) return items.slice(0, 12); }
  const par = p.full.match(/^[^(]{3,120}\(([^()]{8,300})\)/);
  if (par) { const items = listFrom(par[1]); if (items.length >= 2) return items.slice(0, 12); }
  const verbs = '(?:designs|builds|runs|covers|provides|offers|delivers|handles|includes)';
  const act = p.full.match(new RegExp(`\\b${verbs}(?:,\\s*${verbs})*(?:\\s+and\\s+${verbs})?\\s+([^.;:]+)`, 'i'));
  if (act) {
    const items = listFrom(act[1].split(/\s+(?:under|on|with|using|through|across|via)\s+/i)[0]);
    if (items.length >= 3) return items.slice(0, 12);
  }
  return [];
}

// ---------------------------------------------------------------------------------------------------------------------------
// What the buyer compares the product with: a named vendor, a kind of tool, or a way of working
// ---------------------------------------------------------------------------------------------------------------------------
export type AltKind = 'vendor' | 'category' | 'approach';
export interface Alt { text: string; kind: AltKind; handle: string }
const APPROACH = /\b(?:do(?:ing)? nothing|status quo|inertia|spreadsheets?|excel|manual(?:ly)?|by hand|paper|whatsapp|email threads?|in-?house|ourselves|yourself|yourselves|themselves|diy|own team|internally|hire more|hiring more|more (?:people|staff|headcount|dispatchers|analysts|agents|engineers)|add(?:ing)? (?:people|headcount|staff)|ad[- ]hoc|workarounds?|from scratch|country by country|one by one|current (?:process|way|approach|setup|set-up)|existing (?:process|way|approach|setup)|old model|buying and maintaining|stay with|keep using|no change|wait and see|nothing)\b/i;
const GERUND_START = /^(?:the )?(?:buying|building|doing|hiring|using|keeping|running|managing|negotiating|dealing|relying|sticking|staying|waiting|maintaining|tracking|handling|working|stitching|collecting|copying|sending|reconciling|chasing|sourcing|patching|consolidating|entering|creating|writing|paying|operating|developing|training|reviewing|switching|self-managing|self-hosting)\b/i;
const CATEGORY = /\b(?:systems?|tools?|solutions?|vendors?|providers?|platforms?|apps?|products?|suppliers?|software|services|firms?|forwarders?|banks?|scanners?|assistants?|bots?|databases?|carriers?|operators?|partners?|programs?|offerings?|packages?|stacks?|suites?|approaches|methods|pilots?|models?|frameworks?|networks?|gateways?|telcos?|integrators?|agencies|consultancies|competitors?|servers?|devices?|checks?)\b/i;
const ACRONYM = /^[A-Z][A-Z0-9/&-]{1,5}$/;
function hasProperNoun(text: string, D: Deps): boolean {
  const toks = text.replace(/\([^)]*\)/g, ' ').split(/[\s,;:]+/).filter(Boolean);
  return toks.some((t, i) => {
    const w = t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.']+$/g, '');
    if (!w || ACRONYM.test(w) || NOT_NAME.test(w)) return false;
    const inner = /^[a-z]+[A-Z]/.test(w) || /^[A-Z][a-z]+[A-Z]/.test(w) || /\d/.test(w);
    if (!/^[A-Z]/.test(w) && !inner) return false;
    if (i === 0) return (inner || toks.length <= 3) && !D.isCommon(w);
    return !D.isCommon(w);
  });
}
export function handleOf(text: string): string {
  let t = text.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim().replace(/[.]+$/, '');
  const colon = t.indexOf(':');
  if (colon > 3 && colon <= 60) t = t.slice(0, colon);
  const lead = t.match(/^(the (?:current|old|existing|usual|traditional|previous) (?:way|approach|process|model|setup|set-up|method))\b/i);
  if (lead) return lead[1];
  const cut = t.search(/\s+(?:that|which|who|where|because|while|with|so|but|whose|tied|bound|locked|added|running|using|working|designed|focused|optimi[sz]ed|built|made|written|owned)\s+|,\s|;\s/i);
  if (cut >= 3) t = t.slice(0, cut);
  const w = t.split(' ');
  if (w.length > 7) t = w.slice(0, 6).join(' ');
  return t.replace(/\s+(?:and|or|the|a|an|of|to|for|with|in|on|by|at)$/i, '').trim();
}
export function readAlt(text: string, D: Deps, named = false): Alt {
  const t = text.trim().replace(/[.]+$/, '');
  const handle = handleOf(t);
  let kind: AltKind;
  if (GERUND_START.test(t) || APPROACH.test(t)) kind = 'approach';
  else if (hasProperNoun(t, D) && !(CATEGORY.test(t) && !named && /^[a-z]/.test(t))) kind = 'vendor';
  else if (named && !CATEGORY.test(t)) kind = 'vendor';
  else kind = 'category';
  return { text: t, kind, handle };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Claims and where they come from
// ---------------------------------------------------------------------------------------------------------------------------
export interface Source { type: 'own' | 'page' | 'quote' | 'title' | 'other'; basis: string }
/** The kind of source a trailing label names, and the basis it gives ("from a 2025 customer survey"). */
export function sourceOf(label: string): Source {
  const l = (label || '').trim();
  if (!l) return { type: 'own', basis: '' };
  let basis = '';
  const m = l.match(/(?:claims?|words|figures?|stats?|numbers?)[,;:]?\s+((?:based on|from|over|across|measured|according to|in a|in an|after|using)\b.*)$/i);
  if (m) basis = m[1].trim();
  if (/\bquote|\bsaid\b/i.test(l)) return { type: 'quote', basis };
  if (/\b(?:title|headline|case study|story)\b/i.test(l)) return { type: 'title', basis };
  if (/\b(?:page|site|website|home ?page|pages)\b|\bwords\b/i.test(l)) return { type: 'page', basis };
  return { type: 'other', basis };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Small text tools
// ---------------------------------------------------------------------------------------------------------------------------
/** Ends a sentence with one full stop (or keeps ? and !); never doubles one. */
export function endSentence(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return /[.?!]["”')]?$/.test(t) ? t : `${t}.`;
}
/** A sentence starts with a capital unless it starts with a name written with a small first letter (iLoop). */
export function sentenceCase(s: string): string {
  const t = s.trim();
  if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || '')) return t;
  return upperFirst(t);
}
/** Splits a typed list at semicolons and new lines only. */
export function listItems(s: unknown): string[] {
  if (typeof s !== 'string') return [];
  return s.split(/\n|;/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
}
const NOT_GIVEN = /^\(?\s*(?:not given|none|n\/a|unknown|tbd)\s*\)?$/i;
export const isNotGiven = (s: string): boolean => !s.trim() || NOT_GIVEN.test(s.trim());
/** "a, b and c". */
export function andList(items: string[], word = 'and'): string {
  if (items.length <= 1) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;
}
/** Removes whole sentences that were already said (case and punctuation ignored); keeps the first. Sentences under 25 characters are never removed. */
export function dropRepeats(paras: string[], seen: Set<string>): string[] {
  const out: string[] = [];
  const one = (p: string): string => {
    const parts = p.split(/(?<=[.?!])\s+(?=[A-Z“"'(0-9])/);
    const kept: string[] = [];
    for (const s of parts) {
      const k = s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (k.length >= 25) { if (seen.has(k)) continue; seen.add(k); }
      kept.push(s);
    }
    return kept.join(' ');
  };
  for (const p of paras) {
    const kept = p.split('\n').map((l) => (l.trim() ? one(l) : l)).filter((l, i, a) => l.trim() || (i > 0 && a[i - 1].trim()));
    const text = kept.join('\n').trim();
    if (text) out.push(text);
  }
  return out;
}
export { splitTopLevel, clip, upperFirst };
