# Phase 02 hosted acceptance evidence

<!-- cumpa-evidence
{
  "version": 1,
  "kind": "acceptance",
  "status": "passed",
  "mode": "prelaunch-test",
  "fingerprint": "2043c31eacb2efa76123043fcd652ac45bd19b121db1ddaa537e86b3473bf73d",
  "public_origin": "https://boruowxemintmdojkibd.supabase.co",
  "deployment_run": {
    "id": "33631411293",
    "url": "https://github.com/Ship-With-AI/cumpa/actions/runs/33631411293",
    "commit": "c0a33d3e1835ff17ba2b951a036589375da81c02",
    "immutable": true
  },
  "run": {
    "id": "33754289126",
    "url": "https://github.com/Ship-With-AI/cumpa/actions/runs/33754289126",
    "commit": "eaf561ca8b98dfd7e03f17b2abc691dfec94003f",
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
  "acceptance_marker": {
    "status": "interactive-matrix-complete",
    "deployment_evidence_sha256": "536d848db6e26d0dd53383b158391a6e26d1a1a9ae78b9b67a16bac51974cb3a",
    "observations_sha256": "0ab102e189ff75049837cc5af978f7fdf78d21d8f12fc20b78b0bddd146ef078",
    "marker_sha256": "7f1a86a0b06e591d4832a86ed8e5d97072b8bc333412d8fe8168538887a63cbd"
  },
  "observations": {
    "browser_matrix": [
      {
        "id": "paid-support",
        "status": "passed"
      },
      {
        "id": "restart-persistence",
        "status": "passed"
      },
      {
        "id": "restore-paid-one",
        "status": "passed"
      },
      {
        "id": "restore-paid-two",
        "status": "passed"
      },
      {
        "id": "restore-unpaid",
        "status": "passed"
      },
      {
        "id": "checkout-delay",
        "status": "passed"
      },
      {
        "id": "checkout-cancellation",
        "status": "passed"
      }
    ],
    "completion": {
      "status": 200,
      "content_type": "text/plain",
      "body": "Support flow complete. You can return to Cumpa."
    },
    "review_unrestricted": true
  },
  "hostile_matrix": [
    {
      "id": "wrong-signature",
      "fixtures": [
        "f0ed227741e4459615c1158c93e3455ac8f191cdffd6b47efa834b6481e88d43"
      ],
      "before": {
        "auth.users": {
          "count": 7,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 15,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "after": {
        "auth.users": {
          "count": 7,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 15,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "expected": "rejected-without-authority",
      "actual": "rejected-without-authority",
      "guard": true
    },
    {
      "id": "wrong-product",
      "fixtures": [
        "229f756d5e99f5fe5daf804dbfd629b515f15fa79b839d8f5cd70d90434d52d8",
        "31842177da1b9f0f42f9bb9c0ffb836c0dbe8460c4aa5e501fd500fb2f255c8e",
        "9be52c904290539251fb77fa5cc85becfc2b4cd1c6acf99e3a3e147632e34ab3",
        "b4a06fa6a48e78b0029a2043284c93178877bd070027d6deee0d6df1258df1fd",
        "f1fc7084a45086d5e0554b6cf2a53bb375dc9720cf71aeeebb41fde347cfa269"
      ],
      "before": {
        "auth.users": {
          "count": 7,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 15,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "after": {
        "auth.users": {
          "count": 7,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 15,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "expected": "rejected-without-authority",
      "actual": "rejected-without-authority",
      "guard": true
    },
    {
      "id": "wrong-amount",
      "fixtures": [
        "24c52c9934fd38adc18649d10e987589c66ce26bde6bec7de31f7ad920249458",
        "69a3e177b284bc33bc61dd41d13dae2f37752d5303d99ea142c2f83c6380d2a2",
        "7d01b6cb81a6d1357c32eef2114e518e24d5d2f1f79bc8025c9c1891843e048d",
        "7e405b59a067e885d7ee7a517b3db5d7119638a4b3c6e53e4279991859439a95",
        "dc1504e81887abff7993736f819cc24a4b4548d07787cae532661a853ff5d05f"
      ],
      "before": {
        "auth.users": {
          "count": 7,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 15,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "after": {
        "auth.users": {
          "count": 7,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 15,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "expected": "rejected-without-authority",
      "actual": "rejected-without-authority",
      "guard": true
    },
    {
      "id": "wrong-currency",
      "fixtures": [
        "7ed9533918a2e2418578b5d5978238da9e4b0f6af0c6fc33cf96d8405617e6f8",
        "809208ae00d60c176e8db1b31a61dc1f6abacc814b20c364db59efb45fba2721",
        "9b5317635c0e17401f67fc53598eea093c441bc7332d8beabc05d7b27bbdaf7b",
        "e1fd931747e041e933a0c903588440d425637ad5e5bac189ae8d3fe192601362",
        "f6cf12ac8fa23272346ef03c7673879c549cb0870bf36af6096ddd52f37c2f81"
      ],
      "before": {
        "auth.users": {
          "count": 7,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 15,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "after": {
        "auth.users": {
          "count": 7,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 15,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "expected": "rejected-without-authority",
      "actual": "rejected-without-authority",
      "guard": true
    },
    {
      "id": "wrong-binding",
      "fixtures": [
        "23d4bf8e44813857c3655f56209cc0b4623c31937697169f355b190a146fa70b",
        "9d939f641c68f3dca9c6eeeaf75fae2ed76fed6bde28b3d5362b994957f089eb",
        "b32306e7d7a699de8bd1d0a5a1192fdaf6aae4a10b5c142e1274f0f51159e85a",
        "db967f7e7b35198a4b2bd80531091e4e55c401496d0aaa58e88c1d0bab236b8c"
      ],
      "before": {
        "auth.users": {
          "count": 9,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "50f69e7ffc57b90d781fbf0af242ac0dc8ab1852459132fbeb5302bab4f53985",
            "8c074e92246a3d32952df62df6e8d4f50722b23d4ae143ec637c781cb5f856dc",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 16,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "67e5b60041be08d9989933330864dc5af557d42ba95fda51b6c68fb94c74f6c5",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "after": {
        "auth.users": {
          "count": 9,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "50f69e7ffc57b90d781fbf0af242ac0dc8ab1852459132fbeb5302bab4f53985",
            "8c074e92246a3d32952df62df6e8d4f50722b23d4ae143ec637c781cb5f856dc",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 16,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "67e5b60041be08d9989933330864dc5af557d42ba95fda51b6c68fb94c74f6c5",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "expected": "rejected-without-authority",
      "actual": "rejected-without-authority",
      "guard": true
    },
    {
      "id": "expired-intent",
      "fixtures": [
        "4239bdb74ff4f149627204a183feed25f3ff24c95c65be97d8e6f83086a8a036",
        "4c150a95e878d493c223d6793fa94147ce08b0570ab647d7dae4135e4291c1e0"
      ],
      "before": {
        "auth.users": {
          "count": 10,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "4aab5e9d4c637d4889c5e6656d0b4f3cc40f96f1eb934f8f37d8931770a2e9e8",
            "50f69e7ffc57b90d781fbf0af242ac0dc8ab1852459132fbeb5302bab4f53985",
            "8c074e92246a3d32952df62df6e8d4f50722b23d4ae143ec637c781cb5f856dc",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 17,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "279f35a39bc4e2ffa3b8b7118cffcb0444ba07cc0717f9601a7919296b1da522",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "67e5b60041be08d9989933330864dc5af557d42ba95fda51b6c68fb94c74f6c5",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "after": {
        "auth.users": {
          "count": 10,
          "handles": [
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "4aab5e9d4c637d4889c5e6656d0b4f3cc40f96f1eb934f8f37d8931770a2e9e8",
            "50f69e7ffc57b90d781fbf0af242ac0dc8ab1852459132fbeb5302bab4f53985",
            "8c074e92246a3d32952df62df6e8d4f50722b23d4ae143ec637c781cb5f856dc",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 17,
          "handles": [
            "07c80f292d7c484fb9dfdd5d74f0eeb3f4ba3a27de780b75ab66890d568611d1",
            "1a07716af0cf69febb39eabd22d42eaec92cdcfa992e192c030c5d184960d17d",
            "1c9455b8ec9e8107c276b642152cb2c8dce9df1b1fd157779e9b1717ed086661",
            "279f35a39bc4e2ffa3b8b7118cffcb0444ba07cc0717f9601a7919296b1da522",
            "2c2e7be9ce9a7458fc1616a7f13ef2091e3b8e85e7ee2221ef79fa2e6ffb4952",
            "3266618c606e6320157d6d1176c95657a7230f343588af94114d214c2cb61e9c",
            "3fc385f3961db3241d0413b94913f5caf15323577cba03b0d05dd3e25696f922",
            "4dac6cbda148c0dac1d00c305444f883f173ba5efa04e8d7f9fef5ea3cfc7552",
            "67e5b60041be08d9989933330864dc5af557d42ba95fda51b6c68fb94c74f6c5",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "expected": "rejected-without-authority",
      "actual": "rejected-without-authority",
      "guard": true
    },
    {
      "id": "reused-intent",
      "fixtures": [
        "41d94ffd9371aea48df781b55c725d1c4896292544d2b71d24e22229af75c245",
        "b2e3872d4820363a5665bd2bd932509dcb33f4f9fd5d8066f320c24a641ee18a"
      ],
      "before": {
        "auth.users": {
          "count": 11,
          "handles": [
            "04bb1d7da8f6166cae9a35fe8a94e2c6db01dee87b489f2f270e1b7c3c1ab49c",
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "4aab5e9d4c637d4889c5e6656d0b4f3cc40f96f1eb934f8f37d8931770a2e9e8",
            "50f69e7ffc57b90d781fbf0af242ac0dc8ab1852459132fbeb5302bab4f53985",
            "8c074e92246a3d32952df62df6e8d4f50722b23d4ae143ec637c781cb5f856dc",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 18,
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
            "67e5b60041be08d9989933330864dc5af557d42ba95fda51b6c68fb94c74f6c5",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "after": {
        "auth.users": {
          "count": 11,
          "handles": [
            "04bb1d7da8f6166cae9a35fe8a94e2c6db01dee87b489f2f270e1b7c3c1ab49c",
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
            "4aab5e9d4c637d4889c5e6656d0b4f3cc40f96f1eb934f8f37d8931770a2e9e8",
            "50f69e7ffc57b90d781fbf0af242ac0dc8ab1852459132fbeb5302bab4f53985",
            "8c074e92246a3d32952df62df6e8d4f50722b23d4ae143ec637c781cb5f856dc",
            "a51d72d896e8c3a0a3be8bb1b9888363231250f646d560fa9ff5611c13dc0729",
            "a6d90cb15ce300534b3c2c415cbdc45dc4055e249a2691f5b477fe62f5511649",
            "a74a6084fe8ce2f9caab95935b9512fdccb62533af9fd222b0bc12594cce943c",
            "c73de56525c750811a86d1f161b96c5adf30ff0ca284cf371f12f7d1aeaca916",
            "e8209838435b56bc4324294d30f228fc5d78c39a754dbf8a72b9652e498d713a"
          ]
        },
        "support_private.support_intents": {
          "count": 18,
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
            "67e5b60041be08d9989933330864dc5af557d42ba95fda51b6c68fb94c74f6c5",
            "7e9b42b93e3f6fcfb416f9fba5b34c383b074e864d8baae4d41cbaef28a183b2",
            "8596daaabae06daaeadc8ef3607dcf511c94421f8c4cdf5925dd215137160494",
            "93c51e0d90de21b3401a39fefa29c559ed59264c2fb3b05efe4fe1132c659c34",
            "9d1dfd29c26e8cf2cfaabfacda12c3bb58e65b54f1ae6eaad7f84f8467dbd234",
            "ac5df1001993a5d30e78f2a9471626374cee5db42030978807043930a4cc3d18",
            "b99043bc42f86a86aad133fae3186d582b82022be4e1eef2b703c1da3c90c1f0",
            "b9c4fbc394a0c1360852a5b7fb1c3b613b530bd836a3185fa1a60df3ddd3c41a",
            "c31c98da247918e7570ac3e75485b245d89cd6a2b816404f1787fe7e1cdb636a"
          ]
        },
        "support_private.supporters": {
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 5,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "expected": "rejected-without-authority",
      "actual": "rejected-without-authority",
      "guard": true
    },
    {
      "id": "sequential-replay",
      "fixtures": [
        "18a7e5fdcc8879d707f3e6b02e562d9e69fdb81d3a1d9375281b823fba83c626",
        "3c58abdb78373321e46d3cc8858856a6f48d211a8b3428a03d302868e74e70cb",
        "4c16d0ebc01fe2ae8bc5c633e94998ac42d008c85407bca3455ace0fa918a295",
        "876f82579b93b596f437cd7d7c556bcf0cd3cba97198516c64719f4b3e608ebc",
        "ed6ae03ccf3bed55fcdd1103eefd1fdc090ebfa3b273af46b0b96905d4b99fbb"
      ],
      "before": {
        "auth.users": {
          "count": 12,
          "handles": [
            "04bb1d7da8f6166cae9a35fe8a94e2c6db01dee87b489f2f270e1b7c3c1ab49c",
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
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
          "count": 19,
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
          "count": 2,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 6,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e21fc6f1e98edac4d19074af7038fc701e285400d98019f6c95055b320afee62",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 2,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 4,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "after": {
        "auth.users": {
          "count": 12,
          "handles": [
            "04bb1d7da8f6166cae9a35fe8a94e2c6db01dee87b489f2f270e1b7c3c1ab49c",
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
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
          "count": 19,
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
          "count": 3,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "2895bdf7b9967799ce17cf8c52eeacd2e1123ae0de3174fdf6e0f6f18b77159e",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 6,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e21fc6f1e98edac4d19074af7038fc701e285400d98019f6c95055b320afee62",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 3,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "a2fe61f003b0a6e67d44f81d4d666fce7326a45e63c558466329bd06fe93b00b",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 5,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "8cbcb2819a22b64b55ac2ba3534b5bef69957d5d7196d90e5f30e89371cd4bcf",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "first_after": {
        "auth.users": {
          "count": 12,
          "handles": [
            "04bb1d7da8f6166cae9a35fe8a94e2c6db01dee87b489f2f270e1b7c3c1ab49c",
            "2a45e0a73513e968815805b6a43ffb36d0e20a4910996bd4a40149304232b50b",
            "322ef6b20805c8c349bd49f727a1ed1f5df775f3390f76fdc7a10d204d2e2b96",
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
          "count": 19,
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
          "count": 3,
          "handles": [
            "127427c03c01f9a6e7866eda6ff06614112be3ae617112a1df403e34253b952d",
            "2895bdf7b9967799ce17cf8c52eeacd2e1123ae0de3174fdf6e0f6f18b77159e",
            "b32e920d2a1eb83eaf56347ed7c8982d581d868fb6695e89d6f746af56d6ebd2"
          ]
        },
        "support_private.checkout_sessions": {
          "count": 6,
          "handles": [
            "7a01b72f9591116947bafd30dcc96235d81fa95d676513e65906262c436ad61f",
            "84e95278442b487718062b76c247a5c370c6a34a595de2a00c8dbe0c587d1cc3",
            "917c6424a1432d44a90e1e8eb595c31fbcf9f5703baa5590d82aa81d650451c3",
            "c9f8fc0324598c2c98c84f46280aaa81376230a970f5c8ca6898e15501e02479",
            "e21fc6f1e98edac4d19074af7038fc701e285400d98019f6c95055b320afee62",
            "e7a9c57d7b27b3e790becfb790cbfdbbc5f8be3247d9f0be18d5b523dc2895c8"
          ]
        },
        "support_private.stripe_events": {
          "count": 3,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "a2fe61f003b0a6e67d44f81d4d666fce7326a45e63c558466329bd06fe93b00b",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 5,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "8cbcb2819a22b64b55ac2ba3534b5bef69957d5d7196d90e5f30e89371cd4bcf",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "responses": [
        200,
        200
      ],
      "expected": "idempotent-replay",
      "actual": "idempotent-replay",
      "guard": true
    },
    {
      "id": "concurrent-replay-settlement",
      "fixtures": [
        "1e6fec27aa842ab9abb8698465e2c2f3ad12dbac21ef5edd679979e2a92e1a46",
        "41c594b6cb07e1aaf44c942e19455a14eda459d11040d40b51f90f7e922f6c9c",
        "7add68b6279f2c39052a93736878cce2af40c7747b09d8e9c844737aa4baa8bb",
        "915b90b20f700141cf9084e9978bddb896ee0a64a6a9cec95c9d75f7908466cb",
        "ad5021688182a68c883eeb9b403638cc83a23d1943a8a2847c869e0104952ba7"
      ],
      "before": {
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
          "count": 3,
          "handles": [
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
          "count": 3,
          "handles": [
            "8bc45aa3937225e7194c5655f85c39b9526b282bff28823e4bc12a4647ce5e00",
            "a2fe61f003b0a6e67d44f81d4d666fce7326a45e63c558466329bd06fe93b00b",
            "fa91fedf8fe7dfab0455172bccaec151aa4674b23c1d3a32a5aa020eef0c4fcd"
          ]
        },
        "support_private.installation_bindings": {
          "count": 5,
          "handles": [
            "282cc717f21c8c19e41cb77e1d1ca9c84f52ad741ec4f402aa27f20631773e5f",
            "54e1616cd04c3da8671e94ded8aed8a5ee8c31e05083ce46066a7c61991c2870",
            "8cbcb2819a22b64b55ac2ba3534b5bef69957d5d7196d90e5f30e89371cd4bcf",
            "cbdfee93a9c133d9ea5900da916ba8682fa716c3d836c0242dd0e47a10d8074b",
            "f79f3ec76c9c01bb0c0ab1c3d3b1e17557c35d8f0fe45e1474683a5807ee9273"
          ]
        }
      },
      "after": {
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
      "responses": [
        200,
        200
      ],
      "expected": "single-authority-settlement",
      "actual": "single-authority-settlement",
      "guard": true
    }
  ],
  "fixture_manifest": {
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
  "artifacts": {
    "deployment_evidence_sha256": "536d848db6e26d0dd53383b158391a6e26d1a1a9ae78b9b67a16bac51974cb3a",
    "hostile_run_evidence_sha256": "5156b0978619fcfcc68345f2e5bdc88afa3045d25e0826eff52c00ba85111aef",
    "marker_sha256": "7f1a86a0b06e591d4832a86ed8e5d97072b8bc333412d8fe8168538887a63cbd"
  },
  "approval": {
    "status": "approved",
    "approved_on": "2026-09-03",
    "run_id": "33754289126",
    "run_evidence_sha256": "5156b0978619fcfcc68345f2e5bdc88afa3045d25e0826eff52c00ba85111aef",
    "scope": "exact-manifest-cleanup-and-same-project-promotion"
  }
}
-->
