<!-- cumpa-evidence
{
  "version": 1,
  "kind": "deployment-run",
  "status": "passed",
  "mode": "prelaunch-test",
  "fingerprint": "2043c31eacb2efa76123043fcd652ac45bd19b121db1ddaa537e86b3473bf73d",
  "public_origin": "https://boruowxemintmdojkibd.supabase.co",
  "run": {
    "id": "33631411293",
    "url": "https://github.com/Ship-With-AI/cumpa/actions/runs/33631411293",
    "commit": "c0a33d3e1835ff17ba2b951a036589375da81c02",
    "immutable": true
  },
  "order": [
    "schema",
    "auth-provider-configuration",
    "edge-function-secrets",
    "support-api",
    "support-flow",
    "stripe-webhook"
  ],
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
  "authority": {
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
  "artifacts": {
    "evidence_sha256": "536d848db6e26d0dd53383b158391a6e26d1a1a9ae78b9b67a16bac51974cb3a"
  }
}
-->
