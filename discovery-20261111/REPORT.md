# Discovery report: revenue-enablement-mcp

Source work is closed on codex/discovery-20261111. Nothing was deployed or published.

Before: Generic win loss title and weak workflow routes.

Why it matters: A lost deal review and an open deal business case need different tools.

Now in the draft: A buyer win loss title and answer, ROI and strategy answers with guide 05 links, current setup and counts, and method references.

Checks: build passed; changed HTML has one h1, valid JSON-LD, titles at most 65 characters, extensionless canonicals, full raw text and resolving local targets. Browser source review passed at 375 and 1280 px with JavaScript disabled. Exact, same meaning and opposite buyer questions are retained in the hub acceptance cases. Runtime tool code, descriptions, schemas, tests and assistant JSON were left untouched.

Full suite: 8775 tests, 8744 passed, 1 failed, 30 skipped. The suite is not clean.

Already failing on main:

- `scripts/test-in-field.mjs`

Files changed:

- `discovery-20261111/REPORT.md`
- `discovery-20261111/state.json`
- `public/connect/index.html`
- `public/index.html`
- `public/llms.txt`
- `public/tools/account-plan-builder/index.html`
- `public/tools/champion-enablement-kit/index.html`
- `public/tools/competitive-trap-setter/index.html`
- `public/tools/deal-strategy-coach/index.html`
- `public/tools/demo-script-builder/index.html`
- `public/tools/discovery-question-bank/index.html`
- `public/tools/email-sequence-generator/index.html`
- `public/tools/mutual-action-plan-generator/index.html`
- `public/tools/pricing-negotiation-guide/index.html`
- `public/tools/proposal-section-writer/index.html`
- `public/tools/roi-business-case-builder/index.html`
- `public/tools/win-loss-analyzer/index.html`

Owner questions: no additional question for this source branch. Cross-site blockers and the release sequence are in the hub discovery-20261111/OWNER-QUESTIONS.md and REPORT.md. Claude reviews the assembled draft, the owner approves release, then Fable checks the live result.
