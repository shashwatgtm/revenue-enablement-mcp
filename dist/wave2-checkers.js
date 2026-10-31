"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWaveTool = exports.waveTools = void 0;
exports.callWaveTool = callWaveTool;
const text = { type: 'string', maxLength: 20000 };
const num = { type: 'number', minimum: 0 };
const choice = (...values) => ({ ...text, enum: values });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const array = (items, minItems = 0) => ({ type: 'array', items, minItems, maxItems: 200 });
const count = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const tokens = (s) => s.match(/\b\d[\d,]*(?:\.\d+)?%?/g) ?? [];
const iso = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(+new Date(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const day = (s) => iso(s) ? new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) : 'invalid';
const safeUrl = (s) => { try {
    const u = new URL(s);
    return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password ? u : null;
}
catch {
    return null;
} };
const escaped = (s) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/[&<>"'|`\[\]]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '|': '&#124;', '`': '&#96;', '[': '&#91;', ']': '&#93;' }[c]));
const escapeDeep = (v) => typeof v === 'string' ? escaped(v) : Array.isArray(v) ? v.map(escapeDeep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [escaped(k), escapeDeep(x)])) : v;
function validate(s, v, path = '$') {
    const issues = [];
    if (s.type === 'object') {
        if (!v || typeof v !== 'object' || Array.isArray(v))
            return [`${path}: object required`];
        for (const k of s.required ?? [])
            if (!Object.prototype.hasOwnProperty.call(v, k) || (typeof v[k] === 'string' && !v[k].trim()))
                issues.push(`${path}.${k}: required`);
        for (const [k, x] of Object.entries(v)) {
            if (!Object.prototype.hasOwnProperty.call(s.properties ?? {}, k))
                issues.push(`${path}: unknown property`);
            else
                issues.push(...validate(s.properties[k], x, `${path}.${k}`));
        }
    }
    else if (s.type === 'array') {
        if (!Array.isArray(v))
            return [`${path}: array required`];
        if (v.length < (s.minItems ?? 0) || v.length > (s.maxItems ?? 200))
            return [`${path}: row count outside allowed bounds`];
        v.forEach((x, i) => issues.push(...validate(s.items, x, `${path}[${i + 1}]`)));
    }
    else if (s.type === 'string') {
        if (typeof v !== 'string')
            return [`${path}: text required`];
        if (v.length > (s.maxLength ?? 20000))
            issues.push(`${path}: text too long`);
        if (s.enum && !s.enum.includes(v))
            issues.push(`${path}: unsupported choice`);
    }
    else if (s.type === 'number') {
        if (typeof v !== 'number' || !Number.isFinite(v) || (s.minimum !== undefined && v < s.minimum))
            issues.push(`${path}: finite number in range required`);
    }
    return issues;
}
const registry = {};
function define(name, description, schema, run) { schema.properties.your_sector = choice('logistics_tech', 'fintech', 'saas', 'vertical_saas', 'ai_native', 'ites', 'telecom', 'software', 'cybersecurity', 'other'); registry[name] = { tool: { name, description, inputSchema: schema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, run }; }
const evidence = object({ id: text, claim: text, source: text, source_date: text, excerpt: text, status: choice('user_supplied', 'unverified', 'conflicting') }, ['id', 'claim', 'source', 'source_date', 'excerpt', 'status']);
const evidenceIssues = (rows) => rows.flatMap((r, i) => { const out = []; if (!safeUrl(r.source))
    out.push(`Evidence ${i + 1}: source must be an HTTP(S) URL`); if (!iso(r.source_date))
    out.push(`Evidence ${i + 1}: source date invalid`); if (r.status !== 'user_supplied')
    out.push(`Evidence ${i + 1}: ${r.status}`); if (!r.excerpt.trim())
    out.push(`Evidence ${i + 1}: excerpt missing`); return out; });
const unique = (rows, key) => { const seen = new Set(); return rows.flatMap((r, i) => { const k = String(r[key]).trim().toLowerCase(); if (seen.has(k))
    return [`Row ${i + 1}: duplicate ${key}`]; seen.add(k); return []; }); };
const report = (issues, data, limitations) => ({ status: issues.length ? 'CHECKS_FOUND' : 'NO_MECHANICAL_ISSUES', issues, ...data, limitations: ['Only supplied data was checked. No page was fetched, model called, message sent or truth independently verified.', ...limitations] });
define('competitive_evidence_check', 'Check a supplied comparison for evidence gaps, duplicate criteria, unresolved ownership and unsupported verdicts. Does not research or write attacks.', object({ relationship: choice('unrelated_confirmed_by_user', 'same_group', 'unknown'), criteria: array(object({ criterion: text, buyer_need: text, our_evidence_id: text, alternative_evidence_id: text, verdict: choice('advantage', 'parity', 'gap', 'unknown') }), 1), evidence: array(evidence) }), a => {
    const issues = evidenceIssues(a.evidence);
    issues.push(...unique(a.evidence, 'id'), ...unique(a.criteria, 'criterion'));
    const ids = new Map(a.evidence.map((e) => [e.id, e]));
    if (a.relationship !== 'unrelated_confirmed_by_user')
        issues.push(a.relationship === 'same_group' ? 'Same-group relationship: targeted competitive use is held.' : 'Ownership relationship is unresolved.');
    const matrix = a.criteria.map((c, i) => { const missing = [c.our_evidence_id, c.alternative_evidence_id].filter(id => !ids.has(id)); if (missing.length)
        issues.push(`Criterion ${i + 1}: missing linked evidence`); if (c.verdict !== 'unknown' && [c.our_evidence_id, c.alternative_evidence_id].some(id => { const e = ids.get(id); return !e || e.status !== 'user_supplied'; }))
        issues.push(`Criterion ${i + 1}: verdict exceeds the supplied evidence status`); return { ...c, evidenceLinksPresent: !missing.length }; });
    return report(issues, { matrix, relationship: a.relationship }, ['A supplied verdict remains the user assessment. Evidence presence does not establish superiority, current pricing, ownership or a factual weakness.']);
});
define('proposal_structure_check', 'Check a proposal outline for buyer-problem links, proof references, commercial and implementation sections, next actions and supplied brand tokens.', object({ buyer_problem: text, audience: text, sections: array(object({ kind: choice('problem', 'approach', 'proof', 'implementation', 'commercials', 'next_step'), heading: text, body: text, evidence_ids: array(text) }), 1), evidence: array(evidence), brand: object({ primary_color: text, heading_font: text, body_font: text, source: text }) }), a => {
    const issues = evidenceIssues(a.evidence);
    const expected = ['problem', 'approach', 'proof', 'implementation', 'commercials', 'next_step'];
    const missing = expected.filter(k => !a.sections.some((s) => s.kind === k));
    missing.forEach(k => issues.push(`Missing proposal section: ${k}`));
    const ids = new Set(a.evidence.map((e) => e.id));
    a.sections.forEach((s, i) => { if (['approach', 'proof'].includes(s.kind) && !s.evidence_ids.length)
        issues.push(`Section ${i + 1}: proof reference missing`); if (s.evidence_ids.some((id) => !ids.has(id)))
        issues.push(`Section ${i + 1}: unknown proof reference`); });
    if (!/^#[a-fA-F0-9]{6}$/.test(a.brand.primary_color))
        issues.push('Brand color must be supplied as a six-digit hex value');
    return report(issues, { missingSections: missing, outline: a.sections.map((s) => ({ kind: s.kind, heading: s.heading, words: count(s.body), evidence_ids: s.evidence_ids })), brand: a.brand }, ['The tool does not infer buyer pain, brand style, ROI or proof, and does not generate a deck. Visual, contractual and semantic review remains required.']);
});
define('sales_sequence_check', 'Check an authored sales sequence against caller-supplied day offsets, weekend scheduling, distinct asks, subject honesty and proof references. No messages are sent.', object({ type: choice('cold_outreach', 'post_demo', 'proposal_followup', 're_engagement'), start: text, anchor: choice('trigger', 'first_send'), days: array(num, 1), emails: array(object({ subject: text, body: text, ask: text, evidence_ids: array(text) }), 1), evidence: array(evidence) }), a => {
    const issues = evidenceIssues(a.evidence);
    if (!iso(a.start))
        issues.push('Start date invalid');
    if (a.days.some((n) => !Number.isInteger(n) || n > 3660))
        issues.push('Days must be whole offsets within ten years');
    if (a.days.some((n, i) => i > 0 && n <= a.days[i - 1]))
        issues.push('Day offsets must be strictly increasing');
    if (a.days.length !== a.emails.length)
        issues.push('Email count differs from send-day count');
    const ids = new Set(a.evidence.map((e) => e.id));
    const asks = new Set();
    a.emails.forEach((e, i) => { const ask = e.ask.trim().toLowerCase(); if (asks.has(ask))
        issues.push(`Email ${i + 1}: repeated ask`); asks.add(ask); if (/^\s*(re|fwd)\s*:/i.test(e.subject))
        issues.push(`Email ${i + 1}: misleading reply or forward subject`); if (/[!\u2013\u2014]/u.test(e.subject + ' ' + e.body))
        issues.push(`Email ${i + 1}: exclamation mark or long dash`); if (e.evidence_ids.some((id) => !ids.has(id)))
        issues.push(`Email ${i + 1}: unknown evidence reference`); if (tokens(e.body).length && !e.evidence_ids.length)
        issues.push(`Email ${i + 1}: numeric claim has no evidence link`); });
    let prior = -Infinity;
    const dates = iso(a.start) && !issues.some(x => /Day offsets|Days must/.test(x)) ? a.days.map((offset) => { const d = new Date(a.start + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + offset - (a.anchor === 'first_send' ? a.days[0] : 0)); const requested = d.toISOString().slice(0, 10); while (d.getUTCDay() % 6 === 0 || +d <= prior)
        d.setUTCDate(d.getUTCDate() + 1); prior = +d; return { offset, requested, scheduled: d.toISOString().slice(0, 10), weekday: day(d.toISOString().slice(0, 10)), moved: requested !== d.toISOString().slice(0, 10) }; }) : [];
    return report(issues, { emailCount: a.emails.length, dates, counts: a.emails.map((e) => ({ subjectCharacters: [...e.subject].length, bodyWords: count(e.body) })) }, ['All day offsets are caller supplied, not benchmarks. Dates use UTC calendar dates and weekend adjustment, with no holiday or timezone scheduling. No semantic truth check or send action occurs. Deal Execution release remains held.']);
});
exports.waveTools = Object.values(registry).map(x => x.tool);
const isWaveTool = (name) => Object.prototype.hasOwnProperty.call(registry, name);
exports.isWaveTool = isWaveTool;
function callWaveTool(name, args) {
    if (!(0, exports.isWaveTool)(name))
        return { isError: true, content: [{ type: 'text', text: 'Unknown wave tool.' }] };
    const entry = registry[name];
    const schema = entry.tool.inputSchema;
    const record = args;
    const missing = (schema.required ?? []).filter(k => schema.properties?.[k].type === 'string' && !schema.properties[k].enum && (!record || typeof record[k] !== 'string' || !record[k].trim()));
    if (missing.length)
        return { isError: true, content: [{ type: 'text', text: `Missing required input for ${name}: ${missing.join(', ')}. INVALID_INPUT: provide the missing text fields.` }] };
    const problems = validate(schema, args);
    if (problems.length)
        return { isError: true, content: [{ type: 'text', text: JSON.stringify({ status: 'INVALID_INPUT', issues: problems }, null, 2) }] };
    try {
        const result = escapeDeep({ ...entry.run(args), sellerSector: args.your_sector ?? 'not supplied; no sector inference applied' });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result };
    }
    catch {
        return { isError: true, content: [{ type: 'text', text: 'Input could not be checked. No external action occurred.' }] };
    }
}
//# sourceMappingURL=wave2-checkers.js.map