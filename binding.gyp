{
  "targets": [
    {
      "target_name": "directory_exchange",
      "sources": ["src/native/directory-exchange.cc"],
      "cflags_cc": ["-std=c++20"],
      "xcode_settings": {
        "CLANG_CXX_LANGUAGE_STANDARD": "c++20"
      }
    }
  ]
}
