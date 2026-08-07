---
phase: quick
plan: 260731-hdw
subsystem: cli-persistence-and-product-identity
tags: [cumpa, cumpa, .cumpa, vitest, playwright]
requires:
  - phase: v1.2
    provides: Cumpa CLI, .cumpa persistence authority, and packaged contract suite
provides:
  - sole `spike-findings-cumpa` skill with current indexes and theme ledger
  - packaged E2E assertions aligned to the sole `cumpa` binary and current UI labels
affects: [skill-discovery, packaged-cli-contracts, milestone-ledger]
tech-stack:
  added: []
  patterns:
    - clean skill-directory cutovers leave no compatibility path
    - package tests invoke the declared generated binary
key-files:
  created:
    - .planning/quick/260731-hdw-the-directory-created-by-the-cli-should-/260731-hdw-SUMMARY.md
  modified:
    - .claude/CLAUDE.md
    - .kimi-code/skills/spike-findings-cumpa/
    - .planning/MILESTONES.md
    - .planning/spikes/WRAP-UP-SUMMARY.md
    - tests/e2e/anchored-review.spec.ts
    - tests/e2e/pinned-session.spec.ts
    - tests/e2e/responsive-session.spec.ts
key-decisions:
  - "Retained historical evidence exactly; only the plan-authorized live indexes, ledger, and sole skill directory were cut over."
  - "Corrected stale packaged E2E assertions only after the package contract demonstrated they targeted the removed `dist/bin/cumpa.mjs` path and obsolete rendered labels."
patterns-established:
  - "Package scenarios must launch `dist/bin/cumpa.mjs`, the sole package bin authority."
requirements-completed: [QUICK-260731-HDW]
duration: 14m
completed: 2026-07-31
status: complete
---

# Quick 260731-hdw: Cumpa Directory Cutover Summary

**Renamed the sole live Cumpa spike skill, synchronized live product pointers and `cumpa-dark`, and proved `.cumpa` draft/export/ignore/inventory behavior through focused and packaged contracts.**

## Performance

- **Duration:** 14m
- **Started:** 2026-07-31T10:45:55Z
- **Completed:** 2026-07-31T11:00:23Z
- **Tasks:** 2/2
- **Files modified:** 13 tracked files (including 8 skill-tree renames)

## Accomplishments

- Moved `.kimi-code/skills/spike-findings-diff-review/` to the sole `.kimi-code/skills/spike-findings-cumpa/` directory; updated its metadata and bundled product wording.
- Pointed `.claude/CLAUDE.md` and the active spike wrap-up at `spike-findings-cumpa`; synchronized the current milestone ledger to runtime `cumpa-dark`.
- Preserved production `.cumpa` authorities and proved the draft, export, exact inventory exclusion, effective-ignore, package, and theme contracts.
- Updated packaged E2E launch/assertion expectations so the production-contract suite invokes the declared `dist/bin/cumpa.mjs` and checks current rendered text.

## Task Commits

Each implementation/content task was committed atomically:

1. **Task 1: Remove the remaining live legacy skill and theme references** — `5020719` (`docs`)
2. **Task 2: Prove the `.cumpa` CLI boundary and absence of intended legacy references** — `b6fef23` (`test`)

**Plan metadata:** Not committed by instruction; this summary remains uncommitted for the orchestrator.

## Files Created/Modified

- `.claude/CLAUDE.md` — live skill display name and invocation now resolve to `spike-findings-cumpa`.
- `.kimi-code/skills/spike-findings-cumpa/` — sole renamed skill tree; metadata and bundled staged-discovery wording name Cumpa.
- `.planning/MILESTONES.md` — current theme ledger uses `cumpa-dark`.
- `.planning/spikes/WRAP-UP-SUMMARY.md` — live skill output path points to the renamed directory.
- `tests/e2e/anchored-review.spec.ts` — package UI expectation matches the current composer header.
- `tests/e2e/pinned-session.spec.ts` — packaged launcher uses `cumpa.mjs`; context-header labels match current UI.
- `tests/e2e/responsive-session.spec.ts` — packaged launcher uses `cumpa.mjs`.

## Verification

All commands were run from `/Users/alessandro/projects/diff-review`.

| Command | Result |
| --- | --- |
| `test -f .kimi-code/skills/spike-findings-cumpa/SKILL.md && test ! -e .kimi-code/skills/spike-findings-diff-review && git grep -nF 'spike-findings-cumpa' -- .claude/CLAUDE.md .planning/spikes/WRAP-UP-SUMMARY.md .kimi-code/skills/spike-findings-cumpa/SKILL.md && git grep -nF 'cumpa-dark' -- .planning/MILESTONES.md src/web/monaco/theme.ts` | Passed: one live skill exists; both live pointers resolve; ledger and runtime source both contain `cumpa-dark`. |
| `npm exec -- vitest run tests/api/draft.test.ts tests/api/draft-recovery.test.ts tests/api/export-publication.test.ts tests/api/gitignore.test.ts tests/git/inventory.test.ts tests/unit/monaco-theme.test.ts` | Passed: 6 files, 27 tests. |
| `npm run test:package-contract` | Initial run exposed stale E2E launch paths (`dist/bin/cumpa.mjs`) and two stale rendered-text assertions. After their targeted correction, passed: 23 Chromium E2E tests and 12 Vitest package-contract tests. The emitted package artifact was `dist/bin/cumpa.mjs`. |
| `node --input-type=module -e 'import {readFileSync} from "node:fs"; const p=JSON.parse(readFileSync("package.json","utf8")); const l=JSON.parse(readFileSync("package-lock.json","utf8")); if(p.name!=="cumpa"||p.bin?.cumpa!=="dist/bin/cumpa.mjs"||Object.keys(p.bin).length!==1||l.name!=="cumpa"||l.packages[""]?.bin?.cumpa!=="dist/bin/cumpa.mjs") process.exit(1)'` | Passed: `cumpa` package/lock identity and sole `cumpa -> dist/bin/cumpa.mjs` mapping hold. |
| `node --input-type=module -e 'import {spawnSync} from "node:child_process"; const r=spawnSync("git",["grep","-IlF","diff-review","--","."],{encoding:"utf8"}); if(![0,1].includes(r.status)) process.exit(r.status??1); const allowed=[".planning/milestones/",".planning/quick/",".planning/debug/",".planning/forensics/",".planning/research/.cache/"]; const bad=r.stdout.trim().split("\\n").filter(Boolean).filter((f)=>!allowed.some((prefix)=>f.startsWith(prefix))); if(bad.length){console.error(bad.join("\\n"));process.exit(1)}'` | Passed: every tracked lowercase legacy literal is confined to the immutable-evidence allowlist. |

## Decisions Made

- Preserved existing production code because the focused contract suite confirmed `.cumpa/drafts`, `.cumpa/exports`, exact-root inventory filtering, `.cumpa` effective-ignore probing, and the append-only `/.cumpa/` rule already satisfy the required authority boundary.
- Kept the protected Cumpa, `cumpa`, `dist/bin/cumpa.mjs`, `cumpa/export`, and `cumpa-dark` identities unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Packaged E2E scenarios invoked the removed binary and stale UI strings**
- **Found during:** Task 2 (Prove the `.cumpa` CLI boundary and absence of intended legacy references)
- **Issue:** The required `npm run test:package-contract` command failed because two scenarios launched `dist/bin/cumpa.mjs`; after that repair, assertions expected obsolete composer separators and uppercase context labels.
- **Fix:** Changed the two launch paths to `dist/bin/cumpa.mjs` and aligned three assertions to the current `CommentComposer.vue` and `App.vue` rendered text.
- **Files modified:** `tests/e2e/anchored-review.spec.ts`, `tests/e2e/pinned-session.spec.ts`, `tests/e2e/responsive-session.spec.ts`
- **Verification:** Final `npm run test:package-contract` passed all 23 Chromium scenarios and 12 package-contract tests.
- **Committed in:** `b6fef23` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking test-contract inconsistency).
**Impact on plan:** The repair was limited to assertions directly blocking the required packaged production proof; no production, generated, dependency, user-data, or immutable historical evidence was changed.

## Issues Encountered

- The first package-contract run exposed the stale test expectations described above. No production behavior was defective; the focused production tests already passed, and the repaired packaged suite verified the shipped `cumpa` entry end to end.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Live skill/index/ledger identity and `.cumpa` production boundary are verified.
- No blockers.

---
*Quick plan: 260731-hdw*
*Completed: 2026-07-31*
