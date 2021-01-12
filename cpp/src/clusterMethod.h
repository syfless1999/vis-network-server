#include "napi.h"

namespace clusterMethod
{
  int add(int a, int b);
  Napi::Number addWrapper(const Napi::CallbackInfo &info);
  Napi::Object Init(Napi::Env env, Napi::Object exports);
} // namespace clusterMethod