---
phase: 11-workspace-shell-review-surfaces
audited: 2026-09-14
status: secured_with_warning
asvs_level: 1
block_on: high
threats_total: 41
threats_open: 0
unregistered_flags_open: 1
---

# Phase 11 Security Audit

## Verdict

**SECURED for the 41 registered Phase 11 threats (41/41 closed).** T-11-06-01 is now closed: exact-patch drift changes flow through the single external polite announcer even when a shell modal makes the visible warning stack inert. The visible notice is non-live.

**WARNING — UF-11-01 remains open and unregistered.** The replacement pack-lock liveness scheme can be spoofed by PID reuse and has a check/delete/create race that can remove a newly acquired live lock, allowing concurrent packers. This is not mapped to a Phase 11 threat-register ID, so it is recorded as an `unregistered_flag`, not counted among the 41 declared threats.

## Threat Verification

| Threat ID | Category | Disposition | Status | Code evidence |
|---|---|---|---|---|
| T-11-01-01 | Tampering | mitigate | CLOSED | Static caller titles remain rendered by `ModalDialog.vue:97-105`; remediation did not alter dialog title inputs. |
| T-11-01-02 | Denial of service | mitigate | CLOSED | `App.vue:1213` retains shell `inert` rather than removal; paired-zone sizing remains at `DiffWorkspace.vue:105-108`. |
| T-11-01-03 | Elevation of privilege | mitigate | CLOSED | `ModalDialog.vue:26-33,52-72` includes inputs and all normal controls in its local Tab/Shift+Tab trap, with local Escape. |
| T-11-01-04 | Tampering | mitigate | CLOSED | The semantic gate retains color enforcement and the overlay allowlist at `verify-semantic-css.mjs:209-253`. |
| T-11-01-SC | Tampering | mitigate | CLOSED | `73a30d8^..73a30d8` changes no `package.json` or `package-lock.json`. |
| T-11-02-01 | Spoofing | mitigate | CLOSED | Changed `IdentityHeader.vue:28-38` still passes base/head labels and OIDs through `controlSafeDisplay`. |
| T-11-02-02 | Spoofing | mitigate | CLOSED | Exact-patch labels remain Preimage/Postimage in `IdentityHeader.vue:77-85`; `ShellFooter.vue:10-18` says “frozen patch”, not current content. |
| T-11-02-03 | Information disclosure | mitigate | CLOSED | `ActiveFileToolbar.vue:8-14,53-59` accepts session/path data only and renders `PathDisplay`, not repository root. |
| T-11-02-04 | Tampering | mitigate | CLOSED | Shared zone height derives from mounted content at `DiffWorkspace.vue:105-108,300-307`. |
| T-11-02-05 | Denial of service | mitigate | CLOSED | The resize observer returns without a zone and changes height only beyond one pixel at `DiffWorkspace.vue:300-307`. |
| T-11-02-SC | Tampering | mitigate | CLOSED | `73a30d8^..73a30d8` changes no package manifest or lockfile. |
| T-11-03-01 | Spoofing | mitigate | CLOSED | `IdentityPanel.vue:15-25` still sanitizes labels and worktree paths with `controlSafeDisplay`. |
| T-11-03-02 | Spoofing | mitigate | CLOSED | The exact-patch-only Details branch remains separate at `IdentityPanel.vue:37-67`; Base/Head values remain in the non-exact branch. |
| T-11-03-03 | Elevation of privilege | mitigate | CLOSED | Details uses the same local `ModalDialog` focus/Escape primitive. |
| T-11-03-04 | Information disclosure | mitigate | CLOSED | `App.vue:376-393` maps non-client metadata failures to `FILE_UNAVAILABLE_MESSAGE`; metadata is not accepted before its matching file ID. |
| T-11-03-05 | Tampering | mitigate | CLOSED | Monotonic `metadataRequestVersion` and file-ID matching remain at `App.vue:376-393`. |
| T-11-03-SC | Tampering | mitigate | CLOSED | `73a30d8^..73a30d8` changes no package manifest or lockfile. |
| T-11-04-01 | Repudiation | mitigate | CLOSED | `ReviewNotesDialog.vue:170-187` preserves export-state delegation; `ExportSection.vue:93-145` keeps conflict, failed, pending, and exported states distinct. |
| T-11-04-02 | Tampering | mitigate | CLOSED | `GitignoreStatus.vue:35-68,103-135` requires explicit confirmation before one append and preserves failure states. |
| T-11-04-03 | Spoofing | mitigate | CLOSED | Unverified cards remain visibly badged and read-only at `ReviewPanel.vue:322-390`; guards reject all unverified mutations at `:105-172` and `App.vue:558-618`. |
| T-11-04-04 | Elevation of privilege | mitigate | CLOSED | Review notes uses `ModalDialog` at `ReviewNotesDialog.vue:109-114`, retaining modal-local keyboard handling. |
| T-11-04-05 | Information disclosure | mitigate | CLOSED | `App.vue:1399-1435` mounts Review notes as a session-shell overlay sibling, outside `review-main`. |
| T-11-04-06 | Tampering | mitigate | CLOSED | Open/resolved cards retain path, side, line, verification, and selected badges at `ReviewPanel.vue:322-328,467-475`. |
| T-11-04-SC | Tampering | mitigate | CLOSED | `73a30d8^..73a30d8` changes no package manifest or lockfile. |
| T-11-05-01 | Spoofing | mitigate | CLOSED | `ChangedFilesDialog.vue:36-48` hosts the existing `FileTree`; it was not forked. |
| T-11-05-02 | Elevation of privilege | mitigate | CLOSED | Changed files supplies `#file-tree-filter` as initial focus at `ChangedFilesDialog.vue:24-32`; `ModalDialog` traps it locally. |
| T-11-05-03 | Information disclosure | mitigate | CLOSED | The changed-files dialog remains an App-level overlay sibling at `App.vue:1365-1376`, outside `review-main`. |
| T-11-05-04 | Tampering | mitigate | CLOSED | The semantic gate’s overlay list contains only current dialog/rail surfaces at `verify-semantic-css.mjs:225-249`. |
| T-11-05-05 | Denial of service | mitigate | CLOSED | `styles.css:1482-1501,2551-2659` retains width/overflow containment and narrow reflow. |
| T-11-05-SC | Tampering | mitigate | CLOSED | `73a30d8^..73a30d8` changes no package manifest or lockfile. |
| T-11-06-01 | Spoofing | mitigate | CLOSED | `App.vue:267-276` announces only a `false → true` `patchDrifted` transition. The live node is an uninert session-shell sibling at `:1436-1438`; the modal-inert visible notice at `:1213,1231-1237` is `InlineNotice`’s default `role="note"` (`InlineNotice.vue:6-15,32-38`). |
| T-11-06-02 | Tampering | mitigate | CLOSED | `App.vue:1231-1240` independently renders patch, selector, and stale-anchor warnings; no `v-else` suppresses a simultaneous drift. |
| T-11-06-03 | Repudiation | mitigate | CLOSED | `ReviewPanel.vue:105-172,363-390,498-505` and `App.vue:558-618` preserve read-only stale/unavailable history and independently reject its mutation paths. |
| T-11-06-04 | Denial of service | mitigate | CLOSED | `App.vue` has exactly one `aria-live` occurrence, at `:1436`; `liveMessageVersion` changes only through `announce()` at `:274-276`. No lifecycle owner was added to the visible warning. |
| T-11-06-05 | Tampering | accept | CLOSED — accepted | The accepted-risk entry below remains present; recovery surfaces continue to report no feedback returned at `ReviewNotesDialog.vue:248-278`. |
| T-11-06-SC | Tampering | mitigate | CLOSED | `73a30d8^..73a30d8` changes no package manifest or lockfile. |
| T-11-07-01 | Tampering | mitigate | CLOSED | Paired-zone sizing/resize guards remain at `DiffWorkspace.vue:105-108,300-307`; `styles.css:1482-1501` retains shell containment. |
| T-11-07-02 | Spoofing | mitigate | CLOSED | The changed remediation scope did not alter comment action identity; current cards retain their fixed action labels and recorded identity at `ReviewPanel.vue:322-390`. |
| T-11-07-03 | Denial of service | mitigate | CLOSED | Live `.empty-state` and `.comments-rail` rules remain at `styles.css:946-949,1497-1501`, and their App consumers remain mounted. |
| T-11-07-04 | Elevation of privilege | mitigate | CLOSED | No live owner was added to inline cards. The existing drift regression test requires no status/alert/live descendant before local copy feedback at `review-panel-resolved.spec.ts:403-415`. |
| T-11-07-SC | Tampering | mitigate | CLOSED | `73a30d8^..73a30d8` changes no package manifest or lockfile. |

## T-11-06-01 Remediation Assessment

- **Reachability while modal-open:** `shellModalOpen` makes only `.session-shell__content` inert (`App.vue:95-96,1213`); the global polite node is a direct `.session-shell` child after every modal (`:1365-1438`). Exact-patch polling remains active through `startPatchStatus()` and visible-state refresh (`:996-1012,1116-1120`), regardless of modal state.
- **Exactly once per transition:** the watcher compares boolean transition state with `hadPatchDrift` (`:267-271`), so repeated renders and repeated `drifted` responses do not call `announce()`; a later clean-to-drifted transition does. The versioned child (`:1436-1438`) gives the sole owner a fresh DOM transition.
- **Single owner / non-live visible notice:** the App source contains one `aria-live`, its global polite node. The patch notice passes no `role` to `InlineNotice`, whose default is `note`, and has no `aria-live`.
- **Test quality:** the new modal-open test sets `drifted` only after the Review-notes modal made shell content inert (`selector-drift-ui.spec.ts:395-417`). Its recorded pre-fix failure, `Expected: "Implemented content changed." Received: "New local draft for this frozen exact patch."`, demonstrates the asserted global region was still carrying its startup announcement rather than the drift transition. Before the fix the same test would also fail its zero shell-alert assertion, because the visible warning was a `role="alert"` inside the inert subtree. It directly proves external reachability and non-live visibility; source inspection, not the test alone, establishes once-per-transition behavior.

## Accepted Risks

| Threat ID | Accepted risk | Basis and retained constraint |
|---|---|---|
| T-11-06-05 | Corrupt, schema-invalid, newer-draft, and frozen-snapshot-unavailable recovery behavior was intentionally not changed. | These surfaces remain blocking/read-only rather than silently mutable. Attached-review recovery failure explicitly states that no feedback was returned at `ReviewNotesDialog.vue:270-278`. |

## Threat Flags

### Unregistered Flag — WARNING

| ID | Finding | Code evidence | Effect |
|---|---|---|---|
| UF-11-01 | Dead/absent-owner takeover is not concurrency-safe or PID-reuse-safe. | `runtimePackLockOwnerIsAlive()` treats any process currently using the numeric PID as the recorded owner via `process.kill(pid, 0)` (`pack-runtime.mjs:55-63`), so a reused PID can make a dead lock wait until timeout. Two contenders can both observe a dead/missing owner, then each executes unconditional `rmSync(lock)` and retries (`:66-82`); the second removal can delete the first contender’s newly acquired lock. `releaseRuntimePackLock()` also unconditionally removes whichever lock exists (`:85-86`). No lock-specific test covers either race. | A dead original owner can be mistaken for a live unrelated process (bounded five-minute denial), and the stale-takeover race can permit two packers concurrently. No Phase 11 threat-register ID maps this packaging surface. |

## Audit Scope and Evidence

- Read all seven Phase 11 `<threat_model>` registers (41 total), the prior security verdict, the remediation summary, the specified implementation files, and the new integration test.
- Verified the remediation commit scope: `73a30d8^..73a30d8` changes `App.vue`, the stated UI files/CSS, `pack-runtime.mjs`, and tests/summary; it does not change package manifests or lockfile. Re-read the security-sensitive changed App, modal, selector state, read-only history, changed-files, identity, diff, semantic-gate, and pack-lock paths.
- Did not run a formatter, linter, build, or project-wide suite. This is a source-level security audit; the remediation summary’s prior browser/build evidence is not presented as newly executed evidence.
