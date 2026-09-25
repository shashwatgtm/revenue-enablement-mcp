# Revenue Enablement MCP v1.2.0
**Deal Strategy & Sales Enablement Engine** - 12 tools for sales execution, deal management, and revenue acceleration.

[![NPM Version](https://img.shields.io/npm/v/@shashwatgtmalpha/revenue-enablement-mcp)](https://www.npmjs.com/package/@shashwatgtmalpha/revenue-enablement-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)

## 🚀 Quick Start

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

Generated on 26 September 2026 from the server's own tool list (`tools/list` of revenue-enablement-mcp 1.2.0, the same code as the hosted MCP address), so every tool name, title, description and input below is exactly what the server accepts. Every tool is read-only.

| # | Tool | Title | What it does |
|---|---|---|---|
| 1 | `account_plan_builder` | Account Plan Builder | Generate strategic account plans with power mapping, whitespace analysis, and expansion strategies. Provides actionable 90-day plans based on account intelligence. |
| 2 | `deal_strategy_coach` | Deal Strategy Coach | Get deal-specific winning strategies based on deal stage, competitive dynamics, and stakeholder positions. Provides tactical next steps and risk mitigation. |
| 3 | `discovery_question_bank` | Discovery Question Bank | Get contextual discovery questions using MEDDPICC, BANT, SPICED, or custom frameworks. Questions adapt based on what you already know about the prospect. |
| 4 | `roi_business_case_builder` | ROI Business Case Builder | Build an ROI business case template from your inputs: value, ROI and payback calculated with example assumptions and benchmarks that are labelled for you to replace, plus an executive summary. |
| 5 | `mutual_action_plan_generator` | Mutual Action Plan Generator | Generate collaborative close plans with milestones, owners, and dates. Creates alignment between buyer and seller on path to decision. |
| 6 | `win_loss_analyzer` | Win/Loss Analyzer | Structure a win/loss review of one deal or a set of deals: organizes the deal details you provide and returns the factors and questions to investigate. |
| 7 | `proposal_section_writer` | Proposal Section Writer | Generate customized proposal sections tailored to specific buyers. Creates executive summaries, solution overviews, pricing justifications, and more. |
| 8 | `email_sequence_generator` | Email Sequence Generator | Generate multi-touch email sequences by persona, stage, and objective. Creates prospecting, nurture, follow-up, and re-engagement sequences. |
| 9 | `demo_script_builder` | Demo Script Builder | Create outcome-focused demo scripts tailored to specific personas and use cases. Includes discovery questions, feature-to-value mapping, and objection handling. |
| 10 | `pricing_negotiation_guide` | Pricing Negotiation Guide | Get value-based pricing defense strategies and negotiation tactics. Helps maintain deal value while addressing discount requests. |
| 11 | `champion_enablement_kit` | Champion Enablement Kit | Create internal selling tools for your champion. Generates executive briefs, internal business cases, objection responses, and presentation talking points. |
| 12 | `competitive_trap_setter` | Competitive Trap Setter | Generate landmine questions and competitive positioning tactics. Helps expose competitor weaknesses during evaluation without being negative. |

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
| `industry` | No | string | Industry for the example benchmarks: Technology, Financial_Services, Healthcare, Manufacturing or Retail (exact spelling). Any other value uses Technology |
| `company_size` | No | one of: `startup`, `smb`, `mid_market`, `enterprise` | Company size tier |
| `annual_revenue` | No | number (0 or more) | Customer annual revenue |
| `employee_count` | No | number (0 or more) | Number of employees |
| `solution_price` | No | number (0 or more) | Annual cost of your solution |
| `known_metrics` | No | string | Metrics the prospect shared. Shown in the output; not used in the calculation |
| `current_process` | No | string | How they do it today. Shown in the output; not used in the calculation |
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
| `deal_details` | No | string | Deal details - can be rough notes, CRM export, or structured data |
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
| `primary_audience` | No | one of: `c_suite`, `vp_level`, `director`, `manager`, `technical`, `procurement` | Accepted but not used yet: the text is the same for every audience |
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
| `discount_requested` | No | number | Discount percentage requested |
| `your_solution` | No | string | Accepted but not used yet by this tool |
| `competitor_price` | No | string | Competitor pricing if known |
| `value_delivered` | No | string | Quantified value your solution delivers. Shown in the output; the value example does not use it |
| `buyer_leverage` | No | string | Buyer leverage points (size, reference potential, etc.) |
| `your_leverage` | No | string | Your leverage points (unique features, timeline, etc.) |
| `decision_timeline` | No | string | When decision needs to be made |
| `approval_authority` | No | string | Who has final approval on pricing |

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

## 👤 Who Is This For?

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

### Recommended Agent Skills

This MCP is included in these user-focused Agent bundles:

| Agent Bundle | Tools Count | Best For |
|--------------|-------------|----------|
| **💼 Account Executive Deal Desk** | 12 tools | AEs, account managers |
| **📞 SDR Toolkit** | 8 tools | SDRs, BDRs |
| **🔧 Sales Engineer Toolkit** | 9 tools | SEs, solution consultants |
| **🎯 Founder GTM Copilot** | 10 tools | Founders doing sales |

---

## 🔗 Related MCPs

| MCP | Focus | Tools | Link |
|-----|-------|-------|------|
| CRAFT GTM | GTM strategy | 8 | [GitHub](https://github.com/shashwatgtm/craft-gtm-mcp) |
| CRAFT Content | Content creation | 8 | [GitHub](https://github.com/shashwatgtm/craft-content-mcp) |
| IMPACT | B2B positioning | 8 | [GitHub](https://github.com/shashwatgtm/impact-mcp) |
| ICP Intelligence | ICP & targeting | 9 | [GitHub](https://github.com/shashwatgtm/icp-intelligence-mcp) |

---

## 📚 Sales Methodology Support

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

## 👨‍💻 Author

**Shashwat Ghosh**, Co-Founder and Fractional CMO, Helix GTM Consulting

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com/in/shashwatghosh)
[![Twitter](https://img.shields.io/badge/Twitter-Follow-1DA1F2)](https://twitter.com/Shashwat_Ghosh)
[![Website](https://img.shields.io/badge/Website-gtmhelix.com-green)](https://gtmhelix.com)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

*Part of the Helix GTM Consulting MCP suite: rule-based B2B go-to-market tools (no AI model runs inside them)*


## Hosted connector (Streamable HTTP)

The same tools are also available as a hosted MCP server, so they work in Claude on the web, desktop and mobile without installing anything.

- Server URL: `https://revenue-enablement.gtmhelix.com/mcp`
- Transport: Streamable HTTP (stateless, JSON responses). Authentication: none.
- Setup guide: https://revenue-enablement.gtmhelix.com/
- In Claude: Customize, then Connectors, then Add custom connector, and paste the server URL.
- In Claude Code: `claude mcp add --transport http revenue-enablement https://revenue-enablement.gtmhelix.com/mcp`

The npm package (stdio) and the hosted server run the same `createServer()` code in `src/index.ts`.

The tool reference on the setup page (https://revenue-enablement.gtmhelix.com/) is generated from the code. Where it differs from the parameter tables earlier in this README, the setup page is correct.

## Privacy Policy

Full policy: https://revenue-enablement.gtmhelix.com/privacy.html (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Nothing is stored: no database, no files, no cache, no logging of inputs or outputs by our code.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). The web pages load fonts from Google Fonts.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com
