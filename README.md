# Revenue Enablement MCP v1.0.0

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

## 🛠️ Tools Overview

| Tool | Purpose | Primary Output |
|------|---------|----------------|
| `account_plan_builder` | Strategic account planning | Account plans with power mapping |
| `deal_strategy_coach` | Stage-based deal tactics | Deal strategies + risk mitigation |
| `discovery_question_bank` | Sales methodology questions | MEDDPICC/BANT/SPICED/Challenger questions |
| `roi_business_case_builder` | Quantified ROI calculations | ROI models with industry benchmarks |
| `mutual_action_plan_generator` | Collaborative close plans | MAP with milestones |
| `win_loss_analyzer` | Deal outcome patterns | Win/loss insights |
| `proposal_section_writer` | Customized proposals | Proposal sections by persona |
| `email_sequence_generator` | Multi-touch cadences | Persona-specific sequences |
| `demo_script_builder` | Outcome-focused demos | Timed demo scripts |
| `pricing_negotiation_guide` | Value defense frameworks | Negotiation playbooks |
| `champion_enablement_kit` | Internal selling tools | Champion arsenal |
| `competitive_trap_setter` | Landmine questions | Competitive trap strategies |

---

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

## 📖 Tool Details

### 1. Account Plan Builder (`account_plan_builder`)

Create strategic account plans with power mapping.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `account_name` | ✅ | Target account |
| `account_context` | ✅ | What you know about them |
| `your_product` | ✅ | Your solution |
| `current_status` | ❌ | Existing relationship |
| `key_stakeholders` | ❌ | Known contacts |

**Output:** Account overview, power map, action plan, success metrics.

### 2. Deal Strategy Coach (`deal_strategy_coach`)

Get stage-based deal tactics and risk mitigation.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `deal_stage` | ✅ | discovery, demo, proposal, negotiation, closing |
| `deal_context` | ✅ | Deal situation summary |
| `challenges` | ❌ | Current obstacles |
| `competitors` | ❌ | Competitive presence |

**Output:** Stage-specific tactics, risk assessment, next best actions.

### 3. Discovery Question Bank (`discovery_question_bank`)

Generate methodology-specific discovery questions.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `methodology` | ✅ | MEDDPICC, BANT, SPICED, Challenger, Gap_Selling |
| `product_context` | ✅ | Your solution |
| `prospect_context` | ❌ | What you know about prospect |
| `call_type` | ❌ | first_call, follow_up, executive |

**Output:** Categorized questions with follow-up probes.

### 4. ROI Business Case Builder (`roi_business_case_builder`)

Create quantified ROI calculations with benchmarks.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `product` | ✅ | Your solution |
| `prospect_context` | ✅ | Prospect situation |
| `value_drivers` | ✅ | Areas of impact |
| `industry` | ❌ | For industry benchmarks |
| `prospect_metrics` | ❌ | Known prospect data |

**Output:** ROI model, payback period, benchmark comparisons, executive summary.

### 5. Mutual Action Plan Generator (`mutual_action_plan_generator`)

Create collaborative close plans.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `deal_context` | ✅ | Deal overview |
| `target_close_date` | ✅ | Desired close date |
| `key_milestones` | ❌ | Known requirements |
| `stakeholders` | ❌ | People involved |

**Output:** Timeline, milestones, owner assignments, risk contingencies.

### 6. Win Loss Analyzer (`win_loss_analyzer`)

Detect patterns in deal outcomes.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `deals_data` | ✅ | Win/loss deal summaries |
| `analysis_focus` | ❌ | competitive, process, qualification |
| `time_period` | ❌ | Analysis timeframe |

**Output:** Pattern analysis, root causes, recommendations.

### 7. Proposal Section Writer (`proposal_section_writer`)

Generate customized proposal sections.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `section_type` | ✅ | executive_summary, solution, pricing, implementation, etc. |
| `prospect_context` | ✅ | Prospect situation |
| `your_solution` | ✅ | What you're proposing |
| `persona` | ❌ | Primary reader |

**Output:** Polished proposal section with persona-appropriate framing.

### 8. Email Sequence Generator (`email_sequence_generator`)

Create multi-touch outreach cadences.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `target_persona` | ✅ | Who you're targeting |
| `product_context` | ✅ | Your solution |
| `sequence_goal` | ✅ | meeting, demo, renewal, etc. |
| `sequence_length` | ❌ | Number of touches (default: 5) |

**Output:** Email sequence with subject lines, body copy, and timing.

### 9. Demo Script Builder (`demo_script_builder`)

Create outcome-focused demo scripts.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `product` | ✅ | What you're demoing |
| `audience` | ✅ | Who's watching |
| `key_pain_points` | ✅ | Problems to address |
| `demo_duration` | ❌ | Time available |
| `demo_type` | ❌ | overview, technical, executive |

**Output:** Timed script with talk tracks, feature-benefit links, and transition points.

### 10. Pricing Negotiation Guide (`pricing_negotiation_guide`)

Get value defense frameworks.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `deal_context` | ✅ | Deal situation |
| `pricing_pressure` | ✅ | Type of pushback |
| `your_position` | ❌ | Your leverage |
| `competitor_pricing` | ❌ | Competitive context |

**Output:** Negotiation strategy, talk tracks, concession ladder.

### 11. Champion Enablement Kit (`champion_enablement_kit`)

Arm your champion for internal selling.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `champion_context` | ✅ | Champion's situation |
| `internal_obstacles` | ✅ | What they're facing |
| `your_solution` | ✅ | What you're selling |
| `key_stakeholders` | ❌ | Who they need to convince |

**Output:** Business case one-pager, talking points, objection responses, email templates.

### 12. Competitive Trap Setter (`competitive_trap_setter`)

Generate landmine questions for competitive deals.

**Inputs:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `competitor` | ✅ | Primary competitor |
| `your_strengths` | ✅ | Your differentiators |
| `competitor_weaknesses` | ❌ | Known gaps |
| `deal_context` | ❌ | Specific situation |

**Output:** Landmine questions, feature traps, evaluation criteria suggestions.

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

**Shashwat Ghosh** - Founder, Helix GTM Consulting

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com/in/shashwatghosh)
[![Twitter](https://img.shields.io/badge/Twitter-Follow-1DA1F2)](https://twitter.com/Shashwat_Ghosh)
[![Website](https://img.shields.io/badge/Website-gtmhelix.com-green)](https://gtmhelix.com)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

*Part of the GTM Helix MCP Suite - AI-powered B2B go-to-market tools*


## Hosted connector (Streamable HTTP)

The same tools are also available as a hosted MCP server, so they work in Claude on the web, desktop and mobile without installing anything.

- Server URL: `https://revenue-enablement-mcp.netlify.app/mcp`
- Transport: Streamable HTTP (stateless, JSON responses). Authentication: none.
- Setup guide: https://revenue-enablement-mcp.netlify.app/
- In Claude: Customize, then Connectors, then Add custom connector, and paste the server URL.
- In Claude Code: `claude mcp add --transport http revenue-enablement https://revenue-enablement-mcp.netlify.app/mcp`

The npm package (stdio) and the hosted server run the same `createServer()` code in `src/index.ts`.

The tool reference on the setup page (https://revenue-enablement-mcp.netlify.app/) is generated from the code. Where it differs from the parameter tables earlier in this README, the setup page is correct.

## Privacy Policy

Full policy: https://revenue-enablement-mcp.netlify.app/privacy.html (also in [PRIVACY.md](PRIVACY.md)).

- **Data collection:** the hosted server receives only the tool name and the inputs of each tool call. The npm package runs on your computer and sends nothing to us.
- **Use and storage:** inputs are used only to build that call's reply. Nothing is stored: no database, no files, no cache, no logging of inputs or outputs by our code.
- **Third-party sharing:** none by us. Netlify hosts the server and processes requests under its own policy (https://www.netlify.com/privacy/). The web pages load fonts from Google Fonts.
- **Retention:** we keep no tool inputs or outputs. Netlify keeps its own platform logs under its policy.
- **Contact:** shashwat@gtmhelix.com
