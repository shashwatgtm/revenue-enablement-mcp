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

Focused suite: 32 passed, 0 failed, 1 private-pool test skipped. Full suite: 8,716 passed, 1 failed, 30 skipped. The sole failure is `scripts/test-in-field.mjs`, already failing on main at the base commit: the private run20/run21/run22 fixture folder is not present and HELIX_WORK is unset. Baseline: 8,701 passed, the same 1 failed and 30 skipped. No new full-suite failure. Fresh current-dist check passed: all 192 committed dist files equal a fresh current build.

Owner action: review and authorize release separately. Nothing has been released or deployed.


## Round 2

Reviewed on 15 Nov 2026 IST. Branch remains `codex/winloss-count-fix-20261114`. Current main was fetched at `a62b50ee6bbce626f7f81f860fb72f8d61e2c00c`; round 1 was captured separately at `1c7bfc8c89fc785bfa1611e611cddaa576c3a382`. These are real local MCP-handler calls on each source revision, not hand-written before outputs. No live endpoint was called.

### Before, why it matters, after

Round 1 tied outcome reading to one cell position or a narrow colon sentence. Numbered dash lists disappeared, common closed/open phrases were missed, and unread text was called an empty list. A buyer could get fewer deals than main or be told they listed nothing after pasting a review.

The reader now separates list formatting, table layout and outcome phrases. Comma/pipe/tab exports preserve quoted cells and use a detected outcome column in any order. Other rows use the same closed outcome vocabulary with colon, hyphen, en/em dash, brackets, was or a natural subject/predicate. Numbered, ordinary and emoji bullets do not hide outcomes. Headings, totals and bare labels stay outside the count. Explicit outcome columns never borrow a result from their reason, and a stated won/lost result keeps precedence over a reason mentioning no decision. All totals, win-rate denominators and lost/undecided review sentences still use the same parsed rows.

When text is present but no result is readable, the answer now says exactly: “I could not read a won, lost, open or no decision outcome on any line. Write one per deal, for example: Deal A, lost, price.” Only a blank input says “No deals were listed”. Partial summaries explicitly say that unread notes are not counted. Caller text stays safely escaped and is kept as supplied; tool-written prose adds no em/en dash or exclamation.

Closed labels cover won/win/closed won/closed-won/signed/PO received; lost/loss/closed lost/closed-lost/dropped/went with another vendor or incumbent; no decision/no-decision/stalled with no decision/project paused/cancelled by the buyer; open/still open/in progress/proposal sent/pending. Case and repeated spaces are normalized for reading only. Negated, hypothetical, question and conflicting alternatives in the added cases remain unread rather than gaining a result.

### The three review inputs, actual output excerpts

#### review-numbered-dashes

Input:

```text
Q3 deal review
1. Insurer A - Won - faster claims
2. Insurer B - Lost - went with incumbent
3. Insurer C - No decision - project paused
4. Insurer D - Lost - price
Total: 4 deals
```

Main:

```text
**The deals you listed.** You listed 6 deals: 1 won, 2 lost, 1 no decision, 2 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 3 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** 3 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.
```

Round 1:

```text
**The deals.** No deals were listed, so there is nothing to count. The write-up covers the product from the other inputs.
```

Round 2:

```text
**The deals you listed.** You listed 4 deals: 1 won, 2 lost, 1 no decision. These counts cover lines with a readable outcome. Headings, totals and unread notes are not counted. This is not a benchmark.
**Win rate on these lines.** Of the 3 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** 3 lines are lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.
```

#### review-closed-and-open

Input:

```text
hospital x: closed won
hospital y: closed lost (budget)
hospital z: still open, proposal sent
```

Main:

```text
**The deals you listed.** You listed 3 deals: 1 won, 1 lost, 0 no decision, 1 with no outcome written. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.
```

Round 1:

```text
**The deals you listed.** You listed 1 deal: 1 won, 0 lost, 0 no decision. These are counts of your own lines, not a benchmark.
**Win rate on these lines.** Of the 1 deals marked won or lost, 1 was won.
```

Round 2:

```text
**The deals you listed.** You listed 3 deals: 1 won, 1 lost, 0 no decision, 1 open. These counts cover lines with a readable outcome. Headings, totals and unread notes are not counted. This is not a benchmark.
**Win rate on these lines.** Of the 2 deals marked won or lost, 1 was won.
**What the lost and undecided lines say.** One line is lost or undecided. Read them side by side for a reason that repeats, and ask the buyer in each whether it was the real reason or the polite one.
```

#### review-text-without-outcomes

Input:

```text
We spoke to five banks this quarter and most liked the demo.
```

Main:

```text
**The deals you listed.** You listed 1 deal: 0 won, 0 lost, 0 no decision, 1 with no outcome written. These are counts of your own lines, not a benchmark.
```

Round 1:

```text
**The deals.** No deals were listed, so there is nothing to count. The write-up covers the product from the other inputs.
```

Round 2:

```text
**The deals.** I could not read a won, lost, open or no decision outcome on any line. Write one per deal, for example: Deal A, lost, price.
```

### Before and after against main, every case

**275 inputs**: all 14 preserved count cases plus 261 new inputs. Every input runs through both portfolio modes twice. That is 550 mode comparisons per revision and 1100 actual calls per revision, with identical repeat outputs throughout.

The table uses **total / won / lost / no decision / open**. “Unread” is main or round 1 counting a line without a readable result; it is not an open outcome. For zero rows the comparison also checks the correct blank-versus-unread message. The displayed counts are from deal_portfolio; loss_pattern is checked separately and agrees.

| Input | Expected | Main | Round 1 | Round 2 | Round 2 result |
|---|---|---|---|---|---|
| owner-eight-with-heading | 8 / 3 / 5 / 0 / 0 | 9 / 3 / 4 / 1 / 0 (+1 unread) | 8 / 3 / 5 / 0 / 0 | 8 / 3 / 5 / 0 / 0 | Pass |
| csv-header | 3 / 1 / 2 / 0 / 0 | 4 / 1 / 1 / 1 / 0 (+1 unread) | 3 / 1 / 2 / 0 / 0 | 3 / 1 / 2 / 0 / 0 | Pass |
| markdown-header | 2 / 1 / 1 / 0 / 0 | 4 / 1 / 0 / 1 / 0 (+2 unread) | 2 / 1 / 1 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | Pass |
| heading-forms | 2 / 1 / 1 / 0 / 0 | 7 / 2 / 2 / 1 / 0 (+2 unread) | 2 / 1 / 1 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | Pass |
| totals-and-subtotals | 2 / 1 / 1 / 0 / 0 | 6 / 2 / 3 / 0 / 0 (+1 unread) | 2 / 1 / 1 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | Pass |
| blank-lines | 2 / 1 / 1 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | Pass |
| mixed-case | 3 / 1 / 1 / 1 / 0 | 4 / 1 / 0 / 2 / 0 (+1 unread) | 3 / 1 / 1 / 1 / 0 | 3 / 1 / 1 / 1 / 0 | Pass |
| zero-won | 2 / 0 / 1 / 1 / 0 | 2 / 0 / 1 / 1 / 0 | 2 / 0 / 1 / 1 / 0 | 2 / 0 / 1 / 1 / 0 | Pass |
| all-lost | 3 / 0 / 3 / 0 / 0 | 3 / 0 / 2 / 1 / 0 | 3 / 0 / 3 / 0 / 0 | 3 / 0 / 3 / 0 / 0 | Pass |
| one-deal | 1 / 0 / 1 / 0 / 0 | 2 / 0 / 1 / 0 / 0 (+1 unread) | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| standalone-and-reason-no-decision | 2 / 0 / 1 / 1 / 0 | 2 / 0 / 0 / 2 / 0 | 2 / 0 / 1 / 1 / 0 | 2 / 0 / 1 / 1 / 0 | Pass |
| quoted-csv-and-rival-win | 2 / 1 / 1 / 0 / 0 | 3 / 0 / 1 / 1 / 0 (+1 unread) | 2 / 1 / 1 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | Pass |
| only-headers-and-unlabelled-notes | 0 / 0 / 0 / 0 / 0 | 6 / 2 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |
| open-explicit-outcome | 2 / 1 / 0 / 0 / 1 | 4 / 1 / 1 / 0 / 0 (+2 unread) | 2 / 1 / 0 / 0 / 1 | 2 / 1 / 0 / 0 / 1 | Pass |
| review-numbered-dashes | 4 / 1 / 2 / 1 / 0 | 6 / 1 / 2 / 1 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 2 / 1 / 0 | Pass |
| review-closed-and-open | 3 / 1 / 1 / 0 / 1 | 3 / 1 / 1 / 0 / 0 (+1 unread) | 1 / 1 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| review-text-without-outcomes | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |
| clinic-comma-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 4 / 1 / 1 / 1 / 1 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-comma-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-comma-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 4 / 0 / 2 / 1 / 1 | 4 / 0 / 2 / 1 / 1 | Pass |
| clinic-pipe-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 4 / 1 / 1 / 1 / 1 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-pipe-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-pipe-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 4 / 0 / 2 / 1 / 1 | 4 / 0 / 2 / 1 / 1 | Pass |
| clinic-colon-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-colon-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-colon-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| clinic-hyphen-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-hyphen-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-hyphen-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| clinic-en_dash-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-en_dash-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-en_dash-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| clinic-em_dash-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-em_dash-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-em_dash-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| clinic-tab-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-tab-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-tab-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| clinic-was-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-was-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-was-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| clinic-parentheses-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-parentheses-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-parentheses-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| clinic-square_brackets-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-square_brackets-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| clinic-square_brackets-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-comma-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 4 / 1 / 1 / 1 / 1 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-comma-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-comma-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 4 / 0 / 2 / 1 / 1 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-pipe-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 4 / 1 / 1 / 1 / 1 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-pipe-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-pipe-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 4 / 0 / 2 / 1 / 1 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-colon-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-colon-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-colon-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-hyphen-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-hyphen-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-hyphen-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-en_dash-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-en_dash-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-en_dash-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-em_dash-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-em_dash-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-em_dash-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-tab-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-tab-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-tab-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-was-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-was-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-was-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-parentheses-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-parentheses-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-parentheses-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| bank-square_brackets-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-square_brackets-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| bank-square_brackets-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-comma-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 4 / 1 / 1 / 1 / 1 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-comma-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-comma-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 4 / 0 / 2 / 1 / 1 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-pipe-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 4 / 1 / 1 / 1 / 1 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-pipe-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-pipe-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 4 / 0 / 2 / 1 / 1 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-colon-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-colon-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-colon-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-hyphen-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-hyphen-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-hyphen-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-en_dash-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-en_dash-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-en_dash-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-em_dash-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-em_dash-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-em_dash-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-tab-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-tab-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-tab-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-was-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-was-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-was-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-parentheses-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-parentheses-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-parentheses-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| logistics-lead-square_brackets-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-square_brackets-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| logistics-lead-square_brackets-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-comma-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 4 / 1 / 1 / 1 / 1 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-comma-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-comma-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 4 / 0 / 2 / 1 / 1 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-pipe-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 4 / 1 / 1 / 1 / 1 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-pipe-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-pipe-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 4 / 0 / 2 / 1 / 1 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-colon-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-colon-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-colon-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-hyphen-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-hyphen-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-hyphen-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-en_dash-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-en_dash-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-en_dash-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-em_dash-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-em_dash-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-em_dash-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-tab-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-tab-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-tab-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-was-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-was-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-was-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-parentheses-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-parentheses-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-parentheses-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| insurer-square_brackets-exact | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-square_brackets-same | 4 / 1 / 1 / 1 / 1 | 6 / 1 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 1 / 1 / 1 / 1 | Pass |
| insurer-square_brackets-opposite | 4 / 0 / 2 / 1 / 1 | 6 / 0 / 2 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 4 / 0 / 2 / 1 / 1 | Pass |
| alias-1-exact | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-1-same | 1 / 1 / 0 / 0 / 0 | 3 / 1 / 0 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-1-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-2-exact | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-2-same | 1 / 1 / 0 / 0 / 0 | 3 / 1 / 0 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-2-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-3-exact | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-3-same | 1 / 1 / 0 / 0 / 0 | 3 / 1 / 0 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-3-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-4-exact | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-4-same | 1 / 1 / 0 / 0 / 0 | 3 / 1 / 0 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-4-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-5-exact | 1 / 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-5-same | 1 / 1 / 0 / 0 / 0 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-5-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-6-exact | 1 / 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-6-same | 1 / 1 / 0 / 0 / 0 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-6-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-7-exact | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-7-same | 1 / 0 / 1 / 0 / 0 | 3 / 0 / 1 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-7-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-8-exact | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-8-same | 1 / 0 / 1 / 0 / 0 | 3 / 0 / 1 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-8-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-9-exact | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-9-same | 1 / 0 / 1 / 0 / 0 | 3 / 0 / 1 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-9-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-10-exact | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-10-same | 1 / 0 / 1 / 0 / 0 | 3 / 0 / 1 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-10-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-11-exact | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-11-same | 1 / 0 / 1 / 0 / 0 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-11-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-12-exact | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-12-same | 1 / 0 / 1 / 0 / 0 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-12-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-13-exact | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-13-same | 1 / 0 / 1 / 0 / 0 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| alias-13-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-14-exact | 1 / 0 / 0 / 1 / 0 | 1 / 0 / 0 / 1 / 0 | 1 / 0 / 0 / 1 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-14-same | 1 / 0 / 0 / 1 / 0 | 3 / 0 / 0 / 1 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-14-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-15-exact | 1 / 0 / 0 / 1 / 0 | 1 / 0 / 0 / 1 / 0 | 1 / 0 / 0 / 1 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-15-same | 1 / 0 / 0 / 1 / 0 | 3 / 0 / 0 / 1 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-15-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-16-exact | 1 / 0 / 0 / 1 / 0 | 1 / 0 / 0 / 1 / 0 | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-16-same | 1 / 0 / 0 / 1 / 0 | 3 / 0 / 0 / 1 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-16-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-17-exact | 1 / 0 / 0 / 1 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-17-same | 1 / 0 / 0 / 1 / 0 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-17-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-18-exact | 1 / 0 / 0 / 1 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-18-same | 1 / 0 / 0 / 1 / 0 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 1 / 0 | Pass |
| alias-18-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-19-exact | 1 / 0 / 0 / 0 / 1 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 1 / 0 / 0 / 0 / 1 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-19-same | 1 / 0 / 0 / 0 / 1 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-19-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-20-exact | 1 / 0 / 0 / 0 / 1 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-20-same | 1 / 0 / 0 / 0 / 1 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-20-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-21-exact | 1 / 0 / 0 / 0 / 1 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-21-same | 1 / 0 / 0 / 0 / 1 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-21-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-22-exact | 1 / 0 / 0 / 0 / 1 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-22-same | 1 / 0 / 0 / 0 / 1 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-22-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| alias-23-exact | 1 / 0 / 0 / 0 / 1 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-23-same | 1 / 0 / 0 / 0 / 1 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 1 | Pass |
| alias-23-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| export-clinic-csv-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-clinic-csv-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-clinic-csv-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-clinic-pipe-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-clinic-pipe-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-clinic-pipe-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-clinic-tab-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-clinic-tab-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-clinic-tab-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-bank-csv-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-bank-csv-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-bank-csv-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-bank-pipe-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-bank-pipe-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-bank-pipe-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-bank-tab-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-bank-tab-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-bank-tab-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-logistics-lead-csv-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-logistics-lead-csv-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-logistics-lead-csv-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-logistics-lead-pipe-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-logistics-lead-pipe-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-logistics-lead-pipe-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-logistics-lead-tab-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-logistics-lead-tab-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-logistics-lead-tab-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-insurer-csv-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-insurer-csv-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-insurer-csv-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-insurer-pipe-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-insurer-pipe-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-insurer-pipe-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| export-insurer-tab-exact | 3 / 1 / 1 / 0 / 1 | 5 / 1 / 0 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-insurer-tab-same | 3 / 1 / 1 / 0 / 1 | 5 / 0 / 0 / 1 / 0 (+4 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| export-insurer-tab-opposite | 3 / 0 / 2 / 0 / 1 | 5 / 0 / 1 / 1 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 3 / 0 / 2 / 0 / 1 | Pass |
| unread-same-meaning | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |
| unread-opposite | 1 / 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| blank | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |
| reason-never-overrides-lost | 2 / 1 / 1 / 0 / 0 | 2 / 0 / 1 / 1 / 0 | 0 / 0 / 0 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | Pass |
| reason-same-meaning | 2 / 1 / 1 / 0 / 0 | 2 / 0 / 2 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | Pass |
| reason-opposite | 2 / 1 / 1 / 0 / 0 | 2 / 0 / 1 / 1 / 0 | 0 / 0 / 0 / 0 / 0 | 2 / 1 / 1 / 0 / 0 | Pass |
| negated-result | 0 / 0 / 0 / 0 / 0 | 3 / 2 / 1 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |
| negated-same-meaning | 0 / 0 / 0 / 0 / 0 | 2 / 1 / 0 / 0 / 0 (+1 unread) | 1 / 1 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |
| negated-opposite | 2 / 2 / 0 / 0 / 0 | 2 / 1 / 0 / 0 / 0 (+1 unread) | 1 / 1 / 0 / 0 / 0 | 2 / 2 / 0 / 0 / 0 | Pass |
| bare-labels-are-not-records | 0 / 0 / 0 / 0 / 0 | 6 / 1 / 2 / 1 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |
| identical-records-still-count | 2 / 2 / 0 / 0 / 0 | 2 / 0 / 0 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 2 / 2 / 0 / 0 / 0 | Pass |
| status-column-not-first | 3 / 1 / 1 / 0 / 1 | 4 / 1 / 1 / 1 / 0 (+1 unread) | 1 / 1 / 0 / 0 / 0 | 3 / 1 / 1 / 0 / 1 | Pass |
| explicit-status-after-reason | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 0 / 1 / 0 | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| unknown-explicit-column-is-not-reason | 1 / 0 / 1 / 0 / 0 | 3 / 1 / 0 / 1 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| different-section-format | 2 / 1 / 0 / 0 / 1 | 5 / 1 / 0 / 0 / 0 (+4 unread) | 1 / 1 / 0 / 0 / 0 | 2 / 1 / 0 / 0 / 1 | Pass |
| no-spaces-hyphen | 3 / 1 / 1 / 1 / 0 | 3 / 1 / 1 / 1 / 0 | 0 / 0 / 0 / 0 / 0 | 3 / 1 / 1 / 1 / 0 | Pass |
| result-before-identifier-with-header | 2 / 1 / 0 / 1 / 0 | 3 / 0 / 0 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 2 / 1 / 0 / 1 / 0 | Pass |
| ambiguous-result | 0 / 0 / 0 / 0 / 0 | 2 / 0 / 1 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |
| natural-clinic-exact | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| natural-clinic-same | 1 / 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| natural-clinic-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| natural-bank-exact | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| natural-bank-same | 1 / 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| natural-bank-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| natural-logistics-lead-exact | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| natural-logistics-lead-same | 1 / 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| natural-logistics-lead-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| natural-insurer-exact | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| natural-insurer-same | 1 / 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 (+1 unread) | 0 / 0 / 0 / 0 / 0 | 1 / 1 / 0 / 0 / 0 | Pass |
| natural-insurer-opposite | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | 1 / 0 / 1 / 0 / 0 | Pass |
| repeated-whitespace | 2 / 1 / 0 / 1 / 0 | 2 / 1 / 0 / 0 / 0 (+1 unread) | 1 / 1 / 0 / 0 / 0 | 2 / 1 / 0 / 1 / 0 | Pass |
| unlisted-bare-status-labels | 0 / 0 / 0 / 0 / 0 | 5 / 1 / 1 / 0 / 0 (+3 unread) | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |
| contraction-in-explicit-outcome-column | 0 / 0 / 0 / 0 / 0 | 4 / 2 / 0 / 0 / 0 (+2 unread) | 0 / 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 / 0 | Pass |

Across both modes, main is fully correct on 92/550 checks, round 1 on 140/550, and round 2 on **550/550**. **Main right and round 2 wrong: 0.** A partly right main summary is not treated as fully correct when it counts a heading, mistakes an open result for unread, or misstates unread text as blank. Full captured excerpts and repeat flags are in tests/fixtures/winloss-round2-comparison.json.

### Coverage and verification

New tests span clinics, banks, logistics and insurance. Ten separator groups run exact, same-count-meaning and opposite cases in every vertical, with headings and overall totals together. Every requested outcome phrase has exact, case/format-equivalent and opposite cases. Outcome-first exports vary comma, pipe and tab, plus a reason-first/status-last export. Extra cases cover emoji bullets, Windows line endings, repeated records, changed section formats, quoted CSV reasons, result fields after reasons, unread explicit columns, natural sentences, negation, ambiguity and contractions such as won’t sign. These are reusable formatting and status rules, not a list of the review sentences.

All 14 round 1 count expectations still pass. One assertion was updated to the newly required honest wording for nonblank unread text; no owner byte-pinned contract was changed. Existing single-deal writing and the connector tool list, descriptions and schemas are unchanged. Package version stays 1.2.32.

Focused suite: **293 passed, zero failed, one private-pool test skipped**. Full fixed-branch suite: **8,977 passed, one failed, 30 skipped**. Fresh main suite: **8,701 passed, one failed, 30 skipped**. Round 1 baseline in this run: **8,716 passed, one failed, 30 skipped**. The sole failure in all three is `scripts/test-in-field.mjs`, **already failing on main**, because the private HELIX_WORK run20/run21/run22 fixture folder is unavailable. There is no new suite failure. Current-dist verification is recorded below after the generated build commit.

Exact commands from the fix checkout:

```sh
git pull --rebase origin codex/winloss-count-fix-20261114
git fetch origin main
git worktree add --detach /workspace/winloss-main-round2 origin/main
git worktree add --detach /workspace/winloss-round1-review 1c7bfc8
# The checkouts used links to the already installed node_modules; no package changed.
npm run build
node --test tests/winloss-count-fix.test.mjs tests/winloss-round2.test.mjs tests/run22-win_loss_analyzer-rewrite.test.mjs tests/run21c-draft-win_loss_analyzer.test.mjs
npm test > /workspace/gtmhelix-tools-hub/work/winloss-count-fix-round2/after-full-tests.txt 2>&1
# From /workspace/winloss-main-round2:
npm run build
npm test > /workspace/gtmhelix-tools-hub/work/winloss-count-fix-round2/main-full-tests.txt 2>&1
# Real-handler captures (runner takes a checkout and a receipt label):
node /workspace/gtmhelix-tools-hub/work/winloss-count-fix-round2/capture.mjs /workspace/winloss-main-round2 main
node /workspace/gtmhelix-tools-hub/work/winloss-count-fix-round2/capture.mjs /workspace/winloss-round1-review round1
node /workspace/gtmhelix-tools-hub/work/winloss-count-fix-round2/capture.mjs /workspace/winloss-count-fix-20261114 round2
# After committing the generated build:
npm run check:current-dist
```

The permanent fixtures and assertions are tests/winloss-round2-cases.mjs and tests/winloss-round2.test.mjs. The committed comparison receipt retains real main/round1/round2 output excerpts for every input and mode. The comparison runner and full raw captured outputs remain in the hub’s ignored work/winloss-count-fix-round2/ scratch folder.

Scope: no release, publish, deploy, merge or PR. No model, key, provider or Site was touched. BRIEF-V4-LIVE.md was not read or started. Owner release review remains a separate step.
