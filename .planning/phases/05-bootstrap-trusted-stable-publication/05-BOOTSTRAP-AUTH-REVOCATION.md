# Bootstrap authentication revocation and failed publication

## Status

One real publication command was attempted. It exited with code **1**. Public npm still reported the package, bootstrap version and stable version absent in fresh credential-free requests at **2026-09-10T08:08:27–28Z**. No publication retry was performed. REL-01 is not complete; stable setup and publication remain blocked.

## Exact attempted identity

- Package: `@shipwithai/cumpa@1.5.0-bootstrap.0`
- Tag/access: `bootstrap` / `public`; no `latest` assignment was requested.
- Account: `alemagio`, verified owner of `shipwithai`.
- Account readiness: email verified; 2FA mode `auth-only`, pending `false`.
- Archive: `3514006` bytes, SHA-256 `4405580ba53d20ee2c802eb30a2e77c32fb4425ac7e53673c39de6c14cd97f5f`.
- Evidence SHA-256: `54fc66c7354921bae673fe53aa0d58256055df967486089232d797ad59c5cdb4`.
- Artifact approval SHA-256: `c91450bdd8fdf1c775bfa5189ba30e3534bd5867e6a55e9065db9ecdea0328ec`.
- Publication authorization SHA-256: `2d57c56229b8b5c32330061a80ac7b1377a9018430f2b3acb042d478472e9930`. Its one attempt is **consumed**.
- Reviewed public source: `72c9bb499538a2c542d5165148e2d45096f7da56`.
- Final prepublication observations: `2026-09-10T07:42:42Z`.
- Actual command used the approved absolute read-only archive with `--tag bootstrap --access public --ignore-scripts --fetch-retries=0 --registry https://registry.npmjs.org/`. No directory publication, rebuild or repack occurred.

## Actual latest-session revocation

After the publication command ended, the credential-owning guard ran supported `npm logout` against the isolated `@shipwithai`/public-registry configuration **before** public reconciliation.

- Recorded result: `supported-npm-logout-server-response`.
- Guard final state: `closed`; owned cleanup completed.
- Owned HOME, cache, prefix, user config and global config: independently checked absent.
- The private ownership receipt, guard copy and approved artifacts were retained.
- No inherited npm credential was used for publication. Existing GitHub authentication was used only for authorized source reads. Existing npm/GitHub credentials and browser login were not removed or logged out.

This is evidence of a successful supported npm logout and verified local cleanup. No independent rejected-token probe was performed or claimed. Local file absence alone is not offered as server revocation proof. The final operator confirmation of this latest logout has not yet been recorded.

## Earlier operation outcomes

The local inventory contains **five** owned operation receipts, all closed with their local authentication contexts removed:

- One pre-login preparation expired without creating a session.
- One failed login was closed after the operator clarified website sign-in only, without completed CLI authorization. Its assurance remains operator-reported, not independent server revocation.
- One successful isolated login was revoked by supported npm logout after an overstrict agent preflight deferred publication. No publish request was sent from that operation.
- One renewal reached a disallowed non-browser credential prompt. The operator confirmed provider-side CLI authorization, then explicitly confirmed revoking only that session. It was closed at operator-confirmed native-provider-revocation assurance.
- The final operation made the single publication attempt described above, then completed supported npm logout and local cleanup.

These observation levels remain distinct in `05-BOOTSTRAP-PUBLICATION.json`; no earlier operator report is reused as confirmation of the latest logout.

## Failure diagnosis and limits

The original publication's precise npm/provider error is unknown: the private raw output was discarded and the old bounded parser recorded `unclassified`. A credential-free native-PTY `npm view` reproduction proved that whole-line matching missed a real `E404`.

The private diagnostic parser was repaired and verified against that actual read-only output, known web/fetch failures, secret-like unsupported codes, and **16** harmless lifecycle scenarios. Browser authorization requests and unsupported prompt categories now produce bounded notifications without URLs or credentials. No new login or publication was performed during diagnosis; npm was not upgraded.

- Guard used for the actual attempt: `a2c35e5f216b2c8fb3efd0afbdfdb5aeab3d9353232fe4bfbdd607701ef8d23e`.
- Verified diagnostic guard for a possible future authorized attempt: `b11ad8729363e95b3e297a82b76d9ef6c6ec31c3fd6e9c8ef1b3c314d6d0f800`.
- npm status reported all systems operational and no unresolved incidents when checked. This does not rule out a transient or account-specific failure.

The approved archive, evidence and artifact approval remain unchanged and read-only where required. No public tarball could be downloaded or globally installed because the public version was absent. A further real publication needs a new exact one-attempt authorization, a fresh isolated login and fresh matching preconditions; it is not an automatic retry.

## Sources and detailed evidence

- `05-BOOTSTRAP-PUBLICATION.json`: attributable approvals, authentication history, actual command outcome, fresh registry responses and owned cleanup inventory.
- [npm token revocation documentation](https://docs.npmjs.com/revoking-access-tokens/)
- [npm service status](https://status.npmjs.org/)
