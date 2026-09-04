{
  "version": 1,
  "kind": "release",
  "status": "passed",
  "mode": "production-live",
  "fingerprint": "2043c31eacb2efa76123043fcd652ac45bd19b121db1ddaa537e86b3473bf73d",
  "public_origin": "https://boruowxemintmdojkibd.supabase.co",
  "run": {
    "id": "33791539888",
    "url": "https://github.com/Ship-With-AI/cumpa/actions/runs/33791539888",
    "commit": "e29895d33cf077ae98fc16c56b697e9641188d4e",
    "immutable": true
  },
  "routes": {
    "auth-settings": {
      "status": 401,
      "content_type": "application/json"
    },
    "support-api-invalid-input": {
      "status": 400,
      "content_type": "application/json"
    },
    "support-flow-invalid-state": {
      "status": 400,
      "content_type": "text/plain"
    },
    "stripe-webhook-invalid-signature": {
      "status": 400,
      "content_type": "application/json"
    }
  },
  "route_probes": {
    "auth-settings": {
      "status": 401,
      "content_type": "application/json"
    },
    "support-api-invalid-input": {
      "status": 400,
      "content_type": "application/json"
    },
    "support-flow-invalid-state": {
      "status": 400,
      "content_type": "text/plain"
    },
    "stripe-webhook-invalid-signature": {
      "status": 400,
      "content_type": "application/json"
    }
  },
  "authority_before": {
    "auth.users": {
      "count": 0,
      "handles": []
    },
    "support_private.support_intents": {
      "count": 0,
      "handles": []
    },
    "support_private.supporters": {
      "count": 0,
      "handles": []
    },
    "support_private.checkout_sessions": {
      "count": 0,
      "handles": []
    },
    "support_private.stripe_events": {
      "count": 0,
      "handles": []
    },
    "support_private.installation_bindings": {
      "count": 0,
      "handles": []
    }
  },
  "authority_after": {
    "auth.users": {
      "count": 0,
      "handles": []
    },
    "support_private.support_intents": {
      "count": 0,
      "handles": []
    },
    "support_private.supporters": {
      "count": 0,
      "handles": []
    },
    "support_private.checkout_sessions": {
      "count": 0,
      "handles": []
    },
    "support_private.stripe_events": {
      "count": 0,
      "handles": []
    },
    "support_private.installation_bindings": {
      "count": 0,
      "handles": []
    }
  },
  "non_destructive": true,
  "artifacts": {
    "evidence_sha256": "89bc65df2dcd580884b519e79a897cf8b1f32f9a989591251bb2e39a566357a2",
    "deployment_evidence_sha256": "af743964dd9fd9a44de5ef8a781ffec2d2a904c79988b8b0da5ce3c62123a5f0",
    "package_sha256": "6908ad06d84048f75ba4140bdb22fff48d73c43714e9aef5d2e4c1655b76e4b3",
    "promotion_evidence_sha256": "080857e25322fe0dbbf530877bb688a505af9ec9fe74992749e8f53a220d24f3",
    "retirement_evidence_sha256": "9474b46d3d2a3898e208af1ceef6efdef981fe9834a740c1e0c5142648380877"
  }
}
