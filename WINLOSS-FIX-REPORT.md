# Win/loss portfolio count fix

Branch: `codex/winloss-count-fix-20261114`. Base: `a62b50ee6bbce626f7f81f860fb72f8d61e2c00c` (main when checked). No release, deployment, package version or connector schema change.

Before, a heading became a deal and a reason of no decision overrode a stated loss. This changed both the total and the denominator a buyer would use. The reader now accepts explicit row outcomes only, skips headers, labels, totals and blank lines, and uses the same parsed rows everywhere. Markdown is read after the MCP safety escaping without undoing escaping in the printed output.

Policy printed in every portfolio answer: a stated won or lost outcome takes precedence over its reason. Standalone no decision is its own outcome and is excluded from won-or-lost counts. Explicit open rows are counted separately. Unlabelled notes are ignored.

## Before and after

### owner-eight-with-heading

Input:

```text
Deals:
Deal A, won, reason: buyer confirmed the value
Deal B, won, reason: agreed rollout
Deal C, won, reason: verified scope
Deal D, lost, reason: no decision
Deal E, lost, reason: price
Deal F, lost, reason: project ended
Deal G, lost, reason: missing approval
Deal H, lost, reason: incumbent retained
```

Before:

**The deals you listed.** You listed 9 deals: 3 won, 4 lost, 1 no decision, 1 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 7 deals marked won or lost, 3 were won.
**What the lost and undecided lines say.** 5 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 8 deals: 3 won, 5 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 8 deals marked won or lost, 3 were won.
**What the lost and undecided lines say.** 5 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### csv-header

Input:

```text
Deal,Outcome,Reason
Deal A,Won,Agreed scope
Deal B,Lost,No decision
Deal C,Lost,Price
```

Before:

**The deals you listed.** You listed 4 deals: 1 won, 1 lost, 1 no decision, 1 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** 2 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 3 deals: 1 won, 2 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 3 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** 2 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### markdown-header

Input:

```text
| Deal | Outcome | Reason |
|---|---|---|
| Deal A | won | value |
| Deal B | lost | no decision |
```

Before:

**The deals you listed.** You listed 4 deals: 1 won, 0 lost, 1 no decision, 2 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 2 deals: 1 won, 1 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### heading-forms

Input:

```text
# Recent deals
Won deals
Deals:
Deal A: won
## Lost deals
Deal B: lost
Outcomes: won, lost, no decision
```

Before:

**The deals you listed.** You listed 7 deals: 2 won, 2 lost, 1 no decision, 2 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 4 deals marked won or lost, 2 were won.
**What the lost and undecided lines say.** 3 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 2 deals: 1 won, 1 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### totals-and-subtotals

Input:

```text
Deal,Outcome,Reason
Deal A,won,value
Deal B,lost,price
Total,won,2
Subtotal,lost,2
Grand total: 1 won, 1 lost
```

Before:

**The deals you listed.** You listed 6 deals: 2 won, 3 lost, 0 no decision, 1 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 5 deals marked won or lost, 2 were won.
**What the lost and undecided lines say.** 3 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 2 deals: 1 won, 1 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### blank-lines

Input:

```text


- Deal A, won, value

* Deal B, lost, price


```

Before:

**The deals you listed.** You listed 2 deals: 1 won, 1 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 2 deals: 1 won, 1 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### mixed-case

Input:

```text
DEAL, OUTCOME, REASON
Deal A, WoN, VALUE
Deal B, lOsT, NO DECISION
Deal C, No_DeCiSiOn, PAUSED
```

Before:

**The deals you listed.** You listed 4 deals: 1 won, 0 lost, 2 no decision, 1 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** 2 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 3 deals: 1 won, 1 lost, 1 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** 2 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### zero-won

Input:

```text
Deal A,lost,price
Deal B,no decision,budget freeze
```

Before:

**The deals you listed.** You listed 2 deals: 0 won, 1 lost, 1 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 0 were won.
**What the lost and undecided lines say.** 2 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 2 deals: 0 won, 1 lost, 1 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 0 were won.
**What the lost and undecided lines say.** 2 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### all-lost

Input:

```text
Deal A,lost,price
Deal B,lost,no decision
Deal C,lost,project ended
```

Before:

**The deals you listed.** You listed 3 deals: 0 won, 2 lost, 1 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 0 were won.
**What the lost and undecided lines say.** 3 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 3 deals: 0 won, 3 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 3 deals marked won or lost, 0 were won.
**What the lost and undecided lines say.** 3 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### one-deal

Input:

```text
Deals:
Deal A: lost
```

Before:

**The deals you listed.** You listed 2 deals: 0 won, 1 lost, 0 no decision, 1 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 0 were won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 1 deal: 0 won, 1 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 0 were won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### standalone-and-reason-no-decision

Input:

```text
Deal A,no_decision,paused
Deal B,lost,reason: no decision
```

Before:

**The deals you listed.** You listed 2 deals: 0 won, 0 lost, 2 no decision. These are counts of your own lines, not a benchmark.
**What the lost and undecided lines say.** 2 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 2 deals: 0 won, 1 lost, 1 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 0 were won.
**What the lost and undecided lines say.** 2 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### quoted-csv-and-rival-win

Input:

```text
Deal,Outcome,Reason
"Deal A",lost,"price, no decision after review"
"Deal B",won,"scope, incumbent lost"
```

Before:

**The deals you listed.** You listed 3 deals: 0 won, 1 lost, 1 no decision, 1 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 0 were won.
**What the lost and undecided lines say.** 2 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 2 deals: 1 won, 1 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

### only-headers-and-unlabelled-notes

Input:

```text
Deal,Outcome,Reason
Deals:
Won
No decision
Total: 3 won
We need better follow-up
```

Before:

**The deals you listed.** You listed 6 deals: 2 won, 0 lost, 1 no decision, 3 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 2 were won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals.** No deals were listed, so there is nothing to count. The write-up covers the product from the other inputs.

### open-explicit-outcome

Input:

```text
Deal,Status,Reason
Deal A,open,review pending
Deal B,won,confirmed
Unlabelled note about a lost reason
```

Before:

**The deals you listed.** You listed 4 deals: 1 won, 1 lost, 0 no decision, 2 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.

After:

**The deals you listed.** You listed 2 deals: 1 won, 0 lost, 0 no decision, 1 open. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 1 was won.

## Verification

Exact commands from the branch checkout:

```sh
npm run build
npm test > /workspace/gtmhelix-tools-hub/work/winloss-count-fix-20261114/baseline-tests.txt 2>&1
# Implement the fix and add cases.
npm run build
node --test tests/winloss-count-fix.test.mjs tests/run22-win_loss_analyzer-rewrite.test.mjs tests/run21c-draft-win_loss_analyzer.test.mjs
npm test > /workspace/gtmhelix-tools-hub/work/winloss-count-fix-20261114/after-tests.txt 2>&1
# After committing the generated build:
npm run check:current-dist
```

The 14 input cases run through both real MCP portfolio modes twice. The tests check identical output on repeat, summary totals, won-or-lost denominators and loss-review counts. A separate same-meaning/opposite test confirms that a stated outcome controls the count. The before/after excerpts above were captured from the real MCP handler, not constructed from expected values.

Focused suite: 32 passed, 0 failed, 1 private-pool test skipped. Full suite: 8,716 passed, 1 failed, 30 skipped. The sole failure is `scripts/test-in-field.mjs`, already failing on main at the base commit: the private run20/run21/run22 fixture folder is not present and HELIX_WORK is unset. Baseline: 8,701 passed, the same 1 failed and 30 skipped. No new full-suite failure. Fresh current-dist check: pending post-commit verification.

Owner action: review and authorize release separately. Nothing has been released or deployed.
