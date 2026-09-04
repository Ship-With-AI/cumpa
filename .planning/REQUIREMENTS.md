# Requirements: Cumpa

**Defined:** 2026-09-04
**Milestone:** v1.5 Public Distribution
**Core Value:** A developer can accurately review repository-grounded changes chosen by a developer or coding agent and return precise, drift-detectable feedback the agent can act on.

## v1.5 Requirements

### Package Access

- [ ] **PKG-01**: User can install public `@shipwithai/cumpa@1.5.0` globally and run the `cumpa` command.
- [ ] **PKG-02**: User can run `npx @shipwithai/cumpa@1.5.0` without a global installation.
- [ ] **PKG-03**: User can run `cumpa --version` and see the exact installed package version.
- [ ] **PKG-04**: User can find accurate Node.js 24+, Git, installation, update, uninstall, and troubleshooting guidance in public package documentation.
- [ ] **PKG-05**: Registry metadata accurately identifies Cumpa, ShipWithAI, its public documentation and support locations, executable, runtime requirements, and proprietary license.

### Source and Licensing

- [ ] **LIC-01**: Cumpa's source repository and history remain private while the compiled npm package is publicly installable.
- [ ] **LIC-02**: The npm package contains lawyer-approved proprietary terms granting installation and unmodified use while prohibiting modification, derivative works, redistribution, sublicensing, and resale.
- [ ] **LIC-03**: The public MIT-licensed marketplace skill contains only thin delegation instructions and no Cumpa application source or duplicate review implementation.

### Release Artifact

- [ ] **ART-01**: One configured build produces one inspected `.tgz` containing every CLI, browser, runtime, and required skill asset.
- [ ] **ART-02**: The published tarball excludes credentials, repository history, planning and development material, unrequired source files, and unauthorized hosted-service configuration.
- [ ] **ART-03**: Installation requires no consumer compiler or install-time native build; unsupported native targets retain the existing explicit JavaScript fallback behavior.
- [ ] **ART-04**: The release artifact contains only the approved canonical public support-service origin and no hosted-service secret.

### Trusted Publication

- [ ] **REL-01**: An approved immutable `v1.5.0` GitHub release, package version, commit, and tarball identify the same release.
- [ ] **REL-02**: GitHub Actions publishes through npm trusted publishing with short-lived OIDC credentials and no `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or equivalent long-lived publishing credential.
- [ ] **REL-03**: Private-source publication explicitly disables automatic provenance and makes no provenance claim.
- [ ] **REL-04**: The release workflow publishes the exact previously built, scanned, packed, and installed tarball without rebuilding during `npm publish`.
- [ ] **REL-05**: Release reruns detect an already-published identical immutable version; bad releases recover through deprecation, a corrected higher version, and deliberate dist-tag repair rather than overwrite.
- [ ] **REL-06**: Maintainers can verify the released registry integrity, metadata, executable, global installation, and scoped `npx` invocation from clean environments.

### ShipWithAI Marketplace

- [ ] **SKL-01**: Coding-agent users can install `shipwithai-cumpa@shipwithai` through the existing ShipWithAI marketplace.
- [ ] **SKL-02**: The marketplace listing clearly states that the proprietary `@shipwithai/cumpa` CLI is a separate prerequisite and provides its exact install command plus Node and Git requirements.
- [ ] **SKL-03**: The installed skill remains behaviorally identical to the canonical thin Cumpa skill and delegates all review authority to the released CLI.
- [ ] **SKL-04**: Skill metadata declares compatible CLI versions and gives users explicit marketplace refresh, plugin update, and CLI update guidance.
- [ ] **SKL-05**: A clean marketplace installation can launch the released CLI, complete one real browser review, and consume its validated canonical result.

## Deferred Requirements

None.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Bare npm package `cumpa` | It remains owned by an unrelated project; the approved package identity is `@shipwithai/cumpa`. |
| Public Cumpa source repository or Git history | The application remains private-source. |
| Open-source application or npm-package license | The approved application model is proprietary use of unmodified releases. |
| npm provenance | npm does not support provenance for packages published from private repositories; v1.5 retains OIDC trusted publishing without claiming provenance. |
| Marketplace-driven CLI installation | The public skill declares the separately installed proprietary CLI prerequisite rather than mutating global software. |
| Other registries, package managers, installers, or standalone binaries | v1.5 proves the npm and ShipWithAI paths only. |
| New native platform builds or consumer-side native compilation | Existing prebuilt capability and explicit JavaScript fallback remain authoritative. |
| Review, protocol, or hosted-support behavior changes | This milestone distributes the shipped product without redesigning it. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PKG-01 | Phase 7 | Pending |
| PKG-02 | Phase 7 | Pending |
| PKG-03 | Phase 4 | Pending |
| PKG-04 | Phase 4 | Pending |
| PKG-05 | Phase 4 | Pending |
| LIC-01 | Phase 3 | Pending |
| LIC-02 | Phase 3 | Pending |
| LIC-03 | Phase 6 | Pending |
| ART-01 | Phase 4 | Pending |
| ART-02 | Phase 4 | Pending |
| ART-03 | Phase 4 | Pending |
| ART-04 | Phase 4 | Pending |
| REL-01 | Phase 5 | Pending |
| REL-02 | Phase 5 | Pending |
| REL-03 | Phase 5 | Pending |
| REL-04 | Phase 5 | Pending |
| REL-05 | Phase 5 | Pending |
| REL-06 | Phase 7 | Pending |
| SKL-01 | Phase 6 | Pending |
| SKL-02 | Phase 6 | Pending |
| SKL-03 | Phase 6 | Pending |
| SKL-04 | Phase 6 | Pending |
| SKL-05 | Phase 7 | Pending |

**Coverage:**
- v1.5 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-09-04*
*Last updated: 2026-09-04 after v1.5 roadmap creation*
