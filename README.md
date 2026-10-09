# Revenue Enablement MCP v1.2.23
**Deal Strategy & Sales Enablement Engine**: 12 tools for sales execution, deal management, and revenue acceleration.

## Use it hosted (no install)

Add `https://revenue-enablement.gtmhelix.com/mcp` to Claude or ChatGPT as a custom connector. It needs no sign-in and always runs the newest version (1.2.23). The same tools run as a free web app with a form per tool at https://revenue-enablement.gtmhelix.com/, and the setup steps are at https://revenue-enablement.gtmhelix.com/connect/.

The npm package below is an older version (1.0.0 on npm on 27 September 2026) until the next npm release. Use it only if you need a local stdio server.


[![NPM Version](https://img.shields.io/npm/v/@shashwatgtmalpha/revenue-enablement-mcp)](https://www.npmjs.com/package/@shashwatgtmalpha/revenue-enablement-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)

## Quick Start

```bash
# Run directly with npx
npx -y @shashwatgtmalpha/revenue-enablement-mcp
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "revenue-enablement-mcp": {
      "command": "npx",
      "args": ["-y", "@shashwatgtmalpha/revenue-enablement-mcp"]
    }
  }
}
```

---

## Tools and inputs

Generated on 27 September 2026 from the server's own tool list, and checked again on 9 October 2026 against `tools/list` of revenue-enablement-mcp 1.2.23 (the same code as the hosted MCP address), so every tool name, title, description and input below is exactly what the server accepts. Every tool is read-only.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `account_plan_builder` | Account Plan Builder | Generate strategic account plans with power mapping (one row per contact you name), whitespace analysis, competitive questions and an answer for each objection. Builds a 90-day plan from the contacts, products, threats and notes you give it; it does not look the account up. |
| 2 | `deal_strategy_coach` | Deal Strategy Coach | Get deal-specific winning strategies based on deal stage, competitive dynamics, and stakeholder positions. Provides tactical next steps and risk mitigation. |
| 3 | `discovery_question_bank` | Discovery Question Bank | Writes a discovery question list from the framework you choose (MEDDPICC, BANT, SPICED, Challenger, Gap Selling or all five) and what you already know about the prospect. Returns an opening for the conversation, questions in the language of the prospect's sector and on what your solution covers, the questions for each part of the framework, a closing for the call and what to say to an objection. It uses only the inputs you give and says which it did not get. |
| 4 | `roi_business_case_builder` | ROI Business Case Builder | Build an ROI business case from the buyer's own figures: annual_value_estimate, or current_annual_cost with expected_improvement_percent. With them it calculates the ROI, payback, three-year value and sensitivity. Without them it shows no ROI: it names the inputs to add and gives the structure of the case (the cost lines to price, your quoted results as reference points, the questions to ask). |
| 5 | `mutual_action_plan_generator` | Mutual Action Plan Generator | Generate collaborative close plans with milestones, owners, and dates. Creates alignment between buyer and seller on path to decision. |
| 6 | `win_loss_analyzer` | Win/Loss Analyzer | Writes a short win/loss review of one deal, a competitor pattern or a set of deals from the details you give. Returns a write-up in plain sentences that names the outcome, the stated reason in the buyer's words, what the reason points to and what the buyer weighed, then the questions for the review call and sector notes. It adds no figure or reason you did not give, and says plainly what the outcome or reason would add when it is missing. |
| 7 | `proposal_section_writer` | Proposal Section Writer | Writes the proposal section you choose, such as an executive summary, solution overview or pricing justification, for a named buyer. Returns the section as sentences built from your solution, the buyer's challenges, your differentiators, pricing and success measures, with sector notes. It invents no figure, customer or date, and says once which inputs were not given. |
| 8 | `email_sequence_generator` | Email Sequence Generator | Writes a multi-email sequence by persona, stage and objective, such as prospecting, nurture, follow-up or re-engagement. Returns each email with its subject, send day and body, built from your solution, the pain point, the value proposition, your proof and the ask, and a note on what you did not give. No placeholder is left in a body, and no result or statistic is invented. |
| 9 | `demo_script_builder` | Demo Script Builder | Writes a demo script for the demo type, persona and use case you choose. Returns a timed run from opening to close, with spoken lines and a step for each feature you must show, tied to the pains you name, then discussion, close and follow-up lines and sector notes. The steps come from the parts of your solution and your pains, and the answer says where they came from and what it did not get. |
| 10 | `pricing_negotiation_guide` | Pricing Negotiation Guide | Get value-based pricing defense strategies and negotiation tactics. Helps maintain deal value while addressing discount requests. |
| 11 | `champion_enablement_kit` | Champion Enablement Kit | Writes an internal selling asset for your champion, such as an executive brief, an internal business case, objection responses or presentation talking points, built from your solution, the customer's situation and the objections you expect. Returns the asset in the champion's voice with the recommendation, the answers to likely questions, the decision requested, a note on the reader and sector notes. It invents no figure or quote. |
| 12 | `competitive_trap_setter` | Competitive Trap Setter | Writes landmine questions and positioning tactics against a named competitor, so the buyer's own criteria expose its weak points without negative selling. Returns the set-up, your strengths and the competitor's weak points as you gave them, discovery questions, criteria to establish, reference call questions, requirement and scenario traps, commercial terms and stage-specific tactics, with sector notes. Every line comes from your inputs and the sector, and none from an invented fact about the competitor. |

### Inputs of each tool

#### 1. Account Plan Builder (`account_plan_builder`)

| Input | Required | Type | Description |
|---|---|---|---|
| `account_name` | Yes | string | Company/account name |
| `industry` | No | string | Industry vertical |
| `current_arr` | No | number (0 or more) | Current ARR with this account (0 for prospects) |
| `known_contacts` | No | string | Known contacts and their roles (can be rough notes) |
| `current_products` | No | string | Products/services they currently use from you |
| `expansion_opportunities` | No | string | Potential expansion areas or whitespace |
| `competitive_threats` | No | string | Known competitors in the account |
| `your_solution` | No | string | Your product/service offering |
| `account_notes` | No | string | Any additional context about the account |

#### 2. Deal Strategy Coach (`deal_strategy_coach`)

| Input | Required | Type | Description |
|---|---|---|---|
| `deal_name` | Yes | string | Deal/opportunity name |
| `deal_stage` | Yes | one of: `prospecting`, `discovery`, `demo`, `proposal`, `negotiation`, `closing`, `stuck` | Current deal stage |
| `deal_value` | No | number (0 or more) | Deal value in dollars |
| `days_in_stage` | No | number (0 or more) | Days the deal has been in current stage |
| `champion_status` | No | one of: `no_champion`, `potential_champion`, `confirmed_champion`, `multi_threaded` | Champion identification status |
| `economic_buyer` | No | string | Economic buyer name and engagement level |
| `competitors` | No | string | Competitors in the deal and their position |
| `blockers` | No | string | Known blockers or objections |
| `next_steps` | No | string | Currently planned next steps |
| `close_date` | No | string | Target close date |
| `your_solution` | No | string | What you are selling |

#### 3. Discovery Question Bank (`discovery_question_bank`)

| Input | Required | Type | Description |
|---|---|---|---|
| `framework` | Yes | one of: `meddpicc`, `bant`, `spiced`, `challenger`, `gap_selling`, `all` | Discovery framework to use |
| `prospect_industry` | No | string | Prospect industry for context |
| `prospect_role` | No | string | Role of person you are meeting with |
| `known_pain_points` | No | string | Pain points already identified |
| `known_metrics` | No | string | Metrics/KPIs already discussed |
| `deal_stage` | No | one of: `first_call`, `discovery`, `deep_dive`, `technical`, `executive` | Stage of conversation |
| `your_solution` | No | string | Your product/solution for relevant questions |
| `gaps_to_fill` | No | string | Specific information gaps to address |

#### 4. ROI Business Case Builder (`roi_business_case_builder`)

| Input | Required | Type | Description |
|---|---|---|---|
| `your_solution` | Yes | string | Your product/solution |
| `primary_value_driver` | Yes | one of: `revenue_increase`, `cost_reduction`, `productivity`, `risk_mitigation`, `multiple` | Primary value category |
| `customer_name` | No | string | Customer/prospect name |
| `industry` | No | string | The customer's industry, in any words. Used for wording and sector notes only: no industry figure is applied to the calculation. A return needs the buyer's own figures (annual_value_estimate, or current_annual_cost with expected_improvement_percent) |
| `company_size` | No | one of: `startup`, `smb`, `mid_market`, `enterprise` | Company size tier |
| `annual_revenue` | No | number (0 or more) | Customer annual revenue. Shown as your input; it is not turned into a value |
| `employee_count` | No | number (0 or more) | Number of employees. Shown as your input; it is not turned into a value |
| `solution_price` | No | number (0 or more) | Annual cost of your solution |
| `known_metrics` | No | string | Metrics the prospect shared, or results you can quote. Listed as reference points, never as the buyer's figures; to turn the buyer's figures into the value, give current_annual_cost and expected_improvement_percent, or annual_value_estimate |
| `current_annual_cost` | No | number (0 or more) | Optional: what the problem or the current process costs the buyer a year, in dollars (their figure) |
| `expected_improvement_percent` | No | number (0 to 100) | Optional: the share of that annual cost the buyer expects to save, in percent (their figure) |
| `annual_value_estimate` | No | number (0 or more) | Optional: the buyer's own estimate of the annual value in dollars; used as the value when given |
| `current_process` | No | string | How they do it today. Separate the ways of working with a semicolon: each becomes a cost line to price. Not used in the calculation |
| `implementation_timeline` | No | string | Expected implementation time. Shown in the output; not used in the calculation |

#### 5. Mutual Action Plan Generator (`mutual_action_plan_generator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `deal_name` | Yes | string | Deal/opportunity name |
| `target_close_date` | Yes | string | Target close date (YYYY-MM-DD) |
| `current_stage` | No | one of: `discovery`, `evaluation`, `proposal`, `negotiation`, `procurement` | Current deal stage |
| `buyer_champion` | No | string | Champion name and title |
| `economic_buyer` | No | string | Economic buyer name and title |
| `technical_evaluators` | No | string | Technical evaluators involved |
| `procurement_contact` | No | string | Procurement contact if known |
| `known_requirements` | No | string | Known requirements or evaluation criteria |
| `known_process_steps` | No | string | Known steps in their buying process |
| `blockers` | No | string | Known blockers or concerns |
| `your_solution` | No | string | What you are selling |

#### 6. Win/Loss Analyzer (`win_loss_analyzer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `analysis_type` | Yes | one of: `single_deal`, `deal_portfolio`, `competitor_analysis`, `loss_pattern` | Type of analysis |
| `deal_outcome` | No | one of: `won`, `lost`, `no_decision`, `mixed` | Deal outcome for single deal analysis |
| `deal_details` | No | string | Deal details, can be rough notes, CRM export, or structured data |
| `loss_reason` | No | string | Stated loss reason (for lost deals) |
| `competitor_won` | No | string | Competitor who won (if applicable) |
| `deal_value` | No | number (0 or more) | Deal value |
| `sales_cycle_days` | No | number (0 or more) | Length of sales cycle |
| `stakeholders_involved` | No | string | Key stakeholders and their positions |
| `your_solution` | No | string | What you were selling |
| `multiple_deals` | No | string | For portfolio analysis: summary of multiple deals |

#### 7. Proposal Section Writer (`proposal_section_writer`)

| Input | Required | Type | Description |
|---|---|---|---|
| `section_type` | Yes | one of: `executive_summary`, `problem_statement`, `solution_overview`, `implementation_plan`, `pricing_justification`, `risk_mitigation`, `success_metrics`, `company_overview`, `case_studies`, `next_steps` | Proposal section to generate |
| `your_solution` | Yes | string | Your product/solution |
| `customer_name` | No | string | Customer name |
| `customer_industry` | No | string | Customer industry |
| `primary_audience` | No | one of: `c_suite`, `vp_level`, `director`, `manager`, `technical`, `procurement` | Adds a one-line note at the top of the executive summary on what this audience looks for |
| `customer_challenges` | No | string | Key challenges identified |
| `key_differentiators` | No | string | Why you vs alternatives |
| `pricing` | No | string | Pricing details if relevant |
| `implementation_approach` | No | string | How you will implement |
| `success_metrics` | No | string | Expected outcomes/metrics |
| `tone` | No | one of: `formal`, `consultative`, `bold`, `conservative` | Tone for the proposal (changes only the opening of the executive summary) |

#### 8. Email Sequence Generator (`email_sequence_generator`)

| Input | Required | Type | Description |
|---|---|---|---|
| `sequence_type` | Yes | one of: `cold_outreach`, `warm_follow_up`, `post_demo`, `proposal_follow_up`, `re_engagement`, `nurture`, `event_follow_up`, `referral_request` | Type of email sequence. cold_outreach, warm_follow_up, post_demo and re_engagement have their own templates; the other types return a general outline |
| `target_persona` | Yes | string | Target persona (e.g., VP Sales, CTO, CFO) |
| `your_solution` | Yes | string | Your product/solution |
| `target_industry` | No | string | Target industry for context |
| `key_value_prop` | No | string | Primary value proposition |
| `specific_pain_point` | No | string | Specific pain point to address |
| `social_proof` | No | string | Customer names, stats, or proof points |
| `call_to_action` | No | string | Desired action (meeting, demo, reply) |
| `num_emails` | No | number (0 or more) | Accepted but not used yet: each sequence type has a fixed number of emails |
| `tone` | No | one of: `professional`, `casual`, `urgent`, `consultative`, `provocative` | Email tone |
| `sender_context` | No | string | Context about sender (role, shared connections, etc.) |

#### 9. Demo Script Builder (`demo_script_builder`)

| Input | Required | Type | Description |
|---|---|---|---|
| `demo_type` | Yes | one of: `first_look`, `technical_deep_dive`, `executive_overview`, `competitive_displacement`, `expansion_upsell`, `proof_of_concept` | Type of demo |
| `your_solution` | Yes | string | Your product/solution |
| `primary_audience` | No | string | Primary demo audience (role/persona) |
| `attendees` | No | string | Other attendees and their roles |
| `customer_industry` | No | string | Customer industry |
| `key_pain_points` | No | string | Pain points to address in demo |
| `competitor_context` | No | string | Competitor being displaced or compared |
| `demo_duration` | No | number (0 or more) | Demo duration in minutes |
| `must_show_features` | No | string | Features that must be demonstrated |
| `known_objections` | No | string | Known objections to address |
| `desired_outcome` | No | string | What you want to achieve from this demo |

#### 10. Pricing Negotiation Guide (`pricing_negotiation_guide`)

| Input | Required | Type | Description |
|---|---|---|---|
| `scenario` | Yes | one of: `discount_request`, `budget_objection`, `competitor_pricing`, `procurement_pressure`, `multi_year_negotiation`, `enterprise_agreement`, `renewal_negotiation` | Negotiation scenario |
| `deal_value` | No | number (0 or more) | Current deal value |
| `discount_requested` | No | number (0 or more) | Discount percentage requested |
| `your_solution` | No | string | Your product/solution. Named in the guide and used, with your leverage, to read the sector and how you charge |
| `competitor_price` | No | string | Competitor pricing if known |
| `value_delivered` | No | string | Quantified value your solution delivers. Used in the value reframe, word for word; the guide adds no value figure of its own |
| `buyer_leverage` | No | string | Buyer leverage points (size, reference potential, etc.) |
| `your_leverage` | No | string | Your leverage points (unique features, timeline, etc.) |
| `decision_timeline` | No | string | When decision needs to be made |
| `approval_authority` | No | string | Who has final approval on pricing |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out |

#### 11. Champion Enablement Kit (`champion_enablement_kit`)

| Input | Required | Type | Description |
|---|---|---|---|
| `asset_type` | Yes | one of: `executive_brief`, `internal_business_case`, `objection_responses`, `presentation_talking_points`, `email_to_stakeholder`, `roi_one_pager`, `competitive_comparison`, `risk_assessment` | Type of enablement asset |
| `your_solution` | Yes | string | Your product/solution |
| `champion_name` | No | string | Champion name |
| `champion_role` | No | string | Champion role/title |
| `target_stakeholder` | No | string | Who the champion needs to convince |
| `key_value_points` | No | string | Key value points to emphasize |
| `known_objections` | No | string | Expected objections from stakeholders |
| `competitive_context` | No | string | Competitive alternatives being considered |
| `budget_context` | No | string | Budget situation and pricing |
| `urgency_drivers` | No | string | Why act now |
| `champion_wins` | No | string | How this makes the champion look good |

#### 12. Competitive Trap Setter (`competitive_trap_setter`)

| Input | Required | Type | Description |
|---|---|---|---|
| `competitor` | Yes | string | Primary competitor to position against |
| `your_solution` | Yes | string | Your product/solution |
| `competitor_weaknesses` | No | string | Known competitor weaknesses |
| `your_strengths` | No | string | Your key differentiators |
| `evaluation_stage` | No | one of: `early`, `mid`, `late`, `finalist` | Stage of competitive evaluation |
| `buyer_priorities` | No | string | What the buyer cares most about |
| `buyer_persona` | No | string | Role of key evaluator |
| `trap_type` | No | one of: `discovery_questions`, `evaluation_criteria`, `reference_questions`, `technical_requirements`, `commercial_terms`, `all` | Type of competitive positioning |
| `business_model` | No | one of: `saas`, `services`, `connectivity`, `transactions`, `marketplace`, `hardware_software`, `investment` | Optional: how you charge (software subscription, services, connectivity, per transaction, marketplace, hardware plus software, or investment management). Read from your other inputs when left out |

## Who Is This For?

### Primary Users

| Role | Key Tools | Use Cases |
|------|-----------|-----------|
| **Account Executives** | `deal_strategy_coach`, `account_plan_builder`, `mutual_action_plan_generator` | Deal execution |
| **SDRs/BDRs** | `email_sequence_generator`, `discovery_question_bank` | Outreach, qualification |
| **Sales Engineers** | `demo_script_builder`, `roi_business_case_builder` | Technical selling |
| **Sales Managers** | `win_loss_analyzer`, `deal_strategy_coach` | Pipeline coaching |
| **Sales Enablement** | `discovery_question_bank`, `champion_enablement_kit` | Training, tools |
| **RevOps** | `win_loss_analyzer`, `pricing_negotiation_guide` | Process optimization |

### Job-to-Tool Mapping

| Job To Be Done | Recommended Tool |
|----------------|------------------|
| "I need to build a strategic account plan" | `account_plan_builder` |
| "I need help navigating this deal" | `deal_strategy_coach` |
| "I need discovery questions for my call" | `discovery_question_bank` |
| "I need to build an ROI business case" | `roi_business_case_builder` |
| "I need to create a mutual action plan" | `mutual_action_plan_generator` |
| "I need to analyze our win/loss patterns" | `win_loss_analyzer` |
| "I need to write proposal sections" | `proposal_section_writer` |
| "I need email sequences for outreach" | `email_sequence_generator` |
| "I need to prepare a demo script" | `demo_script_builder` |
| "I need to defend pricing in negotiation" | `pricing_negotiation_guide` |
| "I need to arm my champion" | `champion_enablement_kit` |
| "I need competitive landmine questions" | `competitive_trap_setter` |

---

## Related MCPs

| MCP | Focus | Tools | Link |
|-----|-------|-------|------|
| CRAFT GTM | GTM strategy | 8 | [GitHub](https://github.com/shashwatgtm/craft-gtm-mcp) |
| CRAFT Content | Content creation | 8 | [GitHub](https://github.com/shashwatgtm/craft-content-mcp) |
| IMPACT | B2B positioning | 8 | [GitHub](https://github.com/shashwatgtm/impact-mcp) |
| ICP Intelligence | ICP & targeting | 9 | [GitHub](https://github.com/shashwatgtm/icp-intelligence-mcp) |

---

## Sales Methodology Support

This MCP supports multiple sales methodologies:

| Methodology | Tools That Support It |
|-------------|----------------------|
| **MEDDPICC** | `discovery_question_bank`, `deal_strategy_coach` |
| **BANT** | `discovery_question_bank` |
| **SPICED** | `discovery_question_bank` |
| **Challenger** | `discovery_question_bank`, `champion_enablement_kit` |
| **Gap Selling** | `discovery_question_bank`, `roi_business_case_builder` |
| **Command of the Message** | `competitive_trap_setter`, `pricing_negotiation_guide` |

---

## Author

**Shashwat Ghosh**, Co-Founder and Fractional CMO, Helix GTM Consulting, with 24+ years in B2B and 10+ years of fractional experience

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/shashwatghosh-ai-b2b-gtm-fractionalcmo/)
[![X](https://img.shields.io/badge/X-Follow-1A0E10)](https://x.com/Shashwat_Ghosh)
[![Website](https://img.shields.io/badge/Website-gtmhelix.com-green)](https://gtmhelix.com)

---

## License

MIT License: see [LICENSE](LICENSE) for details.

---

*Part of the Helix GTM Consulting MCP suite: rule-based B2B go-to-market tools (no AI model runs inside them)*


## Hosted connector (Streamable HTTP)

The same tools are also available as a hosted MCP server, so they work in Claude on the web, desktop and mobile without installing anything.

- Server URL: `https://revenue-enablement.gtmhelix.com/mcp`
- Transport: Streamable HTTP (stateless, JSON responses). Authentication: none.
- Setup guide: https://revenue-enablement.gtmhelix.com/connect/
- In Claude: Customize, then Connectors, then Add custom connector, and paste the server URL.
- In Claude Code: `claude mcp add --transport http revenue-enablement https://revenue-enablement.gtmhelix.com/mcp`

The npm package (stdio) and the hosted server run the same `createServer()` code in `src/index.ts`.

The tool reference on the docs page (https://revenue-enablement.gtmhelix.com/docs/) is generated from the code. Where it differs from the parameter tables earlier in this README, the docs page is correct.

## Privacy Policy

Full policy: https://revenue-enablement.gtmhelix.com/privacy/ (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Nothing is stored: no database, no files, no cache, no logging of inputs or outputs by our code.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). Fonts are served from this site, so loading a page contacts no one else.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com
