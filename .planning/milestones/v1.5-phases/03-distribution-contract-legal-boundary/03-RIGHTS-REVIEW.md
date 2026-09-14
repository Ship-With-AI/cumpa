# Initial Rights and Publication Review

**Record kind:** `cumpa.rights-review/v1`
**Collected:** 2026-09-07
**Status:** Initial local findings R-01/R-02/R-03 resolved by the operator's explicit 2026-09-07 statements below; both exact-license approvals and final publication gates remain pending.
**Not a clearance:** This record is an evidence inventory, not ownership certification, a legal opinion, final artifact acceptance, or permission to publish. No final license approval has been obtained.

## Audited boundary

- Local main/HEAD: `2cc86b144307284e43bfc7f6fa31eb8cc5e2433d`.
- Local remote-tracking `origin/main` and `origin/HEAD`: `7c9b22801378de313a7f2b9be7261eb17c4bb613`. These are local observations, not proof of the then-current GitHub ref set.
- Authenticated repository metadata independently confirmed the existing `Ship-With-AI/cumpa`, repository ID `1327753770`, node ID `R_kgDOTyPqKg`, still PRIVATE at execution preflight. No visibility or remote mutation was performed.
- Main refs: 844 reachable commits, 3,567 trees, 2,626 blobs; 7,037 objects total.
- Current tracked tree: 601 paths. Full historical path inventory: 991 paths, including 390 absent from the current tree; primary blob/path pairs: 2,917.
- Supplemental local reflog review: 12 additional commits, 31 trees, 10 blobs; 53 extra objects. It does not imply those reflog-only objects are exposed on GitHub.
- Combined exposure scan: 856 commit-message bodies, 2,636 blobs, 2,927 blob/path pairs, 36,635,357 blob bytes and 81,981 message-body bytes. All enumerated blobs were accessible UTF-8 text; no binary/archive/decode, symlink, submodule, LFS, shallow-history, replacement-ref or graft gap was observed.
- Current working-file scan covered 601 files and 7,145,617 bytes, with parent-owned STATE edits; the subsequently updated 69,933-byte notices file was also scanned. Future edits, commits, remote data and GitHub surfaces require the final Plan 03-03 review.

### Current path accounting

| Path class | Tracked paths |
|---|---:|
| `.claude/` | 1 |
| `.github/` | 1 |
| `root` | 13 |
| `.kimi-code/` | 8 |
| `.planning/` | 377 |
| `docs/` | 1 |
| `scripts/` | 8 |
| `src/` | 98 |
| `supabase/` | 15 |
| `tests/` | 79 |

Every path belongs to a listed class. Role does not establish copyright ownership. `THIRD_PARTY_NOTICES.md` is independent upstream material, not first-party Cumpa rights; the skill has a separate intended MIT distribution. Source/tests/Supabase/scripts/project documentation and generated planning/spike material are first-party-intended by role only, subject to R-01.

## Methods and evidence

- Parent native-Git inventory: `git for-each-ref`, `git rev-list --count --all`, `git ls-tree -r --name-only -z <baseline>`, merge-parent/root-aware `git log --all --root -m --no-renames --name-only -z`, and author/committer/trailer metadata collection without email output.
- Full license-related historical path inventory found `THIRD_PARTY_NOTICES.md` and two application Notice components, but no application LICENSE/COPYING path. Both historical application manifests (`package.json`, `services/support/package.json`) had no license-field changes under a full-history/root/merge-aware search.
- License/copyright-marker changes occurred in nine commits and sixteen paths: upstream notices and planning/research records, including the earlier GPL-readiness proposal. No source-code license header or adopted application grant was located by these searches. This is bounded evidence, not proof that no external agreement exists.
- Historical `.planning/phases/03-public-disclosure-and-gpl-readiness/03-RIGHTS-REVIEW.md` at commit `56c0f676ae46b2e1950d156734cb4fc58009bf6c` was explicitly blocked and described an intended, not installed, GPL application license. Its GPL proposal is superseded by the current source-available proprietary decision; it is not treated as an existing GPL grant or as clearance. Earlier or external actual grants, if any, remain unaffected and must be disclosed under R-01.
- The history scout performed current-file/provenance classification; its read-only tool set lacked native Git. Parent filled that limitation with the native inventories above rather than inferring historical facts from planning text.
- The independent exposure reviewer used native `cat-file --batch-check`/`--batch`, recursive tree parsing for path aliases, current tracked byte reads, existing repository detector policies, and supplemental lexical/contextual checks. No candidate secret values or private emails were emitted.

## First-party and generated-material authority

All 844 primary commits name Alessandro Magionami as author and committer; no coauthor trailer or other display-name contributor was found. This neither proves ownership nor contradicts the user identifying Alessandro Magionami and Manuel Salvatore Martone as the intended licensors. Non-Git, paired, generated or assigned contributions may not appear in Git metadata.

No assignment/ownership agreement was found among the inspected repository authority records. The earlier rights inventory was also unresolved. Fixture identities (including reserved test domains and generated benchmark identities) are not contributor evidence. Current source, scripts, Supabase, project docs and skill searches found no additional copied/adapted/vendor attribution headers outside notices; absence of markers is not proof of originality.

| ID | Subject | Disposition | Evidence/action required |
|---|---|---|---|
| R-01 | Authority over reviewed first-party and generated Cumpa material, including any employer/client/non-Git or AI-assisted contribution obligations | **resolved by attributable owner statement** | In response to `rights_authority`, the current operator selected “Named licensors control the rights”: Alessandro Magionami and Manuel Salvatore Martone have the necessary rights/permissions for the reviewed first-party material, including required employer/client/contributor permissions, with no undisclosed competing holder. Identified independent third-party materials remain excluded. This is a reported authority basis, not legal certification or Manuel's approval of the LICENSE. |

## Dependency and conveyed-material accounting

`package-lock.json` SHA-256: `8d7c101b80230a0107d665b2ac4d4e261c150f959a505abbb83fe8d3ec813010`. Its complete non-root `packages` object is the immutable per-location inventory: 254 locations, 253 unique fully named name/version pairs, 153 production/mixed and 101 dev-only locations. There are 63 optional and three dev-optional locations. Every location has license metadata. Names are taken from the declared name or the complete final `node_modules/` path segment, preserving scopes; an initial version-only unique count was corrected.

| Declared license metadata | Locations |
|---|---:|
| `(MPL-2.0 OR Apache-2.0)` | 1 |
| `0BSD` | 1 |
| `Apache-2.0` | 26 |
| `BlueOak-1.0.0` | 5 |
| `BSD-2-Clause` | 2 |
| `BSD-3-Clause` | 5 |
| `ISC` | 10 |
| `MIT` | 191 |
| `MPL-2.0` | 12 |
| `Python-2.0` | 1 |

Metadata is not a blanket compatibility determination or a replacement for actual upstream license text. Runtime/dev classification follows the lockfile flag and is not, alone, proof of copied bytes.

### Current evidence-supported notices

- Monaco Editor 0.55.1: own MIT grant plus the complete original upstream ThirdPartyNotices text, retained byte-for-byte. The upstream text includes independent Node path, MarkedJS, TypeScript/DefinitelyTyped, Unicode, W3C/DOM/background-sync/HTML, WebGL/Khronos, JS Beautifier, Ionic and vscode-swift material.
- Monaco-included DOMPurify 3.2.7: actual included source header and installed license checked; Apache-2.0 option elected, copyright retained, complete Apache-2.0 text present. Monaco-included Marked 14.0.0 retains its existing upstream notice.
- Vue 3.5.39 runtime family: verified identical MIT grants grouped without dropping attribution.
- Markdown-It 14.3.0 and source-reachable linkify-it 5.0.2, mdurl 2.0.0, punycode.js 2.3.1, uc.micro 2.1.0 and nested entities 4.5.0: actual license text/copyright accounted for. Native Node resolution confirmed Markdown-It uses its nested 4.5.0, not the root entities 7.0.1. Both entities license files have the identical SHA-256 `cb992345949ccd6e8394b2cd6c465f7b897c864f845937dbf64e8997f389e164`, so one BSD-2-Clause text covers both identified versions. MDURL's full Node copyright line and the corresponding permission/disclaimer are retained.
- Zod 4.4.3 and the direct Node roots were checked against installed license files; Zod attribution is retained. Other Node dependency code is installed separately by npm, not proven copied into the source tree or Node build merely by its presence. Argparse is reached by Markdown-It's CLI, not its traced browser entry.
- Native exchange source/build relationship was inspected; its generated local binary and the web `dist/` output are untracked build products, not checked-in source or final release evidence.
- Vite/build tools can influence output; no conclusion that all dev tools are non-conveyed or that final output is fully mapped is made here. Phase 4 must inspect actual emitted bytes.

Current `THIRD_PARTY_NOTICES.md` SHA-256: `847c9cb7c9e3585ed7ae518208ac934c5658f0fdb01ad2f2a20b50f56015d143` (70,226 bytes). Parent independently verified that it contains the complete upstream Monaco notice byte sequence with SHA-256 `790537262fc78a764e121e6b92b959bcd3f5c310b47d9d9b9e92e17fe0af5336`. Required old grants are preserved; no Cumpa application license is inferred from them.

## Sensitive-material findings

| ID | Finding | Disposition |
|---|---|---|
| SENSITIVE-02 | Credential-shaped, credential-URL, assignment, encoded and entropy candidates examined in context | **not-applicable to confirmed live-credential exposure in this scope**: observed values were synthetic fixtures, local test inputs, symbolic policy references or false positives. No confirmed live credential, private key or JWT was detected. This is not a guarantee against unrecognized secrets. |
| SENSITIVE-03 | One deployed Supabase routing value appears only as complete canonical URLs | **resolved for the routing-value category only** under the existing operations policy; zero bare occurrences of that deployed reference were found. No general operational-data disclosure approval is implied. |
| R-02 / SENSITIVE-01 | Own non-noreply Git identity email and developer-specific home paths; retained public npm-maintainer metadata quotations | **accepted-public for the reviewed scope**: in response to `personal_metadata`, the operator selected “Retain reviewed metadata”, accepting the identified Git email/home-path history and sourced public npm-maintainer metadata. This is not a global allowlist for new private data. No raw value is repeated here. |
| R-03 | Retained non-Cumpa/TrustLayer-CWT debugging context and historical references | **accepted-public for the reviewed locations**: in response to `non_cumpa_context`, the operator selected “Authorized to retain”, confirming authority to disclose the exact reviewed repository/branch/OID context at the current and historical locations below. This neither authorizes new unrelated disclosures nor changes repository visibility. |

**Disposition source:** The operator's actual answers to the three named questions in this execution session on 2026-09-07. All three were explicit selections after the findings, locations and scope were presented. No deletion or history rewriting was selected or performed. These dispositions do not replace either licensor's exact-text approval or the separate Plan 03-03 private-preparation/final-publication authorizations.

R-02 scope: one distinct non-noreply address in the author/committer metadata of the 856 primary-plus-supplemental examined commits (1,712 occurrences). One developer-specific home-path value appears 266 times in 105 current files and 881 times in 230 primary historical blobs. Source examples include `.planning/debug/empty-branch-comparison.md:69` and historical blob `1f671da1c75293bd4fe6720ea2091b91e8d2300c`. Public npm-maintainer metadata was identified in `.planning/milestones/v1.4-phases/02-move-the-implementation-to-supabase/02-01-SUMMARY.md:93-105`; no customer email dataset was identified. The privacy disposition must distinguish necessary public-package attribution from private identifying/context data.

### R-03 current location inventory

Only locations are listed; matching text, unrelated repository OIDs and other project values are not reproduced.

| Current path | Lines |
|---|---|
| `.planning/debug/empty-branch-comparison.md` | 29, 32, 69, 84 |
| `.planning/debug/knowledge-base.md` | 11, 13, 14 |
| `.planning/debug/resolved/cwt-slow-picker-startup.md` | 3, 31, 32, 34, 39, 40, 56, 67, 68, 69, 72, 79, 107, 108, 137, 142, 143, 144, 147, 162, 167, 172, 173, 178, 180 |
| `.planning/debug/resolved/next-file-sidebar-highlight.md` | 64 |

Historical changes also include the deleted earlier GPL-readiness planning/research/rights records. The complete identified historical paths are:
- `.planning/debug/empty-branch-comparison.md`
- `.planning/debug/knowledge-base.md`
- `.planning/debug/resolved/cwt-slow-picker-startup.md`
- `.planning/debug/resolved/next-file-sidebar-highlight.md`
- `.planning/phases/03-public-disclosure-and-gpl-readiness/03-01-PLAN.md`
- `.planning/phases/03-public-disclosure-and-gpl-readiness/03-RESEARCH.md`
- `.planning/phases/03-public-disclosure-and-gpl-readiness/03-RIGHTS-REVIEW.md`

The location-only history query was root/merge-parent aware. Evidence-bearing Cumpa history commits include `d14bbb851097e7c3b31f358e0616473f7fd3a03b`, `45976b10b33664a23bf449dc449ab4f962267ab5`, `6847b063048832be9e63df3cbeb98a941a6c2793`, and the blocked earlier rights record at `56c0f676ae46b2e1950d156734cb4fc58009bf6c`. These are pointers into Cumpa history, not the unrelated private repository values. Removal at HEAD would not remove historical exposure.

## Later-phase gates — not circular Phase 3 prerequisites

The following are retained blockers for the relevant later publication surface, not false claims that Phase 4/Plan 03-03 work has already run:

- Plan 03-03: actual remote refs and GitHub-visible non-Git data, complete final deltas, protection disposition, scoped authentication, private preparation and final publication authorization. Initial local/reflected history cannot clear them.
- Phase 4: current no-scripts dry-run has 143 files and zero THIRD_PARTY_NOTICES.md entries; the publishable runtime-only tarball must include applicable notices. Keep private:true and the existing allowlist until that cutover; no package has been published.
- Phase 4: map every final browser worker/font/other emitted material and any remaining copied dependency to actual grants/notices; verify the final native binary, architecture and toolchain provenance. Current generated dist and lock metadata are not the immutable final artifact.
- Phase 5: exact tarball, registry availability, OIDC and actual provenance/attestation evidence.

These future gates do not require an impossible final tarball before its prerequisite legal phase. They cannot be waived or relabeled as completed by this inventory. R-01/R-02/R-03 now have the explicit dispositions above; both exact-text approvals and the later publication-surface gates remain actual blockers.

## Review limitations and authorization state

The exposure audit covered every enumerated local/ref/reflog blob and message using bounded lexical/contextual checks, not a legal or line-by-line human confidentiality certification. Unreachable objects outside those scopes and live GitHub/provider surfaces were not examined. No candidate secret values or raw temporary payload files were created; audit processes completed. No provider access, revocation, history rewriting, deletion, push, visibility change, package install/build/publication or approval action was performed.

The operator supplied explicit R-01/R-02/R-03 dispositions for the reviewed scope. Do not create 03-LICENSE-APPROVAL.md or start Plan 03-02 until both named licensors have separately approved the exact full LICENSE and its GitHub D.4/D.5/D.8 disclosure. Drafting is not adoption. Final Plan 03-03 must refresh findings and renew affected approvals after later changes; these initial dispositions are not final visibility authorization. This record has no self-hash; downstream approval records bind its exact final bytes.
