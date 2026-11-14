"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundingTextCurrencies = fundingTextCurrencies;
exports.readFundingChat = readFundingChat;
// Deterministic chat reading. This file reads supplied words; it supplies no commercial assumptions.
const NUMBER = String.raw `-?\d[\d,]*(?:\.\d+)?`;
const AMOUNT = String.raw `(?:(?:Rs\.?|INR|₹|S\$|SGD|AED|USD|GBP|EUR|\$|£|€)\s*)?${NUMBER}\s*(?:(?:lakh|crore|million|billion|thousand|k|m)\b)?`;
const NUMBER_WORDS = Object.fromEntries(('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty').split(' ').map((s, i) => [s, i]));
Object.assign(NUMBER_WORDS, { thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 });
const QUANTITY = String.raw `(?:${NUMBER}|${Object.keys(NUMBER_WORDS).join('|')})`;
const quantity = (s) => NUMBER_WORDS[s.toLowerCase()] ?? Number(s.replace(/,/g, ''));
const n = (s) => s === undefined ? undefined : Number(s.replace(/,/g, ''));
const NEGATED = /\b(?:not|no|never|without|excluding|rather than|instead of)\b/i;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
/** Currency marks are read over every caller text field, not inferred from a dollar sign's geography. */
function fundingTextCurrencies(words) {
    const codes = { rs: 'INR', 'rs.': 'INR', inr: 'INR', '₹': 'INR', 's$': 'SGD', sgd: 'SGD', aed: 'AED', usd: 'USD', gbp: 'GBP', eur: 'EUR', '$': 'USD', '£': 'GBP', '€': 'EUR' };
    const normal = words.replace(/\\(?=\$)/g, '');
    return [...new Set([...normal.matchAll(/\b(?:Rs\.?|INR|SGD|AED|USD|GBP|EUR)\b|S\$|₹|\$|£|€|\b(?:lakh|crore)\b/gi)].map(m => (/^(?:lakh|crore)$/i.test(m[0]) ? 'INR' : codes[m[0].toLowerCase()])))].filter(Boolean);
}
function readFundingChat(words, now) {
    const value = words.replace(/\\(?=\$)/g, '');
    // Track occurrences, so an unrelated figure equal to a known limit cannot slip through.
    const assignedCounts = new Set(), assignedMonths = new Set();
    let customers, pairedAmount;
    const countPattern = new RegExp(String.raw `(?<![\w.-])(${QUANTITY})\s+(?:(new|expected|forecast|target)\s+)?(customers?|logos?|clients?|deals?|wins?|accounts won)\b`, 'gi');
    const counts = [...value.matchAll(countPattern)];
    for (const m of counts) {
        const index = m.index;
        const before = value.slice(0, index).split(/[;\n]|\bbut\b|\binstead\b/i).at(-1);
        const tail = value.slice(index + m[0].length);
        // Existing and negated counts are understood as excluded, never as the forecast.
        if (NEGATED.test(before) || /\b(?:we have|have|existing|current|already|installed base)\s*(?:about\s*)?$/i.test(before)) {
            assignedCounts.add(index);
            continue;
        }
        if (/\b(?:hundred|thousand|million|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s*[- ]$/i.test(before))
            continue;
        if (/^(?:one|1)$/i.test(m[1]) && /^\s+(?:pays|brings|is worth)\b/i.test(tail) && !m[2]) {
            assignedCounts.add(index);
            continue;
        }
        const candidate = quantity(m[1]);
        if (customers === undefined || customers === candidate) {
            customers = candidate;
            assignedCounts.add(index);
            pairedAmount ??= new RegExp(String.raw `^\s*(?:from this\s*)?(?:at|each(?: pays)?|paying)\s+(${AMOUNT})`, 'i').exec(tail)?.[1];
        }
    }
    if (customers === undefined) {
        const m = new RegExp(String.raw `\b(?:new|expected|forecast|target)\s+(?:customers?|logos?|clients?|deals?|wins?)\s*(?:expected|forecast|target)?\s*(?:[:=]|of|is|are)?\s*(${QUANTITY})\b`, 'i').exec(value);
        if (m && !NEGATED.test(value.slice(0, m.index)))
            customers = quantity(m[1]);
    }
    const annual = [
        new RegExp(String.raw `\b(?:ACV|ARR per (?:new )?(?:customer|client)|annual revenue per (?:new )?(?:customer|client)|revenue per (?:new )?(?:customer|client)(?: per year)?)\s*(?:of|is|[:=])?\s*(${AMOUNT})`, 'i'),
        new RegExp(String.raw `\b(?:one (?:new )?(?:customer|client) pays|each pays|per customer(?: per year)?)\s*(?:of|is|[:=])?\s*(${AMOUNT})`, 'i'),
        new RegExp(String.raw `\bat\s+(${AMOUNT})\s*(?:each|a year|per year|annually|ARR|ACV)`, 'i'),
        new RegExp(String.raw `(${AMOUNT})\s*(?:each\b|per (?:new )?(?:customer|client)(?:\s*\(?per year\)?)?)`, 'i'),
    ].map(pattern => pattern.exec(value)).find(Boolean);
    const spend = new RegExp(String.raw `\b(?:spend|cost|budget)\s*(?:of|is|[:=])?\s*(${AMOUNT})`, 'i').exec(value)?.[1] ?? new RegExp(String.raw `(${AMOUNT})\s+(?:spend|budget)\b`, 'i').exec(value)?.[1];
    const read = (patterns) => { for (const pattern of patterns) {
        const m = pattern.exec(value);
        if (m && !NEGATED.test(value.slice(Math.max(0, (m.index ?? 0) - 25), m.index).split(/[.;,]/).at(-1) ?? ''))
            return n(m[1]);
    } return undefined; };
    const durations = [...value.matchAll(new RegExp(String.raw `(?<![\w.-])(${QUANTITY})\s*[- ]?months?\b`, 'gi'))];
    const limits = [], cycles = [];
    for (const m of durations) {
        const index = m.index, before = value.slice(0, index).split(/[;,.\n]/).at(-1), tail = value.slice(index + m[0].length);
        const negated = NEGATED.test(before);
        const cycleContext = /\b(?:sales cycle|cycle|first touch to signed deal)\s*(?:(?:of|is|takes?|[:=])\s*)?$/i.test(before) || /^\s+(?:sales cycle|cycle)\b/i.test(tail);
        const startContext = /\bstart(?:ing|s)?\s+(?:in|after)\s*$/i.test(before);
        const limitContext = /(?:\b(?:payback|break[ -]even|recover(?:\s+the\s+spend)?|back|target|limit)\b.{0,55}\b(?:in|within|inside|by|under|of)\s*|\b(?:payback(?: target)?|(?:payback )?limit|finance (?:accepts|wants|allows)(?: payback)?)\s*(?:(?:of|is|[:=])\s*)?)$/i.test(before) || /^\s+(?:payback(?: limit)?|limit)\b/i.test(tail);
        if (!negated && cycleContext) {
            cycles.push(quantity(m[1]));
            assignedMonths.add(index);
        }
        else if (!negated && startContext && /^\d+$/.test(m[1]))
            assignedMonths.add(index);
        else if (!negated && limitContext) {
            limits.push(quantity(m[1]));
            assignedMonths.add(index);
        }
    }
    let limit = limits[0];
    // Conflicting limits remain unanswered rather than choosing whichever appeared first.
    if (new Set(limits).size > 1) {
        limit = undefined;
        for (const m of durations)
            assignedMonths.delete(m.index);
    }
    if (new Set(limits).size <= 1)
        limit ??= read([/\b(?:payback )?limit\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)\b/i]);
    const margin = read([/\b(?:gross )?margin\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)/i, /(?<![\w.-])(-?\d+(?:\.\d+)?)\s*%\s*(?:gross )?margin\b/i]);
    const cycle = cycles[0] ?? read([/\b(?:sales cycle|cycle|first touch to signed deal)\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)/i]);
    const win = read([/\bwin rate\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)/i, /(?<![\w.-])(-?\d+(?:\.\d+)?)\s*%\s*win rate\b/i]);
    const monthName = String.raw `(${MONTHS.map(m => m.slice(0, 3) + String.raw `(?:${m.slice(3)})?`).join('|')})`;
    const fyName = new RegExp(String.raw `\b(?:financial year|FY)\s+starts?\s+(?:in\s+)?${monthName}\b`, 'i').exec(value);
    const fy = fyName ? MONTHS.findIndex(m => m.startsWith(fyName[1].toLowerCase())) + 1 : read([/\b(?:fy start|financial year start)\s*(?:month|[:=])?\s*(-?\d+)/i]);
    const startWords = value.replace(/\b(?:financial year|FY)\s+starts?\s+(?:(?:in|month)\s+)?(?:[A-Za-z]+|\d+)/gi, ' ');
    const iso = startWords.match(/\bstart(?:ing|s)?\s*(?:[:=]|in)?\s*(\d{4}-\d{2})\b/i)?.[1];
    const named = new RegExp(String.raw `\bstart(?:ing|s)?\s*(?:in\s+)?${monthName}(?:\s+(\d{4}))?\b`, 'i').exec(startWords);
    const relative = /\bstart(?:ing|s)?\s+(?:in|after)\s+(\d+)\s+months?\b/i.exec(startWords);
    let start = iso;
    if (relative) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + Number(relative[1]), 1));
        start = date.toISOString().slice(0, 7);
    }
    if (named) {
        const month = MONTHS.findIndex(m => m.startsWith(named[1].toLowerCase()));
        const year = n(named[2]) ?? (now.getUTCFullYear() + (month < now.getUTCMonth() ? 1 : 0));
        start = `${year}-${String(month + 1).padStart(2, '0')}`;
    }
    const notRead = [];
    for (const [label, present, readValue] of [['new customers', /\b(?:customers?|logos?|clients?)\b/i, customers], ['annual revenue per customer', /\b(?:ACV|ARR per customer|annual revenue per customer|each pays)\b/i, (annual?.[1] ?? pairedAmount)], ['payback limit', /\b(?:payback|finance accepts|limit)\b/i, limit], ['gross margin', /\bmargin\b/i, margin], ['sales cycle', /\b(?:sales cycle|cycle months)\b/i, cycle], ['win rate', /\bwin rate\b/i, win], ['financial year start', /\b(?:financial year starts?|FY starts?)\b/i, fy], ['spend start month', /\bstart(?:ing)?\s+(?!month)/i, start]])
        if (present.test(label === 'spend start month' ? startWords : value) && readValue === undefined)
            notRead.push(label);
    const unreadMonths = durations.filter(m => !assignedMonths.has(m.index)).map(m => m[0]);
    const unreadCounts = counts.filter(m => !assignedCounts.has(m.index)).map(m => m[0]);
    return { customers, perCustomer: (annual?.[1] ?? pairedAmount), spend, limit, margin, cycle, win, fy, start, currencies: fundingTextCurrencies(value), notRead, unreadMonths, unreadCounts };
}
//# sourceMappingURL=roi-funding-chat.js.map