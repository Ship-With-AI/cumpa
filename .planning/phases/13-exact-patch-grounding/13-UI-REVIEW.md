# Phase 13 — UI Review

**Audited:** 2026-08-05  
**Baseline:** `13-UI-SPEC.md` (approved exact-patch UX contract)  
**Screenshots:** Not captured — no standalone server was available at `127.0.0.1:3000`; the focused Playwright checks started and exercised their own Vite server in Chromium. Screenshot storage gate passed: `.planning/ui-reviews/.gitignore` ignores image assets.

---

## Verdict

**PASS — 0 unresolved blockers.** Current Chromium evidence confirms that exact-patch states use frozen/exact-patch language without leaking pinned-comparison wording, terminal snapshot loss exposes one focused `Frozen patch unavailable` heading, retry remains snapshot-only, and the Patch scope meets its tested desktop-to-narrow responsive/focus contract. A focused pinned-session regression also remains green.

Two non-blocking contract recommendations remain; neither prevents review completion or the requested exact-patch flows.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Exact state/recovery/error wording passes; worktree scope omits the contract’s control-safe path. |
| 2. Visuals | 4/4 | Chromium verifies one terminal heading and the approved scope geometry across the exact viewport matrix. |
| 3. Color | 4/4 | Existing approved dark-surface, accent, focus, and error tokens are retained. |
| 4. Typography | 4/4 | Exact-patch header/facts retain the established page/section/monospace hierarchy. |
| 5. Spacing | 3/4 | Scope controls pass at 44px on narrow viewports; other narrow review-shell controls still inherit 32px minima. |
| 6. Experience Design | 4/4 | Dedicated patch status, stable frozen retry, terminal focus, modal focus containment, Escape, and return-focus behavior pass in Chromium. |

**Overall: 22/24**

---

## Top 3 Priority Fixes

No blocker fixes are required.

1. **Make every narrow review-shell control at least 44px square** — touch targets such as the `Files` trigger and toolbar controls still inherit the general 32px minimum — apply the existing narrow-screen 44px rule to all interactive review-shell controls.
2. **Carry and display the control-safe worktree validation path** — a worktree patch scope currently displays only `Worktree`, not `Worktree · {control-safe path}` — add the already-server-authoritative safe path to the strict session DTO and render it without ellipsis.
3. **No third priority fix** — the re-audited exact state, recovery/error, terminal focus, retry/no-live-fallback, responsive scope, and pinned-session behavior have passing browser evidence.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

- **PASS — no pinned wording in exact state, recovery, or error.** Exact draft announcements branch to `frozen exact patch` in `src/web/App.vue:360-362, 836-841`; terminal exact failures supply the exact frozen heading/body at `src/web/App.vue:144-152, 866-873`; `ErrorState` accepts that heading instead of rendering its pinned fallback at `src/web/components/ErrorState.vue:24-26`. Chromium test `exact patch resumed drafts announce frozen provenance without pinned wording` passed and asserts both the frozen-provenance announcement and absence of `pinned` text (`tests/integration/selector-drift-ui.spec.ts:420-435`).
- **PASS — exact failure copy is source-specific.** Chromium test `exact patch retry stays snapshot-only and terminal loss focuses one source-correct heading` passed, verifying the frozen-file copy, exact terminal body, zero `Pinned session unavailable` headings, and no `pinned` text (`tests/integration/selector-drift-ui.spec.ts:438-501`).
- **WARNING — Worktree target presentation is incomplete.** `src/web/components/IdentityPanel.vue:42-44, 109-112` renders `Worktree` alone. The approved contract calls for `Worktree · {control-safe path}`. The current session patch target is only a `{ kind: 'worktree' }` discriminant, so the UI has no path to render (`src/contracts/api.ts` session contract consumed by the component). This does not alter review bytes or inhibit task completion.

### Pillar 2: Visuals (4/4)

- **PASS — terminal hierarchy has one focal heading.** `ErrorState` renders exactly one supplied focusable `h1` for the exact terminal state (`src/web/components/ErrorState.vue:24-26`), and Chromium asserted exactly one `Frozen patch unavailable` heading (`tests/integration/selector-drift-ui.spec.ts:489-497`).
- **PASS — exact scope preserves the specified visual modes.** Chromium exercised 1440px, 1100px, 768px, and 320px (`tests/integration/selector-drift-ui.spec.ts:511-554`): desktop/tablet scope is a visible labelled region capped at the applicable width; narrow scope is a visible `Patch scope` dialog. The source retains a three-column 1440px shell, 256px intermediate tree column, and full-width narrow modal styling (`src/web/styles.css:1128-1142, 2042-2049, 2229-2260`).

### Pillar 3: Color (4/4)

- **PASS — approved token allocation is preserved.** `src/web/styles.css:1-54` defines and continues to use the approved canvas `#0D1117`, panel `#161B22`, accent `#2F81F7`, focus `#58A6FF`, and destructive `#F85149` colors. The exact drift notice selects the existing error tone rather than a new accent surface (`src/web/App.vue:887-890`).
- **PASS — status remains textual.** Exact status and source meaning are rendered as text (`Frozen verified patch`, `Implemented content changed`, `Preimage`, and `Postimage`) in `src/web/components/IdentityHeader.vue:42-56` and `src/web/App.vue:887-890, 946-954`; color is not their only signal.

### Pillar 4: Typography (4/4)

- **PASS — exact identity follows the established hierarchy.** The header uses the existing 20px/28px page-heading token and the scope heading uses the 16px/24px section-heading token (`src/web/styles.css:191-219`).
- **PASS — the full patch digest remains semantic monospace content.** `IdentityPanel` renders the full digest in `<code class="object-id">` (`src/web/components/IdentityPanel.vue:96-101`), and narrow CSS allows it to wrap rather than ellipsize (`src/web/styles.css:2247-2253`). Chromium asserts the complete 64-character digest at 320px (`tests/integration/selector-drift-ui.spec.ts:544-550`).

### Pillar 5: Spacing (3/4)

- **PASS — exact Patch scope controls meet the narrow target contract.** The narrow rule gives the disclosure, modal close, and copy controls a 44px minimum (`src/web/styles.css:2255-2260`); Chromium verified the narrow modal below the 96px header with no horizontal page scroll (`tests/integration/selector-drift-ui.spec.ts:535-550`).
- **WARNING — not every narrow-shell control uses the 44px minimum.** General `button` and `.ui-button` styles remain 32px (`src/web/styles.css:326-333`), including existing review-shell controls such as the `Files` button (`src/web/App.vue:934-940`). This falls short of the UI-SPEC’s broad below-768px control target, but does not block the tested patch-scope task.

### Pillar 6: Experience Design (4/4)

- **PASS — retry has one frozen content source and no live fallback.** `loadFile()` always calls the authenticated session client’s single `/api/files/{fileId}/content` operation (`src/web/App.vue:234-260`; `src/web/api/client.ts:228-236`); `retryDiff()` reuses the selected file and the same code path (`src/web/App.vue:692-697`). Chromium observed exactly two requests to the same snapshot content route after a transient failure, then verified no substitute content path/action on terminal loss (`tests/integration/selector-drift-ui.spec.ts:456-501`).
- **PASS — terminal loss is focused once and remains source-correct.** `App` passes `focus-heading` only for `snapshotUnavailable` (`src/web/App.vue:866-873`) and `ErrorState` focuses the mounted supplied heading (`src/web/components/ErrorState.vue:14-18`). Chromium verified focus on the one `Frozen patch unavailable` heading and a focus count of one despite a later visibility event (`tests/integration/selector-drift-ui.spec.ts:489-506`).
- **PASS — disclosure is keyboard-complete.** `IdentityPanel` uses labelled region/dialog roles, contains modal Tab focus, and exposes its close control (`src/web/components/IdentityPanel.vue:50-70, 76-94`). The focused Chromium test verifies close focus on open, Shift+Tab/Tab containment, Escape close, and focus return to `View patch scope` for each desktop/tablet width and at 320px (`tests/integration/selector-drift-ui.spec.ts:520-554`).
- **PASS — pinned behavior is preserved.** The exact branches are discriminated from the pinned branch in `IdentityHeader` (`src/web/components/IdentityHeader.vue:18-33, 42-56`) and `App` (`src/web/App.vue:128-153`). The focused generated pinned-session browser regression `identity session and empty states` passed (`tests/e2e/pinned-session.spec.ts:944-1203`).

---

## Browser Evidence

- `npm exec playwright test -- tests/integration/selector-drift-ui.spec.ts --grep "exact patch"` — **4 passed (5.3s)**. Exercised exact status source isolation, no-pinned resumed draft announcement, frozen-file retry/terminal focus/no-live-fallback behavior, and 1440/1100/768/320 Patch scope interactions.
- `npm exec playwright test -- tests/e2e/pinned-session.spec.ts --grep "identity session and empty states"` — **1 passed (12.7s)**. Exercised the generated pinned comparison identity and empty-state regression path.

## Registry Safety

Registry audit: skipped — `components.json` is absent and `13-UI-SPEC.md` declares no third-party registry.

## Files Audited

- `.planning/phases/13-exact-patch-grounding/13-UI-SPEC.md`
- `.planning/phases/13-exact-patch-grounding/13-04-PLAN.md`
- `.planning/phases/13-exact-patch-grounding/13-04-SUMMARY.md`
- `src/web/App.vue`
- `src/web/api/client.ts`
- `src/web/components/ErrorState.vue`
- `src/web/components/IdentityHeader.vue`
- `src/web/components/IdentityPanel.vue`
- `src/web/styles.css`
- `src/contracts/api.ts`
- `tests/integration/selector-drift-ui.spec.ts`
- `tests/e2e/pinned-session.spec.ts`
