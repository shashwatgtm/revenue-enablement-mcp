"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upperFirst = exports.clip = exports.splitTopLevel = exports.isNotGiven = exports.PROVIDER = void 0;
exports.readSector = readSector;
exports.fitSector = fitSector;
exports.productOf = productOf;
exports.isKind = isKind;
exports.partsIn = partsIn;
exports.handleOf = handleOf;
exports.readAlt = readAlt;
exports.sourceOf = sourceOf;
exports.endSentence = endSentence;
exports.sentenceCase = sentenceCase;
exports.listItems = listItems;
exports.andList = andList;
exports.dropRepeats = dropRepeats;
exports.doesLine = doesLine;
// Run 22 (writer rev-w3): helpers shared by the rewritten email_sequence_generator, win_loss_analyzer and competitive_trap_setter.
// Text only: no figure, no statistic, no named company (B82), no network, file or environment access. The functions that live in
// src/index.ts (lowerFirstIfCommon, cap, isCommonWord, money) are handed in as Deps so that this file never imports index.ts.
const dealtext_ts_1 = require("./dealtext.js");
Object.defineProperty(exports, "clip", { enumerable: true, get: function () { return dealtext_ts_1.clip; } });
Object.defineProperty(exports, "upperFirst", { enumerable: true, get: function () { return dealtext_ts_1.upperFirst; } });
Object.defineProperty(exports, "splitTopLevel", { enumerable: true, get: function () { return dealtext_ts_1.splitTopLevel; } });
const rw1_common_ts_1 = require("./rw1-common.js");
const verticals_ts_1 = require("./verticals.js");
// Round 4: a business model is named only as far as the seller's own words show it (rule E8). The shared reader gives "connectivity (per site, per link ...)" to any seller
// of voice or messaging APIs and "services (per FTE ...)" to a platform that moves freight; neither is stated by the inputs, so the line says the notes follow the usual shape
// of the sector (assumed) and the wording stays neutral. Usage priced sellers and SIM sellers are read by the model read of src/rw1-common.ts.
const FIXED_LINK = /\b(?:per site|per link|leased lines?|mpls|sd-?wan|site survey|managed network|branch(?:es)? (?:network|sites?)|wi-?fi|broadband|bandwidth|wan\b|cut-?over)\b/i;
const SOFTWARE_CUES2 = /\b(?:software|saas|platforms?|apps?|apis?|tools?|dashboards?|subscriptions?|cloud|portal|systems?|crm|erp|engine|sdk)\b/i;
const SERVICE_WORDS2 = /\b(?:outsourc\w*|bpo\b|managed (?:services?|operations|network|it)|consult\w*|staffing|fte\b|retainer|time and materials|statement of work|(?:contact|call) cent(?:re|er)s?|service desk|professional services|dedicated teams?|engineering services|business services)\b/i;
const MODEL_LINE2 = /Business model: [^]*?\.\*$/;
const NEUTRAL_LINE = 'Business model: not stated in your inputs, so the notes below follow the usual shape for this sector (assumed); say how you are paid in your_solution to change them.*';
function readSector(explicitModel, input) {
    const read = (0, verticals_ts_1.explainSector)(input);
    const m = (0, verticals_ts_1.detectModel)(explicitModel, input);
    const v = (0, verticals_ts_1.profileFor)(read.vertical, m.model, input);
    const via = read.source === 'context' ? ' (from the deal details: your own description names no sector)' : read.source === 'role' ? ' (from the buyer job titles: your own description names no sector)' : read.source === 'buyer' ? ' (from the buyer\'s industry: your own description names no sector, so describe what you sell for notes that fit it)' : '';
    const sector = v ? `read from your inputs as ${v.name}${via}` : 'not clear from your inputs (name the industry for sector notes)';
    const model = m.model ? `${verticals_ts_1.MODEL_NAME[m.model]} (${m.how === 'input' ? 'from business_model' : m.how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})` : 'not clear from your inputs; set business_model (saas, services, connectivity, transactions, marketplace, hardware_software or investment) for advice that fits it';
    const sellerText = (input.seller || []).filter((x) => typeof x === 'string').join(' . ');
    const allText = [sellerText, ...(input.context || []).filter((x) => typeof x === 'string')].join(' . ');
    let line = `*Sector: ${sector}. Business model: ${model}.*`;
    let outModel = m.model;
    if (m.how !== 'input') {
        const rm = (0, rw1_common_ts_1.readModel)(m.model, line, sellerText, [], []);
        line = rm.line;
        outModel = rm.model === 'sim' ? null : rm.model;
        const fixed = FIXED_LINK.test(allText);
        if (outModel === 'connectivity' && !fixed && rm.model !== 'sim') {
            outModel = null;
            line = line.replace(MODEL_LINE2, NEUTRAL_LINE);
        }
        else if (outModel === 'services' && SOFTWARE_CUES2.test(sellerText) && !SERVICE_WORDS2.test(sellerText)) {
            outModel = null;
            line = line.replace(MODEL_LINE2, NEUTRAL_LINE);
        }
    }
    return { v, model: outModel, line, fixedLink: FIXED_LINK.test(allText) };
}
/** Round 4: the notes of a plain telecom entry are written for operators who sell links to sites. For a seller that is not one (no sites, links or term contracts in the inputs) the lines that
 *  name sites, links, repair time or a rollout wave are left out, so an API deal is not read through a network operator's frame. A sub-type entry is left as it is. */
const LINK_LINE = /\b(?:wave plan|per site|per link|term contract|repair time|sites, routes or flows|a few sites|outage during the switch|service credits|rate card)\b/i;
function fitSector(v, fixedLink, model, productText = '') {
    // an API product is not measured on release frequency or build time unless the seller's own words speak of pipelines, builds or releases
    if (v && /\bapis?\b/i.test(productText) && !/\b(?:ci\/cd|pipelines?|continuous (?:integration|delivery|deployment)|deploy\w*|build (?:system|server|tool)s?|release (?:management|automation|engineering))\b/i.test(productText)) {
        const kept = v.metrics.filter((x) => !/\b(?:release|build|deploy|pipeline)\b/i.test(x));
        if (kept.length >= 2 && kept.length < v.metrics.length)
            v = { ...v, metrics: kept };
    }
    if (!v || v.id !== 'telecom' || v.subtype || fixedLink || model === 'connectivity')
        return v;
    return {
        ...v,
        objections: v.objections.filter((o) => !LINK_LINE.test(`${o.objection} ${o.response}`)),
        metrics: v.metrics.filter((x) => !/repair|service credits|incidents/i.test(x)),
        salesMotion: LINK_LINE.test(v.salesMotion) ? 'Developers and engineers evaluate first, on test traffic; a team or enterprise agreement follows.' : v.salesMotion,
        committee: /\bapis?\b|\bdevelopers?\b/i.test(productText) ? 'An engineering lead champions it and the developers test it first; the head of engineering or product signs; security and compliance review it; finance checks the cost per unit of service.' : v.committee.replace(/\brate cards?\b/gi, 'prices'),
        proofShape: v.proofShape.replace(/\(uptime, speed, repair time\)/i, '(uptime, speed, latency)').replace(/\brepair time\b/gi, 'latency').replace(/the same sites or traffic/i, 'the same traffic'),
    };
}
const NOT_NAME = /^(?:the|a|an|our|your|my|this|that|we|it|ai|api|apis|sms|iot|b2b|b2c|saas|cloud|managed|digital|enterprise|voice|data|security|software|platform|tool|tools|service|services|solution|solutions|product|system|systems|network|mobile|global|smart|modern|open|unified|single|new|free|full|end|real|one|all|any|each|every|no|not|ignore|identity|freight|route|routing|developer|developers|messaging|payments?|billing|workflow|supply|fleet|delivery|testing|monitoring|analytics|learning|video|customer|sales|marketing|automation|intelligence|visibility|compliance|risk|fraud|access|document|documents|knowledge|search|code|devops|infrastructure|connectivity|logistics|warehouse|inventory|retail|banking|insurance|lending|expense|expenses|spend|invoice|invoicing|procurement|hr|payroll|recruiting|support|helpdesk|ticketing|crm|erp|cpaas|bpo|ites)$/i;
const sectorWord = (w) => verticals_ts_1.VERTICALS.some((v) => v.match.test(w) || v.weak.test(w));
function kindFrom(rest) {
    let k = rest.replace(/^[,:\s-]+/, '').replace(/^(?:is|are)\s+/i, '');
    const cut = k.search(/\s+\(|:\s|;\s|\s[-\u2013\u2014]\s|\s+(?:that|which|where|who|with)\s+|,\s+(?:a|an|the)\s+[A-Z]|,\s+(?:plus|with|built|designed|made|powered|delivered|backed|covering|including|spanning|for)\b/);
    if (cut > 0)
        k = k.slice(0, cut);
    k = k.replace(/[.,;:\s]+$/, '').trim();
    if (k.length > 120) {
        const c = k.lastIndexOf(', ', 120);
        k = c > 30 ? k.slice(0, c) : (0, dealtext_ts_1.clip)(k, 120);
    }
    return k;
}
const tidyEnd = (t) => t.replace(/[\s,;:(-]+$/, '').replace(/\s+(?:and|or|the|a|an|of|to|for|with|in|on|by|at|from|as|into|across|per|that|which)$/i, '').trim();
function productOf(solution, D) {
    const full = (solution || '').trim().replace(/\s+/g, ' ');
    const brief = (0, dealtext_ts_1.solutionBrief)(full);
    if (!full)
        return { name: '', kind: '', parts: [], ref: 'the product', label: '', full: '', brief };
    const named = !!brief.name && full.length > brief.name.length + 2 && full.startsWith(brief.name);
    let name = '';
    let kind = '';
    if (named) {
        name = brief.short;
        kind = kindFrom(brief.kind.replace(new RegExp(`^${brief.short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?\\s*`, 'i'), ''));
    }
    else {
        const t0 = full.split(/\s+/)[0].replace(/[,;:]+$/, '');
        const proper = /^[A-Za-z][A-Za-z0-9.&'+-]*$/.test(t0) && (/^[A-Z]/.test(t0) || /^[a-z]+[A-Z]/.test(t0)) && !D.isCommon(t0) && !NOT_NAME.test(t0) && !(0, dealtext_ts_1.isGenericWord)(t0) && !(/^[A-Za-z]+$/.test(t0) && sectorWord(t0));
        if (proper) {
            const toks = full.split(/\s+/);
            let run = [t0.replace(/'s$/, '')];
            for (const t of toks.slice(1, 3)) {
                const w = t.replace(/[,;:]+$/, '');
                const acronym = /^[A-Z]{2,5}$/.test(w) && !/^(?:AI|API|SMS|IOT|B2B|B2C|SAAS|CRM|ERP|HR|IT)$/.test(w);
                const word = /^[A-Z][a-z]*[A-Z0-9.][A-Za-z0-9.&'+]*$/.test(w) && !D.isCommon(w) && !NOT_NAME.test(w);
                // a name that starts in lower case with a capital inside ("eMarker Digital") keeps a capitalised word that only says what kind of firm it is: it is part of the name as typed
                const kindWord = /^[a-z]+[A-Z]/.test(t0) && /^(?:Digital|Data|Technologies|Technology|Tech|Services|Solutions|Software|Systems|Group|Global|Labs|Consulting|Ventures|International|Holdings|Networks|Platform|Platforms|Cloud|Analytics)$/.test(w);
                if ((acronym || word || kindWord) && !/[,;:]$/.test(toks[toks.indexOf(t) - 1] || ''))
                    run.push(w);
                else
                    break;
            }
            name = run.join(' ');
            kind = kindFrom(full.slice(run.join(' ').length).replace(/^[,;:\s]+/, ''));
        }
        else
            kind = kindFrom(full);
    }
    const head = kind.split(/\s+(?:for|to|that|with|of|in|on|from|which|who)\s+/i)[0].split(/\s+/).slice(0, 4).join(' ').replace(/^(?:a|an|the)\s+/i, '');
    const headNoun = head.replace(/^(?:our|your|my)\s+/i, '');
    const ref = name || (headNoun && headNoun.length > 2 && !/^[“"'(]/.test(headNoun) && /\b(?:software|platform|tool|app|apps|system|service|services|solution|suite|api|cloud|engine|assistant|agents?|network|product)$/i.test(headNoun) ? `the ${headNoun}` : 'the product');
    const kindBare = kind.replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim();
    // "Gridweave Network Fabric, Network Fabric connects ...": a kind that opens with the last words of the name does not say them twice
    const nameWords = name.split(/\s+/);
    let kb = kindBare;
    for (let n = Math.min(3, nameWords.length); n >= 1; n--) {
        const tail = nameWords.slice(-n).join(' ');
        if (kb.toLowerCase().startsWith(`${tail.toLowerCase()} `)) {
            kb = kb.slice(tail.length).trim();
            break;
        }
    }
    const joined = name ? (kb ? `${name}${/^(?:a|an|the)\s/i.test(kb) ? ',' : ''} ${kb}` : name) : '';
    const label = name ? tidyEnd((0, dealtext_ts_1.clip)(joined, 140)) : (full.length <= 120 ? full : tidyEnd((0, dealtext_ts_1.clip)(kind || full, 140)));
    return { name, kind, parts: brief.parts, ref, label, full, brief };
}
/** "is a route planning platform for ...", "offers digital services", or '' when the description gives no kind. */
function isKind(p, D) {
    let k = p.kind.replace(new RegExp(`^${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim();
    if (!p.name || !k)
        return '';
    // a kind written in title case ("Human Risk Management Platform") is a common noun phrase, not a name
    if (k.split(/\s+/).filter((w) => /^[A-Z][a-z]+$/.test(w)).length >= 3)
        k = k.replace(/\b([A-Z])([a-z]+)\b/g, (_m, a, b) => `${a.toLowerCase()}${b}`);
    // a description that already is a sentence ("Digital Fabric connects enterprises' network, cloud ...") is kept as it is
    // "Gridweave Network Fabric, Network Fabric connects ...": the name is said once, in full
    const nw = p.name.split(/\s+/);
    for (let n = Math.min(3, nw.length - 1); n >= 1; n--) {
        const tail = nw.slice(-n).join(' ');
        if (k.toLowerCase().startsWith(`${tail.toLowerCase()} `)) {
            k = `${p.name} ${k.slice(tail.length).trim()}`;
            return k.replace(/[.]+$/, '');
        }
    }
    if (/^(?:\S+\s+){0,4}(?:connects?|runs?|builds?|helps?|lets?|gives?|offers?|provides?|delivers?|unifies|brings|enables?|powers?|turns?|makes?|designs?|covers?|automates?|protects?|detects?|identifies|manages|monitors|tracks|sends|routes|plans)\b/i.test(k) && !/^(?:a|an|the)\s/i.test(k))
        return k.replace(/[.]+$/, '');
    if (/^(?:a|an|the)\s/i.test(k))
        return `${p.name} is ${D.lower(k)}`;
    const headPhrase = k.split(/\s+(?:for|to|that|which|with|of|in|on|from|across|built|made)\s+/i)[0];
    const last = (headPhrase.split(/\s+/).pop() || '').toLowerCase();
    const plural = /s$/.test(last) && !/(?:ss|us|is)$/.test(last);
    if (/^[A-Z][A-Za-z']*(?:'s)\b/.test(k) || (/^[A-Z]/.test(k) && !D.isCommon(k.split(/\s+/)[0]) && /'s\b/.test(k.split(/\s+/)[0])))
        return `${p.name} is ${k}`;
    return plural ? `${p.name} offers ${D.lower(k)}` : `${p.name} is ${/^[aeiou]/i.test(k) ? 'an' : 'a'} ${D.lower(k)}`;
}
/** The parts a description lists: after a colon, after "covering/including/spanning", after ", with", or in the first brackets. */
function partsIn(p) {
    if (p.parts.length)
        return p.parts.map(dealtext_ts_1.partLabel).filter(Boolean);
    const m = p.full.match(/,?\s+(?:covering|including|spanning)\s+(.+)$/i);
    const listFrom = (src) => {
        const items = [];
        for (const raw of (0, dealtext_ts_1.splitTopLevel)(src.replace(/[.]+$/, ''))) {
            const t = raw.replace(/^and\s+/i, '').replace(/^on top of\s+/i, '').trim();
            // the words inside brackets ("accept online and in-store payments (100+ payment methods)") are detail, not part of the length of the item
            const bare = t.replace(/\s*\([^)]*\)/g, '').trim();
            if (!bare || /\b(?:that|which|who|read|reads|delivered|built|powered|made|backed|plus)\b|(?:^|\band\s)with\b/i.test(bare) || bare.split(/\s+/).length > 6)
                break;
            items.push((0, dealtext_ts_1.partLabel)(t));
        }
        return items;
    };
    if (m) {
        const items = listFrom(m[1]);
        if (items.length >= 3)
            return items.slice(0, 12);
    }
    const w = p.full.match(/,\s+with\s+(.+)$/i);
    if (w) {
        const items = listFrom(w[1]);
        if (items.length >= 3)
            return items.slice(0, 12);
    }
    // "Name, a kind of product: first part (detail), second part, third part, and fourth part"
    const col = p.full.match(/^[^:(]{3,120}:\s+(.+)$/);
    if (col) {
        const items = listFrom(col[1]);
        if (items.length >= 3)
            return items.slice(0, 12);
    }
    const par = p.full.match(/^[^(]{3,120}\(([^()]{8,300})\)/);
    if (par) {
        const items = listFrom(par[1]);
        if (items.length >= 2)
            return items.slice(0, 12);
    }
    const verbs = '(?:designs|builds|runs|covers|provides|offers|delivers|handles|includes)';
    const act = p.full.match(new RegExp(`\\b${verbs}(?:,\\s*${verbs})*(?:\\s+and\\s+${verbs})?\\s+([^.;:]+)`, 'i'));
    if (act) {
        const items = listFrom(act[1].split(/\s+(?:under|on|with|using|through|across|via)\s+/i)[0]);
        if (items.length >= 3)
            return items.slice(0, 12);
    }
    return [];
}
const APPROACH = /\b(?:do(?:ing)? nothing|status quo|inertia|spreadsheets?|excel|manual(?:ly)?|by hand|paper|whatsapp|email threads?|in-?house|ourselves|yourself|yourselves|themselves|diy|own team|internally|hire more|hiring more|more (?:people|staff|headcount|dispatchers|analysts|agents|engineers)|add(?:ing)? (?:people|headcount|staff)|ad[- ]hoc|workarounds?|from scratch|country by country|one by one|current (?:process|way|approach|setup|set-up)|existing (?:process|way|approach|setup)|old model|buying and maintaining|stay with|keep using|no change|wait and see|nothing)\b/i;
const GERUND_START = /^(?:the )?(?:buying|building|doing|hiring|using|keeping|running|managing|negotiating|dealing|relying|sticking|staying|waiting|maintaining|tracking|handling|working|stitching|collecting|copying|sending|reconciling|chasing|sourcing|patching|consolidating|entering|creating|writing|paying|operating|developing|training|reviewing|switching|self-managing|self-hosting)\b/i;
const CATEGORY = /\b(?:systems?|tools?|solutions?|vendors?|providers?|platforms?|apps?|products?|suppliers?|software|services|firms?|forwarders?|banks?|scanners?|assistants?|bots?|databases?|carriers?|operators?|partners?|programs?|offerings?|packages?|stacks?|suites?|approaches|methods|pilots?|models?|frameworks?|networks?|gateways?|telcos?|integrators?|agencies|consultancies|competitors?|servers?|devices?|checks?)\b/i;
// the existing providers a buyer already uses (banks, carriers, forwarders, firms) are people and institutions, not tools: no demo, no first look
exports.PROVIDER = /\b(?:banks?|carriers?|forwarders?|firms?|agencies|agency|consultancies|consultants?|suppliers?|providers?|vendors?|operators?|telcos?|integrators?|partners?|insurers?|lenders?|couriers?|brokers?|outsourcers?|processors?)\b/i;
const TOOLISH = /\b(?:systems?|tools?|software|platforms?|apps?|solutions?|products?|scanners?|assistants?|bots?|databases?|servers?|stacks?|suites?|frameworks?|apis?|gateways?|models?|portals?|engines?|devices?)\b/i;
const ACRONYM = /^[A-Z][A-Z0-9/&-]{1,5}$/;
function hasProperNoun(text, D) {
    const toks = text.replace(/\([^)]*\)/g, ' ').split(/[\s,;:]+/).filter(Boolean);
    return toks.some((t, i) => {
        const w = t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.']+$/g, '');
        if (!w || ACRONYM.test(w) || NOT_NAME.test(w))
            return false;
        const inner = /^[a-z]+[A-Z]/.test(w) || /^[A-Z][a-z]+[A-Z]/.test(w) || /\d/.test(w);
        if (!/^[A-Z]/.test(w) && !inner)
            return false;
        if (i === 0)
            return (inner || toks.length <= 3) && !D.isCommon(w);
        return !D.isCommon(w);
    });
}
function handleOf(text) {
    let t = text.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim().replace(/[.]+$/, '');
    const colon = t.indexOf(':');
    if (colon > 3 && colon <= 60)
        t = t.slice(0, colon);
    const lead = t.match(/^(the (?:current|old|existing|usual|traditional|previous) (?:way|approach|process|model|setup|set-up|method))\b/i);
    if (lead)
        return lead[1];
    const cut = t.search(/\s+(?:that|which|who|where|because|while|with|so|but|whose|tied|bound|locked|added|running|using|working|designed|focused|optimi[sz]ed|built|made|written|owned)\s+|,\s+(?:each|which|so|but|with|where|because|while|whose|and then)\b|;\s/i);
    if (cut >= 3)
        t = t.slice(0, cut);
    const w = t.split(' ');
    if (w.length > 11)
        t = w.slice(0, 9).join(' ');
    return t.replace(/\s+(?:and|or|the|a|an|of|to|for|with|in|on|by|at)$/i, '').trim();
}
// a thread, a wiki page, a channel or a shared document is a way of working even when it names the tool it lives in ("a Chatwell thread and Pagebook links")
const WAY_OF_WORKING = /\b(?:threads?|links|wiki|wikis|channels?|chats?|shared (?:drive|inbox|folder|documents?)|folders?|spreadsheets?|inbox)\b/i;
function readAlt(text, D, named = false) {
    const t = text.trim().replace(/[.]+$/, '');
    const handle = handleOf(t);
    let kind;
    if (GERUND_START.test(t) || APPROACH.test(t) || (!named && WAY_OF_WORKING.test(t) && !/\b(?:vendors?|providers?|competitors?|platforms?|suppliers?)\b/i.test(t)))
        kind = 'approach';
    else if (hasProperNoun(t, D) && !(CATEGORY.test(t) && !named && /^[a-z]/.test(t)))
        kind = 'vendor';
    else if (named && !CATEGORY.test(t))
        kind = 'vendor';
    else
        kind = exports.PROVIDER.test(t) && !TOOLISH.test(t) ? 'provider' : 'category';
    return { text: t, kind, handle };
}
/** The kind of source a trailing label names, and the basis it gives ("from a 2025 customer survey"). */
function sourceOf(label) {
    const l = (label || '').trim();
    if (!l)
        return { type: 'own', basis: '' };
    let basis = '';
    const m = l.match(/(?:claims?|words|figures?|stats?|numbers?)[,;:]?\s+((?:based on|from|over|across|measured|according to|in a|in an|after|using)\b.*)$/i);
    if (m)
        basis = m[1].trim();
    if (/\bquote|\bsaid\b/i.test(l))
        return { type: 'quote', basis };
    if (/\b(?:title|headline|case study|story)\b/i.test(l))
        return { type: 'title', basis };
    if (/\b(?:page|site|website|home ?page|pages)\b|\bwords\b/i.test(l))
        return { type: 'page', basis };
    return { type: 'other', basis };
}
// ---------------------------------------------------------------------------------------------------------------------------
// Small text tools
// ---------------------------------------------------------------------------------------------------------------------------
/** Ends a sentence with one full stop (or keeps ? and !); never doubles one. */
function endSentence(s) {
    const t = s.trim().replace(/\s+/g, ' ');
    if (!t)
        return '';
    return /[.?!]["”')]?$/.test(t) ? t : `${t}.`;
}
/** A sentence starts with a capital unless it starts with a name written with a small first letter (iLoop). */
function sentenceCase(s) {
    const t = s.trim();
    if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || ''))
        return t;
    return (0, dealtext_ts_1.upperFirst)(t);
}
/** Splits a typed list at semicolons and new lines only. */
function listItems(s) {
    if (typeof s !== 'string')
        return [];
    return s.split(/\n|;/).map((x) => x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
}
const NOT_GIVEN = /^\(?\s*(?:not given|none|n\/a|unknown|tbd)\s*\)?$/i;
const isNotGiven = (s) => !s.trim() || NOT_GIVEN.test(s.trim());
exports.isNotGiven = isNotGiven;
/** "a, b and c". */
function andList(items, word = 'and') {
    if (items.length <= 1)
        return items[0] || '';
    return `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;
}
/** Removes whole sentences that were already said (case and punctuation ignored); keeps the first. Sentences under 25 characters are never removed. */
function dropRepeats(paras, seen) {
    const out = [];
    const one = (p) => {
        const parts = p.split(/(?<=[.?!])\s+(?=[A-Z“"'(0-9])/);
        const kept = [];
        for (const s of parts) {
            const k = s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            if (k.length >= 25) {
                if (seen.has(k))
                    continue;
                seen.add(k);
            }
            kept.push(s);
        }
        return kept.join(' ');
    };
    for (const p of paras) {
        const kept = p.split('\n').map((l) => (l.trim() ? one(l) : l)).filter((l, i, a) => l.trim() || (i > 0 && a[i - 1].trim()));
        const text = kept.join('\n').trim();
        if (text)
            out.push(text);
    }
    return out;
}
/** "It unifies digital interactions across SMS, RCS and voice": the first "that <verb>s ..." clause of the description, in the user's words; '' when there is none. */
function doesLine(p) {
    const m = p.full.match(/\b(?:that|which)\s+((?:unif|connect|run|let|give|automat|help|enabl|power|deliver|provid|offer|detect|protect|manag|track|monitor|send|rout|plan|turn|bring|build|make|cover|handl|combin|replac|simplif|scan|test|assess|verif|secur|reconcil|collect|accept)\w*s)\s+(.{10,240}?)(?:,\s+(?:with|plus|built|powered|delivered)\b|;|:\s|\.(?=\s|$)|$)/i);
    if (!m)
        return '';
    let rest = m[2].trim();
    // a long clause is cut where its first detail begins (", as a physical SIM (2FF ...)"), and a bracket left open is dropped
    if (rest.length > 120) {
        const c = rest.search(/,\s+(?:as|in|via|using|through|delivering|offering|including|covering|giving)\b|\s+\(/);
        if (c >= 30)
            rest = rest.slice(0, c);
    }
    if ((rest.match(/\(/g) || []).length > (rest.match(/\)/g) || []).length)
        rest = rest.slice(0, rest.lastIndexOf('(')).trim();
    rest = rest.replace(/[\s,:;(-]+$/, '').replace(/\s+(?:and|or|the|a|an|of|to|for|with|in|on|by|at|from|as)$/i, '');
    return rest.length >= 10 ? endSentence(`It ${m[1]} ${rest}`) : '';
}
//# sourceMappingURL=rw-common.js.map