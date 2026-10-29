# W5c timing test design, 29 October 2026

Base: `740897982e3807aa43aa5420336eaf6804eeda5d` on `main`. The coordinator verified this SHA through GitHub at about 09:48 IST on 29 October 2026. Branch: `codex/timing-tests-20261029`. Runtime: Node 24.19.0. No runtime version was changed.

Design only. This is the only file changed in this repository. No source, build, test, schema or package change is applied. The existing base was built and tested. The implementation described below is proposed for later approval, after the current review boundary is lifted.

## Measurement design

Correctness stays independent of timing. Keep every hostile value, legacy fixture, inertness assertion, ordinary-text assertion and long input. The four escape test files split the original combined test into a correctness test and a timing test. Content already has separate correctness tests.

The timing helper runs synchronous work in a worker thread. It warms every quarter-size and full-size input once. It then measures each size exactly once. It measures user plus system CPU time while the parent waits. This removes scheduling delay from the performance budget. GC and worker CPU still count. No result is selected from retries.

Keep the original numeric CPU ceilings: 250 ms for each full escape input, or 4000 ms for Content's full input set. Add a growth check: four times the input may use less than eight times the CPU. The small sample has a 5 ms floor to avoid timer noise. Linear work should approach four times. Quadratic work approaches sixteen times. The fixed ceiling still catches slower work below the growth floor.

The responsive parent terminates the worker after 15000 ms, including imports, warmup and measurement. This is a completion bound, not the CPU pass budget. The original escape budgets sum to 3500 ms for one full pass. Warmup and quarter-size work need additional time. Healthy busy runs remain well below the wall bound. A nonreturning mutant proves termination. This worker approach avoids this cloud's Node child-process restriction. It provides the same independent timeout property without a shell or child-process launch.

A process CPU clock also counts Node background threads. The helper assumes the calling test does not run other work concurrently in the same process. These top-level tests use Node's default sequential scheduling. Parallel test files normally have separate processes. Cloud receipts use in-process isolation with sequential tests because nested Node child execution is restricted.

## Test receipts

Counts are individual Node tests, not file-only runner summaries. Existing suite skips are preserved. No skip was added. Preliminary default-runner logs are not accepted as receipts. Default isolation could report a file without reporting individual tests. The accepted runs use `--test-isolation=none`.

| Run | Exit | Pass | Fail | Skip |
| --- | --- | --- | --- | --- |
| base-isolated-actual | 0 | 1 | 0 | 0 |
| base-busy-actual | 0 | 1 | 0 | 0 |
| suite | 0 | 1189 | 0 | 30 |

Busy checks used `taskset -c 0` for the tests and two bounded Python CPU workers on CPU 0. The normal busy phase was capped at 240 seconds. The mutant phase was capped at 120 seconds. Both workers were stopped in a finally block after each phase. No live load testing occurred. The unchanged bases also passed in these conditions, so the intermittent failure was not reproduced in this run.

No mutant or proposed test was applied or run in Revenue. The five peer implementations provide experimental evidence for this design. Revenue receipts above are strictly unchanged-base receipts.

The suite has 30 existing skips. These include missing private/project fixtures and tests for an unported earlier ROI rewrite. No failure occurred.

Build command: `npm run build` (exit 0).

Accepted test commands, working directories, exit codes and complete TAP logs are in the [cloud evidence archive](https://github.com/shashwatgtm/icp-intelligence-mcp/raw/refs/heads/codex/timing-tests-20261029/docs/w5c-evidence-20261029.tar.gz). The archive also includes the base scaffolds specification, mutation wrappers, harnesses, timing logs and Alpha patch. The JSON manifests retain exact argv, not reconstructed commands.

Main test commands in this repository:

```sh
node --test --test-isolation=none --test-reporter=tap --test-name-pattern='every escaped value is inert by itself|large and adversarial inputs run quickly' tests/run40s-escape.test.mjs
node --test --test-isolation=none --test-reporter=tap tests/*.test.mjs
```

## Automation and delivery

Inspected tracked instructions, package scripts, netlify.toml and the complete GitHub tree at the verified base. No applicable AGENTS.md or workflow files were found. The GitHub workflow-list URL was rejected by the connector, so the complete nontruncated Git tree was used. Builds are TypeScript only, except Alpha's static-site script. No automation settings were changed.

The coordinator confirms this site uses manual CLI deployment. A codex branch and draft PR are authorized. The connector will deliver the tested bytes because shell Git cannot connect to the cloud proxy. No deployment command is part of delivery.

## Documentation and UI scope

Read directly through the connected web tool on 29 October 2026:

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/app-review

The coordinator independently read these pages and supplied the same findings. Direct cloud curl failed because the configured proxy refused connections. The connected web reader succeeded.

The UI guide favors MCP Apps fields and bridge messages. It uses `_meta.ui.resourceUri`, tool notifications, `tools/call` and `structuredContent`. The review page requires exact CSP domains. The coordinator also verified `ui/initialize`, `ui/notifications/initialized`, MIME `text/html;profile=mcp-app`, and resource `_meta.ui.csp` keys `connectDomains`, `resourceDomains` and `frameDomains`. Any later UI must check `event.source === parent`, treat received data as untrusted, and keep text-only hosts useful. Bundle assets and use empty domain lists when no network access is needed. Keep attachment on the existing named tool. Do not add a render tool. No checkout flow or durable user storage.

This patch changes tests and review evidence only. No browser check or screenshot was taken. There is no new UI to inspect. The existing text responses are exercised by direct local handler tests. No live endpoint was contacted.

## Boundary audit

Only the new `codex/timing-tests-20261029` branch is used. No main or master write, force push, merge, ready-for-review transition, workflow dispatch, deployment, Netlify command or DNS change. No challenge file or its headers changed. No production algorithm, schema, output, endpoint, authentication, tool name, package version, dependency or hosted video changed. No submission, publication, package upload, legal declaration, OpenAI package skill, shell MCP tool, paid API call or delegated agent was used. No credentials were read or printed. All checks ran in this cloud. Inputs are synthetic. Any company names already present in suite fixtures are review fixture inputs, not clients or prospects. No unrelated branch or user work was changed.

## Exact proposed test change, not applied

The base escape test is byte-identical to the ICP base test. Apply this diff later and add the helper below at `tests/helpers/cpu-budget.mjs`. No other production or package edit is required.

```diff
diff --git a/tests/run40s-escape.test.mjs b/tests/run40s-escape.test.mjs
index 2d26427..70031c5 100644
--- a/tests/run40s-escape.test.mjs
+++ b/tests/run40s-escape.test.mjs
@@ -4,6 +4,7 @@
 // Same file in every repo. Checks the answer text itself (no Markdown parser here; the run's property test renders every answer
 // with pandoc gfm and commonmark, micromark and mdast: work/run40s/prop/). Neutral targets only (evil.example, B81).
 import test from "node:test";
+import { assertCpuBudget } from "./helpers/cpu-budget.mjs";
 import assert from "node:assert/strict";
 import { existsSync, readFileSync } from "node:fs";

@@ -79,13 +80,13 @@ test("the escape pass: every escaped value is inert by itself (unit)", () => {
   }
   // ordinary text without the escaped characters is unchanged
   for (const v of ["Mid-market logistics software company.\nBuyers: VP Operations and the CFO.", "Budget $75,000 (hypothetical), 40 reps", "hardware_software", "30-day", "Series A fintech, 3x pipeline"]) assert.equal(mod.escapeText(v), v);
-  // linear: 200,000 characters of the worst atoms in well under a second
-  for (const unit of ["[](", "\\`<!", "\n- ", "www.a@b.c ", "\t#", "#", "##x", "&#", ":a", "1", "-", "=", "$", "_"]) {
-    const s = unit.repeat(Math.ceil(200000 / unit.length));
-    const t0 = performance.now();
-    mod.escapeText(s);
-    assert.ok(performance.now() - t0 < 250, `slow on ${JSON.stringify(unit)}`);
-  }
+});
+
+// Correctness above is independent of machine scheduling and performance below.
+test("the escape pass: large adversarial inputs stay within the CPU budget", async () => {
+  const inputs = ["[](", "\\`<!", "\n- ", "www.a@b.c ", "\t#", "#", "##x", "&#", ":a", "1", "-", "=", "$", "_"].map((unit) => unit.repeat(Math.ceil(200000 / unit.length)));
+  await assertCpuBudget(new URL(G ? "../netlify/lib/escape-inputs.js" : "../dist/escape-inputs.js", import.meta.url),
+    "escapeText", inputs, 250);
 });

 test("no tool repeats live markup from any text field (MCP)", async () => {
```

Proposed helper, complete file:

```js
// Keep the parent responsive so even a synchronous hang has a hard wall bound.
import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";

const WORKER = `
  const { parentPort, workerData } = require("node:worker_threads");
  (async () => {
    const { moduleUrl, exportName, inputs } = workerData;
    const fn = (await import(moduleUrl))[exportName];
    // Warm each size once. Measure each once. No retries or best-of selection.
    for (const input of inputs) { fn(input.slice(0, Math.ceil(input.length / 4))); fn(input); }
    const samples = [];
    const measure = (input) => {
      const start = process.cpuUsage();
      const output = fn(input);
      const cpu = process.cpuUsage(start);
      if (typeof output !== "string") throw new Error("expected string output");
      return (cpu.user + cpu.system) / 1000;
    };
    for (const input of inputs) {
      samples.push([measure(input.slice(0, Math.ceil(input.length / 4))), measure(input)]);
    }
    parentPort.postMessage(samples);
  })().catch((error) => { throw error; });
`;

export async function assertCpuBudget(moduleUrl, exportName, inputs, budgetMs, aggregate = false) {
  const worker = new Worker(WORKER, {
    eval: true,
    workerData: { moduleUrl: String(moduleUrl), exportName, inputs },
  });
  let timer;
  let samples;
  try {
    samples = await new Promise((resolve, reject) => {
      // Includes import, warmup and measurement. Parent stays idle while measuring.
      timer = setTimeout(() => reject(new Error("timing worker exceeded 15000 ms wall bound")), 15000);
      worker.once("message", resolve);
      worker.once("error", reject);
      worker.once("exit", (code) => reject(new Error(`timing worker exited without samples: ${code}`)));
    });
  } finally {
    clearTimeout(timer);
    await worker.terminate();
  }
  assert.equal(samples.length, inputs.length);
  const large = samples.map((pair) => pair[1]);
  const checked = aggregate ? [large.reduce((a, b) => a + b, 0)] : large;
  for (const [index, ms] of checked.entries()) {
    assert.ok(Number.isFinite(ms) && ms < budgetMs,
      `CPU budget exceeded: ${ms.toFixed(2)} ms >= ${budgetMs} ms (${aggregate ? "all inputs" : `input ${index}`})`);
  }
  for (const [index, [small, large]] of samples.entries()) {
    // Four times the input allows up to eight times the CPU. A 5 ms floor
    // avoids dividing by timer noise for very cheap inputs. Quadratic growth
    // tends toward sixteen times and fails once the workload exceeds that floor.
    assert.ok(large < 8 * Math.max(small, 5),
      `superlinear CPU growth on input ${index}: ${small.toFixed(2)} -> ${large.toFixed(2)} ms`);
  }
  console.log(`timing CPU ms [quarter, full]: ${JSON.stringify(samples)}`);
}
```

Existing-base targeted TAP receipts:

```text
(node:2207) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///workspace/revenue-enablement-mcp/src/index.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /workspace/revenue-enablement-mcp/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
TAP version 13
# Subtest: the escape pass: every escaped value is inert by itself (unit)
ok 1 - the escape pass: every escaped value is inert by itself (unit)
  ---
  duration_ms: 346.254644
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 706.935172
```
```text
(node:2312) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///workspace/revenue-enablement-mcp/src/index.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /workspace/revenue-enablement-mcp/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
TAP version 13
# Subtest: the escape pass: every escaped value is inert by itself (unit)
ok 1 - the escape pass: every escaped value is inert by itself (unit)
  ---
  duration_ms: 1224.914583
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2487.198523
```
