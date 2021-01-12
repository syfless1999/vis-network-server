#include "clusterMethod.h"

int clusterMethod::add(int a, int b)
{
  return a + b;
}

Napi::Number clusterMethod::addWrapper(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (info.Length() < 2 && !info[0].IsNumber() && !info[1].IsNumber())
  {
    Napi::TypeError::New(env, "Param type must be number").ThrowAsJavaScriptException();
  }
  Napi::Number first = info[0].As<Napi::Number>();
  Napi::Number second = info[1].As<Napi::Number>();

  int result = clusterMethod::add(first.Int32Value(), second.Int32Value());
  return Napi::Number::New(env, result);
}

Napi::Object clusterMethod::Init(Napi::Env env, Napi::Object exports)
{
  exports.Set("add", Napi::Function::New(env, clusterMethod::addWrapper));
  return exports;
}