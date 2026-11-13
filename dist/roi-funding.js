"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundingMonths = void 0;
exports.readFundingMoney = readFundingMoney;
exports.fundingMoney = fundingMoney;
exports.classifyFunding = classifyFunding;
exports.fundingGeo = fundingGeo;
exports.readFundingInputs = readFundingInputs;
exports.fundingVerdict = fundingVerdict;
exports.fundingRecovery = fundingRecovery;
exports.fundingRoutes = fundingRoutes;
exports.buildRoiFunding = buildRoiFunding;
const echo_layer_ts_1 = require("./echo-layer.js");
const region_reader_ts_1 = require("./region-reader.js");
const roi_scope_ts_1 = require("./roi-scope.js");
const revenue_reader_actions_ts_1 = require("./revenue-reader-actions.js");
const roi_funding_chat_ts_1 = require("./roi-funding-chat.js");
const rules = __importStar(require("./roi-funding-config.js"));
const text = (x) => typeof x === 'string' ? x.trim() : '';
const num = (x) => x !== undefined && x !== null && String(x).trim() !== '' && Number.isFinite(Number(x)) ? Number(x) : undefined;
const clean = (s) => s.replace(/[\r\n|<>]/g, ' ').replace(/[\u2013\u2014]/g, ',').replace(/!/g, '.');
const code = (s) => /^(?:Rs\.?|INR|₹)$/i.test(s) ? 'INR' : /^(?:\$|USD)$/i.test(s) ? 'USD' : /^(?:£|GBP)$/i.test(s) ? 'GBP' : /^(?:€|EUR)$/i.test(s) ? 'EUR' : /^(?:S\$|SGD)$/i.test(s) ? 'SGD' : /^AED$/i.test(s) ? 'AED' : '';
/** The page mirrors this small rule; a shared input list checks parity. No conversion. */
function readFundingMoney(value, currency = '') {
    const raw = String(value ?? '').trim().replace(/\\(?=\$)/g, '');
    const mark = raw.match(/Rs\.?|INR|₹|S\$|SGD|AED|USD|GBP|EUR|\$|£|€/i);
    const normal = raw.replace(/\bGBP\b/i, '£').replace(/\bEUR\b/i, '€');
    const unsigned = normal.replace(/-\s*(?=\d)/, '');
    const parsed = (0, echo_layer_ts_1.readMoney)(mark ? unsigned : 'USD ' + unsigned, true);
    const valid = /^(?:(?:Rs\.?|INR|₹|S\$|SGD|AED|USD|GBP|EUR|\$|£|€)\s*)?-?\d[\d,]*(?:\.\d+)?\s*(?:lakh|crore|million|billion|thousand|k|m)?$/i.test(raw);
    return { value: valid && parsed ? parsed.value * (/-\s*\d/.test(raw) ? -1 : 1) : undefined, currency: mark ? code(mark[0]) : code(currency), marked: !!mark, raw };
}
function fundingMoney(value, currency, derived = true) {
    const n = derived ? Math.round(value) : value;
    if (currency === 'INR') {
        if (Math.abs(n) >= 1e7)
            return `Rs ${Number((n / 1e7).toFixed(2))} crore`;
        if (Math.abs(n) >= 1e5)
            return `Rs ${Number((n / 1e5).toFixed(2))} lakh`;
        return 'Rs ' + n.toLocaleString('en-IN', { maximumFractionDigits: derived ? 0 : 20 });
    }
    const symbols = { USD: '$', GBP: '£', EUR: '€', AED: 'AED ', SGD: 'S$' };
    return (symbols[currency] ?? '') + n.toLocaleString('en-US', { maximumFractionDigits: derived ? 0 : 20 });
}
const fundingMonths = (n) => Math.floor((n + Number.EPSILON) * 10 + 0.5) / 10;
exports.fundingMonths = fundingMonths;
const months = (n) => (0, exports.fundingMonths)(n).toFixed(1);
const NEGATION = /\b(?:not|no|non|without|never|excluding|except|nor|neither|isn['’]t|aren['’]t|rather than|instead of|other than)\b/i;
function classifyFunding(value) {
    const subject = /^\s*(?:a |an |the |our )?vendor\b/i.test(value) ? value : (0, roi_scope_ts_1.roiFundingSubject)(value);
    // A funder's industry and an audience description cannot turn a programme into a purchase.
    const bought = subject.split(/\b(?:for|targeting|aimed at|sold to|serving)\b/i)[0];
    const paid = /\b(?:paid (?:media|social|search|ads|advertising|campaigns?|acquisition|(?:LinkedIn|Google|Meta)(?: (?:programmes?|programs?|campaigns?|ads))?)|social (?:media )?ads|(?:LinkedIn|Google|Meta) (?:ads|campaigns?)|sponsored posts bought as ads)\b/i.test(bought);
    const hits = [];
    for (const row of rules.CLASS_TABLE) {
        if (paid && row.group === 'audience')
            continue;
        for (const clause of bought.replace(/\bnot (?:only|just|merely)\b/gi, ' ').split(/[.;:!?\n,()[\]]+|\bbut\b|\bwhile\b|\bwhereas\b/i)) {
            for (const match of clause.matchAll(row.pattern)) {
                const before = clause.slice(0, match.index);
                const after = clause.slice((match.index ?? 0) + match[0].length);
                if (NEGATION.test(before))
                    continue;
                const people = /\b(?:SDRs?|BDRs?|sales development|outbound team|appointment setting)\b/i.test(clause);
                const purchase = /\b(?:platforms?|tools?|software|licen[cs]es?|seats|subscriptions?|databases?|automation|stack|suite|analytics|attribution|apps?|vendors?)\b/i.test(clause);
                if (row.group === 'data' && /^sales engagement$/i.test(match[0]) && people && !purchase)
                    continue;
                if (row.group === 'purchase' && /^\s+(?:firm|company|startup|business)\b/i.test(after))
                    continue;
                if (row.group === 'sponsorship') {
                    if (rules.BOOTH_SPONSORSHIP_CLASS === 'direct' && /^sponsoring$/i.test(match[0]) && /^\s+(?:an?\s+)?(?:trade[- ]?show\s+|exhibition\s+)?booth\b/i.test(after))
                        continue;
                    if (rules.BOOTH_SPONSORSHIP_CLASS === 'direct' && /\b(?:booth|exhibition|trade[- ]?show)\s*$/i.test(before))
                        continue;
                    if (/^sponsored posts?$/i.test(match[0]) && /^\s+bought as ads\b/i.test(after))
                        continue;
                }
                hits.push({ kind: row.kind, group: row.group, word: match[0] });
            }
        }
    }
    if ((0, roi_scope_ts_1.roiAnalystReportWords)(bought))
        hits.push({ kind: 'brand', group: 'relations', word: 'an analyst report' });
    const priority = ['enabler', 'brand', 'other', 'long', 'direct'];
    const chosen = hits.sort((a, b) => priority.indexOf(a.kind) - priority.indexOf(b.kind))[0];
    return chosen ? { kind: chosen.kind, group: chosen.group, reason: chosen.word, mixed: new Set(hits.map(h => h.kind)).size > 1 } : { kind: 'other', group: 'other', reason: 'no direct revenue line', mixed: false };
}
const GEO_NAMES = { 'india': 'India', 'middle-east': 'Middle East and Africa', 'southeast-asia': 'Southeast Asia', 'uk': 'United Kingdom', 'north-america': 'United States', 'western-europe': 'Western Europe' };
function fundingGeo(args, explicit, currency) {
    if (Object.values(GEO_NAMES).includes(explicit))
        return explicit;
    const words = [text(args.your_solution), text(args.known_metrics), text(args.current_process)].join(' ');
    if (/\b(?:Africa|Nairobi|Kenya|Nigeria|Lagos|South Africa|Cape Town|Johannesburg)\b/i.test(explicit + ' ' + words))
        return 'Middle East and Africa';
    const regions = (0, region_reader_ts_1.readRegionContext)({ ...args, region: explicit }).regions;
    if (regions.length === 1)
        return GEO_NAMES[regions[0].region_id] ?? '';
    return { INR: 'India', GBP: 'United Kingdom', AED: 'Middle East and Africa', SGD: 'Southeast Asia' }[currency] ?? '';
}
function readFundingInputs(args, clock = () => new Date()) {
    const metrics = text(args.known_metrics);
    const fixed = /^helix-roi-v1(?:;|$)/.test(metrics);
    const fields = {};
    if (fixed)
        for (const bit of metrics.split(';').slice(1)) {
            const at = bit.indexOf('=');
            if (at > 0)
                fields[bit.slice(0, at).trim()] = bit.slice(at + 1).trim();
        }
    const words = [metrics, text(args.current_process), fixed ? '' : text(args.your_solution)].join('; ');
    const now = clock();
    const chat = (0, roi_funding_chat_ts_1.readFundingChat)(words, now);
    const spend = readFundingMoney(args.solution_price ?? (fixed ? fields.spend : chat.spend), fields.currency);
    if (!fixed && chat.spend) {
        const marked = readFundingMoney(chat.spend);
        spend.marked = marked.marked;
        spend.currency = marked.currency;
    }
    const per = readFundingMoney(fixed ? fields.per_customer : chat.perCustomer, fields.currency);
    const currencies = fixed ? [...new Set([spend.currency, per.currency, code(fields.currency ?? '')].filter(Boolean))] : [...new Set([...chat.currencies, spend.currency, per.currency].filter(Boolean))];
    const spendCurrencyFromText = !fixed && (!spend.marked || typeof args.solution_price === 'number') && currencies.length === 1 && spend.value !== undefined;
    const perCurrencyFromText = !fixed && !per.marked && currencies.length === 1 && per.value !== undefined;
    if (spendCurrencyFromText)
        spend.currency = currencies[0];
    if (perCurrencyFromText)
        per.currency = currencies[0];
    const currencyConflict = currencies.length > 1;
    const N = fixed ? num(fields.customers) : chat.customers;
    const A = per.value;
    const l = fixed ? num(fields.limit_months) : chat.limit;
    const G = fixed ? num(fields.margin) : chat.margin;
    const C = fixed ? num(fields.cycle_months) : chat.cycle;
    const W = fixed ? num(fields.win_rate) : chat.win;
    const currency = spend.currency || per.currency || code(fields.currency ?? '');
    const geo = fundingGeo(args, fields.geo ?? '', currency);
    const fyInput = fixed ? num(fields.fy_start) : chat.fy;
    const fy = fyInput ?? (geo === 'India' ? rules.INDIA_FY_DEFAULT_START_MONTH : undefined);
    const defaultStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const start = (fixed ? fields.start : chat.start) || defaultStart;
    const classification = classifyFunding(text(args.your_solution));
    const L = l ?? rules.DEFAULT_LIMIT_MONTHS;
    let error = '';
    for (const [label, n] of [['spend', spend.value], ['new customers', N], ['revenue per customer', A], ['payback limit', l], ['gross margin', G], ['sales cycle', C], ['win rate', W], ['financial year start month', fyInput]]) {
        if (n !== undefined && n < 0) {
            error = `Check your figures: ${label} cannot be negative.`;
            break;
        }
    }
    if (!error && ((G !== undefined && (G === 0 || G > 100)) || (W !== undefined && (W === 0 || W > 100))))
        error = `Check your figures: ${G !== undefined && (G === 0 || G > 100) ? 'gross margin' : 'win rate'} must be above 0 and at most 100 percent.`;
    if (!error && (L < 1 || L > 60))
        error = 'Check your figures: payback limit must be from 1 to 60 months.';
    if (!error && C !== undefined && C > 36)
        error = 'Check your figures: sales cycle cannot exceed 36 months.';
    if (!error && fy !== undefined && (!Number.isInteger(fy) || fy < 1 || fy > 12))
        error = 'Check your figures: financial year start must be a month from 1 to 12.';
    if (!error && !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(start))
        error = 'Check your figures: give the start month as year and month.';
    if (!error && currencyConflict && ['direct', 'long'].includes(classification.kind))
        error = 'Check your figures: spend and revenue must be in the same currency.';
    const sellerFrame = !fixed && /\b(?:for (?:the |our )?client|client expects|our client)\b/i.test(words);
    const guarded = sellerFrame || !(fixed && N !== undefined && A !== undefined) && !(N !== undefined && A !== undefined && ['revenue_increase', 'multiple'].includes(text(args.primary_value_driver)));
    const missing = fixed ? [] : chat.notRead;
    for (const [k, label] of [['customers', 'new customers'], ['per_customer', 'revenue per customer'], ['margin', 'gross margin'], ['cycle_months', 'sales cycle'], ['win_rate', 'win rate'], ['limit_months', 'payback limit']])
        if (fixed && fields[k] && ((k === 'per_customer' ? A : num(fields[k])) === undefined))
            missing.push(label);
    return { subject: (0, roi_scope_ts_1.roiFundingSubject)(text(args.your_solution)), classification, fixed, guarded, S: spend.value, N, A, L, G, C, W, fy, start, startGiven: !!(fixed ? fields.start : chat.start), fyGiven: fyInput !== undefined, spendCurrencyFromText, perCurrencyFromText, currencyConflict, currency, spendCurrency: spend.currency, perCurrency: per.currency, geo, limitGiven: l !== undefined, error, missing, signs: fields.signs ?? '', period: fields.period ?? 'MISSING' };
}
function fundingVerdict(kind, p, L) {
    const rounded = (0, exports.fundingMonths)(p);
    if (kind === 'long' && rounded <= rules.SMALL_TEST_MULTIPLE * L)
        return { row: 'long', words: 'Passes as a long build' };
    if (rounded <= L)
        return { row: 'pass', words: `Passes your ${L} month limit` };
    if (kind === 'direct' && rounded <= rules.SMALL_TEST_MULTIPLE * L)
        return { row: 'smaller', words: 'Over your limit. A smaller test could pass' };
    return { row: 'fail', words: 'Does not pass at this size' };
}
function fundingRecovery(start, T, fy) {
    const [year, month] = start.split('-').map(Number);
    const at = new Date(Date.UTC(year, month - 1 + Math.floor(T), 1));
    const label = at.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    if (!fy)
        return `On your figures it is recovered in ${label}. Which month starts your financial year?`;
    const fyYear = (y, m) => m >= fy ? y : y - 1;
    if (fy === 4) {
        const first = fyYear(year, month), last = fyYear(at.getUTCFullYear(), at.getUTCMonth() + 1);
        return `Spend starts in FY ${first}-${String(first + 1).slice(-2)}. On your figures it is recovered in ${label}, which is FY ${last}-${String(last + 1).slice(-2)}.`;
    }
    const ending = (y, m) => { const beginning = fyYear(y, m); return new Date(Date.UTC(beginning + 1, fy - 2, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }); };
    return `Spend starts in the financial year ending ${ending(year, month)}. On your figures it is recovered in ${label}, in the financial year ending ${ending(at.getUTCFullYear(), at.getUTCMonth() + 1)}.`;
}
const FINANCE = {
    India: ['Is the figure before GST, and can we claim the input credit?', 'For a foreign media or software bill, what tax do we withhold or pay ourselves?'],
    'Middle East and Africa': ['Which entity pays, and in which country?', 'Is VAT on this recoverable for that entity?'],
    'Southeast Asia': ['Which entity pays, and in which country?', 'Is GST or VAT on this recoverable for that entity?'],
    'United Kingdom': ['Is the figure before VAT, and is the VAT recoverable?', 'Do we judge payback on revenue or on gross margin?'],
    'United States': ['Does any state sales tax apply to this bill?'],
    'Western Europe': ['Is the figure before VAT?', 'For a supplier in another country, who accounts for the VAT?'],
};
function fundingRoutes(i, failed = false, undecided = false) {
    const book = ['Book 45 minutes', rules.BOOKING];
    const tool = (host, name) => `https://${host}.gtmhelix.com/tools/${name.replace(/_/g, '-')}/`;
    const plugin = (name) => `https://tools.gtmhelix.com/plugins/${['account-research', 'evidence-research-asset'].includes(name) ? 'b2b-research-market-and-account' : 'b2b-events-pr-and-launches'}/`;
    if (failed)
        return { action: 'Rework the programme size before taking it to finance.', routes: [['Audit the GTM plan', 'https://gtmalpha.gtmhelix.com/integration'], book] };
    if (i.classification.kind === 'enabler')
        return { action: 'Check the demand programme and the purchase separately.', routes: [book] };
    if (i.classification.kind === 'brand')
        return { action: 'Pick the signs you will track before committing the amount.', routes: [['Plan the PR work', plugin('pr-launch-pack')], book] };
    if (undecided || i.classification.kind === 'other')
        return { action: 'Agree the missing assumptions before sizing the ask.', routes: [book, ['Size the market', tool('icp-intelligence', 'tam_sam_som_calculator')]] };
    switch (i.classification.group) {
        case 'media': return { action: 'Check whether the paid programme is ready to scale.', routes: [['Scale Paid check', 'https://helix-scale-paid-check.shashwat-helix-gtm.chatgpt.site'], book] };
        case 'abm': return { action: 'Prioritise the accounts before committing the spend.', routes: [['Prioritise the accounts', tool('icp-intelligence', 'account_prioritization')], ['Research the accounts', plugin('account-research')]] };
        case 'events': return { action: 'Plan the event backwards from the customers needed.', routes: [['Plan the event', plugin('event-planner')], ['Plan the follow-up', plugin('event-follow-up-engine')]] };
        case 'partner': return { action: 'Check the partner programme before committing the spend.', routes: [['Build the partner plan', tool('craft-gtm', 'partner_architect')], book] };
        case 'content':
        case 'search': return { action: 'Check the evidence and audience for the programme.', routes: [['Build an evidence asset', plugin('evidence-research-asset')], ['Check the market context', tool('craft-gtm', 'competitive_intel')]] };
        case 'outbound': return { action: 'Check the audience and discovery questions before sizing outreach.', routes: [['Score the audience', tool('icp-intelligence', 'icp_scoring_model')], ['Prepare discovery questions', tool('revenue-enablement', 'discovery_question_bank')]] };
        default: return { action: 'Take the assumptions and finance questions to the budget meeting.', routes: [book] };
    }
}
function buildRoiFunding(args, clock = () => new Date()) {
    const decline = (0, roi_scope_ts_1.roiScopeDecline)('roi_business_case_builder', args);
    if (decline)
        return decline;
    const i = readFundingInputs(args, clock);
    const { S, N, A, L, G, C, W } = i;
    const kind = i.classification.kind;
    const eligible = kind === 'direct' || kind === 'long';
    const cash = (n) => fundingMoney(n, i.currency);
    const given = (n) => fundingMoney(n, i.spendCurrency, false);
    const givenPer = (n) => fundingMoney(n, i.perCurrency, false);
    const Ls = [];
    const hasForecast = !i.guarded && N !== undefined && A !== undefined;
    const R = hasForecast ? N * A : undefined;
    const P = eligible && !i.currencyConflict && R !== undefined && R > 0 && S !== undefined ? 12 * S / R : undefined;
    const Pg = P !== undefined && G !== undefined ? P / (G / 100) : undefined;
    const invalid = i.error || (S !== undefined && S > 0 && P !== undefined && P < 0.5 ? 'Check your figures: this says the spend comes back in under two weeks.' : '');
    const canJudge = eligible && hasForecast && S !== undefined && S > 0 && !invalid;
    const zero = canJudge && (N === 0 || A === 0);
    const decided = canJudge && P !== undefined && !zero;
    const base = decided ? fundingVerdict(kind, P, L) : undefined;
    const gm = decided && Pg !== undefined ? fundingVerdict(kind, Pg, L) : undefined;
    let first = invalid || (S === undefined ? 'Not decided yet: give the spend.' : S === 0 ? 'A spend of 0 has no payback to check.' : kind === 'brand' ? 'Not a payback decision' : kind === 'enabler' ? 'Break-even only: what must be true' : kind === 'other' ? 'Not decided yet: what must be true' : zero ? 'Does not pass: no new revenue on your figures.' : !decided ? 'Not decided yet: what must be true' : `Pays back in ${months(P)} months. ${base.words}.`);
    if (decided && !i.limitGiven)
        first = first.replace(`Passes your ${L} month limit`, `Passes a ${L} month limit (this tool's rule, not a benchmark)`) + " Give your finance team's limit to change it.";
    Ls.push(first, '', 'A calculation on your inputs. Not a forecast.');
    if (decided) {
        Ls.push('', '| Case | New ARR | Payback | Against the limit |', '| --- | --- | --- | --- |');
        for (const [label, multiple] of [['Half arrive', 0.5], ['Your figures', 1], ['One and a half times', 1.5]]) {
            const p = 12 * S / (R * multiple);
            Ls.push(`| ${label} | ${cash(R * multiple)} | ${months(p)} months | ${fundingVerdict(kind, p, L).words} |`);
        }
        if (A !== undefined && A > 0) {
            const required = Math.ceil(12 * S / L / A);
            Ls.push('', `Customers that must close for this to pass: ${required} of the ${N} you expect.`);
            if (W !== undefined)
                Ls.push(`Required opportunities at your ${W} percent win rate: ${Math.ceil(required / (W / 100))}.`);
        }
        if (fundingVerdict(kind, 2 * P, L).row !== base.row)
            Ls.push('', `Fragile. If half the customers arrive: ${months(2 * P)} months. ${fundingVerdict(kind, 2 * P, L).words}.`);
    }
    Ls.push('', '### What I read', `- Funded work: ${rules.CLASS_NAMES[kind]}.`, `- Region: ${i.geo || 'MISSING. Which region applies?'}`, `- Spend: ${S === undefined ? 'MISSING' : given(S)}${i.spendCurrencyFromText ? ' (currency taken from your text)' : ''}.`, `- Expected new customers: ${N ?? 'MISSING'}.`, `- What one pays a year: ${A === undefined ? 'MISSING' : givenPer(A)}${i.perCurrencyFromText ? ' (currency taken from your text)' : ''}.`, `- Payback limit: ${L} months${i.limitGiven ? ' (your limit)' : " (this tool's rule, not a benchmark)"}.`);
    Ls.push(`- Gross margin: ${G === undefined ? 'MISSING' : G + ' percent'}.`, `- First touch to signed deal: ${C === undefined ? 'MISSING' : C + ' months'}.`, `- Win rate: ${W === undefined ? 'MISSING' : W + ' percent'}.`, `- Financial year starts: ${i.fy === undefined ? 'MISSING' : new Date(Date.UTC(2000, i.fy - 1, 1)).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' })}${i.fy !== undefined && !i.fyGiven ? ' (India default)' : ''}.`, `- Spend starts: ${i.start}${i.startGiven ? ' (read from your inputs)' : ' (current month default)'}.`);
    if (!i.currency)
        Ls.push('Currency: MISSING. Which currency applies? Figures below are bare amounts; nothing is converted.');
    if (i.currencyConflict && !eligible)
        Ls.push('Two currencies were given. No calculation combines them. Confirm the spend and revenue currency before checking customers needed.');
    if (i.classification.mixed && !eligible)
        Ls.push(`Read as ${rules.CLASS_NAMES[kind]} because you mentioned ${clean(i.classification.reason)}. Say whether this is a tool you buy or work you run.`);
    if (i.missing.length)
        Ls.push(`Treated as missing. Not read as a number or date: ${i.missing.join(', ')}.`);
    for (const [key, label] of [['annual_value_estimate', 'The annual value you entered'], ['current_annual_cost', 'The cost figures you entered'], ['expected_improvement_percent', 'The improvement percentage you entered']])
        if (args[key] !== undefined)
            Ls.push(`${label}: ${clean(String(args[key]))}. Not used to judge this spend.`);
    if (zero)
        Ls.push('', 'On your figures this brings no new revenue, so there is no payback.');
    if (!i.error && S !== undefined && S > 0 && P !== undefined && P < 0.5)
        Ls.push('', `Arithmetic only: CAC ${cash(S / N)}; payback ${months(P)} months. No verdict.`);
    if (decided)
        Ls.push('', `CAC: ${cash(S / N)}. Expected new ARR: ${cash(R)}.`);
    if (gm) {
        Ls.push('', '### On gross margin', `${months(Pg)} months. ${gm.words}.`);
        if (gm.row !== base.row)
            Ls.push('Fragile. The gross margin row changes the result.');
        if (base.row === 'pass' && gm.row !== 'pass')
            Ls.push('Passes on revenue, not on gross margin');
    }
    if (/\b(?:services|ITeS|outsourcing|managed services|agency)\b/i.test(text(args.your_solution)) && G === undefined)
        Ls.push('', 'Give gross margin first so finance can check the contribution as well as revenue.');
    if (kind === 'brand') {
        Ls.push('', 'Brand awareness, AR and PR do not pay back inside a quarter, and a payback figure here would be made up. Decide it as an amount you can hold for a year, and track leading signs.');
        if (S !== undefined && S > 0 && !invalid)
            Ls.push(`For scale only: covering this cost in ${L} months requires ${cash(12 * S / L)} a year. This is a coverage requirement, not a revenue forecast.`);
        if (S !== undefined && S > 0 && A !== undefined && A > 0 && !invalid && !i.currencyConflict)
            Ls.push(`For scale only: covering this cost in ${L} months would take ${Math.ceil(12 * S / L / A)} new customers at what one pays you.`);
        Ls.push('Signs to pick: branded search; direct traffic; share of buyers who had heard of you before the first call; analyst briefings held and reports that include you; coverage in the publications your buyers read; inbound demos naming a source.');
    }
    Ls.push('', '### Recovery and financial year');
    if (i.geo === 'India' && i.fy === 4)
        Ls.push('Financial year read as April to March (India default). Change it if yours differs.', 'Source: https://www.incometaxindia.gov.in/w/section-3-172');
    if (decided && C !== undefined) {
        Ls.push(`${gm ? 'Months to recovery on revenue' : 'Months to recovery'}: ${months(C + P)}.`, (gm ? 'Recovery on revenue: ' : '') + fundingRecovery(i.start, C + P, i.fy));
        if (gm && (0, exports.fundingMonths)(C + Pg) !== (0, exports.fundingMonths)(C + P))
            Ls.push(`Months to recovery on gross margin: ${months(C + Pg)}.`, `Recovery on gross margin: ${fundingRecovery(i.start, C + Pg, i.fy)}`);
    }
    else if (eligible)
        Ls.push('Add the months from first touch to signed deal to see which financial year the money comes back in.');
    if (i.geo !== 'India' && i.fy === undefined && !(decided && C !== undefined))
        Ls.push('Which month starts your financial year?');
    Ls.push('', '### What must be true');
    if (S !== undefined && S > 0 && !invalid && kind !== 'brand') {
        Ls.push(`Required ${i.guarded && !i.fixed ? 'annual revenue' : 'new ARR'} at ${L} months: ${cash(12 * S / L)}.`);
        if (A !== undefined && A > 0 && !i.currencyConflict) {
            const required = Math.ceil(12 * S / L / A);
            Ls.push(`Required new customers: ${required}.`);
            if (W !== undefined && !decided)
                Ls.push(`Required opportunities at your ${W} percent win rate: ${Math.ceil(required / (W / 100))}.`);
        }
    }
    const asks = [];
    if (S === undefined)
        asks.push('What will it cost?');
    else if (S > 0 && !invalid && kind !== 'brand') {
        if (A === undefined)
            asks.push('What does one new customer pay a year?');
        if (N === undefined)
            asks.push('How many new customers do you expect?');
        else if (W === undefined && A !== undefined)
            asks.push('What win rate should finance use?');
    }
    Ls.push(...asks.slice(0, 2));
    Ls.push('', 'At 90 days you can read leading signs only.');
    if (rules.SHOW_GTM_FIX_RULE && (kind === 'long' || kind === 'brand' || !decided && kind !== 'enabler'))
        Ls.push(rules.GTM_FIX_RULE);
    Ls.push('', '### Lines for finance');
    if (kind === 'brand')
        Ls.push(`Amount: ${S === undefined ? 'MISSING' : given(S)}.`, `Period held: ${clean(i.period)}.`, `Selected signs and values today: ${clean(i.signs) || 'MISSING'}.`);
    else
        Ls.push(`Spend: ${S === undefined ? 'MISSING' : given(S)}.`, decided ? `Revenue payback: ${months(P)} months against ${L} months. ${gm ? `Gross margin payback: ${months(Pg)} months.` : ''}` : 'Expected new customers and annual revenue per customer need to be confirmed before a funding verdict.');
    for (const question of ['How many of these customers would have come without this spend?', 'Is the spend counted before or after recoverable tax?', 'Which financial year does the spend fall in, and which year does the return fall in?', ...(FINANCE[i.geo] ?? [])])
        Ls.push('- ' + question);
    const reading = (0, revenue_reader_actions_ts_1.revenueReading)('roi_business_case_builder', args, first);
    if (reading && !invalid)
        Ls.push('', ...reading.roles);
    if (/\b(?:outbound email|cold email|email outreach)\b/i.test(i.subject) && ['United Kingdom', 'United States'].includes(i.geo)) {
        Ls.push('', '### Outbound email note', i.geo === 'United Kingdom' ? 'You can email corporate bodies without prior consent. Sole traders and some partnerships are treated as individuals. Keep a "do not email" list. https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/electronic-and-telephone-marketing/electronic-mail-marketing/' : 'CAN-SPAM makes no exception for business to business email. An opt-out must be honoured within 10 business days. https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business', 'Checked 13 Nov 2026. Check with your counsel before you size the list.');
    }
    Ls.push('', '### How this is worked out', 'CAC = spend / new customers. Monthly ARR per customer = annual revenue per customer / 12. Payback = 12 x spend / (new customers x annual revenue per customer). Gross margin payback = payback / (gross margin / 100). Recovery = sales cycle + payback.', 'Required annual revenue = 12 x spend / limit. Required customers are rounded up. Required opportunities = required customers / (win rate / 100), rounded up.', 'Months are rounded half up to one decimal before comparison with the limit. Money results are rounded to the nearest whole unit. Counts are rounded up.', 'Demand programmes pass at the limit; up to twice the limit a smaller test could pass. A long build passes up to twice the limit. Beyond twice the limit neither passes. Brand, software and unmatched GTM work have no funding verdict.', `Rules of this tool: default ${rules.DEFAULT_LIMIT_MONTHS} month limit; half and one and a half times the revenue; twice the limit for a smaller test or long build; under 0.5 months needs checking; limit from 1 to 60 months; cycle at most 36 months; gross margin and win rate above 0 and at most 100 percent.`, 'Recovery is counted from the first day of the start month. Add sales cycle and payback, then round down to whole months to find the recovery month. No currency conversion.');
    if (gm && rules.SHOW_BESSEMER_LINE)
        Ls.push(rules.REFERENCE_LINE);
    Ls.push('', '### What this is not', 'This is not a forecast or an instruction to spend. It checks one programme on your inputs. It is not a market benchmark, a budget split, tax advice, legal advice or a software recommendation.');
    const route = fundingRoutes(i, base?.row === 'fail', !decided && kind !== 'brand' && kind !== 'enabler');
    Ls.push('', '### Next action', route.action, '', '### Routes', ...route.routes.map(([label, url]) => `[${label}](${url})`));
    if (i.guarded) {
        if (['cost_reduction', 'productivity', 'risk_mitigation'].includes(text(args.primary_value_driver)))
            Ls.push('', 'This tool now checks marketing spend against new revenue.');
        Ls.push('', 'If this is your own marketing spend, give the new customers you expect and what one pays a year.');
    }
    // Guarded calls must never relabel old annual value fields as new revenue.
    return Ls.join('\n').replace(/\n{3,}/g, '\n\n').replace(/[\u2013\u2014]/g, ',');
}
//# sourceMappingURL=roi-funding.js.map