# Requirements: Cumpa

**Defined:** 2026-09-06
**Core Value:** A developer can accurately review repository-grounded changes chosen by a developer or coding agent and return precise, drift-detectable feedback an agent can act on.

## v1.5 Requirements

### Proprietary npm Package

- [ ] **PKG-01**: Users can globally install public `@shipwithai/cumpa@1.5.0` and run the `cumpa` command.
- [ ] **PKG-02**: Users can run `npx --yes @shipwithai/cumpa@1.5.0` without a prior global installation.
- [ ] **PKG-03**: Users running `cumpa --version` see exactly `1.5.0` and receive the existing Node.js 24+ and Git prerequisite guidance.
- [ ] **PKG-04**: Users receive every compiled Node and browser asset required to complete the existing review workflow from the installed package.
- [ ] **PKG-05**: Public package contents exclude TypeScript source, source maps or embedded source content, tests, fixtures, planning files, workflows, credentials, local review state, marketplace-skill files, and Git repository data or history.
- [ ] **PKG-06**: Package metadata and public documentation identify the application as proprietary, include approved proprietary license terms and required third-party notices, and accurately state that included compiled assets remain publicly downloadable and inspectable.
- [ ] **PKG-07**: Cumpa's GitHub repository, development source, and history remain private throughout packaging and publication.

### Trusted Publication

- [ ] **REL-01**: Maintainers can create the npm package through one usable, proprietary, non-`latest` bootstrap release using short-lived interactive authorization, then revoke that authorization before stable publication.
- [ ] **REL-02**: Maintainers can publish `@shipwithai/cumpa@1.5.0` from the exact private GitHub repository and fixed release workflow through npm trusted publishing without an npm automation token or another long-lived publication credential.
- [ ] **REL-03**: Maintainers inspect, install, and publish the same immutable `.tgz` bytes so publication cannot rebuild or substitute an unreviewed archive.
- [ ] **REL-04**: Public npm metadata accurately identifies the scoped package, version, executable, Node requirement, proprietary license file, private repository identity required by trusted publishing, and only real public-facing links.
- [ ] **REL-05**: Release records explicitly state that npm provenance is unavailable for private-source repositories and make no provenance or public-source claim.

### Public Marketplace Skill

- [ ] **SKL-01**: Coding-agent users can install the existing Cumpa skill from the public ShipWithAI marketplace as an independently MIT-licensed plugin.
- [ ] **SKL-02**: The installed skill checks for the separately installed `cumpa` executable and, when absent, stops with the exact npm installation command and Node.js/Git prerequisites.
- [ ] **SKL-03**: The installed skill delegates Git grounding, diff generation, browser review, persistence, Finish semantics, and canonical review output to the released Cumpa CLI without duplicating application behavior.

### Released-Artifact Acceptance

- [ ] **ACC-01**: A clean environment can install `@shipwithai/cumpa@1.5.0` globally and complete the existing browser-review workflow without using the private checkout, a workspace link, or a local tarball.
- [ ] **ACC-02**: A clean environment with an empty npm cache can run `npx --yes @shipwithai/cumpa@1.5.0` and complete the existing browser-review workflow without a prior or local installation.
- [ ] **ACC-03**: A clean agent profile can install the public marketplace skill, invoke the separately installed `@shipwithai/cumpa@1.5.0` CLI, finish a browser review, and receive its validated canonical result.
- [ ] **ACC-04**: All released installation paths preserve unrestricted review and export behavior regardless of voluntary-support payment state.

## Future Requirements

### Distribution Assurance

- **DIST-01**: npm provenance is enabled if and only if npm documents support for public packages built from private source repositories without exposing Cumpa's repository or history.
- **DIST-02**: Users receive independently versioned update and uninstall guidance for both the npm CLI and marketplace plugin.
- **DIST-03**: Release evidence binds a protected source tag, reviewed package digest, npm integrity, and marketplace version in one immutable release record.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public Cumpa repository, history, or source mirror | Violates the defining private-source constraint. |
| Open-source license for the Cumpa application package | The public npm package is proprietary; only the thin marketplace skill is MIT-licensed. |
| npm provenance while the source repository is private | npm currently does not support provenance for private-source repositories; trusted OIDC publication remains supported. |
| TypeScript source, source maps, tests, fixtures, planning files, workflows, or Git data in npm artifacts | Consumers need the compiled runtime, not private development material. |
| Obfuscation, DRM, activation, or license-server enforcement | Public compiled assets remain inspectable; access gating was not requested and would change the product. |
| Bundling or automatically installing the CLI through the skill | CLI and skill have separate licenses, authorities, and installation lifecycles. |
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
*Last updated: 2026-09-06 after replacing v1.5 Public Distribution with Private Distribution*
