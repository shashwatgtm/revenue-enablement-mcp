/** Read stated outcomes independently of row formatting. Printed text stays inert. */
export type PortfolioOutcome = 'won' | 'lost' | 'nd' | 'open';
export interface PortfolioDeal { text: string; outcome: PortfolioOutcome }
const outcomeWords = [
  ['nd', 'stalled\\s+with\\s+no[ _-]*decision|no[ _-]*decision|project\\s+paused|(?:project\\s+)?cancell?ed\\s+by\\s+(?:the\\s+)?buyer'],
  ['won', 'closed[ _-]+won|po\\s+received|won|win|signed'],
  ['lost', 'closed[ _-]+lost|went\\s+with\\s+(?:another\\s+vendor(?:\\s+or\\s+(?:the\\s+)?incumbent)?|(?:the\\s+|an?\\s+)?incumbent)|lost|loss|dropped'],
  ['open', 'still\\s+open|in\\s+progress|proposal\\s+sent|open|pending'],
] as const;
const anyOutcome = outcomeWords.map(([, words]) => `(?:${words})`).join('|');
const startsOutcome = outcomeWords.map(([kind, words]) => ({ kind, re: new RegExp(`^(?:${words})\\b`, 'i') }));
const proseOutcome = new RegExp(`^(.+?)\\s+(${anyOutcome})(.*)$`, 'i');
const wholeOutcome = new RegExp(`^(?:${anyOutcome})[.!]?$`, 'i');
const outcomeHeading = new RegExp(`^(?:${anyOutcome})\\s+(?:review|report|summary|analysis|counts?|rates?)\\b`, 'i');
const openStage = /^(?:negotiation|proposal|discovery|qualification|demo|evaluation|commit)\b/i;
function plain(text: string): string {
  // MCP escapes caller Markdown before this module. Decode only the parsing view;
  // never return it for printing. Also works for direct calls with ordinary text.
  return text.replace(/\\([^\p{L}\p{N}\s])/gu, '$1').replace(/[’‘]/g, "'").trim();
}
const tidyCell = (s: string) => s.trim().replace(/^["'*`]+|["'*`]+$/g, '').trim();
function status(text: string, explicit = false): PortfolioOutcome | null {
  const s = tidyCell(text).replace(/^(?:(?:outcome|status|result|stage)\s*[:=]\s*|(?:was|is|marked|ended)\s+(?:as\s+)?)/i, '').trim();
  for (const { kind, re } of startsOutcome) {
    const hit = re.exec(s); if (!hit) continue;
    const tail = s.slice(hit[0].length).trim();
    // Do not turn a contraction, question or conflicting alternatives into a firm outcome.
    if (/^['’]t\b|^\?|^(?:maybe|possibly|perhaps|if|unless|would|will|could|might|not confirmed|unconfirmed)\b/i.test(tail)) return null;
    if (new RegExp(`^(?:or|and|/)\\s*(?:${anyOutcome})\\b`, 'i').test(tail)) return null;

    return kind;
  }
  const stage = explicit ? openStage.exec(s) : null;
  return stage && !/^\s*\?/.test(s.slice(stage[0].length)) ? 'open' : null;
}
const exactStatus = (s: string) => wholeOutcome.test(tidyCell(s)) ? status(s) : null;
const uncertainStart = (s: string) => /^(?:if|unless|suppose|imagine|maybe|possibly|perhaps|could|would|should|might|may|will|whether|did|does|can)\b/i.test(s.trim()) || /^(?:has|have|was|were|is|are)\b.*\?/i.test(s.trim());
const negatedEnd = (s: string) => /\b(?:not|never|no longer|[a-z]+n['’]t)\s*$/i.test(s);
const negativeBefore = (s: string) => /\b(?:not|never|no longer|[a-z]+n['’]t)\b/i.test(s);
interface Cells { values: string[]; separator: string | null }
function cells(line: string): Cells {
  const delimiters = new Set<string>(); let quoted = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { if (quoted && line[i + 1] === '"') i++; else quoted = !quoted; }
    else if (!quoted && [',', '|', '\t'].includes(line[i])) delimiters.add(line[i]);
  }
  const separator = ['\t', '|', ','].find(s => delimiters.has(s)) || null;
  if (!separator) return { values: [line], separator };
  const values: string[] = []; let value = ''; quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (ch === separator && !quoted) { values.push(tidyCell(value)); value = ''; }
    else value += ch;
  }
  values.push(tidyCell(value));
  if (separator === '|') { if (!values[0]) values.shift(); if (!values.at(-1)) values.pop(); }
  return { values, separator };
}
function content(raw: string): { syntax: string; listed: boolean } {
  let syntax = plain(raw), listed = false;
  // Strip formatting, not a fixed set of deal names or industries. Emoji bullets,
  // nested bullets and both common numbered-list markers use the same path.
  for (;;) {
    const next = syntax.replace(/^(?:\d+[.)]|\(\d+\)|\[\d+\]|[-*+•●◦▪▫‣]|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*/u, '');
    if (next === syntax) break;
    listed = true; syntax = next.trim();
  }
  return { syntax: syntax.replace(/^#{1,6}\s+/, '').trim(), listed };
}
const labelLine = /^(?:(?:recent|closed|won|lost|open|no[ _-]*decision|closed[ _-]+(?:won|lost))\s+)?deals?\s*:?$|^(?:outcomes?|results?|status|labels?|reasons?|notes?)\s*:/i;
const totals = /^(?:grand\s+total|sub[ -]?total|total|overall|summary|aggregate)\b|^(?:\d+|n|zero|one|two|three|four|five|six|seven|eight|nine|ten)\s+deals?\b/i;
const resultHeader = /^(?:deal[ _-]?|pipeline[ _-]?)?(?:outcome|status|result|stage)$/i;
const nameHeader = /^(?:deal(?: name)?|name|account(?: name)?|opportunity(?: name)?|customer|client)$/i;
function rowStatus(text: string, listed: boolean): PortfolioOutcome | null {
  if (labelLine.test(text) || totals.test(text) || uncertainStart(text)) return null;
  // Explicit result fields are facts, not reasons, regardless of their position.
  const named = /\b(?:outcome|status|result|stage)\s*[:=]\s*([^,|;\t]+)/gi;
  for (const hit of text.matchAll(named)) { const result = status(hit[1], true); if (result) return result; }
  const normalized = text.replace(/(?:->|=>|→)/g, ':').replace(/\bno\s*[-–—]\s*decision\b/gi, 'no decision').replace(/\bclosed\s*[-–—]\s*(won|lost)\b/gi, 'closed $1');
  const parts = normalized.split(/[,|:\t;()[\]{}\-–—]|\bwas\b/i).map(tidyCell).filter(Boolean);
  // Later segments follow an identifier. A reason marker ends the result fields.
  // Start-of-segment outcomes accept arbitrary trailing reasons, not a tail-word list.
  for (let i = 1; i < parts.length; i++) {
    if (/^(?:reason|notes?|comments?)\b\s*[:=]?$/i.test(parts[i])) break;
    if (negatedEnd(parts.slice(0, i).join(' '))) continue;
    const found = status(parts[i]); if (found) return found;
  }
  if (parts.length) {
    const first = outcomeHeading.test(parts[0]) ? null : status(parts[0]);
    if (first && (listed || parts.length > 1 || !exactStatus(parts[0]))) return first;
  }
  if (startsOutcome.some(({ re }) => re.test(normalized))) return null;
  return subjectStatus(normalized);
}
function subjectStatus(text: string): PortfolioOutcome | null {
  // The predicate, not the following object or reason, establishes the outcome.
  const match = proseOutcome.exec(text);
  if (!match || uncertainStart(text) || negativeBefore(match[1]) || /\b(?:would|will|may|might|maybe|possibly|perhaps|could|should|if|whether|hope|hoped|expected|planned)\b|\babout\b|\b(?:reason|incumbent|competitor|rival|vendor)\s*$/i.test(match[1])) return null;
  return status(match[2] + match[3]);
}

function sentenceRows(raw: string): string[] {
  const rows: string[] = []; let start = 0;
  const boundary = /[.!?](?:["”'’]?)(\s+)(?=\S)/g;
  for (const hit of raw.matchAll(boundary)) {
    const end = hit.index + hit[0].length - hit[1].length;
    const candidate = raw.slice(start, end);
    // A numbered-list dot is formatting, not the end of a deal sentence.
    if (!content(candidate).syntax) continue;
    rows.push(candidate.trim()); start = hit.index + hit[0].length;
  }
  if (raw.slice(start).trim()) rows.push(raw.slice(start).trim());
  return rows;
}
export function readPortfolioDeals(input: string): PortfolioDeal[] {
  const rows: PortfolioDeal[] = [];
  let schema: { separator: string; outcome: number; name: number } | null = null;
  for (const raw of input.split(/\r\n|\n|\r/)) {
    const original = content(raw), originalFields = cells(original.syntax);
    if (!original.syntax || /^[|\s:\-]+$/.test(original.syntax)) continue;
    const outcome = originalFields.values.findIndex(x => resultHeader.test(x));
    const name = originalFields.values.findIndex(x => nameHeader.test(x));
    if (originalFields.separator && outcome >= 0 && name >= 0) { schema = { separator: originalFields.separator, outcome, name }; continue; }
    if (totals.test(originalFields.values[0]) || labelLine.test(original.syntax)) continue;
    // An export row remains one record even when its quoted reason has sentences.
    const firstIsProse = !status(originalFields.values[0]) && rowStatus(originalFields.values[0], original.listed) !== null;
    const exportRow = originalFields.separator && (schema?.separator === originalFields.separator || originalFields.separator !== ',' || (raw.includes('"') && !firstIsProse));
    for (const piece of exportRow ? [raw] : sentenceRows(raw)) {
      const { syntax, listed } = content(piece), fields = cells(syntax);
      if (!syntax || totals.test(fields.values[0]) || labelLine.test(syntax) || uncertainStart(syntax) || (!listed && !fields.separator && exactStatus(syntax))) continue;
      let found: PortfolioOutcome | null = null;
      if (schema && schema.separator === fields.separator) {
        // Only a labelled result/stage field can turn a CRM stage into open.
        found = fields.values[schema.name] ? status(fields.values[schema.outcome] || '', true) : null;
      } else {
        const explicit = fields.values.map(x => x.match(/^(?:outcome|status|result|stage)\s*[:=]\s*(.+)$/i)?.[1]).find(Boolean);
        found = explicit ? status(explicit, true) : null;
        // A stated result in the first prose segment precedes any later reason.
        if (!found) found = rowStatus(fields.values[0], listed);
        if (!found && fields.values.length > 1) found = exactStatus(fields.values[0]);
        if (!found) for (let i = 1; i < fields.values.length; i++) {
          if (/^(?:reason|notes?|comments?)\s*:/i.test(fields.values[i])) break;
          if (negatedEnd(fields.values.slice(0, i).join(' '))) continue;
          const value = status(fields.values[i]); if (value) { found = value; break; }
        }
        // A colon/prose result can precede a comma-separated reason. Read that
        // first segment without letting the later reason supply a different result.
        if (!found) found = rowStatus(fields.values[0], listed);
      }
      if (found) rows.push({ text: piece.trim(), outcome: found });
    }
  }
  return rows;
}
