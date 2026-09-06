# Roadmap: Cumpa

## Milestones

- **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- **[v1.2 Fast Source Discovery](./milestones/v1.2-ROADMAP.md)** — Phases 09–11, 4 plans, 5/5 requirements, shipped 2026-07-30.
- **[v1.3 Agent Review Handoff](./milestones/v1.3-ROADMAP.md)** — Phases 12–15, 14 plans, 42 tasks, 17/17 requirements, shipped 2026-08-06.
- **[v1.4 Voluntary Support](./milestones/v1.4-ROADMAP.md)** — Phases 01–02, 22 plans, 30 tasks, 12/12 requirements, shipped 2026-09-04.
- **v1.5 Private Distribution** — Phases 03–07, 19 requirements, planned.

## Overview

Private distribution proceeds through five dependency-ordered outcomes. Cumpa first fixes the legal, package, and disclosure boundaries for a proprietary compiled-runtime release while its repository, source, and history remain private. Maintainers then create and verify the exact runtime-only tarball before any registry mutation, perform the unavoidable usable non-`latest` bootstrap, and publish stable `1.5.0` through npm trusted publishing from the private repository without long-lived credentials. npm provenance is unavailable for this private-source release and is not claimed. The independently MIT-licensed ShipWithAI skill follows only after its separately installed CLI prerequisite exists. Clean global, npx, and marketplace acceptance against public artifacts closes the milestone without changing review or voluntary-support behavior.

## Phases

- [ ] **Phase 3: Distribution Contract & Legal Boundary** - Approve the proprietary package contract, truthful metadata, private-source boundary, and explicit no-provenance release position before publication.
- [ ] **Phase 4: Exact Runtime Tarball** - Produce one complete compiled-runtime-only tarball and verify those exact bytes before any npm release.
- [ ] **Phase 5: Bootstrap & Trusted Stable Publication** - Establish the package with a usable non-`latest` bootstrap, revoke temporary authorization, and publish stable `1.5.0` through OIDC.
- [ ] **Phase 6: Independent MIT Marketplace Skill** - Publish the thin MIT skill after the released proprietary CLI exists as its separate prerequisite.
- [ ] **Phase 7: Clean Public-Artifact Acceptance** - Prove global, npx, and marketplace workflows from clean environments using only released public artifacts.

## Phase Details

### Phase 3: Distribution Contract & Legal Boundary
**Goal**: Maintainers have an approved, truthful proprietary distribution contract that keeps all Cumpa development material private and permits safe package preparation.
**Depends on**: Phase 2 (v1.4 complete)
**Requirements**: PKG-06, PKG-07, REL-04, REL-05
**Success Criteria** (what must be TRUE):
  1. Public package documentation identifies Cumpa as proprietary, includes the approved proprietary terms and required third-party notices, and states that shipped compiled assets are publicly downloadable and inspectable without granting source rights.
  2. Approved npm metadata accurately names `@shipwithai/cumpa@1.5.0`, the `cumpa` executable, Node.js 24+ requirement, proprietary license file, private repository identity needed for trusted publishing, and only real public-facing links.
  3. Cumpa's GitHub repository, TypeScript source, development history, and private operational material remain private throughout package preparation and publication.
  4. Release records explicitly state that npm provenance is unavailable for the private-source repository and make no provenance or public-source claim.
**Plans**: TBD

### Phase 4: Exact Runtime Tarball
**Goal**: Maintainers hold one reviewed, immutable `.tgz` containing everything required to run Cumpa and none of its private development material.
**Depends on**: Phase 3
**Requirements**: PKG-03, PKG-04, PKG-05, REL-03
**Success Criteria** (what must be TRUE):
  1. Installing the candidate tarball outside the private checkout exposes `cumpa --version` as exactly `1.5.0` and preserves the existing Node.js 24+ and Git prerequisite guidance.
  2. The packed archive contains every compiled Node runtime and browser asset required to launch and complete the existing browser-review workflow.
  3. Archive inspection finds no TypeScript source, source maps or embedded source content, tests, fixtures, planning files, workflows, credentials, local review state, marketplace-skill files, Git data, or repository history.
  4. Maintainers record and approve one tarball digest, install and inspect those exact bytes, and designate the same immutable archive for publication without a later rebuild or substitution.
**Plans**: TBD

### Phase 5: Bootstrap & Trusted Stable Publication
**Goal**: Users can obtain the proprietary Cumpa CLI from public npm while maintainers publish stable releases from the private repository without long-lived npm credentials.
**Depends on**: Phase 4
**Requirements**: PKG-01, PKG-02, REL-01, REL-02
**Success Criteria** (what must be TRUE):
  1. A complete, usable proprietary bootstrap release exists under a non-`latest` tag through short-lived interactive authorization, and that authorization is revoked before stable publication.
  2. The fixed private-repository release workflow publishes the approved `@shipwithai/cumpa@1.5.0` tarball through npm trusted publishing with GitHub OIDC and no npm automation token or other long-lived publication credential.
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
**Goal**: Every supported public installation path completes the existing browser-review workflow from a clean environment without private or local release inputs.
**Depends on**: Phase 6
**Requirements**: ACC-01, ACC-02, ACC-03, ACC-04
**Success Criteria** (what must be TRUE):
  1. A clean environment globally installs exact public `@shipwithai/cumpa@1.5.0` and completes the existing browser-review workflow without a private checkout, workspace link, or local tarball.
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
