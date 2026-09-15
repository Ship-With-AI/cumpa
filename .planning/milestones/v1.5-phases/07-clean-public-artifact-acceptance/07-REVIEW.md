---
phase: 07-clean-public-artifact-acceptance
reviewed: 2026-09-12T16:34:36Z
depth: deep
files_reviewed: 19
files_reviewed_list:
  - tests/helpers/public-artifact-identity.ts
  - tests/helpers/public-runtime.ts
  - tests/helpers/acceptance-runtime.ts
  - tests/helpers/open-runtime-session.ts
  - tests/helpers/omp-profile.ts
  - tests/helpers/runtime-artifact.ts
  - tests/e2e/public-support-states.spec.ts
  - tests/e2e/marketplace-review.spec.ts
  - tests/e2e/agent-ready-export.spec.ts
  - tests/e2e/package-assets.spec.ts
  - tests/package/public-artifact-acceptance.test.ts
  - tests/package/marketplace-profile-acceptance.test.ts
  - tests/package/agent-ready-export.test.ts
  - tests/unit/public-artifact-identity.test.ts
  - tests/unit/publish-scenario-record.test.ts
  - tests/unit/acceptance-evidence.test.ts
  - scripts/write-acceptance-evidence.mjs
  - playwright.runtime-artifact.config.ts
  - package.json
findings:
  critical: 5
  warning: 1
  info: 0
  total: 6
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-09-12T16:34:36Z  
**Depth:** deep  
**Files Reviewed:** 19  
**Status:** issues_found

## Summary

The global and npx adapters contain good direct protections: exact pinned resolution checks, separator-bounded realpath containment, empty-cache preconditions, a sanitized tool bin, symlink rejection, and owned-root cleanup. The phase evidence pipeline nevertheless has material integrity, redaction, and OMP-isolation defects. In particular, the marketplace path fabricates support-state rows, the consolidator resolves contradictory reports by input order, and its declared producers cannot supply its required host facts.

Focused unit checks passed: `npx vitest run tests/unit/public-artifact-identity.test.ts tests/unit/publish-scenario-record.test.ts tests/unit/acceptance-evidence.test.ts` (3 files, 16 tests). Those checks do not cover the failing cross-process/report-merge paths below.

## Critical Issues

### BL-01: Marketplace support evidence is not window-scoped or observation-backed

**File:** `tests/e2e/marketplace-review.spec.ts:66-92`  
**Issue:** The spec ignores `CUMPA_SUPPORT_STATE_WINDOW`. It always attempts the unverified/dismissed flow, then unconditionally appends a `verified` row blocked as `live-entitlement-unavailable` with `restoreObservedFromSharedIdentity: true` and `restoreReportedCompleteWithoutLinkage: true`. No live refresh, Restore attempt, persisted-state check, or verified-mode observation backs that row. In a post-restore run, it can also append a passed dismissed row even though it never observed an unverified prompt or dismissed it. The record therefore attributes state-specific results to the marketplace installation path that the run did not observe.

**Impact:** A durable ACC-04 matrix can contain a plausible reason and `substituted: false` while still being fabricated for this installation path. This defeats the phase's evidence-integrity rule that state rows are per-path observations, not copied diagnosis.

**Fix:** Parse and validate the window. Emit only unverified/dismissed rows in `pre-restore`; emit only a verified row in `post-restore`, backed by a live refresh and the path's own review/export/Finish behavior. If the known entitlement failure is diagnosed during that run, create the blocked row from that observed failure; otherwise use the applicable observed blocked reason. Add tests for both windows and for a verified startup state.

### BL-02: Consolidation silently selects the first contradictory report

**File:** `scripts/write-acceptance-evidence.mjs:151-166`  
**Issue:** `mergeReports()` takes the first report's install proof, shared-identity flag, path status, and each state (`find(...)`). It neither verifies equality across reports nor treats a later blocked duplicate conservatively. For example, a passed verified state listed before a blocked verified state is retained; `deriveAcceptanceStatus()` then sees only the passed state and can return `passed`.

**Impact:** The ordering of input report paths can turn contradictory evidence into a passed path or overall acceptance result. This directly violates the stated no-overstatement and no-substitution guarantees.

**Fix:** Strictly validate reports before merging. Require identical immutable install proof and shared-identity facts, reject duplicate state rows that disagree, and derive every merged status conservatively. Include focused tests for passed-then-blocked and blocked-then-passed duplicates, mismatched integrity, and mismatched shared-identity flags.

### BL-03: The evidence writer cannot consume the reports its own drivers emit

**File:** `scripts/write-acceptance-evidence.mjs:221-223`; `tests/package/public-artifact-acceptance.test.ts:192-239`; `tests/package/marketplace-profile-acceptance.test.ts:145-169`  
**Issue:** `writeAcceptanceEvidence()` requires at least one input report to carry `host`, but neither the public driver nor the marketplace driver publishes host facts in its report object. With only the named producer reports, the writer always throws `reports must contain observed host facts`.

**Impact:** The committed acceptance record is not reproducible from the harness's own generated reports. It must have been assembled from an out-of-band or manually augmented input, breaking the evidence chain between the executable acceptance run and the durable record.

**Fix:** Capture the permitted host facts once during each driver run and include the same bounded, non-private `host` object in every report (or in a dedicated required report). Add an integration-level writer test that feeds unmodified producer-shaped reports and verifies publication succeeds.

### BL-04: Redaction leaves absolute private paths and raw agent output exposed

**File:** `scripts/write-acceptance-evidence.mjs:51-59`; `tests/package/marketplace-profile-acceptance.test.ts:112-117`  
**Issue:** The evidence scan rejects only `/Users/`, `/home/`, and Windows-drive paths. It accepts other absolute private macOS/POSIX paths such as `/private/var/folders/...` when carried under an unflagged key. Separately, the marketplace browser-failure path includes the last 1,000 bytes of raw OMP output in a thrown error. That output can echo the prompt's private temporary paths, the loopback capability URL, or provider/hosted-flow data.

**Impact:** A failure can place private local paths or authentication-related data into Vitest/CI logs, and a later record can retain absolute private paths that the redactor purports to forbid.

**Fix:** Reject all absolute filesystem-path values recursively (while allowing the two approved HTTPS values) and add `/private/...`, `/var/...`, and arbitrary-key test cases. Replace raw agent-output inclusion with bounded, redacted diagnostics; redact absolute paths, loopback token URLs, all HTTPS URLs, and credential-shaped values before throwing or logging.

### BL-05: OMP isolation capability is advisory, not a gate

**File:** `tests/helpers/omp-profile.ts:133-164`; `tests/package/marketplace-profile-acceptance.test.ts:80-87`  
**Issue:** The helper can report `unhonoredVariables`, but the driver only checks `ompAvailable` and the authorization flag before creating and using the profile. It can therefore pass ACC-03 after the probe established that OMP ignores an agent/XDG redirection. The real-profile digest covers selected `~/.omp/agent` entries only; it does not prove that ignored XDG configuration, data, state, or cache roots remained untouched.

**Impact:** The acceptance run can write to the operator's real OMP/XDG state while the resulting report calls the profile isolated. This violates the isolation boundary and makes the credential-copy narrowing materially riskier.

**Fix:** Treat any unhonored required redirection as a blocked marketplace result before installation or agent launch. Expand the unchanged-state guard to every real location OMP can use under the selected contract, or prove with a post-run probe that no writes escaped the owned roots. Test the unhonored-variable path explicitly.

## Warnings

### WR-01: Public review records hard-stamp source-control integrity rather than aggregating observations

**File:** `tests/e2e/agent-ready-export.spec.ts:324-348`; `tests/e2e/agent-ready-export.spec.ts:541,582,641`  
**Issue:** The public `review` record always publishes `sourceControl: { unchanged: true }`. Several source-independent scenarios add themselves to the completion set without a source-control snapshot assertion at that point. The `completedScenarios` declaration added in `4f6804c` is correct and all five required public scenarios call `.add(...)`, but completion does not establish fixture immutability.

**Impact:** The evidence record presents unchanged source control as an observed fact even when the suite has not checked it for every scenario in the public run.

**Fix:** Have each scenario return or register its own snapshot result, derive the published flag from the aggregate, and fail before publishing if any scenario lacks a successful unchanged assertion. Keep the `completedScenarios` accumulator; it correctly fixes the previous runtime `ReferenceError` but should not be used as integrity proof.

## Explicit Review Verdicts

| Area | Verdict | Basis |
| --- | --- | --- |
| Evidence integrity | **Fail** | BL-01 fabricates marketplace state rows; BL-02 permits input order to hide a blocked observation; BL-03 breaks report-to-record reproducibility. |
| Guard soundness | **Conditional fail** | Global/npx pin, PATH, containment, symlink, and empty-cache guards are sound in the reviewed paths, including the sibling-prefix case. Marketplace isolation has no enforced capability gate (BL-05). |
| Redaction | **Fail** | The durable-value filter misses several absolute path forms and failure diagnostics emit raw agent output (BL-04). |
| Isolation | **Fail** | Owned npm/support roots and cleanup are generally careful, but an OMP run may proceed after proving XDG/agent redirection is not honored (BL-05). |
| Test quality | **Fail** | Focused unit tests pass but do not exercise producer-to-writer compatibility or contradictory merge behavior; public source-control evidence is hard-stamped (WR-01). The `completedScenarios` repair itself is correct and complete for its accumulator use. |

## Adequacy of Recorded Known Issues

1. **False Restore success / non-terminal verification modal:** **Adequate as acceptance handling, unresolved as a product defect.** The current public support spec preserves `live-entitlement-unavailable`, `substituted: false`, and a partially-blocked result rather than claiming verified support. D-09 correctly keeps a deployment out of scope. The existing product defect remains real and must not be treated as closed.
2. **`completedScenarios` `ReferenceError` repaired in `4f6804c`:** **Adequate immediate repair.** The declaration at `tests/e2e/agent-ready-export.spec.ts:37` and the five required public scenario additions make the post-run completeness check executable again. It does not, however, prove source-control integrity (WR-01).
3. **No tsconfig includes `tests/`:** **Inadequate prevention, adequately disclosed.** The phase documents the gap accurately, but the green TypeScript checks cannot catch test-only errors such as the earlier undeclared accumulator. The focused runtime acceptance happened to catch this instance; the coverage gap remains a real regression risk.
4. **Shared support HOME and temporary read-only provider-credential copy:** **Adequate disclosure, inadequate enforcement.** The limitations honestly name both narrowings, and the shared support HOME cleanup avoids deleting externally owned state. However, allowing an OMP run with unhonored redirection and printing raw agent output means the credential-copy boundary is not sufficiently protected (BL-04 and BL-05).

## Review Scope and Method

Scope was identified with `git diff --name-status 9a24ab56da7b8590c813fd17543ee54152d595fc^..HEAD` over the supplied paths; it matched exactly the 19 files listed in the frontmatter. No product or test source was modified.

---
_Reviewed: 2026-09-12T16:34:36Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: deep_
