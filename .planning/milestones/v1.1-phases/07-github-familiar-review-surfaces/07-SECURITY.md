---
phase: 07
slug: github-familiar-review-surfaces
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-28
---

# Phase 07 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
>
> **Disposition note:** At the interactive `/gsd:secure-phase 07` gate on 2026-07-28, the product owner selected **Accept all open risks**. No security-auditor subagent was run. Every register entry below is therefore closed by explicit risk acceptance, not by this workflow independently verifying its planned mitigation. This includes high-severity threats whose PLAN.md gates stated that acceptance was not permitted.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Repository-derived labels, OIDs, and paths → Vue header | Pinned repository identity must remain inert display text and must not become HTML, CSS, selector, SVG, ref, or filesystem authority. | Untrusted repository display strings |
| Fixed local icon vocabulary → native controls | Decorative SVG must not replace accessible names, native disabled semantics, shortcuts, or focus behavior. | Static presentation metadata |
| Visual state → reviewer interpretation | Selected, focused, disabled, destructive, pending, success, and error states must truthfully represent authoritative state. | Security-relevant UI meaning |
| Draft comment and path text → conversation cards | Review content must remain inert Vue text and must not become executable markup, selectors, classes, or anchor authority. | Untrusted review text and repository paths |
| Vue conversation content → Monaco paired zones | Measured content may affect bounded zone height but must not gain editor model, line mapping, listener, or persistence authority. | Rendered content and layout measurements |
| Canonical persistence responses → accepted review presentation | Pending or failed mutations must not be presented as accepted comments or completed operations. | Canonical draft state and async outcomes |
| Focus-comment commands → transient rail selection | Existing comment IDs may drive presentation and focus but must not enter persistence or export. | Trusted command IDs and transient UI state |
| Existing state branches → notices and badges | Status presentation must map directly to authoritative state and must not synthesize completion or readiness. | Review, recovery, export, and ignore-status state |
| Draft classification and fingerprint-bound closures → recovery UI | Browser presentation must preserve explicit consent, fixed request shapes, backup-first behavior, and failure semantics. | Recovery classification, fingerprint, and result |
| Export and ignore-status lifecycles → readiness language | Conflict, pending, unavailable, and ready states must remain distinct and must not trigger mutation. | Export state and asynchronous ignore status |
| Recovery/clipboard outcomes → assistive announcements | Dynamic feedback must have one authoritative live-region owner and preserve pinned-source authority. | Recovery and clipboard results |
| Browser fixtures → verification claims | Test timing and fixtures must expose real pending and settled states rather than producing false confidence. | Test-controlled HTTP responses and assertions |
| Package manifests and remote assets → shipped UI | Presentation-only work must not silently add dependency, registry, telemetry, or remote-asset exposure. | Supply-chain and network surface |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation / Reference | Status |
|-----------|----------|-----------|-------------|------------------------|--------|
| T-07-01 | Tampering | Header path/selector rendering | accept | Planned Vue text-only rendering and fixed safe-display authority; `07-01-PLAN.md`. | closed |
| T-07-02 | Spoofing | Base/Head and toolbar semantics | accept | Planned visible labels, pinned short IDs, exact control names, native disabled rules, and independent focus/selection; `07-01-PLAN.md`. | closed |
| T-07-03 | Denial of Service | Long labels and paths | accept | Planned bounded layout, truncation/wrapping, and overflow assertions; `07-01-PLAN.md`. | closed |
| T-07-04 | Information Disclosure | Repository identity | accept | Planned restriction to authorized safe labels, pinned OIDs, and repository-relative paths; `07-01-PLAN.md`. | closed |
| T-07-05 | Information Disclosure | Icons and assets | accept | Planned fixed local SVG/system fonts with no remote assets, telemetry, or repository-derived icon content; `07-01-PLAN.md`. | closed |
| T-07-06 | Tampering | Comment/path rendering | accept | Planned Vue text/VNode rendering, immutable anchors, and canonical accepted-comment authority; `07-02-PLAN.md`. | closed |
| T-07-07 | Spoofing | Lifecycle and anchor badges | accept | Planned direct binding to closed state/status records and separate visible lifecycle/anchor channels; `07-02-PLAN.md`. | closed |
| T-07-08 | Denial of Service | Monaco view-zone lifecycle | accept | Planned single bounded paired-zone lifecycle, disposal, geometry, and listener assertions; `07-02-PLAN.md`. | closed |
| T-07-09 | Repudiation | Pending versus accepted comment | accept | Planned canonical-response acceptance and failed-settlement composer retention; `07-02-PLAN.md`. | closed |
| T-07-10 | Information Disclosure | Fixed anchor metadata | accept | Planned restriction to authorized repository-relative paths and recorded review metadata; `07-02-PLAN.md`. | closed |
| T-07-11 | Tampering | Selected comment identity | accept | Planned focus-command-only selection, current-ID clearing, CSS escaping, and no persistence/export; `07-03-PLAN.md`. | closed |
| T-07-12 | Spoofing | Selection/focus/lifecycle/anchor cues | accept | Planned independent visual channels and overlap assertions; `07-03-PLAN.md`. | closed |
| T-07-13 | Spoofing | Localized busy feedback | accept | Planned operation/comment correlation, exact progressive labels, and sibling-row assertions; `07-03-PLAN.md`. | closed |
| T-07-14 | Tampering | Rail comment/path rendering and actions | accept | Planned text-only rendering, exact action emits, and verified-anchor control gates; `07-03-PLAN.md`. | closed |
| T-07-15 | Denial of Service | Grouped long records | accept | Planned min-width, wrapping, bounded scroll ownership, and long-content coverage; `07-03-PLAN.md`. | closed |
| T-07-16 | Spoofing | Notice/status meaning | accept | Planned closed tone mapping, icon+heading+edge structure, progressive pending text, and browser state coverage; `07-04-PLAN.md`. | closed |
| T-07-17 | Repudiation | Recovery outcome | accept | Planned verified-result-only success, failure no-replacement language, and exact backup receipt; `07-05-PLAN.md`. | closed |
| T-07-18 | Elevation of Privilege | Reveal/recovery actions | accept | Planned fixed no-body reveal and fingerprint-bound recovery closures with request-shape assertions; `07-05-PLAN.md`. | closed |
| T-07-19 | Tampering | Draft path/problem rendering | accept | Planned safe Vue text rendering with no browser-selected path or byte-level authority; `07-05-PLAN.md`. | closed |
| T-07-20 | Denial of Service | Long notices and recovery details | accept | Planned bounded details, anywhere wrapping, stable controls, existing scroll owners, and reduced-motion-aware spinner; `07-04-PLAN.md`, `07-05-PLAN.md`. | closed |
| T-07-G04 | Spoofing | Export conflict badge | accept | Planned explicit conflict-to-error label mapping and heading-badge assertion; `07-08-PLAN.md`. | closed |
| T-07-G05 | Spoofing | Ignore-status readiness language | accept | Planned null-pending versus concrete-unavailable mapping and cross-surface consistency; `07-08-PLAN.md`. | closed |
| T-07-G06 | Repudiation | Export browser fixture | accept | Planned held middleware response and request-count assertions for pending/settled evidence; `07-08-PLAN.md`. | closed |
| T-07-G07 | Elevation of Privilege | Export/ignore capabilities | accept | Planned presentation-only changes with fixed closures and no new mutation authority; `07-08-PLAN.md`. | closed |
| T-07-G08 | Spoofing | Recovered success receipt | accept | Planned authoritative verified-result InlineNotice and exact live-owner count; `07-09-PLAN.md`. | closed |
| T-07-G09 | Denial of Service | Live-region announcement tree | accept | Planned single dynamic status owner per surface with rendered-state assertions; `07-09-PLAN.md`. | closed |
| T-07-G10 | Tampering | Selector-drift copy/pinned identity | accept | Planned removal of redundant live ownership while retaining fixed clipboard source and pinned identity; `07-09-PLAN.md`. | closed |
| T-07-G11 | Elevation of Privilege | Recovery/copy capabilities | accept | Planned fingerprint-bound recovery and fixed clipboard inputs with no automatic or filesystem action; `07-09-PLAN.md`. | closed |
| T-07-SC | Tampering | npm supply chain | accept | Plans declared no install, upgrade, manifest, lockfile, registry, package, telemetry, or remote-asset change. | closed |

*Status: open · closed*  
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

The following entries record one explicit product-owner decision made at the 2026-07-28 secure-phase gate. The shared rationale is intentionally repeated by reference: the owner selected **Accept all open risks**, overriding the original `mitigate` dispositions and the PLAN.md high-severity no-accept gates. These entries close workflow enforcement without an independent implementation audit.

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-07-001 | T-07-01 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-002 | T-07-02 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-003 | T-07-03 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-004 | T-07-04 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-005 | T-07-05 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-006 | T-07-06 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-007 | T-07-07 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-008 | T-07-08 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-009 | T-07-09 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-010 | T-07-10 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-011 | T-07-11 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-012 | T-07-12 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-013 | T-07-13 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-014 | T-07-14 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-015 | T-07-15 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-016 | T-07-16 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-017 | T-07-17 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-018 | T-07-18 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-019 | T-07-19 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-020 | T-07-20 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-021 | T-07-G04 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-022 | T-07-G05 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-023 | T-07-G06 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-024 | T-07-G07 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-025 | T-07-G08 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-026 | T-07-G09 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-027 | T-07-G10 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-028 | T-07-G11 | Explicit accept-all override; mitigation not independently audited in this run. | Product owner, interactive gate | 2026-07-28 |
| AR-07-029 | T-07-SC | Repeated plan-time supply-chain acceptance; no dependency or remote-asset change was planned. | Product owner, interactive gate | 2026-07-28 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-28 | 29 | 29 | 0 | GSD secure-phase; product-owner accept-all disposition |

### Security Audit 2026-07-28

| Metric | Count |
|--------|-------|
| Threats found | 29 |
| Closed by verified mitigation | 0 |
| Closed by accepted risk | 29 |
| Open | 0 |

- Register origin: plan-time threat models in `07-01-PLAN.md` through `07-05-PLAN.md`, `07-08-PLAN.md`, and `07-09-PLAN.md`.
- Summary threat flags: none found in Phase 07 summary files.
- Auditor execution: skipped because the product owner selected **Accept all open risks**.
- Evidence limitation: Phase summaries describe focused Chromium verification, but this secure-phase run did not independently inspect implementation or execute those checks.

---

## Sign-Off

- [x] All threats have a disposition (accept)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified by explicit product-owner risk acceptance on 2026-07-28; mitigation verification not performed
