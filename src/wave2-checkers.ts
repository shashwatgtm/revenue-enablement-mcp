import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { escapeText } from "./escape-inputs.ts";
import {
  type Row,
  type Schema,
  text,
  num,
  choice,
  object,
  array,
  count,
  iso,
  day,
  safeUrl,
  validate,
  evidence,
  evidenceIssues,
  unique,
  report,
  claimTokens,
  missingClaims,
  normalizeQuote,
  canonicalUrl,
  hasDash,
  superlative,
  placeholder,
  parseEmails,
  parseNewsletter,
  readerText,
} from "./checker-common.ts";
const registry: Record<string, { tool: Tool; run: (a: Row) => Row }> = {};
function define(
  name: string,
  description: string,
  schema: Schema,
  run: (a: Row) => Row,
) {
  schema.properties!.your_sector = choice(
    "logistics_tech",
    "fintech",
    "saas",
    "vertical_saas",
    "ai_native",
    "ites",
    "telecom",
    "software",
    "cybersecurity",
    "other",
  );
  registry[name] = {
    tool: {
      name,
      description,
      inputSchema: schema as Tool["inputSchema"],
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
define(
  "competitive_evidence_check",
  "Check supplied comparison evidence, source status, number/unit matches, missing sides, same-source pairs and source recency. Ask for the review date; never invent evidence or call a pasted source verified.",
  object(
    {
      relationship: choice(
        "unrelated_confirmed_by_user",
        "same_group",
        "unknown",
      ),
      as_of: text,
      stale_after_days: num,
      criteria: array(
        object(
          {
            criterion: text,
            buyer_need: text,
            our_evidence_id: text,
            alternative_evidence_id: text,
            verdict: choice("advantage", "parity", "gap", "unknown"),
          },
          ["criterion", "buyer_need", "verdict"],
        ),
        1,
      ),
      evidence: array(evidence),
    },
    ["relationship", "as_of", "criteria", "evidence"],
  ),
  (a) => {
    const window = a.stale_after_days ?? 90,
      issues = evidenceIssues(a.evidence, a.as_of, window);
    if (!iso(a.as_of)) issues.push("Review date invalid; use YYYY-MM-DD.");
    issues.push(
      ...unique(a.evidence, "id"),
      ...unique(a.criteria, "criterion"),
    );
    if (a.relationship !== "unrelated_confirmed_by_user")
      issues.push(
        a.relationship === "same_group"
          ? "Same-group relationship: targeted competitive use is held."
          : "Ownership relationship is unresolved.",
      );
    const ids = new Map<string, Row>(a.evidence.map((e: Row) => [e.id, e]));
    const matrix = a.criteria.map((c: Row, i: number) => {
      const ours = ids.get(c.our_evidence_id),
        other = ids.get(c.alternative_evidence_id),
        missing = !ours || !other;
      if (missing)
        issues.push(
          "Criterion " +
            (i + 1) +
            ": missing linked evidence; an unknown side stays unknown.",
        );
      if (ours && other && c.our_evidence_id === c.alternative_evidence_id)
        issues.push(
          "Criterion " +
            (i + 1) +
            ": same evidence ID is cited for both sides.",
        );
      if (
        c.verdict !== "unknown" &&
        (!ours ||
          !other ||
          ours.status !== "verified_opened" ||
          other.status !== "verified_opened")
      )
        issues.push(
          "Criterion " +
            (i + 1) +
            ": verdict exceeds the supplied evidence status",
        );
      if (c.verdict === "advantage" && ours && other) {
        const left = claimTokens(ours.excerpt, true),
          right = claimTokens(other.excerpt, true);
        if (
          left.some((l) =>
            right.some((r) => l.unit && l.unit === r.unit && l.value < r.value),
          )
        )
          issues.push(
            "Criterion " +
              (i + 1) +
              ": claimed advantage conflicts with a lower comparable number; confirm which direction is better.",
          );
      }
      return { ...c, evidenceLinksPresent: !missing };
    });
    return report(
      issues,
      {
        matrix,
        relationship: a.relationship,
        asOf: a.as_of,
        staleAfterDays: window,
        windowSource:
          a.stale_after_days === undefined
            ? "example review window"
            : "supplied",
      },
      [
        "Interview/document dates may be month-only; recency uses the end of that month and future checks use its start.",
        "A supplied verdict is not a proven advantage; direction, scope, pricing and ownership need human review.",
      ],
    );
  },
);

const sequenceDefaults: Record<string, number[] | null> = {
  cold_outreach: [1, 3, 7, 12, 17],
  warm_follow_up: [0, 3, 7],
  post_demo: [0, 2, 5, 10],
  proposal_follow_up: [1, 3, 7, 12],
  referral_request: [1, 4, 9],
  re_engagement: null,
};
define(
  "sales_sequence_check",
  "Check an authored sequence pasted with Subject: headings or supplied as email rows. Uses the skill's six sequence types and labelled example send days, preserves first-send gaps, and checks dates, repeated sentences, misleading subjects and number/unit evidence. Ask for missing scheduling facts. Sends nothing.",
  object(
    {
      type: choice(...Object.keys(sequenceDefaults)),
      start: text,
      anchor: choice("trigger", "first_send"),
      days: array(num, 1),
      pasted_text: text,
      emails: array(
        object(
          { subject: text, body: text, ask: text, evidence_ids: array(text) },
          ["subject", "body", "evidence_ids"],
        ),
        1,
      ),
      evidence: array(evidence),
    },
    ["type", "start", "anchor", "emails", "evidence"],
  ),
  (a) => {
    const issues = evidenceIssues(a.evidence),
      defaults = sequenceDefaults[a.type],
      days: number[] = a.days ?? defaults?.slice(0, a.emails.length) ?? [];
    if (!iso(a.start)) issues.push("Start date invalid");
    if (!days.length)
      issues.push(
        "This sequence type has no example default; supply day offsets.",
      );
    if (days.some((n: number) => !Number.isInteger(n) || n > 3660))
      issues.push("Days must be whole offsets within ten years");
    if (days.some((n: number, i: number) => i > 0 && n <= days[i - 1]))
      issues.push("Day offsets must be strictly increasing");
    if (days.length !== a.emails.length)
      issues.push("Email count differs from send-day count");
    const ids = new Map<string, Row>(a.evidence.map((e: Row) => [e.id, e])),
      asks = new Set<string>(),
      sentences = new Set<string>();
    a.emails.forEach((e: Row, i: number) => {
      const label = "Email " + (i + 1) + ": ",
        ask = (e.ask ?? "").trim().toLowerCase();
      if (!ask)
        issues.push(
          label + "ask not separately confirmed; review the pasted question.",
        );
      else if (asks.has(ask)) issues.push(label + "repeated ask");
      if (ask) asks.add(ask);
      if (/^\s*(re|fw|fwd)\s*:/i.test(e.subject))
        issues.push(label + "misleading reply or forward subject");
      if (
        /[!]/.test(e.subject + " " + e.body) ||
        hasDash(e.subject + " " + e.body)
      )
        issues.push(label + "exclamation mark or dash");
      const linked = e.evidence_ids.map((id: string) => ids.get(id));
      if (linked.some((e: Row | undefined) => !e))
        issues.push(label + "unknown evidence reference");
      if (
        missingClaims(
          e.body,
          linked
            .filter(Boolean)
            .map((e: Row) => e.excerpt)
            .join("\n"),
          true,
        ).length
      )
        issues.push(
          label +
            "numeric claim has no matching number and unit in linked evidence",
        );
      const local = new Set<string>();
      for (const sentence of e.body
        .split(/(?<=[.!?])\s+/)
        .map(normalizeQuote)
        .filter((s: string) => count(s) >= 4)) {
        const key = sentence.toLowerCase();
        if (sentences.has(key))
          issues.push(label + "repeated sentence from another email");
        local.add(key);
      }
      local.forEach((x) => sentences.add(x));
    });
    let prior = -Infinity,
      base = iso(a.start) ? new Date(a.start + "T00:00:00Z") : null,
      firstMoved = false;
    if (base && a.anchor === "first_send") {
      const original = +base;
      while (base.getUTCDay() % 6 === 0) base.setUTCDate(base.getUTCDate() + 1);
      firstMoved = +base !== original;
      base.setUTCDate(base.getUTCDate() - (days[0] ?? 0));
    }
    const dates =
      base &&
      days.length &&
      !issues.some((x) => /Day offsets|Days must/.test(x))
        ? days.map((offset, i) => {
            const d = new Date(+base!);
            d.setUTCDate(d.getUTCDate() + offset);
            const requested =
              i === 0 && firstMoved ? a.start : d.toISOString().slice(0, 10);
            while (d.getUTCDay() % 6 === 0 || +d <= prior)
              d.setUTCDate(d.getUTCDate() + 1);
            prior = +d;
            return {
              offset,
              requested,
              scheduled: d.toISOString().slice(0, 10),
              weekday: day(d.toISOString().slice(0, 10)),
              moved: requested !== d.toISOString().slice(0, 10),
            };
          })
        : [];
    const thin = a.emails.every((e: Row) => count(e.body) < 5);
    if (thin)
      issues.unshift("Too little email text to check a substantive sequence.");
    return report(
      issues,
      {
        emailCount: a.emails.length,
        dates,
        days,
        daysSource: a.days ? "your value" : "example default",
        inputMode: a.pasted_text ? "pasted text" : "email rows",
        counts: a.emails.map((e: Row) => ({
          subjectCharacters: [...e.subject].length,
          bodyWords: count(e.body),
        })),
      },
      [
        "Example send days are not benchmarks. UTC calendar dates, no holiday or timezone scheduling. Deal Execution release remains held.",
      ],
      thin,
    );
  },
);
define(
  "proposal_structure_check",
  "Check a proposal outline for buyer-problem links, proof references, commercial and implementation sections, next actions and supplied brand tokens.",
  object({
    buyer_problem: text,
    audience: text,
    sections: array(
      object({
        kind: choice(
          "problem",
          "approach",
          "proof",
          "implementation",
          "commercials",
          "next_step",
        ),
        heading: text,
        body: text,
        evidence_ids: array(text),
      }),
      1,
    ),
    evidence: array(evidence),
    brand: object({
      primary_color: text,
      heading_font: text,
      body_font: text,
      source: text,
    }),
  }),
  (a) => {
    const issues = evidenceIssues(a.evidence);
    const expected = [
      "problem",
      "approach",
      "proof",
      "implementation",
      "commercials",
      "next_step",
    ];
    const missing = expected.filter(
      (k) => !a.sections.some((s: Row) => s.kind === k),
    );
    missing.forEach((k) => issues.push(`Missing proposal section: ${k}`));
    const ids = new Set(a.evidence.map((e: Row) => e.id));
    a.sections.forEach((s: Row, i: number) => {
      if (["approach", "proof"].includes(s.kind) && !s.evidence_ids.length)
        issues.push(`Section ${i + 1}: proof reference missing`);
      if (s.evidence_ids.some((id: string) => !ids.has(id)))
        issues.push(`Section ${i + 1}: unknown proof reference`);
    });
    if (!/^#[a-fA-F0-9]{6}$/.test(a.brand.primary_color))
      issues.push("Brand color must be supplied as a six-digit hex value");
    return report(
      issues,
      {
        missingSections: missing,
        outline: a.sections.map((s: Row) => ({
          kind: s.kind,
          heading: s.heading,
          words: count(s.body),
          evidence_ids: s.evidence_ids,
        })),
        brand: a.brand,
      },
      [
        "The tool does not infer buyer pain, brand style, ROI or proof, and does not generate a deck. Visual, contractual and semantic review remains required.",
      ],
    );
  },
);

// The published schema describes either a paste or rows; validation retains all
// row requirements after the deterministic paste adapter has run.
const validationSchemas = new Map(
  Object.entries(registry).map(([name, entry]) => [
    name,
    entry.tool.inputSchema as Schema,
  ]),
);
for (const [name, rows, required] of [
  ["sales_sequence_check", "emails", ["type", "start", "anchor"]],
  ["launch_copy_check", "assets", []],
  ["newsletter_source_check", "items", []],
] as [string, string, string[]][]) {
  const entry = registry[name];
  if (entry)
    entry.tool.inputSchema = {
      ...entry.tool.inputSchema,
      required,
      anyOf: [
        { required: ["pasted_text"] },
        { required: validationSchemas.get(name)!.required },
      ],
    };
}
// Held definitions stay in source for review but cannot be listed or called.
const held = new Set(["prompt_structure_check", "proposal_structure_check"]);
export const waveTools: Tool[] = Object.values(registry)
  .map((x) => x.tool)
  .filter((t) => !held.has(t.name));
export const isWaveTool = (name: string) =>
  !held.has(name) && Object.prototype.hasOwnProperty.call(registry, name);
export function callWaveTool(name: string, args: unknown): CallToolResult {
  if (!isWaveTool(name))
    return {
      isError: true,
      content: [{ type: "text", text: "Unknown or held wave tool." }],
    };
  const entry = registry[name],
    schema = validationSchemas.get(name)!;
  let record = args as Row;
  let effective = schema;
  const provided = validate({ ...schema, required: [] }, args);
  if (provided.length)
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { status: "INVALID_INPUT", issues: provided },
            null,
            2,
          ),
        },
      ],
    };
  if (record?.pasted_text) {
    record = { ...record };
    const pasted = record.pasted_text as string;
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
      record.emails = parseEmails(pasted);
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
      record.items = parseNewsletter(pasted);
      record.cutoff ??= "";
      record.issue_date ??= "";
      record.lead_index ??= 0;
      effective = { ...schema, required: ["items"] };
    }
  }
  const problems = validate(effective, record);
  if (problems.length)
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { status: "INVALID_INPUT", issues: problems },
            null,
            2,
          ),
        },
      ],
    };
  try {
    const result = entry.run(record);
    return {
      content: [{ type: "text", text: readerText(result, escapeText) }],
      structuredContent: result,
    };
  } catch {
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
