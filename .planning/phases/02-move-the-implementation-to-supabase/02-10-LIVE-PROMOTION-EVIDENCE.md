# Phase 02 live promotion evidence

<!-- cumpa-evidence
{
  "version": 1,
  "kind": "deployment-run",
  "status": "passed",
  "mode": "prelaunch-test",
  "fingerprint": "2043c31eacb2efa76123043fcd652ac45bd19b121db1ddaa537e86b3473bf73d",
  "public_origin": "https://boruowxemintmdojkibd.supabase.co",
  "run": {
    "id": "33757825727",
    "url": "https://github.com/Ship-With-AI/cumpa/actions/runs/33757825727",
    "commit": "e36636d02904fa16eec710767a89976cc5ff7b9b",
    "immutable": true
  },
  "order": [
    "delete:support_private.stripe_events",
    "delete:support_private.installation_bindings",
    "delete:support_private.supporters",
    "delete:support_private.checkout_sessions",
    "delete:support_private.support_intents",
    "delete:auth.users"
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
    "evidence_sha256": "28c6f09076443ba74588b68769a19ed055186c10e8152083507e44173112384d"
  },
  "operation": "exact-cleanup",
  "authority_before": {
    "auth.users": {
      "count": 13,
      "handles": [
        "04bb1d7da8f6166cae9a35fe8a94e2c6db01dee87b489f2f270e1b7c3c1ab49c",
        "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
        "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
        "3357235cdfbcbbba3539b67ec4e11a7e673735469e30fe16e20598396d570a76",
        "4aab5e9d4c637d4889c5e6656d0b4f3cc40f96f1eb934f8f37d8931770a2e9e8",
        "50f69e7ffc57b90d781fbf0af242ac0dc8ab1852459132fbeb5302bab4f53985",
        "8c074e92246a3d32952df62df6e8d4f50722b23d4ae143ec637c781cb5f856dc",
        "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
        "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
        "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
        "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
        "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a",
        "eec888e077fb3cb877468ad38ed0e39876118fa37c9caabb868171ca03e86d04"
      ]
    },
    "support_private.support_intents": {
      "count": 20,
      "handles": [
        "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
        "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
        "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
        "279f35a39bc4e2ffa3b8b7118cffcb0444ba07cc0717f9601a7919296b1da522",
        "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
        "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
        "34e69675cd166df1a80ec4b760b5b1113dbc6cb0e152225c1069a927baad6590",
        "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
        "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
        "5f0a222a080ae7170d51345f4a7166f3fb823a28ee5219fa54048976cf6d76b9",
        "67e5b60041be08d9989933330864dc5af557d42ba95fda51b6c68fb94c74f6c5",
        "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
        "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
        "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
        "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
        "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
        "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
        "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
        "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a",
        "dee012316494dbaedf78ebf3c53d68cf596c6638add4dd91333ff569da5967ea"
      ]
    },
    "support_private.supporters": {
      "count": 4,
      "handles": [
        "092f61f152f50deb5ce1b4d645dfda7e6138bfa4ff2e84feecde27bfda997260",
        "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
        "2895bdf7b9967799ce17cf8c52eeacd2e1123ae0de3174fdf6e0f6f18b77159e",
        "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
      ]
    },
    "support_private.checkout_sessions": {
      "count": 7,
      "handles": [
        "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
        "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
        "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
        "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
        "e21fc6f1e98edac4d19074af7038fc701e285400d98019f6c95055b320afee62",
        "e70ed8cf46fed3c1e049cf1a31d1441d53a1c5ddbaba178645499198e6954980",
        "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
      ]
    },
    "support_private.stripe_events": {
      "count": 4,
      "handles": [
        "0ebe8c2eb28b94d668e8e2ed752feb4a7e4a6aeba7084a61b2adb3ba21354761",
        "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
        "a2fe61f003b0a6e67d44f81d4d666fce7326a45e63c558466329bd06fe93b00b",
        "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
      ]
    },
    "support_private.installation_bindings": {
      "count": 6,
      "handles": [
        "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
        "494655a20a0f4ca43925fee9bf7534ad2647d030d79db095a4df5575d2f7a4f6",
        "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
        "8cbcb2819a22b64b55ac2ba3534b5bef69957d5d7196d90e5f30e89371cd4bcf",
        "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
        "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
      ]
    }
  },
  "deleted": {
    "auth.users": {
      "count": 13,
      "handles": [
        "04bb1d7da8f6166cae9a35fe8a94e2c6db01dee87b489f2f270e1b7c3c1ab49c",
        "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
        "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
        "3357235cdfbcbbba3539b67ec4e11a7e673735469e30fe16e20598396d570a76",
        "4aab5e9d4c637d4889c5e6656d0b4f3cc40f96f1eb934f8f37d8931770a2e9e8",
        "50f69e7ffc57b90d781fbf0af242ac0dc8ab1852459132fbeb5302bab4f53985",
        "8c074e92246a3d32952df62df6e8d4f50722b23d4ae143ec637c781cb5f856dc",
        "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
        "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
        "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
        "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
        "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a",
        "eec888e077fb3cb877468ad38ed0e39876118fa37c9caabb868171ca03e86d04"
      ]
    },
    "support_private.support_intents": {
      "count": 20,
      "handles": [
        "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
        "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
        "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
        "279f35a39bc4e2ffa3b8b7118cffcb0444ba07cc0717f9601a7919296b1da522",
        "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
        "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
        "34e69675cd166df1a80ec4b760b5b1113dbc6cb0e152225c1069a927baad6590",
        "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
        "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
        "5f0a222a080ae7170d51345f4a7166f3fb823a28ee5219fa54048976cf6d76b9",
        "67e5b60041be08d9989933330864dc5af557d42ba95fda51b6c68fb94c74f6c5",
        "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
        "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
        "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
        "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
        "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
        "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
        "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
        "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a",
        "dee012316494dbaedf78ebf3c53d68cf596c6638add4dd91333ff569da5967ea"
      ]
    },
    "support_private.supporters": {
      "count": 4,
      "handles": [
        "092f61f152f50deb5ce1b4d645dfda7e6138bfa4ff2e84feecde27bfda997260",
        "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
        "2895bdf7b9967799ce17cf8c52eeacd2e1123ae0de3174fdf6e0f6f18b77159e",
        "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
      ]
    },
    "support_private.checkout_sessions": {
      "count": 7,
      "handles": [
        "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
        "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
        "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
        "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
        "e21fc6f1e98edac4d19074af7038fc701e285400d98019f6c95055b320afee62",
        "e70ed8cf46fed3c1e049cf1a31d1441d53a1c5ddbaba178645499198e6954980",
        "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
      ]
    },
    "support_private.stripe_events": {
      "count": 4,
      "handles": [
        "0ebe8c2eb28b94d668e8e2ed752feb4a7e4a6aeba7084a61b2adb3ba21354761",
        "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
        "a2fe61f003b0a6e67d44f81d4d666fce7326a45e63c558466329bd06fe93b00b",
        "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
      ]
    },
    "support_private.installation_bindings": {
      "count": 6,
      "handles": [
        "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
        "494655a20a0f4ca43925fee9bf7534ad2647d030d79db095a4df5575d2f7a4f6",
        "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
        "8cbcb2819a22b64b55ac2ba3534b5bef69957d5d7196d90e5f30e89371cd4bcf",
        "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
        "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
      ]
    }
  },
  "authority_confirmation": {
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
  "acceptance": {
    "run_id": "33754289126",
    "run_evidence_sha256": "5156b0978619fcfcc68345f2e5bdc88afa3045d25e0826eff52c00ba85111aef",
    "record_sha256": "34f43b5d69822471c140ba585abaf815f411ecea491278f741053ed8c66e1941"
  }
}
-->
