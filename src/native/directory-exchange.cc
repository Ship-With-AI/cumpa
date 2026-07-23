#include <node_api.h>

#include <cerrno>
#include <cstring>
#include <string>

#if defined(__APPLE__)
#include <fcntl.h>
#include <stdio.h>
#include <sys/stat.h>
#include <unistd.h>
#endif

namespace {

enum class ExchangeResult { kSupported, kUnsupported, kFailed };

napi_value result(napi_env env, ExchangeResult value) {
  const char* kind = value == ExchangeResult::kSupported
      ? "supported"
      : value == ExchangeResult::kUnsupported ? "unsupported" : "failed";
  napi_value output;
  napi_value kind_value;
  napi_create_object(env, &output);
  napi_create_string_utf8(env, kind, NAPI_AUTO_LENGTH, &kind_value);
  napi_set_named_property(env, output, "kind", kind_value);
  return output;
}

bool string_argument(napi_env env, napi_value value, std::string* output) {
  size_t length = 0;
  if (napi_get_value_string_utf8(env, value, nullptr, 0, &length) != napi_ok || length == 0 || length > 4096) {
    return false;
  }
  output->resize(length + 1);
  size_t copied = 0;
  const bool parsed = napi_get_value_string_utf8(env, value, output->data(), length + 1, &copied) == napi_ok && copied == length;
  output->resize(copied);
  return parsed;
}

bool child_name(const std::string& value) {
  return !value.empty() && value != "." && value != ".." && value.find('/') == std::string::npos && value.find('\\') == std::string::npos;
}

#if defined(__APPLE__)
bool regular_pair(int directory) {
  for (const char* name : {"review.json", "review.md"}) {
    struct stat status {};
    if (fstatat(directory, name, &status, AT_SYMLINK_NOFOLLOW) != 0 || !S_ISREG(status.st_mode)) {
      return false;
    }
  }
  return true;
}

ExchangeResult exchange(int root, const char* stable, const char* candidate) {
  struct stat stable_status {};
  struct stat candidate_status {};
  if (fstatat(root, stable, &stable_status, AT_SYMLINK_NOFOLLOW) != 0 ||
      fstatat(root, candidate, &candidate_status, AT_SYMLINK_NOFOLLOW) != 0 ||
      !S_ISDIR(stable_status.st_mode) || !S_ISDIR(candidate_status.st_mode) ||
      stable_status.st_dev != candidate_status.st_dev) {
    return ExchangeResult::kFailed;
  }

  const int stable_fd = openat(root, stable, O_RDONLY | O_DIRECTORY | O_NOFOLLOW);
  const int candidate_fd = openat(root, candidate, O_RDONLY | O_DIRECTORY | O_NOFOLLOW);
  if (stable_fd < 0 || candidate_fd < 0) {
    if (stable_fd >= 0) close(stable_fd);
    if (candidate_fd >= 0) close(candidate_fd);
    return ExchangeResult::kFailed;
  }
  const bool valid = regular_pair(stable_fd) && regular_pair(candidate_fd);
  close(stable_fd);
  close(candidate_fd);
  if (!valid) return ExchangeResult::kFailed;

  if (renameatx_np(root, stable, root, candidate, RENAME_SWAP) == 0) {
    return ExchangeResult::kSupported;
  }
  return (errno == ENOTSUP || errno == ENOSYS) ? ExchangeResult::kUnsupported : ExchangeResult::kFailed;
}

bool write_pair(int root, const char* name, const char* json, const char* markdown) {
  if (mkdirat(root, name, 0700) != 0) return false;
  const int directory = openat(root, name, O_RDONLY | O_DIRECTORY | O_NOFOLLOW);
  if (directory < 0) return false;
  const struct File { const char* name; const char* bytes; } files[] = {
    {"review.json", json}, {"review.md", markdown},
  };
  for (const auto& file : files) {
    const int file_fd = openat(directory, file.name, O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW, 0600);
    if (file_fd < 0 || write(file_fd, file.bytes, std::strlen(file.bytes)) < 0 || close(file_fd) != 0) {
      if (file_fd >= 0) close(file_fd);
      close(directory);
      return false;
    }
  }
  close(directory);
  return true;
}
#endif

napi_value exchange_directories(napi_env env, napi_callback_info info) {
  size_t argc = 3;
  napi_value args[3];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  if (argc != 3) return result(env, ExchangeResult::kFailed);

  std::string root_path;
  std::string stable;
  std::string candidate;
  if (!string_argument(env, args[0], &root_path) || !string_argument(env, args[1], &stable) ||
      !string_argument(env, args[2], &candidate) || !child_name(stable) || !child_name(candidate) || stable == candidate) {
    return result(env, ExchangeResult::kFailed);
  }

#if defined(__APPLE__)
  const int root = open(root_path.c_str(), O_RDONLY | O_DIRECTORY | O_NOFOLLOW);
  if (root < 0) return result(env, ExchangeResult::kFailed);
  const ExchangeResult exchanged = exchange(root, stable.c_str(), candidate.c_str());
  close(root);
  return result(env, exchanged);
#else
  return result(env, ExchangeResult::kUnsupported);
#endif
}

napi_value probe_directory_exchange(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  std::string root_path;
  if (argc != 1 || !string_argument(env, args[0], &root_path)) return result(env, ExchangeResult::kFailed);

#if defined(__APPLE__)
  const int root = open(root_path.c_str(), O_RDONLY | O_DIRECTORY | O_NOFOLLOW);
  if (root < 0) return result(env, ExchangeResult::kFailed);
  const bool created = write_pair(root, "stable", "old-json", "old-markdown") &&
      write_pair(root, "candidate", "new-json", "new-markdown");
  const ExchangeResult exchanged = created ? exchange(root, "stable", "candidate") : ExchangeResult::kFailed;
  close(root);
  return result(env, exchanged);
#else
  return result(env, ExchangeResult::kUnsupported);
#endif
}

napi_value initialize(napi_env env, napi_value exports) {
  napi_property_descriptor methods[] = {
    {"exchangeDirectories", nullptr, exchange_directories, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"probeDirectoryExchange", nullptr, probe_directory_exchange, nullptr, nullptr, nullptr, napi_default, nullptr},
  };
  napi_define_properties(env, exports, 2, methods);
  return exports;
}

}  // namespace

NAPI_MODULE(NODE_GYP_MODULE_NAME, initialize)
