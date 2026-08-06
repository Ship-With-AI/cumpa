---
status: resolved
trigger: "Security cancellation race from 14-SECURITY.md: attached coordinator/run CLI/capability delivery boundary and smallest existing focused test. Remove the check-then-await gap so cancellation racing immediately before stdout is linearized with the irreversible write: after cancellation begins, no new stdout callback may start. Keep one-shot success, response-settlement, retry-safe refusal, and terminal failure contracts intact. Add a deterministic barrier test that proves the exact interleaving."
created: 2026-08-06T00:00:00Z
updated: 2026-08-06T00:04:00Z
---

## Current Focus

reasoning_checkpoint:
  hypothesis: Capability authorization happens before an awaitable delivery adapter, so signal cancellation can terminalize the coordinator while the adapter is paused and the adapter can subsequently start stdout.
  confirming_evidence:
    - runDelivery performs its sole terminal check before awaiting the supplied operation.
    - The deterministic barrier test reached the authorized adapter, signalled shutdown, then released it and observed one stdout callback despite a deliveryFailed response and exit 130.
  falsification_test: If the current implementation produced zero stdout callbacks when the barrier is released after cancellation, this hypothesis would be false.
  fix_rationale: Move coordinator runDelivery ownership into the CLI delivery port and invoke stdout synchronously inside its guarded operation; capability code awaits the guarded boolean result, so cancellation and stdout start share one non-awaiting linearization boundary.
  blind_spots: OS-level writes already started before cancellation remain irreversible by contract; the change only governs cancellation before stdout callback start.
next_action: none — fixed and verified in Phase 14

## Symptoms

expected: Cancellation racing at any point before the irreversible stdout write prevents that write and terminalizes the one-shot operation; normal success ordering/output remains unchanged.
actual: A cancellation interleaving immediately before stdout may allow a new stdout callback to start after cancellation begins.
errors: Phase 14 security final-gate cancellation delivery race.
reproduction: Deterministically pause after capability delivery authorization but before the injected stdout callback, begin cancellation, release delivery, and observe whether stdout starts.
started: Present in the Phase 14 attached completion implementation audited after the initial signal fence fix.

## Eliminated

## Evidence

- timestamp: 2026-08-06T00:01:00Z
  checked: src/server/attached-completion.ts runDelivery
  found: runDelivery checks terminal state once, then awaits an unrestricted async operation.
  implication: Any await inside that operation reopens a cancellation-to-irreversible-write gap.
- timestamp: 2026-08-06T00:02:00Z
  checked: src/server/capabilities.ts range and exact-patch finalizers plus src/cli/run.ts delivery adapter
  found: Both capability finalizers wrap the CLI-owned deliver callback in runDelivery; the CLI adapter invokes stdout inside that awaitable callback, rather than placing the coordinator fence directly beside stdout.
  implication: The existing final-validation barrier test proves earlier cancellation only, not cancellation after capability runDelivery authorization and before stdout callback start.
- timestamp: 2026-08-06T00:03:00Z
  checked: Focused Vitest regression at the delivery-adapter barrier
  found: The pre-fix test failed because stdout contained one canonical byte array after SIGINT had already triggered shutdown; the response was deliveryFailed and the process exit was 130.
  implication: Cancellation terminalization and response classification were working, but irreversible output start was not linearized with cancellation.
- timestamp: 2026-08-06T00:04:00Z
  checked: Post-fix exact regression and three focused lifecycle test files
  found: The exact delivery-boundary regression passed with zero stdout; all 44 focused tests passed, including normal success ordering, response settlement, retry-safe revision refusal, one-shot duplicate suppression, and terminal stdout failure.
  implication: Relocating the coordinator fence to the CLI-owned stdout adapter closes the race without changing adjacent lifecycle outcomes.

## Resolution

root_cause: The capability layer authorized an unrestricted async delivery adapter with runDelivery before the adapter reached the CLI stdout callback. Cancellation during an await inside that adapter set the terminal result but could not revoke the earlier authorization, so stdout could still start afterward.
fix: The CLI delivery port now calls coordinator.runDelivery directly around the synchronous start of stdout and returns whether delivery began. Both range and exact-patch capability finalizers consume that boolean instead of authorizing an awaitable adapter earlier.
verification: Pre-fix deterministic barrier failed with one stdout write after SIGINT. Post-fix exact regression passed; focused request/API/coordinator run passed 44/44.
files_changed: [src/cli/run.ts, src/server/capabilities.ts, tests/cli/request.test.ts, tests/api/attached-completion.test.ts]
