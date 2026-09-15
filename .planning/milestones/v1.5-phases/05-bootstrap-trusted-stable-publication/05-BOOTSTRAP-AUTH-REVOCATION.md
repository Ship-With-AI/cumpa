# Bootstrap authentication revocation and publication outcomes

## Status

The separately authorized second publication succeeded. Public bytes and a fresh global installation are verified. Publishing and final tag-repair sessions were logged out, their owned local files were removed, and the operator confirmed both revocations at the recorded assurance levels. The authenticated latest-only removal was rejected with E400. On 2026-09-10 the owner selected **“Accept until stable CI”**, explicitly accepting this verified bootstrap as temporary `latest` until separately approved stable CI publication replaces it. Bootstrap closure is complete under that one-time amendment; no further registry or CI mutation is authorized.

## First attempt (failed): exact identity

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

## First attempted publication: session revocation

After the publication command ended, the credential-owning guard ran supported `npm logout` against the isolated `@shipwithai`/public-registry configuration **before** public reconciliation.

- Recorded result: `supported-npm-logout-server-response`.
- Guard final state: `closed`; owned cleanup completed.
- Owned HOME, cache, prefix, user config and global config: independently checked absent.
- The private ownership receipt, guard copy and approved artifacts were retained.
- No inherited npm credential was used for publication. Existing GitHub authentication was used only for authorized source reads. Existing npm/GitHub credentials and browser login were not removed or logged out.

This is evidence of a successful supported npm logout and verified local cleanup. No independent rejected-token probe was performed or claimed. Local file absence alone is not offered as server revocation proof. The operator subsequently confirmed this logout before authorizing the second attempt.

## Operation inventory before the second attempt

At the first-attempt checkpoint, the local inventory contained **five** owned operation receipts, all closed with their local authentication contexts removed:

- One pre-login preparation expired without creating a session.
- One failed login was closed after the operator clarified website sign-in only, without completed CLI authorization. Its assurance remains operator-reported, not independent server revocation.
- One successful isolated login was revoked by supported npm logout after an overstrict agent preflight deferred publication. No publish request was sent from that operation.
- One renewal reached a disallowed non-browser credential prompt. The operator confirmed provider-side CLI authorization, then explicitly confirmed revoking only that session. It was closed at operator-confirmed native-provider-revocation assurance.
- The fifth operation made the first publication attempt described above, then completed supported npm logout and local cleanup.

These observation levels remain distinct in `05-BOOTSTRAP-PUBLICATION.json`; no earlier operator report is reused as confirmation of the latest logout.

## Failure diagnosis and limits

The first publication's precise npm/provider error remains unknown: the private raw output was discarded and the old bounded parser recorded `unclassified`. The operator subsequently reported that the publishing-browser session was not completed in time. A credential-free native-PTY `npm view` reproduction proved that whole-line matching missed a real `E404`.

The private diagnostic parser was repaired and verified against that actual read-only output, known web/fetch failures, secret-like unsupported codes, and **16** harmless lifecycle scenarios. Browser authorization requests and unsupported prompt categories now produce bounded notifications without URLs or credentials. No new login or publication was performed during diagnosis; npm was not upgraded.

- Guard used for the first attempted publication: `a2c35e5f216b2c8fb3efd0afbdfdb5aeab3d9353232fe4bfbdd607701ef8d23e`.
- Verified diagnostic guard used for the second attempt: `b11ad8729363e95b3e297a82b76d9ef6c6ec31c3fd6e9c8ef1b3c314d6d0f800`.
- npm status reported all systems operational and no unresolved incidents when checked. This does not rule out a transient or account-specific failure.

The approved archive, evidence and artifact approval remain unchanged and read-only where required. No public tarball was available after the first attempt. The second attempt used new exact authorization, fresh isolated authentication and fresh matching preconditions; it was not an automatic retry.

## Second attempt (published): public proof and accepted tag outcome

- Publication authorization SHA-256: `056cd80371e2f202b2449b2fa2241652e9083591b9e8b45d586f63d26b4a203a`.
- Registry publication time: `2026-09-10T08:31:35.088Z`; registry publisher: `alemagio`.
- Same approved package/version, archive SHA-256, byte length, source, evidence and artifact approval as above.
- Actual npm publication exit code: `0`; one command under this new authorization, two total publication attempts.
- The guard announced separate browser requests for login and publication.
- Supported npm logout succeeded immediately after the publication command; its owned HOME/cache/prefix/configs were removed before public consumer verification.
- Credential-free registry download: SHA-256, SHA-1, SHA-512 integrity and byte length all equal the approved archive.
- Normal exact global registry install: succeeded with install scripts enabled, fresh isolated HOME/cache/prefix/configs and no local-tarball fallback.
- Installed generated binary resolved inside that package and returned `1.5.0-bootstrap.0` with exit `0`, on Node `v24.15.0` / npm `11.12.1`, Darwin ARM64.
- Created download/consumer state was removed. After publication, all **six** publication/preparation authentication contexts were locally cleaned and closed at their recorded assurance levels; two later tag-repair contexts are recorded below.
- Successful publishing-session observation level: supported npm logout response, independently checked owned-file absence and subsequent explicit operator revocation confirmation. No independent rejected-token probe is claimed.
- No trusted-publisher or CI-build provenance is claimed for this local interactive bootstrap.

Observed registry tags remain `bootstrap = 1.5.0-bootstrap.0` and `latest = 1.5.0-bootstrap.0`. The original unchanged-latest criterion failed; the immutable version and correct bootstrap tag were never changed. The owner subsequently accepted only this first-release exception, captured at `2026-09-10T09:44:36Z`, SHA-256 `fdf592eef8725d7e5c5d2e6a59a94d9351b8bbca9884ebe4ae85ad9a1021fd19`. This permits the current pointer until the separately authorized stable CI release; it neither claims the earlier criterion passed nor grants CI setup, dispatch, artifact approval or stable publication.

## Authorized latest-only repair: rejected by the registry

- Authority SHA-256: `71733dcdc3cae362ffa686d1a232ae80ce75ac512d1ae99fb4619617bd59f142`.
- Fixed tag-only guard SHA-256: `bb01dc9ef894040e53ab2ac873051a8b14784852e4654593f6e4343af9db5b59`.
- Nineteen harmless scenarios passed, including changed/unverifiable tag rejection, publication-control rejection, browser-based tag authentication, deadlines and recovery. A real credential-free `npm view` proved the tag JSON interface before authentication.
- The first tag-login request was not approved, according to the operator. Its empty owned context was closed at that operator-reported assurance level; no tag command ran.
- The operator authorized a fresh login. Actual `alemagio`/`shipwithai` owner, 2FA and exact tag/version/integrity preconditions were rechecked.
- The guard independently reread tags immediately before running exactly `npm dist-tag rm @shipwithai/cumpa latest --fetch-retries=0 --registry https://registry.npmjs.org/` in its isolated context.
- One removal command was attempted; npm returned exit `1`, code **`E400`**. Public tags, bootstrap version, SHA-1 and SHA-512 integrity remained unchanged.
- Supported npm logout then succeeded; all owned tag-session files were checked absent before public reconciliation. The two tag-operation receipts are retained. All **eight** owned local contexts are now removed, at their individually recorded assurance levels.
- Final tag-session observation level: supported npm logout response plus verified local cleanup and explicit operator **“Revocation confirmed”** response captured at `2026-09-10T09:44:36Z`. No independent rejected-token probe is claimed.
- No tag-removal retry, republish, unpublish or unrelated credential operation occurred.

[npm/cli#8490](https://github.com/npm/cli/issues/8490) documents the same first-publication dual-tag behavior and 400 removal result. An npm maintainer confirms first publication with a custom tag also creates latest; the demonstrated supported adjustment is moving latest to another published version. The owner's D-10 amendment accepts this first-release outcome instead of retrying deletion or using an unsupported registry workaround. Published bytes, metadata identities, consumer proof, cleanup and separate stable CI gates remain required and unchanged.

## Sources and detailed evidence

- `05-BOOTSTRAP-PUBLICATION.json`: attributable approvals, authentication history, actual command outcome, fresh registry responses and owned cleanup inventory.
- [npm token revocation documentation](https://docs.npmjs.com/revoking-access-tokens/)
- [npm service status](https://status.npmjs.org/)
