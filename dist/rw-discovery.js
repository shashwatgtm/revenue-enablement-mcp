"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDiscoveryBank = buildDiscoveryBank;
// Run 22 (rewrite of discovery_question_bank). Fresh judges scored the old lists 3 to 4: the pain statement was pasted whole into five questions, a
// question made no sense ("the targets a CIO answers for"), the product was called by its category noun ("cloud platform", "enterprise AI platform"),
// the economic buyer was assumed to be someone other than the person in the room, the buyer's industry was only repeated as a label, and the parts of
// the product that touch a pain were not asked about. The list is now written from the inputs: the pains are read as separate statements and named by
// their own words (or "the first problem you described" when long); the product's named parts are asked about, closest to the pains first; the buyer's
// industry adds its own questions (src/verticals.ts BUYER_LENS); a prospect who signs is asked as the signer. Nothing is stated as a fact about the
// product or the market, and what was not given is named once, at the end.
const dealtext_ts_1 = require("./dealtext.js");
const answers_ts_1 = require("./answers.js");
const verticals_ts_1 = require("./verticals.js");
const rw_kit_ts_1 = require("./rw-kit.js");
const lowerRole = (r) => r.replace(/\b([A-Z])([a-z]+)\b/g, (_m, a, b) => `${a.toLowerCase()}${b}`);
const anOf = (w) => { const t = w.trim(); const first = t.split(/\s+/)[0] || ''; const an = /^[A-Z]{2,5}$/.test(first) ? /^[AEIOFHLMNRSX]/.test(first) : /^(?:[aeiou]|8\b|8\d|11|18)/i.test(t); return `${an ? 'an' : 'a'} ${t}`; };
const isPluralRole = (role) => {
    const head = role.trim().split(/\s+(?:who|that|responsible|in|at|of|for)\s+/i)[0];
    const last = head.split(/\s+/).pop() || '';
    return /s$/i.test(last) && !/(?:ss|us|is|sales|operations|analytics|business|logistics|success|services|news)$/i.test(last);
};
function buildDiscoveryBank(args, d) {
    // a field filled with "(not given)" or "n/a" is a field left empty
    const text = (k) => { const x = (args[k] || '').trim(); return /^\(?\s*(?:not given|not provided|not specified|n\/a)\s*\)?$/i.test(x) ? '' : x; };
    const framework = args.framework || 'meddpicc';
    const prospectIndustry = text('prospect_industry');
    const prospectRoleTyped = text('prospect_role');
    // a bracket that only says where the title came from is a source note: the questions use the title without it
    const prospectRole = (0, rw_kit_ts_1.splitNotes)(prospectRoleTyped).text;
    const knownPainPoints = text('known_pain_points');
    const knownMetrics = text('known_metrics');
    const dealStage = args.deal_stage || 'discovery';
    const yourSolution = text('your_solution');
    const gapsToFill = text('gaps_to_fill');
    const ctx = d.readContext(undefined, { seller: [yourSolution], context: [knownPainPoints], role: [prospectRole], buyer: [prospectIndustry] });
    const v = ctx.v;
    const low = d.lowerFirstIfCommon;
    const sellerSw = !!v && v.id === 'saas' && !!prospectIndustry && !/software|saas|technology|internet|app\b/i.test(prospectIndustry); // a software seller's own measures describe its customers, not a buyer in another industry
    const sectorMetrics = v && !sellerSw ? d.rankMeasures(v.metrics, knownPainPoints, yourSolution) : [];
    const brief = (0, dealtext_ts_1.solutionBrief)(yourSolution);
    const P = (0, rw_kit_ts_1.productName)(brief, yourSolution) || (0, dealtext_ts_1.clip)(low(yourSolution), 70) || 'this solution';
    let product = (0, rw_kit_ts_1.readProduct)(yourSolution, brief.name || P);
    if (product.caps.length < 2 && brief.parts.length >= 2) {
        const fromParts = brief.parts.map((x) => (0, rw_kit_ts_1.toCapability)(x)).filter((x) => !!x);
        if (fromParts.length >= 2)
            product = { kind: product.kind, caps: fromParts };
    }
    const investment = ctx.model === 'investment';
    const lens = (0, verticals_ts_1.buyerLens)(prospectIndustry);
    const roleKnow = prospectRole ? (0, answers_ts_1.roleFor)(prospectRole, investment) : null;
    const roleFam = prospectRole ? (0, dealtext_ts_1.familyOf)(prospectRole, investment) : 'other';
    const roleTxt = prospectRole ? low(prospectRole) : '';
    const plural = !!roleTxt && isPluralRole(roleTxt);
    const youRole = roleTxt && !plural ? anOf(roleTxt) : 'you';
    const asRole = roleTxt ? `as ${plural ? roleTxt : anOf(roleTxt)}` : '';
    const indLow = prospectIndustry ? low(prospectIndustry) : '';
    const inInd = indLow && !(roleTxt && roleTxt.includes(indLow)) ? (/(?:ers|ors|ists|ants)$/i.test(indLow) ? ` at ${indLow}` : ` in ${indLow}`) : '';
    // the prospect signs when the title says so: a president, an owner, a founder, a chief executive, or a chief of finance
    const isSigner = !!prospectRole && (/\b(?:president|owner|founder|ceo|chief executive|managing director|chairman|cfo|chief financial)\b/i.test(prospectRole) || ((0, dealtext_ts_1.levelOf)(prospectRole) === 'exec' && (roleFam === 'finance' || roleFam === 'executive')));
    // ---- the pains, separate and named by their own words ----
    const painSet = (0, rw_kit_ts_1.readPains)(knownPainPoints);
    const pains = painSet.pains.length ? painSet.pains : knownPainPoints ? [knownPainPoints.replace(/[.]+$/, '')] : [];
    const pRef = (i) => (pains[i] ? (0, rw_kit_ts_1.painRef)(low(pains[i]), i, true) : 'the problem you came to fix');
    const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
    // after a pain has been quoted, it is called "that problem" (one pain) or "the second problem" (the numbered list in the context)
    const pShort = (i) => (pains.length <= 1 ? 'that problem' : `the ${ORD[i] || `number ${i + 1}`} problem`);
    const X = pains.length ? pShort(0) : 'the problem you came to fix';
    const XL = pRef(0);
    const noMetrics = /^(none|no|not yet|unknown|n\/a|na|tbd|none shared yet|not shared|nothing yet)\b/i.test(knownMetrics);
    const M1 = sectorMetrics[0] || 'the number this problem moves';
    const Mlist = sectorMetrics.length >= 2 ? (0, dealtext_ts_1.joinList)(sectorMetrics.slice(0, 3), 'or') : M1;
    const otherRoles = v ? v.buyerRoles.filter((r) => (0, dealtext_ts_1.familyOf)(r, investment) !== roleFam).sort((x, y) => Number(/ or /.test(x)) - Number(/ or /.test(y))).slice(0, 2).map(lowerRole) : [];
    const otherTxt = otherRoles.length ? (0, dealtext_ts_1.joinList)(otherRoles.map((r) => `your ${r}`), 'or') : 'someone else on your side';
    const signerClause = v ? low(v.committee.split(';')[0]).replace(/\s+signs?$/i, '') : '';
    const signer = isSigner ? 'you' : signerClause && signerClause.length <= 40 ? signerClause : 'the person who signs';
    const signerThe = isSigner ? 'you' : `the ${signer.replace(/^the\s+/, '')}`;
    // ---- the parts, closest to the pains and the role first ----
    const roleLens = prospectRole ? `${prospectRole} ${(0, rw_kit_ts_1.lensFor)(roleFam)}` : '';
    const skipP = (0, rw_kit_ts_1.wordsOf)(P, false);
    const partScore = (c) => {
        const t = `${c.name} ${c.desc}`;
        const byPain = pains.length ? Math.max(...pains.map((p) => { const f = (0, rw_kit_ts_1.fit)(t, p, skipP); return f.w >= 1 ? f.s : 0; })) : 0;
        return byPain * 2 + (roleLens ? (() => { const f = (0, rw_kit_ts_1.fit)(t, roleLens, skipP); return f.w >= 1 ? f.s : 0; })() : 0);
    };
    const scored = product.caps.map((c, i) => ({ c, i, s: partScore(c) }));
    const rankedParts = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.c);
    const farParts = scored.filter((x) => x.s <= 0).map((x) => x.c);
    const critA = P;
    const critB = rankedParts[1]?.name || sectorMetrics[0] || 'the outcome you care about';
    const partWords = (n) => (0, dealtext_ts_1.joinList)(rankedParts.slice(0, n).map((x) => x.name), 'or');
    const bestPainFor = (c) => { let best = -1, bs = 0; pains.forEach((p, i) => { const f = (0, rw_kit_ts_1.fit)(`${c.name} ${c.desc}`, p, skipP); if (f.w >= 1 && f.s > bs) {
        bs = f.s;
        best = i;
    } }); return best; };
    const qs = (items) => items.filter(Boolean).map((x) => `- ${x}`).join('\n');
    // ---- gaps first ----
    const GAP_QUESTIONS = [
        [/economic buyer|budget owner|sign/i, isSigner ? `Do you sign off a purchase like ${P}${inInd} yourself, and who else has to agree?` : `Who signs off a purchase like ${P}${inInd}, and have they seen ${X} first-hand?`],
        [/decision process|process|approval/i, `What steps does a decision on ${critA} go through here, and who is involved at each step?`],
        [/budget/i, `Is there budget this year for ${critA}, and which line does it sit under?`],
        [/criteria/i, `How will you compare the options for ${critA}: what has to be true for a yes?`],
        [/paper|legal|procurement|contract/i, `What do legal, security and procurement need to see before ${P} can be signed, and how long do they usually take?`],
        [/timeline|timing|critical event|deadline|when/i, `What happens if ${X} is not fixed by the end of the quarter?`],
        [/champion/i, `Who besides you wants ${X} fixed, and what would they gain?`],
        [/competi|alternative/i, `What else are you considering for ${critA}, including doing nothing?`],
        [/metric|baseline|number/i, `How do you measure ${M1} today?`],
    ];
    const gaps = d.splitItems(gapsToFill);
    const gapRows = gaps.map((g) => { const m = GAP_QUESTIONS.find(([re]) => re.test(g)); return `- **${d.cap(g)}:** ${m ? m[1] : `Can you walk me through ${low(g)} for ${critA}?`}`; });
    const gapSection = gaps.length ? `## Gaps to fill first\n\nYou said these are still open, so ask about them before anything else:\n${gapRows.join('\n')}\n\n---\n\n` : '';
    // ---- the opening, by stage ----
    const OPEN = {
        first_call: [
            `Thanks for the time. Before I say anything about ${P}, I would like to hear how ${XL} shows up in your week.`,
            `What made you take a call about ${critA}?`,
            `I will leave time at the end to say what ${P} does and whether it fits.`
        ],
        discovery: [
            `I would like to go deep on ${XL}: where it starts, who it touches and what it costs${v && !sellerSw ? `, in terms of ${Mlist}` : ''}.`,
            `Who else should be part of this conversation about ${critA}${roleTxt ? `, besides ${youRole}` : ''}?`
        ],
        deep_dive: [
            `We have covered ${XL}. Today I would like to test it against the detail of ${critA}${rankedParts[1] ? ` and ${rankedParts[1].name}` : ''}.`,
            `What has changed since we last spoke about ${critA}?`
        ],
        technical: [
            `I would like to understand the systems around ${critA}: where the data lives, what has to connect, and who owns each link.`,
            `Who from your technical side should be in the room for ${rankedParts[1]?.name || critA}?`
        ],
        executive: [
            `I will keep this to the outcome. ${(0, rw_kit_ts_1.upFirst)(X)} is the problem; what would ${youRole} need to see to back a change in ${critA}?`,
            `${v && !sellerSw ? `Which of ${Mlist} do you answer for, and to whom?` : 'Which number do you answer for, and to whom?'}`
        ],
    };
    const openSection = `## Opening for a ${dealStage.replace(/_/g, ' ')} conversation\n\nSay it in your own voice:\n${qs(OPEN[dealStage] || OPEN.discovery)}\n\n---\n\n`;
    // ---- the prospect's role: built from the pain, the parts and the industry ----
    const roleKnown = !!roleKnow && roleFam !== 'other';
    const roleOwn = prospectRole ? [
        pains.length ? `${(0, rw_kit_ts_1.upFirst)(asRole)}${inInd}, which of the numbers you answer for does ${X} move, and by how much?` : `${(0, rw_kit_ts_1.upFirst)(asRole)}${inInd}, which numbers do you answer for in ${critA}, and to whom?`,
        rankedParts.length >= 2 ? `Which of ${partWords(2)} would matter most to ${youRole}${inInd}, and why?` : rankedParts.length ? `How would ${rankedParts[0].name} matter to ${youRole}${inInd}, and what would it need to do first to earn its place?` : '',
        `Who do you turn to first when this goes wrong${inInd}, and what do they say?`,
    ] : [];
    const roleSection = prospectRole ? `## Questions for ${prospectRole}\n\n${roleKnown ? `${(0, rw_kit_ts_1.upFirst)(plural ? roleKnow.label + 's' : (0, dealtext_ts_1.aAn)(roleKnow.label))} ${plural ? 'care' : 'cares'} about ${roleKnow.cares}, and ${plural ? 'worry' : 'worries'} about ${roleKnow.worry}.\n\n` : ''}${qs([...roleOwn, ...(roleKnown ? roleKnow.questions : [])])}\n\n${roleKnown ? `**What they need to see before they say yes:** ${roleKnow.needs}.\n\n` : ''}---\n\n` : '';
    const lensSection = lens ? `## Questions for a buyer in ${lens.name}\n\n${qs(lens.checks)}\n\nTheir words: ${lens.words.join(', ')}. Use the ones that are true for this prospect.\n\n---\n\n` : '';
    // a software seller's own activation and expansion questions do not suit a finance, security or IT leader who is buying from it
    const sectorFits = !(v && v.id === 'saas' && (sellerSw || ['finance', 'security', 'risk', 'it', 'engineering', 'procurement'].includes(roleFam)));
    const sectorSection = v ? `## Questions in the language of ${v.name}\n\n${sectorFits ? qs(v.discovery) : `The usual ${v.name} questions are about a software company's own customers. They do not fit ${sellerSw ? `a buyer in ${indLow}` : roleKnow ? (0, dealtext_ts_1.aAn)(roleKnow.label) : 'a buyer in this role'}, so use the questions above and below.`}\n\n---\n\n` : '';
    // ---- the pains, one statement at a time ----
    const painShells = [
        (r, m) => `On ${r}: where does it start, who deals with it, and ${m ? `which of ${m} does it show up in first` : 'what does it cost in time, money or risk'}?`,
        (r) => `On ${r}: what have you tried so far, and what stopped it from holding?`,
        (r) => `On ${r}: how is it tracked today, and who would notice first if it went away?`,
        (r) => `On ${r}: which team lives with it every week, and what do they do about it today?`,
        (r) => `On ${r}: has it got better or worse over the last year, and what changed?`,
        (r) => `On ${r}: who outside your own team notices it, and what do they say?`,
        (r) => `On ${r}: what would be different for the people involved in the first three months after it was gone?`,
    ];
    const painLines = pains.map((p, i) => painShells[i % painShells.length](pRef(i), v && !sellerSw ? (0, dealtext_ts_1.joinList)(d.rankMeasures(v.metrics, p, '').slice(0, 2), 'or') : ''));
    const painSection = knownPainPoints ? `## Questions on the pain you described\n\n${qs([...painLines, pains.length > 1 ? `Of ${pains.length === 2 ? 'the two' : `the ${pains.length}`} problems above, which hurts most, and which would ${signerThe} fix first if only one could be fixed?` : ''])}\n\n---\n\n` : '';
    // ---- the product's parts ----
    // the kind of a part decides what is worth asking about it
    const partKind = (c) => {
        const n = `${c.name} ${c.desc}`.toLowerCase();
        if (/\b(?:api|sdk|sdks|cli|server|plugins?|integrations?|connectors?|runners?|webhooks?|agents?|models?|engine|images?|dashboard|portal|app|apps|hosted|self hosted|on premise|cloud)\b/.test(n))
            return 'tech';
        if (/optimi[sz]ation|autoscal|analytics|reporting|monitor|forecast|scor(?:e|ing)|insight|benchmark|audit|reconcil|matching|capture/.test(n))
            return 'measure';
        if (/training|simulation|coaching|onboarding|support|services?|operations|advisory|consult|managed|marketing|content|creative|workflow|journeys?/.test(n))
            return 'people';
        return 'other';
    };
    const kindCount = { tech: 0, measure: 0, people: 0, other: 0 };
    const partShell = (c, i) => {
        const pi = bestPainFor(c);
        const said = c.desc && !/^(?:that|which|for|as)\s/i.test(c.desc) ? ` (${c.desc})` : c.desc ? ` ${c.desc}` : '';
        const head = `${(0, rw_kit_ts_1.upFirst)(c.name)}${said}`;
        if (pi >= 0 && i % 2 === 0)
            return `${head}: on ${pShort(pi)}, which step does it touch, who does that step today, and with what?`;
        const k = partKind(c), n = kindCount[k]++;
        const V = {
            tech: [`what would it have to connect to in what you run today, and who would set it up and look after it?`, `which of your current systems or data would it need access to, and who approves that?`, `who on your side would try it first, and what would make them keep using it?`],
            measure: [`how is this done today, and what does it cost you in time or money each month?`, `which number tells you it is working, and who looks at that number?`],
            people: [`who would use it day to day, and what would they do differently in the first week?`, `which team would feel the change most, and what are they worried about?`],
            other: [`what would you need to see working before you trusted it?`, `what do you use for it today, and what would you want it to do that it does not?`, `who would decide whether it stays, and on what evidence?`],
        };
        return `${head}: ${V[k][n % V[k].length]}`;
    };
    // the parts that touch a pain, then the first three the description lists (the product's own headline parts), at most six
    const isMode = (c) => /^(?:hosted|self[- ]hosted|deployed|available|running|run|delivered|cloud)\b/i.test(c.name);
    const headline = [...product.caps.filter((c) => !isMode(c)).slice(0, 3), ...product.caps.filter((c) => !isMode(c)).slice(3).filter((c) => /\b(?:ai|agents?|copilot|assistant)\b/i.test(c.name))];
    const allParts = [...rankedParts, ...headline.filter((x) => !rankedParts.includes(x)), ...farParts.filter((x) => !headline.includes(x))];
    const shownParts = allParts.slice(0, Math.max(3, Math.min(rankedParts.length + headline.filter((x) => !rankedParts.includes(x)).length, 6)));
    const notAsked = allParts.filter((x) => !shownParts.includes(x));
    const partSection = shownParts.length || notAsked.length ? `## Questions on what ${P} covers\n\n${shownParts.length ? `One question for each part, the ones closest to the pain you gave first.\n\n${qs(shownParts.map(partShell))}\n\n` : ''}${notAsked.length ? `Parts not asked about${knownPainPoints ? ' (they do not touch the pain you gave as closely)' : ''}: ${notAsked.map((x) => x.name).join('; ')}.\n\n` : ''}---\n\n` : '';
    // ---- the framework sections, each question written from the inputs ----
    const metricsQs = knownMetrics ? (noMetrics
        ? [`No metrics are known yet. How do you measure ${M1} today, and who owns that number?`]
        : [`You said "${low((0, dealtext_ts_1.clip)(knownMetrics, 120)).replace(/"/g, "'")}". How is that measured today, how often, and what would ${X} do to it?`]) : [`How do you measure ${M1} today, and who owns that number?`];
    const painIQs = pains.length ? pains.slice(0, 3).flatMap((p, i) => (i === 0
        ? [`On ${pRef(i)}: who feels it most, and what does it cost them?`, `On ${pShort(i)}: what happens each week that it stays that way?`]
        : [`On ${pRef(i)}: ${i === 1 ? 'who first raised it, and why then?' : 'what does it cost, and who owns it?'}`])) : [`What is not working today in ${critA}${inInd}?`];
    const heading = (t, items) => `### ${t}\n\n${qs(items)}`;
    const ebQs = isSigner
        ? [`${(0, rw_kit_ts_1.upFirst)(asRole)} do you sign off a purchase like ${P}${inInd} yourself, or does a board, a committee or an owner have the last word?`, `Who else has to agree before ${P} can be signed: ${otherTxt}?`, `What would you need to see from ${P} to say yes yourself?`]
        : [`Who signs off a purchase like ${P}${inInd}, and have they seen ${X} first-hand?`, `What would ${signerThe} need to see to move forward on ${P}?`, `Can we include ${signerThe} in the next conversation about ${critA}?`];
    const champQs = isSigner
        ? [`Besides you, who would carry ${P} inside${inInd}: ${otherTxt}?`, `If I gave you a business case for ${P}, who would you take it to first?`, `What would that person need from us to push for ${critA}?`]
        : [`Besides ${youRole}, who else wants ${X} fixed${otherRoles.length ? `: ${otherTxt}` : ''}?`, `If I gave you a business case for ${P}, would you take it to ${signerThe}?`, `What would that person need from us to push for ${critA}?`];
    const meddpicc = `## MEDDPICC questions\n\n` + [
        heading('M: Metrics', [...metricsQs, `If ${X} were fixed, which of ${Mlist} would move first, and by how much would it have to move to matter to ${youRole}?`, `What does ${X} cost each month today in time, money or risk, and how did you arrive at that figure?`]),
        heading('E: Economic buyer', ebQs),
        heading('D: Decision criteria', [rankedParts.length >= 2 ? `Which of ${partWords(3)} would be a must-have for ${youRole}, and which would be nice to have?` : `What would be a must-have in ${critA} for ${youRole}, and what would be nice to have?`, `How much weight do you give ${M1} when you compare options for ${critA}?`, `What would make you drop an option for ${critA}?`]),
        heading('D: Decision process', [`What steps does a decision on ${critA} go through${inInd}, and who is involved at each step?`, `What date are you working back from to have ${X} fixed, and what happens if it slips?`]),
        heading('P: Paper process', [`What do legal, security and procurement need to see before ${P} can be signed, and how long does each take?`, rankedParts.length >= 2 ? `Which of ${partWords(2).replace(' or ', ' and ')} would those reviewers look at hardest?` : `What would those reviewers look at hardest in ${critA}?`]),
        heading('I: Identify pain', painIQs),
        heading('C: Champion', champQs),
        heading('C: Competition', [`What do you use today for ${critA}, and what do you like about it?`, `Have you considered building this yourselves, or leaving it as it is?`, `Which other vendors are you speaking to about ${critA}?`]),
    ].join('\n\n');
    const bant = `## BANT questions\n\n` + [
        heading('B: Budget', [`Is there budget this year for fixing ${X}, and which line does it sit under?`, `What do you spend today on ${critA}, including your team's time?`, isSigner ? `Is the budget for a purchase like ${P}${inInd} yours to release, or does someone else hold it?` : `Who controls the budget for a purchase like ${P}${inInd}: ${signerThe}?`]),
        heading('A: Authority', [`What is your part in choosing ${critA}${inInd}?`, `Who signs off on ${critA}${inInd}, and who else must agree${otherRoles.length ? `: ${otherTxt}` : ''}?`, `What would you need in order to recommend ${P} internally?`]),
        heading('N: Need', pains.length ? pains.slice(0, 3).map((p, i) => `On ${pShort(i)}: how many people or processes does it affect, and what does it cost?`) : [`What drives your interest in ${critA} now, and how does it rank among ${youRole === 'you' ? 'your' : 'the'} priorities?`]),
        heading('T: Timeline', [`What happens if ${X} is not fixed by the end of the quarter?`, `Is there a date or an event that you are working back from for ${critA}?`]),
    ].join('\n\n');
    const spiced = `## SPICED questions\n\n` + [
        heading('S: Situation', [`How do you handle ${critA} today, who is involved, and with which tools?`, rankedParts.length >= 2 ? `Which of ${partWords(3).replace(/ or ([^ ]+(?: [^ ]+)*)$/, ' and $1')} is already in place${inInd}?` : `What is already in place for ${critA}${inInd}?`]),
        heading('P: Pain', pains.length ? pains.slice(0, 3).map((p, i) => `On ${pShort(i)}: where does it break down, and who feels it first?`) : [`Where does ${critA} break down today, and who feels it first?`]),
        heading('I: Impact', [`If ${X} were fixed, which of ${Mlist} would change, and what would that be worth to ${youRole}?`, `What would success on ${critA} look like in a year?`]),
        heading('C: Critical event', [`What date or event makes ${critA} urgent now?`, `What is the cost of delay on ${X}?`]),
        heading('E: Event and decision', [`How will you compare options for ${critA}, and who decides?`, `What could speed up or slow down a decision on ${P}?`]),
        heading('D: Decision criteria', [`How important is ${critB} to you when you choose?`, `Is there a deal-breaker on ${critA} that we should know about?`]),
    ].join('\n\n');
    const pilotQ = `What would a first pilot of ${P} have to show for you to go further?`;
    const challenger = `## Challenger questions\n\n` + [
        heading('Teach', [pains.length ? `You described ${X}. Where does it start: before the work reaches your team, inside it, or at the handover?` : `Where does the problem in ${critA} start: before the work reaches your team, inside it, or at the handover?`, `Which of ${Mlist} would move first if it were fixed?`, ...(v ? [`If you hold data on ${M1} across your customers, open with the pattern it shows, with its source and period. If a before-and-after exists (${d.proofOf(v)}), tell it in two sentences and name what changed. If you cannot show an insight, ask the question instead.`] : [])]),
        heading('Tailor', [`Where does ${X} cost ${youRole} most?`, `How would ${signerThe} react to seeing ${M1} next to ${critA}?`, `What is different about your situation${inInd} that we should factor in?`]),
        heading('Take control', [`Given ${X}, I would start with ${critA}. Who needs to be in that conversation?`, pilotQ, `What would need to be true for ${youRole} to try ${P}?`]),
    ].join('\n\n');
    const gapSelling = `## Gap Selling questions\n\n` + [
        heading('Current state', [`Walk me through how ${critA} runs today: who does each step and with which tools?`, `How does ${X} show up in ${M1} today?`]),
        heading('Future state', [`If ${X} were gone a year from now, what would ${youRole} be doing differently?`, `How would you measure that: ${Mlist}?`]),
        heading('The gap', [`What does the gap between today and that cost each quarter, in terms of ${M1}?`, `Who else feels the gap in ${critA}, and what do they lose?`]),
        heading('Problems behind the problem', [`Why do you think ${X} happens, and what have you tried to fix it?`, `What in your systems or process makes it hard to fix${rankedParts[0] ? `, starting with ${rankedParts[0].name}` : ''}?`]),
    ].join('\n\n');
    // ---- the close, by stage ----
    const CLOSE = {
        first_call: `Would a second call about ${critA} with ${signerThe === 'you' ? 'the people who decide' : signerThe} in it make sense?`,
        discovery: `I would suggest we put a baseline on ${M1} before the next call. Who can give it to us?`,
        deep_dive: `Shall we agree what a pilot of ${critA} must show before anyone commits?`,
        technical: `Who owns the systems around ${critA}, and can they join the next call?`,
        executive: `What would you need from us to take ${P} to a decision on ${critA}?`,
    };
    const closeSection = `## Closing the call\n\n${qs([
        `Here is what I heard: ${pains.length > 1 ? `${pains.length} problems with ${critA}` : pains.length ? 'one problem with ' + critA : `the problem with ${critA}`}${knownMetrics && !noMetrics ? `, measured today as "${low((0, dealtext_ts_1.clip)(knownMetrics, 100)).replace(/"/g, "'")}"` : ''}${roleTxt ? `, and it sits with ${youRole}` : ''}. Have I got that right?`,
        gaps.length ? `The open points are ${(0, dealtext_ts_1.joinList)(gaps.map((g) => low(g)))}. Who can I speak to about each one?` : `What should I have asked about ${critA} and did not?`,
        CLOSE[dealStage] || CLOSE.discovery
    ])}\n\n---\n\n`;
    const objSection = v ? `## If you hear an objection\n\n${qs(v.objections.map((o) => `If you hear "${low(o.objection)}": ${o.response}`))}\n\n---\n\n` : '';
    // ---- what was not given, once, at the end ----
    const sharpen = [];
    if (!prospectIndustry)
        sharpen.push('prospect_industry (it would add the questions a buyer in that industry asks of any vendor)');
    if (!prospectRole)
        sharpen.push('prospect_role (it would add the section for the person you meet and decide whether they sign)');
    if (!knownPainPoints)
        sharpen.push('known_pain_points (it would turn the questions from the area to the pain, one statement at a time)');
    if (!yourSolution)
        sharpen.push('your_solution (it would add a question on each part of the product, closest to the pain first)');
    else if (product.caps.length < 2)
        sharpen.push('your_solution (list the parts of the product with a few words on what each does; it would add a question on each part)');
    if (!knownMetrics)
        sharpen.push('known_metrics (it would replace the sector\'s usual measure with the number the prospect gave)');
    const sharpenLine = sharpen.length ? `To sharpen this, give: ${sharpen.join('; ')}.\n\n` : '';
    const painContext = pains.length > 1 ? `- **Known Pain Points:**\n${pains.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}\n` : knownPainPoints ? `- **Known Pain Points:** ${knownPainPoints}\n` : '';
    const kindLine = product.kind && !(0, rw_kit_ts_1.wordsOf)(product.kind, false).every((w) => (0, rw_kit_ts_1.wordsOf)(P, false).includes(w)) ? `, ${product.kind}` : '';
    const solutionLine = yourSolution ? `${P}${kindLine}${product.caps.length >= 2 ? `. Parts: ${product.caps.map(rw_kit_ts_1.capText).join('; ')}` : ''}` : 'not given';
    let output = `# Discovery Question Bank

## Context
- **Prospect Industry:** ${prospectIndustry || 'not given'}
- **Contact Role:** ${prospectRoleTyped || 'not given'}
- **Deal Stage:** ${dealStage.replace(/_/g, ' ')}
- **Solution:** ${solutionLine}
${painContext}${knownMetrics ? `- **Known Metrics:** ${knownMetrics}\n` : ''}${gapsToFill ? `- **Information Gaps:** ${gapsToFill}\n` : ''}
${ctx.line}

---

${openSection}${gapSection}${roleSection}${lensSection}${sectorSection}${painSection}${partSection}`;
    if (framework === 'meddpicc' || framework === 'all')
        output += meddpicc + '\n\n---\n\n';
    if (framework === 'bant' || framework === 'all')
        output += bant + '\n\n---\n\n';
    if (framework === 'spiced' || framework === 'all')
        output += spiced + '\n\n---\n\n';
    if (framework === 'challenger' || framework === 'all')
        output += challenger + '\n\n---\n\n';
    if (framework === 'gap_selling' || framework === 'all')
        output += gapSelling + '\n\n---\n\n';
    output += `${closeSection}${objSection}${v ? `${sellerSw ? `### Sector notes: ${v.name}\n- The notes for this sector describe a software company's own customers, so they are left out for a buyer in ${indLow}.` : d.sectorNotes(v, 'committee')}\n\n` : ''}${sharpenLine}${d.footer}`;
    return output;
}
//# sourceMappingURL=rw-discovery.js.map