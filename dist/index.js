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
        description: 'Build an ROI business case template from your inputs: value, ROI and payback calculated with example assumptions and benchmarks that are labelled for you to replace, plus an executive summary.',
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
                    description: 'Metrics the prospect shared. Shown in the output; not used in the calculation'
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
                    description: 'Deal details - can be rough notes, CRM export, or structured data'
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

**Likely Decision Makers:**
- Look for VP+ titles, budget owners, P&L responsibility
- Identify who benefits most from success

**Potential Champions:**
- Who has the problem you solve?
- Who's measured on outcomes you impact?

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

**Typical Stakeholders (a general list${args.industry ? `, not specific to ${industry}` : ''}):**
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
1. **Adjacent use cases** - Who else has similar problems?
2. **Deeper penetration** - More users, more features, more data
3. **Cross-sell** - Complementary products they don't have
4. **Upsell** - Premium tiers, enterprise features`;
    }
    else {
        whitespaceAnalysis = `
### Whitespace Analysis
**Full greenfield opportunity** - No current footprint

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
1. **Document current value** - Quantify ROI from existing usage
2. **Identify expansion sponsors** - Who benefits from growth?
3. **Map to business initiatives** - Tie to strategic priorities
4. **Create urgency** - Why expand now vs later?`;
    }
    // Generate 90-day plan
    const today = new Date();
    const day30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const day60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const day90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    return `# 🎯 Strategic Account Plan: ${accountName}

## Account Overview

| Attribute | Value |
|-----------|-------|
| **Account Name** | ${accountName} |
| **Industry** | ${args.industry || NOT_SUPPLIED} |
| **Account Tier** | ${accountTier} |
| **Current ARR** | ${hasValue(args.current_arr) ? `$${currentArr.toLocaleString('en-US')}` : NOT_SUPPLIED} |
| **Expansion Potential** | ${expansionPotential} |
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

### Days 1-30: Foundation (by ${day30.toISOString().split('T')[0]})

**Objectives:**
- [ ] Complete stakeholder mapping (all decision makers identified)
- [ ] Understand current state and pain points
- [ ] Identify 2-3 potential champions
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
3. Connect champion with reference customers
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
- [ ] Earnings calls and investor presentations
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
| 🔴 High | Identify and engage champion | AE | Week 1 |
| 🔴 High | Map decision-making process | AE | Week 2 |
| 🟡 Medium | Research competitive landscape | AE | Week 2 |
| 🟡 Medium | Build initial business case | AE + SE | Week 3 |
| 🟢 Low | Document account in CRM | AE | Ongoing |

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
        healthFactors.push('✅ Multi-threaded (strong)');
    }
    else if (championStatus === 'confirmed_champion') {
        healthScore += 10;
        healthFactors.push('✅ Confirmed champion');
    }
    else if (championStatus === 'potential_champion') {
        healthScore += 0;
        healthFactors.push('⚠️ Champion not confirmed');
    }
    else {
        healthScore -= 20;
        healthFactors.push('🔴 No champion identified');
    }
    // Economic buyer
    if (economicBuyer && economicBuyer.toLowerCase().includes('engaged')) {
        healthScore += 10;
        healthFactors.push('✅ Economic buyer engaged');
    }
    else if (economicBuyer) {
        healthScore += 5;
        healthFactors.push('⚠️ Economic buyer identified but not engaged');
    }
    else {
        healthScore -= 10;
        healthFactors.push('🔴 Economic buyer unknown');
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
        healthFactors.push(`🔴 ${daysInStage} days in stage (more than 2x this tool's example threshold for the stage) ${EXAMPLE}`);
    }
    else if (daysInStage > threshold) {
        healthScore -= 5;
        healthFactors.push(`⚠️ ${daysInStage} days in stage (above this tool's example threshold for the stage)`);
    }
    // Competitor impact
    if (competitors && competitors.toLowerCase().includes('incumbent')) {
        healthScore -= 10;
        healthFactors.push('⚠️ Competing against incumbent');
    }
    else if (competitors) {
        healthScore -= 5;
        healthFactors.push('⚠️ Active competition');
    }
    // Blockers impact
    if (blockers) {
        healthScore -= 10;
        healthFactors.push('🔴 Known blockers present');
    }
    healthScore = Math.max(0, Math.min(100, healthScore));
    let healthColor = '🟢';
    let healthStatus = 'Healthy';
    if (healthScore < 50) {
        healthColor = '🔴';
        healthStatus = 'At Risk';
    }
    else if (healthScore < 70) {
        healthColor = '🟡';
        healthStatus = 'Needs Attention';
    }
    // Stage-specific strategies
    const stageStrategies = {
        prospecting: `
### Prospecting Stage Strategy

**Primary Objective:** Earn the first meeting

**Tactical Priorities:**
1. **Research deeply** - Know their business before outreach
2. **Find a warm path** - Referral, common connection, trigger event
3. **Lead with insight** - Not what you sell, but what you know
4. **Multi-channel approach** - Email, LinkedIn, phone, events

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
1. **Deep discovery** - Understand the problem better than they do
2. **Quantify impact** - Turn pain into dollars and time
3. **Multi-thread** - Don't rely on single contact
4. **Map the process** - Understand how they buy

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
1. **Customize heavily** - Demo their use case, not features
2. **Confirm understanding** - Validate discovery before showing
3. **Address concerns** - Surface and handle objections
4. **Drive commitment** - Get clear next steps

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
1. **No surprises** - Proposal should confirm what's already discussed
2. **Quantify value** - ROI > 3x investment ${EXAMPLE}
3. **Differentiate** - Why you, not just why change
4. **Create urgency** - Why now matters

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
1. **Defend value** - Trade, don't discount
2. **Multi-thread** - Don't let procurement isolate you
3. **Create urgency** - Why close by target date
4. **Stay close to champion** - They fight for you internally

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
1. **Remove all blockers** - Legal, procurement, technical
2. **Daily communication** - Don't let momentum die
3. **Parallel processing** - Multiple tracks moving
4. **Executive alignment** - Keep sponsors engaged

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
### STUCK DEAL - Urgent Recovery Strategy

**Primary Objective:** Re-qualify or kill the deal

**Diagnostic Questions:**
1. **Is there a real problem?** - Or did we create perceived need?
2. **Do they have budget?** - Confirmed, not assumed
3. **Is timing real?** - What happens if they don't act?
4. **Do we have power?** - Access to decision maker?

**Recovery Tactics:**
1. **Go high** - Request executive conversation
2. **Create event** - New information, risk, or opportunity
3. **Change the conversation** - Different angle or use case
4. **Walk away test** - "Should we pause this?"

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
### 🔴 CRITICAL: Find Your Champion

Without a champion, win rate drops 70%+ ${EXAMPLE}. Immediate action required:

1. **Identify potential champions** - Who has the pain and influence?
2. **Test for championship** - Will they:
   - Advocate internally when you're not there?
   - Share information about competition and process?
   - Help you access other stakeholders?
3. **Enable your champion** - Give them ammunition:
   - Internal business case
   - Executive talking points
   - ROI one-pager

`;
    }
    if (!economicBuyer) {
        specificRecs += `
### ⚠️ Economic Buyer Unknown

You don't know who controls the budget. Action required:

1. **Ask directly**: "Who has final approval on budget and vendor selection?"
2. **Map the org**: Who does your champion report to?
3. **Follow the money**: Where does this budget come from?
4. **Request introduction**: "Can you help me understand the approval process?"

`;
    }
    if (competitors) {
        specificRecs += `
### ⚔️ Competitive Strategy

**Competitors:** ${competitors}

**Tactics:**
1. **Know their weaknesses** - Every competitor has gaps
2. **Set traps** - Questions that expose their limitations
3. **Don't go negative** - Let buyer discover issues
4. **Change the criteria** - Make your strengths their requirements

**Landmine Questions to Suggest:**
- "Ask them about [your strength area]"
- "What happens when you need [thing they can't do]?"
- "Can they show you [proof point you have]?"

`;
    }
    if (blockers) {
        specificRecs += `
### 🚧 Blocker Mitigation

**Known Blockers:** ${blockers}

**Strategy:**
1. **Understand root cause** - Why are they blocking?
   - Threatened by change?
   - Owns competing solution?
   - Legitimate concerns?
2. **Address concerns** - Can you solve their problem too?
3. **Go around** - Can champion neutralize?
4. **Executive cover** - Get mandate from above

`;
    }
    return `# 🎯 Deal Strategy Coach: ${dealName}

## Deal Health Assessment

| Metric | Value |
|--------|-------|
| **Deal Name** | ${dealName} |
| **Deal Value** | ${hasValue(args.deal_value) ? `$${dealValue.toLocaleString('en-US')}` : NOT_SUPPLIED} |
| **Current Stage** | ${dealStage.charAt(0).toUpperCase() + dealStage.slice(1)} |
| **Days in Stage** | ${hasValue(args.days_in_stage) ? daysInStage : NOT_SUPPLIED} |
| **Target Close** | ${closeDate || 'Not set'} |
| **Solution** | ${args.your_solution || NOT_SUPPLIED} |

### Health Score: ${healthColor} ${healthScore}/100 - ${healthStatus}

**Health Factors:**
${healthFactors.map(f => `- ${f}`).join('\n')}

---

${stageStrategies[dealStage] || stageStrategies['discovery']}

---

${specificRecs}

## Immediate Actions

### Next 24-48 Hours
${championStatus === 'no_champion' ? '1. 🔴 **Identify champion** - Cannot win without one' : '1. ✅ Champion identified - keep them engaged'}
${!economicBuyer ? '2. 🔴 **Find economic buyer** - Who controls budget?' : '2. ✅ Economic buyer known - get them involved'}
3. 📞 **Advance the deal** - ${nextSteps || 'Schedule next meeting with clear agenda'}
4. 📝 **Update CRM** - Document all new information

### This Week
- [ ] Confirm or find champion
- [ ] Map all stakeholders
- [ ] Understand competitive position
- [ ] Document buying process
- [ ] Build/refine business case

---

## Coaching Questions

Ask yourself:
1. **Why will they buy?** - What's the compelling event?
2. **Why will they buy from us?** - What's our differentiation?
3. **Why will they buy now?** - What creates urgency?
4. **Who decides?** - Do we have the right relationships?
5. **What can go wrong?** - What are we not seeing?

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
    // MEDDPICC Questions
    const meddpiccQuestions = `
## MEDDPICC Framework Questions

### M - Metrics
*What are the quantified goals or benefits the customer expects?*

**Initial Discovery:**
- "What metrics does your team get measured on?"
- "If this problem was solved, what would improve?"
- "How much time/money is this problem costing you today?"

**Deepening:**
- "How did you arrive at that number?"
- "Who else is impacted by these metrics?"
- "What happens to your goals if you don't address this?"

${knownMetrics ? `**Already Known:** ${knownMetrics}\n**Follow-up:** "You mentioned ${knownMetrics}. Can you help me understand how you're measuring that today?"` : ''}

---

### E - Economic Buyer
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

### D - Decision Criteria
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

### D - Decision Process
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

### P - Paper Process
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

### I - Identify Pain
*What are the business problems driving the initiative?*

**Surface Level:**
- "What prompted you to look at solutions like this?"
- "What's not working today?"
- "If you do nothing, what happens?"

**Deepening:**
${knownPainPoints ? `**Already Known:** ${knownPainPoints}\n- "You mentioned ${knownPainPoints}. Can you tell me more about the impact?"` : '- "What\'s the root cause of this problem?"\n- "How long has this been an issue?"'}
- "Who else in the organization feels this pain?"

---

### C - Champion
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

### C - Competition
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

### B - Budget
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

### A - Authority
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

### N - Need
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

### T - Timeline
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

### S - Situation
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

### P - Pain
*What problems are they experiencing?*

**Surface:**
- "What's frustrating about the current situation?"
- "What would you change if you could?"
- "Where do things break down?"

**Impact:**
${knownPainPoints ? `**Already Known:** ${knownPainPoints}\n- "How does ${knownPainPoints} affect your team's performance?"` : '- "How is this problem affecting your team?"'}
- "What's the ripple effect of this issue?"
- "How much time/money does this cost?"

---

### I - Impact
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

### C - Critical Event
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

### E - Event (or Expected Decision Process)
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

### D - Decision Criteria
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

### Teach - Share Insights
*Lead with provocative insights about their business*

**Reframe Questions:**
- "Have you considered that [surprising insight about their industry]?"
- "What if the problem isn't [obvious issue] but actually [hidden issue]?"
- "We've seen companies like yours [unexpected finding] - have you experienced that?"

**Insight Starters:**
- "Most companies we talk to think [common belief], but the data shows [surprising reality]."
- "There's a hidden cost in your current approach that most people miss..."
- "The best-performing teams in your industry are doing something different..."

---

### Tailor - Customize the Message
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

### Take Control - Guide the Process
*Assertively lead the conversation and process*

**Direction Setting:**
- "Based on what I'm hearing, here's what I think we should do next..."
- "In my experience, the most effective path forward would be..."
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
    let output = `# 📋 Discovery Question Bank

## Context
- **Prospect Industry:** ${prospectIndustry || 'Not specified'}
- **Contact Role:** ${prospectRole || 'Not specified'}
- **Deal Stage:** ${dealStage.replace(/_/g, ' ')}
- **Your Solution:** ${args.your_solution || NOT_SUPPLIED}
${knownPainPoints ? `- **Known Pain Points:** ${knownPainPoints}` : ''}
${knownMetrics ? `- **Known Metrics:** ${knownMetrics}` : ''}
${gapsToFill ? `- **Information Gaps:** ${gapsToFill}` : ''}

---

`;
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
3. **Go deeper** - "Tell me more about that"
4. **Take notes** - Show you're capturing what matters

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
    const annualRevenue = args.annual_revenue || 0;
    const employeeCount = args.employee_count || 0;
    const yourSolution = args.your_solution || 'your solution';
    const solutionPrice = args.solution_price || 0;
    const primaryValueDriver = args.primary_value_driver || 'productivity';
    const knownMetrics = args.known_metrics || '';
    const currentProcess = args.current_process || '';
    const implementationTimeline = args.implementation_timeline || '90 days';
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
    const estimatedRevenue = annualRevenue || (employeeCount * industryBenchmark.revenue_per_employee * sizeMultiplier);
    const estimatedEmployees = employeeCount || Math.round(annualRevenue / (industryBenchmark.revenue_per_employee * sizeMultiplier));
    // Display helpers (output text only; no calculation below changes). The user's own inputs are shown
    // as given; every figure built from this tool's example assumptions carries the EXAMPLE label.
    const fmt = (n) => n.toLocaleString('en-US');
    const noSizeData = !annualRevenue && !employeeCount;
    const NOT_COMPUTED = 'not computed: needs annual revenue or employee count';
    const revenueCell = annualRevenue
        ? `$${fmt(annualRevenue)}`
        : employeeCount
            ? `$${fmt(estimatedRevenue)}, estimated from your employee count ${EXAMPLE}`
            : NOT_SUPPLIED;
    const employeesCell = employeeCount
        ? fmt(employeeCount)
        : annualRevenue
            ? `${fmt(estimatedEmployees)}, estimated from your annual revenue ${EXAMPLE}`
            : NOT_SUPPLIED;
    const revenueValueCell = (n) => (noSizeData ? NOT_COMPUTED : `**$${fmt(n)}** ${EXAMPLE}`);
    // Generate ROI calculations based on value driver
    let valueCalculations = '';
    let totalValue = 0;
    let confidenceLevel = 'Medium';
    if (primaryValueDriver === 'revenue_increase' || primaryValueDriver === 'multiple') {
        // Revenue impact calculation
        const revenueImpact = estimatedRevenue * 0.02; // Conservative 2% improvement
        totalValue += revenueImpact;
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
    if (primaryValueDriver === 'cost_reduction' || primaryValueDriver === 'multiple') {
        // Cost reduction calculation
        const hoursSavedPerEmployee = 5; // hours per week
        const impactedEmployees = Math.max(10, estimatedEmployees * 0.1);
        const weeklySavings = hoursSavedPerEmployee * impactedEmployees * industryBenchmark.cost_of_manual_work_per_hour;
        const annualCostSavings = weeklySavings * 50; // 50 working weeks
        totalValue += annualCostSavings;
        valueCalculations += `
### Cost Reduction

**Calculation Methodology:**
${EXAMPLES}
- Hours saved per employee per week: ${hoursSavedPerEmployee} hours
- Employees impacted: ${impactedEmployees.toFixed(0)}
- Hourly cost of labor: $${industryBenchmark.cost_of_manual_work_per_hour}
- Weekly savings: $${fmt(weeklySavings)}
- Annual Cost Savings: **$${fmt(annualCostSavings)}**

**Validation Questions:**
- "How many hours per week do your team spend on [manual task]?"
- "What's the fully-loaded cost of your team members?"
- "How many people are doing this work today?"

`;
    }
    if (primaryValueDriver === 'productivity' || primaryValueDriver === 'multiple') {
        // Productivity calculation
        const productivityGain = estimatedRevenue * 0.01; // 1% productivity improvement
        totalValue += productivityGain;
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
    if (primaryValueDriver === 'risk_mitigation' || primaryValueDriver === 'multiple') {
        // Risk mitigation calculation
        const riskReduction = estimatedRevenue * 0.005; // 0.5% risk reduction value
        totalValue += riskReduction;
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
    const investment = solutionPrice || totalValue * 0.1; // Assume 10% of value if price unknown
    const roi = ((totalValue - investment) / investment) * 100;
    const paybackMonths = (investment / totalValue) * 12;
    const threeYearValue = totalValue * 3;
    const threeYearNet = threeYearValue - (investment * 3);
    if (knownMetrics) {
        confidenceLevel = 'High';
    }
    // Display text (output only; every figure above is unchanged)
    const nc = 'not computed';
    const priceSupplied = !!solutionPrice;
    const valueComputed = totalValue > 0;
    const sizeText = companySize.replace(/_/g, ' ');
    const benchmarkText = !args.industry
        ? 'Technology (no industry supplied)'
        : benchmarks[industry]
            ? industry
            : `Technology (your industry "${industry}" matched none of the built-in sets: ${Object.keys(benchmarks).join(', ')})`;
    const confidenceText = knownMetrics
        ? `${confidenceLevel}: set because you supplied metrics, but the calculation does not use them; the value figures rest on example assumptions`
        : `${confidenceLevel}: the value figures rest on example assumptions, not on the customer's data`;
    const timelineText = `${implementationTimeline}${args.implementation_timeline ? '' : ` ${EXAMPLE}`}`;
    const ignoredInputs = [currentProcess ? 'current process' : '', knownMetrics ? 'known metrics' : ''].filter(Boolean).join(' and ');
    // Without a price, the investment is a share of the value, so it cannot be shown when no value is computed
    const invCell = (n) => (priceSupplied || valueComputed ? `$${fmt(n)}` : nc);
    return `# 💰 ROI Business Case: ${customerName}

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
| **Solution Cost**${priceSupplied ? '' : ` (${NOT_SUPPLIED}) ${EXAMPLE}`} | ${invCell(investment)} | ${invCell(investment)} | ${invCell(investment)} |
| **Implementation** ${EXAMPLE} | ${invCell(Math.round(investment * 0.15))} | ${invCell(0)} | ${invCell(0)} |
| **Total Investment** | ${invCell(Math.round(investment * 1.15))} ${EXAMPLE} | ${invCell(investment)} | ${invCell(investment)} |

---

## Value Breakdown

${valueCalculations}
${ignoredInputs ? `*Not used in this calculation: the ${ignoredInputs} you supplied (listed under Assumptions). Replace the example figures with that data.*\n` : ''}
---

## ROI Analysis

### Total Annual Value
| Category | Annual Value |
|----------|--------------|
| **Total Quantified Value** | ${valueComputed ? `**$${fmt(totalValue)}** ${EXAMPLE}` : nc} |
| **Annual Investment** | ${invCell(investment)}${priceSupplied ? '' : ` ${EXAMPLE}`} |
| **Net Annual Benefit** | ${valueComputed ? `$${fmt(totalValue - investment)} ${EXAMPLE}` : nc} |

### Key Metrics

${EXAMPLES}
| Metric | Value | Example threshold |
|--------|-------|-------------------|
| **ROI** | ${valueComputed ? `${roi.toFixed(0)}%` : nc} | >100% considered strong |
| **Payback Period** | ${valueComputed ? `${paybackMonths.toFixed(1)} months` : nc} | <12 months considered fast |
| **3-Year Net Value** | ${valueComputed ? `$${fmt(threeYearNet)}` : nc} | - |
| **Value/Cost Ratio** | ${valueComputed ? `${(totalValue / investment).toFixed(1)}x` : nc} | >3x considered excellent |

---

## Assumptions

### Key Assumptions
1. Implementation timeline: ${timelineText}
2. Full value realization: 6-12 months post-implementation ${EXAMPLE}
3. Benchmark set used for hourly labor cost and revenue per employee: ${benchmarkText}
4. Company size multiplier: ${sizeMultiplier}x (${sizeText}), used only to estimate revenue or employees that were not supplied ${EXAMPLE}

${currentProcess ? `### Current State\n${currentProcess}\n` : ''}

${knownMetrics ? `### Customer-Provided Metrics\n${knownMetrics}\n` : '### Validation Needed\n- Customer metrics not yet provided\n- Schedule discovery session to validate assumptions\n- Adjust calculations based on actual data'}

### About These Figures
The assumptions above are examples built into this tool, not findings from published research or from the customer's data. Replace them with the customer's own figures before you share this business case.

---

## Sensitivity Analysis

${EXAMPLES}
### Conservative Scenario (50% of projected value)
- Annual Value: ${valueComputed ? `$${fmt(Math.round(totalValue * 0.5))}` : nc}
- ROI: ${valueComputed ? `${Math.round(((totalValue * 0.5 - investment) / investment) * 100)}%` : nc}
- Payback: ${valueComputed ? `${((investment / (totalValue * 0.5)) * 12).toFixed(1)} months` : nc}
### Aggressive Scenario (150% of projected value)
- Annual Value: ${valueComputed ? `$${fmt(Math.round(totalValue * 1.5))}` : nc}
- ROI: ${valueComputed ? `${Math.round(((totalValue * 1.5 - investment) / investment) * 100)}%` : nc}
- Payback: ${valueComputed ? `${((investment / (totalValue * 1.5)) * 12).toFixed(1)} months` : nc}

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

1. **Validate assumptions** - Schedule discovery to confirm metrics
2. **Customize calculations** - Adjust with customer-provided data
3. **Build executive presentation** - Create 1-page summary for CFO
4. **Identify champions** - Find stakeholders who benefit from ROI

---

## One-Page Executive Summary

### Why ${yourSolution} for ${customerName}

**The Problem:**
${currentProcess ? currentProcess : 'Current process creates inefficiencies, costs, and risks that impact business performance.'}

**The Solution:**
${yourSolution} addresses these challenges through [key capabilities].

**The Value:**
${valueComputed ? `${EXAMPLES}
- **$${fmt(totalValue)}** in annual value
- **${roi.toFixed(0)}%** ROI
- **${paybackMonths.toFixed(1)} months** payback` : `- ${NOT_COMPUTED}`}

**Why Now:**
- [Why this customer should act now, for example competitive pressure, if it applies]
- Cost of delay: ${valueComputed ? `$${fmt(Math.round(totalValue / 12))}/month ${EXAMPLE}` : nc}
- Implementation timeline: ${timelineText}

---

*Confidence: ${confidenceLevel.toLowerCase()}. The value figures rest on example assumptions until you replace them with customer-provided metrics.*
*Recommend validation with customer-provided metrics*

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
            'Reference calls with similar customers'
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
    return `# 🤝 Mutual Action Plan: ${dealName}

## Overview

| Item | Detail |
|------|--------|
| **Opportunity** | ${dealName} |
| **Target Close Date** | ${formatDate(closeDate)}${targetCloseDate ? '' : ` (${NOT_SUPPLIED}: example date)`} |
| **Days Until Close** | ${daysUntilClose} days${targetCloseDate ? '' : ` ${EXAMPLE}`} |
| **Current Stage** | ${currentStage.replace(/_/g, ' ')} |
| **Solution** | ${args.your_solution || NOT_SUPPLIED} |

---

## Key Stakeholders

### Buyer Team
| Role | Name | Engagement |
|------|------|------------|
| **Champion** | ${buyerChampion || '⚠️ TBD - Need to identify'} | ${buyerChampion ? '✅ Engaged' : '🔴 Not identified'} |
| **Economic Buyer** | ${economicBuyer || '⚠️ TBD - Need to identify'} | ${economicBuyer ? '⚠️ Needs engagement' : '🔴 Not identified'} |
| **Technical Evaluator(s)** | ${technicalEvaluators || '⚠️ TBD'} | ${technicalEvaluators ? '✅ In evaluation' : '🔴 Not identified'} |
| **Procurement** | ${procurementContact || '⚠️ TBD'} | ${procurementContact ? '⚠️ Not yet engaged' : '🔴 Not identified'} |

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
| 🔴 High | [Core requirement] | ⏳ Pending |
| 🔴 High | [Core requirement] | ⏳ Pending |
| 🟡 Medium | [Important feature] | ⏳ Pending |
| 🟢 Low | [Nice to have] | ⏳ Pending |

---

## Mutual Action Plan Timeline

### Phase 1: Current Stage - ${currentStage.replace(/_/g, ' ')} (Now - ${formatDate(week2)})

| # | Milestone | Owner | Due Date | Status |
|---|-----------|-------|----------|--------|
${currentMilestones.map((m, i) => `| ${i + 1} | ${m} | ${i % 2 === 0 ? buyerChampion || 'Buyer' : 'Seller'} | ${formatDate(i < 2 ? week1 : week2)} | ⏳ |`).join('\n')}

**Key Questions to Answer:**
${knownProcessSteps ? `- Based on process: ${knownProcessSteps}` : `
- Who else needs to be involved in evaluation?
- What's the approval process after evaluation?
- Are there competing priorities that could delay this?`}

---

### Phase 2: Business Case & Alignment (${formatDate(week2)} - ${formatDate(weekMinus3)})

| # | Milestone | Owner | Due Date | Status |
|---|-----------|-------|----------|--------|
| 5 | Present business case to ${economicBuyer || 'economic buyer'} | Seller + ${buyerChampion || 'Champion'} | ${formatDate(weekMinus3)} | ⏳ |
| 6 | Align on ROI and success metrics | Both | ${formatDate(weekMinus3)} | ⏳ |
| 7 | Finalize scope and pricing | Seller | ${formatDate(weekMinus3)} | ⏳ |
| 8 | Reference calls completed | ${buyerChampion || 'Buyer'} | ${formatDate(weekMinus3)} | ⏳ |

**Deliverables:**
- [ ] Executive presentation
- [ ] ROI calculator with customer data
- [ ] Reference customer list
- [ ] Draft proposal

---

### Phase 3: Commercial & Legal (${formatDate(weekMinus3)} - ${formatDate(weekMinus1)})

| # | Milestone | Owner | Due Date | Status |
|---|-----------|-------|----------|--------|
| 9 | Commercial terms agreed | Both | ${formatDate(weekMinus2)} | ⏳ |
| 10 | Legal review initiated | ${procurementContact || 'Procurement'} | ${formatDate(weekMinus2)} | ⏳ |
| 11 | Security/compliance review complete | Buyer IT | ${formatDate(weekMinus1)} | ⏳ |
| 12 | All redlines resolved | Both | ${formatDate(weekMinus1)} | ⏳ |

**Documentation Required:**
- [ ] Master service agreement
- [ ] Order form
- [ ] SLA/support terms
- [ ] Security questionnaire
- [ ] DPA (if applicable)

---

### Phase 4: Close & Launch (${formatDate(weekMinus1)} - ${formatDate(closeDate)})

| # | Milestone | Owner | Due Date | Status |
|---|-----------|-------|----------|--------|
| 13 | Final approvals obtained | ${economicBuyer || 'Economic Buyer'} | ${formatDate(weekMinus1)} | ⏳ |
| 14 | Contract signed | Both | ${formatDate(closeDate)} | ⏳ |
| 15 | Implementation kickoff scheduled | Both | ${formatDate(closeDate)} | ⏳ |
| 16 | Success criteria documented | Seller | ${formatDate(closeDate)} | ⏳ |

---

## Risks & Blockers

${blockers ? `### Known Blockers
${blockers}

**Mitigation Plan:**
| Blocker | Mitigation | Owner | Status |
|---------|------------|-------|--------|
| [Blocker 1] | [Mitigation approach] | [Owner] | ⏳ |
| [Blocker 2] | [Mitigation approach] | [Owner] | ⏳ |
` : '### Potential Risks\n- Budget timing/availability\n- Competing priorities\n- Stakeholder alignment\n- Technical integration complexity'}

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
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
| 🔴 | ${!buyerChampion ? 'Identify and confirm champion' : 'Confirm next steps with champion'} | AE | ${formatDate(week1)} |
| 🔴 | ${!economicBuyer ? 'Identify economic buyer' : 'Schedule economic buyer meeting'} | AE | ${formatDate(week1)} |
| 🟡 | Share this MAP with buyer champion | AE | ${formatDate(today)} |
| 🟡 | Validate timeline and milestones | Both | ${formatDate(week1)} |

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
    if (analysisType === 'single_deal') {
        // Single deal analysis
        let analysis = `# 📊 Win/Loss Analysis: Single Deal

## Deal Overview

| Attribute | Value |
|-----------|-------|
| **Outcome** | ${dealOutcome ? dealOutcome.charAt(0).toUpperCase() + dealOutcome.slice(1) : 'Not specified'} |
| **Deal Value** | ${dealValue ? '$' + dealValue.toLocaleString('en-US') : 'Not specified'} |
| **Sales Cycle** | ${salesCycleDays ? salesCycleDays + ' days' : 'Not specified'} |
| **Solution** | ${args.your_solution || 'Not specified'} |
${competitorWon ? `| **Competitor Won** | ${competitorWon} |` : ''}
${lossReason ? `| **Stated Reason** | ${lossReason} |` : ''}

---

`;
        if (dealOutcome === 'won') {
            analysis += `## Win Analysis 🎉

### Why We Won (Hypothesis)

Based on the deal information, likely success factors:

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
            analysis += `## Loss Analysis 📉

### Why We Lost (Hypothesis)

${lossReason ? `**Stated Reason:** ${lossReason}` : '**Stated Reason:** Not provided'}

**Common Root Causes to Investigate:**

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

### Loss Categories

| Category | Likelihood | Investigation Needed |
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
            analysis += `## No-Decision Analysis ⏸️

### Why No Decision Happened

**Common Causes:**
1. **No compelling event** - Status quo was acceptable
2. **Champion failure** - No one willing to drive change
3. **Budget reallocation** - Priorities shifted
4. **Risk aversion** - Fear of change or failure
5. **Evaluation fatigue** - Too long, lost momentum

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
        analysis += `
---

## Deal Details Analysis

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
| Did we have an executive sponsor? | ❓ |
| Was economic buyer engaged? | ❓ |
| Did we multi-thread? | ❓ |
| Was there a true champion? | ❓ |` : '### Stakeholder Information Needed\n\nFor better analysis, provide:\n- Names and titles\n- Their positions on the deal\n- Engagement level\n- Who we didn\'t reach'}

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
        return `# 📊 Deal Portfolio Analysis

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
        return `# 📊 Competitive Win/Loss Analysis

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
    const discountedValue = dealValue - (dealValue * discountRequested / 100);
    const revenueAtRisk = dealValue * discountRequested / 100;
    // Display text (output only; the figures above are unchanged)
    const dealValueText = hasValue(args.deal_value) ? `$${dealValue.toLocaleString('en-US')}` : NOT_SUPPLIED;
    const bothPricingInputs = hasValue(args.deal_value) && hasValue(args.discount_requested);
    const pricingNotComputed = 'not computed: needs deal value and discount';
    const valueReframe = !valueDelivered
        ? `
"Before we discuss price, let's revisit the value we identified:
- [Value point 1]
- [Value point 2]
- [Value point 3]

At ${hasValue(args.deal_value) ? dealValueText : '[deal value]'}, that's an X:1 return on investment."`
        : dealValue
            ? `
You supplied this value: ${valueDelivered}. The example below does not use it: it assumes an example value instead. Replace these figures with your own.
- If value is $${(dealValue * 3).toLocaleString('en-US')}, price is only ${Math.round(100 / 3)}% of first-year value ${EXAMPLE}
- ROI of ${Math.round((dealValue * 3 - dealValue) / dealValue * 100)}% in year one ${EXAMPLE}`
            : `
You supplied this value: ${valueDelivered}. Add the deal value to compare the price with that value.`;
    const scenarioGuides = {
        discount_request: () => `# 💰 Pricing Negotiation Guide: Discount Request

## Situation Analysis

| Factor | Value |
|--------|-------|
| **Deal Value** | ${dealValueText} |
| **Discount Requested** | ${hasValue(args.discount_requested) ? `${discountRequested}%` : NOT_SUPPLIED} |
| **Revenue at Risk** | ${bothPricingInputs ? `$${revenueAtRisk.toLocaleString('en-US')}` : pricingNotComputed} |
| **Post-Discount Value** | ${bothPricingInputs ? `$${discountedValue.toLocaleString('en-US')}` : pricingNotComputed} |
| **Decision Timeline** | ${decisionTimeline || 'Not specified'} |
| **Approval Authority** | ${approvalAuthority || 'Not specified'} |

---

## Leverage Assessment

### Your Leverage
${yourLeverage ? yourLeverage : `
- Unique capabilities they need
- Time pressure (implementation timeline)
- Switching costs from current state
- Champions already invested
- Executive relationships`}

### Their Leverage
${buyerLeverage ? buyerLeverage : `
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
| What They Want | What You Get |
|----------------|--------------|
| 10% discount | 3-year commitment (vs 1-year) |
| 15% discount | Payment upfront (vs net 30) |
| 10% discount | Case study + reference rights |
| 5% discount | Expanded scope (more users/seats) |
| Volume discount | Multi-year deal + price lock |

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
- "We've already priced this competitively. What specifically is the concern?"
- "What would need to happen for our current pricing to work?"

### "Your competitor is 20% cheaper" ${EXAMPLE}

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

1. **Document the ask** - Why, how much, what we get
2. **Show your work** - What you've tried
3. **Make a recommendation** - Not just "they want X%"
4. **Get approval before offering** - Never surprise leadership`,
        budget_objection: () => `# 💰 Budget Objection Handling

## The Objection: "We don't have budget"

### Diagnose the Real Issue

**Question 1:** "Is this not in the current budget, or are you saying this won't be prioritized?"

**Question 2:** "If budget wasn't a constraint, would this be something you'd move forward with?"

**Question 3:** "How do priorities get funded outside of normal budget cycles?"

---

## Response Strategies

### Strategy 1: Find Hidden Budget

"Most companies have discretionary funds for high-impact initiatives. Who would have authority over those funds?"

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

1. **Lock in pricing** - "We can hold this pricing until [date]"
2. **Secure commitment** - "If we do this, will you move forward?"
3. **Stay engaged** - Monthly check-in until budget cycle
4. **Create urgency** - "Pricing is increasing next quarter" (say this only if it is true)`,
        competitor_pricing: () => `# 💰 Competitor Pricing Response

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
- Per-user/seat pricing
- Overage charges
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
        procurement_pressure: () => `# 💰 Procurement Negotiation Guide

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
- Scope/seats
- Services included
- Renewal terms`,
        renewal_negotiation: () => `# 💰 Renewal Negotiation Guide

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
- More users/seats
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

"Since we're discussing renewal, I wanted to share what other customers like you are doing with [additional product/tier]. Would you like to see how that could benefit you?"`,
        multi_year_negotiation: () => `# 💰 Multi-Year Deal Negotiation

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
        enterprise_agreement: () => `# 💰 Enterprise Agreement Negotiation

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
- "We know you're evaluating alternatives. Here's what makes us different..."
- "I'm confident our value justifies the investment. Let me show you why."

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
    const assetGenerators = {
        executive_brief: () => `# Executive Brief for ${targetStakeholder}

## Prepared for: ${championName}${championRole ? ` (${championRole})` : ''}
## Topic: ${yourSolution}

---

### The Opportunity

[1-2 sentence summary of what this enables for the business]

${keyValuePoints ? `**Key Benefits:**\n${keyValuePoints.split(/\n|,(?!\d{3}(?!\d))/).map(p => `- ${p.trim()}`).join('\n')}` : '**Key Benefits:**\n- Improved efficiency\n- Reduced costs\n- Better outcomes\n- Competitive advantage'}

### The Business Case

**Problem:**
[Current state challenges - what's not working]

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

${keyValuePoints ? `\n**Value Summary:**\n${keyValuePoints.split(/\n|,(?!\d{3}(?!\d))/).map(p => `- ${p.trim()}`).join('\n')}\n` : ''}

---

## Current State

### Challenges
- [Challenge 1 - describe current pain]
- [Challenge 2 - describe current pain]
- [Challenge 3 - describe current pain]

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
${competitiveContext ? `We evaluated alternatives including ${competitiveContext}. We recommend ${yourSolution} because [reasons].` : 'After evaluating alternatives, this solution best fits our requirements.'}

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
| [Benefit 1] | $XX,XXX |
| [Benefit 2] | $XX,XXX |
| [Benefit 3] | $XX,XXX |
| **Total Annual Value** | $XXX,XXX |

### ROI Analysis
- **ROI:** XXX%
- **Payback:** X months
- **3-Year Net Value:** $X,XXX,XXX ${EXAMPLE}

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

## Recommendation

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

${knownObjections ? `## Anticipated Objections\n\n${knownObjections.split(/\n|,(?!\d{3}(?!\d))/).map(obj => `
### Objection: "${obj.trim()}"

**Response:**
[Prepared response addressing this specific concern]

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
- Reference customer stories

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

1. **Listen first** - Understand the real concern
2. **Acknowledge** - Show you heard them
3. **Respond with evidence** - Not just opinion
4. **Check for understanding** - "Does that address your concern?"
5. **Offer next step** - Keep momentum

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
3. Trend: "This is getting worse because [reason]"

**Transition:**
"There is a solution that addresses all of this."

---

## The Solution (4 minutes)

**Introduction:**
"${yourSolution} helps us [primary benefit]."

**Key Capabilities:**
${keyValuePoints ? keyValuePoints.split(/\n|,(?!\d{3}(?!\d))/).map((p, i) => `${i + 1}. ${p.trim()}`).join('\n') : '1. [Capability 1]\n2. [Capability 2]\n3. [Capability 3]'}

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
${knownObjections ? knownObjections.split(/\n|,(?!\d{3}(?!\d))/).map(o => `- "${o.trim()}" → [Your response]`).join('\n') : '- Budget questions → Point to ROI\n- Timeline questions → Show implementation plan\n- Risk questions → Discuss mitigation'}

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
${keyValuePoints ? keyValuePoints.split(/\n|,(?!\d{3}(?!\d))/).map(p => `- ${p.trim()}`).join('\n') : '- [Benefit 1]\n- [Benefit 2]\n- [Benefit 3]'}

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
| Implementation | Included |

---

### Value Creation

| Benefit | Annual Value | Source |
|---------|--------------|--------|
${keyValuePoints ? keyValuePoints.split(/\n|,(?!\d{3}(?!\d))/).map(p => `| ${p.trim()} | $XX,XXX | [Source] |`).join('\n') : '| Efficiency gains | $XX,XXX | Time savings |\n| Cost reduction | $XX,XXX | Eliminated spend |\n| Revenue impact | $XX,XXX | Improved outcomes |'}
| **Total Value** | **$XXX,XXX** | - |

---

### ROI Analysis

| Metric | Value |
|--------|-------|
| **ROI** | XXX% |
| **Payback** | X months |
| **3-Year NPV** | $X.XM ${EXAMPLE} |

---

### Why Now

${urgencyDrivers ? urgencyDrivers : '- Market opportunity window\n- Competitive pressure\n- Cost of delay: $X/month'}

---

### Recommendation

✅ **Approve investment in ${yourSolution}**

---

*Contact: ${championName}${championRole ? `, ${championRole}` : ''}*`,
        competitive_comparison: () => `# Competitive Comparison

## ${yourSolution} vs Alternatives

### Prepared for: ${targetStakeholder}
### By: ${championName}

---

## Evaluation Summary

${competitiveContext ? `We evaluated: ${competitiveContext}` : 'We evaluated multiple alternatives.'}

**Recommendation:** ${yourSolution}

---

## Comparison Matrix

*Example ratings (not from your input): replace every rating with the results of your own evaluation.*

| Criteria | ${yourSolution} | Alternative A | Alternative B |
|----------|-----------------|---------------|---------------|
| **Capability Fit** | ✅ Full | ⚠️ Partial | ⚠️ Partial |
| **Integration** | ✅ Easy | ⚠️ Complex | ⚠️ Complex |
| **Implementation** | ✅ Fast | ⚠️ Slow | ❌ Very slow |
| **Support** | ✅ Premium | ⚠️ Standard | ❌ Limited |
| **Total Cost (3yr)** | $XXX,XXX | $XXX,XXX | $XXX,XXX |
| **Risk** | Low | Medium | High |

---

## Why ${yourSolution}

${keyValuePoints ? `### Key Advantages:\n${keyValuePoints.split(/\n|,(?!\d{3}(?!\d))/).map(p => `- ✅ ${p.trim()}`).join('\n')}` : '### Key Advantages:\n- Better fit for our needs\n- Lower total cost of ownership\n- Faster time to value\n- Lower risk'}

---

## What Others Are Missing

[Alternative A]: Missing [key capability]
[Alternative B]: Missing [key capability]

---

## Recommendation

Based on comprehensive evaluation, ${yourSolution} is the best choice for [our organization].

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

**Risk of inaction exceeds risk of action.**

---

## Conclusion

While implementation has some risks, all are manageable with proper planning. The risk of NOT proceeding is higher than proceeding.

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
    const buyerPersona = args.buyer_persona || 'decision maker';
    const trapType = args.trap_type || 'all';
    const sections = {
        discovery_questions: `## Discovery Questions (Landmines)

These questions help surface ${competitor}'s weaknesses without being negative:

### General Competitive Discovery
- "What other solutions are you evaluating, and what criteria are you using?"
- "What's most important to you in making this decision?"
- "Have you defined must-haves vs nice-to-haves?"

### Capability Landmines
${competitorWeaknesses ? `Based on ${competitor}'s known weaknesses:\n${competitorWeaknesses.split(/\n|,(?!\d{3}(?!\d))/).map(w => `
**Weakness:** ${w.trim()}
**Landmine Question:** "How important is [area] to your evaluation? Can you show me how [competitor] handles this specific scenario?"
**Why It Works:** When they test ${competitor} on this, they'll discover the gap.
`).join('\n')}` : `
- "Can you walk me through how you'd handle [scenario where they're weak]?"
- "What happens when [edge case they can't handle]?"
- "How do you expect to scale [area where they struggle]?"`}

### Implementation Landmines
- "What's their typical implementation timeline? Have you talked to customers about actual vs promised?"
- "Who from their team will be involved in implementation?"
- "What's included in the price vs what costs extra?"

### Support Landmines
- "What level of support is included? What happens when you have an urgent issue?"
- "Can you talk to customers who've been through their support process?"
- "What's their track record on SLAs?"`,
        evaluation_criteria: `## Evaluation Criteria Positioning

### Criteria to Establish Early

${yourStrengths ? `Based on your strengths (${yourStrengths}), establish these as requirements:\n${yourStrengths.split(/\n|,(?!\d{3}(?!\d))/).map(s => `
- **${s.trim()}**: "Most successful implementations we've seen require [capability]. Is this in your evaluation criteria?"
`).join('')}` : `
**Capability Criteria:**
- "[Your unique capability]" - "We've found this is critical for [outcome]. Is this on your list?"
- "[Another differentiator]" - "Without this, organizations often struggle with [problem]."

**Risk Criteria:**
- "Vendor stability/longevity" - "How are you evaluating vendor risk?"
- "Customer references in your industry" - "Will you be talking to customers like you?"`}

### Criteria Framework to Suggest

| Priority | Criteria | Why It Matters | Questions to Ask All Vendors |
|----------|----------|----------------|------------------------------|
| 🔴 Must Have | [Your strength] | [Business reason] | "How do you handle [scenario]?" |
| 🔴 Must Have | [Your strength] | [Business reason] | "Show me [proof]" |
| 🟡 Important | [Your strength] | [Business reason] | "What's your approach to [area]?" |
| 🟢 Nice to Have | [Neutral area] | [Business reason] | "Do you support [feature]?" |

### How to Suggest Criteria

"Before you evaluate anyone, I'd recommend defining your criteria. In my experience, the most successful projects prioritize:
1. [Your strength area]
2. [Your strength area]
3. [Your strength area]

Would it be helpful if I shared what questions other customers ask vendors?"`,
        reference_questions: `## Reference Call Questions

Suggest the buyer ask these questions when speaking with ${competitor}'s references:

### General Questions
- "How long have you been using the solution?"
- "How does the actual experience compare to what was promised during sales?"
- "What surprised you after implementation?"

### Capability Questions
${competitorWeaknesses ? competitorWeaknesses.split(/\n|,(?!\d{3}(?!\d))/).map(w => `- "How do you handle ${w.trim().toLowerCase()}? Does the tool support this well?"`).join('\n') : `- "What limitations have you encountered?"
- "What do you wish the tool did that it doesn't?"
- "What workarounds have you had to build?"`}

### Implementation Questions
- "How long did implementation actually take?"
- "What was harder than expected?"
- "What would you do differently?"

### Support Questions
- "How responsive is their support team?"
- "Tell me about a time you had an urgent issue. How was it handled?"
- "Do you feel like a priority to them?"

### The Killer Question
- **"Knowing what you know now, would you choose them again?"**

### How to Position Reference Calls

"References are important. Make sure to ask about [area where competitor struggles]. I've heard mixed feedback about their [weakness area]." (say the last sentence only if you have heard such feedback)`,
        technical_requirements: `## Technical Requirements (Traps)

### RFP/Requirements Document

Include these requirements that favor your strengths:

${yourStrengths ? `
**Based on Your Strengths:**
${yourStrengths.split(/\n|,(?!\d{3}(?!\d))/).map((s, i) => `
${i + 1}. **${s.trim()}**
   - Requirement language: "Solution must demonstrate [specific capability] with [specific proof point]"
   - Evaluation: "Vendor must show live demonstration of [scenario]"
`).join('')}` : `
**Technical Requirements:**
1. "Solution must integrate with [your strong integration]"
2. "Solution must support [your unique capability]"
3. "Solution must demonstrate [your differentiator] in POC"`}

### POC/Pilot Scenarios

Design evaluation scenarios that highlight competitor weaknesses:

${competitorWeaknesses ? `
**Scenarios Based on Weaknesses:**
${competitorWeaknesses.split(/\n|,(?!\d{3}(?!\d))/).map((w, i) => `
**Scenario ${i + 1}:** Test ${w.trim().toLowerCase()}
- Task: "[Specific task that requires this capability]"
- Success criteria: "[Measurable outcome]"
- Why: ${competitor} will struggle with this
`).join('')}` : `
**Example Scenarios:**
1. "[Scenario you handle well]" - Test core capability
2. "[Edge case you handle]" - Test flexibility
3. "[Scale scenario]" - Test performance`}

### Security/Compliance Requirements

If you're stronger in security/compliance:
- "Solution must be [certification you have]"
- "Vendor must demonstrate [compliance requirement]"
- "Security questionnaire must include [area where you're strong]"`,
        commercial_terms: `## Commercial Terms (Positioning)

### Pricing Comparisons

When they compare prices, ensure they compare:
- Total cost of ownership (not just license)
- Implementation costs
- Training costs
- Support tiers
- Future growth costs

**Questions to Ask ${competitor}:**
- "What's NOT included in the quoted price?"
- "What does Year 2 and 3 pricing look like?"
- "What are the overage charges?"
- "What support level is included?"

### Contract Terms to Highlight

Ask these about ${competitor}'s contract (nothing here says ${competitor} has these terms; check the actual contract):
- Does it auto-renew, and can the price rise at renewal?
- What are the termination rights and notice periods?
- Are there fees outside the quoted price?
- Are there usage limits or restrictions?

**Ask:**
- "What's the notice period for changes?"
- "How are price increases determined?"
- "What happens if our needs change?"

### Payment Structure

If you offer better terms:
- "We offer [monthly/quarterly] payment options"
- "No long-term commitment required"
- "Price protection guaranteed"

Ask ${competitor}:
- "What payment options do you offer?"
- "Is there flexibility on contract length?"
- "Can we start smaller and expand?"`
    };
    let output = `# 🎯 Competitive Positioning: vs ${competitor}

## Situation
- **Competitor:** ${competitor}
- **Your Solution:** ${yourSolution}
- **Evaluation Stage:** ${evaluationStage}
- **Buyer Persona:** ${args.buyer_persona || NOT_SUPPLIED}
${buyerPriorities ? `- **Buyer Priorities:** ${buyerPriorities}` : ''}

---

## Competitive Intelligence

### Your Strengths
${yourStrengths ? yourStrengths.split(/\n|,(?!\d{3}(?!\d))/).map(s => `- ✅ ${s.trim()}`).join('\n') : '- [Define your key differentiators]'}

### ${competitor} Weaknesses
${competitorWeaknesses ? competitorWeaknesses.split(/\n|,(?!\d{3}(?!\d))/).map(w => `- ❌ ${w.trim()}`).join('\n') : '- [Research competitor weaknesses]'}

---

## Positioning Strategy

### Golden Rule
**Never go negative.** Let the buyer discover competitor weaknesses through their own evaluation.

### Your Approach
1. Establish evaluation criteria that favor your strengths
2. Ask questions that expose competitor weaknesses
3. Provide proof points for your differentiators
4. Help buyer ask the right questions

---

`;
    if (trapType === 'all') {
        output += sections['discovery_questions'] + '\n\n---\n\n';
        output += sections['evaluation_criteria'] + '\n\n---\n\n';
        output += sections['reference_questions'] + '\n\n---\n\n';
        output += sections['technical_requirements'] + '\n\n---\n\n';
        output += sections['commercial_terms'];
    }
    else {
        output += sections[trapType] || sections['discovery_questions'];
    }
    output += `

---

## Stage-Specific Tactics

### ${evaluationStage} Stage Recommendations

${evaluationStage === 'early' ? `
**Early Stage - Shape the Evaluation**
- Establish evaluation criteria now
- Position your strengths as requirements
- Plant seeds of doubt about alternatives
- Offer to help them structure the evaluation` : ''}

${evaluationStage === 'mid' ? `
**Mid Stage - Differentiate**
- Ensure your differentiators are being tested
- Provide proof points and references
- Surface competitor limitations through questions
- Build champion with competitive ammo` : ''}

${evaluationStage === 'late' ? `
**Late Stage - Close Strong**
- Address any lingering concerns
- Reinforce differentiators
- Ensure decision criteria favor you
- Help champion make the case internally` : ''}

${evaluationStage === 'finalist' ? `
**Finalist Stage - Win**
- Focus on risk mitigation
- Provide executive access
- Offer commercial flexibility
- Close with confidence` : ''}

---

## Do's and Don'ts

✅ **Do:**
- Ask questions that expose weaknesses
- Let them discover issues through testing
- Provide proof for your claims
- Be helpful and consultative

❌ **Don't:**
- Trash talk the competitor
- Make claims you can't prove
- Ignore competitor strengths
- Be defensive

---

*Use these tactics professionally and honestly*`;
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
    // Tone adjustments
    const toneStyles = {
        formal: {
            opening: 'We are pleased to present',
            language: 'professional and structured'
        },
        consultative: {
            opening: 'Based on our conversations',
            language: 'partnership-oriented'
        },
        bold: {
            opening: 'The opportunity before you',
            language: 'confident and direct'
        },
        conservative: {
            opening: 'We respectfully submit',
            language: 'measured and thorough'
        }
    };
    const toneStyle = toneStyles[tone] || toneStyles['consultative'];
    // Section generators
    const sections = {
        executive_summary: () => `# Executive Summary

## Proposal for ${customerName}

${toneStyle.opening}, this proposal outlines how ${yourSolution} will help ${customerName} address the challenges we've discussed and achieve meaningful business outcomes.

### The Opportunity

${customerChallenges ? `Through our discovery conversations, we identified several key challenges:\n\n${customerChallenges.split(/\n|,(?!\d{3}(?!\d))/).map(c => `- ${c.trim()}`).join('\n')}` : `${customerName} is seeking to improve operational efficiency, reduce costs, and drive growth. Our conversations have revealed opportunities to create significant value through ${yourSolution}.`}

### Our Recommendation

${yourSolution} provides ${customerName} with a comprehensive solution that:

${keyDifferentiators ? keyDifferentiators.split(/\n|,(?!\d{3}(?!\d))/).map(d => `- **${d.trim()}**`).join('\n') : `- Addresses your core business challenges\n- Delivers measurable ROI\n- Integrates with your existing systems\n- Scales with your growth`}

### Expected Outcomes

${successMetrics ? successMetrics : `Within 12 months of implementation ${EXAMPLE}, ${customerName} can expect:\n\n- Improved operational efficiency\n- Reduced costs and complexity\n- Enhanced visibility and control\n- Foundation for future growth`}

### Investment Overview

${pricing ? `Investment: ${pricing}` : 'Detailed pricing is outlined in the Investment section of this proposal.'}

### Why ${yourSolution}

${keyDifferentiators ? `We are uniquely positioned to deliver this value because:\n\n${keyDifferentiators.split(/\n|,(?!\d{3}(?!\d))/).map(d => `- ${d.trim()}`).join('\n')}` : `We bring [your relevant expertise], [your track record, with evidence] and [your commitment to their success].`}

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

${customerChallenges ? `Based on our discovery conversations, ${customerName} is facing several interconnected challenges:\n\n${customerChallenges.split(/\n|,(?!\d{3}(?!\d))/).map((c, i) => `### Challenge ${i + 1}: ${c.trim()}\n\n**Impact:** This challenge is affecting your team's ability to perform at their best, creating inefficiencies, and potentially impacting revenue.\n\n**Root Cause:** Our analysis suggests this stems from [process gaps / technology limitations / resource constraints].\n\n**Cost of Inaction:** Without addressing this, ${customerName} risks [specific consequences].\n`).join('\n')}` : `Through our conversations with your team, we've developed a deep understanding of the challenges you're facing:\n\n### Operational Complexity\nYour current processes require significant manual effort, creating bottlenecks and increasing the risk of errors.\n\n### Visibility Gaps\nWithout real-time insights, decision-making is delayed and often based on incomplete information.\n\n### Scalability Constraints\nAs ${customerName} grows, current systems and processes may not scale effectively.\n\n### Competitive Pressure\nThe market is evolving rapidly, and staying ahead requires modern tools and approaches.`}

## The Cost of the Current State

| Impact Area | Current Cost | Opportunity |
|-------------|--------------|-------------|
| Time | [Hours spent on manual tasks] | [Hours saved] |
| Money | [Cost of inefficiency] | [Potential savings] |
| Risk | [Risk exposure] | [Risk reduction] |
| Growth | [Missed opportunities] | [Growth enablement] |

## What Success Looks Like

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

${yourSolution} provides a comprehensive platform that addresses each of the challenges we've discussed:

#### Core Capabilities${keyDifferentiators ? '' : ' (example capabilities: replace them with your own)'}

${keyDifferentiators ? keyDifferentiators.split(/\n|,(?!\d{3}(?!\d))/).map((d, i) => `**${i + 1}. ${d.trim()}**\nDescription of how this capability solves specific customer challenges.\n`).join('\n') : `**1. Automation & Efficiency**\nEliminate manual processes and streamline workflows.\n\n**2. Real-Time Visibility**\nGain instant access to insights that drive better decisions.\n\n**3. Scalable Architecture**\nGrow without constraints or performance degradation.\n\n**4. Integration Ecosystem**\nConnect seamlessly with your existing technology stack.`}

### How It Works

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
| ${customerChallenges?.split(/\n|,(?!\d{3}(?!\d))/)[0]?.trim() || '[Challenge 1]'} | [Feature A] | [Outcome 1] |
| ${customerChallenges?.split(/\n|,(?!\d{3}(?!\d))/)[1]?.trim() || '[Challenge 2]'} | [Feature B] | [Outcome 2] |
| ${customerChallenges?.split(/\n|,(?!\d{3}(?!\d))/)[2]?.trim() || '[Challenge 3]'} | [Feature C] | [Outcome 3] |

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

${pricing ? `### Investment Summary\n\n${pricing}` : `### Investment Summary\n\n| Component | Investment |\n|-----------|------------|\n| Platform License | $XX,XXX/year |\n| Implementation | $XX,XXX |\n| Training | Included |\n| Support | Included |`}

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

For every dollar invested in ${yourSolution}, ${customerName} can expect to receive $X in value, making this a highly favorable investment.

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

*Investment assumes standard scope. Custom pricing available for specific requirements.*`,
        risk_mitigation: () => `# Risk Assessment & Mitigation

## Ensuring Success for ${customerName}

### Risk Categories

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

*We take risk seriously and invest in ensuring your success.*`,
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

We are committed to helping ${customerName} achieve these outcomes. Our success is measured by your success.

---

*Metrics will be finalized during implementation planning.*`,
        company_overview: () => `# About Us

## Your Partner for Success

### Who We Are

${yourSolution} is a provider of [solution category], trusted by [X+] companies to [core value proposition].

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

${keyDifferentiators ? keyDifferentiators.split(/\n|,(?!\d{3}(?!\d))/).map(d => `- ${d.trim()}`).join('\n') : `- [Your technology strength]\n- [Your domain expertise]\n- [Your methodology]\n- [Your support model]`}

### Industry Recognition

- [Award or recognition 1]
- [Award or recognition 2]
- [Award or recognition 3]

### Our Team

Your ${customerName} team includes:
- **Account Executive:** Your business advocate
- **Solutions Engineer:** Technical expertise
- **Customer Success Manager:** Ongoing partnership
- **Support Team:** [your support availability]

---

*We look forward to being your trusted partner.*`,
        case_studies: () => `# Customer Success Stories

## Companies Like ${customerName} Achieving Results

*Example case studies (not real customers): replace each one with a real customer story you have permission to share.*

### Example 1: [Similar Company in ${args.customer_industry ? customerIndustry : "the customer's industry"}]

**Challenge:**
Faced similar challenges to ${customerName} including ${customerChallenges?.split(/\n|,(?!\d{3}(?!\d))/)[0] || 'operational inefficiency'}.

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
Needed to address ${customerChallenges?.split(/\n|,(?!\d{3}(?!\d))/)[1] || 'scaling challenges'}.

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
${customerChallenges?.split(/\n|,(?!\d{3}(?!\d))/)[2] || 'Integration and visibility challenges'}.

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
We're happy to provide additional details, demos, or references.

**Option 3: Not Right Now**
We understand timing is important. Let's discuss what would make this the right time.

### Contact

**Your Account Team:**
- [Account Executive Name] - [email]
- [Solutions Engineer Name] - [email]

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
function pluralOf(persona) {
    const p = persona.trim();
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
    // Display text (output only): every template has a fixed number of emails, whatever num_emails says
    const emailsText = `${numEmails}${hasValue(args.num_emails) ? '' : ' (default)'}`;
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

## Target: ${targetPersona} ${targetIndustry ? `in ${targetIndustry}` : ''}
## Solution: ${yourSolution}
## Tone: ${toneInstructions[tone] || toneInstructions['professional']}
## Emails: ${emailsText}
${fixedLengthNote}

---

### Email 1: The Opening (Day 1)

**Subject Options:**
- Question about [their company's] [relevant initiative]
- Quick thought on ${specificPainPoint || '[pain point]'}
- [Mutual connection] suggested I reach out

**Body:**

Hi [First Name],

${senderContext ? `${senderContext}` : "I've been following [Company]'s [relevant news/initiative] and noticed [observation]."}

${specificPainPoint ? `Many ${pluralOf(targetPersona)} I talk to are struggling with ${specificPainPoint}. Is this something you're dealing with too?` : `Many ${pluralOf(targetPersona)} I speak with tell me [common pain point] is a top priority this year.`}

${keyValueProp ? keyValueProp : `We help companies like yours [key outcome].`}

${socialProof ? `For context: ${socialProof}` : ''}

Would it make sense to have a quick conversation about ${callToAction === 'meeting' ? 'how we might help' : callToAction}?

Best,
[Your name]

---

### Email 2: The Value Add (Day 3)

**Subject:** Re: [Previous subject] / Thought you'd find this useful

**Body:**

Hi [First Name],

Following up on my note from earlier this week.

I wanted to share [resource/insight/case study] that's been helpful for other ${pluralOf(targetPersona)} dealing with [challenge].

[1-2 sentence description of the value]

${socialProof ? `We've helped [reference] achieve [result].` : 'Would be happy to share how this might apply to your situation.'}

Worth a conversation?

[Your name]

---

### Email 3: The Social Proof (Day 7)

**Subject:** How [similar company] solved [problem]

**Body:**

Hi [First Name],

Wanted to share a quick story.

[Similar company] was facing [same challenge] - ${specificPainPoint || '[describe pain]'}.

After implementing ${yourSolution}, they achieved:
- [Result 1]
- [Result 2]
- [Result 3]

${tone === 'provocative' ? "I'm curious - is this something you've been thinking about, or is everything running smoothly?" : "I thought this might be relevant given what I know about [their company]."}

15 minutes to explore if this could work for you?

[Your name]

---

### Email 4: The Breakup Tease (Day 12)

**Subject:** Should I close your file?

**Body:**

Hi [First Name],

I've reached out a few times but haven't heard back. I totally get it - you're busy.

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

**Subject:** Great connecting - next steps on [topic]

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

**Subject:** Checking in - [topic]

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

Something I've seen with other ${pluralOf(targetPersona)} after a demo is wondering about [common concern - implementation, adoption, etc.].

[Proactively address the concern]

${socialProof ? socialProof : 'Happy to connect you with a customer who had similar concerns.'}

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

[Relevant urgency driver - pricing, availability, competitor news, etc.]

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

I noticed [trigger event - news, job change, company milestone].

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

Since then, we've [new capability/new customer/new result] that I thought would be relevant to your [challenge/initiative].

[Brief description of what's new]

${socialProof ? socialProof : ''}

Would it make sense to reconnect and catch up?

[Your name]

---

### Email 3: The Direct Ask

**Subject:** Still relevant?

**Body:**

Hi [First Name],

I don't want to keep reaching out if ${specificPainPoint || '[solving this challenge]'} isn't on your radar anymore.

Quick question: Is this still something you're thinking about, or should I check back at a different time?

Either way is fine - just want to respect your time.

[Your name]`
    };
    const generator = sequenceTemplates[sequenceType];
    if (generator) {
        return `${generator()}\n\n${SUGGESTIONS_FOOTER}`;
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

*Customize based on your specific situation and ${targetPersona} preferences*

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
    const mustShowFeatures = args.must_show_features || '';
    const knownObjections = args.known_objections || '';
    const desiredOutcome = args.desired_outcome || 'advance the deal';
    // Calculate time allocations
    const intro = Math.round(demoDuration * 0.15);
    const discovery = Math.round(demoDuration * 0.15);
    const demo = Math.round(demoDuration * 0.50);
    const discussion = Math.round(demoDuration * 0.15);
    const close = Math.round(demoDuration * 0.05);
    return `# 🎬 Demo Script: ${demoType.replace(/_/g, ' ')}

## Demo Configuration

| Element | Details |
|---------|---------|
| **Type** | ${demoType.replace(/_/g, ' ')} |
| **Primary Audience** | ${primaryAudience} |
| **Other Attendees** | ${attendees || 'TBD'} |
| **Industry** | ${customerIndustry || 'General'} |
| **Duration** | ${demoDuration} minutes${hasValue(args.demo_duration) ? '' : ' (default)'} |
| **Desired Outcome** | ${desiredOutcome} |

---

## Time Allocation

| Section | Time | Focus |
|---------|------|-------|
| Opening & Agenda | ${intro} min | Set expectations |
| Discovery/Confirm | ${discovery} min | Validate understanding |
| Solution Demo | ${demo} min | Show value |
| Discussion | ${discussion} min | Address questions |
| Close & Next Steps | ${close} min | Advance deal |

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

### Part 1: Opening (${intro} minutes)

**[0:00] Introduction**

"Thanks everyone for joining. I'm [Your name] and I'll be walking you through ${yourSolution} today.

Before I share my screen, I want to make sure we cover what's most important to you. [Turn to primary audience]: What would make this ${demoDuration} minutes valuable for you?"${hasValue(args.demo_duration) ? '' : ` ${EXAMPLE}`}

**[Wait for response - this shapes your demo]**

**[1:00] Agenda Setting**

"Perfect. Here's my plan for today:
1. Quick validation of what I've learned about your situation
2. Show you how ${yourSolution} addresses those specific needs
3. Leave time for questions and discussion
4. Agree on next steps

Does that work for everyone?"

---

### Part 2: Discovery Confirmation (${discovery} minutes)

**[${intro}:00] Validate Understanding**

"Before I show you anything, let me confirm what I've learned to make sure the demo is relevant:

${keyPainPoints ? `From our conversations, it sounds like:\n${keyPainPoints.split(/\n|,(?!\d{3}(?!\d))/).map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}\n\nDid I get that right? Anything to add?"` : `Based on what [champion] shared, it sounds like you're dealing with [pain points].\n\nDid I capture that correctly? What would you add?`}"

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

### Part 3: Solution Demo (${demo} minutes)

**[${intro + discovery}:00] Transition to Demo**

"Great, that confirms what I thought. Let me show you how ${yourSolution} addresses exactly those challenges. I'm going to share my screen..."

**[Share screen with demo environment]**

---

#### Demo Flow

${mustShowFeatures ? `**Must-Show Features:**
${mustShowFeatures.split(/\n|,(?!\d{3}(?!\d))/).map((f, i) => `${i + 1}. ${f.trim()}`).join('\n')}\n` : ''}

**Feature 1: [Address Pain Point 1]**

*Setup:*
"You mentioned [pain point]. Let me show you how we handle that..."

*Action:*
[Show the feature]

*Value Statement:*
"What this means for you is [business outcome]. [Customer example] saw [specific result] using this."

*Check-in:*
"How does this compare to how you're doing it today?"

---

**Feature 2: [Address Pain Point 2]**

*Setup:*
"Another thing you mentioned was [pain point]..."

*Action:*
[Show the feature]

*Value Statement:*
"This is typically where we see the biggest time/cost savings because [reason]." (Example claim: keep it only if your customer results support it)

*Check-in:*
"Does this address what you were looking for?"

---

**Feature 3: [Differentiator]**

*Setup:*
"This next part is what really sets us apart..."

*Action:*
[Show unique capability]

*Value Statement:*
"This is something our customers tell us they can't find elsewhere." (Example claim: keep it only if customers have told you this)

${competitorContext ? `\n*Competitive note:*\nIf competitor comes up: "Great question. The key difference is [differentiator]. Would you like me to show you specifically?"` : ''}

---

### Part 4: Discussion (${discussion} minutes)

**[${intro + discovery + demo}:00] Open for Questions**

"Let me stop sharing for a moment. What questions do you have about what you've seen?"

${knownObjections ? `**Anticipated Objections:**

${knownObjections.split(/\n|,(?!\d{3}(?!\d))/).map(o => `**Objection:** "${o.trim()}"
**Response:** [Prepared response]

`).join('')}` : `**Common Objections to Prepare For:**

**"How long does implementation take?"**
"Typically [timeframe]. Our methodology includes [your implementation steps]..."

**"What about integration with [system]?"**
"We have pre-built integrations with [systems]. Let me show you..."

**"What does pricing look like?"**
"I'd like to understand your needs better to give you accurate pricing. Generally..."

**"We need to think about it."**
"Absolutely. What specific aspects do you want to think through? Maybe I can help."`}

---

### Part 5: Close (${close} minutes)

**[${demoDuration - close}:00] Summarize & Close**

"Before we wrap up, let me summarize what we covered:
1. [Pain point 1] → ${yourSolution} addresses this with [feature]
2. [Pain point 2] → You'd get [outcome]
3. [Pain point 3] → This would help you [result]

**The Ask:**

${desiredOutcome === 'advance the deal' ? `
"Based on what you've seen, what would be helpful as a next step?

Options might be:
- Technical deep dive with your team
- Business case review
- Reference call with similar customer
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
exports.SERVER_VERSION = '1.2.2';
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
    const missing = required.filter((key) => args?.[key] === undefined || args?.[key] === null);
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
                        text: result,
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