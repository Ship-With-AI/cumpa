---
phase: 03-complete-review-draft
plan: 05
subsystem: draft-recovery-ui
tags: [vue, playwright, draft-recovery, read-only, accessibility]
requires:
  - phase: 03-complete-review-draft
    provides: classified raw-byte load DTOs, fingerprint-bound recovery, and fixed no-body reveal capability
provides:
  - Explicit read-only corrupt-draft recovery surface with verified backup confirmation
  - Distinct newer-schema upgrade-only surface with fixed reveal and safe copy actions only
  - Focused browser proof for malformed, schema-invalid, recovery, and newer-version behavior
affects: [03-06, 03-07, review-ui]
tech-stack:
  added: []
  patterns: [load-kind-primary-surface, fingerprint-only-recovery, safe-relative-path-presentation]
key-files:
  created: [src/web/components/DraftRecovery.vue, tests/integration/draft-recovery-ui.spec.ts]
  modified: [src/web/App.vue, src/web/model/review-draft-state.ts, src/web/styles.css]
key-decisions:
  - "App owns the sole SessionClient and canonical recovery adoption; DraftRecovery receives only fixed no-argument reveal and fingerprint-bound recovery closures."
  - "Recovered canonical state is initialized only from a recovered response, while the success screen remains visible until Open new draft is explicitly activated."
  - "newerUnsupported remains a separate load-kind/DOM branch and cannot render recovery controls."
patterns-established:
  - "Read-only primary surfaces replace the mutable workspace before a classified corrupt or unsupported draft can reach a client mutation initiator."
  - "Browser path presentation is limited to validated repository-relative DTO fields; filesystem authority remains launch-owned on the server."
requirements-completed: [DRFT-05]
duration: execution session
completed: 2026-07-22
status: complete
---

# Phase 03 Plan 05: Draft Recovery UI Summary

**Classified corrupt drafts now remain visibly read-only until the server verifies a byte-identical backup and replacement, while newer drafts expose only upgrade guidance and fixed safe reveal/copy actions.**

## Task Commits

1. **RED — focused recovery and upgrade-only browser coverage** — `b851c72` (`test(03-05): add failing draft recovery UI coverage`)
2. **Task 1 — read-only corrupt recovery and verified replacement acknowledgement** — `01eba1b` (`feat(03-05): add verified draft recovery UI`)
3. **Task 2 — newer-schema upgrade-only state** — `765872c` (`feat(03-05): enforce newer draft upgrade-only UI`)
4. **Regression coverage — schema-invalid lockout** — `ddd7087` (`test(03-05): cover schema-invalid recovery lockout`)

## Resolved Owners and Commands

- **App/sole SessionClient owner:** `src/web/App.vue`
- **Load-kind primary-surface owner:** `src/web/model/review-draft-state.ts#reviewPrimarySurface`
- **Recovery/upgrade presentation:** `src/web/components/DraftRecovery.vue`
- **Fixed API closures:** `src/web/api/client.ts#createSessionClient`; `revealDraftFile()` is no-argument and `recoverDraft()` accepts only the server-returned fingerprint.
- **Focused browser specification:** `tests/integration/draft-recovery-ui.spec.ts`
- **Approved ledger command actually present:** `03-05-task-1-recovery-ui` → `npm run test:browser -- tests/integration/draft-recovery-ui.spec.ts`

The nominal plan keys `03-05-task-1-corrupt-ui` and `03-05-task-2-newer-ui` are absent from the approved reconciliation map. As required by the authoritative ledger, the one present focused command above was used for RED, Task 1 GREEN, Task 2 GREEN, and final verification; its ledger responsibility explicitly includes malformed/schema-invalid recovery and newer-schema upgrade-only UI.

## RED and GREEN Evidence

- **RED:** `npm run test:browser -- tests/integration/draft-recovery-ui.spec.ts` failed before UI integration because corrupt classifications were routed to the unavailable state rather than a recovery surface.
- **GREEN:** the same approved command passed after the recovery surface and App primary-surface routing were added.
- **Final focused result:** `3 passed` in `2.8s` using only `tests/integration/draft-recovery-ui.spec.ts`.

## Load-Kind / Primary-Surface Matrix

| Server load kind | Primary surface | Mutations | Available actions |
|---|---|---|---|
| `missing` / `current` | Existing review workspace | enabled after canonical state initialization | Existing review controls |
| `malformed` | Recovery screen | absent client-side; server already returns read-only | Reveal, copy safe draft path, two-step backup/start-new |
| `schemaInvalid` | Recovery screen | absent client-side; server already returns read-only | Reveal, copy safe draft path, two-step backup/start-new |
| `newerUnsupported` | Upgrade-required screen | absent client-side; server already returns read-only | Reveal and copy safe draft path only |

## Confirmation, Focus, and Zoom Observations

- First `Back up and start new` only expands the inline confirmation. `Keep existing draft` receives focus; Escape and cancel close it without issuing a recovery request and return focus to the trigger.
- The second activation sends exactly `{"expectedFingerprint":"<64 hex chars>"}`. Pending copy is `Backing up existing draft…`; failure retains the original safe path/problem content and read-only surface.
- Only a `{ kind: 'recovered' }` response initializes the replacement canonical state. The `New draft started` acknowledgement, safe backup path, and `Open new draft` action appear before the mutable workspace returns.
- The newer-version browser case applies 200% page zoom, verifies keyboard focus progresses from Reveal to Copy, and asserts the upgrade heading is exposed in an alert. No destructive action is present in its tab order.

## Safe-Data and Threat Audit

- **T-03-19 — tampering:** UI recovery requires two explicit activations and passes only the load DTO fingerprint. No browser-selected path or replacement payload exists.
- **T-03-20 — privilege:** reveal calls the fixed no-argument client closure. Browser proof records `POST /api/draft/reveal` with no post body and no query string; recovery records only the fingerprint request body.
- **T-03-21 — information disclosure:** tests prove the DOM and clipboard contain the safe relative draft/backup path only. The absolute-path sentinel, raw content, and terminal details never enter DOM, URL, clipboard, or announcements. Schema details are bounded DTO field paths/messages.
- **T-03-22 — spoofing:** `newerUnsupported` uses an explicit `upgrade` primary surface and DOM branch. It renders no backup/start-new, reset, downgrade, migration, preview, normal Review, or mutation control.

## Exclusion Audit

No selector-drift, export, packaged E2E, backend reinterpretation, new dependency, alternate HTTP client, browser path picker/opener, filesystem-path construction, formatter, linter, build, package-manager command, aggregate suite, or project-wide suite was added or run.

## Deviations from Plan

### Reconciliation-command correction

The plan named two nonexistent command keys, while the approved ledger supplies one authoritative recovery UI command covering both task behaviors. The executor used that sole command rather than inventing a command or test path. No production scope changed.

## Next Phase Readiness

The App now preserves the pinned identity header while classified recovery/upgrade surfaces replace mutable Review content. Plan 03-06 can add selector-drift status independently without gaining any draft mutation or filesystem authority.

## Self-Check: PASSED

- Both task outcomes are committed separately after the RED commit.
- The required component, focused integration specification, state-owner routing, App integration, and styles exist.
- Final approved focused browser check passes all three cases.
- Only safe relative paths and server-issued fingerprints cross the recovery UI boundary.
- Existing uncommitted planning/runtime artifacts were preserved and were not staged.
