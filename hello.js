var ffi =require('ffi-napi')
var ref = require('ref-napi');

// Define Winapi types according to 
//  https://msdn.microsoft.com/en-us/library/windows/desktop/aa383751%28v=vs.85%29.aspx
var winapi = {};
winapi.void = ref.types.void;
winapi.PVOID = ref.refType(winapi.void);
winapi.HANDLE = winapi.PVOID;
winapi.HWND = winapi.HANDLE;
winapi.WCHAR = ref.types.char;
winapi.LPCWSTR = ref.types.CString;
winapi.UINT = ref.types.uint;
var current = ffi.Library("User32.dll", {  'MessageBoxA': [ 'int', [ winapi.HWND, winapi.LPCWSTR, winapi.LPCWSTR, winapi.UINT ] ]});
current.MessageBoxA(ref.NULL, "Mire", "un programa", 0);
