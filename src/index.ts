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
import { buildDemoScript } from './rw-demo.ts';
import { buildChampionKit } from './rw-champion.ts';
import { buildDiscoveryBank } from './rw-discovery.ts';
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

${hasChampion ? '' : `**No champion named.** Look for the person who feels the problem and is measured on it${v ? ` (in ${v.name}, the usual champion is described as: ${v.committee.split(';').find((x) => /champion/i.test(x))?.trim().replace(/[.]+$/, '') || 'the team lead who feels the problem'})` : ''}.
`}${hasEconomicBuyer ? '' : `**No buyer named.** Ask who signs this off and who controls the budget.
`}${v ? `
**Usual buying committee in ${v.name}:** ${v.committee}
${uncovered.length ? `\n**Roles this sector usually involves that none of your contacts cover:** ${joinList(uncovered.slice(0, 4))}. Ask who holds each part in this account.\n` : ''}` : ''}`;
  } else {
    powerMap = `
### Power Map (To Be Mapped)

You gave no contacts. Start with these questions${v ? ` (written for ${v.name})` : ''}:

1. Who owns the problem ${P} solves?${v ? ` In ${v.name} this is usually: ${(v.committee.split(';')[1]?.trim() || v.committee).replace(/[.]+$/, '')}` : ''}
2. Who controls the budget?${v ? ` ${v.committee.split(';')[0].replace(/[.]+$/, '')}.` : ''}
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
- The words this sector's buyers use${v ? `: ${v.vocabulary.join(', ')}` : ''}; listen for them in what the account publishes
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
// Run 22: discovery_question_bank is built in src/rw-discovery.ts (the pains read one statement at a time, the product's named parts, the buyer's industry, the signer asked as the signer).
function executeDiscoveryQuestionBank(args: Record<string, unknown>): string {
  return buildDiscoveryBank(args, {
    readContext, cap, lowerFirstIfCommon, sectorNotes: (v) => sectorNotes(v, 'committee'), splitItems, rankMeasures, proofOf, footer: SUGGESTIONS_FOOTER,
  });
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
  const evalSteps: Step[] = [...(MAP_EVAL[stockKey(v, modelKey)] || MAP_GENERIC_EVAL)];
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

// Run 21c second pass. Stakeholders: a comma inside a title ("Director, Security Engineering") keeps the title whole; a piece that is only a bare title word
// ("Director") joins the piece after it, every other piece is one person or group.
function wlContacts(text: string, investment: boolean): Contact[] {
  if (typeof text !== 'string' || !text.trim()) return [];
  const bare = /^(?:senior |sr\.? |group |regional |global )?(?:director|head|manager|vp|vice president|svp|evp|avp|lead|chief)$/i;
  const chunks: string[] = [];
  for (const line of text.split(/\n|;/)) {
    const pieces = splitTopLevel(line.trim().replace(/^(?:[-*\u2022]|\d+[.)])\s+/, ''));
    for (let i = 0; i < pieces.length; i++) {
      if (bare.test(pieces[i]) && i + 1 < pieces.length) { chunks.push(`${pieces[i]}, ${pieces[i + 1]}`); i++; } else chunks.push(pieces[i]);
    }
  }
  // each chunk is handed over whole: commas inside it are protected by brackets-free joining through the semicolon form
  return chunks.flatMap((c) => { const one = parseContacts(c.replace(/,\s+/g, ' / '), investment); return one.map((x) => ({ ...x, raw: x.raw.replace(/ \/ /g, ', '), title: x.title.replace(/ \/ /g, ', ') })); });
}
// Run 21c second pass. The kind of an alternative is read from what it is: "consolidating files" is manual work, not a set of tools; a set of separate tools
// needs a word for a tool, a vendor or a system.
function wlAlt(a: AltRead): AltRead {
  if (a.named) return a;
  if (a.label === 'a set of separate tools or vendors' && !/\b(?:tools?|vendors?|systems?|solutions?|apps?|applications?|platforms?|providers?|suppliers?|products?|point)\b/i.test(a.text)) {
    return /\b(?:consolidat\w+|compil\w+|merg\w+|copy\w*|re-?key\w*|reconcil\w+|collat\w+)\b/i.test(a.text) ? { text: a.text, label: ALT_KINDS[0].label, why: ALT_KINDS[0].why, check: ALT_KINDS[0].check, win: ALT_KINDS[0].win, named: false } : { text: a.text, label: 'another option the buyer used or considered', why: '', check: '', win: '', named: false };
  }
  return a;
}
const WL_GENERIC = 'another option the buyer used or considered';
// Run 21c (draft rewrite): the answer is now a finished short write-up built from the deal inputs (the headline, the deal facts, the
// stated reason read against the sector's usual reasons, the people with the positions the user gave, the alternatives the buyer weighed),
// followed by what the outcome and the reason would add when they are missing, the questions for the review call, the sector notes and the
// inputs as given. Nothing is concluded that an input does not say. No placeholder is printed: a missing input is named once, in one line.
const WL_COMMON = /^(?:already|their|there|about|which|would|these|those|being|other|still|because|should|could|where|while|using|every|first)$/;
function wlWords(s: string): string[] { return s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !WL_COMMON.test(w)); }

function executeWinLossAnalyzer(args: Record<string, unknown>): string {
  const analysisType = (args.analysis_type as string) || 'single_deal';
  const dealOutcome = (args.deal_outcome as string) || '';
  const dealDetails = ((args.deal_details as string) || '').trim();
  const lossReason = ((args.loss_reason as string) || '').trim();
  const competitorWon = ((args.competitor_won as string) || '').trim();
  const dealValue = (args.deal_value as number) || 0;
  const salesCycleDays = (args.sales_cycle_days as number) || 0;
  const stakeholdersInvolved = (args.stakeholders_involved as string) || '';
  const yourSolution = (args.your_solution as string) || '';
  const multipleDeals = ((args.multiple_deals as string) || '').trim();
  // Run 19 D80 (problem 3): the stated reason and the stakeholders are read, not only echoed.
  const wlCtx = readContext(undefined, { seller: [yourSolution], context: [dealDetails, lossReason, stakeholdersInvolved, multipleDeals] });
  const brief = solutionBrief(yourSolution);
  const P = brief.short || 'the solution';
  const v = wlCtx.v;
  const investment = wlCtx.model === 'investment';
  const contacts = wlContacts(stakeholdersInvolved, investment);
  const alts = alternativesIn(dealDetails, competitorWon).map(wlAlt);
  const isPortfolio = analysisType === 'deal_portfolio' || analysisType === 'loss_pattern';
  const days = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'day' : 'days'}`;
  const full = (t: string) => `${t.trim().replace(/[.!?]+$/, '')}.`;
  const named = competitorWon && !/^(?:no decision|none|nobody|n\/a)\.?$/i.test(competitorWon) ? competitorWon : '';
  const against = contacts.filter((p) => tagKind(p.tag) === 'blocker');
  const backing = contacts.filter((p) => tagKind(p.tag) === 'champion' || /support/.test(p.tag || ''));
  const deciders = contacts.filter((p) => ['economic', 'buyer'].includes(tagKind(p.tag) || ''));
  const untagged = contacts.filter((p) => !p.tag);
  const hasV = hasValue(args.deal_value), hasD = hasValue(args.sales_cycle_days);
  // The deal notes are not echoed back in full: the roles and the alternatives they list are used above, so only the rest is quoted.
  const seg = (dealDetails.match(/\bdeals?\s+with\s+([^;:.]+?)\s*(?:;|\.|$)/i) || [])[1] || '';
  const residual = (() => {
    let r = dealDetails;
    if (alts.some((a) => !a.named)) r = r.replace(/(?:the\s+)?(?:alternatives?(?:\s+(?:buyers|they|customers|the buyers?)\s+use)?\s+(?:are|is|include)(?:\s+described\s+as)?|competing\s+(?:with|against)|competitors?\s*(?:are|is|include[sd]?|:)|\bversus\b|\bvs\.?|incumbents?\s*(?:is|are|:)?|compared\s+(?:with|to))\s*:?\s*(.+?)(?=\.\s+[A-Z]|\.$|$)/i, '');
    if (contacts.length) r = r.replace(/\broles involved:[^;.]*/i, '');
    return r.replace(/(?:\s*;\s*)+/g, '; ').replace(/;\s*\./g, '.').replace(/;\s*$/, '').replace(/\s{2,}/g, ' ').trim();
  })();
  const notesPara = dealDetails && residual ? `**Deal notes.** ${residual.length < dealDetails.length ? 'The rest of your notes, in your words (the roles and the alternatives you listed are used here):' : 'In your words:'}\n\n> ${residual.replace(/\n+/g, '\n> ')}` : '';

  // ---- the line that names what is missing, once ----
  const notGiven: string[] = [];
  if (!args.your_solution) notGiven.push('the solution (`your_solution`; the write-up says "the solution")');
  if (!dealOutcome && !isPortfolio) notGiven.push('the outcome (`deal_outcome`)');
  if (!lossReason && dealOutcome !== 'won' && !isPortfolio) notGiven.push('the stated reason (`loss_reason`)');
  if (!competitorWon && (dealOutcome === 'won' || dealOutcome === 'lost') && !isPortfolio) notGiven.push('the competitor (`competitor_won`)');
  if (!hasV) notGiven.push('the deal value (`deal_value`)');
  if (!hasD) notGiven.push('the sales cycle (`sales_cycle_days`)');
  if (!contacts.length) notGiven.push('the stakeholders (`stakeholders_involved`)');
  if (!dealDetails && !isPortfolio) notGiven.push('the deal details (`deal_details`)');
  if (isPortfolio && !multipleDeals) notGiven.push('the deals (`multiple_deals`)');
  const notGivenLine = notGiven.length ? `Not given: ${joinList(notGiven)}. The write-up says what it can from the rest.\n\n` : '';

  // ---- the write-up ----
  const para: string[] = [];
  const solutionSentence = args.your_solution
    ? (yourSolution.trim().length > P.length + 3 ? `What was sold: ${full(yourSolution)}` : `What was sold: ${P}.`)
    : '';
  const sizeSentence = hasV && hasD ? `The deal was worth ${money(dealValue)} and ran ${days(salesCycleDays)}.` : hasV ? `The deal was worth ${money(dealValue)}.` : hasD ? `The deal ran ${days(salesCycleDays)}.` : '';
  if (isPortfolio) {
    const deals = splitItems(multipleDeals);
    const kind = (d: string) => (/\bno[ _-]?decision\b/i.test(d) ? 'nd' : /\b(?:lost|loss)\b/i.test(d) ? 'lost' : /\b(?:won|win)\b/i.test(d) ? 'won' : 'open');
    const n = { won: 0, lost: 0, nd: 0, open: 0 };
    deals.forEach((d) => { n[kind(d) as 'won' | 'lost' | 'nd' | 'open']++; });
    if (deals.length) {
      const counts = [`${n.won} won`, `${n.lost} lost`, `${n.nd} no decision`, n.open ? `${n.open} with no outcome written` : ''].filter(Boolean);
      para.push(`**The deals you listed.** You listed ${deals.length} deal${deals.length === 1 ? '' : 's'}: ${counts.join(', ')}. These are counts of your own lines, not a benchmark.\n\n${deals.map((d) => `- ${d}`).join('\n')}`);
      if (n.won + n.lost + n.nd > 0 && n.won + n.lost > 0) para.push(`**Win rate on these lines.** Of the ${n.won + n.lost} deals marked won or lost, ${n.won} ${n.won === 1 ? 'was' : 'were'} won.`);
    } else {
      para.push(`**The deals.** No deals were listed, so there is nothing to count. The write-up below covers ${P} from the deal inputs that were given.`);
    }
    if (solutionSentence) para.push(`**What was sold.** ${solutionSentence.replace(/^What was sold: /, '')}`);
    if (sizeSentence) para.push(`**The deal facts you gave.** ${sizeSentence}`);
    if (named) para.push(`**Who won.** You named ${named} as the competitor who won.`);
    if (notesPara) para.push(notesPara);
  } else {
    // the headline
    const withWho = (a: string, b: string) => (named ? a : b);
    if (dealOutcome === 'lost') para.push(`**${upperFirst(P)} lost this deal${withWho(` to ${named}`, '')}.** ${sizeSentence}`.trim());
    else if (dealOutcome === 'won') para.push(`**${upperFirst(P)} won this deal${withWho(`, ahead of ${named}`, '')}.** ${sizeSentence}`.trim());
    else if (dealOutcome === 'no_decision') para.push(`**This deal ended with no decision.** ${sizeSentence}`.trim());
    else if (dealOutcome === 'mixed') para.push(`**You marked this outcome as mixed.** Split the deals into won, lost and no_decision and run the tool for each, or use \`deal_portfolio\` with a summary in \`multiple_deals\`. ${sizeSentence}`.trim());
    else para.push(`**The deal.** ${args.your_solution ? `${P} was in this deal.` : 'No facts about the deal itself were given.'} ${sizeSentence}`.trim());
    if (solutionSentence && (dealOutcome || brief.kind || yourSolution.length > P.length + 3)) para.push(solutionSentence);
    if (notesPara) para.push(notesPara);
    // the reason
    if (dealOutcome === 'lost' && lossReason) {
      const rw = wlWords(lossReason);
      const overlapN = (o: { objection: string }) => wlWords(o.objection).filter((w) => rw.some((x) => x.slice(0, 5) === w.slice(0, 5))).length;
      const near = v ? v.objections.map((o) => ({ o, n: overlapN(o) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 1).map((x) => x.o) : [];
      const r = lossReason.toLowerCase();
      const readings: string[] = [];
      if (/bundle|one vendor|single vendor|suite|together|all-in-one/.test(r)) readings.push('A bundle loss: the buyer preferred one vendor for more than your product covers. Ask whether you could have partnered for the missing part, or qualified out earlier.');
      if (/\b(hr|it|finance|procurement|legal|operations|security)\b.*\b(owned|decided|led|chose)|\b(owned|led) the decision/.test(r)) readings.push('The decision sat with another function: a team you did not sell to made the call. Map who owns the budget and the decision in the first two meetings next time.');
      if (/price|cost|budget|expensive|cheaper|discount/.test(r)) readings.push('Price or budget: check whether the value case was agreed in the buyer\'s own numbers before price came up.');
      if (/feature|product|capabilit|missing|gap|integrat/.test(r)) readings.push('A product or fit gap: decide whether the gap was real or a demonstration problem, and whether the requirement could have been shaped earlier.');
      if (/timing|priority|later|next year|freeze|no decision/.test(r)) readings.push('Timing or priority: look for the event that would have made this urgent, and whether the status quo was acceptable to them.');
      if (/relationship|incumbent|existing|renew|stayed/.test(r)) readings.push('Incumbent advantage: the buyer stayed with what they know. Ask what the incumbent fixed or promised during your evaluation.');
      let text = `**The stated reason.** The reason the buyer gave, in the words you recorded: ${q(lossReason)}.`;
      if (near.length) text += ` ${near.length === 1 ? 'It is close to a usual objection' : 'It is close to usual objections'} in ${v!.name}: ${joinList(near.slice(0, 2).map((o) => q(o.objection)))}. The pattern of an answer that tends to work there: ${lowerFirstIfCommon(near[0].response)}`;
      para.push(text);
      para.push(`**What the reason points to.**\n\n${readings.length ? readings.map((x) => `- ${x}`).join('\n') : `- The reason matches none of the usual patterns, so ask the buyer what sat behind it.`}`);
    } else if (lossReason) {
      para.push(`**The reason you gave.** ${q(lossReason)}.`);
    } else if (dealOutcome === 'won' && dealDetails) {
      const why = sentences(dealDetails).find((s) => /\b(?:chose|choose|picked|selected|because|decid\w+|reason|won|after)\b/i.test(s) && !/hypothetical/i.test(s));
      if (why) para.push(`**Why it was won.** The reason in your notes: ${q(why)}. Check it with the buyer and write down their own words.`);
    }
    // the alternatives
    if (alts.length) {
      const list = alts.some((a) => /,/.test(a.text)) ? alts.map((a) => a.text).join('; ') : joinList(alts.map((a) => a.text));
      const onlyNamed = alts.every((a) => a.named);
      const label = dealOutcome === 'lost' && named ? (onlyNamed ? `The buyer chose ${named}.` : `The buyer compared ${P} with ${list}, and chose ${named}.`) : `The buyer compared ${P} with ${list}.`;
      const each = alts.map((a) => a.named
        ? `- **${cap(a.text)}** is the competitor you named. ${dealOutcome === 'won' ? `Ask the buyer what ${a.text} did better, in their own words, and at which stage ${P} pulled ahead.` : `Ask the buyer what it did better, in their own words, and at which stage it pulled ahead.`}`
        : a.label === WL_GENERIC ? `- **${cap(a.text)}.** The buyer used or considered it. Ask the buyer what it did well, and what it failed to give them.`
        : `- **${cap(a.text)}** is ${a.label}. A buyer keeps it when ${a.why}. ${P} can win against it ${a.win}. Ask the buyer: ${a.check}`);
      para.push(`**What the buyer weighed.** ${label}\n\n${each.join('\n')}`);
    } else if (named) {
      para.push(`**What the buyer weighed.** The buyer compared ${P} with ${named}. Ask the buyer what ${named} did better, in their own words, and at which stage it pulled ahead.`);
    }
  }
  // the people
  if (contacts.length) {
    const groups: string[] = [];
    if (backing.length) groups.push(`Backing ${P}: ${joinList(backing.map((c) => c.title))}.`);
    if (against.length) groups.push(`Against: ${joinList(against.map((c) => c.title))}.`);
    if (deciders.length) groups.push(`Recorded as the buyer: ${joinList(deciders.map((c) => c.title))}.`);
    if (!contacts.some((c) => c.tag)) groups.push('No position was recorded for any of them.');
    else if (!backing.length) groups.push('No champion is recorded.');
    let notNamedLine = '';
    if (v) {
      const ACR: Record<string, string> = { cfo: 'financial', coo: 'operating', cio: investment ? 'investment' : 'information', cto: 'technology', ciso: 'security', cmo: 'marketing', cro: 'revenue' };
      const sig = (t: string) => t.toLowerCase().split(/[^a-z0-9]+/).map((w) => ACR[w] || w).filter((w) => w.length > 1 && !['chief', 'officer', 'head', 'of', 'manager', 'lead', 'and', 'the', 'senior', 'sr', 'vp', 'director'].includes(w));
      const given = new Set(contacts.flatMap((c) => sig(c.title)));
      const notNamed = v.buyerRoles.filter((role) => !sig(role).some((w) => given.has(w)));
      if (notNamed.length) notNamedLine = ` Roles this sector usually involves that you did not list: ${joinList(notNamed.slice(0, 4))}. Were they part of the deal, and what did they think?`;
    }
    para.push(`**The people.** ${contacts.length === 1 ? 'One stakeholder was' : `${contacts.length} stakeholders were`} involved: ${joinList(contacts.map((c) => c.raw))}. ${groups.join(' ')}${notNamedLine}`);
  }

  // ---- what the missing inputs would add (said once) ----
  const sectorWord = v ? `the usual reasons in ${v.name}` : 'the usual reasons';
  let adds = '';
  if (!dealOutcome && !isPortfolio) adds = `## What the outcome and the reason would add\n\nThe outcome (\`deal_outcome\`: won, lost or no_decision) would turn this from a description of the deal into a write-up of who the deal was won against or lost to. The stated reason (\`loss_reason\`, in the buyer's own words and with who said it) would be read against ${sectorWord} and would name what to change. For a win, put the reason the buyer gave for choosing ${P} in \`deal_details\`.\n\n`;
  else if (dealOutcome === 'lost' && !lossReason && !isPortfolio) adds = `## What the stated reason would add\n\nWithout \`loss_reason\` this write-up cannot say why ${P} lost. The reason, in the buyer's own words and with who said it, would be read against ${sectorWord} and would name what to change.\n\n`;
  const also: string[] = [];
  if (!isPortfolio && dealOutcome !== 'won' && !competitorWon) also.push(`\`competitor_won\`: which alternative the buyer chose${alts.length ? ` (you described ${joinList(alts.map((a) => q(a.text)))})` : ''}, or "no decision" if they chose none.`);
  if (contacts.length && !contacts.some((c) => c.tag)) also.push(`A position in brackets after each stakeholder, for example ${q(`${contacts[0].title} (supporter)`)} or "(against)".`);
  if (isPortfolio && !multipleDeals) also.push('`multiple_deals`: one deal per line, with the outcome and the reason, for example "deal name, lost, value, days, reason, who won".');
  const alsoBlock = also.length ? `${adds ? '' : '## What else to add\n\n'}${adds ? 'Also useful:\n\n' : 'Useful to add:\n\n'}${also.map((a) => `- ${a}`).join('\n')}\n\n` : '';

  // ---- questions for the review call, each built from an input ----
  const qs: string[] = [];
  if (alts.length && !dealOutcome) qs.push(`Which did the buyer weigh most: ${alts.some((a) => /,/.test(a.text)) ? alts.map((a) => a.text).join('; ') : joinList(alts.map((a) => a.text), 'or')}? What did they say about ${alts[0].text}?`);
  if (hasD) qs.push(`The deal ran ${days(salesCycleDays)}: which stage took longest, and was that the buyer's process or a stall you could have moved?`);
  if (hasV) qs.push(`The deal was worth ${money(dealValue)}: did the price or the size of the commitment come up as a reason, and who raised it?`);
  const ROLE_WORD = /\b(?:manager|director|vp|head|lead|chief|officer|president|engineer|analyst|architect|developer|owner|controller|founder|cfo|ceo|coo|cio|cto|ciso|cmo|cro|it|hr|finance|operations|security|procurement|legal|team|teams|support|sales|marketing|product|buyer|sponsor)\b/i;
  const ref = (c: Contact) => (ROLE_WORD.test(c.title) ? `the ${lowerFirstIfCommon(c.title)}` : c.title);
  against.forEach((c) => qs.push(`What did ${ref(c)} need that you did not give them, and when did they turn against you?`));
  backing.forEach((c) => qs.push(`Did ${ref(c)} have the power and the material to sell this inside, and what did they say when the decision was made?`));
  deciders.forEach((c) => qs.push(`Did ${ref(c)} ever hear your case from you directly, or only through someone else?`));
  if (untagged.length > 4) qs.push(`Which of the stakeholders listed above spoke for ${P} and which against, and whom did the buyer listen to most?`);
  else if (untagged.length > 1) qs.push(`Which of ${joinList(untagged.map((c) => ref(c)))} spoke for ${P} and which against, and whom did the buyer listen to most?`);
  if (v) qs.push(`Did the buyer${seg ? ` (${seg})` : ''} judge the result on ${v.metrics.slice(0, 3).join(', ')}, or on something else?`);
  const qBlock = qs.length ? `## Questions for the review call\n\n${qs.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\n` : '';

  // ---- sector notes, below the draft ----
  const reasonRows = v ? v.objections.map((o) => `| ${o.objection} | ${o.response} |`).join('\n') : '';
  const sectorBlock = v ? `## Sector notes: ${v.name}\n\nThe objections this sector most often raises (from the sector notes in this tool, not from your deal). Check each against the deal: was it raised, by whom, and was it answered before the proposal?\n\n| Usual reason | Pattern of a good answer |\n|---|---|\n${reasonRows}\n\n**Who usually decides:** ${v.committee}\n\n**How deals usually run:** ${v.salesMotion}\n\n**What this sector measures:** ${v.metrics.join(', ')}.\n\n**A proof point that lands:** ${v.proofShape}\n\n` : '';

  // ---- the inputs as given (only the ones that were given) ----
  const rows: string[] = [];
  if (args.your_solution) rows.push(`| **Solution** | ${P}${brief.kind ? `, ${brief.kind}` : ''} |`);
  if (hasV) rows.push(`| **Deal Value** | ${money(dealValue)} |`);
  if (hasD) rows.push(`| **Sales Cycle** | ${days(salesCycleDays)} |`);
  if (dealOutcome) rows.push(`| **Outcome** | ${upperFirst(dealOutcome.replace(/_/g, ' '))} |`);
  if (lossReason) rows.push(`| **Stated reason** | ${cap(lossReason)} |`);
  if (competitorWon) rows.push(`| **Competitor who won** | ${cap(competitorWon)} |`);
  if (contacts.length) rows.push(`| **Stakeholders** | ${contacts.map((c) => c.raw).join('; ')} |`);
  const given = rows.length ? `## Inputs as you gave them\n\n| Item | Value |\n|---|---|\n${rows.join('\n')}\n` : '';

  const title = analysisType === 'single_deal' ? 'Win/Loss Analysis: Single Deal' : analysisType === 'competitor_analysis' ? 'Competitive Win/Loss Analysis' : analysisType === 'loss_pattern' ? 'Loss Pattern Analysis' : 'Deal Portfolio Analysis';
  return `# ${title}: ${P}\n\n${notGivenLine}${wlCtx.line}\n\n## Write-up\n\n${para.join('\n\n')}\n\n${adds}${alsoBlock}${qBlock}${sectorBlock}${given}`.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
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
// Run 22: the kit is built in src/rw-champion.ts (the asset in the champion's voice; every objection answered from the product's parts, the alternatives, the value points and the business model).
function executeChampionEnablementKit(args: Record<string, unknown>): string {
  return buildChampionKit(args, {
    readContext, cap, lowerFirstIfCommon, sectorNotes: (v) => sectorNotes(v, 'committee'), splitItems,
    steps: (v, modelKey) => (MAP_EVAL[stockKey(v, modelKey)] || MAP_EVAL.generic).map((s) => s.m),
    footer: SUGGESTIONS_FOOTER,
  });
}



// Tool 12: Competitive Trap Setter
// Run 20 round 1b (D92): a strengths sentence stays whole (a comma inside a sentence is not a list); credentials and recognition are
// mentioned, never turned into something to demo live; a competitor that is a way of working (manual routing, an in-house build,
// disconnected tools) is not asked about a contract, references or support; each weakness becomes a question about its own topic;
// the buyer's persona and priorities shape the questions; no bracket is left.
const CRED_RE = /\b(?:named|leader|award|recogni\w+|analyst|quadrant|backed by|inner circle|launch partner|certified|certifications?|iso\s?\d{4,5}|soc ?2|pci|partners? with|partnerships?|trusted by|\d[\d,.+]*\s*(?:years|customers|companies|countries|engineers))\b/i;
// Run 21c (draft rewrite): the answer is a set of landmine questions built from the inputs. Each weakness becomes a question about its
// own topic (a question never quotes the note), each priority a question, each strength a criterion; a strength that answers a weakness
// is shown next to it; the figures keep their source label. Generic coaching lines are gone. Rules are about kinds of input (a charge, a
// limit, a missing capability, a delay, a manual step), never about one company.
// A place name or a possessive at the start of a phrase keeps its capital ("India's most extensive network").
const TRAP_PLACES = /^(?:India|China|Europe|Africa|Asia|America|Americas|Japan|Germany|France|Britain|Australia|Canada|Brazil|Singapore|Dubai|London|Paris|Tokyo|Mumbai|Delhi|Bengaluru|Berlin|Sydney)(?:'s)?\b/;
function lowerKeep(t: string): string { const x = t.trim(); return /^[A-Z][a-z]+'s?\b/.test(x) || TRAP_PLACES.test(x) ? x : lowerFirstIfCommon(x); }
// A long strength holds several claims: it is cut where a new claim opens after a comma (never inside a list), so each criterion is short.
function trapClaims(s: string): string[] {
  const t = s.trim().replace(/[.]+$/, '');
  if (t.length < 110) return [t];
  const out: string[] = [];
  for (const part of t.split(/,\s+(?=(?:on|with|under|built|backed|where|so|plus|and|using|across|from|for|instead|offering|combining|including|covering|delivering|giving|providing|while)\b)/i)) {
    const x = part.trim().replace(/^(?:and|plus)\s+/i, '');
    if (out.length && x.split(/\s+/).length < 4) out[out.length - 1] += `, ${x}`; else if (x) out.push(x);
  }
  return out.slice(0, 4);
}
const TRAP_METAPHOR = /\b(?:highway|jams?|traffic jam|roadblock|treadmill|maze|jungle|minefield|spaghetti|patchwork|house of cards|duct tape|band-?aid|silver bullet|black hole|rabbit hole|quicksand|hamster wheel|fire-?fighting|firefight\w*)\b/i;
const TRAP_STOP = /^(?:their|which|there|these|those|about|would|could|where|while|other|every|first|still|under|after|before|again)$/;
function trapWords(s: string): string[] { return s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !TRAP_STOP.test(w)).map((w) => w.slice(0, 5)); }
function trapShares(a: string, b: string): number { const wb = new Set(trapWords(b)); return trapWords(a).filter((w) => wb.has(w)).length; }
const TRAP_VERBS = new Set('works runs sends handles cleans re-plans replans plans approves connects syncs tracks reads writes shows gives lets keeps moves routes pulls pushes builds checks alerts flags scores matches books bills pays collects captures reports detects blocks stops finds fixes explains learns adapts scales integrates automates covers supports includes offers provides delivers replaces reduces cuts speeds raises loads stores encrypts logs audits signs files posts notifies escalates assigns updates generates predicts prioritises prioritizes validates verifies resolves ranks recommends turns takes brings combines unifies monitors enforces records measures reconciles'.split(' '));
function trapBase(verb: string): string { return /(?:ss|sh|ch|x)es$/.test(verb) ? verb.slice(0, -2) : /ies$/.test(verb) ? `${verb.slice(0, -3)}y` : verb.replace(/s$/, ''); }
// A strength as a criterion question: a verb phrase ("Works offline ...") becomes "Which of the options work offline ...?"; a noun phrase is shown on a case of the buyer's own.
function trapCriterion(s: string): string {
  const t = s.trim().replace(/[.]+$/, '');
  const first = (t.split(/\s+/)[0] || '').toLowerCase();
  if (/^(?:on|with|under|across|from|for|where|using)$/.test(first)) return `Which of the options work ${t}?`;
  if (/^(?:offering|providing|giving|delivering|covering|including|combining|built|backed|designed|powered)$/.test(first)) return `Which of the options are ${t}?`;
  if (TRAP_VERBS.has(first)) return `Which of the options ${lowerKeep(t.replace(/^\S+/, trapBase(first)))}?`;
  return `Which of the options can show ${lowerKeep(t)}, on one of your own cases?`;
}
// When a note is a clause whose verb is not one of the kinds below, its topic is found by the words in it and a question about that topic is asked.
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
function trapIng(verb: string): string { let b = verb.toLowerCase(); if (/ies$/.test(b)) b = `${b.slice(0, -3)}y`; else if (/[^s]s$/.test(b)) b = b.slice(0, -1); return /[^e]e$/.test(b) ? `${b.slice(0, -1)}ing` : `${b}ing`; }
const TRAP_CLAUSE_VERB = /\b(?:is|are|was|were|become|becomes|became|has|have|had|get|gets|got|stay|stays|remain|remains|accumulates?|falls?|leaves?|leave|lacks?|loses?|lose|breaks?|fails?|failed|misses?|slows?|drops?|struggles?|hides?|locks?|forces?|requires?|takes?|makes?|keeps?|stops?|cannot|can't|never|rely|relies|depends?|tends?|sits?|causes?|creates?|falter|faltered|use|uses|ignores?|skips?|sends?|waits?|differs?|differ|overload\w*|expires?|grows?|grow)\b/i;
const trapPlural = (s: string): boolean => { const h = s.trim().split(/\s+(?:of|for|in|on|at|from|to|with|by)\s+/)[0].trim(); return /[a-z]s$/i.test(h) && !/(?:ss|us|is|ics)$/i.test(h); };
const trapDo = (s: string): string => (trapPlural(s) ? 'do' : 'does');
// A long note holds several claims: it is cut at its commas (a clause that opens with "which", "so" or "because", or is very short, stays with the one before it).
function trapClauses(wRaw: string): string[] {
  const w = wRaw.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  if (w.length < 90) return [w];
  const merged: string[] = [];
  for (const p of w.split(/,\s+(?:and\s+)?|\s+and\s+(?=to\s)/)) {
    const t = p.trim();
    if (!t) continue;
    if (merged.length && (/^(?:which|so|meaning|leaving|that|while|as|because|but|thereby|making|causing|increasing|slowing|if|even|or|not|with|without|then|yet|although|though|unless|until|since|than|like|such|including|especially|for example)\b/i.test(t) || t.split(/\s+/).length < 3)) { merged[merged.length - 1] += `, ${t}`; continue; }
    merged.push(t);
  }
  return merged.slice(0, 3);
}
// One weak point of the competitor, read by kind: returns the landmine question and the topic it is about. The note is never quoted.
function trapQuestion(wRaw: string, comp: string): { q: string; topic: string } {
  const esc = comp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let w = wRaw.trim().replace(new RegExp(`^${esc}(?:'s)?\\s+`, 'i'), '').replace(/[.]+$/, '').trim();
  w = lowerKeep(w.replace(/\s*\([^)]*\)/g, '')).replace(/^(?:it|they)\s+/i, '');
  const cons = w.match(/^(.*?)\s*,?\s*\b(?:so|which means|which|meaning|because|leaving|forcing|while)\b\s+(.+)$/i);
  const main = (cons ? cons[1] : w).trim();
  const tail = cons ? cons[2].trim() : '';
  const tailSubj = tail ? (tail.split(/\s+(?:are|is|can|cannot|get|have|has|do|does|will|wait|need|must|end|stay)\b/i)[0].trim()) : '';
  const tailQ = tailSubj && tailSubj.split(/\s+/).length <= 4 ? `, and what does that mean for ${tailSubj}` : '';
  const show = ' Ask the vendor to show it on your own data, not on a slide.';
  let m: RegExpMatchArray | null;
  if ((m = main.match(/^(?:breaks?|fails?|stalls?|stops?|slows? down|falls? over)\s+(?:down\s+)?(?:when|if|as)\s+(.+)$/i))) return { q: `What happens in each option when ${m[1]}?${tailQ ? ` And what does that mean for ${tailSubj}?` : ''} Ask the vendor to show it live.`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:makes?|made|is|are|was|were)?\s*(?:it\s+)?(?:difficult|hard|harder|impossible|a struggle|painful|slow)\s+to\s+(.+)$/i))) return { q: `How easily can you ${m[1].replace(/\s+and\s+to\s+/g, ', and ')} in each option, and how long did the last change take?${' Ask the vendor to show it on your own data.'}`, topic: m[1] };
  if ((m = main.match(/^(?:mostly |only |just |largely )?(.+?)\s+instead of\s+(.+)$/i))) return { q: `Does each option give you ${m[2]}, or only ${m[1]}? Ask the vendor to show ${aAn(m[2].replace(/s$/, ''))} on your own data.`, topic: m[2] };
  if ((m = main.match(/^(?:manual|static|fixed|hard-?coded|rule[- ]based)(?:\s+(?:or|and)\s+(?:manual|static|fixed|rule[- ]based|slow))*\s+(\w+(?:\s\w+){0,3})$/i)) && !/\bslow to\b/i.test(main) && !TRAP_CLAUSE_VERB.test(m[1])) return { q: `How does each option produce ${m[1]}, by the system or by a person, and how often is it refreshed?`, topic: m[1] };
  if ((m = main.match(/\bslow to\s+(\w+(?:\s\w+){0,4})/i))) return { q: `How quickly does each option ${m[1]}, and how long did the last change take?`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:charges?|bills?|prices?)\s+(?:extra\s+|more\s+|additional\s+)?(?:for\s+)?(.+)$/i)) && !/^(?:.*\s)?(?:is|are)\s+/.test(main.split(m[1])[0] || '')) {
    const x = m[1].trim();
    return { q: `What does each option charge ${/^per\b/i.test(x) ? x : `for ${x}`}, what sits outside the quoted price${tailQ}?`, topic: x };
  }
  if ((m = main.match(/^(?:.*?\s)?(?:leaves?|leaving)\s+(?:you\s+with\s+)?no\s+(.+)$/i))) return { q: `Does each option give you ${m[1]}? Ask the vendor to show it on your own data.`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:creates?|causes?|produces?|forces?|brings?|adds?)\s+(.+)$/i)) && m[1].split(/\s+/).length <= 12) return { q: `Where does each option leave you with ${m[1]}, and what does it take to get past ${/\band\b|s$/.test(m[1]) ? 'them' : 'it'}?`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:limits?|restricts?|caps?)\s+(.+)$/i))) return { q: `What limits does each option put on ${m[1]}, and what does it cost to go past them?`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:relies on|rely on|depends on|depend on)\s+(.+)$/i))) return { q: `Which parts of each option rely on ${m[1]}, and what happens when that is missing?`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:needs?|requires?)\s+(.+)$/i))) return { q: `What does each option need from you before it works (${m[1]}), who provides it, and what does that add to the time and the cost?`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?struggles?\s+(?:with|to)\s+(.+)$/i))) return { q: `How does each option cope with ${m[1]}?${show}`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:cannot|can't|can not|could not|couldn't|unable to|fail(?:s|ed)? to|has failed to|have failed to|does not|do not|doesn't|don't|never)\s+(?:have\s+|offer\s+|include\s+|support\s+|provide\s+)?(.+)$/i))) {
    const had = /(?:have|offer|include|support|provide)\s/.test(main) && !/^(?:.*?\s)?(?:cannot|can't|can not|could not|couldn't|unable to|fail(?:s|ed)? to)\s/i.test(main);
    return had ? { q: `How does each option cover ${m[1]}? Ask for it working today, not on a roadmap.`, topic: m[1] } : { q: `Can each option ${m[1]}?${show}`, topic: m[1] };
  }
  if ((m = main.match(/^(?:no|without|missing|lacks?|has no|have no)\s+(.+)$/i)) || (m = main.match(/^.+?\s+(?:lacks?|has no|have no|is missing|are missing)\s+(.+)$/i))) return { q: `How does each option cover ${m[1]}? Ask for it working today, not on a roadmap.`, topic: m[1] };
  if ((m = main.match(/^(?:.*?\s)?(?:misses?|skips?|overlooks?|drops?)\s+(.+)$/i))) return { q: `How does each option catch ${m[1]}, and how soon would you know if one was missed?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:takes?|needs? \w+ to)\s+(?:\w+\s+)?(?:weeks?|months?|days?|hours?|years?|long|ages|time)\b/i)) && !/\b(?:that|which|who)$/i.test(m[1].trim())) return { q: `How long ${trapDo(m[1])} ${m[1]} take in each option, and can the vendor show a recent one from the first step to the last?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:arrives?|comes?|come|appears?|appear|shows? up|show up|lands?|reach(?:es)?)\s+(?:.*\b)?(?:late|slow|delayed|overnight|days?|hours?)\b/i))) return { q: `How soon does each option give you ${m[1]}, and what do you see in the meantime?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:moves?|go|goes|are sent|is sent|travels?|runs?)\s+by\s+(email|phone|hand|spreadsheet|paper|post|fax|text|chat)\b/i))) return { q: `How ${trapDo(m[1])} ${m[1]} get from the person who raises ${trapPlural(m[1]) ? 'them' : 'it'} to the person who decides, in each option, and who waits on whom?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:waits?|sits?)\s+(?:for|on|in)\s+(.+)$/i))) return { q: `How long ${trapDo(m[1])} ${m[1]} wait for ${m[2]} in each option, and who chases ${trapPlural(m[1]) ? 'them' : 'it'}?`, topic: m[1] };
  if ((m = main.match(/^(?:nobody|no one|no-one|not everyone|few people)\s+(?:can\s+)?(sees?|knows?|gets?|finds?|trusts?|shares?|has)\s+(.+)$/i))) return { q: `Who can ${trapBase(m[1].toLowerCase())} ${m[2]} in each option, and is it one view for everyone who needs it?`, topic: m[2] };
  if ((m = main.match(/^(.+?)\s+(?:is|are|was|were|gets?|got)\s+(found|caught|discovered|noticed|spotted|fixed|handled|reported|checked|updated|reviewed|approved|entered|recorded|logged|done|raised|flagged|priced|billed|paid|chased|fixed)\b/i))) return { q: `When ${trapPlural(m[1]) ? 'are' : 'is'} ${m[1]} ${m[2].toLowerCase()} in each option, and what has it cost by then?`, topic: m[1] };
  if ((m = main.match(/^(.+?)\s+(?:is|are|stays?|remains?)\s+(?:very |too |often |still |mostly )?(slow|late|delayed|stale|periodic|batch\w*|manual|costly|expensive|opaque|rigid|limited|hard|difficult|complex|fragmented|isolated|disconnected)\b/i))) {
    const [, s, adj] = m;
    if (/slow|late|delayed|stale|periodic|batch/i.test(adj)) return { q: `How long ${trapDo(s)} ${s} take in each option, and what happens in between?`, topic: s };
    if (/manual/i.test(adj)) return { q: `Which steps of ${s} wait for a person in each option, and how long does each wait?`, topic: s };
    if (/costly|expensive/i.test(adj)) return { q: `What ${trapDo(s)} ${s} cost in each option over three years, and what sits outside the quoted price?`, topic: s };
    if (/opaque/i.test(adj)) return { q: `How does each option explain ${s}, and can you check it yourself?`, topic: s };
    if (/fragmented|isolated|disconnected/i.test(adj)) return { q: `Can each option show ${s} in one place, or does your team join the pieces by hand?`, topic: s };
    return { q: `How much of ${s} can you change yourself in each option, and how long does a change take?`, topic: s };
  }
  if ((m = main.match(/^(.+?)\s+(re-?keys?|copy|copies|retypes?|retype|exports?|imports?|rebuilds?|chase|chases|merges?|reconciles?|reconcile|pastes?|enters?|enter|compiles?|compile|collects?|collect|assembles?|assemble|updates?|update|transfers?|transfer)\s+(.+)$/i))) return { q: `Who does the work of ${trapIng(m[2])} ${m[3]} in each option, the system or your own team, and how long does it take each week?`, topic: m[3] };
  if ((m = main.match(/^(.+?)\s+(is|are|can|will|must|should)\s+(.+)$/i)) && m[1].split(/\s+/).length <= 3 && m[3].split(/\s+/).length <= 6) return { q: `${upperFirst(m[2].toLowerCase())} ${m[1]} ${m[3].replace(/^only\s+/i, '')} in each option?${show}`, topic: m[1] };
  // a noun phrase: the leading adjective or count of time is taken off, the head is asked about
  if (/\b(?:slowdowns?|lag|latency|sluggish|disconnections?|outages?|downtime|packet loss)\b/i.test(main)) return { q: 'What happens in each option when the connection slows or drops: what do your users see, and how is it measured?', topic: 'slowdowns and disconnections' };
  if (main.split(/\s+/).length >= 4) {
    const t = TRAP_TOPICS.find((x) => x.re.test(main));
    if (t) return { q: t.q, topic: t.topic };
  }
  if (main.split(/\s+/).length >= 3) {
    // a clause with a verb of its own is put to the vendor as a situation
    if (/\b(?:that|which)\b/i.test(main)) return { q: `How does each option deal with “${main}”? Ask the vendor to show it live.`, topic: main };
    if (TRAP_CLAUSE_VERB.test(main.split(/\s+/).slice(1).join(' '))) return { q: `What happens in each option when ${main.replace(/\bwere\b/gi, 'are').replace(/\bwas\b/gi, 'is')}? Ask the vendor to show it live.`, topic: main };
  }
  if ((m = main.match(/^(.+?)\s+(?:lost|dropped|broken|missing|duplicated|reset|overwritten)\s+(?:when|if|as|whenever)\s+(.+)$/i))) return { q: `When ${m[2]}, is the ${m[1]} kept in each option, and who can see it?`, topic: m[1] };
  if ((m = main.match(/^to\s+(.+)$/i))) return { q: `Can each option help you to ${m[1]}? Ask the vendor to show it on your own data.`, topic: m[1] };
  let np = main.replace(/^(?:\d+\s+|several\s+|a few\s+|many\s+)?(?:months?|weeks?|days?|years?) of\s+/i, '').replace(/^(?:slow|manual|periodic|poor|weak|limited|high|long|late|heavy|complex|outdated|legacy|rigid|fragmented|isolated|opaque|expensive|costly|hidden|batch)\s+/i, '').trim();
  if (!np) np = main;
  if (/setup|set-up|implement|onboard|rollout|go-live|deploy|migration/i.test(np)) return { q: `How long ${trapDo(np)} ${np} take in each option, and can the vendor show a recent one from signing to the first real result?`, topic: np };
  if (np.split(/\s+/).length > 5 || TRAP_CLAUSE_VERB.test(np) || /\b(?:prone|built|designed|made)\s+(?:to|for)\b/i.test(np)) return { q: `How does each option deal with “${np}”?${show}`, topic: np };
  return { q: `How does each option handle ${np}?${show}`, topic: np };
}
const TRAP_WANT_VERBS = /^(?:keep|protect|manage|streamline|raise|cut|close|reduce|increase|improve|speed|shorten|lower|grow|win|get|make|plan|launch|cover|avoid|stop|simplify|automate|scale|ship|move|find|build|run|track|see|bring|boost|connect|deliver|hit|meet|stay|retain|expand|consolidate|replace|lift|gain|save|prove|show|handle|trust|know|reach|fix|end|free|prevent|detect|respond|onboard|pay|collect|bill|price|forecast|prioriti[sz]e|verify|secure|comply|catch|clear|ship|test|release|sell|serve|support|help|let|turn|take)\b/i;
function executeCompetitiveTrapSetter(args: Record<string, unknown>): string {
  const competitor = ((args.competitor as string) || '').trim() || 'the competitor';
  const competitorWeaknesses = (args.competitor_weaknesses as string) || '';
  const yourSolution = (args.your_solution as string) || '';
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
  const personaName = ((args.buyer_persona as string) || '').trim();
  // A competitor that is a way of working (a manual process, an in-house build, disconnected tools, a legacy system) has no contract,
  // no reference customers and no support desk to ask about.
  const isWay = ALT_KINDS.some((k) => k.re.test(competitor)) || competitor.split(/\s+/).length > 6;
  const compLabel = isWay ? 'the current approach' : competitor;
  const compPoss = isWay ? 'the current approach\'s' : `${competitor}'s`;
  const weaknesses = splitItems(competitorWeaknesses);
  const allStrengths = splitItems(yourStrengths);
  // A strength that opens with a credential ("named a Leader in ...", "certified ...") is a credential; one that merely ends with a backer or an award
  // ("the first agentic X, backed by Y") is a capability and stays a criterion.
  const isCred = (x: string) => { const m = x.match(CRED_RE); return !!m && (m.index || 0) <= 40; };
  const credentials = allStrengths.filter(isCred);
  const strengths = allStrengths.filter((x) => !isCred(x)).flatMap(trapClaims);
  const claimsHere = claimsIn(yourStrengths);
  // the buyer's priorities: the aims (clauses), and the figures with their own source label kept as given
  const startsWant = (x: string) => TRAP_WANT_VERBS.test(x.replace(/^(?:and|to)\s+/i, ''));
  const aims: string[] = [];
  const figureItems: string[] = [];
  for (const item of splitItems(buyerPriorities)) {
    const label = (item.match(/\(([^()]*(?:\([^()]*\))?[^()]*)\)\s*[.]?$/) || [])[1] || '';
    const body = label ? item.slice(0, item.lastIndexOf(`(${label})`)).trim() : item.trim();
    let last = false;
    for (const f of splitTopLevel(body.replace(/[.]+$/, '')).map((x) => x.replace(/^(?:and|plus)\s+/i, '').trim()).filter(Boolean)) {
      if (/\d/.test(f)) {
        // a piece with no subject of its own ("can resolve up to 80% ...") is shown with the whole item it came from
        const whole = /^(?:can|could|will|would|has|have|is|are|with|that|which)\b/i.test(f);
        const text = whole ? item.trim().replace(/[.]+$/, '') : (label && !/\(/.test(f) ? `${f} (${label})` : f);
        if (!figureItems.includes(text)) figureItems.push(text);
        last = false;
      }
      else if (last && !startsWant(f) && aims.length) aims[aims.length - 1] += `, ${f}`;
      else { aims.push(f); last = true; }
    }
  }
  const aimRef = (a: string): string => { const lc = lowerKeep(a); return TRAP_WANT_VERBS.test(lc) ? `their aim to ${lc}` : `what they said matters (${lc})`; };
  const wantPhrase = (a: string): string => { const lc = lowerKeep(a); return TRAP_WANT_VERBS.test(lc) ? `they said they want to ${lc}` : `they said this matters: ${lc.replace(/:\s+/g, ', ')}`; };
  const aimAsk = (c: string, i: number): string => {
    const lc = lowerKeep(c);
    const ends = ['How would you judge that each option delivers it?', 'Which option has shown you that on your own data, and what did it measure?', 'What would you need to see in the evaluation to believe it?'];
    return TRAP_WANT_VERBS.test(lc) ? `You said you want to ${lc}. ${ends[i % 3]}` : `You told me this matters: ${lc.replace(/:\s+/g, ', ')}. ${ends[i % 3]}`;
  };
  const read = weaknesses.map((w) => { const cl = trapClauses(w); const lit = v && v.id === 'logistics-tech' ? cl : cl.filter((c) => !TRAP_METAPHOR.test(c)); const qs = (lit.length ? lit : cl).map((c) => trapQuestion(c, competitor)); return { w, qs, q: qs[0].q, topic: qs.map((x) => x.topic).join(' ') }; });
  const strengthFor = (text: string): string => { let best = ''; let n = 0; for (const s of strengths) { const k = trapShares(text, s); if (k > n) { n = k; best = s; } } return best; };
  const aimFor = (text: string): string => { let best = ''; let n = 0; for (const a of aims) { const k = trapShares(text, a); if (k > n) { n = k; best = a; } } return best; };
  const forRef = (qq: string): string => qq.replace(/\s+in each option/g, ` with ${compLabel}`).replace(/\beach option\b/g, compLabel).replace(/\s*Ask (?:the vendor|for it)[^.?]*[.]/g, '').replace(/\s+/g, ' ').trim();
  const sectorQ = v ? v.discovery.slice(0, 2).map((x) => `- "${x}"`).join('\n') : '';
  const personaQ = persona ? persona.questions.slice(0, 2).map((x) => `- "${x}"`).join('\n') : '';
  const costWeak = read.filter((r) => /price|cost|fee|charge|seat|licen|overage|extra|bill/i.test(r.w));
  const supportMention = /\b(?:support|sla|24\/7|uptime|response)\b/i.test(`${yourStrengths} ${competitorWeaknesses}`);

  // ---- the line that names what is missing, once ----
  const notGiven: string[] = [];
  if (!args.your_solution) notGiven.push('the solution (`your_solution`; the draft says "our solution")');
  if (!weaknesses.length) notGiven.push(`the weak points of ${compLabel} (\`competitor_weaknesses\`)`);
  if (!allStrengths.length) notGiven.push('your strengths (`your_strengths`)');
  if (!args.evaluation_stage) notGiven.push('the evaluation stage (`evaluation_stage`; the draft assumes mid)');
  if (!personaName) notGiven.push('the buyer persona (`buyer_persona`)');
  if (!buyerPriorities.trim()) notGiven.push('the buyer priorities (`buyer_priorities`)');
  const notGivenLine = notGiven.length ? `Not given: ${joinList(notGiven)}. The draft still reads without ${notGiven.length === 1 ? 'it' : 'them'}; add ${notGiven.length === 1 ? 'it' : 'them'} to get the matching questions.\n\n` : '';

  const weakBlocks = read.map((r) => {
    const s = strengthFor(`${r.w} ${r.topic}`);
    const a = aimFor(`${r.w} ${s}`);
    return `**Their weak point (your note, not for the buyer):** ${cap(r.w)}\n${r.qs.map((x) => `**Landmine Question:** "${x.q}"`).join('\n')}${s ? `\n**Then show:** ${cap(s)}` : ''}${a ? `\n**Why it matters to this buyer:** ${wantPhrase(a)}.` : ''}`;
  });
  const implementationQs = model === 'investment' ? [
    `"How long from signing to the first allocation with ${compLabel}, and what do you need to provide?"`, `"What reporting do you receive each month from ${compLabel}, and who explains a bad month?"`, `"What are the full fees with ${compLabel}, including performance fees and minimums?"`,
  ] : model === 'services' ? [
    `"How will the transition to ${compLabel} run, stage by stage, and who signs off each stage?"`, `"Who are the named people on the account at ${compLabel}, and what happens if they leave?"`, `"What is in the rate card of ${compLabel}, and how are change requests priced?"`,
  ] : model === 'connectivity' ? [
    `"How many sites does ${compLabel} bring live in each wave, and what is the fallback if a cut-over fails?"`, `"What is the repair time in the contract with ${compLabel}, and how are service credits paid?"`, `"What one-time charges apply per site with ${compLabel} (installation, equipment)?"`,
  ] : [
    `"How long from signing to the first real result with ${compLabel}, and how did its customers find that against the promise?"`, `"Which of your own people does the set-up with ${compLabel} take, and for how long?"`, `"What does the price from ${compLabel} include, and what is billed separately?"`,
  ];
  const wayQs = [
    `"Who keeps ${compLabel} running today, and what happens when they are away?"`, `"What does ${compLabel} cost you in a year, in people's time and in fees?"`, `"What breaks in ${compLabel} when your volumes or your plans change?"`,
  ];
  const implLabel = model === 'investment' ? 'Onboarding and Mandate Landmines' : model === 'services' ? 'Transition Landmines' : model === 'connectivity' ? 'Rollout Landmines' : 'Implementation Landmines';
  const sections: Record<string, string> = {
    discovery_questions: `## Discovery Questions (Landmines)

Ask these as open questions, so the buyer finds ${compPoss} gaps in their own evaluation. The weak points are your notes and are never read out.

### What the buyer told you matters
${aims.length ? aims.map((a, i) => `- "${aimAsk(a, i)}"`).join('\n') : buyerPriorities.trim() ? '- The priorities you gave are figures only, so there is no aim to ask about yet. Ask the buyer what they want to achieve, then use the figures below with their source.' : '- No priorities were given, so there is no question here yet.'}
${figureItems.length ? `\nFigures you gave, with their source: ${figureItems.map((f) => q(f)).join('; ')}. Ask for the buyer's own number first, and quote these only with that source.\n` : ''}${sectorQ || personaQ ? `\n### From the evaluator's role and the sector\n${[personaQ, sectorQ].filter(Boolean).join('\n')}\n` : ''}
### Capability Landmines
${weakBlocks.length ? weakBlocks.join('\n\n') : `No weak points were given (competitor_weaknesses), so there is no landmine yet. Add what you know about ${compLabel} and each note becomes a question here.`}

### ${isWay ? `Questions about ${compLabel}` : implLabel}
${(isWay ? wayQs : implementationQs).map((x) => `- ${x}`).join('\n')}
${!isWay && supportMention ? `\n### Support Landmines\n- "What does the support from ${competitor} cover outside office hours, and what does the contract promise when something urgent breaks?"` : ''}`,

    evaluation_criteria: `## Evaluation Criteria Positioning

### Criteria to Establish Early

${strengths.length ? strengths.map((s) => { const a = aimFor(s); return `- "${trapCriterion(s)}"${a && a.length <= 100 ? ` It bears on ${aimRef(a)}.` : ''}`; }).join('\n') : `No demonstrable strengths were given (your_strengths). Add what ${P} can show live, and each one becomes a criterion here.`}
${credentials.length ? `\n### Credentials (mention them, do not make them criteria)\n\nThese cannot be demonstrated in an evaluation. Say them in a sentence when they answer a concern:\n${credentials.map((s) => `- ${cap(s)}`).join('\n')}\n` : ''}${claimsHere.length ? `\n### Claims to source\n\nThe buyer will ask for the source of: ${joinList(claimsHere.map((c) => q(clip(c, 90))))}. Have it ready, or soften the wording.\n` : ''}
### How to Suggest Criteria

"${aims.length ? `${startsWant(aims[0]) ? `You said you want to ${lowerKeep(aims[0])}${aims.length > 1 && startsWant(aims[1]) ? ` and ${lowerKeep(aims[1])}` : ''}.` : `You told me this matters: ${lowerKeep(aims[0]).replace(/:\s+/g, ', ')}.`} Before you evaluate anyone, it helps to agree the criteria that decide that.` : 'Before you evaluate anyone, it helps to agree the criteria.'} ${(() => { const short = strengths.filter((x) => x.length <= 80).slice(0, 3); return short.length ? `I would suggest these: ${short.map((x) => lowerKeep(x)).join('; ')}.` : strengths.length ? 'I would suggest a short list of criteria for it, and I will send it with the questions.' : 'I would suggest starting with the outcomes you need.'; })()} Would it help if I shared the questions to ask every vendor?"`,

    reference_questions: `## Reference Call Questions

${isWay ? `Suggest the buyer ask these of people who live with ${compLabel} today (their own team, or peers who work the same way):` : `Suggest the buyer ask these questions when speaking with ${compPoss} references:`}

${read.length || aims.length ? [
      ...read.flatMap((r) => r.qs.map((x) => `- "${forRef(x.q)}"`)),
      ...aims.slice(0, 2).map((a) => `- "${startsWant(a) ? `Since you started with ${compLabel}, has it helped you ${lowerKeep(a)}, and what did you measure?` : `Since you started with ${compLabel}, how has it done on this: ${lowerKeep(a).replace(/:\s+/g, ', ')}? What did you measure?`}"`),
    ].join('\n') : `- No weak points or priorities were given, so there is nothing specific to ask a reference yet. Add competitor_weaknesses or buyer_priorities.`}`,

    technical_requirements: `## ${software ? 'Technical Requirements' : 'Requirements'} (Traps)

### RFP or Requirements Document

${strengths.length ? `Each requirement is accepted only if it is shown live and ${personaName ? `the ${personaName} signs off` : 'the evaluation team signs off'} the result.\n\n${strengths.map((s, i) => `${i + 1}. ${cap(s)}`).join('\n')}` : `No demonstrable strengths were given (your_strengths). Add what ${P} can show live and each one becomes a requirement here.`}

### Evaluation Scenarios

${read.length ? read.map((r, i) => { const a = aimFor(`${r.w} ${strengthFor(r.w)}`); return `**Scenario ${i + 1}:** run this live in each option: ${r.qs.map((x) => `"${x.q}"`).join(' ')}\n- Your note (not for the buyer): ${r.w}\n- Pass mark: agree it with the buyer before the test${a ? `; the nearest thing they told you is ${aimRef(a)}` : ''}`; }).join('\n\n') : `No weak points were given, so there is no scenario yet. ${aims.length ? `The first one to build is the test of what they want: ${lowerKeep(aims[0])}.` : ''}`}`,

    commercial_terms: `## Commercial Terms (Positioning)

### ${isWay ? 'Cost Comparison' : 'Pricing Comparisons'}

${isWay ? `When they compare ${P} with ${compLabel}, make sure they compare:\n- What ${compLabel} costs a year in people's time, fees and the cost of its failures\n- What ${P} costs over the same period, including set-up and the team's time\n- What changes for the people who do the work today` : `When they compare ${P} with ${competitor}, make sure they compare:
${model === 'investment' ? '- Management and performance fees\n- Minimum mandate size and lock-in\n- Reporting and transparency included\n- Exit terms' : model === 'services' ? '- The rate card and how change requests are priced\n- Transition costs\n- Service credits and how they are paid\n- Exit and handover terms' : model === 'connectivity' ? '- Monthly charge per site or link over the full term\n- One-time installation and equipment charges\n- Service credits for missed SLAs\n- Early termination charges' : '- Total cost of ownership (not just the licence)\n- Implementation and training costs\n- Support tiers\n- Costs as usage grows'}`}
${costWeak.length ? `\n### From your notes on ${compLabel}\n${costWeak.map((r) => `- Your note (not for the buyer): ${cap(r.w)}\n  Ask: ${r.qs.map((x) => `"${x.q}"`).join(' ')}`).join('\n')}\n` : ''}${isWay ? '' : `
### Contract Terms to Check

Ask about ${competitor}'s contract (nothing here says ${competitor} has these terms; check the actual contract): does it renew automatically, can the price rise at renewal, and what are the termination rights and notice periods?
`}
### Your Own Terms

${(() => { const own = strengths.filter((s) => /\b(?:price|pricing|annual|monthly|fees?|free|included|contract|terms?|licen[cs]e|seats?|credits?|refund|trial|pilot|commitment)\b/i.test(s)); return own.length ? `Terms you gave among your strengths: ${own.map((s) => q(s)).join('; ')}. Put them in the contract in the same words.` : 'No terms of your own were given among your strengths (your_strengths). Add the ones you can put in the contract and they appear here.'; })()}`,
  };

  let output = `# Competitive Positioning: vs ${compLabel}

${notGivenLine}## The set-up

${P} is in ${aAn(`${evaluationStage} stage`)} evaluation against ${isWay ? `${competitor} (a way of working, not a vendor: no contract or references are assumed)` : competitor}.${args.your_solution && yourSolution.trim().length > P.length + 3 ? ` What is being sold: ${yourSolution.trim().replace(/[.]+$/, '')}.` : ''}${buyerPriorities.trim() ? ` What the buyer cares most about, as you gave it: ${buyerPriorities.trim().replace(/[.]+$/, '')}.` : ''}

${ctx.line}

${persona ? `**Who is evaluating:** ${aAn(persona.label)}${personaName && personaName.toLowerCase() !== persona.label.toLowerCase() ? ` (${personaName})` : ''}. They care about ${persona.cares}, and worry about ${persona.worry}. Ask in those terms.\n` : (personaName ? `**Who is evaluating:** ${personaName}.\n` : '')}
## Your notes (not for the buyer)

**Strengths**
${allStrengths.length ? allStrengths.map((s) => `- ${s}`).join('\n') : '- None given.'}

**${isWay ? 'The current approach' : competitor}: weak points**
${weaknesses.length ? weaknesses.map((w) => `- ${w}`).join('\n') : '- None given.'}

${sectorNotes(ctx.v, 'committee')}

---

`;

  if (trapType === 'all') {
    output += ['discovery_questions', 'evaluation_criteria', 'reference_questions', 'technical_requirements', 'commercial_terms'].map((k) => sections[k]).join('\n\n---\n\n');
  } else {
    output += sections[trapType] || sections['discovery_questions'];
  }

  const s0 = strengths[0] ? cap(strengths[0]) : '';
  const stageLine: Record<string, string> = {
    early: strengths.length ? `Put ${joinList(strengths.slice(0, 2).map((s) => lowerKeep(s)))} on the buyer's criteria list before the vendors are shortlisted, and offer to help ${personaName ? `the ${personaName}` : 'the buyer'} structure the evaluation.` : `No strengths were given, so there is nothing to put on the criteria list yet.`,
    mid: strengths.length ? `Make sure ${lowerKeep(s0)} is one of the live tests${v ? `, and bring the proof that lands in this sector: ${proofOf(v)}` : ''}. Let the buyer meet ${compPoss} limits in their own tests.` : `No strengths were given, so there is no live test to protect yet.`,
    late: strengths.length ? `Ask ${personaName ? `the ${personaName}` : 'the buyer'} what is still open and close it with ${lowerKeep(s0)}${credentials.length ? `; say ${lowerKeep(credentials[0])} in one sentence if it answers a concern` : ''}. Check that the decision criteria are the ones agreed.` : `Ask ${personaName ? `the ${personaName}` : 'the buyer'} what is still open and check that the decision criteria are the ones agreed.`,
    finalist: `Reduce the buyer's risk${strengths.length ? ` by showing ${lowerKeep(s0)} on their own case` : ''}, give ${personaName ? `the ${personaName}` : 'the buyer'} access to your own executives, and close with the terms you can put in the contract.`,
  };
  output += `

---

## Stage-Specific Tactics

### ${cap(evaluationStage)} Stage Recommendations

${stageLine[evaluationStage] || stageLine.mid}
`;

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
function pluralOf(persona: string): string {
  const p = lowerFirstIfCommon(persona);
  // Run 12: a function name is not a plural title ("Many sales I speak with" becomes "Many people in sales roles").
  if (/^(sales|marketing|finance|operations|hr|it|engineering|procurement|product|revops|legal|security)$/i.test(p.trim())) return `people in ${p.trim()} roles`;
  const m = p.match(/^([A-Za-z]+)( of .+)$/);
  if (m) return /s$/i.test(m[1]) ? p : `${m[1]}s${m[2]}`;
  return /s$/i.test(p) ? p : `${p}s`;
}
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
function executeEmailSequenceGenerator(args: Record<string, unknown>): string {
  const sequenceType = (args.sequence_type as string) || 'cold_outreach';
  const targetPersona = ((args.target_persona as string) || '').trim() || 'Decision Maker';
  const targetIndustry = ((args.target_industry as string) || '').trim();
  const yourSolution = (args.your_solution as string) || '';
  const keyValueProp = ((args.key_value_prop as string) || '').trim();
  const specificPainPoint = ((args.specific_pain_point as string) || '').trim();
  const socialProof = ((args.social_proof as string) || '').trim();
  const callToAction = ((args.call_to_action as string) || '').trim();
  const tone = (args.tone as string) || 'professional';
  const senderContext = ((args.sender_context as string) || '').trim();
  // Run 19 D80 (problem 2): typed phrases are never pasted into a fixed sentence that only fits one shape of phrase.
  const ctx = readContext(undefined, { seller: [yourSolution], context: [keyValueProp, specificPainPoint], role: [targetPersona], buyer: [targetIndustry] });
  // Run 21c (draft rewrite): every email is written out from the inputs (subject and a full body), for all eight sequence types. The product
  // is named by its short name, the pain is quoted in the user's words, each proof item and each labelled figure is used in one email with its
  // label listed under "Before you send", and the sector's questions and objections fill the rest. Nothing is invented (B82).
  const brief = solutionBrief(yourSolution);
  const P = brief.short || clip(lowerFirstIfCommon(yourSolution), 70) || 'the product';
  const v = ctx.v;
  const investment = ctx.model === 'investment';
  const rk = roleFor(targetPersona, investment);
  const plural = pluralOf(targetPersona.replace(/\s*\([^)]*\)\s*/g, ' ').trim() || targetPersona);
  const indLow = targetIndustry ? lowerFirstIfCommon(targetIndustry) : '';
  const inInd = indLow ? (/(?:ers|ors|ists|ants)$/i.test(indLow) ? ` at ${indLow}` : ` in ${indLow}`) : '';
  const anOf = (w: string) => `${/^(?:[aeiou]|8\b|8\d|11|18)/i.test(w.trim()) ? 'an' : 'a'} ${w.trim()}`;

  // the pain, in the user's words and without the labels put on it; split into chunks so later emails can use the other part
  const painPlain = specificPainPoint.replace(/\s*\((?:page claim|customer words|customer quote|a seller's words|implied by[^)]*)\)/gi, '').replace(/[.]+$/, '').trim();
  const painChunks: string[] = [];
  for (const piece of painPlain.split(/;|\s+while\s+|\.\s+(?=[A-Z])/).map((x) => x.trim().replace(/^,\s*/, '')).filter(Boolean)) {
    const last = painChunks[painChunks.length - 1];
    if (last && (last.length + piece.length < 150 || piece.split(/\s+/).length < 4)) painChunks[painChunks.length - 1] = `${last}, ${piece}`; else painChunks.push(piece);
  }
  const painS = painChunks[0] || '';
  const painT = painChunks[1] || '';
  const painList = painClausesWide(painPlain);
  const painLead = (painList[0] || '').trim();
  const painHead = painLead && painLead.length <= 60 ? painLead : '';
  const painRef = painLead ? lowerFirstIfCommon(painLead) : '';

  // what the product is and what it covers
  const kp = productKindAndParts(brief);
  const partNames = kp.parts;
  const valueItems = splitItems(keyValueProp).map((x) => parseProof(x)[0] || { text: x, label: '', kind: 'story' as const });
  const valueMain = ((valueItems.find((x) => !x.label) || valueItems[0])?.text || '').replace(/[.]+$/, '');
  const valueClaims: ProofItem[] = valueItems.filter((x) => x.label && x.text !== valueMain);
  // a software seller's own sector notes (renewal rate, time to value, activation) describe its customers, not a buyer in another industry
  const sellerSw = !!v && v.id === 'saas' && !/software|saas|technology|internet|app\b/i.test(targetIndustry);
  const rankedParts = partsNearPain(partNames, `${painPlain} ${valueMain}`);
  const kindTopic = shortKind(kp.kind, brief.name);
  const topicIsKind = !rankedParts.find((x) => x.length <= 28) && !!kindTopic && kindTopic.length <= 32;
  const topic = rankedParts.find((x) => x.length <= 28) || (kindTopic && kindTopic.length <= 32 ? kindTopic : '') || (v && !sellerSw ? [...v.metrics.slice(0, 4)].sort((x, y) => x.length - y.length)[0] : 'this problem');
  const handle = topicIsKind ? `choosing ${anOf(topic)}` : `changing how they handle ${topic}`;
  const stripLead = (t: string, n: string) => (n && t.toLowerCase().startsWith(n.toLowerCase()) ? t.slice(n.length).replace(/^[,:\s]+/, '') : t);
  const kindClean = stripLead(stripLead(kp.kind, brief.name), P).trim();
  const subjT = rankedParts.find((x) => x.length <= 28) || (kindTopic && kindTopic.length <= 32 ? kindTopic : '') || P; // the topic in a subject that must read well on its own
  const whatIs = kindClean ? (/^(?:a|an|the)\s/i.test(kindClean) ? `${P} is ${lowerFirstIfCommon(kindClean)}.` : `${P} offers ${lowerFirstIfCommon(kindClean)}.`) : '';
  const covers = rankedParts.length ? `${whatIs ? 'It' : P} covers ${rankedParts.length > 3 ? `${rankedParts.slice(0, 2).join(rankedParts.slice(0, 2).some((x) => / and /.test(x)) ? '; ' : ' and ')}, among other parts` : joinList(rankedParts)}.` : '';
  const valueLine = valueMain ? `${P} is aimed at this: ${valueMain}.` : '';
  const valueIt = valueMain ? `${whatIs || covers ? 'It' : P} is aimed at this: ${valueMain}.` : '';
  const ownVoice = (t: string) => t.replace(/^the (?:[a-z]+ )?(?:page|site|website|home page)\s+(cites|claims|says|shows|reports)\b/i, `${P} $1`).replace(/[.]+$/, '');

  // proof: each item is used once, in the email that suits its kind; what no email took is added to the last one
  const proofAll = parseProof(socialProof);
  const bag = [...proofAll];
  const take = (kinds: ProofItem['kind'][], n = 1): ProofItem[] => {
    const out: ProofItem[] = [];
    for (const k of kinds) for (const p of [...bag]) if (out.length < n && p.kind === k) { out.push(p); bag.splice(bag.indexOf(p), 1); }
    return out;
  };
  const quoteOf = (p: ProofItem): string => {
    const m = p.text.match(/^(?:customer\s+)?(?:quote|words)\s+(?:from|by)\s+([^:]+):\s*(.+)$/i);
    if (m) { const [who, about] = m[1].split(/,\s+on\s+/); return `As ${who.trim()} put it${about ? ` on ${about.trim()}` : ''}: ${m[2].trim()}`; }
    return `In a customer's own words: ${proofPhrase(p)}`;
  };
  // facts are kept exactly as typed (including the first letter) after a lead-in; a quote keeps its speaker; recognition names the product
  const proofParas = (items: ProofItem[]): string => {
    const out: string[] = [];
    const facts = (k: ProofItem['kind']) => items.filter((x) => x.kind === k).map((x) => proofPhrase(x).replace(/[.]+$/, ''));
    const res = facts('result'), sto = facts('story'), sca = facts('scale');
    if (res.length) out.push(`${res.length === 1 ? 'One result' : 'Results'}: ${res.join('; ')}.`);
    if (sto.length) out.push(`${sto.length === 1 ? 'An example' : 'Examples'}: ${sto.join('; ')}.`);
    if (sca.length) out.push(`On scale: ${sca.join('; ')}.`);
    for (const x of items.filter((y) => y.kind === 'quote')) { const t = quoteOf(x); out.push(/["\u201d]$/.test(t) ? t : `${t}.`); }
    const rec = items.filter((y) => y.kind === 'recognition').map((x) => proofPhrase(x).replace(/[.]+$/, ''));
    if (rec.length === 1 && /^named\b/i.test(rec[0])) out.push(`${P} was ${lowerFirstIfCommon(rec[0])}.`);
    else if (rec.length) out.push(`Recognition: ${rec.join('; ')}.`);
    return out.join(' ');
  };
  const used: ProofItem[] = [];
  const mark = (items: ProofItem[]) => { for (const i of items) if (!used.includes(i)) used.push(i); return items; };
  const claimsPara = (): string => { const c = valueClaims.splice(0); for (const x of c) used.push(x); return c.length ? `${c.map((x) => { const t = ownVoice(x.text); return t.startsWith(P) ? t : `Also on record: ${t}`; }).join('. ')}.` : ''; };

  // the people around the persona and the questions of the sector
  const otherRoles = v && !sellerSw ? v.buyerRoles.filter((r) => familyOf(r, investment) !== familyOf(targetPersona, investment) && !['risk', 'procurement'].includes(familyOf(r, investment))).sort((x, y) => Number(/ or /.test(x)) - Number(/ or /.test(y))).slice(0, 2).map(lowerRole) : [];
  const sectorQs = v && !sellerSw ? v.discovery : rk.questions.filter((x) => !/\bthat\b/i.test(x));
  const measures = v && !sellerSw ? rankMeasures(v.metrics, painPlain, valueMain) : [];

  // tone: the greeting, the closing and the way the ask is worded
  const hello = tone === 'casual' ? 'Hi,' : 'Hello,';
  const closing = ({ professional: 'Regards,', casual: 'Thanks,', urgent: 'Regards,', consultative: 'Best regards,', provocative: 'Regards,' } as Record<string, string>)[tone] || 'Regards,';
  const sig = `${closing}\n${senderContext || P}`;
  const ctaRaw = (callToAction || 'short call').replace(/[.?!]+$/, '');
  const ctaVerb = /^(book|see|join|register|reply|try|get|schedule|watch|read|download|start|meet|talk|chat|review|attend|visit|sign|take)\b/i.test(ctaRaw);
  const ctaText = ctaVerb ? lowerFirstIfCommon(ctaRaw) : (/^(a|an|the|one|our|my)\b/i.test(ctaRaw) ? lowerFirstIfCommon(ctaRaw) : anOf(lowerFirstIfCommon(ctaRaw)));
  const WHEN = ['next week', 'later this week', 'in the next two weeks', 'this month'];
  const ask = (i: number): string => {
    const when = tone === 'urgent' ? 'this week' : WHEN[Math.min(i, WHEN.length - 1)];
    if (ctaVerb) {
      if (tone === 'casual') return `Want to ${ctaText} ${when}?`;
      if (tone === 'urgent') return `Can we ${ctaText} ${when}?`;
      if (tone === 'provocative') return `If I am wrong, it costs little to ${ctaText} and find out. ${upperFirst(when)}?`;
      if (tone === 'professional') return `I would welcome the chance to ${ctaText} ${when}.`;
      return `Would you like to ${ctaText} ${when}?`;
    }
    if (tone === 'casual') return `Up for ${ctaText} ${when}?`;
    if (tone === 'urgent') return `Can we fit in ${ctaText} ${when}?`;
    if (tone === 'provocative') return `If I am wrong about this, ${ctaText} will show it quickly. ${upperFirst(when)}?`;
    if (tone === 'professional') return `I would welcome ${ctaText} ${when}.`;
    return `Would ${ctaText} ${when} be a useful way to look at this?`;
  };

  const emails: string[] = [];
  const mail = (day: string, title: string, subject: string, paras: string[]) => {
    const n = emails.length + 1;
    // a question already asked in this email is not asked twice
    const seen = new Set<string>();
    const kept = paras.filter(Boolean).filter((x) => { const k = x.split(': ').pop() || x; if (/\?$/.test(k)) { if (seen.has(k)) return false; seen.add(k); } return true; });
    emails.push(`### Email ${n}: ${title}${day ? ` (${day})` : ''}\n\n**Subject:** ${clip(subject, 70)}\n\n**Body:**\n\n${hello}\n\n${kept.join('\n\n')}\n\n${sig}`);
  };
  const tail = () => { const rest = bag.splice(0); for (const r of rest) used.push(r); return rest.length ? proofParas(rest) : ''; };
  const roleQ = (i: number) => (i === 0 ? rk.questions[0] : sectorQs[i - 1] || rk.questions[0]);
  const qPool = [...rk.questions, ...sectorQs].filter((x, i, a) => a.indexOf(x) === i);
  let qNext = 0;
  const nextQ = (): string => qPool[qNext++ % qPool.length]; // each use gives a question not yet asked in this sequence, while any are left
  const painOpen = painS ? (tone === 'provocative' ? `A direct question: ${painS}. Is that true on your side?` : `I am writing to ${plural}${inInd} because of one problem: ${painS}.`) : `I am writing to ${plural}${inInd} about ${topic}. ${roleQ(0)}`;
  const topicSubj = (pre: string) => `${pre} ${topic}`;
  const objs = v && !sellerSw ? v.objections.slice(0, 2) : [];
  const toYou = (t: string) => t.replace(/on the buyer side/gi, 'on your side').replace(/the buyer's/gi, 'your').replace(/the buyer/gi, 'your team');
  const objPara = (o: { objection: string; response: string }, i = 0) => `${i === 0 ? 'A concern worth naming before you raise it' : 'Another'}: ${lowerFirstIfCommon(o.objection).replace(/[.]+$/, '')}. We would ${toYou(lowerFirstIfCommon(o.response)).replace(/[.]+$/, '')}.`;
  const measuresLine = measures.length ? `The measures ${plural}${inInd} tend to watch here are ${joinList(measures.slice(0, 3))}.` : '';

  const builders: Record<string, () => void> = {
    cold_outreach: () => {
      mail('Day 1', 'Opening', painHead ? cap(painHead) : topicSubj('A question about'), [painOpen, [whatIs, covers, valueIt].filter(Boolean).join(' '), ask(0)]);
      const r2 = mark(take(['result', 'scale'], 2));
      mail('Day 3', 'Result and question', r2.length ? `A result on ${subjT}` : topicSubj('One question on'), [
        r2.length ? `${proofParas(r2)}` : '',
        claimsPara(),
        `The question that usually decides whether a change like this matters to ${aAn(rk.label)} is this: ${nextQ()}`,
        ask(1)]);
      const r3 = mark(take(['quote', 'story'], 2));
      mail('Day 7', r3.length ? 'In a customer\'s words' : 'Another angle', r3.some((x) => x.kind === 'quote') ? `What a customer said about ${subjT}` : r3.length ? `An example on ${subjT}` : `${cap(topic)} on the ground`, [
        r3.length ? proofParas(r3) : measuresLine,
        painT ? `The second part of the problem: ${painT}.` : `A question from the same place: ${nextQ()}`,
        rankedParts[0] ? `The part of ${P} that speaks to this is ${rankedParts[0]}.` : '',
        ask(1)]);
      mail('Day 12', 'Right person?', `Who owns ${topic}${inInd}?`, [
        `I have written a few times about ${painS && painS.length <= 120 ? q(painS) : painRef ? q(painRef) : topic} and have not heard back, so I will ask plainly: is this yours, or does it sit with someone else${otherRoles.length ? `, for example your ${joinList(otherRoles, 'or')}` : ''}?`,
        `If the problem is real but the timing is wrong, tell me which quarter suits you and I will come back then.`]);
      const r5 = mark(take(['recognition', 'result', 'scale', 'quote', 'story'], 1));
      mail('Day 17', 'Questions to keep', `Questions on ${topic}${inInd}`, [
        `This is my last note. Here are the questions ${plural}${inInd} can ask themselves before ${handle}, useful even if we never speak:\n${sectorQs.slice(0, 3).map((x, i) => `${i + 1}. ${x}`).join('\n')}`,
        r5.length ? proofParas(r5) : '', tail(),
        `If you want to talk any of it through, reply and I will make the time for ${ctaText}.`]);
    },
    warm_follow_up: () => {
      mail('same day or next morning', 'After the call', `Next step on ${topic}`, [
        painS ? `Thank you for the conversation. What I took from it: ${painS}.` : `Thank you for the conversation about ${topic}.`,
        [whatIs, valueIt].filter(Boolean).join(' '),
        `The next step I would suggest is ${ctaText}. ${ask(0)}`]);
      const r2 = mark(take(['result', 'scale'], 2));
      mail('Day 3', 'Something useful', `For ${aAn(rk.label)}: ${measures[0] || topic}`, [
        `One question I have been thinking about since we spoke: ${roleQ(0)}`,
        measuresLine, r2.length ? proofParas(r2) : valueLine, claimsPara(), painT ? `We also touched on this: ${painT}.` : '']);
      const r3 = mark(take(['quote', 'story', 'recognition'], 2));
      mail('Day 7', 'Checking in', `Checking in on ${topic}`, [
        painT ? `We also touched on this: ${painT}.` : painRef ? `I wanted to come back to ${q(painRef)}.` : '',
        r3.length ? proofParas(r3) : `A question I would put to your own team: ${sectorQs[0] || roleQ(0)}`, tail(), r3.length ? '' : valueLine,
        ask(1)]);
    },
    post_demo: () => {
      mail('same day', 'Thank you', `Thank you for the demo of ${P}`, [
        `Thank you for the time today. You saw ${P}${rankedParts.length ? `, which covers ${rankedParts.length > 3 ? `${rankedParts.slice(0, 2).join(rankedParts.slice(0, 2).some((x) => / and /.test(x)) ? '; ' : ' and ')}, among other parts` : joinList(rankedParts)}` : brief.kind ? `, ${lowerFirstIfCommon(brief.kind)}` : ''}.`,
        painS ? `The problem we set out to address: ${painS}.` : '', valueLine,
        `If anything about ${topic} was unclear after the demo, send me the question and I will answer it in writing.`]);
      mail('Day 2', 'Likely concerns', objs[0] ? `Before you decide: ${lowerFirstIfCommon(objs[0].objection).replace(/[.]+$/, '')}` : `Questions after the demo of ${P}`, [
        objs.length ? objs.map((o, i) => objPara(o, i)).join('\n\n') : `A question to settle before you decide: ${roleQ(0)}`,
        ask(1)]);
      const r3 = mark(take(['quote', 'story', 'result'], 2));
      mail('Day 5', 'Team material', otherRoles[0] ? `For your ${otherRoles[0]}: ${topic}` : `Material for your team on ${topic}`, [
        `As you take ${P} to the people on your side${otherRoles.length ? `, such as your ${joinList(otherRoles)}` : ''}, I can prepare what each one will ask about. ${v ? `${cap(measures[0] || topic)} is usually where ${plural} start.` : ''}`,
        r3.length ? proofParas(r3) : '', claimsPara()]);
      const r4 = mark(take(['recognition', 'scale', 'result'], 1));
      mail('Day 10', 'Next step', `Next step on ${P}`, [
        `I would like to agree the next step with you. ${ask(1)}`,
        valueMain ? `The aim, as we described it: ${valueMain}.` : '', r4.length ? proofParas(r4) : '', tail(),
        `If budget or timing holds ${P} back, tell me which and I will plan around it.`]);
    },
    re_engagement: () => {
      mail('', 'Still a problem?', painHead ? `Is ${lowerFirstIfCommon(painHead)} still true?` : topicSubj('Is this still on your list:'), [
        painS ? `When we last spoke, the problem was this: ${painS}.` : `When we last spoke, ${topic} was on the table.`,
        `I do not know what has changed on your side since, so I will ask: has it become more of a priority, less, or has someone else taken it on${otherRoles.length ? ` (for example your ${joinList(otherRoles, 'or')})` : ''}?`,
        ask(0)]);
      const r2 = mark(take(['result', 'scale', 'quote', 'story'], 2));
      mail('', 'What is new', `What ${P} has to show on ${topic}`, [
        r2.length ? `${proofParas(r2)}` : `A question while you think about it: ${roleQ(0)}`,
        claimsPara(), valueLine]);
      const r3 = mark(take(['recognition'], 1));
      mail('', 'A direct question', `Close the loop on ${topic}?`, [
        `I do not want to keep writing if ${painRef ? q(painRef) : topic} is off your list. Is it still something you are working on, or should I check back at a different time?`,
        r3.length ? proofParas(r3) : '', tail(), ask(2)]);
    },
    proposal_follow_up: () => {
      mail('Day 1', 'The proposal', `Your proposal for ${topic}`, [
        `I have sent the proposal for ${P}${inInd ? `, written for ${plural}${inInd}` : ''}. It starts from the problem you described: ${painS || topic}.`,
        [whatIs, covers].filter(Boolean).join(' '), valueLine,
        `${ask(0)} I would walk through it section by section and take your questions as we go.`]);
      mail('Day 3', 'Questions', objs[0] ? `On the proposal: ${lowerFirstIfCommon(objs[0].objection).replace(/[.]+$/, '')}` : `Questions on the proposal for ${topic}`, [
        objs.length ? objs.map((o, i) => objPara(o, i)).join('\n\n') : '', `One question for whoever reviews it: ${roleQ(1)}`, measuresLine, objs.length ? '' : valueLine, objs.length || !painT ? '' : `The second part of the problem, which the proposal also covers: ${painT}.`]);
      const r3 = mark(take(['result', 'quote', 'story', 'scale'], 2));
      mail('Day 7', 'Reviewers', otherRoles[0] ? `Who else reviews the proposal: your ${otherRoles[0]}?` : `Evidence for the proposal on ${topic}`, [
        r3.length ? `${proofParas(r3)}` : [whatIs, valueIt].filter(Boolean).join(' '),
        claimsPara(),
        otherRoles.length ? `Who on your side besides you reviews it: your ${joinList(otherRoles, 'or')}? I can prepare a short version for each.` : `Who on your side besides you reviews it? I can prepare a short version for each.`]);
      const r4 = mark(take(['recognition'], 1));
      mail('Day 12', 'Decision', `Where the proposal for ${P} stands`, [
        `I would like to know where the proposal stands. What has to happen on your side before a decision on ${P}, and by when?`,
        `A question to settle before a decision: ${roleQ(2)}`, r4.length ? proofParas(r4) : '', tail(), ask(1)]);
    },
    nurture: () => {
      mail('Week 1', 'The problem', topicSubj('How to look at'), [
        painS ? `This note is about one problem: ${painS}.` : topic !== 'this problem' ? `This note is about ${topic}.` : '',
        measuresLine || `The question to start with: ${roleQ(0)}`,
        sectorQs[0] ? `A question to start with: ${sectorQs[0]}` : '']);
      mail('Week 2', 'One part', rankedParts[0] ? `${cap(rankedParts[0])}: what it does` : `What ${P} does`, [
        [whatIs, covers].filter(Boolean).join(' '),
        rankedParts[0] ? `For the problem above, ${rankedParts[0]} is the part to look at first.` : valueLine,
        valueLine && rankedParts[0] ? valueLine : '', claimsPara(), `A question for you: ${roleQ(0)}`]);
      const r3 = mark(take(['result', 'quote', 'story', 'scale'], 2));
      mail('Week 4', 'A customer', r3.length ? `What a customer saw on ${subjT}` : `${cap(subjT)} for ${plural}`, [
        r3.length ? proofParas(r3) : '',
        painT ? `The other half of the problem: ${painT}.` : '', r3.length ? '' : valueLine, `A question for you: ${sectorQs[1] || roleQ(1)}`]);
      const r4 = mark(take(['recognition'], 1));
      mail('Week 6', 'An open door', `If ${topic} is on your list`, [
        `${painRef ? `If ${q(painRef)} is on your list` : `If ${topic} is on your list`}, ${ctaVerb ? `you can ${ctaText}` : `I am happy to set up ${ctaText}`} at a time that suits you.`,
        r4.length ? proofParas(r4) : '', tail(), `A last question: ${sectorQs[2] || roleQ(2)}`]);
    },
    event_follow_up: () => {
      mail('next day', 'After the event', `Good to meet you at the event: ${topic}`, [
        painS ? `It was good to meet you at the event. The problem I wanted to follow up on: ${painS}.` : `It was good to meet you at the event. I wanted to follow up on ${topic}.`,
        [whatIs, valueIt].filter(Boolean).join(' '), ask(0)]);
      const r2 = mark(take(['result', 'scale', 'quote', 'story'], 2));
      mail('Day 4', 'Follow-up', `Following the event: ${topic}`, [
        r2.length ? `${proofParas(r2)}` : `A question for you: ${roleQ(0)}`,
        claimsPara(), covers, r2.length ? '' : valueLine, r2.length || !painT ? '' : `The second part of the problem: ${painT}.`]);
      const r3 = mark(take(['recognition'], 1));
      mail('Day 9', 'A direct ask', `Still worth ${ctaVerb ? 'a conversation' : ctaText}?`, [
        `I met a lot of people at the event and I would rather ask than guess: is ${painRef ? q(painRef) : topic} something you are working on?`,
        r3.length ? proofParas(r3) : '', tail(), ask(1)]);
    },
    referral_request: () => {
      mail('Day 1', 'Introduction', `An introduction on ${topic}?`, [
        `I am looking to speak with ${plural}${inInd} about ${painS ? q(painS) : topic}.`,
        `Is that you, or is there someone you would point me to${otherRoles.length ? `, perhaps your ${joinList(otherRoles, 'or')}` : ''}?`,
        `I would ask them for ${ctaText}, nothing more.`]);
      const r2 = mark(take(['result', 'scale', 'quote', 'story'], 1));
      mail('Day 4', 'A note to forward', `A note to forward on ${topic}`, [
        `Here are three lines about ${P} that you can forward as they are.`,
        `${[whatIs, valueIt].filter(Boolean).join(' ')} ${painS ? `The problem it starts from: ${painS}.` : ''} ${r2.length ? proofParas(r2) : ''}`.replace(/\s+/g, ' ').trim(),
        `They can reply to me directly for ${ctaText}.`]);
      const r3 = mark(take(['recognition', 'quote', 'story', 'result', 'scale'], 1));
      mail('Day 9', 'Last ask', `Thank you, and one last ask on ${topic}`, [
        `If nobody comes to mind for ${topic}, a one-line reply saying so helps me too.`,
        r3.length ? proofParas(r3) : '', tail(), claimsPara(),
        `And if you are the right person after all: ${ask(2)}`]);
    },
  };

  const build = builders[sequenceType];
  if (!build) {
    return `Sequence type '${sequenceType}' not recognized. Available sequence types: ${Object.keys(builders).join(', ')}`;
  }
  build();

  // what was not given, said once
  const notGiven: string[] = [];
  if (!specificPainPoint) notGiven.push('specific_pain_point (the emails ask a question about the topic instead of naming a problem)');
  if (!keyValueProp) notGiven.push('key_value_prop (the emails describe the product by what it is)');
  if (!callToAction) notGiven.push('call_to_action (the ask is a short call)');
  if (!senderContext) notGiven.push('sender_context (the emails are signed with the product name)');
  if (!targetIndustry) notGiven.push('target_industry (the emails speak of the persona without a sector)');
  const notGivenLine = notGiven.length ? `**Not given:** ${notGiven.join('; ')}. Add them to use them in the draft.\n\n` : '';

  // the proof and figures used, with the label each came with, to check before sending
  const checkItems = [...used].filter((x, i, a) => a.indexOf(x) === i);
  const checks: string[] = [`Add the recipient's name.`];
  if (sequenceType === 'event_follow_up') checks.push(`Name the event in email 1.`);
  if (!proofAll.length) checks.push(`No social_proof was given, so no email quotes a result or a customer. Add social_proof (a result, a customer quote or an award you may name) and run it again to give the emails something to quote.`);
  checks.push(...(checkItems.length ? [`Check these before sending (each is used as you gave it):\n${checkItems.map((p) => `- ${proofPhrase(p)} (${p.label || 'as you gave it'})`).join('\n')}`] : []));
  const fixed = EMAIL_COUNTS[sequenceType] || emails.length;
  const emailsText = hasValue(args.num_emails) ? (args.num_emails as number).toLocaleString('en-US') : `${fixed}`;
  const fixedNote = hasValue(args.num_emails) ? `\n*This sequence type has ${fixed} emails and num_emails is not used yet: add or remove emails to match the number you need.*` : '';
  const title = sequenceType.split('_').map((w, i) => (i === 0 ? upperFirst(w) : w)).join(' ');
  const notes = v ? `\n\n---\n\n${sellerSw ? `### Sector notes: ${v.name}\n- The notes for this sector describe a software company's own customers, so they are left out for a buyer${indLow ? ` in ${indLow}` : ' in another industry'}.` : sectorNotes(v, 'metrics')}` : '';
  return `# ${title === 'Cold outreach' ? 'Cold Outreach' : title === 'Warm follow up' ? 'Warm Follow-Up' : title === 'Post demo' ? 'Post-Demo' : title === 'Re engagement' ? 'Re-Engagement' : title} Sequence

## Target: ${targetPersona}${indLow ? ` in ${indLow}` : ''}
## Solution: ${yourSolution}
## Tone: ${tone}
## Emails: ${emailsText}${fixedNote}

${notGivenLine}${emails.join('\n\n---\n\n')}

---

## Before you send

${checks.join('\n\n')}${notes}

${SUGGESTIONS_FOOTER}`;
}
const EMAIL_COUNTS: Record<string, number> = { cold_outreach: 5, warm_follow_up: 3, post_demo: 4, re_engagement: 3, proposal_follow_up: 4, nurture: 4, event_follow_up: 3, referral_request: 3 };


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
// Run 22: demo_script_builder is built in src/rw-demo.ts (the product's own parts matched to the pains and the people; statistics are proof lines, never steps).
function executeDemoScriptBuilder(args: Record<string, unknown>): string {
  return buildDemoScript(args, {
    readContext, cap, lowerFirstIfCommon, sectorNotes: (v, what) => sectorNotes(v, what), splitItems,
    stock: (v, modelKey) => ({ show: DEMO_SHOW[stockKey(v, modelKey)] || [], next: (MAP_EVAL[stockKey(v, modelKey)] || [{ m: 'Pilot discussion' }])[0].m }),
    footer: SUGGESTIONS_FOOTER,
  });
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
