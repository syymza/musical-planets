"""Run the JS checks with macOS's built-in JavaScriptCore; no dependencies."""
import ctypes
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
js = ctypes.CDLL('/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/JavaScriptCore')
ptr = ctypes.c_void_p
js.JSGlobalContextCreate.argtypes = [ptr]
js.JSGlobalContextCreate.restype = ptr
js.JSStringCreateWithUTF8CString.argtypes = [ctypes.c_char_p]
js.JSStringCreateWithUTF8CString.restype = ptr
js.JSEvaluateScript.argtypes = [ptr, ptr, ptr, ptr, ctypes.c_int, ctypes.POINTER(ptr)]
js.JSEvaluateScript.restype = ptr
js.JSValueToStringCopy.argtypes = [ptr, ptr, ctypes.POINTER(ptr)]
js.JSValueToStringCopy.restype = ptr
js.JSStringGetMaximumUTF8CStringSize.argtypes = [ptr]
js.JSStringGetMaximumUTF8CStringSize.restype = ctypes.c_size_t
js.JSStringGetUTF8CString.argtypes = [ptr, ctypes.c_char_p, ctypes.c_size_t]
js.JSStringGetUTF8CString.restype = ctypes.c_size_t
js.JSStringRelease.argtypes = [ptr]
js.JSGlobalContextRelease.argtypes = [ptr]
context = js.JSGlobalContextCreate(None)
code = 'globalThis.testHTML=' + json.dumps((root / 'index.html').read_text()) + ';\n'
code += (root / 'tests/lane-crossings.js').read_text() + '\nglobalThis.testResult;'
script = js.JSStringCreateWithUTF8CString(code.encode())
error = ptr()
value = js.JSEvaluateScript(context, script, None, None, 1, ctypes.byref(error))
result = js.JSValueToStringCopy(context, error if error.value else value, None)
size = js.JSStringGetMaximumUTF8CStringSize(result)
buffer = ctypes.create_string_buffer(size)
js.JSStringGetUTF8CString(result, buffer, size)
print(buffer.value.decode())
js.JSStringRelease(result)
js.JSStringRelease(script)
js.JSGlobalContextRelease(context)
raise SystemExit(1 if error.value else 0)
