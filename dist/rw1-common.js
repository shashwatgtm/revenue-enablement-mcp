"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentences = exports.CALL_CONTEXT = exports.some = exports.quoted = exports.stripEnd = exports.lowerStart = exports.STITCHED = exports.stemsOf = void 0;
exports.shared = shared;
exports.matchPart = matchPart;
exports.namedParts = namedParts;
exports.joiningPart = joiningPart;
exports.joinSplitClaims = joinSplitClaims;
exports.plural = plural;
exports.partsOf = partsOf;
exports.modelWords = modelWords;
exports.readRole = readRole;
exports.readThreats = readThreats;
exports.shortAlt = shortAlt;
exports.answerQuestion = answerQuestion;
exports.ownerKind = ownerKind;
exports.cleanIndustry = cleanIndustry;
exports.industryFromTitle = industryFromTitle;
exports.sellerWords = sellerWords;
exports.cleanBrief = cleanBrief;
exports.dedupeAnswers = dedupeAnswers;
exports.briefOf = briefOf;
exports.usageUnit = usageUnit;
exports.usageLine = usageLine;
exports.sellerOffers = sellerOffers;
exports.reframeSector = reframeSector;
exports.plainModelLine = plainModelLine;
exports.readModel = readModel;
// Run 22 (rewrite of account_plan_builder, mutual_action_plan_generator and roi_business_case_builder): helpers the three rewritten tools share.
// Pure text functions: no network, no figures, no file access (rule 8, B82). They read what the user typed and the sector notes in verticals.ts;
// where a fact about the user's own product would be needed, the text says what to bring or confirm, and never states it.
const dealtext_ts_1 = require("./dealtext.js");
Object.defineProperty(exports, "sentences", { enumerable: true, get: function () { return dealtext_ts_1.sentences; } });
const answers_ts_1 = require("./answers.js");
const verticals_ts_1 = require("./verticals.js");
// ---------------------------------------------------------------------------------------------------------------------------
// Small text helpers
// ---------------------------------------------------------------------------------------------------------------------------
const STEM_STOP = new Set(['the', 'and', 'for', 'are', 'not', 'you', 'our', 'can', 'its', 'has', 'was', 'but', 'any', 'all', 'per', 'via', 'how', 'who', 'why', 'one', 'two', 'new', 'use', 'get', 'set', 'on', 'that', 'this', 'with', 'from', 'your', 'have', 'their', 'they', 'them', 'will', 'which', 'what', 'when', 'where', 'into', 'over', 'than', 'then', 'about', 'more', 'most', 'some', 'such', 'each', 'only', 'also', 'were', 'been', 'does', 'make', 'makes', 'much', 'many', 'every', 'other', 'platform', 'solution', 'product', 'software', 'tools', 'tool', 'work', 'works', 'time', 'team', 'teams', 'service', 'services', 'serviceability', 'logistics', 'logistic', 'planning', 'plan', 'plans', 'management', 'manage', 'managed']);
const normText = (t) => t.toLowerCase().replace(/\bci\s*\/\s*cd\b/g, 'cicd');
const stemsOf = (t) => new Set((normText(t).match(/[a-z][a-z0-9-]{2,}/g) || []).filter((w) => !STEM_STOP.has(w)).map((w) => w.replace(/(?:ing|ed|es|s)$/, '').slice(0, 5)));
exports.stemsOf = stemsOf;
// words that mean about the same thing in a buyer's pain and in a product's part (language only, no sector fact)
const SAME = [
    ['delay', 'late', 'lateness', 'react', 'reactive', 'exception', 'visibility', 'track', 'tracking', 'alert', 'real-time', 'monitor', 'monitoring'],
    ['spreadsheet', 'manual', 'email', 'emails', 'workflow', 'automation', 'automate', 'automated', 'paper', 'hand', 'agents'],
    ['separate', 'disconnected', 'silo', 'siloed', 'silos', 'stitched', 'multiple', 'systems', 'tools', 'platform', 'unified', 'single', 'orchestration', 'connect', 'connected'],
    ['compliance', 'audit', 'regulation', 'governance', 'evidence', 'certification', 'controls'],
    ['security', 'threat', 'risk', 'attack', 'breach', 'exposure', 'detection', 'protection', 'intelligence', 'feed', 'dark', 'leak', 'credential', 'credentials', 'phishing', 'takedown'],
    ['cost', 'fees', 'billing', 'invoice', 'invoicing', 'pricing', 'payments', 'payment', 'charges'],
    ['forecast', 'guess', 'estimate', 'scheduling', 'optimisation', 'optimization', 'dock', 'yard', 'labor', 'labour', 'gate', 'dwell', 'detention', 'appointment', 'trailer', 'capacity'],
    ['legacy', 'old', 'incumbent', 'modernization', 'modernisation', 'migration', 'migrate'],
    ['testing', 'test', 'quality', 'defects', 'release'],
    ['route', 'routing', 'carrier', 'carriers', 'network', 'networks', 'bottleneck', 'bottlenecks', 'operator', 'telecom', 'roaming', 'reseller', 'resell'],
    ['courier', 'couriers', 'shipping', 'shipment', 'parcel', 'delivery', 'freight', 'serviceability', 'rates', 'rate', 'carrier', 'ship', 'ships', 'shipped', 'fulfilment', 'fulfillment', 'warehouse', 'warehousing'],
    ['sim', 'sims', 'esim', 'softsim', 'roaming', 'device', 'devices', 'iot', 'connectivity'],
    ['conversion', 'conversions', 'checkout', 'cart', 'carts', 'abandonment', 'purchase', 'purchases', 'basket'],
    ['deploy', 'deploys', 'deployed', 'deployment', 'deployments', 'release', 'releases', 'releasing', 'cicd', 'pipeline', 'pipelines'],
    ['merge', 'merges', 'request', 'requests', 'repository', 'repositories', 'commit', 'commits', 'branch', 'branches', 'code', 'source'],
    ['authentication', 'authenticated', 'authenticate', 'authenticating', 'login', 'logins', 'signin', 'sign-in', 'sign-on', 'sign', 'mfa', 'sso', 'passwordless', 'password', 'passwords'],
    ['review', 'reviews', 'reviewed', 'sample', 'samples', 'sampling', 'analytics', 'analysis', 'analyse', 'scoring', 'score', 'scores'],
];
const groupOf = (w) => { const i = SAME.findIndex((g) => g.includes(w)); return i >= 0 ? i : SAME.findIndex((g) => g.includes(w.replace(/(?:ies|es|s)$/, '')) || g.includes(w.replace(/s$/, ''))); };
/** How many ideas two texts share: a shared word stem, or two words that mean about the same thing. */
function shared(a, b) {
    const sa = (0, exports.stemsOf)(a);
    const sb = (0, exports.stemsOf)(b);
    let n = 2 * [...sa].filter((x) => sb.has(x)).length;
    const ga = new Set((normText(a).match(/[a-z-]{3,}/g) || []).map(groupOf).filter((g) => g >= 0));
    const gb = new Set((normText(b).match(/[a-z-]{3,}/g) || []).map(groupOf).filter((g) => g >= 0));
    n += [...ga].filter((g) => gb.has(g)).length;
    return n;
}
/** The part of a product that best answers a text (a cost line, a result, a pain): the part sharing the most words or ideas with it, the first listed on a tie. A text about audio that is recognised or transcribed
 *  goes to the part that reads speech, not to the one that produces it. */
const SPEECH_IN = /\b(?:audio|recordings?|transcri\w+|recogni\w+|accents?|noisy|noise|studio)\b/i;
const READS_SPEECH = /speech[- ]to[- ]text|transcri\w+|recogni\w+|\basr\b|\bstt\b/i;
/** How many different words of the text mean something the part also says (a shared stem or a word of the same group): the tie-break between parts that share the same number of ideas. */
function wordHits(text, part) {
    const ps = (0, exports.stemsOf)(part);
    const pg = new Set((normText(part).match(/[a-z-]{3,}/g) || []).map(groupOf).filter((g) => g >= 0));
    const seen = new Set();
    for (const w of normText(text).match(/[a-z-]{3,}/g) || []) {
        const g = groupOf(w);
        if (ps.has(w.replace(/(?:ing|ed|es|s)$/, '').slice(0, 5)) || (g >= 0 && pg.has(g)))
            seen.add(w);
    }
    return seen.size;
}
function matchPart(text0, parts, product = '') {
    // the product's own name is in many parts and many results ("with Bitlane", "Bitlane Duo") and says nothing about which part answers
    const nameRe = product && product.length > 2 ? new RegExp(`\\b${escapeRe(product)}\\b`, 'gi') : null;
    const text = nameRe ? text0.replace(nameRe, ' ') : text0;
    let best = '';
    let n = 0;
    let h = 0;
    for (const p of parts) {
        // the ways the product is run answer a text about where it may run, not one about how fast something is deployed
        if (/^deployment options \(/.test(p) && !/\b(?:deployment options|cloud[- ]only|on-?prem\w*|self[- ]?(?:managed|hosted)|dedicated|air-?gapped|hybrid|private cloud|single tenant|data residency|sovereign\w*)\b/i.test(text))
            continue;
        // what a result or a cost line is mainly about is said first: its first clause counts double
        const pp = nameRe ? p.replace(nameRe, ' ') : p;
        let s = shared(text, pp) + 3 * shared(text.split(/[,;]|\band\b/)[0], pp);
        if (s > 0 && SPEECH_IN.test(text) && READS_SPEECH.test(p))
            s += 1;
        if (s === 0)
            continue;
        const hits = wordHits(text, pp);
        if (s > n || (s === n && hits > h)) {
            n = s;
            h = hits;
            best = p;
        }
    }
    return best;
}
/** The parts a pain names by words that belong to one part only ("planning, source control, CI/CD" names three parts; "security and compliance scanners" two). Words that several parts share
 *  (speech, voice, data) name no part by themselves. At least two parts are needed, else the list is empty and the single best part is used. */
function namedParts(text, parts, product = '') {
    const nameRe = product && product.length > 2 ? new RegExp(`\\b${escapeRe(product)}\\b`, 'gi') : null;
    const clean = (s) => (nameRe ? s.replace(nameRe, ' ') : s);
    // every word counts here, even the common ones that stemsOf leaves out ("planning" is a part)
    const NOT_WORDS = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'such', 'are', 'not', 'but', 'one', 'all', 'any', 'per', 'other', 'than', 'only', 'built', 'into', 'out']);
    const stemSet = (s) => new Set((normText(clean(s)).match(/[a-z][a-z0-9]{2,}/g) || []).filter((w) => !NOT_WORDS.has(w)).map((w) => w.replace(/(?:ing|ed|es|s)$/, '').slice(0, 5)));
    const tStems = stemSet(text);
    const pStems = parts.map((p) => stemSet(p));
    const freq = new Map();
    pStems.forEach((ss) => ss.forEach((s) => freq.set(s, (freq.get(s) || 0) + 1)));
    const hit = parts.filter((_, i) => [...pStems[i]].some((s) => freq.get(s) === 1 && tStems.has(s)));
    return hit.length >= 2 ? hit.slice(0, 4) : [];
}
/** A pain about pieces that are stitched together is answered by the part that joins them, when the description says one does ("a unified Voice Agent API"). */
exports.STITCHED = /\b(?:stitched|piecemeal|point (?:tools?|solutions?)|separate (?:tools|components|vendors|systems|pieces)|disconnected|multiple (?:tools|components|vendors)|silos?|siloed|best-of-breed|patchwork)\b/i;
function joiningPart(parts, full) {
    const low = full.toLowerCase();
    for (const p of parts) {
        const name = p.toLowerCase();
        for (let i = low.indexOf(name); i >= 0; i = low.indexOf(name, i + 1)) {
            if (/\b(?:unified|integrated|single|all[- ]in[- ]one|end[- ]to[- ]end|orchestrat\w*|combined)\s+(?:\w+\s+){0,2}$/.test(low.slice(Math.max(0, i - 30), i)))
                return p;
        }
    }
    return '';
}
/** Quoted results are separated by semicolons, but "Name: what happened; 50% faster ... (page claim)" is one claim whose figures sit after the semicolon: such a figure goes back with its name. */
function joinSplitClaims(text) {
    const out = [];
    for (const f of text.split(/;\s*|\n/)) {
        const x = f.trim();
        if (!x)
            continue;
        const prev = out[out.length - 1];
        if (prev && /^[^:]{2,60}:/.test(prev) && !/\d/.test(prev) && !/\)\s*$/.test(prev) && /^\d/.test(x))
            out[out.length - 1] = `${prev}, ${x}`;
        else
            out.push(x);
    }
    return out.join('; ');
}
const lowerStart = (s) => ((/^[A-Z][a-z]/.test(s) || /^(?:A|An)\s/.test(s)) && !/^(?:I|AI|API|ERP|CRM|SMS|IT|HR|QA)\b/.test(s) && !/^[A-Z][a-z]+[A-Z0-9]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
exports.lowerStart = lowerStart;
const stripEnd = (s) => s.trim().replace(/[\s.;:,!?]+$/, '');
exports.stripEnd = stripEnd;
/** A text the user typed, shown in quotes (kept as typed; a quote the safeguard already put around it is not doubled). */
const quoted = (s) => (/^["\u201c]/.test(s.trim()) ? s.trim() : `"${s.trim().replace(/[\s.;:,]+$/, '')}"`);
exports.quoted = quoted;
function plural(n, one, many) { return n === 1 ? one : many; }
/** "a, b and c" limited to the first n items. */
const some = (items, n) => (0, dealtext_ts_1.joinList)(items.slice(0, n));
exports.some = some;
/** The parts of a product, as the user's description lists them: after a colon or "made of", or after "joins", "covers", "includes", "with". */
/** The last item of a list written "a, b, c and d" is two items. */
function splitLastAnd(items) {
    if (items.length < 3)
        return items;
    const last = items[items.length - 1];
    const m = last.match(/^(.{3,40}?)\s+and\s+(?:the\s+)?(.{3,40})$/i);
    if (m && m[1].split(/\s+/).length <= 4 && m[2].split(/\s+/).length <= 5)
        return [...items.slice(0, -1), m[1], m[2]];
    return items;
}
/** The ways the product is run, when the description lists them: "run as X, Y or Z", "available as ...", "deployed on ...". */
function deploymentOptions(full) {
    const m = full.match(/\b(?:run|runs|available|delivered|deployed|offered|hosted|sold)\s+(?:as|in|on|via)\s+((?:[^.;]|\.(?=\S)){8,160})/i);
    if (!m)
        return '';
    const opts = (0, dealtext_ts_1.splitTopLevel)(m[1].replace(/,?\s+(?:or|and)\s+/gi, ', ')).map(exports.stripEnd).filter(Boolean);
    return opts.length >= 2 ? `deployment options (${(0, dealtext_ts_1.joinList)(opts, 'or')})` : '';
}
/** Named parts and product lists of a long description: "Name (what it does), Name (what it does)", "the language model Name" and "the products ... are a, b, c and d". */
function richParts(full) {
    const found = [];
    const named = [...full.matchAll(/\b([A-Z][A-Za-z0-9.]*(?: [A-Z][A-Za-z0-9.]*){0,3})\s+\(([a-z][a-z -]{3,40})\)/g)];
    if (named.length < 2)
        return [];
    for (const m of named)
        found.push({ at: m.index ?? 0, label: `${m[1]} (${m[2]})` });
    for (const m of full.matchAll(/\bthe ([a-z][a-z ]{3,25}? model) ([A-Z][A-Za-z0-9.]*(?: [A-Z][A-Za-z0-9.]*){0,2})/g))
        found.push({ at: m.index ?? 0, label: `${m[2]} (${m[1]})` });
    for (const m of full.matchAll(/\b(?:are|include|includes|including|comprise|comprises|consists? of|made up of)\s+([^.;]{10,200})/g)) {
        const items = splitLastAnd((0, dealtext_ts_1.splitTopLevel)(m[1])).map(exports.stripEnd).filter(Boolean);
        if (items.length >= 3 && items.every((x) => x.split(/\s+/).length <= 4 && !/[A-Z][a-z]+ \(/.test(x)))
            items.forEach((x, k) => found.push({ at: (m.index ?? 0) + k, label: x }));
    }
    return found.sort((x, y) => x.at - y.at).map((x) => x.label).slice(0, 14);
}
function partsOf(brief) {
    const rich = richParts(brief.full);
    if (rich.length >= 4)
        return rich;
    const base = partsOfBase(brief);
    const colon = /^[^:]{3,140}:/.test(brief.full.slice(0, 200)) ? brief.full.match(/^[^:]{3,140}:\s*(.+)$/s) : null;
    if (!base.length && colon) {
        const tail = colon[1].split(/\.\s+(?=[A-Z])/)[0].replace(/,?\s+(?:run|runs|available|delivered|deployed|offered|hosted|sold)\s+(?:as|in|on|via)\b.*$/i, '');
        const items = splitLastAnd((0, dealtext_ts_1.splitTopLevel)(tail)).map((x) => (0, dealtext_ts_1.partLabel)(x).replace(/[.;]+$/, '').trim()).filter((p) => p.length > 2 && p.split(/\s+/).length <= 8);
        if (items.length >= 3) {
            const dep = deploymentOptions(brief.full);
            return [...items.slice(0, 12), ...(dep ? [dep] : [])];
        }
    }
    return splitLastAnd(base);
}
function partsOfBase(brief) {
    const mergeFragments = (xs) => {
        const out = [];
        xs.forEach((x, i) => { const prev = out[out.length - 1]; if (prev && /\b(?:for|of|to|with|in|on|and|or|from|by)$/i.test(prev.trim()))
            out[out.length - 1] = `${prev}, ${x}`;
        else
            out.push(x); void i; });
        return out;
    };
    const clean = (xs) => mergeFragments(xs)
        .map((p) => (0, dealtext_ts_1.partLabel)(p).replace(/^(?:and|with|plus|including|the)\s+/i, '').replace(/[.;]+$/, '').trim())
        .filter((p) => p.length > 2 && p.split(/\s+/).length <= 14 && !/^(?:on|for|as|in|at|by|delivered|built|run|powered|backed|based|sold|used|under|through|that|which)\b/i.test(p));
    if (brief.parts.length >= 2)
        return clean(brief.parts).slice(0, 12);
    // the parts a description lists after "joins", "covers", "includes" ...; a bracketed list of three or more is the fallback ("Name (a, b, c), ...")
    const tailAt = brief.full.search(/\b(?:joins|combines|covers|covering|spans|includes|including|offers|brings together|connects|unifies|made up of)\s+/i);
    let tailParts = [];
    if (tailAt >= 0) {
        const tail = brief.full.slice(tailAt).replace(/^\S+(?:\s+together)?\s+(?:of\s+)?/i, '').split(/\.\s+(?=[A-Z])/)[0].replace(/[.]+$/, '');
        const pieces = (0, dealtext_ts_1.splitTopLevel)(tail);
        if (pieces.length >= 2)
            tailParts = clean(pieces).slice(0, 12);
    }
    if (tailParts.length >= 2)
        return tailParts;
    const paren = brief.full.slice(0, 260).match(/\(([^()]+(?:,[^()]+){2,})\)/);
    if (paren) {
        const ps = clean((0, dealtext_ts_1.splitTopLevel)(paren[1]));
        if (ps.length >= 3)
            return ps.slice(0, 12);
    }
    return tailParts;
}
function modelWords(model, _sellerText, unit) {
    // the unit is the user's own (per SIM, per shipment, per message ...); without one the wording stays neutral and names no kind of product
    const perUnit = unit ? `per ${unit}` : 'per unit of usage';
    const units = unit ? `${unit}s` : 'volume';
    switch (model) {
        case 'transactions': return { priced: `a rate ${perUnit}, with volume tiers`, proof: `live test volume on one product line or region, compared with the current provider on the same volume`, terms: 'the rate card, the volume tiers and any committed monthly volume', grow: 'more products or regions on the same contract', setup: unit === 'message' ? 'the integration, the sender or account approvals and the first live messages' : unit ? `the integration, the account set-up and the first live ${units}` : 'the integration, the account set-up and the first live volume' };
        case 'sim': return { priced: unit === 'SIM' ? 'a charge per SIM and for the data it uses' : 'a charge by SIM or by data used, as your price list sets it', proof: 'test SIMs in the buyer\'s own devices and locations, compared with the current provider on coverage, the time to resolve a network issue and the data used', terms: 'the price per SIM, the data plans and any minimum', grow: 'more devices and countries on the same profile', setup: 'ordering the test SIMs, activating them in the buyer\'s devices and the first live data sessions' };
        case 'services': return { priced: 'a fee for the service (per FTE, per ticket or a fixed fee)', proof: 'a transition plan with a parallel run and exit criteria for each stage', terms: 'the scope, the service levels with their credits, and the fee structure', grow: 'more services or locations under the same contract', setup: 'the knowledge transfer from the current provider and the governance calendar' };
        case 'connectivity': return { priced: 'a price per site or link on a term contract', proof: 'pilot sites brought live, worst served first, compared with the current operator on uptime and repair time', terms: 'the price per site, the term and the delivery time of each link', grow: 'more sites in waves, each with a fallback', setup: 'the site survey, the delivery time of each link and the cutover window' };
        case 'hardware_software': return { priced: 'devices plus a software term', proof: 'a pilot with the devices at one site, installed and read for a full cycle', terms: 'the device order, the installation and the software term', grow: 'more sites and devices', setup: 'the delivery and installation of the devices' };
        case 'marketplace': return { priced: 'a take rate on the transactions it carries', proof: 'a seeded category or region where both sides trade for a full cycle', terms: 'the take rate and any committed volume', grow: 'more categories or regions', setup: 'the first listings and the first live transactions' };
        case 'investment': return { priced: 'fees on the assets or performance of a mandate', proof: 'due diligence, a committee presentation and a first allocation', terms: 'the fee schedule, the reporting and the first allocation', grow: 'a larger or longer mandate', setup: 'the mandate documents and the first allocation' };
        default: return { priced: 'a subscription', proof: 'a pilot with one team or project and an agreed measure', terms: 'the scope, the term and the price', grow: 'more teams or more parts of the product', setup: 'the access, the integrations and the first users' };
    }
}
exports.CALL_CONTEXT = /\b(?:contact cent(?:re|er)s?|call cent(?:re|er)s?|ccaas|customer (?:service|support|experience)|support (?:teams?|desks?|cent(?:re|er)s?)|help ?desks?|bpo|agents? (?:coach\w*|assist)|coach\w* agents|supervisors?)\b/i;
const ROLE_PATTERNS = [
    // in a freight or shipment visibility deal the sales and customer service teams are not support agents: they answer customers about where goods are
    { re: /\bcustomer (?:service|support|care|experience)\b/i, when: (c) => c.v?.id === 'logistics-tech', part: 'Daily user: answers customers about their goods', kind: 'user', ask: 'How many customer enquiries a week are about where an order or a shipment is, and how long does one take to answer?',
        cares: 'how fast they can tell a customer where the goods are, and how many calls and emails a late shipment causes',
        step: (c) => `Give them ${c.P}'s tracking view for a sample of real enquiries about late shipments, and note how often they can answer without asking operations` },
    { re: /\bsales\b/i, when: (c) => c.v?.id === 'logistics-tech', part: 'Daily user: promises delivery dates to customers', kind: 'user', ask: 'How often do you have to ask operations where an order is before you can answer a customer?',
        cares: 'whether they can see order status and promise a date without asking operations, and how often a promise is missed',
        step: (c) => `Show them the order and shipment status in ${c.P} for three real customer orders, and ask which question they would no longer have to send to operations` },
    { re: /\b(?:suppliers?|vendors?|carriers?|couriers?|partners?|distributors?|subcontractors?|auditors?|regulators?)\b/i, part: 'Outside the buying group', kind: 'outside',
        cares: 'how the change reaches them in their own work, and what evidence or data they will be asked for',
        step: (c) => `Do not sell to them; find out where ${c.P} touches their work and tell them early, so they do not become a surprise for the people who decide` },
    { re: /\bdeveloper advocate|devrel|developer relations\b/i, part: 'Influencer: carries the developer view', ask: 'Which developer complaints reach you most often, and how do you pass what you learn to the platform team?', kind: 'influencer',
        cares: 'whether developers find the tools easy to learn and trust, and what they complain about most',
        step: (c) => `Ask which developer complaints reach them most often, then give them a working session on one of those cases with ${c.P}` },
    { re: /\b(?:qa|quality assurance|test(?:er|ing)?|sdet)\b/i, part: 'Evaluator: tests the product', ask: 'Where do test runs slow down or break most often, and what does that cost a release?', kind: 'influencer',
        cares: 'test coverage, slow or fragile test runs, and how fast a release is signed off',
        step: (c) => `Ask them to bring one slow or fragile test flow and run it through ${c.P} with you` },
    { re: /\b(?:software developers?|developers?|engineers?|programmers?)\b/i, part: 'Daily user', kind: 'user', ask: 'Which part of your day-to-day work with the current tools costs you the most time?',
        cares: 'whether it fits the way they already work and saves time on a real task',
        step: (c) => `Pick a real task from their backlog, do it with ${c.P} alongside them, and write down what they say in their own words` },
    { re: /\b(?:product (?:managers?|owners?|leads?)|head of product|vp product)\b/i, part: 'Influencer: owns the requirements', ask: 'What takes longest between a request and a change going live, and who else has to approve it?', kind: 'influencer',
        cares: 'how fast a change reaches customers and how much of it waits for engineering',
        step: () => 'Walk through one real change from request to live and time it together' },
    { re: /\b(?:cso|chief security officer|chief security)\b/i, part: 'Security decision maker', ask: 'Which security risk would you most want to see smaller a year from now, and what would you accept as proof?', kind: 'influencer',
        cares: 'the security risk the change removes, the evidence an auditor will accept and what the team must run afterwards',
        step: (c) => `Agree the one security risk ${c.P} is meant to reduce, the proof they would accept and who on their side owns the result` },
    { re: /\b(?:managers? who (?:certify|approve|attest|review)|certif(?:y|iers?)|access (?:reviewers?|owners?)|attest\w+)\b/i, part: 'Reviewer who certifies', ask: 'How long does one review request take you today, and what makes you approve it without checking?', kind: 'user',
        cares: 'how clear each request is, how much time a review takes and whether they can sign without guessing',
        step: (c) => `Show them one real review request in ${c.P} and time how long it takes them to certify it` },
    { re: /\b(?:ciso|chief information security|security|infosec|soc\b|threat|brand protection|cyber)\b/i, part: 'Security reviewer', ask: 'What does your review need to see before a new tool is approved, and who signs it off?', kind: 'influencer',
        cares: 'where data is held and who can reach it, how findings are ranked, and the evidence they can show an auditor',
        step: (c) => `Send the security documents first, then agree a short proof of ${c.P} on their own environment with the measure written down` },
    { re: /\b(?:chief digital|cdo\b|head of digital|digital (?:officer|head|leader)|technology leaders?)\b/i, part: 'Technology and change sponsor', kind: 'influencer',
        cares: 'how the change fits the digital plan, the risk it brings and who runs it afterwards',
        step: (c) => `Agree the outcome they want from ${c.P} in one sentence, the risk team's checks, and a first small scope` },
    { re: /\b(?:cto|chief technology|vp engineering|vice president,? engineering|head of engineering|engineering (?:head|manager|leader|lead)|platform (?:leader|lead|engineering))\b/i, part: 'Technical decision maker', ask: 'What would a platform standard have to prove to you, and who else must agree?', kind: 'influencer',
        cares: 'platform standards, developer time and the cost of tool sprawl',
        step: (c) => `Agree one real project for a trial of ${c.P}, the measure it will be judged on, and who on their side owns the result` },
    { re: /\b(?:cio|chief information officer)\b/i, part: 'Technology decision maker', ask: 'What outcome would make this worth your attention this year, and what has held similar projects back here before?', kind: 'influencer',
        cares: 'whether it fits the technology plan and the risk position, who runs it afterwards and what it costs in total',
        step: (c) => `Agree in one short meeting the outcome they want from ${c.P} and the risk review their team will run, and let their team make the technical case` },
    { re: /\b(?:head of it|it (?:director|head|manager|leader|lead|team)|information technology|infrastructure)\b/i, part: 'Technical reviewer', ask: 'Which systems must this work with, and who owns each one?', kind: 'influencer',
        cares: 'fit with the systems they run, the security review and who supports it after go-live',
        step: (c) => `Hold a technical call on how ${c.P} connects to their systems and who supports it afterwards` },
    { re: /\b(?:cfo|chief financial|finance|controller|treasur\w*|accounting)\b/i, part: 'Finance reviewer', ask: 'Which finance numbers are late or reworked each period, and what did the last review ask for on this topic?', kind: 'influencer',
        cares: 'the cost case, the audit trail and the effort at period end',
        step: (c) => `Agree the number they will check in the cost case${c.metric ? ` (for example ${c.metric})` : ''} and who gives you the figures` },
    { re: /\b(?:chief supply chain|supply chain (?:head|director|leader|manager)|head of (?:supply chain|logistics)|logistics (?:head|director|manager))\b/i, part: 'Operating decision maker', kind: 'influencer',
        cares: 'service levels, cost per unit moved and disruption to live operations',
        step: (c) => `Agree a pilot lane, site or region for ${c.P} and the before-and-after measure before the proposal` },
    { re: /\b(?:coo|chief operating|operations (?:head|director|manager|leader|lead)|head of operations|director of operations|vp,? operations|svp of operations)\b/i, part: 'Operating decision maker', kind: 'influencer',
        cares: 'daily execution, service levels and the cost per unit of work',
        step: (c) => `Agree a pilot site and the before-and-after measure for ${c.P}, and who will use it` },
    { re: /\b(?:dispatch\w*|planners?|drivers?|field crews?|project teams?|branch managers?|store managers?)\b/i, part: 'Daily user', kind: 'user', ask: 'What does a busy day look like for you, and where does the current way slow you down?',
        cares: 'whether the new way is quicker than the old one on a busy day',
        step: (c) => `Shadow one shift or one day of their work, then let a few of them try ${c.P} on a live case` },
    { re: /\b(?:customer (?:service|support|experience)|support (?:agents?|teams?)|agents|cx\b|service agents?)\b/i, part: 'Daily user', kind: 'user', ask: 'Which cases take the most time today, and what must a person always check?',
        cares: 'handling time, quality and a tool that does not slow the queue',
        step: (c) => `Run ${c.P} on a small share of real cases and let the agents judge it against a quality check` },
    { re: /\b(?:sales (?:head|leader|director|user|rep|team)s?|national sales|sales)\b/i, part: 'Daily user or sales leader', kind: 'user',
        cares: 'how fast they see a result and whether reps will keep using it',
        step: (c) => `Agree a pilot team and one measure for ${c.P}, and who on the team will lead it` },
    { re: /\b(?:marketing)\b/i, part: 'Influencer', kind: 'influencer', cares: 'the measure they report and the proof they may use in market', step: () => 'Agree the measure they report and what they would need to see to back it' },
    { re: /\b(?:hr\b|human resources|people team|chro)/i, part: 'Influencer: employee side', kind: 'influencer', cares: 'how the change reaches employees and who supports them', step: () => 'Agree the first employee group affected and how they will be told' },
    { re: /\b(?:administrators?|admins?)\b/i, part: 'Day to day owner', kind: 'user', cares: 'configuration, permissions and how much upkeep it needs', step: (c) => `Ask what they would have to set up and maintain for ${c.P}, and give them the set-up guide early` },
    { re: /\b(?:risk|compliance|legal|counsel|governance|audit)\b/i, part: 'Risk and compliance reviewer', kind: 'influencer', cares: 'evidence, controls and what they can show a regulator or auditor', step: () => 'Ask for their review checklist and map each line to the document that answers it' },
    { re: /\b(?:analysts?|threat intelligence|investigators?)\b/i, part: 'Daily user', kind: 'user', cares: 'how fast they can move from an alert to a decision, and how many alerts they must handle', step: (c) => `Run ${c.P} on a week of their own alerts and ask which findings they would act on` },
    { re: /\b(?:owners?|founder|president|ceo|managing director|chief executive)\b/i, part: 'Senior decision maker', kind: 'influencer', cares: 'the outcome, the risk and how soon they see a result', step: (c) => `Agree the outcome they want from ${c.P} in one sentence and book a short meeting before the proposal` },
    { re: /\b(?:leadership team|leaders?|executives?)\b/i, part: 'Senior group', kind: 'group', cares: 'the outcome and the risk, in a short case', step: () => 'Ask the champion who in the group has the final say and what they need to see' },
];
/** What a contact is for, from the title (and from the role the user wrote in brackets, which always wins). */
const CALL_QUALITY = { re: /./, part: 'Evaluator: checks the quality and compliance of calls', kind: 'influencer', ask: 'How many of your calls do you review today as a share of all calls, and what do you miss?',
    cares: 'how many calls are reviewed, how fast a problem is found, and whether the scoring matches how a supervisor would judge the same call',
    step: (c) => `Ask them to bring a sample of calls they have already scored and compare ${c.P}'s results with their own scores` };
function readRole(c, kind, ctx, investment) {
    const qa = /\b(?:qa|quality assurance|quality)\b/i.test(c.title) && !/\b(?:software|release|test automation|sdet|engineers?|developers?)\b/i.test(c.title);
    const hit = qa && (ctx.callContext || /\b(?:compliance|calls?|agents?|coach\w*|contact cent\w+)\b/i.test(c.title)) ? CALL_QUALITY : ROLE_PATTERNS.find((p) => p.re.test(c.title) && (!p.when || p.when(ctx)));
    const base = (0, answers_ts_1.roleFor)(c.title, investment);
    const part = hit ? hit.part : c.level === 'group' ? 'A group of users or evaluators' : c.level === 'exec' ? 'Senior leader' : (0, dealtext_ts_1.upperFirst)(base.label);
    const cares = hit ? hit.cares : base.cares;
    const step = hit ? hit.step(ctx) : base.nextStep;
    return { part, cares, step, kind: kind ?? (hit ? hit.kind : null), ask: hit?.ask };
}
const THREAT_KINDS = [
    { id: 'scratch', re: /\bfrom scratch\b|\bbuild(?:ing)? (?:every|each|all|our own|their own|it|them)\b/i, tells: 'the buyer builds and keeps each piece itself, so the cost is people and time, not a purchase', asks: ['Which pieces has the team built by hand, who keeps each one running, and what has it not had time to build?', 'How long does it take to add one more, and what waits while it is built?'], prove: 'Count what one more piece takes to build and run, then show the same piece done with the product' },
    { id: 'juggle', re: /\bjuggl\w*|multiple (?:\w+ )?(?:providers|vendors|partners|suppliers)|many (?:\w+ )?(?:providers|vendors|partners|suppliers)|several (?:\w+ )?(?:providers|vendors|partners)/i, tells: 'every provider has its own rules, reports and fees, so someone reconciles them', asks: ['How many providers do you work with, and who reconciles their reports and fees each week?', 'What happens to a customer when one of them changes its rules or fails?'], prove: 'Take one week of activity across the providers and show it reconciled in one place' },
    { id: 'friction', re: /\bredirect\w*|separate page|extra (?:step|click)|leave the (?:site|app|page)|drop-?off|abandon\w*/i, tells: 'a step sends the customer away from the journey, and some of them do not come back', asks: ['Where in that step do customers drop out, and what share of them complete it?', 'What does one lost customer at that step cost the business?'], prove: 'Compare completion of that step before and after, on the buyer\'s own traffic' },
    { id: 'guess', re: /\b(?:best guess|guess\w*|estimat\w*|rule of thumb|gut|intuition)\b/i, tells: 'plans rest on judgement, so a wrong call is paid for later', asks: ['What does the plan rest on today, and what does a wrong guess cost when it happens?', 'Who makes the call, and what do they wish they could see before they make it?'], prove: 'Show a plan made with the data next to the one made by judgement, on a week the buyer remembers' },
    { id: 'manual', re: /\b(?:manual\w*|spreadsheets?|excel|diar(?:y|ies)|paper|by hand|phone calls?|calling|emails?|whatsapp|threads?)\b/i, tells: 'people carry the process, so hours, errors and delays are the cost', asks: ['Who does this by hand each week, how long does it take them, and what goes wrong when they are away?', 'Which mistakes or delays from this reached a customer or an auditor in the last year?', 'What would those people do with the time if the routine part went away?'], prove: 'Time one real run of the manual way next to the same case done with the product' },
    { id: 'legacy', re: /\b(?:legacy|on-?prem\w*|old |existing|incumbent|traditional|conventional|mainframe|plans once a day|extend the)\b/i, tells: 'a system is already paid for, integrated and approved, so the question is the gap, not the replacement', asks: ['What does it do well today, and which decision or exception does it not help with?', 'How long did the last change to it take, and who had to make it?', 'What do your people do around it because it cannot do the job?'], prove: 'Show what the product covers that it does not, and say where it should stay in place' },
    { id: 'disconnected', re: /\b(?:point (?:tools?|solutions?)|separate|siloed|silos?|isolated|disconnected|stitched|multiple (?:systems|tools|consoles)|several|each function|third-party tools?|best-of-breed|piecemeal)\b/i, tells: 'the pieces work but nobody sees the whole, so someone joins them by hand', asks: ['How many separate tools or sources of truth does one task pass through, and who joins their output by hand?', 'When two of them disagree, who decides which is right, and how long does that take?', 'Which finding or record has fallen between two of them in the last year?'], prove: 'Trace one real case across the separate tools, then show it in one place' },
    { id: 'inhouse', re: /\b(?:in-?house|build it|internal(?:ly)?|own team|diy|not a core competenc\w*)\b/i, tells: 'their own team controls it, and its cost is mostly people they already employ', asks: ['Who keeps it running, what does that take each month, and what happens when that person leaves?', 'What has the business asked for that it has not been able to do?'], prove: 'Set the full cost of keeping it running next to the cost of the product, using the buyer\'s own figures' },
    { id: 'static', re: /\b(?:static|keyword|rule[- ]based|generic|feed|periodic|scans?|numeric only|fixed|hard-?coded|opaque|black box)\b/i, tells: 'it produces output but does not say which items matter, so the team does the sorting', asks: ['How does the team decide which items matter, and how long does it take to be sure?', 'How often is it re-tuned, and what got through the last time conditions changed?'], prove: 'Run the product on the buyer\'s own history and compare what each one found, missed or flagged for no reason' },
    { id: 'reactive', re: /\b(?:reactive|cannot detect|can't detect|after the fact|stop at|visibility only|too late|in time to react|only suggest|deflect)\b/i, tells: 'it tells the buyer after the cost has been incurred, or stops before the action', asks: ['How early does it warn you, and what can your people still do in the time between the warning and the cost?', 'Who acts on what it shows, and how often is the action taken too late?'], prove: 'Replay one past incident and show what would have been visible, and when' },
    { id: 'oneByOne', re: /\b(?:one by one|one at a time|many separate (?:channels|partners)|each partner|separately|channels and partners)\b/i, tells: 'every partner or channel is handled on its own, so the work and the risk multiply', asks: ['How many partners or channels do your people deal with separately, and what do they re-enter or reconcile between them?', 'What happens when one of them changes its rules or its rates?'], prove: 'Show one case that today touches several partners, handled through one connection' },
    { id: 'limited', re: /\b(?:limited|cloud only|one (?:model )?provider|tied to|few connectors|beta|narrow|optimi[sz]ed for)\b/i, tells: 'it covers part of the need, and the rest is worked around', asks: ['Which of your systems, cases or rules does it not cover today, and what do you do for those?', 'What would you need it to cover before you would rely on it for everything?'], prove: 'List the buyer\'s cases and mark which are covered, which need set-up and which are not covered, for each option' },
    { id: 'cost', re: /\b(?:fees?|charges?|per seat|hidden|cost more|confusing rates|processing)\b/i, tells: 'the price on the page is not the price paid, so the real cost is hard to compare', asks: ['What do you pay in a typical month in total, including the fees and costs that are not in the headline price?', 'Which line on the invoice surprised you most, and how often?'], prove: 'Price the same month of the buyer\'s own activity under both, line by line' },
    { id: 'slow', re: /\b(?:slow|paperwork|takes? days|delays?|confusing|poor)\b/i, tells: 'steps wait for people or paper, so time is lost between them', asks: ['How long does it take from the request to the first use, and which steps in between are waiting?', 'Where does a customer or colleague notice the wait?'], prove: 'Time the same request end to end, the old way and the new way' },
];
const GENERAL_THREAT = { id: 'general', re: /./, tells: 'it is what the buyer does today, so the product has to be better on something they already measure', asks: ['What do you use it for today, what works, and what would you change?', 'What would have to be true for you to move away from it?'], prove: 'Agree the measure first, then compare the two on the buyer\'s own case' };
/** Reads each alternative the user listed; two alternatives of the same kind get different questions. */
function readThreats(items) {
    const used = new Map();
    return items.map((text) => {
        const k = THREAT_KINDS.find((t) => t.re.test(text)) || GENERAL_THREAT;
        const n = used.get(k.id) || 0;
        used.set(k.id, n + 1);
        return { text, tells: k.tells, ask: k.asks[n % k.asks.length], prove: k.prove, id: k.id };
    });
}
const partFor = (text, parts) => matchPart(text, parts);
const unitFor = (text, ctx) => {
    if (ctx.unit && !/\bper\b/i.test(text))
        return `per ${ctx.unit}`;
    const t = text.match(/\bper (?:message|sms|transaction|seat|user|site|link|device|ticket|fte|contact|call|check|verification|api call|shipment|order|sim|label|booking|request|session|minute)\b/i);
    if (t)
        return t[0].toLowerCase();
    if (ctx.stated === false && (ctx.model === 'saas' || !ctx.model))
        return ''; // only the sector's usual model: no way of paying is named
    return { transactions: 'per unit of usage', connectivity: 'per site', services: 'per FTE, per ticket or fixed', hardware_software: 'per device plus the software', marketplace: 'as a take rate', investment: 'as a fee on assets', saas: 'as a subscription' }[ctx.model || ''] || '';
};
/** A long alternative the user typed ("collections of separate point tools for planning, source control, CI/CD, artifact storage and delivery") as a short name for a sentence: its first words, cut before "for", "such as" or a comma. */
function shortAlt(s) {
    const head = (0, exports.lowerStart)(s).split(/\s+(?:for|such as|that|which|with|whose|like)\s|[,;(:]/)[0].trim();
    const words = head.split(/\s+/);
    return words.length > 7 ? words.slice(0, 7).join(' ') : head || (0, exports.lowerStart)(s);
}
/** Answers one objection or blocker. The answer says what to do and what to bring; it states no fact about the user's product. */
function answerQuestion(raw, ctx) {
    const text = (0, exports.stripEnd)(raw.replace(/^["“]|["”]$/g, ''));
    const t = text.toLowerCase();
    const P = ctx.P;
    const needs = (0, exports.some)(ctx.needs, 3);
    const modelT = verticals_ts_1.MODEL_TRADES[ctx.model === 'sim' ? 'transactions' : ctx.stated === false && ctx.model === 'saas' ? 'unknown' : ctx.model || 'unknown'];
    const named = (0, answers_ts_1.namedThings)(text, [P, ctx.P]).filter((s) => !/^(?:API|APIs|SDK|Does|Can|Is|How|Why|What)$/i.test(s));
    const relevant = partFor(text, ctx.parts);
    const mk = (id, answer, bring, ask) => ({ id, answer, bring, ask });
    if (/\b(?:without|not|only) (?:a |the |buying )?(?:suite|bundle|package)|buy (?:a |an )?(?:single|one)\b|single .{0,25}\bproduct|just (?:one|the)\b/i.test(t) && /\b(?:buy|purchase|get|sign|take)\b/i.test(t)) {
        return mk('packaging-single', `Answer yes or no first, then how it works: say whether ${P} sells its parts on their own or only in suites, what each suite contains, and what it costs to move from one to the next. If only suites exist, show the smallest suite that covers what the buyer needs now${needs ? ` (${needs})` : ''}, and say what they do not use.`, `the current packaging of ${P}: what is sold alone, what is sold in suites, and how each is priced`, 'Which of the parts do you need in the first year, and which can wait?');
    }
    if (/\b(?:add|more|extra|additional)\b.{0,30}\b(?:licen[cs]es?|users?|seats?|capacity|volume)\b|only one product in|for only one/i.test(t)) {
        return mk('packaging-add', `Answer in the buyer's terms: can more of one product be added without moving to a larger package, how is the added amount priced, and does it start at once or at renewal. If the answer is no, say what the next package adds so the buyer can weigh it.`, `the rules of ${P} for adding to one product inside a package, with an example price`, 'How much more of that product do you expect to need, and by when?');
    }
    if (/\b(?:choose|pick|select|decide|right|which)\b.{0,40}\b(?:suite|package|plan|edition|tier|bundle|product)\b|\bhow do (?:i|we) choose\b|\bfigure out what (?:you|we|i) (?:actually )?need|\bwhat (?:do|should) (?:i|we) need\b|\boverlap\w*/i.test(t)) {
        const overlap = /overlap|too many/i.test(t);
        return mk(overlap ? 'overlap' : 'packaging-choose', overlap
            ? `Do not argue that there is no overlap. Draw it line by line: for each tool the buyer already runs${ctx.alternatives.length ? ` (such as ${(0, exports.some)(ctx.alternatives.map(exports.lowerStart), 2)})` : ''}, say what it does, what ${P} does and where the two meet, then say plainly which one should stay and which should go. The buyer needs only what removes a gap or a duplicate cost.`
            : `Start from the buyer's problems, not from the package list: write down what they named${needs ? ` (${needs})` : ''}, map each one to one part of ${P}${ctx.parts.length ? ` (${(0, exports.some)(ctx.parts, 4)})` : ''}, and recommend the smallest set that covers them. Show what each extra part would add, so the choice is theirs.`, `a one page map from each of the buyer's problems to the part of ${P} that answers it, and which tool it would replace or sit beside`, 'Which problem hurts most this year, and which tools do you already own that touch it?');
    }
    if (/\b(?:real|total|hidden|true|full|actual) cost|beyond (?:the )?(?:licen[cs]e|price|subscription|fee)|cost of (?:owning|stitching|running)|tco\b/i.test(t)) {
        const lines = (text.match(/:\s*(.+)$/) || ['', ''])[1];
        const parts = lines ? (0, dealtext_ts_1.splitTopLevel)(lines.replace(/\s+and\s+/g, ', ')).map(exports.stripEnd) : [];
        return mk('tco', `Answer with a short cost table instead of a defence: one row for each cost the buyer named${parts.length ? ` (${(0, dealtext_ts_1.joinList)(parts)})` : ' (set-up, integration, tuning and the people who run it)'}, filled in for ${P} and for the way they work today${ctx.alternatives.length ? ` (${(0, exports.lowerStart)(ctx.alternatives[0])})` : ''}, using the buyer's own figures. Where you have no figure, say so and ask for theirs.`, `what set-up, integration, tuning and running ${P} has taken for customers of a similar size, only if you can show it`, 'Which of these costs does your team carry today without anyone counting it?');
    }
    if (/\b(?:cheap(?:est|er)?|lowest|lower (?:price|cost)|less expensive|cheaper)\b/i.test(t) || /\bprice\b.{0,30}\b(?:lower|less|cheaper)\b|\bcompare\b.{0,30}\bcost\b/i.test(t)) {
        const unit = unitFor(text, ctx);
        return mk('cheapest', `Do not claim it is the cheapest. Take the buyer's last invoice or usage report and price the same activity both ways, ${unit ? `${unit} and ` : ''}including every fee, so the comparison is theirs and not yours. Where the lower figure is not yours, say what the difference buys (${needs || 'what the buyer named as important'}).`, `your price list, how the price is built${unit ? ` (${unit})` : ''}, and every fee that is not in the headline rate`, 'Can you show me your last month of activity so we can price the same month both ways?');
    }
    if (/\bpay[- ]as[- ]you[- ]go\b|\bwithout (?:a )?(?:contract|commitment)\b|\bprepaid\b|\btop[- ]?up\b/i.test(t) && /\b(?:what|which|available|include\w*|offer\w*|can i|do you)\b/i.test(t)) {
        return mk('payg', `List, product by product${ctx.parts.length ? ` (${(0, exports.some)(ctx.parts, 5)})` : ''}, what can be used on pay as you go and what needs a contract: for each, the price basis, any minimum spend or top up, and what a committed plan adds. Never present a product as pay as you go unless your price list says so.`, `which of ${P}'s products are sold pay as you go and which need a contract, from the price list`, 'Which of these would you start with, and what monthly volume do you expect?');
    }
    const startM = text.match(/^(?:can|could|how (?:do|can)) (?:i|we)\b.{0,12}\b(?:get started|start|begin|sign up|set up)\b.{0,8}?\bwith\s+(.+)$/i);
    if (startM) {
        const items = (0, dealtext_ts_1.splitTopLevel)(startM[1].replace(/,?\s+(?:or|and)\s+/gi, ', ')).map(exports.stripEnd).filter(Boolean);
        return mk('start-with', `Answer item by item (${(0, dealtext_ts_1.joinList)(items)}): for each, say whether it can be started today, what has to be registered, approved or set up before the first live use and how long that takes, and what the first live use looks like. Do not say "yes" to the whole list if one item has a lead time.`, `the start steps and lead times of ${(0, dealtext_ts_1.joinList)(items)}, from ${P}'s own documentation`, `Which of ${(0, dealtext_ts_1.joinList)(items, 'or')} do you need live first?`);
    }
    if (/\bexceed\w*\b[^?]{0,40}\b(?:limits?|caps?|quota|allowance|concurrency)\b|\b(?:concurrency|rate|request|api|quota)\s+limits?\b|\bover (?:the |my |our )?(?:limit|quota|cap)\b|\bhit(?:ting)? (?:the |my |our )?(?:limit|quota|cap)\b/i.test(t)) {
        return mk('over-limit', `Answer in three parts: what happens at the limit (new requests wait in a queue, are refused, or are served and billed on), how the limit is raised and how fast, and what the buyer can see before they reach it. Say which of these ${P} does today; do not promise a behaviour you cannot show.`, `what ${P} does when a limit is reached, how a limit is raised and how long that takes, from its documentation`, 'At your busiest hour, how many do you expect at once, and how often do you reach that?');
    }
    if (/\b(?:spending|spend|usage|credit|daily|monthly)\s+(?:limits?|caps?|alerts?|controls?)\b|\bset (?:a |an )?(?:limits?|caps?|budgets?|alerts?)\b|\blimits? on (?:my|the|our)\b/i.test(t)) {
        return mk('limits', `Answer yes or no, then how: at which level a limit can be set (account, product or user), what happens when it is reached (traffic or use stops, or only an alert goes out), who can change it, and how fast a change takes effect.`, `${P}'s controls for limits and alerts, and what each one does when it is reached`, 'When a limit is reached, do you want use to stop, or only a warning?');
    }
    if (/\b(?:prices?|rates?|fees?|costs?|charges?)\b.{0,25}\b(?:vary|varies|differ|differs|change)\b/i.test(t) || /\bvary by\b|\bdiffer by\b/i.test(t)) {
        const by0 = (text.match(/\b(?:by|per|across)\s+([a-z ]{3,30}?)(?:\?|$| and )/i) || [])[1];
        const by = by0 ? (0, exports.stripEnd)(by0).replace(/^country$/i, 'countries').replace(/^region$/i, 'regions').replace(/^destination$/i, 'destinations').replace(/^plan$/i, 'plans') : '';
        return mk('price-varies', `Answer yes or no, then show it: ask which ${by ? (0, exports.stripEnd)(by) : 'countries, regions or plans'} the buyer actually uses, send the rates for just those, and say what drives a difference where your price list shows one.`, `the rate table for the ${by ? (0, exports.stripEnd)(by) : 'countries or regions'} the buyer uses, and the rule behind any difference`, `Which ${by ? (0, exports.stripEnd)(by) : 'countries or regions'} carry most of your volume?`);
    }
    if (/\b(?:subscription|licen[cs]e|perpetual|on[- ]prem\w*|desktop)\b/i.test(t) && /\b(?:purchase|buy|pay|get|switch|move|convert)\b/i.test(t)) {
        return mk('buy-model', `Answer with the ways of buying that exist${ctx.parts.length || ctx.sellerText ? ' for this product' : ''}: a licence, a subscription, or a mix, and for each what it means for upgrades, support and the data. Say yes or no to the form the buyer asked for before anything else, and what it costs to move from one to the other later.`, `the ways ${P} can be bought (licence, subscription, cloud, hybrid), and what each includes, from the price list`, 'Which would you prefer: paying once with yearly upkeep, or paying each year, and why?');
    }
    if (/\b(?:do|will|would|am|are) (?:i|we)\b.{0,20}\b(?:pay|be charged|get charged|billed)\b|\bcharged for\b|\bbilled for\b|\bpay for\b|\b(?:does|do|will|would)\b[^?]{0,40}\bcharge(?:s)? for\b|\bround(?:s|ed|ing)? up\b|\bbilling increments?\b/i.test(t)) {
        return mk('usage-billing', `Answer from the billing rules, using the case in the question: say what counts as billable in this case (used, idle, connected, or only present on the account), how the amount is rounded, when it starts and stops, and show a worked invoice for exactly that case. If the rule has an exception, state it first.`, `${P}'s billing rules for this case: what is billable, from when to when, and what is not`, 'Which of your items would sit idle, and for how long, in a typical month?');
    }
    if (/\bcustom (?:pricing|quote|plan|terms)|tailored (?:pricing|plan|to)|volume (?:pricing|discount|tiers?)|enterprise pricing|pricing .{0,30}\b(?:scale|volume|deployment|needs)\b/i.test(t)) {
        return mk('custom-price', `Say plainly whether a tailored price exists, then how it is built: what the buyer must give (volumes, how fast they ramp, the term), and the structures you can offer for it. Possible trades: ${(0, dealtext_ts_1.joinList)(modelT.slice(0, 3))}. Ask for their expected volumes before you name any figure.`, `which structures and limits your price list allows for a tailored price, and who approves one`, 'What volume do you expect in the first year, and how fast does it ramp?');
    }
    if (/\bdiscount|\bnegotiat/i.test(t)) {
        return mk('discount', `Agree what the buyer gives in return before any number moves. Possible trades: ${(0, dealtext_ts_1.joinList)(modelT.slice(0, 3))}. Tie any change to a written term and keep the structure of the price intact.`, 'the discount limits you are allowed to work within, and who approves a change', 'What could you commit to that would make a lower price possible?');
    }
    if ((/\b(?:free|trial|try|sandbox|test(?:ing)? it|proof of concept|poc|pilot)\b/i.test(t) && /\b(?:can|do|does|could|is there|how)\b/i.test(t)) || /\btest\b.{0,40}\bbefore (?:committing|buying|signing|we commit|paying)\b/i.test(t)) {
        return mk('trial', `Say plainly what the buyer can try before paying: a free trial, a paid pilot or a sandbox, what each includes and for how long. If ${P} offers none of these, offer the smallest proof that answers their main question${needs ? ` (${needs})` : ''}, with the measure written down first.`, `what ${P} offers for a first test, its limits and its length`, 'What would you need to see in a first test to say yes?');
    }
    if (/\b(?:refund\w*|cancel\w*|pay again|next month|minimum|maximum|commitment|lock-?in|set-?up fee|annual maintenance|maintenance fee|renew\w*|credits?|expire\w*)\b/i.test(t)) {
        return mk('terms', `Answer from the written terms, in one place: what is paid and when, what is refundable, what happens on cancellation, and whether a minimum, a commitment or a maintenance fee applies. Never say "no commitment" or "fully refundable" unless the written terms say so.${ctx.model === 'transactions' ? ' For a usage priced deal, say whether pay as you go has any minimum spend, and what a committed plan adds.' : ''}`, `the current billing, refund and cancellation terms of ${P}, including any minimum or maintenance fee`, 'What would the terms need to say for this to be an easy yes?');
    }
    if (/\boverages?\b|\bgo(?:es)? (?:over|above) (?:the |my |our )?(?:plan|allowance|quota|included)|\bbeyond (?:the |my |our )?(?:plan|allowance|included)|\bexcess (?:usage|use)\b/i.test(t)) {
        const plan = (text.match(/\b(?:on|in|under) (?:the )?([A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*)?) plan\b/) || [])[1];
        return mk('overage', `Answer from the written rules of ${plan ? `the ${plan} plan` : 'the plan'} with a worked month that goes over: what counts as over, the rate for the extra use compared with the rate inside the plan, whether use stops or is billed on, and when the buyer is told.`, `the written overage rules of ${plan ? `the ${plan} plan` : 'the plan'} in ${P}'s price list, with an example month`, 'How far over the plan do you expect to go in a busy month?');
    }
    if (/\b(?:reduc\w+|lower\w*|cut(?:ting)?|sav(?:e|ing)\w*|bring(?:ing)? down|control\w*|manag\w+|optimi[sz]\w+|minimi[sz]\w+)\b[^?]{0,50}\b(?:costs?|spend|expenses?|fees)\b/i.test(t) && /^(?:how|can|could|what|will|does|do)\b/i.test(t)) {
        const where = (text.match(/\b(?:reduc\w+|lower\w*|cut(?:ting)?|sav(?:e|ing)\w*|bring(?:ing)? down|control\w*|manag\w+|optimi[sz]\w+|minimi[sz]\w+)\s+(?:the\s+|their\s+|our\s+)?([a-z][a-z \-]{2,40}?\s(?:costs?|spend|expenses?|fees))/i) || [])[1];
        return mk('outcome-cost', `Answer with the way the cost comes down, not with a price list: where ${where ? `the ${(0, exports.stripEnd)(where)} sit` : 'the cost sits'} today (run, support, upgrades, licences or people), which part of it ${P} takes over or removes, and how the quality of the work is protected${ctx.model === 'services' ? ' (service levels, service credits and a parallel run)' : ''}. Use the buyer's own figures for today's cost, and show one case where it came down only if that customer has agreed.`, `a case with the cost before and after and the quality kept, only if the customer has agreed to share it; otherwise say what you can show and what you cannot`, 'Where does most of the cost sit today: running it, supporting it, upgrading it, licences or people?');
    }
    if (/\b(?:how much|price|pricing|priced|costs?|fees?|charges?|budget|afford\w*|expensive|rates?)\b/i.test(t) && !/\bcompar/i.test(t)) {
        const unit = unitFor(text, ctx);
        return mk('price', `Answer with how ${P} is priced${unit ? ` (${unit})` : ''} and one worked example on the buyer's own volumes, with every charge on the page. Then set the figure next to what the problem costs them today${ctx.alternatives.length ? ` (${(0, exports.lowerStart)(ctx.alternatives[0])})` : ''}, so the price is read against their own cost and not on its own.`, `${P}'s price list and exactly what it includes; use a competitor's price only from a quote the buyer shows you`, 'What would this need to be compared with for the price to make sense to you?');
    }
    if (/\bwhy not\b|\balready (?:have|use|has|got|own)\b|\bextend (?:the|our|what)\b|\bwe (?:have|use|built|run) (?:a|an|our|the)\b|\bin-?house\b|\bbuild (?:it|this)\b|\bour (?:own )?(?:erp|crm|tms|wms|system|tool)s? (?:already|has|does)\b/i.test(t)) {
        const cur = ctx.alternatives.length ? ` (${shortAlt(ctx.alternatives[0])})` : '';
        return mk('incumbent', `Start from what their current setup does not do${cur}, in their words, and what that gap costs them. Position ${P} alongside it where you can and replace it only where the gap is clear. Draw the overlap line by line and honestly, including what the current tool does better.`, `what ${P} covers that the current setup does not, and what the current setup covers that ${P} does not`, 'What does the current setup not do today, and what does that cost you?');
    }
    const deployAsked = [...new Set((text.match(/\bon-?prem\w*|\bprivate cloud\b|\bself-?host\w*|\bhybrid\b|\bvpc\b|\bair-?gapped\b|\bdedicated (?:cloud|instance|tenant)\b|\bon our own servers\b/gi) || []).map((x) => x.toLowerCase()))];
    if (deployAsked.length && /^(?:can|could|do|does|is|are|will|would)\b/i.test(t)) {
        const said = (ctx.sellerText.match(/\b(?:in the cloud|on the cloud|self-?hosted|on-?prem\w*|private cloud|hybrid|vpc|air-?gapped)(?:(?:,| or| and|,? and)\s*(?:in the cloud|self-?hosted|on-?prem\w*|private cloud|hybrid|vpc|air-?gapped|cloud|dedicated|public cloud))*/i) || [])[0];
        return mk('deploy-options', `Answer yes or no for each option the buyer named (${(0, dealtext_ts_1.joinList)(deployAsked, 'or')}), then say what each one needs: what the buyer runs and what ${P} runs, who updates it, how it is supported, and how the price differs.${said ? ` Your description says it is available ${said}, so start from that and say which of the buyer's options it covers.` : ''}`, `which of ${(0, dealtext_ts_1.joinList)(deployAsked, 'or')} ${P} supports today, with the limits and the price difference, from its own documentation`, 'Which of your rules or systems decides where it may run?');
    }
    const integ = /\b(?:integrat\w*|connect(?:s|ed)? (?:to|with)|work(?:s)? with|plug into|apis?|sync\w*|existing (?:tools|systems|erp|stack))\b/i.test(t) || /\b(?:salesforce|netsuite|sap|oracle|erp|crm|tms|wms|siem|dms|hris|tally|quickbooks|zoho|slack|jira|splunk|servicenow)\b/i.test(t);
    if (integ) {
        const sys = named.filter((s) => !/^(?:ERP|CRM)$/i.test(s) || named.length === 1);
        const list = sys.length ? ` (${(0, dealtext_ts_1.joinList)(sys)})` : '';
        return mk('integration', `Answer system by system${list}: for each, say whether the link is built in, goes through an API or needs a file transfer, who builds it and who owns it on the buyer's side. ${relevant ? `Your description lists ${relevant.startsWith(P) ? relevant : (0, exports.lowerStart)(relevant)}, so show that part working with their data rather than describe it. ` : ''}Offer a technical call with their IT owner and agree which data moves, in which direction and how often.`, `which of ${sys.length ? (0, dealtext_ts_1.joinList)(sys) : 'the buyer\'s systems'} ${P} connects to today, in what way and with what limits, from your integration documentation`, 'Which system is the master record for this data today, and who owns the connection?');
    }
    const std = (text.match(/\b(?:asc ?606|ifrs ?\d*|gaap|gdpr|dpdp|soc ?[12]|iso ?\d{4,5}|pci(?:[- ]dss)?|rbi|sebi|fedramp|hipaa|nist|gst|e-?invoic\w*)\b/gi) || []).map((x) => x.toUpperCase().replace(/\s+/g, ' '));
    if (std.length || /\b(?:compliance|regulat\w*|certif\w*|statutory)\b/i.test(t)) {
        const what = std.length ? (0, dealtext_ts_1.joinList)([...new Set(std)]) : 'the requirement the buyer named';
        return mk('compliance', `Name the exact rule${std.length > 1 ? 's' : ''} the buyer asked about (${what}) and answer each one separately: what in ${P} supports it, what the buyer's own team or auditor still has to do, and which document proves it. ${relevant ? `Your description lists ${(0, exports.lowerStart)(relevant)}, so show that part producing the evidence. ` : ''}Send the document before they ask for it.`, `whether and how ${P} supports ${what}, and which certificates or reports you hold; never claim a status you cannot show`, 'Who signs off compliance on your side, and what evidence do they ask for?');
    }
    if (/\b(?:secur\w*|privacy|data (?:protection|residency|handling|location|sovereignty)|encrypt\w*|breach\w*|pii|sovereign\w*|safe\b)/i.test(t) && !/\bdifferent|differ\b/i.test(t)) {
        return mk('security', `Bring the answers before they are asked: where the data is stored and processed, who can see it, how it is protected and deleted, and what the buyer wants to check before they approve (a security or IT contact, or the owner). Offer the security documents first and a call with whoever reviews.`, `where ${P} stores and processes the buyer's data, who can reach it, and which security documents you can share`, 'What does your security team need to see before they approve a new vendor?');
    }
    if (/\b(?:differ\w*|different|vs\.?|versus|compared? (?:to|with)|instead of|better than|why .{1,40}\bover\b|over (?:a |an |the )?\S+|main difference)\b/i.test(t)) {
        // "Why do enterprises choose A over B?": the subject and the verb are not part of what is compared
        const m = text.match(/\bwhy (?:do|does|did|would|should|will|can) (?:[a-z][a-z-]*(?: [a-z][a-z-]*){0,2}) (?:choose|pick|prefer|select|buy|use|go with|trust|hire|appoint|engage|opt for) (.+?) (?:over|instead of|rather than|versus|vs\.?) (?:a |an |the )?(.+)$/i)
            || text.match(/\bwhy (?:do |should |would |choose )?(.+?) (?:over|instead of|rather than) (?:a |an |the )?(.+)$/i) || text.match(/\bhow (?:does|do|is|are) (?:a |an |the )?(.+?) (?:differ|different) from (?:a |an |the )?(.+)$/i) || text.match(/\bbetween (.+?) and (.+)$/i);
        const a = m ? (0, exports.stripEnd)(m[1]).replace(/^(?:(?:i|we|you|they|customers?|buyers?|[a-z-]+s)\s+)?(?:choose|pick|prefer|select|buy|use|go with|trust|hire|engage)\s+/i, '') : P;
        const b = m ? (0, exports.stripEnd)(m[2]) : (ctx.alternatives[0] ? shortAlt(ctx.alternatives[0]) : 'the other option');
        return mk('difference', `Answer it as a difference in what ${a} and ${b} are each for, on the points this buyer cares about${needs ? ` (${needs})` : ''}, and not as a feature list. Set ${a} next to ${b} on those points, show each on the buyer's own case, and say plainly when ${b} is the better choice for something.`, `what ${a} and ${b} each do today, from your own documentation; do not claim a difference you cannot show`, 'What are you trying to get done with it, and what have you tried so far?');
    }
    if (/\b(?:can|do|does|will|could) (?:we|you|it|i|they)\b.{0,40}\b(?:all|every|each|any)\b|\b(?:countries|regions|cities|languages|markets|currencies)\b/i.test(t) && /^(?:can|do|does|will|could|is|are)\b/i.test(t)) {
        return mk('coverage', `Answer item by item, not with "all": for each country, region, language or case in the buyer's list, say whether it is supported today, supported after set-up or approval, or not supported, and what that costs. Ask for their list first and send it back marked up.`, `which of the buyer's items ${P} supports today, which need set-up or approval and how long that takes, and which it does not support`, 'Which of these matter first, and which could wait for a later wave?');
    }
    if (/\b(?:suitable|right for|fit for|fit our|work(?:s)? for|enterprises?|growing|at scale|scale|specific .{0,25}(?:workflows?|codes?|processes)|cost codes)\b/i.test(t)) {
        if (ctx.model === 'services') {
            return mk('fit', `Answer with a staged plan on the buyer's own case instead of a plain yes: ask for the three applications or workloads that would be hardest to move (age, size, dependencies and the rules that apply to them), and for each say what ${P} has done on a case like it, what it would do first and what it would not take on. Then offer a pilot on the one that matters most, with a parallel run and exit criteria.`, `the kinds of work ${P} has delivered that match the buyer's cases, from its own project notes; a reference of similar size only if the customer has agreed`, 'Which three applications or workloads would you want to see handled before you believe it?');
        }
        return mk('fit', `Answer with the buyer's own hardest cases, by name, instead of a plain yes: ask for the three that would break a weaker option (the size, the number of sites or entities, the special rules), and for each say whether it works today, works with set-up, or is not supported. Then offer a test on the one that matters most.`, `which of the buyer's cases ${P} supports today, which need configuration and which it does not support; a reference of similar size only if the customer has agreed`, 'Which three cases would you want to see working before you believe it?');
    }
    if (/\b(?:time to (?:learn|tune|set)|take time|steep|learning curve|too complex|complex to|hard to (?:use|learn|configure))\b/i.test(t)) {
        return mk('effort', `Do not argue the point; agree that tailoring takes effort and show how it is managed: what works out of the box, who tunes the rest in the first weeks (your team or theirs), and how long it takes to a first useful result. Offer a short pilot so the buyer can measure the effort themselves.`, `what is configured by default in ${P}, what a typical customer tunes, and the time it took for a customer of a similar size`, 'Who on your side would own the tuning, and how much of their week can they give it?');
    }
    if (/\b(?:set ?up|implement\w*|onboard\w*|go[- ]live|how long|timeline|time to|deploy\w*|roll ?out|migrat\w*|cut-?over|transition)\b/i.test(t)) {
        return mk('setup', `Give a dated plan, not a promise: the steps from signing to first use, who does what on each side, and what the buyer must have ready. For this deal that means ${modelWords(ctx.model, ctx.sellerText).setup}. Offer to agree the plan before the contract is signed.`, `the set-up time you have achieved for customers of a similar size and what ${P} needs from the buyer; give a range only if you can show it`, 'What has to be live, and by when, for this to count as a success for you?');
    }
    if (/\b(?:adopt\w*|will (?:not|n't) use|won'?t use|training|resist\w*|change management|buy-?in)\b/i.test(t)) {
        return mk('adoption', `Plan adoption with the people who will use it: a small first group, one measure of use agreed before the start, and a named owner on the buyer's side. Let that group's results make the case for the rest.`, `the adoption you have seen with customers of a similar kind (share it only with their consent) and the training ${P} provides`, 'Who would use this every day, and what would make them keep using it?');
    }
    if (/\b(?:accura\w*|reliab\w*|precise\w*|gps|error rate|hallucinat\w*|explain\w*|false positives?)\b/i.test(t)) {
        return mk('accuracy', `Offer a test the buyer can check for themselves: run it on their own data or history, compare it with what they use today, and agree the measure and the pass mark before the test starts.`, `what accuracy or error you have measured for ${P}, on whose data and how; do not quote a figure you cannot show`, 'How would you judge, on your own data, that it is good enough?');
    }
    if (/\b(?:offline|no (?:internet|network|signal)|low connectivity|remote areas?)\b/i.test(t)) {
        return mk('offline', `Answer with the working: what a user can still do with no signal, what waits until the device reconnects, and how a clash is settled when two people change the same record. Offer to test it in a low-signal area with their own users.`, `which functions of ${P} work offline today and how data syncs when the connection returns`, 'In which places do your people lose signal, and what do they do then?');
    }
    if (/\b(?:another|other|different|own|any)\b.{0,25}\b(?:providers?|models?|vendors?|clouds?)\b|\block-?in\b/i.test(t)) {
        return mk('choice', `Answer with the list: which providers, models or clouds ${P} works with today, how a buyer switches between them, and what stays portable if they leave. Show one switch live if you can.`, `the list of providers or models ${P} supports now, and how switching works in practice`, 'Which provider or model do you need to keep the option of using?');
    }
    if (/^(?:what|how) (?:should|do|happens|can|will)|^what if|\bwhat happens\b|\bwhat (?:should|do) (?:i|we) do\b|^can i\b|^do i\b/i.test(t)) {
        return mk('process', `Answer as a short procedure for this case: what the buyer sees, who acts, within what time, and what it costs them. ${relevant ? `Point to ${(0, exports.lowerStart)(relevant)} where it applies. ` : ''}Put the same answer in the proposal, so it is not given from memory on every call.`, `${P}'s documented process and service levels for this case, from your operations documents`, 'Has this happened to you before, and what did you do then?');
    }
    if (/^why (?:do|does|is|are)\b/i.test(t)) {
        return mk('why', `Explain the cause in the buyer's terms first, then show where they can see it and where they can change it. A clear reason is worth more than a long defence.`, `the rules behind it in ${P}, from your own pricing or product rules`, 'Which case surprised you, and what did you expect to see?');
    }
    // anything else: the shared answer for its kind, with the sector pattern only when nothing more specific was found
    const bctx = { product: P === 'your product' ? '' : P, sectorObjections: ctx.v?.objections, sectorName: ctx.v?.name, model: ctx.model };
    const a = (0, answers_ts_1.answerBlocker)(text, bctx);
    const answer = a.kind === 'general' ? `Answer the exact question asked in two parts: the facts the buyer needs, then what you will do next.${relevant ? ` Start from ${(0, exports.lowerStart)(relevant)}, which your description lists.` : ''}${a.sector ? ` In ${ctx.v?.name || 'this sector'} the usual pattern is: ${(0, exports.lowerStart)(a.sector)}` : ''} Your inputs hold no fact that answers this question, so the answer cannot be written from them: bring the facts first, and if you do not have one yet, say when you will.` : a.how;
    return mk(a.kind, answer, a.confirm, a.ask);
}
/** The owner of an answer in a deal plan, by the kind of question (a key of the roles the caller knows). */
function ownerKind(id) {
    if (id === 'integration')
        return 'it';
    if (id === 'compliance' || id === 'security')
        return 'security';
    if (['cheapest', 'price', 'discount', 'packaging-single', 'packaging-add', 'tco', 'terms', 'trial'].includes(id))
        return 'price';
    if (['adoption', 'offline', 'effort'].includes(id))
        return 'champion';
    if (['accuracy', 'setup', 'fit', 'process', 'choice'].includes(id))
        return 'se';
    return 'seller';
}
/** The buyer's industry as a clean phrase: "Financial_Services" becomes "financial services"; an empty or generic value gives ''. */
function cleanIndustry(s) {
    if (typeof s !== 'string')
        return '';
    const t = (/_/.test(s) || /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(s.trim()) ? s.toLowerCase() : s).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t || /^technology$/i.test(t))
        return '';
    return /^[A-Z][a-z]/.test(t) && !/^[A-Z][a-z]+\s+[A-Z]/.test(t) ? (0, exports.lowerStart)(t) : t;
}
/** The industry named in an account or deal title: "Banking account (Acme customer)" gives "Banking"; "Retail deal for Acme" gives "Retail". */
function industryFromTitle(s) {
    if (typeof s !== 'string')
        return '';
    const m = s.match(/^(.+?)\s+(?:account|deal|customer)\b/i);
    return m ? m[1].trim() : '';
}
/** When the product has no clear name in the user's text, the first sentence of what the user wrote, quoted whole (cut only at a comma); '' when a name was found. */
function sellerWords(brief) {
    if (brief.short || !brief.full)
        return '';
    const first = (0, dealtext_ts_1.sentences)(brief.full)[0] || brief.full;
    if (first.length <= 240)
        return (0, exports.quoted)(first);
    const pieces = (0, dealtext_ts_1.splitTopLevel)(first);
    let acc = '';
    for (const p of pieces) {
        if ((acc ? acc + ', ' + p : p).length > 240)
            break;
        acc = acc ? acc + ', ' + p : p;
    }
    return (0, exports.quoted)(acc || (0, dealtext_ts_1.clip)(first, 240));
}
/** The kind of product, read from the user's description, without the name repeated at its start ("Wisely, a single API led platform" gives "a single API led platform"); the brief with that kind, for describeWith. */
function cleanBrief(brief) {
    if (!brief.kind || !brief.short)
        return brief;
    const esc = brief.short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const kind = brief.kind.replace(new RegExp(`^${esc}\\s*(?:,|:|-)?\\s*`, 'i'), '').trim();
    return { ...brief, kind: kind || brief.kind };
}
/** A set of answers must not repeat a sentence: a sentence an earlier answer already holds is dropped (the first sentence of an answer always stays),
 *  a repeated "bring" line names its own question, and a repeated question is left out. */
function dedupeAnswers(items) {
    const seen = new Set();
    const key = (x) => x.toLowerCase().replace(/\s+/g, ' ').trim();
    for (const it of items) {
        const sents = (0, dealtext_ts_1.sentences)(it.a.answer);
        // a sentence an earlier answer holds is dropped; the question is not repeated (it is the heading above the answer). When nothing else is left the first sentence stays.
        let kept = sents.filter((x) => !seen.has(key(x)));
        if (!kept.length && sents.length)
            kept = [sents[0]];
        it.a.answer = kept.join(' ');
        sents.forEach((x) => seen.add(key(x)));
        if (seen.has(key(it.a.bring)))
            it.a.bring = `for ${(0, exports.quoted)(it.text.length > 140 ? (0, dealtext_ts_1.clip)(it.text, 140) : it.text)}: ${it.a.bring}`;
        seen.add(key(it.a.bring));
        if (seen.has(key(it.a.ask)))
            it.a.ask = '';
        else
            seen.add(key(it.a.ask));
    }
    return items;
}
const escapeRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** True only for a word that is clearly a name: it has a capital inside or a digit or a dot (Voxel, Bitlane, fleet44, Voxa.ai), or it is capitalised, is not a common word,
 *  adjective or noun of the trade (no hyphen, no adjective ending), and the user also wrote it that way elsewhere or typed it as "Name, a description". */
function nameLike(tok, evidence, namedByArticle) {
    if (!tok || tok.length < 3)
        return false;
    if (/[a-z][A-Z]|\d|\./.test(tok))
        return true;
    if (!/^[A-Z]/.test(tok) || /-/.test(tok))
        return false;
    if ((0, dealtext_ts_1.isGenericWord)(tok))
        return false;
    return namedByArticle || new RegExp(`(?<![A-Za-z])${escapeRe(tok)}(?![A-Za-z])`).test(evidence);
}
const capitals = (s) => s.split(/\s+/).filter((w) => /^[A-Z0-9]/.test(w)).length;
/** The product brief of dealtext.ts. A name is used only when it is clearly a name (see nameLike; several words need two capitalised words or "from"/"by");
 *  otherwise the brief carries no name and the tools say "your solution" and quote the description. When no name is found in the description, the product name given in
 *  another field wins: "(Acme customer)" in an account or customer name. Never the first word of a description. */
function briefOf(text, fields) {
    const base = (0, dealtext_ts_1.solutionBrief)(text);
    if (!base.full)
        return base;
    // a field that repeats the description (the user pasted the product into two inputs) is not evidence of a name
    const own = base.full.slice(0, 30).toLowerCase();
    fields = fields.filter((f) => typeof f === 'string' && f && !f.toLowerCase().includes(own));
    const ev = fields.join(' \n ');
    const wholeShort = base.short === base.full.replace(/[.]+$/, '');
    if (base.short && (wholeShort || (base.short.split(/\s+/).length === 1 ? nameLike(base.short, ev, /^[^,:]{1,80}[,:]\s+(?:an?|the|our)\s/i.test(base.full)) : capitals(base.short) >= 2 || /\b(?:from|by)\b/.test(base.short))))
        return base;
    const first = base.full.match(/^([A-Za-z][A-Za-z0-9.&'-]{2,})(?=[\s,:(]|$)/);
    const fieldName = fields.map((f) => f.match(/\(([A-Z][A-Za-z0-9.&' -]{1,40}?)\s+customer\)/)).find(Boolean);
    const candidate = first && nameLike(first[1], ev, false) ? first[1] : fieldName && base.full.toLowerCase().startsWith(fieldName[1].trim().toLowerCase()) ? fieldName[1].trim() : '';
    if (candidate) {
        let kind = base.full.slice(candidate.length).replace(/^[\s,:]+/, '').split(/\s*[(:]/)[0].trim();
        if (kind.split(/\s+/).length > 12)
            kind = (kind.split(',')[0] || '').trim();
        if (kind.split(/\s+/).length > 12)
            kind = '';
        return { ...base, name: candidate, short: candidate, kind: kind.replace(/[.,]+$/, '') };
    }
    return { ...base, name: '', short: '', kind: '', parts: base.parts };
}
/** The unit a usage priced deal is paid in, read from the user's own pricing words ("pay only for active SIMs", "per shipment", "per message"); '' when the words show none (the wording then stays neutral) or show seats or licences. */
const UNITS = 'message|sms|sim|device|transaction|call|minute|check|verification|request|session|order|shipment|label|lookup|booking|payment|invoice|ticket|contact|api call';
function usageUnit(...texts) {
    const t = texts.join(' . ');
    if (/\bper[- ](?:seat|user)s?\b|\blicen[cs]es?\b|\bseats?\b/i.test(t))
        return '';
    const m = t.match(new RegExp(`\\bper[- ](${UNITS})\\b`, 'i')) || t.match(new RegExp(`\\bpay(?:s|ing)? (?:only )?for (?:the |each |every )?(?:active |live |used )?(${UNITS})s?\\b`, 'i'));
    if (!m)
        return '';
    const w = m[1].toLowerCase();
    return w === 'sms' ? 'message' : w === 'sim' ? 'SIM' : w;
}
/** Replaces the business model sentence of a context line when the user's pricing words show a usage priced deal. */
function usageLine(line, unit) {
    return line.replace(/Business model: [^]*?\.\*$/, `Business model: usage priced, paid per ${unit} (read from your wording about price; the sector read is unchanged).*`);
}
/** The sentences of the deal text (objections, notes, blockers, requirements) in which the seller's own offer of usage pricing shows: a question taken from its price page
 *  such as "What is available on pay as you go?". A sentence that compares with something else ("Is pay as you go cheaper?", "Why not keep paying per transaction?", "lower fees than ...") is the buyer's. */
const BUYER_COMPARES = /\b(?:cheaper|cheapest|less expensive|than|instead|versus|vs\.?|keep(?:ing)? paying|why not|rather than|currently|today|already|alternatives?|competitors?|switch(?:ing)? from|banks?|incumbents?|we pay|we use)\b/i;
// usage words of a price page that are not a pricing phrase by themselves: overages, rounding up, "billed per hour"
const OFFER_USAGE = /\boverages?\b|\bround(?:s|ed|ing)? up\b|\bhigh[- ]usage\b|\bbilled (?:per|by|in)\b|\bper[- ](?:hour|minute|token|character|thousand|million|1,?000)\b|\bcharge(?:s|d)? for (?:silence|idle|unused)\b/i;
function sellerOffers(...texts) {
    return texts.join(' . ').split(/[?;\n]|\.(?=\s|$)/).map((x) => x.trim()).filter((x) => x && (STRONG_USAGE.test(x) || OFFER_USAGE.test(x)) && !BUYER_COMPARES.test(x)).join(' . ');
}
/** A payments provider in the seller's own words (a gateway, payouts, checkout, merchants, card issuing ...). A core banking or lending platform that only lists "payments" among the things it connects is not one. */
const PAYMENT_PROVIDER = /\bpayments? (?:gateway|processing|processor|service provider|orchestration|apis?|infrastructure)\b|\bpayouts?\b|\bcheckout\b|\bacquir\w+|\bcard (?:issuing|processing|payments)\b|\bmerchants?\b|\bremittances?\b|\bupi\b|\bwallets?\b|\bbuy now pay later\b|\bbanking as a service\b|\bbank account (?:data|apis?|linking|verification)\b|\bopen banking\b|\bpay[- ]ins?\b/i;
/** The sector read, set back to its parent when the sub-type does not fit the seller's own words: "payments and banking APIs" is the sub-type of a payments provider; a core banking platform
 *  is fintech but not a payments provider, and gets neither the payments objections nor a payments evaluation. */
function reframeSector(ctx, sellerText) {
    const v = ctx.v;
    if (!v || v.subtype !== 'payments-banking' || PAYMENT_PROVIDER.test(sellerText))
        return ctx;
    const parent = verticals_ts_1.VERTICALS.find((x) => x.id === v.id);
    if (!parent)
        return ctx;
    return { ...ctx, v: parent, line: ctx.line.replace(/(read from your inputs as )[^.]*?payments and banking APIs/, `$1${parent.name}`) };
}
// a sector's usual model "per transaction" is kept only for a seller whose words show a usage or API product
const USAGE_CUES = /\bapis?\b|\bsdk\b|\bsms\b|\bmessag\w+|\bvoice\b|\botp\b|\bverification\b|\bgateway\b|\blabels?\b|\bcouriers?\b|\bshipping\b|\bper[- ]\w+\b|\busage\b|\bvolume\b|\bmetered\b|\bpay[- ]as[- ]you[- ]go\b/i;
const FIXED_LINK_WORDS = /\b(?:per site|per link|leased lines?|mpls|sd-?wan|site survey|managed network|branch(?:es)? (?:network|sites?)|wi-?fi|broadband|bandwidth|wan\b)\b/i;
// the seller's own pricing words: a single product noun (API, SIM, volume) is never one
const STRONG_USAGE = /\bpay[- ]as[- ]you[- ]go\b|\busage[- ]based\b|\bmetered\b|\bprepaid\b|\brate card\b|\bpriced (?:by|on) usage\b|\bpay only for\b|\bper[- ](?:message|sms|call|minute|gb|mb|gigabyte|transaction|api call|request|verification|sim|shipment|label|lookup|check)\b/i;
// words of a people-delivered service: a seller that uses them is never flipped to usage priced by a unit price such as "per call" or "per ticket"
const SERVICE_WORDS = /\b(?:outsourc\w*|bpo\b|managed (?:services?|operations|detection)|consult\w*|staffing|fte\b|retainer|time and materials|statement of work|(?:contact|call) cent(?:re|er)s?|service desk|professional services|dedicated teams?)\b/i;
// the shared reader can read "software subscription" from a company name such as "Analytics"; when the seller's own words describe a firm that does projects and name no software, the read is not stated
const SOFTWARE_CUES = /\b(?:software|saas|platforms?|apps?|apis?|tools?|dashboards?|subscriptions?|licen[cs]es?|per seat|per user|cloud|portal|systems?|crm|erp|workflow|automation|engine|plug-?ins?|sdk)\b/i;
const FIRM_CUES = /\b(?:firm|agency|consultanc\w*|advisory|projects|engagements|retainer)\b/i;
const SEAT_WORDS = /\bper[- ](?:seat|user|agent|member|employee|licen[cs]e|month|year)\b|\bmonthly (?:plan|fee|subscription)\b|\bseats?\b|\blicen[cs]es?\b|\bsubscriptions?\b|\bannual (?:plan|subscription|licen[cs]e)\b|\bflat fee\b/i;
/** The business model line of a context line, said only as far as the seller's own words show it (run 22 follow-up 2, rule E8: a sentence that names a business model
 *  must state the seller's own model, or none). The shared sector reader gives a model in three ways: from the seller's words ("read from your inputs"), as the usual model
 *  of the sector ("assumed"), or not at all. Only the first is stated here. An assumed model is not named, because the sector's usual model is wrong for a services firm
 *  in a software sector or a software seller in a services sector; the wording of the plan still follows it, and the line says so. The line also no longer tells the user to
 *  set business_model, which these three tools do not take. */
const MODEL_LINE = /Business model: [^]*?\.\*$/;
const ASSUMED_LINE = 'Business model: not stated in your inputs, so the notes below follow the usual shape for this sector (assumed); say how you are paid in your_solution to change them.*';
const MIXED_LINE = 'Business model: your words point to both a subscription and usage pricing, so the notes below follow the usual shape for this sector (assumed); say how you are paid in your_solution to change them.*';
function plainModelLine(line) {
    if (!MODEL_LINE.test(line))
        return line;
    const m = line.match(MODEL_LINE)[0];
    if (/assumed/.test(m) && !/read from the product description|read from your wording/.test(m))
        return line.replace(MODEL_LINE, ASSUMED_LINE);
    if (/^Business model: not clear from your inputs/.test(m))
        return line.replace(MODEL_LINE, 'Business model: not clear from your inputs; say how you are paid in your_solution for advice that fits it.*');
    return line.replace(/; set business_model to change it\)/, ')');
}
/** The business model, read from the seller's own words as well as from the sector reader. `sellerText` is what the seller wrote about its own product (your_solution) and `others`
 *  more of the seller's own words (the products the account already buys from it); never the buyer's objections, requirements, blockers, notes or alternatives, which are the
 *  buyer's words ("is pay as you go cheaper?"). It changes the sector read only on the seller's own words:
 *  (a) a connectivity seller whose description names SIMs two ways (SIM and eSIM, SoftSIM, IoT connectivity) or opens with them, and names no sites or links, is a SIM seller;
 *  (b) a seller whose own pricing words say pay as you go, usage based, metered, prepaid, a rate card or "per message" (and no seat, per user or subscription words) is usage priced.
 *  A product noun alone (an API, a SIM card the customer supplies, a usage report) changes nothing.
 *  When the seller's words point both ways, the sector model stays and the line says to check it. */
function readModel(ctxModel, ctxLine, sellerText, others, offers = []) {
    // `offers` (see sellerOffers) are questions from the deal text that come from the seller's price page; they count only for a seller that describes software ("a platform", "APIs"), never for a firm that does operations
    const evidence = SOFTWARE_CUES.test(sellerText) ? [...others, ...offers] : others;
    const all = [sellerText, ...evidence].join(' . ');
    const unit = usageUnit(sellerText, ...evidence);
    const assumed = /assumed/.test(ctxLine);
    const fixed = FIXED_LINK_WORDS.test(all);
    const usageStrong = STRONG_USAGE.test(all) || (SOFTWARE_CUES.test(sellerText) && OFFER_USAGE.test(offers.join(' . ')));
    const seatWords = SEAT_WORDS.test(all);
    const serviceWords = SERVICE_WORDS.test(all);
    if (ctxModel === 'transactions' && assumed && !usageStrong && !USAGE_CUES.test(sellerText)) {
        // the sector's usual model is per transaction, but the seller's words show no usage product (a core banking platform): the wording stays neutral
        return { model: null, unit: '', line: plainModelLine(ctxLine), stated: false };
    }
    let model = ctxModel;
    let line = ctxLine;
    let changed = false;
    if (ctxModel === 'saas' && !assumed && (FIRM_CUES.test(sellerText) || SERVICE_WORDS.test(sellerText)) && !SOFTWARE_CUES.test(sellerText)) {
        // the seller describes a firm that does projects and names no software: the subscription read is not stated, and the wording stays neutral
        return { model: null, unit: '', line: ctxLine.replace(MODEL_LINE, ASSUMED_LINE), stated: false };
    }
    const simTerms = new Set((sellerText.match(/\b(?:sims?|esims?|softsims?|iot connectivity)\b/gi) || []).map((x) => x.toLowerCase().replace(/s$/, '')));
    const simSeller = ctxModel === 'connectivity' && !fixed && (simTerms.size >= 2 || /\b(?:sims?|esims?|softsims?|iot connectivity)\b/i.test(sellerText.slice(0, 60)));
    if (simSeller) {
        model = 'sim';
        changed = true;
        line = line.replace(MODEL_LINE, 'Business model: connectivity sold through SIMs (read from the product description; not fixed sites or links; say how you are paid in your_solution to change it).*');
        return { model, unit, line, stated: false };
    }
    if (usageStrong && (seatWords || serviceWords) && !fixed) {
        // mixed evidence: the sector model stays for the wording, it is not named, and the line says to check how the seller is paid
        return { model, unit: '', line: ctxLine.replace(MODEL_LINE, MIXED_LINE), stated: false };
    }
    if (usageStrong && !fixed && (ctxModel === 'connectivity' || ctxModel === 'saas' || ctxModel === 'transactions' || ctxModel === null)) {
        model = 'transactions';
        changed = true;
        line = unit ? usageLine(ctxLine, unit) : line.replace(MODEL_LINE, 'Business model: usage priced, read from your wording about price.*');
        return { model, unit: seatWords ? '' : unit, line, stated: true };
    }
    return { model, unit: seatWords ? '' : unit, line: plainModelLine(line), stated: changed || !assumed };
}
//# sourceMappingURL=rw1-common.js.map