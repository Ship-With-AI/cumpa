# Phase 5 CI Candidate Approval — CANDIDATE BYTES ONLY

**Record kind:** `cumpa.ci-candidate-approval/v1`
**Status:** `candidate-approved`
**Approver:** Alessandro Magionami, direct current-chat assent
**Recorded and independently revalidated at:** `2026-09-10T14:55:40Z`
**Stable publication authorized:** `false`

## Verbatim assent

The user's original line wrapping is preserved below. Only whitespace was normalized when comparing the statement with the complete requested identity; no value or permission was substituted.

```text
CI CANDIDATE APPROVED: @shipwithai/cumpa@1.5.0 sha256 dc8f792920833415d309015d5f4c31501016e9a4a6cc945bb69dde2453137141 bytes 3514800; evidence sha256
b7fe676a35c40cbd03a8d73bbb7bc83c5a4893d6aa7d01d1ab60799af3ff1091; source fcc12be291623c37211291681420fe0203df6cb0; run 34490078365 attempt 1; artifact
10157421286 digest b6af207adbe4a0f1b1873a0e284986d0e4dc86ee163dbb388a3f6685578ea2d9; limitations acknowledged; stable publication not authorized
```

## Exact approved identity

| Binding | Value |
|---|---|
| Package | `@shipwithai/cumpa@1.5.0` |
| Archive basename | `shipwithai-cumpa-1.5.0.tgz` |
| Archive byte length | `3514800` |
| Archive SHA-256 | `dc8f792920833415d309015d5f4c31501016e9a4a6cc945bb69dde2453137141` |
| npm SHA-1 | `2d58866c862283f2c41b3f4f7d51282b2ca96472` |
| npm SHA-512 SRI | `sha512-gUBrMYwL8u75k1JX1OxO2dwfUsjQGHAqPUjh8e5Ep6gVs52wwEZFwkl49fBU2eggU9S7J1r27SCa8W1X/iHn5g==` |
| Sealed evidence SHA-256 | `b7fe676a35c40cbd03a8d73bbb7bc83c5a4893d6aa7d01d1ab60799af3ff1091` |
| GitHub repository / ID | `Ship-With-AI/cumpa` / `1327753770` |
| Source SHA | `fcc12be291623c37211291681420fe0203df6cb0` |
| Source tree | `23f87114ad2ddbc18c51f95e2611ef5b4f1e9f9c` |
| Workflow ref | `Ship-With-AI/cumpa/.github/workflows/publish-npm.yml@refs/heads/main` |
| Run / attempt | `34490078365` / `1` |
| Candidate job | `102914227367` |
| Native artifact ID | `10157421286` |
| Artifact name | `cumpa-stable-candidate-34490078365-1` |
| Artifact transport SHA-256 | `b6af207adbe4a0f1b1873a0e284986d0e4dc86ee163dbb388a3f6685578ea2d9` |
| Artifact transport bytes | `3520829` |
| Custody | Operation-owned read-only candidate payload; private location omitted |

Native artifact metadata supplies the transport identity. Inner archive/evidence identities were independently calculated from the exact downloaded artifact, not invented as REST job outputs. The transport, archive and evidence were rehashed again after read-only custody and again upon receipt of this assent.

## Passed observations

- The exact source/run/attempt/actor/workflow and public-main alignment were checked through native GitHub reads. The candidate job succeeded on a GitHub-hosted Darwin ARM64 runner with Node `v24.20.0` and npm `11.19.1`.
- The source-bound workflow ran its single configured producer/build/pack path, scanner, installed acceptance, sealer and artifact upload in this attempt. No local or historical archive was substituted.
- Exactly two native artifact payload files were present. All **144** tar members, **140** distribution-file hashes, modes and byte lengths matched the sealed inventory. Package, manifest, approved MIT license and third-party notices matched their bound hashes.
- The scanner's complete expected check set passed, including **95** reachable web assets, all five worker roles and the codicon asset. The approved configured-support fingerprint matched without recording the origin or project reference.
- Installed acceptance recorded **167** dependency relationships; relaunch, canonical V2, isolated drafts, Finish behavior, grounded canonical V3, unavailable/dismissed/unrestricted support, cleanup and unchanged source-control observations passed.
- Native re-export was actually observed on Darwin ARM64; the documented other-target fallback is `reExportUnsupported`.
- Independent native reads confirmed both temporary production entries absent and the authoritative fingerprint unchanged. The protected `npm-release` environment still has reviewer `alemagio` / `21338507`, main-only policy and disabled administrator bypass; it has zero environment secrets.
- Exact stable `1.5.0` remained absent in its endpoint and the valid package packument. Publisher job `102915021477` remained waiting, with no started publish step and no deployment approval.

## Validity

| Bound | Value |
|---|---|
| Native run creation | `2026-09-10T14:35:39Z` |
| Native artifact expiry | `2026-12-09T14:35:41Z` |
| Conservative approval deadline | `2026-10-10T14:35:39Z` |
| Total workflow deadline | `2026-10-15T14:35:39Z` |
| Required remaining publisher window | 15 minutes |

The conservative bound derives from run creation plus 30 days for environment review, limited by artifact expiry and run creation plus 35 days for the workflow. It is not an API-provided pending-deployment expiry. Every later action must recheck actual state and remaining validity; expiry never permits a rerun or fallback.

## Acknowledged limitations and authority boundary

Scanning is bounded, not exhaustive credential or legal-obligation detection. Native observation covers Darwin ARM64 only. Transitive dependency resolution was observed at installation time; those dependencies are not inside the tarball. GitHub transport/source observations do not yet constitute verified npm publication provenance. Registry-byte, attestation-cryptography, generated global-bin and exact-version npx proofs remain pending; no SLSA level, all-platform native or full public-browser-flow claim is made.

This assent approves only the displayed immutable candidate. It does **not** approve `npm-release`, npm publication, registry/transparency-log mutation, another run/attempt/artifact, rebuilding, repacking, retrying or changing configuration.

This approval supersedes only the historical Phase 4 archive's prospective publication designation. Phase 4 archive/evidence/approval, both failed CI runs, frozen guards, sealed bootstrap records and the D-10 temporary latest exception remain unchanged. The new candidate never provides retrospective CI provenance for Phase 4.

**Next gate:** separate actual-value stable-publication authority naming this candidate and the still-pending publisher job `102915021477`.
