# Requirements: Cumpa

**Defined:** 2026-09-06
**Core Value:** A developer can accurately review repository-grounded changes chosen by a developer or coding agent and return precise, drift-detectable feedback an agent can act on.

## v1.5 Requirements
**Decision authority:** 2026-09-08 quick task `260908-d25` supersedes the 2026-09-07 proprietary direction. Historical proprietary approvals do not approve the MIT text; publication remains pending refreshed exact-text assent from both licensors and exposure review.


### MIT npm Package

- [ ] **PKG-01**: Users can globally install public `@shipwithai/cumpa@1.5.0` and run the `cumpa` command.
- [ ] **PKG-02**: Users can run `npx --yes @shipwithai/cumpa@1.5.0` without a prior global installation.
- [ ] **PKG-03**: Users running `cumpa --version` see exactly `1.5.0` and receive the existing Node.js 24+ and Git prerequisite guidance.
- [ ] **PKG-04**: Users receive every compiled Node and browser asset required to complete the existing review workflow from the installed package.
- [ ] **PKG-05**: Public package contents exclude TypeScript source, source maps or embedded source content, tests, fixtures, planning files, workflows, credentials, local review state, marketplace-skill files, and Git repository data or history.
- [ ] **PKG-06**: Package metadata and public documentation identify Cumpa source and compiled releases as standard MIT-licensed, include the exact MIT text with Alessandro Magionami & Manuel Salvatore Martone copyright and required third-party notices, and explain that commercial use, modification, redistribution, sublicensing, and resale are permitted while third-party rights remain.
- [ ] **PKG-07**: The existing `Ship-With-AI/cumpa` repository, source, and reviewed Git history become public only after both licensors give refreshed exact-text MIT assent and rights/sensitive-material review is resolved; credentials and confidential operational material are not exposed, and destructive remediation or history rewriting requires separate approval.

### Trusted Publication

- [ ] **REL-01**: Maintainers can create the npm package through one usable, MIT-licensed, non-`latest` bootstrap release using short-lived interactive authorization, then revoke that authorization before stable publication.
- [ ] **REL-02**: Maintainers can publish `@shipwithai/cumpa@1.5.0` from the exact approved public `Ship-With-AI/cumpa` repository and fixed release workflow through npm trusted publishing without an npm automation token or another long-lived publication credential.
- [ ] **REL-03**: Maintainers inspect, install, and publish the same immutable `.tgz` bytes so publication cannot rebuild or substitute an unreviewed archive.
- [ ] **REL-04**: Public npm metadata accurately identifies the scoped package, version, executable, Node requirement, MIT license file, and exact `Ship-With-AI/cumpa` repository identity; the self-contained user README links to its verified public Issues page and omits a separate homepage or invented contact channel.
- [ ] **REL-05**: Maintainers have a documented public-source provenance policy that preserves eligible automatic npm provenance, defines the release evidence needed to verify actual attestations, and permits only evidence-backed public-source and provenance claims. The publication phase records the actual result rather than treating OIDC authentication as attestation proof.

### Public Marketplace Skill

- [ ] **SKL-01**: Coding-agent users can install the existing Cumpa skill from the public ShipWithAI marketplace as an independently MIT-licensed plugin.
- [ ] **SKL-02**: The installed skill checks for the separately installed `cumpa` executable and, when absent, stops with the exact npm installation command and Node.js/Git prerequisites.
- [ ] **SKL-03**: The installed skill delegates Git grounding, diff generation, browser review, persistence, Finish semantics, and canonical review output to the released Cumpa CLI without duplicating application behavior.

### Released-Artifact Acceptance

- [ ] **ACC-01**: A clean environment can install `@shipwithai/cumpa@1.5.0` globally and complete the existing browser-review workflow without using a source checkout, a workspace link, or a local tarball.
- [ ] **ACC-02**: A clean environment with an empty npm cache can run `npx --yes @shipwithai/cumpa@1.5.0` and complete the existing browser-review workflow without a prior or local installation.
- [ ] **ACC-03**: A clean agent profile can install the public marketplace skill, invoke the separately installed `@shipwithai/cumpa@1.5.0` CLI, finish a browser review, and receive its validated canonical result.
- [ ] **ACC-04**: All released installation paths preserve unrestricted review and export behavior regardless of voluntary-support payment state.

## Future Requirements

### Distribution Assurance

- **DIST-01**: Superseded by REL-05 after the approved public-source decision; provenance is no longer deferred behind a private-source-only eligibility trigger.
- **DIST-02**: Users receive independently versioned update and uninstall guidance for both the npm CLI and marketplace plugin.
- **DIST-03**: Release evidence binds a protected source tag, reviewed package digest, npm integrity, and marketplace version in one immutable release record.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Unreviewed repository/history publication or destructive remediation without approval | Public source is authorized only after both licensors' approval and rights/sensitive-material review; deleting at HEAD does not remove historical exposure. |
| Unsupported or unverified provenance claims | Preserve eligible automatic provenance, but claim only the attestation and source facts established by actual release evidence. |
| TypeScript source, source maps, tests, fixtures, planning files, workflows, or Git data in npm artifacts | MIT licensing does not change the compiled-runtime-only npm contract. |
| Obfuscation, DRM, activation, or license-server enforcement | Public compiled assets remain inspectable; access gating was not requested and would change the product. |
| Bundling or automatically installing the CLI through the skill | CLI and skill have separate installation lifecycles. |
| New review behavior or protocol redesign | Existing review and agent handoff behavior is already validated; this milestone distributes it unchanged. |
| Payment-gated review features | Voluntary support remains feature-neutral. |

## Traceability

Each active requirement maps to exactly one roadmap phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PKG-01 | Phase 5 | Pending |
| PKG-02 | Phase 5 | Pending |
| PKG-03 | Phase 4 | Pending |
| PKG-04 | Phase 4 | Pending |
| PKG-05 | Phase 4 | Pending |
| PKG-06 | Phase 3 | Pending |
| PKG-07 | Phase 3 | Pending |
| REL-01 | Phase 5 | Pending |
| REL-02 | Phase 5 | Pending |
| REL-03 | Phase 4 | Pending |
| REL-04 | Phase 3 | Pending |
| REL-05 | Phase 3 | Pending |
| SKL-01 | Phase 6 | Pending |
| SKL-02 | Phase 6 | Pending |
| SKL-03 | Phase 6 | Pending |
| ACC-01 | Phase 7 | Pending |
| ACC-02 | Phase 7 | Pending |
| ACC-03 | Phase 7 | Pending |
| ACC-04 | Phase 7 | Pending |

**Coverage:**
- v1.5 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-09-06*
*Last updated: 2026-09-08 after quick task 260908-d25 superseded the 2026-09-07 proprietary source-available distribution direction with MIT Distribution; 19 active requirement IDs and phase assignments preserved*
