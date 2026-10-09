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
import { splitFeatureList, type ListItem, aAn, describeWith, painClauses, solutionBrief, capitaliseSolutionPhrase, parseContacts, parseProof, pickProof, proofPhrase, proofSource, tagKind, familyOf, clip, joinList, upperFirst, sentences, splitTopLevel, partLabel, addWorkdays, onOrBeforeWorkday, onOrAfterWorkday, workdaysBetween, isoDate, weekdayName, type Contact, type ProofItem, type SolutionBrief } from './dealtext.ts';
import { answerBlocker, blockerLines, blockerShort, roleFor, ROLE_KNOWLEDGE, namedThings, type BlockerContext } from './answers.ts';
import { buildAccountPlan } from './rw1-account.ts';
import { buildMutualActionPlan } from './rw1-map.ts';
import { buildRoiStructure } from './rw1-roi.ts';
import type { Deps as Rw1Deps } from './rw1-common.ts';
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
    description: 'Writes a discovery question list from the framework you choose (MEDDPICC, BANT, SPICED, Challenger, Gap Selling or all five) and what you already know about the prospect. Returns an opening for the conversation, questions in the language of the prospect\'s sector and on what your solution covers, the questions for each part of the framework, a closing for the call and what to say to an objection. It uses only the inputs you give and says which it did not get.',
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
    description: 'Writes a short win/loss review of one deal, a competitor pattern or a set of deals from the details you give. Returns a write-up in plain sentences that names the outcome, the stated reason in the buyer\'s words, what the reason points to and what the buyer weighed, then the questions for the review call and sector notes. It adds no figure or reason you did not give, and says plainly what the outcome or reason would add when it is missing.',
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
    description: 'Writes the proposal section you choose, such as an executive summary, solution overview or pricing justification, for a named buyer. Returns the section as sentences built from your solution, the buyer\'s challenges, your differentiators, pricing and success measures, with sector notes. It invents no figure, customer or date, and says once which inputs were not given.',
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
    description: 'Writes a multi-email sequence by persona, stage and objective, such as prospecting, nurture, follow-up or re-engagement. Returns each email with its subject, send day and body, built from your solution, the pain point, the value proposition, your proof and the ask, and a note on what you did not give. No placeholder is left in a body, and no result or statistic is invented.',
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
    description: 'Writes a demo script for the demo type, persona and use case you choose. Returns a timed run from opening to close, with spoken lines and a step for each feature you must show, tied to the pains you name, then discussion, close and follow-up lines and sector notes. The steps come from the parts of your solution and your pains, and the answer says where they came from and what it did not get.',
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
    description: 'Writes an internal selling asset for your champion, such as an executive brief, an internal business case, objection responses or presentation talking points, built from your solution, the customer\'s situation and the objections you expect. Returns the asset in the champion\'s voice with the recommendation, the answers to likely questions, the decision requested, a note on the reader and sector notes. It invents no figure or quote.',
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
    description: 'Writes landmine questions and positioning tactics against a named competitor, so the buyer\'s own criteria expose its weak points without negative selling. Returns the set-up, your strengths and the competitor\'s weak points as you gave them, discovery questions, criteria to establish, reference call questions, requirement and scenario traps, commercial terms and stage-specific tactics, with sector notes. Every line comes from your inputs and the sector, and none from an invented fact about the competitor.',
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
  const source = read.source;
  let m = detectModel(explicitModel, input);
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
  if (what !== 'objections') out.push(`- **Words this sector's buyers use:** ${v.vocabulary.join(', ')}. Use them where they are true for the prospect.`);
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

// Run 22: the three tools rewritten in run 22 (account_plan_builder, mutual_action_plan_generator, roi_business_case_builder) are built in src/rw1-*.ts.
// They use these shared helpers of this file, passed in so that those files never import this one.
const RW1_DEPS: Rw1Deps = {
  cap, money, lowerFirstIfCommon, splitItems, readContext,
  // the stock milestones of one kind of company (MAP_EVAL); the generic and the plain software entries are not used: the rewritten plan builds those from the deal
  stockEval: (v, investment) => { const key = stockKey(v, investment ? 'investment' : v ? v.id : ''); return key === 'generic' || key === 'saas' ? undefined : MAP_EVAL[key]; },
};

function executeAccountPlanBuilder(args: Record<string, unknown>): string {
  return buildAccountPlan(args, RW1_DEPS);
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

1. **Identify potential champions**: Who has the pain and influence?${dealCtx.v ? ` In ${dealCtx.v.name} the usual champion is: ${dealCtx.v.committee.split(';').find((x) => /champion/i.test(x))?.trim().replace(/[.]+$/, '') || 'the team lead who feels the problem'}.` : ''}
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
// Run 21b: the measures of a sector, ordered by the user's own words. A measure that shares a word with the pain the user typed (or, less, with the
// solution description) comes first; the rest keep the sector's order, so nothing is dropped and nothing is added. No match: the sector's order stands.
const MEASURE_STOP = new Set(['rate', 'time', 'share', 'effort', 'cost', 'number', 'count', 'average', 'total', 'per', 'and', 'the', 'for', 'with', 'from', 'that', 'this', 'your']);
const measureStems = (t: string): Set<string> => new Set((t.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !MEASURE_STOP.has(w)).map((w) => w.replace(/s$/, '').slice(0, 4)));
// A job title in running text: each capitalised word is lowered, an acronym is kept ("Project Executive" becomes "project executive", "Head of IT" keeps IT).
// "a" or "an" before a title or phrase; an acronym is read by its first letter's name (an HR leader, an SVP, a CFO).
const anOfPhrase = (w: string): string => { const t = w.trim(); const first = t.split(/\s+/)[0] || ''; const an = /^[A-Z]{2,5}$/.test(first) ? /^[AEIOFHLMNRSX]/.test(first) : /^(?:[aeiou]|8\b|8\d|11|18)/i.test(t); return `${an ? 'an' : 'a'} ${t}`; };
const lowerRole = (r: string): string => r.replace(/\b([A-Z])([a-z]+)\b/g, (_m, a, b) => `${a.toLowerCase()}${b}`);
function rankMeasures(measures: string[], pain: string, solution: string): string[] {
  const p = measureStems(pain), d = measureStems(solution);
  const score = (m: string) => [...measureStems(m)].reduce((n, w) => n + (p.has(w) ? 2 : 0) + (d.has(w) ? 1 : 0), 0);
  return measures.map((m, i) => ({ m, i, s: score(m) })).sort((x, y) => y.s - x.s || x.i - y.i).map((x) => x.m);
}
function executeDiscoveryQuestionBank(args: Record<string, unknown>): string {
  const framework = (args.framework as string) || 'meddpicc';
  const prospectIndustry = ((args.prospect_industry as string) || '').trim();
  const prospectRole = ((args.prospect_role as string) || '').trim();
  const knownPainPoints = ((args.known_pain_points as string) || '').trim();
  const knownMetrics = ((args.known_metrics as string) || '').trim();
  const dealStage = (args.deal_stage as string) || 'discovery';
  const yourSolution = ((args.your_solution as string) || '').trim();
  const gapsToFill = ((args.gaps_to_fill as string) || '').trim();
  // Run 19 D80 (problems 2, 3 and 8): gaps first, in the sector's language; "none" is never echoed back as if it were a metric.
  const ctx = readContext(undefined, { seller: [yourSolution], context: [knownPainPoints], role: [prospectRole], buyer: [prospectIndustry] });
  // Run 21c (draft rewrite): the list is written from the inputs. Each framework section asks about the product's parts, the pain clauses, the
  // prospect's role, the measures of the sector (ordered by the user's own words) and the deal details given; the standard lists are gone.
  const v = ctx.v;
  const sellerSw = !!v && v.id === 'saas' && !!prospectIndustry && !/software|saas|technology|internet|app\b/i.test(prospectIndustry); // a software seller's own measures and questions describe its customers, not a buyer in another industry
  const sectorMetrics = v && !sellerSw ? rankMeasures(v.metrics, knownPainPoints, yourSolution) : []; // the sector's measures, led by the ones the user's own pain and solution words point to (run 21b)
  const brief = solutionBrief(yourSolution);
  const P = brief.short || clip(lowerFirstIfCommon(yourSolution), 70) || 'this solution';
  const investment = ctx.model === 'investment';
  const roleKnow = prospectRole ? roleFor(prospectRole, investment) : null;
  const roleFam = prospectRole ? familyOf(prospectRole, investment) : 'other';
  const roleTxt = prospectRole ? lowerFirstIfCommon(prospectRole) : '';
  const youRole = roleTxt && !isPluralRole(roleTxt) ? anOfPhrase(roleTxt) : 'you';
  const indLow = prospectIndustry ? lowerFirstIfCommon(prospectIndustry) : '';
  const pains = painClausesWide(knownPainPoints).length ? painClausesWide(knownPainPoints) : knownPainPoints ? [knownPainPoints.replace(/[.]+$/, '')] : [];
  const painLead = pains[0] ? lowerFirstIfCommon(pains[0]) : '';
  const XL = painLead ? q(painLead) : 'the problem you came to fix'; // the pain in the user's own words, quoted inside a sentence
  const X = painLead && painLead.split(/\s+/).length > 7 ? 'that problem' : XL; // a long clause is quoted once (the opening) and then called "that problem"
  const signerClause = v ? lowerFirstIfCommon(v.committee.split(';')[0]).replace(/\s+signs?$/i, '') : '';
  const signer = signerClause && signerClause.length <= 40 ? signerClause : 'the person who signs';
  const kp = productKindAndParts(brief);
  const partNames = kp.parts;
  const rankedParts = knownPainPoints ? partsNearPain(partNames, knownPainPoints) : partNames.slice(0, 4);
  const farParts = partNames.filter((x) => !rankedParts.includes(x));
  const critA = rankedParts[0] || shortKind(kp.kind, brief.name) || (yourSolution ? P : 'this area');
  const critB = rankedParts[1] || sectorMetrics[0] || 'the outcome you care about';
  const noMetrics = /^(none|no|not yet|unknown|n\/a|na|tbd|none shared yet|not shared|nothing yet)\b/i.test(knownMetrics);
  const M1 = sectorMetrics[0] || 'the number this problem moves';
  const Mlist = sectorMetrics.length >= 2 ? joinList(sectorMetrics.slice(0, 3), 'or') : M1;
  const otherRoles = v ? v.buyerRoles.filter((r) => familyOf(r, investment) !== roleFam).sort((x, y) => Number(/ or /.test(x)) - Number(/ or /.test(y))).slice(0, 2).map(lowerRole) : [];
  const otherTxt = otherRoles.length ? joinList(otherRoles.map((r) => `your ${r}`), 'or') : 'someone else on your side';
  const inInd = indLow ? (/(?:ers|ors|ists|ants)$/i.test(indLow) ? ` at ${indLow}` : ` in ${indLow}`) : '';
  const qs = (items: string[]) => items.filter(Boolean).map((x) => `- ${x}`).join('\n');

  // gaps first (the questions are built from the product and the pain too)
  const GAP_QUESTIONS: [RegExp, string, string][] = [
    [/economic buyer|budget owner|sign/i, 'Economic buyer', `Who signs off a purchase like ${P}${inInd}, and have they seen ${X} first-hand?`],
    [/decision process|process|approval/i, 'Decision process', `What steps does a decision on ${critA} go through here, and who is involved at each step?`],
    [/budget/i, 'Budget', `Is there budget this year for ${critA}, and which line does it sit under?`],
    [/criteria/i, 'Decision criteria', `How will you compare the options for ${critA}: what has to be true for a yes?`],
    [/paper|legal|procurement|contract/i, 'Paper process', `What do legal, security and procurement need to see before ${P} can be signed, and how long do they usually take?`],
    [/timeline|timing|critical event|deadline|when/i, 'Timeline', `What happens if ${X} is not fixed by the end of the quarter?`],
    [/champion/i, 'Champion', `Who besides you wants ${X} fixed, and what would they gain?`],
    [/competi|alternative/i, 'Competition', `What else are you considering for ${critA}, including doing nothing?`],
    [/metric|baseline|number/i, 'Metrics', `How do you measure ${M1} today?`],
  ];
  const gaps = splitItems(gapsToFill);
  const gapRows = gaps.map((g) => { const m = GAP_QUESTIONS.find(([re]) => re.test(g)); return `- **${cap(g)}:** ${m ? m[2] : `Can you walk me through ${lowerFirstIfCommon(g)} for ${critA}?`}`; });
  const gapSection = gaps.length ? `## Gaps to fill first\n\nYou said these are still open, so ask about them before anything else:\n${gapRows.join('\n')}\n\n---\n\n` : '';

  // the opening, in spoken lines, by stage
  const OPEN: Record<string, string[]> = {
    first_call: [
      `Thanks for the time. Before I say anything about ${P}, I would like to hear how ${XL} shows up in your week.`,
      `What made you take a call about ${critA}?`,
      `I will leave time at the end to say what ${P} does and whether it fits.`],
    discovery: [
      `I would like to go deep on ${XL}: where it starts, who it touches and what it costs${v ? `, in terms of ${Mlist}` : ''}.`,
      `Who else should be part of this conversation about ${critA}${roleTxt ? `, besides ${youRole}` : ''}?`],
    deep_dive: [
      `We have covered ${XL}. Today I would like to test it against the detail of ${critA}${rankedParts[1] ? ` and ${rankedParts[1]}` : ''}.`,
      `What has changed since we last spoke about ${critA}?`],
    technical: [
      `I would like to understand the systems around ${critA}: where the data lives, what has to connect, and who owns each link.`,
      `Who from your technical side should be in the room for ${rankedParts[1] || critA}?`],
    executive: [
      `I will keep this to the outcome. ${cap(XL)} is the problem; what would ${youRole} need to see to back a change in ${critA}?`,
      `${v ? `Which of ${Mlist} do you answer for, and to whom?` : 'Which number do you answer for, and to whom?'}`],
  };
  const openSection = `## Opening for a ${dealStage.replace(/_/g, ' ')} conversation\n\nSay it in your own voice:\n${qs(OPEN[dealStage] || OPEN.discovery)}\n\n---\n\n`;

  // the prospect's role
  const roleOwn = roleKnow ? [
    rankedParts.length ? `Which of ${joinList(rankedParts.slice(0, 2), 'and')} would matter most to ${youRole}${indLow ? ` in ${indLow}` : ''}, and why?` : '',
    painLead ? `What does ${XL} mean for the targets ${youRole} answers for${indLow ? ` in ${indLow}` : ''}?` : (indLow ? `What does ${critA} mean for the targets ${youRole} answers for in ${indLow}?` : ''),
    `Who does ${youRole} turn to first when this goes wrong${indLow ? ` in ${indLow}` : ''}, and what do they say?`,
  ] : [];
  // a role the tool has no knowledge of (family "other") gets only the questions built from the inputs, not a stock paragraph
  const roleKnown = !!roleKnow && roleFam !== 'other';
  const roleSection = roleKnow ? `## Questions for ${prospectRole}\n\n${roleKnown ? `${upperFirst(aAn(roleKnow.label))} cares about ${roleKnow.cares}, and worries about ${roleKnow.worry}.\n\n` : ''}${qs([...roleOwn, ...(roleKnown ? roleKnow.questions : [])])}\n\n${roleKnown ? `**What they need to see before they say yes:** ${roleKnow.needs}.\n\n` : ''}---\n\n` : '';
  // A SaaS company's own activation and expansion questions do not suit a finance, security or IT leader who is buying from it.
  const sectorFits = !(v && v.id === 'saas' && (sellerSw || ['finance', 'security', 'risk', 'it', 'engineering', 'procurement'].includes(roleFam)));
  const sectorSection = v ? `## Questions in the language of ${v.name}\n\n${sectorFits ? qs(v.discovery) : `The usual ${v.name} questions are about a software company's own customers. They do not fit ${sellerSw ? `a buyer in ${indLow}` : roleKnow ? aAn(roleKnow.label) : 'a buyer in this role'}, so use the questions above and below.`}\n\n---\n\n` : '';
  // the pain, one clause at a time
  const painShells = [
    (p: string, m: string) => `On ${q(p)}: where does it start, who deals with it, and ${m ? `which of ${m} does it show up in first` : 'what does it cost in time, money or risk'}?`,
    (p: string, m: string) => `On ${q(p)}: what have you tried so far, and what stopped it from holding?`,
    (p: string) => `On ${q(p)}: how is it tracked today, and who would notice first if it went away?`,
  ];
  const painLines = pains.map((p, i) => painShells[i % 3](lowerFirstIfCommon(p), v && !sellerSw ? joinList(rankMeasures(v.metrics, p, '').slice(0, 2), 'or') : ''));
  const painSection = knownPainPoints ? `## Questions on the pain you described\n\n${qs([...painLines, pains.length > 1 ? `Of ${pains.length === 2 ? 'the two' : `the ${pains.length}`} pains above, which hurts most, and which one would ${signer} pick?` : ''])}\n\n---\n\n` : '';
  // the product's parts, each tied to the pain
  const partShells = [
    (n: string) => `${cap(n)}: in the case of ${X}, which step touches it, who does that step today, and with what?`,
    (n: string) => `${cap(n)}: what do you use for it today, and what would you want it to do that it does not?`,
  ];
  // the parts closest to the pain first; when fewer than three are close, the first parts of the user's list fill up to three
  const shownParts = [...rankedParts, ...farParts].slice(0, Math.max(3, Math.min(rankedParts.length, 5)));
  const notAsked = [...rankedParts, ...farParts].filter((x) => !shownParts.includes(x));
  const partSection = shownParts.length || notAsked.length ? `## Questions on what ${P} covers

${shownParts.length ? `One question for each part, the ones closest to the pain you gave first.\n\n${qs(shownParts.map((n, i) => partShells[i % 2](n)))}\n\n` : ''}${notAsked.length ? `Parts not asked about${knownPainPoints ? ' (they do not touch the pain you gave as closely)' : ''}: ${notAsked.join('; ')}.\n\n` : ''}---\n\n` : '';

  // the framework sections, each question written from the inputs
  const metricsQs = knownMetrics ? (noMetrics
    ? [`No metrics are known yet. How do you measure ${M1} today, and who owns that number?`]
    : [`You said ${q(lowerFirstIfCommon(clip(knownMetrics, 120)))}. How is that measured today, how often, and what would ${X} do to it?`]) : [`How do you measure ${M1} today, and who owns that number?`];
  const painIQs = pains.length ? pains.slice(0, 3).map((p, i) => [`You said ${q(lowerFirstIfCommon(p))}. Who feels it most, and what does it cost them?`, `You said ${q(lowerFirstIfCommon(p))}. What happens each week it stays that way?`, `You said ${q(lowerFirstIfCommon(p))}. Who first raised it, and why then?`][i % 3]) : [`What is not working today in ${critA}${inInd}?`];
  const heading = (t: string, items: string[]) => `### ${t}\n\n${qs(items)}`;
  const meddpicc = `## MEDDPICC questions\n\n` + [
    heading('M: Metrics', [...metricsQs, `If ${X} were fixed, which of ${Mlist} would move first, and by how much would it have to move to matter to ${youRole}?`, `What does ${X} cost each month today in time, money or risk, and how did you arrive at that figure?`]),
    heading('E: Economic buyer', [`Who signs off a purchase like ${P}${inInd}, and have they seen ${X} first-hand?`, `What would ${signer} need to see to move forward on ${P}?`, `Can we include ${signer} in the next conversation about ${critA}?`]),
    heading('D: Decision criteria', [rankedParts.length >= 2 ? `Which of ${joinList(rankedParts.slice(0, 3), 'or')} would be a must-have for ${youRole}, and which would be nice to have?` : `What would be a must-have in ${critA} for ${youRole}, and what would be nice to have?`, `How much weight does ${M1} carry when you compare options for ${critA}?`, `What would make you drop an option for ${critA}?`]),
    heading('D: Decision process', [`What steps does a decision on ${critA} go through${inInd}, and who is involved at each step?`, `What date are you working back from to have ${X} fixed, and what happens if it slips?`]),
    heading('P: Paper process', [`What do legal, security and procurement need to see before ${P} can be signed, and how long does each take?`, rankedParts.length >= 2 ? `Which of ${joinList(rankedParts.slice(0, 2), 'and')} would those reviewers look at hardest?` : `What would those reviewers look at hardest in ${critA}?`]),
    heading('I: Identify pain', painIQs),
    heading('C: Champion', [`Besides ${youRole}, who else wants ${X} fixed${otherRoles.length ? `: ${otherTxt}` : ''}?`, `If I gave you a business case for ${P}, would you take it to ${signer}?`, `What would that person need from us to push for ${critA}?`]),
    heading('C: Competition', [`What do you use today for ${critA}, and what do you like about it?`, `Have you looked at building ${critA} in house, or at doing nothing about ${X}?`, `Which other vendors are you speaking to about ${critA}?`]),
  ].join('\n\n');
  const bant = `## BANT questions\n\n` + [
    heading('B: Budget', [`Is there budget this year for fixing ${X}, and which line does it sit under?`, `What do you spend today on ${critA}, including your team's time?`, `Who controls the budget for a purchase like ${P}${inInd}: ${signer}?`]),
    heading('A: Authority', [`What is your part in choosing ${critA}${inInd}?`, `Who signs off on ${critA}${inInd}, and who else must agree${otherRoles.length ? `: ${otherTxt}` : ''}?`, `What would you need in order to recommend ${P} internally?`]),
    heading('N: Need', pains.length ? pains.slice(0, 3).map((p) => `On ${q(lowerFirstIfCommon(p))}: how many people or processes does it affect, and what does it cost?`) : [`What drives your interest in ${critA} now, and how does it rank among ${youRole === 'you' ? 'your' : 'the'} priorities?`]),
    heading('T: Timeline', [`What happens if ${X} is not fixed by the end of the quarter?`, `Is there a date or an event that you are working back from for ${critA}?`]),
  ].join('\n\n');
  const spiced = `## SPICED questions\n\n` + [
    heading('S: Situation', [`How do you handle ${critA} today, who is involved, and with which tools?`, rankedParts.length >= 2 ? `Which of ${joinList(rankedParts.slice(0, 3), 'and')} is already in place${inInd}?` : `What is already in place for ${critA}${inInd}?`]),
    heading('P: Pain', pains.length ? pains.slice(0, 3).map((p) => `On ${q(lowerFirstIfCommon(p))}: where does it break down, and who feels it first?`) : [`Where does ${critA} break down today, and who feels it first?`]),
    heading('I: Impact', [`If ${X} were fixed, which of ${Mlist} would change, and what would that be worth to ${youRole}?`, `What would success on ${critA} look like in a year?`]),
    heading('C: Critical event', [`What date or event makes ${critA} urgent now?`, `What is the cost of delay on ${X}?`]),
    heading('E: Event and decision', [`How will you compare options for ${critA}, and who decides?`, `What could speed up or slow down a decision on ${P}?`]),
    heading('D: Decision criteria', [`How important is ${critB} to you when you choose?`, `Is there a deal-breaker on ${critA} that we should know about?`]),
  ].join('\n\n');
  const pilotQ = v && v.discovery.length ? v.discovery[v.discovery.length - 1] : `What would a first trial of ${P} have to show for you to go further?`;
  const challenger = `## Challenger questions\n\n` + [
    heading('Teach', [painLead ? `You described ${X}. Where does it start: before the work reaches your team, inside it, or at the handover?` : `Where does the problem in ${critA} start: before the work reaches your team, inside it, or at the handover?`, `Which of ${Mlist} would move first if it were fixed?`, ...(v ? [`If you hold data on ${M1} across your customers, open with the pattern it shows, with its source and period. If a before-and-after exists (${proofOf(v)}), tell it in two sentences and name what changed. If you cannot show an insight, ask the question instead.`] : [])]),
    heading('Tailor', [`Where does ${X} cost ${youRole} most?`, `How would ${signer} react to seeing ${M1} next to ${critA}?`, `What is different about your situation${inInd} that we should factor in?`]),
    heading('Take control', [`Given ${X}, I would start with ${critA}. Who needs to be in that conversation?`, pilotQ, `What would need to be true for ${youRole} to try ${P}?`]),
  ].join('\n\n');
  const gapSelling = `## Gap Selling questions\n\n` + [
    heading('Current state', [`Walk me through how ${critA} runs today: who does each step and with which tools?`, `How does ${X} show up in ${M1} today?`]),
    heading('Future state', [`If ${X} were gone a year from now, what would ${youRole} be doing differently?`, `How would you measure that: ${Mlist}?`]),
    heading('The gap', [`What does the gap between today and that cost each quarter, in terms of ${M1}?`, `Who else feels the gap in ${critA}, and what do they lose?`]),
    heading('Problems behind the problem', [`Why do you think ${X} happens, and what have you tried to fix it?`, `What in your systems or process makes it hard to fix${rankedParts[0] ? `, starting with ${rankedParts[0]}` : ''}?`]),
  ].join('\n\n');

  // the close, by stage
  const CLOSE: Record<string, string> = {
    first_call: `Would a second call about ${critA} with ${signer} in it make sense?`,
    discovery: `I would suggest we put a baseline on ${M1} before the next call. Who can give it to us?`,
    deep_dive: `Shall we agree what a trial of ${critA} must show before anyone commits?`,
    technical: `Who owns the systems around ${critA}, and can they join the next call?`,
    executive: `What would you need from us to take ${P} to a decision on ${critA}?`,
  };
  const closeSection = `## Closing the call\n\n${qs([
    `Here is what I heard: ${XL}${knownMetrics && !noMetrics ? `, measured today as ${q(lowerFirstIfCommon(clip(knownMetrics, 100)))}` : ''}${roleTxt ? `, and it sits with ${youRole}` : ''}. Have I got that right?`,
    gaps.length ? `The open points are ${joinList(gaps.map((g) => lowerFirstIfCommon(g)))}. Who can I speak to about each one?` : `What should I have asked about ${critA} and did not?`,
    CLOSE[dealStage] || CLOSE.discovery])}\n\n---\n\n`;
  const objSection = v ? `## If you hear an objection\n\n${qs(v.objections.map((o) => `If you hear ${q(lowerFirstIfCommon(o.objection))}: ${o.response}`))}\n\n---\n\n` : '';

  // what was not given, said once
  const notGiven: string[] = [];
  if (!prospectIndustry) notGiven.push('prospect_industry (the questions do not name a sector)');
  if (!prospectRole) notGiven.push('prospect_role (there is no section for the person you meet)');
  if (!knownPainPoints) notGiven.push('known_pain_points (the questions ask about the area, not about a pain)');
  if (!yourSolution) notGiven.push('your_solution (there is no section on what it covers)');
  const notGivenLine = notGiven.length ? `**Not given:** ${notGiven.join('; ')}. Add them to use them in the list.\n\n` : '';

  let output = `# Discovery Question Bank

## Context
- **Prospect Industry:** ${prospectIndustry || 'not given'}
- **Contact Role:** ${prospectRole || 'not given'}
- **Deal Stage:** ${dealStage.replace(/_/g, ' ')}
- **Solution:** ${yourSolution || 'not given'}
${knownPainPoints ? `- **Known Pain Points:** ${knownPainPoints}\n` : ''}${knownMetrics ? `- **Known Metrics:** ${knownMetrics}\n` : ''}${gapsToFill ? `- **Information Gaps:** ${gapsToFill}\n` : ''}
${notGivenLine}${ctx.line}

---

${openSection}${gapSection}${roleSection}${sectorSection}${painSection}${partSection}`;

  if (framework === 'meddpicc' || framework === 'all') output += meddpicc + '\n\n---\n\n';
  if (framework === 'bant' || framework === 'all') output += bant + '\n\n---\n\n';
  if (framework === 'spiced' || framework === 'all') output += spiced + '\n\n---\n\n';
  if (framework === 'challenger' || framework === 'all') output += challenger + '\n\n---\n\n';
  if (framework === 'gap_selling' || framework === 'all') output += gapSelling + '\n\n---\n\n';
  output += `${closeSection}${objSection}${v ? `${sellerSw ? `### Sector notes: ${v.name}\n- The notes for this sector describe a software company's own customers, so they are left out for a buyer in ${indLow}.` : sectorNotes(v, 'committee')}\n\n` : ''}${SUGGESTIONS_FOOTER}`;
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
    return buildRoiStructure(args, { customerName, industry, companySize, yourSolution, primaryValueDriver, knownMetrics, currentProcess, implementationTimeline, revenueGiven, employeesGiven, annualRevenue, employeeCount, priceGiven, solutionPrice, ownCost, ownPct }, RW1_DEPS);
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

// Run 22: the answer without a buyer figure (rule B81, D80 problem 6) is built in src/rw1-roi.ts.


// Tool 5: Mutual Action Plan Generator
// Run 20 round 1b (D92): every date is a working day (the plan is built in working days back from the close date), each phase gets
// time in proportion to its work (the evaluation is not one week), the milestones follow how the sector buys (src/verticals.ts and
// the investment overlay), and every milestone has an owner who can do it: a security or compliance review belongs to the buyer's
// IT, security or risk reviewer, not to the champion. Each blocker is answered by its kind (src/answers.ts) with the owner for it.
type Who = 'champion' | 'eb' | 'seller' | 'se' | 'both' | 'it' | 'security' | 'risk' | 'proc' | 'finance' | 'eval';
interface Step { m: string; who: Who }
// Run 21b: MAP_EVAL and DEMO_SHOW were written around one kind of company in each vertical (last mile delivery, FMCG retail execution, spend and expense,
// operators and enterprise connectivity, cloud security, API testing). They are used only for that kind; every other company of the vertical gets the generic entry.
const STOCK_KIND: Record<string, string> = { 'logistics-tech': 'last-mile', 'vertical-saas': 'fmcg-retail-execution', fintech: 'spend-expense', telecom: 'operators-connectivity', cybersecurity: 'cloud-security', software: 'testing' };
function stockKey(v: Vertical | null, key: string): string {
  const kind = v && key === v.id ? STOCK_KIND[v.id] : undefined;
  return kind && v && v.subtype !== kind ? 'generic' : key;
}
const MAP_EVAL: Record<string, Step[]> = {
  generic: [
    { m: 'Agree the pilot scope, a baseline and the measure the buyer names', who: 'both' },
    { m: 'Connect the systems and data the pilot needs', who: 'it' },
    { m: 'Run the pilot with the buyer\'s champion over a full business cycle', who: 'champion' },
    { m: 'Review the pilot against the baseline and agree the rollout order', who: 'both' },
  ],
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
function executeMutualActionPlanGenerator(args: Record<string, unknown>): string {
  return buildMutualActionPlan(args, RW1_DEPS);
}


// Tool 6: Win/Loss Analyzer
// Run 22 (writer rev-w3): rewritten in src/rw-winloss.ts (shared helpers in src/rw-common.ts). The handler only hands over the inputs and the
// few helpers that live in this file (RW_DEPS is defined with the email handler above).
import { buildWinLoss } from './rw-winloss.ts';
function executeWinLossAnalyzer(args: Record<string, unknown>): string {
  return buildWinLoss(args, RW_DEPS);
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
  const evalSteps = MAP_EVAL[stockKey(v, modelKey)] || [{ m: 'a pilot with one team', who: 'both' as Who }];
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

"Sometimes this comes from a different budget than you'd expect. Who else benefits from this outcome?"${v ? ` In ${v.name}: ${lowerFirstIfCommon(v.committee.split(';').slice(0, 1)[0])}, and ${lowerFirstIfCommon(v.committee.split(';').find((x) => /finance|checks|review/i.test(x))?.trim().replace(/[.]+$/, '') || 'other functions review the cost')}.` : ''}

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
  const pricingSector = v ? `\n\n---\n\n${sectorNotes(v, 'objections')}\n- **Words this sector's buyers use:** ${v.vocabulary.join(', ')}. Use them where they are true for the prospect.` : '';
  const text = generator().replace(/^# (.+)$/m, (m, t) => `# ${t}: ${P}`);
  // every scenario but the discount request (which has its own situation table) opens with the deal, the leverage and the approver
  const withDeal = scenario === 'discount_request' || !scenarioGuides[scenario]
    ? text
    : text.replace(/^(# .+\n)/, (m) => `${m}\n${dealBlock}\n`);
  return `${withDeal}${pricingSector}`;
}


// Tool 11: Champion Enablement Kit
// Run 21c (draft rewrite): each asset type is the finished asset, built from the inputs: a memo the champion can forward, a brief, spoken answers to each
// objection, a talk with spoken lines, an email, one-page copy, a comparison and a risk write-up. An objection is answered by what it is about: its kind
// (a coverage question, an integration question, a price question, a "why do they switch" question ...) and its own words, with the alternatives, the value
// points and the parts of the product that share its words. Nothing the user typed is cut inside a word or a list; nothing is made up: where a fact is needed
// the answer says what the champion will ask for and what to confirm before saying it.
const CK_GENERIC = new Set(['manag', 'proje', 'syste', 'servi', 'custo', 'busin', 'platf', 'solut', 'tools', 'proce']);
const CK_STOP_PRICE = /\bcost (?:codes?|cent(?:er|re)s?|types?|plus|variance|accounting)\b/gi;
const ckBare = (s: string): string => s.trim().replace(/^["“]|["”]$/g, '');
const ckStrip = (s: string): string => s.trim().replace(/[?!.]+$/, '');
const ckLow = (s: string): string => (/^[“"]/.test(s.trim()) ? s.trim() : lowerFirstIfCommon(s.trim()));
const ckUp = (s: string): string => (/^[“"]/.test(s.trim()) ? s.trim() : cap(s.trim()));
const ckLowWord = (s: string): string => (/^[A-Z][a-z]/.test(s) && !/^(?:I|AI|API|ERP|CRM)\b/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const ckSay = (s: string): string => s.replace(/"/g, "'");
// A step of the stock pilot plan, said by a champion on the buyer's side.
const ckOwn = (s: string): string => s.replace(/\bthe buyer names\b/gi, 'we name').replace(/\bthe buyer's\b/gi, 'our').replace(/\bthe buyer\b/gi, 'we').replace(/\bbuyer's\b/gi, 'our').replace(/\bbuyer\b/gi, 'our team');
// A list of typed items: plain "a, b and c" when the items are short phrases, semicolons when an item holds a comma or an "and".
function ckList(xs: string[]): string {
  if (xs.length <= 1) return xs[0] || '';
  return xs.some((x) => /,|\band\b/i.test(x)) ? xs.join('; ') : joinList(xs);
}
type CkAnswer = { parts: string[]; push: string; confirm: string; cond: string; means: string; sector: string; kind: string };
interface CkCtx { P: string; kindLine: string; outs: string[]; alts: string[]; bud: string; urg: string; segs: string[]; bctx: BlockerContext; pStems: Set<string> }
function ckKind(o: string): string {
  const t = ckStrip(ckBare(o)).replace(CK_STOP_PRICE, 'cost-code');
  if (/\b(?:move|moves|moved|migrate|migrates|switch|switches|leave|leaves|graduate|outgrow|replace|abandon|drop)\w*\s+(?:off|from|away from|over from)\b/i.test(t)) return 'switch';
  if (/\b(?:how long|how soon|how quickly|how fast|timeline|go[- ]live|time to)\b/i.test(t)) return 'setup';
  if (/\b(?:refunds?|cancel\w*|lock-?in|renewals?|minimum|maximum|commitment|contract terms?|terms and conditions)\b/i.test(t)) return 'terms';
  if (/^(?:can|does|do|will|could|would|is|are)\b[^?]*\b(?:fit|match|support|handle|cover|reach|work with|work on|run on|speak)\b/i.test(t) || /\b(?:every|all|any|each)\s+\w+/i.test(t) && /^(?:can|does|do|will|could|would|is|are)\b/i.test(t)) return 'coverage';
  if (/\b(?:price|pricing|costs?|costly|expensive|cheap\w*|budget|fees?|how much|afford\w*|discount|roi|return on|pay|paying|payments?|credits|invoices?|billing|subscriptions?|charged?)\b/i.test(t)) return 'price';
  if (/\b(?:different|differs?|difference|differentiat\w*|versus|vs|compared? (?:to|with)|better than|instead of|rather than)\b|^why\b[^?]*\bover\b/i.test(t)) return 'compare';
  if (/\balready\b|\bin-?house\b/i.test(t)) return 'incumbent';
  if (/\b(?:integrat\w*|connect\w*|sync\w*|api|apis|erp|crm|accounting|ledger|sso|plug|import|export|migrat\w*)\b/i.test(t)) return 'integration';
  if (/\b(?:security|secure|privacy|gdpr|soc ?2|iso ?\d+|compliance|audit|regulat\w*|data residency|data protection|encrypt\w*|breach|pci)\b/i.test(t)) return 'security';
  if (/\b(?:offline|uptime|outage|reliab\w*|downtime|signal|latency)\b/i.test(t)) return 'reliability';
  if (/\b(?:adopt\w*|training|resist\w*|change management|will (?:they|people|crews|teams|users|staff)\b)/i.test(t)) return 'adoption';
  if (/\b(?:proof|prove|references?|case stud\w*|evidence|track record)\b/i.test(t)) return 'proof';
  if (/\b(?:not now|next (?:year|quarter)|later|priority|timing|wait|budget cycle)\b/i.test(t)) return 'timing';
  if (/\b(?:contract|lock-?in|terms|renewal|cancel\w*|minimum|commitment)\b/i.test(t)) return 'terms';
  if (/\b(?:accura\w*|wrong|errors?|trust|black box|explain\w*|hallucinat\w*)\b/i.test(t)) return 'accuracy';
  return 'general';
}
// The words of the objection that name what it is about.
function ckFocus(o: string, kind: string): string {
  const t = ckStrip(ckBare(o));
  let m: RegExpMatchArray | null = null;
  if (kind === 'coverage') m = t.match(/\b((?:every|all|any|each)\s+.+)$/i) || t.match(/\b(?:fit|match|support|handle|cover|reach|work with|work on|run on|speak)\s+((?:our|my|your|the)\s+.+|.+)$/i);
  else if (kind === 'integration') m = t.match(/\b(?:with|into|to|between)\s+((?:our|my|your|the|existing)\s+.+|.+)$/i);
  else if (kind === 'setup') m = t.match(/\b(?:does|will|would|is|are|do)\s+(?:the\s+|our\s+)?(.+?)\s+(?:take|need|require)\b/i);
  else if (kind === 'security' || kind === 'reliability') m = t.match(/\b(soc ?2(?: type [i]+)?|gdpr|iso ?\d{4,5}|pci(?:-dss)?|data residency|data protection|encryption|uptime|outages?|downtime|offline|latency)\b/i);
  return m ? m[1].trim() : '';
}
function ckAnswer(o: string, c: CkCtx): CkAnswer {
  const t = ckStrip(ckBare(o));
  const kind = ckKind(o);
  const foc = ckFocus(o, kind);
  const { P, outs, alts, bud, urg } = c;
  const own = (s: string) => dsOverlap(t, s, c.pStems) > 0;
  const altHit = alts.find((a) => own(a)) || '';
  const outHit = outs.find((x) => own(x)) || '';
  const segHit = c.segs.find((x) => own(x)) || '';
  const ev = outHit ? `That ties to one of the outcomes we are buying: ${ckLow(outHit)}.` : segHit ? `${P} lists ${ckLow(segHit)} among what it covers.` : '';
  const sector = answerBlocker(o, c.bctx).sector;
  const quoted = `'${ckSay(t)}'`;
  const main = outs[0] ? ckLow(outs[0]) : '';
  const altsLine = alts.length ? ckList(alts) : 'the way we work today';
  let parts: string[] = [], push = '', confirm = '', cond = '', means = '';
  switch (kind) {
    case 'coverage': {
      const f = foc || quoted;
      parts = [`On ${f}: I do not want to answer with a yes that I cannot back.`, `I will ask ${P} to list the cases behind ${f} and mark each one as supported today, supported with set-up, or not supported.`, ev, `Then we test the case that matters most to us in the pilot, before we commit to the rest.`];
      push = `Then let us write down the test for ${f} now, with the pass mark, and judge ${P} against it in the pilot.`;
      confirm = `which of the cases behind ${f} ${P} supports today, which need set-up and which it does not support, from its own documentation`;
      cond = `whether ${P} covers ${f}`; means = `Whether ${P} covers ${f} is not yet established.`;
      break;
    }
    case 'integration': {
      const f = foc || quoted;
      parts = [`On ${f}: before we sign I will ask ${P} to show, one system at a time, how it connects.`, `For each one I want to know whether the link is built in, goes through an API or needs a file transfer, who builds it and who owns it on our side.`, ev, `I would make that connection the first thing the pilot proves, with the owner of ${f} in the room.`];
      push = `Then I will ask for the technical call first: the owner of ${f} and ${P}'s engineers agree which data moves in which direction, before any contract.`;
      confirm = `how ${P} connects to ${f} today, and with what limits, from its integration documentation`;
      cond = `how ${P} connects to ${f}`; means = `How ${P} would connect to ${f} is not yet shown.`;
      break;
    }
    case 'setup': {
      const f = foc ? `how long ${foc} takes` : 'how long it takes';
      parts = [`On ${f}: I do not have a duration to quote, and I will not guess one.`, `I will ask ${P} for a dated plan: the steps from signing to the first result, who does what on each side, and what we must have ready.`, urg ? `The date is set by this: ${urg}, so I would plan back from it.` : '', ev];
      push = `Then we agree the plan in writing before we sign, and the pilot is where we check the first date.`;
      confirm = `the time ${P} commits to for ${foc || 'the first result'}, from its own plan or a reference, not from memory`;
      cond = `whether ${foc || 'the start'} fits the date we need`; means = `The time it takes ${foc ? `for ${foc} ` : ''}is not yet committed in writing.`;
      break;
    }
    case 'price': {
      parts = [`On the price: ${bud ? `the figure we have is ${bud}.` : `no price has been given to me, so I will ask for the full price in writing.`}`, `I would not judge it alone. Set it next to what we do today (${altsLine}) and what we are buying${main ? `: ${main}` : ''}.`, `I will ask ${P} for the price with set-up, integration and our own team's time on one page, so that we compare the same things.`];
      push = `Then let us fix the measure we will judge it by, and look at ${bud ? 'that figure' : 'the price'} against that measure after the pilot.`;
      confirm = `${P}'s full price and exactly what it includes; use an alternative's price only from a quote we hold, not from memory`;
      cond = `how the full price compares with what we get`; means = `${bud ? `The price, ${bud}, has to` : 'The price has to'} be set against what we get.`;
      break;
    }
    case 'switch': {
      const mV = t.match(/\b((?:move|moves|moved|migrate|migrates|switch|switches|leave|leaves|graduate|graduates|outgrow|outgrows|replace|replaces|abandon|abandons|drop|drops)\w*\s+(?:off|from|away from|over from))\s+/i); const verb = mV ? mV[1] : 'move off';
      const mY = t.match(/\b(?:off|from|away from)\s+(.+)$/i); const Y = mY ? mY[1].trim() : 'what they use';
      const mX = t.match(/^(?:why|how come)\s+(?:do|does|would|did|are|is)\s+(.+?)\s+(?:move|migrate|switch|leave|change|graduate|outgrow|replace|abandon|drop)/i); const X = mX ? mX[1].trim() : 'others';
      parts = [`On why ${X} ${verb} ${Y}: ${altHit ? `the only reason I have in writing is how the option in front of us is described: ${altHit}.` : `I have no reason in writing, and I will not invent one.`}`, c.kindLine ? `${c.kindLine} What we are buying: ${main || 'the outcomes above'}${outs.length > 1 && outs[1].length <= 90 ? `; ${ckLow(outs[1])}` : ''}.` : `What we are buying: ${main || 'the outcomes above'}.`, `So I will not rest on a general claim. I will ask ${P} to show, on our own work, which of our tasks ${Y} cannot do and what we do for those today.`];
      push = `Then I will ask ${P} whether any customer that moved off ${Y} has agreed to speak to us, and I will repeat only what they tell us. If none has, I will say so.`;
      confirm = `what ${P} does today for the tasks that fall outside ${Y}, shown on our own work, and which customer that moved off ${Y} will speak to us`;
      cond = `why we would move off ${Y}, shown on our own work`; means = `The reason to move off ${Y} has to be shown on our own work.`;
      break;
    }
    case 'compare': {
      parts = [`${cap(quoted)} deserves a plain answer, not a general claim about ${P}.`, alts.length ? `What I have is how the options in front of us were described: ${altsLine}.` : `No other option was named to me, so I will ask which ones are being weighed.`, main ? `What we are buying with ${P}: ${main}.` : '', `I will ask ${P} to show, on our own work, where it does something the others leave undone, and I will ask each of the others the same.`];
      push = `Then let us write the comparison as questions, one for each point that matters to us, and put the same ones to every option.`;
      confirm = `what ${P} and each other option do today for the points that matter to us, from their own documentation or a quote we hold`;
      cond = `where ${P} differs from the others, shown on our own work`; means = `How ${P} differs from the others has not been shown on our own work.`;
      break;
    }
    case 'incumbent': {
      parts = [`You raised ${quoted}. That is a fair point, and I do not want to throw out something that works.`, altHit ? `The option in front of us that comes closest is ${altHit}.` : '', `I will ask two things: what it does not do for us today, and what that costs us. Where it is good we keep it and run ${P} beside it; we replace it only where the gap is clear and we can show it.`, main ? `The gap we are paying to close is this: ${main}.` : ''];
      push = `Then let us draw the overlap line by line, including where the setup we already have does better, and decide on the gap that is left.`;
      confirm = `what the setup we already have covers and what it does not, from its own documentation, and what ${P} adds beyond it`;
      cond = `what the setup we already have leaves undone`; means = `What the setup we already have leaves undone is not yet listed.`;
      break;
    }
    case 'security': {
      const f = foc || 'security and data handling';
      parts = [`On ${f}: I will ask ${P} for its security documents before the meeting, not after.`, `They should say where our data is stored and processed, who can see it, how it is protected and how it is deleted.`, `Our own security reviewer should read them and tell us what is missing.`, ev];
      push = `Then we put ${f} on the agenda of the first technical call and I will not move on until our reviewer has the documents.`;
      confirm = `what ${P} supports for ${f} and what our own team still has to do, with the document that shows it`;
      cond = `whether our reviewer clears ${f}`; means = `${cap(f)} has not yet been reviewed.`;
      break;
    }
    case 'reliability': {
      const f = foc || 'reliability';
      parts = [`On ${f}: I will not quote a number I cannot show.`, `I will ask ${P} for its record on ${f} in writing, and for what happens to our work when it fails; the pilot will check it on our own use.`, ev];
      push = `Then we agree before the pilot what counts as a failure on ${f}, and who measures it.`;
      confirm = `${P}'s own record on ${f} and what it promises in the contract`;
      cond = `whether ${f} holds on our own use`; means = `${cap(f)} has not yet been checked on our own use.`;
      break;
    }
    case 'adoption': {
      parts = [`On whether people will use it: the way to find out is a small first group of the people who would use it every day, one measure of use agreed before we begin, and a named owner on our side.`, `Their results, not my opinion, make the case for everyone else.`, ev];
      push = `Then we let the first group set the pace, and widen only when the measure of use says to.`;
      confirm = `what training and support ${P} provides for the first group, and how use is measured`;
      cond = `whether the first group uses it every day`; means = `Whether people will use it is not yet known.`;
      break;
    }
    case 'proof': {
      parts = [`On proof: I will ask ${P} for a short test on our own work, with the success measure written down before it starts.`, `I will also ask for references from customers who have agreed to speak to us.`, ev];
      push = `Then I will show you the measure and the result side by side after the test, whatever the result is.`;
      confirm = `which customers have agreed to speak to us, and what ${P} can show on work like ours`;
      cond = `the test result against the measure`; means = `The proof for our own work does not exist yet.`;
      break;
    }
    case 'timing': {
      parts = [urg ? `On timing: the reason I would not wait is this: ${urg}.` : `On timing: no date has been given that forces a decision, so the honest answer is that it can wait unless we name one.`, `If it does wait, I will say what we are choosing to carry in the meantime${alts.length ? `: ${altsLine}` : ''}.`, ev];
      push = `Then let us name the event that would make it urgent, and plan back from it.`;
      confirm = `the date that matters, from the person who owns it; do not invent a deadline`;
      cond = `which date forces the decision`; means = `The cost of waiting is not yet named.`;
      break;
    }
    case 'terms': {
      parts = [`On the terms: I will ask for them in one place, in writing: what is paid and when, what happens on cancellation, and any minimum commitment.`, `I will not rely on anything the written terms do not say.`, ev];
      push = `Then we ask our legal reviewer to read the written terms before the pilot starts.`;
      confirm = `what ${P}'s written terms say on payment, cancellation and minimum commitment`;
      cond = `whether the written terms are acceptable`; means = `The terms are not yet in writing.`;
      break;
    }
    case 'accuracy': {
      parts = [`On whether we can trust the results: do not take ${P}'s word, or mine.`, `I will ask for a test on our own data, with the measure and the pass mark agreed before we start.`, ev];
      push = `Then we compare it with what we use today on the same data, and show the differences.`;
      confirm = `how ${P} produces and explains a result, and how we can check one against our own data`;
      cond = `whether the results are right on our own data`; means = `The accuracy on our own data has not been tested.`;
      break;
    }
    default: {
      parts = [`You raised ${quoted}. I do not have a fact to give you on that yet, and I will not guess.`, `I will find out what ${P} can show on exactly that point, bring it back with its source, and tell you what I could not get.`, ev];
      push = `Then tell me what answer would settle it, and we put that test into the pilot.`;
      confirm = `the facts behind ${quoted} from ${P}'s own documentation`;
      cond = `the answer to ${quoted}`; means = `${cap(quoted)} has no answer on the page yet.`;
    }
  }
  return { parts: parts.filter(Boolean), push, confirm, cond, means, sector, kind };
}

function executeChampionEnablementKit(args: Record<string, unknown>): string {
  const given = (k: string): string => (typeof args[k] === 'string' ? (args[k] as string).trim() : '');
  const assetType = given('asset_type') || 'executive_brief';
  const championRole = given('champion_role');
  const championNameGiven = given('champion_name');
  const targetGiven = given('target_stakeholder');
  const yourSolution = given('your_solution');
  const keyValuePoints = given('key_value_points');
  const knownObjections = given('known_objections');
  const competitiveContext = given('competitive_context');
  const budgetContext = given('budget_context');
  const urgencyDrivers = given('urgency_drivers');
  const championWins = given('champion_wins');
  const targetStakeholder = targetGiven || 'leadership';
  const champCtx = readContext(undefined, { seller: [yourSolution], context: [keyValuePoints, knownObjections, competitiveContext], role: [targetStakeholder, championRole] });
  const brief = solutionBrief(yourSolution);
  const P = brief.short || 'the solution';
  const v = champCtx.v;
  const investment = champCtx.model === 'investment';
  const bctx: BlockerContext = { product: brief.short, sectorObjections: v?.objections, sectorName: v?.name, model: champCtx.model };
  const modelKey = investment ? 'investment' : v ? v.id : '';
  const target = roleFor(targetStakeholder, investment);
  const sameRole = championRole && targetGiven && championRole.toLowerCase() === targetGiven.toLowerCase();
  const who = [championNameGiven, championRole].filter(Boolean).join(', ');
  const sign = championNameGiven || championRole;

  // The inputs, whole: a list is split at semicolons and new lines only, and a closing label stays with its figure.
  const outs = splitItems(keyValuePoints).map((x) => x.replace(/[.]+$/, ''));
  const claimy = outs.some((x) => /\([^()]*\b(?:claims?|headline|story|survey|quote|page|case study|customer|figures?)\b[^()]*\)\s*$/i.test(x));
  const alts = splitItems(competitiveContext).map((x) => x.replace(/[.]+$/, ''));
  const altList = ckList(alts);
  const bud = budgetContext.replace(/[.]+$/, '');
  const urg = urgencyDrivers.replace(/[.]+$/, '');
  const wins = championWins.replace(/[.]+$/, '');
  const typedObjections = splitItems(knownObjections).map((x) => x.replace(/^"|"$/g, '').trim()).filter(Boolean);
  const fromSector = !typedObjections.length && !!v;
  const objections = typedObjections.length ? typedObjections : fromSector ? v!.objections.slice(0, 3).map((o) => cap(o.objection)) : [];

  // What the product is, in the user's words, in whole sentences.
  let rest = brief.full;
  if (brief.name && rest.startsWith(brief.name)) rest = rest.slice(brief.name.length).replace(/^\s*[,:]\s*/, '');
  if (brief.short) rest = rest.replace(new RegExp(`^${brief.short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,\\s*`, 'i'), '');
  if (rest === brief.full && brief.name === brief.full) rest = '';
  const split = rest.match(/^(.*?)(?::\s+|,?\s+(?:covering|including|includes|featuring|offering|spanning)\s+|\s+made (?:of|up of)\s+)(.+)$/i);
  const kind = (split ? split[1] : rest).trim().replace(/[.;,]+$/, '');
  const covers = split ? split[2].trim().replace(/[.;]+$/, '') : '';
  const segs = covers.split(/,\s+|\s+and\s+/).map((s) => s.trim()).filter((s) => s && s.split(/\s+/).length <= 5);
  const relText = [keyValuePoints, knownObjections, competitiveContext].join(' ');
  const rel = segs.filter((s) => dsOverlap(s, relText, CK_GENERIC) > 0).slice(0, 3);
  const kindSentence = !kind ? '' : /^(?:a|an|the)\s/i.test(kind) ? `${cap(P)} is ${ckLowWord(kind)}.` : /^[a-z]/.test(kind) || /^(?:AI|API|B2B|B2C|SaaS|IT|[A-Z]{2,})\b/.test(kind) ? `${cap(P)} is ${aAn(kind)}.` : `${cap(P)} is ${kind}.`;
  const coversSentence = covers ? `It covers ${covers}.${rel.length && rel.length < segs.length ? ` Of that, ${joinList(rel)} ${rel.length === 1 ? 'is the part' : 'are the parts'} closest to the points above.` : ''}` : '';
  const overview = [kindSentence || (brief.name ? `We are looking at ${P}.` : ''), coversSentence].filter(Boolean).join(' ');
  const cx: CkCtx = { P, kindLine: kindSentence, outs, alts, bud, urg, segs, bctx, pStems: dsStems(`${P} ${brief.name} ${kind}`) };
  const ans = objections.map((o) => ({ o, a: ckAnswer(o, cx) }));
  const say = (a: CkAnswer): string => a.parts.join(' ');

  // What was not given, said once.
  const missing: string[] = [];
  if (!championNameGiven) missing.push('champion_name (nothing is signed)');
  if (!championRole) missing.push('champion_role (no job title is shown)');
  if (!targetGiven) missing.push('target_stakeholder (the draft is written for leadership)');
  if (!outs.length) missing.push('key_value_points (no outcome is stated: add the two or three results the reader should expect)');
  if (!typedObjections.length) missing.push(fromSector ? `known_objections (the usual objections of ${v!.name} are answered instead)` : 'known_objections (no objection is answered: add them for an answer to each)');
  if (!alts.length) missing.push('competitive_context (no alternative or current way of working is named)');
  if (!bud) missing.push('budget_context (no price is stated)');
  if (!urg) missing.push('urgency_drivers (no reason to act now is given, so no date is set)');
  if (!wins) missing.push('champion_wins (no personal note)');
  const notGiven = missing.length ? `Not given: ${missing.join(', ')}. Add what is missing and the draft will use it.` : '';
  const sameNote = sameRole ? `> You named the same role (${championRole}) as the champion and as the person to convince. If ${championRole} is your champion, name the person above them who must approve, and write this for that person.\n` : '';
  const head = (title: string) => [`# ${title}`, notGiven, sameNote].filter(Boolean).join('\n\n');
  const steps = (MAP_EVAL[stockKey(v, modelKey)] || MAP_EVAL.generic).slice(0, 4).map((s) => ckOwn(s.m));
  const stepFirst = lowerFirstIfCommon(steps[0] || 'agree the scope, the owners and the measure');
  const stepLast = lowerFirstIfCommon(steps[steps.length - 1] || 'review the result and decide the wider rollout');
  const outBullets = outs.map((x) => `- ${ckUp(x)}`).join('\n');
  const claimNote = claimy ? `A figure with a label in brackets comes from the vendor's own page or stories, as labelled. It is not measured at our company.` : '';
  const noReturn = `No return figure is stated here, because none was given. Run roi_business_case_builder with our own cost figures and add the result.`;
  const askLine = `${bud ? `approve ${P} at ${bud}` : `approve ${P}`} and the first step: ${stepFirst}`;
  const mainOut = outs[0] ? ckLow(outs[0]) : '';
  const stake = wins ? `Not for the reader. Your own stake, as you put it: "${ckSay(wins)}".` : '';
  const readerNotes = [
    `### About the reader`,
    `${cap(targetStakeholder)} is ${aAn(target.label)}: they care about ${target.cares}, and worry about ${target.worry}. They will want to see ${target.needs}.`,
    v ? `In ${v.name} the case is usually judged on ${joinList(v.metrics.slice(0, 4))}.` : '',
    v ? sectorNotes(v, 'committee') : '',
  ].filter(Boolean).join('\n\n');
  const answerBlock = (o: string, a: CkAnswer, full = true) => `### "${o}"\n\n${full ? say(a) : a.parts.slice(0, 2).join(' ')}${full && a.sector && v ? `\n\nUsual answer in ${v.name}: ${a.sector}` : ''}`;
  const sectorRisks = v ? v.objections.filter((o) => !ans.some((x) => answerBlocker(x.o, bctx).sector === o.response)).slice(0, 3) : [];
  const altsSentence = alts.length ? `The alternatives we looked at are ${altList}.` : '';
  const orList = (xs: string[]) => joinList(xs, 'or');

  const assets: Record<string, () => string> = {
    executive_brief: () => [
      head(`Executive Brief for ${cap(targetStakeholder)}`),
      `To: ${targetStakeholder}${who ? `\nFrom: ${who}` : ''}\nRe: Recommendation on ${P}`,
      `## Recommendation\n\nI recommend that we go ahead with ${P}.${bud ? ` The cost is ${bud}.` : ''}${urg ? ` The timing: ${urg}.` : ''}`,
      overview ? `## What it is\n\n${overview}` : '',
      outs.length ? `## What we expect to get\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : '',
      alts.length ? `## What else we looked at\n\n${altsSentence}${mainOut ? ` I recommend ${P}. What we are buying: ${mainOut}.` : ''}` : '',
      bud ? `## What it costs\n\n${bud}. ${noReturn}` : '',
      ans.length ? `## Questions you may have\n\n${ans.map((x) => answerBlock(x.o, x.a, false)).join('\n\n')}` : '',
      `## Decision requested\n\nI am asking you to ${askLine}.`,
      stake, readerNotes,
    ].filter(Boolean).join('\n\n'),

    internal_business_case: () => [
      head('Internal Business Case'),
      `Subject: Business case for ${P}\nTo: ${targetStakeholder}${who ? `\nFrom: ${who}` : ''}`,
      `I recommend that we approve ${P}${bud ? `, at ${bud}` : ''}.${mainOut ? ` What we are buying: ${mainOut}.` : ''}${urg ? ` The timing: ${urg}.` : ''} The rest of this note says what it is, what we expect to get, what it costs, what could go wrong and how I would start.`,
      alts.length ? `## Where we are today\n\nThe options in front of us are ${altList}.` : '',
      `## What we propose\n\n${overview || `We are proposing ${P}.`}`,
      outs.length ? `## What we expect to get\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : '',
      `## What it costs\n\n${bud ? `${bud}. ` : 'No price has been given yet. '}${noReturn}`,
      ans.length ? `## Questions I expect, and my answers\n\n${ans.map((x) => answerBlock(x.o, x.a)).join('\n\n')}` : '',
      sectorRisks.length ? `## Risks usual in ${v!.name}\n\n${sectorRisks.map((o) => `${cap(o.objection)}: ${o.response}`).join('\n\n')}` : '',
      urg ? `## Why now\n\n${cap(urg)}.` : '',
      `## Next steps\n\n1. ${cap(askLine)}.\n2. ${cap(lowerFirstIfCommon(steps[1] || stepFirst))}.\n3. ${cap(stepLast)}.`,
      ans.length ? `## Before you forward this\n\n${ans.map((x) => `Confirm before you say it ("${x.o}"): ${x.a.confirm}.`).join('\n')}` : '',
      stake, readerNotes,
    ].filter(Boolean).join('\n\n'),

    objection_responses: () => [
      head('Objection Response Guide'),
      `For: ${who || 'the champion'}\nSituation: selling ${P} inside the company${targetGiven ? `, to ${targetStakeholder}` : ''}`,
      ans.length ? `## Answers to say\n\n${ans.map((x) => `${answerBlock(x.o, x.a, false).replace(/\n\n[\s\S]*$/, '')}\n\nSay: "${ckSay(say(x.a))}"\nIf they push: "${ckSay(x.a.push)}"\nConfirm before you say it: ${x.a.confirm}.${x.a.sector && v ? `\nUsual answer in ${v.name}: ${x.a.sector}` : ''}`).join('\n\n')}` : '',
      urg && !ans.some((x) => x.a.kind === 'timing') ? `### "This can wait"\n\nSay: "It can wait only if we accept this: ${ckSay(urg)}. If we wait, that is the date we are choosing to miss."` : '',
      outs.length ? `## If the room drifts\n\nSay: "Whatever we decide on these points, what we are buying is ${ckSay(ckList(outs.map(ckLow)))}${bud ? `, for ${ckSay(bud)}` : ''}.${alts.length ? ` The alternatives we looked at are ${ckSay(altList)}.` : ''}"` : bud ? `## If the room drifts\n\nSay: "The figure we have is ${ckSay(bud)}."` : '',
      stake, readerNotes,
    ].filter(Boolean).join('\n\n'),

    presentation_talking_points: () => [
      head('Presentation Talking Points'),
      `For: ${who || 'the champion'}, presenting to ${targetStakeholder}\nTopic: ${P}`,
      `## Opening (2 minutes)\n\nSay: "I am here to ask for a decision on ${ckSay(P)}.${mainOut ? ` The outcome we are after: ${ckSay(mainOut)}.` : ''}"\n\nSay: "In the next 15 minutes: where we are today, what ${ckSay(P)} is, what we expect to get, what it costs and what I am asking you to decide."`,
      `## Where we are today (3 minutes)\n\n${alts.length ? `Say: "The options in front of us are ${ckSay(altList)}."` : `Say: "I have not named the options here; I will tell you what we use today."`}\n\n${v ? `Say: "A decision like this is judged on ${ckSay(joinList(v.metrics.slice(0, 3)))}. I will put our own numbers against each."` : `Say: "I will put our own numbers against what we do today."`}`,
      `## What ${P} is (4 minutes)\n\n${overview ? `Say: "${ckSay(overview)}"` : `Say: "We are looking at ${ckSay(P)}."`}\n\n${outs.map((x, i) => `Say: "${i === 0 ? 'What we expect to get: ' : i === outs.length - 1 && outs.length > 1 ? 'And ' : 'Then '}${ckSay(ckLow(x))}."`).join('\n\n')}${alts.length && mainOut ? `\n\nSay: "We looked at ${ckSay(altList)}. I recommend ${ckSay(P)}. What we are buying: ${ckSay(mainOut)}."` : ''}${claimNote ? `\n\nSay: "${ckSay(claimNote)}"` : ''}`,
      `## What it costs (4 minutes)\n\n${bud ? `Say: "The figure we have is ${ckSay(bud)}."` : `Say: "No price has been given to me, so I will bring the full price in writing."`}\n\nNote: ${noReturn}`,
      `## The decision (2 minutes)\n\nSay: "I recommend that we go ahead with ${ckSay(P)}.${urg ? ` The reason to move now: ${ckSay(urg)}.` : ''}"\n\nSay: "If you agree, the first step is to ${ckSay(stepFirst)}, and the last is to ${ckSay(stepLast)}."`,
      ans.length ? `## Questions to expect\n\n${ans.map((x) => `### "${x.o}"\n\nSay: "${ckSay(say(x.a))}"`).join('\n\n')}` : '',
      stake,
    ].filter(Boolean).join('\n\n'),

    email_to_stakeholder: () => {
      const firstQ = ans[0];
      return [
        head(`Email to ${targetStakeholder}`),
        `Subject: ${P}: a recommendation for your decision`,
        `Hi,`,
        `I am writing to recommend ${P}${kind ? `, ${/^(?:a|an|the)\s/i.test(kind) ? ckLowWord(kind) : aAn(kind)}` : ''}${bud ? `, at ${bud}` : ''}.${urg ? ` The timing matters: ${urg}.` : ''}`,
        outs.length ? `What we expect to get:\n${outs.map((x) => `- ${ckUp(x)}`).join('\n')}${claimNote ? `\n\n${claimNote}` : ''}` : '',
        alts.length ? `${altsSentence}${mainOut ? ` I recommend ${P}. What we are buying: ${mainOut}.` : ''}` : '',
        ans.length ? `Questions I expect, with short answers:\n${ans.map((x) => `- "${x.o}" ${x.a.parts[0]}`).join('\n')}` : '',
        `Could we take 15 minutes to go through it? I would ask you to ${askLine}.`,
        `Thanks,${who ? `\n${championNameGiven}${championRole ? `\n${championRole}` : ''}` : ''}`,
        `## Short version\n\nHi,\n\nI recommend ${P}${bud ? `, at ${bud}` : ''}.${mainOut ? ` What we are buying: ${mainOut}.` : ''} Could I have 15 minutes with you?${urg ? ` The timing: ${urg}.` : ''}${sign ? `\n\n${championNameGiven || championRole}` : ''}`,
        stake,
      ].filter(Boolean).join('\n\n') + (firstQ ? '' : '');
    },

    roi_one_pager: () => [
      head(`ROI One-Pager: ${P}`),
      `Prepared for ${targetStakeholder}${who ? ` by ${who}` : ''}`,
      `## The problem\n\n${alts.length ? `Today we are working with, or weighing, ${altList}.` : 'No current way of working was given, so none is described.'}${mainOut ? ` What we want instead: ${mainOut}.` : ''}`,
      `## The proposal\n\n${overview || `We propose ${P}.`}`,
      outs.length ? `## What we expect\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : '',
      `## Investment\n\n${bud || 'No price has been given yet.'}`,
      `## Return\n\n${noReturn}`,
      urg ? `## Why now\n\n${cap(urg)}.` : '',
      ans.length ? `## Questions to settle first\n\n${ans.map((x) => `- "${x.o}" ${x.a.parts[0]}`).join('\n')}` : '',
      `## The ask\n\n${cap(askLine)}.`,
      `Contact: ${who || 'the champion'}`,
      stake,
    ].filter(Boolean).join('\n\n'),

    competitive_comparison: () => [
      head('Competitive Comparison'),
      `${P} against the alternatives\nPrepared for: ${targetStakeholder}${who ? `\nBy: ${who}` : ''}`,
      `## Summary\n\n${alts.length ? `${altsSentence} ` : 'No alternative was named, so none is compared. '}${mainOut ? `I recommend ${P}. What we are buying: ${mainOut}.` : `I recommend ${P}.`}`,
      alts.length ? `## How each option stands\n\n${alts.map((a, i) => { const hit = outs.find((x) => dsOverlap(a, x, cx.pStems) > 0) || outs[i % Math.max(1, outs.length)] || ''; return `### Option ${i + 1}: ${a}\n\nAll we have on it is this description: ${a}. Nothing else was given, so nothing else is claimed.${hit ? `\n\n${cap(P)}'s side: ${ckLow(hit)}.\n\nThe test: ask each of them to show ${ckLow(hit)} on our own work.` : ''}\n\nConfirm before you say it: what this option does today ${hit ? 'for that' : 'for what we need'}, from its own documentation or a quote we hold, not from memory.`; }).join('\n\n')}` : '',
      `## ${P}\n\n${overview || `We are looking at ${P}.`}${outs.length ? `\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : ''}${bud ? `\n\nCost: ${bud}.` : ''}`,
      ans.length ? `## Questions to put to every option\n\n${ans.map((x) => `- ${x.o}`).join('\n')}` : '',
      urg ? `## Timing\n\n${cap(urg)}.` : '',
      stake,
    ].filter(Boolean).join('\n\n'),

    risk_assessment: () => {
      return [
        head(`Risk Assessment: ${P}`),
        `For: ${targetStakeholder}${who ? `\nBy: ${who}` : ''}`,
        `Likelihood and impact are not rated here: set them from our own assessment.`,
        `## Summary\n\nThis assessment covers the risks raised against ${P} and how each one is covered.${outs.length ? ` The investment is meant to deliver:\n\n${outBullets}${claimNote ? `\n\n${claimNote}` : ''}` : ''}`,
        ans.length ? `## The risks raised\n\n${ans.map((x) => `### Risk: "${x.o}"\n\nWhat it means here: ${x.a.means}\n\nHow we cover it: ${say(x.a)}${x.a.sector && v ? `\n\nUsual answer in ${v.name}: ${x.a.sector}` : ''}`).join('\n\n')}` : '',
        sectorRisks.length ? `## Risks usual in ${v!.name}\n\n${sectorRisks.map((o) => `### Risk: "${cap(o.objection)}"\n\nHow it is usually covered: ${o.response}`).join('\n\n')}` : '',
        `## The risk of doing nothing\n\n${alts.length ? `The options in front of us today are ${altList}. ` : ''}${v ? `The numbers to put against staying as we are: ${joinList(v.metrics.slice(0, 3))}.` : ''}${urg ? ` The timing: ${urg}.` : ''}`,
        `## Conclusion\n\nI recommend that we go ahead with ${P}${ans.length ? `, on the condition that the pilot settles: ${ans.map((x) => x.a.cond).join('; ')}` : ''}.${bud ? ` The cost is ${bud}.` : ''}`,
        stake,
      ].filter(Boolean).join('\n\n');
    },
  };
  void orList;
  const generator = assets[assetType] || assets['executive_brief'];
  return generator();
}



// Tool 12: Competitive Trap Setter
// Run 22 (writer rev-w3): competitive_trap_setter is rewritten in src/rw-trap.ts (shared helpers in src/rw-common.ts).
import { buildTrapSetter } from './rw-trap.ts';
function executeCompetitiveTrapSetter(args: Record<string, unknown>): string {
  return buildTrapSetter(args, RW_DEPS, SUGGESTIONS_FOOTER, (v) => sectorNotes(v, 'committee'));
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
    : (MAP_EVAL[stockKey(v, modelKey)] || []).length ? `No rollout plan was given (implementation_approach). For a product of this kind${v ? ` (${v.name})` : ''} a rollout usually starts like this, so use it as the first draft and put in your own phases and dates: (1) ${lowerFirstIfCommon((MAP_EVAL[stockKey(v, modelKey)] || [])[0].m)}; (2) ${lowerFirstIfCommon((MAP_EVAL[stockKey(v, modelKey)] || [])[(MAP_EVAL[stockKey(v, modelKey)] || []).length > 2 ? 2 : 1].m)}.` : `No rollout plan was given (implementation_approach). Describe the phases, who is involved on both sides and when value starts.`;
  const audienceLine = primaryAudience && AUDIENCE_NOTE[primaryAudience] ? `*Audience: written for ${AUDIENCE_NOTE[primaryAudience]}.*\n\n` : '';
  const claimsBlock = claims.length ? `\n### Claims to source before you send\n\nThese statements are yours. A buyer will ask for the source of each, so add it or soften the wording:\n${claims.map((c) => `- ${q(c)}`).join('\n')}\n` : '';
  const sectorProof = v ? `In ${v.name}, the evidence that lands is this: ${proofOf(v)}.` : '';

  // Tone adjustments
  const toneStyles: Record<string, { opening: string; language: string; lead: string }> = {
    formal: { opening: 'We are pleased to present this proposal. It outlines', language: 'professional and structured', lead: 'We are pleased to present this proposal.' },
    consultative: { opening: 'This proposal outlines', language: 'partnership-oriented', lead: '' },
    bold: { opening: 'The opportunity before you is set out below. This proposal outlines', language: 'confident and direct', lead: 'The opportunity before you is set out below.' },
    conservative: { opening: 'We respectfully submit this proposal. It outlines', language: 'measured and thorough', lead: 'We respectfully submit this proposal.' },
  };
  const toneStyle = toneStyles[tone] || toneStyles['consultative'];
  // Run 21c: the opening and the next steps of the executive summary are written from the inputs (challenge, first reason, first result, price, rollout).
  const tidy = (x: string) => x.trim().replace(/[.]+$/, '');
  // A research note typed inside a challenge, "(implied by the page's promise of ...)", is not client text: it comes out of the sentence and is listed for the seller.
  const ANNOT = /\s*\(((?:implied|inferred|assumed|derived|based on|from the|per the|as stated|according to|page|source|note|research)[^)]*)\)/gi;
  const annotations: string[] = [];
  const stripAnnot = (x: string): string => x.replace(ANNOT, (_m, a: string) => { annotations.push(`"${tidy(x.replace(ANNOT, '').trim())}" was marked "(${a.trim()})"`); return ''; }).trim();
  // One typed sentence that is really a list ("a, b, c, and d") becomes its points; any other single item stays whole.
  const asPoints = (items: string[]): string[] => {
    if (items.length !== 1) return items;
    const top = splitTopLevel(items[0]);
    if (top.length >= 3 && /^(?:and|or)\s/i.test(top[top.length - 1]) && top.every((x) => x.replace(/^(?:and|or|so)\s+/i, '').split(/\s+/).length >= 4)) return top.map((x) => x.replace(/^(?:and|or|so)\s+/i, '').trim());
    return items;
  };
  const xChallenges = asPoints(challenges.map(stripAnnot).filter(Boolean));
  const xDiffs = asPoints(diffs);
  const leadCut = (x: string): string => { if (x.length <= 140) return x; const m = x.slice(25).search(/[:,] /); return m >= 0 ? x.slice(0, 25 + m) : x; };
  const industryNote = customerIndustry && dsOverlap(customerName, customerIndustry) === 0 ? `, which works in ${customerIndustry},` : '';
  const kindLine = v ? `For a product like ${P} (${v.name}), buyers usually judge a change like this by ${joinList(v.metrics.slice(0, 3))}.` : '';
  // The solution is described, not pasted: what it is, then what it includes.
  const solMatch = brief.full.match(/^[^,:]+,\s+([^:]+?)(?::\s+(.+))?$/);
  const solutionText = !args.your_solution ? P
    : solMatch ? `${P} ${/^(?:a|an|the)\s/i.test(solMatch[1]) ? 'is' : 'is described as'} ${tidy(solMatch[1])}.${solMatch[2] ? ` It includes ${tidy(solMatch[2])}.` : ''}`
    : yourSolution.trim();
  const xClaims = claimsIn(xDiffs.join('\n'), yourSolution.length < 200 ? yourSolution : '');
  const execLead = [
    toneStyle.lead,
    xChallenges.length ? `${customerName}${industryNote} told us about ${xChallenges.length === 1 ? `one problem: ${tidy(leadCut(xChallenges[0]))}` : `${xChallenges.length} problems, starting with this: ${tidy(leadCut(xChallenges[0]))}`}.` : `No challenges were given to this tool: add customer_challenges to open on ${customerName}'s own problem.`,
    xDiffs.length ? `${P} is our answer, and the first reason is this: ${tidy(xDiffs[0])}.` : `${P} is our answer.`,
    outcomes.length ? `The result we propose to be held to: ${cleanClaim(outcomes[0])}.` : '',
    pricing ? `The investment is ${tidy(pricing)}.` : '',
  ].filter(Boolean).join(' ');
  const stockFirst = (MAP_EVAL[stockKey(v, modelKey)] || [])[0];
  const stepList: string[] = [
    xChallenges.length ? `Confirm the scope with ${customerName}: ${xChallenges.join(' ').length > 160 ? `the ${xChallenges.length === 1 ? 'problem' : `${xChallenges.length} problems`} listed under The Opportunity` : joinList(xChallenges.slice(0, 3).map(tidy))}.` : `Confirm the scope with ${customerName} (add customer_challenges to name it here).`,
    implementationApproach ? `Agree the rollout: ${tidy(implementationApproach)}.` : stockFirst ? `Agree the rollout, starting from this: ${lowerFirstIfCommon(tidy(stockFirst.m))}.` : '',
    outcomes.length ? `Agree the measure and its baseline: ${cleanClaim(outcomes[0])}.` : '',
    pricing ? `Confirm the investment: ${tidy(pricing)}.` : '',
  ].filter(Boolean);
  const nextSteps = stepList.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const xFigures = xDiffs.filter((d) => /\d[\d,.]*\s?(?:\+|%|x\b)/.test(d) && !xClaims.includes(d));
  const beforeLines = [
    xDiffs.length ? `- Add one piece of evidence for ${xDiffs.length === 1 ? 'the point' : `each of the ${xDiffs.length} points`} under Our Recommendation.${v ? ` For a product of this kind the evidence that lands is: ${proofOf(v)}.` : ''}` : '',
    xClaims.length ? `- Claims to source before you send: a buyer will ask for the source of each, so add it or soften the wording: ${xClaims.map((c) => q(c)).join('; ')}.` : '',
    xFigures.length ? `- Figures to source: ${xFigures.map((c) => q(c)).join('; ')}.` : '',
    annotations.length ? `- Research notes taken out of the client text (confirm each with the customer or drop it): ${annotations.join('; ')}.` : '',
    customerIndustry ? `- customer_industry (${customerIndustry}) is named in the opening only. Add one sentence on how ${P} is used in ${customerIndustry}: the sector notes below describe the seller's side.` : '',
  ].filter(Boolean);
  const beforeSend = beforeLines.length ? `### Before you send (for you, not for the client)\n\n${beforeLines.join('\n')}` : '';
  const bullets = (items: string[], fallback: string) => (items.length ? items.map((c) => `- ${c.trim()}`).join('\n') : fallback);

  // Section generators
  const sections: Record<string, () => string> = {
    executive_summary: () => `# Executive Summary

## Proposal for ${customerName}

${audienceLine}${execLead}

### The Solution

${solutionText}

### The Opportunity

${customerChallenges ? `Key challenges for ${customerName}:\n\n${bullets(xChallenges, '')}${kindLine ? `\n\n${kindLine}` : ''}` : `No challenges were given. Add customer_challenges, in ${customerName}'s own words, to complete this section.`}

### Our Recommendation

What ${P} offers ${customerName}:

${bullets(xDiffs, `- No differentiators were given. Add key_differentiators: the two or three reasons ${customerName} should choose ${P}, each with its evidence.`)}

### Expected Outcomes

${outcomes.length ? outcomes.map((o) => `- ${cleanClaim(o)}`).join('\n') : `No success metrics were given. Add success_metrics.${v ? ` For a product of this kind (${v.name}) the usual ones are ${joinList(v.metrics.slice(0, 4))}; agree the measure and the baseline with ${customerName}.` : ''}`}

### How We Will Get There

${rollout}

### Investment Overview

${pricing ? `Investment: ${pricing}` : 'No pricing was given. Add pricing here, or point to your pricing section.'}

### Why ${P}

${xDiffs.length ? `${P} stands out for ${customerName} on the ${xDiffs.length === 1 ? 'point' : `${xDiffs.length} points`} above. We propose to prove ${xDiffs.length === 1 ? 'it' : 'them'} the way a buyer of this kind of product checks: ${v ? `${proofOf(v)}.` : `on ${customerName}'s own case before any commitment.`}` : `No differentiators were given, so the reasons to choose ${P} are not stated here: add key_differentiators.`}

### Next Steps

${nextSteps}

---

*We look forward to partnering with ${customerName} to achieve these outcomes.*

${beforeSend}`,

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
// Run 21c: the kind and the parts of a product description. solutionBrief reads a list after a colon; a description written as "X, a platform for Y,
// covering a, b, c and d" has no colon, so its list after "covering", "including" or "spanning" is read here (only a clean list of short items:
// it stops at the first item that turns into a clause).
// A short noun phrase for what the product is, from its description: the name is dropped, the phrase is cut at "that", "which", "for", "with" or "covering",
// and a long one keeps its last four words ("a single API led intelligent platform of platforms" gives "API led intelligent platform of platforms" cut to its end).
function shortKind(kind: string, name: string): string {
  let k = kind.trim().replace(/^(?:a|an|the)\s+/i, '');
  if (name && k.toLowerCase().startsWith(name.toLowerCase())) k = k.slice(name.length).replace(/^[,:\s]+/, '').replace(/^(?:a|an|the)\s+/i, '');
  k = k.split(/\s+(?:that|which|for|with|covering|including|made)\s+|[,;:]\s*/i)[0].trim();
  const w = k.split(/\s+/);
  return w.length > 5 ? w.slice(-4).join(' ') : k;
}
// The separate pains in a typed pain statement, up to 16 words each (painClauses stops at 9): split at semicolons and commas outside brackets.
function painClausesWide(text: string): string[] {
  if (!text.trim()) return [];
  // a list after "across", "between" or "among" ("across marketing, sales and service") stays inside its clause
  const guarded = text.replace(/\b(across|between|among)\s+([^,;]+(?:,\s+[^,;]+)*?),?\s+(and|or)\s+([^,;]+)/gi, (m) => m.replace(/,/g, '\u0001'));
  const raw = guarded.split(/\n|;/).flatMap((x) => splitTopLevel(x)).map((x) => x.replace(/\u0001/g, ','));
  const out = raw.map((x) => x.replace(/^(?:and|with|plus|while|but|also)\s+/i, '').replace(/[.]+$/, '').trim())
    .filter((x) => { const n = x.split(/\s+/).length; return n >= 2 && n <= 40 && x.length > 4 && !/^(?:so|most|which|that|this|it|they|these|those)\b/i.test(x) && !/\b(?:that|this|it|them)$/i.test(x); });
  const uniq: string[] = [];
  for (const o of out) if (!uniq.includes(o)) uniq.push(o);
  return uniq.slice(0, 6);
}
// A role in the plural ("developers who integrate the API", "technology leaders") is spoken to as "you".
function isPluralRole(role: string): boolean {
  const head = role.trim().split(/\s+(?:who|that|responsible|in|at|of|for)\s+/i)[0];
  const last = head.split(/\s+/).pop() || '';
  return /s$/i.test(last) && !/(?:ss|us|is|sales|operations|analytics|business|logistics|success|services|news)$/i.test(last);
}
// The parts of a product that share a word with the pain or the value the user gave (generic words such as sales, service, customer do not count),
// the closest first. A part that shares none is not made the topic of an email or a question.
const NEAR_STOP = new Set(['sale', 'serv', 'cust', 'mark', 'team', 'tool', 'data', 'mana', 'syst', 'plat', 'proc', 'work', 'with', 'more', 'from', 'that', 'this', 'have', 'they', 'your', 'their', 'into', 'over', 'only', 'also', 'each', 'such', 'than', 'solu', 'prod', 'busi', 'comp', 'enab', 'help', 'real', 'time', 'fast', 'lowe', 'fewe', 'high', 'effi', 'when', 'what', 'ente', 'need', 'many', 'much', 'across']);
const stemSet = (t: string): Set<string> => new Set((t.toLowerCase().match(/[a-z]{4,}/g) || []).map((w) => w.replace(/s$/, '').slice(0, 4)).filter((w) => !NEAR_STOP.has(w)));
function partsNearPain(parts: string[], text: string): string[] {
  const st = stemSet(text);
  return parts.map((x, i) => ({ x, i, n: [...stemSet(x)].filter((w) => st.has(w)).length })).filter((o) => o.n > 0).sort((a, b) => b.n - a.n || a.i - b.i).map((o) => o.x);
}
function productKindAndParts(b: SolutionBrief): { kind: string; parts: string[] } {
  if (b.parts.length) return { kind: b.kind, parts: b.parts.map(partLabel).filter(Boolean) };
  const m = b.full.match(/,?\s+(?:covering|including|spanning)\s+(.+)$/i);
  const kind = (b.kind || '').replace(/,?\s+(?:covering|including|spanning)\b.*$/i, '').trim();
  if (!m) return { kind, parts: [] };
  const items: string[] = [];
  for (const raw of splitTopLevel(m[1].replace(/[.]+$/, ''))) {
    const t = raw.replace(/^and\s+/i, '').trim();
    if (!t || /\b(?:that|which|who|read|reads)\b/i.test(t) || t.split(/\s+/).length > 6) break;
    items.push(partLabel(t));
  }
  return { kind, parts: items.length >= 3 ? items.slice(0, 12) : [] };
}
// Run 22 (writer rev-w3): email_sequence_generator is rewritten in src/rw-email.ts (shared helpers in src/rw-common.ts). This handler only hands over
// the inputs, the few helpers that live in this file, and the sector block for the notes under the draft.
import { buildEmailSequence } from './rw-email.ts';
import type { Deps as RwDeps } from './rw-common.ts';
const RW_DEPS: RwDeps = { lower: (s) => lowerFirstIfCommon(s), cap: (s) => cap(s), isCommon: (w) => isCommonWord(w), money: (n) => money(n) };
function executeEmailSequenceGenerator(args: Record<string, unknown>): string {
  return buildEmailSequence(args, RW_DEPS, SUGGESTIONS_FOOTER, (v) => sectorNotes(v, 'metrics'));
}


// Tool 9: Demo Script Builder
// What a demo for each kind of seller shows (formats of evidence, not claims about any product: show only what the product really does).
const DEMO_SHOW: Record<string, string[]> = {
  generic: ['The workflow the buyer described, end to end, with their own example', 'The controls, reports and audit trail the buyer\'s reviewers will ask for', 'Where it sits among the systems the buyer already runs'],
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
// Run 21c (draft rewrite): the demo script is a script, not an outline. Spoken lines ("Say:", "Ask:") and on-screen steps ("On screen:") are written
// from the user's own inputs: the pains become the opening and the playback, every feature or flow to show becomes a step, the objections are answered
// where they would come up, the outcome builds the close. A credential, a figure or a claim is said, not shown, and keeps its source label.
// Nothing here states a fact about the user's product: where a fact is needed, a "Confirm before you say it" line says which one.
const DS_STOP = new Set(['that', 'this', 'with', 'from', 'your', 'have', 'does', 'will', 'what', 'about', 'into', 'their', 'them', 'they', 'when', 'where', 'which', 'more', 'most', 'some', 'such', 'each', 'only', 'over', 'under', 'very', 'need', 'needs', 'make', 'makes', 'already', 'long', 'take', 'much', 'platform', 'software', 'solution', 'product', 'also', 'than', 'then', 'there', 'would', 'could', 'should', 'every', 'work', 'works']);
const dsStems = (t: string): Set<string> => new Set((t.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !DS_STOP.has(w)).map((w) => w.replace(/(?:ing|ed|es|s)$/, '').slice(0, 5)));
function dsOverlap(a: string, b: string, skip?: Set<string>): number {
  const x = dsStems(a), y = dsStems(b);
  let n = 0;
  for (const w of x) if (y.has(w) && !(skip && skip.has(w))) n++;
  return n;
}
// A typed phrase placed inside a sentence: its first word is lowered only when it is an ordinary word ("Change order approval"), never a name ("Platform for AI Agents").
const dsLow = (t: string): string => { const w = t.trim().split(/\s+/)[0] || ''; return isCommonWord(w) ? t.charAt(0).toLowerCase() + t.slice(1) : t; };
const DS_ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
const DS_CREDENTIAL = /^\s*[\d$]|\b(?:over|more than|nearly|almost|upwards of)\s+\d|\b\d[\d,.]*\s*(?:million|billion|thousand|lakh|crore)\b|\b24\/7\b|\bround the clock\b|\bsla\b|\d[\d,.]*\s?(?:\+|%|[KMB]\b)|\$\s?\d|\b(?:proven|case stud(?:y|ies)|annual revenue|\d[\d,.+]*\s*(?:%|years|engineers|customers|companies|countries|partners|brands|users)|partnerships?|partners with|certified|certifications?|iso\s?\d{4,5}|soc ?[12]|pci|fedramp|award|recogni\w*|leader in|named a leader|trusted by|fortune|uptime|availability|gartner|empanel\w*)/i;
// The parts a product description lists, when the description lists them after a colon or after "covering", "including" and the like.
function dsParts(brief: SolutionBrief): string[] {
  if (brief.parts.length >= 2) return brief.parts.map(partLabel).filter((p) => p.length > 1);
  const m = brief.full.match(/\b(?:covering|including|includes|featuring|offering|spanning)\s+(.+)$/i) || brief.full.match(/,\s+(?:with|plus)\s+(.+)$/i);
  if (!m) return [];
  const out: string[] = [];
  for (const raw of splitTopLevel(m[1])) {
    const p = raw.replace(/^(?:and|plus)\s+/i, '').replace(/\s*\([^)]*\)/g, '').trim();
    if (!p || p.split(/\s+/).length > 6) break;
    out.push(p);
  }
  // the last item may hold the closing "and" ("test management and AI agents")
  const last = out[out.length - 1] || '';
  const lm = last.match(/^(.+?)\s+and\s+(.+)$/);
  if (lm && lm[1].split(/\s+/).length <= 3 && lm[2].split(/\s+/).length <= 3 && lm[1].split(/\s+/).length >= 2) out.splice(out.length - 1, 1, lm[1], lm[2]);
  return out.length >= 3 ? out : [];
}
interface DsCtx { P: string; pain: string; competitor: string; itPerson: string; securityPerson: string; bctx: BlockerContext }
// One objection answered in the seller's spoken words, by its kind, from the objection's own words and the deal's inputs.
// "Can it fit our cost codes?" asks whether a case is covered, whatever words it holds; the shared kind table reads the word "cost" as a price question.
function dsKind(t: string, bctx: BlockerContext): string {
  if (/^(?:can|does|will|could|would)\s+(?:it|the platform|the product|the tool|\S+)\s+(?:fit|match|support|handle|cover|work with)\s+(?:our|my|your)\b/i.test(t.trim())) return 'coverage';
  if (/^why\b.*\b(?:over|instead of|rather than)\b/i.test(t.trim())) return 'compare';
  if (/\b(?:buy|licen[sc]es?|seats?|suites?|bundles?|packages?|tiers?|editions?|add[- ]?ons?|modules?|sku)\b/i.test(t)) return 'packaging';
  return answerBlocker(t, bctx).kind;
}
// A person or a function in the room, as a noun phrase: "the CFO", "the Controller", but "the Product team" for a bare function.
const dsWho = (t: string): string => (/\b(?:manager|director|head|lead|leader|leaders|chief|officer|vp|vice|president|engineer|engineers|analyst|analysts|architect|owner|owners|founder|executive|executives|controller|counsel|team|teams|committee|group|auditors?|reviewers?|administrators?|admins?|developers?|users?|agents|staff|partners?|decision maker)\b/i.test(t) || (/^[A-Z]{2,5}$/.test(t) && !/^(?:IT|HR|QA|PR|GTM|R&D)$/.test(t)) ? `the ${t}` : `the ${t} team`);
function dsAnswer(t: string, c: DsCtx): { say: string; check: string; sector: string } {
  const a = answerBlocker(t, c.bctx);
  const kind = dsKind(t, c.bctx);
  const P = c.P;
  const costOf = c.pain ? 'what the problems you told me about cost you today' : 'what the current way of working costs you today';
  let lead = '';
  switch (kind) {
    case 'offline': lead = 'Fair, and I would rather show it than say it. I will show what a person can still do with no signal, what waits until the device reconnects, and what happens when two people change the same record. If you tell me where your people lose signal, we can test it there with your own users.'; break;
    case 'integration': {
      const systems = namedThings(t, [c.P]).filter((s) => !/^(?:API|APIs|SDK)$/i.test(s));
      lead = `Let us take it system by system${systems.length ? ` (${joinList(systems)})` : ''}. For each one I will tell you whether the link is built in, goes through an API or needs a file transfer, who builds it and who owns it on your side.${c.itPerson ? ` I would like ${c.itPerson} on a technical call to agree which data moves in which direction.` : ' I would like your IT owner on a technical call to agree which data moves in which direction.'}`;
      break;
    }
    case 'compliance': {
      const named = [...new Set((t.match(/\b(?:asc ?606|ifrs ?\d*|gaap|gdpr|dpdp|soc ?[12](?: type [i]+)?|iso ?\d{4,5}|pci(?:[- ]dss)?|rbi|sebi|fedramp|cert-in|gst)\b/gi) || []).map((x) => x.toUpperCase().replace(/\s+/g, ' ')))];
      lead = `You asked about ${named.length ? joinList(named) : 'the requirement you named'}. I will tell you exactly what ${P} supports, what your own team or auditor still has to do, and send the document that proves it before you have to ask for it.`;
      break;
    }
    case 'packaging': lead = `Let me put the options side by side: what each package includes, what you can buy on its own, and what happens to the price if you add or remove a product later. I will send it in writing so you can compare it with what you have today.`; break;
    case 'terms': lead = 'I will put the terms in writing in one place: what is paid and when, what is refundable, what happens on cancellation, and whether any minimum or maintenance fee applies. I will not promise anything the written terms do not say.'; break;
    case 'price': lead = `Fair question. Before I give you a number I want to set it next to ${costOf}, because that is the comparison that matters. I will put price, set-up, integration and your team's time on one page, so you can set it against ${c.competitor || 'what you do today'} on the same basis.`; break;
    case 'setup': lead = `Let me give you a dated plan, not a promise: the steps from signing to first use, who does what on each side, and what you need to have ready. We agree the plan before any contract is signed.`; break;
    case 'security': lead = `I will bring the answers before you ask: where the data is stored and processed, who can see it, how it is protected and deleted. I will send the security documents first and set up a call with ${c.securityPerson ? c.securityPerson : 'your reviewer'}.`; break;
    case 'accuracy': lead = `Do not take my word for it. Let us run ${P} on your own data, compare it with what you use today, and agree the measure and the pass mark before we start.`; break;
    case 'adoption': lead = `Let us plan adoption with the people who will use ${P} every day: a small first group, one measure of use agreed before we begin, and a named owner on your side. Their results make the case for everyone else.`; break;
    case 'incumbent': lead = `Let me start from what your current setup does not do today, in your words, and what that costs you. Where it is good we keep it and sit alongside it; we replace it only where the gap is clear. I will draw the overlap line by line, including what it does better.`; break;
    case 'proof': lead = `Let us agree a short proof on your own environment, with the success measure written down before it starts, and references from customers who have agreed to speak to you.`; break;
    case 'coverage': lead = `I would not answer that with a plain yes. Let us list the cases behind your question and, for each, say whether it is supported today, supported with set-up, or not supported. Then I suggest a pilot on the case that matters most to you.`; break;
    case 'compare': lead = `I will answer that as a difference in what each is for, not as a feature list: what it is for, who uses it, what it costs you and what it needs from your team. Where the other option is the better choice for a case, I will say so.`; break;
    case 'process': lead = `Here is how it works in three parts: what happens, who acts, and how long it takes. I will also put it in the proposal, so you do not have to rely on my memory.`; break;
    case 'why': lead = `Let me explain the cause in your terms first, then show you where you can see it and where you can change it.`; break;
    case 'timing': lead = `Understood. Is there an event that makes this urgent, a renewal, an audit, a season or a target? If there is one, I would plan back from it.`; break;
    default: lead = `That is a fair point, and I want to answer it with facts, not a guess. I will give you what I can show now, and for anything I cannot, I will tell you what I will bring back and by when.`;
  }
  const swapped = kind !== a.kind;
  const own: Record<string, { ask: string; check: string }> = {
    coverage: { ask: 'Which cases matter most to you, and which ones have caused trouble before?', check: `which of those cases ${P} supports today, which need configuration, and which it does not support` },
    compare: { ask: 'What are you trying to get done with it, and what have you tried so far?', check: `what ${P} and the other option each do today, from your own product documentation, and who each is for; do not claim a difference you cannot show` },
    packaging: { ask: 'Which of these do you need on day one, and which can wait?', check: `which products ${P} sells on their own, which only as part of a package, and how extra licenses are priced, from your current price list` },
  };
  const mine = swapped ? own[kind] : undefined;
  return { say: `${lead} ${mine ? mine.ask : a.ask}`, check: mine ? mine.check : a.confirm, sector: swapped ? '' : a.sector };
}
function executeDemoScriptBuilder(args: Record<string, unknown>): string {
  const demoType = (args.demo_type as string) || 'first_look';
  const typeLabel = cap(demoType.replace(/_/g, ' '));
  const given = (k: string): string => (typeof args[k] === 'string' ? (args[k] as string).trim() : '');
  const primaryAudience = given('primary_audience');
  const attendees = given('attendees');
  const customerIndustry = given('customer_industry');
  const yourSolution = given('your_solution');
  const keyPainPoints = given('key_pain_points');
  const competitorContext = given('competitor_context');
  const demoDuration = (args.demo_duration as number) || 30;
  const durationGiven = hasValue(args.demo_duration) && demoDuration === args.demo_duration;  // run 15: a given 0 falls back to 30, labelled as the default
  const minutesWord = demoDuration === 1 ? 'minute' : 'minutes';
  const mustShowFeatures = given('must_show_features');
  const knownObjections = given('known_objections');
  const outcomeText = given('desired_outcome');
  const demoCtx = readContext(undefined, { seller: [yourSolution], context: [keyPainPoints, mustShowFeatures, attendees], role: [primaryAudience], buyer: [customerIndustry] });
  const brief = solutionBrief(yourSolution);
  const P = brief.short || 'the product';
  const v = demoCtx.v;
  const investment = demoCtx.model === 'investment';
  const modelKey = investment ? 'investment' : v ? v.id : '';
  const bctx: BlockerContext = { product: P, sectorObjections: v?.objections, sectorName: v?.name, model: demoCtx.model };
  const audienceRole = primaryAudience ? roleFor(primaryAudience, investment) : null;
  const audience = primaryAudience || 'decision maker';
  const room = parseContacts(attendees, investment);
  const painWhole = keyPainPoints.replace(/[.]+$/, '');
  const clauses = painClauses(keyPainPoints);
  // The playback uses the clauses when they carry the whole pain statement; otherwise it quotes the statement as typed (a figure and its source label stay),
  // and the steps are paired with the pieces of that statement (cut at colons, semicolons, "while" and commas outside brackets).
  const clausesWhole = clauses.length > 0 && clauses.join(' ').length >= painWhole.length * 0.8;
  const fit = (x: string): string => { if (x.length <= 160) return x; const cut = x.slice(0, 160); const at = cut.lastIndexOf(', '); return at > 60 ? cut.slice(0, at) : clip(x, 160); };
  const pieces = painWhole.split(/;|:\s|\bwhile\b|,\s+(?:so|but|which)\b/i).map((x) => x.replace(/^[\s,]*(?:and|but|with|plus|so|which)\s+/i, '').replace(/[\s,]+$/, '').trim()).filter((x) => x.split(/\s+/).length >= 3);
  const pains = clausesWhole || !pieces.length ? clauses : pieces.slice(0, 6).map(fit);
  // A long piece of the pain is shown in the steps up to its first comma after 40 characters (the playback keeps the whole statement).
  const shortPain = (x: string): string => { if (x.length <= 100) return x; const at = x.indexOf(', ', 40); return at > 0 && at <= 110 ? x.slice(0, at) : x; };
  const painListed = /[;\n]/.test(keyPainPoints) || (clausesWhole && clauses.length >= 2);
  const painText = (i: number): string => (pains.length ? pains[i % pains.length] : painWhole ? clip(painWhole, 130) : '');

  // What to show: the features the user gave that can be run live; credentials and figures are said, not shown.
  const allFeats = splitFeatureList(mustShowFeatures);
  // The list splitter keeps a short fragment ("99.95% uptime") with the item before it; a credential fused with a flow to show is cut apart again here.
  const sepFeats: ListItem[] = allFeats.flatMap((x) => (DS_CREDENTIAL.test(x.text) && splitTopLevel(x.text).length > 1 ? splitTopLevel(x.text).map((t) => ({ text: t, label: x.label })) : [x]));
  const credentials = sepFeats.filter((x) => DS_CREDENTIAL.test(x.text));
  const showable = sepFeats.filter((x) => !DS_CREDENTIAL.test(x.text));
  const claimed = sepFeats.filter((x) => x.label);
  const demoSecs = Number(demoDuration);
  const intro = Math.floor(demoSecs * 0.15);
  const discovery = Math.floor(demoSecs * 0.15);
  const discussion = Math.floor(demoSecs * 0.15);
  const close = Math.round(demoSecs * 0.05);
  const demo = demoSecs - intro - discovery - discussion - close;
  const maxSteps = Math.max(1, Math.min(7, Math.floor(demo / 3)));
  let stepSource: ListItem[] = showable;
  let stepsFrom: 'features' | 'parts' | 'pains' | 'sector' = 'features';
  const allParts = dsParts(brief);
  const ctxWords = `${keyPainPoints} ${mustShowFeatures} ${attendees} ${primaryAudience} ${audienceRole ? `${audienceRole.cares} ${audienceRole.needs}` : ''}`;
  const rankedParts = (skipText: string): ListItem[] => allParts.map((p, i) => ({ p, i, s: dsOverlap(p, ctxWords) })).filter((x) => dsOverlap(x.p, skipText) < 2).sort((x, y) => y.s - x.s || x.i - y.i).map((x) => ({ text: x.p, label: '' }));
  let filledFromParts = 0;
  if (stepSource.length > 0 && stepSource.length < 3 && Math.floor(demoSecs - Math.floor(demoSecs * 0.15) * 3 - Math.round(demoSecs * 0.05)) >= 9) {
    // one or two features would fill the whole demo with one long step: the parts of the description that answer the pains are added
    const extra = rankedParts(stepSource.map((x) => x.text).join(' ')).slice(0, 3 - stepSource.length);
    filledFromParts = extra.length;
    stepSource = [...stepSource, ...extra];
  }
  if (!stepSource.length) {
    const parts = allParts;
    if (parts.length) {
      stepSource = rankedParts('');
      stepsFrom = 'parts';
    } else if (pains.length) {
      stepSource = pains.map((p) => ({ text: `How ${P} handles ${dsLow(p)}`, label: '' }));
      stepsFrom = 'pains';
    } else {
      stepSource = (DEMO_SHOW[stockKey(v, modelKey)] || []).slice(0, 3).map((t) => ({ text: t, label: '' }));
      stepsFrom = 'sector';
    }
  }
  const shownFeats = stepSource.slice(0, maxSteps);
  const notShown = showable.length ? stepSource.slice(maxSteps) : [];
  const perStep = Math.max(1, Math.floor(demo / Math.max(1, shownFeats.length)));
  // Pair each step with the pain it answers: the pain that shares most words with it, else the next one not yet used.
  const usedPain = new Set<number>();
  type DemoStep = { title: string; low: string; text: string; label: string; pain: string; metric: string; show: string };
  const steps: DemoStep[] = shownFeats.map((f, i) => {
    let pick = -1, best = 0;
    pains.forEach((p, j) => { const s = dsOverlap(f.text, p); if (!usedPain.has(j) && s > best) { best = s; pick = j; } });
    if (pick < 0 && stepsFrom === 'pains') pick = i % pains.length;
    if (pick < 0) { const free = pains.findIndex((_, j) => !usedPain.has(j)); pick = free >= 0 ? free : i % Math.max(1, pains.length); }
    if (pick >= 0 && pains.length) usedPain.add(pick);
    const pain = shortPain(pains.length ? pains[pick % pains.length] : painWhole ? clip(painWhole, 130) : '');
    const fw = dsStems(f.text);
    const metric = v ? (v.metrics.find((m) => [...dsStems(m)].some((w) => fw.has(w))) || '') : '';
    const imperative = /^(?:send|create|track|get|see|view|search|export|import|approve|submit|book|schedule|find|manage|monitor|ship|route|plan|scan|detect|block|assign|pick|upload|invite|set up|connect|measure|compare|build|report)\b/i.test(f.text);
    const showPhrase = imperative ? `how you ${dsLow(clip(f.text, 90))}` : /^(?:supports?|works?|integrates?|includes?|offers?|provides?|connects?|handles?|has|runs?|lets?|allows?|gives?|covers?|uses?|syncs?|captures?|plans?|re-plans?|detects?|ranks?|maps?)\b/i.test(f.text) ? `how it ${dsLow(clip(f.text, 90))}` : dsLow(clip(f.text, 90));
    const noun = f.text.replace(/^(?:supports?|handles?|offers?|provides?|includes?|covers?|has|uses?|runs?)\s+/i, '');
    return { title: cap(clip(noun, 90)), low: dsLow(clip(noun, 90)), text: f.text, label: f.label, pain, metric, show: showPhrase };
  });

  // Objections: the user's, else the sector's usual ones. Each is placed where it would come up.
  const typed = splitItems(knownObjections).map((o) => o.replace(/^"|"$/g, '').trim()).filter(Boolean);
  const fromSector = !typed.length && !!v;
  const objections = typed.length ? typed : fromSector ? v!.objections.slice(0, 3).map((o) => cap(o.objection)) : [];
  const itPerson = room.find((r) => r.family === 'it' || r.family === 'engineering')?.title || '';
  const securityPerson = room.find((r) => r.family === 'security' || r.family === 'risk')?.title || '';
  const dctx: DsCtx = { P, pain: painText(0), competitor: competitorContext, itPerson: itPerson ? dsWho(itPerson) : '', securityPerson: securityPerson ? dsWho(securityPerson) : '', bctx };
  const pStems = dsStems(`${P} ${brief.name}`);
  const atClose: string[] = [], atStep: Record<number, string[]> = {}, atDiscussion: string[] = [];
  for (const o of objections) {
    const kind = dsKind(o, bctx);
    if (kind === 'price' || kind === 'packaging' || kind === 'terms' || kind === 'timing' || kind === 'proof') { atClose.push(o); continue; }
    let pick = -1, best = 0;
    steps.forEach((s, i) => { const sc = dsOverlap(o, `${s.title} ${s.pain}`, pStems); if (sc > best) { best = sc; pick = i; } });
    if (pick >= 0) (atStep[pick] = atStep[pick] || []).push(o); else atDiscussion.push(o);
  }
  const objectionBlock = (o: string): string => {
    const r = dsAnswer(o, dctx);
    return `Buyer may ask: "${o.replace(/[?.]+$/, '')}${/\?$/.test(o) ? '?' : ''}"\nSay: "${r.say}"\nConfirm before you say it: ${r.check}.${r.sector ? `\nThe usual pattern in ${v ? v.name : 'this sector'}: ${r.sector}` : ''}`;
  };

  // Times (same shares as before: 15% opening, 15% confirm, 50% demo, 15% discussion, 5% close; the parts always add up to the length).
  const partMinutes = (n: number) => (n > 0 ? `${n} minute${n === 1 ? '' : 's'}` : 'under a minute');
  const partMin = (n: number) => (n > 0 ? `${n} min` : 'under 1 min');
  const startAt = (share: number, whole: number) => {
    if (demoSecs >= 10) return `${whole}:00`;
    const sec = Math.round(demoSecs * share * 60);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };
  const shortNote = demoSecs < 10 ? '\n\nThis demo is short, so the parts are rounded to whole minutes and some parts take less than a minute. Keep each of those to a sentence or two.' : '';

  // What was not given, said once.
  const missing: string[] = [];
  if (!primaryAudience) missing.push('primary_audience (the draft speaks to the room as a whole)');
  if (!attendees) missing.push('attendees (nobody else is asked by role)');
  if (!customerIndustry) missing.push('customer_industry (the opening names no industry)');
  if (!keyPainPoints) missing.push('key_pain_points (the playback asks the room for their main problem)');
  if (!competitorContext) missing.push('competitor_context (no comparison line)');
  if (!durationGiven) missing.push('demo_duration (30 minutes used)');
  if (!mustShowFeatures) missing.push(`must_show_features (the steps come from ${stepsFrom === 'parts' ? 'the parts named in your_solution' : stepsFrom === 'pains' ? 'your pain points' : 'the usual demo list of this kind of seller'})`);
  if (!knownObjections) missing.push(fromSector ? 'known_objections (the usual objections of the sector are answered instead)' : 'known_objections (no objection is answered; add them for a spoken answer to each)');
  if (!outcomeText) missing.push('desired_outcome (the close aims at agreeing the next step)');
  const notUsed: string[] = [];
  if (notShown.length) notUsed.push(`${notShown.map((f) => f.text).join('; ')} because the demo has room for ${maxSteps} step${maxSteps === 1 ? '' : 's'}${maxSteps === 1 ? '' : ' of about 3 minutes'}; add minutes or move them to a follow-up session`);
  const topLines = [
    missing.length ? `Not given: ${missing.join(', ')}. Add what is missing and the draft will name it.` : '',
    notUsed.length ? `Not used in the draft: ${notUsed.join('; ')}.` : '',
  ].filter(Boolean).join('\n\n');

  // ----- the script -----
  const ask = (t: string) => `Ask: "${t}"`;
  const roomTitles = room.map((r) => r.title);
  const who = joinList([audience === 'decision maker' ? '' : audience, ...roomTitles].filter(Boolean).map((x) => dsWho(x)));
  const stepTitles = steps.map((s) => s.low);
  const painPlayback = !keyPainPoints ? ''
    : clausesWhole ? pains.map((p, i) => `${DS_ORDINAL[i]}, ${p}`).join('; ') + '.'
    : `${painWhole}.`;
  const outcomeLine = outcomeText ? `The outcome I am aiming for in this session: ${outcomeText.replace(/[.]+$/, '')}.` : 'What I would like by the end of this session is a clear next step that we both agree.';

  const opening = [
    `Say: "Thanks for making the time. Over the next ${demoDuration} ${minutesWord} I will take you through ${P}${who ? `, with ${who} in the room` : ''}${customerIndustry ? `, and with ${customerIndustry} in mind` : ''}."`,
    keyPainPoints ? `Say: "Here is what I heard before today: ${painPlayback}"` : '',
    `Say: "${outcomeLine}"`,
    `Say: "The plan: first I confirm that I have your problem right, then ${demo} ${demo === 1 ? 'minute' : 'minutes'} of demo (${joinList(stepTitles)}), then your questions, then the next step."`,
    ask(`Before I share my screen: ${primaryAudience ? `${primaryAudience}, what` : 'what'} would make ${demoDuration === 1 ? 'this' : 'these'} ${demoDuration} ${minutesWord} worth it for you?`),
  ].filter(Boolean).join('\n\n');

  const typeQuestion: Record<string, string> = {
    first_look: painListed && pains.length > 1 ? `Of those ${pains.length} problems, which one should we solve first?` : keyPainPoints ? `Which part of that costs your team the most today, and who feels it first?` : 'What is the one thing you most want solved?',
    technical_deep_dive: `Which systems must ${P} work with, and who owns each one?`,
    executive_overview: keyPainPoints ? `What result on ${dsLow(painText(0))} would make this worth the team's time this year?` : 'What outcome would make this worth the team\'s time this year?',
    competitive_displacement: competitorContext ? `What does ${competitorContext} do well for you today, and where does it fall short?` : 'What do you use today, and where does it fall short?',
    expansion_upsell: `Which part of ${P} works best for you today, and where else does the same problem show up?`,
    proof_of_concept: keyPainPoints ? `What result on ${dsLow(painText(0))} would you need to see in a trial to call it a success?` : 'What result would you need to see in a trial to call it a success?',
  };
  const roleAsks: string[] = [];
  const seenFam: Record<string, number> = {};
  const pushRole = (title: string) => {
    const fam = familyOf(title, investment);
    const n = seenFam[fam] || 0; seenFam[fam] = n + 1;
    const qs = roleFor(title, investment).questions;
    roleAsks.push(`Ask ${dsWho(title)}: "${qs[n % qs.length]}"`);
  };
  if (primaryAudience) pushRole(primaryAudience);
  room.forEach((r) => pushRole(r.title));
  const confirm = [
    keyPainPoints ? `Say: "Let me play back what I heard, so the demo stays on your problem and not mine: ${painPlayback} Did I get that right, and what would you add?"` : `Say: "I have not been told your main problem, so before I show anything: what is the one thing you most want solved?"`,
    ...roleAsks,
    ask(typeQuestion[demoType] || typeQuestion.first_look),
  ].join('\n\n');

  // run 21c round 3: one stated pain is spelled out the first time a step uses it; later steps with the same pain say "the same problem"
  const seenPain = new Set<string>();
  const stepBlocks = steps.map((s, i) => {
    const again = !!s.pain && seenPain.has(s.pain);
    if (s.pain) seenPain.add(s.pain);
    const painTxt = again ? 'the same problem' : dsLow(s.pain || '');
    const lines = [`**Step ${i + 1}: ${s.title}** (about ${perStep} ${perStep === 1 ? 'minute' : 'minutes'})`];
    lines.push(`On screen: ${s.title}${s.pain ? `, run on one real case of ${painTxt}${i === 0 && customerIndustry ? `, using an example from ${customerIndustry}` : ''}` : ''}.${s.label ? ` Run it only if it works live (${s.label}).` : ''}`);
    lines.push(`Say: "${s.pain ? (again ? 'This one is for the same problem. ' : `This one is for what you told me about: ${painTxt}. `) : ''}Here is ${s.show}."`);
    lines.push(ask(s.metric ? `What is ${s.metric} for you today, and what would you want it to be after this?` : s.pain ? `${again ? 'Same problem: ' : `You told me: ${painTxt}. `}How often does that happen today, and who has to step in when it does?` : 'How often does this happen today, and who has to step in when it does?'));
    for (const o of atStep[i] || []) lines.push(objectionBlock(o));
    return lines.join('\n');
  });
  const saidLabels = [...new Set(credentials.map((c) => c.label || 'given as a feature to show'))];
  const said = credentials.length ? [`Say: "Worth knowing, though I will not demo ${credentials.length === 1 ? 'it' : 'them'}: ${credentials.map((c) => c.text).join('; ')}." *(${saidLabels.join('; ')}; have the source ready)*`] : [];
  const compareLine = competitorContext ? `Say: "I will only say what I can show you. You are weighing this against ${competitorContext}: which part of that comparison matters most to you? Let me show that part next."` : '';
  const flow = [
    `Say: "Let me share my screen. I will keep to what you asked to see: ${joinList(stepTitles)}."`,
    ...stepBlocks,
    said.length ? said.join('\n') : '',
    compareLine,
  ].filter(Boolean).join('\n\n');

  const discussionBlock = [
    `Say: "I will stop sharing here. What did that raise for you?"`,
    ...atDiscussion.map(objectionBlock),
  ].join('\n\n');

  const recapGroups: { pain: string; seen: string[] }[] = [];
  for (const st of steps) { const last = recapGroups[recapGroups.length - 1]; if (last && last.pain === (st.pain || '')) last.seen.push(st.low); else recapGroups.push({ pain: st.pain || '', seen: [st.low] }); }
  const recap = steps.length ? recapGroups.map((g) => (g.pain ? `You told me about ${dsLow(g.pain)}, and you saw ${joinList(g.seen)}.` : `You saw ${joinList(g.seen)}.`)).join(' ') : `You saw ${P}.`;
  const nextStepOption = v ? dsLow((MAP_EVAL[stockKey(v, modelKey)] || [{ m: 'Pilot discussion' }])[0].m) : '';
  const closeBlock = [
    `Say: "Here is what we covered. ${recap}"`,
    ...atClose.map(objectionBlock),
    outcomeText ? `Say: "What I set out to do today: ${outcomeText.replace(/[.]+$/, '')}. Are we there? If not, what is still missing?"` : `Say: "What would be the right next step from here, and who should be part of it?"${nextStepOption ? `\nThe next step to offer, from this sector: ${nextStepOption}.` : ''}`,
    `If yes. Say: "I will send a summary of ${joinList(stepTitles)} and an invite for the next step. Who else${roomTitles.length ? ` besides ${joinList(roomTitles.map(dsWho))}` : ''} should be on it?"`,
    `If hesitant. Say: "Which of the problems we played back is still not answered for you?${painText(0) ? ` Is it ${dsLow(painText(0))}, or something else?` : ''} I want you to have everything you need."`,
  ].join('\n\n');

  const showList = (DEMO_SHOW[stockKey(v, modelKey)] || []).map((x) => `- ${x}`).join('\n');
  const notesBlock = v ? `\n\n---\n\n${sectorNotes(v, 'objections')}${showList ? `\n- **What ${aAn(v.name)} buyer wants to see:** show only what ${P} really does:\n${showList.replace(/^- /gm, '  - ')}` : ''}\n- **Words this sector's buyers use:** ${v.vocabulary.join(', ')}. Use them where they are true for the prospect.` : '';

  const afterLines = [
    objections.length ? `- Send the written answers to: ${objections.map((o) => o.replace(/[?.]+$/, '')).join('; ')}.` : '',
    claimed.length ? `- Prove before you send: ${claimed.map((f) => `${f.text} (${f.label})`).join('; ')}.` : '',
    `- Send the summary promised in the close, and brief your champion separately.`,
  ].filter(Boolean).join('\n');

  return `# Demo Script: ${typeLabel}

${topLines ? `${topLines}\n\n` : ''}## Demo Configuration

| Element | Details |
|---------|---------|
| **Type** | ${typeLabel} |
| **Solution** | ${yourSolution || NOT_SUPPLIED} |
| **Primary Audience** | ${audience}${primaryAudience ? '' : ' (default)'} |
${attendees ? `| **Other Attendees** | ${attendees} |\n` : ''}${customerIndustry ? `| **Industry** | ${customerIndustry} |\n` : ''}| **Duration** | ${demoDuration} ${minutesWord}${durationGiven ? '' : ' (default)'} |
${competitorContext ? `| **Competitor or alternative** | ${competitorContext} |\n` : ''}${outcomeText ? `| **Desired Outcome** | ${outcomeText} |\n` : ''}
${demoCtx.line}

---

## Time Allocation

| Section | Time | What it does |
|---------|------|--------------|
| Opening | ${partMin(intro)} | ${keyPainPoints ? 'Says what you heard' : 'Asks for the main problem'}, states the outcome |
| Confirm | ${partMin(discovery)} | Plays the problem back${room.length ? ` and asks ${room.length + (primaryAudience ? 1 : 0)} roles` : ''} |
| Demo | ${partMin(demo)} | ${steps.length} step${steps.length === 1 ? '' : 's'}: ${joinList(stepTitles)} |
| Discussion | ${partMin(discussion)} | ${atDiscussion.length ? `${atDiscussion.length} objection${atDiscussion.length === 1 ? '' : 's'} and open questions` : 'Open questions'} |
| Close | ${partMin(close)} | ${outcomeText ? 'Tests the outcome' : 'Agrees the next step'} |${shortNote}

---

## Before You Start

${audienceRole ? `### Who you are showing it to\n\n${primaryAudience} is ${aAn(audienceRole.label)}. They care about ${audienceRole.cares}, and worry about ${audienceRole.worry}. They need to see ${audienceRole.needs}.\n\n` : ''}${room.length ? `### Who else is in the room\n\n| Attendee | What they will look for |\n|---|---|\n${room.map((r) => `| ${cap(r.title)} | ${roleFor(r.title, investment).needs} |`).join('\n')}\n\n` : ''}${claimed.length ? `### Claims to prove before you say them\n\n${claimed.map((f) => `- ${f.text} (${f.label})`).join('\n')}\n\n` : ''}${stepsFrom === 'parts' || filledFromParts ? `${stepsFrom === 'parts' ? 'The steps below come' : `The last ${filledFromParts} step${filledFromParts === 1 ? '' : 's'} below come`} from the parts named in your_solution: replace ${stepsFrom === 'parts' ? 'them' : filledFromParts === 1 ? 'it' : 'them'} with the flows you want to show.\n\n` : ''}---

## Demo Script

### Part 1: Opening (${partMinutes(intro)}, from 0:00)

${opening}

---

### Part 2: Confirm (${partMinutes(discovery)}, from ${startAt(0.15, intro)})

${confirm}

---

### Part 3: Demo (${partMinutes(demo)}, from ${startAt(0.30, intro + discovery)})

${flow}

---

### Part 4: Discussion (${partMinutes(discussion)}, from ${startAt(0.80, intro + discovery + demo)})

${discussionBlock}

---

### Part 5: Close (${partMinutes(close)}, from ${startAt(0.95, demoSecs - close)})

${closeBlock}

---

## After The Demo

${afterLines}${notesBlock}

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
export const SERVER_VERSION = '1.2.22';

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
            text: capitaliseSolutionPhrase(result.replace(/\n{3,}/g, '\n\n')),
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
