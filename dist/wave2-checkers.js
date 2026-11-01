"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWaveTool = exports.waveTools = void 0;
exports.callWaveTool = callWaveTool;
const escape_inputs_ts_1 = require("./escape-inputs.js");
const checker_common_ts_1 = require("./checker-common.js");
const registry = {};
function define(name, description, schema, run) {
    schema.properties.your_sector = (0, checker_common_ts_1.choice)("logistics_tech", "fintech", "saas", "vertical_saas", "ai_native", "ites", "telecom", "software", "cybersecurity", "other");
    registry[name] = {
        tool: {
            name,
            description,
            inputSchema: schema,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        run,
    };
}
define("competitive_evidence_check", "Check supplied comparison evidence, source status, number/unit matches, missing sides, same-source pairs and source recency. Ask for the review date; never invent evidence or call a pasted source verified.", (0, checker_common_ts_1.object)({
    relationship: (0, checker_common_ts_1.choice)("unrelated_confirmed_by_user", "same_group", "unknown"),
    as_of: checker_common_ts_1.text,
    stale_after_days: checker_common_ts_1.num,
    criteria: (0, checker_common_ts_1.array)((0, checker_common_ts_1.object)({
        criterion: checker_common_ts_1.text,
        buyer_need: checker_common_ts_1.text,
        our_evidence_id: checker_common_ts_1.text,
        alternative_evidence_id: checker_common_ts_1.text,
        verdict: (0, checker_common_ts_1.choice)("advantage", "parity", "gap", "unknown"),
    }, ["criterion", "buyer_need", "verdict"]), 1),
    evidence: (0, checker_common_ts_1.array)(checker_common_ts_1.evidence),
}, ["relationship", "as_of", "criteria", "evidence"]), (a) => {
    const window = a.stale_after_days ?? 90, issues = (0, checker_common_ts_1.evidenceIssues)(a.evidence, a.as_of, window);
    if (!(0, checker_common_ts_1.iso)(a.as_of))
        issues.push("Review date invalid; use YYYY-MM-DD.");
    issues.push(...(0, checker_common_ts_1.unique)(a.evidence, "id"), ...(0, checker_common_ts_1.unique)(a.criteria, "criterion"));
    if (a.relationship !== "unrelated_confirmed_by_user")
        issues.push(a.relationship === "same_group"
            ? "Same-group relationship: targeted competitive use is held."
            : "Ownership relationship is unresolved.");
    const ids = new Map(a.evidence.map((e) => [e.id, e]));
    const matrix = a.criteria.map((c, i) => {
        const ours = ids.get(c.our_evidence_id), other = ids.get(c.alternative_evidence_id), missing = !ours || !other;
        if (missing)
            issues.push("Criterion " +
                (i + 1) +
                ": missing linked evidence; an unknown side stays unknown.");
        if (ours && other && c.our_evidence_id === c.alternative_evidence_id)
            issues.push("Criterion " +
                (i + 1) +
                ": same evidence ID is cited for both sides.");
        if (c.verdict !== "unknown" &&
            (!ours ||
                !other ||
                ours.status !== "verified_opened" ||
                other.status !== "verified_opened"))
            issues.push("Criterion " +
                (i + 1) +
                " (" + c.criterion + "): verdict exceeds the supplied evidence status. Confirm the source status actually supported for " + (c.our_evidence_id || "the first source") + " and " + (c.alternative_evidence_id || "the alternative source") + "; keep the verdict unknown until both sides have comparable verified evidence.");
        if (c.verdict === "advantage" && ours && other) {
            const left = (0, checker_common_ts_1.claimTokens)(ours.excerpt, true), right = (0, checker_common_ts_1.claimTokens)(other.excerpt, true);
            if (left.some((l) => right.some((r) => l.unit && l.unit === r.unit && l.value < r.value)))
                issues.push("Criterion " +
                    (i + 1) +
                    ": claimed advantage conflicts with a lower comparable number; confirm which direction is better.");
        }
        return { ...c, evidenceLinksPresent: !missing };
    });
    return (0, checker_common_ts_1.report)(issues, {
        matrix,
        relationship: a.relationship,
        asOf: a.as_of,
        staleAfterDays: window,
        windowSource: a.stale_after_days === undefined
            ? "example review window"
            : "supplied",
    }, [
        "Interview/document dates may be month-only; recency uses the end of that month and future checks use its start.",
        "A supplied verdict is not a proven advantage; direction, scope, pricing and ownership need human review.",
    ]);
});
const sequenceDefaults = {
    cold_outreach: [1, 3, 7, 12, 17],
    warm_follow_up: [0, 3, 7],
    post_demo: [0, 2, 5, 10],
    proposal_follow_up: [1, 3, 7, 12],
    referral_request: [1, 4, 9],
    re_engagement: null,
};
define("sales_sequence_check", "Check an authored sequence pasted with Subject: headings or supplied as email rows. Uses the skill's six sequence types and labelled example send days, preserves first-send gaps, and checks dates, repeated sentences, misleading subjects and number/unit evidence. Ask for missing scheduling facts. Sends nothing.", (0, checker_common_ts_1.object)({
    type: (0, checker_common_ts_1.choice)(...Object.keys(sequenceDefaults)),
    start: checker_common_ts_1.text,
    anchor: (0, checker_common_ts_1.choice)("trigger", "first_send"),
    days: (0, checker_common_ts_1.array)(checker_common_ts_1.num, 1),
    pasted_text: checker_common_ts_1.text,
    emails: (0, checker_common_ts_1.array)((0, checker_common_ts_1.object)({ subject: checker_common_ts_1.text, body: checker_common_ts_1.text, ask: checker_common_ts_1.text, evidence_ids: (0, checker_common_ts_1.array)(checker_common_ts_1.text) }, ["subject", "body", "evidence_ids"]), 1),
    evidence: (0, checker_common_ts_1.array)(checker_common_ts_1.evidence),
}, ["type", "start", "anchor", "emails", "evidence"]), (a) => {
    const issues = (0, checker_common_ts_1.evidenceIssues)(a.evidence), defaults = sequenceDefaults[a.type], days = a.days ?? defaults?.slice(0, a.emails.length) ?? [];
    if (!(0, checker_common_ts_1.iso)(a.start))
        issues.push("Start date invalid");
    if (!days.length)
        issues.push("This sequence type has no example default; supply day offsets.");
    if (days.some((n) => !Number.isInteger(n) || n > 3660))
        issues.push("Days must be whole offsets within ten years");
    if (days.some((n, i) => i > 0 && n <= days[i - 1]))
        issues.push("Day offsets must be strictly increasing");
    if (days.length !== a.emails.length)
        issues.push("Email count differs from send-day count");
    const ids = new Map(a.evidence.map((e) => [e.id, e])), asks = new Set(), sentences = new Set();
    a.emails.forEach((e, i) => {
        const label = "Email " + (i + 1) + ": ", ask = (e.ask ?? "").trim().toLowerCase();
        if (!ask)
            issues.push(label + "ask not separately confirmed; review the pasted question.");
        else if (asks.has(ask))
            issues.push(label + "repeated ask");
        if (ask)
            asks.add(ask);
        if (/^\s*(re|fw|fwd)\s*:/i.test(e.subject))
            issues.push(label + "misleading reply or forward subject");
        if (/[!]/.test(e.subject + " " + e.body) ||
            (0, checker_common_ts_1.hasDash)(e.subject + " " + e.body))
            issues.push(label + "exclamation mark or dash");
        const linked = e.evidence_ids.map((id) => ids.get(id));
        if (linked.some((e) => !e))
            issues.push(label + "unknown evidence reference");
        if ((0, checker_common_ts_1.missingClaims)(e.body, linked
            .filter(Boolean)
            .map((e) => e.excerpt)
            .join("\n"), true).length)
            issues.push(label +
                "numeric claim has no matching number and unit in linked evidence");
        const local = new Set();
        for (const sentence of e.body
            .split(/(?<=[.!?])\s+/)
            .map(checker_common_ts_1.normalizeQuote)
            .filter((s) => (0, checker_common_ts_1.count)(s) >= 4)) {
            const key = sentence.toLowerCase();
            if (sentences.has(key))
                issues.push(label + "repeated sentence from another email");
            local.add(key);
        }
        local.forEach((x) => sentences.add(x));
    });
    let prior = -Infinity, base = (0, checker_common_ts_1.iso)(a.start) ? new Date(a.start + "T00:00:00Z") : null, firstMoved = false;
    if (base && a.anchor === "first_send") {
        const original = +base;
        while (base.getUTCDay() % 6 === 0)
            base.setUTCDate(base.getUTCDate() + 1);
        firstMoved = +base !== original;
        base.setUTCDate(base.getUTCDate() - (days[0] ?? 0));
    }
    const dates = base &&
        days.length &&
        !issues.some((x) => /Day offsets|Days must/.test(x))
        ? days.map((offset, i) => {
            const d = new Date(+base);
            d.setUTCDate(d.getUTCDate() + offset);
            const requested = i === 0 && firstMoved ? a.start : d.toISOString().slice(0, 10);
            while (d.getUTCDay() % 6 === 0 || +d <= prior)
                d.setUTCDate(d.getUTCDate() + 1);
            prior = +d;
            return {
                offset,
                requested,
                scheduled: d.toISOString().slice(0, 10),
                weekday: (0, checker_common_ts_1.day)(d.toISOString().slice(0, 10)),
                moved: requested !== d.toISOString().slice(0, 10),
            };
        })
        : [];
    const thin = a.emails.every((e) => (0, checker_common_ts_1.count)(e.body) < 5);
    if (thin)
        issues.unshift("Too little email text to check a substantive sequence.");
    return (0, checker_common_ts_1.report)(issues, {
        emailCount: a.emails.length,
        dates,
        days,
        daysSource: a.days ? "your value" : "example default",
        inputMode: a.pasted_text ? "pasted text" : "email rows",
        counts: a.emails.map((e) => ({
            subjectCharacters: [...e.subject].length,
            bodyWords: (0, checker_common_ts_1.count)(e.body),
        })),
    }, [
        "Example send days are not benchmarks. UTC calendar dates, no holiday or timezone scheduling. Deal Execution release remains held.",
    ], thin);
});
define("proposal_structure_check", "Check a proposal outline for buyer-problem links, proof references, commercial and implementation sections, next actions and supplied brand tokens.", (0, checker_common_ts_1.object)({
    buyer_problem: checker_common_ts_1.text,
    audience: checker_common_ts_1.text,
    sections: (0, checker_common_ts_1.array)((0, checker_common_ts_1.object)({
        kind: (0, checker_common_ts_1.choice)("problem", "approach", "proof", "implementation", "commercials", "next_step"),
        heading: checker_common_ts_1.text,
        body: checker_common_ts_1.text,
        evidence_ids: (0, checker_common_ts_1.array)(checker_common_ts_1.text),
    }), 1),
    evidence: (0, checker_common_ts_1.array)(checker_common_ts_1.evidence),
    brand: (0, checker_common_ts_1.object)({
        primary_color: checker_common_ts_1.text,
        heading_font: checker_common_ts_1.text,
        body_font: checker_common_ts_1.text,
        source: checker_common_ts_1.text,
    }),
}), (a) => {
    const issues = (0, checker_common_ts_1.evidenceIssues)(a.evidence);
    const expected = [
        "problem",
        "approach",
        "proof",
        "implementation",
        "commercials",
        "next_step",
    ];
    const missing = expected.filter((k) => !a.sections.some((s) => s.kind === k));
    missing.forEach((k) => issues.push(`Missing proposal section: ${k}`));
    const ids = new Set(a.evidence.map((e) => e.id));
    a.sections.forEach((s, i) => {
        if (["approach", "proof"].includes(s.kind) && !s.evidence_ids.length)
            issues.push(`Section ${i + 1}: proof reference missing`);
        if (s.evidence_ids.some((id) => !ids.has(id)))
            issues.push(`Section ${i + 1}: unknown proof reference`);
    });
    if (!/^#[a-fA-F0-9]{6}$/.test(a.brand.primary_color))
        issues.push("Brand color must be supplied as a six-digit hex value");
    return (0, checker_common_ts_1.report)(issues, {
        missingSections: missing,
        outline: a.sections.map((s) => ({
            kind: s.kind,
            heading: s.heading,
            words: (0, checker_common_ts_1.count)(s.body),
            evidence_ids: s.evidence_ids,
        })),
        brand: a.brand,
    }, [
        "The tool does not infer buyer pain, brand style, ROI or proof, and does not generate a deck. Visual, contractual and semantic review remains required.",
    ]);
});
// The published schema describes either a paste or rows; validation retains all
// row requirements after the deterministic paste adapter has run.
const validationSchemas = new Map(Object.entries(registry).map(([name, entry]) => [
    name,
    entry.tool.inputSchema,
]));
for (const [name, rows, required] of [
    ["sales_sequence_check", "emails", ["type", "start", "anchor"]],
    ["launch_copy_check", "assets", []],
    ["newsletter_source_check", "items", []],
]) {
    const entry = registry[name];
    if (entry)
        entry.tool.inputSchema = {
            ...entry.tool.inputSchema,
            required,
            anyOf: [
                { required: ["pasted_text"] },
                { required: validationSchemas.get(name).required },
            ],
        };
}
// Held definitions stay in source for review but cannot be listed or called.
const held = new Set(["prompt_structure_check", "proposal_structure_check"]);
exports.waveTools = Object.values(registry)
    .map((x) => x.tool)
    .filter((t) => !held.has(t.name));
const isWaveTool = (name) => !held.has(name) && Object.prototype.hasOwnProperty.call(registry, name);
exports.isWaveTool = isWaveTool;
function callWaveTool(name, args) {
    if (!(0, exports.isWaveTool)(name))
        return {
            isError: true,
            content: [{ type: "text", text: "Unknown or held wave tool." }],
        };
    const entry = registry[name], schema = validationSchemas.get(name);
    let record = args;
    let effective = schema;
    const provided = (0, checker_common_ts_1.validate)({ ...schema, required: [] }, args);
    if (provided.length)
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ status: "INVALID_INPUT", issues: provided }, null, 2),
                },
            ],
        };
    if (record?.pasted_text) {
        record = { ...record };
        const pasted = record.pasted_text;
        if (name === "sales_sequence_check") {
            if (record.emails)
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: "INVALID_INPUT: supply pasted text or email rows, not both.",
                        },
                    ],
                };
            record.emails = (0, checker_common_ts_1.parseEmails)(pasted);
            record.evidence ??= [];
        }
        if (name === "launch_copy_check") {
            if (record.assets)
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: "INVALID_INPUT: supply pasted text or assets, not both.",
                        },
                    ],
                };
            record.assets = pasted
                .split(/\r?\n/)
                .filter((s) => s.trim())
                .map((text, i) => ({ label: "Line " + (i + 1), text }));
            record.claims ??= [];
            record.dates ??= [];
            record.quotes ??= [];
        }
        if (name === "newsletter_source_check") {
            if (record.items)
                return {
                    isError: true,
                    content: [
                        {
                            type: "text",
                            text: "INVALID_INPUT: supply pasted text or story rows, not both.",
                        },
                    ],
                };
            record.items = (0, checker_common_ts_1.parseNewsletter)(pasted);
            record.cutoff ??= "";
            record.issue_date ??= "";
            record.lead_index ??= 0;
            effective = { ...schema, required: ["items"] };
        }
    }
    const problems = (0, checker_common_ts_1.validate)(effective, record);
    if (problems.length)
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ status: "INVALID_INPUT", issues: problems }, null, 2),
                },
            ],
        };
    try {
        const result = entry.run(record);
        return {
            content: [{ type: "text", text: (0, checker_common_ts_1.readerText)(result, escape_inputs_ts_1.escapeText) }],
            structuredContent: result,
        };
    }
    catch {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: "Input could not be checked. No external action occurred.",
                },
            ],
        };
    }
}
//# sourceMappingURL=wave2-checkers.js.map