"use strict";
// Run 20 round 1b (D92): text helpers shared by the Revenue tools. Pure functions, no network, no figures (B82).
// They exist so that text a user typed is cut and reused by parts that are really there: a product description is split into its
// name, its kind and its listed parts; contacts become one row each with the role the user stated; proof becomes items with their
// labels; an objection is answered by its kind. Nothing here says a fact about the user's product: where a fact is needed, the
// helper says what to confirm.
Object.defineProperty(exports, "__esModule", { value: true });
exports.weekdayName = exports.isoDate = exports.upperFirst = exports.lowerFirstWord = void 0;
exports.splitTopLevel = splitTopLevel;
exports.sentences = sentences;
exports.clip = clip;
exports.joinList = joinList;
exports.solutionBrief = solutionBrief;
exports.partLabel = partLabel;
exports.familyOf = familyOf;
exports.levelOf = levelOf;
exports.parseContacts = parseContacts;
exports.tagKind = tagKind;
exports.parseProof = parseProof;
exports.proofSource = proofSource;
exports.pickProof = pickProof;
exports.proofPhrase = proofPhrase;
exports.isWeekend = isWeekend;
exports.onOrBeforeWorkday = onOrBeforeWorkday;
exports.onOrAfterWorkday = onOrAfterWorkday;
exports.addWorkdays = addWorkdays;
exports.workdaysBetween = workdaysBetween;
exports.painClauses = painClauses;
exports.describeWith = describeWith;
exports.aAn = aAn;
exports.splitFeatureList = splitFeatureList;
// ---------------------------------------------------------------------------------------------------------------------------
// Splitting
// ---------------------------------------------------------------------------------------------------------------------------
/** Splits at commas that are outside brackets and quotes. */
function splitTopLevel(text, sep = /,/) {
    const out = [];
    let depth = 0;
    let cur = '';
    let quote = false;
    const re = new RegExp(sep.source, sep.flags.replace('g', ''));
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '(' || ch === '[')
            depth++;
        else if ((ch === ')' || ch === ']') && depth > 0)
            depth--;
        else if (ch === '"' || ch === '“' || ch === '”')
            quote = !quote;
        // a comma inside a number ("700,000+") is never a separator
        const inNumber = ch === ',' && /\d/.test(text[i - 1] || '') && /^\d{3}(?!\d)/.test(text.slice(i + 1));
        if (depth === 0 && !quote && !inNumber) {
            const m = re.exec(text.slice(i));
            if (m && m.index === 0 && m[0].length > 0) {
                out.push(cur);
                cur = '';
                i += m[0].length - 1;
                continue;
            }
        }
        cur += ch;
    }
    out.push(cur);
    return out.map((x) => x.trim()).filter(Boolean);
}
const ABBREV = /(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e|Rs|Inc|Ltd|Co|St|No|approx|incl|Fig|Eq)|\b[A-Z])\.$/;
/** Sentences, split only at a real sentence end: not inside a number (3.5), an abbreviation (Rs. 15, e.g.) or after a single capital. */
function sentences(text) {
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t)
        return [];
    const out = [];
    let start = 0;
    const re = /[.!?]+(?=\s+["'“(\[]?[A-Z0-9])/g;
    let m;
    while ((m = re.exec(t))) {
        const end = m.index + m[0].length;
        const piece = t.slice(start, end);
        if (ABBREV.test(piece.trim()) && !/[!?]$/.test(piece.trim()))
            continue;
        out.push(piece.trim());
        start = end;
    }
    const rest = t.slice(start).trim();
    if (rest)
        out.push(rest);
    return out;
}
/** Cuts a text at a word boundary, never inside a word; adds nothing when it already fits. */
function clip(text, max) {
    const t = text.trim();
    if (t.length <= max)
        return t;
    const cut = t.slice(0, max);
    const sp = cut.lastIndexOf(' ');
    return (sp > max * 0.5 ? cut.slice(0, sp) : cut).replace(/[\s,;:(-]+$/, '').replace(/\b(?:and|or|the|a|an|of|to|for|with|in|on|by)$/i, '').trim();
}
/** "a, b and c" from a list. */
function joinList(items, word = 'and') {
    if (items.length <= 1)
        return items[0] || '';
    return `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;
}
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const lowerFirstWord = (s) => (/^[A-Z][a-z]/.test(s) && !/^(?:I|AI|API|ERP|CRM)\b/.test(s) ? lc(s) : s);
exports.lowerFirstWord = lowerFirstWord;
const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
exports.upperFirst = upperFirst;
function leadingCapitals(name) {
    const words = name.split(/\s+/);
    const out = [];
    for (const w of words) {
        if (/^[A-Z0-9][A-Za-z0-9.&'-]*$/.test(w) || (out.length && /^(?:of|and|for)$/i.test(w) && false))
            out.push(w);
        else
            break;
    }
    return out.slice(0, 3).join(' ') || words.slice(0, 2).join(' ');
}
const NOT_A_NAME = /^(?:platform|software|tool|tools|solution|solutions|product|products|app|apps|service|services|saas|suite|system|systems|ai|api|apis|our|your|the|a|an|we|this|that|my|it)$/i;
const NAME_JOINERS = /^(?:from|by|of|for|and|&|the|de)$/i;
/** True only when the text before a comma or colon reads as a product name the user typed: one word, or up to four words starting with a capital ("Acme CRM", "Branchwire managed SD-WAN"), as CRAFT GTM's shortName() reads it. */
function isClearName(name) {
    const toks = name.split(/\s+/);
    if (!toks.length || toks.length > 4)
        return false;
    if (/^(?:our|your|the|a|an|we|this|that|my)$/i.test(toks[0]))
        return false;
    if (toks.length === 1)
        return /^[A-Za-z0-9][A-Za-z0-9.&'+-]*$/.test(toks[0]) && !NOT_A_NAME.test(toks[0]);
    if (!/^[A-Z0-9]/.test(toks[0]) || NAME_JOINERS.test(toks[toks.length - 1]))
        return false;
    return !/\b(?:helps?|reduces?|gives?|lets?|makes?|that|which|who|where)\b/i.test(name);
}
function solutionBrief(input) {
    const full = (input || '').trim().replace(/\s+/g, ' ');
    if (!full)
        return { name: '', short: '', kind: '', parts: [], full: '' };
    const comma = full.indexOf(', ');
    const colon = full.indexOf(': ');
    let name = full;
    let rest = '';
    let named = false;
    if (comma > 0 && comma <= 80 && (colon < 0 || comma < colon) && isClearName(full.slice(0, comma))) {
        name = full.slice(0, comma);
        rest = full.slice(comma + 2);
        named = true;
    }
    else if (colon > 0 && colon <= 80 && isClearName(full.slice(0, colon))) {
        name = full.slice(0, colon);
        rest = full.slice(colon + 2);
        named = true;
    }
    if (!named) {
        // run 21c A1: no name was clearly given. A short description is used whole; a long one gives no short name (callers say "your solution").
        // A list of parts after a colon is still read.
        const wordsAll = full.split(/\s+/).length;
        const short = wordsAll <= 6 ? full.replace(/[.]+$/, '') : '';
        const at = full.indexOf(': ');
        let parts = [];
        if (at > 0 && at <= 120) {
            const probe = solutionBrief(`Zq${full.slice(at)}`);
            parts = probe.parts;
        }
        return { name: short, short, kind: '', parts, full };
    }
    let short = name.split(/\s+from\s+/i)[0];
    if (short.split(/\s+/).length > 4)
        short = leadingCapitals(short);
    // kind: the words up to the first colon, " made of ", " that ", " which " or " - "
    let kindSrc = rest;
    const colonAt = kindSrc.indexOf(': ');
    let partsSrc = '';
    if (colonAt >= 0) {
        partsSrc = kindSrc.slice(colonAt + 2);
        kindSrc = kindSrc.slice(0, colonAt);
    }
    const made = kindSrc.search(/\s+made (?:of|up of)\s+/i);
    if (made >= 0) {
        partsSrc = partsSrc || kindSrc.slice(made).replace(/^\s+made (?:of|up of)\s+/i, '');
        kindSrc = kindSrc.slice(0, made);
    }
    const cutAt = kindSrc.search(/\s+(?:that|which|where)\s+|\s+[-\u2013\u2014]\s+/i);
    if (cutAt > 0)
        kindSrc = kindSrc.slice(0, cutAt);
    const kind = clip(kindSrc.replace(/[.;]+$/, ''), 150);
    let parts = [];
    if (partsSrc) {
        // a trailing "for <buyers>" is who it is for, not a part
        const src = partsSrc.replace(/[.]+$/, '').replace(/,\s+for\s+.*$/i, '');
        const top = splitTopLevel(src);
        const expanded = [];
        top.forEach((p, i) => {
            if (i === top.length - 1 && top.length > 1) {
                // the last item may hold the closing "and": "X (a, b) and Y analytics" is two parts; "travel and expense analytics" stays one when no bracket comes before the "and"
                const m = p.match(/^(.*\))\s+and\s+(.+)$/);
                if (m) {
                    expanded.push(m[1]);
                    expanded.push(m[2]);
                    return;
                }
                const m2 = p.match(/^(.+?)\s+and\s+(.+)$/);
                if (m2 && /^(?:[a-z]+\s+){0,2}[a-z]+$/i.test(m2[1]) && !/\b(?:builds?|runs?|designs?)\b/i.test(m2[1]) && m2[1].split(/\s+/).length >= 2) {
                    expanded.push(m2[1]);
                    expanded.push(m2[2]);
                    return;
                }
            }
            expanded.push(p);
        });
        const cleaned = expanded.map((p) => p.replace(/^and\s+/i, '').trim()).filter((p) => p.length > 1);
        // a sentence about the product is not a list of parts
        const sentenceLike = cleaned.some((p) => /\b(?:designs|builds|runs|helps|overlays)\b/i.test(p) || partLabel(p).split(/\s+/).length > 12 || (short.length > 2 && p.toLowerCase().includes(short.toLowerCase())));
        parts = !sentenceLike && cleaned.length >= 2 ? cleaned.slice(0, 14) : [];
    }
    return { name, short: short || name, kind, parts, full };
}
/** The name of a part without its bracket: "prepaid cards (petty cash, fleet)" -> "prepaid cards". */
function partLabel(part) {
    return part.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(?:a|an|the)\s+/i, '');
}
const FAMILY_RULES = [
    ['investment', /\b(?:portfolio manager|chief investment|investment (?:committee|officer|team)|allocators?)/i],
    ['security', /\b(?:ciso|chief information security|cso\b|security|soc\b|infosec|threat|incident response|brand protection|cyber)/i],
    ['risk', /\b(?:risk|compliance|audit|legal|counsel|dpo|privacy|governance)/i],
    ['finance', /\b(?:cfo|chief financial|finance|controller|treasur|accounts? (?:payable|receivable)|accounting|fp&a|billing)/i],
    ['procurement', /\b(?:procurement|purchasing|vendor management|sourcing)/i],
    ['hr', /\b(?:hr\b|human resources|people (?:operations|team)|chro)/i],
    ['engineering', /\b(?:cto\b|chief technology|engineer|developer|devops|qa\b|testing|test\b|architect|platform (?:leader|lead|team)|software|sre)/i],
    ['data', /\b(?:data|analytics|ai\b|ml\b)/i],
    ['it', /\b(?:cio\b|chief information officer|it\b|information technology|infrastructure|network|systems?|digital transformation|technology)/i],
    ['operations', /\b(?:coo\b|chief operating|operations|supply chain|logistics|last[- ]mile|fleet|dispatch|transport|fulfil|warehouse|e-?commerce|delivery)/i],
    ['sales', /\b(?:sales|revenue|cro\b|gtm|business development|commercial|field|distribut|trade marketing|route to market)/i],
    ['product', /\b(?:product|cpo\b)/i],
    ['marketing', /\b(?:marketing|cmo\b|growth|brand)/i],
    ['customer', /\b(?:customer (?:experience|success|service)|support|service agents?|cx\b)/i],
    ['executive', /\b(?:ceo|founder|co-founder|managing director|md\b|president|chairman|owner|general manager|gm\b|business unit head)/i],
];
/** The family of a job title. When the seller is an investment manager, a plain CIO is the chief investment officer. */
function familyOf(title, investmentBuyer = false) {
    if (investmentBuyer && /\b(?:cio|chief investment officer)\b/i.test(title) && !/information/i.test(title))
        return 'investment';
    for (const [f, re] of FAMILY_RULES)
        if (re.test(title))
            return f;
    return 'other';
}
function levelOf(title) {
    const t = title.toLowerCase();
    if (/\b(?:chief|ceo|cfo|coo|cio|cto|ciso|cso|cmo|cro|cpo|founder|owner|managing director|chairman)\b/.test(t) || (/\bpresident\b/.test(t) && !/\bvice president\b/.test(t)))
        return 'exec';
    if (/\b(?:vp|vice president|svp|evp|head|director|general manager|gm\b|leader|sr\.? director)\b/.test(t) && !/\bteams?\b/.test(t))
        return 'head';
    if (/\b(?:teams?|committees?|users?|analysts|agents|reps|representatives|employees|managers|engineers|developers|administrators?)\b/.test(t) && !/\b(?:senior|sr\.?|lead|principal)\b/.test(t) && /s\b|team/.test(t))
        return 'group';
    if (/\b(?:manager|lead|senior|sr\.?|principal|supervisor)\b/.test(t))
        return 'manager';
    return 'staff';
}
const TITLE_WORD = /\b(?:manager|director|vp|head|lead|chief|officer|president|engineer|analyst|architect|developer|advocate|founder|owner|specialist|consultant|executive|administrator|coordinator|controller|supervisor|counsel|partner)\b/i;
const BARE_TITLE_END = /\b(?:manager|director|vp|head|lead|chief|officer|president|senior|sr\.?|vice president|svp|evp)$/i;
/** One contact per entry. Splits at semicolons, new lines and commas outside brackets; "Manager, Operations (champion)" stays one title. */
function parseContacts(text, investmentBuyer = false) {
    if (typeof text !== 'string' || !text.trim())
        return [];
    const chunks = [];
    for (const line of text.split(/\n|;/)) {
        const l = line.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '');
        if (!l)
            continue;
        const pieces = splitTopLevel(l);
        for (const p of pieces) {
            const prev = chunks.length ? chunks[chunks.length - 1] : '';
            const bare = p.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
            const prevOpen = prev && !/\)\s*$/.test(prev) && BARE_TITLE_END.test(prev.trim());
            const looksLikeFunction = bare.split(/\s+/).length <= 3 && /^[A-Z]/.test(bare) && !TITLE_WORD.test(bare) && !/\b(?:teams?|managers|employees|analysts|users)\b/i.test(bare);
            if (prevOpen && looksLikeFunction && !/^(?:HR|IT)$/.test(bare))
                chunks[chunks.length - 1] = `${prev}, ${p}`;
            else
                chunks.push(p);
        }
    }
    return chunks.map((raw) => {
        const m = raw.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
        const title = (m ? m[1] : raw).trim();
        let tag = m ? m[2].trim().toLowerCase() : null;
        if (!tag) {
            const asM = raw.match(/^(.*?)\s*[-\u2013:]\s*(champion|economic buyer|buyer|decision maker|sponsor|blocker|user|influencer|evaluator)\s*$/i);
            if (asM)
                return { raw, title: asM[1].trim(), tag: asM[2].toLowerCase(), family: familyOf(asM[1], investmentBuyer), level: levelOf(asM[1]) };
        }
        return { raw, title, tag, family: familyOf(title, investmentBuyer), level: levelOf(title) };
    });
}
/** Plain words for a stated tag ("economic buyer" stays; "buyer" is the person who decides). */
function tagKind(tag) {
    if (!tag)
        return null;
    if (/champion|sponsor|advocate/.test(tag))
        return 'champion';
    if (/economic/.test(tag))
        return 'economic';
    if (/buyer|decision|signs?|approver/.test(tag))
        return 'buyer';
    if (/block|against|oppos|detract|negative/.test(tag))
        return 'blocker';
    if (/user/.test(tag))
        return 'user';
    if (/influenc|evaluat|technical|neutral|supporter|support/.test(tag))
        return 'influencer';
    return 'other';
}
const RECOGNITION = /\b(?:named|leader|award|recogni(?:[sz]\w*|tion)|featured|frost radar|magic quadrant|analyst|excellence|ranked|ranking|everest|hfs|isg|kuppingercole|gartner|forrester|idc|g2\b|enterprise innovator|major contender|certified|empanel\w*)\b/i;
const RESULT = /\d[\d,.]*\s?(?:%|x\b|X\b|percent|hours?|days?|weeks?|months?|minutes?|crore|lakhs?|million|billion|mn\b|bn\b|m\b)|\b(?:\d+x|half|doubl\w+|triple\w*)\b|\bsav(?:ed|ing|es)\b|\b(?:cut|cuts|reduc\w+|improv\w+|increas\w+|faster|fewer|lower|higher|grew|grow\w*|jumped|boost\w+|achiev\w+)\b/i;
const SCALE = /\b(?:\d[\d,.+]*\s?(?:\+|k\b|m\b|million|billion|lakhs?|crore)?\s*(?:companies|customers|businesses|brands|users|clients|teams|developers|sources|countries|retailers)|trust|use[sd]? by|more than \d)/i;
function parseProof(text) {
    if (typeof text !== 'string' || !text.trim())
        return [];
    const raw = text.split(/\n|;/).map((x) => x.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '')).filter(Boolean);
    return raw.map((r) => {
        let label = '';
        let body = r.replace(/[.]+$/, '');
        // a trailing bracket that is a label: (page claim), (customer quote), (case study title) ...
        const m = body.match(/^(.*?)\s*\(((?:[^()]|\([^)]*\))*(?:quote|claim|title|headline|study|words|figures?|story|page|ebook|report|analyst|recognition|listed)[^()]*)\)\s*$/i);
        if (m) {
            body = m[1].trim();
            label = m[2].trim();
        }
        const quoteLike = /\bquote\b|\bwords\b|\bsaid\b/i.test(label) || /^(?:customer|ceo|cfo|cio|cto|ciso|cso|vp|head|director)\b[^:]{0,60}:/i.test(body) || /^[A-Z][A-Za-z.' -]{2,40}\b(?:CFO|CEO|CIO|CTO|CISO|CSO|VP|Director|Head)\b[^:]{0,40}:/.test(body);
        let kind = 'story';
        if (RECOGNITION.test(body) && !/\d+\s?%/.test(body))
            kind = 'recognition';
        else if (quoteLike)
            kind = 'quote';
        // "500,000 companies use X, including 98% of the Fortune 500" is scale, not a result: no change is reported
        else if (SCALE.test(body) && !/\b(?:cut|cuts|reduc\w+|increas\w+|improv\w+|faster|fewer|lower|higher|saved?|saves|grew|grow\w*|jumped|boost\w+|achiev\w+|doubl\w+|half)\b/i.test(body))
            kind = 'scale';
        else if (RESULT.test(body))
            kind = 'result';
        else if (SCALE.test(body))
            kind = 'scale';
        return { text: body, label, kind };
    }).filter((p) => p.text.length > 2);
}
/** The label to show for an item, in words a reader can check ("a customer quote on the company's website"). */
function proofSource(p) {
    const l = p.label.toLowerCase();
    if (!l)
        return 'as you gave it';
    if (/quote|words/.test(l))
        return 'a customer\'s own words';
    if (/claim/.test(l))
        return 'a claim from the company\'s own pages';
    return p.label;
}
/** Picks up to `n` proof items of the preferred kinds, in order, without repeating one; recognition last. */
function pickProof(items, n, prefer = ['result', 'quote', 'story', 'scale', 'recognition'], skip = []) {
    const out = [];
    for (const k of prefer)
        for (const p of items) {
            if (out.length >= n)
                return out;
            if (p.kind === k && !out.includes(p) && !skip.includes(p))
                out.push(p);
        }
    return out;
}
/** A proof item as a sentence-ready phrase: a customer quote keeps its speaker; the label is left out (it is listed in the checks). */
function proofPhrase(p) {
    return p.text.replace(/^(?:Customer (?:quote|words)|Recognition listed on the home page|Success story):\s*/i, '').replace(/\s+on the home page\b/i, '').trim();
}
// ---------------------------------------------------------------------------------------------------------------------------
// Dates (working days)
// ---------------------------------------------------------------------------------------------------------------------------
function isWeekend(d) { const w = d.getUTCDay(); return w === 0 || w === 6; }
/** The same day, or the last working day before it. */
function onOrBeforeWorkday(d) { const x = new Date(d.getTime()); while (isWeekend(x))
    x.setUTCDate(x.getUTCDate() - 1); return x; }
/** The same day, or the next working day after it. */
function onOrAfterWorkday(d) { const x = new Date(d.getTime()); while (isWeekend(x))
    x.setUTCDate(x.getUTCDate() + 1); return x; }
/** n working days after d (negative: before). */
function addWorkdays(d, n) {
    const x = new Date(d.getTime());
    const step = n < 0 ? -1 : 1;
    let left = Math.abs(n);
    while (left > 0) {
        x.setUTCDate(x.getUTCDate() + step);
        if (!isWeekend(x))
            left--;
    }
    return x;
}
/** Working days between two dates, counting d2 but not d1 (0 when d2 is not after d1). */
function workdaysBetween(d1, d2) {
    if (d2.getTime() <= d1.getTime())
        return 0;
    let n = 0;
    const x = new Date(d1.getTime());
    while (x.getTime() < d2.getTime()) {
        x.setUTCDate(x.getUTCDate() + 1);
        if (!isWeekend(x))
            n++;
    }
    return n;
}
const isoDate = (d) => d.toISOString().split('T')[0];
exports.isoDate = isoDate;
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekdayName = (d) => WEEKDAY[d.getUTCDay()];
exports.weekdayName = weekdayName;
// ---------------------------------------------------------------------------------------------------------------------------
// Pain points typed as a sentence
// ---------------------------------------------------------------------------------------------------------------------------
/** The separate pains in a typed pain statement: split at commas outside brackets and at semicolons; "with companies stuck on ..." loses its "with". */
function painClauses(text) {
    if (typeof text !== 'string' || !text.trim())
        return [];
    const raw = text.split(/\n|;/).flatMap((x) => splitTopLevel(x));
    const out = raw.map((x) => x.replace(/^(?:and|with|plus|while|but|also)\s+/i, '').replace(/[.]+$/, '').trim())
        // a clause that can be quoted on its own: short, and not leaning on another clause ("most systems were not built for that")
        .filter((x) => { const n = x.split(/\s+/).length; return n >= 2 && n <= 9 && x.length > 4 && !/^(?:so|most|which|that|this|it|they|these|those)\b/i.test(x) && !/\b(?:that|this|it|them)$/i.test(x); });
    const uniq = [];
    for (const o of out)
        if (!uniq.includes(o))
            uniq.push(o);
    return uniq.slice(0, 6);
}
/** The verb phrase that joins a product to its kind: "is a billing platform for SaaS companies", or, when the kind has no article, "is described in your input as business connectivity for banks". */
function describeWith(b) {
    const kind = b.kind.trim();
    if (!kind)
        return '';
    if (/^(?:a|an|the)\s/i.test(kind))
        return `is ${(0, exports.lowerFirstWord)(kind)}`;
    return `is described in your input as ${kind}`;
}
/** "a finance leader", "an operations leader". */
function aAn(phrase) { return `${/^[aeiou]/i.test(phrase.trim()) ? 'an' : 'a'} ${phrase.trim()}`; }
/** The items of a typed list. Semicolons and new lines split first; otherwise commas outside brackets do, and a short fragment such as "OMS" or "FMS or TMS in
 *  weeks" stays with the item before it. A closing label such as "(page claims)" belongs to every item. */
function splitFeatureList(text) {
    if (typeof text !== 'string' || !text.trim())
        return [];
    let label = '';
    let body = text.trim();
    const lm = body.match(/\s*\(((?:[^()]*\b(?:claims?|words|quote|figures?|title|headline)\b[^()]*))\)\s*[.]?$/i);
    if (lm) {
        label = lm[1].trim();
        body = body.slice(0, lm.index).trim();
    }
    let pieces;
    if (/[\n;]/.test(body))
        pieces = body.split(/\n|;/);
    else {
        const raw = splitTopLevel(body);
        pieces = [];
        // a clean list of short items stays a list; the merging below is for a sentence that mixes long and short fragments
        const allShort = raw.length > 1 && raw.every((r) => r.replace(/^and\s+/i, '').trim().split(/\s+/).length <= 4);
        const VERBISH = /^(?:supports?|works?|integrates?|includes?|offers?|provides?|connects?|handles?|has|runs?|lets?|allows?|gives?|covers?|uses?)\b/i;
        for (const r of raw) {
            const t = r.replace(/^and\s+/i, '').trim();
            const words = t.split(/\s+/);
            const prev = pieces.length ? pieces[pieces.length - 1] : '';
            const prevWords = prev ? prev.split(/\s+/).length : 0;
            const acr = /^[A-Z]{2,6}\b/.test(t) && words.length <= 5;
            // a short fragment is part of the list before it ("Modern Trade", "99.97% uptime"); a very short first fragment ("AI") joins the next one
            if (prev && acr)
                pieces[pieces.length - 1] += `, ${t}`;
            else if (prev && !allShort && words.length <= 3 && prevWords >= 3 && !VERBISH.test(t))
                pieces[pieces.length - 1] += `, ${t}`;
            else if (prev && !allShort && prevWords <= 1 && !/,/.test(prev))
                pieces[pieces.length - 1] += `, ${t}`;
            else
                pieces.push(t);
        }
    }
    return pieces.map((p) => p.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '').replace(/^and\s+/i, '').replace(/[.]+$/, '')).filter(Boolean).map((t) => ({ text: t, label }));
}
//# sourceMappingURL=dealtext.js.map