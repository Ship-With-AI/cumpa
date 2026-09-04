# Roadmap: Cumpa

## Milestones

- **[v1.0 MVP](./milestones/v1.0-ROADMAP.md)** — Phases 01–04.1, 40 plans, shipped 2026-07-24.
- **[v1.1 GitHub Dark Diff](./milestones/v1.1-ROADMAP.md)** — Phases 05–08, 16 plans, 18/18 requirements, shipped 2026-07-29.
- **[v1.2 Fast Source Discovery](./milestones/v1.2-ROADMAP.md)** — Phases 09–11, 4 plans, 5/5 requirements, shipped 2026-07-30.
- **[v1.3 Agent Review Handoff](./milestones/v1.3-ROADMAP.md)** — Phases 12–15, 14 plans, 42 tasks, 17/17 requirements, shipped 2026-08-06.
- **[v1.4 Voluntary Support](./milestones/v1.4-ROADMAP.md)** — Phases 01–02, 22 plans, 30 tasks, 12/12 requirements, shipped 2026-09-04.
- **v1.5 Public Distribution** — Phases 03–07, 23 requirements, planned.

## Overview

Public distribution proceeds through five dependency-ordered outcomes: approve the private-source proprietary application boundary, construct one installable release candidate, publish those exact bytes through tokenless trusted publishing with provenance disabled, publish only the thin MIT-licensed marketplace skill, then verify both real public installation paths end to end. The approved package is `@shipwithai/cumpa@1.5.0`; acquiring the unrelated bare `cumpa` package and publishing the application source are outside this roadmap.

## Phases

- [ ] **Phase 3: Approved Distribution Boundary** - Establish the legal and private-source boundary required before constructing public artifacts.
- [ ] **Phase 4: Installable Release Candidate** - Produce one inspected proprietary npm tarball with complete runtime assets, metadata, documentation, and safe contents.
- [ ] **Phase 5: Immutable npm Release** - Publish the exact approved tarball as `@shipwithai/cumpa@1.5.0` through OIDC without long-lived credentials or provenance.
- [ ] **Phase 6: Public Agent Skill** - Publish the canonical thin Cumpa skill through ShipWithAI under the existing MIT license.
- [ ] **Phase 7: End-to-End Public Acceptance** - Prove clean users can install and use the released CLI directly and through the marketplace skill.

## Phase Details

### Phase 3: Approved Distribution Boundary
**Goal**: Public distribution is legally approved without exposing Cumpa's private application source or repository history.
**Depends on**: Phase 2 (v1.4 complete)
**Requirements**: LIC-01, LIC-02
**Success Criteria** (what must be TRUE):
  1. Maintainers can verify that the exact proprietary terms have lawyer approval and permit installation and unmodified use while prohibiting modification, derivative works, redistribution, sublicensing, and resale.
  2. The compiled application can be prepared for public npm distribution while its source repository and history remain private.
**Plans**: TBD

### Phase 4: Installable Release Candidate
**Goal**: Maintainers have one inspected `@shipwithai/cumpa@1.5.0` tarball that installs and runs as the complete approved application.
**Depends on**: Phase 3
**Requirements**: PKG-03, PKG-04, PKG-05, ART-01, ART-02, ART-03, ART-04
**Success Criteria** (what must be TRUE):
  1. Installing the single configured-build tarball exposes `cumpa`, reports version `1.5.0`, and includes every required CLI, browser, runtime, and skill asset.
  2. Package documentation gives accurate Node.js 24+, Git, install, update, uninstall, and troubleshooting guidance, while registry metadata identifies Cumpa, ShipWithAI, support locations, executable, runtime, and proprietary license.
  3. Inspection shows the tarball contains no credentials, repository history, planning or development material, unrequired source, unauthorized hosted-service configuration, or hosted-service secret; it contains only the approved canonical public support origin.
  4. A consumer can install and run the tarball without a compiler or install-time native build, and unsupported native targets retain the existing explicit JavaScript fallback behavior.
**Plans**: TBD

### Phase 5: Immutable npm Release
**Goal**: The exact inspected candidate is published as an immutable approved npm release through short-lived GitHub OIDC credentials.
**Depends on**: Phase 4
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05
**Success Criteria** (what must be TRUE):
  1. Maintainers can identify one immutable `v1.5.0` GitHub release, package version, commit, and tarball as the same approved release.
  2. GitHub Actions publishes the previously built, scanned, packed, and installed tarball without rebuilding and without any long-lived npm publishing credential.
  3. Publication from the private source repository explicitly disables or omits npm provenance and makes no provenance claim.
  4. Re-running the release recognizes an already-published identical immutable version, while a bad release is recoverable only through deprecation, a corrected higher version, or deliberate dist-tag repair.
**Plans**: TBD

### Phase 6: Public Agent Skill
**Goal**: Coding-agent users can install the canonical thin Cumpa integration from ShipWithAI without publishing or duplicating the proprietary application.
**Depends on**: Phase 5
**Requirements**: LIC-03, SKL-01, SKL-02, SKL-03, SKL-04
**Success Criteria** (what must be TRUE):
  1. Coding-agent users can install `shipwithai-cumpa@shipwithai` through the existing ShipWithAI marketplace.
  2. The listing identifies the proprietary `@shipwithai/cumpa` CLI as a separate prerequisite and gives its exact install command plus Node.js and Git requirements.
  3. The installed skill remains behaviorally identical to the canonical thin skill, delegates all review authority to the released CLI, and contains no Cumpa application source or duplicate review implementation.
  4. The public skill remains under ShipWithAI's existing MIT license and tells users which CLI versions are compatible and how to refresh the marketplace, update the plugin, and update the CLI.
**Plans**: TBD

### Phase 7: End-to-End Public Acceptance
**Goal**: Real public registry and marketplace paths demonstrably deliver a working Cumpa review from installation through validated canonical feedback.
**Depends on**: Phase 6
**Requirements**: PKG-01, PKG-02, REL-06, SKL-05
**Success Criteria** (what must be TRUE):
  1. A clean user can globally install public `@shipwithai/cumpa@1.5.0` and run the resulting `cumpa` command.
  2. A clean user can run `npx @shipwithai/cumpa@1.5.0` without a global installation.
  3. Maintainers can verify registry integrity, metadata, executable behavior, global installation, and scoped `npx` invocation against the released bytes in clean environments.
  4. A clean marketplace installation can launch the released CLI, complete one real browser review, and consume its validated canonical result.
**Plans**: TBD

## Progress

**Execution Order:** Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 3. Approved Distribution Boundary | 0/TBD | Not started | - |
| 4. Installable Release Candidate | 0/TBD | Not started | - |
| 5. Immutable npm Release | 0/TBD | Not started | - |
| 6. Public Agent Skill | 0/TBD | Not started | - |
| 7. End-to-End Public Acceptance | 0/TBD | Not started | - |
