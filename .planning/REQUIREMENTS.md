# Requirements: Cumpa

**Defined:** 2026-09-05
**Milestone:** v1.5 Public Distribution
**Core Value:** A developer can accurately review repository-grounded changes chosen by a developer or coding agent and return precise, drift-detectable feedback the agent can act on.

## v1.5 Requirements

### Public Source and Licensing

- [ ] **SRC-01**: The existing `Ship-With-AI/cumpa` repository and its complete intended history are publicly accessible in place.
- [ ] **SRC-02**: Public visibility remains blocked until all intended refs, history, Actions logs and artifacts, releases, attachments, and LFS objects pass a credential, secret, and private-data review, with exposed credentials revoked or rotated first.
- [ ] **LIC-01**: Cumpa application source and npm releases consistently declare `GPL-3.0-or-later` and include the complete GPLv3 license text.
- [ ] **LIC-02**: Each compiled npm release links to exact Corresponding Source containing the lockfile, build and install scripts, license material, and required third-party notices.
- [ ] **LIC-03**: Maintainers verify authority to license first-party contributions and resolve incompatible or unknown third-party and generated material before publication.

### Public CLI Package

- [ ] **PKG-01**: Users can globally install public `@shipwithai/cumpa@1.5.0` and run `cumpa`.
- [ ] **PKG-02**: Users can run `npx @shipwithai/cumpa@1.5.0` without a global installation.
- [ ] **PKG-03**: Users can run `cumpa --version` and see exactly `1.5.0`.
- [ ] **PKG-04**: Public documentation covers Node.js 24+, Git, installation, update, uninstall, troubleshooting, support, and security reporting.
- [ ] **PKG-05**: npm metadata accurately identifies Cumpa, ShipWithAI, GPL-3.0-or-later, its public source repository, documentation and support locations, executable, and runtime requirements.
- [ ] **PKG-06**: The npm package contains the complete runnable application and GPL and third-party notices but excludes the independently MIT-licensed marketplace skill.

### Trusted Publication

- [ ] **REL-01**: Maintainers establish the previously unused `@shipwithai/cumpa` package through a harmless non-`latest` bootstrap release and immediately revoke the temporary publishing credential.
- [ ] **REL-02**: GitHub Actions publishes `1.5.0` from the public repository through npm trusted publishing with provenance and without `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or another long-lived credential.

### ShipWithAI Marketplace

- [ ] **SKL-01**: Coding-agent users can install `shipwithai-cumpa@shipwithai` through the existing ShipWithAI marketplace.
- [ ] **SKL-02**: The marketplace listing states that the GPL `@shipwithai/cumpa` CLI is a separate prerequisite and provides its exact install command plus Node.js and Git requirements.
- [ ] **SKL-03**: The installed MIT-licensed skill remains behaviorally identical to the canonical thin Cumpa skill and delegates all review authority to the released CLI.
- [ ] **SKL-04**: Skill metadata declares compatible CLI versions and documents marketplace refresh, plugin update, and CLI update paths.

### Clean Public Acceptance

- [ ] **ACC-01**: A clean environment can globally install `@shipwithai/cumpa@1.5.0` and run the resulting `cumpa` command.
- [ ] **ACC-02**: A clean empty-cache environment can invoke exact-version `npx @shipwithai/cumpa@1.5.0` without a global installation.
- [ ] **ACC-03**: A clean marketplace installation can launch the released CLI, complete one browser review, and consume its validated canonical result.

## Deferred Requirements

### Community

- **GOV-01**: Public contributors receive contribution, conduct, governance, and issue-template guidance beyond essential installation, support, and security documentation.

### Release Hardening

- **ART-01**: One build produces one inspected tarball whose exact bytes are reused across GitHub and npm release records.
- **ART-02**: Installation explicitly guarantees no consumer compiler or install-time native build while retaining the JavaScript fallback on unsupported native targets.
- **REL-03**: A protected tag, reviewed commit, tarball checksum, GitHub release asset, npm integrity, and provenance identify the same immutable release bytes.
- **REL-04**: Release reruns verify identical publication state, and bad releases recover through deprecation, corrected higher versions, and deliberate dist-tag repair.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bare npm package `cumpa` | It remains owned by an unrelated project; the approved package identity is `@shipwithai/cumpa`. |
| Private application source, clean-room mirror, or squashed public history | v1.5 publishes the current repository and complete intended history in place. |
| Proprietary application licensing | Cumpa application source and npm releases use GPL-3.0-or-later. |
| Marketplace-driven CLI installation | The MIT skill declares the separately installed GPL CLI prerequisite rather than mutating global software. |
| Other registries, package managers, installers, or standalone binaries | v1.5 proves the npm and ShipWithAI paths only. |
| Additional agent marketplaces or automatic update behavior | Defer until real demand exists. |
| Review, protocol, or hosted-support behavior changes | This milestone distributes the shipped product without redesigning it. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRC-01 | Phase 4 | Pending |
| SRC-02 | Phase 3 | Pending |
| LIC-01 | Phase 3 | Pending |
| LIC-02 | Phase 5 | Pending |
| LIC-03 | Phase 3 | Pending |
| PKG-01 | Phase 7 | Pending |
| PKG-02 | Phase 7 | Pending |
| PKG-03 | Phase 4 | Pending |
| PKG-04 | Phase 4 | Pending |
| PKG-05 | Phase 5 | Pending |
| PKG-06 | Phase 4 | Pending |
| REL-01 | Phase 4 | Pending |
| REL-02 | Phase 5 | Pending |
| SKL-01 | Phase 6 | Pending |
| SKL-02 | Phase 6 | Pending |
| SKL-03 | Phase 6 | Pending |
| SKL-04 | Phase 6 | Pending |
| ACC-01 | Phase 7 | Pending |
| ACC-02 | Phase 7 | Pending |
| ACC-03 | Phase 7 | Pending |

**Coverage:**
- v1.5 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-09-05*
*Last updated: 2026-09-05 after v1.5 roadmap mapping*
