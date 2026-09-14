---
phase: 12-behavior-continuity
reviewed: 2026-09-14T06:32:06Z
depth: deep
files_reviewed: 3
files_reviewed_list:
  - package.json
  - tests/e2e/agent-ready-export.spec.ts
  - tests/e2e/responsive-session.spec.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-09-14T06:32:06Z  
**Depth:** deep  
**Files Reviewed:** 3  
**Status:** issues_found

## Summary

The relocated Review-notes interactions retain their exact control names and response/output assertions. The close/reopen sequence in the unsaved-composer scenario is necessary to remove modal inertness before inspecting the restored composer, then reopens the same dynamic locator before asserting Finish becomes enabled. The toolbar addition performs real keyboard focus traversal across the six exact named controls; it is not a tautology.

One release-blocking runner defect remains: the newly advertised bare runtime-artifact script includes external release-only specs, so it fails even when supplied with a valid local runtime artifact.

## Critical Issues

### CR-01: Bare runtime-artifact runner always includes incompatible external checks

**Classification:** **BLOCKER**  
**File:** `package.json:1`  
**Related configuration:** `playwright.runtime-artifact.config.ts:6-11`  
**Issue:** `test:runtime-artifact` invokes the configuration without explicit spec paths. That configuration collects `public-support-states.spec.ts` and `marketplace-review.spec.ts` in addition to the two local-custody specs. The local artifact flow necessarily makes `public-support-states.spec.ts` reject the `local-archive` source (`tests/e2e/public-support-states.spec.ts:327-329`), while the marketplace flow requires `CUMPA_MARKETPLACE_URL_MARKER` (`tests/e2e/marketplace-review.spec.ts:97-99`). Thus a developer can provide all four documented local custody variables and still see the new bare script fail for unrelated release infrastructure. The documentation's workaround—always append two explicit spec paths—does not make the package script itself reliable.

`npm run test:runtime-artifact -- --list` confirmed that the bare script collects both external suites.

**Fix:** Make the default script name the locally reproducible runtime-artifact contract explicitly, and expose external release checks under separate, intentionally named commands (or invoke them directly in release automation):

```json
"test:runtime-artifact": "playwright test --config playwright.runtime-artifact.config.ts tests/e2e/package-assets.spec.ts tests/e2e/agent-ready-export.spec.ts"
```

Keep public-support and marketplace specs runnable through a separate release-only script/config so their prerequisites are explicit rather than making the default runtime-artifact command appear broken.

---

_Reviewed: 2026-09-14T06:32:06Z_  
_Reviewer: Review12 (gsd-code-reviewer)_  
_Depth: deep_
