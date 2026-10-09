"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentences = exports.some = exports.quoted = exports.stripEnd = exports.lowerStart = exports.stemsOf = void 0;
exports.shared = shared;
exports.plural = plural;
exports.partsOf = partsOf;
exports.modelWords = modelWords;
exports.readRole = readRole;
exports.readThreats = readThreats;
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
const STEM_STOP = new Set(['that', 'this', 'with', 'from', 'your', 'have', 'their', 'they', 'them', 'will', 'which', 'what', 'when', 'where', 'into', 'over', 'than', 'then', 'about', 'more', 'most', 'some', 'such', 'each', 'only', 'also', 'were', 'been', 'does', 'make', 'makes', 'much', 'many', 'every', 'other', 'platform', 'solution', 'product', 'software', 'tools', 'tool', 'work', 'works', 'time', 'team', 'teams', 'planning', 'plan', 'plans', 'management', 'manage', 'managed']);
const stemsOf = (t) => new Set((t.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || []).filter((w) => !STEM_STOP.has(w)).map((w) => w.replace(/(?:ing|ed|es|s)$/, '').slice(0, 5)));
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
];
const groupOf = (w) => { const i = SAME.findIndex((g) => g.includes(w)); return i >= 0 ? i : SAME.findIndex((g) => g.includes(w.replace(/(?:ies|es|s)$/, '')) || g.includes(w.replace(/s$/, ''))); };
/** How many ideas two texts share: a shared word stem, or two words that mean about the same thing. */
function shared(a, b) {
    const sa = (0, exports.stemsOf)(a);
    const sb = (0, exports.stemsOf)(b);
    let n = 2 * [...sa].filter((x) => sb.has(x)).length;
    const ga = new Set((a.toLowerCase().match(/[a-z-]{3,}/g) || []).map(groupOf).filter((g) => g >= 0));
    const gb = new Set((b.toLowerCase().match(/[a-z-]{3,}/g) || []).map(groupOf).filter((g) => g >= 0));
    n += [...ga].filter((g) => gb.has(g)).length;
    return n;
}
const lowerStart = (s) => ((/^[A-Z][a-z]/.test(s) || /^(?:A|An)\s/.test(s)) && !/^(?:I|AI|API|ERP|CRM|SMS|IT|HR|QA)\b/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
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
function partsOf(brief) {
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
    const paren = brief.full.slice(0, 260).match(/\(([^()]+(?:,[^()]+){2,})\)/);
    if (paren) {
        const ps = clean((0, dealtext_ts_1.splitTopLevel)(paren[1]));
        if (ps.length >= 3)
            return ps.slice(0, 12);
    }
    const tailAt = brief.full.search(/\b(?:joins|combines|covers|covering|spans|includes|including|offers|brings together|connects|unifies|made up of)\s+/i);
    if (tailAt < 0)
        return [];
    const tail = brief.full.slice(tailAt).replace(/^\S+(?:\s+together)?\s+(?:of\s+)?/i, '').split(/\.\s+(?=[A-Z])/)[0].replace(/[.]+$/, '');
    const pieces = (0, dealtext_ts_1.splitTopLevel)(tail);
    if (pieces.length < 2)
        return [];
    return clean(pieces).slice(0, 12);
}
function modelWords(model, _sellerText, unit) {
    // the unit is the user's own (per SIM, per shipment, per message ...); without one the wording stays neutral and names no kind of product
    const perUnit = unit ? `per ${unit}` : 'per unit of usage';
    const units = unit ? `${unit}s` : 'volume';
    switch (model) {
        case 'transactions': return { priced: `a rate ${perUnit}, with volume tiers`, proof: `live test volume on one product line or region, compared with the current provider on the same volume`, terms: 'the rate card, the volume tiers and any committed monthly volume', grow: 'more products or regions on the same contract', setup: unit === 'message' ? 'the integration, the sender or account approvals and the first live messages' : unit ? `the integration, the account set-up and the first live ${units}` : 'the integration, the account set-up and the first live volume' };
        case 'services': return { priced: 'a fee for the service (per FTE, per ticket or a fixed fee)', proof: 'a transition plan with a parallel run and exit criteria for each stage', terms: 'the scope, the service levels with their credits, and the fee structure', grow: 'more services or locations under the same contract', setup: 'the knowledge transfer from the current provider and the governance calendar' };
        case 'connectivity': return { priced: 'a price per site or link on a term contract', proof: 'pilot sites brought live, worst served first, compared with the current operator on uptime and repair time', terms: 'the price per site, the term and the delivery time of each link', grow: 'more sites in waves, each with a fallback', setup: 'the site survey, the delivery time of each link and the cutover window' };
        case 'hardware_software': return { priced: 'devices plus a software term', proof: 'a pilot with the devices at one site, installed and read for a full cycle', terms: 'the device order, the installation and the software term', grow: 'more sites and devices', setup: 'the delivery and installation of the devices' };
        case 'marketplace': return { priced: 'a take rate on the transactions it carries', proof: 'a seeded category or region where both sides trade for a full cycle', terms: 'the take rate and any committed volume', grow: 'more categories or regions', setup: 'the first listings and the first live transactions' };
        case 'investment': return { priced: 'fees on the assets or performance of a mandate', proof: 'due diligence, a committee presentation and a first allocation', terms: 'the fee schedule, the reporting and the first allocation', grow: 'a larger or longer mandate', setup: 'the mandate documents and the first allocation' };
        default: return { priced: 'a subscription', proof: 'a pilot with one team or project and an agreed measure', terms: 'the scope, the term and the price', grow: 'more teams or more parts of the product', setup: 'the access, the integrations and the first users' };
    }
}
const ROLE_PATTERNS = [
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
    { re: /\b(?:product (?:manager|owner|lead)|head of product|vp product)\b/i, part: 'Influencer: owns the requirements', ask: 'What takes longest between a request and a change going live, and who else has to approve it?', kind: 'influencer',
        cares: 'how fast a change reaches customers and how much of it waits for engineering',
        step: () => 'Walk through one real change from request to live and time it together' },
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
function readRole(c, kind, ctx, investment) {
    const hit = ROLE_PATTERNS.find((p) => p.re.test(c.title));
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
    { id: 'cost', re: /\b(?:fees?|charges?|per seat|hidden|cost more|confusing rates|processing)\b/i, tells: 'the price on the page is not the price paid, so the real cost is hard to compare', asks: ['What do you pay in a typical month in total, including the charges that are not in the headline price?', 'Which line on the invoice surprised you most, and how often?'], prove: 'Price the same month of the buyer\'s own activity under both, line by line' },
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
const partFor = (text, parts) => {
    let best = '';
    let n = 0;
    for (const p of parts) {
        const s = shared(text, p);
        if (s > n) {
            n = s;
            best = p;
        }
    }
    return best;
};
const unitFor = (text, ctx) => {
    if (ctx.unit && !/\bper\b/i.test(text))
        return `per ${ctx.unit}`;
    const t = text.match(/\bper (?:message|sms|transaction|seat|user|site|link|device|ticket|fte|contact|call|check|verification|api call|shipment|order|sim|label|booking|request|session|minute)\b/i);
    if (t)
        return t[0].toLowerCase();
    return { transactions: 'per unit of usage', connectivity: 'per site', services: 'per FTE, per ticket or fixed', hardware_software: 'per device plus the software', marketplace: 'as a take rate', investment: 'as a fee on assets', saas: 'as a subscription' }[ctx.model || ''] || 'as a subscription';
};
/** Answers one objection or blocker. The answer says what to do and what to bring; it states no fact about the user's product. */
function answerQuestion(raw, ctx) {
    const text = (0, exports.stripEnd)(raw.replace(/^["“]|["”]$/g, ''));
    const t = text.toLowerCase();
    const P = ctx.P;
    const needs = (0, exports.some)(ctx.needs, 3);
    const modelT = verticals_ts_1.MODEL_TRADES[ctx.model || 'unknown'];
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
        return mk('cheapest', `Do not claim it is the cheapest. Take the buyer's last invoice or usage report and price the same activity both ways, ${unit} and including every fee, so the comparison is theirs and not yours. Where the lower figure is not yours, say what the difference buys (${needs || 'what the buyer named as important'}).`, `your price list, how ${unit} pricing is built, and every fee that is not in the headline rate`, 'Can you show me your last month of activity so we can price the same month both ways?');
    }
    if (/\b(?:do|will|would|am|are) (?:i|we)\b.{0,20}\b(?:pay|be charged|get charged|billed)\b|\bcharged for\b|\bbilled for\b|\bpay for\b/i.test(t)) {
        return mk('usage-billing', `Answer from the billing rules, using the case in the question: say what counts as billable (active, connected, sending, or only present on the account), when it starts and stops, and show a worked invoice for exactly that case. If the rule has an exception, state it first.`, `${P}'s billing rules for this case: what is billable, from when to when, and what is not`, 'Which of your items would sit idle, and for how long, in a typical month?');
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
        return mk('terms', `Answer from the written terms, in one place: what is paid and when, what is refundable, what happens on cancellation, and whether a minimum, a commitment or a maintenance fee applies. Never say "no commitment" or "fully refundable" unless the written terms say so.`, `the current billing, refund and cancellation terms of ${P}, including any minimum or maintenance fee`, 'What would the terms need to say for this to be an easy yes?');
    }
    if (/\b(?:how much|price|pricing|priced|costs?|fees?|charges?|budget|afford\w*|expensive|rates?)\b/i.test(t) && !/\bcompar/i.test(t)) {
        const unit = unitFor(text, ctx);
        return mk('price', `Answer with how ${P} is priced (${unit}) and one worked example on the buyer's own volumes, with every charge on the page. Then set the figure next to what the problem costs them today${ctx.alternatives.length ? ` (${(0, exports.lowerStart)(ctx.alternatives[0])})` : ''}, so the price is read against their own cost and not on its own.`, `${P}'s price list and exactly what it includes; use a competitor's price only from a quote the buyer shows you`, 'What would this need to be compared with for the price to make sense to you?');
    }
    if (/\bwhy not\b|\balready (?:have|use|has|got|own)\b|\bextend (?:the|our|what)\b|\bwe (?:have|use|built|run) (?:a|an|our|the)\b|\bin-?house\b|\bbuild (?:it|this)\b|\bour (?:own )?(?:erp|crm|tms|wms|system|tool)s? (?:already|has|does)\b/i.test(t)) {
        const cur = ctx.alternatives.length ? ` (${(0, exports.lowerStart)(ctx.alternatives[0])})` : '';
        return mk('incumbent', `Start from what their current setup does not do${cur}, in their words, and what that gap costs them. Position ${P} alongside it where you can and replace it only where the gap is clear. Draw the overlap line by line and honestly, including what the current tool does better.`, `what ${P} covers that the current setup does not, and what the current setup covers that ${P} does not`, 'What does the current setup not do today, and what does that cost you?');
    }
    const integ = /\b(?:integrat\w*|connect(?:s|ed)? (?:to|with)|work(?:s)? with|plug into|apis?|sync\w*|existing (?:tools|systems|erp|stack))\b/i.test(t) || /\b(?:salesforce|netsuite|sap|oracle|erp|crm|tms|wms|siem|dms|hris|tally|quickbooks|zoho|slack|jira|splunk|servicenow)\b/i.test(t);
    if (integ) {
        const sys = named.filter((s) => !/^(?:ERP|CRM)$/i.test(s) || named.length === 1);
        const list = sys.length ? ` (${(0, dealtext_ts_1.joinList)(sys)})` : '';
        return mk('integration', `Answer system by system${list}: for each, say whether the link is built in, goes through an API or needs a file transfer, who builds it and who owns it on the buyer's side. ${relevant ? `Your description lists ${(0, exports.lowerStart)(relevant)}, so show that part working with their data rather than describe it. ` : ''}Offer a technical call with their IT owner and agree which data moves, in which direction and how often.`, `which of ${sys.length ? (0, dealtext_ts_1.joinList)(sys) : 'the buyer\'s systems'} ${P} connects to today, in what way and with what limits, from your integration documentation`, 'Which system is the master record for this data today, and who owns the connection?');
    }
    const std = (text.match(/\b(?:asc ?606|ifrs ?\d*|gaap|gdpr|dpdp|soc ?[12]|iso ?\d{4,5}|pci(?:[- ]dss)?|rbi|sebi|fedramp|hipaa|nist|gst|e-?invoic\w*)\b/gi) || []).map((x) => x.toUpperCase().replace(/\s+/g, ' '));
    if (std.length || /\b(?:compliance|regulat\w*|certif\w*|statutory)\b/i.test(t)) {
        const what = std.length ? (0, dealtext_ts_1.joinList)([...new Set(std)]) : 'the requirement the buyer named';
        return mk('compliance', `Name the exact rule${std.length > 1 ? 's' : ''} the buyer asked about (${what}) and answer each one separately: what in ${P} supports it, what the buyer's own team or auditor still has to do, and which document proves it. ${relevant ? `Your description lists ${(0, exports.lowerStart)(relevant)}, so show that part producing the evidence. ` : ''}Send the document before they ask for it.`, `whether and how ${P} supports ${what}, and which certificates or reports you hold; never claim a status you cannot show`, 'Who signs off compliance on your side, and what evidence do they ask for?');
    }
    if (/\b(?:secur\w*|privacy|data (?:protection|residency|handling|location|sovereignty)|encrypt\w*|breach\w*|pii|sovereign\w*|safe\b)/i.test(t) && !/\bdifferent|differ\b/i.test(t)) {
        return mk('security', `Bring the answers before they are asked: where the data is stored and processed, who can see it, how it is protected and deleted, and which review the buyer's security team will run. Offer the security documents first and a call with their reviewer.`, `where ${P} stores and processes the buyer's data, who can reach it, and which security documents you can share`, 'What does your security team need to see before they approve a new vendor?');
    }
    if (/\b(?:differ\w*|different|vs\.?|versus|compared? (?:to|with)|instead of|better than|why .{1,40}\bover\b|over (?:a |an |the )?\S+|main difference)\b/i.test(t)) {
        const m = text.match(/\bwhy (?:do |should |would |choose )?(.+?) over (?:a |an |the )?(.+)$/i) || text.match(/\bhow (?:does|do|is|are) (?:a |an |the )?(.+?) (?:differ|different) from (?:a |an |the )?(.+)$/i) || text.match(/\bbetween (.+?) and (.+)$/i);
        const a = m ? (0, exports.stripEnd)(m[1]) : P;
        const b = m ? (0, exports.stripEnd)(m[2]) : (ctx.alternatives[0] ? (0, exports.lowerStart)(ctx.alternatives[0]) : 'the other option');
        return mk('difference', `Answer it as a difference in what each one is for, on the points this buyer cares about${needs ? ` (${needs})` : ''}, and not as a feature list. Set ${a} and ${b} side by side on those points, show each on the buyer's own case, and say plainly when ${b} is the better choice for something.`, `what ${a} and ${b} each do today, from your own documentation; do not claim a difference you cannot show`, 'What are you trying to get done with it, and what have you tried so far?');
    }
    if (/\b(?:can|do|does|will|could) (?:we|you|it|i|they)\b.{0,40}\b(?:all|every|each|any)\b|\b(?:countries|regions|cities|languages|markets|currencies)\b/i.test(t) && /^(?:can|do|does|will|could|is|are)\b/i.test(t)) {
        return mk('coverage', `Answer item by item, not with "all": for each country, region, language or case in the buyer's list, say whether it is supported today, supported after set-up or approval, or not supported, and what that costs. Ask for their list first and send it back marked up.`, `which of the buyer's items ${P} supports today, which need set-up or approval and how long that takes, and which it does not support`, 'Which of these matter first, and which could wait for a later wave?');
    }
    if (/\b(?:suitable|right for|fit for|fit our|work(?:s)? for|enterprises?|growing|at scale|scale|specific .{0,25}(?:workflows?|codes?|processes)|cost codes)\b/i.test(t)) {
        return mk('fit', `Answer with the buyer's own hardest cases, by name, instead of a plain yes: ask for the three that would break a weaker product (volume, number of entities, approvals, special rules), and for each say whether it works today, works with set-up, or is not supported. Then offer a test on the one that matters most.`, `which of the buyer's cases ${P} supports today, which need configuration and which it does not support; a reference of similar size only if the customer has agreed`, 'Which three cases would you want to see working before you believe it?');
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
    const answer = a.kind === 'general' ? `Answer the exact question asked in two parts: the facts the buyer needs, then what you will do next. If you do not have a fact yet, say when you will have it rather than guess.${a.sector ? ` In ${ctx.v?.name || 'this sector'} the usual pattern is: ${(0, exports.lowerStart)(a.sector)}` : ''}` : a.how;
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
    const t = (/_/.test(s) ? s.toLowerCase() : s).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
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
        const kept = sents.map((x, i) => (seen.has(key(x)) ? (i === 0 ? `For ${(0, exports.quoted)(it.text.length > 140 ? (0, dealtext_ts_1.clip)(it.text, 140) : it.text)}: ${(0, exports.lowerStart)(x)}` : '') : x)).filter(Boolean);
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
/** True only for a word that is clearly a name: it has a capital inside or a digit or a dot (eClerx, GitLab, project44, Gnani.ai), or it is capitalised, is not a common word,
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
//# sourceMappingURL=rw1-common.js.map