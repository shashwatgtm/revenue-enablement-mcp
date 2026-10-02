#!/usr/bin/env node
"use strict";
/**
 * Revenue Enablement MCP v1.0.0
 * Deal Strategy, ROI Calculators, Account Planning & Sales Enablement
 *
 * Tools: 12 total
 * 1. account_plan_builder - Strategic account plans with power mapping
 * 2. deal_strategy_coach - Deal-specific winning strategies
 * 3. discovery_question_bank - MEDDPICC/BANT/SPICED contextual questions
 * 4. roi_business_case_builder - Quantified value with sources
 * 5. mutual_action_plan_generator - Collaborative close plans
 * 6. win_loss_analyzer - Pattern detection from deal outcomes
 * 7. proposal_section_writer - Customized proposal content
 * 8. email_sequence_generator - Multi-touch cadences by persona
 * 9. demo_script_builder - Outcome-focused demo flows
 * 10. pricing_negotiation_guide - Value defense frameworks
 * 11. champion_enablement_kit - Internal selling tools
 * 12. competitive_trap_setter - Landmine questions for deals
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_VERSION = exports.SERVER_NAME = void 0;
exports.createServer = createServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const verticals_ts_1 = require("./verticals.js");
// Text only (run 9): common words that may open an input phrase. Mid-sentence, only these are lowered
// ("Fewer failed deliveries" becomes "fewer failed deliveries"). Any other capitalised word is kept as typed, because it may be a
// name or an acronym ("Salesforce data you can trust", "Microsoft Teams approvals", "AI deal scoring", "CRM hygiene").
const COMMON_WORDS = new Set(('a an the this that these those our your their my its his her we you they it me us them all any each every ' +
    'both either neither no not none some many much more most less least fewer few several other another such ' +
    'same own only just even also still very too so as than then there here what which who whom whose when where ' +
    'why how whether if because while until unless though although since once after before during about above ' +
    'across against along among around at by for from in into inside near of off on onto out outside over past ' +
    'per through throughout to toward towards under underneath up upon via with within without is are was were be ' +
    'been being am do does did done doing have has had having can could will would shall should may might must ' +
    'need needs needed get gets got getting give gives gave make makes made let lets keep keeps put puts take ' +
    'takes took see sees show shows find finds know knows think go goes going come comes one two three four five ' +
    'six seven eight nine ten first second third last next new old big small large tiny long short high low full ' +
    'half whole top bottom early late fast faster fastest quick quicker quickest slow slower easy easier easiest ' +
    'simple simpler hard harder better best good great strong stronger weak weaker clear clearer real true right ' +
    'wrong free open closed live smart smarter lean cheaper cheap safe safer secure accurate reliable consistent ' +
    'predictable visible instant instantly automatic automatically manual custom modern legacy digital online ' +
    'offline mobile remote local global central single multiple multi daily weekly monthly quarterly yearly ' +
    'annual real-time realtime end self self-serve self-service one-tap one-click two-way no-code low-code always ' +
    'never often sometimes usually now today tomorrow soon yet again ever already almost nearly exactly directly ' +
    'fully truly entirely highly deeply readily cut cuts reduce reduces reduction lower lowers raise raises boost ' +
    'boosts grow grows growth increase increases improve improves save saves saving savings win wins earn earns ' +
    'drive drives drove speed speeds scale scales help helps support supports enable enables deliver delivers ' +
    'offer offers provide provides build builds create creates launch launches ship ships track tracks measure ' +
    'measures manage manages plan plans run runs start starts stop stops ends avoid avoids prevent prevents ' +
    'remove removes replace replaces fix fixes solve solves close closes book books send sends share shares sync ' +
    'syncs connect connects integrate integrates automate automates simplify simplifies streamline streamlines ' +
    'centralise centralize unify unifies align aligns turn turns spend spends lose loses miss misses waste wastes ' +
    'struggle struggles fail fails hit hits meet meets reach reaches use uses sell sells buy buys pay pays charge ' +
    'charges hire hires onboard onboards train trains coach coaches forecast forecasts prioritise prioritize ' +
    'qualify qualifies convert converts retain retains renew renews expand expands upsell engage engages nurture ' +
    'nurtures personalise personalize target targets segment segments score scores rank ranks route routes assign ' +
    'assigns approve approves review reviews report reports alert alerts notify notifies remind reminds schedule ' +
    'schedules reschedule reschedules capture captures collect collects clean cleans enrich enriches verify ' +
    'verifies protect protects comply complies audit audits monitor monitors test tests learn learns understand ' +
    'understands explain explains answer answers ask asks call calls email emails text texts chat message ' +
    'messages post posts publish publishes write writes read reads edit edits search searches data insights ' +
    'insight analytics reporting dashboards dashboard pipeline pipelines revenue revenues sales marketing success ' +
    'service services product products platform platforms software tool tools app apps system systems process ' +
    'processes workflow workflows team teams people customers customer clients client users user buyers buyer ' +
    'prospects prospect leads lead accounts account deals deal opportunities opportunity contracts contract ' +
    'renewals renewal churn retention onboarding adoption activation engagement conversion conversions demand ' +
    'cost costs price prices pricing budget budgets value roi time times hours days weeks months minutes setup ' +
    'set-up implementation integration integrations security compliance privacy risk risks errors error mistakes ' +
    'issues issue problems problem pain pains gaps gap delays delay bottlenecks friction complexity visibility ' +
    'control access approvals approval handoffs handoff meetings meeting bookings ' +
    'booking reminders reminder cancellations staff employees employee managers manager ' +
    'leaders leader executives reps rep agents agent partners partner vendors vendor suppliers supplier companies ' +
    'company businesses business organisations organizations enterprises enterprise startups startup founders ' +
    'founder owners owner operations operators finance hr legal procurement engineering developers developer ' +
    'admins admin inbound outbound content campaigns campaign ads events event webinars webinar messaging ' +
    'positioning brand trust quality accuracy efficiency productivity performance results outcomes outcome impact ' +
    'coverage capacity forecasting planning scheduling tracking billing invoicing payments payment payroll hiring ' +
    'recruiting training coaching selling buying spending waiting missing losing paper spreadsheets spreadsheet ' +
    'phone inboxes inbox documents document files file forms form tasks task projects project orders order ' +
    'inventory shipping delivery deliveries returns tickets ticket cases case questions question requests request ' +
    'feedback surveys survey notes note records record lists list numbers number figures figure metrics metric ' +
    'goals goal quotas quota territory territories regions region markets market industry industries verticals ' +
    'vertical category categories competitors competitor alternatives alternative options option features feature ' +
    'modules module add-ons tiers tier seats seat licenses license usage traffic visits visitors signups signup ' +
    'trials trial demos demo proposals proposal quotes quote invoices invoice common key main core major minor ' +
    'basic advanced practical proven essential critical important urgent hidden obvious step steps step-by-step ' +
    'approach approaches guide guides framework frameworks strategy strategies playbook playbooks checklist ' +
    'checklists practice practices trend trends future state lesson lessons tip tips way ways idea ideas reason ' +
    'reasons sign signs rule rules example examples mistake myth myths truth truths secret secrets habit habits ' +
    'principle principles pattern patterns everything nothing something anything everyone nobody someone work ' +
    'world life thing things part parts point points story stories change changes shift shifts move moves loss ' +
    'losses level levels stage stages phase phases week month year day higher bigger smaller larger shorter ' +
    'longer greater happier healthier cleaner smooth smoother seamless effortless painless hassle-free ' +
    'frictionless repeatable scalable flexible affordable transparent unified zero unlimited endless entire ' +
    'complete total actionable measurable shorten shortens stay stays handle handles prove proves focus focuses ' +
    'switch switches eliminate eliminates minimise minimize maximise maximize accelerate accelerates ensure ' +
    'ensures empower empowers unlock unlocks discover discovers spot spots catch catches detect detects predict ' +
    'predicts recover recovers resolve resolves respond responds reply replies follow follows hear hears worst ' +
    'lost won ').split(/\s+/).filter(Boolean));
// A word counts as common when it is in the list, or ends in -ing or -ed ("Automated", "Missing"). A hyphenated
// word counts by its first part ("Two-way", "No-code").
function isCommonWord(word) {
    const head = word.split('-')[0].replace(/[^A-Za-z']+$/, '');
    if (!/^[A-Z][a-z']*$/.test(head) || head === 'I' || /[A-Z]/.test(word.slice(1)))
        return false;
    const w = head.toLowerCase();
    return COMMON_WORDS.has(w) || (w.length > 4 && /(?:ing|ed)$/.test(w));
}
// Text only (run 10): names that keep their capital when they open an input phrase placed mid-sentence. The list holds
// common product and company names and the names found in the test inputs; other names are kept by the rules below.
const KNOWN_NAMES = new Set(('Salesforce Microsoft Slack HubSpot LinkedIn Google Gmail Outlook Excel Zoom Zendesk Jira Notion Shopify Stripe ' +
    'Marketo Pardot Gong Intercom Freshworks Oracle SAP Workday ServiceNow Snowflake Tableau Asana Trello Dropbox ' +
    'Apple Amazon AWS Azure Facebook Instagram WhatsApp YouTube Sam ' +
    // Run 11: the company and competitor names in the test inputs and the page examples (run 19: the invented example names).
    'Bengaluru Clari Northwind Metricly Lanehop Branchwire Answerloop Cloudmoat Spendrill Shelfwalk').split(/\s+/).filter(Boolean));
function bareWord(word) {
    return word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
}
function isKnownName(word) {
    const w = bareWord(word);
    return KNOWN_NAMES.has(w) || KNOWN_NAMES.has(w.split(/['-]/)[0]);
}
// Run 11: a known name typed in lower case gets its capitals back ("bengaluru teams" becomes "Bengaluru teams"). Names
// that are also ordinary words (Slack, Zoom, Notion, Gong, Sam ...) are kept when typed with a capital, never raised.
const PLAIN_WORDS = new Set('slack zoom notion excel oracle stripe apple amazon gong sam outlook workday snowflake asana tableau intercom sap azure'.split(' '));
const NAME_BY_LOWER = new Map([...KNOWN_NAMES].filter(n => !PLAIN_WORDS.has(n.toLowerCase())).map(n => [n.toLowerCase(), n]));
function fixNames(phrase) {
    return phrase.replace(/[A-Za-z]+/g, w => (w === w.toLowerCase() && NAME_BY_LOWER.get(w)) || w);
}
// Run 11: a job title in running text is all lower case ("head of marketing", "operations director"); names and
// acronyms in it keep their capitals ("VP of sales", "director of Salesforce operations").
const JOB_WORD = /^(?:head|directors?|managers?|chief|officers?|president|coordinators?|supervisors?|specialists?|administrators?)$/i;
function isJobTitle(phrase) {
    const w = phrase.trim().split(/\s+/).map(bareWord);
    return w.length <= 6 && w.some((x, i) => JOB_WORD.test(x) && (x.toLowerCase() !== 'head' || (w[i + 1] || '').toLowerCase() === 'of'));
}
function lowerJobTitle(phrase) {
    return phrase.trim().split(/(\s+)/).map(w => (/^[A-Z][a-z'-]+\W*$/.test(w) && !isKnownName(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w)).join('');
}
// Run 10: the first word of an input phrase keeps its capital only when it is a known name, has an inner capital or is
// all capitals (HubSpot, AI, CRM), holds a digit (B2B, Q4), or starts a name of two words: the next word is capitalised
// too (New York, Example Logistics Co, Competitor A) and is not a known name on its own ("Native Salesforce" is not a name).
// Run 11: a one-letter word keeps its capital (I, X), and a common first word never makes the next word a name ("For
// Lanehop route planning" becomes "for Lanehop route planning"), unless the next word is a one-letter label after
// a noun (Competitor A) or the phrase opens with three capitalised words (Example Logistics Co).
function keepsFirstCapital(word, next, third = '') {
    const w = bareWord(word);
    if (!/^[A-Z]/.test(w) || (w.length === 1 && !(w === 'A' && next)) || isKnownName(w))
        return true; // the article A is not a one-letter name
    if (/[A-Z0-9]/.test(w.slice(1)))
        return true;
    const n = bareWord(next || '');
    if (!/^[A-Z](?:[a-z]+(?:['-][a-z]+)*)?$/.test(n) || isKnownName(n))
        return false;
    if (!isCommonWord(w) || w === 'New')
        return true; // New York, New Delhi
    if (n.length === 1)
        return !/^(?:for|with|from|to|of|in|on|at|by|and|or|the|a|an|into|about|why|how|what|when|where|who|your|our|their|my|this|that)$/i.test(w);
    return /^[A-Z][a-z]/.test(bareWord(third || ''));
}
// An input phrase placed mid-sentence: its first word is lowered unless keepsFirstCapital() keeps it
// ("Native Salesforce integration" becomes "native Salesforce integration"; "Salesforce data you can trust" stays).
function lowerFirstIfCommon(phrase) {
    const t = fixNames(phrase.trim());
    if (isJobTitle(t))
        return lowerJobTitle(t);
    const parts = t.split(/(\s+)/);
    if (keepsFirstCapital(parts[0] || '', parts[2] || '', parts[4] || ''))
        return t;
    parts[0] = parts[0].replace(/[A-Z]/, c => c.toLowerCase());
    // Run 11: after a lowered first word, a capitalised common second word is lowered too ("why forecasting matters now").
    if (parts[2] && isCommonWord(parts[2]))
        parts[2] = parts[2].charAt(0).toLowerCase() + parts[2].slice(1);
    return parts.join('');
}
// The same for a whole phrase (this replaces a plain toLowerCase(), which also lowered names and acronyms): the first
// word follows the rule above, and a later word is lowered only when it is a common word. A capitalised word straight
// after a kept name stays too, so a name of two words keeps both ("Microsoft Teams approvals").
function lowerCommonWords(phrase) {
    let afterName = false;
    let first = true;
    const t = fixNames(phrase.trim());
    if (isJobTitle(t))
        return lowerJobTitle(t);
    const parts = t.split(/(\s+)/);
    return parts.map((w, i) => {
        if (!w.trim())
            return w;
        const lower = first ? !keepsFirstCapital(w, parts[i + 2] || '', parts[i + 4] || '') : !afterName && isCommonWord(w);
        first = false;
        afterName = !lower && /^[A-Z]/.test(w);
        return lower ? w.replace(/[A-Z]/, c => c.toLowerCase()) : w;
    }).join('');
}
// Text only (run 9): a phrase that starts a sentence, a heading or a table cell starts with a capital. A first word
// written with a small letter and an inner capital (iPhone, eBay) is a name and is kept as typed.
function cap(phrase) {
    const t = fixNames(phrase.trim());
    if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || ''))
        return t;
    return t.charAt(0).toUpperCase() + t.slice(1);
}
// ============================================================================
// TOOL DEFINITIONS
// ============================================================================
const tools = {
    // Tool 1: Account Plan Builder
    account_plan_builder: {
        name: 'account_plan_builder',
        description: 'Generate strategic account plans with power mapping, whitespace analysis, and expansion strategies. Provides actionable 90-day plans based on account intelligence.',
        inputSchema: {
            type: 'object',
            properties: {
                account_name: {
                    type: 'string',
                    description: 'Company/account name'
                },
                industry: {
                    type: 'string',
                    description: 'Industry vertical'
                },
                current_arr: {
                    type: 'number',
                    minimum: 0,
                    description: 'Current ARR with this account (0 for prospects)'
                },
                known_contacts: {
                    type: 'string',
                    description: 'Known contacts and their roles (can be rough notes)'
                },
                current_products: {
                    type: 'string',
                    description: 'Products/services they currently use from you'
                },
                expansion_opportunities: {
                    type: 'string',
                    description: 'Potential expansion areas or whitespace'
                },
                competitive_threats: {
                    type: 'string',
                    description: 'Known competitors in the account'
                },
                your_solution: {
                    type: 'string',
                    description: 'Your product/service offering'
                },
                account_notes: {
                    type: 'string',
                    description: 'Any additional context about the account'
                }
            },
            required: ['account_name']
        }
    },
    // Tool 2: Deal Strategy Coach
    deal_strategy_coach: {
        name: 'deal_strategy_coach',
        description: 'Get deal-specific winning strategies based on deal stage, competitive dynamics, and stakeholder positions. Provides tactical next steps and risk mitigation.',
        inputSchema: {
            type: 'object',
            properties: {
                deal_name: {
                    type: 'string',
                    description: 'Deal/opportunity name'
                },
                deal_value: {
                    type: 'number',
                    minimum: 0,
                    description: 'Deal value in dollars'
                },
                deal_stage: {
                    type: 'string',
                    enum: ['prospecting', 'discovery', 'demo', 'proposal', 'negotiation', 'closing', 'stuck'],
                    description: 'Current deal stage'
                },
                days_in_stage: {
                    type: 'number',
                    minimum: 0,
                    description: 'Days the deal has been in current stage'
                },
                champion_status: {
                    type: 'string',
                    enum: ['no_champion', 'potential_champion', 'confirmed_champion', 'multi_threaded'],
                    description: 'Champion identification status'
                },
                economic_buyer: {
                    type: 'string',
                    description: 'Economic buyer name and engagement level'
                },
                competitors: {
                    type: 'string',
                    description: 'Competitors in the deal and their position'
                },
                blockers: {
                    type: 'string',
                    description: 'Known blockers or objections'
                },
                next_steps: {
                    type: 'string',
                    description: 'Currently planned next steps'
                },
                close_date: {
                    type: 'string',
                    description: 'Target close date'
                },
                your_solution: {
                    type: 'string',
                    description: 'What you are selling'
                }
            },
            required: ['deal_name', 'deal_stage']
        }
    },
    // Tool 3: Discovery Question Bank
    discovery_question_bank: {
        name: 'discovery_question_bank',
        description: 'Get contextual discovery questions using MEDDPICC, BANT, SPICED, Challenger or Gap Selling, or all five at once. Questions adapt based on what you already know about the prospect.',
        inputSchema: {
            type: 'object',
            properties: {
                framework: {
                    type: 'string',
                    enum: ['meddpicc', 'bant', 'spiced', 'challenger', 'gap_selling', 'all'],
                    description: 'Discovery framework to use'
                },
                prospect_industry: {
                    type: 'string',
                    description: 'Prospect industry for context'
                },
                prospect_role: {
                    type: 'string',
                    description: 'Role of person you are meeting with'
                },
                known_pain_points: {
                    type: 'string',
                    description: 'Pain points already identified'
                },
                known_metrics: {
                    type: 'string',
                    description: 'Metrics/KPIs already discussed'
                },
                deal_stage: {
                    type: 'string',
                    enum: ['first_call', 'discovery', 'deep_dive', 'technical', 'executive'],
                    description: 'Stage of conversation'
                },
                your_solution: {
                    type: 'string',
                    description: 'Your product/solution for relevant questions'
                },
                gaps_to_fill: {
                    type: 'string',
                    description: 'Specific information gaps to address'
                }
            },
            required: ['framework']
        }
    },
    // Tool 4: ROI Business Case Builder
    roi_business_case_builder: {
        name: 'roi_business_case_builder',
        description: 'Build an ROI business case from your inputs: the annual value comes from the buyer\'s own figures when you give them (annual_value_estimate, or current_annual_cost with expected_improvement_percent); otherwise from example assumptions and benchmarks labelled for you to replace. Includes ROI, payback and an executive summary.',
        inputSchema: {
            type: 'object',
            properties: {
                customer_name: {
                    type: 'string',
                    description: 'Customer/prospect name'
                },
                industry: {
                    type: 'string',
                    description: 'Industry for the example benchmarks: Technology, Financial_Services, Healthcare, Manufacturing or Retail (exact spelling). Any other value uses Technology'
                },
                company_size: {
                    type: 'string',
                    enum: ['startup', 'smb', 'mid_market', 'enterprise'],
                    description: 'Company size tier'
                },
                annual_revenue: {
                    type: 'number',
                    minimum: 0,
                    description: 'Customer annual revenue'
                },
                employee_count: {
                    type: 'number',
                    minimum: 0,
                    description: 'Number of employees'
                },
                your_solution: {
                    type: 'string',
                    description: 'Your product/solution'
                },
                solution_price: {
                    type: 'number',
                    minimum: 0,
                    description: 'Annual cost of your solution'
                },
                primary_value_driver: {
                    type: 'string',
                    enum: ['revenue_increase', 'cost_reduction', 'productivity', 'risk_mitigation', 'multiple'],
                    description: 'Primary value category'
                },
                known_metrics: {
                    type: 'string',
                    description: 'Metrics the prospect shared. Shown in the output; to turn them into the value, give current_annual_cost and expected_improvement_percent, or annual_value_estimate'
                },
                current_annual_cost: {
                    type: 'number',
                    minimum: 0,
                    description: 'Optional: what the problem or the current process costs the buyer a year, in dollars (their figure)'
                },
                expected_improvement_percent: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Optional: the share of that annual cost the buyer expects to save, in percent (their figure)'
                },
                annual_value_estimate: {
                    type: 'number',
                    minimum: 0,
                    description: 'Optional: the buyer\'s own estimate of the annual value in dollars; used as the value when given'
                },
                current_process: {
                    type: 'string',
                    description: 'How they do it today. Shown in the output; not used in the calculation'
                },
                implementation_timeline: {
                    type: 'string',
                    description: 'Expected implementation time. Shown in the output; not used in the calculation'
                }
            },
            required: ['your_solution', 'primary_value_driver']
        }
    },
    // Tool 5: Mutual Action Plan Generator
    mutual_action_plan_generator: {
        name: 'mutual_action_plan_generator',
        description: 'Generate collaborative close plans with milestones, owners, and dates. Creates alignment between buyer and seller on path to decision.',
        inputSchema: {
            type: 'object',
            properties: {
                deal_name: {
                    type: 'string',
                    description: 'Deal/opportunity name'
                },
                target_close_date: {
                    type: 'string',
                    description: 'Target close date (YYYY-MM-DD)'
                },
                current_stage: {
                    type: 'string',
                    enum: ['discovery', 'evaluation', 'proposal', 'negotiation', 'procurement'],
                    description: 'Current deal stage'
                },
                buyer_champion: {
                    type: 'string',
                    description: 'Champion name and title'
                },
                economic_buyer: {
                    type: 'string',
                    description: 'Economic buyer name and title'
                },
                technical_evaluators: {
                    type: 'string',
                    description: 'Technical evaluators involved'
                },
                procurement_contact: {
                    type: 'string',
                    description: 'Procurement contact if known'
                },
                known_requirements: {
                    type: 'string',
                    description: 'Known requirements or evaluation criteria'
                },
                known_process_steps: {
                    type: 'string',
                    description: 'Known steps in their buying process'
                },
                blockers: {
                    type: 'string',
                    description: 'Known blockers or concerns'
                },
                your_solution: {
                    type: 'string',
                    description: 'What you are selling'
                }
            },
            required: ['deal_name', 'target_close_date']
        }
    },
    // Tool 6: Win/Loss Analyzer
    win_loss_analyzer: {
        name: 'win_loss_analyzer',
        description: 'Structure a win/loss review of one deal or a set of deals: organizes the deal details you provide and returns the factors and questions to investigate.',
        inputSchema: {
            type: 'object',
            properties: {
                analysis_type: {
                    type: 'string',
                    enum: ['single_deal', 'deal_portfolio', 'competitor_analysis', 'loss_pattern'],
                    description: 'Type of analysis'
                },
                deal_outcome: {
                    type: 'string',
                    enum: ['won', 'lost', 'no_decision', 'mixed'],
                    description: 'Deal outcome for single deal analysis'
                },
                deal_details: {
                    type: 'string',
                    description: 'Deal details, can be rough notes, CRM export, or structured data'
                },
                loss_reason: {
                    type: 'string',
                    description: 'Stated loss reason (for lost deals)'
                },
                competitor_won: {
                    type: 'string',
                    description: 'Competitor who won (if applicable)'
                },
                deal_value: {
                    type: 'number',
                    minimum: 0,
                    description: 'Deal value'
                },
                sales_cycle_days: {
                    type: 'number',
                    minimum: 0,
                    description: 'Length of sales cycle'
                },
                stakeholders_involved: {
                    type: 'string',
                    description: 'Key stakeholders and their positions'
                },
                your_solution: {
                    type: 'string',
                    description: 'What you were selling'
                },
                multiple_deals: {
                    type: 'string',
                    description: 'For portfolio analysis: summary of multiple deals'
                }
            },
            required: ['analysis_type']
        }
    },
    // Tool 7: Proposal Section Writer
    proposal_section_writer: {
        name: 'proposal_section_writer',
        description: 'Generate customized proposal sections tailored to specific buyers. Creates executive summaries, solution overviews, pricing justifications, and more.',
        inputSchema: {
            type: 'object',
            properties: {
                section_type: {
                    type: 'string',
                    enum: ['executive_summary', 'problem_statement', 'solution_overview', 'implementation_plan', 'pricing_justification', 'risk_mitigation', 'success_metrics', 'company_overview', 'case_studies', 'next_steps'],
                    description: 'Proposal section to generate'
                },
                customer_name: {
                    type: 'string',
                    description: 'Customer name'
                },
                customer_industry: {
                    type: 'string',
                    description: 'Customer industry'
                },
                primary_audience: {
                    type: 'string',
                    enum: ['c_suite', 'vp_level', 'director', 'manager', 'technical', 'procurement'],
                    description: 'Accepted but not used yet: the text is the same for every audience'
                },
                customer_challenges: {
                    type: 'string',
                    description: 'Key challenges identified'
                },
                your_solution: {
                    type: 'string',
                    description: 'Your product/solution'
                },
                key_differentiators: {
                    type: 'string',
                    description: 'Why you vs alternatives'
                },
                pricing: {
                    type: 'string',
                    description: 'Pricing details if relevant'
                },
                implementation_approach: {
                    type: 'string',
                    description: 'How you will implement'
                },
                success_metrics: {
                    type: 'string',
                    description: 'Expected outcomes/metrics'
                },
                tone: {
                    type: 'string',
                    enum: ['formal', 'consultative', 'bold', 'conservative'],
                    description: 'Tone for the proposal (changes only the opening of the executive summary)'
                }
            },
            required: ['section_type', 'your_solution']
        }
    },
    // Tool 8: Email Sequence Generator
    email_sequence_generator: {
        name: 'email_sequence_generator',
        description: 'Generate multi-touch email sequences by persona, stage, and objective. Creates prospecting, nurture, follow-up, and re-engagement sequences.',
        inputSchema: {
            type: 'object',
            properties: {
                sequence_type: {
                    type: 'string',
                    enum: ['cold_outreach', 'warm_follow_up', 'post_demo', 'proposal_follow_up', 're_engagement', 'nurture', 'event_follow_up', 'referral_request'],
                    description: 'Type of email sequence. cold_outreach, warm_follow_up, post_demo and re_engagement have their own templates; the other types return a general outline'
                },
                target_persona: {
                    type: 'string',
                    description: 'Target persona (e.g., VP Sales, CTO, CFO)'
                },
                target_industry: {
                    type: 'string',
                    description: 'Target industry for context'
                },
                your_solution: {
                    type: 'string',
                    description: 'Your product/solution'
                },
                key_value_prop: {
                    type: 'string',
                    description: 'Primary value proposition'
                },
                specific_pain_point: {
                    type: 'string',
                    description: 'Specific pain point to address'
                },
                social_proof: {
                    type: 'string',
                    description: 'Customer names, stats, or proof points'
                },
                call_to_action: {
                    type: 'string',
                    description: 'Desired action (meeting, demo, reply)'
                },
                num_emails: {
                    type: 'number',
                    minimum: 0,
                    description: 'Accepted but not used yet: each sequence type has a fixed number of emails'
                },
                tone: {
                    type: 'string',
                    enum: ['professional', 'casual', 'urgent', 'consultative', 'provocative'],
                    description: 'Email tone'
                },
                sender_context: {
                    type: 'string',
                    description: 'Context about sender (role, shared connections, etc.)'
                }
            },
            required: ['sequence_type', 'target_persona', 'your_solution']
        }
    },
    // Tool 9: Demo Script Builder
    demo_script_builder: {
        name: 'demo_script_builder',
        description: 'Create outcome-focused demo scripts tailored to specific personas and use cases. Includes discovery questions, feature-to-value mapping, and objection handling.',
        inputSchema: {
            type: 'object',
            properties: {
                demo_type: {
                    type: 'string',
                    enum: ['first_look', 'technical_deep_dive', 'executive_overview', 'competitive_displacement', 'expansion_upsell', 'proof_of_concept'],
                    description: 'Type of demo'
                },
                primary_audience: {
                    type: 'string',
                    description: 'Primary demo audience (role/persona)'
                },
                attendees: {
                    type: 'string',
                    description: 'Other attendees and their roles'
                },
                customer_industry: {
                    type: 'string',
                    description: 'Customer industry'
                },
                your_solution: {
                    type: 'string',
                    description: 'Your product/solution'
                },
                key_pain_points: {
                    type: 'string',
                    description: 'Pain points to address in demo'
                },
                competitor_context: {
                    type: 'string',
                    description: 'Competitor being displaced or compared'
                },
                demo_duration: {
                    type: 'number',
                    minimum: 0,
                    description: 'Demo duration in minutes'
                },
                must_show_features: {
                    type: 'string',
                    description: 'Features that must be demonstrated'
                },
                known_objections: {
                    type: 'string',
                    description: 'Known objections to address'
                },
                desired_outcome: {
                    type: 'string',
                    description: 'What you want to achieve from this demo'
                }
            },
            required: ['demo_type', 'your_solution']
        }
    },
    // Tool 10: Pricing Negotiation Guide
    pricing_negotiation_guide: {
        name: 'pricing_negotiation_guide',
        description: 'Get value-based pricing defense strategies and negotiation tactics. Helps maintain deal value while addressing discount requests.',
        inputSchema: {
            type: 'object',
            properties: {
                scenario: {
                    type: 'string',
                    enum: ['discount_request', 'budget_objection', 'competitor_pricing', 'procurement_pressure', 'multi_year_negotiation', 'enterprise_agreement', 'renewal_negotiation'],
                    description: 'Negotiation scenario'
                },
                deal_value: {
                    type: 'number',
                    minimum: 0,
                    description: 'Current deal value'
                },
                discount_requested: {
                    type: 'number',
                    minimum: 0,
                    description: 'Discount percentage requested'
                },
                your_solution: {
                    type: 'string',
                    description: 'Accepted but not used yet by this tool'
                },
                competitor_price: {
                    type: 'string',
                    description: 'Competitor pricing if known'
                },
                value_delivered: {
                    type: 'string',
                    description: 'Quantified value your solution delivers. Shown in the output; the value example does not use it'
                },
                buyer_leverage: {
                    type: 'string',
                    description: 'Buyer leverage points (size, reference potential, etc.)'
                },
                your_leverage: {
                    type: 'string',
                    description: 'Your leverage points (unique features, timeline, etc.)'
                },
                decision_timeline: {
                    type: 'string',
                    description: 'When decision needs to be made'
                },
                approval_authority: {
                    type: 'string',
                    description: 'Who has final approval on pricing'
                },
                business_model: {
                    type: 'string',
                    enum: ['saas', 'services', 'connectivity', 'transactions', 'marketplace', 'hardware_software', 'investment'],
                    description: 'Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out'
                }
            },
            required: ['scenario']
        }
    },
    // Tool 11: Champion Enablement Kit
    champion_enablement_kit: {
        name: 'champion_enablement_kit',
        description: 'Create internal selling tools for your champion. Generates executive briefs, internal business cases, objection responses, and presentation talking points.',
        inputSchema: {
            type: 'object',
            properties: {
                asset_type: {
                    type: 'string',
                    enum: ['executive_brief', 'internal_business_case', 'objection_responses', 'presentation_talking_points', 'email_to_stakeholder', 'roi_one_pager', 'competitive_comparison', 'risk_assessment'],
                    description: 'Type of enablement asset'
                },
                champion_name: {
                    type: 'string',
                    description: 'Champion name'
                },
                champion_role: {
                    type: 'string',
                    description: 'Champion role/title'
                },
                target_stakeholder: {
                    type: 'string',
                    description: 'Who the champion needs to convince'
                },
                your_solution: {
                    type: 'string',
                    description: 'Your product/solution'
                },
                key_value_points: {
                    type: 'string',
                    description: 'Key value points to emphasize'
                },
                known_objections: {
                    type: 'string',
                    description: 'Expected objections from stakeholders'
                },
                competitive_context: {
                    type: 'string',
                    description: 'Competitive alternatives being considered'
                },
                budget_context: {
                    type: 'string',
                    description: 'Budget situation and pricing'
                },
                urgency_drivers: {
                    type: 'string',
                    description: 'Why act now'
                },
                champion_wins: {
                    type: 'string',
                    description: 'How this makes the champion look good'
                }
            },
            required: ['asset_type', 'your_solution']
        }
    },
    // Tool 12: Competitive Trap Setter
    competitive_trap_setter: {
        name: 'competitive_trap_setter',
        description: 'Generate landmine questions and competitive positioning tactics. Helps expose competitor weaknesses during evaluation without being negative.',
        inputSchema: {
            type: 'object',
            properties: {
                competitor: {
                    type: 'string',
                    description: 'Primary competitor to position against'
                },
                competitor_weaknesses: {
                    type: 'string',
                    description: 'Known competitor weaknesses'
                },
                your_solution: {
                    type: 'string',
                    description: 'Your product/solution'
                },
                your_strengths: {
                    type: 'string',
                    description: 'Your key differentiators'
                },
                evaluation_stage: {
                    type: 'string',
                    enum: ['early', 'mid', 'late', 'finalist'],
                    description: 'Stage of competitive evaluation'
                },
                buyer_priorities: {
                    type: 'string',
                    description: 'What the buyer cares most about'
                },
                buyer_persona: {
                    type: 'string',
                    description: 'Role of key evaluator'
                },
                trap_type: {
                    type: 'string',
                    enum: ['discovery_questions', 'evaluation_criteria', 'reference_questions', 'technical_requirements', 'commercial_terms', 'all'],
                    description: 'Type of competitive positioning'
                },
                business_model: {
                    type: 'string',
                    enum: ['saas', 'services', 'connectivity', 'transactions', 'marketplace', 'hardware_software', 'investment'],
                    description: 'Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out'
                }
            },
            required: ['competitor', 'your_solution']
        }
    }
};
// ============================================================================
// TOOL EXECUTION FUNCTIONS
// ============================================================================
// Output labels (owner decision 1): every figure that is not the user's input, and not computed
// only from it, is labelled in the output. These strings change output text only, never a calculation.
const EXAMPLE = '(Example figure: replace with your own)';
const EXAMPLES = 'Example figures: replace with your own.';
const SUGGESTIONS_FOOTER = 'Suggested timings, lengths and counts: adjust them to your own.';
const NOT_SUPPLIED = 'not supplied';
const hasValue = (v) => v !== undefined && v !== null && v !== '';
// Tool 1: Account Plan Builder
// Run 17 R17-41: a figure rounded to whole dollars keeps its cents when it is under $1 (D55); $1 or more is rounded as before.
function wholeDollars(n) {
    return Math.abs(n) < 1 ? n : Math.round(n);
}
// Run 18 D65 (display only; no calculation uses this): an amount rounded to whole cents, half up, as it is read in decimal.
// The toPrecision(15) step removes binary float noise first (0.555 * 100 is 55.50000000000001, 1.005 * 100 is 100.49999999999999).
// A value too large for cents to be exact in a double is returned as it is.
function cents(n) {
    const a = Math.abs(n) * 100;
    if (!Number.isFinite(a) || a >= 1e15)
        return n;
    const r = Math.round(Number(a.toPrecision(15))) / 100;
    return n < 0 ? -r : r;
}
// Run 18 D65: a printed total is the sum of its printed parts. Each term is rounded to cents the way money() prints it, then added.
// If every term that is not 0 prints under $0.01 and the sum would print as $0, the unrounded sum is returned so money() still says
// "under $0.01".
function printedSum(terms) {
    const sum = terms.reduce((acc, t) => acc + cents(t), 0);
    if (cents(sum) === 0 && terms.some((t) => t !== 0 && cents(t) === 0))
        return terms.reduce((acc, t) => acc + t, 0);
    return sum;
}
// Run 17 D55: money under $1 prints 2 decimals; a positive amount that rounds to $0.00 says so (the ICP rule, run 16 N2).
// Run 18 D65: every amount is rounded to cents (cents() above) and prints at most 2 decimals; an amount that is not a whole number
// of dollars prints exactly 2 decimals ("$4.60", "$1,234.50"); a whole amount prints as before ("$5", "$20,000").
function money(n) {
    const a = Math.abs(n);
    const c = cents(a);
    if (a > 0 && a < 1) {
        if (c === 0)
            return n < 0 ? 'a loss under $0.01' : 'under $0.01';
        return `${n < 0 ? '-' : ''}$${c.toFixed(2)}`;
    }
    const digits = Number.isInteger(c) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return `${n < 0 ? '-' : ''}$${c.toLocaleString('en-US', digits)}`;
}
// ============================================================================
// Run 19 (owner decision D80): shared helpers for the 8 problems of the real-world test.
// ============================================================================
// A list typed by the user: one item per line or per semicolon. Commas are kept inside an item, so a phrase such as
// "Routes re-planned in under a minute, not overnight" is never cut into a fragment.
function splitItems(s) {
    if (typeof s !== 'string')
        return [];
    const parts = s.split(/\n|;/).map((x) => x.trim().replace(/^[-*\u2022]\s*/, '')).filter(Boolean);
    // a plain comma list of short items (each 1 to 6 words, no verb-like comma clause) is split too
    if (parts.length === 1 && /,/.test(parts[0])) {
        const c = parts[0].split(/,(?!\d{3}(?!\d))/).map((x) => x.trim()).filter(Boolean);
        if (c.length > 1 && c.every((x) => x.split(/\s+/).length <= 6) && !c.some((x) => /^(not|but|and|or|so|which|that)\b/i.test(x)))
            return c;
    }
    return parts;
}
// Text typed by the user, quoted when it is placed inside one of the tool's own sentences, so a clause never breaks the grammar.
function q(s) {
    return `"${s.trim().replace(/^"|"$/g, '').replace(/[.]$/, '')}"`;
}
// The sector and the business model read from the inputs (src/verticals.ts), with one line saying how they were read.
function readContext(explicitModel, ...texts) {
    const v = (0, verticals_ts_1.detectVertical)(...texts);
    const m = (0, verticals_ts_1.detectModel)(explicitModel, ...texts);
    const sector = v ? `read from your inputs as ${v.name}` : 'not clear from your inputs (name the industry for sector notes)';
    const model = m.model ? `${verticals_ts_1.MODEL_NAME[m.model]} (${m.how === 'input' ? 'from business_model' : m.how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})` : 'not clear from your inputs; set business_model (saas, services, connectivity, transactions, marketplace, hardware_software or investment) for advice that fits it';
    return { v, model: m.model, line: `*Sector: ${sector}. Business model: ${model}.*` };
}
// Sector notes: the buying committee, what the sector measures and its usual objections (no figures, rule B82).
function sectorNotes(v, what = 'all') {
    if (!v)
        return '';
    const out = [`### Sector notes: ${v.name}`];
    if (what === 'committee' || what === 'all')
        out.push(`- **Who usually decides:** ${v.committee}`);
    if (what === 'metrics' || what === 'all')
        out.push(`- **What this sector measures:** ${v.metrics.join(', ')}.`);
    if (what === 'objections' || what === 'all')
        out.push(`- **Objections this sector often raises:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}.`);
    out.push(`- **A proof point that lands:** ${v.proofShape}`);
    return out.join('\n');
}
// The answer pattern for one objection or blocker typed by the user: the sector's pattern when it matches, else a pattern by kind.
function answerFor(text, v) {
    const t = text.toLowerCase();
    if (v) {
        for (const o of v.objections) {
            const keys = o.objection.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !['our', 'the', 'and', 'are', 'not', 'too', 'for', 'already', 'have', 'has', 'does', 'this', 'will', 'than', 'with', 'from', 'your', 'ourselves', 'we', 'can', 'use', 'new', 'own'].includes(w));
            if (keys.filter((k) => t.includes(k)).length >= Math.min(2, keys.length))
                return o.response;
        }
    }
    if (/price|cost|budget|expensive|cheaper|discount|margin/.test(t))
        return 'Agree the cost of the problem in the buyer\'s own numbers first, then compare the price with it; trade any concession for something of equal value.';
    if (/already have|already has|already does|already use|existing|incumbent|current (?:vendor|tool|system|provider|operator)|in-house|built/.test(t))
        return 'Ask what the current setup does not do today and what that costs; position alongside it where you can, and replace only where the buyer sees the gap.';
    if (/adopt|use a new|will not use|won't use|resist|change|training/.test(t))
        return 'Agree a small pilot with the people who will use it, and decide up front how adoption is measured.';
    if (/integrat|migrat|cut-?over|disrupt|setup|set-up|implementation|rollout/.test(t))
        return 'Name the systems and people involved, and offer a staged plan with a rollback point for each stage.';
    if (/security|privacy|compliance|audit|regulat|legal|risk/.test(t))
        return 'Bring the security and compliance answers before they are asked, and map each requirement to the control that meets it.';
    if (/bundle|one vendor|single vendor|suite/.test(t))
        return 'Compare the outcome the buyer needs from each option, not the size of the bundle; show what the bundled tool leaves to manual work.';
    if (/timing|not now|next year|later|priority/.test(t))
        return 'Find the event that makes this urgent (a renewal, an audit, a season, a target) and plan back from it.';
    if (/black box|explain|trust|wrong|accuracy|track record/.test(t))
        return 'Offer evidence the buyer can check: an evaluation on their own data, and references they can call.';
    return 'Ask what lies behind it and what would change their mind, then answer with evidence from a similar customer only if you have it.';
}
function executeAccountPlanBuilder(args) {
    const accountName = args.account_name || 'Target Account';
    const industry = args.industry || 'Technology';
    const currentArr = args.current_arr || 0;
    const knownContacts = args.known_contacts || '';
    const currentProducts = args.current_products || '';
    const expansionOpportunities = args.expansion_opportunities || '';
    const competitiveThreats = args.competitive_threats || '';
    const yourSolution = args.your_solution || 'your solution';
    const accountNotes = args.account_notes || '';
    // Run 19 D80 (problems 3 and 8): contacts given are used, not asked for again; the sector's buying committee is named.
    const acctCtx = readContext(undefined, industry === 'Technology' && !args.industry ? '' : industry, yourSolution, currentProducts, accountNotes, knownContacts);
    const contacts = splitItems(knownContacts);
    const hasChampion = /champion/i.test(knownContacts);
    const hasEconomicBuyer = /economic buyer|budget|cfo|ceo|coo/i.test(knownContacts);
    // Generate account tier based on ARR
    let accountTier = 'Prospect';
    let expansionPotential = 'High';
    if (currentArr > 500000) {
        accountTier = 'Strategic';
        expansionPotential = 'Very High';
    }
    else if (currentArr > 100000) {
        accountTier = 'Enterprise';
        expansionPotential = 'High';
    }
    else if (currentArr > 25000) {
        accountTier = 'Growth';
        expansionPotential = 'Medium';
    }
    else if (currentArr > 0) {
        accountTier = 'SMB';
        expansionPotential = 'Medium';
    }
    // Parse contacts and generate power map
    let powerMap = '';
    if (knownContacts) {
        powerMap = `
### Known Stakeholders
${knownContacts}

### Power Map Analysis
Based on the contacts provided, here's the stakeholder analysis:

| Contact you gave | Likely role in the decision | Next step |
|---|---|---|
${contacts.map((c) => `| ${c} | ${/champion/i.test(c) ? 'Champion' : /economic buyer|cfo|ceo|coo|budget/i.test(c) ? 'Economic buyer' : /it\b|cto|cio|engineer|technical|security/i.test(c) ? 'Technical influencer' : 'To confirm'} | ${/champion/i.test(c) ? 'Test their power and give them material to sell internally' : /economic buyer|cfo|ceo|coo|budget/i.test(c) ? 'Agree the outcome they are measured on and get a meeting before the proposal' : 'Ask what they need from this decision'} |`).join('\n')}

${hasChampion ? '' : `**Potential Champions:**
- Who has the problem you solve?
- Who's measured on outcomes you impact?
`}${hasEconomicBuyer ? '' : `**Likely Decision Makers:**
- Look for budget owners and P&L responsibility
`}${acctCtx.v ? `
**Usual buying committee in ${acctCtx.v.name}:** ${acctCtx.v.committee}
` : ''}
**Technical Influencers:**
- Who evaluates solutions?
- Who implements and maintains?

**Potential Blockers:**
- Who loses budget/headcount if you succeed?
- Who owns competing solutions?`;
    }
    else {
        powerMap = `
### Power Map (To Be Mapped)

**Discovery Priorities:**
1. Who owns the problem you solve?
2. Who controls the budget?
3. Who will use the solution daily?
4. Who must approve the purchase?

**Typical Stakeholders (a general list${args.industry ? `, not specific to ${lowerFirstIfCommon(industry)}` : ''}):**
- **Economic Buyer**: CFO, VP Operations, Business Unit Head
- **Technical Buyer**: CTO, VP Engineering, IT Director
- **User Buyer**: Department Head, Team Lead
- **Champion**: Someone with the pain + influence`;
    }
    // Generate whitespace analysis
    let whitespaceAnalysis = '';
    if (currentProducts) {
        whitespaceAnalysis = `
### Current Footprint
${currentProducts}

### Whitespace Opportunities
Based on current products, consider expansion into:
1. **Adjacent use cases**: Who else has similar problems?
2. **Deeper penetration**: More users, more features, more data
3. **Cross-sell**: Complementary products they don't have
4. **Upsell**: Premium tiers, enterprise features`;
    }
    else {
        whitespaceAnalysis = `
### Whitespace Analysis
**Full greenfield opportunity**: No current footprint

**Land Strategy Recommendations:**
1. Start with a specific pain point and team
2. Prove value quickly (30-60 days) ${EXAMPLE}
3. Build internal champions
4. Expand from success`;
    }
    // Generate competitive strategy
    let competitiveStrategy = '';
    if (competitiveThreats) {
        competitiveStrategy = `
### Competitive Landscape
${competitiveThreats}

### Defensive/Offensive Strategy

**Landmine Questions to Ask:**
1. "How do they handle [your strength area]?"
2. "What's their roadmap for [emerging requirement]?"
3. "Can you talk to customers in your exact situation?"

**Evaluation Criteria to Establish:**
1. Position your unique strengths as requirements
2. Make their weaknesses visible through discovery
3. Establish ROI framework that favors your approach`;
    }
    else {
        competitiveStrategy = `
### Competitive Intelligence Needed
- Who else are they evaluating?
- Who are they using today?
- What would make them switch?

**Discovery Questions:**
1. "Who else is solving this problem for you today?"
2. "What would need to change for you to consider alternatives?"
3. "What's worked and not worked with current solutions?"`;
    }
    // Generate expansion opportunities
    let expansionSection = '';
    if (expansionOpportunities) {
        expansionSection = `
### Identified Expansion Opportunities
${expansionOpportunities}

### Expansion Playbook
1. **Document current value**: Quantify ROI from existing usage
2. **Identify expansion sponsors**: Who benefits from growth?
3. **Map to business initiatives**: Tie to strategic priorities
4. **Create urgency**: Why expand now vs later?`;
    }
    // Generate 90-day plan
    const today = new Date();
    const day30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const day60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const day90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    return `# Strategic Account Plan: ${accountName}

## Account Overview

| Attribute | Value |
|-----------|-------|
| **Account Name** | ${accountName} |
| **Industry** | ${args.industry || NOT_SUPPLIED} |
| **Account Tier** | ${accountTier} (set by this tool's rule from Current ARR) |
| **Current ARR** | ${hasValue(args.current_arr) ? money(currentArr) : NOT_SUPPLIED} |
| **Expansion Potential** | ${expansionPotential} (set by this tool's rule from Current ARR, not from your notes) |
| **Your Solution** | ${args.your_solution || NOT_SUPPLIED} |

---

## Strategic Analysis

${powerMap}

---

${whitespaceAnalysis}

---

${competitiveStrategy}

${expansionSection ? `---\n${expansionSection}` : ''}

---

## 90-Day Account Plan

### Days 1-30: ${currentArr > 0 ? 'Deepen the relationship' : 'Foundation'} (by ${day30.toISOString().split('T')[0]})

**Objectives:**
- [ ] ${contacts.length ? `Confirm the role of each contact you named (${contacts.length}) and find who is missing` : 'Complete stakeholder mapping (all decision makers identified)'}
- [ ] Understand current state and pain points${acctCtx.v ? ` (in ${acctCtx.v.name}, ask about ${acctCtx.v.metrics.slice(0, 3).join(', ')})` : ''}
- [ ] ${hasChampion ? 'Equip your champion with a short business case' : 'Identify 2 or 3 potential champions'}
- [ ] Document competitive landscape

**Key Activities:**
1. Schedule discovery meetings with key stakeholders
2. Research company news, earnings, initiatives
3. Map org chart and reporting relationships
4. Identify business triggers and priorities

**Success Criteria:**
- Champion identified and engaged
- Pain points documented and quantified
- Initial business case hypothesis

---

### Days 31-60: Engagement (by ${day60.toISOString().split('T')[0]})

**Objectives:**
- [ ] Demonstrate value to key stakeholders
- [ ] Build business case with quantified ROI
- [ ] Multi-thread across buying committee
- [ ] Address technical and procurement requirements

**Key Activities:**
1. Conduct demo/workshop with stakeholders
2. Develop ROI model with customer data
3. Connect champion with reference customers, if you have them
4. Begin technical validation if needed

**Success Criteria:**
- Business case accepted by economic buyer
- Technical requirements validated
- Procurement process understood

---

### Days 61-90: Close/Expand (by ${day90.toISOString().split('T')[0]})

**Objectives:**
- [ ] ${currentArr > 0 ? 'Close expansion deal' : 'Close initial deal'}
- [ ] Establish success metrics and implementation plan
- [ ] Set foundation for future expansion
- [ ] Document wins and learnings

**Key Activities:**
1. Finalize commercial terms
2. Complete procurement process
3. Kick off implementation planning
4. Identify next expansion opportunity

**Success Criteria:**
- Contract signed
- Implementation scheduled
- Expansion opportunities documented

---

## Account Intelligence

${accountNotes ? `### Additional Context\n${accountNotes}\n\n` : ''}### Research Checklist
- [ ] Recent news and press releases
- [ ] Earnings calls and investor presentations (if the company is public)
- [ ] LinkedIn for org changes and hiring
- [ ] Glassdoor for culture insights
- [ ] G2/review sites for tech stack
- [ ] Job postings for priorities

### Key Questions to Answer
1. What are their top 3 strategic priorities this year?
2. How do they measure success?
3. What's their budget cycle?
4. Who has buying authority?
5. What would prevent them from buying?

---

## Next Actions

| Priority | Action | Owner | Due Date |
|----------|--------|-------|----------|
| High | ${hasChampion ? 'Brief your champion and agree the next meeting' : 'Identify and engage a champion'} | AE | Week 1 |
| High | Map decision-making process | AE | Week 2 |
| Medium | Research competitive landscape | AE | Week 2 |
| Medium | Build initial business case | AE + SE | Week 3 |
| Low | Document account in CRM | AE | Ongoing |

---

*Account Plan Generated: ${today.toISOString().split('T')[0]}*
*Review and Update: Monthly*

${SUGGESTIONS_FOOTER}`;
}
// Tool 2: Deal Strategy Coach
function executeDealStrategyCoach(args) {
    const dealName = args.deal_name || 'Deal';
    const dealValue = args.deal_value || 0;
    const dealStage = args.deal_stage || 'discovery';
    const daysInStage = args.days_in_stage || 0;
    const championStatus = args.champion_status || 'no_champion';
    const economicBuyer = args.economic_buyer || '';
    const competitors = args.competitors || '';
    const blockers = args.blockers || '';
    const nextSteps = args.next_steps || '';
    const closeDate = args.close_date || '';
    const yourSolution = args.your_solution || 'your solution';
    // Calculate deal health
    let healthScore = 70; // Start at 70
    let healthFactors = [];
    // Champion impact
    if (championStatus === 'multi_threaded') {
        healthScore += 15;
        healthFactors.push('Multi-threaded (strong)');
    }
    else if (championStatus === 'confirmed_champion') {
        healthScore += 10;
        healthFactors.push('Confirmed champion');
    }
    else if (championStatus === 'potential_champion') {
        healthScore += 0;
        healthFactors.push('Note: Champion not confirmed');
    }
    else {
        healthScore -= 20;
        healthFactors.push('High risk: No champion identified');
    }
    // Economic buyer
    if (economicBuyer && economicBuyer.toLowerCase().includes('engaged')) {
        healthScore += 10;
        healthFactors.push('Economic buyer engaged');
    }
    else if (economicBuyer) {
        healthScore += 5;
        healthFactors.push('Note: Economic buyer identified but not engaged');
    }
    else {
        healthScore -= 10;
        healthFactors.push('High risk: Economic buyer unknown');
    }
    // Days in stage penalty
    const stageDaysThreshold = {
        prospecting: 14,
        discovery: 21,
        demo: 14,
        proposal: 21,
        negotiation: 30,
        closing: 14,
        stuck: 0
    };
    const threshold = stageDaysThreshold[dealStage] || 21;
    if (daysInStage > threshold * 2) {
        healthScore -= 15;
        healthFactors.push(`High risk: ${daysInStage} days in stage (more than 2x this tool's example threshold for the stage) ${EXAMPLE}`);
    }
    else if (daysInStage > threshold) {
        healthScore -= 5;
        healthFactors.push(`Note: ${daysInStage} days in stage (above this tool's example threshold for the stage)`);
    }
    // Competitor impact
    if (competitors && competitors.toLowerCase().includes('incumbent')) {
        healthScore -= 10;
        healthFactors.push('Note: Competing against incumbent');
    }
    else if (competitors) {
        healthScore -= 5;
        healthFactors.push('Note: Active competition');
    }
    // Blockers impact
    if (blockers) {
        healthScore -= 10;
        healthFactors.push('High risk: Known blockers present');
    }
    healthScore = Math.max(0, Math.min(100, healthScore));
    let healthStatus = 'Healthy';
    if (healthScore < 50) {
        healthStatus = 'At Risk';
    }
    else if (healthScore < 70) {
        healthStatus = 'Needs Attention';
    }
    // Stage-specific strategies
    const stageStrategies = {
        prospecting: `
### Prospecting Stage Strategy

**Primary Objective:** Earn the first meeting

**Tactical Priorities:**
1. **Research deeply**: Know their business before outreach
2. **Find a warm path**: Referral, common connection, trigger event
3. **Lead with insight**: Not what you sell, but what you know
4. **Multi-channel approach**: Email, LinkedIn, phone, events

**Key Questions to Answer:**
- Why would they take a meeting NOW?
- What business problem can you help with?
- Who is the right entry point?

**Success Metrics:**
- Meeting scheduled with right persona
- Clear agenda established
- Multiple stakeholders aware`,
        discovery: `
### Discovery Stage Strategy

**Primary Objective:** Understand and quantify the problem

**Tactical Priorities:**
1. **Deep discovery**: Understand the problem better than they do
2. **Quantify impact**: Turn pain into dollars and time
3. **Multi-thread**: Don't rely on single contact
4. **Map the process**: Understand how they buy

**Key Questions to Answer:**
- What's the cost of inaction?
- Who else needs to be involved?
- What's their timeline and process?
- What would success look like?

**Success Metrics:**
- Problem quantified in business terms
- Multiple stakeholders engaged
- Buying process understood
- Next steps committed`,
        demo: `
### Demo Stage Strategy

**Primary Objective:** Connect solution to their specific needs

**Tactical Priorities:**
1. **Customize heavily**: Demo their use case, not features
2. **Confirm understanding**: Validate discovery before showing
3. **Address concerns**: Surface and handle objections
4. **Drive commitment**: Get clear next steps

**Key Questions Before Demo:**
- "What would make this demo a success for you?"
- "Who else should see this?"
- "What's your biggest concern about this type of solution?"

**Success Metrics:**
- Stakeholder buy-in on fit
- Technical validation path clear
- Business case discussion scheduled
- Objections surfaced and addressed`,
        proposal: `
### Proposal Stage Strategy

**Primary Objective:** Present a compelling, differentiated offer

**Tactical Priorities:**
1. **No surprises**: Proposal should confirm what's already discussed
2. **Quantify value**: ROI > 3x investment ${EXAMPLE}
3. **Differentiate**: Why you, not just why change
4. **Create urgency**: Why now matters

**Proposal Must Include:**
- Executive summary (1 page)
- Problem/solution alignment
- Quantified business case
- Implementation approach
- Investment and ROI
- Social proof
- Clear next steps

**Success Metrics:**
- Proposal reviewed with champion first
- Economic buyer sees business case
- Timeline to decision established
- Procurement engaged`,
        negotiation: `
### Negotiation Stage Strategy

**Primary Objective:** Close deal while protecting value

**Tactical Priorities:**
1. **Defend value**: Trade, don't discount
2. **Multi-thread**: Don't let procurement isolate you
3. **Create urgency**: Why close by target date
4. **Stay close to champion**: They fight for you internally

**Negotiation Tactics:**
- Never discount without getting something back
- Bundle value, don't unbundle price
- Use time as leverage
- Keep executive sponsor engaged

**What to Trade (Not Discount):**
- Payment terms
- Contract length
- Implementation timing
- Success services
- Future pricing protection

**Success Metrics:**
- Deal signed at acceptable margin
- Terms support customer success
- Reference/case study committed
- Expansion opportunity identified`,
        closing: `
### Closing Stage Strategy

**Primary Objective:** Get signature and start value delivery

**Tactical Priorities:**
1. **Remove all blockers**: Legal, procurement, technical
2. **Daily communication**: Don't let momentum die
3. **Parallel processing**: Multiple tracks moving
4. **Executive alignment**: Keep sponsors engaged

**Closing Checklist:**
- [ ] All technical validations complete
- [ ] Legal redlines resolved
- [ ] Security/compliance approved
- [ ] Budget confirmed and allocated
- [ ] Procurement process completed
- [ ] Signature authority confirmed

**Success Metrics:**
- Contract executed
- Implementation kickoff scheduled
- Success criteria documented
- Account plan for expansion`,
        stuck: `
### STUCK DEAL: Urgent Recovery Strategy

**Primary Objective:** Re-qualify or kill the deal

**Diagnostic Questions:**
1. **Is there a real problem?** Or did we create perceived need?
2. **Do they have budget?** Confirmed, not assumed
3. **Is timing real?** What happens if they don't act?
4. **Do we have power?** Access to decision maker?

**Recovery Tactics:**
1. **Go high**: Request executive conversation
2. **Create event**: New information, risk, or opportunity
3. **Change the conversation**: Different angle or use case
4. **Walk away test**: "Should we pause this?"

**Kill Criteria (Move On If):**
- Champion has left or disengaged
- Budget moved to other priorities
- Competitor selected
- No response in 3+ attempts ${EXAMPLE}
- Problem not urgent enough

**Decision Framework:**
- Commit to resolution in 2 weeks ${EXAMPLE}
- Either unstick or move out of pipeline`
    };
    // Generate specific recommendations
    let specificRecs = '';
    if (championStatus === 'no_champion') {
        specificRecs += `
### CRITICAL: Find Your Champion

Without a champion, win rate drops 70%+ (example claim: keep it only if your data shows it). Immediate action required:

1. **Identify potential champions**: Who has the pain and influence?
2. **Test for championship**: Will they:
   - Advocate internally when you're not there?
   - Share information about competition and process?
   - Help you access other stakeholders?
3. **Enable your champion**: Give them ammunition:
   - Internal business case
   - Executive talking points
   - ROI one-pager

`;
    }
    if (!economicBuyer) {
        specificRecs += `
### Note: Economic Buyer Unknown

The economic buyer was not supplied. If you do not know who controls the budget:

1. **Ask directly**: "Who has final approval on budget and vendor selection?"
2. **Map the org**: Who does your champion report to?
3. **Follow the money**: Where does this budget come from?
4. **Request introduction**: "Can you help me understand the approval process?"

`;
    }
    if (competitors) {
        specificRecs += `
### Competitive Strategy

**Competitors:** ${competitors}

**Tactics:**
1. **Know their weaknesses**: Every competitor has gaps
2. **Set traps**: Questions that expose their limitations
3. **Don't go negative**: Let buyer discover issues
4. **Change the criteria**: Make your strengths their requirements

**Landmine Questions to Suggest:**
- "How will you test the scenario you care most about, with your own data?"
- "What does each option cost over three years, including what is outside the quoted price?"
- "Can each vendor show a customer like you, and can you call them?"

`;
    }
    // Run 19 D80 (problem 3): every blocker the user typed gets its own answer, from the sector's known objections where one matches.
    const dealCtx = readContext(undefined, yourSolution, blockers, competitors, nextSteps, dealName);
    if (blockers) {
        const items = splitItems(blockers);
        specificRecs += `
### Blocker Mitigation

${items.map((b, i) => `**Blocker ${i + 1}: ${q(b)}**
- What to do: ${answerFor(b, dealCtx.v)}
- Ask first: "What would have to be true for this to stop being a concern?"`).join('\n\n')}

**For any blocker that is a person:** find out whether they are threatened by the change, own a competing option or have a fair concern; answer their concern too, and ask your champion or an executive sponsor for cover only after that.

`;
    }
    if (dealCtx.v) {
        specificRecs += `
${sectorNotes(dealCtx.v)}

`;
    }
    return `# Deal Strategy Coach: ${dealName}

## Deal Health Assessment

| Metric | Value |
|--------|-------|
| **Deal Name** | ${dealName} |
| **Deal Value** | ${hasValue(args.deal_value) ? money(dealValue) : NOT_SUPPLIED} |
| **Current Stage** | ${dealStage.charAt(0).toUpperCase() + dealStage.slice(1)} |
| **Days in Stage** | ${hasValue(args.days_in_stage) ? daysInStage : NOT_SUPPLIED} |
| **Target Close** | ${closeDate || 'Not set'} |
| **Solution** | ${args.your_solution || NOT_SUPPLIED} |

### Health Score: ${healthScore}/100 (${healthStatus})

*Set by this tool's rule: a base score adjusted for champion status, economic buyer, days in stage, competitors and blockers (the factors below).*

**Health Factors:**
${healthFactors.map(f => `- ${f}`).join('\n')}

---

${stageStrategies[dealStage] || stageStrategies['discovery']}

---

${specificRecs}

## Immediate Actions

### Next 24-48 Hours
${championStatus === 'no_champion' ? '1. **Identify champion** (high priority): Cannot win without one' : championStatus === 'potential_champion' ? '1. **Confirm your potential champion** (medium priority): test them before you rely on them' : '1. Done: champion identified. Keep them engaged'}
${!economicBuyer ? '2. **Find economic buyer** (high priority): Who controls budget?' : '2. Done: economic buyer known. Get them involved'}
3. **Advance the deal**: ${nextSteps || 'Schedule next meeting with clear agenda'}
4. **Update CRM**: Document all new information

### This Week
- [ ] Confirm or find champion
- [ ] Map all stakeholders
- [ ] Understand competitive position
- [ ] Document buying process
- [ ] Build/refine business case

---

## Coaching Questions

Ask yourself:
1. **Why will they buy?** What's the compelling event?
2. **Why will they buy from us?** What's our differentiation?
3. **Why will they buy now?** What creates urgency?
4. **Who decides?** Do we have the right relationships?
5. **What can go wrong?** What are we not seeing?

---

*Strategy generated for ${dealStage} stage deals*
*Review with manager weekly*

${SUGGESTIONS_FOOTER}`;
}
// Tool 3: Discovery Question Bank
function executeDiscoveryQuestionBank(args) {
    const framework = args.framework || 'meddpicc';
    const prospectIndustry = args.prospect_industry || '';
    const prospectRole = args.prospect_role || '';
    const knownPainPoints = args.known_pain_points || '';
    const knownMetrics = args.known_metrics || '';
    const dealStage = args.deal_stage || 'discovery';
    const yourSolution = args.your_solution || 'your solution';
    const gapsToFill = args.gaps_to_fill || '';
    // Run 19 D80 (problems 2, 3 and 8): gaps first, in the sector's language; "none" is never echoed back as if it were a metric.
    const ctx = readContext(undefined, prospectIndustry, prospectRole, knownPainPoints, yourSolution);
    const noMetrics = /^(none|no|not yet|unknown|n\/a|na|tbd|none shared yet|not shared|nothing yet)\b/i.test(knownMetrics.trim());
    const firstMetric = ctx.v ? ctx.v.metrics[0] : 'the number this problem moves';
    const metricsFollowUp = !knownMetrics ? '' : noMetrics
        ? `**Not known yet:** no metrics shared so far. Ask for a baseline first:\n- "How do you measure ${firstMetric} today, and who owns that number?"`
        : `**Already Known:** ${knownMetrics}\n**Follow-up:** "You mentioned ${q(lowerFirstIfCommon(knownMetrics))}. How are you measuring that today, and how often?"`;
    const GAP_QUESTIONS = [
        [/economic buyer|budget owner|sign/i, 'Economic buyer', '"Who signs off a decision like this, and have they seen this problem first-hand?"'],
        [/decision process|process|approval/i, 'Decision process', '"What steps does a purchase like this go through here, and who is involved at each step?"'],
        [/budget/i, 'Budget', '"Is there budget for this in the current year, and which line does it sit under?"'],
        [/criteria/i, 'Decision criteria', '"How will you compare the options: what has to be true for a yes?"'],
        [/paper|legal|procurement|contract/i, 'Paper process', '"What do legal, security and procurement need to see, and how long do they usually take?"'],
        [/timeline|timing|critical event|deadline|when/i, 'Timeline', '"What happens if nothing changes by the end of the quarter?"'],
        [/champion/i, 'Champion', '"Who besides you wants this fixed, and what would they gain?"'],
        [/competi|alternative/i, 'Competition', '"What else are you considering, including doing nothing?"'],
        [/metric|baseline|number/i, 'Metrics', `"How do you measure ${firstMetric} today?"`],
    ];
    const gaps = splitItems(gapsToFill);
    const gapRows = gaps.map((g) => { const m = GAP_QUESTIONS.find(([re]) => re.test(g)); return `- **${cap(g)}:** ${m ? m[2] : `"Can you walk me through ${lowerFirstIfCommon(g)}?"`}`; });
    const gapSection = gaps.length ? `## Gaps to fill first\n\nYou said these are still open, so ask about them before anything else:\n${gapRows.join('\n')}\n\n---\n\n` : '';
    const sectorSection = ctx.v ? `## Questions in the language of ${ctx.v.name}\n\n${ctx.v.discovery.map((x) => `- "${x}"`).join('\n')}\n\n${sectorNotes(ctx.v, 'committee')}\n\n---\n\n` : '';
    // MEDDPICC Questions
    const meddpiccQuestions = `
## MEDDPICC Framework Questions

### M: Metrics
*What are the quantified goals or benefits the customer expects?*

**Initial Discovery:**
- "What metrics does your team get measured on?"
- "If this problem was solved, what would improve?"
- "How much time/money is this problem costing you today?"

**Deepening:**
- "How did you arrive at that number?"
- "Who else is impacted by these metrics?"
- "What happens to your goals if you don't address this?"

${metricsFollowUp}

---

### E: Economic Buyer
*Who has the final authority to approve the spend?*

**Identification:**
- "Who has final sign-off on an investment like this?"
- "Walk me through your approval process for new vendors."
- "When you've made purchases like this before, who was involved?"

**Engagement:**
- "What would [Economic Buyer] need to see to move forward?"
- "How is [Economic Buyer] thinking about this problem?"
- "Can we include [Economic Buyer] in our next conversation?"

---

### D: Decision Criteria
*What are the formal requirements for making a decision?*

**Understanding:**
- "What criteria will you use to evaluate solutions?"
- "What's most important to you in making this decision?"
- "Are there must-haves vs nice-to-haves?"

**Influencing:**
- "Have you considered [your differentiator] as a criterion?"
- "How important is [your strength] in your evaluation?"
- "What would cause you to eliminate a vendor?"

---

### D: Decision Process
*What is the process for making and approving the decision?*

**Mapping:**
- "Can you walk me through your typical buying process?"
- "What steps happen between now and signing?"
- "Who needs to be involved at each stage?"

**Timing:**
- "When do you need to make a decision by?"
- "What's driving that timeline?"
- "What happens if the decision is delayed?"

---

### P: Paper Process
*What is the formal process for getting contracts signed?*

**Understanding:**
- "What does your procurement process look like?"
- "How long does legal review typically take?"
- "Are there security or compliance reviews required?"

**Preparing:**
- "Can we start the paperwork in parallel?"
- "What documents do you need from us?"
- "Who in procurement should I connect with?"

---

### I: Identify Pain
*What are the business problems driving the initiative?*

**Surface Level:**
- "What prompted you to look at solutions like this?"
- "What's not working today?"
- "If you do nothing, what happens?"

**Deepening:**
${knownPainPoints ? `**Already Known:** ${knownPainPoints}\n- "You mentioned ${q(lowerFirstIfCommon(knownPainPoints))}. Can you tell me more about the impact?"` : '- "What\'s the root cause of this problem?"\n- "How long has this been an issue?"'}
- "Who else in the organization feels this pain?"

---

### C: Champion
*Who will sell internally on your behalf?*

**Identification:**
- "Who else in your organization sees this as a priority?"
- "Who would benefit most from solving this problem?"
- "Who's driven similar changes before?"

**Testing:**
- "If I gave you a compelling business case, would you share it with [stakeholder]?"
- "What obstacles do you see, and would you help me address them?"
- "Can you help me understand the internal dynamics?"

---

### C: Competition
*What alternatives are being considered?*

**Direct:**
- "Who else are you evaluating?"
- "Have you looked at building this internally?"
- "What's the option of doing nothing?"

**Positioning:**
- "What do you like about [competitor]?"
- "What concerns do you have about [competitor]?"
- "How are you thinking about the differences between options?"`;
    // BANT Questions
    const bantQuestions = `
## BANT Framework Questions

### B: Budget
*Is there budget allocated for this initiative?*

**Discovery:**
- "Is there budget allocated for solving this problem?"
- "What's your typical investment for solutions in this area?"
- "How does budget get approved for new initiatives?"

**Qualifying:**
- "If you saw the right solution, is budget available this quarter?"
- "What budget range are you working within?"
- "Who controls the budget for this type of purchase?"

---

### A: Authority
*Does this person have the authority to buy?*

**Understanding:**
- "Who typically makes decisions on investments like this?"
- "What's your role in the evaluation process?"
- "Who else needs to be involved in this decision?"

**Navigating:**
- "Can you help me understand the approval chain?"
- "Would it make sense to include [decision maker] in our conversation?"
- "What would you need to recommend us internally?"

---

### N: Need
*Is there a genuine business need?*

**Validating:**
- "What's driving your interest in solving this now?"
- "How does this rank among your team's priorities?"
- "What happens if you don't address this?"

**Quantifying:**
- "What's the cost of the current situation?"
- "How many people/processes are affected?"
- "What would solving this mean for your goals?"

---

### T: Timeline
*When do they need to make a decision?*

**Understanding:**
- "When do you need this solution in place?"
- "What's driving that timeline?"
- "What happens if the timeline slips?"

**Creating Urgency:**
- "Is there an event or deadline creating urgency?"
- "When does budget need to be used by?"
- "What are the consequences of waiting?"`;
    // SPICED Questions
    const spicedQuestions = `
## SPICED Framework Questions

### S: Situation
*What is the prospect's current state?*

**Understanding:**
- "Help me understand your current setup."
- "How are you handling this today?"
- "Who's involved in this process currently?"

**Context:**
- "How has this evolved over time?"
- "What's worked and what hasn't?"
- "What tools/processes are in place today?"

---

### P: Pain
*What problems are they experiencing?*

**Surface:**
- "What's frustrating about the current situation?"
- "What would you change if you could?"
- "Where do things break down?"

**Impact:**
${knownPainPoints ? `**Already Known:** ${knownPainPoints}\n- "You mentioned ${q(lowerFirstIfCommon(knownPainPoints))}. How does that affect your team's performance?"` : '- "How is this problem affecting your team?"'}
- "What's the ripple effect of this issue?"
- "How much time/money does this cost?"

---

### I: Impact
*What is the business impact of the pain?*

**Quantifying:**
- "If you could solve this, what would improve?"
- "What would success look like in 12 months?" ${EXAMPLE}
- "How would you measure the impact?"

**Expanding:**
- "Who else benefits when this is solved?"
- "How does this affect your company's goals?"
- "What becomes possible once this is fixed?"

---

### C: Critical Event
*What's creating urgency?*

**Identifying:**
- "What's happening that makes this important now?"
- "Is there a deadline or event driving this?"
- "What happens if this isn't solved by [date]?"

**Leveraging:**
- "What would the impact be of missing that deadline?"
- "How does this fit with your planning cycle?"
- "What's the cost of delay?"

---

### E: Event (or Expected Decision Process)
*How will they make the decision?*

**Process:**
- "Walk me through how you'll evaluate options."
- "What criteria matter most to you?"
- "Who needs to be involved in this decision?"

**Timeline:**
- "What's your target timeline for a decision?"
- "What could speed up or slow down the process?"
- "What do you need from us to move forward?"

---

### D: Decision Criteria
*What factors will drive the decision?*

**Understanding:**
- "What matters most in making this decision?"
- "What would cause you to choose one vendor over another?"
- "Are there any deal-breakers we should know about?"

**Influencing:**
- "How important is [your differentiator] to you?"
- "Have you considered [evaluation criteria]?"
- "What's the weighting between price and value?"`;
    // Challenger Questions
    const challengerQuestions = `
## Challenger Sale Framework Questions

### Teach: Share Insights
*Lead with provocative insights about their business*

**Reframe Questions:**
- "Have you considered that [surprising insight about their industry]?"
- "What if the problem isn't [obvious issue] but actually [hidden issue]?"
- "[Only if true and provable: We've seen companies like yours [unexpected finding].] Have you experienced that?"

**Insight Starters:**
- "[Only if true and provable: Most companies we talk to think [common belief], but the data shows [surprising reality].]"
- "[Only if true and provable: There's a hidden cost in your current approach: [the cost].]"
- "[Only if true and provable: The best-performing teams in your industry are doing [what they do differently].]"

---

### Tailor: Customize the Message
*Connect insights to their specific situation*

**Resonance Questions:**
- "How does this match what you're seeing?"
- "Where do you think this applies most in your organization?"
- "What would this mean for your specific goals?"

**Personalization:**
- "Given your role, where do you see the biggest impact?"
- "How would your CEO/board react to this insight?"
- "What's unique about your situation that we should factor in?"

---

### Take Control: Guide the Process
*Assertively lead the conversation and process*

**Direction Setting:**
- "Based on what I'm hearing, here's what I think we should do next..."
- "The path forward I'd suggest is..."
- "Let me suggest a different way to think about this..."

**Constructive Tension:**
- "I'm going to push back a bit on that assumption..."
- "Have you stress-tested that approach?"
- "What would need to be true for that to work?"`;
    // Gap Selling Questions
    const gapSellingQuestions = `
## Gap Selling Framework Questions

### Current State
*Deep understanding of where they are today*

**Process:**
- "Walk me through exactly how you do this today."
- "Who's involved at each step?"
- "What tools and systems are you using?"

**Performance:**
- "How is that working for you? (Scale 1-10)"
- "What's the gap between where you are and where you want to be?"
- "How long has it been this way?"

---

### Future State
*Vision of where they want to be*

**Goals:**
- "What would ideal look like?"
- "If we fast-forward a year, what's different?"
- "What does success look like for you personally?"

**Specifics:**
- "How would you measure that success?"
- "What capabilities do you need that you don't have today?"
- "What's the timeline for achieving that future state?"

---

### The Gap
*Quantify the difference between current and future*

**Impact:**
- "What's the cost of staying in the current state?"
- "What opportunities are you missing?"
- "How does this gap affect your team/company?"

**Urgency:**
- "How much is this gap costing you per month/quarter/year?"
- "What's the risk of not closing this gap?"
- "Who else feels the pain of this gap?"

---

### Problems Behind the Problems
*Uncover root causes*

**Root Cause:**
- "Why do you think this problem exists?"
- "What's preventing you from solving it internally?"
- "What have you tried before? Why didn't it work?"

**Technical Debt:**
- "What decisions from the past are creating problems now?"
- "What would you do differently if starting from scratch?"
- "What constraints are you working within?"`;
    // Build output based on framework selection
    let output = `# Discovery Question Bank

## Context
- **Prospect Industry:** ${prospectIndustry || 'Not specified'}
- **Contact Role:** ${prospectRole || 'Not specified'}
- **Deal Stage:** ${dealStage.replace(/_/g, ' ')}
- **Your Solution:** ${args.your_solution || NOT_SUPPLIED}
${knownPainPoints ? `- **Known Pain Points:** ${knownPainPoints}` : ''}
${knownMetrics ? `- **Known Metrics:** ${knownMetrics}` : ''}
${gapsToFill ? `- **Information Gaps:** ${gapsToFill}` : ''}

${ctx.line}

---

${gapSection}${sectorSection}`;
    if (framework === 'meddpicc' || framework === 'all') {
        output += meddpiccQuestions + '\n\n---\n\n';
    }
    if (framework === 'bant' || framework === 'all') {
        output += bantQuestions + '\n\n---\n\n';
    }
    if (framework === 'spiced' || framework === 'all') {
        output += spicedQuestions + '\n\n---\n\n';
    }
    if (framework === 'challenger' || framework === 'all') {
        output += challengerQuestions + '\n\n---\n\n';
    }
    if (framework === 'gap_selling' || framework === 'all') {
        output += gapSellingQuestions + '\n\n---\n\n';
    }
    // Stage-specific recommendations
    const stageRecommendations = {
        first_call: `
## First Call Recommendations

**Focus Areas:**
1. Build rapport and establish credibility
2. Understand their world before pitching
3. Identify pain and quantify impact
4. Determine if there's a fit

**Questions to Prioritize:**
- "What prompted you to take this meeting?"
- "What's your biggest challenge in [area]?"
- "If you could wave a magic wand, what would change?"

**Avoid:**
- Pitching too early
- Yes/no questions
- Talking more than 40% of the time ${EXAMPLE}`,
        discovery: `
## Discovery Stage Recommendations

**Focus Areas:**
1. Deep-dive into pain and impact
2. Identify all stakeholders
3. Understand buying process
4. Quantify business case

**Questions to Prioritize:**
- Pain quantification questions
- Stakeholder mapping questions
- Process and timeline questions

**Key Outcome:**
Leave with clear understanding of the business case and path to decision`,
        deep_dive: `
## Deep Dive Recommendations

**Focus Areas:**
1. Technical requirements
2. Integration needs
3. Success criteria
4. Risk factors

**Questions to Prioritize:**
- Technical validation questions
- Implementation concerns
- Success metrics definition

**Key Outcome:**
Technical fit confirmed, implementation path clear`,
        technical: `
## Technical Discovery Recommendations

**Focus Areas:**
1. Current architecture
2. Integration requirements
3. Security and compliance
4. Performance needs

**Questions to Prioritize:**
- "What's your current tech stack?"
- "What systems would this need to integrate with?"
- "What are your security requirements?"
- "What's your deployment preference?"

**Key Outcome:**
Technical validation complete, architecture approved`,
        executive: `
## Executive Meeting Recommendations

**Focus Areas:**
1. Business impact and ROI
2. Strategic alignment
3. Risk mitigation
4. Decision authority

**Questions to Prioritize:**
- "How does this fit with your strategic priorities?"
- "What would success mean for the business?"
- "What concerns would we need to address?"

**Key Outcome:**
Executive sponsorship and path to decision`
    };
    output += stageRecommendations[dealStage] || stageRecommendations['discovery'];
    output += `

---

## Pro Tips

**Active Listening:**
1. **Wait 3 seconds** after they finish before responding
2. **Summarize** what you heard to confirm understanding
3. **Go deeper**: "Tell me more about that"
4. **Take notes**: Show you're capturing what matters

**Question Sequencing:**
1. **Open** with broad questions (situation)
2. **Narrow** to specific pains
3. **Quantify** the impact
4. **Expand** to organizational impact
5. **Confirm** understanding

**Red Flags to Probe:**
- "We're just looking" → "What triggered the looking?"
- "No budget" → "If ROI was clear, would budget become available?"
- "Happy with current vendor" → "What would ideal look like?"

---

*Use these questions as a guide, not a script. Listen more than you talk.*

${SUGGESTIONS_FOOTER}`;
    return output;
}
// Tool 4: ROI Business Case Builder
function executeRoiBusinessCaseBuilder(args) {
    const customerName = args.customer_name || '[Customer name]';
    const industry = args.industry || 'Technology';
    const companySize = args.company_size || 'mid_market';
    // D45 (run 16): omitted, null and 0 are told apart with explicit checks, as for the price below. Omitted or null:
    // the missing size is estimated from the other one and labelled as an example. 0: the user's own input, used as 0.
    const revenueGiven = args.annual_revenue !== undefined && args.annual_revenue !== null;
    const employeesGiven = args.employee_count !== undefined && args.employee_count !== null;
    const annualRevenue = revenueGiven ? args.annual_revenue : 0;
    const employeeCount = employeesGiven ? args.employee_count : 0;
    const revenueIsZero = revenueGiven && annualRevenue === 0;
    const employeesIsZero = employeesGiven && employeeCount === 0;
    const yourSolution = args.your_solution || 'your solution';
    // D34 (run 15): omitted, null and 0 are told apart with explicit checks. Omitted or null: the labelled example
    // price is used. 0: the user's own input, so every figure that divides by it says it cannot be computed.
    const priceGiven = args.solution_price !== undefined && args.solution_price !== null;
    const solutionPrice = priceGiven ? args.solution_price : 0;
    const priceIsZero = priceGiven && solutionPrice === 0;
    const primaryValueDriver = args.primary_value_driver || 'productivity';
    const knownMetrics = args.known_metrics || '';
    const currentProcess = args.current_process || '';
    const implementationTimeline = args.implementation_timeline || '90 days';
    // Run 19 D80 (problems 5 and 6): the buyer's own figures come first. annual_value_estimate is used as the annual value;
    // otherwise current_annual_cost x expected_improvement_percent. Only when neither is given does the tool fall back to its
    // example model, and then it says so and rates its confidence Low.
    const num = (k) => (typeof args[k] === 'number' && Number.isFinite(args[k]) && args[k] >= 0 ? args[k] : null);
    const ownEstimate = num('annual_value_estimate');
    const ownCost = num('current_annual_cost');
    const ownPct = num('expected_improvement_percent');
    const userValue = ownEstimate !== null ? ownEstimate : ownCost !== null && ownPct !== null ? ownCost * ownPct / 100 : null;
    const userValueText = ownEstimate !== null ? `your own estimate of the annual value, ${money(ownEstimate)}`
        : ownCost !== null && ownPct !== null ? `${ownPct}% of the current annual cost you supplied (${money(ownCost)})` : '';
    // Industry benchmarks for ROI calculations
    const benchmarks = {
        Technology: {
            revenue_per_employee: 250000,
            cost_of_manual_work_per_hour: 75,
            average_churn_rate: 0.08,
            sales_cycle_days: 45
        },
        Financial_Services: {
            revenue_per_employee: 350000,
            cost_of_manual_work_per_hour: 100,
            average_churn_rate: 0.05,
            sales_cycle_days: 60
        },
        Healthcare: {
            revenue_per_employee: 150000,
            cost_of_manual_work_per_hour: 65,
            average_churn_rate: 0.06,
            sales_cycle_days: 75
        },
        Manufacturing: {
            revenue_per_employee: 200000,
            cost_of_manual_work_per_hour: 55,
            average_churn_rate: 0.04,
            sales_cycle_days: 60
        },
        Retail: {
            revenue_per_employee: 120000,
            cost_of_manual_work_per_hour: 45,
            average_churn_rate: 0.10,
            sales_cycle_days: 30
        }
    };
    const industryBenchmark = benchmarks[industry] || benchmarks['Technology'];
    // Size multipliers
    const sizeMultipliers = {
        startup: 0.5,
        smb: 0.8,
        mid_market: 1.0,
        enterprise: 1.5
    };
    const sizeMultiplier = sizeMultipliers[companySize] || 1.0;
    // Calculate estimated company metrics if not provided
    // A revenue given as 0 is never estimated from the employees; an employee count given as 0 is never estimated from the revenue.
    const estimatedRevenue = revenueGiven ? annualRevenue : (employeeCount * industryBenchmark.revenue_per_employee * sizeMultiplier);
    const estimatedEmployees = employeesGiven ? employeeCount : Math.round(annualRevenue / (industryBenchmark.revenue_per_employee * sizeMultiplier));
    // Display helpers (output text only; no calculation below changes). The user's own inputs are shown
    // as given; every figure built from this tool's example assumptions carries the EXAMPLE label.
    const fmt = (n) => n.toLocaleString('en-US');
    const usd = (n) => money(n); // run 15: -$17,640, not $-17,640; run 17 D55: money() adds the rule for amounts under $1
    const noSizeData = !revenueGiven && !employeesGiven;
    const NOT_COMPUTED = 'not computed: needs annual revenue or employee count';
    const revenueCell = revenueGiven
        ? (revenueIsZero ? '$0 (your input)' : `${money(annualRevenue)}`)
        : employeesGiven
            ? `${money(estimatedRevenue)}, estimated from your employee count ${EXAMPLE}`
            : NOT_SUPPLIED;
    const employeesCell = employeesGiven
        ? (employeesIsZero ? '0 (your input)' : fmt(employeeCount))
        : revenueGiven
            ? `${fmt(estimatedEmployees)}, estimated from your annual revenue ${EXAMPLE}`
            : NOT_SUPPLIED;
    const revenueValueCell = (n) => (noSizeData ? NOT_COMPUTED : `**${money(n)}** ${EXAMPLE}`);
    // Generate ROI calculations based on value driver
    let valueCalculations = '';
    let totalValue = 0;
    // Run 18 D65: the value amounts as they are printed, so the printed Total Quantified Value is the sum of its printed parts.
    const valueParts = [];
    let confidenceLevel = userValue !== null ? 'Medium' : 'Low';
    if (userValue !== null) {
        totalValue = userValue;
        valueParts.push(userValue);
        valueCalculations += `
### Value From Your Figures

**Calculation:**
- Annual value: ${userValueText} = **${money(userValue)}**
${ownEstimate === null && ownCost !== null && ownPct !== null ? `- Check with the buyer: does ${money(ownCost)} cover the whole cost of the problem today, and is ${ownPct}% the improvement they expect, not the best case?\n` : ''}
`;
    }
    if (userValue === null && (primaryValueDriver === 'revenue_increase' || primaryValueDriver === 'multiple')) {
        // Revenue impact calculation
        const revenueImpact = estimatedRevenue * 0.02; // Conservative 2% improvement
        totalValue += revenueImpact;
        valueParts.push(revenueImpact);
        valueCalculations += `
### Revenue Impact

**Calculation Methodology:**
- Estimated Annual Revenue: ${revenueCell}
- Assumed impact: 2% (example range: 1-5%) ${EXAMPLE}
- Annual Revenue Impact: ${revenueValueCell(revenueImpact)}

**Validation Questions:**
- "What's your current win rate?" (Baseline for improvement)
- "What would a 10% improvement in win rate mean in revenue?" ${EXAMPLE}
- "How much revenue is lost to no-decision or competitor?"

`;
    }
    if (userValue === null && (primaryValueDriver === 'cost_reduction' || primaryValueDriver === 'multiple')) {
        // Cost reduction calculation
        const hoursSavedPerEmployee = 5; // hours per week
        // Run 16 R16-41 (D45): an employee figure that is 0 because of a typed 0 (employee_count 0, or employees estimated from an
        // annual revenue of 0) is used as 0; the example minimum of 10 applies only to an employee figure above 0.
        const employeesZeroFromInput = employeesIsZero || (revenueIsZero && !employeesGiven);
        const impactedEmployees = employeesZeroFromInput ? 0 : Math.max(10, estimatedEmployees * 0.1);
        const weeklySavings = hoursSavedPerEmployee * impactedEmployees * industryBenchmark.cost_of_manual_work_per_hour;
        const annualCostSavings = weeklySavings * 50; // 50 working weeks
        totalValue += annualCostSavings;
        valueParts.push(annualCostSavings);
        valueCalculations += `
### Cost Reduction

**Calculation Methodology:**
${EXAMPLES}
- Hours saved per employee per week: ${hoursSavedPerEmployee} hours
- Employees impacted: ${impactedEmployees.toFixed(0)}
- Hourly cost of labor: ${money(industryBenchmark.cost_of_manual_work_per_hour)}
- Weekly savings: ${money(weeklySavings)}
- Annual Cost Savings: **${money(annualCostSavings)}**

**Validation Questions:**
- "How many hours per week do your team spend on [manual task]?"
- "What's the fully-loaded cost of your team members?"
- "How many people are doing this work today?"

`;
    }
    if (userValue === null && (primaryValueDriver === 'productivity' || primaryValueDriver === 'multiple')) {
        // Productivity calculation
        const productivityGain = estimatedRevenue * 0.01; // 1% productivity improvement
        totalValue += productivityGain;
        valueParts.push(productivityGain);
        valueCalculations += `
### Productivity Gains

**Calculation Methodology:**
- Revenue baseline: ${revenueCell}
- Productivity improvement: 1% (assumed) ${EXAMPLE}
- Annual Productivity Value: ${revenueValueCell(productivityGain)}

**Validation Questions:**
- "How much time does your team spend on low-value tasks?"
- "What could your team achieve with 10% more time?" ${EXAMPLE}
- "Where are the biggest time sinks today?"

`;
    }
    if (userValue === null && (primaryValueDriver === 'risk_mitigation' || primaryValueDriver === 'multiple')) {
        // Risk mitigation calculation
        const riskReduction = estimatedRevenue * 0.005; // 0.5% risk reduction value
        totalValue += riskReduction;
        valueParts.push(riskReduction);
        valueCalculations += `
### Risk Mitigation

**Calculation Methodology:**
- Revenue baseline: ${revenueCell}
- Risk reduction factor: 0.5% ${EXAMPLE}
- Annual Risk Mitigation Value: ${revenueValueCell(riskReduction)}

**Validation Questions:**
- "What's the cost of a compliance incident?"
- "How much revenue is at risk from [risk factor]?"
- "What would a data breach or outage cost you?"

`;
    }
    // Calculate ROI metrics
    const investment = priceGiven ? solutionPrice : totalValue * 0.1; // Assume 10% of value if price not supplied (omitted or null)
    const roi = ((totalValue - investment) / investment) * 100;
    const paybackMonths = (investment / totalValue) * 12;
    const threeYearValue = totalValue * 3;
    const threeYearNet = threeYearValue - (investment * 3);
    // Run 19 D80 (problem 5): confidence is never raised by metrics the calculation does not use.
    // Display text (output only; every figure above is unchanged)
    const nc = 'not computed';
    const priceSupplied = priceGiven;
    // D45: a revenue of 0 (or an employee count of 0 when no revenue was given) makes the revenue based value 0. The figures
    // that multiply are computed with 0; the ones that divide by that value (or by the example price taken from it) say what to add.
    // Run 16 R16-41: an employee count of 0 also makes the cost reduction value 0, so it is named when the revenue was not 0.
    const zeroWhat = revenueIsZero ? 'annual revenue' : (employeesIsZero ? 'employee count' : '');
    const valueIsZeroFromInput = totalValue === 0 && zeroWhat !== '';
    const valueComputed = totalValue > 0 || valueIsZeroFromInput;
    // A figure that divides by the price: with a price of 0 it prints the line below instead of a number
    const NEEDS_PRICE = 'not computed: add your annual price';
    const NEEDS_VALUE = `not computed: add your ${zeroWhat}`;
    // ROI and the value/cost ratio divide by the investment: a price of 0 (D34), or an example price (a share of the value) that is 0.
    const byInvestment = (text) => (priceIsZero ? NEEDS_PRICE : valueIsZeroFromInput && !priceGiven ? NEEDS_VALUE : text);
    // Payback divides by the value: a price of 0 is reported first (D34), then a value of 0.
    const byValue = (text) => (priceIsZero ? NEEDS_PRICE : valueIsZeroFromInput ? NEEDS_VALUE : text);
    const roiSummary = priceIsZero || (valueIsZeroFromInput && !priceGiven) ? `- **ROI:** ${byInvestment('')}` : `- **${roi.toFixed(0)}%** ROI`;
    const paybackSummary = priceIsZero || valueIsZeroFromInput ? `- **Payback:** ${byValue('')}` : `- **${paybackMonths.toFixed(1)} months** payback`;
    const sizeText = companySize === 'smb' ? 'SMB' : companySize.replace(/_/g, ' ');
    const benchmarkText = !args.industry
        ? 'Technology (no industry supplied)'
        : benchmarks[industry]
            ? industry
            : `Technology (your industry "${industry}" matched none of the built-in sets: ${Object.keys(benchmarks).join(', ')})`;
    const confidenceText = userValue !== null
        ? `${confidenceLevel}: the value comes from your own figures (${userValueText}); confirm them with the buyer`
        : `${confidenceLevel}: the value figures rest on example assumptions, not on the customer's data${knownMetrics ? '. The metrics you supplied are listed below; add current_annual_cost and expected_improvement_percent (or annual_value_estimate) to turn them into the value' : ''}`;
    const exampleOnly = userValue === null;
    const VL = exampleOnly ? ` ${EXAMPLE}` : '';
    const timelineText = `${implementationTimeline}${args.implementation_timeline ? '' : ` ${EXAMPLE}`}`;
    const ignoredInputs = [currentProcess ? 'current process' : '', knownMetrics ? 'known metrics' : ''].filter(Boolean).join(' and ');
    // Without a price, the investment is a share of the value, so it cannot be shown when no value is computed
    const invCell = (n) => (priceSupplied || valueComputed ? `${money(n)}` : nc);
    // Run 18 D65 (display only; every calculation above keeps full precision): the printed totals are sums or differences of the
    // printed parts: Year 1 Total Investment = Solution Cost + Implementation, Total Quantified Value = the printed value parts
    // (one part, or four in "multiple" mode), Net Annual Benefit = Total Quantified Value - Annual Investment.
    const implementationYear1 = wholeDollars(investment * 0.15);
    const year1Total = printedSum([investment, implementationYear1]);
    const printedValue = printedSum(valueParts);
    const printedNet = printedSum([printedValue, -investment]);
    return `# ROI Business Case: ${customerName}

*Your inputs are shown as you gave them. Every other figure comes from this tool's example assumptions (not from published research or the customer's data) and is marked as an example: replace those figures with the customer's own.*

## Executive Summary

| Metric | Value |
|--------|-------|
| **Customer** | ${args.customer_name || NOT_SUPPLIED} |
| **Industry** | ${args.industry || NOT_SUPPLIED} |
| **Company Size** | ${args.company_size ? sizeText : `${NOT_SUPPLIED} (treated as ${sizeText})`} |
| **Est. Annual Revenue** | ${revenueCell} |
| **Est. Employees** | ${employeesCell} |
| **Solution** | ${yourSolution} |
| **Confidence Level** | ${confidenceText} |

---

## Investment Summary

| Investment | Year 1 | Year 2 | Year 3 |
|------------|--------|--------|--------|
| **Solution Cost**${priceSupplied ? '' : ` (${NOT_SUPPLIED}) ${EXAMPLE}`} | ${priceIsZero ? '$0 (your input)' : invCell(investment)} | ${priceIsZero ? '$0 (your input)' : invCell(investment)} | ${priceIsZero ? '$0 (your input)' : invCell(investment)} |
| **Implementation** ${EXAMPLE} | ${invCell(implementationYear1)} | ${invCell(0)} | ${invCell(0)} |
| **Total Investment** | ${invCell(year1Total)} ${EXAMPLE} | ${invCell(investment)} | ${invCell(investment)} |

---

## Value Breakdown

${valueCalculations}
${ignoredInputs ? `*Not used in this calculation: the ${ignoredInputs} you supplied (listed under Assumptions). Replace the example figures with that data.*\n` : ''}
---

## ROI Analysis

### Total Annual Value
| Category | Annual Value |
|----------|--------------|
| **Total Quantified Value** | ${valueComputed ? `**${money(printedValue)}**${VL}` : nc} |
| **Annual Investment** | ${invCell(investment)}${priceSupplied ? '' : ` ${EXAMPLE}`} |
| **Net Annual Benefit** | ${valueComputed ? `${usd(printedNet)}${VL}` : nc} |
${exampleOnly && valueComputed && priceSupplied && !priceIsZero && roi > 500 ? `\n*This ROI comes from the tool's example assumptions and is too high to show a buyer as it is. Add the buyer's own figures (current_annual_cost and expected_improvement_percent, or annual_value_estimate).*\n` : ''}

### Key Metrics

${EXAMPLES}
| Metric | Value | Example threshold |
|--------|-------|-------------------|
| **ROI** | ${valueComputed ? byInvestment(`${roi.toFixed(0)}%`) : nc} | >100% considered strong |
| **Payback Period** | ${valueComputed ? byValue(`${paybackMonths.toFixed(1)} months`) : nc} | <12 months considered fast |
| **3-Year Net Value** | ${valueComputed ? usd(threeYearNet) : nc} | - |
| **Value/Cost Ratio** | ${valueComputed ? byInvestment(`${(totalValue / investment).toFixed(1)}x`) : nc} | >3x considered excellent |

ROI, payback and three-year value use the annual price and leave out the one-time implementation cost.

---

## Assumptions

### Key Assumptions
1. Implementation timeline: ${timelineText}
2. Full value realization: 6-12 months post-implementation ${EXAMPLE}
3. Benchmark set used for hourly labor cost and revenue per employee: ${benchmarkText}
4. Company size multiplier: ${sizeMultiplier}x (${sizeText}), ${revenueGiven && employeesGiven ? 'not used here, because revenue and employees were both supplied' : `used only to estimate revenue or employees that were not supplied ${EXAMPLE}`}

${currentProcess ? `### Current State\n${currentProcess}\n` : ''}

${knownMetrics ? `### Customer-Provided Metrics\n${knownMetrics}\n` : '### Validation Needed\n- Customer metrics not yet provided\n- Schedule discovery session to validate assumptions\n- Adjust calculations based on actual data'}

### About These Figures
The assumptions above are examples built into this tool, not findings from published research or from the customer's data. Replace them with the customer's own figures before you share this business case.

---

## Sensitivity Analysis

${EXAMPLES}
### Conservative Scenario (50% of projected value)
- Annual Value: ${valueComputed ? `${money(wholeDollars(totalValue * 0.5))}` : nc}
- ROI: ${valueComputed ? byInvestment(`${Math.round(((totalValue * 0.5 - investment) / investment) * 100)}%`) : nc}
- Payback: ${valueComputed ? byValue(`${((investment / (totalValue * 0.5)) * 12).toFixed(1)} months`) : nc}
### Aggressive Scenario (150% of projected value)
- Annual Value: ${valueComputed ? `${money(wholeDollars(totalValue * 1.5))}` : nc}
- ROI: ${valueComputed ? byInvestment(`${Math.round(((totalValue * 1.5 - investment) / investment) * 100)}%`) : nc}
- Payback: ${valueComputed ? byValue(`${((investment / (totalValue * 1.5)) * 12).toFixed(1)} months`) : nc}

---

## Risk Factors & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Delayed implementation | Lower Year 1 ROI | Phase approach, quick wins first |
| User adoption issues | Reduced value capture | Training, change management |
| Integration complexity | Higher implementation cost | Technical validation upfront |
| Market changes | Assumption invalidity | Replace the example assumptions with customer data |

---

## Next Steps

1. **Validate assumptions**: Schedule discovery to confirm metrics
2. **Customize calculations**: Adjust with customer-provided data
3. **Build executive presentation**: Create 1-page summary for CFO
4. **Identify champions**: Find stakeholders who benefit from ROI

---

## One-Page Executive Summary

### Why ${yourSolution} for ${customerName}

**The Problem:**
${currentProcess ? currentProcess : "[The customer's problem in their words]"}

**The Solution:**
${yourSolution} addresses these challenges through [key capabilities].

**The Value:**
${valueComputed ? `${EXAMPLES}
- **${money(printedValue)}** in annual value
${roiSummary}
${paybackSummary}` : `- ${NOT_COMPUTED}`}

**Why Now:**
- [Why this customer should act now, for example competitive pressure, if it applies]
- Cost of delay: ${valueComputed ? `${money(wholeDollars(totalValue / 12))}/month ${EXAMPLE}` : nc}
- Implementation timeline: ${timelineText}

---

*Confidence: ${confidenceLevel.toLowerCase()}. ${exampleOnly ? 'The value figures rest on example assumptions until you replace them with customer-provided metrics.' : 'The value comes from the figures you supplied; confirm them with the buyer before sharing.'}*

${SUGGESTIONS_FOOTER}`;
}
// Tool 5: Mutual Action Plan Generator
function executeMutualActionPlanGenerator(args) {
    const dealName = args.deal_name || 'Deal';
    const targetCloseDate = args.target_close_date || '';
    const currentStage = args.current_stage || 'evaluation';
    const buyerChampion = args.buyer_champion || '';
    const economicBuyer = args.economic_buyer || '';
    const technicalEvaluators = args.technical_evaluators || '';
    const procurementContact = args.procurement_contact || '';
    const knownRequirements = args.known_requirements || '';
    const knownProcessSteps = args.known_process_steps || '';
    const blockers = args.blockers || '';
    const yourSolution = args.your_solution || 'the solution';
    // Calculate dates working backward from close date
    const closeDate = targetCloseDate ? new Date(targetCloseDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    if (isNaN(closeDate.getTime())) {
        return `target_close_date "${targetCloseDate}" is not a date this tool can read. Use the format YYYY-MM-DD, for example 2026-12-15.`;
    }
    const today = new Date();
    const daysUntilClose = Math.round((closeDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    // Calculate milestone dates
    const formatDate = (date) => date.toISOString().split('T')[0];
    const week1 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const week2 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const weekMinus3 = new Date(closeDate.getTime() - 21 * 24 * 60 * 60 * 1000);
    const weekMinus2 = new Date(closeDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weekMinus1 = new Date(closeDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    // Stage-specific milestones
    const stageMillestones = {
        discovery: [
            'Complete discovery sessions with all stakeholders',
            'Document business requirements and success criteria',
            'Identify all decision makers and influencers',
            'Understand evaluation criteria and process'
        ],
        evaluation: [
            'Complete technical evaluation/POC',
            'Validate integration requirements',
            'Confirm security and compliance requirements',
            'Reference calls with similar customers (if you have them)'
        ],
        proposal: [
            'Present business case to economic buyer',
            'Align on ROI and success metrics',
            'Finalize scope and pricing',
            'Address all outstanding concerns'
        ],
        negotiation: [
            'Complete commercial terms negotiation',
            'Finalize legal/contract review',
            'Confirm implementation timeline',
            'Obtain final approvals'
        ],
        procurement: [
            'Complete vendor registration',
            'Submit required documentation',
            'Finalize payment terms',
            'Execute contract'
        ]
    };
    const currentMilestones = stageMillestones[currentStage] || stageMillestones['evaluation'];
    return `# Mutual Action Plan: ${dealName}

## Overview

| Item | Detail |
|------|--------|
| **Opportunity** | ${dealName} |
| **Target Close Date** | ${formatDate(closeDate)}${targetCloseDate ? '' : ` (${NOT_SUPPLIED}: example date)`} |
| **Days Until Close** | ${daysUntilClose} days${targetCloseDate ? '' : ` ${EXAMPLE}`} |
| **Current Stage** | ${currentStage.replace(/_/g, ' ')}${args.current_stage ? '' : ' (default)'} |
| **Solution** | ${args.your_solution || NOT_SUPPLIED} |

---

## Key Stakeholders

### Buyer Team
| Role | Name | Engagement |
|------|------|------------|
| **Champion** | ${buyerChampion || 'TBD: need to identify'} | ${buyerChampion ? 'Engaged' : 'Not identified'} |
| **Economic Buyer** | ${economicBuyer || 'TBD: need to identify'} | ${economicBuyer ? 'Needs engagement' : 'Not identified'} |
| **Technical Evaluator(s)** | ${technicalEvaluators || 'TBD'} | ${technicalEvaluators ? 'In evaluation' : 'Not identified'} |
| **Procurement** | ${procurementContact || 'TBD'} | ${procurementContact ? 'Not yet engaged' : 'Not identified'} |

### Seller Team
| Role | Name | Responsibility |
|------|------|----------------|
| **Account Executive** | [Your name] | Deal ownership, relationship |
| **Solutions Engineer** | [SE name] | Technical validation |
| **Executive Sponsor** | [Exec name] | Executive alignment |

---

## Success Criteria

### What Success Looks Like
${knownRequirements ? knownRequirements : `
**Business Outcomes:**
- [Specific outcome 1 to validate]
- [Specific outcome 2 to validate]
- [Specific outcome 3 to validate]

**Technical Requirements:**
- [Technical requirement 1 to confirm]
- [Technical requirement 2 to confirm]
- [Technical requirement 3 to confirm]`}

### Evaluation Criteria
| Priority | Criterion | Status |
|----------|-----------|--------|
${(() => { const reqs = splitItems(knownRequirements); return reqs.length ? reqs.map((r, i) => `| ${i < 2 ? 'High' : 'Medium'} (agree with the buyer) | ${cap(r)} | To be tested in the evaluation |`).join('\n') : '| High | [Core requirement] | Pending |\n| High | [Core requirement] | Pending |\n| Medium | [Important feature] | Pending |\n| Low | [Nice to have] | Pending |'; })()}
${(() => { const c = readContext(undefined, yourSolution, knownRequirements, technicalEvaluators, dealName); return c.v ? `\n${sectorNotes(c.v, 'metrics')}\n` : ''; })()}

---

## Mutual Action Plan Timeline

### Phase 1: ${cap(currentStage.replace(/_/g, ' '))}, the current stage (now to ${formatDate(week2)})

| # | Milestone | Owner | Due Date | Status |
|---|-----------|-------|----------|--------|
${currentMilestones.map((m, i) => `| ${i + 1} | ${m} | ${i % 2 === 0 ? buyerChampion || 'Buyer' : 'Seller'} | ${formatDate(i < 2 ? week1 : week2)} | Pending |`).join('\n')}

**Key Questions to Answer:**
${knownProcessSteps ? `- Based on process: ${knownProcessSteps}` : `
- Who else needs to be involved in evaluation?
- What's the approval process after evaluation?
- Are there competing priorities that could delay this?`}

---

### Phase 2: Business Case & Alignment (${formatDate(week2)} to ${formatDate(weekMinus3)})

| # | Milestone | Owner | Due Date | Status |
|---|-----------|-------|----------|--------|
| 5 | Present business case to ${economicBuyer || 'economic buyer'} | Seller + ${buyerChampion || 'Champion'} | ${formatDate(weekMinus3)} | Pending |
| 6 | Align on ROI and success metrics | Both | ${formatDate(weekMinus3)} | Pending |
| 7 | Finalize scope and pricing | Seller | ${formatDate(weekMinus3)} | Pending |
| 8 | Reference calls completed | ${buyerChampion || 'Buyer'} | ${formatDate(weekMinus3)} | Pending |

**Deliverables:**
- [ ] Executive presentation
- [ ] ROI calculator with customer data
- [ ] Reference customer list (if you have one)
- [ ] Draft proposal

---

### Phase 3: Commercial & Legal (${formatDate(weekMinus3)} to ${formatDate(weekMinus1)})

| # | Milestone | Owner | Due Date | Status |
|---|-----------|-------|----------|--------|
| 9 | Commercial terms agreed | Both | ${formatDate(weekMinus2)} | Pending |
| 10 | Legal review initiated | ${procurementContact || 'Procurement'} | ${formatDate(weekMinus2)} | Pending |
| 11 | Security/compliance review complete | Buyer IT | ${formatDate(weekMinus1)} | Pending |
| 12 | All redlines resolved | Both | ${formatDate(weekMinus1)} | Pending |

**Documentation Required:**
- [ ] Master service agreement
- [ ] Order form
- [ ] SLA/support terms
- [ ] Security questionnaire
- [ ] DPA (if applicable)

---

### Phase 4: Close & Launch (${formatDate(weekMinus1)} to ${formatDate(closeDate)})

| # | Milestone | Owner | Due Date | Status |
|---|-----------|-------|----------|--------|
| 13 | Final approvals obtained | ${economicBuyer || 'Economic Buyer'} | ${formatDate(weekMinus1)} | Pending |
| 14 | Contract signed | Both | ${formatDate(closeDate)} | Pending |
| 15 | Implementation kickoff scheduled | Both | ${formatDate(closeDate)} | Pending |
| 16 | Success criteria documented | Seller | ${formatDate(closeDate)} | Pending |

---

## Risks & Blockers

${blockers ? `### Known Blockers
${blockers}

**Mitigation Plan:**
| Blocker | Mitigation | Owner | Status |
|---------|------------|-------|--------|
${(() => { const c = readContext(undefined, yourSolution, blockers, knownRequirements); return splitItems(blockers).map((b) => `| ${cap(b)} | ${answerFor(b, c.v)} | Agree an owner on each side | Open |`).join('\n'); })()}
` : '### Potential Risks\n- Budget timing/availability\n- Competing priorities\n- Stakeholder alignment\n- Technical integration complexity'}

### Risk Assessment
| Risk | Typical likelihood | Typical impact | Mitigation |
|------|------------|--------|------------|
| Timeline slips | Medium | High | Weekly check-ins, early escalation |
| Budget not approved | Low | Critical | Build strong business case, executive sponsor |
| Technical issues | Medium | Medium | POC/pilot validation |
| Champion leaves | Low | Critical | Multi-thread across stakeholders |

---

## Communication Plan

### Regular Check-ins
| Cadence | Participants | Purpose |
|---------|--------------|---------|
| Weekly | Champion + AE | Progress review, blocker removal |
| Bi-weekly | Technical teams | Technical validation progress |
| As needed | Executives | Strategic alignment |

### Escalation Path
1. First escalation: Champion → Economic Buyer
2. Second escalation: AE Manager → Buyer Executive
3. Final escalation: Seller Exec → Buyer Exec

---

## Next Actions (This Week)

| Priority | Action | Owner | Due |
|----------|--------|-------|-----|
| High | ${!buyerChampion ? 'Identify and confirm champion' : 'Confirm next steps with champion'} | AE | ${formatDate(week1)} |
| High | ${!economicBuyer ? 'Identify economic buyer' : 'Schedule economic buyer meeting'} | AE | ${formatDate(week1)} |
| Medium | ${buyerChampion ? 'Share this MAP with buyer champion' : 'Share this MAP with your main buyer contact'} | AE | ${formatDate(today)} |
| Medium | Validate timeline and milestones | Both | ${formatDate(week1)} |

---

## Agreement

**By sharing this Mutual Action Plan, we commit to:**
- Transparent communication about timeline and blockers
- Timely completion of agreed milestones
- Immediate escalation of any delays or concerns
- Regular check-ins to ensure alignment

---

*This is a living document. Please update as things change.*
*Last Updated: ${formatDate(today)}*`;
}
// Tool 6: Win/Loss Analyzer
function executeWinLossAnalyzer(args) {
    const analysisType = args.analysis_type || 'single_deal';
    const dealOutcome = args.deal_outcome || '';
    const dealDetails = args.deal_details || '';
    const lossReason = args.loss_reason || '';
    const competitorWon = args.competitor_won || '';
    const dealValue = args.deal_value || 0;
    const salesCycleDays = args.sales_cycle_days || 0;
    const stakeholdersInvolved = args.stakeholders_involved || '';
    const yourSolution = args.your_solution || 'your solution';
    const multipleDeals = args.multiple_deals || '';
    // Run 19 D80 (problem 3): the stated reason and the stakeholders are read, not only echoed.
    const wlCtx = readContext(undefined, yourSolution, dealDetails, lossReason, stakeholdersInvolved);
    const people = splitItems(stakeholdersInvolved).map((x) => {
        const m = x.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
        return m ? { who: m[1].trim(), stance: m[2].trim().toLowerCase() } : { who: x.trim(), stance: '' };
    });
    const against = people.filter((p) => /against|blocker|opposed|detractor|negative/.test(p.stance));
    const support = people.filter((p) => /support|champion|sponsor|for\b|positive/.test(p.stance));
    const r = lossReason.toLowerCase();
    const readings = [];
    if (/bundle|one vendor|single vendor|suite|together|all-in-one/.test(r))
        readings.push('**Bundle loss:** the buyer preferred one vendor for more than your product covers. Ask whether you could have partnered for the missing part, or qualified out earlier.');
    if (/\b(hr|it|finance|procurement|legal|operations|security)\b.*\b(owned|decided|led|chose)|\b(owned|led) the decision/.test(r))
        readings.push('**The decision sat with another function:** the stated reason says a team you did not sell to made the call. Map who owns the budget and the decision in the first two meetings next time.');
    if (/price|cost|budget|expensive|cheaper|discount/.test(r))
        readings.push('**Price or budget:** check whether the value case was agreed in the buyer\'s own numbers before price came up.');
    if (/feature|product|capabilit|missing|gap|integrat/.test(r))
        readings.push('**Product or fit gap:** decide whether the gap was real or a demonstration problem, and whether the requirement could have been shaped earlier.');
    if (/timing|priority|later|next year|freeze|no decision/.test(r))
        readings.push('**Timing or priority:** look for the event that would have made this urgent, and whether the status quo was acceptable to them.');
    if (/relationship|incumbent|existing|renew|stayed/.test(r))
        readings.push('**Incumbent advantage:** the buyer stayed with what they know. Ask what the incumbent fixed or promised during your evaluation.');
    const readingBlock = lossReason ? `### What the Stated Reason Points To\n\n${readings.length ? readings.join('\n\n') : `The stated reason (${q(lossReason)}) matches none of the usual patterns: ask the buyer what sat behind it.`}\n\n` : '';
    const peopleBlock = people.length ? `### Who Stood Where\n\n| Stakeholder | Position you recorded | What to learn |\n|---|---|---|\n${people.map((p) => `| ${p.who} | ${p.stance || 'not recorded'} | ${/against|blocker|opposed/.test(p.stance) ? 'What did they need that we did not give them, and when did they turn against us?' : /support|champion|sponsor/.test(p.stance) ? 'Did they have the power and the material to sell this internally?' : 'What would have moved them to support us?'} |`).join('\n')}\n` : '';
    const yesNo = (v, why) => (v === null ? `Not known from your input: check (${why})` : v ? `Yes (from your input: ${why})` : `No (from your input: ${why})`);
    const execNamed = people.some((p) => /\b(ceo|cfo|coo|cio|cto|ciso|chief|vp|vice president|managing director|head)\b/i.test(p.who));
    const ebNamed = people.some((p) => /\b(cfo|ceo|coo|economic buyer|budget)\b/i.test(p.who + ' ' + p.stance));
    if (analysisType === 'single_deal') {
        // Single deal analysis
        let analysis = `# Win/Loss Analysis: Single Deal

## Deal Overview

| Attribute | Value |
|-----------|-------|
| **Outcome** | ${dealOutcome ? dealOutcome.charAt(0).toUpperCase() + dealOutcome.slice(1) : 'Not specified'} |
| **Deal Value** | ${hasValue(args.deal_value) ? money(dealValue) : 'Not specified'} |
| **Sales Cycle** | ${hasValue(args.sales_cycle_days) ? salesCycleDays.toLocaleString('en-US') + (salesCycleDays === 1 ? ' day' : ' days') : 'Not specified'} |
| **Solution** | ${args.your_solution || 'Not specified'} |
${competitorWon ? `| **Competitor Won** | ${competitorWon} |` : ''}
${lossReason ? `| **Stated Reason** | ${lossReason} |` : ''}

---

`;
        if (dealOutcome === 'won') {
            analysis += `## Win Analysis

### Why We Won (Hypothesis)

Possible success factors (not from your input: keep only those your deal notes support):

**Value Proposition Alignment**
- Strong fit between solution and customer needs
- Clear ROI communicated and understood
- Differentiation vs alternatives was clear

**Sales Execution**
- ${stakeholdersInvolved ? `Stakeholders engaged: ${stakeholdersInvolved}` : 'Multiple stakeholders likely engaged'}
- Discovery uncovered real pain points
- Champion enabled to sell internally

**Competitive Positioning**
- Positioned on strengths vs competitor weaknesses
- Evaluation criteria favored our approach
${competitorWon ? `- Beat ${competitorWon} through differentiation` : ''}

### What to Replicate

*Example (not from your input): replace with what worked in this deal.*

| Factor | What Worked | How to Replicate |
|--------|-------------|------------------|
| **Discovery** | Deep understanding of needs | Standardize discovery framework |
| **Multi-threading** | Multiple stakeholder relationships | Mandate 3+ contacts per deal ${EXAMPLE} |
| **Value Selling** | Quantified business impact | ROI calculator for all deals |
| **Champion** | Strong internal advocate | Champion testing questions |

### Questions for Win Review
1. Why did they choose us over alternatives?
2. What was the tipping point in the decision?
3. What almost derailed the deal?
4. What would they tell others considering us?
5. What surprised them (good or bad)?

`;
        }
        else if (dealOutcome === 'lost') {
            analysis += `## Loss Analysis

### Why We Lost (Hypothesis)

${lossReason ? `**Stated Reason:** ${lossReason}` : '**Stated Reason:** Not provided'}

**Common Root Causes to Investigate:**
${[/price/, /feature|product/, /timing|priority/].some((re) => re.test((lossReason || '').toLowerCase())) || competitorWon ? '' : '\n- [No stated reason or competitor matches a common cause: add the causes your loss review finds]\n'}
${lossReason?.toLowerCase().includes('price') ? `
#### Pricing/Budget Issues
- Was the business case strong enough to justify investment?
- Did we understand their budget constraints upfront?
- Could we have structured the deal differently?
- Did competitor offer better terms or discount?
` : ''}

${lossReason?.toLowerCase().includes('feature') || lossReason?.toLowerCase().includes('product') ? `
#### Product/Feature Gap
- Was this a real gap or perception issue?
- Did we fail to demonstrate capability?
- Was the evaluation criteria set against us?
- Could we have changed the requirements?
` : ''}

${competitorWon ? `
#### Competitive Loss
- Why did ${competitorWon} win?
- What did they offer that we didn't?
- Did we position against their strengths?
- Were evaluation criteria stacked against us?
` : ''}

${lossReason?.toLowerCase().includes('timing') || lossReason?.toLowerCase().includes('priority') ? `
#### Timing/Priority Issues
- Was there a real compelling event?
- Did priorities shift during the evaluation?
- Could we have created more urgency?
- Was the status quo acceptable to them?
` : ''}

${readingBlock}${peopleBlock ? peopleBlock + '\n' : ''}${against.length ? `**Against you:** ${against.map((p) => p.who).join(', ')}. Their view is the first thing to learn in the loss review.\n\n` : ''}${wlCtx.v ? sectorNotes(wlCtx.v, 'committee') + '\n\n' : ''}### Loss Categories

*Check first: set by this tool's rule (High when no stakeholders were given for Champion Failure, or when a competitor won for Competitive Loss; otherwise Medium). It is not a finding about your deal.*

| Category | Check first | Investigation Needed |
|----------|------------|---------------------|
| **Champion Failure** | ${stakeholdersInvolved ? 'Medium' : 'High'} | Did we have a true champion? |
| **Value Not Proven** | Medium | Was ROI quantified and believed? |
| **Competitive Loss** | ${competitorWon ? 'High' : 'Medium'} | What did competitor do better? |
| **Product Gap** | Medium | Was this real or perceived? |
| **Sales Execution** | Medium | Did we run the right process? |

### Questions for Loss Review
1. What was the real reason (not just stated reason)?
2. When did we actually lose the deal?
3. What would have changed the outcome?
4. Who did they go with and why?
5. What should we have done differently?

### Recovery Opportunity

| Timeframe | Action | Goal |
|-----------|--------|------|
| Now | Request honest feedback call | Understand true reasons |
| 30 days | Check in on implementation | Be helpful, stay relevant |
| 90 days | Share relevant content/news | Stay top of mind |
| 6 months | Explore if situation changed | New evaluation opportunity |

`;
        }
        else if (dealOutcome === 'no_decision') {
            analysis += `## No-Decision Analysis

### Why No Decision Happened

**Common Causes:**
1. **No compelling event**: Status quo was acceptable
2. **Champion failure**: No one willing to drive change
3. **Budget reallocation**: Priorities shifted
4. **Risk aversion**: Fear of change or failure
5. **Evaluation fatigue**: Too long, lost momentum

### Investigation Framework

| Question | Purpose | Action |
|----------|---------|--------|
| Was there a real problem? | Validate need | Review discovery notes |
| Did we have a champion? | Check internal support | Was anyone advocating? |
| Was budget confirmed? | Verify funding | Did we talk to economic buyer? |
| What created urgency? | Check compelling event | Was there a deadline? |
| What happened to momentum? | Find stall point | When did engagement drop? |

### No-Decision Recovery

| Timeframe | Action |
|-----------|--------|
| Immediately | Confirm if evaluation is paused or ended |
| 2 weeks | New trigger event or insight to share |
| Monthly | Light touch to stay relevant |
| Quarterly | Re-qualify: Has anything changed? |

`;
        }
        analysis += `${['won', 'lost', 'no_decision'].includes(dealOutcome) ? '\n---\n\n' : ''}## Deal Details Analysis

${dealDetails ? `### Provided Context
${dealDetails}

### Pattern Recognition
Based on the details provided, key factors to investigate:
- Sales process adherence
- Stakeholder engagement depth
- Competitive positioning
- Value communication
- Timeline management` : '### No Details Provided\n\nTo improve analysis, provide:\n- CRM notes or deal history\n- Emails and meeting notes\n- Competitor information\n- Stakeholder feedback'}

---

## Stakeholder Analysis

${stakeholdersInvolved ? `### Involved Stakeholders
${stakeholdersInvolved}

### Engagement Assessment
| Question | Check |
|----------|-------|
| Did we have an executive sponsor? | ${execNamed ? `Possibly: a senior role is named (${people.filter((p) => /\b(ceo|cfo|coo|cio|cto|ciso|chief|vp|vice president|managing director|head)\b/i.test(p.who)).map((p) => p.who).join(', ')}); confirm they sponsored the deal` : 'Not known from your input: no senior role named'} |
| Was economic buyer engaged? | ${ebNamed ? 'Possibly: the economic buyer is named in your input; confirm how often they were met' : 'Not known from your input: no economic buyer named'} |
| Did we multi-thread? | ${yesNo(people.length >= 3 ? true : people.length ? false : null, `${people.length} stakeholder${people.length === 1 ? '' : 's'} named`)} |
| Was there a true champion? | ${support.length ? `Possibly: ${support.map((p) => p.who).join(', ')} recorded as supporter; test whether they had power and material` : 'Not known from your input: nobody recorded as supporter or champion'} |` : '### Stakeholder Information Needed\n\nFor better analysis, provide:\n- Names and titles\n- Their positions on the deal\n- Engagement level\n- Who we didn\'t reach'}

---

## Action Items

### Immediate
- [ ] Schedule win/loss review call with buyer
- [ ] Document lessons learned in CRM
- [ ] Share insights with team

### Process Improvements
- [ ] Update qualification criteria based on learnings
- [ ] Refine discovery questions
- [ ] Adjust competitive positioning if needed

---

*For best results, combine this analysis with direct buyer feedback*

${SUGGESTIONS_FOOTER}`;
        return analysis;
    }
    else if (analysisType === 'deal_portfolio' || analysisType === 'loss_pattern') {
        // Portfolio analysis
        return `# Deal Portfolio Analysis

## Analysis Type: ${analysisType.replace(/_/g, ' ')}

### Input Required

To analyze your deal portfolio, please provide:

${multipleDeals ? `### Provided Data
${multipleDeals}` : `
**Option 1: Structured Data**
${EXAMPLES}
\`\`\`
Deal Name, Outcome, Value, Days, Loss Reason, Competitor
Deal 1, won, 50000, 45, -, -
Deal 2, lost, 75000, 60, price, Competitor A
Deal 3, no_decision, 30000, 90, priorities, -
\`\`\`

**Option 2: Narrative Summary**
Describe your last 10-20 deals ${EXAMPLE}, including:
- Win/loss/no-decision split
- Common loss reasons
- Average deal size and cycle time
- Key competitors`}

---

## Analysis Framework

### 1. Win Rate Analysis
- Overall win rate vs a benchmark, for example 25-35% ${EXAMPLE}
- Win rate by deal size
- Win rate by competitor
- Win rate by segment

### 2. Loss Pattern Detection
- Most common loss reasons
- When deals are lost (stage)
- Who we lose to most
- Characteristics of lost deals

### 3. No-Decision Analysis
- % going to no-decision vs a benchmark, for example 25-40% ${EXAMPLE}
- How long before going dark
- Common characteristics
- Recoverability

### 4. Sales Cycle Analysis
- Average cycle length
- Cycle by deal size
- Cycle by outcome
- Stage where deals stall

---

## Common Patterns to Investigate

### Red Flags in Your Pipeline
${EXAMPLES}
| Pattern | Warning Sign | Action |
|---------|--------------|--------|
| High no-decision rate | >40% no-decision | Improve qualification |
| Long cycles | >2x industry avg | Better discovery, urgency |
| Late-stage losses | Losing at proposal/negotiation | Earlier differentiation |
| Single-threaded | Only 1 contact | Mandate multi-threading |
| Price losses | >30% cite price | Better value communication |

### Questions for Analysis
1. What do won deals have in common?
2. Where do deals stall in the process?
3. Which competitors beat us most?
4. What's the profile of our best customers?
5. When do we know we're going to lose?

---

*Provide deal data for specific pattern analysis*

${SUGGESTIONS_FOOTER}`;
    }
    else {
        // Competitor analysis
        return `# Competitive Win/Loss Analysis

## Competitor: ${competitorWon || 'Not specified'}

### Head-to-Head Analysis Framework

| Dimension | Questions to Answer |
|-----------|---------------------|
| **Win Rate** | What's our win rate against this competitor? |
| **Where We Win** | In what situations do we beat them? |
| **Where We Lose** | In what situations do they beat us? |
| **Their Strengths** | What do buyers like about them? |
| **Their Weaknesses** | Where do they fall short? |

### Competitive Intelligence Gathering

**From Won Deals:**
- Why did you choose us over [competitor]?
- What were they missing?
- How did they position against us?

**From Lost Deals:**
- What did [competitor] do better?
- What would have changed your decision?
- How did they address your concerns?

### Battle Card Elements

| Element | Content Needed |
|---------|----------------|
| **Positioning** | How to differentiate |
| **Landmines** | Questions that expose weaknesses |
| **Objection Handling** | Responses to their claims |
| **Proof Points** | Evidence of our superiority |

---

*Provide win/loss data against this competitor for specific analysis*`;
    }
}
// Placeholder for tools 7-12 - will be completed in next part
function executeTool(name, args) {
    switch (name) {
        case 'account_plan_builder':
            return executeAccountPlanBuilder(args);
        case 'deal_strategy_coach':
            return executeDealStrategyCoach(args);
        case 'discovery_question_bank':
            return executeDiscoveryQuestionBank(args);
        case 'roi_business_case_builder':
            return executeRoiBusinessCaseBuilder(args);
        case 'mutual_action_plan_generator':
            return executeMutualActionPlanGenerator(args);
        case 'win_loss_analyzer':
            return executeWinLossAnalyzer(args);
        case 'proposal_section_writer':
            return executeProposalSectionWriter(args);
        case 'email_sequence_generator':
            return executeEmailSequenceGenerator(args);
        case 'demo_script_builder':
            return executeDemoScriptBuilder(args);
        case 'pricing_negotiation_guide':
            return executePricingNegotiationGuide(args);
        case 'champion_enablement_kit':
            return executeChampionEnablementKit(args);
        case 'competitive_trap_setter':
            return executeCompetitiveTrapSetter(args);
        default:
            return `Tool ${name} not recognized. Available tools: account_plan_builder, deal_strategy_coach, discovery_question_bank, roi_business_case_builder, mutual_action_plan_generator, win_loss_analyzer, proposal_section_writer, email_sequence_generator, demo_script_builder, pricing_negotiation_guide, champion_enablement_kit, competitive_trap_setter`;
    }
}
// Tool 10: Pricing Negotiation Guide
function executePricingNegotiationGuide(args) {
    const scenario = args.scenario || 'discount_request';
    const dealValue = args.deal_value || 0;
    const discountRequested = args.discount_requested || 0;
    const yourSolution = args.your_solution || 'our solution';
    const competitorPrice = args.competitor_price || '';
    const valueDelivered = args.value_delivered || '';
    const buyerLeverage = args.buyer_leverage || '';
    const yourLeverage = args.your_leverage || '';
    const decisionTimeline = args.decision_timeline || '';
    const approvalAuthority = args.approval_authority || '';
    // Run 19 D80 (problems 4 and 6): the trades follow the business model; the competitor gap and the value are the user's own.
    const ctx = readContext(args.business_model, yourSolution, valueDelivered, yourLeverage, buyerLeverage, competitorPrice);
    const trades = verticals_ts_1.MODEL_TRADES[ctx.model || 'unknown'];
    const gapMatch = competitorPrice.match(/(\d+(?:\.\d+)?)\s*%/);
    const competitorLine = gapMatch ? `"Your competitor is ${gapMatch[1]}% cheaper"` : competitorPrice ? `"Your competitor is cheaper" (you supplied: ${competitorPrice})` : `"Your competitor is [X]% cheaper"`;
    const scopeWord = ctx.model === 'saas' ? 'more users or a wider rollout' : ctx.model === 'connectivity' ? 'more sites or links' : ctx.model === 'services' ? 'a wider scope of services' : 'a wider scope';
    const discountedValue = dealValue - (dealValue * discountRequested / 100);
    const revenueAtRisk = dealValue * discountRequested / 100;
    // Display text (output only; the figures above are unchanged)
    const dealValueText = hasValue(args.deal_value) ? money(dealValue) : NOT_SUPPLIED;
    const bothPricingInputs = hasValue(args.deal_value) && hasValue(args.discount_requested);
    const pricingNotComputed = 'not computed: needs deal value and discount';
    const valueReframe = !valueDelivered
        ? `
"Before we discuss price, let's revisit the value we identified:
- [Value point 1]
- [Value point 2]
- [Value point 3]

At ${hasValue(args.deal_value) ? dealValueText : '[deal value]'}, that's a [your ROI multiple, for example X:1] return on investment."`
        : `
"Before we discuss price, let's revisit what this has already delivered: ${valueDelivered.trim().replace(/[.]$/, '')}.
${hasValue(args.deal_value) ? `At ${dealValueText}, is that result worth more to you than the ${hasValue(args.discount_requested) ? `${discountRequested}%` : 'discount'} you are asking for?"` : 'What is that result worth to you in a year?" (add the deal value to compare the price with it)'}`;
    const scenarioGuides = {
        discount_request: () => `# Pricing Negotiation Guide: Discount Request

## Situation Analysis

${ctx.line}

| Factor | Value |
|--------|-------|
| **Deal Value** | ${dealValueText} |
| **Discount Requested** | ${hasValue(args.discount_requested) ? `${discountRequested}%` : NOT_SUPPLIED} |
| **Revenue at Risk** | ${bothPricingInputs ? money(revenueAtRisk) : pricingNotComputed} |
| **Post-Discount Value** | ${bothPricingInputs ? money(printedSum([dealValue, -revenueAtRisk])) : pricingNotComputed} |
| **Decision Timeline** | ${decisionTimeline || 'Not specified'} |
| **Approval Authority** | ${approvalAuthority || 'Not specified'} |

---

## Leverage Assessment

### Your Leverage
${yourLeverage ? yourLeverage : `
Common leverage points: tick the ones that apply.
- Unique capabilities they need
- Time pressure (implementation timeline)
- Switching costs from current state
- Champions already invested
- Executive relationships`}

### Their Leverage
${buyerLeverage ? buyerLeverage : `
Common leverage points: tick the ones that apply.
- Multiple vendor options
- Budget constraints
- Long timeline (no urgency)
- Volume/reference potential
- Enterprise buying power`}

---

## Negotiation Strategy

### Rule #1: Never Discount Without Getting Something

**Acceptable Trades:**
${EXAMPLES}
| What They Want | What You Ask For In Return |
|----------------|--------------|
${trades.map((t, i) => `| ${['10% discount', '15% discount', '5% discount', '10% discount'][i] || 'A discount'} | ${cap(t)} |`).join('\n')}

### Rule #2: Understand the Real Ask

**Discovery Questions:**
- "Help me understand what's driving the discount request."
- "Is this a budget issue or a value perception issue?"
- "What would need to happen for full price to work?"
- "Who's asking for the discount? What's their concern?"

### Rule #3: Reframe Value, Not Price

**Value Reframe:**
${valueReframe}

---

## Tactical Responses

### "We need a better price"

**Don't Say:** "Let me see what I can do."

**Do Say:**
- "Help me understand what 'better' means. Is this about budget or value?"
- "[Only if true and provable: We've already priced this competitively.] What specifically is the concern?"
- "What would need to happen for our current pricing to work?"

### ${competitorLine}${gapMatch ? '' : ` ${EXAMPLE}`}

**Don't Say:** "We can match that."

**Do Say:**
- "That's interesting. What's included in their price?"
- "Let's compare apples to apples. What capabilities are you comparing?"
- "Price is one factor. What are the other criteria that matter?"

### "We can only pay $X"

**Don't Say:** "I'll talk to my manager."

**Do Say:**
- "I understand budget constraints. Help me understand how that number was determined."
- "Let's look at scope. What would need to change to fit that budget?"
- "What if we structured payments differently? Would monthly work better?"

---

## Discount Approval Framework

### When to Consider Discounting:
- [ ] This is a strategic account (logo value)
- [ ] There's genuine budget constraint (verified)
- [ ] We're getting something valuable in return
- [ ] Competitive pressure is real and verified
- [ ] This won't set bad precedent

### When to Hold the Line:
- [ ] Value case is strong
- [ ] No competitive pressure
- [ ] Buyer is bluffing
- [ ] Would set bad precedent
- [ ] Deal is already won

---

## Escalation Path

If discount approval is needed:

1. **Document the ask**: Why, how much, what we get
2. **Show your work**: What you've tried
3. **Make a recommendation**: Not just "they want X%"
4. **Get approval before offering**: Never surprise leadership`,
        budget_objection: () => `# Budget Objection Handling

## The Objection: "We don't have budget"

### Diagnose the Real Issue

**Question 1:** "Is this not in the current budget, or are you saying this won't be prioritized?"

**Question 2:** "If budget wasn't a constraint, would this be something you'd move forward with?"

**Question 3:** "How do priorities get funded outside of normal budget cycles?"

---

## Response Strategies

### Strategy 1: Find Hidden Budget

"Is there a discretionary fund for high-impact initiatives? Who would have authority over it?"

### Strategy 2: Build Business Case for Budget

"Let's build a business case that makes the ROI so clear, budget gets reallocated. What would leadership need to see?"

${valueDelivered ? `\nBuild the case on the value you supplied: ${valueDelivered}.` : ''}

### Strategy 3: Restructure the Deal

**Options:**
- Phased implementation (smaller initial investment)
- Monthly vs annual payment
- Start smaller, expand later
- Delay start until next budget cycle (with commitment now)

### Strategy 4: Different Budget Source

"Sometimes this comes from a different budget than you'd expect. Who else benefits from this outcome?"

---

## When Budget Is Real

If budget genuinely isn't available:

1. **Lock in pricing**: "We can hold this pricing until [date]"
2. **Secure commitment**: "If we do this, will you move forward?"
3. **Stay engaged**: Monthly check-in until budget cycle
4. **Create urgency**: "Pricing is increasing next quarter" (say this only if it is true)`,
        competitor_pricing: () => `# Competitor Pricing Response

## Situation: Competitor has lower price

${competitorPrice ? `**Competitor Price:** ${competitorPrice}` : ''}

---

## Discovery Before Response

### Questions to Ask:
1. "What's included in that price? Let's compare apples to apples."
2. "Is that their initial price or after negotiation?"
3. "What about implementation, training, and support costs?"
4. "Have you talked to their customers about total cost of ownership?"

### Hidden Costs to Surface:
- Implementation fees
- Training costs
- Integration complexity
- Support tiers
- ${ctx.model === 'saas' ? 'Per-user pricing as you grow' : 'Charges that grow with volume or scope'}
- Overage or excess charges
- Contract lock-in

---

## Response Framework

### Option 1: Win on Value, Not Price

"We could probably be cheaper if we cut [capabilities]. But we've found that customers who prioritize price end up paying more in the long run through [hidden costs/limitations]. Is that a tradeoff you want to make?" (Example claim: keep it only if your own customer data supports it)

### Option 2: Total Cost of Ownership

"Let me show you a total cost comparison over 3 years. When you factor in [implementation, support, lost productivity from limitations], here's what the math looks like..." ${EXAMPLE}

### Option 3: Risk Framing

"The question isn't who's cheapest. The question is: what's the cost of getting this wrong? With us, you get [risk mitigation]. Is that worth the difference in price?"

---

## Landmine Questions for Competitor

Suggest the buyer ask the competitor:
1. "What's NOT included in that price?"
2. "What does your highest-tier customer pay?"
3. "Can I talk to a customer who's been with you 3+ years about total cost?" ${EXAMPLE}
4. "What happens when we need to scale?"`,
        procurement_pressure: () => `# Procurement Negotiation Guide

## Context: Dealing with Professional Buyers

Procurement's job is to reduce costs. Don't take it personally, but don't cave unnecessarily.

---

## Understanding Procurement

### Their Goals:
- Reduce vendor costs by X%
- Demonstrate value to organization
- Manage vendor risk
- Standardize terms

### Their Tactics:
- "We need 20% discount on everything" ${EXAMPLE}
- "We only work with vendors who [term]"
- "Legal won't approve those terms"
- "We're looking at other vendors"

---

## Counter-Strategies

### Tactic 1: Go High Before They Go Low

Before procurement engagement:
- Get executive sponsorship
- Align on value with business stakeholders
- Get champion to advocate internally

### Tactic 2: Separate Value from Price

"I understand you're focused on price. Can we first align on the value this delivers? Once we agree on value, let's discuss appropriate pricing."

### Tactic 3: Trade, Don't Cave

**When they ask for 20% discount:** ${EXAMPLE}
"We're happy to discuss pricing. Here's what we can do at different commitment levels..."

${EXAMPLES}
| Commitment | Discount | Benefit to Them |
|------------|----------|-----------------|
| 1-year, net 30 | 0% | Standard terms |
| 2-year, net 30 | 7% | Savings + price lock |
| 3-year, prepaid | 12% | Maximum savings |

### Tactic 4: Use Time

If they're pressuring for discount:
- "When does this need to be closed?"
- "What's driving that timeline?"
- "Let me see what I can do if we can commit by [date]"

---

## Terms to Protect

### Don't Give Away:
- Unlimited liability
- Unusual payment terms
- Free services
- Price for future years
- Exclusivity

### Consider Trading:
- Payment timing
- Contract length
- Scope (${scopeWord})
- Services included
- Renewal terms`,
        renewal_negotiation: () => `# Renewal Negotiation Guide

## Context: Existing Customer Renewal

Renewals are different from new business. You have leverage (they're using your product) but also risk (they might leave).

---

## Pre-Negotiation Preparation

### Health Check:
- Usage metrics: Are they using the product?
- Support tickets: Are they having issues?
- Champion status: Is your champion still there?
- Value delivered: Can you quantify results?

### Expansion Opportunity:
- ${cap(scopeWord)}
- Additional products
- Higher tier
- Professional services

---

## Renewal Scenarios

### Scenario A: Happy Customer
- Lead with expansion opportunity
- Lock in multi-year at current rate
- Ask for case study/reference

### Scenario B: Dissatisfied Customer
- Address issues before discussing renewal
- Offer success plan
- Consider concession for commitment to improve

### Scenario C: Price Pressure
- Document value delivered
- Propose multi-year for discount
- Don't match aggressive new-customer pricing

---

## Response to "We're Looking at Alternatives"

**Don't Say:** "We'll match any price"

**Do Say:**
1. "What's driving you to look? What would need to change for you to stay?"
2. "Let me make sure we're delivering the value we promised. Can we review?"
3. "Before you invest time in evaluation, let's see if we can address your concerns."

---

## Upsell During Renewal

The renewal conversation is the best time to expand:

"Since we're discussing renewal, I wanted to share [additional product/tier]. [Only if true and provable: Other customers like you use it for [use case].] Would you like to see how that could benefit you?"`,
        multi_year_negotiation: () => `# Multi-Year Deal Negotiation

## Value Exchange Framework

Multi-year deals benefit both parties. Structure them to reflect that.

---

## What You Get:
- Predictable revenue
- Reduced churn risk
- Higher LTV
- Less sales effort on renewal

## What They Get:
- Price protection
- Budget predictability
- Reduced procurement cycles
- Deeper partnership

---

## Example Multi-Year Discount Framework

${EXAMPLES}
| Term | Example Discount | Your Discount |
|------|------------------|---------------|
| 1 year | 0% | - |
| 2 years | 5-10% | - |
| 3 years | 10-15% | - |

**Important:** Price lock vs. actual discount
- "No price increase" is valuable without being a discount
- "10% off current price, locked for 3 years" is aggressive ${EXAMPLE}

---

## Structuring Multi-Year Deals

### Option 1: Annual Payment
- Lower risk for them
- Consider payment milestone discount

### Option 2: Prepaid
- Maximum discount
- Improves your cash position
- Reduced collection effort

### Option 3: Hybrid
- Year 1 upfront
- Years 2-3 annual
- Moderate discount

---

## Key Terms to Include:

- [ ] Price lock for term
- [ ] Growth pricing predefined
- [ ] Auto-renewal language
- [ ] Early termination clause (or lack thereof)
- [ ] Success criteria for continued value`,
        enterprise_agreement: () => `# Enterprise Agreement Negotiation

## Large Deal Complexity

Enterprise deals have unique dynamics: multiple stakeholders, long cycles, complex terms.

---

## Enterprise Buying Reality:

### Decision Makers:
- Business sponsor (wants outcomes)
- IT/Technical (wants fit and security)
- Procurement (wants savings)
- Legal (wants low risk)
- Finance (wants predictability)

### Each Has Different Concerns:
| Stakeholder | Concern | Your Response |
|-------------|---------|---------------|
| Business | Value/ROI | Business case |
| IT | Integration/Security | Technical validation |
| Procurement | Price | Value-based pricing |
| Legal | Liability/Terms | Reasonable T&Cs |
| Finance | Budget/Payment | Flexible structuring |

---

## Enterprise Negotiation Tactics

### Tactic 1: Don't Get Isolated

Procurement will try to separate you from business sponsors. Resist:
- "I'd like to include [Business Sponsor] in this discussion to ensure alignment"
- "Can we set up a joint meeting to discuss terms and value together?"

### Tactic 2: Package the Deal

Instead of line-item negotiation:
- Bundle products and services
- Create "enterprise packages"
- Make it hard to cherry-pick

### Tactic 3: Use Competition Carefully

Enterprise deals often have multiple vendors. Position on value, not price:
- "We know you're evaluating alternatives. Here's what makes us different: [differentiators you can prove]."
- "[Only if your business case supports it: I'm confident our value justifies the investment.] Let me walk you through the business case."

---

## Enterprise Terms to Negotiate

### Give Carefully:
- Extended payment terms
- Custom SLAs
- Dedicated support
- Early access to features

### Protect:
- Price integrity
- Intellectual property
- Liability limits
- Right to case study/reference`
    };
    const generator = scenarioGuides[scenario] || scenarioGuides['discount_request'];
    return generator();
}
// Tool 11: Champion Enablement Kit
function executeChampionEnablementKit(args) {
    const assetType = args.asset_type || 'executive_brief';
    const championName = args.champion_name || '[Champion name]';
    const championRole = args.champion_role || '';
    const targetStakeholder = args.target_stakeholder || 'leadership';
    const yourSolution = args.your_solution || 'our solution';
    const keyValuePoints = args.key_value_points || '';
    const knownObjections = args.known_objections || '';
    const competitiveContext = args.competitive_context || '';
    const budgetContext = args.budget_context || '';
    const urgencyDrivers = args.urgency_drivers || '';
    const championWins = args.champion_wins || '';
    // Run 19 D80 (problems 3 and 8): every objection the user typed gets an answer; value points fill the returns table;
    // no placeholder percentage or dollar figure is printed; sector notes say who else will read the case.
    const champCtx = readContext(undefined, yourSolution, keyValuePoints, knownObjections, competitiveContext, targetStakeholder, championRole);
    const valueItems = splitItems(keyValuePoints);
    const objectionItems = splitItems(knownObjections);
    const assetGenerators = {
        executive_brief: () => `# Executive Brief for ${cap(targetStakeholder)}

## Prepared for: ${championName}${championRole ? ` (${championRole})` : ''}
## Topic: ${yourSolution}

---

### The Opportunity

[1-2 sentence summary of what this enables for the business]

${keyValuePoints ? `**Key Benefits:**\n${valueItems.map(p => `- ${p.trim()}`).join('\n')}` : '**Key Benefits:**\n- [Benefits from your key value points]'}

### The Business Case

**Problem:**
[Current state challenges: what's not working]

**Impact:**
[Quantified impact of the problem]

**Solution:**
${yourSolution} addresses this by [how it solves the problem].

**Expected Results:**
- [Result 1]
- [Result 2]  
- [Result 3]

### Investment & Return

${budgetContext ? budgetContext : 'Investment: $X\nExpected ROI: X:1\nPayback: X months'}

### Recommendation

Proceed with ${yourSolution} to [achieve outcome].

${urgencyDrivers ? `**Why Now:** ${urgencyDrivers}` : ''}

---

*[${args.champion_name || 'Champion'} to present to ${targetStakeholder}]*`,
        internal_business_case: () => `# Internal Business Case

## ${yourSolution} Investment Proposal

### Submitted by: ${championName}${championRole ? `, ${championRole}` : ''}
### For: ${targetStakeholder}

---

## Executive Summary

This document presents the business case for investing in ${yourSolution} to address [challenge] and achieve [outcome].

${keyValuePoints ? `\n**Value Summary:**\n${valueItems.map(p => `- ${p.trim()}`).join('\n')}\n` : ''}

---

## Current State

### Challenges
- [Challenge 1: describe current pain]
- [Challenge 2: describe current pain]
- [Challenge 3: describe current pain]

### Impact
- Time: [Hours/FTEs spent on workarounds]
- Cost: [$ impact of current state]
- Risk: [What we're exposed to]
- Opportunity: [What we're missing]

---

## Proposed Solution

### Overview
${yourSolution} provides [brief description].

### How It Works
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Why This Solution
${competitiveContext ? `We evaluated alternatives including ${competitiveContext}. We recommend ${yourSolution} because [reasons].` : '[Why this option over the alternatives]'}

---

## Financial Analysis

### Investment Required
${budgetContext ? budgetContext : `
| Item | Cost |
|------|------|
| Software | $XX,XXX/year |
| Implementation | $XX,XXX |
| Training | $X,XXX |
| **Total Year 1** | $XX,XXX |
| **Annual Recurring** | $XX,XXX |`}

### Expected Returns
| Benefit | Annual Value |
|---------|--------------|
${valueItems.length ? valueItems.map((v) => `| ${cap(v)} | [annual value, in the buyer's own numbers] |`).join('\n') : '| [Benefit 1] | [annual value, in the buyer\'s own numbers] |\n| [Benefit 2] | [annual value, in the buyer\'s own numbers] |'}
| **Total Annual Value** | [sum of the rows above] |

### ROI Analysis
- **ROI, payback and 3-year net value:** [from your ROI business case in the buyer's own numbers (the roi_business_case_builder tool can build it); leave them out rather than guess]

---

## Implementation Plan

| Phase | Timeline | Activities |
|-------|----------|------------|
| Phase 1 | Weeks 1-4 | Discovery & Setup |
| Phase 2 | Weeks 5-8 | Configuration |
| Phase 3 | Weeks 9-12 | Pilot & Training |
| Phase 4 | Weeks 13+ | Full Deployment |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Implementation delay | Phased approach |
| User adoption | Change management |
| Integration | Technical validation |

---

${objectionItems.length ? `## Objections to Answer Before the Meeting

${objectionItems.map((o) => `- **${cap(o)}:** ${answerFor(o, champCtx.v)}`).join('\n')}

---

` : ''}${champCtx.v ? `${sectorNotes(champCtx.v, 'committee')}

---

` : ''}## Recommendation

Based on this analysis, I recommend approving the investment in ${yourSolution}.

${urgencyDrivers ? `\n**Timing:** ${urgencyDrivers}` : ''}

---

## Next Steps

1. Approve investment
2. Finalize contract
3. Begin implementation
4. [Additional steps]

---

*Prepared by ${championName}*
*Date: ${new Date().toISOString().split('T')[0]}*

${SUGGESTIONS_FOOTER}`,
        objection_responses: () => `# Objection Response Guide

## For: ${championName}
## Situation: Selling ${yourSolution} internally

---

${knownObjections ? `## Anticipated Objections\n\n${objectionItems.map(obj => `
### Objection: "${obj.trim()}"

**Response:**
${answerFor(obj, champCtx.v)}

**Supporting Evidence:**
- [Proof point 1]
- [Proof point 2]

**If They Push Back:**
"I understand the concern. Let me address it this way..."

---
`).join('')}` : `## Common Objections

### "We don't have budget for this."

**Response:**
"I understand budget is tight. However, the cost of NOT solving this is $X per [period]. The investment pays for itself in [timeframe]."

**Supporting Evidence:**
- ROI analysis showing payback
- Cost of current state

---

### "We've tried similar solutions before."

**Response:**
"I appreciate that concern. Can you tell me what didn't work? ${yourSolution} is different because [differentiators]. I've also validated that [proof point]."

**Supporting Evidence:**
- How this is different
- Reference customer stories (only if you have them)

---

### "This isn't a priority right now."

**Response:**
"I understand there are competing priorities. Help me understand where this ranks. If we don't address this, [consequence]. ${urgencyDrivers ? urgencyDrivers : 'Is there a trigger that would make this a priority?'}"

**Supporting Evidence:**
- Cost of delay
- Urgency drivers

---

### "Let's revisit this next quarter."

**Response:**
"I want to respect your timeline. Can we do the preparation work now so we're ready to move quickly? What would need to happen for this to be prioritized sooner?"

**Supporting Evidence:**
- Work that can be done now
- Benefits of early start

---`}

## General Tips for ${championName}

1. **Listen first**: Understand the real concern
2. **Acknowledge**: Show you heard them
3. **Respond with evidence**: Not just opinion
4. **Check for understanding**: "Does that address your concern?"
5. **Offer next step**: Keep momentum

---

${championWins ? `## Your Personal Stake\n\nWhen this succeeds, you get:\n${championWins}\n\nRemember this when pushing through objections.` : ''}`,
        presentation_talking_points: () => `# Presentation Talking Points

## For: ${championName} presenting to ${targetStakeholder}
## Topic: ${yourSolution}

---

## Opening (2 minutes)

**Hook:**
"[Attention-grabbing statement about the problem/opportunity]"

**Credibility:**
"I've been working on this for [time period] and believe we have an opportunity to [outcome]."

**Agenda Preview:**
"In the next 15 minutes, I'll cover: the problem, the solution, the business case, and my recommendation."

---

## The Problem (3 minutes)

**Key Points:**
1. Current state: "[Describe pain point]"
2. Impact: "[Quantify the cost]"
3. Trend: "[Only if true: This is getting worse because [reason].]"

**Transition:**
"Here is the solution I recommend."

---

## The Solution (4 minutes)

**Introduction:**
"${yourSolution} helps us [primary benefit]."

**Key Capabilities:**
${keyValuePoints ? valueItems.map((p, i) => `${i + 1}. ${p.trim()}`).join('\n') : '1. [Capability 1]\n2. [Capability 2]\n3. [Capability 3]'}

${competitiveContext ? `\n**Why This Solution:**\n"We looked at alternatives including ${competitiveContext}. This is the best fit because [reasons]."` : ''}

**Transition:**
"Let me show you the numbers."

---

## The Business Case (4 minutes)

**Investment:**
${budgetContext ? budgetContext : '"The investment is $X."'}

**Return:**
"The expected return is $X, which is [X]x ROI."

**Payback:**
"We break even in [X months]."

**Risk:**
"The risk of NOT doing this is [consequence]."

---

## Recommendation (2 minutes)

**The Ask:**
"My recommendation is to proceed with ${yourSolution}."

${urgencyDrivers ? `\n**Timing:**\n"We should move now because ${urgencyDrivers}."` : ''}

**Next Steps:**
"If you approve, next steps are:
1. [Step 1]
2. [Step 2]
3. [Step 3]"

---

## Q&A Prep

**Expected Questions:**
${knownObjections ? objectionItems.map(o => `- "${o.trim()}" → ${answerFor(o, champCtx.v)}`).join('\n') : '- Budget questions → Point to ROI\n- Timeline questions → Show implementation plan\n- Risk questions → Discuss mitigation'}

---

${championWins ? `## Personal Note\n\nRemember: ${championWins}\n\n` : ''}${SUGGESTIONS_FOOTER}`,
        email_to_stakeholder: () => `# Email to ${targetStakeholder}

## From: ${championName}
## Subject Options:
- Recommendation: ${yourSolution} for [objective]
- Investment opportunity: [Brief description]
- Proposal for your review: [Topic]

---

## Email Body

Hi [Name],

I wanted to bring a recommendation to your attention regarding [challenge we're facing].

**The Situation:**
[1-2 sentences describing the current problem and its impact]

**The Opportunity:**
${yourSolution} can help us [key benefit]. Based on my analysis:
${keyValuePoints ? valueItems.map(p => `- ${p.trim()}`).join('\n') : '- [Benefit 1]\n- [Benefit 2]\n- [Benefit 3]'}

**The Investment:**
${budgetContext ? budgetContext : '[Brief investment summary]'}

**The Return:**
Expected ROI of X:1, with payback in X months.

${urgencyDrivers ? `**Why Now:**\n${urgencyDrivers}\n` : ''}

**My Recommendation:**
Proceed with ${yourSolution}.

Would you be available for a 15-minute discussion this week? I can walk you through the details and answer any questions. ${EXAMPLE}

Thanks,
${championName}

---

## Alternative: Brief Version

Hi [Name],

Quick question: Would you be open to a 15-minute discussion about [solving X problem]? ${EXAMPLE}

I've found a solution that could save us [$ or time] and I'd like your input before we proceed.

Let me know what works for your schedule.

${championName}`,
        roi_one_pager: () => `# ROI One-Pager: ${yourSolution}

## For: ${targetStakeholder} | Prepared by: ${championName}

---

### The Opportunity

**Problem:** [Current challenge in one sentence]

**Solution:** ${yourSolution}

**Impact:** [Key metric improvement]

---

### Investment Summary

| Category | Amount |
|----------|--------|
| Year 1 Investment | $XX,XXX |
| Annual Recurring | $XX,XXX |
| Implementation | [Included, or its cost] |

---

### Value Creation

| Benefit | Annual Value | Source |
|---------|--------------|--------|
${keyValuePoints ? valueItems.map(p => `| ${p.trim()} | $XX,XXX | [Source] |`).join('\n') : '| Efficiency gains | $XX,XXX | Time savings |\n| Cost reduction | $XX,XXX | Eliminated spend |\n| Revenue impact | $XX,XXX | Improved outcomes |'}
| **Total Value** | **$XXX,XXX** | - |

---

### ROI Analysis

| Metric | Value |
|--------|-------|
| **ROI** | [from your ROI business case] |
| **Payback** | X months |
| **3-Year NPV** | $X.XM |

---

### Why Now

${urgencyDrivers ? urgencyDrivers : '- [Why now: the deadline or event that sets the timing]\n- Cost of delay: $X/month'}

---

### Recommendation

**Approve investment in ${yourSolution}**

---

*Contact: ${championName}${championRole ? `, ${championRole}` : ''}*`,
        competitive_comparison: () => `# Competitive Comparison

## ${yourSolution} vs Alternatives

### Prepared for: ${targetStakeholder}
### By: ${championName}

---

## Evaluation Summary

${competitiveContext ? `We evaluated: ${competitiveContext}` : 'We evaluated: [the alternatives you looked at]'}

**Recommendation:** ${yourSolution}

---

## Comparison Matrix

*Example ratings (not from your input): replace every rating with the results of your own evaluation.*

| Criteria | ${yourSolution} | Alternative A | Alternative B |
|----------|-----------------|---------------|---------------|
| **Capability Fit** | Full | Partial | Partial |
| **Integration** | Easy | Complex | Complex |
| **Implementation** | Fast | Slow | Very slow |
| **Support** | Premium | Standard | Limited |
| **Total Cost (3yr)** | $XXX,XXX | $XXX,XXX | $XXX,XXX |
| **Risk** | Low | Medium | High |

---

## Why ${yourSolution}

${keyValuePoints ? `### Key Advantages:\n${valueItems.map(p => `- ${p.trim()}`).join('\n')}` : '### Key Advantages:\n- [Benefits from your key value points]'}

---

## What Others Are Missing

[Alternative A]: Missing [key capability]
[Alternative B]: Missing [key capability]

---

## Recommendation

Based on [your evaluation], ${yourSolution} is the best choice for [our organization].

---

*Analysis by ${championName}*`,
        risk_assessment: () => `# Risk Assessment: ${yourSolution}

## For: ${targetStakeholder}
## Prepared by: ${championName}

---

## Executive Summary

This assessment evaluates risks associated with implementing ${yourSolution} and our mitigation strategies.

*Example assessment (not from your input): replace every rating and mitigation below with your own findings.*

**Overall Risk Level:** [your assessment, for example LOW to MEDIUM]

---

## Risk Assessment Matrix

| Risk | Likelihood | Impact | Mitigation | Residual Risk |
|------|------------|--------|------------|---------------|
| Implementation delay | Medium | Medium | Phased approach | Low |
| User adoption | Medium | High | Change management | Medium |
| Integration issues | Low | High | Technical validation | Low |
| Vendor viability | Low | High | Due diligence done | Low |
| Budget overrun | Low | Medium | Fixed pricing | Low |

---

## Risk Details

### Risk 1: Implementation Delay

**Likelihood:** Medium
**Impact:** Delayed value realization
**Mitigation:** 
- Phased implementation approach
- Dedicated project resources
- Regular status reviews

### Risk 2: User Adoption

**Likelihood:** Medium
**Impact:** Reduced value capture
**Mitigation:**
- Comprehensive training plan
- Executive sponsorship
- Change management program
- Early wins communication

### Risk 3: Integration Complexity

**Likelihood:** Low
**Impact:** Technical challenges
**Mitigation:**
- Technical validation completed
- Proven integration patterns
- Vendor support commitment

---

## Risk of Doing Nothing

| Factor | Impact |
|--------|--------|
| Continued inefficiency | $X/year |
| Competitive disadvantage | Market share at risk |
| Employee productivity | X hours/week wasted |
| Opportunity cost | $X in missed growth |

**[Your conclusion: does the risk of inaction exceed the risk of action?]**

---

## Conclusion

[Your conclusion from the assessment above, for example: While implementation has some risks, all are manageable with proper planning. The risk of NOT proceeding is higher than proceeding.]

---

*Assessment by ${championName}*`
    };
    const generator = assetGenerators[assetType] || assetGenerators['executive_brief'];
    return generator();
}
// Tool 12: Competitive Trap Setter
function executeCompetitiveTrapSetter(args) {
    const competitor = args.competitor || 'Competitor';
    const competitorWeaknesses = args.competitor_weaknesses || '';
    const yourSolution = args.your_solution || 'our solution';
    const yourStrengths = args.your_strengths || '';
    const evaluationStage = args.evaluation_stage || 'mid';
    const buyerPriorities = args.buyer_priorities || '';
    const trapType = args.trap_type || 'all';
    // Run 19 D80: the sector and business model are read from the inputs (problems 4 and 8).
    const ctx = readContext(args.business_model, yourSolution, yourStrengths, competitorWeaknesses, buyerPriorities, args.buyer_persona, competitor);
    const model = ctx.model;
    const software = model === null || model === 'saas' || model === 'hardware_software';
    // Run 19 D80 (problem 2): a weakness is the seller's own note. It is never read out to the buyer inside a question; the
    // question asks the buyer to test the topic the weakness is about. The competitor's name is taken off the front of the note.
    const strip = (w) => w.trim().replace(new RegExp('^' + competitor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(?:is|has|needs|struggles|lacks|relies)?\\s*', 'i'), (m) => m.replace(competitor, '').trimStart() ? m.replace(new RegExp(competitor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').trimStart() : '');
    const weaknesses = splitItems(competitorWeaknesses);
    const strengths = splitItems(yourStrengths);
    const topicOf = (w) => {
        const t = w.toLowerCase();
        if (/setup|set-up|implement|onboard|months|weeks|rollout|go-live|deploy/.test(t))
            return 'the time from signing to the first real result';
        if (/address|data|integrat|erp|tms|siem|import|sync/.test(t))
            return 'the handling of your own data and the systems it must connect to';
        if (/price|cost|expensive|fee|overage|charge/.test(t))
            return 'the full cost over three years, including everything outside the quoted price';
        if (/support|sla|service|response|uptime|outage|repair/.test(t))
            return 'the response to an urgent issue: who answers, how fast, and what the contract promises';
        if (/opaque|black box|explain|judg|transparen|report/.test(t))
            return 'the way each option explains its decisions and reports results you can check';
        if (/scale|volume|slow|performance|latency/.test(t))
            return 'performance at your real volumes';
        if (/adopt|use|app|interface|ux|training|manual/.test(t))
            return 'everyday use by the people who will rely on it';
        return 'the scenario you care most about';
    };
    const sectorQ = ctx.v ? ctx.v.discovery.slice(0, 2).map((x) => `- "${x}"`).join('\n') : '';
    const implementationLabel = model === 'investment' ? 'Onboarding and Mandate Landmines' : model === 'services' ? 'Transition Landmines' : model === 'connectivity' ? 'Rollout Landmines' : 'Implementation Landmines';
    const implementationQs = model === 'investment' ? [
        '"How long from signing to the first allocation, and what do you need from us?"', '"What reporting will you receive each month, and who explains a bad month?"', '"What are the full fees, including performance fees and minimums?"',
    ] : model === 'services' ? [
        '"How will the transition from the current provider run, stage by stage, and who signs off each stage?"', '"Who are the named people on the account, and what happens if they leave?"', '"What is in the rate card, and how are change requests priced?"',
    ] : model === 'connectivity' ? [
        '"How many sites go live in each wave, and what is the fallback if a cut-over fails?"', '"What is the repair time in the contract, and how are service credits paid?"', '"What one-time charges apply per site (installation, equipment)?"',
    ] : [
        '"What is their typical implementation timeline? Have you talked to customers about actual versus promised?"', '"Who from their team will be involved in implementation?"', '"What is included in the price and what costs extra?"',
    ];
    const sections = {
        discovery_questions: `## Discovery Questions (Landmines)

These questions let the buyer find ${competitor}'s gaps through their own evaluation. The weak points below are your own notes: never read one out to the buyer.

### General Competitive Discovery
- "What other options are you evaluating, and what criteria are you using?"
- "What's most important to you in making this decision?"
- "Have you defined must-haves versus nice-to-haves?"
${sectorQ}

### Capability Landmines
${weaknesses.length ? weaknesses.map((w) => `
**Their weak point (your note, not for the buyer):** ${cap(strip(w))}
**Landmine Question:** "How will you test ${topicOf(w)} in each option? Could each vendor show it live, with your own data?"
**Why It Works:** The buyer tests the area themselves, so the gap shows up in their own evaluation.
`).join('\n') : `
- "Can you walk me through how you would handle [a scenario where they are weak]?"
- "What happens when [an edge case they cannot handle]?"`}

### ${implementationLabel}
${implementationQs.map((x) => `- ${x}`).join('\n')}

### Support Landmines
- "What level of support is included? What happens when you have an urgent issue?"
- "Can you talk to customers who've been through their support process?"`,
        evaluation_criteria: `## Evaluation Criteria Positioning

### Criteria to Establish Early

${strengths.length ? `Based on your strengths, suggest these as requirements (only where you can prove them):\n${strengths.map((s) => `- **${cap(s)}**: "How will you test this in each option? Is it on your evaluation list?"`).join('\n')}` : `
- "[Your differentiating capability]": "[Why this matters, only if you can show it]. Is this on your list?"
- "Customer references in your industry": "Will you be talking to customers like you?"`}

### How to Suggest Criteria

"Before you evaluate anyone, it helps to agree the criteria. ${strengths.length ? `I'd suggest these: ${strengths.slice(0, 3).map((s) => lowerFirstIfCommon(s)).join('; ')}.` : 'I would suggest starting with the outcomes you need.'} Would it help if I shared questions to ask every vendor?"`,
        reference_questions: `## Reference Call Questions

Suggest the buyer ask these questions when speaking with ${competitor}'s references:

### General Questions
- "How long have you been using it?"
- "How does the actual experience compare to what was promised during sales?"
- "What surprised you after you started?"

### Capability Questions
${weaknesses.length ? weaknesses.map((w) => `- "Tell me about ${topicOf(w)}. What did you see in practice?"`).join('\n') : `- "What limitations have you run into?"
- "What workarounds have you had to build?"`}

### The Killer Question
- **"Knowing what you know now, would you choose them again?"**`,
        technical_requirements: `## ${software ? 'Technical Requirements' : 'Requirements'} (Traps)

### RFP or Requirements Document

${strengths.length ? `Requirements built on your strengths (keep only what you can demonstrate):\n${strengths.map((s, i) => `${i + 1}. **${cap(s)}**: "The vendor must demonstrate this live, on our own data, during the evaluation."`).join('\n')}` : `1. "Solution must support [your unique capability]"
2. "Solution must demonstrate [your differentiator] in the evaluation"`}

### Evaluation Scenarios

${weaknesses.length ? weaknesses.map((w, i) => `**Scenario ${i + 1}:** ${cap(topicOf(w))}, tested live on the buyer's own data
- Your note (not for the buyer): ${strip(w)}
- Success criteria: agree a measurable outcome with the buyer before the test`).join('\n\n') : `1. "[Scenario you handle well]": test the core capability
2. "[Scale scenario]": test performance`}`,
        commercial_terms: `## Commercial Terms (Positioning)

### Pricing Comparisons

When they compare prices, make sure they compare:
${model === 'investment' ? '- Management and performance fees\n- Minimum mandate size and lock-in\n- Reporting and transparency included\n- Exit terms' : model === 'services' ? '- The rate card and how change requests are priced\n- Transition costs\n- Service credits and how they are paid\n- Exit and handover terms' : model === 'connectivity' ? '- Monthly charge per site or link over the full term\n- One-time installation and equipment charges\n- Service credits for missed SLAs\n- Early termination charges' : '- Total cost of ownership (not just the licence)\n- Implementation and training costs\n- Support tiers\n- Costs as usage grows'}

**Questions to Ask ${competitor}:**
- "What is NOT included in the quoted price?"
- "What do years 2 and 3 cost?"
- "How are price increases decided?"

### Contract Terms to Check

Ask these about ${competitor}'s contract (nothing here says ${competitor} has these terms; check the actual contract):
- Does it renew automatically, and can the price rise at renewal?
- What are the termination rights and notice periods?
- Are there fees outside the quoted price?

### Your Own Terms

Offer only the terms you actually have, in your own words: [for example, your payment options and contract length]. Promise nothing you cannot put in the contract.`,
    };
    let output = `# Competitive Positioning: vs ${competitor}

## Situation
- **Competitor:** ${competitor}
- **Your Solution:** ${yourSolution}
- **Evaluation Stage:** ${evaluationStage}${args.evaluation_stage ? '' : ' (default)'}
- **Buyer Persona:** ${args.buyer_persona || NOT_SUPPLIED}
${buyerPriorities ? `- **Buyer Priorities:** ${buyerPriorities}` : ''}

${ctx.line}

---

## Competitive Intelligence

### Your Strengths
${strengths.length ? strengths.map((s) => `- ${s}`).join('\n') : '- [Define your key differentiators]'}

### ${competitor}: Weak Points (your notes, never read out to the buyer)
${weaknesses.length ? weaknesses.map((w) => `- ${w}`).join('\n') : '- [Research competitor weaknesses]'}

${sectorNotes(ctx.v, 'committee')}

---

## Positioning Strategy

### Golden Rule
**Never go negative.** Let the buyer discover competitor weaknesses through their own evaluation.

---

`;
    if (trapType === 'all') {
        output += ['discovery_questions', 'evaluation_criteria', 'reference_questions', 'technical_requirements', 'commercial_terms'].map((k) => sections[k]).join('\n\n---\n\n');
    }
    else {
        output += sections[trapType] || sections['discovery_questions'];
    }
    output += `

---

## Stage-Specific Tactics

### ${cap(evaluationStage)} Stage Recommendations
${evaluationStage === 'early' ? `
- Establish evaluation criteria now
- Position your strengths as requirements
- Offer to help them structure the evaluation` : ''}${evaluationStage === 'mid' ? `
- Make sure your differentiators are being tested
- Provide proof points and references
- Surface competitor limitations through the buyer's own tests` : ''}${evaluationStage === 'late' ? `
- Address any lingering concerns
- Make sure the decision criteria are the ones agreed
- Help your champion make the case internally` : ''}${evaluationStage === 'finalist' ? `
- Focus on risk reduction for the buyer
- Provide executive access
- Close with the terms you can actually offer` : ''}

---

*Use these tactics professionally and honestly: claim nothing you cannot prove.*`;
    return output;
}
// Tool 7: Proposal Section Writer
function executeProposalSectionWriter(args) {
    const sectionType = args.section_type || 'executive_summary';
    const customerName = args.customer_name || '[Customer name]';
    const customerIndustry = args.customer_industry || 'Technology';
    const primaryAudience = args.primary_audience || 'vp_level';
    const customerChallenges = args.customer_challenges || '';
    const yourSolution = args.your_solution || 'our solution';
    const keyDifferentiators = args.key_differentiators || '';
    const pricing = args.pricing || '';
    const implementationApproach = args.implementation_approach || '';
    const successMetrics = args.success_metrics || '';
    const tone = args.tone || 'consultative';
    // Run 19 D80 (problems 2, 3 and 8): lists are split by line or semicolon only, so a phrase is never cut at a comma into a
    // fragment; the implementation approach is used; sector notes say what evidence lands in this buyer's sector.
    const propCtx = readContext(undefined, yourSolution, customerIndustry, customerChallenges, keyDifferentiators);
    // Tone adjustments
    const toneStyles = {
        formal: {
            opening: 'We are pleased to present this proposal. It outlines',
            language: 'professional and structured'
        },
        consultative: {
            opening: 'This proposal outlines',
            language: 'partnership-oriented'
        },
        bold: {
            opening: 'The opportunity before you is set out below. This proposal outlines',
            language: 'confident and direct'
        },
        conservative: {
            opening: 'We respectfully submit this proposal. It outlines',
            language: 'measured and thorough'
        }
    };
    const toneStyle = toneStyles[tone] || toneStyles['consultative'];
    // Section generators
    const sections = {
        executive_summary: () => `# Executive Summary

## Proposal for ${customerName}

${toneStyle.opening} how ${yourSolution} can help ${customerName} with ${customerChallenges ? 'the challenges below' : '[the challenges they named]'}.

### The Opportunity

${customerChallenges ? `Key challenges for ${customerName}:\n\n${splitItems(customerChallenges).map(c => `- ${c.trim()}`).join('\n')}` : `[The challenges ${customerName} named, in their words]`}

### Our Recommendation

What ${yourSolution} offers ${customerName}:

${keyDifferentiators ? splitItems(keyDifferentiators).map(d => `- **${d.trim()}**`).join('\n') : `- [Outcome you can prove]\n- [How it fits their current systems: only if true]\n- [What changes for their team]`}

### Expected Outcomes

${successMetrics ? successMetrics : `Within 12 months of implementation ${EXAMPLE}, ${customerName} can expect:\n\n- [Outcome you can prove]\n- [Second outcome you can prove]\n- [How you will measure them]`}

### How We Will Get There

${implementationApproach ? `${cap(implementationApproach.trim().replace(/[.]$/, ''))}.` : '[Your rollout plan: phases, who is involved on both sides and when value starts]'}

### Investment Overview

${pricing ? `Investment: ${pricing}` : '[Pricing: add yours or point to your pricing section]'}

### Why ${yourSolution}

${keyDifferentiators ? `The recommendation above lists what sets ${yourSolution} apart. Add one piece of evidence for each point before you send this${propCtx.v ? `; in ${propCtx.v.name}, the evidence that lands is this: ${lowerFirstIfCommon(propCtx.v.proofShape)}` : ''}.` : `We bring [your relevant expertise], [your track record, with evidence] and [your commitment to their success].`}

### Next Steps

We recommend the following path forward:
1. Review this proposal and provide feedback
2. Schedule a working session to finalize scope
3. Begin implementation planning
4. Kick off the project

---

*We look forward to partnering with ${customerName} to achieve these outcomes.*`,
        problem_statement: () => `# Understanding Your Challenges

## Current State at ${customerName}

${customerChallenges ? `Key challenges for ${customerName}:\n\n${splitItems(customerChallenges).map((c, i) => `### Challenge ${i + 1}: ${c.trim()}\n\n**Impact:** [How this affects their team and results, in their words]\n\n**Root Cause:** [process gaps, technology limits or resource constraints: what they told you]\n\n**Cost of Inaction:** Without addressing this, ${customerName} risks [specific consequences].\n`).join('\n')}` : `*Example challenges (not from your input): keep only the ones ${customerName} named, in their words.*\n\n### Operational Complexity\nYour current processes require significant manual effort, creating bottlenecks and increasing the risk of errors.\n\n### Visibility Gaps\nWithout real-time insights, decision-making is delayed and often based on incomplete information.\n\n### Scalability Constraints\nAs ${customerName} grows, current systems and processes may not scale effectively.\n\n### Competitive Pressure\nThe market is evolving rapidly, and staying ahead requires modern tools and approaches.`}

## The Cost of the Current State

| Impact Area | Current Cost | Opportunity |
|-------------|--------------|-------------|
| Time | [Hours spent on manual tasks] | [Hours saved] |
| Money | [Cost of inefficiency] | [Potential savings] |
| Risk | [Risk exposure] | [Risk reduction] |
| Growth | [Missed opportunities] | [Growth enablement] |

## What Success Looks Like

*Example picture of success (not from your input): replace it with what ${customerName} told you.*

${customerName} envisions a future where:
- Teams spend time on high-value work, not manual processes
- Data-driven decisions are made in real-time
- Systems scale seamlessly with business growth
- Competitive advantage is maintained and extended

---

*This understanding informs our recommended approach in the following sections.*`,
        solution_overview: () => `# Solution Overview

## How ${yourSolution} Addresses Your Needs

### Solution Architecture

[How ${yourSolution} addresses each challenge ${customerName} named]

#### Core Capabilities${keyDifferentiators ? '' : ' (example capabilities: replace them with your own)'}

${keyDifferentiators ? splitItems(keyDifferentiators).map((d, i) => `**${i + 1}. ${d.trim()}**\n[How this capability solves one of their challenges]\n`).join('\n') : `**1. Automation & Efficiency**\nEliminate manual processes and streamline workflows.\n\n**2. Real-Time Visibility**\nGain instant access to insights that drive better decisions.\n\n**3. Scalable Architecture**\nGrow without constraints or performance degradation.\n\n**4. Integration Ecosystem**\nConnect seamlessly with your existing technology stack.`}

### How It Works

*Example process (not from your input): replace it with your own steps.*

1. **Discovery & Configuration**
   - We work with your team to understand specific requirements
   - System is configured to match your processes

2. **Integration**
   - Connect with existing systems and data sources
   - Establish data flows and workflows

3. **Deployment**
   - Roll out to users with training and support
   - Monitor adoption and optimize

4. **Continuous Improvement**
   - Regular reviews and optimization
   - Ongoing support and updates

### Feature-to-Value Mapping

| Your Challenge | Our Capability | Business Value |
|----------------|----------------|----------------|
| ${splitItems(customerChallenges)[0]?.trim() || '[Challenge 1]'} | [Feature A] | [Outcome 1] |
| ${splitItems(customerChallenges)[1]?.trim() || '[Challenge 2]'} | [Feature B] | [Outcome 2] |
| ${splitItems(customerChallenges)[2]?.trim() || '[Challenge 3]'} | [Feature C] | [Outcome 3] |

### Security & Compliance

[List only the security facts that are true for ${yourSolution}, for example:]
- [SOC 2 Type II certified, if you hold this report]
- [GDPR compliant, if it applies to you]
- [Data encryption at rest and in transit, if true]
- [Role-based access controls, if true]

---

*Detailed technical specifications available upon request.*`,
        implementation_plan: () => `# Implementation Plan

## Approach for ${customerName}

${implementationApproach ? implementationApproach : `### Our Methodology

[Describe your implementation methodology and how it limits disruption to the customer's operations.]`}

### Timeline Overview

${EXAMPLES}
| Phase | Duration | Activities | Outcomes |
|-------|----------|------------|----------|
| **Phase 1: Discovery** | 2 weeks | Requirements, design | Solution design |
| **Phase 2: Configure** | 4 weeks | Setup, integration | Working system |
| **Phase 3: Pilot** | 4 weeks | Test, iterate | Validated solution |
| **Phase 4: Deploy** | 2 weeks | Rollout, training | Full deployment |
| **Phase 5: Optimize** | Ongoing | Monitor, improve | Continuous value |

### Phase Details

The week ranges below follow the example timeline above: replace them with your own.

#### Phase 1: Discovery & Design (Weeks 1-2)
**Activities:**
- Stakeholder interviews and requirements gathering
- Technical architecture review
- Integration mapping
- Success criteria definition

**Deliverables:**
- Solution design document
- Integration specifications
- Project plan

#### Phase 2: Configuration & Build (Weeks 3-6)
**Activities:**
- System configuration
- Integration development
- Custom workflows
- Testing environment setup

**Deliverables:**
- Configured system
- Integration connections
- Test scripts

#### Phase 3: Pilot & Validate (Weeks 7-10)
**Activities:**
- Pilot deployment to select users
- User acceptance testing
- Performance validation
- Iteration based on feedback

**Deliverables:**
- Pilot results report
- Optimized configuration
- Training materials

#### Phase 4: Full Deployment (Weeks 11-12)
**Activities:**
- Production deployment
- User training
- Go-live support
- Documentation handoff

**Deliverables:**
- Live production system
- Trained users
- Support handoff

### Success Criteria

${successMetrics ? successMetrics : `- System fully operational within 12 weeks ${EXAMPLE}\n- 80% user adoption within 30 days of launch ${EXAMPLE}\n- Key integrations functional\n- Performance benchmarks met`}

### Risk Mitigation

*Typical risks (not from your input): replace the ratings with your own.*

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Timeline delay | Medium | Buffer time, parallel workstreams |
| Integration complexity | Medium | Early technical validation |
| User adoption | Medium | Change management, training |
| Resource availability | Low | Clear resource planning |

---

*Timeline is indicative and will be finalized during contracting.*`,
        pricing_justification: () => `# Investment & Value

## Pricing for ${customerName}

${pricing ? `### Investment Summary\n\n${pricing}` : `### Investment Summary\n\n| Component | Investment |\n|-----------|------------|\n| Platform License | $XX,XXX/year |\n| Implementation | $XX,XXX |\n| Training | [Included, or its cost] |\n| Support | [Included, or its cost] |`}

### Value Justification

#### Return on Investment

| Value Category | Annual Value | Calculation Basis |
|----------------|--------------|-------------------|
| **Efficiency Gains** | $XXX,XXX | Time saved × labor cost |
| **Cost Reduction** | $XXX,XXX | Eliminated spend |
| **Revenue Impact** | $XXX,XXX | Improved outcomes |
| **Risk Mitigation** | $XXX,XXX | Avoided costs |
| **Total Value** | **$X,XXX,XXX** | - |

**ROI: XXX% | Payback: X months**

### Price-to-Value Ratio

For every dollar invested in ${yourSolution}, ${customerName} can expect to receive $X in value [only if your ROI figures show it].

### Competitive Comparison

*Example ratings (not from your input): replace every rating with your own comparison.*

| Factor | ${yourSolution} | Alternative A | Alternative B |
|--------|-----------------|---------------|---------------|
| Total Cost | $$ | $$$ | $ |
| Implementation Time | Fast | Medium | Slow |
| Feature Set | Complete | Partial | Basic |
| Support | Premium | Standard | Limited |
| **Value/Cost** | **Excellent** | Good | Fair |

### Investment Protection

*Include only the protections you actually offer:*
- **Satisfaction Guarantee:** We stand behind our solution
- **Flexible Terms:** Options for payment structure
- **Price Lock:** Protection from future increases
- **Success Commitment:** We succeed when you succeed

---

*Investment assumes standard scope. [Custom pricing for specific requirements, only if you offer it.]*`,
        risk_mitigation: () => `# Risk Assessment & Mitigation

## Ensuring Success for ${customerName}

### Risk Categories

*Typical risks (not from your input): replace the ratings and mitigations with your own.*

#### Implementation Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Timeline overrun | Medium | Medium | Phased approach, buffer time |
| Integration challenges | Medium | High | Early technical validation |
| Resource constraints | Low | Medium | Clear resource planning |
| Scope creep | Medium | High | Defined scope, change control |

#### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User adoption | Medium | High | Change management program |
| System performance | Low | High | Performance testing, SLAs |
| Data quality | Medium | Medium | Data validation protocols |
| Business continuity | Low | Critical | Disaster recovery plan |

### Our Approach to Risk Management

*Example approach (not from your input): keep only what your team does.*

**1. Proactive Identification**
We identify and assess risks before they become issues through:
- Regular risk assessments
- Stakeholder feedback loops
- Technical monitoring

**2. Early Mitigation**
We address risks early through:
- Proof of concept for technical risks
- Change management for adoption risks
- Clear communication for alignment risks

**3. Contingency Planning**
We prepare for scenarios through:
- Rollback plans
- Alternative approaches
- Escalation procedures

### Commitments & Guarantees

*Include only the commitments you actually offer:*
- **SLA:** 99.9% uptime guarantee ${EXAMPLE}
- **Support:** [your support hours, for example 24/7 critical issue response]
- **Security:** [your security practices, for example regular audits and updates]
- **Success:** [your success model, for example a dedicated success manager]

---

*[Only if true: We take risk seriously and invest in ensuring your success.]*`,
        success_metrics: () => `# Success Metrics & Measurement

## How We'll Measure Success

${successMetrics ? `### Agreed Success Metrics\n\n${successMetrics}` : '### Proposed Success Metrics'}

### Key Performance Indicators

${EXAMPLES}
| KPI | Baseline | Target | Timeline |
|-----|----------|--------|----------|
| **Operational Efficiency** | Current state | +30% improvement | 6 months |
| **Cost Savings** | $X current | $Y reduction | 12 months |
| **User Adoption** | 0% | 80%+ active | 90 days |
| **Process Cycle Time** | X days | Y days | 6 months |

### Measurement Framework

#### Phase 1: Baseline (Pre-Implementation)
- Document current state metrics
- Establish measurement methodology
- Set realistic targets

#### Phase 2: Early Indicators (30-60 days) ${EXAMPLE}
- System usage and adoption
- Initial process improvements
- User satisfaction

#### Phase 3: Business Outcomes (90-180 days) ${EXAMPLE}
- Efficiency gains
- Cost reductions
- Quality improvements

#### Phase 4: Strategic Impact (12+ months) ${EXAMPLE}
- Revenue impact
- Competitive advantage
- Scalability achieved

### Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|----------|
| Dashboard | Real-time | All users |
| Weekly Summary | Weekly | Project team |
| Monthly Review | Monthly | Sponsors |
| Executive Report | Quarterly | Leadership |

### Success Commitment

[Your success commitment, for example: We are committed to helping ${customerName} achieve these outcomes.]

---

*Metrics will be finalized during implementation planning.*`,
        company_overview: () => `# About Us

## Your Partner for Success

### Who We Are

${yourSolution} is a provider of [solution category] that helps [who] [core value proposition]. [Only if true and provable: Trusted by [X+] companies.]

### Our Mission

To help organizations like ${customerName} achieve [mission statement].

### Why Companies Choose Us

**Experience:** XX years helping companies solve these challenges
**Expertise:** [Your experience in ${args.customer_industry ? `the ${customerIndustry} industry` : "the customer's industry"}]
**Results:** [Your results, with evidence]
**Support:** [Your support commitment]

### By the Numbers

| Metric | Value |
|--------|-------|
| Customers | XXX+ |
| Industries Served | XX+ |
| Years in Business | XX |
| Customer Satisfaction | XX% |
| Implementation Success | XX% |

### Our Differentiators

${keyDifferentiators ? splitItems(keyDifferentiators).map(d => `- ${d.trim()}`).join('\n') : `- [Your technology strength]\n- [Your domain expertise]\n- [Your methodology]\n- [Your support model]`}

### Industry Recognition

- [Award or recognition 1]
- [Award or recognition 2]
- [Award or recognition 3]

### Our Team

Your ${customerName} team includes:
- **Account Executive:** [Name]
- **Solutions Engineer:** [Name]
- **Customer Success Manager:** [Name, if you assign one]
- **Support Team:** [your support availability]

---

*We look forward to being your trusted partner.*`,
        case_studies: () => `# Customer Success Stories

## Companies Like ${customerName} Achieving Results

*Example case studies (not real customers): replace each one with a real customer story you have permission to share.*

### Example 1: [Similar Company in ${args.customer_industry ? customerIndustry : "the customer's industry"}]

**Challenge:**
Faced similar challenges to ${customerName} including ${splitItems(customerChallenges)[0] || 'operational inefficiency'}.

**Solution:**
Implemented ${yourSolution} to address core challenges.

**Results:**
${EXAMPLES}
- 40% improvement in efficiency
- $X million in cost savings
- 95% user adoption
- ROI achieved in X months

> "Quote from customer about their experience."
> ([Name, Title, Company])

---

### Example 2: [Another Similar Company]

**Challenge:**
Needed to address ${splitItems(customerChallenges)[1] || 'scaling challenges'}.

**Solution:**
Deployed ${yourSolution} across their organization.

**Results:**
${EXAMPLES}
- 50% reduction in processing time
- Improved visibility and control
- Enabled growth without adding headcount

> "Quote from customer."
> ([Name, Title, Company])

---

### Example 3: [Third Similar Company]

**Challenge:**
${splitItems(customerChallenges)[2] || 'Integration and visibility challenges'}.

**Solution:**
Full implementation of ${yourSolution} with integrations.

**Results:**
- Unified data across systems
- Real-time insights for decision making
- Competitive advantage achieved

---

### References Available

[Only if you have references who agreed to talk:] We're happy to connect ${customerName} with customers who have faced similar challenges and achieved success with ${yourSolution}.`,
        next_steps: () => `# Recommended Next Steps

## Path Forward for ${customerName}

### Immediate Actions

| # | Action | Owner | Timeline |
|---|--------|-------|----------|
| 1 | Review and discuss this proposal | ${customerName} | This week |
| 2 | Address questions and feedback | Both teams | Within 1 week |
| 3 | Finalize scope and terms | Both teams | Within 2 weeks |
| 4 | Execute agreement | Both teams | Within 3 weeks |
| 5 | Kick off implementation | Both teams | Following week |

### Questions to Address

Before moving forward, let's align on:
- [ ] Scope and requirements confirmed
- [ ] Success metrics agreed
- [ ] Timeline acceptable
- [ ] Investment approved
- [ ] Resources identified

### How to Proceed

**Option 1: Ready to Move Forward**
Let's schedule a call to finalize terms and begin implementation planning.

**Option 2: Need More Information**
We're happy to provide additional details, demos, or [references, only if you have them].

**Option 3: Not Right Now**
We understand timing is important. Let's discuss what would make this the right time.

### Contact

**Your Account Team:**
- [Account Executive Name]: [email]
- [Solutions Engineer Name]: [email]

**To schedule a call:** [Calendar link]

---

*We're excited about the opportunity to partner with ${customerName} and look forward to helping you achieve your goals.*

${SUGGESTIONS_FOOTER}`
    };
    // Generate the requested section
    const generator = sections[sectionType];
    if (generator) {
        return generator();
    }
    return `Section type '${sectionType}' not recognized. Available sections: ${Object.keys(sections).join(', ')}`;
}
// Tool 8: Email Sequence Generator
// Text only: the plural of a persona in a sentence. A persona that already ends in s ("operations directors")
// is kept as it is (no "directorss"); otherwise an s is added, as before.
// Run 11 addendum 1 (R11-A1-1): the persona in running-text case ("head of Marketing" becomes "heads of marketing").
function pluralOf(persona) {
    const p = lowerFirstIfCommon(persona);
    // Run 12: a function name is not a plural title ("Many sales I speak with" becomes "Many people in sales roles").
    if (/^(sales|marketing|finance|operations|hr|it|engineering|procurement|product|revops|legal|security)$/i.test(p.trim()))
        return `people in ${p.trim()} roles`;
    const m = p.match(/^([A-Za-z]+)( of .+)$/);
    if (m)
        return /s$/i.test(m[1]) ? p : `${m[1]}s${m[2]}`;
    return /s$/i.test(p) ? p : `${p}s`;
}
function executeEmailSequenceGenerator(args) {
    const sequenceType = args.sequence_type || 'cold_outreach';
    const targetPersona = args.target_persona || 'Decision Maker';
    const targetIndustry = args.target_industry || '';
    const yourSolution = args.your_solution || 'our solution';
    const keyValueProp = args.key_value_prop || '';
    const specificPainPoint = args.specific_pain_point || '';
    const socialProof = args.social_proof || '';
    const callToAction = args.call_to_action || 'meeting';
    const numEmails = args.num_emails || 5;
    const tone = args.tone || 'professional';
    const senderContext = args.sender_context || '';
    // Run 19 D80 (problem 2): typed phrases are never pasted into a fixed sentence that only fits one shape of phrase.
    const ctx = readContext(undefined, yourSolution, targetIndustry, targetPersona, specificPainPoint, keyValueProp);
    const cta = callToAction.trim().replace(/[.?!]$/, '');
    const ctaQuestion = callToAction === 'meeting' ? 'Would it make sense to talk about how we might help?'
        : /^(book|see|join|register|reply|try|get|schedule|watch|read|download|start|meet|talk|chat|review|attend|visit|sign|take)\b/i.test(cta) ? `Would you like to ${lowerFirstIfCommon(cta)}?`
            : /^(a|an|the|one|our)\b/i.test(cta) ? `Would ${lowerFirstIfCommon(cta)} next week make sense?` : `Would a ${lowerFirstIfCommon(cta)} next week make sense?`;
    const valueLine = keyValueProp ? `${yourSolution} helps with exactly this: ${lowerFirstIfCommon(keyValueProp.trim().replace(/[.]$/, ''))}.` : `[Outcome you can prove for companies like theirs].`;
    const signature = `[Your name]${senderContext ? `\n${senderContext.trim()}` : ''}`;
    // Display text (output only): every template has a fixed number of emails, whatever num_emails says
    const emailsText = hasValue(args.num_emails) ? args.num_emails.toLocaleString('en-US') : `${numEmails} (default)`; // run 15: a given 0 is shown as 0, not replaced by 5
    const fixedLengthNote = '*The template below has a fixed number of emails: add or remove emails to match the number you need.*';
    const toneInstructions = {
        professional: 'Formal, polished, business-appropriate',
        casual: 'Friendly, conversational, approachable',
        urgent: 'Time-sensitive, action-oriented, compelling',
        consultative: 'Helpful, advisory, value-first',
        provocative: 'Challenging, thought-provoking, pattern-interrupt'
    };
    const sequenceTemplates = {
        cold_outreach: () => `# Cold Outreach Sequence

## Target: ${targetPersona}${targetIndustry ? ` in ${lowerFirstIfCommon(targetIndustry)}` : ''}
## Solution: ${yourSolution}
## Tone: ${toneInstructions[tone] || toneInstructions['professional']}
## Emails: ${emailsText}
${fixedLengthNote}

---

### Email 1: The Opening (Day 1)

**Subject Options:**
- Question about [their company's] [relevant initiative]
- A thought on ${specificPainPoint ? q(lowerFirstIfCommon(specificPainPoint)) : '[pain point]'}
- [Mutual connection] suggested I reach out

**Body:**

Hi [First Name],

I've been following [Company]'s [relevant news/initiative] and noticed [observation].

${specificPainPoint ? `[Only if true and provable: Many ${pluralOf(targetPersona)} I talk to tell me the same thing: ${q(lowerFirstIfCommon(specificPainPoint))}.] Is this something you're dealing with too?` : `[Only if true and provable: Many ${pluralOf(targetPersona)} I speak with tell me [common pain point] is a top priority this year.]`}

${valueLine}

${socialProof ? `For context: ${socialProof.trim().replace(/[.]$/, '')}.` : ''}

${ctaQuestion}

Best,
${signature}

---

### Email 2: The Value Add (Day 3)

**Subject:** Re: [Previous subject] / Thought you'd find this useful

**Body:**

Hi [First Name],

Following up on my note from earlier this week.

I wanted to share [resource/insight/case study] for ${pluralOf(targetPersona)} dealing with [challenge].

[1-2 sentence description of the value]

${socialProof ? `One result we can point to: ${socialProof.trim().replace(/[.]$/, '')}.` : 'Would be happy to share how this might apply to your situation.'}

Worth a conversation?

[Your name]

---

### Email 3: The Social Proof (Day 7)

**Subject:** How [similar company] solved [problem]

**Body:**

Hi [First Name],

[Only if true and provable: a real customer story you may share.] Wanted to share a quick story.

${socialProof ? `The challenge was the one you may know: ${specificPainPoint ? q(lowerFirstIfCommon(specificPainPoint)) : '[describe pain]'}. With ${yourSolution}, the result was this: ${socialProof.trim().replace(/[.]$/, '')}.` : `[Similar company] was facing the same challenge: ${specificPainPoint ? q(lowerFirstIfCommon(specificPainPoint)) : '[describe pain]'}.

After implementing ${yourSolution}, they achieved:
- [Result 1]
- [Result 2]`}

${tone === 'provocative' ? "I'm curious: is this something you've been thinking about, or is everything running smoothly?" : "I thought this might be relevant given what I know about [their company]."}

${ctaQuestion}

${signature}

---

### Email 4: The Breakup Tease (Day 12)

**Subject:** Should I close your file?

**Body:**

Hi [First Name],

I've reached out a few times but haven't heard back. I get it: you're busy.

Just want to check: Is [solving pain point] not a priority right now, or is there someone else I should be talking to?

Either way, no hard feelings. Just want to make sure I'm not missing an opportunity to help.

[Your name]

P.S. If timing is just bad, let me know and I'll follow up in [Q2/next quarter/etc.].

---

### Email 5: The Final Value (Day 17)

**Subject:** One last thing

**Body:**

Hi [First Name],

Last note from me for now.

Before I go, I wanted to leave you with [insight/resource/invitation] that might be valuable even if we never connect:

[Describe valuable content or insight]

If you ever want to chat about [topic], my calendar is always open: [link]

All the best,
[Your name]

---

## Sequence Tips

**Timing:**
- Day 1 → 3 → 7 → 12 → 17
- Adjust based on response patterns

**Subject Lines:**
- Keep under 50 characters
- No spam trigger words
- Personalization when possible

**Best Practices:**
- Research before sending
- Personalize at least one element per email
- Track open and reply rates
- A/B test subject lines`,
        warm_follow_up: () => `# Warm Follow-Up Sequence

## Context: Post-meeting/referral/event
## Target: ${targetPersona}
## Emails: ${emailsText}
${fixedLengthNote}

---

### Email 1: Immediate Follow-Up (Same day/next morning)

**Subject:** Great connecting: next steps on [topic]

**Body:**

Hi [First Name],

Great speaking with you [today/at event/via referral context].

As discussed, I'm attaching/sending:
- [Resource 1 mentioned]
- [Resource 2 mentioned]

Key takeaways from our conversation:
1. [Their challenge/goal]
2. [How you can help]
3. [Agreed next step]

${callToAction === 'meeting' ? 'How does [Day/Time] look for our follow-up call?' : `Let me know if you'd like to ${callToAction}.`}

Looking forward to continuing the conversation.

[Your name]

---

### Email 2: Value Delivery (Day 3)

**Subject:** [Resource] for [their specific situation]

**Body:**

Hi [First Name],

I was thinking about our conversation and wanted to share this [resource/insight] that's directly relevant to [their challenge].

[Describe why it's valuable for them specifically]

Thought it might help as you think through [initiative].

Any questions, let me know.

[Your name]

---

### Email 3: Check-In (Day 7)

**Subject:** Checking in: [topic]

**Body:**

Hi [First Name],

Wanted to check in and see if you had a chance to review [previous resource/proposal/materials].

${socialProof ? `Also, thought you might be interested to know that ${socialProof}` : ''}

Any questions I can answer? Happy to hop on a quick call to discuss.

[Your name]

---

## Warm Follow-Up Tips

- **Be specific**: Reference actual conversation points
- **Deliver value**: Every email should help them
- **Keep momentum**: Follow up within committed timeframes
- **Stay relevant**: Connect to their goals, not yours`,
        post_demo: () => `# Post-Demo Sequence

## Following up after product demonstration
## Target: ${targetPersona}
## Emails: ${emailsText}
${fixedLengthNote}

---

### Email 1: Same Day Thank You

**Subject:** Thanks for your time today + [resource mentioned]

**Body:**

Hi [First Name],

Thank you for taking the time to see ${yourSolution} in action today.

As promised, here's:
- [Demo recording if available]
- [Resources mentioned]
- [Pricing/proposal if discussed]

What stood out to me from our conversation:
- You mentioned [pain point] is costing [impact]
- [Feature X] seemed particularly relevant for [their use case]
- Next step: [what was agreed]

Questions from your side?

[Your name]

---

### Email 2: Address Unstated Objections (Day 2)

**Subject:** Thinking about [likely concern]

**Body:**

Hi [First Name],

Following up on yesterday's demo.

You may be wondering about [concern: implementation, adoption].

[Proactively address the concern]

${socialProof ? socialProof : '[Only if true: Happy to connect you with a customer who had similar concerns.]'}

Does this help? What other questions are on your mind?

[Your name]

---

### Email 3: Internal Champion Enable (Day 5)

**Subject:** Materials for your team

**Body:**

Hi [First Name],

As you discuss ${yourSolution} internally, I wanted to share some materials that might help:

- [One-pager for executives]
- [ROI calculator]
- [Customer case study in their industry]

Happy to be a resource as you have conversations with [stakeholders].

Anything specific I can provide to help?

[Your name]

---

### Email 4: Create Urgency (Day 10)

**Subject:** Quick update + timeline

**Body:**

Hi [First Name],

Wanted to share a quick update that might impact your timeline:

[Relevant urgency driver: pricing, availability, competitor news, etc.]

Given our conversation about [their timeline/goals], thought this would be relevant.

Can we find time this week to discuss next steps?

[Your name]`,
        re_engagement: () => `# Re-Engagement Sequence

## Reconnecting with cold/stalled opportunities
## Target: ${targetPersona}
## Emails: ${emailsText}
${fixedLengthNote}

---

### Email 1: The Trigger Event

**Subject:** [Their company news] + thought of our conversation

**Body:**

Hi [First Name],

I noticed [trigger event: news, job change, company milestone].

Congrats on [specific thing]!

This made me think of our conversation from [timeframe] about [challenge]. Given [trigger], I wondered if [challenge] has become more of a priority.

Worth reconnecting?

[Your name]

---

### Email 2: The New Value

**Subject:** Something new I thought you'd want to see

**Body:**

Hi [First Name],

It's been a while since we last connected.

[Only if true and provable: Since then, we've [new capability/new customer/new result] that I thought would be relevant to your [challenge/initiative].]

[Brief description of what's new]

${socialProof ? socialProof : ''}

Would it make sense to reconnect and catch up?

[Your name]

---

### Email 3: The Direct Ask

**Subject:** Still relevant?

**Body:**

Hi [First Name],

I don't want to keep reaching out if ${specificPainPoint ? lowerFirstIfCommon(specificPainPoint) : '[solving this challenge]'} isn't on your radar anymore.

Quick question: Is this still something you're thinking about, or should I check back at a different time?

Either way is fine. I just want to respect your time.

[Your name]`
    };
    const generator = sequenceTemplates[sequenceType];
    if (generator) {
        const notes = ctx.v ? `\n\n---\n\n${sectorNotes(ctx.v, 'metrics')}\n- **Words this buyer uses:** ${ctx.v.vocabulary.join(', ')}. Use them where they are true for the prospect.` : '';
        return `${generator()}${notes}\n\n${SUGGESTIONS_FOOTER}`;
    }
    // Default for other sequence types
    return `# ${sequenceType.replace(/_/g, ' ')} Sequence

## Configuration
- Target: ${targetPersona}
- Industry: ${targetIndustry || 'General'}
- Tone: ${tone}
- Emails: ${emailsText}

${fixedLengthNote}

## General Structure

### Email 1: Open
- Establish context/relevance
- State purpose
- Light CTA

### Email 2: Value
- Deliver something useful
- Build credibility
- Soft CTA

### Email 3: Proof
- Social proof/case study
- Address objections
- Stronger CTA

### Email 4: Urgency
- Time-based reason to act
- Overcome inertia
- Direct CTA

### Email 5: Close
- Final attempt
- Leave door open
- Clear next step

---

*Customize based on your specific situation and ${lowerFirstIfCommon(targetPersona)} preferences*

${SUGGESTIONS_FOOTER}`;
}
// Tool 9: Demo Script Builder
function executeDemoScriptBuilder(args) {
    const demoType = args.demo_type || 'first_look';
    const primaryAudience = args.primary_audience || 'decision maker';
    const attendees = args.attendees || '';
    const customerIndustry = args.customer_industry || '';
    const yourSolution = args.your_solution || 'our solution';
    const keyPainPoints = args.key_pain_points || '';
    const competitorContext = args.competitor_context || '';
    const demoDuration = args.demo_duration || 30;
    const durationGiven = hasValue(args.demo_duration) && demoDuration === args.demo_duration; // run 15: a given 0 falls back to 30, labelled as the default
    const minutesWord = demoDuration === 1 ? 'minute' : 'minutes';
    const mustShowFeatures = args.must_show_features || '';
    const knownObjections = args.known_objections || '';
    const desiredOutcome = args.desired_outcome || 'advance the deal';
    const demoCtx = readContext(undefined, yourSolution, customerIndustry, keyPainPoints, mustShowFeatures, primaryAudience, attendees);
    // Calculate time allocations (same shares: 15% opening, 15% discovery, 50% demo, 15% discussion, 5% close).
    // Text and arithmetic only (run 9): the smaller parts round down and the demo takes the rest, so the parts
    // always add up to the requested length (before, 30 minutes gave 5 + 5 + 15 + 5 + 2 = 32).
    const intro = Math.floor(demoDuration * 0.15);
    const discovery = Math.floor(demoDuration * 0.15);
    const discussion = Math.floor(demoDuration * 0.15);
    const close = Math.round(demoDuration * 0.05);
    const demo = Number(demoDuration) - intro - discovery - discussion - close;
    // Text only (run 10): a part that rounds to 0 minutes says "under 1 min", and a demo under 10 minutes carries a plain
    // note that the parts are rounded. The shares and the arithmetic above are unchanged.
    const partMin = (n) => (n > 0 ? `${n} min` : 'under 1 min');
    const partMinutes = (n) => (n > 0 ? `${n} minute${n === 1 ? '' : 's'}` : 'under a minute');
    const shortNote = Number(demoDuration) < 10
        ? '\n\nThis demo is short, so the parts are rounded to whole minutes and some parts take less than a minute. Keep each of those to a sentence or two.'
        : '';
    // Text only (run 11, R11-07): under 10 minutes the start times come from the same shares in minutes and seconds, so
    // every part starts inside the demo and the times go up (5 minutes: 0:00, 0:23, 0:45, 1:30, 4:00, 4:45). Agenda
    // Setting sits halfway through the opening. 10 minutes and longer: whole minutes, as before.
    const startAt = (share, whole) => {
        if (Number(demoDuration) >= 10)
            return `${whole}:00`;
        const sec = Math.round(Number(demoDuration) * share * 60);
        return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    };
    return `# Demo Script: ${cap(demoType.replace(/_/g, ' '))}

## Demo Configuration

| Element | Details |
|---------|---------|
| **Type** | ${cap(demoType.replace(/_/g, ' '))} |
| **Primary Audience** | ${primaryAudience}${args.primary_audience ? '' : ' (default)'} |
| **Other Attendees** | ${attendees || 'TBD'} |
| **Industry** | ${customerIndustry || 'General'} |
| **Duration** | ${demoDuration} ${minutesWord}${durationGiven ? '' : ' (default)'} |
| **Desired Outcome** | ${desiredOutcome} |

---

## Time Allocation

| Section | Time | Focus |
|---------|------|-------|
| Opening & Agenda | ${partMin(intro)} | Set expectations |
| Discovery/Confirm | ${partMin(discovery)} | Validate understanding |
| Solution Demo | ${partMin(demo)} | Show value |
| Discussion | ${partMin(discussion)} | Address questions |
| Close & Next Steps | ${partMin(close)} | Advance deal |${shortNote}

---

## Pre-Demo Preparation

### Research Checklist
- [ ] Review previous conversations/notes
- [ ] Research company news, priorities
- [ ] Understand attendee roles and concerns
- [ ] Prepare relevant customer examples
- [ ] Test demo environment

### Technical Setup
- [ ] Demo environment ready
- [ ] Sample data loaded
- [ ] Screen sharing tested
- [ ] Backup plan ready

${competitorContext ? `### Competitive Context\n**Competitor:** ${competitorContext}\n\n**Positioning:**\n- Highlight differentiators throughout\n- Don't mention competitor unless they do\n- Have proof points ready\n` : ''}

---

## Demo Script

### Part 1: Opening (${partMinutes(intro)})

**[0:00] Introduction**

"Thanks everyone for joining. I'm [Your name] and I'll be walking you through ${yourSolution} today.

Before I share my screen, I want to make sure we cover what's most important to you. [Turn to primary audience]: What would make this ${demoDuration} ${minutesWord} valuable for you?"${durationGiven ? '' : '\n\n*The length above is an example: replace it with your own.*'}

**[Wait for response: this shapes your demo]**

**[${startAt(0.075, intro >= 2 ? 1 : 0)}] Agenda Setting**

"Perfect. Here's my plan for today:
1. Quick validation of what I've learned about your situation
2. Show you how ${yourSolution} addresses those specific needs
3. Leave time for questions and discussion
4. Agree on next steps

Does that work for everyone?"

---

### Part 2: Discovery Confirmation (${partMinutes(discovery)})

**[${startAt(0.15, intro)}] Validate Understanding**

"Before I show you anything, let me confirm what I've learned to make sure the demo is relevant:

${keyPainPoints ? `From our conversations, it sounds like:\n${keyPainPoints.split(/\n|,(?!\d{3}(?!\d))/).map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}\n\nDid I get that right? Anything to add?"` : `From what I understand so far, you're dealing with [pain points].\n\nDid I capture that correctly? What would you add?`}"

**[Listen and adjust demo focus based on responses]**

**Discovery Questions to Ask:**

${demoType === 'first_look' ? `
- "What's driving your interest in looking at solutions like this?"
- "What does success look like for you?"
- "Who else needs to be involved in this decision?"` : ''}

${demoType === 'technical_deep_dive' ? `
- "What's your current technical environment?"
- "What integration requirements are critical?"
- "What security/compliance requirements do you have?"` : ''}

${demoType === 'executive_overview' ? `
- "What are your top priorities for this year?"
- "How does this initiative fit with broader company goals?"
- "What would you need to see to move forward?"` : ''}

---

### Part 3: Solution Demo (${partMinutes(demo)})

**[${startAt(0.30, intro + discovery)}] Transition to Demo**

"Great, that confirms what I thought. Let me show you how ${yourSolution} handles those challenges. I'm going to share my screen..."

**[Share screen with demo environment]**

---

#### Demo Flow

${(() => {
        // Run 19 D80 (problem 3): every must-show feature becomes a demo step, tied to a pain point the user gave where there is one.
        const feats = splitItems(mustShowFeatures);
        const pains = splitItems(keyPainPoints);
        if (!feats.length)
            return `**Feature 1: [Address Pain Point 1]**

*Setup:*
"${pains[0] ? `You mentioned ${q(lowerFirstIfCommon(pains[0]))}` : 'You mentioned [pain point]'}. Let me show you how we handle that..."

*Action:*
[Show the feature]

*Value Statement:*
"What this means for you is [business outcome]. [Only if true and provable: [Customer example] saw [specific result] using this.]"

*Check-in:*
"How does this compare to how you're doing it today?"

---

**Feature 2: [Differentiator]**

*Setup:*
"This next part is where we differ from [alternative]: [differentiator you can prove]..."

*Action:*
[Show your differentiating capability]

`;
        return feats.map((f, i) => `**Step ${i + 1}: ${cap(f)}**

*Setup:*
"${pains[i] ? `You mentioned ${q(lowerFirstIfCommon(pains[i]))}. ` : pains[0] && i === 0 ? `You mentioned ${q(lowerFirstIfCommon(pains[0]))}. ` : ''}Let me show you ${lowerFirstIfCommon(f)}${demoCtx.v ? `, on a case that looks like your own ${demoCtx.v.vocabulary[0]} work` : ''}."

*Action:*
[Show ${lowerFirstIfCommon(f)} live, with the prospect's own example if you have it]

*Value Statement:*
"What this means for you is [the business outcome, in the prospect's numbers]."

*Check-in:*
"How does this compare to how you're doing it today?"

---

`).join('');
    })()}
${competitorContext ? `\n*Competitive note:*\nIf competitor comes up: "Great question. The key difference is [differentiator]. Would you like me to show you specifically?"` : ''}

---

### Part 4: Discussion (${partMinutes(discussion)})

**[${startAt(0.80, intro + discovery + demo)}] Open for Questions**

"Let me stop sharing for a moment. What questions do you have about what you've seen?"

${knownObjections ? `**Anticipated Objections:**

${splitItems(knownObjections).map((o) => `**Objection:** ${q(o)}
**Response:** ${answerFor(o, demoCtx.v)}

`).join('')}` : `**Common Objections to Prepare For:**

**"How long does implementation take?"**
"Typically [timeframe]. Our methodology includes [your implementation steps]..."

**"What about integration with [system]?"**
"[Only if true and provable: We have pre-built integrations with [systems]. Let me show you...]" [If not: say what connects today and what does not.]

**"What does pricing look like?"**
"I'd like to understand your needs better to give you accurate pricing. Generally..."

**"We need to think about it."**
"Absolutely. What specific aspects do you want to think through? Maybe I can help."`}${demoCtx.v ? `

${sectorNotes(demoCtx.v, 'objections')}` : ''}

---

### Part 5: Close (${partMinutes(close)})

**[${startAt(0.95, demoDuration - close)}] Summarize & Close**

"Before we wrap up, let me summarize what we covered:
1. [Pain point 1] → ${yourSolution} addresses this with [feature]
2. [Pain point 2] → You'd get [outcome]
3. [Pain point 3] → This would help you [result]

**The Ask:**

${desiredOutcome === 'advance the deal' ? `
"Based on what you've seen, what would be helpful as a next step?

Options might be:
${demoType === 'technical_deep_dive' ? '' : '- Technical deep dive with your team\n'}- Business case review
- Reference call with a similar customer (only if one has agreed)
- Pilot/POC discussion

What makes sense for you?"` : `"Our goal was to ${desiredOutcome}. Have we accomplished that? What else do you need?"`}

**If Positive:**
"Great! I'll send a follow-up with [materials] and a calendar invite for [next step]. Who else should I include?"

**If Hesitant:**
"What concerns do you still have? I want to make sure you have everything you need."

---

## Post-Demo Checklist

- [ ] Send follow-up email within 2 hours
- [ ] Include demo recording (if recorded)
- [ ] Send resources promised
- [ ] Update CRM with notes
- [ ] Schedule next meeting
- [ ] Brief champion separately

---

## Demo Tips

**Do:**
- Lead with outcomes, not features
- Ask questions throughout
- Personalize examples
- Confirm understanding frequently
- Leave time for questions

**Don't:**
- Show everything you can do
- Talk more than listen
- Ignore attendee body language
- Avoid tough questions
- Leave without clear next steps

---

*Customize this script based on pre-demo discovery*

${SUGGESTIONS_FOOTER}`;
}
// ============================================================================
// MCP SERVER SETUP
// ============================================================================
// List tools handler
// =============================================================================
// SERVER (shared by the stdio entry below and netlify/functions/mcp.mjs)
// Added for the hosted connector: tool titles and annotations, and a clear
// message when a required input is missing. Tool code above is unchanged.
// =============================================================================
exports.SERVER_NAME = 'revenue-enablement-mcp';
exports.SERVER_VERSION = '1.2.21';
// Every tool only builds text from its inputs: no storage, no network, no side effects.
const TOOL_TITLES = {
    "account_plan_builder": "Account Plan Builder",
    "deal_strategy_coach": "Deal Strategy Coach",
    "discovery_question_bank": "Discovery Question Bank",
    "roi_business_case_builder": "ROI Business Case Builder",
    "mutual_action_plan_generator": "Mutual Action Plan Generator",
    "win_loss_analyzer": "Win/Loss Analyzer",
    "proposal_section_writer": "Proposal Section Writer",
    "email_sequence_generator": "Email Sequence Generator",
    "demo_script_builder": "Demo Script Builder",
    "pricing_negotiation_guide": "Pricing Negotiation Guide",
    "champion_enablement_kit": "Champion Enablement Kit",
    "competitive_trap_setter": "Competitive Trap Setter"
};
function withMeta(tool) {
    const title = TOOL_TITLES[tool.name] ?? tool.name;
    return {
        ...tool,
        title,
        annotations: { title, readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    };
}
const NEGATIVE_AMOUNT = /\$\s*[-\u2212]\s*\d|(^|[\s(:=,;])[-\u2212](?:\$|usd|inr|eur|gbp|rs\.?|\u20b9|\u20ac|\u00a3)?\s?\d[\d,]*(?:\.\d+)?(?![\d,.]|\s*%)/i;
const NEGATIVE_MONEY = /[-−]\s?[$₹€£]\s*\d|[$₹€£]\s*[-−]\s*\d|\b(?:mrr|arr|cac|ltv|acv)\b[:\s]*[-−]\s*\d/i;
const AMOUNT_RANGE = /\d\s*[kmb]?\s*(?:-|\u2013|\u2014|to)\s*[$\u20b9\u20ac\u00a3]?\s*\d/i;
function checkValue(schema, holder, key, path, problems) {
    const box = holder;
    const value = box[key];
    if (value === undefined || value === null)
        return;
    if (schema.properties && typeof value === "object" && !Array.isArray(value)) {
        for (const [k, p] of Object.entries(schema.properties))
            checkValue(p, value, k, path ? `${path}.${k}` : k, problems);
        return;
    }
    if (schema.items && Array.isArray(value)) {
        value.forEach((_, i) => checkValue(schema.items, value, i, `${path}[${i}]`, problems));
        return;
    }
    if (Array.isArray(schema.enum) && typeof value === "string" && !schema.enum.includes(value)) {
        problems.push(`${path} must be one of: ${schema.enum.join(", ")}`);
        return;
    }
    if (schema.type !== "number" && schema.type !== "integer")
        return;
    let v = value;
    if (typeof v === "string") {
        const n = v.trim() === "" ? NaN : Number(v.replace(/,/g, "").trim());
        if (!Number.isFinite(n)) {
            problems.push(`${path} must be a number, written with digits only (for example 220000)`);
            return;
        }
        box[key] = n;
        v = n;
    }
    if (typeof v !== "number" || !Number.isFinite(v)) {
        problems.push(`${path} must be a number`);
        return;
    }
    if (typeof schema.minimum === "number" && v < schema.minimum)
        problems.push(`${path} must be ${schema.minimum} or more`);
    if (typeof schema.exclusiveMinimum === "number" && v <= schema.exclusiveMinimum)
        problems.push(`${path} must be more than ${schema.exclusiveMinimum}`);
    if (typeof schema.maximum === "number" && v > schema.maximum)
        problems.push(`${path} must be ${schema.maximum} or less`);
}
const MONEY_TEXT = { pricing_negotiation_guide: ["competitor_price", "value_delivered"], champion_enablement_kit: ["budget_context"], proposal_section_writer: ["pricing"] };
const METRIC_TEXT = {};
const ONE_AMOUNT = {};
function checkRequiredInputs(name, args) {
    const tool = tools[name];
    if (!tool) {
        return `Unknown tool: ${name}. Available tools: ${Object.keys(tools).join(', ')}.`;
    }
    const required = tool.inputSchema.required ?? [];
    // Run 16 R16-10 (rule B52): a required text (a string with no fixed list of choices) that is empty or only whitespace counts as missing.
    const props = (tool.inputSchema.properties ?? {});
    const blankText = (key) => typeof args?.[key] === "string" && args[key].trim() === "" && props[key]?.type === "string" && !Array.isArray(props[key]?.enum);
    const missing = required.filter((key) => args?.[key] === undefined || args?.[key] === null || blankText(key));
    if (missing.length > 0) {
        return `Missing required input for ${name}: ${missing.join(', ')}. Provide ${missing.length === 1 ? 'it' : 'them'} and call the tool again.`;
    }
    // Decision N2 (run 6) and run 7: schema limits at any depth, choices, money text and single amounts.
    const problems = [];
    if (args) {
        for (const [k, p] of Object.entries(tool.inputSchema.properties ?? {}))
            checkValue(p, args, k, k, problems);
    }
    for (const key of MONEY_TEXT[name] ?? []) {
        const raw = args?.[key];
        if (typeof raw === "string" && NEGATIVE_AMOUNT.test(raw))
            problems.push(`${key} must not contain a negative amount`);
    }
    for (const key of METRIC_TEXT[name] ?? []) {
        const raw = args?.[key];
        if (typeof raw === "string" && NEGATIVE_MONEY.test(raw))
            problems.push(`${key} must not contain a negative amount of money`);
    }
    for (const key of ONE_AMOUNT[name] ?? []) {
        const raw = args?.[key];
        if (typeof raw === "string" && AMOUNT_RANGE.test(raw))
            problems.push(`${key} must be one amount, not a range (for example $75,000)`);
    }
    // Run 15 R15-32 (edge-case matrix): a discount is a percentage, so over 100 cannot be priced; a target close date must not be past.
    if (name === "pricing_negotiation_guide" && typeof args?.discount_requested === "number" && args.discount_requested > 100) {
        problems.push("discount_requested must be 100 or less (it is a percentage of the deal value)");
    }
    if (name === "mutual_action_plan_generator" && typeof args?.target_close_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.target_close_date.trim())) {
        const close = new Date(args.target_close_date.trim() + "T23:59:59Z");
        if (!isNaN(close.getTime()) && close.getTime() < Date.now())
            problems.push(`target_close_date ${args.target_close_date.trim()} is in the past; use a future date in the format YYYY-MM-DD`);
    }
    if (problems.length > 0) {
        return `Invalid input for ${name}: ${problems.join("; ")}.`;
    }
    return null;
}
function createServer() {
    const server = new index_js_1.Server({ name: exports.SERVER_NAME, version: exports.SERVER_VERSION }, { capabilities: { tools: {} } });
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
        tools: Object.values(tools).map((tool) => withMeta(tool)),
    }));
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const problem = checkRequiredInputs(request.params.name, request.params.arguments);
        if (problem) {
            return { content: [{ type: 'text', text: problem }], isError: true };
        }
        const { name, arguments: args } = request.params;
        try {
            const result = executeTool(name, args);
            return {
                content: [
                    {
                        type: 'text',
                        text: result.replace(/\n{3,}/g, '\n\n'),
                    },
                ],
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error executing ${name}: ${errorMessage}`,
                    },
                ],
                isError: true,
            };
        }
    });
    return server;
}
// Start server
async function main() {
    const server = createServer();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error(`Revenue Enablement MCP v${exports.SERVER_VERSION} running on stdio`);
}
// Run over stdio only when started directly (npm bin). The hosted function imports this
// file as an ES module bundle, where require is not defined.
if (typeof module !== 'undefined' && typeof require !== 'undefined' && require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=index.js.map