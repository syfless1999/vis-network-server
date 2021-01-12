#include "napi.h"
#include "src/clusterMethod.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
  return clusterMethod::Init(env, exports);
}
NODE_API_MODULE(addon, InitAll);