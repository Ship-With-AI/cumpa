# Roadmap: Cumpa

## Milestones

- **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- **[v1.2 Fast Source Discovery](./milestones/v1.2-ROADMAP.md)** — Phases 09–11, 4 plans, 5/5 requirements, shipped 2026-07-30.
- **[v1.3 Agent Review Handoff](./milestones/v1.3-ROADMAP.md)** — Phases 12–15, 14 plans, 42 tasks, 17/17 requirements, shipped 2026-08-06.
- **[v1.4 Voluntary Support](./milestones/v1.4-ROADMAP.md)** — Phases 01–02, 22 plans, 30 tasks, 12/12 requirements, shipped 2026-09-04.
- **v1.5 MIT Distribution** — Phases 03–07, 19 requirements, planned.

## Overview

The 2026-09-08 quick task `260908-d25` supersedes the 2026-09-07 proprietary source-available direction. MIT distribution proceeds through five dependency-ordered outcomes: Cumpa establishes standard MIT terms, refreshed dual-licensor exact-text assent, rights and sensitive-history review, and safe publication of the existing repository and reviewed history. Standard MIT permits commercial use, modification, redistribution, sublicensing, and resale; third-party rights remain. Maintainers then verify one complete runtime-only tarball before registry mutation, perform a usable non-`latest` bootstrap, revoke its temporary authorization, and publish stable `1.5.0` through OIDC trusted publishing from the approved public repository without long-lived credentials. Preserve eligible automatic npm provenance and substantiate release claims with verified evidence. The independently MIT-licensed ShipWithAI skill follows with a separately installed CLI prerequisite. Clean global, npx, and marketplace acceptance closes the milestone without changing review or voluntary-support behavior.

## Phases

- [x] **Phase 3: Distribution Contract & Legal Boundary** — Establish standard MIT terms, refreshed dual-licensor exact-text assent, safe publication of the existing repository and reviewed history, and truthful package links and provenance policy. (completed 2026-09-08)
- [x] **Phase 4: Exact Runtime Tarball** — Produce one complete compiled-runtime-only tarball and verify its exact bytes before any npm release. (completed 2026-09-09)
- [ ] **Phase 5: Bootstrap & Trusted Stable Publication** — Establish a usable non-`latest` bootstrap, revoke temporary authorization, and publish stable `1.5.0` through OIDC.
- [ ] **Phase 6: Independent MIT Marketplace Skill** — Publish the thin MIT skill after the released MIT Cumpa CLI exists as a separate prerequisite.
- [ ] **Phase 7: Clean Public-Artifact Acceptance** - Prove global, npx, and marketplace workflows from clean environments using only released public artifacts.

## Phase Details

### Phase 3: Distribution Contract & Legal Boundary

**Goal**: Maintainers establish standard MIT terms, refreshed dual-licensor exact-text assent, rights- and sensitive-material-reviewed public repository/history, accurate user-facing metadata, and an evidence-backed provenance policy that permits safe runtime-only package preparation.
**Depends on**: Phase 2 (v1.4 complete)
**Requirements**: PKG-06, PKG-07, REL-04, REL-05
**UI hint**: no
**Success Criteria** (what must be TRUE):

1. Standard MIT for Cumpa source and compiled releases is assented to in its exact text by both Alessandro Magionami and Manuel Salvatore Martone before publication, permits commercial use, modification, redistribution, sublicensing, and resale, preserves third-party rights and notices, and adds no downstream conditions.
2. Approved npm metadata names `@shipwithai/cumpa@1.5.0`, `cumpa`, Node.js 24+, an MIT license file, and the exact `Ship-With-AI/cumpa` repository; the self-contained user guide links to the verified public Issues page and omits a separate homepage.
3. The existing `Ship-With-AI/cumpa` repository and reviewed history are public under standard MIT only after both licensors give refreshed exact-text MIT assent and rights/sensitive-material review is resolved; no credentials or confidential operational material are exposed, and destructive remediation or history rewriting requires separate approval.
  4. The documented release policy preserves eligible automatic npm provenance, defines the public-source/attestation evidence Phase 5 must verify, and forbids unsupported claims; OIDC authentication alone is not attestation proof.

**Plans**: 3/3 complete. MIT assent and authorized public source are verified; code review is clean, all 23 declared threats are closed/accepted, goal verification is 10/10, and the token-cleanup UAT passed 1/1. Phase 3 completed 2026-09-08.

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Historical proprietary rights, notices, and dual-licensor approval record

**Wave 2** *(historical proprietary work)*

- [x] 03-02-PLAN.md — Historical proprietary package metadata and truthful user/release documentation record

**Wave 3** *(MIT assent and authorized public source verified)*

- [x] 03-03-PLAN.md — Reviewed MIT preparation and authorized public-source transition

### Phase 4: Exact Runtime Tarball

**Goal**: Maintainers hold one reviewed, immutable `.tgz` containing every required compiled runtime asset and no development-only or sensitive material, regardless of public source availability.
**Depends on**: Phase 3
**Requirements**: PKG-03, PKG-04, PKG-05, REL-03
**Success Criteria** (what must be TRUE):

  1. Installing the candidate tarball outside any source checkout exposes `cumpa --version` as exactly `1.5.0` and preserves the existing Node.js 24+ and Git prerequisite guidance.
  2. The packed archive contains every compiled Node runtime and browser asset required to launch and complete the existing browser-review workflow.
  3. Archive inspection finds no TypeScript source, source maps or embedded source content, tests, fixtures, planning files, workflows, credentials, local review state, marketplace-skill files, Git data, or repository history.
  4. Maintainers record and approve one tarball digest, install and inspect those exact bytes, and designate the same immutable archive for publication without a later rebuild or substitution.

**Plans**: 3/4 plans executed
**Wave 1**

- [x] 04-01-PLAN.md

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03-PLAN.md

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 04-04-PLAN.md

### Phase 5: Bootstrap & Trusted Stable Publication

**Goal**: Users can obtain the MIT-licensed Cumpa CLI from public npm while maintainers publish stable releases from the approved public repository without long-lived npm credentials and record verified provenance outcomes.
**Depends on**: Phase 4
**Requirements**: PKG-01, PKG-02, REL-01, REL-02
**Success Criteria** (what must be TRUE):

1. One complete, usable MIT-licensed bootstrap release exists under a non-`latest` tag through short-lived interactive authorization, and that authorization is revoked before stable publication.
2. A fixed release workflow in the approved public `Ship-With-AI/cumpa` repository publishes the reviewed MIT-licensed `@shipwithai/cumpa@1.5.0` tarball through GitHub OIDC trusted publishing without long-lived publication credentials, preserves eligible automatic provenance, and records verified attestation results under the Phase 3 release policy.
  3. Public npm resolves exact `1.5.0` for both `npm install --global @shipwithai/cumpa@1.5.0` and `npx --yes @shipwithai/cumpa@1.5.0`, with the global install exposing the `cumpa` command.

**Plans**: 6 plans in 5 waves — local Waves 1 and 2 verified; 05-04 private preparation passed and is waiting at the exact source-push authorization gate.
**Wave 1**

- [x] 05-01-PLAN.md — Closed configured bootstrap artifact profile
- [x] 05-02-PLAN.md — CI candidate and public release evidence verifier

**Wave 2**

- [x] 05-03-PLAN.md — Gated same-run CI build and publication workflow

**Wave 3**

- [ ] 05-04-PLAN.md — Reviewed source, usable bootstrap and authorization revocation

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 05-05-PLAN.md — Protected publisher setup and actual CI candidate approval

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 05-06-PLAN.md — Exact stable publication and public artifact/provenance proof

### Phase 6: Independent MIT Marketplace Skill

**Goal**: Coding-agent users can install the public Cumpa skill as an independent MIT-licensed delegate to the separately installed released CLI.
**Depends on**: Phase 5
**Requirements**: SKL-01, SKL-02, SKL-03
**Success Criteria** (what must be TRUE):

1. Coding-agent users can install the existing Cumpa skill from the public ShipWithAI marketplace; the skill carries its own MIT license and delegates to the separately installed MIT Cumpa CLI.
  2. When `cumpa` is absent, the installed skill stops with the exact npm installation command and the Node.js 24+ and Git prerequisites instead of bundling or silently installing the CLI.
  3. With `@shipwithai/cumpa@1.5.0` installed separately, the skill delegates Git grounding, diff generation, browser review, persistence, Finish semantics, and canonical output to that CLI without duplicating application behavior.

**Plans**: TBD

### Phase 7: Clean Public-Artifact Acceptance

**Goal**: Every supported public installation path completes the existing browser-review workflow from a clean environment without a source checkout or local release inputs.
**Depends on**: Phase 6
**Requirements**: ACC-01, ACC-02, ACC-03, ACC-04
**Success Criteria** (what must be TRUE):

  1. A clean environment globally installs exact public `@shipwithai/cumpa@1.5.0` and completes the existing browser-review workflow without a source checkout, workspace link, or local tarball.
  2. A clean environment with an empty npm cache runs exact `npx --yes @shipwithai/cumpa@1.5.0` and completes the browser-review workflow without a prior or local installation.
  3. A clean agent profile installs the public marketplace skill, invokes the separately installed exact CLI, finishes a browser review, and receives the validated canonical result.
  4. Global, npx, and marketplace-installed paths retain unrestricted review and export behavior whether voluntary support is unpaid, dismissed, or verified.

**Plans**: TBD

## Progress

**Execution Order:** Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 3. Distribution Contract & Legal Boundary | 3/3 | Complete    | 2026-09-08 |
| 4. Exact Runtime Tarball | 4/4 | Complete    | 2026-09-09 |
| 5. Bootstrap & Trusted Stable Publication | 3/6 | Awaiting source authorization | - |
| 6. Independent MIT Marketplace Skill | 0/TBD | Not started | - |
| 7. Clean Public-Artifact Acceptance | 0/TBD | Not started | - |
