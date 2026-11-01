"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeholder = exports.superlative = exports.hasDash = exports.report = exports.unique = exports.normalizeQuote = exports.evidence = exports.safeUrl = exports.day = exports.iso = exports.count = exports.array = exports.object = exports.choice = exports.num = exports.text = void 0;
exports.validate = validate;
exports.canonicalUrl = canonicalUrl;
exports.claimTokens = claimTokens;
exports.missingClaims = missingClaims;
exports.evidenceIssues = evidenceIssues;
exports.parseEmails = parseEmails;
exports.parseNewsletter = parseNewsletter;
exports.readerText = readerText;
exports.text = { type: "string", maxLength: 20000 };
exports.num = { type: "number", minimum: 0 };
const choice = (...values) => ({
    ...exports.text,
    enum: values,
});
exports.choice = choice;
const object = (properties, required = Object.keys(properties)) => ({
    type: "object",
    properties,
    required,
    additionalProperties: false,
});
exports.object = object;
const array = (items, minItems = 0) => ({
    type: "array",
    items,
    minItems,
    maxItems: 200,
});
exports.array = array;
const count = (s) => s.trim().split(/\s+/).filter(Boolean).length;
exports.count = count;
const iso = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(+new Date(s + "T00:00:00Z")) &&
    new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
exports.iso = iso;
const day = (s) => (0, exports.iso)(s)
    ? new Date(s + "T00:00:00Z").toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
    })
    : "invalid";
exports.day = day;
const safeUrl = (s) => {
    try {
        const u = new URL(s);
        return ["http:", "https:"].includes(u.protocol) &&
            !u.username &&
            !u.password
            ? u
            : null;
    }
    catch {
        return null;
    }
};
exports.safeUrl = safeUrl;
function validate(s, v, path = "$") {
    const issues = [];
    if (s.type === "object") {
        if (!v || typeof v !== "object" || Array.isArray(v))
            return [`${path}: object required`];
        for (const k of s.required ?? [])
            if (!Object.prototype.hasOwnProperty.call(v, k) ||
                (typeof v[k] === "string" && !v[k].trim()))
                issues.push(`${path}.${k}: required`);
        for (const [k, x] of Object.entries(v)) {
            if (!Object.prototype.hasOwnProperty.call(s.properties ?? {}, k))
                issues.push(`${path}: unknown property`);
            else
                issues.push(...validate(s.properties[k], x, `${path}.${k}`));
        }
    }
    else if (s.type === "array") {
        if (!Array.isArray(v))
            return [`${path}: array required`];
        if (v.length < (s.minItems ?? 0) || v.length > (s.maxItems ?? 200))
            return [`${path}: row count outside allowed bounds`];
        v.forEach((x, i) => issues.push(...validate(s.items, x, `${path}[${i + 1}]`)));
    }
    else if (s.type === "string") {
        if (typeof v !== "string")
            return [`${path}: text required`];
        if (v.length > (s.maxLength ?? 20000))
            issues.push(`${path}: text too long`);
        if (s.enum && !s.enum.includes(v))
            issues.push(`${path}: unsupported choice`);
    }
    else if (s.type === "number") {
        if (typeof v !== "number" ||
            !Number.isFinite(v) ||
            (s.minimum !== undefined && v < s.minimum))
            issues.push(`${path}: finite number in range required`);
    }
    return issues;
}
exports.evidence = (0, exports.object)({
    id: exports.text,
    claim: exports.text,
    source: exports.text,
    source_type: (0, exports.choice)("url", "interview", "document", "internal_record"),
    source_date: exports.text,
    excerpt: exports.text,
    status: (0, exports.choice)("verified_opened", "as_pasted", "user_supplied", "unverified", "conflicting"),
}, ["id", "claim", "source", "source_date", "excerpt", "status"]);
const normalizeQuote = (value) => value
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
exports.normalizeQuote = normalizeQuote;
function canonicalUrl(value) {
    const u = (0, exports.safeUrl)(value);
    if (!u)
        return "";
    u.protocol = "https:";
    u.hostname = u.hostname.replace(/^www\./i, "");
    u.hash = "";
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    for (const key of [...u.searchParams.keys()])
        if (/^utm_/i.test(key) || ["gclid", "fbclid"].includes(key.toLowerCase()))
            u.searchParams.delete(key);
    u.searchParams.sort();
    return u.href;
}
const digitWords = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
};
function claimTokens(value, includeSmall = false) {
    let s = value
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, " ")
        .replace(/\b\d{4}-\d{2}(?:-\d{2})?\b/g, " ");
    const wordPattern = new RegExp("\\b(" +
        Object.keys(digitWords).join("|") +
        ")(?=[ -]+(?:" +
        Object.keys(digitWords).join("|") +
        ")\\b|\\s+(?:percent|per cent|times)\\b)", "g");
    s = s
        .replace(wordPattern, (w) => String(digitWords[w]))
        .replace(/\b(\d{2})[ -]+(one|two|three|four|five|six|seven|eight|nine)\b/g, (_, t, u) => String(Number(t) + digitWords[u]));
    const out = [];
    const rx = /(?<![\w.])([$₹€£]?\s*)(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?:\s*(%|percent|per cent|x\b|times\b|[kmb]\b))?(?:[ \t]+([a-z]+))?/g;
    for (const m of s.matchAll(rx)) {
        let n = Number(m[2].replace(/,/g, "")), unit = (m[4] ?? "").replace(/s$/, ""), kind = "count";
        const prefix = m[1].trim(), suffix = m[3] ?? "";
        if (prefix) {
            kind = "currency";
            unit = { $: "usd", "₹": "inr", "€": "eur", "£": "gbp" }[prefix];
            if (/^[kmb]$/.test(suffix))
                n *= { k: 1e3, m: 1e6, b: 1e9 }[suffix];
        }
        else if (["%", "percent", "per cent"].includes(suffix)) {
            kind = "percent";
            unit = "%";
        }
        else if (["x", "times"].includes(suffix)) {
            kind = "multiplier";
            unit = "x";
        }
        if (kind === "count" &&
            ((n <= 10 && !includeSmall) || /^(?:19|20)\d{2}$/.test(String(n))))
            continue;
        if ([
            "and",
            "or",
            "the",
            "a",
            "an",
            "to",
            "of",
            "in",
            "on",
            "at",
            "for",
            "with",
            "by",
            "from",
            "as",
            "is",
        ].includes(unit))
            unit = "";
        out.push({ value: n, unit, kind, key: n + ":" + unit });
    }
    return out;
}
function missingClaims(claim, excerpt, onlySales = false) {
    const keys = new Set(claimTokens(excerpt).map((t) => t.key));
    return claimTokens(claim).filter((t) => (!onlySales || t.kind !== "count") && !keys.has(t.key));
}
function dateBounds(s) {
    if ((0, exports.iso)(s))
        return [s, s];
    if (/^\d{4}-\d{2}$/.test(s) && (0, exports.iso)(s + "-01")) {
        const end = new Date(s + "-01T00:00:00Z");
        end.setUTCMonth(end.getUTCMonth() + 1);
        end.setUTCDate(0);
        return [s + "-01", end.toISOString().slice(0, 10)];
    }
    return null;
}
function evidenceIssues(rows, asOf, window = 90) {
    return rows.flatMap((r, i) => {
        const out = [], label = "Evidence " + (i + 1) + ": ";
        if (!r.source_type && !(0, exports.safeUrl)(r.source))
            out.push(label + "row ID " + (r.id || "not supplied") + ": missing source_type. Allowed values: url, interview, document, internal_record. Confirm internal_record or document for this non URL source; the record has not been opened or verified.");
        else if (r.source_type === "url" && !(0, exports.safeUrl)(r.source))
            out.push(label +
                "source must be an HTTP(S) URL, or identify an interview, document or internal record");
        if (r.source_type && r.source_type !== "url" && !r.source.trim())
            out.push(label + "source description missing");
        const bounds = dateBounds(r.source_date);
        if (!bounds)
            out.push(label + "source date invalid; use YYYY-MM-DD or YYYY-MM");
        if (r.status !== "verified_opened")
            out.push(label +
                (r.status === "user_supplied" || r.status === "as_pasted"
                    ? "as pasted, not independently checked"
                    : r.status));
        if (!r.excerpt.trim())
            out.push(label + "excerpt missing");
        if (missingClaims(r.claim, r.excerpt).length)
            out.push(label + "numeric claim does not match the excerpt's number and unit");
        if (bounds && asOf && (0, exports.iso)(asOf)) {
            if (bounds[0] > asOf)
                out.push(label + "source date is in the future");
            if ((+new Date(asOf) - +new Date(bounds[1])) / 86400000 > window)
                out.push(label + "source is stale under the stated review window");
        }
        return out;
    });
}
const unique = (rows, key) => {
    const seen = new Set();
    return rows.flatMap((r, i) => {
        const k = String(r[key]).trim().toLowerCase();
        if (seen.has(k))
            return ["Row " + (i + 1) + ": duplicate " + key];
        seen.add(k);
        return [];
    });
};
exports.unique = unique;
const report = (issues, data, limitations, thin = false) => ({
    status: thin
        ? "TOO_LITTLE_TO_CHECK"
        : issues.length
            ? "CHECKS_FOUND"
            : "NO_MECHANICAL_ISSUES",
    issues,
    ...data,
    limitations: [
        "Only supplied data was checked. No page was fetched, model called, message sent or truth independently verified.",
        "Source-opening status is caller-reported; a clean mechanical result does not establish truth.",
        ...limitations,
    ],
});
exports.report = report;
const hasDash = (text) => /[\u2012\u2013\u2014\u2015\u2212]|\s-\s|(?<!-)-(?:-)(?!-)/u.test(text);
exports.hasDash = hasDash;
const superlative = (text) => /\b(?:world.?s first|first(?!\s+(?:step|day|email|review))|only|largest|best|proven|world.class|leading(?!\s+indicators))\b|#1\b/i.test(text);
exports.superlative = superlative;
const placeholder = (text) => !text.trim() || /\[user to add:|\b(?:tbd|todo|not supplied)\b/i.test(text);
exports.placeholder = placeholder;
function parseEmails(text) {
    const emails = [];
    for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*subject\s*:\s*(.*)$/i);
        if (match)
            emails.push({
                subject: match[1].trim(),
                body: "",
                ask: "",
                evidence_ids: [],
            });
        else if (emails.length)
            emails[emails.length - 1].body += line + "\n";
    }
    return emails.map((e) => ({ ...e, body: e.body.trim() }));
}
function parseNewsletter(text) {
    const stripped = text.replace(/^(\x60{3}|~{3}).*?^\1[^\n]*$/gms, "");
    return stripped
        .split(/^### /m)
        .slice(1)
        .map((block) => {
        const lines = block.split(/\r?\n/);
        return {
            title: lines.shift()?.trim() ?? "",
            url: block.match(/https?:\/\/[^\s<>]+/)?.[0] ?? "",
            date: block.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ?? "",
            excerpt: lines.join("\n").trim(),
            take: "",
            why_it_matters: "",
            status: "as_pasted",
        };
    });
}
function readerText(result, escape) {
    const status = result.status === "TOO_LITTLE_TO_CHECK"
        ? "Too little to check. Add substantive text before relying on this review."
        : result.status === "CHECKS_FOUND"
            ? "Checks found: " + result.issues.length + ". Review the issues below."
            : "No mechanical issues found. Source truth has not been independently verified.";
    const lines = [status, ...result.issues.map((s) => "- " + s)];
    const walk = (value, label) => {
        if (Array.isArray(value))
            value.forEach((v, i) => walk(v, label + " " + (i + 1)));
        else if (value && typeof value === "object")
            Object.entries(value).forEach(([k, v]) => walk(v, (label ? label + " / " : "") +
                k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ")));
        else if (value !== undefined)
            lines.push(label + ": " + String(value));
    };
    for (const [key, value] of Object.entries(result))
        if (!["status", "issues"].includes(key))
            walk(value, key);
    return escape(lines.join("\n"));
}
//# sourceMappingURL=checker-common.js.map