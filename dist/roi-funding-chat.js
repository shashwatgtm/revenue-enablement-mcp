"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundingTextCurrencies = fundingTextCurrencies;
exports.readFundingChat = readFundingChat;
// Deterministic chat reading. This file reads supplied words; it supplies no commercial assumptions.
const NUMBER = String.raw `-?\d[\d,]*(?:\.\d+)?`;
const AMOUNT = String.raw `(?:(?:Rs\.?|INR|₹|S\$|SGD|AED|USD|GBP|EUR|\$|£|€)\s*)?${NUMBER}\s*(?:(?:lakh|crore|million|billion|thousand|k|m)\b)?`;
const n = (s) => s === undefined ? undefined : Number(s.replace(/,/g, ''));
const NEGATED = /\b(?:not|no|never|without|excluding|rather than|instead of)\b/i;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
/** Currency marks are read over every caller text field, not inferred from a dollar sign's geography. */
function fundingTextCurrencies(words) {
    const codes = { rs: 'INR', 'rs.': 'INR', inr: 'INR', '₹': 'INR', 's$': 'SGD', sgd: 'SGD', aed: 'AED', usd: 'USD', gbp: 'GBP', eur: 'EUR', '$': 'USD', '£': 'GBP', '€': 'EUR' };
    const normal = words.replace(/\\(?=\$)/g, '');
    return [...new Set([...normal.matchAll(/\b(?:Rs\.?|INR|SGD|AED|USD|GBP|EUR)\b|S\$|₹|\$|£|€/gi)].map(m => codes[m[0].toLowerCase()]))].filter(Boolean);
}
function readFundingChat(words, now) {
    const value = words.replace(/\\(?=\$)/g, '');
    let customers, pairedAmount;
    for (const clause of value.split(/[;\n]+|\bbut\b|\binstead\b/i)) {
        const matches = [...clause.matchAll(new RegExp(String.raw `(?<![\w.-])(${NUMBER})\s+(?:(new|expected|forecast|target)\s+)?(customers?|logos?|clients?)\b`, 'gi'))];
        for (const m of matches) {
            const before = clause.slice(0, m.index);
            const tail = clause.slice((m.index ?? 0) + m[0].length);
            if (NEGATED.test(before) || /\b(?:we have|have|existing|current|already|installed base)\s*(?:about\s*)?$/i.test(before))
                continue;
            const paired = new RegExp(String.raw `^\s*(?:from this\s*)?(?:at|each(?: pays)?|paying)\s+(${AMOUNT})`, 'i').exec(tail);
            if (m[2] || /\b(?:expect(?:ed)?|forecast|target)\s*$/i.test(before) || /^\s+from this\b/i.test(tail) || paired) {
                customers = n(m[1]);
                pairedAmount = paired?.[1];
                break;
            }
        }
        if (customers !== undefined)
            break;
        const alternative = clause.match(/\b(?:new|expected|forecast|target)\s+(?:customers?|logos?|clients?)\s*(?:expected|forecast|target)?\s*(?:[:=]|of|is|are)?\s*(-?\d+(?:\.\d+)?)/i);
        if (alternative && !NEGATED.test(clause.slice(0, alternative.index)))
            customers = n(alternative[1]);
    }
    const annual = [
        new RegExp(String.raw `\b(?:ACV|ARR per (?:new )?(?:customer|client)|annual revenue per (?:new )?(?:customer|client)|revenue per (?:new )?(?:customer|client)(?: per year)?)\s*(?:of|is|[:=])?\s*(${AMOUNT})`, 'i'),
        new RegExp(String.raw `\b(?:one (?:new )?(?:customer|client) pays|each pays|per customer(?: per year)?)\s*(?:of|is|[:=])?\s*(${AMOUNT})`, 'i'),
        new RegExp(String.raw `\bat\s+(${AMOUNT})\s*(?:each|a year|per year|annually|ARR|ACV)`, 'i'),
    ].map(pattern => pattern.exec(value)).find(Boolean);
    const spend = new RegExp(String.raw `\b(?:spend|cost|budget)\s*(?:of|is|[:=])?\s*(${AMOUNT})`, 'i').exec(value)?.[1] ?? new RegExp(String.raw `(${AMOUNT})\s+(?:spend|budget)\b`, 'i').exec(value)?.[1];
    const read = (patterns) => { for (const pattern of patterns) {
        const m = pattern.exec(value);
        if (m && !NEGATED.test(value.slice(Math.max(0, (m.index ?? 0) - 25), m.index).split(/[.;,]/).at(-1) ?? ''))
            return n(m[1]);
    } return undefined; };
    const limit = read([
        /\b(?:payback )?limit\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)\s*(?:months?)?/i,
        /\b(?:finance (?:accepts|wants|allows)(?: payback)?(?: (?:within|inside|in))?|payback (?:within|inside|in|of))\s*(-?\d+(?:\.\d+)?)\s*months?/i,
        /\b(-?\d+(?:\.\d+)?)\s*[- ]?months?\s+(?:payback(?: limit)?|limit)\b/i,
    ]);
    const margin = read([/\b(?:gross )?margin\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)/i, /(?<![\w.-])(-?\d+(?:\.\d+)?)\s*%\s*(?:gross )?margin\b/i]);
    const cycle = read([/\b(?:sales cycle|cycle|first touch to signed deal)\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)/i]);
    const win = read([/\bwin rate\s*(?:of|is|[:=])?\s*(-?\d+(?:\.\d+)?)/i, /(?<![\w.-])(-?\d+(?:\.\d+)?)\s*%\s*win rate\b/i]);
    const monthName = String.raw `(${MONTHS.map(m => m.slice(0, 3) + String.raw `(?:${m.slice(3)})?`).join('|')})`;
    const fyName = new RegExp(String.raw `\b(?:financial year|FY)\s+starts?\s+(?:in\s+)?${monthName}\b`, 'i').exec(value);
    const fy = fyName ? MONTHS.findIndex(m => m.startsWith(fyName[1].toLowerCase())) + 1 : read([/\b(?:fy start|financial year start)\s*(?:month|[:=])?\s*(-?\d+)/i]);
    const startWords = value.replace(/\b(?:financial year|FY)\s+starts?\s+(?:(?:in|month)\s+)?(?:[A-Za-z]+|\d+)/gi, ' ');
    const iso = startWords.match(/\bstart(?:ing|s)?\s*(?:[:=]|in)?\s*(\d{4}-\d{2})\b/i)?.[1];
    const named = new RegExp(String.raw `\bstart(?:ing|s)?\s*(?:in\s+)?${monthName}(?:\s+(\d{4}))?\b`, 'i').exec(startWords);
    let start = iso;
    if (named) {
        const month = MONTHS.findIndex(m => m.startsWith(named[1].toLowerCase()));
        const year = n(named[2]) ?? (now.getUTCFullYear() + (month < now.getUTCMonth() ? 1 : 0));
        start = `${year}-${String(month + 1).padStart(2, '0')}`;
    }
    const notRead = [];
    for (const [label, present, readValue] of [['new customers', /\b(?:customers?|logos?|clients?)\b/i, customers], ['annual revenue per customer', /\b(?:ACV|ARR per customer|annual revenue per customer|each pays)\b/i, annual?.[1] ?? pairedAmount], ['payback limit', /\b(?:payback|finance accepts|limit)\b/i, limit], ['gross margin', /\bmargin\b/i, margin], ['sales cycle', /\b(?:sales cycle|cycle months)\b/i, cycle], ['win rate', /\bwin rate\b/i, win], ['financial year start', /\b(?:financial year starts?|FY starts?)\b/i, fy], ['spend start month', /\bstart(?:ing)?\s+(?!month)/i, start]])
        if (present.test(label === 'spend start month' ? startWords : value) && readValue === undefined)
            notRead.push(label);
    return { customers, perCustomer: annual?.[1] ?? pairedAmount, spend, limit, margin, cycle, win, fy, start, currencies: fundingTextCurrencies(value), notRead };
}
//# sourceMappingURL=roi-funding-chat.js.map