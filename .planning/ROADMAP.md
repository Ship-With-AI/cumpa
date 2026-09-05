# Roadmap: Cumpa

## Milestones

- **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- **[v1.2 Fast Source Discovery](./milestones/v1.2-ROADMAP.md)** — Phases 09–11, 4 plans, 5/5 requirements, shipped 2026-07-30.
- **[v1.3 Agent Review Handoff](./milestones/v1.3-ROADMAP.md)** — Phases 12–15, 14 plans, 42 tasks, 17/17 requirements, shipped 2026-08-06.
- **[v1.4 Voluntary Support](./milestones/v1.4-ROADMAP.md)** — Phases 01–02, 22 plans, 30 tasks, 12/12 requirements, shipped 2026-09-04.
- **v1.5 Public Distribution** — Phases 03–07, 20 requirements, planned.

## Overview

Public distribution proceeds through five hard, dependency-ordered outcomes. Cumpa first clears complete-history disclosure, licensing authority, and GPL readiness while the repository remains private. It then makes that history public and prepares the package, npm namespace, and trusted-publisher prerequisites before publishing `@shipwithai/cumpa@1.5.0`. The independently MIT-licensed ShipWithAI skill follows as a separate distribution surface, and clean global, npx, and marketplace browser-review acceptance closes the milestone. This milestone distributes the shipped review and voluntary-support behavior without redesigning either.

## Phases

- [ ] **Phase 3: Public Disclosure and GPL Readiness** - Clear disclosure, rights, and GPL gates before repository visibility changes.
- [ ] **Phase 4: Public Source and Publication Prerequisites** - Expose the complete approved history and prepare the package, npm namespace, and trusted-publisher path.
- [ ] **Phase 5: Stable GPL npm Publication** - Publish the stable public package through GitHub OIDC with accurate provenance and Corresponding Source.
- [ ] **Phase 6: Independent MIT Marketplace Skill** - Publish the separate thin skill with an explicit GPL CLI prerequisite.
- [ ] **Phase 7: Clean Public Acceptance** - Prove global, npx, and marketplace browser-review flows from released public artifacts.

## Phase Details

### Phase 3: Public Disclosure and GPL Readiness
**Goal**: Maintainers can approve Cumpa for public GPL distribution without exposing unresolved credentials, private data, or material they lack authority to license.
**Depends on**: Phase 2 (v1.4 complete)
**Requirements**: SRC-02, LIC-01, LIC-03
**Success Criteria** (what must be TRUE):
  1. Maintainers can inspect a disclosure review covering every intended ref and history plus Actions logs and artifacts, releases, attachments, and LFS objects; repository visibility remains blocked while any exposure is unresolved.
  2. Every credential exposed by the review is revoked or rotated before visibility changes, and unresolved secrets or private data stop publication.
  3. Maintainers can trace authority for first-party contributions and see incompatible or unknown third-party and generated material resolved before publication.
  4. Application source and package licensing inputs consistently declare `GPL-3.0-or-later` and include the complete GPLv3 license text before the repository becomes public.
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Establish reviewed GPL application, scoped MIT skill, notices, and rights authority inputs.
- [ ] 03-02-PLAN.md — Implement the tested read-only disclosure collector and derived publication gate.
- [ ] 03-03-PLAN.md — Provision pinned scanners, audit every private surface including historic LFS payloads, and decide exact remediation.
- [ ] 03-04-PLAN.md — Recollect after the Plan 03 summary, authorize/ledger each non-ref remediation, then authorize one effective ordinary or rewritten-main transition and bind its settled private state to attestation/gate.

### Phase 4: Public Source and Publication Prerequisites
**Goal**: Users can inspect Cumpa's complete approved history while maintainers have a correctly bounded `1.5.0` package candidate and an npm trusted-publication path ready before the stable release.
**Depends on**: Phase 3
**Requirements**: SRC-01, PKG-03, PKG-04, PKG-06, REL-01
**Success Criteria** (what must be TRUE):
  1. Users can access the existing `Ship-With-AI/cumpa` repository and its complete intended history publicly in place.
  2. Maintainers can inspect a package candidate that reports exactly `1.5.0`, contains the complete runnable application and required GPL third-party notices, and excludes the independently MIT-licensed marketplace skill.
  3. Public documentation gives exact Node.js 24+, Git, installation, update, uninstall, troubleshooting, support, and security-reporting guidance.
  4. Maintainers can see the harmless non-`latest` npm bootstrap release, confirm its temporary publishing credential was revoked immediately, and configure the repository, workflow, and environment trusted-publisher binding before `1.5.0` is published.
**Plans**: TBD

### Phase 5: Stable GPL npm Publication
**Goal**: Users can obtain an accurately identified GPL `@shipwithai/cumpa@1.5.0` release published from public source through npm trusted publishing.
**Depends on**: Phase 4
**Requirements**: LIC-02, PKG-05, REL-02
**Success Criteria** (what must be TRUE):
  1. GitHub Actions publishes public `@shipwithai/cumpa@1.5.0` through npm trusted publishing with provenance and without `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or another long-lived publishing credential.
  2. npm metadata accurately identifies Cumpa, ShipWithAI, `GPL-3.0-or-later`, the public source repository, documentation and support locations, the `cumpa` executable, and runtime requirements.
  3. The compiled release points recipients to its exact Corresponding Source, lockfile, build and install scripts, license material, and required third-party notices.
**Plans**: TBD

### Phase 6: Independent MIT Marketplace Skill
**Goal**: Coding-agent users can install a public, independently MIT-licensed Cumpa skill that delegates review authority to the separately installed GPL CLI.
**Depends on**: Phase 5
**Requirements**: SKL-01, SKL-02, SKL-03, SKL-04
**Success Criteria** (what must be TRUE):
  1. Coding-agent users can install `shipwithai-cumpa@shipwithai` through the existing ShipWithAI marketplace.
  2. The marketplace listing identifies `@shipwithai/cumpa` as a separate GPL CLI prerequisite and gives its exact install command plus Node.js and Git requirements.
  3. The installed skill is behaviorally identical to the canonical thin Cumpa skill and delegates all review authority to the released CLI rather than duplicating application behavior.
  4. Skill metadata states its independent MIT license, compatible CLI versions, and the marketplace refresh, plugin update, and CLI update paths.
**Plans**: TBD

### Phase 7: Clean Public Acceptance
**Goal**: Clean users can reach the shipped browser-review workflow and validated canonical feedback through every approved public installation path.
**Depends on**: Phase 6
**Requirements**: PKG-01, PKG-02, ACC-01, ACC-02, ACC-03
**Success Criteria** (what must be TRUE):
  1. In a clean environment, a user can globally install `@shipwithai/cumpa@1.5.0`, run the resulting `cumpa` command, and observe version `1.5.0`.
  2. In a clean empty-cache environment with no global installation, a user can invoke `npx @shipwithai/cumpa@1.5.0` successfully.
  3. From a clean marketplace installation, a coding-agent user can launch the released CLI, complete one browser review, and consume its validated canonical result.
**Plans**: TBD

## Progress

**Execution Order:** Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 3. Public Disclosure and GPL Readiness | 0/TBD | Not started | - |
| 4. Public Source and Publication Prerequisites | 0/TBD | Not started | - |
| 5. Stable GPL npm Publication | 0/TBD | Not started | - |
| 6. Independent MIT Marketplace Skill | 0/TBD | Not started | - |
| 7. Clean Public Acceptance | 0/TBD | Not started | - |
