"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAccountPlan = buildAccountPlan;
// Run 22: account_plan_builder, rewritten. The plan is written from the inputs: who decides (one row per contact, with what each cares about),
// where the account can grow (the parts of the product against the account's own pain), the alternatives it uses today (a different question
// for each), an answer for each objection, and 90 days built from all of that. Tier and expansion potential keep the old rule on ARR (D80).
// Nothing here states a fact about the user's product or the account that was not typed (rule B82); what was not given is listed once, at the end.
const dealtext_ts_1 = require("./dealtext.js");
const answers_ts_1 = require("./answers.js");
const verticals_ts_1 = require("./verticals.js");
const rw1_common_ts_1 = require("./rw1-common.js");
const HYPOTHETICAL = /\s*All figures in this input are hypothetical[^.]*\.\s*/i;
/** The sentence of a note, quoted whole: never cut inside a clause. */
function noteSentences(note) {
    return (0, dealtext_ts_1.sentences)(note.replace(HYPOTHETICAL, ' ').trim()).map(rw1_common_ts_1.stripEnd).filter(Boolean);
}
function buildAccountPlan(args, d) {
    const str = (k) => (typeof args[k] === 'string' ? args[k].trim() : '');
    const accountName = str('account_name') || 'Target Account';
    const industryIn = str('industry');
    const arrGiven = typeof args.current_arr === 'number' && Number.isFinite(args.current_arr);
    const arr = arrGiven ? args.current_arr : 0;
    const contactsText = str('known_contacts');
    const productsIn = str('current_products');
    const expansionIn = str('expansion_opportunities');
    const threatsIn = str('competitive_threats');
    const solutionIn = str('your_solution');
    const notesIn = str('account_notes');
    const ctx = d.readContext(undefined, { seller: [solutionIn || 'your solution'], context: [productsIn, notesIn, contactsText], buyer: [industryIn] });
    const v = ctx.v;
    const investment = ctx.model === 'investment';
    const brief = (0, rw1_common_ts_1.briefOf)(solutionIn, [accountName, productsIn, notesIn, contactsText, threatsIn]);
    const unit = (0, rw1_common_ts_1.usageUnit)(solutionIn, notesIn, threatsIn);
    const model = unit && (ctx.model === 'saas' || !ctx.model) ? 'transactions' : ctx.model;
    const ctxLine = unit && model !== ctx.model ? (0, rw1_common_ts_1.usageLine)(ctx.line, unit) : ctx.line;
    const P = brief.short || 'your solution';
    const parts = (0, rw1_common_ts_1.partsOf)(brief);
    const shortParts = parts.filter((p) => p.split(/\s+/).length <= 6);
    const industry = (0, rw1_common_ts_1.cleanIndustry)(industryIn) || (0, rw1_common_ts_1.cleanIndustry)((0, rw1_common_ts_1.industryFromTitle)(accountName));
    const buyerCtx = (0, verticals_ts_1.buyerContextFor)(industryIn, (0, rw1_common_ts_1.industryFromTitle)(accountName));
    const mw = (0, rw1_common_ts_1.modelWords)(model, solutionIn, unit || undefined);
    const contacts = (0, dealtext_ts_1.parseContacts)(contactsText, investment).map((c) => ({ ...c, raw: c.raw.replace(/^(?:and|or)\s+/i, ''), title: c.title.replace(/^(?:and|or)\s+/i, '') }));
    const metric = v ? v.metrics[0] : '';
    // ---- the tier rule on ARR (unchanged, D80) ----
    let tier = 'Prospect';
    let potential = 'High';
    if (arr > 500000) {
        tier = 'Strategic';
        potential = 'Very High';
    }
    else if (arr > 100000) {
        tier = 'Enterprise';
        potential = 'High';
    }
    else if (arr > 25000) {
        tier = 'Growth';
        potential = 'Medium';
    }
    else if (arr > 0) {
        tier = 'SMB';
        potential = 'Medium';
    }
    const existing = arr > 0;
    // ---- the notes: objections (after "Objections:") and the rest ----
    const m = notesIn.match(/objections?\s*:\s*([\s\S]*)$/i);
    const objections = m ? d.splitItems(m[1].replace(/[.]+\s*$/, '')) : [];
    const noteRest = m ? notesIn.slice(0, m.index).trim() : notesIn;
    const hypothetical = HYPOTHETICAL.test(notesIn);
    const noteLines = noteSentences(noteRest);
    // ---- the people ----
    const champ = contacts.find((c) => (0, dealtext_ts_1.tagKind)(c.tag) === 'champion');
    const buyerContacts = contacts.filter((c) => ['buyer', 'economic'].includes((0, dealtext_ts_1.tagKind)(c.tag) || ''));
    const buyer = buyerContacts[0];
    const rctx = { P, v, metric };
    const sig = (s) => s.toLowerCase().split(/[^a-z0-9]+/).map((w) => ({ cfo: 'financial', coo: 'operating', cio: investment ? 'investment' : 'information', cto: 'technology', ciso: 'security' }[w] || w)).filter((w) => w.length > 1 && !['chief', 'officer', 'head', 'of', 'manager', 'lead', 'and', 'the', 'senior', 'sr', 'vp', 'director', 'team', 'teams'].includes(w));
    const covered = new Set(contacts.flatMap((c) => sig(c.title)));
    const uncovered = v ? v.buyerRoles.filter((role) => !sig(role).some((w) => covered.has(w))) : [];
    const partWord = (c) => {
        const k = (0, dealtext_ts_1.tagKind)(c.tag);
        if (k === 'champion')
            return 'Champion, as you said';
        if (k === 'economic')
            return 'Economic buyer, as you said';
        if (k === 'buyer')
            return 'Buyer: the person who signs, as you said';
        if (k === 'blocker')
            return 'Blocker, as you said';
        if (k === 'user')
            return 'User, as you said';
        if (k === 'influencer')
            return `Influencer or evaluator, as you said (${c.tag})`;
        return `${(0, rw1_common_ts_1.readRole)(c, null, rctx, investment).part}, read from the title`;
    };
    const usedCares = new Map();
    const usedStep = new Map();
    const rows = contacts.map((c) => {
        const k = (0, dealtext_ts_1.tagKind)(c.tag);
        const r = (0, rw1_common_ts_1.readRole)(c, null, rctx, investment);
        const base = (0, answers_ts_1.roleFor)(c.title, investment);
        let step = r.step;
        if (k === 'champion')
            step = `${r.step}; then give them a one page case to forward to ${buyer ? buyer.title : 'the person who signs'}`;
        else if (k === 'buyer' || k === 'economic')
            step = `${r.step}. Their worry is ${base.worry}`;
        else if (k === 'blocker')
            step = `Find out what they fear (${base.worry}) and answer it in writing before the proposal`;
        const caresCell = usedCares.has(r.cares) ? `Like ${usedCares.get(r.cares)}: ${r.cares}` : (0, dealtext_ts_1.upperFirst)(r.cares);
        if (!usedCares.has(r.cares))
            usedCares.set(r.cares, c.title);
        const stepCell = usedStep.has(step) ? `As with ${usedStep.get(step)}, for their own part: ${(0, rw1_common_ts_1.lowerStart)(step)}` : step;
        if (!usedStep.has(step))
            usedStep.set(step, c.title);
        return `| ${c.raw} | ${partWord(c)} | ${caresCell} | ${stepCell} |`;
    });
    const hasChampion = !!champ || /champion/i.test(contactsText);
    const hasBuyer = buyerContacts.length > 0 || /economic buyer|budget|cfo|ceo|coo/i.test(contactsText);
    // ---- the alternatives and the objections ----
    const threats = (0, rw1_common_ts_1.readThreats)(d.splitItems(threatsIn));
    const expansion = d.splitItems(expansionIn);
    const qa = { P, parts, model, sellerText: solutionIn, unit: unit || undefined, v, needs: [], alternatives: threats.map((t) => t.text) };
    const answers = (0, rw1_common_ts_1.dedupeAnswers)(objections.map((o) => ({ text: o, a: (0, rw1_common_ts_1.answerQuestion)(o, qa) })));
    // ---- the parts of the product against the account's own pain ----
    const partFor = (text) => {
        let best = '';
        let n = 0;
        for (const p of parts) {
            const s = (0, rw1_common_ts_1.shared)(text, p);
            if (s > n) {
                n = s;
                best = p;
            }
        }
        return best;
    };
    const pairs = threats.map((t) => ({ t, part: partFor(t.text) })).filter((x) => x.part);
    const sponsorOf = (text) => {
        let best;
        let n = 0;
        for (const c of contacts) {
            const s = (0, rw1_common_ts_1.shared)(text, `${c.title} ${(0, rw1_common_ts_1.readRole)(c, null, rctx, investment).cares}`);
            if (s > n) {
                n = s;
                best = c;
            }
        }
        return best;
    };
    // ---- dates ----
    const today = new Date();
    const dayX = (n) => (0, dealtext_ts_1.isoDate)((0, dealtext_ts_1.onOrBeforeWorkday)(new Date(today.getTime() + n * 24 * 60 * 60 * 1000)));
    const out = [];
    out.push(`# Strategic account plan: ${accountName}`);
    // ---- in brief ----
    const who = existing
        ? `${(0, dealtext_ts_1.upperFirst)(accountName)} is an existing account${industry ? ` in ${industry}` : ''} with annual recurring revenue of ${d.money(arr)}`
        : `${(0, dealtext_ts_1.upperFirst)(accountName)} is a prospect${industry ? ` in ${industry}` : ''}${arrGiven ? ' (the annual recurring revenue you gave is 0)' : ''}`;
    const sells = solutionIn ? (brief.short ? ` This plan is about ${existing ? 'growing it' : 'winning it'} with ${P}${brief.kind ? `, which ${(0, dealtext_ts_1.describeWith)((0, rw1_common_ts_1.cleanBrief)(brief))}` : ''}.` : ` This plan is about ${existing ? 'growing it' : 'winning it'}; what you sell, in your words, is ${(0, rw1_common_ts_1.sellerWords)(brief)}.`) : '';
    const tierLine = `By this tool's rule on ARR alone the account sits in the ${tier} tier with ${potential.toLowerCase()} expansion potential; that is a rule on the number, not a view of the account.`;
    const brief1 = [`${who}.${sells}`, tierLine, ...(hypothetical ? ['Your notes mark the figures as hypothetical, so treat the ARR and the tier as test figures.'] : []), ...(noteLines.length ? [`Your notes add: ${noteLines.map(rw1_common_ts_1.quoted).join(' ')}`] : [])];
    const facts = [`| **Account** | ${accountName} |`, ...(industryIn ? [`| **Industry** | ${industryIn.replace(/_/g, ' ')} |`] : []), `| **Account Tier** | ${tier} (set by this tool's rule from Current ARR) |`, ...(arrGiven ? [`| **Current ARR** | ${d.money(arr)} |`] : []), `| **Expansion Potential** | ${potential} (set by this tool's rule from Current ARR, not from your notes) |`];
    out.push(`## The account in brief\n\n${brief1.join(' ')}\n\n| Attribute | Value |\n|-----------|-------|\n${facts.join('\n')}\n\n${ctxLine}`);
    if (buyerCtx)
        out.push(`For a buyer in ${buyerCtx.name}, expect this. ${buyerCtx.reviews} ${buyerCtx.buying}`);
    // ---- who decides ----
    const people = ['## Who decides and who influences'];
    if (contacts.length) {
        people.push(`Each contact you gave is one row, with the part you stated for them; where you stated none, the part is read from the title and says so.\n\n| Contact you gave | Part in the decision | What they care about | Next step |\n|---|---|---|---|\n${rows.join('\n')}`);
    }
    const gaps = [];
    if (!hasChampion)
        gaps.push(`Find a champion first: the person who feels the problem and is measured on it${v ? ` (in ${v.name}: ${(v.committee.split(';').find((x) => /champion/i.test(x)) || v.committee.split(';')[1] || v.committee).trim().replace(/[.]+$/, '')})` : ''}.`);
    if (!hasBuyer)
        gaps.push(`Find out who signs this off and who controls the budget${v ? ` (in ${v.name}: ${v.committee.split(';')[0].trim().replace(/[.]+$/, '')})` : ''}.`);
    if (v)
        gaps.push(`Usual buying committee (${v.name}): ${v.committee}${uncovered.length ? ` None of your contacts covers ${(0, dealtext_ts_1.joinList)(uncovered.slice(0, 4))}, so ask the champion who holds each part here.` : ''}`);
    if (gaps.length)
        people.push(gaps.join(' '));
    out.push(people.join('\n\n'));
    // ---- where to grow ----
    const grow = ['## Where the account can grow'];
    const footprint = productsIn ? `They use ${productsIn} today (in your words). ` : '';
    if (parts.length) {
        grow.push(`${footprint}${P} lists these parts: ${(0, dealtext_ts_1.joinList)(parts)}. ${productsIn ? 'The description does not say which of them the account already runs, so the first conversation is to find out; each part they do not use is whitespace.' : existing ? 'Find out which of them the account already runs; each part they do not use is whitespace.' : `Land with the part that answers the account's sharpest pain, then widen.`}`);
        if (pairs.length)
            grow.push(`Where the account's own pain points to a part:\n\n${pairs.map((x) => `- ${(0, rw1_common_ts_1.quoted)(x.t.text)} points to ${x.part}.`).join('\n')}`);
        else if (threats.length)
            grow.push(`None of the parts maps cleanly onto the alternatives you listed, so ask the champion which problem they would hand over first and start with the part that answers it.`);
    }
    else {
        grow.push(`${footprint}${existing ? `Find out what exactly the account uses of ${P} today and what it still does by other means; the gap between the two is the whitespace.` : `Choose the part of ${P} that answers the account's sharpest pain and land with that.`}`);
    }
    if (expansion.length) {
        grow.push(`The expansion areas you named, with the person most likely to sponsor each and the proof to ask for:\n\n${expansion.map((e) => {
            const s = sponsorOf(e);
            const part = partFor(e);
            return `- **${(0, dealtext_ts_1.upperFirst)((0, rw1_common_ts_1.stripEnd)(e))}**: ${s ? `the likely sponsor is ${s.title}` : 'ask the champion who would sponsor it'}${part && !e.toLowerCase().includes(part.toLowerCase()) ? `; it draws on ${part}` : ''}.`;
        }).join('\n')}`);
    }
    grow.push(v ? `Prove the first step before you ask for the next. In ${v.name}, buyers trust this form of proof: ${(0, rw1_common_ts_1.lowerStart)(v.proofShape).replace(/[.]+$/, '')}.` : `Prove the first step before you ask for the next: a before and after on one team, measured on a number the account already tracks.`);
    out.push(grow.join('\n\n'));
    // ---- alternatives ----
    const comp = ['## Alternatives and competition'];
    if (threats.length) {
        const groups = [];
        for (const t of threats) {
            const g = t.id === 'general' ? undefined : groups.find((x) => x[0].id === t.id);
            if (g)
                g.push(t);
            else
                groups.push([t]);
        }
        comp.push(groups.map((g) => g.length === 1
            ? `**${(0, rw1_common_ts_1.quoted)(g[0].text)}**\n- What it tells you: ${g[0].tells}.\n- Ask: "${g[0].ask}"\n- Prove: ${g[0].prove}.`
            : `**${(0, dealtext_ts_1.joinList)(g.map((t) => (0, rw1_common_ts_1.quoted)(t.text)))}** are the same kind of alternative.\n- What it tells you: ${g[0].tells}.\n${g.map((t) => `- Ask about ${(0, rw1_common_ts_1.quoted)(t.text)}: "${t.ask}"`).join('\n')}\n- Prove: ${g[0].prove}.`).join('\n\n'));
        comp.push(`Put the account's own problem first, in its words, before any feature; agree the measure of success before the evaluation${v ? ` (in ${v.name}: ${(0, rw1_common_ts_1.some)(v.metrics, 2)})` : ''}; and let the gap show in their own test, not in your claim.`);
    }
    else {
        comp.push(`Find out what the account does today, including doing it by hand: ask who else solves this problem for them, what has worked and not worked, and what would have to change for them to look at another way.`);
    }
    out.push(comp.join('\n\n'));
    // ---- objections ----
    if (answers.length) {
        out.push(`## Objections to expect\n\n${answers.map((x, i) => `### ${i + 1}. ${(0, rw1_common_ts_1.quoted)(x.text)}\n${x.a.answer}\n- **Confirm before you say it:** ${(0, rw1_common_ts_1.stripEnd)(x.a.bring)}.${x.a.ask ? `\n- **Ask first:** "${x.a.ask}"` : ''}`).join('\n\n')}`);
    }
    // ---- 90 days ----
    const ask = new Map();
    const meet = contacts.filter((c) => c.level !== 'group' && (0, rw1_common_ts_1.readRole)(c, null, rctx, investment).kind !== 'outside').slice(0, 4).map((c) => {
        const base = (0, answers_ts_1.roleFor)(c.title, investment);
        const n = ask.get(base.label) || 0;
        ask.set(base.label, n + 1);
        return `Meet ${c.title} and ask: "${(0, rw1_common_ts_1.readRole)(c, null, rctx, investment).ask || base.questions[n % base.questions.length]}"`;
    });
    const focus = pairs[0]?.part || (expansion[0] ? partFor(expansion[0]) : '') || parts[0] || '';
    const p1 = [
        ...meet,
        contacts.length ? `Confirm the part each of the ${contacts.length} contacts plays${uncovered.length ? ` and find the holder of ${(0, dealtext_ts_1.joinList)(uncovered.slice(0, 3))}` : ''}.` : `Find the people who own the problem, hold the budget and will use ${P} every day.`,
        ...(existing && parts.length ? [`Find out which of ${shortParts.length >= 2 ? (0, rw1_common_ts_1.some)(shortParts, 6) : 'the parts listed above'} the account runs today.`] : []),
        threats.length ? `Ask the questions in the alternatives section, starting with ${(0, rw1_common_ts_1.quoted)(threats[0].text)}, and write the answers down in the account's words.` : `Ask what they use today instead, including doing it by hand.`,
        `Agree the baseline: which of ${v ? (0, rw1_common_ts_1.some)(v.metrics, 3) : 'the numbers it already tracks'} the account measures today, and who owns each number.`,
        ...(noteLines.length ? [`Check the dates in this plan against your own note above.`] : []),
    ];
    const p2 = [
        `Agree a proof${focus ? ` that centres on ${focus}` : ''}${v ? `, in the form buyers in ${v.name} trust: ${(0, rw1_common_ts_1.lowerStart)(v.proofShape).replace(/[.]+$/, '')}` : ', with one team and a measure fixed beforehand'}.`,
        ...(answers.length ? [`Send written answers to the ${answers.length === 1 ? 'objection' : `${answers.length} objections`} above${answers.length > 3 ? `, starting with ${answers.slice(0, 3).map((a) => (0, rw1_common_ts_1.quoted)(a.text)).join(', ')}` : `: ${(0, dealtext_ts_1.joinList)(answers.map((a) => (0, rw1_common_ts_1.quoted)(a.text)))}`}.`] : []),
        `Build the business case in the account's own figures: the roi_business_case_builder tool needs their cost or value figures, so ask finance for them now.`,
        buyer ? `Show ${buyer.title} the result they are measured on, using the baseline from the first 30 days.` : `Put the baseline and the proof result in front of whoever signs.`,
        ...(buyerCtx ? [`Start the ${buyerCtx.name} reviews described above early, beside the proof and not after it.`] : v ? [`Bring in the people who check the cost case and the fit with their systems: ${v.committee.split(';').slice(-2).map((x) => x.trim().replace(/[.]+$/, '')).join('; ')}.`] : []),
        ...(uncovered.length ? [`Bring ${(0, dealtext_ts_1.joinList)(uncovered.slice(0, 2))} into the conversation before the decision meeting.`] : []),
    ];
    const growItems = expansion.length ? expansion.slice(0, 2).map((e) => { const s = sponsorOf(e); return `Take ${(0, rw1_common_ts_1.quoted)(e)} to ${s ? s.title : champ ? `the sponsor ${champ.title} names for it` : 'its sponsor'}, with the same form of proof as in the first 60 days.`; })
        : parts.length ? [`Choose the next part to propose from ${shortParts.length >= 2 ? (0, rw1_common_ts_1.some)(shortParts.filter((p) => p !== focus), 4) : 'the parts listed above'}, using what the proof showed.`] : [];
    const p3 = [
        `Hold the decision meeting with ${buyer ? buyer.title : 'the person who signs'}: set the proof result next to the baseline from the first 30 days.`,
        `Agree ${mw.terms} for ${existing ? 'the step you are asking the account to take' : 'the first contract'}.`,
        ...growItems,
        ...(answers.length ? [`Close any question still open from the objection list.`] : []),
        existing ? `Check the renewal date and have the expansion agreed before it, so it is not decided inside the renewal.` : `Plan the first weeks after signing: ${mw.setup}.`,
        champ ? `Agree the next review with ${champ.title} and what they will measure until then.` : `Agree the next review date and who owns the measure until then.`,
    ];
    const num = (xs) => xs.map((x, i) => `${i + 1}. ${x}`).join('\n');
    out.push(`## The next 90 days

### Days 1 to 30: ${'map the account and listen'} (by ${dayX(30)})

${num(p1)}

By day 30 you should have ${champ ? `${champ.title} ready to bring ${buyer ? buyer.title : 'the person who signs'} into a meeting` : 'a named champion'}, a baseline in the account's own numbers, and the missing roles named.

### Days 31 to 60: prove the next step (by ${dayX(60)})

${num(p2)}

By day 60 the business case should be accepted by ${buyer ? buyer.title : 'the person who signs'}, with the proof result in the account's numbers.

### Days 61 to 90: decide and widen (by ${dayX(90)})

${num(p3)}

By day 90 you should have a decision on ${existing ? 'the expansion' : 'the first deal'}${expansion.length ? ' and a named sponsor for each expansion area' : ''}.`);
    // ---- this week ----
    const week = [
        champ ? `Brief ${champ.title} and agree the next meeting.` : `Find and test a champion.`,
        buyer ? `Ask ${champ ? champ.title : 'your champion'} to get you a meeting with ${buyer.title} within two weeks.` : `Ask who signs, and ask for that person by name.`,
        threats.length ? `Put the first question about ${(0, rw1_common_ts_1.quoted)(threats[0].text)} to someone who lives with it.` : `Ask one person who lives with the problem what they do about it today.`,
    ];
    out.push(`## This week\n\n${week.map((x) => `- ${x}`).join('\n')}`);
    // ---- what was not given ----
    const miss = [];
    if (!arrGiven)
        miss.push('`current_arr` (it would change the tier and the expansion potential, which now follow the rule for a prospect)');
    if (!industryIn)
        miss.push('`industry` (it would change the review steps and risks written for the buyer)');
    if (!contactsText)
        miss.push('`known_contacts` (it would give one row for each person, with their part and a next step, in place of the generic roles above)');
    if (!productsIn)
        miss.push('`current_products` (it would show which parts of the product are already in use, and so which are whitespace)');
    if (!expansionIn)
        miss.push('`expansion_opportunities` (it would name the areas to grow into and their sponsors, and fill days 61 to 90)');
    if (!threatsIn)
        miss.push('`competitive_threats` (it would give a question and a proof for each alternative the account uses)');
    if (!solutionIn)
        miss.push('`your_solution` (it would let the plan name your product and its parts, and use them for whitespace)');
    if (!objections.length)
        miss.push('`account_notes` that start with "Objections:" and list them with semicolons (it would add an answer for each)');
    out.push(miss.length ? `**To sharpen this plan, give:**\n\n${miss.map((x) => `- ${x}`).join('\n')}\n\nThe plan is dated from today (${(0, dealtext_ts_1.isoDate)(today)}); review it monthly.` : `Everything this plan can use was given. What it cannot know is the renewal date and the account's priorities for the year; add them to your notes and move the dates above to match. The plan is dated from today (${(0, dealtext_ts_1.isoDate)(today)}); review it monthly.`);
    return out.join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
void dealtext_ts_1.partLabel;
//# sourceMappingURL=rw1-account.js.map