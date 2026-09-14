# Phase 3: Distribution Contract & Legal Boundary - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 03-distribution-contract-legal-boundary
**Areas discussed:** Use and redistribution rights; ownership and legal approval; public docs and contact links; user-directed public-source milestone revision.

## Area selection

The user selected all three offered areas: use and redistribution rights; ownership and legal approval; public docs and contact links.

## Use and redistribution rights

### Who should be permitted to use Cumpa without paying?

| Option | Description | Selected |
|---|---|---|
| Personal and commercial users | individuals and organizations may use every review feature, including paid work; support remains voluntary. | Yes |
| Noncommercial use only | commercial use requires separate permission without a technical payment gate. |  |

**User’s choice:** Personal and commercial users

### May users share copies of the compiled Cumpa package?

| Option | Description | Selected |
|---|---|---|
| Internal copies only | installation, backups, and sharing within an organization; public distribution through authorized channels. | Yes |
| Unmodified redistribution | public mirrors and unchanged sharing with license and notices. |  |
| Official downloads only | installation and personal backups; other recipients use authorized channels. |  |

**User’s choice:** Internal copies only

### May users modify the compiled app for their own personal or internal organizational use?

| Option | Description | Selected |
|---|---|---|
| Allow private modifications | no distribution of modified builds outside the organization; no source delivery promised. | Yes |
| No modification permission | preserve independent statutory and third-party rights. |  |

**User’s choice:** Allow private modifications

### Should the permission to use an acquired version continue indefinitely?

| Option | Description | Selected |
|---|---|---|
| Perpetual for that version | survives new releases and terms, subject to compliance; no updates or support promised. | Yes |
| Revocable permission | may be withdrawn later; no technical enforcement added. |  |

**User’s choice:** Perpetual for that version

### More on use and redistribution rights, or move on?

| Option | Description | Selected |
|---|---|---|
| Next area |  | Yes |
| More questions |  |  |

**User’s choice:** Next area

---

## Ownership and legal approval

### Who should grant the proprietary application license?

| Option | Description | Selected |
|---|---|---|
| Me personally | individual rights holder, not ShipWithAI as a presumed legal entity. | Yes |
| My legal entity | use registered rights-holding entity name. |  |

**User’s choice:** Me personally. Later clarification named Alessandro Magionami & Manuel Salvatore Martone as the two individual licensors.

### How should the proprietary terms be prepared and approved?

| Option | Description | Selected |
|---|---|---|
| Draft, then my approval | explicit approval of exact text; independent third-party rights verification. | Yes |
| Use supplied legal terms | wait for owner or counsel supplied terms and approval. |  |

**User’s choice:** Draft, then my approval

### Should the draft specify governing law or a court venue?

| Option | Description | Selected |
|---|---|---|
| Omit a special clause | no invented jurisdiction or exclusive venue; applicable law remains. | Yes |
| Specify my jurisdiction | name jurisdiction with exact clause subject to approval. |  |

**User’s choice:** Omit a special clause

### What assurances should the license give users?

| Option | Description | Selected |
|---|---|---|
| As-is, no service commitment | customary lawful warranty/liability limitations, no updates/maintenance/support promise. | Yes |
| Use my supplied commitments | only owner-provided and approved assurances. |  |

**User’s choice:** As-is, no service commitment

### What exact legal name should appear as the copyright holder and licensor?


**User’s choice:** Alessandro Magionami & Manuel Salvatore Martone

### How should approval of the exact license text work for the two named licensors?

| Option | Description | Selected |
|---|---|---|
| Both approve | wait for Alessandro and Manuel to approve the final wording. | Yes |
| I approve for both | user confirms authority to approve for both. |  |

**User’s choice:** Both approve

### More on ownership and legal approval, or move to public documentation and contact links?

| Option | Description | Selected |
|---|---|---|
| Next area |  | Yes |
| More questions |  |  |

**User’s choice:** Next area

---

## Public docs and contact links

### How much should the npm README cover?

| Option | Description | Selected |
|---|---|---|
| Self-contained user guide | installation, prerequisites, review and agent-handoff basics, licensing, and voluntary support; omit private build/operations instructions. | Yes |
| Short installation guide | install, first review, and legal disclosures; detailed usage only through verified public documentation. |  |

**User’s choice:** Self-contained user guide

### Where should users report problems or ask questions?

| Option | Description | Selected |
|---|---|---|
| Email address | real owner-supplied contact. |  |
| Public issue tracker | verified public destination, not the private Cumpa repository. | Yes |
| No contact channel yet | omit unverified contact metadata. |  |

**User’s choice:** Public issue tracker

### Which public issue tracker should Cumpa use?

| Option | Description | Selected |
|---|---|---|
| Existing skills tracker | https://github.com/Ship-With-AI/skills/issues |  |
| Dedicated Cumpa tracker | new public issue-only repository without application source/history. |  |

**User’s choice:** the Cumpa source code can be open, so the repository should become public

### What should the package homepage point to?

| Option | Description | Selected |
|---|---|---|
| No separate homepage | npm README is the user guide, with verified issue link. | Yes |
| ShipWithAI newsletter | https://shipwithai.substack.com as publisher newsletter, not product docs. |  |

**User’s choice:** No separate homepage

### More on public documentation, contact links, or source-publication boundary—or finish this area?

| Option | Description | Selected |
|---|---|---|
| Finish this area |  | Yes |
| More questions |  |  |

**User’s choice:** Finish this area

---

## Milestone scope change

### Public repository scope change raised during tracker selection


**User’s choice:** User intentionally reverses the milestone private-source boundary: publish the existing Ship-With-AI/cumpa repository and its reviewed history under the selected proprietary, source-available license, not an open-source license. Apply selected use/copy/modification rights to source and compiled releases. No visibility change during this discussion. Reconcile PROJECT.md, REQUIREMENTS.md and ROADMAP.md privacy/provenance assumptions before execution; source/history licensing and sensitive-material review plus both licensors’ exact-text approval remain prerequisites. Obtain separate approval before destructive remediation or history rewriting.

### Should Cumpa source become publicly readable under the selected proprietary permissions, or should the application become open source?

| Option | Description | Selected |
|---|---|---|
| Public source, proprietary license | source-available, same use/internal-copy/private-modification permissions, no public redistribution; grant covers source. | Yes |
| Open-source application | replace proprietary/no-public-redistribution decisions with an open-source license. |  |

**User’s choice:** Public source, proprietary license

### The current repository tracks 368 planning files and changing visibility exposes history. Which publication boundary?

| Option | Description | Selected |
|---|---|---|
| Existing repo and history | make Ship-With-AI/cumpa public only after tracked-content/history rights and sensitive-material review; stop before deleting or rewriting history if remediation needed. | Yes |
| Clean public source snapshot | retain private history and publish reviewed source in a separate repository. |  |

**User’s choice:** Existing repo and history

### How should the proprietary license handle GitHub public-repository permissions?

| Option | Description | Selected |
|---|---|---|
| Preserve GitHub platform rights | acknowledge required permissions including in-platform forks, restrict other public redistribution, and preserve statutory and third-party rights. | Yes |
| Revisit public hosting | reconsider public GitHub if those platform permissions are unacceptable. |  |

**User’s choice:** Preserve GitHub platform rights

---

## Final capture gate

The user selected **Ready for context** rather than **Explore more gray areas**. The later GitHub platform-rights question was prompted by a material constraint in the official terms and was explicitly answered **Preserve GitHub platform rights** before capture. This is not approval of final license wording or authorization to change repository visibility during the discussion.

## Grounding and clarifications

- The existing repository was verified as PRIVATE, unarchived, with Issues enabled. It tracks 368 planning files. No visibility change or history remediation was performed.
- The public Ship-With-AI/skills repository and enabled tracker were verified as an available alternative; the user instead chose to make the existing Cumpa source repository public.
- The existing private-source milestone documents were not silently rewritten. The context records the explicit requested revision and requires GSD reconciliation before finalizing plans.
- The public source choice does not change compiled-only npm artifact exclusions, separate MIT skill licensing, or the voluntary nature of payment.
- GitHub Terms of Service §D.5 requires platform viewing/forking permissions; the user accepted the corresponding exception to a blanket public-redistribution restriction. Source: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#d-user-generated-content
- npm documentation was checked after the public-source decision: automatic provenance has public-source/public-package/OIDC conditions. No release or attestation exists as evidence from this discussion. Sources: https://docs.npmjs.com/trusted-publishers/ and https://docs.npmjs.com/generating-provenance-statements/

## Claude’s Discretion

Exact license draft and documentation wording within the selected permissions, subject to both licensors approving the exact legal text; technical notice and publication-review methods; accurate metadata syntax and documented provenance integration. No discretion to change licensing policy, choose another public repository, or rewrite history without approval.

## Deferred and gated work

- Reconcile PROJECT.md, REQUIREMENTS.md, and ROADMAP.md with the explicitly requested public-source/public-history proprietary model before finalizing plans.
- Final license text and both licensors’ approval, rights and sensitive-history review, repository visibility change, and any separately approved destructive remediation remain unperformed execution work.
- Tarball preparation, bootstrap/stable publication, MIT marketplace distribution, and clean released-artifact acceptance remain the later phases.
