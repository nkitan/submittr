#include <v8.h>
#include <node.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <errno.h>

using namespace v8;
using namespace node;


void Waitpid(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  Local<Context> context = isolate->GetCurrentContext();
  HandleScope scope(isolate);

  int r, child, status;

  if (args[0]->IsInt32()) {
    child = args[0]->Int32Value(context).ToChecked();

    do {
      r = waitpid(child, &status, 0);
    } while (r != -1);

    Local<Object> result = Object::New(isolate);
    
    args.GetReturnValue().Set(result);

    if (WIFEXITED(status)) {
      result->Set(context,String::NewFromUtf8Literal(isolate, "exitCode"), Integer::New(isolate, WEXITSTATUS(status)));
      result->Set(context,String::NewFromUtf8Literal(isolate, "signalCode"), Null(isolate));
      return;
    }
    else if (WIFSIGNALED(status)) {
      result->Set(context,String::NewFromUtf8Literal(isolate, "exitCode"), Null(isolate));
      result->Set(context,String::NewFromUtf8Literal(isolate, "signalCode"), Integer::New(isolate, WTERMSIG(status)));
      return;
    }
  }
  else {
      isolate->ThrowException(Exception::TypeError(String::NewFromUtf8Literal(isolate, "Not an integer.")));
  }
}

void Initialize(Local<Object> exports) {
  NODE_SET_METHOD(exports, "waitpid", Waitpid);
}

NODE_MODULE(waitpid, Initialize)
