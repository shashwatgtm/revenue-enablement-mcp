// Echo fixes, 6 Nov 2026. A changed input must change a conclusion, not only echoed words.
// Every block here is deterministic: it reads only the supplied fields, uses no lookups and no randomness.
// A number is either computed from the user's own inputs or labelled as an example default.
type Args = Record<string, unknown>;

const s = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const items = (v: unknown): string[] => s(v).split(/\r?\n|;/).map(x => x.trim().replace(/[.]+$/, '')).filter(Boolean);
const upFirst = (x: string): string => x.charAt(0).toUpperCase() + x.slice(1);
const lowFirst = (x: string): string => (/^[A-Z][a-z]/.test(x) ? x.charAt(0).toLowerCase() + x.slice(1) : x);
const productShort = (v: unknown, fallback = 'the solution'): string => {
  const t = s(v).split(/[,:(]/)[0].trim();
  return t || fallback;
};
const fmt = (n: number): string => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

/** Insert a block before the first heading that matches, or before the first "## " heading after the title block. */
function insertBeforeHeading(out: string, marker: RegExp | null, block: string): string {
  const idx = marker ? out.search(marker) : out.search(/\n## /);
  if (idx < 0) return out + '\n\n' + block;
  return out.slice(0, idx).replace(/\s+$/, '') + '\n\n' + block.trim() + '\n' + out.slice(idx);
}

// ---------------------------------------------------------------------------------------------------------------
// Rows 1 and 2: champion_enablement_kit
// ---------------------------------------------------------------------------------------------------------------
type StakeholderKind = 'risk' | 'procurement' | 'finance' | 'legal' | 'it' | 'ops' | 'exec' | 'revenue' | 'other';
export function stakeholderKind(t: string): StakeholderKind {
  const x = t.toLowerCase();
  if (/\b(risk|security|ciso|compliance|audit|infosec|privacy|dpo|governance)\b/.test(x)) return 'risk';
  if (/\b(procurement|purchasing|sourcing|vendor management|supply chain|buyer)\b/.test(x)) return 'procurement';
  if (/\b(cfo|financ\w*|controller|treasur\w*|fp&a|accounting)\b/.test(x)) return 'finance';
  if (/\b(legal|counsel|contracts?)\b/.test(x)) return 'legal';
  if (/\b(cio|cto|it|technology|engineering|architect\w*|platform|infrastructure|data)\b/.test(x)) return 'it';
  if (/\b(operations?|ops|support|service|delivery|customer)\b/.test(x)) return 'ops';
  if (/\b(ceo|coo|chief executive|founder|president|managing director|chairman|board|general manager|business head|head of the [a-z ]+ business)\b/.test(x)) return 'exec';
  if (/\b(sales|revenue|cro|cmo|marketing|growth|commercial)\b/.test(x)) return 'revenue';
  return 'other';
}

interface Ctx { P: string; who: string; cc: string; budget: string; urgency: string }
interface Profile { label: string; concerns: string[]; questions: string[]; next: (c: Ctx) => string; ask: (c: Ctx) => string }
const withUrgency = (c: Ctx): string => (c.urgency ? ` The timing you gave: ${c.urgency}.` : '');
const PROFILES: Record<StakeholderKind, Profile> = {
  procurement: {
    label: 'commercial and sourcing',
    concerns: [
      'Commercial terms: the price structure, the term, renewal and price rise limits, and what the fee includes.',
      'Exit and termination rights: how the buyer leaves, what notice applies, and how data and work in flight are returned.',
      'Price against renewing or keeping the current option, on the same scope and period.',
      'Vendor due diligence documents: company and financial standing, insurance, security attestations, references and the subcontractor list.'
    ],
    questions: [
      'What is the all in price for this scope, and what moves it?',
      'What are the termination rights and the notice period, and what happens to data and live work on exit?',
      'How does this price compare with renewing the current option, over the same period?',
      'Which due diligence documents does the vendor onboarding checklist require, and by when?'
    ],
    next: c => `Ask ${c.who} for the vendor onboarding checklist and the list of due diligence documents this week, and send it to ${c.P} so the documents are ready before the first commercial meeting. Put the renewal price of ${c.cc || 'the current option'} next to the proposed price, on the same scope and period.${withUrgency(c)}`,
    ask: c => `Agree the document list and a date for the commercial terms review, and name the person who signs the vendor onboarding.`
  },
  risk: {
    label: 'risk and outsourcing',
    concerns: [
      'Whether the arrangement counts as material outsourcing, and what review it triggers.',
      'Where data is stored and processed, and who can access it.',
      'What happens to the buyer\'s own customers if the service has an outage, and how fast it recovers.',
      'Audit rights, incident reporting, subcontractors and a tested exit plan.'
    ],
    questions: [
      'Which of our criteria make this a material arrangement, and which approvals follow?',
      'Where is data stored and processed, and what is the evidence?',
      'What is the uptime record, the outage process and the recovery commitment in writing?',
      'What audit rights and exit plan will the contract carry?'
    ],
    next: c => `Ask ${c.who} for the outsourcing risk questionnaire and the materiality criteria, answer each from ${c.P}'s own documentation, and mark which answers still lack evidence.${withUrgency(c)}`,
    ask: c => `Classify the arrangement and name the evidence that would close each risk, so the review can start with a date.`
  },
  finance: {
    label: 'cash, payback and risk',
    concerns: [
      'Cash cost and when it falls due, against the budget line named.',
      'Payback: when the saving or gain covers the cost, from the buyer\'s own figures.',
      'Predictability: what makes the bill rise, and the worst case.',
      `Cost against ${'the current option'}, on the same scope and period.`
    ],
    questions: [
      'What is the total cash cost over the term, and what is not included?',
      'On whose figures is the saving calculated, and over what period?',
      'What is the downside if volume or usage is higher or lower than planned?',
      'Which metric will finance accept as proof, and who signs it off?'
    ],
    next: c => `Build a one page cost comparison of ${c.P} against ${c.cc || 'the current option'} from the buyer's own cost figures, and ask ${c.who} which cost line they will accept as the baseline.${withUrgency(c)}`,
    ask: c => `Agree the baseline cost, the sign off metric and the payback period finance will accept.`
  },
  legal: {
    label: 'contract and liability',
    concerns: [
      'Liability, indemnity and limits on both sides.',
      'Data protection terms and where processing takes place.',
      'Termination, exit and what survives.',
      'Intellectual property and the use of the buyer\'s data.'
    ],
    questions: [
      'Which clauses are non negotiable for the buyer?',
      'What liability cap and indemnity does the buyer expect?',
      'What data protection terms must the contract carry?',
      'What is the approval path for contract changes?'
    ],
    next: c => `Send the standard terms to ${c.who} early and ask for the list of required clauses, so the redlines start before the commercial review.${withUrgency(c)}`,
    ask: c => `Agree the list of required clauses and a date for the first redline round.`
  },
  it: {
    label: 'technology and integration',
    concerns: [
      'How the solution connects to the systems already in place.',
      'Security review, data handling and access control.',
      'Migration from the current option and the effort on the buyer\'s team.',
      'Support, monitoring and who is called when something breaks.'
    ],
    questions: [
      'Which systems must it connect to, and what is the integration effort?',
      'What security evidence will the review need?',
      'How is the move from the current option staged?',
      'What support model and response times apply?'
    ],
    next: c => `Set up a technical session with ${c.who}, bring ${c.P}'s technical documents, and ask for the architecture and security review checklist.${withUrgency(c)}`,
    ask: c => `Agree the technical review scope, the test environment and the security checklist date.`
  },
  ops: {
    label: 'day to day operations',
    concerns: [
      'How the daily work of the team changes, and the effort to learn it.',
      'Service levels and what the team does when the service fails.',
      'Who owns the change and the training.',
      'Whether the quality of the work stays the same during the switch.'
    ],
    questions: [
      'Which tasks move and which stay with the team?',
      'What is the fallback if the service fails during a busy period?',
      'What training and support does the team get?',
      'How will we know in the first weeks that it is working?'
    ],
    next: c => `Walk through one live process with ${c.who} and note where the team's work changes and where a person must stay in the loop.${withUrgency(c)}`,
    ask: c => `Agree one process for a pilot and the measure of success for the first weeks.`
  },
  exec: {
    label: 'decision and sponsorship',
    concerns: [
      'The outcome, in one sentence, and the cost to get it.',
      'The risk of acting and the risk of staying as we are.',
      'Timing: what happens if the decision slips.',
      'Who else must agree before the decision.'
    ],
    questions: [
      'What do we get, by when, and at what cost?',
      'What is the biggest risk and who owns it?',
      'What happens if we wait?',
      'Who else must back this?'
    ],
    next: c => `Send ${c.who} a one page summary with the decision, the cost, the timing and the main risk, and ask which other leaders must agree.${withUrgency(c)}`,
    ask: c => `Back a scoped pilot and name the sponsor who clears the way.`
  },
  revenue: {
    label: 'commercial impact',
    concerns: [
      'Effect on revenue, pipeline or conversion.',
      'Effort on the team and the time to see a result.',
      'Proof from comparable cases.',
      'Fit with the current plan.'
    ],
    questions: [
      'Which number moves, and by how much, on our own data?',
      'How long before we see it?',
      'What proof exists from comparable cases?',
      'What does it replace in the current plan?'
    ],
    next: c => `Agree with ${c.who} the one commercial measure the pilot will move, and ask for the current figure as the baseline.${withUrgency(c)}`,
    ask: c => `Agree the measure, the baseline and the pilot window.`
  },
  other: {
    label: 'this role',
    concerns: [
      'What the change means for this person\'s own work and goals.',
      'The cost and the risk of acting.',
      'What proof they need to support it.',
      'Who else must agree.'
    ],
    questions: [
      'What problem does this solve for you?',
      'What would you need to see to support it?',
      'Who else should be in the conversation?',
      'What would stop it?'
    ],
    next: c => `Ask ${c.who} what they would need to see to support the case, and record the answer as the next step.${withUrgency(c)}`,
    ask: c => `Agree what evidence ${c.who} needs and a date to bring it.`
  }
};

interface ObjKind { id: string; re: RegExp; rank: number; answer: (c: Ctx) => string; evidence: (c: Ctx) => string; next: (c: Ctx) => string }
const OBJECTIONS: ObjKind[] = [
  { id: 'recordings', re: /record(?:ing)?s|transcripts?|who (?:holds|owns|stores|keeps)|custody|ownership of (?:the )?data/i, rank: 1,
    answer: c => `Settle this in writing before the pilot: who owns the recordings and transcripts, where they are stored, who can open them, and how long they are kept. ${c.P} should point to one clause in its terms, not a general statement. If the clause is missing, say so now.`,
    evidence: () => 'The data ownership and storage clause, the access list and the retention period, as they appear in the contract draft.',
    next: c => `Ask ${c.P} for its data terms this week and have the buyer's compliance owner mark who holds the recordings and for how long.` },
  { id: 'rules', re: /call hours|calling hours|retention|regulat|consent|permitted|rules|compliance/i, rank: 2,
    answer: c => `Use the buyer's own rules as the test: the allowed calling windows, the consent and opt out rules, and the retention period. Ask ${c.P} to show where each rule is set in the product, run a short pilot, and read the log. Where ${c.P} cannot meet a rule, say so before any price is discussed.`,
    evidence: () => 'A checklist of the rules signed by the buyer\'s compliance owner, the setting that enforces each one, and a pilot log that shows the result.',
    next: c => `Get the buyer's rules in writing from their compliance owner and ask ${c.P} to map each rule to a setting before the next meeting.` },
  { id: 'outsourcing', re: /outsourc|material/i, rank: 3,
    answer: c => `Treat this as the buyer's classification, not a sales point: ask the buyer's risk team whether the arrangement counts as material, and which approvals and evidence follow. Then prepare ${c.P}'s documents for that review.`,
    evidence: () => 'The buyer\'s materiality criteria and the approvals each one triggers.',
    next: c => `Ask the buyer's risk owner for the materiality criteria and the review checklist, and send both to ${c.P}.` },
  { id: 'location', re: /stored|processed|residen|data location|where.*data|hosted/i, rank: 4,
    answer: c => `Answer with a location and evidence: where the data is stored, where it is processed, and who can access it. Ask ${c.P} for the hosting statement in writing and map it to the buyer's own requirement.`,
    evidence: () => 'The hosting and processing statement and the buyer\'s requirement it is mapped to.',
    next: c => `Ask ${c.P} for the hosting statement and share it with the buyer's data owner.` },
  { id: 'outage', re: /outage|downtime|uptime|reliab|availability|continuity|fail/i, rank: 5,
    answer: c => `Ask ${c.P} for the record, not a promise: its uptime over the last twelve months, how outages were reported, and what happens to work in flight. Then agree the service level and what the buyer receives if it is missed, in writing.`,
    evidence: () => 'The uptime record, the outage process and the service credit terms.',
    next: c => `Request the uptime record and the service level terms from ${c.P}.` },
  { id: 'incumbent', re: /why not stay|stay with|keep (?:using|the)|status quo|already (?:have|use)|switch|current (?:vendor|provider|supplier|stack)/i, rank: 6,
    answer: c => `Staying is a real option, and it should win if the numbers say so. Put the cost of ${c.cc || 'the current option'} and the cost of ${c.P} on the same basis: same volume, same period, from the buyer's own invoices. Show what the buyer gets that staying does not give.`,
    evidence: () => 'Twelve months of the buyer\'s own invoices for the current option and the volume they cover.',
    next: c => `Ask the buyer for the invoices of ${c.cc || 'the current option'} and build the side by side on the same volume and period.` },
  { id: 'usage', re: /grow without limit|usage costs?|overage|cost.*(?:grow|rise|spiral)|unpredictable|uncapped|variable|hidden (?:cost|fee)/i, rank: 7,
    answer: c => `Ask for a committed rate and a cap in writing: the committed volume, the rate above it, what the rate includes, and what happens at the limit.${c.budget ? ` The figure supplied is ${c.budget}.` : ''} Model the bill at the committed volume and at a higher volume the buyer chooses.`,
    evidence: () => 'The rate card, the committed volume, what is included and the rate above the commitment.',
    next: c => `Prepare a worst case bill at a volume the buyer picks, and ask ${c.P} to confirm the cap in writing.` },
  { id: 'integration', re: /integrat|effort|implement|migration|migrate/i, rank: 8,
    answer: c => `Scope the effort with the buyer's technical owner: the systems to connect, who does the work, and how long it takes. Ask ${c.P} for a plan with owners, and a first flow that can be tested alone.`,
    evidence: () => 'An integration plan with owners and dates, and a first flow that can be tested alone.',
    next: c => `Book a technical session between the buyer's technical owner and ${c.P} to scope the first flow.` },
  { id: 'security', re: /secur|breach|pen(?:etration)? test|soc ?2|iso ?27001/i, rank: 4,
    answer: c => `Provide the security evidence the buyer's review asks for, in their format: attestations, test summaries and the data handling description. Do not answer in general terms.`,
    evidence: () => 'The attestations, the test summary and the data handling description.',
    next: c => `Ask the buyer for their security questionnaire and send it to ${c.P} with a date for the answers.` },
  { id: 'exit', re: /lock.?in|exit|terminat/i, rank: 6,
    answer: c => `Show the exit route in the contract: notice period, data return, and what the buyer keeps. A buyer who can leave is easier to win.`,
    evidence: () => 'The termination and data return clauses.',
    next: c => `Send the exit and data return clauses of ${c.P} to the buyer's procurement owner.` }
];
const objKind = (o: string): ObjKind | null => OBJECTIONS.find(k => k.re.test(o)) || null;
const GENERIC_ANSWER = /answer should come from our own case|answer that from your own case|answered by a test, not a claim|answer that with a test, not a claim/i;

function championKit(args: Args, out: string): string {
  const stakeholder = s(args.target_stakeholder).replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  const P = productShort(args.your_solution);
  const ctx: Ctx = { P, who: stakeholder || 'the stakeholder', cc: s(args.competitive_context), budget: s(args.budget_context), urgency: s(args.urgency_drivers) };
  let text = out;
  if (stakeholder) {
    const kind = stakeholderKind(stakeholder);
    const pr = PROFILES[kind];
    const concerns = pr.concerns.map(x => x.replace('the current option', ctx.cc || 'the current option'));
    const block = [
      `## Reader view: ${stakeholder}`,
      '',
      `${stakeholder} reads this from the ${pr.label} side. The points below change with the reader.`,
      '',
      '**Concerns**',
      ...concerns.map(x => `- ${x}`),
      '',
      '**Questions to prepare for**',
      ...pr.questions.map(x => `- ${x}`),
      '',
      `**Your next step as champion:** ${pr.next(ctx)}`,
      '',
      `**The ask to ${stakeholder}:** ${pr.ask(ctx)}`
    ].join('\n');
    text = insertBeforeHeading(text, null, block);
  }
  const objs = items(args.known_objections);
  if (objs.length) {
    const handled: { o: string; k: ObjKind }[] = [];
    const rest: { o: string; k: ObjKind }[] = [];
    for (const o of objs) {
      const k = objKind(o);
      if (!k) continue;
      const body = `**Answer:** ${k.answer(ctx)}\n\n**Evidence to bring:** ${k.evidence(ctx)}\n\n**Next step:** ${k.next(ctx)}\n`;
      const esc = o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('(\\n### ' + esc + '[ \\t]*\\n)([\\s\\S]*?)(?=\\n### |\\n## |$)', 'i');
      const found = re.exec(text);
      // Only the general fallback answer is replaced. An answer already written for this kind of objection stays as it is.
      if (found) { if (GENERIC_ANSWER.test(found[2])) text = text.replace(re, (_m, h) => h + '\n' + body); handled.push({ o, k }); }
      else rest.push({ o, k });
    }
    const all = [...handled, ...rest];
    if (all.length) {
      const lead = all.slice().sort((a, b) => a.k.rank - b.k.rank)[0];
      const lines = ['## Objections and the next step', ''];
      for (const { o, k } of rest) lines.push(`### ${o}`, '', `**Answer:** ${k.answer(ctx)}`, '', `**Evidence to bring:** ${k.evidence(ctx)}`, '', `**Next step:** ${k.next(ctx)}`, '');
      const blocking = all.filter(x => x.k.rank <= 5);
      lines.push(`**Recommended next step:** ${lead.k.next(ctx)} It comes first because that answer decides whether the case can go forward.`);
      lines.push('');
      lines.push(blocking.length
        ? `**If the answer is no:** pause the case rather than argue it. A written no on that point ends this version of the case until it is fixed.`
        : `**If the answer is weak:** do not argue it. Return with the evidence listed above.`);
      text = insertBeforeHeading(text, /\n## (?:Before you forward this|Decision requested|Business case confirmation|Reading the answer)/, lines.join('\n'));
    }
  }
  return text;
}

// ---------------------------------------------------------------------------------------------------------------
// Row 3: mutual_action_plan_generator
// ---------------------------------------------------------------------------------------------------------------
type StepKind = 'questionnaire' | 'infosec' | 'materiality' | 'compliance' | 'test' | 'legal' | 'procurement' | 'committee' | 'other';
const STEP_RULES: [StepKind, RegExp, number, StepKind[]][] = [
  ['questionnaire', /questionnaire|due diligence|vendor (?:risk|onboard)/i, 2, []],
  ['infosec', /security|infosec|penetration|pen test|ciso/i, 4, ['questionnaire']],
  ['materiality', /materiality|outsourcing assessment|risk assessment/i, 4, ['infosec', 'questionnaire']],
  ['compliance', /compliance|regulat|privacy|data protection/i, 3, ['materiality', 'infosec', 'questionnaire']],
  ['test', /test|pilot|poc|proof|sandbox|trial|masked/i, 4, ['infosec', 'questionnaire']],
  ['legal', /legal|contract|terms|msa|redline/i, 4, ['materiality', 'infosec', 'questionnaire']],
  ['procurement', /procure|purchas|vendor registration|purchase order/i, 3, ['materiality', 'infosec', 'questionnaire']],
  ['committee', /committee|board|approval|sign.?off|steering/i, 2, []],
  ['other', /./, 2, []]
];
const CUTS: Partial<Record<StepKind, string>> = {
  questionnaire: 'Send the vendor risk questionnaire answers in the first week, and reuse existing certificates instead of writing new answers.',
  infosec: 'Start the information security review in the same week as the questionnaire, and share the evidence pack up front.',
  materiality: 'Run the materiality assessment while the security review is still open, using draft findings.',
  compliance: 'Merge the compliance review into the materiality assessment, with one reviewer meeting.',
  test: 'Cut the masked data test to one flow, and start it as soon as the security review clears the environment.',
  legal: 'Send the draft contract terms at the start of the evaluation and negotiate them while the reviews run.',
  procurement: 'Open procurement and vendor registration in parallel with legal, not after it.',
  committee: 'Book the committee date now. It is the fixed point and the other steps work back from it.'
};

function mapRisk(args: Args, out: string): string {
  const closeStr = s(args.target_close_date);
  const stepsRaw = items(args.known_process_steps);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(closeStr) || !stepsRaw.length) return out;
  const close = new Date(closeStr + 'T00:00:00Z').getTime();
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((close - today) / 86400000);
  if (!Number.isFinite(days) || days <= 0) return out;
  const weeks = Math.floor(days / 7);
  const steps = stepsRaw.map((name, i) => {
    const rule = STEP_RULES.find(r => r[1].test(name))!;
    return { i, name, kind: rule[0], dur: rule[2], deps: rule[3], start: 0, end: 0 };
  });
  const kinds = new Set(steps.map(x => x.kind));
  const finish = (st: typeof steps[number]): number => {
    if (st.end) return st.end;
    let startAt = 0;
    const deps = st.kind === 'committee' ? steps.filter(x => x.kind !== 'committee') : steps.filter(x => x !== st && st.deps.includes(x.kind) && kinds.has(x.kind));
    // A dependency by kind: the latest of the same kind chain; avoid cycles by only taking earlier listed or distinct kinds.
    for (const d of deps) if (d.kind !== st.kind) startAt = Math.max(startAt, finish(d));
    st.start = startAt; st.end = startAt + st.dur;
    return st.end;
  };
  steps.forEach(finish);
  const total = Math.max(...steps.map(x => x.end));
  const sequential = steps.reduce((a, x) => a + x.dur, 0);
  // Critical path: walk back from the latest finishing step.
  const crit = new Set<number>();
  let cur = steps.find(x => x.end === total)!;
  while (cur) {
    crit.add(cur.i);
    const prev = steps.filter(x => x.end === cur.start && x !== cur && x.kind !== cur.kind).sort((a, b) => a.i - b.i)[0];
    if (!prev) break; cur = prev;
  }
  const buffer = 2;
  const level = weeks < total ? 'at risk' : weeks < total + buffer ? 'tight' : weeks < sequential ? 'feasible only in parallel' : 'fits in sequence';
  let run = 0;
  const noFit = steps.filter(x => { run += x.dur; return run > weeks; });
  const plainName = (n: string): string => n.replace(/^the\s+/i, '');
  const lines: string[] = ['## Schedule risk against the close date', ''];
  lines.push(`**Verdict: ${level === 'at risk' ? 'the date is at risk' : level === 'tight' ? 'the date is tight' : level === 'feasible only in parallel' ? 'the date holds only if steps run in parallel' : 'the date holds'}.** The close date ${closeStr} leaves ${weeks} weeks from today (${days} calendar days). The buyer's ${steps.length} process steps add up to ${sequential} weeks if they run one after another, and ${total} weeks on the longest chain if every step starts as soon as it can. These step lengths are example defaults, not buyer figures: replace them with the buyer's own.`);
  lines.push('');
  if (level === 'at risk') lines.push(`Even with full parallel running the longest chain needs ${total} weeks and only ${weeks} are available, so the plan is short by ${total - weeks} weeks.`);
  else if (level === 'tight') lines.push(`The slack is ${weeks - total} weeks, less than the ${buffer} weeks kept as an example buffer. One slipped review moves the close.`);
  else if (level === 'feasible only in parallel') lines.push(`Run in order the steps need ${sequential} weeks, more than the ${weeks} available. Running them in parallel leaves ${weeks - total} weeks of slack.`);
  else lines.push(`The slack is ${weeks - total} weeks with full parallel running and the steps also fit one after another.`);
  lines.push('');
  lines.push('| Step | Example weeks | Starts week | Ends week | On the critical path | Fits before the close |');
  lines.push('|------|---------------|-------------|-----------|----------------------|-----------------------|');
  for (const x of steps) lines.push(`| ${upFirst(plainName(x.name))} | ${x.dur} | ${x.start + 1} | ${x.end} | ${crit.has(x.i) ? 'Yes' : 'No'} | ${x.end <= weeks ? 'Yes' : 'No'} |`);
  lines.push('');
  const critNames = steps.filter(x => crit.has(x.i)).sort((a, b) => a.start - b.start).map(x => plainName(x.name));
  lines.push(`**Critical path:** ${critNames.join(', then ')}. Any delay on these moves the close date.`);
  if (level === 'at risk' || level === 'tight' || level === 'feasible only in parallel') {
    lines.push('');
    if (noFit.length && weeks < sequential) lines.push(`**Steps that no longer fit if they run in the order given:** ${noFit.map(x => plainName(x.name)).join(', ')}.`);
    lines.push('');
    lines.push(level === 'feasible only in parallel' ? '**Run in parallel:**' : '**What to cut or run in parallel:**');
    const ordered = [...steps].sort((a, b) => (crit.has(b.i) ? 1 : 0) - (crit.has(a.i) ? 1 : 0) || a.start - b.start);
    for (const x of ordered) { const c = CUTS[x.kind]; if (c) lines.push(`- ${plainName(x.name)}: ${c}`); }
    if (level !== 'feasible only in parallel') {
      lines.push('');
      lines.push(`If the buyer cannot shorten these, move the close date by about ${Math.max(total - weeks, 1)} weeks, or ask the buyer to confirm which steps can be waived for this scope.`);
    }
    lines.push('');
    lines.push('**Start now:** the questionnaire, the security review and the committee date request, in the same week.');
  }
  return insertBeforeHeading(out, /\n## Key Stakeholders/, lines.join('\n'));
}

// ---------------------------------------------------------------------------------------------------------------
// Row 5: pricing_negotiation_guide, competitor_pricing
// ---------------------------------------------------------------------------------------------------------------
const MULT: Record<string, number> = { million: 1e6, m: 1e6, thousand: 1e3, k: 1e3, lakh: 1e5, crore: 1e7 };
function readVolume(text: string): { n: number; unit: string; annual: boolean } | null {
  const m = text.match(/([\d][\d,]*(?:\.\d+)?)\s*(million|thousand|lakh|crore|m|k)?\s+(minutes?|mins?|calls?|seats?|users?|transactions?|messages?|licen[cs]es?|sessions?)\b([^.;]{0,30})/i);
  if (!m) return null;
  const base = Number(m[1].replace(/,/g, ''));
  const mult = m[2] ? MULT[m[2].toLowerCase()] : 1;
  if (!Number.isFinite(base) || base <= 0) return null;
  const unit = m[3].toLowerCase().replace(/s$/, '').replace(/^min$/, 'minute');
  return { n: base * mult, unit: unit === 'mins' ? 'minute' : unit, annual: /a year|per year|annual|yearly|\/yr/i.test(m[4]) || /a year|per year|annual|yearly/i.test(text) };
}
function readRateCents(text: string): { cents: number; raw: string; unit: string } | null {
  const c = text.match(/([\d]+(?:\.\d+)?)\s*(?:cents?|c)\s*(?:a|per|\/)\s*(minute|min|call|seat|user|message|transaction)\b/i);
  if (c) return { cents: Number(c[1]), raw: c[1], unit: c[2].toLowerCase() === 'min' ? 'minute' : c[2].toLowerCase() };
  if (/\b(?:Rs|INR|EUR|GBP)\b|₹|€|£/.test(text)) return null;
  const d = text.match(/(?:\$|USD\s*)([\d]+(?:\.\d+)?)\s*(?:a|per|\/)\s*(minute|min|call|seat|user|message|transaction)\b/i);
  if (d) return { cents: Number(d[1]) * 100, raw: String(Number(d[1]) * 100), unit: d[2].toLowerCase() === 'min' ? 'minute' : d[2].toLowerCase() };
  return null;
}
const fracWord = (p: number): string => (Math.abs(p - 100 / 3) < 0.6 ? 'a third' : Math.abs(p - 25) < 0.6 ? 'a quarter' : Math.abs(p - 50) < 0.6 ? 'half' : Math.abs(p - 20) < 0.6 ? 'a fifth' : `${Math.round(p)} percent`);
const cents = (n: number): string => `${Number(n.toFixed(2))} cents`;
const usd = (n: number): string => '$' + fmt(Math.round(n));

function pricing(args: Args, out: string): string {
  if (!/\n## Situation: (?:Price direction is not clear|Competitor)/.test(out) || s(args.scenario) !== 'competitor_pricing') return out;
  const deal = typeof args.deal_value === 'number' ? args.deal_value : Number(args.deal_value);
  const theirsText = s(args.competitor_price);
  const theirs = readRateCents(theirsText);
  if (!theirs) return out;
  const all = [theirsText, s(args.value_delivered), s(args.your_leverage)].join('. ');
  const vol = readVolume(theirsText) || readVolume(s(args.value_delivered)) || readVolume(s(args.your_leverage));
  const ownText = [s(args.your_leverage), s(args.value_delivered)].join('. ');
  const ownStated = (() => { const m = ownText.match(/(?:our|your|the committed|committed)\s+(?:per[- ]\w+\s+)?(?:rate|price)[^.;\d$]{0,40}?([\d]+(?:\.\d+)?)\s*cents?\s*(?:a|per|\/)\s*(\w+)/i); return m ? Number(m[1]) : null; })();
  const unsigned = /\bno (?:signed|written)\b|\bunsigned\b|\bpublish(?:es|ed)\b|\blist price\b|\bnot a quote\b|\bindicative\b/i.test(theirsText) && !/\bsigned written quote\b|\bwritten quote from\b/i.test(theirsText);
  const unit = theirs.unit;
  let own: number | null = null; let ownHow = '';
  if (vol && Number.isFinite(deal) && deal > 0 && vol.annual) { own = (deal * 100) / vol.n; ownHow = `Your rate is ${usd(deal)} divided by ${fmt(vol.n)} ${unit}s = ${cents(own)} a ${unit}`; }
  else if (ownStated !== null) { own = ownStated; ownHow = `Your stated rate is ${cents(own)} a ${unit}`; }
  const lines: string[] = [];
  const dir = own === null ? 'unclear' : theirs.cents < own ? 'lower' : theirs.cents > own ? 'higher' : 'equal';
  if (own === null) {
    lines.push(`**Price gap:** your own unit price could not be worked out. Give the yearly volume in value_delivered or competitor_price (for example "2.4 million minutes a year") so the rate can be taken from deal_value, or state your rate in cents per ${unit} in your_leverage.`);
    return out.replace(/(\n## Situation: )[^\n]*\n/, (_m, a) => `${a}Price direction is not clear\n\n${lines.join('\n')}\n`);
  }
  const gap = Math.abs(own - theirs.cents);
  const pct = own > 0 ? (gap / own) * 100 : 0;
  const annual = vol && vol.annual ? (gap / 100) * vol.n : null;
  const head = dir === 'lower' ? 'Competitor has lower price' : dir === 'higher' ? 'Competitor quote is higher' : 'Competitor price equals yours';
  const weak = unsigned ? ' (indicative, no signed quote)' : '';
  lines.push(`**Price gap from your own numbers${weak}:** ${ownHow}. The rival is at ${theirs.raw} cents a ${unit}${unsigned ? ' on a published or unsigned price' : ' on a signed written quote'}. ${dir === 'lower' ? `Theirs is lower by ${cents(gap)} a ${unit}, ${fracWord(pct)} less than yours.` : dir === 'higher' ? `Theirs is higher by ${cents(gap)} a ${unit}.` : 'The unit prices are the same.'}${annual !== null && dir !== 'equal' ? ` Over ${fmt(vol!.n)} ${unit}s a year that is ${usd(annual)} a year.` : dir !== 'equal' ? ` The annual gap needs the yearly volume: give it in value_delivered or competitor_price.` : ''}`);
  lines.push('');
  const d = typeof args.discount_requested === 'number' ? args.discount_requested : Number(args.discount_requested);
  const authority = lowFirst(s(args.approval_authority)) || 'the approver';
  if (dir === 'lower') {
    if (unsigned) {
      lines.push('**Recommendation: hold on value and ask for the signed quote.** A list price is not an offer. Do not move on price until the rival\'s signed quote, with scope, volume and exclusions, is on the table. Then rerun this comparison.');
    } else {
      const afterD = Number.isFinite(d) && d > 0 ? own * (1 - d / 100) : null;
      lines.push('**Options**');
      lines.push(`- **Hold on value:** keep your rate and show what the lower price leaves out. Use it when the like for like check shows the rival's scope is smaller.`);
      lines.push(`- **Trade terms:** move price only against commitments: term, volume, payment timing and a reference.${afterD !== null ? ` The ${d}% requested would put your rate at ${cents(afterD)} a ${unit}, still ${cents(afterD - theirs.cents)} above the rival.` : ''}`);
      lines.push(`- **Match:** meeting ${theirs.raw} cents a ${unit} gives up ${fracWord(pct)} of the price${annual !== null ? `, ${usd(annual)} a year` : ''}. Only ${authority} can approve it, and only once the quote is confirmed as like for like.`);
      lines.push('');
      if (Number.isFinite(d) && d > 0 && pct > d) lines.push(`**Recommendation: hold on value and trade terms. Do not match.** Matching costs ${Math.round(pct)}% of the price, more than the ${d}% requested.`);
      else if (Number.isFinite(d) && d > 0) lines.push(`**Recommendation: trade terms, with matching as the fallback.** Matching costs ${Math.round(pct)}% of the price, inside the ${d}% requested, so give it only against term and volume commitments.`);
      else lines.push(`**Recommendation: hold on value and trade terms before any match.**`);
      lines.push('');
      lines.push(`**Walk away point:** the price at which delivery cost plus the minimum margin ${authority} sets is no longer covered. That floor is not in your inputs, so ${authority} must name it before you offer below ${afterD !== null ? cents(afterD) : cents(own)} a ${unit}.`);
    }
  } else if (dir === 'higher') {
    lines.push('**Recommendation: hold the price.** The rival is above you on the same unit, so a discount buys nothing on price. Compete on scope and risk.');
  }
  lines.push('');
  void all;
  return out.replace(/(\n## Situation: )[^\n]*\n/, (_m, a) => `${a}${head}${weak}\n\n${lines.join('\n')}\n`);
}

// ---------------------------------------------------------------------------------------------------------------
// Row 7: email_sequence_generator
// ---------------------------------------------------------------------------------------------------------------
type PersonaKind = 'owner' | 'operator' | 'finance' | 'tech' | 'sales' | 'other';
export function personaKind(t: string): PersonaKind {
  const x = t.toLowerCase();
  if (/\b(owner|principal|founder|ceo|chief executive|president|chairman|proprietor|managing director|partner)\b/.test(x)) return 'owner';
  if (/\b(cfo|financ\w*|controller|treasur\w*)\b/.test(x)) return 'finance';
  if (/\b(cto|cio|it|technology|engineering|data|security)\b/.test(x)) return 'tech';
  if (/\b(sales|revenue|cro|cmo|marketing|growth|bdc|business development)\b/.test(x)) return 'sales';
  if (/\b(general manager|gm|manager|operations?|coo|director|head)\b/.test(x)) return 'operator';
  return 'other';
}
interface EmailLens { angle: string; subjects: (topic: string, units: string) => string[]; lens: (n: number, pain: string, units: string) => string; question: (pain: string, units: string) => string; ask: (cta: string, topic: string, n: number) => string; proofKeys: RegExp; proofFrame: string }
const LENSES: Partial<Record<PersonaKind, EmailLens>> = {
  owner: {
    angle: 'group profit and the cost of lost leads across all locations, with little of the owner\'s time',
    subjects: (t, u) => [`What ${t} costs the group`, `One benchmark on ${t}`, `${upFirst(t)}: the cost across your ${u}`, `Where does ${t} sit?`, `Last note on ${t}`],
    lens: (n, _pain, units) => (n === 1 ? `For an owner the question is profit, not tools: a lead that goes unanswered is a sale at risk in one of your ${units}.` : `Across your ${units} the cost repeats: the same lost lead, at every site, every night.`),
    question: (pain, units) => `The question that decides this for an owner is the cost across ${units}: when ${pain}, how many leads are lost in a week, and what is one of them worth to the group?`,
    ask: (cta, topic, n) => [`A one line reply is enough: who looks after ${topic}? Or I can take ${cta} with whoever runs it day to day, instead of taking your time.`, `If a call is too much, tell me who runs this day to day and I will take ${cta} with them.`, `Your time is short, so the lightest answer is a name: who should I take ${cta} with?`, `If it is easier to hand this on, a name is enough and I will take ${cta} with them.`][n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : 3],
    proofKeys: /profit|revenue|gross|cost|margin|invest\w*|priority|growth|group/i,
    proofFrame: 'For an owner, the figure to weigh is where peers are putting their money:'
  },
  operator: {
    angle: 'the daily workload of the team, who picks up the lead and how quickly',
    subjects: t => [`A question on ${t}`, `A result on ${t}`, `${upFirst(t)} on the ground`, `Who should look at ${t} with you?`, `Questions on ${t}`],
    lens: () => `For the person who runs the floor, the issue is who picks up, and how fast.`,
    question: (pain) => `The question for the person running the team is this: when ${pain}, what does it cost your team in a week, and who picks it up?`,
    ask: (cta) => `Would ${cta} be a useful way to look at this?`,
    proofKeys: /team|time|response|speed|hours|handled|booked|appointment|conversion|staff/i,
    proofFrame: 'For your team, the figure to weigh is how others are handling it:'
  },
  finance: {
    angle: 'the cost of the problem and the proof finance can check',
    subjects: t => [`The cost of ${t}`, `A figure to check on ${t}`, `${upFirst(t)}: the numbers behind it`, `Who signs off on ${t}?`, `Last note on the cost of ${t}`],
    lens: () => `For finance the point is a cost you can check, not a promise.`,
    question: (pain) => `The question for finance is this: when ${pain}, what is the cost in a month, and which line carries it?`,
    ask: (cta, _t, n) => [`If it helps, I can send the cost basis first and keep ${cta} for after you have read it.`, `I can send the cost basis in writing before ${cta}, so the figures can be checked first.`, `The cost basis comes first in writing, and ${cta} follows only if the figures hold.`, `If the figures hold up, ${cta} is the next step.`][n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : 3],
    proofKeys: /cost|saving|revenue|roi|payback|margin|invest\w*|percent|%/i,
    proofFrame: 'For finance, the figure to check is this one:'
  },
  tech: {
    angle: 'integration, data handling and security evidence',
    subjects: t => [`How ${t} connects to your systems`, `A technical result on ${t}`, `${upFirst(t)}: data and security questions`, `Who reviews ${t} on the technical side?`, `Last note on ${t}`],
    lens: () => `For the technical owner the questions are integration and data handling.`,
    question: (pain) => `The question for the technical owner is this: when ${pain}, which systems are involved and what would an integration have to touch?`,
    ask: (cta, _t, n) => [`I can send the integration and security summary first, and keep ${cta} for the questions it raises.`, `The summary can go to your team first, with ${cta} to answer what it leaves open.`, `A written technical summary first, then ${cta} if it helps your review.`, `If the summary answers your questions, ${cta} is not needed.`][n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : 3],
    proofKeys: /integrat|secur|uptime|api|data|latency|compli\w*/i,
    proofFrame: 'For the technical review, the evidence to check is this one:'
  },
  sales: {
    angle: 'conversion, response time and the number of leads that become appointments',
    subjects: t => [`Leads lost to ${t}`, `A result on ${t}`, `${upFirst(t)}: what happens to the lead`, `Where does the lead go?`, `Last note on ${t}`],
    lens: () => `For the person who owns lead conversion the cost is plain: leads that go cold do not book.`,
    question: (pain) => `The question for lead conversion is this: when ${pain}, how many leads go cold, and how many would have booked?`,
    ask: (cta, _t, n) => [`Would ${cta} be a useful way to look at your own lead numbers?`, `I can bring a simple count of leads and bookings for ${cta}.`, `${cta.charAt(0).toUpperCase() + cta.slice(1)} would use your own lead numbers.`, `If your own lead numbers show the gap, ${cta} is the next step.`][n === 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : 3],
    proofKeys: /convers\w*|booked|appointment|response|lead|pipeline|sales/i,
    proofFrame: 'For lead conversion, the figure to weigh is this one:'
  }
};

function emailSequence(args: Args, out: string): string {
  const persona = s(args.target_persona);
  const kind = personaKind(persona);
  // The operating manager voice is the sequence's default and stays as written. Other roles get their own angle.
  const lens = kind === 'operator' || kind === 'other' ? undefined : LENSES[kind];
  if (!lens || !/### Email 1:/.test(out)) return out;
  const pain = s(args.specific_pain_point).replace(/[.]+$/, '');
  const industry = s(args.target_industry);
  const dealer = /dealer|automotive|\bcars?\b/i.test(industry + ' ' + s(args.your_solution));
  const units = dealer ? 'rooftops' : 'locations';
  const m1 = out.match(/\*\*Subject:\*\* A question on ([^\n]+)/);
  const topic = m1 ? m1[1].trim() : (pain.split(/\s+(?:get|are|is|have|has)\b/)[0] || 'this');
  const subjects = lens.subjects(topic, units);
  const proofs = items(args.social_proof);
  const proof = proofs.length ? proofs.slice().sort((a, b) => (lens.proofKeys.test(b) ? 1 : 0) - (lens.proofKeys.test(a) ? 1 : 0))[0] : '';
  const text = out.replace(/(### Email (\d+):[^\n]*\n\n\*\*Subject:\*\* )([^\n]*)(\n\n\*\*Body:\*\*\n\n)([\s\S]*?)(?=\n---\n|\n## )/g, (_m, pre, num, _subj, mid, body: string) => {
    const n = Number(num);
    let b = body;
    if (n === 1) b = b.replace(/^Hello,\n\n/, `Hello,\n\n${lens.lens(1, pain, units)}\n\n`);
    if (n === 2) {
      if (kind === 'owner') b = b.replace(/The question that usually decides whether a change like this matters[^\n]*/, lens.question(pain, units));
      // The proof line gets the role's framing only when it is the whole first paragraph.
      if (proof) b = b.replace(/^(Hello,\n\n)([^\n]*)(\n)/, (x, h, line, nl) => (line.replace(/[.]+$/, '') === proof.replace(/[.]+$/, '') ? h + lens.proofFrame + ' ' + lowFirst(proof) + '.' + nl : x));
    }
    // The ask follows the role, built on the call phrase this email already carries so the timing words stay.
    b = b.replace(/Would ((?:a|an) [^\n]*?) be a useful way to look at this\?/, (_x, c) => lens.ask(c, topic, n));
    return pre + subjects[n - 1] + mid + b;
  });
  const note = [
    '', '## How this sequence is angled for ' + persona, '',
    `- **Angle:** ${lens.angle}.`,
    `- **Ask:** ${kind === 'owner' ? 'a one line reply, with the call offered to whoever runs it day to day' : 'tailored to the role, with the original call kept as the fallback'}.`,
    `- **Proof used:** ${proof ? proof : 'none supplied'}${proofs.length > 1 ? ' (chosen from the proof points supplied, for fit with this role)' : ''}.`,
    `- **Subject angle:** ${subjects[0]}.`
  ].join('\n');
  return insertBeforeHeading(text, /\n## Before you send/, note);
}

// ---------------------------------------------------------------------------------------------------------------
// Rows 8 and 9: proposal_section_writer
// ---------------------------------------------------------------------------------------------------------------
interface Money { cur: string; value: number }
export function readMoney(seg: string): Money | null {
  const m = seg.match(/(Rs\.?|INR|₹|S\$|SGD|AED|\$|USD|€|£)\s*([\d][\d,]*(?:\.\d+)?)\s*(lakh|crore|million|billion|thousand|k|m)?/i);
  if (!m) return null;
  const unitMult: Record<string, number> = { lakh: 1e5, crore: 1e7, million: 1e6, billion: 1e9, thousand: 1e3, k: 1e3, m: 1e6 };
  const cur = /^rs|inr|₹/i.test(m[1]) ? 'Rs' : m[1].toUpperCase() === 'USD' ? '$' : m[1];
  return { cur, value: Number(m[2].replace(/,/g, '')) * (m[3] ? unitMult[m[3].toLowerCase()] : 1) };
}
function fmtMoney(x: Money): string {
  if (x.cur === 'Rs') {
    if (x.value >= 1e7) return `Rs ${Number((x.value / 1e7).toFixed(2))} crore`;
    if (x.value >= 1e5) return `Rs ${Number((x.value / 1e5).toFixed(2))} lakh`;
    return `Rs ${fmt(x.value)}`;
  }
  return `${x.cur}${fmt(x.value)}`;
}

function procurementSummary(args: Args, out: string): string {
  const name = s(args.customer_name) || 'the customer';
  const pricing = items(args.pricing).map(x => x.replace(/^Illustrative:\s*/i, ''));
  const oneTime = pricing.find(x => /one[- ]time|implementation|setup|set-up/i.test(x));
  const annualSeg = pricing.find(x => /annual|per year|a year|yearly/i.test(x));
  const oneM = oneTime ? readMoney(oneTime) : null, annM = annualSeg ? readMoney(annualSeg) : null;
  const termMatch = (s(args.pricing) + ' ' + s(args.implementation_approach)).match(/(\d+)[- ]year (?:term|contract)/i);
  const term = termMatch ? Number(termMatch[1]) : 3;
  const termNote = termMatch ? 'the term you gave' : 'an example term, replace it with the contract term';
  const challenges = items(args.customer_challenges);
  const compliance = challenges.filter(x => /rfp|data stored|residen|audit|complian|regulat|security|privacy|licen[cs]e/i.test(x));
  const diffs = items(args.key_differentiators);
  const impl = items(args.implementation_approach).map(x => x.replace(/^Illustrative:\s*/i, ''));
  const metrics = items(args.success_metrics).map(x => x.replace(/^Illustrative targets?:\s*/i, ''));
  const L: string[] = [];
  L.push('This summary is for the buying process. It states the price structure and the total cost first, then compliance, contract terms and comparison points. The vision is kept short on purpose.', '');
  L.push('### Price structure and total cost over the term', '');
  if (pricing.length) for (const p of pricing) L.push(`- ${upFirst(p)}`);
  else L.push('- No pricing was supplied. Add the fee structure before this goes to procurement.');
  if (oneM && annM && oneM.cur === annM.cur) {
    L.push('');
    L.push(`- **First year cost:** ${fmtMoney(oneM)} one time plus ${fmtMoney(annM)} platform fee = ${fmtMoney({ cur: oneM.cur, value: oneM.value + annM.value })}.`);
    L.push(`- **Total over a ${term} year term (${termNote}):** ${fmtMoney(oneM)} + ${term} x ${fmtMoney(annM)} = ${fmtMoney({ cur: oneM.cur, value: oneM.value + term * annM.value })}, before any usage above the included volume.`);
  } else if (annM) {
    L.push('');
    L.push(`- **Total over a ${term} year term (${termNote}):** ${term} x ${fmtMoney(annM)} = ${fmtMoney({ cur: annM.cur, value: term * annM.value })}, before any usage above the included volume.`);
  }
  L.push('- Not in the figures above: taxes, usage above the included volume unless a rate is shown, and any change to the fee on renewal. Confirm each in writing.', '');
  L.push('### Compliance and data', '');
  if (compliance.length) { for (const c of compliance) L.push(`- ${upFirst(c)}. Evidence to attach: the document or attestation that shows it is met.`); }
  else L.push('- No compliance requirement was supplied. List the buyer\'s data location, audit and security requirements and attach evidence for each.');
  L.push('', '### Contract terms and exit', '');
  L.push('Open items for the buyer\'s procurement and legal teams. These are points to settle, not offers:', '');
  L.push('- Term, renewal and the limit on price rises at renewal.');
  L.push('- Termination rights, notice period, and return of data on exit.');
  L.push('- Service levels, and what the buyer receives if they are missed.');
  L.push('- Liability, indemnity and data protection terms.', '');
  L.push('### Comparison points', '');
  const ch0 = challenges.filter(x => !compliance.includes(x));
  if (ch0.length) L.push(`Today, as the buyer described it: ${ch0.map(lowFirst).join('; ')}. The cost of staying as it is belongs next to the price above.`);
  if (diffs.length) { L.push('', 'Claims to verify before they are used in the evaluation:'); for (const d of diffs) L.push(`- ${upFirst(d)}`); }
  L.push('', '### References and delivery', '');
  L.push('- References: name customers who have agreed to take a reference call, and give the scope of each. None are listed here.');
  if (impl.length) L.push(`- Delivery plan as supplied: ${impl.join('; ')}.`);
  if (metrics.length) L.push(`- Acceptance measures proposed: ${metrics.join('; ')}.`);
  L.push('', '### What we ask of procurement', '');
  L.push('1. Share the evaluation criteria, the weights and the document checklist for vendor onboarding.');
  L.push('2. Confirm the contract term and the price comparison basis, so the total cost is measured the same way for every vendor.');
  L.push('3. Name the contract and legal reviewers, and agree a date for the first commercial review.', '');
  const body = L.join('\n');
  // Replace the c_suite body, from the line after the audience note to the closing line.
  const re = /(\*Audience:[^\n]*\*\n\n)([\s\S]*?)(\n---\n\n\*We look forward[^\n]*\*\n?)/;
  if (re.test(out)) return out.replace(re, (_m, a, _b, c) => a + body + c);
  return out;
}

function cSuiteAsk(args: Args, out: string): string {
  const impl = items(args.implementation_approach).map(x => x.replace(/^Illustrative:\s*/i, ''));
  const metrics = items(args.success_metrics).map(x => x.replace(/^Illustrative targets?:\s*/i, ''));
  const ask = [
    '### The decision we ask for', '',
    `We ask for an executive sponsor and approval to start${impl.length ? ' on the plan above' : ''}.${metrics[0] ? ` The result to hold us to: ${lowFirst(metrics[0])}.` : ''} The detail on price, terms and compliance goes to procurement after this decision.`, ''
  ].join('\n');
  const re = /\n---\n\n\*We look forward/;
  return re.test(out) ? out.replace(re, `\n${ask}\n---\n\n*We look forward`) : out;
}

const TEMPLATE_SHARE = [2, 4, 4, 2];
function phaseActs(name: string): { act: string[]; del: string[] } {
  const n = name.toLowerCase();
  if (/discover|design|scope|requirement|plan/.test(n)) return { act: ['Stakeholder interviews and requirements gathering', 'Technical architecture review', 'Integration mapping', 'Success criteria definition'], del: ['Solution design document', 'Integration specifications', 'Project plan'] };
  if (/security|uat|accept|pilot|test|valid/.test(n)) return { act: [/security/.test(n) ? 'Security review of the integration and data handling' : 'Pilot deployment to select users', 'User acceptance testing', 'Performance validation', 'Iteration based on feedback'], del: ['Test and pilot results report', /security/.test(n) ? 'Security review findings and fixes' : 'Optimized configuration', 'Training materials'] };
  if (/sandbox|integrat|configur|build|develop|setup|set up/.test(n)) return { act: ['System configuration', 'Integration development', 'Custom workflows', 'Testing environment setup'], del: ['Configured system', 'Integration connections', 'Test scripts'] };
  if (/deploy|go.?live|launch|rollout|cutover/.test(n)) return { act: ['Production deployment', 'User training', 'Go-live support', 'Documentation handoff'], del: ['Live production system', 'Trained users', 'Support handoff'] };
  return { act: ['Plan and execute the phase with the buyer', 'Review progress against the plan'], del: ['Phase outputs agreed with the buyer'] };
}
function scaleShares(total: number): number[] {
  const sum = TEMPLATE_SHARE.reduce((a, b) => a + b, 0);
  const raw = TEMPLATE_SHARE.map(x => (x * total) / sum);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as [number, number]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) { if (left <= 0) break; out[i]++; left--; }
  return out;
}
function implementationPlan(args: Args, out: string): string {
  const segs = s(args.implementation_approach).replace(/^Illustrative:\s*/i, '').split(';').map(x => x.trim()).filter(Boolean);
  const live = s(args.implementation_approach).match(/go[- ]?live\s+(?:in|at|by|on)\s+week\s+(\d+)/i);
  const goLive = live ? Number(live[1]) : 0;
  const parsed: { name: string; weeks: number; note: string }[] = [];
  for (const seg of segs) {
    if (/go[- ]?live/i.test(seg) && !/\d+\s*weeks?/i.test(seg.replace(/week\s+\d+/i, ''))) continue;
    const m = seg.match(/^(.*?)\s+(\d+)\s*weeks?\b(.*)$/i);
    if (!m) continue;
    let nm = m[1].trim(); let note = '';
    const w = nm.match(/^(.*?)\s+(with\s+.*)$/i);
    if (w) { nm = w[1]; note = w[2]; }
    parsed.push({ name: upFirst(nm), weeks: Number(m[2]), note });
  }
  let phases: { name: string; weeks: number; note: string; from: number; to: number }[] = [];
  let note = '';
  if (parsed.length >= 2) {
    let at = 0;
    phases = parsed.map(p => { const from = at + 1; at += p.weeks; return { ...p, from, to: at }; });
    const sum = at;
    if (goLive > sum) { phases.push({ name: 'Deployment and go live', weeks: goLive - sum, note: '', from: sum + 1, to: goLive }); }
    else if (goLive && goLive < sum) note = `The phases you gave add up to ${sum} weeks, which is after the go live week ${goLive}. Either the go live week moves to week ${sum} or phases overlap: agree which.`;
  } else if (goLive > 0) {
    const names = ['Discovery and design', 'Configuration and build', 'Pilot and validate', 'Full deployment'];
    const w = scaleShares(goLive);
    let at = 0;
    phases = names.map((n, i) => { const from = at + 1; at += w[i]; return { name: n, weeks: w[i], note: '', from, to: at }; }).filter(p => p.weeks > 0);
    note = `The phase lengths are scaled from the go live week you gave (week ${goLive}) using the tool's example 2, 4, 4, 2 split. Replace them with your own.`;
  } else return out;
  const end = phases[phases.length - 1].to;
  const rangeText = (p: { from: number; to: number }): string => (p.from === p.to ? `Week ${p.from}` : `Weeks ${p.from} to ${p.to}`);
  const L: string[] = ['### Timeline Overview', '', `The plan runs ${end} weeks and goes live in week ${goLive || end}. The weeks follow your implementation approach.${phases.some(p => p.name === 'Deployment and go live') ? ' The last phase covers the weeks between the end of your last phase and the go live week.' : ''}`, ''];
  if (note) L.push(`*${note}*`, '');
  L.push('| Phase | Duration | Weeks | Activities | Outcomes |', '|-------|----------|-------|------------|----------|');
  phases.forEach((p, i) => { const a = phaseActs(p.name); L.push(`| **Phase ${i + 1}: ${p.name}** | ${p.weeks} weeks | ${p.from} to ${p.to} | ${a.act.slice(0, 2).join(', ')}${p.note ? ' (' + p.note + ')' : ''} | ${a.del[0]} |`); });
  L.push('', '### Phase Details', '');
  phases.forEach((p, i) => {
    const a = phaseActs(p.name);
    L.push(`#### Phase ${i + 1}: ${p.name} (${rangeText(p)})`, '**Activities:**', ...a.act.map(x => `- ${x}`), ...(p.note ? [`- Scope: ${p.note}`] : []), '', '**Deliverables:**', ...a.del.map(x => `- ${x}`), '');
  });
  const text = out.replace(/### Timeline Overview[\s\S]*?(?=### Success Criteria)/, L.join('\n') + '\n');
  // What the timeline moves.
  const metrics = items(args.success_metrics).map(x => x.replace(/^Illustrative targets?:\s*/i, ''));
  const liveWeek = goLive || end;
  const M: string[] = ['### What the timeline moves', ''];
  const uat = phases.find(p => /security|uat|accept|pilot|test/i.test(p.name));
  M.push(`- **First value date:** not before week ${liveWeek}, when the solution goes live${uat ? `. The pilot and acceptance work ends in week ${uat.to}` : ''}. Any week added before go live moves this date by the same number of weeks.`);
  if (metrics.length) {
    M.push('- **Success metric checkpoints** (spacing is an example default: replace it):');
    metrics.forEach((m, i) => M.push(`  - ${upFirst(m)}: baseline taken before week ${phases[1] ? phases[1].from : 1}, first reading in week ${liveWeek + 4}, second reading in week ${liveWeek + 8}${i === 0 ? '' : ''}.`));
  }
  M.push(`- **Commercial dates that follow go live:** invoices, reviews and the first renewal conversation count from week ${liveWeek}, not from the start of the plan.`, '');
  return text.replace(/(### Success Criteria[\s\S]*?)(\n### Risk Mitigation)/, (_m, a, b) => a.replace(/\s+$/, '') + '\n\n' + M.join('\n') + b);
}

function proposal(args: Args, out: string): string {
  const sec = s(args.section_type);
  if (sec === 'executive_summary') {
    const aud = s(args.primary_audience);
    if (aud === 'procurement') return procurementSummary(args, out);
    if (aud === 'c_suite' || aud === '') return cSuiteAsk(args, out);
    return out;
  }
  if (sec === 'implementation_plan') return implementationPlan(args, out);
  return out;
}

export function applyEcho(name: string, args: Args, out: string): string {
  try {
    switch (name) {
      case 'champion_enablement_kit': return championKit(args, out);
      case 'mutual_action_plan_generator': return mapRisk(args, out);
      case 'pricing_negotiation_guide': return pricing(args, out);
      case 'email_sequence_generator': return emailSequence(args, out);
      case 'proposal_section_writer': return proposal(args, out);
      default: return out;
    }
  } catch {
    return out;
  }
}
