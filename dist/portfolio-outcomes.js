"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPortfolioDeals = readPortfolioDeals;
const outcomeWords = [
    ['nd', 'stalled\\s+with\\s+no[ _-]*decision|no[ _-]*decision|project\\s+paused|(?:project\\s+)?cancell?ed\\s+by\\s+(?:the\\s+)?buyer'],
    ['won', 'closed[ _-]+won|po\\s+received|won|win|signed'],
    ['lost', 'closed[ _-]+lost|went\\s+with\\s+(?:another\\s+vendor(?:\\s+or\\s+(?:the\\s+)?incumbent)?|(?:the\\s+|an?\\s+)?incumbent)|lost|loss|dropped'],
    ['open', 'still\\s+open|in\\s+progress|proposal\\s+sent|open|pending'],
];
const anyOutcome = outcomeWords.map(([, words]) => `(?:${words})`).join('|');
const startsOutcome = outcomeWords.map(([kind, words]) => ({ kind, re: new RegExp(`^(?:${words})\\b`, 'i') }));
const proseOutcome = new RegExp(`^(.+?)\\s+(${anyOutcome})(.*)$`, 'i');
function plain(text) {
    // MCP escapes caller Markdown before this module. Decode only the parsing view;
    // never return it for printing. Also works for direct calls with ordinary text.
    return text.replace(/\\([^\p{L}\p{N}\s])/gu, '$1').trim();
}
const tidyCell = (s) => s.trim().replace(/^["'*`]+|["'*`]+$/g, '').trim();
function status(text, explicit = false) {
    const s = tidyCell(text).replace(/^(?:(?:outcome|status|result|stage)\s*[:=]\s*|(?:was|is|marked|ended)\s+(?:as\s+)?)/i, '').trim();
    for (const { kind, re } of startsOutcome) {
        const hit = re.exec(s);
        if (!hit)
            continue;
        const tail = s.slice(hit[0].length).trim();
        // Do not turn a contraction, question or conflicting alternatives into a firm outcome.
        if (/^['’]t\b|^\?|^(?:maybe|possibly|perhaps|not confirmed|unconfirmed)\b/i.test(tail))
            return null;
        if (new RegExp(`^(?:or|and|/)\\s*(?:${anyOutcome})\\b`, 'i').test(tail))
            return null;
        if (tail && !explicit && !/^[,;.:()[\]{}\-–—]|^(?:because|due to|after|on|for|with|at|since|by|today|yesterday|this|last|reason|budget)\b|^(?:the|an?)\s+(?:order|contract|agreement|deal)\b/i.test(tail))
            return null;
        return kind;
    }
    return null;
}
function cells(line) {
    const delimiters = new Set();
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            if (quoted && line[i + 1] === '"')
                i++;
            else
                quoted = !quoted;
        }
        else if (!quoted && [',', '|', '\t'].includes(line[i]))
            delimiters.add(line[i]);
    }
    const separator = ['\t', '|', ','].find(s => delimiters.has(s)) || null;
    if (!separator)
        return { values: [line], separator };
    const values = [];
    let value = '';
    quoted = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (quoted && line[i + 1] === '"') {
                value += '"';
                i++;
            }
            else
                quoted = !quoted;
        }
        else if (ch === separator && !quoted) {
            values.push(tidyCell(value));
            value = '';
        }
        else
            value += ch;
    }
    values.push(tidyCell(value));
    if (separator === '|') {
        if (!values[0])
            values.shift();
        if (!values.at(-1))
            values.pop();
    }
    return { values, separator };
}
function content(raw) {
    let syntax = plain(raw), listed = false;
    // Strip formatting, not a fixed set of deal names or industries. Emoji bullets,
    // nested bullets and both common numbered-list markers use the same path.
    for (;;) {
        const next = syntax.replace(/^(?:\d+[.)]|\(\d+\)|\[\d+\]|[-*+•●◦▪▫‣]|\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*/u, '');
        if (next === syntax)
            break;
        listed = true;
        syntax = next.trim();
    }
    return { syntax: syntax.replace(/^#{1,6}\s+/, '').trim(), listed };
}
const labelLine = /^(?:(?:recent|closed|won|lost|open|no[ _-]*decision|closed[ _-]+(?:won|lost))\s+)?deals?\s*:?$|^(?:outcomes?|results?|status|labels?|reasons?|notes?)\s*:/i;
const totals = /^(?:grand\s+total|sub[ -]?total|total|overall|summary|aggregate)\b|^(?:\d+|n|zero|one|two|three|four|five|six|seven|eight|nine|ten)\s+deals?\b/i;
const resultHeader = /^(?:deal[ _-]?|pipeline[ _-]?)?(?:outcome|status|result|stage)$/i;
const nameHeader = /^(?:deal(?: name)?|name|account(?: name)?|opportunity(?: name)?|customer|client)$/i;
function rowStatus(text, listed) {
    if (labelLine.test(text) || totals.test(text))
        return null;
    // An explicit result field outranks a preceding reason, whatever the column order.
    const named = /\b(?:outcome|status|result|stage)\s*[:=]\s*([^,|;\t]+)/gi;
    for (const hit of text.matchAll(named)) {
        const result = status(hit[1], true);
        if (result)
            return result;
    }
    const normalized = text.replace(/\bno\s*[-–—]\s*decision\b/gi, 'no decision').replace(/\bclosed\s*[-–—]\s*(won|lost)\b/gi, 'closed $1');
    const parts = normalized.split(/[,|:\t;()[\]{}\-–—]|\bwas\b/i).map(tidyCell).filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
        if (/^(?:reason|notes?|comments?)\b\s*[:=]?$/i.test(parts[i]))
            break;
        const found = status(parts[i]);
        // A bare outcome label is not a named deal. A list marker can identify a row.
        if (found && (listed || parts.length > 1 || i > 0))
            return found;
    }
    // Natural subject/predicate rows need no chosen separator. Article fragments,
    // future/negated results and a rival's win are not our stated deal outcome.
    const match = proseOutcome.exec(normalized);
    if (!match || /\b(?:not|never|no longer|didn't|wasn't|isn't|would|will|may|might|maybe|possibly|perhaps|could|should|if|whether|hope|hoped|expected|planned)\b|\babout\b|\b(?:reason|incumbent|competitor|rival|vendor)\s*$/i.test(match[1]))
        return null;
    return status(match[2] + match[3]);
}
function readPortfolioDeals(input) {
    const rows = [];
    let schema = null;
    for (const raw of input.split(/\r\n|\n|\r/)) {
        const { syntax, listed } = content(raw);
        if (!syntax || /^[|\s:\-]+$/.test(syntax))
            continue;
        const fields = cells(syntax);
        const outcome = fields.values.findIndex(x => resultHeader.test(x));
        const name = fields.values.findIndex(x => nameHeader.test(x));
        if (fields.separator && outcome >= 0 && name >= 0) {
            schema = { separator: fields.separator, outcome, name };
            continue;
        }
        if (totals.test(fields.values[0]) || labelLine.test(syntax) || (!listed && !fields.separator && status(syntax)))
            continue;
        let found;
        if (schema && schema.separator === fields.separator) {
            // A supplied outcome column is authoritative. Never borrow its reason as a
            // result when that cell is unread, even if the reason mentions an outcome.
            found = fields.values[schema.name] ? status(fields.values[schema.outcome] || '', true) : null;
        }
        else {
            // Preserve CSV quoting before considering other row punctuation.
            const explicit = fields.values.map(x => x.match(/^(?:outcome|status|result|stage)\s*[:=]\s*(.+)$/i)?.[1]).find(Boolean);
            found = explicit ? status(explicit, true) : null;
            if (!found) {
                for (let i = 0; i < fields.values.length; i++) {
                    if (/^(?:reason|notes?|comments?)\s*:/i.test(fields.values[i]))
                        break;
                    const value = status(fields.values[i]);
                    if (value && (listed || fields.values.length > 1)) {
                        found = value;
                        break;
                    }
                }
            }
            if (!found && !fields.values.some(x => /^(?:reason|notes?|comments?)\s*:/i.test(x)))
                found = rowStatus(syntax, listed);
        }
        if (found)
            rows.push({ text: raw.trim(), outcome: found });
    }
    return rows;
}
//# sourceMappingURL=portfolio-outcomes.js.map