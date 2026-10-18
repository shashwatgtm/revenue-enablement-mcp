"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_GENERAL_NOTES = void 0;
exports.subIndustryFor = subIndustryFor;
exports.gateSubIndustry = gateSubIndustry;
exports.withGeneralNotes = withGeneralNotes;
// Run 42B (addendum 8): the ONE place that decides whether a sub industry (an entry of SUBTYPES: its vocabulary, buyer roles, committee, objections,
// measures, proof shape, discovery questions and usual model) may be used. It is used only when the seller's own category or product description
// holds that sub industry's own words: its name, two different phrases of its match list, or one phrase that names the kind by itself. A generic
// label (AI agents, copilot, agentic, cloud, platform, API ...) is how a product is built, not what kind of company sells it, and never names a kind
// alone. Otherwise null, and every caller uses the sector's general entry (or neutral wording). your_sector fixes the sector, never the sub industry.
// No figure, statistic or named company (B82).
const verticals_ts_1 = require("./verticals.js");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
// one phrase of these says how a product is built or sold, not what kind of company the seller is
const GENERIC_PHRASE = /^(?:ai|a\.i\.|ai agents?|agents?|agents? that|ai copilots?|copilots?|ai assistants?|agentic(?: (?:ai|platform|workflows?|automation))?|autonomous agents?|ai (?:workers?|coworkers?|teammates?|employees?|sdrs?)|digital (?:workers?|employees?|coworkers?)|ai workforce|ai platform|llms?|genai|gen ai|generative ai|ai[- ](?:native|first)|api|apis|api platform|platform|software|saas|cloud|automation|security|data|analytics|management|monitoring|testing|workflows?|developers?|devops|iam|fraud|phishing|messaging|voice|payments?|billing|network(?:ing)?|connectivity|marketing|support|crm|erp)$/;
/** The distinct phrases of the sub industry's match list that stand in the seller's text. */
function phrasesIn(st, text) {
    const out = new Set();
    for (const m of text.matchAll(new RegExp(st.match.source, st.match.flags.replace(/[gy]/g, '') + 'g')))
        if (m[0])
            out.add(norm(m[0]));
    return [...out];
}
function qualifies(st, text) {
    if (st.name.length >= 4 && new RegExp('\\b' + esc(st.name) + '\\b', 'i').test(text))
        return true;
    const ph = phrasesIn(st, text);
    if (ph.some((p) => !GENERIC_PHRASE.test(p)))
        return true;
    // generic labels only: two different ones, the first within the opening of the description (where the seller says what it is), name the kind;
    // the same labels late in a list of parts ("... and a sandbox for AI agents") say how a part is built
    if (ph.length < 2)
        return false;
    const first = text.search(new RegExp(st.match.source, st.match.flags.replace(/[gy]/g, '')));
    return first >= 0 && first <= OPENING;
}
const OPENING = 60;
const textOf = (sellerTexts) => sellerTexts.filter((x) => typeof x === 'string').join(' \n ');
/** The sub industry of this sector the seller's own words name, or null. `sellerTexts` are the seller's own words only (never the deal text, the job
 * titles or the buyer's industry). With `chosen` (the sub industry another reader picked) it answers whether that choice stands. */
function subIndustryFor(sector, sellerTexts, chosen) {
    if (!sector)
        return null;
    const text = textOf(sellerTexts);
    if (!text.trim())
        return null;
    const mine = verticals_ts_1.SUBTYPES.filter((x) => x.vertical === sector);
    if (chosen) {
        const st = mine.find((x) => x.id === chosen);
        if (!st)
            return null;
        if (qualifies(st, text))
            return st;
        // a reading that moved to a neighbouring kind on its own words (penetration testing for application security, core banking for banking APIs) stands when the seller's text holds no word of the chosen kind but a qualifying one of the sector
        return phrasesIn(st, text).length === 0 && mine.some((x) => x.id !== st.id && qualifies(x, text)) ? st : null;
    }
    const found = mine.filter((x) => qualifies(x, text));
    return found.length === 1 ? found[0] : null;
}
/** The vertical as the seller's own words allow: a sub industry's notes are kept only when subIndustryFor allows them; otherwise the sector's general entry.
 * Business model profiles (billing, investment management, AI support) have their own seller word rules and pass through. */
function gateSubIndustry(v, sellerTexts) {
    if (!v || !v.subtype)
        return v;
    if (subIndustryFor(v.id, sellerTexts, v.subtype))
        return v;
    return verticals_ts_1.VERTICALS.find((x) => x.id === v.id) ?? v;
}
// The AI native entry of src/verticals.ts is written for AI that decides cases (review, approval of an action that moves money, cost per case). A seller
// whose words name none of that (a cloud for training and running models, a model API, a developer tool with AI in it) gets the lines that hold for
// every AI product instead; the decision AI lines stay for a seller that names cases or decisions. Words only, no figure, no named company (B82).
const DECISION_WORDS = /\b(?:cases?|decisions?|claims?|underwrit\w*|adjudicat\w*|triage|approvals?|verdicts?|scor(?:e|es|ing)|investigat\w*|reviews?)\b/i;
exports.AI_GENERAL_NOTES = {
    vocabulary: ['accuracy on your own data', 'guardrails', 'data privacy', 'pilot', 'inference cost', 'output quality', 'reliability under load'],
    buyerRoles: ['Business owner of the process the AI changes', 'Head of Data and AI', 'Chief Technology Officer', 'CISO', 'Legal Counsel'],
    committee: 'The owner of the process the AI changes signs; the business or engineering lead who feels the problem champions it and the data, AI or platform lead evaluates it on the buyer\'s own work; security and legal review where data goes; the team that works with the product uses it.',
    objections: [
        { objection: 'AI gets answers wrong', response: 'Agree a pilot on the buyer\'s own data before go-live, score it against the way the work is judged today, and keep a person approving any action that cannot be undone.' },
        { objection: 'Where does our data go?', response: 'State exactly where data is processed and stored, what is used for training (if anything), who can see it and how it can be deleted.' },
        { objection: 'It will not fit our existing systems', response: 'Name the systems it must read from and write to, the few data fields needed, and who on the buyer side owns each connection.' },
        { objection: 'Is the vendor stable enough?', response: 'Say plainly who runs the product, how the buyer can export its data and settings, and what happens to a running pilot if the model or its provider changes.' },
    ],
    salesMotion: 'A pilot on the buyer\'s own work with the success measures agreed first, then a production rollout.',
    metrics: ['accuracy or quality on the buyer\'s own work', 'time to a working pilot', 'cost per unit of use', 'time saved per task', 'adoption by the target team'],
    proofShape: 'A pilot on the buyer\'s own work, scored against the way the work is done today.',
    discovery: [
        'Which workloads or tasks would you move first, and which never?',
        'How do you judge that a result is right today: who reviews it, and against what?',
        'Where does the data it needs live, and what may leave your environment?',
        'What does this work cost you today, and how long does it take?',
    ],
};
/** The vertical after the sector's general notes are applied where the seller's own words name no kind of company in it. Idempotent; business model profiles pass through. */
function withGeneralNotes(v, sellerTexts) {
    if (!v || v.subtype || v.id !== 'ai-native' || v.generalOnly)
        return v;
    const base = verticals_ts_1.VERTICALS.find((x) => x.id === 'ai-native');
    if (v.committee !== base.committee || v.name !== base.name)
        return v;
    if (DECISION_WORDS.test(textOf(sellerTexts)))
        return v;
    return { ...v, ...exports.AI_GENERAL_NOTES, generalOnly: true };
}
//# sourceMappingURL=sub-industry.js.map