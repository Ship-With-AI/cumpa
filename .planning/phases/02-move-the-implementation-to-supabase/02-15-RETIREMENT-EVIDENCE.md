{
  "version": 1,
  "kind": "retirement-review",
  "status": "passed",
  "policy": {
    "version": 1,
    "classifier_sha256": "d82f9f5531260a581bbe4d34859f6fe672074887041a779780fe1f0f027dcea6"
  },
  "scope": {
    "tracked_paths": 571,
    "scanned_tracked_files": 560,
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
    "commit": "044a9411aaba6f5bddc01a438e56e1710e3f8339",
    "evidence_sha256": "9aa05362f489fd235b10357749b62a15f84425f6093b50f2a576aa3dddba8ce9"
  },
  "violations": []
}
