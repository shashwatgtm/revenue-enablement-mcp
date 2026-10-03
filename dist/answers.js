"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_KNOWLEDGE = void 0;
exports.namedThings = namedThings;
exports.answerBlocker = answerBlocker;
exports.blockerLines = blockerLines;
exports.blockerShort = blockerShort;
exports.roleFor = roleFor;
// Run 20 round 1b (D92): how an objection, blocker or buyer question is answered, and what each kind of buyer role cares about.
// Rule B82: no statistic, benchmark or named-company fact. Rule: nothing is said about the user's own product that the user did
// not type; where a fact is needed, the answer says what to confirm ("Confirm before you say it").
const dealtext_ts_1 = require("./dealtext.js");
const STOP = new Set(['the', 'and', 'for', 'are', 'not', 'too', 'our', 'we', 'have', 'has', 'does', 'this', 'will', 'than', 'with', 'from', 'your', 'can', 'use', 'new', 'own', 'how', 'what', 'why', 'who', 'when', 'where', 'which', 'you', 'its', 'any', 'all', 'is', 'it', 'do', 'to', 'of', 'in', 'on', 'a', 'an', 'be', 'or', 'by', 'at', 'as', 'if', 'so', 'my', 'me', 'i', 'they', 'their', 'there', 'that', 'these', 'those', 'should', 'would', 'could', 'about', 'into', 'out', 'up']);
const words = (t) => t.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
const GENERIC_CAPS = new Set(['Does', 'Do', 'How', 'What', 'Why', 'Who', 'When', 'Where', 'Which', 'Can', 'Could', 'Will', 'Would', 'Is', 'Are', 'Should', 'Our', 'The', 'We', 'It', 'If', 'Has', 'Have', 'A', 'An', 'In', 'On', 'With', 'And', 'Or', 'For', 'To', 'Of', 'My', 'You', 'Your', 'I', 'There', 'Their', 'This', 'That']);
/** Named things in a question: "Salesforce CRM", "NetSuite ERP", "ASC 606", "IFRS 15". */
function namedThings(text, skip = []) {
    const out = [];
    const re = /\b(?:[A-Z][A-Za-z0-9]*(?:[A-Z][a-z0-9]+)*|[A-Z]{2,})(?:\s+(?:[A-Z][A-Za-z0-9]*|\d+))*\b/g;
    const skipL = skip.filter(Boolean).map((s) => s.toLowerCase());
    let m;
    while ((m = re.exec(text))) {
        let w = m[0].trim();
        const first = w.split(/\s+/)[0];
        if (GENERIC_CAPS.has(first)) {
            w = w.split(/\s+/).slice(1).join(' ');
            if (!w)
                continue;
        }
        if (skipL.some((s) => w.toLowerCase().includes(s) || s.includes(w.toLowerCase())))
            continue;
        if (!out.includes(w))
            out.push(w);
    }
    return out;
}
function between(text, re) {
    const m = text.replace(/[?.!]+$/, '').match(re);
    return m ? m.slice(1).map((x) => x.trim()) : null;
}
const MODEL_SETUP = {
    connectivity: ' For a network, include the site survey and the delivery time of each link.',
    services: ' Include the transition from the current provider and who signs off each stage.',
    investment: ' Include the time from signing to the first allocation.',
    hardware_software: ' Include the delivery and installation of the devices.',
    transactions: ' Include the integration and the first live transactions.',
};
const KINDS = [
    {
        id: 'offline', test: /\b(offline|without (?:a )?(?:mobile )?(?:network|internet|signal)|no (?:internet|network|signal|connectivity)|low connectivity|poor network|remote areas?)\b/i,
        build: (_t, _c, p) => ({
            how: 'Answer with the working: what a user can still do with no signal, what waits until the phone or device reconnects, and how a clash is settled when two people change the same record. Offer to test it in a low-signal area with their own users.',
            confirm: `which functions work offline in ${p} today and how data syncs when the connection returns`,
            ask: 'In which places or routes do your people lose signal, and what do they do then?',
        }),
    },
    {
        id: 'integration', test: /\b(integrat\w*|connect(?:s|ed)? (?:to|with)|work(?:s)? with|plug into|apis?|sync\w*|salesforce|netsuite|sap\b|oracle|erp\b|crm\b|tms\b|wms\b|siem\b|ticketing|dms\b|hris|tally|quickbooks|zoho|slack|jira)\b/i,
        build: (t, c, p) => {
            const systems = namedThings(t, [c.product, p]).filter((s) => !/^(?:API|APIs|SDK)$/i.test(s));
            const list = systems.length ? ` (${(0, dealtext_ts_1.joinList)(systems)})` : '';
            return {
                how: `Answer system by system${list}: for each, say whether the link is built in, goes through an API or needs a file transfer, who builds it, and who owns it on the buyer's side. Offer a technical call with their IT owner and agree which data moves in which direction.`,
                confirm: `which of ${systems.length ? (0, dealtext_ts_1.joinList)(systems) : 'the buyer\'s systems'} ${p} connects to today, in what way, and with what limits, from your integration documentation`,
                ask: 'Which system is the master record for this data today, and who owns the connection?',
            };
        },
    },
    {
        id: 'compliance', test: /\b(asc ?606|ifrs ?\d*|gaap|gdpr|dpdp|soc ?[12]|iso ?\d{4,5}|pci(?:[- ]dss)?|compliance|regulat\w*|certif\w*|rbi|sebi|fedramp|cert-in|statutory|gst|tax|e-?invoic\w*)\b/i,
        build: (t, _c, p) => {
            const named = (t.match(/\b(?:asc ?606|ifrs ?\d*|gaap|gdpr|dpdp|soc ?[12](?: type [i]+)?|iso ?\d{4,5}|pci(?:[- ]dss)?|rbi|sebi|fedramp|cert-in|gst)\b/gi) || []).map((x) => x.toUpperCase().replace(/\s+/g, ' '));
            const uniq = [...new Set(named)];
            const what = uniq.length ? (0, dealtext_ts_1.joinList)(uniq) : 'the requirement the buyer named';
            return {
                how: `Answer with the exact rule the buyer named (${what}): what in ${p} supports it, what the buyer's own team or auditor still has to do, and which document proves it. Send that document before they ask for it.`,
                confirm: `whether and how ${p} supports ${what}, and which certificates or reports you actually hold; never claim a status you cannot show`,
                ask: 'Who signs off compliance on your side, and what evidence do they ask for?',
            };
        },
    },
    {
        id: 'terms', test: /\b(refund\w*|cancel\w*|pay again|next month|minimum|maximum|commitment|lock-?in|setup fee|set-up fee|annual maintenance|maintenance fee|renew\w*)\b/i,
        build: (_t, _c, p) => ({
            how: 'Answer in the written terms, in one place: what is paid and when, what is refundable, what happens on cancellation, and whether any minimum, commitment or maintenance fee applies. Never say "no commitment" or "fully refundable" unless the written terms say so.',
            confirm: `${p}'s current price list, billing terms and refund and cancellation policy, including any minimum or maintenance fee`,
            ask: 'What would you need the terms to say for this to be an easy yes?',
        }),
    },
    {
        id: 'price', test: /\b(price|pricing|priced|cost\w*|cheap\w*|expensive|fees?|charges?|budget|discount\w*|afford\w*|rates?|overpriced|tco|total cost|hidden)\b/i,
        build: (_t, _c, p) => ({
            how: 'Do not defend the price in isolation. Set out the total cost to the buyer (price, set-up, integration, the team\'s time, and what the current way of working costs them) and let them compare it with the alternative on the same basis.',
            confirm: `${p}'s price and exactly what it includes; use an alternative's price only from a quote the buyer shows you, not from memory`,
            ask: 'What would this need to be compared with for the price to make sense to you?',
        }),
    },
    {
        id: 'setup', test: /\b(set ?up|implement\w*|onboard\w*|go[- ]live|how long|timeline|time to|deploy\w*|roll ?out|migrat\w*|cut-?over|transition)\b/i,
        build: (_t, c, p) => ({
            how: `Give a dated plan, not a promise: the steps from signing to first use, who does what on each side, and what the buyer must have ready (access, data, people). Offer to agree the plan before the contract is signed.${MODEL_SETUP[c.model || ''] || ''}`,
            confirm: `the set-up time you have actually achieved for customers of a similar size, and what ${p} needs from the buyer; give a range only if you can show it`,
            ask: 'What has to be live, and by when, for this to count as a success for you?',
        }),
    },
    {
        id: 'security', test: /\b(secur\w*|privacy|data (?:protection|residency|handling|location|sovereignty)|encrypt\w*|access control|breach\w*|pii|sovereign\w*)\b/i,
        build: (_t, _c, p) => ({
            how: 'Bring the answers before they are asked: where the data is stored and processed, who can see it, how it is protected and deleted, and which review the buyer\'s security team will run. Offer the security documents first and a call with their reviewer.',
            confirm: `where ${p} stores and processes the buyer's data, who can access it, and which security documents you can share`,
            ask: 'What does your security team need to see before they will approve a new vendor?',
        }),
    },
    {
        id: 'accuracy', test: /\b(accura\w*|reliab\w*|precise\w*|gps|error rate|hallucinat\w*|explain\w*|black box|trust\w*|wrong answers?|false positives?)\b/i,
        build: (_t, _c, p) => ({
            how: 'Offer a test the buyer can check for themselves: run it on their own data or history, compare it with what they use today, and agree the measure and the pass mark before the test starts.',
            confirm: `what accuracy or error you have measured for ${p}, on whose data and how; do not quote a figure you cannot show`,
            ask: 'How would you judge, on your own data, that it is good enough?',
        }),
    },
    {
        id: 'adoption', test: /\b(adopt\w*|will (?:not|n't) use|won'?t use|training|resist\w*|change management|buy-?in|another (?:app|tool|login|dashboard)|too complex|learning curve)\b/i,
        build: (_t, _c, p) => ({
            how: 'Plan adoption with the people who will use it: a small first group, one measure of use agreed before the start, and a named owner on the buyer\'s side. Let the first group\'s results make the case for the rest.',
            confirm: `the adoption you have seen with customers of a similar kind (share it only with their consent) and the training ${p} provides`,
            ask: 'Who would use this every day, and what would make them keep using it?',
        }),
    },
    {
        id: 'incumbent', test: /\b(already (?:have|use|has|do|got)|in-?house|build (?:it|this)|built (?:it|this)|existing|current (?:vendor|tool|system|provider|operator)|incumbent|overlap\w*|too many tools|point tools|best-of-breed|consolidat\w*|stitch\w*|replace\w*)\b/i,
        build: (_t, _c, p) => ({
            how: 'Start from what the buyer\'s current setup does not do, in their words, and what that costs them. Position alongside it where you can and replace it only where the gap is clear. Draw the overlap line by line and honestly, including what the current tool does better.',
            confirm: `what ${p} covers that the current tool does not, and what the current tool covers that ${p} does not`,
            ask: 'What does the current setup not do today, and what does that cost you?',
        }),
    },
    {
        id: 'proof', test: /\b(proof|prove\w*|references?|case stud\w*|track record|evidence|customers like|who else uses|pilot|poc)\b/i,
        build: (_t, _c, p) => ({
            how: 'Offer a time-boxed proof on the buyer\'s own environment with the success measure agreed in writing first, plus references the customer has agreed to give.',
            confirm: `which ${p} customers have agreed to speak to prospects, and what they will say`,
            ask: 'What would you need to see in a short proof to say yes?',
        }),
    },
    {
        id: 'coverage', test: /\b(suitable|fit for|work(?:s)? for|all types?|every type|any type|enterprise|large (?:companies|enterprises|teams)|small (?:companies|business)|mid-?size|at scale|scale|supports? (?:all|every|multiple|different))\b/i,
        build: (t, _c, p) => ({
            how: `Answer with the specific cases behind the question ("${(0, dealtext_ts_1.clip)(t.replace(/[?]+$/, ''), 90).replace(/"/g, "'")}?"), by name, not with a plain yes. For each case, say whether it is supported today, supported with set-up, or not supported; then offer a pilot on the case that matters most to them.`,
            confirm: `which of those cases ${p} supports today, which need configuration, and which it does not support`,
            ask: 'Which cases matter most to you, and which ones have caused trouble before?',
        }),
    },
    {
        id: 'compare', test: /\b(differ\w*|different|vs\.?|versus|compare[sd]?|comparison|instead of|better than|why (?:\S+ ){0,4}over|over (?:a |an |the )?\S+)\b/i,
        build: (t, _c, p) => {
            let a = '', b = '';
            const m1 = between(t, /\bwhy (?:do|should|would|choose)?\s*(.+?) over (?:a |an |the )?(.+)$/i);
            const m2 = between(t, /\bhow (?:does|do|is|are) (?:a |an |the )?(.+?) (?:differ|different) from (?:a |an |the )?(.+)$/i);
            const m3 = between(t, /\b(.+?) (?:vs\.?|versus) (.+)$/i);
            const pair = m1 || m2 || m3;
            if (pair) {
                a = pair[0].replace(/^(?:do|should|would|choose)\s+/i, '');
                b = pair[1];
            }
            const both = a && b ? `${a} and ${b}` : `${p} and the other option`;
            return {
                how: `Answer it as a difference in what each is for, not as a feature list. Set out ${both} side by side on the same four points: what it is for, who uses it, what it costs the buyer, and what it needs from the buyer's team. Say plainly when the other option is the better choice for a case.`,
                confirm: `what ${a || p} and ${b || 'the other option'} each do today, from your own product documentation, and who each is for; do not claim a difference you cannot show`,
                ask: 'What are you trying to get done with it, and what have you tried so far?',
            };
        },
    },
    {
        id: 'process', test: /^(?:what (?:should|do|happens|can)|what if|how (?:do|can|should) (?:i|we)|can i|do i)\b/i,
        build: (_t, _c, p) => ({
            how: 'This is a how-it-works question. Answer it from your documented process in three parts: what happens, who acts, and how long it takes. Put the answer in the proposal or the help text too, so it does not have to be answered live each time.',
            confirm: `${p}'s actual process and service levels for this case, from your operations documents`,
            ask: 'Has this happened to you before, and what did you do then?',
        }),
    },
    {
        id: 'why', test: /^why (?:do|does|is|are)\b/i,
        build: (_t, _c, p) => ({
            how: 'Explain the cause in the buyer\'s terms first, then show where they can see it and where they can change it. A clear reason is worth more than a long defence.',
            confirm: `the real rules behind it in ${p}, from your own pricing or product rules`,
            ask: 'Which case surprised you, and what did you expect to see?',
        }),
    },
    {
        id: 'timing', test: /\b(not now|next (?:year|quarter)|later|priority|timing|budget cycle|freeze|no decision)\b/i,
        build: () => ({
            how: 'Find the event that makes this urgent (a renewal, an audit, a season, a target) and plan back from it. If there is none, agree what would have to change for it to become urgent.',
            confirm: 'the dates the buyer gives you for that event; do not invent a deadline',
            ask: 'What happens if nothing changes by the end of this quarter?',
        }),
    },
];
/** Answers one objection, blocker or buyer question by its kind, from the user's own words and the sector's usual objections. */
function answerBlocker(text, ctx) {
    const t = text.trim();
    const p = ctx.product || 'your product';
    let sector = '';
    if (ctx.sectorObjections) {
        const tw = new Set(words(t));
        let best = 0;
        for (const o of ctx.sectorObjections) {
            const ow = words(o.objection);
            const hit = ow.filter((w) => tw.has(w) || [...tw].some((x) => w.length > 4 && x.startsWith(w.slice(0, 5)))).length;
            if (hit >= Math.min(2, ow.length) && hit > best) {
                best = hit;
                sector = o.response;
            }
        }
    }
    // "Why do shipping charges vary ..." asks for a reason, whatever word it uses
    const ordered = /^why (?:do|does|is|are)\b/i.test(t) ? [KINDS.find((k) => k.id === 'why'), ...KINDS] : KINDS;
    for (const k of ordered) {
        if (k.test.test(t))
            return { kind: k.id, ...k.build(t, ctx, p), sector };
    }
    return {
        kind: 'general',
        how: `Answer the exact question asked ("${(0, dealtext_ts_1.clip)(t, 110).replace(/"/g, "'")}") in two parts: the facts the buyer needs, then what you will do next. If you do not have a fact yet, say when you will have it rather than guess.`,
        confirm: `the facts behind that question from ${p}'s own documentation`,
        ask: 'What decision does the answer to this change for you?',
        sector,
    };
}
/** The answer as lines for a list item. */
function blockerLines(text, ctx) {
    const a = answerBlocker(text, ctx);
    const lines = [`- **How to answer:** ${a.how}`, `- **Confirm before you say it:** ${a.confirm}.`, `- **Ask first:** "${a.ask}"`];
    if (a.sector)
        lines.push(`- **Usual pattern in ${ctx.sectorName || 'this sector'}:** ${a.sector}`);
    return lines;
}
/** The answer in one cell or one sentence. */
function blockerShort(text, ctx) {
    const a = answerBlocker(text, ctx);
    return `${a.sector || a.how} Confirm first: ${a.confirm}.`;
}
exports.ROLE_KNOWLEDGE = {
    finance: {
        label: 'finance leader', cares: 'control, accuracy and an audit trail on money movements, and the effort the team spends at period end',
        worry: 'a change that disturbs the close or leaves an audit finding', needs: 'how it posts to the ledger, what controls it adds and which manual steps the team stops doing',
        questions: ['Which finance numbers are late or reworked each period, and why?', 'Who signs off a change to how money is approved, paid or recorded, and what do they ask to see?', 'What did the last audit or review ask for on this topic?'],
        nextStep: 'Agree the number they are measured on and the audit or close step this changes; get a meeting before the proposal', owns: 'commercial terms, budget approval and the finance review',
    },
    security: {
        label: 'security leader', cares: 'exposure, detection and response, and evidence for audit', worry: 'a new tool that adds alerts without removing risk, or a vendor with access to sensitive data',
        needs: 'a proof on their own environment, how findings are ranked, and the vendor\'s own security documents', questions: ['Which assets or environments are you least sure about today?', 'How does a finding reach someone who can fix it, and how long does that take?', 'What would you need to see in a short proof to call it a success?'],
        nextStep: 'Agree the scope and the success measure of a short proof on their environment, and send the security documents first', owns: 'the security and data-handling review and the proof of value',
    },
    risk: {
        label: 'risk, audit or compliance reviewer', cares: 'evidence, controls and the ability to show them to a regulator or auditor', worry: 'a gap they will have to explain later',
        needs: 'which requirement each feature or report meets, in writing', questions: ['Which requirements must a new vendor meet before you will sign off?', 'What evidence do you ask for, and in what format?', 'How long does your review usually take?'],
        nextStep: 'Ask for their review checklist and map each line to the document that answers it', owns: 'the compliance and audit review',
    },
    it: {
        label: 'IT leader', cares: 'fit with the existing systems, security review and who runs it afterwards', worry: 'integration work that lands on their team, and another system to support',
        needs: 'the systems it connects to, who builds each link, and the support model', questions: ['Which systems must this work with, and who owns each one?', 'What does your security review need and how long does it take?', 'Who would run it day to day after go-live?'],
        nextStep: 'Hold a technical call on integration and support, and agree who owns each link', owns: 'the integration plan, the technical validation and the IT security review',
    },
    engineering: {
        label: 'engineering or platform leader', cares: 'developer time, quality and how it fits the way teams already work', worry: 'a tool teams will not adopt, or one that adds maintenance',
        needs: 'a trial on a real project and the path from their current tooling', questions: ['Which tools do the teams use today, and which would this replace or join?', 'Where does time go that should not?', 'Who must approve a new developer tool?'],
        nextStep: 'Offer a trial on one real project with an agreed measure', owns: 'the technical evaluation and the trial',
    },
    operations: {
        label: 'operations leader', cares: 'daily execution, service levels and cost per unit of work', worry: 'disruption to live operations and a team that will not use the new way',
        needs: 'a pilot in one place with a before-and-after measure', questions: ['Which part of the day goes wrong most often, and what does it cost?', 'How do you measure it today, and who owns that number?', 'What happens when plans change after work has started?'],
        nextStep: 'Agree a pilot site, the measure and the people who will use it', owns: 'the pilot and the operational rollout',
    },
    sales: {
        label: 'sales leader', cares: 'coverage, orders, rep adoption and how fast the field sees a result', worry: 'reps who will not use another app, and a rollout that takes a season',
        needs: 'a pilot in one region with a measure against a comparable region', questions: ['How do your reps capture orders and plan visits today?', 'How late is your view of what sold, by outlet or account?', 'What would make reps keep using a new tool?'],
        nextStep: 'Agree a pilot region and the measure, and who in the field will lead it', owns: 'the field pilot and the sales rollout',
    },
    product: {
        label: 'product leader', cares: 'speed of change, the customer experience and the engineering time a project takes', worry: 'a dependency on engineering that slows the roadmap',
        needs: 'how quickly a change goes live without engineering work', questions: ['What takes the longest when you change what or how you charge or ship?', 'How much of that needs engineering time?', 'Who else has to approve a change?'],
        nextStep: 'Walk through one real change end to end and time it', owns: 'the requirements and the product-side validation',
    },
    marketing: {
        label: 'marketing leader', cares: 'pipeline, brand and the evidence they can use in market', worry: 'a claim they cannot stand behind', needs: 'proof they may publish and a clear measure',
        questions: ['Which numbers do you report to leadership on this?', 'What evidence do you use externally today?', 'What would make this easy to justify?'],
        nextStep: 'Agree the measure and the proof they can use', owns: 'the messaging and any public proof',
    },
    hr: {
        label: 'HR leader', cares: 'employee experience and the effort to roll out to people', worry: 'a change employees will complain about', needs: 'how the change reaches employees and who supports them',
        questions: ['Which employee group is affected first?', 'How are employees told about a change like this?', 'Who supports them afterwards?'],
        nextStep: 'Agree the first employee group and the communication plan', owns: 'employee communication and policy',
    },
    procurement: {
        label: 'procurement lead', cares: 'a fair comparison, standard terms and a clean process', worry: 'a vendor that skips the process or terms they cannot accept',
        needs: 'the commercial terms, a comparable quote and the documents their process asks for', questions: ['What does your vendor process require, and in what order?', 'Which terms are fixed and which can move?', 'How long does a decision of this size usually take?'],
        nextStep: 'Ask for the vendor checklist and start the paperwork in parallel with the evaluation', owns: 'the commercial process, vendor registration and contract terms',
    },
    executive: {
        label: 'business leader', cares: 'the outcome, the risk and how soon they see a result', worry: 'a project that takes their people\'s time and does not show a result',
        needs: 'a short case in their own numbers and a named owner', questions: ['What outcome would make this worth your attention this year?', 'Who would own it, and what would you need to see before you back it?', 'What has held similar projects back here before?'],
        nextStep: 'Agree the outcome they are measured on and book a short meeting before the proposal', owns: 'the decision and the budget',
    },
    data: {
        label: 'data or analytics lead', cares: 'data quality, access and how results can be checked', worry: 'results they cannot reproduce or explain', needs: 'how outputs are produced and how they can test them on their own data',
        questions: ['Where does the data live, and what may leave your environment?', 'How would you check that an output is right?', 'Who reviews results before they are used?'],
        nextStep: 'Agree a test on their own data and the measure of success', owns: 'the data and model validation',
    },
    customer: {
        label: 'customer operations lead', cares: 'customer experience, handling time and quality', worry: 'a change that hurts service while it beds in', needs: 'a pilot on a small share of work with a quality check',
        questions: ['Which cases take the most time today?', 'How do you measure quality and handling time?', 'What must a person always check?'],
        nextStep: 'Agree a small pilot with a quality measure', owns: 'the pilot and the service-level review',
    },
    investment: {
        label: 'investment decision maker', cares: 'fit with their investment process, explainability, risk limits and reporting', worry: 'a model they cannot explain to their committee or a mandate that breaks their limits',
        needs: 'how results are explained, how risk is controlled and what the reporting looks like', questions: ['How does an idea reach a decision in your process today, and who signs it off?', 'What must you be able to explain to your committee?', 'What reporting do you expect each month, and after a bad month?'],
        nextStep: 'Agree the review process, the information the committee needs and the reporting you will provide', owns: 'the investment decision and the committee review',
    },
    other: {
        label: 'stakeholder', cares: 'how this changes their own work', worry: 'extra work or risk for them', needs: 'a clear picture of what changes for them',
        questions: ['How does this part of the work run today?', 'What would you change if you could?', 'Who else should be part of this conversation?'],
        nextStep: 'Ask what they need from this decision', owns: 'their own part of the evaluation',
    },
};
/** The role knowledge for a job title. */
function roleFor(title, investmentBuyer = false) {
    return exports.ROLE_KNOWLEDGE[(0, dealtext_ts_1.familyOf)(title, investmentBuyer)];
}
//# sourceMappingURL=answers.js.map