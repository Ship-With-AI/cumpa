---
phase: 04-agent-ready-export
artifact: UI-REVIEW.md
audited: 2026-07-23
baseline: .planning/phases/04-agent-ready-export/04-UI-SPEC.md
scope: Post-remediation re-audit of UI-01 through UI-07
status: remediation-required
scores:
  hierarchy: 3
  interaction: 3
  responsive: 4
  accessibility: 4
  state_truthfulness: 3
  visual_consistency: 4
blockers: 1
warnings: 1
---

# Phase 04 — UI Review

**Status: REMEDIATION REQUIRED — 1 BLOCKER, 1 WARNING**

This is a code-and-browser re-audit of the current Phase 04 export UI after the requested remediations. No production source or test was modified. The review follows `04-UI-SPEC.md` and assesses hierarchy, interaction, responsiveness, accessibility/focus, truthful state, and visual consistency.

## Focused evidence

| Evidence | Result | What it covers |
|---|---:|---|
| `node_modules/.bin/playwright test tests/integration/agent-ready-export-states.spec.ts tests/integration/export-receipt-ui.spec.ts` | **8 passed** | Browser-rendered receipt, acknowledged-drift disclosure, recovery state, reveal/copy behavior, 320 px receipt containment, ignore consent/Escape, fixed capability bodies, accepted-revision state transitions |
| Full package Playwright suite | **51 passed** | Parent-agent verification of the complete current packaged browser suite |
| `node_modules/.bin/playwright test tests/e2e/agent-ready-export.spec.ts` | **1 passed** | Packaged relaunch/resume flow and exact recovered export bytes |
| Source inspection | complete | Current contracts, export state model, receipt/failure components, drawer Escape handling, and export styles |

`.planning/ui-reviews/.gitignore` already excludes screenshot artifacts. The focused Playwright tests start their own disposable Vite target; no standalone target remained available for an audit screenshot, so no screenshot artifact was retained.

## Pillar scores

| Pillar | Score | Assessment |
|---|---:|---|
| Hierarchy | 3/4 | Export states and prior-receipt separation are clear, but the required comparison disclosure is absent for a normal no-drift receipt. |
| Interaction | 3/4 | Retry, reveal, copy, disclosure, and ignore-consent mechanics work, but receipt action ordering and several prescribed strings remain off-contract. |
| Responsive behavior | 4/4 | The browser receipt remains contained at 320 px; grid/action breakpoints stack metadata and controls, while long hashes scroll inside their value region. |
| Accessibility and focus | 4/4 | Error sections stop Escape before the drawer handler; receipt rows expose a single combined path/hash/bytes description; reveal failure focuses the adjacent alert; reduced-motion suppresses spinner rotation. |
| State/error truthfulness | 3/4 | The recovery-specific state is explicit and retains a prior receipt correctly. Receipt provenance remains incomplete because a no-drift receipt cannot disclose the pinned comparison. |
| Visual consistency | 4/4 | Export-specific headings, labels, controls, and body copy use the specified 18/12/14 px roles with only 600/400 weights; palette and compact spacing remain consistent with the inherited UI. |

**Total: 21/24**

## Findings

### UI-01 — BLOCKER: confirmed no-drift receipts cannot show the required pinned comparison

`04-UI-SPEC.md` requires every confirmed receipt to include a `Comparison` disclosure with full pinned Base and Head OIDs; acknowledged drift additionally requires a `View acknowledged identities` disclosure with full pinned/current values.

The current receipt schema carries `label`, `selectorType`, and `oid` for acknowledged identities (`src/contracts/api.ts:394-426`), and the component now renders acknowledged OIDs. However, the only disclosure is conditional on `acknowledgedIdentities.length > 0` (`src/web/components/ExportReceipt.vue:101-122`). A receipt with `drift.kind === 'noneObserved'` has no comparison disclosure at all. The acknowledged disclosure also omits the carried selector labels/types, so it is not a complete selector-identity presentation.

**Impact:** a successful, non-drift export—the common path—does not let a reviewer verify which pinned Base and Head the receipt represents. This violates the receipt’s core provenance contract, not merely its visual presentation.

**Required remediation:** include pinned Base and Head identities in every exported receipt and render them in a non-mutating disclosure. For acknowledged drift, render both full pinned and full current identity (label/type/OID or the established equivalent), retaining informational/copy-only behavior.

### UI-03 — WARNING: receipt wording and action order remain partially off the specified contract

The prior copy-success defect is fixed: paths announce `Copied relative path for {filename}.` and all-details copy announces `Copied export receipt details.` (`src/web/components/ReceiptFileRow.vue:16-25`, `src/web/components/ExportReceipt.vue:42-53`), and focused browser evidence observes the all-details success.

The remaining observable receipt differences are:

- The receipt has no required body, `Both files were published together from accepted revision {revision}.` (`ExportReceipt.vue:87-99`).
- Its drift text is `Acknowledged export`, not `Acknowledged for this export` (`ExportReceipt.vue:23-24`).
- `Copy receipt details` is placed in the receipt header ahead of the file rows, instead of the specified below-row `Copy all receipt details` action (`ExportReceipt.vue:88-93`; `04-UI-SPEC.md:374-391`).
- Clipboard failures use file-specific prose rather than the required adjacent `Could not copy. Select the value and copy it manually.` (`ReceiptFileRow.vue:21-23`).
- Reveal failure says `Reveal failed; copy a displayed relative path and open it from the repository root.`, rather than the specified `Could not reveal the export directory. Copy the relative path and open it from the repository root.` (`ExportReceipt.vue:76-81`).

**Impact:** these do not cause an unsafe export, but they weaken the authored UI contract and make the normal receipt hierarchy differ from the approved specification.

**Required remediation:** use the specified receipt body, drift label, action label/order, and adjacent failure copy verbatim.

### Final remediation evidence — 2026-07-23

`7436482` added browser RED coverage for the receipt body, exact wording/actions, acknowledged identity label/type details, and a `noneObserved` receipt’s universal `Comparison` disclosure. It failed as expected because the previous UI had no completion body and exposed no comparison control for no-drift receipts. `292b9b5` now projects the Plan 05 server-confirmed `receipt.comparison` data without deriving identities in the browser: every receipt has a keyboard-operable, copy-only `Comparison` disclosure with full pinned Base/Head OIDs and the server’s supplementary label/type. Acknowledged drift additionally displays server-confirmed full pinned/current label/type/OID values, including the unavailable branch. The receipt now uses the exact approved completion body, `Acknowledged for this export`, below-row `Copy all receipt details`, generic adjacent clipboard failure, and exact reveal failure wording.

Verification: `node_modules/.bin/playwright test tests/integration/export-receipt-ui.spec.ts` — **5 passed**; `npm run build` — **passed**.

## UI-01 through UI-07 disposition

| ID | Previous concern | Current disposition |
|---|---|---|
| UI-01 | Acknowledged drift had only a boolean/no identity evidence | **Resolved.** Every receipt renders a non-mutating `Comparison` disclosure from server-confirmed Base/Head OIDs with supplementary labels/types; acknowledged drift also renders full pinned/current label/type/OID identities. |
| UI-02 | Recovery-unknown was collapsed into ordinary failure | **Resolved.** `recoveryRequired` has a distinct heading, bounded recovery copy, no current-success receipt, prior-receipt separation, and a fresh retry. |
| UI-03 | Copy success feedback differed from required wording | **Resolved.** Receipt body, drift label, post-row all-details action, and copy/reveal recovery wording match the UI-SPEC exactly. |
| UI-04 | No grounded narrow/zoom receipt behavior | **Resolved.** Focused browser evidence verifies 320 px containment; current responsive CSS stacks actions and metadata below 768 px and constrains long values to their own scroll regions. |
| UI-05 | Escape could close the drawer during an export error | **Resolved.** Conflict, failure, and unavailable error sections stop Escape propagation before `ReviewPanel`’s close handler (`ExportSection.vue:70,88,106`). |
| UI-06 | Receipt rows lacked one complete accessible value label | **Resolved.** Each row uses a combined visually-hidden path/hash/byte description via `aria-describedby` (`ReceiptFileRow.vue:15,29-41`). |
| UI-07 | Export chrome relied on browser heading typography | **Resolved.** Explicit export heading/label/body rules set the specified font sizes, weights, and line heights (`src/web/styles.css:1625-1645`). |

## Positive verification

- Export is visibly scoped to accepted revision, preserves local unsaved buffers, and the focused state tests verify those transitions.
- Drift acknowledgement is inspectable, its disclosure is keyboard-toggleable, and the UI cannot use it to refresh or mutate comparison state.
- Pending presentation remains pair-level, and reduced-motion disables spinner rotation without removing status text.
- Receipt rows retain complete visible paths/hashes, with copy controls and fixed no-body reveal capability; browser verification confirms reveal failure focus and no request body.
- `.gitignore` remains a two-step, Escape-safe, fixed-rule action independent from export success/failure.

## Remediation gate

**Complete.** UI-01 and UI-03 have focused acknowledged- and no-drift receipt coverage, plus exact receipt-string assertions. The focused Playwright receipt suite passed 5/5 after remediation.
