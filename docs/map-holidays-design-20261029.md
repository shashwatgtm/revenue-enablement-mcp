# Mutual action plan holiday design

29 October 2026. Design only. No implementation or version change.

## Review receipt

Base: `740897982e3807aa43aa5420336eaf6804eeda5d`.
Branch: `codex/map-holidays-design-20261029`.
Changed file: `docs/map-holidays-design-20261029.md` only.
The head SHA is in the exported receipt. A commit cannot contain its own SHA.
Draft PR delivery is authorized. The final delivery receipt records its URL and head SHA.

The cloud checkout was clean and exactly matched the verified base. No applicable
AGENTS.md was found at the filesystem root, workspace root, or inside this repo.
No other branch was edited. The new branch started at the verified base.

Automation inspection: `git ls-tree -r --name-only HEAD .github` returned no
tracked workflow files. `netlify.toml` declares a build and hosted functions.
Only sample local Git hooks were present. The connected GitHub repository lookup
confirmed the repository identity and main as default. Available connected tools
cannot establish whether external deployment hooks or branch previews would run.
The coordinator confirmed the owner register: the five MCP sites use manual CLI
deployment. Only Alpha master is git linked. The coordinator lifted the remote hold
for this file and branch only. Deliver through connected GitHub writes and open a
draft PR. Do not dispatch workflows or change deployment settings.

## Finding and recommendation

Recommend warning first. Keep the existing weekend date calculation. Add a clear
holiday coverage warning in a later, separately authorized implementation.
Do not infer a country, jurisdiction, employer calendar, or holiday from a name,
industry, browser timezone, or server locale.

`src/dealtext.ts:382-405` defines working days as Monday through Friday.
`onOrBeforeWorkday` moves weekend targets backward. `onOrAfterWorkday` moves a
weekend start forward. `addWorkdays` and `workdaysBetween` use UTC date operations.
They do not exclude holidays. The latter counts the end date but not the start.

`src/rw1-map.ts:55-59` parses the requested target and calculates calendar days.
Lines 96-130 split the available weekdays into weighted phases. Milestones are
spread through each phase and capped at its end. Several milestones can share a
date. Later sections generate phase gates and next actions separately.
`src/index.ts:3431-3433` checks past date-only targets at the shared input boundary.
This must remain consistent with any future calendar validation.

A requested Sunday 2027-01-31 moves to Friday 2027-01-29. The overview retains the
requested date and explicitly explains the effective close date. This is correct
weekend behavior. The earlier reported legal milestone on 2026-12-25 illustrates
the holiday coverage gap. That date is a Friday. The helpers allow it. The exact
reported milestone was not reproduced here because the complete original input
and clock snapshot were not supplied. It is not proof of a universal holiday.

| Option | Behavior | Compatibility | Limits |
| --- | --- | --- | --- |
| Warning first | Keep dates. Explain that only weekends were excluded. | No input schema change. Existing text hosts remain useful. | Does not move a legal review off an unavailable date. Buyer must confirm. |
| Explicit calendar | Caller supplies exact unavailable dates and opts into adjustment. | Additive future input and output contract. Omission preserves existing dates. | Requires calendar coverage, observed dates, and dependency validation. |

Do not silently install a default national calendar. Do not call a holiday API.
Warning first is the smallest honest improvement while 1.2.31 is in review.
Explicit calendars can follow after contract review and synthetic regression tests.

## Proposed warning contract

Future text, placed after the close adjustment and before the timeline:

> Dates exclude Saturdays and Sundays only. Public holidays, observed holidays and company closures have not been checked. Confirm every milestone and the close date with both teams, especially legal and procurement reviews.

The warning must also cover phase gates and next actions. Never say a date is
holiday safe. Do not selectively flag 25 December without an explicit calendar.
Keep the existing Sunday adjustment explanation. Existing dates, owners, stage
weights, tool name, endpoint and required arguments stay the same. Only the warning
text changes in this option. No calendar schema is applied by this document.

## Future explicit calendar contract

This is a proposal, not the current tool schema. Add optional `calendar_policy`
with values `warn_only` and `supplied_calendar`. Omission means `warn_only`.
A calendar must not activate date movement merely because it is present.
Reject an unrecognized policy. Reject a calendar paired with `warn_only` rather
than ignore the caller's intended closure dates.

For `supplied_calendar`, require a calendar object with a synthetic or user label,
`coverage_start`, `coverage_end`, and `unavailable_dates`. Each entry has a strict
YYYY-MM-DD `date` and a short `label`. The caller supplies the union of dates when
any required participant is unavailable. No jurisdiction field is inferred.
Limit the list to 1000 entries and the covered span to 3660 days. Deduplicate dates
and preserve all distinct labels. Treat labels as untrusted display text.

Require coverage from the planning start through the requested close, including
any proposed next action. A missing or partial calendar is an error in this mode.
An empty list is valid only with explicit coverage. Say that the supplied calendar
lists no closures, rather than claiming there are none in the real world.

The caller must enumerate actual and observed closures separately. For example,
if a synthetic calendar closes on both Saturday 2026-12-26 and Monday 2026-12-28,
both must be listed. Do not invent a Friday, Monday, nearest weekday, substitute
day, or carry-over rule. Keep observed-date generation out of this contract.

Validate real calendar dates by round trip. Reject 2027-02-29, timestamp strings,
invalid ranges, and malformed entries. Do not accept JavaScript date rollover.
Represent dates as civil date strings or UTC day integers. Never parse them at
local midnight. Use an explicit UTC date snapshot for today to match the existing
calendar convention. Capture it once per request. Explain this convention to the
caller. Browser timezone must not change results. No timezone or locale lookup.

Return requested close, effective close, calendar label, coverage, warnings, and
an adjustment list. Each adjustment identifies the affected milestone, original
date, effective date, and reason. Include the same facts in plain text.

A future adjustment algorithm must use one unavailable-day predicate for starts,
close, phase allocation, milestones, phase gates and next actions. The predicate
excludes Saturdays, Sundays and supplied dates. Start moves forward. Close moves
backward, never after the requested target. Recompute the weekday budget using
this predicate, rather than adjusting rows independently after allocation.

Keep dependency order explicit. A predecessor must finish before a dependent step
when it needs a full working day. Independent steps may share a date, but disclose
parallel work. The current model does not encode those dependency edges or task
durations. A calendar alone cannot guarantee feasibility. A future implementation
must define and test those edges before promising a feasible adjusted plan.
If an edge cannot fit, return an infeasible result with the conflicting steps and
ask for a later close or revised dependencies. Do not silently drop milestones,
compress a required gap to zero, or mark tasks done.

If the effective close is before today or before the planning start, return an
infeasible result. A requested date before today remains refused. A target today
requires the same dependency checks. Next actions must not spill past the effective
close. Show the conflicting action instead of silently capping a required duration.
Bound date searches to calendar coverage. An all-closed interval must terminate.

Example: Sunday 2027-01-31 still becomes Friday 2027-01-29 when that Friday is
available. If the caller explicitly closes that Friday, effective close becomes
Thursday 2027-01-28, subject to feasibility. Explain both the weekend and closure.
A supplied 2026-12-25 closure excludes that day from legal reviews and all other
milestones. These are synthetic closure fixtures, not jurisdiction assertions.

## Migration and validation

Step 1, after separate authorization: implement only the warning. Snapshot current
dates across stages and compare them after removing the new warning. Verify both
stdio and hosted in-process tool calls. Keep 1.2.31 and its review untouched tonight.

Step 2, in a later workstream: agree strict parsing, coverage, bounds and dependency
semantics. Add an opt-in calendar to the existing named tool. Version any future
structured result contract explicitly. Omitted fields must preserve warning-first
dates. Never infer calendar mode from a deal description. Roll back the optional
mode by rejecting it clearly, not by quietly using weekend dates.

Run fixed-clock tests for weekends, supplied holidays, observed conventions, leap
days, year boundaries, empty calendars, partial coverage, duplicate dates, all-closed
ranges, short plans, close collisions, invalid policies and past targets. Run identical
fixtures under UTC, Asia/Kolkata and America/Los_Angeles. Assert identical civil
dates. Include month boundaries and DST dates. Test every displayed date section.
Run shared-helper regressions because other tools import the date helpers.

## Proposed executable regression tests

The following Node test source is embedded for a future implementation. It was not
saved as a test file or executed. Its adapter does not exist on the base. Proposed
command after implementation: `node --test tests/map-calendar-contract.test.mjs`.
The future adapter returns `{ dates, text, requestedClose, effectiveClose, warnings,
adjustments, status, conflicts }` and accepts a fixed `today`. `dates` includes all
milestones, phase bounds, gates and next actions. All fixture data is synthetic.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan } from './support/map-calendar-adapter.mjs';

const base = {
  today: '2026-10-29', deal_name: 'Synthetic evaluation',
  target_close_date: '2027-01-31', current_stage: 'evaluation'
};
const calendar = (dates) => ({
  label: 'Synthetic closures', coverage_start: '2026-10-29',
  coverage_end: '2027-01-31',
  unavailable_dates: dates.map(date => ({ date, label: 'Synthetic closure' }))
});
const supplied = (dates) => ({ ...base, calendar_policy: 'supplied_calendar',
  calendar: calendar(dates) });

test('warning preserves weekend dates without guessing holidays', () => {
  const a = plan(base);
  const b = plan({ ...base, calendar_policy: 'warn_only' });
  assert.deepEqual(a.dates, b.dates);
  assert.equal(a.requestedClose, '2027-01-31');
  assert.equal(a.effectiveClose, '2027-01-29');
  assert.match(a.text, /Sunday.*2027-01-29/s);
  assert.match(a.text, /holidays.*not been checked/is);
});

test('supplied closures affect every date section and close', () => {
  const a = plan(supplied(['2026-12-25', '2027-01-29']));
  assert.equal(a.effectiveClose, '2027-01-28');
  for (const date of a.dates) {
    assert.ok(!['2026-12-25', '2027-01-29'].includes(date));
    assert.ok(date >= base.today && date <= a.effectiveClose);
    assert.ok(![0, 6].includes(new Date(date + 'T00:00:00Z').getUTCDay()));
  }
  assert.ok(a.adjustments.some(x => x.effectiveDate === '2027-01-28'));
});

test('observed closures are explicit, never derived', () => {
  const a = plan(supplied(['2026-12-26']));
  const b = plan(supplied(['2026-12-26', '2026-12-28']));
  assert.ok(!a.adjustments.some(x => x.reasonDates.includes('2026-12-28')));
  assert.ok(!b.dates.includes('2026-12-28'));
});

test('strict dates and coverage fail visibly', () => {
  for (const target_close_date of ['2027-02-29', '2026-10-28',
    '2027-01-31T00:00:00Z']) {
    assert.throws(() => plan({ ...base, target_close_date }));
  }
  assert.throws(() => plan({ ...supplied([]), calendar: undefined }));
  const short = { ...calendar([]), coverage_end: '2026-12-31' };
  assert.throws(() => plan({ ...supplied([]), calendar: short }));
  assert.throws(() => plan({ ...base, calendar: calendar([]) }));
});

test('a required dependency cannot be compressed into the close', () => {
  const a = plan({ ...base, target_close_date: base.today,
    dependencies: [{ before: 'legal', after: 'signature', minWorkingDays: 1 }] });
  assert.equal(a.status, 'infeasible');
  assert.ok(a.conflicts.some(x => x.before === 'legal' && x.after === 'signature'));
});
```

These five proposed tests are a starting contract suite. They are not five passes.
Add the remaining validation matrix above before accepting calendar mode. The
adapter must call production logic and may not implement a parallel scheduler.

## UI description and official documentation

No new UI was built or opened. No browser check or screenshot was taken. Proposed
presentation: keep the requested close and effective close visible above the table.
Place the holiday coverage warning immediately below. In supplied mode, show the
calendar label and coverage, then each adjustment beside the affected row. Use text
as well as status styling. Put infeasible dependencies before the timeline. A text
host receives all these facts without a component.

Official pages were read through the connected web tool on 29 October 2026:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review

The requested .md URLs returned unsupported text/markdown from that tool. The HTML
pages succeeded. The UI page describes MCP Apps initialization, notifications and
resource attachment. Any later UI must attach only to `mutual_action_plan_generator`
using `_meta.ui.resourceUri`. Use `ui/initialize`, tool input and result notifications,
`tools/call`, and `structuredContent`. Serve `text/html;profile=mcp-app`. Retain useful
text output. The optional decoupled render-tool pattern is outside the user's scope.
The review page requires exact domains in the UI CSP. Keep external access empty
when unnecessary; allow only exact required domains if later justified. No wildcard
CSP or holiday service is proposed. No skills are added to an OpenAI package.

## Actual test receipts and boundary audit

All commands ran in the managed cloud checkout. Dependencies were already installed.
No package install, build, service startup or hosted request was performed.

1. `node --no-warnings --test tests/run22-mutual_action_plan_generator-rewrite.test.mjs`
   exited 0. Reported tests 1, pass 1, fail 0, skipped 0, cancelled 0, todo 0.
   This is a file-level result. It did not report the 11 named tests.
2. `node --no-warnings --test --test-reporter=tap tests/run22-mutual_action_plan_generator-rewrite.test.mjs`
   exited 0. Same file-level counts. Not counted as extra assertion coverage.
3. `node --no-warnings --test --test-isolation=none --test-reporter=tap tests/run22-mutual_action_plan_generator-rewrite.test.mjs`
   exited 0 on Node v24.19.0. Tests 11, pass 11, fail 0, skipped 0,
   cancelled 0, todo 0. Duration 466.65959 ms. All named cases were reported.

No assertion failures occurred. The cause of the isolated reporter's file-only
summary was not established. The in-process rerun supplies explicit named results.
Existing tests exercise weekdays, short windows and past targets. They do not prove
holiday support. Proposed future tests above were not run. Build and browser checks
were not run because this change is documentation only. No new UI exists to check.

Boundary audit: only this document changes. No production, test, package, build,
version, tool, endpoint, authentication, video, challenge file or headers change.
No deployment command, deployment setting change, DNS change, merge,
package publication, package upload, directory submission, legal declaration, paid API, API agent,
shell MCP tool, owner laptop access, secret read or credential output was used.
No client or prospect is named. Existing test fixtures are documented as invented.
The only new branch is the authorized branch. The coordinator authorized remote
delivery of this document and a draft PR after confirming manual CLI deployment.
No other remote write is authorized. The full diff and changed file were exported
for review. Unchanged passing tests were not repeated for delivery.
