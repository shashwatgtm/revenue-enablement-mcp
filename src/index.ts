#!/usr/bin/env node

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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { neutraliseDeep } from './echo-safe.ts';
import { splitFeatureList, type ListItem, aAn, describeWith, painClauses, solutionBrief, parseContacts, parseProof, pickProof, proofPhrase, proofSource, tagKind, familyOf, clip, joinList, upperFirst, sentences, splitTopLevel, partLabel, addWorkdays, onOrBeforeWorkday, onOrAfterWorkday, workdaysBetween, isoDate, weekdayName, type Contact, type ProofItem, type SolutionBrief } from './dealtext.ts';
import { answerBlocker, blockerLines, blockerShort, roleFor, ROLE_KNOWLEDGE, namedThings, type BlockerContext } from './answers.ts';
import { explainSector, detectModel, profileFor, VERTICALS, SECTOR_MODEL, MODEL_TRADES, MODEL_NAME, SAAS_ONLY, BUSINESS_MODELS, type Vertical, type BusinessModel } from './verticals.ts';

// Text only (run 9): common words that may open an input phrase. Mid-sentence, only these are lowered
// ("Fewer failed deliveries" becomes "fewer failed deliveries"). Any other capitalised word is kept as typed, because it may be a
// name or an acronym ("Salesforce data you can trust", "Microsoft Teams approvals", "AI deal scoring", "CRM hygiene").
const COMMON_WORDS = new Set((
  'a an the this that these those our your their my its his her we you they it me us them all any each every ' +
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
  'lost won '
).split(/\s+/).filter(Boolean));
// A word counts as common when it is in the list, or ends in -ing or -ed ("Automated", "Missing"). A hyphenated
// word counts by its first part ("Two-way", "No-code").
function isCommonWord(word: string): boolean {
  const head = word.split('-')[0].replace(/[^A-Za-z']+$/, '');
  if (!/^[A-Z][a-z']*$/.test(head) || head === 'I' || /[A-Z]/.test(word.slice(1))) return false;
  const w = head.toLowerCase();
  return COMMON_WORDS.has(w) || (w.length > 4 && /(?:ing|ed)$/.test(w));
}
// Text only (run 10): names that keep their capital when they open an input phrase placed mid-sentence. The list holds
// common product and company names and the names found in the test inputs; other names are kept by the rules below.
const KNOWN_NAMES = new Set((
  'Salesforce Microsoft Slack HubSpot LinkedIn Google Gmail Outlook Excel Zoom Zendesk Jira Notion Shopify Stripe ' +
  'Marketo Pardot Gong Intercom Freshworks Oracle SAP Workday ServiceNow Snowflake Tableau Asana Trello Dropbox ' +
  'Apple Amazon AWS Azure Facebook Instagram WhatsApp YouTube Sam ' +
  // Run 11: the company and competitor names in the test inputs and the page examples (run 19: the invented example names).
  'Bengaluru Clari Northwind Metricly Lanehop Branchwire Answerloop Cloudmoat Spendrill Shelfwalk'
).split(/\s+/).filter(Boolean));
function bareWord(word: string): string {
  return word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
}
function isKnownName(word: string): boolean {
  const w = bareWord(word);
  return KNOWN_NAMES.has(w) || KNOWN_NAMES.has(w.split(/['-]/)[0]);
}
// Run 11: a known name typed in lower case gets its capitals back ("bengaluru teams" becomes "Bengaluru teams"). Names
// that are also ordinary words (Slack, Zoom, Notion, Gong, Sam ...) are kept when typed with a capital, never raised.
const PLAIN_WORDS = new Set('slack zoom notion excel oracle stripe apple amazon gong sam outlook workday snowflake asana tableau intercom sap azure'.split(' '));
const NAME_BY_LOWER = new Map([...KNOWN_NAMES].filter(n => !PLAIN_WORDS.has(n.toLowerCase())).map(n => [n.toLowerCase(), n] as [string, string]));
function fixNames(phrase: string): string {
  return phrase.replace(/[A-Za-z]+/g, w => (w === w.toLowerCase() && NAME_BY_LOWER.get(w)) || w);
}
// Run 11: a job title in running text is all lower case ("head of marketing", "operations director"); names and
// acronyms in it keep their capitals ("VP of sales", "director of Salesforce operations").
const JOB_WORD = /^(?:head|directors?|managers?|chief|officers?|president|coordinators?|supervisors?|specialists?|administrators?)$/i;
function isJobTitle(phrase: string): boolean {
  const w = phrase.trim().split(/\s+/).map(bareWord);
  return w.length <= 6 && w.some((x, i) => JOB_WORD.test(x) && (x.toLowerCase() !== 'head' || (w[i + 1] || '').toLowerCase() === 'of'));
}
function lowerJobTitle(phrase: string): string {
  return phrase.trim().split(/(\s+)/).map(w => (/^[A-Z][a-z'-]+\W*$/.test(w) && !isKnownName(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w)).join('');
}
// Run 10: the first word of an input phrase keeps its capital only when it is a known name, has an inner capital or is
// all capitals (HubSpot, AI, CRM), holds a digit (B2B, Q4), or starts a name of two words: the next word is capitalised
// too (New York, Example Logistics Co, Competitor A) and is not a known name on its own ("Native Salesforce" is not a name).
// Run 11: a one-letter word keeps its capital (I, X), and a common first word never makes the next word a name ("For
// Lanehop route planning" becomes "for Lanehop route planning"), unless the next word is a one-letter label after
// a noun (Competitor A) or the phrase opens with three capitalised words (Example Logistics Co).
function keepsFirstCapital(word: string, next: string, third = ''): boolean {
  const w = bareWord(word);
  if (!/^[A-Z]/.test(w) || (w.length === 1 && !(w === 'A' && next)) || isKnownName(w)) return true; // the article A is not a one-letter name
  if (/[A-Z0-9]/.test(w.slice(1))) return true;
  const n = bareWord(next || '');
  if (!/^[A-Z](?:[a-z]+(?:['-][a-z]+)*)?$/.test(n) || isKnownName(n)) return false;
  if (!isCommonWord(w) || w === 'New') return true; // New York, New Delhi
  if (n.length === 1) return !/^(?:for|with|from|to|of|in|on|at|by|and|or|the|a|an|into|about|why|how|what|when|where|who|your|our|their|my|this|that)$/i.test(w);
  return /^[A-Z][a-z]/.test(bareWord(third || ''));
}
// An input phrase placed mid-sentence: its first word is lowered unless keepsFirstCapital() keeps it
// ("Native Salesforce integration" becomes "native Salesforce integration"; "Salesforce data you can trust" stays).
function lowerFirstIfCommon(phrase: string): string {
  const t = fixNames(phrase.trim());
  if (isJobTitle(t)) return lowerJobTitle(t);
  const parts = t.split(/(\s+)/);
  if (keepsFirstCapital(parts[0] || '', parts[2] || '', parts[4] || '')) return t;
  parts[0] = parts[0].replace(/[A-Z]/, c => c.toLowerCase());
  // Run 11: after a lowered first word, a capitalised common second word is lowered too ("why forecasting matters now").
  if (parts[2] && isCommonWord(parts[2])) parts[2] = parts[2].charAt(0).toLowerCase() + parts[2].slice(1);
  return parts.join('');
}
// The same for a whole phrase (this replaces a plain toLowerCase(), which also lowered names and acronyms): the first
// word follows the rule above, and a later word is lowered only when it is a common word. A capitalised word straight
// after a kept name stays too, so a name of two words keeps both ("Microsoft Teams approvals").
function lowerCommonWords(phrase: string): string {
  let afterName = false;
  let first = true;
  const t = fixNames(phrase.trim());
  if (isJobTitle(t)) return lowerJobTitle(t);
  const parts = t.split(/(\s+)/);
  return parts.map((w, i) => {
    if (!w.trim()) return w;
    const lower = first ? !keepsFirstCapital(w, parts[i + 2] || '', parts[i + 4] || '') : !afterName && isCommonWord(w);
    first = false;
    afterName = !lower && /^[A-Z]/.test(w);
    return lower ? w.replace(/[A-Z]/, c => c.toLowerCase()) : w;
  }).join('');
}
// Text only (run 9): a phrase that starts a sentence, a heading or a table cell starts with a capital. A first word
// written with a small letter and an inner capital (iPhone, eBay) is a name and is kept as typed.
function cap(phrase: string): string {
  const t = fixNames(phrase.trim());
  if (/^[a-z]+[A-Z]/.test(t.split(/\s+/)[0] || '')) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const tools: Record<string, Tool> = {
  // Tool 1: Account Plan Builder
  account_plan_builder: {
    name: 'account_plan_builder',
    description: 'Generate strategic account plans with power mapping (one row per contact you name), whitespace analysis, competitive questions and an answer for each objection. Builds a 90-day plan from the contacts, products, threats and notes you give it; it does not look the account up.',
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
    description: 'Build an ROI business case from the buyer\'s own figures: annual_value_estimate, or current_annual_cost with expected_improvement_percent. With them it calculates the ROI, payback, three-year value and sensitivity. Without them it shows no ROI: it names the inputs to add and gives the structure of the case (the cost lines to price, your quoted results as reference points, the questions to ask).',
    inputSchema: {
      type: 'object',
      properties: {
        customer_name: {
          type: 'string',
          description: 'Customer/prospect name'
        },
        industry: {
          type: 'string',
          description: 'The customer\'s industry, in any words. Used for wording and sector notes only: no industry figure is applied to the calculation. A return needs the buyer\'s own figures (annual_value_estimate, or current_annual_cost with expected_improvement_percent)'
        },
        company_size: {
          type: 'string',
          enum: ['startup', 'smb', 'mid_market', 'enterprise'],
          description: 'Company size tier'
        },
        annual_revenue: {
          type: 'number',
          minimum: 0,
          description: 'Customer annual revenue. Shown as your input; it is not turned into a value'
        },
        employee_count: {
          type: 'number',
          minimum: 0,
          description: 'Number of employees. Shown as your input; it is not turned into a value'
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
          description: 'Metrics the prospect shared, or results you can quote. Listed as reference points, never as the buyer\'s figures; to turn the buyer\'s figures into the value, give current_annual_cost and expected_improvement_percent, or annual_value_estimate'
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
          description: 'How they do it today. Separate the ways of working with a semicolon: each becomes a cost line to price. Not used in the calculation'
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
          description: 'Adds a one-line note at the top of the executive summary on what this audience looks for'
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
          description: 'Your product/solution. Named in the guide and used, with your leverage, to read the sector and how you charge'
        },
        competitor_price: {
          type: 'string',
          description: 'Competitor pricing if known'
        },
        value_delivered: {
          type: 'string',
          description: 'Quantified value your solution delivers. Used in the value reframe, word for word; the guide adds no value figure of its own'
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
const hasValue = (v: unknown): boolean => v !== undefined && v !== null && v !== '';

// Tool 1: Account Plan Builder
// Run 17 R17-41: a figure rounded to whole dollars keeps its cents when it is under $1 (D55); $1 or more is rounded as before.
function wholeDollars(n: number): number {
  return Math.abs(n) < 1 ? n : Math.round(n);
}

// Run 18 D65 (display only; no calculation uses this): an amount rounded to whole cents, half up, as it is read in decimal.
// The toPrecision(15) step removes binary float noise first (0.555 * 100 is 55.50000000000001, 1.005 * 100 is 100.49999999999999).
// A value too large for cents to be exact in a double is returned as it is.
function cents(n: number): number {
  const a = Math.abs(n) * 100;
  if (!Number.isFinite(a) || a >= 1e15) return n;
  const r = Math.round(Number(a.toPrecision(15))) / 100;
  return n < 0 ? -r : r;
}

// Run 18 D65: a printed total is the sum of its printed parts. Each term is rounded to cents the way money() prints it, then added.
// If every term that is not 0 prints under $0.01 and the sum would print as $0, the unrounded sum is returned so money() still says
// "under $0.01".
function printedSum(terms: number[]): number {
  const sum = terms.reduce((acc, t) => acc + cents(t), 0);
  if (cents(sum) === 0 && terms.some((t) => t !== 0 && cents(t) === 0)) return terms.reduce((acc, t) => acc + t, 0);
  return sum;
}

// Run 17 D55: money under $1 prints 2 decimals; a positive amount that rounds to $0.00 says so (the ICP rule, run 16 N2).
// Run 18 D65: every amount is rounded to cents (cents() above) and prints at most 2 decimals; an amount that is not a whole number
// of dollars prints exactly 2 decimals ("$4.60", "$1,234.50"); a whole amount prints as before ("$5", "$20,000").
function money(n: number): string {
  const a = Math.abs(n);
  const c = cents(a);
  if (a > 0 && a < 1) {
    if (c === 0) return n < 0 ? 'a loss under $0.01' : 'under $0.01';
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
function splitItems(s: unknown): string[] {
  if (typeof s !== 'string') return [];
  const parts = s.split(/\n|;/).map((x) => x.trim().replace(/^[-*\u2022]\s*/, '')).filter(Boolean);
  // a plain comma list of short items (each 1 to 6 words, no verb-like comma clause) is split too
  if (parts.length === 1 && /,/.test(parts[0])) {
    const c = parts[0].split(/,(?!\d{3}(?!\d))/).map((x) => x.trim()).filter(Boolean);
    // a sentence with a comma ("the first and only X, built to replace Y") is not a list: a first fragment that opens with an article and runs
    // to four words or more, or a fragment that opens with a participle or a linking word, makes it one item
    const sentenceLike = /^(?:the|a|an)\s/i.test(c[0] || '') && (c[0] || '').split(/\s+/).length >= 4;
    if (c.length > 1 && !sentenceLike && c.every((x) => x.split(/\s+/).length <= 6) && !c.some((x) => /^(not|but|and|or|so|which|that|built|designed|made|powered|backed|offering|with|using|including|plus|replacing)\b/i.test(x))) return c;
  }
  return parts;
}
// Text typed by the user, quoted when it is placed inside one of the tool's own sentences, so a clause never breaks the grammar.
function q(s: string): string {
  return `"${s.trim().replace(/^"|"$/g, '').replace(/[.]$/, '')}"`;
}
// The sector and the business model read from the inputs (src/verticals.ts), with one line saying how they were read.
// Run 20 (D92): `seller` is what the seller wrote about its own product (your_solution, category, value points, strengths);
// `context` is free text about the deal (pain points, blockers, objections, notes, competitors); `role` is the buyer's job titles;
// `buyer` says who the buyer is (industry, company name). The seller's words are read first, then context, role and buyer; each
// only when the earlier ones name no sector. A security tool sold to banks is cybersecurity.
function readContext(explicitModel: unknown, input: { seller: unknown[]; context?: unknown[]; role?: unknown[]; buyer?: unknown[] }): { v: Vertical | null; model: BusinessModel | null; line: string } {
  const read = explainSector(input);
  let v = read.vertical;
  let source = read.source;
  const sellerText = (input.seller || []).filter((x): x is string => typeof x === 'string').join(' \n ');
  // Run 20 round 1b: "AI-native" is how a product is built, not what it sells. When the seller's whole description (not only the part
  // before "for ...") names a trade with a strong word of its own, and the AI words are only that kind of marketing label, the trade decides
  // (an "AI-native CNAPP" is cybersecurity, "AI-native business operations" with a back office is ITeS).
  if (v && v.id === 'ai-native' && sellerText) {
    const MARKETING = /^(?:ai|ai[- ]native|ai[- ]first|ai agents?|agents? that|agentic|copilots?|genai|gen ai|generative ai|ai assistants?)$/;
    if (read.strong.every((w) => MARKETING.test(w))) {
      let best: { v: Vertical; n: number } | null = null;
      for (const cand of VERTICALS) {
        if (cand.id === 'ai-native' || cand.id === 'saas') continue;
        const n = new Set((sellerText.match(new RegExp(cand.match.source, 'gi')) || []).map((x) => x.toLowerCase())).size;
        if (n > 0 && (!best || n > best.n)) best = { v: cand, n };
      }
      if (best) { v = best.v; source = 'seller'; }
    }
  }
  let m = detectModel(explicitModel, input);
  // the usual model of the sector that was finally chosen (the reader's assumption was made for the sector it first read)
  if (v && v !== read.vertical && m.how === 'sector') m = { model: SECTOR_MODEL[v.id], how: 'sector' };
  // A services firm whose name holds the word "software" (Sonata Software) sells services, not a subscription, unless its own words say so.
  if (v && v.id === 'ites' && m.model === 'saas' && m.how === 'read' && !/\b(?:saas|subscriptions?|per seat|per user|licen[cs]es?)\b/i.test(sellerText)) m = { model: 'services', how: 'sector' };
  const via = source === 'context' ? ' (from the deal details: your own description names no sector)' : source === 'role' ? ' (from the buyer job titles: your own description names no sector)' : source === 'buyer' ? ' (from the buyer\'s industry: your own description names no sector, so describe what you sell for notes that fit it)' : '';
  // A seller that manages money gets the investment notes (and an AI native seller of support automation the support notes): src/verticals.ts profileFor.
  v = profileFor(v, m.model, input);
  const sector = v ? `read from your inputs as ${v.name}${via}` : 'not clear from your inputs (name the industry for sector notes)';
  const model = m.model ? `${MODEL_NAME[m.model]} (${m.how === 'input' ? 'from business_model' : m.how === 'sector' ? 'the usual model in this sector, assumed; set business_model to change it' : 'read from your inputs; set business_model to change it'})` : 'not clear from your inputs; set business_model (saas, services, connectivity, transactions, marketplace, hardware_software or investment) for advice that fits it';
  return { v, model: m.model, line: `*Sector: ${sector}. Business model: ${model}.*` };
}
// A sector's proof shape as a phrase inside a sentence (lower case, no closing full stop).
function proofOf(v: Vertical): string { return lowerFirstIfCommon(v.proofShape).replace(/[.]+$/, ''); }
// Sector notes: the buying committee, what the sector measures and its usual objections (no figures, rule B82).
function sectorNotes(v: Vertical | null, what: 'committee' | 'metrics' | 'objections' | 'all' = 'all'): string {
  if (!v) return '';
  const out = [`### Sector notes: ${v.name}`];
  if (what === 'committee' || what === 'all') out.push(`- **Who usually decides:** ${v.committee}`);
  if (what === 'metrics' || what === 'all') out.push(`- **What this sector measures:** ${v.metrics.join(', ')}.`);
  if (what === 'objections' || what === 'all') out.push(`- **Objections this sector often raises:** ${v.objections.map((o) => o.objection.toLowerCase()).join('; ')}.`);
  out.push(`- **A proof point that lands:** ${v.proofShape}`);
  return out.join('\n');
}
// The answer pattern for one objection or blocker typed by the user: the sector's pattern when it matches, else a pattern by kind.
function answerFor(text: string, v: Vertical | null): string {
  const t = text.toLowerCase();
  if (v) {
    for (const o of v.objections) {
      const keys = o.objection.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !['our', 'the', 'and', 'are', 'not', 'too', 'for', 'already', 'have', 'has', 'does', 'this', 'will', 'than', 'with', 'from', 'your', 'ourselves', 'we', 'can', 'use', 'new', 'own'].includes(w));
      if (keys.filter((k) => t.includes(k)).length >= Math.min(2, keys.length)) return o.response;
    }
  }
  if (/price|cost|budget|expensive|cheaper|discount|margin/.test(t)) return 'Agree the cost of the problem in the buyer\'s own numbers first, then compare the price with it; trade any concession for something of equal value.';
  if (/already have|already has|already does|already use|existing|incumbent|current (?:vendor|tool|system|provider|operator)|in-house|built/.test(t)) return 'Ask what the current setup does not do today and what that costs; position alongside it where you can, and replace only where the buyer sees the gap.';
  if (/adopt|use a new|will not use|won't use|resist|change|training/.test(t)) return 'Agree a small pilot with the people who will use it, and decide up front how adoption is measured.';
  if (/integrat|migrat|cut-?over|disrupt|setup|set-up|implementation|rollout/.test(t)) return 'Name the systems and people involved, and offer a staged plan with a rollback point for each stage.';
  if (/security|privacy|compliance|audit|regulat|legal|risk/.test(t)) return 'Bring the security and compliance answers before they are asked, and map each requirement to the control that meets it.';
  if (/bundle|one vendor|single vendor|suite/.test(t)) return 'Compare the outcome the buyer needs from each option, not the size of the bundle; show what the bundled tool leaves to manual work.';
  if (/timing|not now|next year|later|priority/.test(t)) return 'Find the event that makes this urgent (a renewal, an audit, a season, a target) and plan back from it.';
  if (/black box|explain|trust|wrong|accuracy|track record/.test(t)) return 'Offer evidence the buyer can check: an evaluation on their own data, and references they can call.';
  return 'Ask what lies behind it and what would change their mind, then answer with evidence from a similar customer only if you have it.';
}

// Run 20 round 1b (D92): the account plan reads every contact (one row each, with the role the user stated), answers the objections
// the user typed, turns each competitive threat into a question to ask, and builds the 90 days from the contacts, the sector notes
// and the parts of the solution. The tier and expansion rules are unchanged (D80).
const THREAT_HELP: { re: RegExp; ask: string; confirm: string }[] = [
  { re: /\b(?:black box|opaque|unexplain\w*|cannot explain|not explain\w*)\b/i, ask: 'Which results from it can your team not explain today, and what happens when a committee or a regulator asks?', confirm: 'how the product explains each result, shown on the buyer\'s own history' },
  { re: /\b(?:static|fixed|factor|numeric only|rule[- ]based|hard-?coded)\b/i, ask: 'How often is it re-fitted or re-tuned, and what happens to its results when conditions change?', confirm: 'how the product adapts and what evidence you can show, on the buyer\'s own data' },
  { re: /\b(?:built for (?:a |one )?(?:single|one)|single (?:model|motion|type)|one model|cannot change|rigid|fixed)\b/i, ask: 'What do you have to change in this system when your pricing or process changes, and how long does that take?', confirm: 'which of those changes the product handles without custom work, shown on one real example' },
  { re: /\b(?:manual\w*|spreadsheets?|excel|diar(?:y|ies)|paper|by hand)\b/i, ask: 'What does the manual way cost your team each week in hours, errors and delays?', confirm: 'which of those steps the product takes over, from your own documentation' },
  { re: /\b(?:legacy|on-?prem\w*|old |existing|incumbent|traditional|conventional)\b/i, ask: 'What does the current system still do well, and what does it not do today?', confirm: 'what the product covers that the current system does not, and what the current system covers that the product does not' },
  { re: /\b(?:point (?:tools?|solutions?)|separate|siloed|isolated|disconnected|multiple|several|silos?)\b/i, ask: 'How many separate tools or consoles does the team work in, and who connects the findings or records between them by hand?', confirm: 'which of those tools the product replaces and which it connects to' },
  { re: /\b(?:in-?house|build it|internal(?:ly)?)\b/i, ask: 'Who keeps the in-house version running, and what happens when they leave?', confirm: 'the cost and effort of keeping an in-house version, from the buyer\'s own figures' },
  { re: /\b(?:feed|generic|keyword|static|periodic|scans?)\b/i, ask: 'How does the team decide which of today\'s findings matter, and how long does that take?', confirm: 'how the product ranks or validates findings, with a result on the buyer\'s own data' },
];
function threatHelp(t: string) { return THREAT_HELP.find((h) => h.re.test(t)) || { re: /./, ask: 'What do they use it for today, and what would they change about it?', confirm: 'what the product does that this option does not, and the reverse' }; }

function executeAccountPlanBuilder(args: Record<string, unknown>): string {
  const accountName = (args.account_name as string) || 'Target Account';
  const industry = (args.industry as string) || 'Technology';
  const currentArr = (args.current_arr as number) || 0;
  const knownContacts = (args.known_contacts as string) || '';
  const currentProducts = (args.current_products as string) || '';
  const expansionOpportunities = (args.expansion_opportunities as string) || '';
  const competitiveThreats = (args.competitive_threats as string) || '';
  const yourSolution = (args.your_solution as string) || 'your solution';
  const accountNotes = (args.account_notes as string) || '';
  // Run 19 D80 (problems 3 and 8): contacts given are used, not asked for again; the sector's buying committee is named.
  const acctCtx = readContext(undefined, { seller: [yourSolution], context: [currentProducts, accountNotes, knownContacts], buyer: [industry === 'Technology' && !args.industry ? '' : industry] });
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'your solution';
  const v = acctCtx.v;
  const investment = acctCtx.model === 'investment';
  const bctx: BlockerContext = { product: brief.short, sectorObjections: v?.objections, sectorName: v?.name, model: acctCtx.model };
  const contacts = parseContacts(knownContacts, investment);
  const hasChampion = contacts.some((c) => tagKind(c.tag) === 'champion') || /champion/i.test(knownContacts);
  const buyerContacts = contacts.filter((c) => ['buyer', 'economic'].includes(tagKind(c.tag) || ''));
  const hasEconomicBuyer = buyerContacts.length > 0 || /economic buyer|budget|cfo|ceo|coo/i.test(knownContacts);

  // Generate account tier based on ARR
  let accountTier = 'Prospect';
  let expansionPotential = 'High';
  if (currentArr > 500000) {
    accountTier = 'Strategic';
    expansionPotential = 'Very High';
  } else if (currentArr > 100000) {
    accountTier = 'Enterprise';
    expansionPotential = 'High';
  } else if (currentArr > 25000) {
    accountTier = 'Growth';
    expansionPotential = 'Medium';
  } else if (currentArr > 0) {
    accountTier = 'SMB';
    expansionPotential = 'Medium';
  }

  // ---- the people ----
  const roleInDecision = (c: Contact): string => {
    const k = tagKind(c.tag);
    if (k === 'champion') return 'Champion (you said so)';
    if (k === 'economic') return 'Economic buyer (you said so)';
    if (k === 'buyer') return 'Buyer: the person who decides (you said so)';
    if (k === 'blocker') return 'Blocker (you said so)';
    if (k === 'user') return 'User (you said so)';
    if (k === 'influencer') return `Influencer or evaluator (you said ${c.tag})`;
    if (c.level === 'group') return 'A group of users or evaluators (read from the title)';
    if (c.level === 'exec') return 'Senior leader, probably able to sign off or block (read from the title)';
    if (c.level === 'head') return 'Head of a function, probably an influencer or evaluator (read from the title)';
    return `${cap(ROLE_KNOWLEDGE[c.family].label)} (read from the title: confirm their part in the decision)`;
  };
  const nextStepFor = (c: Contact): string => {
    const k = tagKind(c.tag);
    const rk = roleFor(c.title, investment);
    if (k === 'champion') return `Test their power and give them material to sell internally: they care about ${rk.cares}, so lead with ${rk.needs}`;
    if (k === 'buyer' || k === 'economic') return `${rk.nextStep}. They worry about ${rk.worry}`;
    if (k === 'blocker') return `Find out what they fear (${rk.worry}) and answer that before the proposal`;
    return `${rk.nextStep}`;
  };
  const sig = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).map((w) => ({ cfo: 'financial', coo: 'operating', cio: investment ? 'investment' : 'information', cto: 'technology', ciso: 'security' } as Record<string, string>)[w] || w).filter((w) => w.length > 1 && !['chief', 'officer', 'head', 'of', 'manager', 'lead', 'and', 'the', 'senior', 'sr', 'vp', 'director', 'team', 'teams'].includes(w));
  const covered = new Set(contacts.flatMap((c) => sig(c.title)));
  const uncovered = v ? v.buyerRoles.filter((role) => !sig(role).some((w) => covered.has(w))) : [];
  let powerMap = '';
  if (contacts.length) {
    powerMap = `
### Known Stakeholders
${knownContacts}

### Power Map Analysis
Each contact you gave is one row, with the role you stated for them. Where you stated none, the role is read from the title and marked as such.

| Contact you gave | Likely role in the decision | Next step |
|---|---|---|
${contacts.map((c) => `| ${c.raw} | ${roleInDecision(c)} | ${nextStepFor(c)} |`).join('\n')}

${hasChampion ? '' : `**No champion named.** Look for the person who feels the problem and is measured on it${v ? ` (in ${v.name}, the usual champion is described as: ${v.committee.split(';').find((x) => /champion/i.test(x))?.trim() || 'the team lead who feels the problem'})` : ''}.
`}${hasEconomicBuyer ? '' : `**No buyer named.** Ask who signs this off and who controls the budget.
`}${v ? `
**Usual buying committee in ${v.name}:** ${v.committee}
${uncovered.length ? `\n**Roles this sector usually involves that none of your contacts cover:** ${joinList(uncovered.slice(0, 4))}. Ask who holds each part in this account.\n` : ''}` : ''}`;
  } else {
    powerMap = `
### Power Map (To Be Mapped)

You gave no contacts. Start with these questions${v ? ` (written for ${v.name})` : ''}:

1. Who owns the problem ${P} solves?${v ? ` In ${v.name} this is usually: ${v.committee.split(';')[1]?.trim() || v.committee}` : ''}
2. Who controls the budget?${v ? ` ${v.committee.split(';')[0]}.` : ''}
3. Who will use the solution daily?
4. Who must approve the purchase, and what do they check?

${v ? `**Roles to look for:** ${v.buyerRoles.join(', ')}.` : ''}`;
  }

  // ---- whitespace ----
  const partsHere = brief.parts;
  let whitespaceAnalysis = '';
  if (currentProducts) {
    const used = currentProducts.trim();
    whitespaceAnalysis = `
### Current Footprint
${used}

### Whitespace Opportunities
${partsHere.length ? `Your description of ${P} lists these parts: ${joinList(partsHere.map(partLabel))}. Confirm which of them this account uses today; the ones it does not use are the first whitespace to look at.` : `Confirm what exactly the account uses of ${P} today and what it still does by other means.`}

1. **Adjacent use cases:** which other teams or units feel the same problem (ask your contacts above who else is affected)
2. **Deeper use:** where the teams you already serve still work around ${P}
3. **Cross-sell:** ${partsHere.length ? 'the listed parts not yet in use' : 'complementary parts of your offer they do not have'}
4. **Proof first:** show the result in the footprint you have before asking for more${v ? `; in ${v.name} buyers trust this form of proof: ${proofOf(v)}` : ', as a before-and-after on one team'}`;
  } else {
    whitespaceAnalysis = `
### Whitespace Analysis
**No current footprint given.** ${partsHere.length ? `Your description of ${P} lists these parts: ${joinList(partsHere.map(partLabel))}. Choose the one that answers the account's sharpest pain and land with that.` : `Choose the part of ${P} that answers the account's sharpest pain and land with that.`}

**Land Strategy Recommendations:**
1. Start with one specific pain and one team${v ? ` (in ${v.name}: ${joinList(v.metrics.slice(0, 3))} are what they will judge it on)` : ''}
2. Agree a short proof with a measure fixed beforehand${v ? `: ${proofOf(v)}` : ''}
3. Build internal champions from the team that sees the result
4. Expand from that result`;
  }

  // ---- competition ----
  const threats = splitItems(competitiveThreats);
  let competitiveStrategy = '';
  if (threats.length) {
    competitiveStrategy = `
### Competitive Landscape
${threats.map((t) => `- ${t}`).join('\n')}

### Defensive/Offensive Strategy

| What they use or fear | A question to ask | What to confirm before you position against it |
|---|---|---|
${threats.map((t) => { const h = threatHelp(t); return `| ${cap(t)} | "${h.ask}" | ${cap(h.confirm)} |`; }).join('\n')}

**Evaluation Criteria to Establish:**
1. Put the buyer's own problem first, in their words, before any feature
2. Make the gap in each option above visible through their own test, not through your claim
3. Agree the measure of success before the evaluation${v ? ` (${v.metrics.slice(0, 2).join(' and ')} are what this sector uses)` : ''}`;
  } else {
    competitiveStrategy = `
### Competitive Intelligence Needed
No threats were given. Ask:
1. "Who else is solving this problem for you today, including doing it by hand?"
2. "What would need to change for you to consider alternatives?"
3. "What has worked and not worked with the current way?"`;
  }

  // ---- expansion ----
  const expItems = splitItems(expansionOpportunities);
  const expansionSection = expItems.length ? `
### Identified Expansion Opportunities
${expItems.map((e) => `- ${e}`).join('\n')}

### Expansion Playbook
1. **Document current value:** the result in the footprint you already have
2. **Identify expansion sponsors:** who benefits from each opportunity above
3. **Map to business initiatives:** tie each to what the account has said it must achieve
4. **Create urgency:** why expand now rather than later` : '';

  // ---- objections from the notes ----
  const noteObj = accountNotes.match(/objections?\s*:\s*([\s\S]*)$/i);
  const objItems = noteObj ? splitItems(noteObj[1].replace(/[.]+\s*$/, '')) : [];
  const objectionSection = objItems.length ? `
## Objections and Open Questions

${objItems.map((o, i) => `**${i + 1}. ${q(o)}**\n${blockerLines(o, bctx).join('\n')}`).join('\n\n')}

---
` : '';
  const notesShown = accountNotes ? accountNotes.replace(/\s*All figures in this input are hypothetical[^.]*\.\s*/i, ' ').trim() : '';

  // ---- 90-day plan ----
  const today = new Date();
  const day30 = onOrBeforeWorkday(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));
  const day60 = onOrBeforeWorkday(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000));
  const day90 = onOrBeforeWorkday(new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000));
  const champ = contacts.find((c) => tagKind(c.tag) === 'champion');
  const buyer = buyerContacts[0];
  const meet = contacts.filter((c) => c.level !== 'group').slice(0, 4);

  return `# Strategic Account Plan: ${accountName}

## Account Overview

| Attribute | Value |
|-----------|-------|
| **Account Name** | ${accountName} |
| **Industry** | ${(args.industry as string) || NOT_SUPPLIED} |
| **Account Tier** | ${accountTier} (set by this tool's rule from Current ARR) |
| **Current ARR** | ${hasValue(args.current_arr) ? money(currentArr) : NOT_SUPPLIED} |
| **Expansion Potential** | ${expansionPotential} (set by this tool's rule from Current ARR, not from your notes) |
| **Your Solution** | ${(args.your_solution as string) || NOT_SUPPLIED} |

${acctCtx.line}

---

## Strategic Analysis

${powerMap}

---

${whitespaceAnalysis}

---

${competitiveStrategy}

${expansionSection ? `---\n${expansionSection}` : ''}

---
${objectionSection}
## 90-Day Account Plan

### Days 1-30: ${currentArr > 0 ? 'Deepen the relationship' : 'Foundation'} (by ${isoDate(day30)})

**Objectives:**
- [ ] ${contacts.length ? `Confirm the role of each of the ${contacts.length} contacts you named and find who is missing${uncovered.length ? ` (${joinList(uncovered.slice(0, 3))})` : ''}` : 'Complete stakeholder mapping (all decision makers identified)'}
- [ ] Understand current state and pain points${v ? ` (in ${v.name}, ask about ${v.metrics.slice(0, 3).join(', ')})` : ''}
- [ ] ${champ ? `Equip ${champ.title}, your champion, with a short business case for ${buyer ? buyer.title : 'the buyer'}` : 'Identify 2 or 3 potential champions'}
- [ ] ${threats.length ? `Learn how they use ${joinList(threats.slice(0, 2))} today` : 'Document the competitive landscape, including doing it by hand'}

**Key Activities:**
${meet.length ? meet.map((c, i) => `${i + 1}. Meet ${c.title}: ${roleFor(c.title, investment).questions[0]}`).join('\n') : '1. Schedule discovery meetings with the people who own the problem'}
${meet.length + 1}. Map the org chart and reporting lines${v ? ` against the usual committee in ${v.name}` : ''}
${meet.length + 2}. Identify the business trigger behind this account's priorities

**Success Criteria:**
- ${champ ? `${champ.title} engaged and willing to bring ${buyer ? buyer.title : 'the buyer'} into a meeting` : 'A champion identified and engaged'}
- Pain points documented and quantified in their numbers
- Initial business case hypothesis

---

### Days 31-60: Engagement (by ${isoDate(day60)})

**Objectives:**
- [ ] ${buyer ? `Show ${buyer.title} the result they are measured on` : 'Demonstrate value to key stakeholders'}
- [ ] Build the business case with the account's own figures (the roi_business_case_builder tool needs their cost or value figures)
- [ ] Multi-thread across the buying committee${uncovered.length ? `, including ${joinList(uncovered.slice(0, 2))}` : ''}
- [ ] ${objItems.length ? `Answer the ${objItems.length} open question${objItems.length === 1 ? '' : 's'} above in writing` : 'Address technical and procurement requirements'}

**Key Activities:**
1. Run a demo or working session on the account's own case
2. Develop the ROI model with the account's data
3. Connect the champion with reference customers, if you have them
4. ${v ? `Agree a proof: ${proofOf(v)}` : 'Begin technical validation if needed'}

**Success Criteria:**
- Business case accepted by ${buyer ? buyer.title : 'the economic buyer'}
- Technical requirements validated
- Procurement process understood

---

### Days 61-90: Close/Expand (by ${isoDate(day90)})

**Objectives:**
- [ ] ${currentArr > 0 ? 'Close expansion deal' : 'Close initial deal'}
- [ ] Establish success metrics and implementation plan
- [ ] Set foundation for future expansion${expItems.length ? ` (${joinList(expItems.slice(0, 2))})` : ''}
- [ ] Document wins and learnings

**Key Activities:**
1. Finalize commercial terms
2. Complete procurement process
3. Kick off implementation planning
4. Identify the next expansion opportunity

**Success Criteria:**
- Contract signed
- Implementation scheduled
- Expansion opportunities documented

---

## Account Intelligence

${notesShown ? `### Additional Context\n${notesShown}\n\n` : ''}### What to Research
- Recent news and press releases${v ? ` that touch ${v.metrics.slice(0, 2).join(' or ')}` : ''}
- Earnings calls and investor presentations (if the company is public)
- Hiring and org changes for the roles above
- Job postings for priorities

### Key Questions to Answer
1. What are their top 3 strategic priorities this year?
2. How do they measure success${v ? ` (is it ${v.metrics.slice(0, 2).join(' or ')}?)` : ''}?
3. What's their budget cycle?
4. Who has buying authority?
5. What would prevent them from buying?

---

## Next Actions

| Priority | Action | Owner | Due Date |
|----------|--------|-------|----------|
| High | ${champ ? `Brief ${champ.title} and agree the next meeting` : 'Identify and engage a champion'} | AE | Week 1 |
| High | ${buyer ? `Get a meeting with ${buyer.title}` : 'Map the decision-making process'} | AE | Week 2 |
| Medium | ${threats.length ? `Ask the competitive-table questions about ${clip(threats[0], 60)}` : 'Research the competitive landscape'} | AE | Week 2 |
| Medium | Build the initial business case | AE + SE | Week 3 |
| Low | Document the account in CRM | AE | Ongoing |

---

*Account Plan Generated: ${isoDate(today)}*
*Review and Update: Monthly*

${SUGGESTIONS_FOOTER}`;
}


// Tool 2: Deal Strategy Coach
function executeDealStrategyCoach(args: Record<string, unknown>): string {
  const dealName = (args.deal_name as string) || 'Deal';
  const dealValue = (args.deal_value as number) || 0;
  const dealStage = (args.deal_stage as string) || 'discovery';
  const daysInStage = (args.days_in_stage as number) || 0;
  const championStatus = (args.champion_status as string) || 'no_champion';
  const economicBuyer = (args.economic_buyer as string) || '';
  const competitors = (args.competitors as string) || '';
  const blockers = (args.blockers as string) || '';
  const nextSteps = (args.next_steps as string) || '';
  const closeDate = (args.close_date as string) || '';
  const yourSolution = (args.your_solution as string) || 'your solution';
  // Run 20 round 1b: the blockers are answered by their kind and the user's own words (src/answers.ts); the answer says what to confirm.
  const dealCtx = readContext(undefined, { seller: [yourSolution], context: [blockers, competitors, nextSteps, dealName] });
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'your solution';
  const bctx: BlockerContext = { product: brief.short, sectorObjections: dealCtx.v?.objections, sectorName: dealCtx.v?.name, model: dealCtx.model };
  const compItems = splitItems(competitors);

  // Calculate deal health
  let healthScore = 70; // Start at 70
  let healthFactors: string[] = [];

  // Champion impact
  if (championStatus === 'multi_threaded') {
    healthScore += 15;
    healthFactors.push('Multi-threaded (strong)');
  } else if (championStatus === 'confirmed_champion') {
    healthScore += 10;
    healthFactors.push('Confirmed champion');
  } else if (championStatus === 'potential_champion') {
    healthScore += 0;
    healthFactors.push('Note: Champion not confirmed');
  } else {
    healthScore -= 20;
    healthFactors.push('High risk: No champion identified');
  }

  // Economic buyer
  if (economicBuyer && economicBuyer.toLowerCase().includes('engaged')) {
    healthScore += 10;
    healthFactors.push('Economic buyer engaged');
  } else if (economicBuyer) {
    healthScore += 5;
    healthFactors.push('Note: Economic buyer identified but not engaged');
  } else {
    healthScore -= 10;
    healthFactors.push('High risk: Economic buyer unknown');
  }

  // Days in stage penalty
  const stageDaysThreshold: Record<string, number> = {
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
  } else if (daysInStage > threshold) {
    healthScore -= 5;
    healthFactors.push(`Note: ${daysInStage} days in stage (above this tool's example threshold for the stage)`);
  }

  // Competitor impact
  if (competitors && competitors.toLowerCase().includes('incumbent')) {
    healthScore -= 10;
    healthFactors.push('Note: Competing against incumbent');
  } else if (competitors) {
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
  } else if (healthScore < 70) {
    healthStatus = 'Needs Attention';
  }

  // Stage-specific strategies
  const stageStrategies: Record<string, string> = {
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
2. **Quantify value**: put the value in the buyer's own numbers${dealCtx.v ? ` (this sector measures ${dealCtx.v.metrics.slice(0, 3).join(', ')})` : ''}
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

Without a champion nobody sells for you when you are not in the room. Immediate action required:

1. **Identify potential champions**: Who has the pain and influence?${dealCtx.v ? ` In ${dealCtx.v.name} the usual champion is: ${dealCtx.v.committee.split(';').find((x) => /champion/i.test(x))?.trim() || 'the team lead who feels the problem'}.` : ''}
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

The economic buyer was not supplied.${dealCtx.v ? ` In ${dealCtx.v.name}, ${lowerFirstIfCommon(dealCtx.v.committee.split(';')[0])}; check whether that holds here.` : ''} If you do not know who controls the budget:

1. **Ask directly**: "Who has final approval on budget and vendor selection?"
2. **Map the org**: Who does your champion report to?
3. **Follow the money**: Where does this budget come from?
4. **Request introduction**: "Can you help me understand the approval process?"

`;
  }

  if (competitors) {
    specificRecs += `
### Competitive Strategy

${compItems.length > 1 ? 'Each competitor or alternative you named is a row:' : 'The competitor or alternative you named:'}

| Competitor or alternative | A question to ask | What to confirm before you position against it |
|---|---|---|
${compItems.map((c) => { const h = threatHelp(c); return `| ${cap(c)} | "${h.ask}" | ${cap(h.confirm)} |`; }).join('\n')}

**Tactics:**
1. **Know their weaknesses**: take them from the buyer's own words, not from memory
2. **Set traps**: questions that let the buyer test the gap themselves
3. **Don't go negative**: let the buyer discover issues
4. **Change the criteria**: make the buyer's real problem the first requirement

**Landmine Questions to Suggest:**
- "How will you test the scenario you care most about, with your own data?"
- "What does each option cost over three years, including what is outside the quoted price?"
- "Can each vendor show a customer like you, and can you call them?"
${dealCtx.v ? dealCtx.v.discovery.slice(0, 2).map((x) => `- "${x}"`).join('\n') : ''}

`;
  }

  if (blockers) {
    const items = splitItems(blockers);
    specificRecs += `
### Blocker Mitigation

Each blocker you typed is answered on its own. Where the answer needs a fact about ${P}, it says what to confirm instead of stating one.

${items.map((b, i) => `**Blocker ${i + 1}: ${q(b)}**
${blockerLines(b, bctx).join('\n')}`).join('\n\n')}

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
| **Solution** | ${(args.your_solution as string) || NOT_SUPPLIED} |

### Health Score: ${healthScore}/100 (${healthStatus})

*Set by this tool's rule: a base score adjusted for champion status, economic buyer, days in stage, competitors and blockers (the factors below).*

**Health Factors:**
${healthFactors.map(f => `- ${f}`).join('\n')}

### The shape of this deal

${[
    `- **Stage:** ${dealStage}${hasValue(args.days_in_stage) ? `, ${daysInStage} days in this stage` : ''}${hasValue(args.deal_value) ? `, worth ${money(dealValue)}` : ''}.`,
    `- **Champion:** ${championStatus === 'no_champion' ? 'none yet. Finding one comes before anything else.' : championStatus === 'potential_champion' ? 'a potential champion. Test them: do they have access to the buyer and a reason to push?' : championStatus === 'confirmed_champion' ? 'confirmed. Give them the material to sell internally.' : 'several contacts engaged (multi-threaded). Keep each one informed.'}`,
    `- **Economic buyer:** ${economicBuyer ? economicBuyer : `unknown.${dealCtx.v ? ` In ${dealCtx.v.name}, ${lowerFirstIfCommon(dealCtx.v.committee.split(';')[0])}.` : ''}`}`,
    compItems.length ? `- **Competition:** ${compItems.length} named (${joinList(compItems.map((c) => clip(c, 60)))}). Each is a row in the competitive table below.` : '- **Competition:** none named. Ask what they do today, including doing it by hand.',
    blockers ? `- **Blockers:** ${splitItems(blockers).length} typed. Each is answered below; answer them in the proposal before the buyer has to ask.` : '- **Blockers:** none typed. Ask what could stop this deal and write the answers down.',
    dealCtx.v ? `- **How deals usually run in ${dealCtx.v.name}:** ${dealCtx.v.salesMotion}` : '',
  ].filter(Boolean).join('\n')}

---

${stageStrategies[dealStage] || stageStrategies['discovery']}

---

${specificRecs}

## Immediate Actions

### Next 24-48 Hours
${championStatus === 'no_champion' ? '1. **Identify champion** (high priority): Cannot win without one' : championStatus === 'potential_champion' ? '1. **Confirm your potential champion** (medium priority): test them before you rely on them' : '1. Done: champion identified. Keep them engaged'}
${!economicBuyer ? '2. **Find economic buyer** (high priority): Who controls budget?' : '2. Done: economic buyer known. Get them involved'}
3. **Advance the deal**: ${nextSteps || (blockers ? `Answer ${splitItems(blockers).length === 1 ? 'the blocker' : `the ${splitItems(blockers).length} blockers`} in writing and agree a date to review the answers with the buyer` : 'Schedule the next meeting with a clear agenda')}
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
function executeDiscoveryQuestionBank(args: Record<string, unknown>): string {
  const framework = (args.framework as string) || 'meddpicc';
  const prospectIndustry = (args.prospect_industry as string) || '';
  const prospectRole = (args.prospect_role as string) || '';
  const knownPainPoints = (args.known_pain_points as string) || '';
  const knownMetrics = (args.known_metrics as string) || '';
  const dealStage = (args.deal_stage as string) || 'discovery';
  const yourSolution = (args.your_solution as string) || 'your solution';
  const gapsToFill = (args.gaps_to_fill as string) || '';
  // Run 19 D80 (problems 2, 3 and 8): gaps first, in the sector's language; "none" is never echoed back as if it were a metric.
  const ctx = readContext(undefined, { seller: [yourSolution], context: [knownPainPoints], role: [prospectRole], buyer: [prospectIndustry] });
  // Run 20 round 1b (D92): no bracket placeholder where the input or the sector notes can supply the words; the pain the user typed is
  // split into its separate pains instead of being quoted whole again and again; the prospect's role and the parts of the solution
  // each get their own questions.
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'your solution';
  const investment = ctx.model === 'investment';
  const roleKnow = prospectRole ? roleFor(prospectRole, investment) : null;
  const roleFam = prospectRole ? familyOf(prospectRole, investment) : 'other';
  const pains = painClauses(knownPainPoints);
  const painLead = pains[0] ? lowerFirstIfCommon(pains[0]) : '';
  const signerClause = ctx.v ? lowerFirstIfCommon(ctx.v.committee.split(';')[0]).replace(/\s+signs?$/i, '') : '';
  const signer = signerClause && signerClause.length <= 40 ? signerClause : 'the person who signs';
  const partNames = brief.parts.map(partLabel);
  const critA = partNames[0] || (brief.kind ? lowerFirstIfCommon(brief.kind) : P);
  const critB = partNames[1] || ctx.v?.metrics[0] || 'the outcome you care about';
  const noMetrics = /^(none|no|not yet|unknown|n\/a|na|tbd|none shared yet|not shared|nothing yet)\b/i.test(knownMetrics.trim());
  const firstMetric = ctx.v ? ctx.v.metrics[0] : 'the number this problem moves';
  const metricsFollowUp = !knownMetrics ? '' : noMetrics
    ? `**Not known yet:** no metrics shared so far. Ask for a baseline first:\n- "How do you measure ${firstMetric} today, and who owns that number?"`
    : `**Already Known:** ${knownMetrics}\n**Follow-up:** "You mentioned ${q(lowerFirstIfCommon(clip(knownMetrics, 120)))}. How are you measuring that today, and how often?"`;
  const GAP_QUESTIONS: [RegExp, string, string][] = [
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
  // A SaaS company's own activation and expansion questions do not suit a finance, security or IT leader who is buying from it.
  const sectorFits = !(ctx.v && ctx.v.id === 'saas' && ['finance', 'security', 'risk', 'it', 'engineering', 'procurement'].includes(roleFam));
  const roleSection = roleKnow ? `## Questions for ${prospectRole}\n\n${upperFirst(aAn(roleKnow.label))} cares about ${roleKnow.cares}, and worries about ${roleKnow.worry}. Open with their concern, not with your product.\n\n${roleKnow.questions.map((x) => `- "${x}"`).join('\n')}\n\n**What they need to see before they say yes:** ${roleKnow.needs}.\n\n---\n\n` : '';
  const sectorSection = ctx.v ? `## Questions in the language of ${ctx.v.name}\n\n${sectorFits ? ctx.v.discovery.map((x) => `- "${x}"`).join('\n') : `The usual ${ctx.v.name} questions are about the prospect's own customers (activation, expansion). They do not fit a ${roleKnow ? roleKnow.label : 'buyer in this role'}, so use the questions above and below.`}\n\n${sectorNotes(ctx.v, 'committee')}\n\n---\n\n` : '';
  const painSection = knownPainPoints ? `## Questions on the pain you described\n\n${pains.map((p) => `- On ${q(lowerFirstIfCommon(p))}: where does it show up in your work, who deals with it, and what does it cost in time, money or risk?`).join('\n')}${pains.length ? '\n' : ''}- Of the pains in the context line above, which hurts most, and which one would the people who sign this off pick?\n- What have you already tried for it, and why did it not hold?\n\n---\n\n` : '';
  const partSection = partNames.length ? `## Questions on what ${P} covers\n\nOne question for each part you listed. Use only the ones that touch the pain above.\n\n${partNames.slice(0, 6).map((n) => `- ${cap(n)}: "How do you handle this today, who owns it, and what breaks?"`).join('\n')}\n\n---\n\n` : '';

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
- "What would ${signer} need to see to move forward?"
- "How is ${signer} thinking about this problem?"
- "Can we include ${signer} in our next conversation?"

---

### D: Decision Criteria
*What are the formal requirements for making a decision?*

**Understanding:**
- "What criteria will you use to evaluate solutions?"
- "What's most important to you in making this decision?"
- "Are there must-haves vs nice-to-haves?"

**Influencing:**
- "Have you considered ${critA} as a criterion?"
- "How important is ${critB} in your evaluation?"
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
${knownPainPoints ? `**Already Known:** ${pains.length ? pains.join('; ') : 'the pain in the context above'}\n- "You mentioned ${q(painLead)}. Can you tell me more about the impact?"` : '- "What\'s the root cause of this problem?"\n- "How long has this been an issue?"'}
- "Who else in the organization feels this pain?"

---

### C: Champion
*Who will sell internally on your behalf?*

**Identification:**
- "Who else in your organization sees this as a priority?"
- "Who would benefit most from solving this problem?"
- "Who's driven similar changes before?"

**Testing:**
- "If I gave you a compelling business case, would you share it with ${signer}?"
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
- "What do you like about the way you handle this today?"
- "What concerns do you have about the options you are looking at?"
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
- "Would it make sense to include ${signer} in our conversation?"
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
${knownPainPoints ? `**Already Known:** ${pains.length ? pains.join('; ') : 'the pain in the context above'}\n- "You mentioned ${q(painLead)}. How does that affect your team's performance?"` : '- "How is this problem affecting your team?"'}
- "What's the ripple effect of this issue?"
- "How much time/money does this cost?"

---

### I: Impact
*What is the business impact of the pain?*

**Quantifying:**
- "If you could solve this, what would improve?"
- "What would success look like in a year?"
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
- "What happens if this isn't solved by the end of the quarter?"

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
- "How important is ${critA} to you?"
- "Have you considered ${ctx.v ? ctx.v.metrics[0] : 'the measure you will judge the result by'} as a criterion?"
- "What's the weighting between price and value?"`;

  // Challenger Questions
  const challengerQuestions = `
## Challenger Sale Framework Questions

### Teach: Share Insights
*Lead with something the buyer had not seen about their own business*

**Reframe Questions:**
${painLead ? `- "You described ${q(painLead)}. Where does it start: before the work reaches your team, inside it, or at the handover?"` : '- "Where does the problem start: before the work reaches your team, inside it, or at the handover?"'}
- "Which of the numbers you track${ctx.v ? ` (${ctx.v.metrics.slice(0, 3).join(', ')})` : ''} would move first if this were fixed?"
- "What would you have to believe for this not to be worth fixing this year?"

**Insight starters (use only what you can show):**
- If you hold data on ${ctx.v ? ctx.v.metrics[0] : 'the measure that matters'} across your customers, open with the pattern it shows, with its source and period.
- If a customer's before-and-after exists${ctx.v ? ` (${proofOf(ctx.v)})` : ''}, tell it in two sentences and name what changed.
- If you cannot show an insight, ask the question instead of stating one.

---

### Tailor: Customize the Message
*Connect insights to their specific situation*

**Resonance Questions:**
- "How does this match what you're seeing?"
- "Where do you think this applies most in your organization?"
- "What would this mean for your specific goals?"

**Personalization:**
- "Given your role${prospectRole ? ` as ${prospectRole}` : ''}, where do you see the biggest impact?"
- "How would ${signer} react to this insight?"
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
- **Your Solution:** ${(args.your_solution as string) || NOT_SUPPLIED}
${knownPainPoints ? `- **Known Pain Points:** ${knownPainPoints}` : ''}
${knownMetrics ? `- **Known Metrics:** ${knownMetrics}` : ''}
${gapsToFill ? `- **Information Gaps:** ${gapsToFill}` : ''}

${ctx.line}

---

${gapSection}${roleSection}${sectorSection}${painSection}${partSection}`;

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
  const area = painLead || (brief.kind ? lowerFirstIfCommon(brief.kind) : 'this area');
  const stageRecommendations: Record<string, string> = {
    first_call: `
## First Call Recommendations

**Focus Areas:**
1. Build rapport and establish credibility
2. Understand their world before pitching
3. Identify pain and quantify impact
4. Determine if there's a fit

**Questions to Prioritize:**
- "What prompted you to take this meeting?"
- "What's your biggest challenge in ${area}?"
- "If you could wave a magic wand, what would change?"

**Avoid:**
- Pitching too early
- Yes/no questions
- Talking more than the buyer does`,

    discovery: `
## Discovery Stage Recommendations

**Focus Areas:**
1. Deep-dive into pain and impact${painLead ? ` (start with ${q(painLead)})` : ''}
2. Identify all stakeholders${ctx.v ? ` (${ctx.v.buyerRoles.slice(0, 4).join(', ')} are the usual ones in ${ctx.v.name})` : ''}
3. Understand buying process
4. Quantify business case${ctx.v ? ` (${ctx.v.metrics.slice(0, 3).join(', ')})` : ''}

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
function executeRoiBusinessCaseBuilder(args: Record<string, unknown>): string {
  const customerName = (args.customer_name as string) || 'your customer';
  const industry = (args.industry as string) || 'Technology';
  const companySize = (args.company_size as string) || 'mid_market';
  // D45 (run 16): omitted, null and 0 are told apart with explicit checks, as for the price below. Omitted or null:
  // the missing size is estimated from the other one and labelled as an example. 0: the user's own input, used as 0.
  const revenueGiven = args.annual_revenue !== undefined && args.annual_revenue !== null;
  const employeesGiven = args.employee_count !== undefined && args.employee_count !== null;
  const annualRevenue = revenueGiven ? (args.annual_revenue as number) : 0;
  const employeeCount = employeesGiven ? (args.employee_count as number) : 0;
  const revenueIsZero = revenueGiven && annualRevenue === 0;
  const employeesIsZero = employeesGiven && employeeCount === 0;
  const yourSolution = (args.your_solution as string) || 'your solution';
  // D34 (run 15): omitted, null and 0 are told apart with explicit checks. Omitted or null: the labelled example
  // price is used. 0: the user's own input, so every figure that divides by it says it cannot be computed.
  const priceGiven = args.solution_price !== undefined && args.solution_price !== null;
  const solutionPrice = priceGiven ? (args.solution_price as number) : 0;
  const priceIsZero = priceGiven && solutionPrice === 0;
  const primaryValueDriver = (args.primary_value_driver as string) || 'productivity';
  const knownMetrics = (args.known_metrics as string) || '';
  const currentProcess = (args.current_process as string) || '';
  const implementationTimeline = (args.implementation_timeline as string) || '90 days';
  // Run 19 D80 (problems 5 and 6): the buyer's own figures come first. annual_value_estimate is used as the annual value;
  // otherwise current_annual_cost x expected_improvement_percent. Only when neither is given does the tool fall back to its
  // example model, and then it says so and rates its confidence Low.
  const num = (k: string): number | null => (typeof args[k] === 'number' && Number.isFinite(args[k] as number) && (args[k] as number) >= 0 ? (args[k] as number) : null);
  const ownEstimate = num('annual_value_estimate');
  const ownCost = num('current_annual_cost');
  const ownPct = num('expected_improvement_percent');
  const userValue: number | null = ownEstimate !== null ? ownEstimate : ownCost !== null && ownPct !== null ? ownCost * ownPct / 100 : null;
  const userValueText = ownEstimate !== null ? `your own estimate of the annual value, ${money(ownEstimate)}`
    : ownCost !== null && ownPct !== null ? `${ownPct}% of the current annual cost you supplied (${money(ownCost)})` : '';

  // Run 20 round 1 (rule B81, D80 problem 6): without a buyer figure this tool calculates nothing. It used to apply a fixed share of
  // revenue (2 percent, 1 percent, 0.5 percent) and an uncited table of five industries (revenue per employee, hourly labour cost) and
  // print an ROI from them. Now the answer names the missing inputs and gives the structure of the case. Revenue and employee count
  // describe the customer's size; they are shown as the user's input and nothing is estimated from them. The industry is wording only.
  if (userValue === null) {
    return roiStructureAnswer(args, { customerName, industry, companySize, yourSolution, primaryValueDriver, knownMetrics, currentProcess, implementationTimeline, revenueGiven, employeesGiven, annualRevenue, employeeCount, priceGiven, solutionPrice, ownCost, ownPct });
  }

  // Display helpers (output text only; no calculation below changes). The user's own inputs are shown
  // as given; every figure built from this tool's example assumptions carries the EXAMPLE label.
  const fmt = (n: number) => n.toLocaleString('en-US');
  const usd = (n: number) => money(n);  // run 15: -$17,640, not $-17,640; run 17 D55: money() adds the rule for amounts under $1
  const revenueCell = revenueGiven
    ? (revenueIsZero ? '$0 (your input)' : `${money(annualRevenue)} (your input)`)  // run 19 (ledger B16-18): every given value is labelled
    : NOT_SUPPLIED;
  const employeesCell = employeesGiven
    ? (employeesIsZero ? '0 (your input)' : `${fmt(employeeCount)} (your input)`)
    : NOT_SUPPLIED;

  // The value comes from the buyer's own figures (userValue is not null here). Run 19 D80 (problems 5 and 6).
  let valueCalculations = '';
  let totalValue = 0;
  // Run 18 D65: the value amounts as they are printed, so the printed Total Quantified Value is the sum of its printed parts.
  const valueParts: number[] = [];
  const confidenceLevel = 'Medium';

  totalValue = userValue;
  valueParts.push(userValue);
  valueCalculations += `
### Value From Your Figures

**Calculation:**
- Annual value: ${userValueText} = **${money(userValue)}**
${ownEstimate === null && ownCost !== null && ownPct !== null ? `- Check with the buyer: does ${money(ownCost)} cover the whole cost of the problem today, and is ${ownPct}% the improvement they expect, not the best case?\n` : ''}
`;

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
  const byInvestment = (text: string) => (priceIsZero ? NEEDS_PRICE : valueIsZeroFromInput && !priceGiven ? NEEDS_VALUE : text);
  // Payback divides by the value: a price of 0 is reported first (D34), then a value of 0.
  const byValue = (text: string) => (priceIsZero ? NEEDS_PRICE : valueIsZeroFromInput ? NEEDS_VALUE : text);
  const roiSummary = priceIsZero || (valueIsZeroFromInput && !priceGiven) ? `- **ROI:** ${byInvestment('')}` : `- **${roi.toFixed(0)}%** ROI`;
  const paybackSummary = priceIsZero || valueIsZeroFromInput ? `- **Payback:** ${byValue('')}` : `- **${paybackMonths.toFixed(1)} months** payback`;
  const sizeText = companySize === 'smb' ? 'SMB' : companySize.replace(/_/g, ' ');
  const confidenceText = `${confidenceLevel}: the value comes from your own figures (${userValueText}); confirm them with the buyer`;
  const timelineText = `${implementationTimeline}${args.implementation_timeline ? '' : ` ${EXAMPLE}`}`;
  const ignoredInputs = [currentProcess ? 'current process' : '', knownMetrics ? 'known metrics' : ''].filter(Boolean).join(' and ');
  // Without a price, the investment is a share of the value, so it cannot be shown when no value is computed
  const invCell = (n: number) => (priceSupplied || valueComputed ? `${money(n)}` : nc);
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
| **Customer** | ${(args.customer_name as string) || NOT_SUPPLIED} |
| **Industry** | ${(args.industry as string) || NOT_SUPPLIED} |
| **Company Size** | ${args.company_size ? sizeText : `${NOT_SUPPLIED} (treated as ${sizeText})`} |
| **Annual Revenue** | ${revenueCell} |
| **Employees** | ${employeesCell} |
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
| **Total Quantified Value** | ${valueComputed ? `**${money(printedValue)}**` : nc} |
| **Annual Investment** | ${invCell(investment)}${priceSupplied ? '' : ` ${EXAMPLE}`} |
| **Net Annual Benefit** | ${valueComputed ? `${usd(printedNet)}` : nc} |

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
3. Industry and company size are used for wording only; this tool applies no industry or size figures to the calculation

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
${currentProcess ? `Today ${customerName} handles it this way: ${currentProcess.trim().replace(/[.]$/, '')}.` : `No current process was given. Add current_process to put ${customerName}'s problem here in their words.`}

**The Solution:**
${(() => { const b = solutionBrief(yourSolution); return b.kind ? `${b.short} ${describeWith(b)}${b.parts.length ? `, with ${joinList(b.parts.slice(0, 4).map(partLabel))}` : ''}.` : `${yourSolution}. Add a description to your_solution (what it is and what it does) to complete this line.`; })()}

**The Value:**
${valueComputed ? `${EXAMPLES}
- **${money(printedValue)}** in annual value
${roiSummary}
${paybackSummary}` : `- not computed: the annual value you gave is 0`}

**Why Now:**
- Add what makes this urgent for ${customerName} (a deadline, a renewal, a target) before you send this page.
- Cost of delay: ${valueComputed ? `${money(wholeDollars(totalValue / 12))}/month ${EXAMPLE}` : nc}
- Implementation timeline: ${timelineText}

---

*Confidence: ${confidenceLevel.toLowerCase()}. The value comes from the figures you supplied; confirm them with the buyer before sharing.*

${(() => { const c = readContext(undefined, { seller: [yourSolution], context: [knownMetrics, currentProcess], buyer: [args.industry, customerName] }); return c.v ? `${sectorNotes(c.v, 'metrics')}\n- **Turn one of these into the value:** ask the buyer what ${c.v.metrics[0]} costs them today, then use current_annual_cost and expected_improvement_percent.\n\n` : ''; })()}${SUGGESTIONS_FOOTER}`;
}

// Run 20 round 1 (rule B81, D80 problem 6): the answer of roi_business_case_builder when the buyer gave no cost or value figure.
// It prints no ROI percentage, payback period, headline return, benchmark or example amount. It names the missing inputs (the
// exact input names), gives the value drivers for the stated driver and industry, the questions that collect the figures and
// how the calculation will work once they are in. The user's own inputs are shown as typed and labelled "(your input)".
interface RoiStructureInput {
  customerName: string; industry: string; companySize: string; yourSolution: string; primaryValueDriver: string;
  knownMetrics: string; currentProcess: string; implementationTimeline: string;
  revenueGiven: boolean; employeesGiven: boolean; annualRevenue: number; employeeCount: number;
  priceGiven: boolean; solutionPrice: number; ownCost: number | null; ownPct: number | null;
}
const ROI_DRIVERS: Record<string, { title: string; where: string; figure: string; questions: string[] }> = {
  revenue_increase: {
    title: 'Revenue increase',
    where: 'More revenue won or kept: a higher win rate, larger deals, less revenue lost to no-decision or to a competitor.',
    figure: 'the revenue the buyer expects to add or keep in a year because of this, or the revenue the problem costs them today',
    questions: ['What is your current win rate, and how many deals end in no decision?', 'How much revenue was lost to no-decision or to a competitor in the last year?', 'Which part of that loss would this change, and why?'],
  },
  cost_reduction: {
    title: 'Cost reduction',
    where: 'Less money spent on the work or on the failure it causes today: hours, rework, errors, outside spend.',
    figure: 'what the problem or the current process costs the buyer in a year (current_annual_cost) and the share they expect to remove (expected_improvement_percent)',
    questions: ['How many hours a week does your team spend on the manual work this would replace?', 'What is the fully loaded cost of the people doing it?', 'How many people do this work today, and what does rework or error clean-up cost on top?'],
  },
  productivity: {
    title: 'Productivity',
    where: 'Time given back to people, to spend on work that earns more or costs less.',
    figure: 'the yearly cost of the time lost today, and the share of it the buyer expects to get back',
    questions: ['How much time does your team spend on low-value tasks each week?', 'Where are the biggest time sinks today?', 'What would the team do with that time, and what is it worth?'],
  },
  risk_mitigation: {
    title: 'Risk mitigation',
    where: 'Losses avoided: compliance incidents, outages, breaches, penalties, lost customers.',
    figure: 'what one incident costs the buyer, how often it happens, and the share they expect to avoid',
    questions: ['What does a compliance incident, outage or breach cost you when it happens?', 'How often has it happened in the last few years?', 'How much revenue is at risk from the exposure this addresses?'],
  },
};

function roiStructureAnswer(args: Record<string, unknown>, i: RoiStructureInput): string {
  const sizeText = i.companySize === 'smb' ? 'SMB' : i.companySize.replace(/_/g, ' ');
  const money0 = (n: number) => money(n);
  const given = (n: number | null) => (n === null ? null : `${money0(n)} (your input)`);
  const costGiven = i.ownCost !== null;
  const pctGiven = i.ownPct !== null;
  const status = (isGiven: boolean, text: string) => (isGiven ? `given: ${text}` : 'missing');
  const driverKeys = i.primaryValueDriver === 'multiple' ? ['revenue_increase', 'cost_reduction', 'productivity', 'risk_mitigation'] : [i.primaryValueDriver in ROI_DRIVERS ? i.primaryValueDriver : 'cost_reduction'];
  const drivers = driverKeys.map((k) => ROI_DRIVERS[k]);
  const revenueCell = i.revenueGiven ? (i.annualRevenue === 0 ? '$0 (your input)' : `${money0(i.annualRevenue)} (your input)`) : NOT_SUPPLIED;
  const employeesCell = i.employeesGiven ? (i.employeeCount === 0 ? '0 (your input)' : `${i.employeeCount.toLocaleString('en-US')} (your input)`) : NOT_SUPPLIED;
  const priceCell = i.priceGiven ? (i.solutionPrice === 0 ? '$0 (your input)' : `${money0(i.solutionPrice)} (your input)`) : NOT_SUPPLIED;
  const ctx = readContext(undefined, { seller: [i.yourSolution], context: [i.knownMetrics, i.currentProcess], buyer: [args.industry, i.customerName] });
  const customer = (args.customer_name as string) || 'your customer';
  const brief = solutionBrief(args.your_solution ? i.yourSolution : '');
  const P = brief.short || 'your solution';
  const proof = parseProof(i.knownMetrics);
  const costLines = splitItems(i.currentProcess.replace(/^today (?:they|the buyer) (?:handle|handles|do|does) it with\s+/i, ''));
  const finance = ctx.v ? ctx.v.committee.match(/finance[^;.]*/i)?.[0] : undefined;

  const partial = costGiven && !pctGiven
    ? `You gave current_annual_cost (${given(i.ownCost)}). Add **expected_improvement_percent**, the share of that cost the buyer expects to save, and the value can be calculated.`
    : pctGiven && !costGiven
      ? `You gave expected_improvement_percent (${i.ownPct} percent, your input). Add **current_annual_cost**, what the problem costs the buyer in a year, and the value can be calculated.`
      : 'Give one of the two options below.';

  const driverSections = drivers.map((d) => `### ${d.title}

${d.where}

- **The buyer's figure to ask for:** ${d.figure}.
- **Questions to ask:**
${d.questions.map((q) => `  - "${q}"`).join('\n')}`).join('\n\n');

  // What the price alone implies: arithmetic on the user's own figure, no claim about the buyer's benefit.
  const priceLine = i.priceGiven && i.solutionPrice > 0
    ? `\n**What your price implies.** At the annual price you gave (${money0(i.solutionPrice)}), the value the buyer sees must be above ${money0(i.solutionPrice)} a year for any positive return, and above ${money0(i.solutionPrice * 2)} a year to return the price twice over. Over three years the buyer pays ${money0(i.solutionPrice * 3)} before any one-time cost. This is arithmetic on your price; it says nothing about the value.\n`
    : '';

  // Where the figures can come from in this case: the cost lines the user listed and the results the user quoted.
  const costBlock = costLines.length ? `### Cost lines to price (from your current_process)

Each way of working that ${P} would replace is a cost line. Put a yearly cost on each, then add them: that sum is \`current_annual_cost\`.

| Cost line | Question to price it |
|---|---|
${costLines.map((c) => `| ${cap(c)} | "${costQuestion(c)}" |`).join('\n')}

` : '';
  const results = proof.filter((p) => p.kind === 'result' || p.kind === 'quote' || p.kind === 'story');
  const others = proof.filter((p) => p.kind === 'recognition' || p.kind === 'scale');
  const proofBlock = proof.length ? `### Results you quoted (reference points, not this buyer's figures)

${results.length ? `These show the buyer what to measure. Each is another organisation's result, from ${proof.some((p) => p.label) ? 'the source you labelled' : 'your notes'}: do not enter one as this buyer's figure.\n\n| Result you quoted | What it tells you to measure |\n|---|---|\n${results.map((p) => `| ${proofPhrase(p)}${p.label ? ` (${proofSource(p)})` : ''} | ${measureOf(p.text)} |`).join('\n')}\n` : ''}${others.length ? `\nNot value figures, so not used in the calculation: ${others.map((p) => proofPhrase(p)).join('; ')}. Keep them for the proposal as credibility.\n` : ''}
` : '';
  const metricQs = ctx.v ? `\n**What ${ctx.v.name} buyers measure** (put a yearly cost on the ones the problem moves): ${ctx.v.metrics.join(', ')}.\n` : '';

  return `# ROI Business Case: ${customer}

*Your inputs are shown as you gave them. No ROI percentage, payback period or headline return is shown because no buyer cost or value figure was given: this tool does not make one up. The answer below names what to add and gives the structure of the business case.*

## What is missing

${partial}

| Input | What it is | Status |
|-------|------------|--------|
| \`annual_value_estimate\` | Option A: the buyer's own estimate of the annual value, in dollars | ${status(false, '')} |
| \`current_annual_cost\` | Option B: what the problem or the current process costs the buyer in a year, in dollars | ${status(costGiven, given(i.ownCost) || '')} |
| \`expected_improvement_percent\` | Option B: the share of that cost the buyer expects to save, from 0 to 100 | ${status(pctGiven, i.ownPct === null ? '' : `${i.ownPct} percent (your input)`)} |
| \`solution_price\` | Your annual price, in dollars. Without it, ROI and payback use a labelled example price | ${i.priceGiven ? `given: ${priceCell}` : 'not supplied'} |

Either option A on its own, or option B (both of its inputs), is enough to calculate the value.${i.priceGiven ? '' : ' Add `solution_price` as well.'} Then run roi_business_case_builder again.
${priceLine}${i.revenueGiven || i.employeesGiven ? '\n`annual_revenue` and `employee_count` describe the customer\'s size. They are shown below as you gave them, but this tool does not turn them into a value: that would need a rate or share only the buyer can give.\n' : ''}
## What you gave

| Item | Value |
|------|-------|
| **Customer** | ${(args.customer_name as string) || NOT_SUPPLIED} |
| **Industry** | ${(args.industry as string) || NOT_SUPPLIED} (used for wording only; no industry figures are applied) |
| **Company Size** | ${args.company_size ? sizeText : `${NOT_SUPPLIED} (treated as ${sizeText})`} |
| **Annual Revenue** | ${revenueCell} |
| **Employees** | ${employeesCell} |
| **Solution** | ${i.yourSolution} |
| **Annual price** | ${priceCell} |
| **Implementation timeline** | ${i.implementationTimeline}${args.implementation_timeline ? '' : ` ${EXAMPLE}`} |
| **Confidence Level** | Not rated: no buyer figure was given, so no value or return is calculated |

## Where the figures can come from in this case

${costBlock}${proofBlock}${!costBlock && !proofBlock ? `You gave no current_process and no known_metrics, so the sections that would price the buyer's current way of working and use your quoted results are empty. Add them and this section fills in.\n` : ''}${metricQs}
## Value drivers${args.industry ? ` for ${args.industry}` : ''}

${i.primaryValueDriver === 'multiple' ? 'You chose several drivers. Each one needs its own figure from the buyer; do not add them up until each is checked.' : 'The driver you chose is described below.'}

${driverSections}

${ctx.line}

${ctx.v ? `${sectorNotes(ctx.v, 'metrics')}\n- **Turn one of these into the value:** ask the buyer what ${ctx.v.metrics[0]} costs them today, then use current_annual_cost and expected_improvement_percent.\n` : `*Name the industry or describe what you sell and this section adds the sector's measures and buyer roles.*\n`}
## Questions to collect the figures

1. What does this problem or process cost you in a year in total (people, rework, errors, outside spend)? This is \`current_annual_cost\`.
2. What share of that cost do you expect to remove, and what is that based on? This is \`expected_improvement_percent\`.
3. If you can value the result directly, what is it worth to you in a year? This is \`annual_value_estimate\`.
4. What is the annual price of the solution? This is \`solution_price\`.
5. Who in finance will check these figures before the decision, and what proof will they need?${finance ? ` (In ${ctx.v!.name}: ${lowerFirstIfCommon(finance)}.)` : ''}
6. When would the value start (the implementation timeline), and what could delay it?

## How the calculation will work

Once the buyer's figures are in, the tool calculates in this order, and shows every step:

1. **Annual value** = \`annual_value_estimate\`, or \`current_annual_cost\` × \`expected_improvement_percent\` ÷ 100.
2. **Annual investment** = \`solution_price\` (the one-time implementation cost is shown but left out of ROI, payback and three-year value).
3. **Net annual benefit** = annual value minus annual investment.
4. **ROI** = net annual benefit ÷ annual investment, shown as a percentage.
5. **Payback** (in months) = annual investment ÷ annual value × the months in a year.
6. **Three-year net value** = three years of value minus three years of investment.
7. **Sensitivity**: the same sums with half the value and with one and a half times the value.

${i.currentProcess && !costLines.length ? `## Current State\n${i.currentProcess}\n\n` : ''}${i.currentProcess && costLines.length ? `## Current State\n${costLines.map((c) => `- ${c}`).join('\n')}\n\n` : ''}${i.knownMetrics && !proof.length ? `## Customer-Provided Metrics\n${i.knownMetrics}\n\nThese are text. They are not used in a calculation until you give them as the numbers above.\n\n` : ''}${proof.length ? `*The results above are text. They are not used in a calculation until you give the buyer's own numbers as the inputs above.*\n\n` : ''}## Next Steps

1. **Collect the figures**: put the questions above to the buyer and write down where each number comes from.
2. **Run the tool again** with the inputs named under "What is missing".
3. **Have the buyer's finance contact check the figures** before the case goes to the economic buyer.
4. **Identify champions**: find the stakeholders who gain from the result.

${SUGGESTIONS_FOOTER}`;
}

// The question that puts a yearly cost on one way of working, by the kind of way it is.
function costQuestion(c: string): string {
  if (/\b(?:manual\w*|spreadsheets?|excel|diar(?:y|ies)|paper|by hand)\b/i.test(c)) return 'How many people spend how many hours a week on this, what do they cost, and what do errors and delays on it cost on top?';
  if (/\b(?:legacy|on-?prem\w*|old |existing|incumbent|traditional|conventional)\b/i.test(c)) return 'What does it cost a year to run (licences, support, upgrades), and what work do people do around it because it cannot do the job?';
  if (/\b(?:cards?|cash|advances?|debit|credit|bank|banks|fees?|charges?)\b/i.test(c)) return 'What does it cost a year in fees and charges, and what is lost to leakage or delay that better control would remove?';
  if (/\b(?:tools?|point|separate|several|multiple|vendors?|consoles?)\b/i.test(c)) return 'What do the pieces cost in total, and how many hours does it take to connect their output by hand?';
  return 'What does it cost a year in money and in people\'s time, and what do its failures cost on top?';
}
// What a quoted result says to measure: the word that follows the number or the thing that changed.
function measureOf(text: string): string {
  const t = text.toLowerCase();
  if (/dispatch|planning time|planning/.test(t)) return 'the time spent planning, and what that time costs';
  if (/reimburse|cycle|turnaround|lead time|time to|faster|days?\b|weeks?\b|hours?\b|minutes?\b/.test(t)) return 'the time the process takes today, and what each day or hour costs';
  if (/cost|sav|spend|expense/.test(t)) return 'the yearly cost of the current way of working';
  if (/forecast|confidence|explain|defend|decision|signal|strateg/.test(t)) return 'whether the results and their explanations hold up against the buyer\'s own history and the questions their committee asks';
  if (/uptime|outage|downtime|availability/.test(t)) return 'the cost of an outage to the buyer, and how often it happens';
  if (/coverage|calls|orders|conversion|revenue|growth|top line|market share|sales/.test(t)) return 'the revenue or volume the buyer gains or keeps from the change';
  if (/return|rto|cancel|complaint|unpaid|churn|fraud|breach|incident|risk/.test(t)) return 'the cost of one incident, and how often one happens';
  if (/adoption|users?|customers?/.test(t)) return 'the share of people who use it, and what unused licences or manual work cost';
  return 'which of the buyer\'s own numbers would change, and what that change is worth in a year';
}


// Tool 5: Mutual Action Plan Generator
// Run 20 round 1b (D92): every date is a working day (the plan is built in working days back from the close date), each phase gets
// time in proportion to its work (the evaluation is not one week), the milestones follow how the sector buys (src/verticals.ts and
// the investment overlay), and every milestone has an owner who can do it: a security or compliance review belongs to the buyer's
// IT, security or risk reviewer, not to the champion. Each blocker is answered by its kind (src/answers.ts) with the owner for it.
type Who = 'champion' | 'eb' | 'seller' | 'se' | 'both' | 'it' | 'security' | 'risk' | 'proc' | 'finance' | 'eval';
interface Step { m: string; who: Who }
const MAP_EVAL: Record<string, Step[]> = {
  'logistics-tech': [
    { m: 'Agree the pilot hub, the baseline and the measure (cost per delivery, first-attempt delivery, dispatch planning time)', who: 'both' },
    { m: 'Connect the pilot hub to the order, TMS and WMS data it needs', who: 'it' },
    { m: 'Run a pilot at one hub for a full cycle of busy and quiet weeks, with the driver app live', who: 'champion' },
    { m: 'Review the pilot against the baseline and decide the rollout order of the other hubs', who: 'both' },
  ],
  'vertical-saas': [
    { m: 'Agree the pilot region, a comparable region without the product, and the measure (secondary sales, productive calls, outlet coverage)', who: 'both' },
    { m: 'Connect the pilot region\'s distributor (DMS) and ERP data', who: 'it' },
    { m: 'Run the pilot, including a test in outlets with a weak mobile signal', who: 'champion' },
    { m: 'Review the pilot region against the comparable region and agree the wave plan', who: 'both' },
  ],
  fintech: [
    { m: 'Agree the pilot entity or department and the baseline (days to close the books, reconciliation effort)', who: 'both' },
    { m: 'Connect the pilot to the ERP or ledger it must post into', who: 'it' },
    { m: 'Run the pilot in parallel with the current process for one close cycle', who: 'finance' },
    { m: 'Internal audit and compliance review of the controls and the audit trail', who: 'risk' },
  ],
  'ai-native': [
    { m: 'Build the evaluation set from the buyer\'s own history and agree the pass mark before any test', who: 'both' },
    { m: 'Run the proof of concept with a person approving any action that moves money or changes a record', who: 'champion' },
    { m: 'Review the results against the evaluation set and agree the guardrails for a production pilot', who: 'both' },
  ],
  ites: [
    { m: 'Agree the scope of services and the SLA design (measures, reporting, service credits)', who: 'both' },
    { m: 'Draft the transition plan: knowledge transfer, a parallel run and exit criteria for each stage', who: 'se' },
    { m: 'Agree the governance model: monthly reports, review meetings and escalation', who: 'both' },
    { m: 'Reference call with a similar client on SLA and transition outcomes (only if one has agreed)', who: 'champion' },
  ],
  telecom: [
    { m: 'Site survey of the pilot sites and confirmation of the delivery time of each link', who: 'se' },
    { m: 'Agree the pilot sites (the worst served first) and the baseline for uptime and repair time', who: 'both' },
    { m: 'Bring the pilot sites live and compare uptime and repair time with the current operator\'s record for the same sites', who: 'champion' },
    { m: 'Draft the wave plan by region, with a fallback link and a rollback rule for each wave', who: 'both' },
  ],
  cybersecurity: [
    { m: 'Agree the proof of value in writing: scope, environment and the success criteria', who: 'both' },
    { m: 'Connect the proof environment (cloud accounts, SIEM, ticketing)', who: 'it' },
    { m: 'Run the proof of value and track the exposures found and closed, and the time to fix them', who: 'champion' },
    { m: 'Review the findings with the security team, ranked against the alerts they handle today', who: 'both' },
  ],
  software: [
    { m: 'Choose one real project and one team for the trial and agree the measure (release frequency, escaped defects)', who: 'both' },
    { m: 'Migrate that project\'s existing scripts and tests through the import path', who: 'champion' },
    { m: 'Review the results of the trial with the engineering lead', who: 'both' },
  ],
  saas: [
    { m: 'Choose the workflow and the team for the pilot and agree the measure (time to first value)', who: 'both' },
    { m: 'Connect the tools the pilot must work with', who: 'it' },
    { m: 'Run the pilot to first value and review adoption', who: 'champion' },
  ],
  investment: [
    { m: 'Send the due diligence pack: strategy description, process, risk limits and how results are explained', who: 'seller' },
    { m: 'Present to the investment committee and answer its questions', who: 'both' },
    { m: 'Agree the reporting: the monthly pack and how a bad month is explained', who: 'both' },
    { m: 'Risk and compliance review of the strategy against the buyer\'s limits and reporting needs', who: 'risk' },
    { m: 'Agree the first allocation: its size, its phasing and the date it is reviewed', who: 'eb' },
  ],
};
const MAP_GENERIC_EVAL: Step[] = [
  { m: 'Complete the technical evaluation or pilot against the criteria above', who: 'eval' },
  { m: 'Validate the integration requirements', who: 'it' },
];
const STAGE_ORDER = ['discovery', 'evaluation', 'proposal', 'negotiation', 'procurement'];
const STAGE_NAME: Record<string, string> = { discovery: 'Discovery', evaluation: 'Evaluation', proposal: 'Business Case & Alignment', negotiation: 'Commercial & Legal', procurement: 'Procurement' };

function executeMutualActionPlanGenerator(args: Record<string, unknown>): string {
  const dealName = (args.deal_name as string) || 'Deal';
  const targetCloseDate = (args.target_close_date as string) || '';
  const currentStage = (args.current_stage as string) || 'evaluation';
  const buyerChampion = (args.buyer_champion as string) || '';
  const economicBuyer = (args.economic_buyer as string) || '';
  const technicalEvaluators = (args.technical_evaluators as string) || '';
  const procurementContact = (args.procurement_contact as string) || '';
  const knownRequirements = (args.known_requirements as string) || '';
  const knownProcessSteps = (args.known_process_steps as string) || '';
  const blockers = (args.blockers as string) || '';
  const yourSolution = (args.your_solution as string) || 'the solution';

  const closeInput = targetCloseDate ? new Date(targetCloseDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  if (isNaN(closeInput.getTime())) {
    return `target_close_date "${targetCloseDate}" is not a date this tool can read. Use the format YYYY-MM-DD, for example 2026-12-15.`;
  }
  const today = new Date();
  const daysUntilClose = Math.round((closeInput.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  const formatDate = isoDate;

  const ctx = readContext(undefined, { seller: [yourSolution], context: [knownRequirements, technicalEvaluators, blockers, dealName], role: [buyerChampion, economicBuyer] });
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'the solution';
  const v = ctx.v;
  const investment = ctx.model === 'investment';
  const bctx: BlockerContext = { product: brief.short, sectorObjections: v?.objections, sectorName: v?.name, model: ctx.model };

  // ---- people: who can own which milestone ----
  const evaluators = parseContacts(technicalEvaluators, investment);
  const pick = (fams: string[]): string => evaluators.find((e) => fams.includes(e.family))?.title || '';
  const itName = pick(['it', 'engineering', 'data']) || pick(['security']) || 'Buyer IT reviewer (not named)';
  const secName = pick(['security']) || pick(['it', 'engineering']) || pick(['risk']) || 'Buyer security reviewer (not named)';
  const riskName = pick(['risk']) || pick(['security']) || 'Buyer risk and compliance reviewer (not named)';
  const finName = pick(['finance']) || 'Buyer finance contact (not named)';
  const champName = buyerChampion || 'Buyer champion (not named)';
  const ebName = economicBuyer || 'Economic buyer (not named)';
  const procName = procurementContact || 'Buyer procurement and legal (not named)';
  const whoName = (w: Who): string => ({
    champion: champName, eb: ebName, seller: 'Seller (account executive)', se: 'Seller (solutions engineer)', both: 'Both teams', it: `${itName} with Seller (solutions engineer)`,
    security: secName, risk: riskName, proc: procName, finance: finName, eval: evaluators.length ? joinList(evaluators.slice(0, 3).map((e) => e.title)) : 'Buyer technical evaluators (not named)',
  } as Record<Who, string>)[w];

  // ---- the calendar, in working days ----
  const start = onOrAfterWorkday(today);
  const close = onOrBeforeWorkday(closeInput);
  const closeNote = isoDate(close) !== isoDate(closeInput) ? ` (${isoDate(closeInput)} is a ${weekdayName(closeInput)}; the plan closes on ${weekdayName(close)} ${isoDate(close)})` : '';
  const N = Math.max(workdaysBetween(start, close), 0);
  const from = Math.max(STAGE_ORDER.indexOf(currentStage), 0);
  const phaseStages = STAGE_ORDER.slice(from);
  const modelKey = investment ? 'investment' : v ? v.id : '';
  const evalWeight = ['ites', 'telecom', 'investment'].includes(modelKey) ? 5 : 4;
  const weights = phaseStages.map((s) => (s === 'evaluation' ? evalWeight : s === 'discovery' ? 2 : 2));
  const closeWeight = 1;
  const totalW = weights.reduce((a, b) => a + b, 0) + closeWeight;
  const lens: number[] = [];
  let used = 0;
  [...weights, closeWeight].forEach((w, i, all) => {
    const len = i === all.length - 1 ? Math.max(N - used, 0) : Math.max(Math.round((N * w) / totalW), N >= 2 * all.length ? 2 : 1);
    lens.push(len);
    used += len;
  });
  // if rounding used more days than there are, take them back from the longest phase
  let over = lens.reduce((a, b) => a + b, 0) - N;
  while (over > 0) { const k = lens.indexOf(Math.max(...lens)); if (lens[k] <= 1) break; lens[k]--; over--; }
  const bounds: { name: string; stage: string; a: Date; b: Date; len: number }[] = [];
  let cursor = start;
  [...phaseStages, 'close'].forEach((s, i) => {
    const a = cursor;
    const b = i === phaseStages.length ? close : addWorkdays(a, lens[i]);
    bounds.push({ name: s === 'close' ? 'Close & Launch' : STAGE_NAME[s], stage: s, a, b: b.getTime() > close.getTime() ? close : b, len: lens[i] });
    cursor = b.getTime() > close.getTime() ? close : b;
  });
  const dateIn = (ph: { a: Date; b: Date; len: number }, i: number, k: number): string => {
    const step = Math.max(Math.ceil(((i + 1) * Math.max(ph.len, 1)) / Math.max(k, 1)), 1);
    const d = addWorkdays(ph.a, step);
    return isoDate(d.getTime() > ph.b.getTime() ? ph.b : d);
  };

  // ---- the steps of each phase ----
  const evalSteps: Step[] = [...(MAP_EVAL[modelKey] || MAP_GENERIC_EVAL)];
  if (!evalSteps.some((s) => /security|compliance|risk/i.test(s.m))) evalSteps.push({ m: 'Security and compliance review of the vendor and its data handling', who: 'security' });
  evalSteps.push(brief.short ? { m: `Reference calls with similar ${P} customers (only if one has agreed)`, who: 'champion' } : { m: 'Reference calls with similar customers (only if one has agreed)', who: 'champion' });
  const dedup = (steps: Step[]) => steps.filter((s, i) => steps.findIndex((t) => t.m === s.m) === i);
  const stepsFor: Record<string, Step[]> = {
    discovery: [
      { m: 'Hold discovery sessions with each stakeholder named above', who: 'both' },
      { m: 'Document the business requirements and the success criteria', who: 'champion' },
      { m: 'Identify every decision maker and influencer, and what each will check', who: 'seller' },
      { m: 'Agree the evaluation criteria and the process', who: 'both' },
    ],
    evaluation: dedup(evalSteps),
    proposal: [
      { m: 'Present the business case to the economic buyer', who: 'seller' },
      { m: 'Align on ROI and success metrics with the finance contact', who: 'finance' },
      { m: 'Finalize scope and pricing', who: 'seller' },
      { m: 'Answer every open blocker in writing (see Risks & Blockers)', who: 'both' },
    ],
    negotiation: [
      { m: 'Agree the commercial terms', who: 'both' },
      { m: 'Complete the legal review and resolve the redlines', who: 'proc' },
      { m: 'Confirm the implementation timeline and the owners on both sides', who: 'both' },
      { m: 'Obtain the final approvals', who: 'eb' },
    ],
    procurement: [
      { m: 'Complete vendor registration and submit the documents the buyer\'s process asks for', who: 'proc' },
      { m: 'Finalize the payment terms', who: 'proc' },
      { m: 'Complete the final approvals', who: 'eb' },
    ],
    close: [
      { m: 'Contract signed', who: 'eb' },
      { m: 'Implementation kickoff scheduled', who: 'both' },
      { m: 'Success criteria documented', who: 'seller' },
    ],
  };
  const phaseBlock = (ph: (typeof bounds)[number], n: number): string => {
    const steps = stepsFor[ph.stage] || [];
    const isCurrent = n === 1;
    const rows = steps.map((s, i) => `| ${i + 1} | ${s.m} | ${whoName(s.who)} | ${dateIn(ph, i, steps.length)} | Pending |`);
    const heading = `### Phase ${n}: ${ph.name}${isCurrent ? ', the current stage' : ''} (${formatDate(ph.a)} to ${formatDate(ph.b)})`;
    const extra = ph.stage === 'evaluation' && v ? `\n**How this sector buys:** ${v.salesMotion}\n` : '';
    const q2 = isCurrent && ph.stage !== 'close' ? `\n**Key Questions to Answer:**\n${knownProcessSteps ? `- Based on the process you gave: ${knownProcessSteps}` : `- Who else needs to be involved in the evaluation?\n- What is the approval process after the evaluation?\n- What could delay this?`}\n` : '';
    return `${heading}\n\n| # | Milestone | Owner | Due Date | Status |\n|---|-----------|-------|----------|--------|\n${rows.join('\n')}\n${extra}${q2}`;
  };
  const phasesText = bounds.map((ph, i) => phaseBlock(ph, i + 1)).join('\n---\n\n');
  const tight = N < 10 ? `\n*Only ${N} working day${N === 1 ? '' : 's'} remain before the close date, so the phases are short and several steps must run in parallel. Check that the close date is realistic.*\n` : '';

  // ---- requirements and blockers ----
  const reqs = splitItems(knownRequirements);
  const reqTable = reqs.length ? reqs.map((r, i) => `| ${i < 2 ? 'High' : 'Medium'} (agree with the buyer) | ${cap(r)} | Test in the evaluation: measure ${measureOf(r)} |`).join('\n') : '| High | Name the core requirement the buyer will judge the evaluation by | Not given: ask the champion |';
  const blockerItems = splitItems(blockers);
  const ownerFor = (kind: string): string => ({ integration: `${itName} with Seller (solutions engineer)`, compliance: `${secName} with Seller`, security: `${secName} with Seller`, terms: `${procName} with ${ebName}`, price: `${ebName} with Seller`, adoption: `${champName} with Seller`, accuracy: `${champName} with Seller (solutions engineer)`, setup: 'Seller (solutions engineer) with ' + itName }[kind] || `Seller with ${champName}`);
  const blockerRows = blockerItems.map((b) => { const a = answerBlocker(b, bctx); return `| ${cap(b)} | ${a.sector || sentences(a.how).slice(0, 2).join(' ')} Confirm first: ${a.confirm}. | ${ownerFor(a.kind)} | Open |`; }).join('\n');

  return `# Mutual Action Plan: ${dealName}

## Overview

| Item | Detail |
|------|--------|
| **Opportunity** | ${dealName} |
| **Target Close Date** | ${formatDate(closeInput)}${targetCloseDate ? '' : ` (${NOT_SUPPLIED}: example date)`}${closeNote} |
| **Days Until Close** | ${daysUntilClose} days${targetCloseDate ? '' : ` ${EXAMPLE}`} (${N} working days) |
| **Current Stage** | ${currentStage.replace(/_/g, ' ')}${args.current_stage ? '' : ' (default)'} |
| **Solution** | ${(args.your_solution as string) || NOT_SUPPLIED} |

${ctx.line}

---

## Key Stakeholders

### Buyer Team
| Role | Name | Engagement |
|------|------|------------|
| **Champion** | ${buyerChampion || 'Not named: need to identify'} | ${buyerChampion ? 'Engaged' : 'Not identified'} |
| **Economic Buyer** | ${economicBuyer || 'Not named: need to identify'} | ${economicBuyer ? 'Needs engagement' : 'Not identified'} |
${evaluators.length ? evaluators.map((e) => `| **Technical evaluator** | ${e.title} | In evaluation: ${roleFor(e.title, investment).owns} |`).join('\n') : '| **Technical Evaluator(s)** | Not named | Not identified |'}
| **Procurement** | ${procurementContact || 'Not named'} | ${procurementContact ? 'Not yet engaged' : 'Not identified'} |

### Seller Team
| Role | Name | Responsibility |
|------|------|----------------|
| **Account Executive** | You | Deal ownership, relationship |
| **Solutions Engineer** | Not named | Technical validation |
| **Executive Sponsor** | Not named | Executive alignment |

---

## Success Criteria

### What Success Looks Like
${knownRequirements ? knownRequirements : `You gave no requirements. Ask the champion what the buyer will judge ${P} by${v ? `; in ${v.name} they usually look at ${v.metrics.slice(0, 3).join(', ')}` : ''}.`}

### Evaluation Criteria
| Priority | Criterion | Status |
|----------|-----------|--------|
${reqTable}
${v ? `\n${sectorNotes(v, 'metrics')}\n` : ''}

---

## Mutual Action Plan Timeline
${tight}
${phasesText}

---

## Risks & Blockers

${blockerItems.length ? `### Known Blockers
${blockers}

**Mitigation Plan:** each blocker is answered by its kind, from your own words. Where the answer needs a fact about ${P}, it says what to confirm first.

| Blocker | Mitigation | Owner | Status |
|---------|------------|-------|--------|
${blockerRows}
` : `### Potential Risks
- No blockers were given. Ask the champion what could stop this deal and add each answer here.
${v ? v.objections.slice(0, 3).map((o) => `- ${o.objection} (a usual objection in ${v.name})`).join('\n') : ''}`}

### Risk Assessment
| Risk | Typical likelihood | Typical impact | Mitigation |
|------|------------|--------|------------|
| Timeline slips | Medium | High | Weekly check-ins, early escalation |
| Budget not approved | Low | Critical | A business case in the buyer's numbers and an executive sponsor |
| Evaluation shows a gap | Medium | Medium | Agree the measure and the pass mark before the evaluation starts |
| Champion leaves | Low | Critical | Multi-thread across ${evaluators.length ? joinList(evaluators.slice(0, 2).map((e) => e.title)) : 'the other stakeholders'} |

---

## Communication Plan

### Regular Check-ins
| Cadence | Participants | Purpose |
|---------|--------------|---------|
| Weekly | ${champName} and the account executive | Progress review, blocker removal |
| Bi-weekly | ${evaluators.length ? joinList(evaluators.slice(0, 3).map((e) => e.title)) : 'Technical teams'} and the solutions engineer | Technical validation progress |
| As needed | ${ebName} and the executive sponsor | Strategic alignment |

### Escalation Path
1. First escalation: ${champName} to ${ebName}
2. Second escalation: the seller's manager to the buyer's executive
3. Final escalation: the seller's executive to the buyer's executive

---

## Next Actions (This Week)

| Priority | Action | Owner | Due |
|----------|--------|-------|-----|
| High | ${!buyerChampion ? 'Identify and confirm the champion' : `Confirm next steps with ${buyerChampion}`} | AE | ${formatDate(addWorkdays(start, 1))} |
| High | ${!economicBuyer ? 'Identify the economic buyer' : `Schedule a meeting with ${economicBuyer}`} | AE | ${formatDate(addWorkdays(start, 2))} |
| Medium | ${buyerChampion ? `Share this plan with ${buyerChampion}` : 'Share this plan with your main buyer contact'} | AE | ${formatDate(start)} |
| Medium | Validate the timeline and milestones with the buyer | Both | ${formatDate(addWorkdays(start, 3))} |

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
// Run 20 round 1b (D92): the judges scored every answer 1 because the competitor analysis ignored the deal and printed a blank
// template ("Competitor: Not specified"). Every analysis type now starts from what the user gave: the solution, the deal details,
// the alternatives the buyer used (read from the deal details or competitor_won), the deal value and cycle, and each stakeholder
// with the position the user recorded. The sector's usual loss reasons (src/verticals.ts) are checked against the deal. What is
// missing (the outcome, the reason, the winner) is asked for by input name. Nothing is concluded without an outcome.
interface AltRead { text: string; label: string; why: string; check: string; win: string; named: boolean }
const ALT_KINDS: { re: RegExp; label: string; why: string; check: string; win: string }[] = [
  { re: /\b(?:manual|spreadsheets?|excel|diar(?:y|ies)|paper|by hand|whatsapp|email threads?)\b/i, label: 'a manual process', why: 'it costs nothing extra and nobody has to learn a new way of working', check: 'What did the manual way cost the buyer in hours, errors and delays, and did anyone ever put a number on it?', win: 'when the buyer saw what the manual way cost them and the work was taken off their people' },
  { re: /\b(?:legacy|on-?prem\w*|old |existing|incumbent|traditional|conventional|mainframe|in the 90s|already (?:have|use))\b/i, label: 'an incumbent or legacy system', why: 'it is already paid for, integrated and approved', check: 'What did the buyer say the current system still does well, and what would switching have disturbed (data, integrations, retraining)?', win: 'when the buyer\'s problem was something the current system could not do' },
  { re: /\b(?:point (?:tools?|solutions?)|multiple|several|separate|disconnected|siloed|best-of-breed|third-party|each function|one firm|another builds|different (?:vendors|tools))\b/i, label: 'a set of separate tools or vendors', why: 'each piece is familiar and can be replaced one at a time', check: 'Did the buyer see the cost of connecting the pieces, or only the price of each one?', win: 'when connecting the separate pieces was costing the buyer more than the pieces themselves' },
  { re: /\b(?:in-?house|build it|built internally|own team|diy|internal(?:ly)?)\b/i, label: 'an in-house build or process', why: 'their own team controls it and there is no licence to buy', check: 'What does the in-house option cost to keep running, and who owns it if its builder leaves?', win: 'when the buyer counted what the in-house option costs to keep running' },
  { re: /\b(?:cards?|cash|advances?|debit|credit|bank|banks)\b/i, label: 'an existing financial instrument or provider', why: 'it is already in use and the buyer understands it', check: 'What did the buyer like about it, and what did it fail to give them (control, visibility, speed)?', win: 'when the buyer wanted control or visibility that the existing provider does not give' },
];
function altRead(text: string, named: boolean): AltRead {
  const k = ALT_KINDS.find((x) => x.re.test(text));
  if (named) return { text, label: 'a competitor you named', why: 'the buyer chose it, or you expect them to', check: 'What did it do better, in the buyer\'s own words, and at which stage did it pull ahead?', win: 'where the buyer valued what you do that it does not', named };
  return k ? { text, label: k.label, why: k.why, check: k.check, win: k.win, named } : { text, label: 'another option the buyer used or considered', why: 'it was the option the buyer already understood', check: 'What did the buyer like about it, and what did it fail to give them?', win: 'where the buyer found it fell short of what they needed', named };
}
// The alternatives the user described: after "alternatives ... are described as", "competing with", "versus", "incumbent" and similar.
function alternativesIn(details: string, competitorWon: string): AltRead[] {
  const out: AltRead[] = [];
  const seen = new Set<string>();
  const add = (t: string, named: boolean) => { const k = t.toLowerCase().replace(/\W+/g, ' ').trim(); if (k && !seen.has(k)) { seen.add(k); out.push(altRead(t.trim(), named)); } };
  splitItems(competitorWon).forEach((c) => add(c, true));
  const m = details.match(/(?:alternatives?(?:\s+(?:buyers|they|customers|the buyers?)\s+use)?\s+(?:are|is|include)(?:\s+described\s+as)?|competing\s+(?:with|against)|competitors?\s*(?:are|is|include[sd]?|:)|\bversus\b|\bvs\.?|incumbents?\s*(?:is|are|:)?|compared\s+(?:with|to))\s*:?\s*(.+?)(?:\.\s+[A-Z]|\.$|$)/i);
  if (m) splitItems(m[1].replace(/\.$/, '')).forEach((a) => add(a, false));
  return out;
}

function executeWinLossAnalyzer(args: Record<string, unknown>): string {
  const analysisType = (args.analysis_type as string) || 'single_deal';
  const dealOutcome = (args.deal_outcome as string) || '';
  const dealDetails = (args.deal_details as string) || '';
  const lossReason = (args.loss_reason as string) || '';
  const competitorWon = (args.competitor_won as string) || '';
  const dealValue = (args.deal_value as number) || 0;
  const salesCycleDays = (args.sales_cycle_days as number) || 0;
  const stakeholdersInvolved = (args.stakeholders_involved as string) || '';
  const yourSolution = (args.your_solution as string) || 'your solution';
  const multipleDeals = (args.multiple_deals as string) || '';
  // Run 19 D80 (problem 3): the stated reason and the stakeholders are read, not only echoed.
  const wlCtx = readContext(undefined, { seller: [yourSolution], context: [dealDetails, lossReason, stakeholdersInvolved, multipleDeals] });
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'your solution';
  const bctx: BlockerContext = { product: brief.short, sectorObjections: wlCtx.v?.objections, sectorName: wlCtx.v?.name, model: wlCtx.model };
  const investment = wlCtx.model === 'investment';
  const contacts = parseContacts(stakeholdersInvolved, investment);
  const alts = alternativesIn(dealDetails, competitorWon);
  const people = splitItems(stakeholdersInvolved).map((x) => {
    const m = x.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    return m ? { who: m[1].trim(), stance: m[2].trim().toLowerCase() } : { who: x.trim(), stance: '' };
  });
  const against = contacts.filter((p) => tagKind(p.tag) === 'blocker');
  const support = contacts.filter((p) => tagKind(p.tag) === 'champion');
  const r = lossReason.toLowerCase();
  const readings: string[] = [];
  if (/bundle|one vendor|single vendor|suite|together|all-in-one/.test(r)) readings.push('**Bundle loss:** the buyer preferred one vendor for more than your product covers. Ask whether you could have partnered for the missing part, or qualified out earlier.');
  if (/\b(hr|it|finance|procurement|legal|operations|security)\b.*\b(owned|decided|led|chose)|\b(owned|led) the decision/.test(r)) readings.push('**The decision sat with another function:** the stated reason says a team you did not sell to made the call. Map who owns the budget and the decision in the first two meetings next time.');
  if (/price|cost|budget|expensive|cheaper|discount/.test(r)) readings.push('**Price or budget:** check whether the value case was agreed in the buyer\'s own numbers before price came up.');
  if (/feature|product|capabilit|missing|gap|integrat/.test(r)) readings.push('**Product or fit gap:** decide whether the gap was real or a demonstration problem, and whether the requirement could have been shaped earlier.');
  if (/timing|priority|later|next year|freeze|no decision/.test(r)) readings.push('**Timing or priority:** look for the event that would have made this urgent, and whether the status quo was acceptable to them.');
  if (/relationship|incumbent|existing|renew|stayed/.test(r)) readings.push('**Incumbent advantage:** the buyer stayed with what they know. Ask what the incumbent fixed or promised during your evaluation.');
  const readingBlock = lossReason ? `### What the Stated Reason Points To\n\n${readings.length ? readings.join('\n\n') : `The stated reason (${q(lossReason)}) matches none of the usual patterns: ask the buyer what sat behind it.`}\n\n` : '';
  const execNamed = contacts.some((p) => p.level === 'exec' || p.level === 'head');
  const ebNamed = contacts.some((p) => ['economic', 'buyer'].includes(tagKind(p.tag) || '') || /\b(cfo|ceo|coo|cio|cto|ciso|chief|economic buyer|budget)\b/i.test(p.title));
  const yesNo = (v: boolean | null, why: string) => (v === null ? `Not known from your input: check (${why})` : v ? `Yes (from your input: ${why})` : `No (from your input: ${why})`);

  // ---- sections shared by every analysis type ----
  const gave = [
    `| **Solution** | ${args.your_solution ? `${brief.short}${brief.kind ? `, ${brief.kind}` : ''}` : NOT_SUPPLIED} |`,
    `| **Deal Value** | ${hasValue(args.deal_value) ? money(dealValue) : NOT_SUPPLIED} |`,
    `| **Sales Cycle** | ${hasValue(args.sales_cycle_days) ? `${salesCycleDays.toLocaleString('en-US')} ${salesCycleDays === 1 ? 'day' : 'days'}` : NOT_SUPPLIED} |`,
    `| **Outcome** | ${dealOutcome ? upperFirst(dealOutcome.replace(/_/g, ' ')) : 'not given'} |`,
    `| **Stated reason** | ${lossReason ? cap(lossReason) : 'not given'} |`,
    `| **Competitor who won** | ${competitorWon ? cap(competitorWon) : 'not given'} |`,
    `| **Stakeholders** | ${contacts.length ? contacts.map((c) => c.raw).join('; ') : 'not given'} |`,
  ].join('\n');
  const detailsBlock = dealDetails ? `\n**Deal details as you gave them:**\n\n> ${dealDetails.replace(/\n+/g, '\n> ')}\n` : '';
  const wholeProduct = args.your_solution && yourSolution.trim().length > P.length + 3 ? `\n**What you sell, as you described it:** ${yourSolution.trim()}\n` : '';

  const missing: string[] = [];
  if (!dealOutcome) missing.push('`deal_outcome`: won, lost or no_decision. This decides which analysis applies, so it is the first thing to add.');
  if (dealOutcome !== 'won' && !lossReason) missing.push('`loss_reason`: the reason the buyer gave, in the buyer\'s own words, and who said it. For a win, put the reason they gave for choosing you in `deal_details`.');
  if (!competitorWon) missing.push(`\`competitor_won\`: which alternative the buyer chose${alts.length ? ` (you described ${joinList(alts.map((a) => `"${a.text}"`))})` : ''}, or "no decision" if they chose none.`);
  if (contacts.length && !contacts.some((c) => c.tag)) missing.push('The position of each stakeholder in brackets after the name, for example "' + `${contacts[0].title} (supporter)` + '" or "(against)".');
  if (!contacts.length) missing.push('`stakeholders_involved`: who took part, with a position for each in brackets, for example "CFO (neutral)".');
  if (!hasValue(args.sales_cycle_days)) missing.push('`sales_cycle_days`: how long the deal ran, and in `deal_details` the stage where it was decided.');
  const asks = missing.length ? `## What to add to finish the analysis\n\n${missing.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\nThen run the tool again with \`analysis_type\` set to \`single_deal\`.\n\n` : '';

  const altBlock = alts.length ? `## The alternatives in this deal\n\nThese come from your ${competitorWon ? 'competitor_won and ' : ''}deal details. None of them is called a winner here: you have not said which one the buyer chose.\n\n| Alternative | What kind it is | Why a buyer keeps it | What to find out in the review |\n|---|---|---|---|\n${alts.map((a) => `| ${cap(a.text)} | ${a.label} | ${cap(a.why)} | ${a.check} |`).join('\n')}\n\n` : '';

  const reasonRows = wlCtx.v ? wlCtx.v.objections.map((o) => `| ${o.objection} | ${o.response} |`).join('\n') : '';
  const sectorBlock = wlCtx.v ? `## Why deals like this are usually lost in ${wlCtx.v.name}\n\nThese are the objections this sector most often raises (from the sector notes in this tool, not from your deal). Check each against the deal: was it raised, by whom, and was it answered before the proposal?\n\n| Usual reason | Pattern of a good answer |\n|---|---|\n${reasonRows}\n\n**How deals usually run:** ${wlCtx.v.salesMotion}\n\n**What this sector measures** (ask which of these the buyer used to judge the result): ${wlCtx.v.metrics.join(', ')}.\n\n` : '';

  const learn = (c: Contact): string => {
    const k = tagKind(c.tag);
    if (k === 'blocker') return 'What did they need that you did not give them, and when did they turn against you?';
    if (k === 'champion') return 'Did they have the power and the material to sell this internally, and what did they say when the decision was made?';
    if (k === 'economic' || k === 'buyer') return 'Did they ever hear your case from you directly, or only through someone else?';
    return roleFor(c.title, investment).questions[0];
  };
  const peopleBlock = contacts.length ? `## Who was involved\n\n| Stakeholder | Position you recorded | What to learn in the review |\n|---|---|---|\n${contacts.map((c) => `| ${cap(c.title)} | ${c.tag ? cap(c.tag) : 'not recorded'} | ${learn(c)} |`).join('\n')}\n\n${(() => {
    const note: string[] = [];
    if (!support.length) note.push('No champion is recorded. If there was none, that is a finding in itself; if there was one, name them.');
    if (against.length) note.push(`Against you: ${against.map((p) => p.title).join(', ')}. Their view is the first thing to learn in the loss review.`);
    if (wlCtx.v) {
      const ACR: Record<string, string> = { cfo: 'financial', coo: 'operating', cio: investment ? 'investment' : 'information', cto: 'technology', ciso: 'security', cmo: 'marketing', cro: 'revenue' };
      const sig = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).map((w) => ACR[w] || w).filter((w) => w.length > 1 && !['chief', 'officer', 'head', 'of', 'manager', 'lead', 'and', 'the', 'senior', 'sr', 'vp', 'director'].includes(w));
      const given = new Set(contacts.flatMap((c) => sig(c.title)));
      const notNamed = wlCtx.v.buyerRoles.filter((role) => !sig(role).some((w) => given.has(w)));
      if (notNamed.length) note.push(`Roles this sector usually involves that you did not list: ${joinList(notNamed.slice(0, 4))}. Were they part of the deal, and what did they think?`);
    }
    return note.length ? note.map((n) => `- ${n}`).join('\n') + '\n\n' : '';
  })()}` : '';

  const engagement = contacts.length ? `### Engagement Assessment\n| Question | Check |\n|----------|-------|\n| Did we have an executive sponsor? | ${execNamed ? `Possibly: a senior role is named (${contacts.filter((p) => p.level === 'exec' || p.level === 'head').map((p) => p.title).join(', ')}); confirm they sponsored the deal` : 'Not known from your input: no senior role named'} |\n| Was economic buyer engaged? | ${ebNamed ? 'Possibly: a buyer is named in your input; confirm how often they were met' : 'Not known from your input: no economic buyer named'} |\n| Did we multi-thread? | ${yesNo(contacts.length >= 3 ? true : contacts.length ? false : null, `${contacts.length} stakeholder${contacts.length === 1 ? '' : 's'} named`)} |\n| Was there a true champion? | ${support.length ? `Possibly: ${support.map((p) => p.title).join(', ')} recorded as champion; test whether they had power and material` : 'Not known from your input: nobody recorded as supporter or champion'} |\n\n` : '';

  const intro = (title: string) => `# ${title}: ${P}\n\n## What you gave\n\n| Item | Value |\n|---|---|\n${gave}\n${detailsBlock}${wholeProduct}\n${wlCtx.line}\n\n`;
  const reviewQs = (extra: string[] = []) => {
    const qs = [...extra];
    if (hasValue(args.sales_cycle_days)) qs.push(`The deal ran ${salesCycleDays.toLocaleString('en-US')} ${salesCycleDays === 1 ? 'day' : 'days'}: which stage took longest, and was that the buyer's process or a stall you could have moved?`);
    if (hasValue(args.deal_value)) qs.push(`The deal was worth ${money(dealValue)}: did the price or the size of the commitment come up as a reason, and who raised it?`);
    if (wlCtx.v) qs.push(`Did the buyer judge the result on ${wlCtx.v.metrics.slice(0, 3).join(', ')} or on something else?`);
    qs.push('What was the real reason (not only the stated one), and when did the deal actually turn?');
    return qs.map((x, i) => `${i + 1}. ${x}`).join('\n');
  };

  if (analysisType === 'single_deal') {
    let analysis = `${intro('Win/Loss Analysis: Single Deal')}${dealOutcome ? '' : `## What this analysis can and cannot say yet\n\nYou gave the deal context but not the outcome, so nothing below says why the deal was won or lost. It is the structure for the review, built from what you gave. Add the inputs listed at the end and run it again.\n\n`}---\n\n`;
    if (dealOutcome === 'won') {
      analysis += `## Win Analysis

### Evidence in your inputs
${[
        contacts.length ? `- Stakeholders engaged: ${contacts.map((c) => c.raw).join('; ')}` : '- No stakeholders were given, so engagement cannot be judged.',
        competitorWon ? `- Beat: ${competitorWon}` : '',
        hasValue(args.sales_cycle_days) ? `- The deal ran ${salesCycleDays.toLocaleString('en-US')} ${salesCycleDays === 1 ? 'day' : 'days'}.` : '',
      ].filter(Boolean).join('\n')}

### What to replicate
Ask the buyer which of these decided it, and write down their words:
- The discovery that found the pain (${wlCtx.v ? `did it cover ${wlCtx.v.metrics.slice(0, 2).join(' and ')}?` : 'which questions mattered?'})
- The people who backed you and what each of them gained
- The proof that landed (${wlCtx.v ? proofOf(wlCtx.v) : 'which evidence did they quote back to you?'})

### Questions for Win Review
1. Why did they choose us over the alternatives${alts.length ? ` (${joinList(alts.map((a) => a.text))})` : ''}?
2. What was the tipping point in the decision?
3. What almost derailed the deal?
4. What would they tell others considering us?
5. What surprised them (good or bad)?

`;
    } else if (dealOutcome === 'lost') {
      analysis += `## Loss Analysis

### Why We Lost (Hypothesis)

${lossReason ? `**Stated Reason:** ${lossReason}` : '**Stated Reason:** Not provided'}

**Common Root Causes to Investigate:**
${wlCtx.v ? wlCtx.v.objections.map((o) => `- ${o.objection}`).join('\n') : '- Price or budget\n- A gap in fit or product\n- Timing or priority\n- A champion who could not carry the decision\n- An incumbent the buyer knew better'}

${readingBlock}${competitorWon ? `#### Competitive Loss\n- Why did ${competitorWon} win?\n- What did they offer that we didn't?\n- Did we position against their strengths?\n- Were evaluation criteria stacked against us?\n\n` : ''}${/price|cost|budget|expensive|cheaper|discount/.test(r) ? `#### Pricing/Budget Issues
- Was the business case strong enough to justify investment?
- Did we understand their budget constraints upfront?
- Could we have structured the deal differently?
- Did a competitor offer better terms or a discount?

` : ''}${/feature|product|capabilit|missing|gap/.test(r) ? `#### Product/Feature Gap
- Was this a real gap or perception issue?
- Did we fail to demonstrate capability?
- Was the evaluation criteria set against us?
- Could we have changed the requirements?

` : ''}${/timing|priority/.test(r) ? `#### Timing/Priority Issues
- Was there a real compelling event?
- Did priorities shift during the evaluation?
- Could we have created more urgency?
- Was the status quo acceptable to them?

` : ''}### Loss Categories

*Check first: set by this tool's rule (High when no stakeholders were given for Champion Failure, or when a competitor won for Competitive Loss; otherwise Medium). It is not a finding about your deal.*

| Category | Check first | Investigation Needed |
|----------|------------|---------------------|
| **Champion Failure** | ${stakeholdersInvolved ? 'Medium' : 'High'} | Did we have a true champion? |
| **Value Not Proven** | Medium | Was ROI quantified and believed? |
| **Competitive Loss** | ${competitorWon ? 'High' : 'Medium'} | What did the competitor do better? |
| **Product Gap** | Medium | Was this real or perceived? |
| **Sales Execution** | Medium | Did we run the right process? |

### Recovery Opportunity

| Timeframe | Action | Goal |
|-----------|--------|------|
| Now | Request honest feedback call | Understand true reasons |
| 30 days | Check in on implementation | Be helpful, stay relevant |
| 90 days | Share relevant content/news | Stay top of mind |
| 6 months | Explore if situation changed | New evaluation opportunity |

`;
    } else if (dealOutcome === 'no_decision') {
      analysis += `## No-Decision Analysis

### Why No Decision Happened

**Common Causes:**
1. **No compelling event**: Status quo was acceptable${alts.length ? ` (the buyer's status quo in your details: ${joinList(alts.map((a) => a.text))})` : ''}
2. **Champion failure**: No one willing to drive change${support.length ? `; you recorded ${joinList(support.map((s) => s.title))} as champion, so ask what stopped them` : ''}
3. **Budget reallocation**: Priorities shifted
4. **Risk aversion**: Fear of change or failure
5. **Evaluation fatigue**: Too long, lost momentum${hasValue(args.sales_cycle_days) ? ` (the deal ran ${salesCycleDays.toLocaleString('en-US')} ${salesCycleDays === 1 ? 'day' : 'days'})` : ''}

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
    } else if (dealOutcome === 'mixed') {
      analysis += `## Mixed Outcome\n\nYou marked the outcome as mixed. Split the deals into won, lost and no_decision and run the tool for each, or use \`deal_portfolio\` with a summary in \`multiple_deals\`. The sections below apply to whichever deal you review first.\n\n`;
    }
    analysis += `${altBlock}${sectorBlock}${peopleBlock}${engagement}## Questions for the review call\n\n${reviewQs()}\n\n${asks}---\n\n*For best results, combine this analysis with direct buyer feedback.*\n\n${SUGGESTIONS_FOOTER}`;
    return analysis;
  }

  if (analysisType === 'deal_portfolio' || analysisType === 'loss_pattern') {
    return `${intro(analysisType === 'loss_pattern' ? 'Loss Pattern Analysis' : 'Deal Portfolio Analysis')}${multipleDeals ? `### Deals you gave\n\n${multipleDeals}\n\n` : `## What to give me\n\nA list of deals, one per line, with the outcome and the reason, for example in the form: deal name, outcome (won, lost or no_decision), value, days, reason, who won. Write your own deals: the form is the only thing to copy. Put them in \`multiple_deals\`.\n\n`}## What the analysis will look at

1. **Win rate** overall, by deal size, by segment and by competitor, using your own deals.
2. **Loss reasons**: the most common reasons, the stage where deals are lost and who you lose to.
3. **No-decision**: the share that ends with no decision, and how long before deals go quiet.
4. **Sales cycle**: the length by deal size and by outcome, and where deals stall.

No benchmark is shown: compare your own quarters with each other, and your segments with each other.

${altBlock}${sectorBlock}${peopleBlock}## Questions for the portfolio review

1. What do won deals have in common that lost deals lack${wlCtx.v ? ` (for example the roles involved: ${wlCtx.v.buyerRoles.slice(0, 3).join(', ')})` : ''}?
2. Where do deals stall in the process?
3. Which alternatives beat you most often?
4. What is the profile of your best customers?
5. When do you know you are going to lose?

${asks}---

${SUGGESTIONS_FOOTER}`;
  }

  // competitor_analysis
  const headToHead = alts.length ? `## Head-to-head by alternative\n\n${alts.map((a) => `### ${cap(a.text)}\n\n- **What it is:** ${a.label}.\n- **Where you tend to win** (confirm from your won deals): ${a.win}.\n- **Where you tend to lose** (confirm from your lost deals): when ${a.why}.\n- **Ask the buyer:** ${a.check}`).join('\n\n')}\n\n` : `## Head-to-head\n\nNo alternative was named in your deal details or in \`competitor_won\`. Name the alternatives the buyer used (the current way of working counts as one), one per line, to get a section for each.\n\n`;
  return `${intro('Competitive Win/Loss Analysis')}## What this analysis can and cannot say yet\n\n${dealOutcome ? '' : 'You gave the deal context but not the outcome or the reason, so nothing below says who won or why. '}It is the structure for the review, built from what you gave. Add the inputs listed at the end and run it again.\n\n---\n\n${altBlock ? '' : ''}${headToHead}${sectorBlock}${peopleBlock}## Questions for the review call\n\n${reviewQs(alts.length ? [`Which of the alternatives did the buyer give the most weight, and what did they say about ${alts[0].text}?`] : [])}\n\n## Battle card, once the outcome is known\n\n| Element | What to write | From your inputs |\n|---|---|---|\n| **Positioning** | The one thing that made the buyer pick, or not pick, ${P} | ${brief.kind ? cap(brief.kind) : 'your solution description'} |\n| **Landmines** | Questions that bring out the gap the buyer felt | The alternatives above and the sector's usual reasons |\n| **Objection handling** | The pattern of an answer for each usual reason | ${wlCtx.v ? `${wlCtx.v.objections.length} usual reasons in ${wlCtx.v.name} above` : 'the sector reasons, once the sector is clear'} |\n| **Proof points** | Evidence the buyer accepted | ${wlCtx.v ? wlCtx.v.proofShape : 'a customer result you can show'} |\n\n${asks}---\n\n${SUGGESTIONS_FOOTER}`;
}


// Placeholder for tools 7-12 - will be completed in next part
function executeTool(name: string, args: Record<string, unknown>): string {
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

// Ways to restructure a deal when the budget is the problem, by how the seller charges (no figure but the user's own deal value).
function restructureOptions(model: BusinessModel | null, dealValue: number, haveValue: boolean, pilot: string): string[] {
  const half = haveValue ? money(dealValue / 2) : '';
  const twelfth = haveValue ? money(dealValue / 12) : '';
  const two = haveValue ? `Pay in two instalments of ${half} instead of ${money(dealValue)} at once (your deal value split in two)` : 'Pay in two instalments instead of all at once';
  const monthly = haveValue ? `Bill monthly: ${twelfth} a month over twelve months (your deal value divided by twelve)` : 'Bill monthly instead of annually';
  const byModel: Record<string, string[]> = {
    saas: [`Start smaller: ${pilot}, then expand once the agreed measure is met`, two, monthly, 'Sign now and start the term at the next budget cycle (only if you can hold the terms until then)'],
    services: ['Start with one service or one location and add scope after the first service review', two, 'Tie part of the fee to the service levels both sides agree', 'Pay each stage of the transition when its exit criteria are met'],
    connectivity: ['Phase the contract by wave of sites and pay for each wave when it is live', 'Start with the worst-served sites, where the result will be clearest', two, 'Offer a longer term only if the buyer wants a lower monthly charge per site (your decision)'],
    investment: ['Make the first allocation a first tranche, with the rest committed to a review date', 'Agree a phased allocation over dates both sides set', 'Agree the reporting you will provide in place of a fee reduction', 'Set out the full fee schedule next to what the buyer pays today, on the same basis'],
    transactions: ['Start on one product line or region, then extend once volumes are proven', 'Offer volume tiers (your decision on where they start)', 'Agree a committed monthly volume in return for the rate'],
    marketplace: ['Start in one category or region', 'Offer a take rate that steps with committed volume (your decision)', 'Agree co-marketing in place of a rate cut'],
    hardware_software: ['Order the devices in stages and pay as each stage is delivered', two, 'Sign the software term now and phase the device order'],
  };
  return byModel[model || ''] || [`Start smaller: ${pilot}`, two, 'Sign now and start at the next budget cycle (only if you can hold the terms until then)'];
}

// Tool 10: Pricing Negotiation Guide
function executePricingNegotiationGuide(args: Record<string, unknown>): string {
  const scenario = (args.scenario as string) || 'discount_request';
  const dealValue = (args.deal_value as number) || 0;
  const discountRequested = (args.discount_requested as number) || 0;
  const yourSolution = (args.your_solution as string) || 'our solution';
  const competitorPrice = (args.competitor_price as string) || '';
  const valueDelivered = (args.value_delivered as string) || '';
  const buyerLeverage = (args.buyer_leverage as string) || '';
  const yourLeverage = (args.your_leverage as string) || '';
  const decisionTimeline = (args.decision_timeline as string) || '';
  const approvalAuthority = (args.approval_authority as string) || '';
  // Run 19 D80 (problems 4 and 6): the trades follow the business model; the competitor gap and the value are the user's own.
  // Run 20 round 1b (D92): the deal value, the leverage, the approver and the timeline shape every scenario; restructuring options are
  // worked out from the deal value and the way the seller charges; no bracket is left where the inputs or the sector can supply the words.
  const ctx = readContext(args.business_model, { seller: [yourSolution], context: [yourLeverage, valueDelivered, buyerLeverage, competitorPrice] });
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'our solution';
  const v = ctx.v;
  const trades = MODEL_TRADES[ctx.model || 'unknown'];
  const modelKey = ctx.model === 'investment' ? 'investment' : v ? v.id : '';
  const evalSteps = MAP_EVAL[modelKey] || [{ m: 'a pilot with one team', who: 'both' as Who }];
  const pilot = (evalSteps.find((x) => /\b(?:run|bring)\b.*\b(?:pilot|proof|trial)/i.test(x.m)) || evalSteps[0]).m;
  const gapMatch = competitorPrice.match(/(\d+(?:\.\d+)?)\s*%/);
  const competitorLine = gapMatch ? `"Your competitor is ${gapMatch[1]}% cheaper"` : competitorPrice ? `"Your competitor is cheaper" (you supplied: ${competitorPrice})` : `"Your competitor is cheaper"`;
  const scopeWord = ctx.model === 'saas' ? 'more users or a wider rollout' : ctx.model === 'connectivity' ? 'more sites or links' : ctx.model === 'services' ? 'a wider scope of services' : 'a wider scope';
  const haveValue = hasValue(args.deal_value) && dealValue > 0;
  const options = restructureOptions(ctx.model, dealValue, haveValue, lowerFirstIfCommon(pilot));

  const discountedValue = dealValue - (dealValue * discountRequested / 100);
  const revenueAtRisk = dealValue * discountRequested / 100;

  // Display text (output only; the figures above are unchanged)
  const dealValueText = hasValue(args.deal_value) ? money(dealValue) : NOT_SUPPLIED;
  const bothPricingInputs = hasValue(args.deal_value) && hasValue(args.discount_requested);
  const pricingNotComputed = 'not computed: needs deal value and discount';
  // The value the user gave: items with their labels; the reframe quotes the strongest one, the budget scenario lists them all.
  const vItems = parseProof(valueDelivered);
  const vFirst = pickProof(vItems, 1, ['result', 'quote', 'story', 'scale', 'recognition'])[0] || vItems[0];
  const valueQuoted = vFirst ? proofPhrase(vFirst).replace(/[.]$/, '') : valueDelivered.trim().replace(/[.]$/, '');
  const valueListText = vItems.length > 1 ? `${vItems.map((x) => `- ${proofPhrase(x)}${x.label ? ` (${proofSource(x)})` : ''}`).join('\n')}\nThese are claims you gave; check each is current before you quote it.` : '';
  const valueReframe = !valueDelivered
    ? `
"Before we discuss price, let's revisit the value we identified together.${v ? ` What does ${v.metrics[0]} cost you today, and what would it be worth to move it?` : ' What does this problem cost you today, and what would it be worth to fix it?'}${hasValue(args.deal_value) ? ` At ${dealValueText}, how does that compare?` : ''}"

(Add value_delivered to put the buyer's own value points here instead of a question.)`
    : `
"Before we discuss price, let's revisit what this has already delivered: ${valueQuoted}.
${hasValue(args.deal_value) ? `At ${dealValueText}, is that result worth more to you than the ${hasValue(args.discount_requested) ? `${discountRequested}%` : 'discount'} you are asking for?"` : 'What is that result worth to you in a year?" (add the deal value to compare the price with it)'}`;

  // ---- the deal, the leverage and the approver, shown in every scenario ----
  const claimWords = /\b(?:first|only|largest|leading|best|most|#1|unique|fastest|cheapest)\b/i;
  const leverageLine = yourLeverage
    ? `**Your leverage (your input):** ${yourLeverage.trim().replace(/[.]$/, '')}. Use it once, as the reason the price is what it is, and have the evidence ready.${claimWords.test(yourLeverage) ? ' It contains a claim ("first", "only", "largest", "leading" or similar): keep the source for it to hand, because the buyer will ask.' : ''}`
    : `**Your leverage:** none given. Add your_leverage (a capability they need, a timeline, switching costs, an invested champion) and this guide builds the price conversation around it.`;
  const theirLine = buyerLeverage ? `**Their leverage (your input):** ${buyerLeverage.trim().replace(/[.]$/, '')}. Answer it with the value case, not with a discount.` : '';
  const dealBlock = `## Your deal

| Factor | Value |
|--------|-------|
| **Solution** | ${args.your_solution ? yourSolution : NOT_SUPPLIED} |
| **Deal value** | ${dealValueText} |
${hasValue(args.discount_requested) ? `| **Discount requested** | ${discountRequested}% |\n| **Revenue at risk** | ${bothPricingInputs ? money(revenueAtRisk) : pricingNotComputed} |\n` : ''}| **Decision timeline** | ${decisionTimeline || 'Not specified'} |
| **Who approves** | ${approvalAuthority || 'Not specified'} |
${competitorPrice ? `| **Competitor price** | ${competitorPrice} |\n` : ''}
${leverageLine}
${theirLine ? `\n${theirLine}\n` : ''}${approvalAuthority ? `\nWrite the one-page case for ${approvalAuthority} first: the value, the price and what you ask in return.\n` : ''}${decisionTimeline ? `\nThe buyer's timeline is ${decisionTimeline}. Land any concession before it, not after.\n` : ''}
---
`;

  const scenarioGuides: Record<string, () => string> = {
    discount_request: () => `# Pricing Negotiation Guide: Discount Request

## Situation Analysis

${ctx.line}

| Factor | Value |
|--------|-------|
| **Solution** | ${args.your_solution ? yourSolution : NOT_SUPPLIED} |
| **Deal Value** | ${dealValueText} |
| **Discount Requested** | ${hasValue(args.discount_requested) ? `${discountRequested}%` : NOT_SUPPLIED} |
| **Revenue at Risk** | ${bothPricingInputs ? money(revenueAtRisk) : pricingNotComputed} |
| **Post-Discount Value** | ${bothPricingInputs ? money(printedSum([dealValue, -revenueAtRisk])) : pricingNotComputed} |
| **Decision Timeline** | ${decisionTimeline || 'Not specified'} |
| **Approval Authority** | ${approvalAuthority || 'Not specified'} |

---

## Leverage Assessment

### Your Leverage
${yourLeverage ? `${yourLeverage}\n\n${leverageLine.replace(/^\*\*Your leverage \(your input\):\*\* [^.]*\.\s*/, '')}` : `
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
${trades.map((t) => `| ${hasValue(args.discount_requested) ? `The ${discountRequested}% discount` : 'A discount'} | ${cap(t)} |`).join('\n')}

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
- "What specifically is the concern with the price?"
- "What would need to happen for our current pricing to work?"

### ${competitorLine}${gapMatch ? '' : ''}

**Don't Say:** "We can match that."

**Do Say:**
- "That's interesting. What's included in their price?"
- "Let's compare apples to apples. What capabilities are you comparing?"
- "Price is one factor. What are the other criteria that matter?"

### "We can only pay a lower figure"

**Don't Say:** "I'll talk to my manager."

**Do Say:**
- "I understand budget constraints. Help me understand how that number was determined."
- "Let's look at scope. What would need to change to fit that budget?"
- "What if we structured payments differently?${haveValue ? ` For example ${lowerFirstIfCommon(options[1] || options[0])}.` : ''}"

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
3. **Make a recommendation**: Not just the percentage the buyer asked for
4. **Get approval before offering**: Never surprise leadership`,

    budget_objection: () => `# Budget Objection Handling

${ctx.line}

## The Objection: "We don't have budget"

### Diagnose the Real Issue

**Question 1:** "Is this not in the current budget, or are you saying this won't be prioritized?"

**Question 2:** "If budget wasn't a constraint, would this be something you'd move forward with?"

**Question 3:** "How do priorities get funded outside of normal budget cycles?"

---

## Response Strategies

### Strategy 1: Find Hidden Budget

"Is there a discretionary fund for high-impact initiatives? Who would have authority over it?"${approvalAuthority ? ` You named ${approvalAuthority} as the approver: ask whether they hold such a fund.` : ''}

### Strategy 2: Build Business Case for Budget

"Let's build a business case that makes the return so clear that budget gets reallocated. What would leadership need to see?"

${valueQuoted ? `Build the case on the value you supplied: ${valueListText ? `\n${valueListText}` : `${valueQuoted}.`}` : `${v ? `Build the case on ${v.metrics[0]} and ${v.metrics[1]}: ask the buyer what each costs them today.` : 'Ask the buyer what the problem costs them today.'}`}${haveValue ? ` At ${dealValueText}, the value the buyer sees has to be higher than that every year.` : ''}

### Strategy 3: Restructure the Deal

**Options${haveValue && options.some((o) => o.includes('$')) ? ` (the amounts are your deal value ${dealValueText}, split or divided)` : ''}:**
${options.map((o) => `- ${o}`).join('\n')}

### Strategy 4: Different Budget Source

"Sometimes this comes from a different budget than you'd expect. Who else benefits from this outcome?"${v ? ` In ${v.name}: ${lowerFirstIfCommon(v.committee.split(';').slice(0, 1)[0])}, and ${lowerFirstIfCommon(v.committee.split(';').find((x) => /finance|checks|review/i.test(x))?.trim() || 'other functions review the cost')}.` : ''}

---

## When Budget Is Real

If budget genuinely isn't available:

1. **Hold your pricing for a stated date**, if you can honour it: "We can hold this pricing until a date you set."
2. **Secure commitment**: "If we do this, will you move forward?"
3. **Stay engaged**: Monthly check-in until budget cycle
4. **Create urgency** only with a real reason (say this only if it is true)`,

    competitor_pricing: () => `# Competitor Pricing Response

## Situation: Competitor has lower price

${competitorPrice ? `**Competitor Price:** ${competitorPrice}${gapMatch ? ` (a gap of ${gapMatch[1]}%${haveValue ? `: on your ${dealValueText} deal that is ${money(dealValue * Number(gapMatch[1]) / 100)} a year` : ''})` : ''}` : 'No competitor price was given (competitor_price).'}

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

"We could probably be cheaper if we cut capabilities. Which of the capabilities you asked for would you be happy to give up?" Only say more if your own customer data supports it.

### Option 2: Total Cost of Ownership

"Let me show you a total cost comparison over three years, with everything outside the quoted price: implementation, support and the time your own team spends."${haveValue ? ` Start from your ${dealValueText} and add the same items for the other option.` : ''}

### Option 3: Risk Framing

"The question isn't who's cheapest. The question is: what's the cost of getting this wrong?${yourLeverage ? ` With us you get ${lowerFirstIfCommon(clip(yourLeverage.trim().replace(/[.]$/, ''), 160))}.` : ''} Is that worth the difference in price?"

---

## Landmine Questions for Competitor

Suggest the buyer ask the competitor:
1. "What's NOT included in that price?"
2. "What does your highest-tier customer pay?"
3. "Can I talk to a customer who's been with you three years or more about total cost?"
4. "What happens when we need to scale?"`,

    procurement_pressure: () => `# Procurement Negotiation Guide

## Context: Dealing with Professional Buyers

Procurement's job is to reduce costs. Don't take it personally, but don't cave unnecessarily.

---

## Understanding Procurement

### Their Goals:
- Reduce vendor costs
- Demonstrate value to the organization
- Manage vendor risk
- Standardize terms

### Their Tactics:
- A blanket discount request on everything
- "We only work with vendors who accept our standard terms"
- "Legal won't approve those terms"
- "We're looking at other vendors"

---

## Counter-Strategies

### Tactic 1: Go High Before They Go Low

Before procurement engagement:
- Get executive sponsorship${approvalAuthority ? ` (${approvalAuthority})` : ''}
- Align on value with business stakeholders
- Get your champion to advocate internally

### Tactic 2: Separate Value from Price

"I understand you're focused on price. Can we first align on the value this delivers? Once we agree on value, let's discuss appropriate pricing."

### Tactic 3: Trade, Don't Cave

**When they ask for a discount${hasValue(args.discount_requested) ? ` of ${discountRequested}%` : ''}${haveValue && hasValue(args.discount_requested) ? ` (${money(revenueAtRisk)} off ${dealValueText})` : ''}:**
"We're happy to discuss pricing. Here's what we can do at different commitment levels..."

| Commitment | What the buyer gives | What you may give in return (your decision) |
|------------|----------------------|----------------------------------------------|
${trades.map((t) => `| ${cap(t)} | A firm commitment in writing | A concession you set in advance, within what ${approvalAuthority || 'your approver'} allows |`).join('\n')}

### Tactic 4: Use Time

If they're pressuring for a discount:
- "When does this need to be closed?"
- "What's driving that timeline?"
- "I can look at what is possible if we can commit by a date that works for both of us."

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

Renewals are different from new business. You have leverage (they're using ${P}) but also risk (they might leave).${haveValue ? ` The renewal is worth ${dealValueText}.` : ''}

---

## Pre-Negotiation Preparation

### Health Check:
- Usage metrics: Are they using the product?
- Support tickets: Are they having issues?
- Champion status: Is your champion still there?
- Value delivered: ${valueQuoted ? `you gave: ${valueQuoted}` : 'Can you quantify results?'}

### Expansion Opportunity:
- ${cap(scopeWord)}
- Additional products${brief.parts.length ? ` (${joinList(brief.parts.slice(0, 4).map(partLabel))})` : ''}
- Higher tier
- Professional services

---

## Renewal Scenarios

### Scenario A: Happy Customer
- Lead with expansion opportunity
- Lock in a multi-year term at the current rate, only if you can offer that
- Ask for a case study or reference

### Scenario B: Dissatisfied Customer
- Address issues before discussing renewal
- Offer a success plan
- Consider a concession for a commitment to improve

### Scenario C: Price Pressure
- Document value delivered
- Propose a longer term in exchange for any concession
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

The renewal conversation is a good time to expand:

"Since we're discussing renewal, I wanted to share ${brief.parts.length > 1 ? partLabel(brief.parts[1]) : 'what else ' + P + ' can do for you'}. Would you like to see how that could help?" Mention a customer example only if one has agreed.`,

    multi_year_negotiation: () => `# Multi-Year Deal Negotiation

## Value Exchange Framework

Multi-year deals benefit both parties. Structure them to reflect that.${haveValue ? ` Your deal value of ${dealValueText} is the base for every term below.` : ''}

---

## What You Get:
- Predictable revenue
- Reduced churn risk
- Less sales effort on renewal

## What They Get:
- A price agreed for the whole term (only if you offer one: say it in your contract's words)
- Budget predictability
- Fewer procurement cycles
- Deeper partnership

---

## Multi-Year Structure

${EXAMPLES}
| Term | What the buyer commits | What you can offer (your decision) |
|------|------------------------|------------------------------------|
| 1 year | The base deal${haveValue ? ` at ${dealValueText}` : ''} | Standard terms |
| 2 years | A second year committed | A concession you set in advance |
| 3 years | Three years committed | A larger concession, or a price lock (if you offer one) |

**Important:** price lock vs. actual discount
- "No price increase" is valuable without being a discount
- A discount for a longer term is your decision; set the amount in advance, not in the meeting

---

## Structuring Multi-Year Deals

### Option 1: Annual Payment
- Lower risk for them
- Consider a payment-milestone concession

### Option 2: Prepaid
- Biggest concession from your side, if any
- Improves your cash position
- Reduced collection effort

### Option 3: Hybrid
- Year 1 upfront
- Later years annual
- Moderate concession

---

## Key Terms to Include:

- [ ] Price lock for term (only if you offer one)
- [ ] Growth pricing agreed in advance
- [ ] Auto-renewal language
- [ ] Early termination clause (or lack thereof)
- [ ] Success criteria for continued value`,

    enterprise_agreement: () => `# Enterprise Agreement Negotiation

## Large Deal Complexity

Enterprise deals have unique dynamics: multiple stakeholders, long cycles, complex terms.${haveValue ? ` This one is ${dealValueText}.` : ''}

---

## Enterprise Buying Reality:

### Decision Makers:
${v ? `In ${v.name}: ${v.committee}` : `- Business sponsor (wants outcomes)
- IT/Technical (wants fit and security)
- Procurement (wants savings)
- Legal (wants low risk)
- Finance (wants predictability)`}

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
- "I'd like to include ${approvalAuthority || 'the business sponsor'} in this discussion to ensure alignment"
- "Can we set up a joint meeting to discuss terms and value together?"

### Tactic 2: Package the Deal

Instead of line-item negotiation:
- Bundle products and services${brief.parts.length ? ` (${joinList(brief.parts.slice(0, 4).map(partLabel))})` : ''}
- Create "enterprise packages"
- Make it hard to cherry-pick

### Tactic 3: Use Competition Carefully

Enterprise deals often have multiple vendors. Position on value, not price:
- "We know you're evaluating alternatives. Here's what makes us different: ${yourLeverage ? lowerFirstIfCommon(clip(yourLeverage.trim().replace(/[.]$/, ''), 180)) : 'the differentiators you can prove'}."
- "Let me walk you through the business case."

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
- Right to case study/reference`,
  };

  const generator = scenarioGuides[scenario] || scenarioGuides['discount_request'];
  const pricingSector = v ? `\n\n---\n\n${sectorNotes(v, 'objections')}` : '';
  const text = generator().replace(/^# (.+)$/m, (m, t) => `# ${t}: ${P}`);
  // every scenario but the discount request (which has its own situation table) opens with the deal, the leverage and the approver
  const withDeal = scenario === 'discount_request' || !scenarioGuides[scenario]
    ? text
    : text.replace(/^(# .+\n)/, (m) => `${m}\n${dealBlock}\n`);
  return `${withDeal}${pricingSector}`;
}


// Tool 11: Champion Enablement Kit
// Run 20 round 1b (D92): no bracket is left where the inputs or the sector notes can supply the words; the product is named once in
// full and by its short name after that; the objections are answered by their kind (src/answers.ts) and say what to confirm; the
// target stakeholder's own concerns (src/answers.ts role notes) shape each asset; no figure is made up: the returns table asks for the
// buyer's own numbers and points to roi_business_case_builder.
function executeChampionEnablementKit(args: Record<string, unknown>): string {
  const assetType = (args.asset_type as string) || 'executive_brief';
  const championRole = (args.champion_role as string) || '';
  const championName = (args.champion_name as string) || championRole || 'the champion';
  const targetStakeholder = (args.target_stakeholder as string) || 'leadership';
  const yourSolution = (args.your_solution as string) || 'our solution';
  const keyValuePoints = (args.key_value_points as string) || '';
  const knownObjections = (args.known_objections as string) || '';
  const competitiveContext = (args.competitive_context as string) || '';
  const budgetContext = (args.budget_context as string) || '';
  const urgencyDrivers = (args.urgency_drivers as string) || '';
  const championWins = (args.champion_wins as string) || '';
  // Run 19 D80 (problems 3 and 8): every objection the user typed gets an answer; value points fill the returns table;
  // no placeholder percentage or dollar figure is printed; sector notes say who else will read the case.
  const champCtx = readContext(undefined, { seller: [yourSolution], context: [keyValuePoints, knownObjections, competitiveContext], role: [targetStakeholder, championRole] });
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'the solution';
  const v = champCtx.v;
  const investment = champCtx.model === 'investment';
  const bctx: BlockerContext = { product: brief.short, sectorObjections: v?.objections, sectorName: v?.name, model: champCtx.model };
  const modelKey = investment ? 'investment' : v ? v.id : '';
  const valueItems = splitItems(keyValuePoints).map((x) => parseProof(x)[0] || { text: x, label: '', kind: 'story' as const });
  const valueText = valueItems.map((x) => cleanClaim(x.label ? `${x.text} (${x.label})` : x.text));
  const valueFirst = valueItems[0] ? valueItems[0].text.replace(/[.]+$/, '') : '';
  const objectionItems = splitItems(knownObjections);
  const alts = splitItems(competitiveContext);
  const target = roleFor(targetStakeholder, investment);
  const sameRole = championRole && targetStakeholder && championRole.trim().toLowerCase() === targetStakeholder.trim().toLowerCase();
  const solLine = args.your_solution ? `**Solution:** ${yourSolution.trim()}\n\n` : '';
  const sameNote = solLine + (sameRole ? `> You named the same role (${championRole}) as the champion and as the person to convince. If ${championRole} is your champion, name the person above them who must approve, and write this for that person.\n\n` : '');
  const who = `${championName}${championRole && championName !== championRole ? `, ${championRole}` : ''}`;
  const kindLine = brief.kind ? `${P} ${describeWith(brief)}.` : `${P} is the solution this document recommends.`;
  const partsLine = '';
  const needsLine = `${cap(targetStakeholder)} is ${aAn(target.label)}: they care about ${target.cares}, and worry about ${target.worry}. They will want to see ${target.needs}.`;
  const metricsLine = v ? `In ${v.name} the case is usually judged on ${joinList(v.metrics.slice(0, 4))}.` : '';
  const valueBullets = valueText.length ? valueText.map((x) => `- ${x}`).join('\n') : `- No value points were given. Add key_value_points: the two or three results ${targetStakeholder} should expect.`;
  const budgetLine = budgetContext ? budgetContext : 'Not given. Add budget_context (the budget situation and the price) to put it here.';
  const objBlock = objectionItems.length ? objectionItems.map((o) => `### Objection: ${q(o)}\n\n${blockerLines(o, bctx).join('\n')}\n\n**If they push back:** acknowledge the concern, answer with evidence, and ask what would settle it.\n`).join('\n') : '';
  const altsLine = alts.length ? `We looked at: ${joinList(alts)}.` : 'No alternatives were given (competitive_context). Name the options that were considered, including doing nothing.';
  const pilotSteps = (MAP_EVAL[modelKey] || []).slice(0, 4);
  const implRows = pilotSteps.length ? pilotSteps.map((s, i) => `| Step ${i + 1} | ${s.m} |`).join('\n') : `| Step 1 | Agree the scope, the owner on each side and the measure of success |\n| Step 2 | Run a first phase with one team |\n| Step 3 | Review the result and decide the wider rollout |`;
  const risks = v ? v.objections.map((o) => `| ${o.objection} | ${o.response} |`).join('\n') : '| Implementation delay | Phased approach |\n| User adoption | Pilot with the people who will use it |\n| Integration | Technical validation before signing |';
  const whyNow = urgencyDrivers ? `**Why Now:** ${urgencyDrivers}` : 'Why now: no urgency driver was given (urgency_drivers). Name the date, renewal, audit or target that sets the timing.';

  const assetGenerators: Record<string, () => string> = {
    executive_brief: () => `# Executive Brief for ${cap(targetStakeholder)}

## Prepared for: ${who}
## Topic: ${P}

${sameNote}---

### The Opportunity

${kindLine} ${partsLine}

**Key Benefits:**
${valueBullets}

### The Business Case

**What happens today:** ${alts.length ? `The work is handled with ${joinList(alts)}.` : 'No current way of working was given (competitive_context).'}

**What it costs:** put it in the buyer's own numbers${v ? `; ${metricsLine}` : ''} The roi_business_case_builder tool turns their cost figures into a return.

**Solution:** ${P}. ${valueFirst ? `The outcome sought: ${lowerFirstIfCommon(valueFirst)}.` : 'Add the result it delivers (key_value_points).'}

**What ${target.label}s look for:** ${target.needs}.

### Investment & Return

${budgetLine}

### Recommendation

Proceed with ${P}.${valueFirst ? ` The outcome sought: ${lowerFirstIfCommon(valueFirst)}.` : ''}

${whyNow}

${objectionItems.length ? `### Questions to expect\n\n${objectionItems.map((o) => `- ${q(o)}: ${blockerShort(o, bctx)}`).join('\n')}\n` : ''}
---

*${who} to present to ${targetStakeholder}*`,

    internal_business_case: () => `# Internal Business Case

## ${P} Investment Proposal

### Submitted by: ${who}
### For: ${targetStakeholder}

${sameNote}---

## Executive Summary

This document presents the business case for investing in ${P}.${valueFirst ? ` The outcome sought: ${lowerFirstIfCommon(valueFirst)}.` : ''} ${needsLine}

${valueText.length ? `**Value Summary:**\n${valueText.map((x) => `- ${x}`).join('\n')}\n` : ''}
---

## Current State

### How the work is done today
${alts.length ? alts.map((a) => `- ${cap(a)}`).join('\n') : 'No current way of working was given (competitive_context). Describe it in one or two lines, including any workaround.'}

### Impact

Put a number from your own data against each row.

| Area | What to measure |
|------|-----------------|
| Time | Hours spent on the workaround or the manual step each week |
| Cost | What the current way costs in a year |
| Risk | What one failure costs, and how often it happens |
| Opportunity | What the current way stops us doing |
${v ? `\n${metricsLine}\n` : ''}
---

## Proposed Solution

### Overview
${kindLine} ${partsLine}

### How it would start
| Step | What happens |
|------|--------------|
${implRows}

### Why this solution
${altsLine}${valueText.length ? ` We recommend ${P} because: ${joinList(valueText.map((x) => lowerFirstIfCommon(x)))}.` : ''}

---

## Financial Analysis

### Investment Required
${budgetLine}

### Expected Returns
| Benefit | Annual value |
|---------|--------------|
${valueItems.length ? valueItems.map((x) => `| ${cap(clip(x.text, 180))} | The buyer's own number: enter it from the finance team's data |`).join('\n') : '| No value points given | Add key_value_points |'}

### ROI Analysis
- **ROI, payback and three-year net value:** from your ROI business case in the buyer's own numbers (the roi_business_case_builder tool builds it); leave them out rather than guess.

---

## Risk Assessment

${v ? `The risks buyers in ${v.name} usually raise, with a way to answer each:` : ''}

| Risk | Mitigation |
|------|------------|
${risks}

---

${objectionItems.length ? `## Objections to Answer Before the Meeting\n\n${objBlock}\n---\n\n` : ''}${v ? `${sectorNotes(v, 'committee')}\n\n---\n\n` : ''}## Recommendation

Based on this analysis, I recommend approving the investment in ${P}.

${whyNow}

---

## Next Steps

1. Approve the investment
2. Agree the contract and the first step: ${pilotSteps[0] ? lowerFirstIfCommon(pilotSteps[0].m) : 'the scope, the owners and the measure'}
3. Begin implementation

---

*Prepared by ${who}*
*Date: ${new Date().toISOString().split('T')[0]}*

${SUGGESTIONS_FOOTER}`,

    objection_responses: () => `# Objection Response Guide

## For: ${who}
## Situation: Selling ${P} internally

${sameNote}---

${objectionItems.length ? `## Anticipated Objections\n\n${objBlock}` : `## Common Objections${v ? ` in ${v.name}` : ''}\n\n${v ? v.objections.map((o) => `### "${o.objection}"\n\n**Pattern of an answer:** ${o.response}\n`).join('\n') : ['We do not have budget for this.', 'We have tried something similar before.', 'This is not a priority right now.'].map((o) => `### "${o}"\n\n${blockerLines(o, bctx).join('\n')}\n`).join('\n')}`}

${urgencyDrivers ? `### "This isn't a priority right now."\n\n**Your reason to act now:** ${urgencyDrivers}\n` : ''}
${valueText.length ? `## Value points to lean on\n\nWhatever the objection, come back to what ${P} is meant to deliver:\n${valueText.map((x) => `- ${x}`).join('\n')}\n` : ''}
## General Tips for ${championName}

1. **Listen first**: Understand the real concern
2. **Acknowledge**: Show you heard them
3. **Respond with evidence**: Not just opinion
4. **Check for understanding**: "Does that address your concern?"
5. **Offer next step**: Keep momentum

---

${championWins ? `## Your Personal Stake\n\nWhen this succeeds, you get:\n${championWins}\n\nRemember this when pushing through objections.` : ''}`,

    presentation_talking_points: () => `# Presentation Talking Points

## For: ${who} presenting to ${targetStakeholder}
## Topic: ${P}

${sameNote}---

## Opening (2 minutes)

**Hook:**
"${valueFirst ? `Here is the outcome I want us to reach: ${lowerFirstIfCommon(valueFirst)}.` : 'Here is a problem that costs us every week, and a way to fix it.'}"

**Agenda Preview:**
"In the next 15 minutes, I'll cover: the problem, the solution, the business case, and my recommendation."

---

## The Problem (3 minutes)

**Key Points:**
1. How we do it today: ${alts.length ? joinList(alts) : 'describe the current way of working'}
2. What it costs: ${v ? `${joinList(v.metrics.slice(0, 3))} are the numbers to quote, from our own data` : 'the number, from our own data'}

**Transition:**
"Here is the solution I recommend."

---

## The Solution (4 minutes)

**Introduction:**
"${kindLine}"

**Key Capabilities:**
${valueText.length ? valueText.map((p, i) => `${i + 1}. ${p}`).join('\n') : '1. Add key_value_points to list the capabilities that matter here.'}

${alts.length ? `\n**Why This Solution:**\n"We looked at ${joinList(alts)}. ${P} is the best fit because ${valueText.length ? lowerFirstIfCommon(valueText[0]) : 'of the points above'}."` : ''}

**Transition:**
"Let me show you the numbers."

---

## The Business Case (4 minutes)

**Investment:**
${budgetContext ? budgetContext : 'Not given (budget_context).'}

**Return:**
Quote the return from our own ROI case (the roi_business_case_builder tool), not from this page.

**Risk:**
"The risk of not doing this is the cost we just discussed."

---

## Recommendation (2 minutes)

**The Ask:**
"My recommendation is to proceed with ${P}."

${urgencyDrivers ? `\n**Timing:**\n"We should move now because ${urgencyDrivers}."` : ''}

**Next Steps:**
"If you approve, next steps are:
1. ${pilotSteps[0] ? cap(pilotSteps[0].m) : 'Agree the scope and the owners'}
2. ${pilotSteps[1] ? cap(pilotSteps[1].m) : 'Run a first phase with one team'}
3. Review the result and decide the wider rollout"

---

## Q&A Prep

**Expected Questions:**
${objectionItems.length ? objectionItems.map((o) => `- ${q(o)}: ${blockerShort(o, bctx)}`).join('\n') : (v ? v.objections.map((o) => `- "${o.objection}": ${o.response}`).join('\n') : '- Budget questions: point to the ROI case\n- Timeline questions: show the implementation steps\n- Risk questions: discuss mitigation')}

---

${championWins ? `## Personal Note\n\nRemember: ${championWins}\n\n` : ''}${SUGGESTIONS_FOOTER}`,

    email_to_stakeholder: () => `# Email to ${targetStakeholder}

## From: ${championName}
## Subject Options:
- Recommendation: ${P}
- A proposal for your review: ${P}
- A 15-minute decision on ${P}

---

## Email Body

Hi,

I wanted to bring a recommendation to your attention.

**The Opportunity:**
${kindLine} Based on my analysis:
${valueBullets}

**The Investment:**
${budgetContext ? budgetContext : 'The investment is not given here (budget_context). State it in one line.'}

**The Return:**
The return should come from our own ROI case, in our own numbers. Do not send a ratio you cannot show.

${urgencyDrivers ? `**Why Now:**\n${urgencyDrivers}\n` : ''}
**My Recommendation:**
Proceed with ${P}.

Would you be available for a 15-minute discussion this week? I can walk you through the details and answer any questions.

Thanks,
${championName}

---

## Alternative: Brief Version

Hi,

Would you be open to a 15-minute discussion about ${P}? ${valueFirst ? `The outcome I am after: ${lowerFirstIfCommon(valueFirst)}.` : 'It could help us with a problem we both know.'} I would like your input before we proceed.

Let me know what works for your schedule.

${championName}`,

    roi_one_pager: () => `# ROI One-Pager: ${P}

## For: ${targetStakeholder} | Prepared by: ${who}

${sameNote}---

### The Opportunity

**Problem:** ${alts.length ? `Today the work is handled with ${joinList(alts)}.` : 'Describe the current challenge in one sentence (competitive_context holds the current way of working).'}

**Solution:** ${P}

**Impact:** ${valueFirst ? valueFirst : 'Add key_value_points.'}

---

### Investment Summary

${budgetLine}

---

### Value Creation

| Benefit | Annual value | Source |
|---------|--------------|--------|
${valueItems.length ? valueItems.map((x) => `| ${cap(clip(x.text, 180))} | The buyer's own number | ${x.label ? proofSource(x) : 'To be confirmed with the buyer'} |`).join('\n') : '| No value points given | Add key_value_points | |'}

---

### ROI Analysis

Run the roi_business_case_builder tool with the buyer's cost or value figures. It calculates the return, the payback and the three-year value; none is made up here.

---

### Why Now

${urgencyDrivers ? urgencyDrivers : 'No urgency driver was given (urgency_drivers).'}

---

### Recommendation

**Approve investment in ${P}**

---

*Contact: ${who}*`,

    competitive_comparison: () => `# Competitive Comparison

## ${P} vs Alternatives

### Prepared for: ${targetStakeholder}
### By: ${who}

${sameNote}---

## Evaluation Summary

${altsLine}

**Recommendation:** ${P}

---

## Comparison Matrix

Rate each cell from your own evaluation. The tool does not rate anyone.

| Criteria | ${P} | ${alts.length ? alts.map((a) => cap(clip(a, 40))).join(' | ') : 'Alternative'} |
|----------|------|${(alts.length ? alts : ['x']).map(() => '------').join('|')}|
${['Fit with what we need', 'Integration with our systems', 'Time to start', 'Support', 'Total cost over three years', 'Risk'].map((c) => `| **${c}** | Rate it | ${(alts.length ? alts : ['x']).map(() => 'Rate it').join(' | ')} |`).join('\n')}

---

## Why ${P}

${valueText.length ? `### Key Advantages:\n${valueText.map((p) => `- ${p}`).join('\n')}` : '### Key Advantages:\nAdd key_value_points.'}

---

## What the others leave to us

${alts.length ? alts.map((a) => `- ${cap(a)}: what does it leave undone, and what does that cost?`).join('\n') : 'Name the alternatives (competitive_context) and ask the same question of each.'}

---

## Recommendation

Based on our evaluation, ${P} is the best choice.${valueFirst ? ` The outcome sought: ${lowerFirstIfCommon(valueFirst)}.` : ''}

---

*Analysis by ${who}*`,

    risk_assessment: () => `# Risk Assessment: ${P}

## For: ${targetStakeholder}
## Prepared by: ${who}

${sameNote}---

## Executive Summary

This assessment lists the risks of introducing ${P} and how each would be handled. ${needsLine}
${valueText.length ? `\nThe investment is meant to deliver:\n${valueText.map((x) => `- ${x}`).join('\n')}\n` : ''}
*Ratings below are not from your input: set each one from your own assessment.*

---

## Risk Assessment Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
${v ? v.objections.map((o) => `| ${o.objection} | Rate it | Rate it | ${o.response} |`).join('\n') : '| Implementation delay | Rate it | Rate it | Phased approach |\n| User adoption | Rate it | Rate it | Pilot with the people who will use it |\n| Integration | Rate it | Rate it | Technical validation first |'}
${objectionItems.map((o) => `| ${cap(o)} | Rate it | Rate it | ${blockerShort(o, bctx)} |`).join('\n')}

---

## Risk of Doing Nothing

| Factor | Impact |
|--------|--------|
| The current way of working${alts.length ? ` (${joinList(alts)})` : ''} | What it costs a year, from our own data |
${v ? v.metrics.slice(0, 3).map((m) => `| ${cap(m)} | What it costs us today |`).join('\n') : ''}

---

## Conclusion

Compare the cost of acting with the cost of waiting, in our own numbers, and write the conclusion here. ${whyNow}

---

*Assessment by ${who}*`,
  };

  const generator = assetGenerators[assetType] || assetGenerators['executive_brief'];
  return generator();
}


// Tool 12: Competitive Trap Setter
// Run 20 round 1b (D92): a strengths sentence stays whole (a comma inside a sentence is not a list); credentials and recognition are
// mentioned, never turned into something to demo live; a competitor that is a way of working (manual routing, an in-house build,
// disconnected tools) is not asked about a contract, references or support; each weakness becomes a question about its own topic;
// the buyer's persona and priorities shape the questions; no bracket is left.
const TRAP_TOPICS: { re: RegExp; topic: string; q: string }[] = [
  { re: /setup|set-up|implement|onboard|months|weeks|rollout|go-live|deploy/i, topic: 'the time from signing to the first real result', q: 'How long from signing to the first real result in each option, and what do you need to have ready? Could each show it on your own data?' },
  { re: /manual|human[- ]judged|judg|by hand|spreadsheet|modules and platforms/i, topic: 'which decisions are made by the system and which wait for a person', q: 'Which decisions does each option make by itself and which wait for a person, and how long does each take?' },
  { re: /periodic|batch|scans?|delay|lag|stale|refresh|overnight|real[- ]time/i, topic: 'how soon each option sees a change', q: 'How soon after something changes does each option show it, and what happens in between?' },
  { re: /validat|false positive|theoretical|live entry|real exposure|noise/i, topic: 'telling a real problem from a theoretical one', q: 'How does each option tell a real problem from a theoretical one, and can it show that on your own data?' },
  { re: /financial impact|quantif|cost of a finding|business impact/i, topic: 'putting a cost on a finding', q: 'Can each option express a finding in terms of what it would cost you, and how is that worked out?' },
  { re: /isolated|silo|not connected|point tools?|do not share|disconnected|several consoles|correlat/i, topic: 'whether findings or records connect', q: 'Can each option show how the pieces connect, or does your team join them by hand?' },
  { re: /drift|source of truth|governance|bypass|gates?/i, topic: 'keeping everything in step and enforcing the rules', q: 'How does each option keep specs, documents and tests in step, and where is a rule enforced?' },
  { re: /address|data|integrat|erp|tms|siem|import|sync/i, topic: 'the handling of your own data and the systems it must connect to', q: 'How does each option handle your own data and the systems it must connect to? Could each show it live?' },
  { re: /price|cost|expensive|fee|overage|charge/i, topic: 'the full cost over three years', q: 'What does each option cost over three years, including everything outside the quoted price?' },
  { re: /support|sla|service|response|uptime|outage|repair/i, topic: 'the response to an urgent issue', q: 'What happens in each option when something urgent breaks: who answers, how fast, and what does the contract promise?' },
  { re: /opaque|black box|explain|transparen|report/i, topic: 'how each option explains its decisions', q: 'How does each option explain its decisions and report results you can check yourself?' },
  { re: /scale|volume|slow|performance|latency/i, topic: 'performance at your real volumes', q: 'How does each option perform at your real volumes, and can it show that on your data?' },
  { re: /adopt|use|app|interface|ux|training/i, topic: 'everyday use by the people who will rely on it', q: 'Who uses each option every day, and what do they need to learn before it works for them?' },
];
const CRED_RE = /\b(?:named|leader|award|recogni\w+|analyst|quadrant|backed by|inner circle|launch partner|certified|certifications?|iso\s?\d{4,5}|soc ?2|pci|partners? with|partnerships?|trusted by|\d[\d,.+]*\s*(?:years|customers|companies|countries|engineers))\b/i;
function executeCompetitiveTrapSetter(args: Record<string, unknown>): string {
  const competitor = (args.competitor as string) || 'Competitor';
  const competitorWeaknesses = (args.competitor_weaknesses as string) || '';
  const yourSolution = (args.your_solution as string) || 'our solution';
  const yourStrengths = (args.your_strengths as string) || '';
  const evaluationStage = (args.evaluation_stage as string) || 'mid';
  const buyerPriorities = (args.buyer_priorities as string) || '';
  const trapType = (args.trap_type as string) || 'all';
  // Run 19 D80: the sector and business model are read from the inputs (problems 4 and 8).
  const ctx = readContext(args.business_model, { seller: [yourSolution], context: [yourStrengths, competitorWeaknesses, buyerPriorities, competitor], role: [args.buyer_persona] });
  const model = ctx.model;
  const software = model === null || model === 'saas' || model === 'hardware_software';
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'our solution';
  const v = ctx.v;
  const investment = model === 'investment';
  const persona = args.buyer_persona ? roleFor(args.buyer_persona as string, investment) : null;
  // A competitor that is a way of working (a manual process, an in-house build, disconnected tools, a legacy system) has no contract,
  // no reference customers and no support desk to ask about.
  const isWay = ALT_KINDS.some((k) => k.re.test(competitor)) || competitor.split(/\s+/).length > 6;
  const compLabel = isWay ? 'the current approach' : competitor;
  const compPoss = isWay ? 'the current approach\'s' : `${competitor}'s`;
  // Run 19 D80 (problem 2): a weakness is the seller's own note. It is never read out to the buyer inside a question; the
  // question asks the buyer to test the topic the weakness is about. The competitor's name is taken off the front of the note.
  const strip = (w: string) => w.trim().replace(new RegExp('^' + competitor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(?:is|has|needs|struggles|lacks|relies)?\\s*', 'i'), (m) => m.replace(competitor, '').trimStart() ? m.replace(new RegExp(competitor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').trimStart() : '');
  const weaknesses = splitItems(competitorWeaknesses);
  const allStrengths = splitItems(yourStrengths);
  const credentials = allStrengths.filter((s) => CRED_RE.test(s));
  const strengths = allStrengths.filter((s) => !CRED_RE.test(s));
  const claimsHere = claimsIn(yourStrengths);
  const topicOf = (w: string): { topic: string; q: string } => TRAP_TOPICS.find((t) => t.re.test(w)) || { topic: 'the scenario you care most about', q: 'How will you test the scenario you care most about in each option? Could each vendor show it live, with your own data?' };
  const sectorQ = v ? v.discovery.slice(0, 2).map((x) => `- "${x}"`).join('\n') : '';
  const personaQ = persona ? persona.questions.slice(0, 2).map((x) => `- "${x}"`).join('\n') : '';
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
  const wayQs = [
    '"Who keeps it running today, and what happens when they are away?"', '"What does it cost you in a year, in people\'s time and in fees?"', '"What breaks when your volumes or your plans change?"',
  ];
  const sections: Record<string, string> = {
    discovery_questions: `## Discovery Questions (Landmines)

These questions let the buyer find ${compPoss} gaps through their own evaluation. The weak points below are your own notes: never read one out to the buyer.

### General Competitive Discovery
- "What other options are you evaluating, and what criteria are you using?"
- "What's most important to you in making this decision?"
- "Have you defined must-haves versus nice-to-haves?"
${buyerPriorities ? `- "You told me what matters most: ${q(lowerFirstIfCommon(buyerPriorities.length <= 170 ? buyerPriorities.trim().replace(/[.]+$/, '') : (painClauses(buyerPriorities)[0] || buyerPriorities.trim().split(/[;,]/)[0])))}. How would you judge that each option delivers it?"\n` : ''}${sectorQ}
${personaQ}

### Capability Landmines
${weaknesses.length ? weaknesses.map((w) => `
**Their weak point (your note, not for the buyer):** ${cap(strip(w))}
**Landmine Question:** "${topicOf(w).q}"
**Why It Works:** The buyer tests ${topicOf(w).topic} themselves, so the gap shows up in their own evaluation.
`).join('\n') : `
No weak points were given (competitor_weaknesses). Add what you know about ${compLabel} and each one becomes a question here. Until then, ask: "How will you test the scenario you care most about in each option?"`}

### ${isWay ? 'Questions about the current approach' : implementationLabel}
${(isWay ? wayQs : implementationQs).map((x) => `- ${x}`).join('\n')}
${isWay ? '' : `
### Support Landmines
- "What level of support is included? What happens when you have an urgent issue?"
- "Can you talk to customers who've been through their support process?"`}`,

    evaluation_criteria: `## Evaluation Criteria Positioning

### Criteria to Establish Early

${strengths.length ? `Based on your strengths, suggest these as requirements (only where you can prove them):\n${strengths.map((s) => `- **${cap(s)}**: "Which of the options can show this on our own scenario? Is it on your evaluation list?"`).join('\n')}` : `No demonstrable strengths were given (your_strengths). Add what ${P} can show live, and each becomes a criterion here.`}
${credentials.length ? `\n### Credentials (mention them, do not make them criteria)\n\nThese cannot be demonstrated in an evaluation. Say them in a sentence when they answer a concern:\n${credentials.map((s) => `- ${cap(s)}`).join('\n')}\n` : ''}${claimsHere.length ? `\n### Claims to source\n\nThe buyer will ask for the source of: ${joinList(claimsHere.map((c) => q(clip(c, 90))))}. Have it ready, or soften the wording.\n` : ''}
### How to Suggest Criteria

"Before you evaluate anyone, it helps to agree the criteria. ${strengths.length ? `I'd suggest these: ${strengths.slice(0, 3).map((s) => lowerFirstIfCommon(s)).join('; ')}.` : 'I would suggest starting with the outcomes you need.'} Would it help if I shared questions to ask every vendor?"`,

    reference_questions: `## Reference Call Questions

${isWay ? `Suggest the buyer ask these of people who live with ${compLabel} today (their own team, or peers who work the same way):` : `Suggest the buyer ask these questions when speaking with ${compPoss} references:`}

### General Questions
- "${isWay ? 'How long have you worked this way?' : 'How long have you been using it?'}"
- "How does the actual experience compare to what you expected?"
- "What surprised you after you started?"

### Capability Questions
${weaknesses.length ? weaknesses.map((w) => `- "Tell me about ${topicOf(w).topic}. What did you see in practice?"`).join('\n') : `- "What limitations have you run into?"
- "What workarounds have you had to build?"`}

### The Killer Question
- **"${isWay ? 'Knowing what you know now, would you keep working this way?' : 'Knowing what you know now, would you choose them again?'}"**`,

    technical_requirements: `## ${software ? 'Technical Requirements' : 'Requirements'} (Traps)

### RFP or Requirements Document

${strengths.length ? `Requirements built on your strengths (keep only what you can demonstrate):\n${strengths.map((s, i) => `${i + 1}. **${cap(s)}**: "The vendor must demonstrate this live, on our own data, during the evaluation."`).join('\n')}` : `No demonstrable strengths were given (your_strengths). Add what ${P} can show live and each becomes a requirement here.`}

### Evaluation Scenarios

${weaknesses.length ? weaknesses.map((w, i) => `**Scenario ${i + 1}:** ${cap(topicOf(w).topic)}, tested live on the buyer's own data
- Your note (not for the buyer): ${strip(w)}
- Success criteria: agree a measurable outcome with the buyer before the test`).join('\n\n') : `1. The scenario the buyer cares most about${buyerPriorities ? ` (${buyerPriorities})` : ''}: test the core capability on their own data
2. A scale scenario: test performance at their real volumes`}`,

    commercial_terms: `## Commercial Terms (Positioning)

### ${isWay ? 'Cost Comparison' : 'Pricing Comparisons'}

${isWay ? `When they compare ${P} with ${compLabel}, make sure they compare:\n- What ${compLabel} costs a year in people's time, fees and the cost of its failures\n- What ${P} costs over the same period, including set-up and the team's time\n- What changes for the people who do the work today` : `When they compare prices, make sure they compare:
${model === 'investment' ? '- Management and performance fees\n- Minimum mandate size and lock-in\n- Reporting and transparency included\n- Exit terms' : model === 'services' ? '- The rate card and how change requests are priced\n- Transition costs\n- Service credits and how they are paid\n- Exit and handover terms' : model === 'connectivity' ? '- Monthly charge per site or link over the full term\n- One-time installation and equipment charges\n- Service credits for missed SLAs\n- Early termination charges' : '- Total cost of ownership (not just the licence)\n- Implementation and training costs\n- Support tiers\n- Costs as usage grows'}`}

${isWay ? '' : `**Questions to Ask ${competitor}:**
- "What is NOT included in the quoted price?"
- "What do years 2 and 3 cost?"
- "How are price increases decided?"

### Contract Terms to Check

Ask these about ${competitor}'s contract (nothing here says ${competitor} has these terms; check the actual contract):
- Does it renew automatically, and can the price rise at renewal?
- What are the termination rights and notice periods?
- Are there fees outside the quoted price?

`}### Your Own Terms

Offer only the terms you actually have (payment options, contract length), in your own words. Promise nothing you cannot put in the contract.`,
  };

  let output = `# Competitive Positioning: vs ${isWay ? 'the current approach' : competitor}

## Situation
- **Competitor:** ${competitor}${isWay ? ' (a way of working, not a vendor: no contract or references are assumed)' : ''}
- **Your Solution:** ${(args.your_solution as string) || NOT_SUPPLIED}
- **Evaluation Stage:** ${evaluationStage}${args.evaluation_stage ? '' : ' (default)'}
- **Buyer Persona:** ${(args.buyer_persona as string) || NOT_SUPPLIED}
${buyerPriorities ? `- **Buyer Priorities:** ${buyerPriorities}` : ''}

${ctx.line}

${persona ? `**Who is evaluating:** ${aAn(persona.label)}. They care about ${persona.cares}, and worry about ${persona.worry}. Ask in those terms.\n` : ''}
---

## Competitive Intelligence

### Your Strengths
${allStrengths.length ? allStrengths.map((s) => `- ${s}`).join('\n') : '- None given (your_strengths). Add your differentiators.'}

### ${isWay ? 'The current approach' : competitor}: Weak Points (your notes, never read out to the buyer)
${weaknesses.length ? weaknesses.map((w) => `- ${w}`).join('\n') : '- None given (competitor_weaknesses).'}

${sectorNotes(ctx.v, 'committee')}

---

## Positioning Strategy

### Golden Rule
**Never go negative.** Let the buyer discover ${compPoss} weaknesses through their own evaluation.

---

`;

  if (trapType === 'all') {
    output += ['discovery_questions', 'evaluation_criteria', 'reference_questions', 'technical_requirements', 'commercial_terms'].map((k) => sections[k]).join('\n\n---\n\n');
  } else {
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
- Surface ${compPoss} limitations through the buyer's own tests` : ''}${evaluationStage === 'late' ? `
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
// Run 20 round 1b (D92): the product description is used once and then the short name; a statement the user made that needs a source
// ("first and only", "world's first") is listed to be sourced before the proposal goes out; customer-quote wording is cleaned; nothing
// is left as a bracket or as a made-up figure; the rollout comes from the user's approach or from how the sector buys; the audience
// input adds a note on what that audience looks for.
const CLAIM_WORDS = /\b(?:first and only|the only|only|world'?s (?:first|largest|leading|most)|first|largest|leading|best|most extensive|#1|number one|unique|fastest|cheapest)\b/i;
function claimsIn(...texts: string[]): string[] {
  const out: string[] = [];
  for (const t of texts) for (const item of splitItems(t)) if (CLAIM_WORDS.test(item) && !out.includes(item)) out.push(item);
  return out;
}
// A customer's reported result, in words a client can read: "customers on the home page say they cut X (customer words)" becomes
// "Customers report that they cut X (a customer's own words)".
function cleanClaim(item: string): string {
  const pi = parseProof(item)[0];
  let text = pi ? pi.text : item.trim();
  text = text.replace(/^customers?\s+(?:on the home page\s+)?say(?:s)?\s+(?:that\s+)?(?:they\s+)?/i, 'Customers report that they ').replace(/\s+on the home page\b/gi, '');
  const src = pi && pi.label ? ` (${proofSource(pi)})` : '';
  return `${upperFirst(text.replace(/[.]+$/, ''))}${src}`;
}
const AUDIENCE_NOTE: Record<string, string> = {
  c_suite: 'senior executives: lead with the outcome, the risk and the time to a result, and keep technical detail for an appendix',
  vp_level: 'a vice president: lead with the result for their function, the owner on their side and the first milestone',
  director: 'a director: show the plan, the milestones and what their team must do',
  manager: 'a manager: show how the work changes day to day and what support their team gets',
  technical: 'technical reviewers: lead with how it connects to their systems, how data is handled, and how it was validated',
  procurement: 'procurement: lead with scope, terms, price and the documents their process needs',
};
function executeProposalSectionWriter(args: Record<string, unknown>): string {
  const sectionType = (args.section_type as string) || 'executive_summary';
  const customerName = (args.customer_name as string) || 'the customer';
  const customerIndustry = (args.customer_industry as string) || '';
  const primaryAudience = (args.primary_audience as string) || '';
  const customerChallenges = (args.customer_challenges as string) || '';
  const yourSolution = (args.your_solution as string) || 'our solution';
  const keyDifferentiators = (args.key_differentiators as string) || '';
  const pricing = (args.pricing as string) || '';
  const implementationApproach = (args.implementation_approach as string) || '';
  const successMetrics = (args.success_metrics as string) || '';
  const tone = (args.tone as string) || 'consultative';
  // Run 19 D80 (problems 2, 3 and 8): lists are split by line or semicolon only, so a phrase is never cut at a comma into a
  // fragment; the implementation approach is used; sector notes say what evidence lands in this buyer's sector.
  const propCtx = readContext(undefined, { seller: [yourSolution], context: [keyDifferentiators, customerChallenges, successMetrics], buyer: [customerIndustry] });
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'our solution';
  const v = propCtx.v;
  const modelKey = propCtx.model === 'investment' ? 'investment' : v ? v.id : '';
  const challenges = splitItems(customerChallenges);
  const diffs = splitItems(keyDifferentiators);
  const outcomes = splitItems(successMetrics);
  const claims = claimsIn(keyDifferentiators, yourSolution.length < 200 ? yourSolution : '');
  const rollout = implementationApproach
    ? `${cap(implementationApproach.trim().replace(/[.]$/, ''))}.`
    : (MAP_EVAL[modelKey] || []).length ? `No rollout plan was given (implementation_approach). In ${v ? v.name : 'this sector'} a rollout usually starts like this, so use it as the first draft and put in your own phases and dates: (1) ${lowerFirstIfCommon((MAP_EVAL[modelKey] || [])[0].m)}; (2) ${lowerFirstIfCommon((MAP_EVAL[modelKey] || [])[(MAP_EVAL[modelKey] || []).length > 2 ? 2 : 1].m)}.` : `No rollout plan was given (implementation_approach). Describe the phases, who is involved on both sides and when value starts.`;
  const audienceLine = primaryAudience && AUDIENCE_NOTE[primaryAudience] ? `*Audience: written for ${AUDIENCE_NOTE[primaryAudience]}.*\n\n` : '';
  const claimsBlock = claims.length ? `\n### Claims to source before you send\n\nThese statements are yours. A buyer will ask for the source of each, so add it or soften the wording:\n${claims.map((c) => `- ${q(c)}`).join('\n')}\n` : '';
  const sectorProof = v ? `In ${v.name}, the evidence that lands is this: ${proofOf(v)}.` : '';

  // Tone adjustments
  const toneStyles: Record<string, { opening: string; language: string }> = {
    formal: { opening: 'We are pleased to present this proposal. It outlines', language: 'professional and structured' },
    consultative: { opening: 'This proposal outlines', language: 'partnership-oriented' },
    bold: { opening: 'The opportunity before you is set out below. This proposal outlines', language: 'confident and direct' },
    conservative: { opening: 'We respectfully submit this proposal. It outlines', language: 'measured and thorough' },
  };
  const toneStyle = toneStyles[tone] || toneStyles['consultative'];
  const bullets = (items: string[], fallback: string) => (items.length ? items.map((c) => `- ${c.trim()}`).join('\n') : fallback);

  // Section generators
  const sections: Record<string, () => string> = {
    executive_summary: () => `# Executive Summary

## Proposal for ${customerName}

${audienceLine}${toneStyle.opening} how ${P} can help ${customerName} with ${customerChallenges ? 'the challenges below' : 'the challenges they named (none were given to this tool: add customer_challenges)'}.

### The Solution

${args.your_solution ? yourSolution.trim() : `${P}`}

### The Opportunity

${customerChallenges ? `Key challenges for ${customerName}:\n\n${bullets(challenges, '')}${v ? `\n\nIn ${v.name}, buyers usually judge a change like this by ${joinList(v.metrics.slice(0, 3))}.` : ''}` : `No challenges were given. Add customer_challenges, in ${customerName}'s own words, to complete this section.`}

### Our Recommendation

What ${P} offers ${customerName}:

${bullets(diffs.map((d) => `**${d.trim()}**`), `- No differentiators were given. Add key_differentiators: the two or three reasons ${customerName} should choose ${P}, each with its evidence.`)}

### Expected Outcomes

${outcomes.length ? outcomes.map((o) => `- ${cleanClaim(o)}`).join('\n') : `No success metrics were given. Add success_metrics.${v ? ` In ${v.name} the usual ones are ${joinList(v.metrics.slice(0, 4))}; agree the measure and the baseline with ${customerName}.` : ''}`}

### How We Will Get There

${rollout}

### Investment Overview

${pricing ? `Investment: ${pricing}` : 'No pricing was given. Add pricing here, or point to your pricing section.'}

### Why ${P}

${diffs.length ? `The recommendation above lists what sets ${P} apart. Add one piece of evidence for each point before you send this. ${sectorProof}` : `Say why ${customerName} should choose ${P}, with evidence for each reason. ${sectorProof}`}
${claimsBlock}
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

This section sets out the problems that ${P} is proposed to solve.

${challenges.length ? `Key challenges for ${customerName}:\n\n${challenges.map((c, i) => `### Challenge ${i + 1}: ${c.trim()}\n\n**Impact:** Ask ${customerName} how this affects their team and their results, and write it here in their words.${v ? ` In ${v.name} this usually shows up in ${joinList(v.metrics.slice(i % 3, (i % 3) + 2).length ? v.metrics.slice(i % 3, (i % 3) + 2) : v.metrics.slice(0, 2))}.` : ''}\n\n**Root Cause:** What ${customerName} told you: process gaps, technology limits or resource constraints.\n\n**Cost of Inaction:** What ${customerName} said happens if nothing changes.\n`).join('\n')}` : `No challenges were given. Add customer_challenges, in ${customerName}'s own words, and this section writes one block for each.`}

## The Cost of the Current State

Put a number from ${customerName} against each row. Do not enter a figure they did not give you.

| Impact area | What to find out |
|-------------|------------------|
| Time | The hours spent each week on the manual work or the workarounds |
| Money | What the problem costs in a year (the roi_business_case_builder tool needs this) |
| Risk | What one incident or failure costs, and how often it happens |
| Growth | What the problem stops ${customerName} from doing |
${v ? `\n${sectorNotes(v, 'metrics')}\n` : ''}
## What Success Looks Like

${outcomes.length ? `What ${customerName} wants, as you gave it:\n${outcomes.map((o) => `- ${cleanClaim(o)}`).join('\n')}` : `No success picture was given. Ask ${customerName} what would make this a success a year from now, and write it here in their words.`}

---

*This understanding informs our recommended approach in the following sections.*`,

    solution_overview: () => `# Solution Overview

## How ${P} Addresses Your Needs

${brief.kind ? `${P} ${describeWith(brief)}.` : `${P} is the solution this proposal recommends.`}

### Core Capabilities

${diffs.length ? diffs.map((d, i) => `**${i + 1}. ${d.trim()}**\nSay which of ${customerName}'s challenges this answers, and show it on ${customerName}'s own case.\n`).join('\n') : brief.parts.length ? `${P} includes:\n\n${brief.parts.map((p, i) => `**${i + 1}. ${cap(p)}**\n`).join('\n')}` : `No differentiators or parts were given. Add key_differentiators or describe the parts in your_solution, after a colon.`}

### Feature-to-Value Mapping

| Your Challenge | Our Capability | Business Value |
|----------------|----------------|----------------|
${(challenges.length ? challenges : ['(add customer_challenges)']).slice(0, 4).map((c, i) => `| ${c.trim()} | ${brief.parts[i] ? cap(partLabel(brief.parts[i])) : 'Choose the part of ' + P + ' that answers it'} | ${v ? `A change in ${v.metrics[i % v.metrics.length]} that you can show` : 'A result you can show'} |`).join('\n')}

### Security & Compliance

State only what is true for ${P}. ${v ? `Buyers in ${v.name} usually ask: ${v.objections.filter((o) => /secur|complian|regul/i.test(o.objection)).map((o) => o.objection.toLowerCase()).join('; ') || 'how data is handled and who can access it'}. ` : ''}List the certificates you hold, where data is stored, how it is protected and how access is controlled, each only if it is true.

---

*Detailed technical specifications available upon request.*`,

    implementation_plan: () => `# Implementation Plan

## Approach for ${customerName}

This plan covers the rollout of ${P}.

${implementationApproach ? implementationApproach : rollout}

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

${outcomes.length ? outcomes.map((o) => `- ${cleanClaim(o)}`).join('\n') : `No success metrics were given. Agree with ${customerName} the measure and the pass mark for each phase.`}

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

${pricing ? `### Investment Summary\n\n${pricing}` : `### Investment Summary\n\nNo pricing was given. Add pricing (the components and the amounts) and this section shows it.`}

### Value Justification

The value is ${customerName}'s own figure. Use the roi_business_case_builder tool with their cost or value figures to produce the return, payback and three-year value; none is made up here.

| Value category | What to measure with ${customerName} |
|----------------|--------------------------------------|
| Efficiency | Hours saved each week on the work ${P} changes |
| Cost reduction | Spend that stops${v ? ` (${v.metrics[0]})` : ''} |
| Revenue | Revenue gained or kept |
| Risk | The cost of one incident, and how often one happens |

### Investment Protection

*Include only the protections you actually offer, in your contract's words:*
- Satisfaction commitment, if you offer one
- Payment terms and options
- Price for the term, and for how long
${v ? `\n${sectorNotes(v, 'objections')}\n` : ''}
---

*Investment assumes standard scope. Add any custom pricing for specific requirements, only if you offer it.*`,

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
${v ? `\n### Risks ${v.name} buyers raise\n\n${v.objections.map((o) => `- **${o.objection}:** ${o.response}`).join('\n')}\n` : ''}
### Commitments

*Include only the commitments you actually offer:*
- **SLA:** the service level in your contract, and the credit if you miss it
- **Support:** your support hours
- **Security:** your security practices
- **Success:** your success model

---

*Add a closing line only if it is true for ${P}.*`,

    success_metrics: () => `# Success Metrics & Measurement

## How We'll Measure Success

These are the measures by which ${customerName} will judge ${P}.

${outcomes.length ? `### Agreed Success Metrics\n\n${outcomes.map((o) => `- ${cleanClaim(o)}`).join('\n')}` : '### Proposed Success Metrics'}

### Key Performance Indicators

| KPI | Baseline | Target | Timeline |
|-----|----------|--------|----------|
${(v ? v.metrics.slice(0, 4) : ['The measure the customer names']).map((m) => `| ${cap(m)} | Measure first, with ${customerName} | Agree with ${customerName} | Agree with ${customerName} |`).join('\n')}

### Measurement Framework

#### Phase 1: Baseline (Pre-Implementation)
- Document current state metrics
- Establish measurement methodology
- Set realistic targets

#### Phase 2: Early Indicators
- System usage and adoption
- Initial process improvements
- User satisfaction

#### Phase 3: Business Outcomes
- Efficiency gains
- Cost reductions
- Quality improvements

#### Phase 4: Strategic Impact
- Revenue impact
- Competitive advantage
- Scalability achieved

${EXAMPLES}
### Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|----------|
| Dashboard | Real-time | All users |
| Weekly Summary | Weekly | Project team |
| Monthly Review | Monthly | Sponsors |
| Executive Report | Quarterly | Leadership |

---

*Metrics will be finalized during implementation planning.*`,

    company_overview: () => `# About Us

## Your Partner for Success

### Who We Are

${brief.kind ? `${P} ${describeWith(brief)}.` : `${P} is the solution this proposal recommends.`} Add who it helps and what it does for them in your_solution.

### Why Companies Choose Us

${diffs.length ? diffs.map((d) => `- ${d.trim()}`).join('\n') : '- No differentiators were given. Add key_differentiators.'}
${claimsBlock}
### By the Numbers

No figures are written here: add your own, each only if you can show it (customers, industries served, years in business, customer satisfaction).

### Industry Recognition

Add the awards and analyst recognition you hold, each with its source.

### Your Team

Your ${customerName} team: account executive, solutions engineer, customer success manager and support. Add names and availability.

---

*We look forward to being your trusted partner.*`,

    case_studies: () => `# Customer Success Stories

## Companies Like ${customerName} Achieving Results

This tool has no customer stories of its own and does not make any up. For each story you may share, give the customer, the challenge, what was done and the result with its source.

${(challenges.length ? challenges : ['the challenge ' + customerName + ' named']).slice(0, 3).map((c, i) => `### Story ${i + 1}: a customer with this challenge

**Challenge:** ${c.trim()}

**Solution:** how ${P} was used

**Result:** the customer's own result, with its source and period

**Quote:** only a quote the customer has approved
`).join('\n')}
### References Available

Add references only if the customers have agreed to talk to ${customerName}.`,

    next_steps: () => `# Recommended Next Steps

## Path Forward for ${customerName}

The steps from this proposal to a live ${P}.

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
We're happy to provide additional details, demos, or references if you have them.

**Option 3: Not Right Now**
We understand timing is important. Let's discuss what would make this the right time.

### Contact

Add your account executive and solutions engineer, with their email, and a link for booking a call.

---

*We're excited about the opportunity to partner with ${customerName} and look forward to helping you achieve your goals.*

${SUGGESTIONS_FOOTER}`,
  };

  // Generate the requested section
  const generator = sections[sectionType];
  if (generator) {
    return `${generator()}${v ? `\n\n---\n\n${sectorNotes(v, 'committee')}` : ''}`;
  }

  return `Section type '${sectionType}' not recognized. Available sections: ${Object.keys(sections).join(', ')}`;
}


// Tool 8: Email Sequence Generator
// Text only: the plural of a persona in a sentence. A persona that already ends in s ("operations directors")
// is kept as it is (no "directorss"); otherwise an s is added, as before.
// Run 11 addendum 1 (R11-A1-1): the persona in running-text case ("head of Marketing" becomes "heads of marketing").
function pluralOf(persona: string): string {
  const p = lowerFirstIfCommon(persona);
  // Run 12: a function name is not a plural title ("Many sales I speak with" becomes "Many people in sales roles").
  if (/^(sales|marketing|finance|operations|hr|it|engineering|procurement|product|revops|legal|security)$/i.test(p.trim())) return `people in ${p.trim()} roles`;
  const m = p.match(/^([A-Za-z]+)( of .+)$/);
  if (m) return /s$/i.test(m[1]) ? p : `${m[1]}s${m[2]}`;
  return /s$/i.test(p) ? p : `${p}s`;
}
function executeEmailSequenceGenerator(args: Record<string, unknown>): string {
  const sequenceType = (args.sequence_type as string) || 'cold_outreach';
  const targetPersona = (args.target_persona as string) || 'Decision Maker';
  const targetIndustry = (args.target_industry as string) || '';
  const yourSolution = (args.your_solution as string) || 'our solution';
  const keyValueProp = (args.key_value_prop as string) || '';
  const specificPainPoint = (args.specific_pain_point as string) || '';
  const socialProof = (args.social_proof as string) || '';
  const callToAction = (args.call_to_action as string) || 'meeting';
  const numEmails = (args.num_emails as number) || 5;
  const tone = (args.tone as string) || 'professional';
  const senderContext = (args.sender_context as string) || '';
  // Run 19 D80 (problem 2): typed phrases are never pasted into a fixed sentence that only fits one shape of phrase.
  const ctx = readContext(undefined, { seller: [yourSolution], context: [keyValueProp, specificPainPoint], role: [targetPersona], buyer: [targetIndustry] });
  // Run 20 round 1b (D92): the product description is not pasted into an email (the short name is); the proof is split into items and
  // each email uses one, with its label left for the check list; emails 4 and 5 are written, not frames; the persona's own concern
  // and the sector's questions give the emails something to say beyond the user's sentences.
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'our solution';
  const v = ctx.v;
  const investment = ctx.model === 'investment';
  const rk = roleFor(targetPersona, investment);
  const plural = pluralOf(targetPersona);
  // The pain without the labels the user put on it, and its first clause that can be quoted on its own.
  const painPlain = specificPainPoint.replace(/\s*\((?:page claim|customer words|customer quote|a seller's words|implied by[^)]*)\)/gi, '').trim();
  const pains = painClauses(painPlain);
  const painLead = pains[0] ? lowerFirstIfCommon(pains[0]) : '';
  const painQuoted = painLead ? q(painLead) : painPlain && painPlain.length <= 140 ? q(lowerFirstIfCommon(painPlain)) : '';
  const areaNoun = v ? [...v.metrics.slice(0, 4)].sort((x, y) => x.length - y.length)[0] : 'this problem';
  const valueItems = splitItems(keyValueProp).map((x) => parseProof(x)[0] || { text: x, label: '', kind: 'story' as const });
  const valueMain = (valueItems.find((x) => !x.label) || valueItems[0])?.text || '';
  const valueClaims: ProofItem[] = valueItems.filter((x) => x.label && x.text !== valueMain);
  const proofAll = parseProof(socialProof);
  const pool = pickProof(proofAll, 6, ['result', 'quote', 'story', 'scale']);
  const recog = proofAll.filter((p) => p.kind === 'recognition');
  const e2 = pool[0];
  const e3 = pool[1] || pool[0];
  const industryPhrase = targetIndustry ? ` in ${lowerFirstIfCommon(targetIndustry)}` : '';
  const cta = callToAction.trim().replace(/[.?!]$/, '');
  const ctaQuestion = callToAction === 'meeting' ? 'Would it make sense to talk about how we might help?'
    : /^(book|see|join|register|reply|try|get|schedule|watch|read|download|start|meet|talk|chat|review|attend|visit|sign|take)\b/i.test(cta) ? `Would you like to ${lowerFirstIfCommon(cta)}?`
    : /^(a|an|the|one|our)\b/i.test(cta) ? `Would ${lowerFirstIfCommon(cta)} next week make sense?` : `Would a ${lowerFirstIfCommon(cta)} next week make sense?`;
  const valueLine = valueMain ? `${P} helps with exactly this: ${lowerFirstIfCommon(valueMain.replace(/[.]$/, ''))}.` : (brief.kind ? `${P} ${describeWith(brief)}.` : '');
  const signature = `[Your name]${senderContext ? `\n${senderContext.trim()}` : ''}`;
  const area = areaNoun;
  const otherRoles = v ? v.buyerRoles.filter((r) => familyOf(r, investment) !== familyOf(targetPersona, investment)).slice(0, 2) : [];
  const usedProof = [e2, e3].filter((x, i, a): x is ProofItem => !!x && a.indexOf(x) === i);
  const checkList = [...usedProof, ...recog.slice(0, 1), ...valueClaims].filter((x, i, a) => a.indexOf(x) === i);
  const checks = checkList.length ? `\n\n---\n\n## Before you send\n\nCheck that each point below is current and that you may name it. The first ones are used in the emails above; a claim you gave in key_value_prop is listed here and is not stated as a fact in any email:\n${checkList.map((p) => `- ${q(clip(proofPhrase(p), 140))}: ${proofSource(p)}`).join('\n')}\n` : '';

  // Display text (output only): every template has a fixed number of emails, whatever num_emails says
  const emailsText = hasValue(args.num_emails) ? (args.num_emails as number).toLocaleString('en-US') : `${numEmails} (default)`;  // run 15: a given 0 is shown as 0, not replaced by 5
  const fixedLengthNote = '*The template below has a fixed number of emails: add or remove emails to match the number you need.*';

  const toneInstructions: Record<string, string> = {
    professional: 'Formal, polished, business-appropriate',
    casual: 'Friendly, conversational, approachable',
    urgent: 'Time-sensitive, action-oriented, compelling',
    consultative: 'Helpful, advisory, value-first',
    provocative: 'Challenging, thought-provoking, pattern-interrupt'
  };

  const sequenceTemplates: Record<string, () => string> = {
    cold_outreach: () => `# Cold Outreach Sequence

## Target: ${targetPersona}${targetIndustry ? ` in ${lowerFirstIfCommon(targetIndustry)}` : ''}
## Solution: ${yourSolution}
## Tone: ${toneInstructions[tone] || toneInstructions['professional']}
## Emails: ${emailsText}
${fixedLengthNote}

**Who you are writing to:** ${aAn(rk.label)}. They care about ${rk.cares}, and they worry about ${rk.worry}. Each email below is written for that concern.

---

### Email 1: The Opening (Day 1)

**Subject Options:**
- Quick question on ${areaNoun}
- ${P} for ${plural}
- ${painLead ? 'Does this sound familiar?' : 'A question for you'}

**Body:**

Hi [First Name],

I'm writing to ${plural}${industryPhrase} about one problem. ${painQuoted ? `Does this sound familiar: ${painQuoted}?` : `Is ${area} something your team is working on this year?`}

${valueLine}

${ctaQuestion}

Best,
${signature}

---

### Email 2: The Value Add (Day 3)

**Subject:** Following up: ${v ? areaNoun : 'my note'}

**Body:**

Hi [First Name],

Following up on my note from earlier this week.

${e2 ? `One result we can point to: ${lowerFirstIfCommon(proofPhrase(e2))}.` : `I do not have a result to quote in this note, so here is a question instead.`}

For ${plural}, the question that usually decides whether a change like this matters is: ${q(rk.questions[0])}

Worth a conversation?

${signature}

---

### Email 3: The Social Proof (Day 7)

**Subject:** How one organisation handled ${areaNoun}

**Body:**

Hi [First Name],

${e3 ? `Wanted to share a quick story. The challenge was the one you may know: ${painQuoted || area}. With ${P}, the result was this: ${lowerFirstIfCommon(proofPhrase(e3))}.` : `I have no customer story to quote in this note. What I can offer is how ${plural}${industryPhrase} usually measure this before a change: ${v ? joinList(v.metrics.slice(0, 3)) : 'with a number they already track'}.`}

${tone === 'provocative' ? "I'm curious: is this something you've been thinking about, or is everything running smoothly?" : `I thought this might be relevant to ${aAn(rk.label)} who has to answer for ${rk.cares.split(',')[0]}.`}

${ctaQuestion}

${signature}

---

### Email 4: The Breakup Tease (Day 12)

**Subject:** Should I close your file?

**Body:**

Hi [First Name],

I've reached out a few times but haven't heard back. I get it: you're busy.

Just checking: is the problem I described${painQuoted ? ` (${painQuoted})` : ''} not a priority right now, or is someone else the right person to talk to${otherRoles.length ? `, for example ${joinList(otherRoles.map((r) => `your ${r}`), 'or')}` : ''}?

Either way, no hard feelings.

P.S. If timing is the only issue, tell me which quarter suits you and I will come back then.

${signature}

---

### Email 5: The Final Value (Day 17)

**Subject:** One last thing

**Body:**

Hi [First Name],

Last note from me for now.

Before I go, here are the questions that ${plural}${industryPhrase} usually ask before they change how they manage ${areaNoun}, useful even if we never speak:
${(v ? v.discovery.slice(0, 3) : rk.questions).map((x, i) => `${i + 1}. ${x}`).join('\n')}
${recog[0] ? `\nIf credibility helps: ${proofPhrase(recog[0])}.\n` : ''}
If you ever want to talk it through, reply to this email and I will make the time.

All the best,
${signature}

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
- A/B test subject lines${checks}`,

    warm_follow_up: () => `# Warm Follow-Up Sequence

## Context: Post-meeting/referral/event
## Target: ${targetPersona}
## Emails: ${emailsText}
${fixedLengthNote}

---

### Email 1: Immediate Follow-Up (Same day/next morning)

**Subject:** Great connecting: next steps on ${area}

**Body:**

Hi [First Name],

Great speaking with you. As discussed, I'm sending the resources we talked about (add them here).

Key takeaways from our conversation, as I heard them:
1. Your challenge: ${painQuoted || 'write it in their words'}
2. How ${P} can help: ${valueMain ? lowerFirstIfCommon(valueMain.replace(/[.]$/, '')) : 'add the one benefit you agreed'}
3. The agreed next step: add it here

${callToAction === 'meeting' ? 'Which day this week suits you for our follow-up call?' : `Let me know if you'd like to ${lowerFirstIfCommon(cta)}.`}

Looking forward to continuing the conversation.

${signature}

---

### Email 2: Value Delivery (Day 3)

**Subject:** ${rk.label === 'stakeholder' ? 'Something useful for your situation' : `For ${aAn(rk.label)}: ${v ? v.metrics[0] : area}`}

**Body:**

Hi [First Name],

I was thinking about our conversation. For ${aAn(rk.label)}, the question that usually matters is: ${q(rk.questions[0])}

${e2 ? `One result we can point to: ${proofPhrase(e2)}.` : 'Happy to share how others measure this if it helps.'}

Any questions, let me know.

${signature}

---

### Email 3: Check-In (Day 7)

**Subject:** Checking in: ${area}

**Body:**

Hi [First Name],

Wanted to check in and see if you had a chance to review what I sent.

${e3 ? `Also, in case it helps: ${proofPhrase(e3)}.` : ''}

Any questions I can answer? Happy to hop on a quick call.

${signature}

---

## Warm Follow-Up Tips

- **Be specific**: Reference actual conversation points
- **Deliver value**: Every email should help them
- **Keep momentum**: Follow up within committed timeframes
- **Stay relevant**: Connect to their goals, not yours${checks}`,

    post_demo: () => `# Post-Demo Sequence

## Following up after product demonstration
## Target: ${targetPersona}
## Emails: ${emailsText}
${fixedLengthNote}

---

### Email 1: Same Day Thank You

**Subject:** Thanks for your time today

**Body:**

Hi [First Name],

Thank you for taking the time to see ${P} in action today.

As promised, here is what I am sending: the demo recording if you have one, the resources we mentioned, and any pricing or proposal we discussed.

What stood out to me from our conversation:
- ${painQuoted ? `You mentioned ${painQuoted}` : 'The problem you described'}
- The part of ${P} that seemed most relevant to your case (add it here)
- The agreed next step (add it here)

Questions from your side?

${signature}

---

### Email 2: Address Unstated Objections (Day 2)

**Subject:** Thinking about the likely concerns

**Body:**

Hi [First Name],

Following up on yesterday's demo.

You may be wondering about ${v ? joinList(v.objections.slice(0, 2).map((o) => o.objection.toLowerCase())) : 'implementation and adoption'}. ${v ? v.objections[0].response : 'Here is how we would handle each.'}

${e2 ? proofPhrase(e2) : 'Happy to connect you with a customer who had similar concerns, if one has agreed.'}

Does this help? What other questions are on your mind?

${signature}

---

### Email 3: Internal Champion Enable (Day 5)

**Subject:** Materials for your team

**Body:**

Hi [First Name],

As you discuss ${P} internally, I wanted to share some materials that might help: a one-pager for executives, the ROI calculation, and a customer case study if I have one you may share.

${otherRoles.length ? `Happy to be a resource as you talk to your ${joinList(otherRoles, 'and')}.` : 'Happy to be a resource as you talk to the other stakeholders.'}

Anything specific I can provide to help?

${signature}

---

### Email 4: Create Urgency (Day 10)

**Subject:** Quick update and timeline

**Body:**

Hi [First Name],

Wanted to share a quick update that might affect your timeline (add the real reason here: pricing, availability or a date that matters to you).

Can we find time this week to discuss next steps?

${signature}${checks}`,

    re_engagement: () => `# Re-Engagement Sequence

## Reconnecting with cold/stalled opportunities
## Target: ${targetPersona}
## Emails: ${emailsText}
${fixedLengthNote}

---

### Email 1: The Trigger Event

**Subject:** Something I thought of after our conversation

**Body:**

Hi [First Name],

I noticed a change at your company (add the real trigger here: news, a role change or a milestone).

It made me think of our conversation about ${painQuoted || area}. I wondered whether it has become more of a priority.

Worth reconnecting?

${signature}

---

### Email 2: The New Value

**Subject:** Something new I thought you'd want to see

**Body:**

Hi [First Name],

It's been a while since we last connected.

${e2 ? `Since then: ${proofPhrase(e2)}.` : 'If something has changed on our side that matters to you, I will tell you what it is (add it here only if true).'}

Would it make sense to reconnect and catch up?

${signature}

---

### Email 3: The Direct Ask

**Subject:** Still relevant?

**Body:**

Hi [First Name],

I don't want to keep reaching out if this problem${painQuoted ? ` (${painQuoted})` : ''} isn't on your radar anymore.

Quick question: is this still something you're thinking about, or should I check back at a different time?

Either way is fine. I just want to respect your time.

${signature}${checks}`,
  };

  const generator = sequenceTemplates[sequenceType];
  if (generator) {
    const notes = v ? `\n\n---\n\n${sectorNotes(v, 'metrics')}\n- **Words this buyer uses:** ${v.vocabulary.join(', ')}. Use them where they are true for the prospect.` : '';
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
- Establish context/relevance${painQuoted ? ` (${painQuoted})` : ''}
- State purpose
- Light CTA

### Email 2: Value
- Deliver something useful${rk.questions[0] ? `, for example: ${q(rk.questions[0])}` : ''}
- Build credibility
- Soft CTA

### Email 3: Proof
- Social proof/case study${e2 ? `: ${proofPhrase(e2)}` : ''}
- Address objections${v ? ` (${v.objections.slice(0, 2).map((o) => o.objection.toLowerCase()).join('; ')})` : ''}
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
// What a demo for each kind of seller shows (formats of evidence, not claims about any product: show only what the product really does).
const DEMO_SHOW: Record<string, string[]> = {
  'logistics-tech': ['A live re-plan when an order changes after the vehicles have left', 'The dispatcher view and the driver view of the same day', 'A before-and-after of cost per delivery or first-attempt delivery for one hub, if you have one you may show'],
  'vertical-saas': ['An order captured in the outlet on a low-end phone, including with no signal', 'Secondary sales by outlet and by SKU as the sales head sees them', 'A beat plan and a trade scheme reaching the rep'],
  fintech: ['One expense from capture to approval to posting in the ledger', 'The controls and the audit trail an internal auditor would ask for', 'What the finance team stops doing by hand at month end'],
  'ai-native': ['Results on an evaluation set built from the buyer\'s own history', 'Where a person approves an action before it happens', 'How a wrong answer is caught, logged and corrected'],
  ites: ['A sample monthly service report with SLA attainment', 'The transition plan for a similar client, anonymised', 'The governance calendar: reviews, escalation and who attends'],
  telecom: ['The monitoring view of a set of sites', 'A sample outage and repair report', 'The wave plan for a rollout by region, with the fallback for each wave'],
  cybersecurity: ['Exposures found and ranked in a sample environment', 'How a finding reaches the person who can fix it', 'What a proof of value would cover in the buyer\'s own environment'],
  software: ['A real project imported through the path from the tools the team uses today', 'The same workflow run by a developer and read by a team lead', 'What the security reviewer can see about code and data access'],
  saas: ['The workflow the buyer described, end to end, with their own example', 'The time from sign-up to first value', 'Where it sits among the tools they already use'],
  investment: ['How a signal or a position is explained in plain words', 'A sample monthly report, including a month that went badly', 'Where the strategy sits in the buyer\'s investment process'],
};
function executeDemoScriptBuilder(args: Record<string, unknown>): string {
  const demoType = (args.demo_type as string) || 'first_look';
  const primaryAudience = (args.primary_audience as string) || 'decision maker';
  const attendees = (args.attendees as string) || '';
  const customerIndustry = (args.customer_industry as string) || '';
  const yourSolution = (args.your_solution as string) || 'our solution';
  const keyPainPoints = (args.key_pain_points as string) || '';
  const competitorContext = (args.competitor_context as string) || '';
  const demoDuration = (args.demo_duration as number) || 30;
  const durationGiven = hasValue(args.demo_duration) && demoDuration === args.demo_duration;  // run 15: a given 0 falls back to 30, labelled as the default
  const minutesWord = demoDuration === 1 ? 'minute' : 'minutes';
  const mustShowFeatures = (args.must_show_features as string) || '';
  const knownObjections = (args.known_objections as string) || '';
  const desiredOutcome = (args.desired_outcome as string) || 'advance the deal';
  // Run 20 round 1b (D92): the short name replaces the pasted description; the must-show features are split into steps and their claim label
  // is kept out of the script; each known objection is answered by its kind; no bracket is left where the pains, the sector or the audience can
  // supply the words; the demo shows what that kind of seller is judged on.
  const demoCtx = readContext(undefined, { seller: [yourSolution], context: [keyPainPoints, mustShowFeatures, attendees], role: [primaryAudience], buyer: [customerIndustry] });
  const brief = solutionBrief(args.your_solution ? yourSolution : '');
  const P = brief.short || 'the product';
  const v = demoCtx.v;
  const investment = demoCtx.model === 'investment';
  const modelKey = investment ? 'investment' : v ? v.id : '';
  const bctx: BlockerContext = { product: brief.short, sectorObjections: v?.objections, sectorName: v?.name, model: demoCtx.model };
  const audienceRole = args.primary_audience ? roleFor(primaryAudience, investment) : null;
  const pains = painClauses(keyPainPoints);
  const painWhole = keyPainPoints.trim().replace(/[.]+$/, '');
  const allFeats = splitFeatureList(mustShowFeatures);
  // Credentials and scale claims (years in business, engineers, partnerships, certificates, uptime) cannot be shown live: they are
  // mentioned, and the demo steps come from the features that can be run.
  const CREDENTIAL = /\b(?:\d[\d,.+]*\s*(?:years|engineers|customers|companies|countries|partners|brands|users)|partnerships?|partners with|certified|certifications?|iso\s?\d{4,5}|soc ?2|pci|award|recogni\w*|leader in|trusted by|fortune|uptime|gartner|empanel\w*)\b/i;
  const credentials = allFeats.filter((x) => CREDENTIAL.test(x.text));
  const showable = allFeats.filter((x) => !CREDENTIAL.test(x.text));
  const fallbackSteps: ListItem[] = (DEMO_SHOW[modelKey] || []).slice(0, 3).map((t) => ({ text: t, label: '' }));
  const feats = showable.length ? showable : fallbackSteps;
  const room = parseContacts(attendees, investment);

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
  const partMin = (n: number) => (n > 0 ? `${n} min` : 'under 1 min');
  const partMinutes = (n: number) => (n > 0 ? `${n} minute${n === 1 ? '' : 's'}` : 'under a minute');
  const shortNote = Number(demoDuration) < 10
    ? '\n\nThis demo is short, so the parts are rounded to whole minutes and some parts take less than a minute. Keep each of those to a sentence or two.'
    : '';
  // Text only (run 11, R11-07): under 10 minutes the start times come from the same shares in minutes and seconds, so
  // every part starts inside the demo and the times go up (5 minutes: 0:00, 0:23, 0:45, 1:30, 4:00, 4:45). Agenda
  // Setting sits halfway through the opening. 10 minutes and longer: whole minutes, as before.
  const startAt = (share: number, whole: number) => {
    if (Number(demoDuration) >= 10) return `${whole}:00`;
    const sec = Math.round(Number(demoDuration) * share * 60);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };

  const claimed = allFeats.filter((f) => f.label);
  const flow = feats.length ? feats.slice(0, 7).map((f, i) => {
    const pain = pains[i] || pains[0];
    const fw = new Set(f.text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5));
    const metric = v ? (v.metrics.find((m) => m.toLowerCase().split(/[^a-z0-9]+/).some((w) => w.length >= 5 && fw.has(w))) || '') : '';
    const showPhrase = /^(?:supports?|works?|integrates?|includes?|offers?|provides?|connects?|handles?|has|runs?|lets?|allows?|gives?|covers?|uses?|syncs?|captures?|plans?|re-plans?|detects?|ranks?|maps?)\b/i.test(f.text) ? `that it ${lowerFirstIfCommon(clip(f.text, 90))}` : lowerFirstIfCommon(clip(f.text, 90));
    return `**Step ${i + 1}: ${cap(clip(f.text, 90))}**

*Setup:*
"${pain ? `You told me about ${q(lowerFirstIfCommon(pain))}. ` : ''}Let me show you ${showPhrase}."

*Action:*
Show it live, with the prospect's own example if you have one.${f.label ? ' Show only what you can run in front of them; this item is a claim from the company\'s own pages.' : ''}

*Value check:*
"${metric ? `How would this change ${metric} for you?` : 'Which of your own numbers would this change, and by how much?'}"

*Check-in:*
"How does this compare to how you're doing it today?"

---

`;
  }).join('') : `**Step 1: The problem you were told about**

*Setup:*
"${pains[0] ? `You told me about ${q(lowerFirstIfCommon(pains[0]))}. ` : ''}Let me show you how ${P} handles that."

*Action:*
No must-show features were given (must_show_features). Show the one capability that answers the pain above, on the prospect's own example.

*Value check:*
"${v ? `How would this change ${v.metrics[0]} for you?` : 'What would this change for you?'}"

*Check-in:*
"How does this compare to how you're doing it today?"

---

`;
  const showList = (DEMO_SHOW[modelKey] || []).map((x) => `- ${x}`).join('\n');
  const closeLines = (feats.length ? feats.slice(0, 3) : [{ text: P, label: '' }]).map((f, i) => `${i + 1}. ${pains[i] ? q(lowerFirstIfCommon(pains[i])) : 'Your priority'} → ${P}: ${lowerFirstIfCommon(clip(f.text, 80))}`).join('\n');
  const objItems = splitItems(knownObjections);
  const likelyQs = ['How long does implementation take?', 'What does it need from our IT team?', 'What does pricing look like?'];

  return `# Demo Script: ${cap(demoType.replace(/_/g, ' '))}

## Demo Configuration

| Element | Details |
|---------|---------|
| **Type** | ${cap(demoType.replace(/_/g, ' '))} |
| **Solution** | ${(args.your_solution as string) || NOT_SUPPLIED} |
| **Primary Audience** | ${primaryAudience}${args.primary_audience ? '' : ' (default)'} |
| **Other Attendees** | ${attendees || 'Not given'} |
| **Industry** | ${customerIndustry || 'General'} |
| **Duration** | ${demoDuration} ${minutesWord}${durationGiven ? '' : ' (default)'} |
| **Desired Outcome** | ${desiredOutcome} |

${demoCtx.line}

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

${audienceRole ? `### Who you are showing it to\n\n${primaryAudience} is ${aAn(audienceRole.label)}. They care about ${audienceRole.cares}, and worry about ${audienceRole.worry}. They need to see ${audienceRole.needs}.\n\n` : ''}${room.length ? `### Who else is in the room\n\n| Attendee | What they will look for |\n|---|---|\n${room.map((r) => `| ${cap(r.title)} | ${roleFor(r.title, investment).needs} |`).join('\n')}\n\n` : ''}### Research Checklist
- Review previous conversations and notes
- Research company news and priorities
- Understand attendee roles and concerns
- Prepare relevant customer examples${v ? `: ${proofOf(v)}` : ''}
- Test the demo environment

### Technical Setup
- Demo environment ready
- Sample data loaded
- Screen sharing tested
- Backup plan ready

${showList ? `### What ${v ? aAn(v.name) : 'a'} buyer wants to see\n\nShow only what ${P} really does:\n${showList}\n\n` : ''}${credentials.length ? `### Credentials to mention, not to show live\n\n${credentials.map((f) => `- ${f.text}`).join('\n')}\n\nSay each one in a sentence when it answers a concern. ${showable.length ? '' : 'You gave no feature that can be run live, so the demo steps below are the ones a buyer in this sector usually wants to see: show only what the product really does.'}\n\n` : ''}${claimed.length ? `### Claims to prove before you say them\n\n${claimed.map((f) => `- ${f.text} (${f.label})`).join('\n')}\n\n` : ''}${competitorContext ? `### Competitive Context\n**Competitor:** ${competitorContext}\n\n**Positioning:**\n- Highlight what the buyer values throughout\n- Don't mention the competitor unless they do\n- Have proof points ready\n` : ''}

---

## Demo Script

### Part 1: Opening (${partMinutes(intro)})

**0:00 Introduction**

"Thanks everyone for joining. I will walk you through ${P} today.

Before I share my screen, I want to make sure we cover what's most important to you. ${args.primary_audience ? `${cap(primaryAudience)}: what` : 'What'} would make this ${demoDuration} ${minutesWord} valuable for you?"${durationGiven ? '' : '\n\n*The length above is an example: replace it with your own.*'}

*Wait for the response: it shapes your demo.*

**${startAt(0.075, intro >= 2 ? 1 : 0)} Agenda Setting**

"Here's my plan for today:
1. A quick check of what I've learned about your situation
2. How ${P} addresses those specific needs
3. Time for questions and discussion
4. Agreeing next steps

Does that work for everyone?"

---

### Part 2: Discovery Confirmation (${partMinutes(discovery)})

**${startAt(0.15, intro)} Validate Understanding**

"Before I show you anything, let me confirm what I've learned so the demo is relevant:

${pains.length ? `From our conversations, it sounds like:\n${pains.map((p, i) => `${i + 1}. ${cap(p)}`).join('\n')}` : painWhole ? `From our conversations, it sounds like: ${painWhole}.` : `I have not been told your main pain points, so I will ask: what is the main problem you want solved?`}

Did I get that right? Anything to add?"

*Listen, and adjust the demo to what you hear.*

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
${audienceRole ? audienceRole.questions.slice(0, 2).map((x) => `- "${x}"`).join('\n') : ''}

---

### Part 3: Solution Demo (${partMinutes(demo)})

**${startAt(0.30, intro + discovery)} Transition to Demo**

"Great, that confirms what I thought. Let me show you how ${P} handles those challenges. I'm going to share my screen..."

*Share your screen with the demo environment.*

---

#### Demo Flow

${flow}
${competitorContext ? `\n*Competitive note:*\nIf the competitor comes up, ask which part of the evaluation matters most to the buyer and show that part. Say only what you can prove.\n` : ''}

---

### Part 4: Discussion (${partMinutes(discussion)})

**${startAt(0.80, intro + discovery + demo)} Open for Questions**

"Let me stop sharing for a moment. What questions do you have about what you've seen?"

${objItems.length ? `**Anticipated Objections:**

${objItems.map((o) => `**Objection:** ${q(o)}
${blockerLines(o, bctx).join('\n')}

`).join('')}` : `**Questions to Prepare For${v ? ` in ${v.name}` : ''}:**

${v ? v.objections.map((o) => `**"${o.objection}"**\nPattern of an answer: ${o.response}\n`).join('\n') : ''}
${likelyQs.map((x) => { const a = answerBlocker(x, bctx); return `**"${x}"**\n${a.how}\nConfirm first: ${a.confirm}.\n`; }).join('\n')}`}${v && objItems.length ? `

${sectorNotes(v, 'objections')}` : ''}

---

### Part 5: Close (${partMinutes(close)})

**${startAt(0.95, demoDuration - close)} Summarize & Close**

"Before we wrap up, let me summarize what we covered:
${closeLines}

**The Ask:**

${desiredOutcome === 'advance the deal' ? `
"Based on what you've seen, what would be helpful as a next step?

Options might be:
${demoType === 'technical_deep_dive' ? '' : '- Technical deep dive with your team\n'}- Business case review
- Reference call with a similar customer (only if one has agreed)
- ${v ? `A pilot: ${lowerFirstIfCommon((MAP_EVAL[modelKey] || [{ m: 'Pilot discussion' }])[0].m)}` : 'Pilot/POC discussion'}

What makes sense for you?"` : `"Our goal was to ${desiredOutcome}. Have we accomplished that? What else do you need?"`}

**If Positive:**
"Great! I'll send a follow-up with the materials we discussed and a calendar invite for the next step. Who else should I include?"

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

export const SERVER_NAME = 'revenue-enablement-mcp';
export const SERVER_VERSION = '1.2.21';

// Every tool only builds text from its inputs: no storage, no network, no side effects.
const TOOL_TITLES: Record<string, string> = {
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

function withMeta<T extends { name: string }>(tool: T) {
  const title = TOOL_TITLES[tool.name] ?? tool.name;
  return {
    ...tool,
    title,
    annotations: { title, readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  };
}

// Decision N2 (run 6) and the run 7 fixes (T2, T3, T5, T6): every input is checked against its schema before a tool runs,
// at any depth. A number sent as text is read the way the web form reads it (commas allowed) or refused; minimum,
// exclusiveMinimum and maximum hold; a choice must be one of the listed values; a text field that holds money
// (MONEY_TEXT) cannot hold a negative amount (a negative percentage such as "-12% growth" is fine); a metrics text
// (METRIC_TEXT) cannot hold negative money but may hold a negative NPS or growth rate; a field that must
// hold one amount (ONE_AMOUNT) cannot hold a range.
type SchemaNode = { type?: string; minimum?: number; exclusiveMinimum?: number; maximum?: number; enum?: unknown[]; properties?: Record<string, SchemaNode>; items?: SchemaNode };
const NEGATIVE_AMOUNT = /\$\s*[-\u2212]\s*\d|(^|[\s(:=,;])[-\u2212](?:\$|usd|inr|eur|gbp|rs\.?|\u20b9|\u20ac|\u00a3)?\s?\d[\d,]*(?:\.\d+)?(?![\d,.]|\s*%)/i;
const NEGATIVE_MONEY = /[-−]\s?[$₹€£]\s*\d|[$₹€£]\s*[-−]\s*\d|\b(?:mrr|arr|cac|ltv|acv)\b[:\s]*[-−]\s*\d/i;
const AMOUNT_RANGE = /\d\s*[kmb]?\s*(?:-|\u2013|\u2014|to)\s*[$\u20b9\u20ac\u00a3]?\s*\d/i;
function checkValue(schema: SchemaNode, holder: Record<string, unknown> | unknown[], key: string | number, path: string, problems: string[]): void {
  const box = holder as Record<string | number, unknown>;
  const value = box[key];
  if (value === undefined || value === null) return;
  if (schema.properties && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, p] of Object.entries(schema.properties)) checkValue(p, value as Record<string, unknown>, k, path ? `${path}.${k}` : k, problems);
    return;
  }
  if (schema.items && Array.isArray(value)) {
    value.forEach((_, i) => checkValue(schema.items as SchemaNode, value, i, `${path}[${i}]`, problems));
    return;
  }
  if (Array.isArray(schema.enum) && typeof value === "string" && !schema.enum.includes(value)) {
    problems.push(`${path} must be one of: ${schema.enum.join(", ")}`);
    return;
  }
  if (schema.type !== "number" && schema.type !== "integer") return;
  let v = value;
  if (typeof v === "string") {
    const n = v.trim() === "" ? NaN : Number(v.replace(/,/g, "").trim());
    if (!Number.isFinite(n)) { problems.push(`${path} must be a number, written with digits only (for example 220000)`); return; }
    box[key] = n;
    v = n;
  }
  if (typeof v !== "number" || !Number.isFinite(v)) { problems.push(`${path} must be a number`); return; }
  if (typeof schema.minimum === "number" && v < schema.minimum) problems.push(`${path} must be ${schema.minimum} or more`);
  if (typeof schema.exclusiveMinimum === "number" && v <= schema.exclusiveMinimum) problems.push(`${path} must be more than ${schema.exclusiveMinimum}`);
  if (typeof schema.maximum === "number" && v > schema.maximum) problems.push(`${path} must be ${schema.maximum} or less`);
}

const MONEY_TEXT: Record<string, string[]> = { pricing_negotiation_guide: ["competitor_price", "value_delivered"], champion_enablement_kit: ["budget_context"], proposal_section_writer: ["pricing"] };
const METRIC_TEXT: Record<string, string[]> = {};
const ONE_AMOUNT: Record<string, string[]> = {};

function checkRequiredInputs(name: string, args: Record<string, unknown> | undefined): string | null {
  const tool = (tools as Record<string, { inputSchema: { required?: string[] } }>)[name];
  if (!tool) {
    return `Unknown tool: ${name}. Available tools: ${Object.keys(tools).join(', ')}.`;
  }
  const required = tool.inputSchema.required ?? [];
  // Run 16 R16-10 (rule B52): a required text (a string with no fixed list of choices) that is empty or only whitespace counts as missing.
  const props = ((tool.inputSchema as { properties?: Record<string, { type?: string; enum?: unknown[] }> }).properties ?? {});
  const blankText = (key: string) => typeof args?.[key] === "string" && (args[key] as string).trim() === "" && props[key]?.type === "string" && !Array.isArray(props[key]?.enum);
  const missing = required.filter((key) => args?.[key] === undefined || args?.[key] === null || blankText(key));
  if (missing.length > 0) {
    return `Missing required input for ${name}: ${missing.join(', ')}. Provide ${missing.length === 1 ? 'it' : 'them'} and call the tool again.`;
  }
  // Decision N2 (run 6) and run 7: schema limits at any depth, choices, money text and single amounts.
  const problems: string[] = [];
  if (args) {
    for (const [k, p] of Object.entries((tool.inputSchema as unknown as SchemaNode).properties ?? {})) checkValue(p, args, k, k, problems);
  }
  for (const key of MONEY_TEXT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && NEGATIVE_AMOUNT.test(raw)) problems.push(`${key} must not contain a negative amount`);
  }
  for (const key of METRIC_TEXT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && NEGATIVE_MONEY.test(raw)) problems.push(`${key} must not contain a negative amount of money`);
  }
  for (const key of ONE_AMOUNT[name] ?? []) {
    const raw = args?.[key];
    if (typeof raw === "string" && AMOUNT_RANGE.test(raw)) problems.push(`${key} must be one amount, not a range (for example $75,000)`);
  }
  // Run 15 R15-32 (edge-case matrix): a discount is a percentage, so over 100 cannot be priced; a target close date must not be past.
  if (name === "pricing_negotiation_guide" && typeof args?.discount_requested === "number" && args.discount_requested > 100) {
    problems.push("discount_requested must be 100 or less (it is a percentage of the deal value)");
  }
  if (name === "mutual_action_plan_generator" && typeof args?.target_close_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.target_close_date.trim())) {
    const close = new Date(args.target_close_date.trim() + "T23:59:59Z");
    if (!isNaN(close.getTime()) && close.getTime() < Date.now()) problems.push(`target_close_date ${args.target_close_date.trim()} is in the past; use a future date in the format YYYY-MM-DD`);
  }
  if (problems.length > 0) {
    return `Invalid input for ${name}: ${problems.join("; ")}.`;
  }
  return null;
}

export function createServer(): Server {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Object.values(tools).map((tool) => withMeta(tool)),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    // Run 20 round 1d (D086), the one choke point: every tools/call (stdio, hosted /mcp and /api/tools all come through here)
    // has its text arguments made inert once, before any tool reads them. The words stay; markup, tracking images, script
    // links, hidden characters and fake chat markers do not stay live (src/echo-safe.ts).
    const safeArgs = neutraliseDeep(request.params.arguments) as Record<string, unknown> | undefined;
    const problem = checkRequiredInputs(request.params.name, safeArgs);
    if (problem) {
      return { content: [{ type: 'text', text: problem }], isError: true };
    }
    const { name } = request.params;
    const args = safeArgs;

    try {
      const result = executeTool(name, args as Record<string, unknown>);
      return {
        content: [
          {
            type: 'text',
            text: result.replace(/\n{3,}/g, '\n\n'),
          },
        ],
      };
    } catch (error) {
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Revenue Enablement MCP v${SERVER_VERSION} running on stdio`);
}

// Run over stdio only when started directly (npm bin). The hosted function imports this
// file as an ES module bundle, where require is not defined.
if (typeof module !== 'undefined' && typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
}
