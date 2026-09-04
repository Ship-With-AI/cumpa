{
  "version": 1,
  "kind": "retirement-review",
  "status": "passed",
  "policy": {
    "version": 1,
    "classifier_sha256": "d82f9f5531260a581bbe4d34859f6fe672074887041a779780fe1f0f027dcea6"
  },
  "scope": {
    "tracked_paths": 572,
    "scanned_tracked_files": 561,
    "immutable_description_exclusion": ".planning/**",
    "contract_description_exclusions": [
      "scripts/verify-production-artifacts.mjs",
      "scripts/verify-supabase-support.mjs",
      "tests/e2e/package-assets.spec.ts",
      "tests/e2e/support-payment.spec.ts"
    ]
  },
  "configured_absent": true,
  "package": {
    "scanned_dist_files": 138,
    "inventory_paths": 143,
    "extracted_files": 141,
    "archive_sha256": "9a6ba1c3cacfa2f7d202f816b1ac316da2a6c3537b7ebfd1bbc3ff32c735bcc5",
    "inventory_sha256": "05288c9cf2daf4518fd67ef246e45f98c13e943b488e34cb79aa1daf1652fd01"
  },
  "artifacts": {
    "commit": "2ef9d630730107c7d5aa5d07b6e3358181809e87",
    "evidence_sha256": "c0e2949462aee574a4626b42f53f16222623022bab7a1e43bdd362fd976a0e80"
  },
  "violations": []
}
