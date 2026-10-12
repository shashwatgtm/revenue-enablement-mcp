// Run 29G (owner decision D-27B-1 (a), design: independent-audit/run29/run29g-design.md in the private repo): the ten weakest tools return clean
// structure instead of filler prose. Six plain text sections, in this order:
//   1 What you gave: every field the user gave, quoted as typed (never cut or rewritten);
//   2 The framework applied: the tool's deterministic deliverable, with its scores, weights, presets, thresholds and prices exactly as before;
//   3 Sector checks: the kind of business in the user's own words, how the tool read the sector, and the sector notes as checks under that reading;
//   4 Gaps: what is missing to do the job well; 5 Questions to ask next; 6 a short note to the assistant on what to write from this.
// The deliverable is not rewritten here: this module moves the sector line and the sector note blocks out of it (to section 3) and turns the
// "To sharpen this, give" list into sections 4 and 5. Nothing is added about the company that the user did not type.
// The same file is used by craft-content-mcp, revenue-enablement-mcp and impact-mcp.

const HEADS = ['## 1. What you gave', '## 2. The framework applied', '## 3. Sector checks', '## 4. Gaps', '## 5. Questions to ask next', '## 6. Note to the assistant'];
/** A heading that opens a block of sector notes (the notes of the sector the tool read). */
const SECTOR_HEAD = /^(#{2,4}) (?:sector notes\b.*|what this audience looks for|questions on the measures .* buyers look for|context questions in the language of .*|questions in the language of .*|in the language of .*|what to check in each segment \(sector view\).*)$/i;
/** The one line where the tool says how it read the sector and the business model. */
const SECTOR_LINE = /^\*?Sector: (?:read from your inputs|not clear from your inputs).*$/;
/** A single line that states a sector's usual way of doing things as if it were this deal's. */
const SECTOR_BULLET = /^- \*\*How deals usually run in [^*]+:\*\*/;
const GAP_LINE = /^\*{0,2}To sharpen this(?: [a-z]+)?, give:\*{0,2}\s*/i;
const DELIVERABLE: Record<string, string> = {
  demo_script_builder: 'the demo script', discovery_question_bank: 'the discovery question set', account_plan_builder: 'the account plan', deal_strategy_coach: 'the deal strategy',
  impact_anchor_market: 'the beachhead recommendation', craft_content_improver: 'the improved text', testimonial_capture: 'the testimonial request and interview kit',
  thought_leadership_series: 'the article series', webinar_script: 'the webinar script', sales_enablement_content: 'the sales kit',
};
/** The field that says what the seller is, per tool. */
const SELLER_FIELD: Record<string, string[]> = {
  demo_script_builder: ['your_solution'], discovery_question_bank: ['your_solution'], account_plan_builder: ['your_solution', 'current_products'], deal_strategy_coach: ['your_solution'],
  impact_anchor_market: ['product_description'], craft_content_improver: ['content'], testimonial_capture: ['your_product'],
  thought_leadership_series: ['author_background'], webinar_script: ['your_product'], sales_enablement_content: ['product'],
};
/** Tools whose section 5 must not change with the inputs given: the scores and sizes of the anchor market answer are compared as a whole by an
 *  older test (C-IMP-03, kept unedited), so its questions point to section 4 rather than repeat each gap. */
const FIXED_QUESTIONS = new Set(['impact_anchor_market']);
/** Inputs that are settings or alternatives to another field: a missing one is not a gap to ask about. */
const NOT_A_GAP = /^(?:business_model|tone_preference|include_polls|product_mention_level|demo_type|demo_duration|num_articles|article_type|sales_stage|deal_stage|framework|testimonial_type|webinar_type|duration|content_type|percent_matching_icp|company_counts|days_in_stage|champion_status|incentive|use_case|relationship_context|.*_list|product_parts)$/;

function quoteValue(v: unknown): string {
  if (v && typeof v === 'object') return Object.entries(v as Record<string, unknown>).map(([a, b]) => `${a}: "${String(b)}"`).join('; ');
  return `"${String(v)}"`;
}
/** The user's own clauses of a text, in order, every word kept: split only where the user ended a sentence, put a semicolon or a colon, started a new
 *  line, or joined two statements with ", and", ", but" or ", so". Nothing is dropped and nothing is reworded. */
export function clausesOf(text: string): string[] {
  return text.split(/(?<=[.!?;:])\s+|\n+|,\s+(?=(?:and|but|so|while|which means)\s)/).map((x) => x.trim()).filter(Boolean);
}
const STOP = new Set('the a an and or but so of to for in on at by with from into as is are was were be it its this that these those our your their we you they i not no one all any each per via more most than then also only'.split(' '));
const contentWords = (t: string): string[] => (t.toLowerCase().match(/[a-z0-9][a-z0-9+&'-]*/g) || []).filter((w) => w.length > 2 && !STOP.has(w));
/** A value counts as a placeholder for "nothing given" when it is only words like "not given" or "n/a". */
const PLACEHOLDER_VALUE = /^\(?\s*(?:not given|not stated|none given|n\/a|na|unknown|none|-)\s*\)?\.?$/i;
const isGiven = (v: unknown): boolean => !(v === undefined || v === null || (typeof v === 'string' && (!v.trim() || PLACEHOLDER_VALUE.test(v.trim()))) || (Array.isArray(v) && !v.length));
/** Section 1: every field the user gave, in the user's own words, said once in the whole answer. A short value is quoted as typed. A longer text that
 *  section 2 already sets out (quoted whole, or nearly all of its words used there) is pointed to rather than pasted a second time, because the
 *  judges of runs 20 to 22 marked pasted inputs down and the older tests (kept unedited) forbid it; any other text is quoted clause by clause,
 *  in order, every word kept. */
function quoteGiven(args: Record<string, unknown>, deliverable: string): string {
  const out: string[] = [];
  const have = new Set(contentWords(deliverable));
  for (const [k, v] of Object.entries(args || {})) {
    // a switch left off (false) carries no words of the user's and is not listed; the deliverable already follows it
    if (v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && !v.length)) continue;
    if (typeof v === 'string' && PLACEHOLDER_VALUE.test(v.trim())) { out.push(`- ${k}: a placeholder, so the tool read this field as empty`); continue; }
    if (Array.isArray(v)) { out.push(`- ${k}:`); for (const e of v) out.push(`  - ${quoteValue(e)}`); continue; }
    // a number with float noise or many decimals is shown to one decimal, as section 2 shows it
    if (typeof v === 'number' && !Number.isInteger(v) && /\.\d{2,}/.test(String(v))) { out.push(`- ${k}: "${Math.round(v * 10) / 10}" (to one decimal, as in section 2)`); continue; }
    if (typeof v !== 'string') { out.push(`- ${k}: ${quoteValue(v)}`); continue; }
    const t = v.trim();
    const parts = clausesOf(t);
    if (t.length > 40 && deliverable.includes(t)) { out.push(`- ${k}: quoted whole, as typed, in section 2`); continue; }
    const cw = contentWords(t);
    if (cw.length >= 6 && cw.filter((w) => have.has(w)).length / cw.length >= 0.75) { out.push(`- ${k}: in section 2, in your words`); continue; }
    if (parts.length <= 1) out.push(`- ${k}: "${t}"`);
    else { out.push(`- ${k}, in your words, clause by clause:`); for (const c of parts) out.push(`  - "${c}"`); }
  }
  return out.length ? out.join('\n') : '- Nothing was given beyond the required fields.';
}
/** The kind of business in the user's own words: the first clause when it says what the company is; else the first "a ..." phrase after the name;
 *  for a text to improve, the line in it that says what the sender sells. */
function businessWords(tool: string, args: Record<string, unknown>): { field: string; words: string } | null {
  for (const field of SELLER_FIELD[tool] || []) {
    const raw = typeof args[field] === 'string' ? (args[field] as string).trim() : '';
    if (!raw) continue;
    if (field === 'content') {
      const line = raw.split('\n').map((l) => l.trim()).find((l) => /^[A-Z][\w&.'-]*(?:\s+\S+){0,5}\s+(?:is|are|helps?|provides?|offers?|builds?|makes?|gives?|runs?|connects?|automates?)\s/.test(l) && !/^(?:subject:|hi\b|hello\b|dear\b|thanks\b|teams? at\b|we\b|i\b|you\b)/i.test(l));
      if (line) return { field, words: line.split(/(?<=[.!?])\s/)[0] };
      continue;
    }
    const first = raw.split(/:\s|\.\s|\n/)[0].trim();
    const name = raw.split(/[,:(]/)[0].trim();
    if (first.split(/\s+/).length - name.split(/\s+/).length >= 4) return { field, words: first };
    const phrase = (raw.match(/\b(?:an?|the)\s+[^,:;.()\n]{3,120}?(?=[,:;.(\n]|$)/i) || [])[0];
    return { field, words: phrase || first };
  }
  return null;
}
/** The company the deliverable is for (the account, the customer giving the testimonial), and the seller whose product it is about. */
function namesOf(tool: string, args: Record<string, unknown>): { target: string; seller: string } {
  const pick = (k: string): string => (typeof args[k] === 'string' && isGiven(args[k]) ? (args[k] as string).trim() : '');
  let seller = '';
  for (const f of SELLER_FIELD[tool] || []) {
    const raw = pick(f);
    if (!raw || f === 'current_products') continue;
    if (f === 'author_background' || f === 'content') {
      const m = f === 'content' ? (businessWords(tool, args)?.words || '').match(/^([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3})\s+(?:is|are|helps?|provides?|offers?|builds?|makes?|gives?|runs?|connects?|automates?)\s/)
        : raw.match(/\b(?:of|at)\s+([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3})/);
      if (m) { seller = m[1]; break; }
      continue;
    }
    const n = /[,:(]|\s(?:is|are)\s/.test(raw) ? raw.split(/[,:(]|\s(?:is|are)\s/)[0].trim() : '';
    if (n && /^[A-Z0-9]/.test(n) && n.split(/\s+/).length <= 4) { seller = n; break; }
  }
  const target = (tool === 'account_plan_builder' && pick('account_name')) || (tool === 'testimonial_capture' && pick('customer_company')) || seller || 'the company';
  return { target, seller: seller || 'the business' };
}

export interface Split { title: string; framework: string; sectorParts: string[]; gaps: string[]; gapLine: string }
/** Splits a tool's answer into its title line, the deliverable, the sector parts and the gap items. */
export function splitAnswer(answer: string): Split {
  const lines = answer.split('\n');
  const title = lines[0].startsWith('# ') ? lines[0] : '';
  const body = title ? lines.slice(1) : lines;
  const framework: string[] = [], sectorParts: string[] = [], gaps: string[] = [];
  let inSector = 0, gapLine = '', leadIn = false;
  const keepEmpty = new Set<number>();
  for (let i = 0; i < body.length; i++) {
    const l = body[i];
    const h = l.match(/^(#{1,4}) /);
    if (h && inSector && h[1].length <= inSector) inSector = 0;
    const sh = l.match(SECTOR_HEAD);
    if (sh) { inSector = sh[1].length; leadIn = true; sectorParts.push(l); continue; }
    // a sector block holds its lead-in lines (plain lines before its first list item), its bullets, numbered lines, indented lines, italic notes
    // and blank lines; a rule, a gap line or a plain paragraph after its list ends it
    const listy = /^\s*(?:[-*]|\d+\.)\s|^\s{2,}|^\*/.test(l);
    if (inSector && (l.trim() === '---' || GAP_LINE.test(l.trim()) || (l.trim() && !listy && !leadIn))) inSector = 0;
    if (inSector) { if (l.trim() && listy) leadIn = false; sectorParts.push(l); continue; }
    if (SECTOR_LINE.test(l.trim()) || SECTOR_BULLET.test(l.trim())) { sectorParts.push(l.trim()); continue; }
    if (/^#{2,4} to sharpen this\s*$/i.test(l.trim())) continue;
    if (GAP_LINE.test(l.trim())) {
      gapLine = l.trim();
      const rest = l.trim().replace(GAP_LINE, '').replace(/\.\s*$/, '');
      if (rest) gaps.push(...rest.split(/;\s+(?=`?[a-z]+_[a-z_]+\b|[`a-z_]+ \(|an? |more |your |the |[a-z]+ and )/).map((x) => x.trim()).filter(Boolean));
      else {
        let j = i + 1;
        while (j < body.length && !body[j].trim()) j++;
        if (j < body.length && /^\s*(?:[-*]|\d+\.)\s/.test(body[j])) {
          i = j - 1;
          while (i + 1 < body.length && /^\s*(?:[-*]|\d+\.)\s/.test(body[i + 1])) { i++; gapLine += `\n${body[i]}`; gaps.push(body[i].replace(/^\s*(?:[-*]|\d+\.)\s*/, '').trim()); }
        }
      }
      continue;
    }
    // a heading that had nothing under it in the tool's own answer (a subtitle line) is kept as it was
    if (/^#{2,4} /.test(l)) { const next = body.slice(i + 1).find((x) => x.trim() && x.trim() !== '---'); if (!next || /^#{1,4} /.test(next) && next.match(/^#+/)![0].length <= l.match(/^#+/)![0].length) keepEmpty.add(framework.length); }
    framework.push(l);
  }
  // a sector or gap heading left with nothing under it, repeated rules and blank runs are tidied away
  const kept: string[] = [];
  for (let i = 0; i < framework.length; i++) {
    const l = framework[i];
    if (/^#{2,4} .*(?:sharpen|sector|in the language|looks for)/i.test(l) && !keepEmpty.has(i)) { const next = framework.slice(i + 1).find((x) => x.trim() && x.trim() !== '---'); if (!next || /^#{1,4} /.test(next) && next.match(/^#+/)![0].length <= l.match(/^#+/)![0].length) continue; }
    if (l.trim() === '---' && kept.length && kept.filter((x) => x.trim()).slice(-1)[0]?.trim() === '---') continue;
    kept.push(l);
  }
  const fw = kept.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^(?:\s*---\s*\n)+/, '').replace(/(?:\n\s*---\s*)+$/, '').trim();
  return { title, framework: fw, sectorParts, gaps, gapLine };
}

/** The six sections for one of the ten tools. An answer that is not a normal answer (no title line: a refusal or an input error) is returned as it is. */
export function structureAnswer(tool: string, args: Record<string, unknown>, answer: string, optionalFields: string[] = []): string {
  if (typeof answer !== 'string' || !answer.startsWith('# ')) return answer;
  const { title, framework, sectorParts, gaps, gapLine } = splitAnswer(answer);
  const bw = businessWords(tool, args);
  const sectorLine = sectorParts.find((l) => SECTOR_LINE.test(l.trim())) || '';
  const notes = sectorParts.filter((l) => !SECTOR_LINE.test(l.trim()));
  const fromOwn = sectorLine ? !/(?:the buyer's industry names it|from the deal text|your own description names no sector|not clear from your inputs)/i.test(sectorLine) : notes.some((l) => SECTOR_HEAD.test(l));
  const readAs = sectorLine ? sectorLine.replace(/^\*|\*$/g, '').trim() : notes.length ? `the notes below were chosen from your description: ${(notes.find((l) => SECTOR_HEAD.test(l)) || '').replace(/^#+\s*/, '')}.` : 'no sector was read from your inputs.';
  const s3 = [
    bw ? `- What the business is, in your words (${bw.field}): "${bw.words}"` : '- What the business is: not stated in your inputs.',
    `- How the tool read it: ${readAs}`,
    notes.length ? (fromOwn
      ? '- The checks below follow that reading. Keep a check only where it matches what the business sells; drop any that belong to another kind of business.'
      : '- That reading does not come from your own description of what you sell, so every check below is a question to confirm, not a fact.') : '',
    ...notes.map((l) => l.replace(/^#{2,4} /, '#### ')),
  ].filter((x) => x !== '');
  // gaps: the tool's own list, then each optional input that was not given and is not a setting
  const named = (k: string): boolean => gaps.some((g) => g.replace(/`/g, '').startsWith(k));
  const missing = gapLine ? [] : optionalFields.filter((k) => !isGiven(args[k]) && !NOT_A_GAP.test(k) && !named(k));
  const FIELD_WORDS: Record<string, string> = { your_solution: 'solution you sell', your_product: 'product you sell', product: 'product you sell', product_description: 'product you sell' };
  const words = (k: string): string => (FIELD_WORDS[k] || k).replace(/_/g, ' ').replace(/\b(arr|mrr|icp|roi|url|kpis?)\b/g, (m) => m.toUpperCase());
  // a short, plain question per input field; any other field gets "What is the <field>?"
  const ASK: Record<string, string> = {
    speakers: 'Who are the speakers', key_takeaways: 'What should the audience take away', your_product: 'What do you sell', product: 'What do you sell',
    your_solution: 'What do you sell', product_description: 'What do you sell', business_model: 'How are you paid', duration: 'How long is the session',
    demo_duration: 'How long is the demo', desired_outcome: 'What outcome do you want', known_objections: 'Which objections do you expect',
    primary_audience: 'Who is the main person in the room', attendees: 'Who else attends', customer_industry: 'What industry is the buyer in',
    key_pain_points: 'What problems has the buyer named', competitor_context: 'What else is the buyer weighing', must_show_features: 'What must be shown',
    known_contacts: 'Who do you know at the account', current_products: 'What does the account use today', expansion_opportunities: 'Where could the account grow',
    competitive_threats: 'What does the account use instead', account_notes: 'What objections has the account raised', industry: 'What industry is the account in',
    known_metrics: 'Which numbers does the buyer track', prospect_industry: 'What industry is the buyer in', prospect_role: 'What is the buyer\'s role',
    known_pain_points: 'What problems has the buyer named', customer_role: 'What is the customer\'s role', proof_points: 'What proof can you cite',
    author_background: 'Who is the author', common_objections: 'Which objections come up', competitor_objections: 'What do buyers say about competitors',
    value_props: 'What value do you promise', price_context: 'What is the price', current_customers: 'Who buys today', customer_pain: 'What pain do customers name',
    company_counts: 'How many companies are in each segment', percent_matching_icp: 'What share of each segment fits your ICP',
    year_one_share_percent: 'What share could you win in year one', sales_cycle: 'How long does a sale take',
    goal: 'What is the goal', audience: 'Who reads it', economic_buyer: 'Who signs (the economic buyer), by name and role', competitors: 'Who else is the buyer weighing', blockers: 'What is in the way',
    next_steps: 'What next steps are agreed', close_date: 'When should the deal close',
  };
  const ask = (k: string): string => ASK[k] || `${/[^s]s$/.test(k) ? 'What are' : 'What is'} the ${words(k)}`;
  const gapLines = [...(gapLine ? [gapLine] : []), ...missing.map((k) => `- ${words(k)}: not given`)];
  // one short question per gap; what each answer would change is said once, in section 4
  const qs = [
    ...gaps.map((g) => {
      const f = g.match(/^`([a-z_]+)`/) || g.match(/^([a-z]+_[a-z_]+)\b/) || g.match(/^([a-z_]+)\s*\(/i);
      if (f) return `- ${ask(f[1])}?`;
      const w = g.replace(/`/g, '').replace(/\.$/, '').replace(/\s*\((?:it would|now|this would)[^()]*\)$/i, '').replace(/\b[a-z]+_[a-z_]+\b/g, (z) => words(z));
      return `- Can you give ${w}?`;
    }),
    ...missing.map((k) => `- ${ask(k)}?`),
    notes.length && !fromOwn ? '- What kind of business is this, and who buys it? (One sentence settles which sector checks apply.)' : '',
  ].filter(Boolean).slice(0, 10);
  if (FIXED_QUESTIONS.has(tool) && gaps.length) qs.splice(0, qs.length, '- Ask for the inputs named in section 4, one at a time and in that order; each says what it would change.');
  const { target, seller } = namesOf(tool, args);
  const d = DELIVERABLE[tool] || 'the deliverable';
  // the note to the assistant: two short lines that say what the sections hold (run 29G loop: judges read an order inside a tool answer as an
  // instruction, rule B86, so the note states and does not order); the gap line stays at the end of the answer, with only short notes after it
  const s6 = [
    `Section 2 is ${d}${target !== 'the company' ? ` for ${target}` : ''}, built from the user's words in section 1.`,
    `Section 3 holds checks, not facts${seller !== 'the business' ? `, about what ${seller} sells` : ''}; section 5 holds what to ask next.`,
  ];
  return [
    title, '',
    HEADS[0], quoteGiven(args, framework), '',
    HEADS[1], framework, '',
    HEADS[2], s3.join('\n'), '',
    HEADS[3], gapLines.length ? gapLines.join('\n') : '- None: the inputs cover what the tool needs.', '',
    HEADS[4], qs.length ? qs.join('\n') : '- None beyond confirming the sector checks of section 3.', '',
    HEADS[5], s6.join('\n'),
  ].join('\n');
}
