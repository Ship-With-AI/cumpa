---
phase: 06
slug: independent-mit-marketplace-skill
status: complete-with-nonblocking-disclosure-gap
threats_total: 27
threats_open: 1
high_severity_open: 0
external_evidence_pending: 0
waived_not_exercised: 7
asvs_level: 1
created: 2026-09-11
---

# Phase 6 — Security Audit

> Static source audit of the Phase 6 skill, compatibility checker, local license, and committed candidate record. No validation command, installer, provider, review invocation, remote operation, or credential/private-journal inspection was performed.

## Decision

**Not blocked by a concrete source vulnerability.** T-06-01-01 has a real, low-severity documentation omission: the skill does not explicitly say that compatibility/version validation of the `PATH`-resolved executable is not binary provenance. The checker correctly invokes the executable without a shell and validates its reported version.

### Original finding and adjudication

The original audit classified the omission as a high-severity executable-substitution vulnerability. Reassessment finds no newly crossed lower-privilege boundary: an attacker who can replace `cumpa` in the caller's `PATH` already controls execution in that user's process context, including the separately invoked Node and Git tooling. A disclaimer does not authenticate the selected binary or prevent that substitution, and the skill makes no binary-authentication claim. Therefore this is an open **low-severity disclosure gap**, not a high-severity candidate blocker.

No concrete source vulnerability was found in the reviewed static surface. Main subsequently integrated the actual publication evidence in `06-PUBLICATION-EVIDENCE.json`: attributed assent, separately authorized existing automatic actions, a single consumed push, and anonymous public-byte verification. Downstream service configuration was not independently verified; the operator explicitly authorized existing automatic reactions. The waived sign-in, installer, provider, target-lifecycle, and four-agent public-install exercises remain **not exercised**, not passed.

| Metric | Count |
|---|---:|
| Declared threats | 27 |
| Closed by static evidence | 11 |
| Closed or accepted by publication evidence | 8 |
| Open declared-control gaps | 1 |
| High-severity open source threats | 0 |
| Pending external evidence | 0 |
| Not exercised under D-07/D-11 waiver | 7 |

## Scope and retained boundaries

| Boundary | Static evidence |
|---|---|
| Installed executable → compatibility gate | The checker uses direct argument-array execution with `shell: false`, a ten-second timeout, forced termination, and a bounded output buffer. |
| Untrusted version output → range decision | The checker accepts only one fully canonical stable 1.x version string and compares the relevant unbounded decimal component as text. |
| Skill → Cumpa process/result | The skill requires a strict request, separates stdin/stdout/stderr, treats loopback readiness as non-completion, and accepts output only after exit 0 and the canonical export kind. |
| Skill-owned temporary data | Instructions require a private owned handoff directory and prohibit cleanup while Cumpa remains running. |
| Source license → candidate payload | The source skill frontmatter references its own license; the local skill license is the same MIT text and attribution as the repository license. |
| Candidate record → committed evidence | The candidate record uses logical-root placeholders and identifiers/hashes only. The static scan found no concrete home/private path, credential value, or private-key material. |

## Threat Register

| Threat ID | Severity | Disposition | Status | Evidence / reason |
|---|---|---|---|---|
| T-06-01-01 | Low | mitigate | **OPEN — nonblocking disclosure gap** | `check-cumpa.mjs:6-19` proves no-shell execution and canonical version gating, but `SKILL.md` contains no statement that a `PATH`-resolved compatible version is not binary provenance. This does not create a lower-privilege substitution path: control of that `PATH` already controls the user's local process execution. |
| T-06-01-02 | Medium | mitigate | Closed | `check-cumpa.mjs:15-18` removes one optional trailing newline, anchors the entire canonical SemVer form, rejects prereleases, and compares the minor component without numeric conversion. |
| T-06-01-03 | Medium | mitigate | Closed | `check-cumpa.mjs:6-14` sets `timeout: 10_000`, `killSignal: 'SIGKILL'`, `maxBuffer: 4_096`, and fails any error, signal, nonzero status, or nonmatching output. |
| T-06-01-04 | Low | mitigate | Closed | `SKILL.md:13-15` distinguishes the stable compatibility policy from the sole independently verified release rather than claiming future stable versions were tested. |
| T-06-01-05 | High | mitigate | Closed | `check-cumpa.mjs:25-30` only writes recovery guidance and exits nonzero; `SKILL.md:17,21-28` expressly forbids automatic install, upgrade, npx fallback, checkout, and tarball substitution. |
| T-06-02-01 | High | mitigate | Closed | Main verified all five candidate file hashes against the prepared record, then matched all five raw public Git blobs through a fresh anonymous fetch. See `06-PUBLICATION-EVIDENCE.json` → `reviewedFileHashes`, `publicVerification`. |
| T-06-02-02 | High | mitigate | Closed | `SKILL.md:9,50-57,97-104` retains thin CLI delegation, prohibits agent-side review/mutation, and keeps canonical Cumpa output authoritative. |
| T-06-02-03 | High | mitigate | Closed | The candidate's parent and the anonymous remote `main` matched the approved baseline immediately before the single non-force push. The resulting public OID equals the approved candidate. See publication evidence → `publicationAttempts`, `observedPublicOid`. |
| T-06-02-04 | Medium | mitigate | Closed | The public plugin manifest is version `0.3.0`, its bytes match the reviewed version transition, and the marketplace catalog remains unchanged. See publication evidence → `collectionVersion`, `publicVerification`. |
| T-06-02-05 | High | mitigate | Closed (static record) | Logical roots are placeholders only at `06-MARKETPLACE-CANDIDATE.json:125-129`; the candidate record contains no concrete private path, credential value, or private-key material. Private journals were intentionally not inspected. |
| T-06-02-06 | High | mitigate | Closed | `SKILL.md:1-5` references the skill-local license. `LICENSE:1-21` and `.kimi-code/skills/cumpa/LICENSE:1-21` contain the same MIT grant and attribution. |
| T-06-02-07 | Medium | mitigate | Closed | Main reused the owned candidate custody, verified root mode 0700 and journal mode 0600, retained the exclusive operation lock, and recorded intent before the single push. No preparation or push replay occurred. See publication evidence → `custody`, `publicationAttempts`. |
| T-06-02-SC | High | mitigate | Not exercised — waived | The record pins installer package, version, and integrity at `06-MARKETPLACE-CANDIDATE.json:32-36`; it also records no installer/provider invocation at `:141-143`. D-11 forbids fabricating or running the assent/installer proof. |
| T-06-03-01 | High | mitigate | Not exercised — waived | Four-agent discovery/invocation rows remain documented in the command matrix, but D-07/D-11 and `06-03-PLAN.md:58-64` waive target proof. No successful row is asserted. |
| T-06-03-02 | High | mitigate | Not exercised — waived | Installer/provider use and its scoped authority were waived by `06-03-PLAN.md:60-64`; no invocation occurred in this audit. |
| T-06-03-03 | Medium | mitigate | Not exercised — waived | Fixture lifecycle/result binding is target-proof work explicitly superseded by the execution amendment (`06-03-PLAN.md:60-64`). |
| T-06-03-04 | Medium | mitigate | Not exercised — waived | The released-Cumpa readiness/controlled-abort smoke is explicitly waived (`06-03-PLAN.md:60-64`); no runtime claim is made. |
| T-06-03-05 | Medium | mitigate | Closed (static instruction) | `SKILL.md:75-80` directs Pi to redirect canonical stdout only, leave stderr live, run foreground, and read results only after actual exit. |
| T-06-03-06 | Medium | mitigate | Closed (static instruction) | `SKILL.md:48,57,61-85` requires native supervision, rejects detached fallbacks, waits for terminal exit, and removes only owned handoff data after terminal outcome. |
| T-06-03-07 | High | mitigate | Closed (static record) | Candidate evidence retains logical placeholders only (`06-MARKETPLACE-CANDIDATE.json:125-129`), while the execution amendment preserves private-profile and non-mutation limits (`06-03-PLAN.md:60-64`). Runtime profile isolation was not exercised. |
| T-06-03-08 | High | mitigate | Closed | Candidate HEAD, parent, clean state, exact changed-path set and all five hashes matched the prepared record; anonymous public blobs matched after publication. See publication evidence → `custody`, `reviewedFileHashes`, `publicVerification`. |
| T-06-03-09 | High | mitigate | Closed | Actual current-chat assent “you have approval” is recorded separately from the later “Allow existing automatic actions” selection, with attribution, scope and timestamps. See publication evidence → `publicationAssent`, `automaticEffectsAssent`. |
| T-06-03-10 | High | mitigate | Closed | One intent was durably recorded before invocation; authority was consumed once; push exit 0 and an anonymous remote read established the exact public candidate. No retry or recovery push occurred. See publication evidence → `publicationAttempts`. |
| T-06-03-11 | High | accept (operator) | Closed with explicit risk acceptance | GitHub-visible protections, workflows, hooks, Pages and deployment records were inspected. Service-side deployment bindings were not fully accessible. The operator expressly allowed existing automatic actions for this repository push, including deployments, without integration-setting changes. Post-push GitHub observations are timestamped, not a claim of complete downstream visibility. See publication evidence → `pushEffects`, `automaticEffectsAssent`, `postPushObservation`. |
| T-06-03-12 | High | mitigate | Not exercised — waived; public bytes verified separately | D-11 waives four-agent public installation. Main independently verified anonymous public OID and raw file hashes; this is not a consumer-installation or runtime result. See publication evidence → `publicInstalls`, `publicVerification`. |
| T-06-03-13 | Low | mitigate | Closed | `SKILL.md:13-15` limits version claims, while `06-02-SUMMARY.md:66-74` and `06-03-PLAN.md:60-64` explicitly retain the Phase 7/full-runtime limitation. |
| T-06-03-SC | High | mitigate | Not exercised — waived | The pinned installer identity is present in the candidate record (`06-MARKETPLACE-CANDIDATE.json:32-36`), but D-11 prohibits the installer/provider proof and no supply-chain execution is claimed. |

## Unregistered Flags

No `## Threat Flags` section was present in either completed Phase 6 summary. The summaries instead explicitly identify the user waiver and the non-exercised four-agent runtime boundary (`06-02-SUMMARY.md:64-74`); it maps to the T-06-03 target-proof and installer threats above, so no unregistered attack surface was recorded.

## Accepted Risks Log

No accepted risks. The D-07/D-11 waiver narrows execution evidence only; it does not turn the open T-06-01-01 disclosure gap or unperformed runtime/provider work into a passed security control.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open declared-control gaps | Pending external evidence | Not exercised | Auditor |
|---|---:|---:|---:|---:|---:|---|
| 2026-09-11 | 27 | 11 | 1 | 8 | 7 | SkillSecurityReview |
| 2026-09-11 | 27 | 19 | 1 | 0 | 7 | Main — integrated actual publication evidence; retained original static review and user waiver |

## Required disposition

1. Add the missing T-06-01-01 provenance limitation to the installed-skill instructions when editing that skill next. It is a nonblocking disclosure correction, not a binary-authentication control.
2. Publication evidence is complete for the amended scope. Existing automatic reactions were explicitly authorized despite incomplete service-side visibility; no further push, retry, installer/provider action or integration-setting change is authorized.
3. Keep the waived four-agent and installer/provider activities as **not exercised**. They require no retrospective run or fabricated evidence.

**Concrete source vulnerability blocks candidate:** **No.** T-06-01-01 remains a low-severity, nonblocking documentation gap.
