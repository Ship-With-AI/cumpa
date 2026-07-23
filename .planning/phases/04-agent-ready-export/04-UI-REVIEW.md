# Phase 04 — UI Review

**Audited:** 2026-07-23  
**Baseline:** `04-UI-SPEC.md` (Phase 4 export/receipt contract)  
**Method:** adversarial code audit plus focused Chromium checks; no standalone local server was available on ports 3000, 5173, or 8080, so no audit screenshots were captured.  
**Status:** **REMEDIATED — UI-01 through UI-07**

The scores and findings below record the pre-remediation audit. The focused browser and build evidence for the completed remediation is recorded immediately below.

## Remediation evidence — 2026-07-23

`53145bb` added focused browser RED coverage. It failed against the prior UI on the old copy confirmation and absence of a distinct recovery-required surface. `b760f0c` completed the following presentation-only remediation:

- **UI-01:** `ExportReceipt` consumes the server-confirmed acknowledged `receipt.drift.identities` union; a neutral **View acknowledged identities** disclosure exposes full pinned/current Base and Head identities, including selectable values and a copy action. No selector/identity is reconstructed in the browser.
- **UI-02:** `recoveryRequired` renders **Export needs recovery** with the prescribed no-success-receipt body; any existing receipt remains visually separate as **Previous confirmed export**.
- **UI-03:** Per-file and all-details confirmations are exactly `Copied relative path for {filename}.` and `Copied export receipt details.`
- **UI-04:** Receipt metadata collapses at the medium drawer breakpoint; focused Chromium asserts the 768px and 360px responsive states keep receipt visible and introduce no document-level horizontal scroll.
- **UI-05:** Escape propagation is stopped on revision-conflict, failed/recovery, and unavailable export surfaces without changing export state; focused coverage verifies recovery heading and retry remain visible.
- **UI-06:** Every receipt row has an `aria-describedby` complete file description containing filename, full relative path, full SHA-256 digest, and byte count while visible values remain selectable.
- **UI-07:** Export chrome now explicitly assigns the contract’s 12/14/18px, 400/600, 16/20/24px typography roles instead of user-agent heading defaults.

Verification: `node_modules/.bin/playwright test tests/integration/export-receipt-ui.spec.ts` — **4 passed**; `npm run build` — **passed**.

---

## Six-Pillar Scores

| Pillar | Score | Key finding |
|---|---:|---|
| 1. Hierarchy & copywriting | 2/4 | Export is correctly placed after Summary/Open/Resolved comments, but required receipt-copy wording is not implemented. |
| 2. Interaction | 2/4 | Explicit pair-level export and two-step ignore consent work; an acknowledged-drift receipt has no identity-detail control. |
| 3. Responsive behavior | 3/4 | Narrow layout and receipt overflow are implemented and exercised at 320px; 200% zoom and medium-width behavior have no focused evidence. |
| 4. Accessibility & focus | 2/4 | Native controls and several focus transitions exist, but Escape can close the drawer from an export failure and receipt hash/path semantics are not supplied as one concise file label. |
| 5. State & error truthfulness | 2/4 | Pair-level progress and no-partial-success wording are sound; the recovery-required state is absent and generic failure text is insufficient when publication cannot be confirmed. |
| 6. Visual consistency | 2/4 | The inherited palette/spacing tokens are used, but export headings rely on browser-default 700-weight/type metrics rather than the contract’s four-size, 400/600 typography system. |

**Overall: 13/24**

### Protocol crosswalk

| Protocol dimension | Score | Evidence |
|---|---:|---|
| Copywriting | 2/4 | Required labels for `Export review`, drift consent, zero-actionable, and ignore consent are present; receipt copy confirmations differ from the exact contract. |
| Visuals | 2/4 | Export stays in the 360px review panel and uses neutral receipt surfaces, but typography roles are unspecified/defaulted. |
| Color | 3/4 | `--canvas`, `--panel`, `--accent`, warning/error, and neutral receipt tokens match the contract; accent is limited to primary/focus uses. No rendered color/contrast capture was possible. |
| Typography | 2/4 | Export metadata labels explicitly use 12px/600, but `h3`–`h6` headings have no export-specific size/weight/line-height declarations. |
| Spacing | 3/4 | Export styles use the declared 4/8/16/24px tokens and stack action groups on narrow screens; zoom reflow remains untested. |
| Experience design | 2/4 | Accepted-revision, drift, failure, receipt, reveal, and ignore flows are implemented, but recovery uncertainty and acknowledged-drift receipt evidence are incomplete. |

---

## Top 3 Priority Fixes

1. **BLOCKER — Preserve acknowledged drift evidence in the receipt.** `ExportReceipt` only receives a boolean and renders `Acknowledged for this export`; it cannot render the required expandable **View acknowledged identities** detail with full pinned/current Base and Head values. **Impact:** a completed, drifted export has no UI proof of which identities the reviewer acknowledged. **Fix:** extend the server-confirmed receipt DTO with validated acknowledged observation identities; pass it through the canonical state; render an accessible neutral disclosure with full selectable/copyable values. Do not derive identities client-side.
2. **WARNING — Add the recovery-required export failure state.** The UI collapses all `publicationFailed` outcomes into “The export pair could not be validated” and has no `Export needs recovery` surface. **Impact:** when the server cannot determine whether a complete pair exists, the user is not told that there is no success receipt and that terminal recovery is required. **Fix:** add a typed recovery-required result/state and render the UI-SPEC heading/body, retaining any prior receipt only as `Previous confirmed export`; make the fresh retry explicit.
3. **WARNING — Complete keyboard/screen-reader receipt contracts.** Export-failure Escape bubbles to the Review-panel Escape handler, and raw receipt values lack a single per-file accessible description. **Impact:** Escape hides a required error surface; assistive technology may announce a hash as a sequence of characters without filename/path/hash context. **Fix:** stop/handle Escape while required export error states are active, and give each receipt row an explicit combined accessible name/description while keeping its full visible/selectable values.

---

## Contract Evidence

### Export readiness, hierarchy, and drift

**Implemented and browser-grounded**

- `ReviewPanel.vue:301-537` keeps the required order: Summary, Open comments, Resolved comments, then one `ExportSection`; it does not create an export page.
- `ExportReadinessSummary.vue:18-35` displays accepted revision, actionable/attention/resolved counts, optional summary, ignore state, zero-actionable, fully empty, and stale-anchor guidance. It does not offer selective export.
- `ExportSection.vue:119-132` uses the explicit `Export review` CTA and exact no-source-control supporting copy. `App.vue:388-414` submits only the accepted revision plus a server-issued opaque drift token and announces preflight.
- `DriftExportAcknowledgement.vue:43-60` shows pinned/current identities, resets local consent when the observation changes, disables confirm until checked, and has no refresh/substitution control.
- `tests/integration/agent-ready-export-states.spec.ts:9-45,73-102` passed, proving accepted buffers remain excluded on failed publication and the latest acknowledgement token is required before progress.

**Finding UI-01 — BLOCKER — acknowledgement detail disappears after completion**

- **Evidence:** `src/contracts/api.ts:400-405` defines a confirmed receipt with only `driftAcknowledged: boolean`; `src/web/components/ExportReceipt.vue:23-31,81-84` can render only `Acknowledged for this export` and has no disclosure. `04-UI-SPEC.md`, **Receipt drift state**, requires `View acknowledged identities` with full pinned/current values.
- **Action:** retain server-confirmed observation identity data in the receipt result and render the required disclosure; do not attempt to reconstruct it from current selectors or receipt paths.

### Publication progress, receipt, copy, reveal, and recovery

**Implemented and browser-grounded**

- `ExportProgress.vue:9-25` reports only pair-level preparing/validating/publishing stages with `role="status"`; it never describes one file as independently complete.
- `ExportReceipt.vue:21-88` is rendered only from the `exported` result. `ReceiptFileRow.vue:22-31` fixes the two rows to `review.json` then `review.md` and exposes full relative values, SHA-256 text, and byte counts.
- `ExportSection.vue:85-103` retains a prior confirmed receipt as **Previous confirmed export** after a later failed/re-export-unsupported attempt.
- `ExportReceipt.vue:49-68` retains the receipt and focuses a bounded recovery alert after reveal failure.
- Focused Chromium evidence passed: `tests/integration/export-receipt-ui.spec.ts:120-149` exercises confirmed receipt, 320px containment, clipboard copy, no-body reveal failure, focused reveal recovery, and later re-export failure; `tests/e2e/agent-ready-export.spec.ts:213-339` passed a generated-package close/relaunch/resume/export journey.

**Finding UI-02 — WARNING — recovery uncertainty has no truthful state**

- **Evidence:** `src/web/model/review-draft-state.ts:181-203` maps every `publicationFailed` result to one `failed` state; `src/web/components/ExportSection.vue:85-102` says only “The export pair could not be validated.” No `Export needs recovery` wording/state exists. This misses the UI-SPEC **Publication Failure and Recovery** contract for a state where the product cannot establish whether a complete new pair exists.
- **Action:** distinguish the server’s recovery-required result from ordinary publication failure, use the mandated no-success-receipt copy, and keep retry a fresh preflight.

**Finding UI-03 — WARNING — required copy confirmations are not exact**

- **Evidence:** `src/web/components/ReceiptFileRow.vue:15-18` says `review.json path copied.` / `review.md path copied.`; `src/web/components/ExportReceipt.vue:35-42` says `Receipt details copied`. The UI-SPEC requires `Copied relative path for {filename}.` and `Copied export receipt details.`
- **Action:** replace the success messages exactly while retaining the existing adjacent manual-copy recovery on clipboard failure.

### Ignore consent

**Implemented and browser-grounded**

- `GitignoreStatus.vue:37-63,87-116` makes the first `Add to .gitignore` activation local-only, focuses `Keep .gitignore unchanged`, prevents the child Escape event from closing the review panel, and sends a request only from `Append ignore rule`.
- The status remains independent of export; unignored warning copy states export can continue and comparison exclusion is unconditional.
- `tests/integration/export-receipt-ui.spec.ts:151-188` passed: it observes zero requests before the second activation, focused safe action, Escape focus restoration, empty POST body, and bounded append outcomes without falsely claiming unchanged content.

### Responsive behavior

**Implemented**

- `src/web/styles.css:1793-1807` makes export actions full-width and metadata/identity grids single-column at <=767px.
- `src/web/styles.css:1685-1707` constrains the receipt values and allows overflow only inside the opaque path/hash value area; `ExportReceipt.vue` keeps full text rather than truncating it.
- The focused receipt test changes viewport to 320x720 and asserts the receipt’s right edge is within the viewport (`tests/integration/export-receipt-ui.spec.ts:131-134`).

**Finding UI-04 — WARNING — contract evidence does not cover 200% zoom or the tablet transition**

- **Evidence:** no Phase 04 export test sets page zoom, `deviceScaleFactor`, a 768px viewport, or asserts document-level horizontal scroll. CSS has only the <=767px export breakpoint.
- **Action:** add focused browser assertions at 200% zoom and 768px/360px drawer widths: action order remains usable, hashes scroll only within their value region, and `document.documentElement.scrollWidth <= innerWidth`.

### Accessibility and keyboard focus

**Implemented**

- The primary controls are native buttons/checkboxes; the drift checkbox has a visible label (`DriftExportAcknowledgement.vue:54-60`).
- `GitignoreStatus.vue:39-44,87-116` implements safe-action-first confirmation focus and Escape restoration. `ExportReceipt.vue:63-68` focuses reveal failure only after the user invoked Reveal. `App.vue:145-159` restores review-drawer focus to its opener.
- `styles.css:1779-1812` has a visible spinner and disables its rotation under `prefers-reduced-motion` while retaining progress text.

**Finding UI-05 — WARNING — export-error Escape is not isolated from drawer dismissal**

- **Evidence:** `ReviewPanel.vue:276-280` handles `@keydown.escape` by emitting `close`; `ExportSection.vue:85-102,106-111` has no Escape handler for failed/unavailable export states. Unlike the gitignore confirmation, an Escape in either error surface bubbles to the panel and closes it. UI-SPEC says Escape on any export error must not dismiss required warning/retry/reload or mutate state.
- **Action:** intercept Escape for export error/recovery/conflict surfaces (without performing any state mutation) and add a keyboard test that the drawer remains open and the required recovery control remains visible.

**Finding UI-06 — WARNING — receipt rows lack the required concise file-level screen-reader label**

- **Evidence:** `ReceiptFileRow.vue:22-31` labels each article only by filename; the raw path and 64-character digest are independent `code` nodes. There is no file-level `aria-label`/description containing path, digest, and byte count. The UI-SPEC requires one complete path/hash label per file rather than character-by-character hash treatment; tests cover visual text only.
- **Action:** expose one deterministic accessible description per row, e.g. filename, full relative path, SHA-256 digest, and byte count, linked with `aria-describedby`; retain visible selectable code values and add an accessibility-tree assertion.

### Visual consistency: color, typography, and spacing

**Implemented**

- `styles.css:970-1003` defines the exact warm inherited Phase 2/3 palette and aliases legacy tokens to it. `styles.css:1518-1526,1643-1707` uses accent only for primary controls and focus, neutral `--surface`/`--rule` for receipt, and no addition-green success state.
- Export layout uses declared 4/8/16/24px space tokens (`styles.css:1598-1807`); no Phase 4 literal color is introduced in the components.
- Geometry matches the component direction: 4px controls, 8px receipt/confirmation surfaces, 32px default button height, 2px focus outline/offset.

**Finding UI-07 — WARNING — export chrome does not implement the declared typography roles**

- **Evidence:** `styles.css:1415-1419,1635-1637,1663-1669,1775-1777` only zeroes heading margins. Consequently Export/receipt/progress `h3`–`h6` use browser-default size, line-height, and typically 700 weight, contrary to UI-SPEC’s exact 12/14/18/24px roles and 400/600-only rule. Metadata labels are correctly explicit at `styles.css:1710-1714,1735-1739`.
- **Action:** define export heading/body/metadata classes with the contract’s explicit font size, line-height, and 400/600 weight; do not rely on user-agent heading defaults.

---

## Files Audited

### Design and phase evidence

- `.planning/phases/04-agent-ready-export/04-UI-SPEC.md`
- `.planning/phases/04-agent-ready-export/04-CONTEXT.md`
- `.planning/phases/04-agent-ready-export/04-01-PLAN.md` through `04-08-PLAN.md`
- `.planning/phases/04-agent-ready-export/04-01-SUMMARY.md` through `04-08-SUMMARY.md`
- `.planning/phases/04-agent-ready-export/04-REVIEW.md`

### UI and contract owners

- `src/contracts/api.ts`
- `src/web/App.vue`
- `src/web/model/review-draft-state.ts`
- `src/web/components/ReviewPanel.vue`
- `src/web/components/ExportSection.vue`
- `src/web/components/ExportReadinessSummary.vue`
- `src/web/components/DriftExportAcknowledgement.vue`
- `src/web/components/ExportProgress.vue`
- `src/web/components/GitignoreStatus.vue`
- `src/web/components/ExportReceipt.vue`
- `src/web/components/ReceiptFileRow.vue`
- `src/web/styles.css`

### Tests examined and executed

- `tests/integration/agent-ready-export-states.spec.ts`
- `tests/integration/export-receipt-ui.spec.ts`
- `tests/e2e/agent-ready-export.spec.ts`

## Verification

- Screenshot ignore gate existed before detection: `.planning/ui-reviews/.gitignore` ignores common binary screenshot formats.
- Dev-server probe: ports **3000**, **5173**, and **8080** each returned no HTTP response; screenshots were therefore not captured.
- `node_modules/.bin/playwright test tests/integration/agent-ready-export-states.spec.ts tests/integration/export-receipt-ui.spec.ts` — **7 passed**.
- `node_modules/.bin/playwright test tests/e2e/agent-ready-export.spec.ts` — **1 passed** (`packaged-resume-after-relaunch`).
- Registry safety audit skipped: `components.json` is absent and `04-UI-SPEC.md` declares `shadcn_initialized: false` / no third-party registry.

No production source or tests were modified by this audit.
