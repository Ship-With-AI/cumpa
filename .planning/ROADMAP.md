# Roadmap: Cumpa

## Milestones

- **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- **[v1.2 Fast Source Discovery](./milestones/v1.2-ROADMAP.md)** — Phases 09–11, 4 plans, 5/5 requirements, shipped 2026-07-30.
- **[v1.3 Agent Review Handoff](./milestones/v1.3-ROADMAP.md)** — Phases 12–15, 14 plans, 42 tasks, 17/17 requirements, shipped 2026-08-06.
- **[v1.4 Voluntary Support](./milestones/v1.4-ROADMAP.md)** — Phases 01–02, 22 plans, 30 tasks, 12/12 requirements, shipped 2026-09-04.
- **v1.5 Proprietary Distribution** — Phases 03–07, 19 requirements, planned.

## Overview

Proprietary distribution proceeds through five dependency-ordered outcomes. Cumpa first establishes approved proprietary source-available terms, rights and sensitive-history review, and safe publication of the existing repository and reviewed history. Maintainers then verify one complete runtime-only tarball before registry mutation, perform the usable non-`latest` bootstrap, revoke its temporary authorization, and publish stable `1.5.0` through OIDC trusted publishing from the approved public repository without long-lived credentials. Preserve eligible automatic npm provenance and substantiate release claims with verified evidence. The independently MIT-licensed ShipWithAI skill follows its separately installed CLI prerequisite. Clean global, npx, and marketplace acceptance closes the milestone without changing review or voluntary-support behavior.

## Phases

- [ ] **Phase 3: Distribution Contract & Legal Boundary** - Approve proprietary source-available terms, safely publish the existing repository and reviewed history, and establish truthful package links and provenance policy.
- [ ] **Phase 4: Exact Runtime Tarball** - Produce one complete compiled-runtime-only tarball and verify those exact bytes before any npm release.
- [ ] **Phase 5: Bootstrap & Trusted Stable Publication** - Establish the package with a usable non-`latest` bootstrap, revoke temporary authorization, and publish stable `1.5.0` through OIDC.
- [ ] **Phase 6: Independent MIT Marketplace Skill** - Publish the thin MIT skill after the released proprietary CLI exists as its separate prerequisite.
- [ ] **Phase 7: Clean Public-Artifact Acceptance** - Prove global, npx, and marketplace workflows from clean environments using only released public artifacts.

## Phase Details

### Phase 3: Distribution Contract & Legal Boundary
**Goal**: Maintainers have approved proprietary source-available terms, a rights- and sensitive-material-reviewed public repository/history, accurate user-facing metadata, and an evidence-backed provenance policy that permits safe runtime-only package preparation.
**Depends on**: Phase 2 (v1.4 complete)
**Requirements**: PKG-06, PKG-07, REL-04, REL-05
**Success Criteria** (what must be TRUE):
  1. The exact proprietary license is approved by both Alessandro Magionami and Manuel Salvatore Martone, covers source and compiled releases with the agreed use/copy/modification permissions, preserves GitHub-required platform and third-party rights, and accompanies required notices without claiming open-source licensing.
  2. Approved npm metadata names `@shipwithai/cumpa@1.5.0`, `cumpa`, Node.js 24+, the proprietary license file, and the exact `Ship-With-AI/cumpa` repository; its self-contained user guide links to the verified public Issues page and omits a separate homepage.
  3. The existing `Ship-With-AI/cumpa` repository and reviewed history are public only after both licensors approve the exact license and rights/sensitive-material review is resolved; no credentials or confidential operational material are exposed, and destructive remediation or history rewriting requires separate approval.
  4. The documented release policy preserves eligible automatic npm provenance, defines the public-source/attestation evidence Phase 5 must verify, and forbids unsupported claims; OIDC authentication alone is not attestation proof.
**Plans**: TBD

### Phase 4: Exact Runtime Tarball
**Goal**: Maintainers hold one reviewed, immutable `.tgz` containing every required compiled runtime asset and no development-only or sensitive material, regardless of public source availability.
**Depends on**: Phase 3
**Requirements**: PKG-03, PKG-04, PKG-05, REL-03
**Success Criteria** (what must be TRUE):
  1. Installing the candidate tarball outside any source checkout exposes `cumpa --version` as exactly `1.5.0` and preserves the existing Node.js 24+ and Git prerequisite guidance.
  2. The packed archive contains every compiled Node runtime and browser asset required to launch and complete the existing browser-review workflow.
  3. Archive inspection finds no TypeScript source, source maps or embedded source content, tests, fixtures, planning files, workflows, credentials, local review state, marketplace-skill files, Git data, or repository history.
  4. Maintainers record and approve one tarball digest, install and inspect those exact bytes, and designate the same immutable archive for publication without a later rebuild or substitution.
**Plans**: TBD

### Phase 5: Bootstrap & Trusted Stable Publication
**Goal**: Users can obtain the proprietary Cumpa CLI from public npm while maintainers publish stable releases from the approved public repository without long-lived npm credentials and record verified provenance outcomes.
**Depends on**: Phase 4
**Requirements**: PKG-01, PKG-02, REL-01, REL-02
**Success Criteria** (what must be TRUE):
  1. A complete, usable proprietary bootstrap release exists under a non-`latest` tag through short-lived interactive authorization, and that authorization is revoked before stable publication.
  2. The fixed release workflow in the approved public `Ship-With-AI/cumpa` repository publishes the reviewed `@shipwithai/cumpa@1.5.0` tarball through GitHub OIDC trusted publishing without long-lived publication credentials, preserves eligible automatic provenance, and records verified attestation results under the Phase 3 release policy.
  3. Public npm resolves exact `1.5.0` for both `npm install --global @shipwithai/cumpa@1.5.0` and `npx --yes @shipwithai/cumpa@1.5.0`, with the global install exposing the `cumpa` command.
**Plans**: TBD

### Phase 6: Independent MIT Marketplace Skill
**Goal**: Coding-agent users can install the public Cumpa skill as an independent MIT-licensed delegate to the separately installed released CLI.
**Depends on**: Phase 5
**Requirements**: SKL-01, SKL-02, SKL-03
**Success Criteria** (what must be TRUE):
  1. Coding-agent users can install the existing Cumpa skill from the public ShipWithAI marketplace, where the skill carries its own MIT license rather than the CLI's proprietary terms.
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
| 3. Distribution Contract & Legal Boundary | 0/TBD | Not started | - |
| 4. Exact Runtime Tarball | 0/TBD | Not started | - |
| 5. Bootstrap & Trusted Stable Publication | 0/TBD | Not started | - |
| 6. Independent MIT Marketplace Skill | 0/TBD | Not started | - |
| 7. Clean Public-Artifact Acceptance | 0/TBD | Not started | - |
