var ffi =require('ffi-napi')
var ref = require('ref-napi');
var ArrayType =require('ref-array-napi');
var StructType = require('ref-struct-napi');
var Union = require('ref-union-di')(ref);
var wchar_size = process.platform == 'win32' ? 2 : 4;
ref.types.wchar_t = ref.types.ushort;
ref.types.WCString = Object.create(ref.types.CString)
ref.types.WCString.get = function get (buf, offset) {
  var _buf = buf.readPointer(offset)
  if (_buf.isNull()) {
    return null
  }
  var stringBuf = _buf.reinterpretUntilZeros(wchar_size)
  return stringBuf.toString('utf16le') // TODO: decode UTF-32 on Unix
};
ref.types.WCString.set = function set (buf, offset, val) {
  // TODO: better UTF-16 and UTF-32 encoding
  var _buf = new Buffer((val.length + 1) * wchar_size)
  _buf.fill(0)
  var l = 0
  for (var i = wchar_size - 1; i < _buf.length; i += wchar_size) {
    _buf[i] = val.charCodeAt(l++)
  }
  return buf.writePointer(_buf, offset)
};
// Define Winapi types according to 
//  https://msdn.microsoft.com/en-us/library/windows/desktop/aa383751%28v=vs.85%29.aspx
var winapi = {};
//LP,P,NP,SP, this is overkill but why did microsoft just made so many names for the same thing?
//we have to execute this many times because structs contain pointers already and they're referenced as pointers as well
function createWinapiPointers(overkill=false){
Object.keys(winapi).forEach(_=>{if(!winapi.pointers.includes(_)){
	winapi.pointers.push(_);
	((a,l,f)=>l.split('').reduce(f,a))(["LP","P","NP","SP"],overkill?"CUNZZ":"C",(ar,l)=>ar.map(a=>a+l).concat(ar)).map(a=>a+_).forEach(t=>{
	winapi[t]=ref.refType(winapi[_]);
	winapi.pointers.push(t);
	})
}})
}
winapi.fn = {};
winapi.pointers=["fn","pointers","LPCSTR","PCZPCWSTR","PZPWSTR","PCZPWSTR"];
winapi.WCHAR=winapi.WSTR= ref.types.wchar_t;
createWinapiPointers(true);
winapi.PCZPCWSTR=winapi.PZPWSTR=winapi.PCZPWSTR=ref.refType(winapi.PWSTR);
winapi.WCH=winapi.WSTR;
winapi.NWPSTR=winapi.PWCHAR;
winapi.VOID= ref.types.void;
winapi.HANDLE = ref.refType(ref.refType(ref.types.void));//Honestly, what is the difference between a struct of 1 integer and just the integer itself? *thinking face emoji*
//Handles
winapi.INT= ref.types.int;
winapi.FLOAT= ref.types.float;
winapi.ULONG= ref.types.ulong;
winapi.LONG = ref.types.long;
winapi.CHAR = ref.types.char;
createWinapiPointers();

winapi.LPSTR= winapi.LPCSTR = ref.types.CString;
winapi.UINT = ref.types.uint;
winapi.SHORT = ref.types.short;
winapi.USHORT = ref.types.ushort;
winapi.LONG_PTR = ref.types.long;
winapi.ULONG_PTR = ref.types.ulong;
winapi.LRESULT = winapi.LONG_PTR;
winapi.LPARAM = winapi.LONG_PTR;
winapi.UINT_PTR = ref.types.uint;
winapi.INT_PTR = ref.types.int;
winapi.LONG_PTR = ref.types.long;
winapi.WPARAM = winapi.UINT_PTR;
winapi.WORD = ref.types.ushort;
winapi.DWORD = ref.types.ulong;
winapi.ATOM = winapi.WORD;
winapi.BOOL = ref.types.int;
winapi.BYTE = ref.types.uchar;
winapi.CALLBACK = ref.types.void;
winapi.BOOLEAN = winapi.BYTE;
//what is _MAC?
winapi.HFILE= ref.types.int;
//if strict winapi.HGDIOBJ = ref.refType(ref.types.void);
["WND","HOOK","GDIOBJ","EVENT","ICON","INSTANCE","MODULE","RGN","BRUSH","KL","LOCAL","ACCEL","BITMAP","CURSOR","STR","WINSTA","LSURF","SPRITE","RSRC","METAFILE","GLOBAL","LOCAL","COLORSPACE","DC","GLRC","DESK","ENHMETAFILE","FONT","MENU","PALETTE","PEN","WINEVENTHOOK","MONITOR","UMPD","DWP","GESTUREINFO","TOUCHINPUT","SYNTHETICPOINTERDEVICE"].forEach(_=>{winapi["H"+_]=winapi.HANDLE});
winapi.GLOBALHANDLE = winapi.HANDLE;
winapi.LOCALHANDLE = winapi.HANDLE;
winapi.DPI_AWARENESS_CONTEXT = winapi.HANDLE;
winapi.COLORREF = winapi.DWORD;
winapi.POINTER_INPUT_TYPE=winapi.DWORD;
/*typedef struct tagWNDCLASSA {
  UINT      style;
  WNDPROC   lpfnWndProc;
  int       cbClsExtra;
  int       cbWndExtra;
  HINSTANCE hInstance;
  HICON     hIcon;
  HCURSOR   hCursor;
  HBRUSH    hbrBackground;
  LPCSTR    lpszMenuName;
  LPCSTR    lpszClassName;
} WNDCLASSA*/
winapi.ACCESS_MASK=winapi.DWORD;
createWinapiPointers();

winapi.RECT=winapi.RECTL=StructType({
	left:winapi.LONG,
	top:winapi.LONG,
	right:winapi.LONG,
	bottom:winapi.LONG
})
winapi.POINT=winapi.POINTL=StructType({
	x:winapi.LONG,
	y:winapi.LONG
})
winapi.POINTS=StructType({
	x:winapi.SHORT,
	y:winapi.SHORT
});
winapi.SIZE=StructType({
	cx:winapi.LONG,
	cy:winapi.LONG
});
winapi.PAINTSTRUCT=StructType({
	hdc:winapi.HDC,
	fErase:winapi.BOOL,
	rcPaint:winapi.RECT,
	fRestore:winapi.BOOL,
	fIncUpdate:winapi.BOOL,
	rgbReserved:ArrayType(winapi.BYTE,32)
});
winapi.ACCEL=StructType({
	fVirt:winapi.BYTE,
	key:winapi.WORD,
	cmd:winapi.WORD
});
winapi.CREATESTRUCTA=StructType({
	lpCreateParams:winapi.LPVOID,
	hInstance:winapi.HINSTANCE,
	hMenu:winapi.HMENU,
	hwndParent:winapi.HWND,
	cy:ref.types.int,
	cx:ref.types.int,
	y:ref.types.int,
	x:ref.types.int,
	style:winapi.LONG,
	lpszName:winapi.LPCSTR,
	lpszClass:winapi.LPCSTR,
	dwExStyle:winapi.DWORD
});
winapi.LUID=StructType({
	LowPart:winapi.DWORD,
	HighPart:winapi.LONG
});
winapi.BSMINFO=StructType({
	cbSize:winapi.UINT,
	hdesk:winapi.HDESK,
	hwnd:winapi.HWND,
	luid:winapi.LUID
});
winapi.MSG=StructType({
	hwnd:winapi.HWND,
	message:winapi.UINT,
	wParam:winapi.WPARAM,
	lParam:winapi.LPARAM,
	time:winapi.DWORD,
	pt:winapi.POINT,
//	lPrivate:winapi.DWORD,
});
winapi.DEVMODEA=StructType({
	dmDeviceName:ArrayType(winapi.BYTE,32),
	dmSpecVersion:winapi.WORD,
	dmDriverVersion:winapi.WORD,
	dmSize:winapi.WORD,
	dmDriverExtra:winapi.WORD,
	dmFields:winapi.DWORD,
	DUMMYUNIONNAME:new Union({
		DUMMYSTRUCTNAME:StructType({
			dmORiotation:ref.types.short,
			dmPaperSize:ref.types.short,
			dmPaperLength:ref.types.short,
			dmPaperWidth:ref.types.short,
			dmScale:ref.types.short,
			dmCopies:ref.types.short,
			dmDefaultSource:ref.types.short,
			dmPrintQuality:ref.types.short,
		 }),
		DUMMYSTRUCTNAME2:StructType({
			dmPosition:winapi.POINTL,
			dmDisplayOrientation:winapi.DWORD,
			dmDisplayFixedOutput:winapi.DWORD
		})
	}),
	dmColor:ref.types.short,
	dmDuplex:ref.types.short,
	dmYResolution:ref.types.short,
	dmTToption:ref.types.short,
	dmCollate:ref.types.short,
	dmFormName:ArrayType(winapi.WCHAR,32),
	dmLogPixels:winapi.WORD,
	dmBitsPerPel:winapi.DWORD,
	dmPelsWidth:winapi.DWORD,
	dmPelsHeight:winapi.DWORD,
	DUMMYUNIONNAME2:new Union({
		dmDisplayFlags:winapi.DWORD,
		dmNup:winapi.DWORD
	}),
	dmDisplayFrequency:winapi.DWORD,
	dmICMMethod:winapi.DWORD,
	dmICMIntent:winapi.DWORD,
	dmMediaType:winapi.DWORD,
	dmDitherType:winapi.DWORD,
	dmReserved1:winapi.DWORD,
	dmReserved2:winapi.DWORD,
	dmPanningWidth:winapi.DWORD,
	dmPanningHeight:winapi.DWORD,
});
winapi.DEVMODE=winapi.DEVMODEW=StructType({
	dmDeviceName:ArrayType(winapi.WCHAR,32),
	dmSpecVersion:winapi.WORD,
	dmDriverVersion:winapi.WORD,
	dmSize:winapi.WORD,
	dmDriverExtra:winapi.WORD,
	dmFields:winapi.DWORD,
	DUMMYUNIONNAME:new Union({
		DUMMYSTRUCTNAME:StructType({
			dmORiotation:ref.types.short,
			dmPaperSize:ref.types.short,
			dmPaperLength:ref.types.short,
			dmPaperWidth:ref.types.short,
			dmScale:ref.types.short,
			dmCopies:ref.types.short,
			dmDefaultSource:ref.types.short,
			dmPrintQuality:ref.types.short,
		 }),
		DUMMYSTRUCTNAME2:StructType({
			dmPosition:winapi.POINTL,
			dmDisplayOrientation:winapi.DWORD,
			dmDisplayFixedOutput:winapi.DWORD
		})
	}),
	dmColor:ref.types.short,
	dmDuplex:ref.types.short,
	dmYResolution:ref.types.short,
	dmTToption:ref.types.short,
	dmCollate:ref.types.short,
	dmFormName:ArrayType(winapi.WCHAR,32),
	dmLogPixels:winapi.WORD,
	dmBitsPerPel:winapi.DWORD,
	dmPelsWidth:winapi.DWORD,
	dmPelsHeight:winapi.DWORD,
	DUMMYUNIONNAME2:new Union({
		dmDisplayFlags:winapi.DWORD,
		dmNup:winapi.DWORD
	}),
	dmDisplayFrequency:winapi.DWORD,
	dmICMMethod:winapi.DWORD,
	dmICMIntent:winapi.DWORD,
	dmMediaType:winapi.DWORD,
	dmDitherType:winapi.DWORD,
	dmReserved1:winapi.DWORD,
	dmReserved2:winapi.DWORD,
	dmPanningWidth:winapi.DWORD,
	dmPanningHeight:winapi.DWORD,
});
winapi.CHANGEFILTERSTRUCT=StructType({
	cbSize:winapi.DWORD,
	ExtStatus:winapi.DWORD
});
winapi.SECURITY_ATTRIBUTES=StructType({
	nLength:winapi.DWORD,
	lpSecurityDescriptor:winapi.LPVOID,
	bInheritHandle:winapi.BOOL
});
winapi.DLGTEMPLATEA=winapi.DLGTEMPLATEW=winapi.DLGTEMPLATE=StructType({
	style:winapi.DWORD,
	dwExtendedStyle:winapi.DWORD,
	cdit:winapi.WORD,
	x:ref.types.short,
	y:ref.types.short,
	cx:ref.types.short,
	lcy:ref.types.short,
});
winapi.ICONINFO=StructType({
	fIcon:winapi.BOOL,
	xHotspot:winapi.DWORD,
	yHotspot:winapi.DWORD,
	hbmMask:winapi.HBITMAP,
	hbmColor:winapi.HBITMAP,
});

//enum
;["DPI_AWARENESS","DPI_HOSTING_BEGAVIOR","POINTER_FEEDBACK_MODE"].forEach(_=>{winapi[_]=ref.types.int});
winapi.fn.WNDPROC = [winapi.LRESULT,[winapi.HWND,winapi.UINT,winapi.WPARAM,winapi.LPARAM]];
winapi.fn.DLGPROC = [winapi.INT_PTR,[winapi.HWND,winapi.UINT,winapi.WPARAM,winapi.LPARAM]];
Object.keys(winapi.fn).forEach(_=>{winapi[_]=winapi.PVOID});
winapi.WNDCLASSA = StructType({
	style: winapi.UINT,
	lpfnWndProc: winapi.WNDPROC,
	cbClsExtra: ref.types.int,
	cbWndExtra: ref.types.int,
	hInstance: winapi.HINSTANCE,
	hIcon: winapi.HICON,
	hCursor: winapi.HCURSOR,
	hbrBackground: winapi.HBRUSH,
	lpszMenuName: winapi.LPCSTR,
	lpszClassName: winapi.LPCSTR
});
winapi.WNDCLASSEXA=StructType({
	cbSize:winapi.UINT,
	style:winapi.UINT,
	lpfnWndProc:winapi.WNDPROC,
	cbClsExtra:ref.types.int,
	cbWndExtra:ref.types.int,
	hInstance:winapi.HINSTANCE,
	hIcon:winapi.HICON,
	hCursor:winapi.HCURSOR,
	hbrBackground:winapi.HBRUSH,
	lpszMenuName:winapi.LPCSTR,
	lpszClassName:winapi.LPCSTR,
	hIconSm:winapi.HICON
});
winapi.WNDCLASSEXW=StructType({
	cbSize:winapi.UINT,
	style:winapi.UINT,
	lpfnWndProc:winapi.WNDPROC,
	cbClsExtra:ref.types.int,
	cbWndExtra:ref.types.int,
	hInstance:winapi.HINSTANCE,
	hIcon:winapi.HICON,
	hCursor:winapi.HCURSOR,
	hbrBackground:winapi.HBRUSH,
	lpszMenuName:winapi.LPCWSTR,
	lpszClassName:winapi.LPCSTR,
	hIconSm:winapi.HICON
});


createWinapiPointers();

//console.log(JSON.stringify(winapi));


var current = ffi.Library("User32.dll", {  'MessageBoxA': [ 'int', [ winapi.HWND, winapi.LPCSTR, winapi.LPCSTR, winapi.UINT ] ],
'RegisterClassA':[winapi.ATOM,[ref.refType(winapi.WNDCLASSA)]],
ActivateKeyboardLayout: [winapi.HKL, [winapi.HKL, winapi.UINT]],
	AddClipboardFormatListener: [winapi.BOOL, [winapi.HWND]],
	AdjustWindowRect: [winapi.BOOL, [winapi.LPRECT, winapi.DWORD, winapi.BOOL]],
	AdjustWindowRectEx: [winapi.BOOL, [winapi.LPRECT, winapi.DWORD, winapi.BOOL, winapi.DWORD]],
	AdjustWindowRectExForDpi: [winapi.BOOL, [winapi.LPRECT, winapi.DWORD, winapi.BOOL, winapi.DWORD, winapi.UINT]],
	AllowSetForegroundWindow: [winapi.BOOL, [winapi.DWORD]],
	AnimateWindow: [winapi.BOOL, [winapi.HWND, winapi.DWORD, winapi.DWORD]],
	AnyPopup: [winapi.BOOL, []],
	AppendMenuA: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT_PTR, winapi.LPCSTR]],
	AppendMenuW: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT_PTR, winapi.LPCWSTR]],
	AreDpiAwarenessContextsEqual: [winapi.BOOL, [winapi.DPI_AWARENESS_CONTEXT, winapi.DPI_AWARENESS_CONTEXT]],
	ArrangeIconicWindows: [winapi.UINT, [winapi.HWND]],
	AttachThreadInput: [winapi.BOOL, [winapi.DWORD, winapi.DWORD, winapi.BOOL]],
	BeginDeferWindowPos: [winapi.HDWP, [winapi.INT]],
	BeginPaint: [winapi.HDC, [winapi.HWND, winapi.LPPAINTSTRUCT]],
	BlockInput: [winapi.BOOL, [winapi.BOOL]],
	BringWindowToTop: [winapi.BOOL, [winapi.HWND]],
	BroadcastSystemMessage: [winapi.LONG, [winapi.DWORD, winapi.LPDWORD, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	BroadcastSystemMessageExA: [winapi.LONG, [winapi.DWORD, winapi.LPDWORD, winapi.UINT, winapi.WPARAM, winapi.LPARAM, winapi.PBSMINFO]],
	BroadcastSystemMessageExW: [winapi.LONG, [winapi.DWORD, winapi.LPDWORD, winapi.UINT, winapi.WPARAM, winapi.LPARAM, winapi.PBSMINFO]],
	BroadcastSystemMessageW: [winapi.LONG, [winapi.DWORD, winapi.LPDWORD, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	CalculatePopupWindowPosition: [winapi.BOOL, [winapi.POINT, winapi.SIZE, winapi.UINT, winapi.RECT, winapi.RECT]],
	CallMsgFilterA: [winapi.BOOL, [winapi.LPMSG, winapi.INT]],
	CallMsgFilterW: [winapi.BOOL, [winapi.LPMSG, winapi.INT]],
	CallNextHookEx: [winapi.LRESULT, [winapi.HHOOK, winapi.INT, winapi.WPARAM, winapi.LPARAM]],
	CallWindowProcA: [winapi.LRESULT, [winapi.WNDPROC, winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	CallWindowProcW: [winapi.LRESULT, [winapi.WNDPROC, winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	CascadeWindows: [winapi.WORD, [winapi.HWND, winapi.UINT, winapi.RECT, winapi.UINT, winapi.HWND]],
	ChangeClipboardChain: [winapi.BOOL, [winapi.HWND, winapi.HWND]],
	ChangeDisplaySettingsA: [winapi.LONG, [winapi.DEVMODEA, winapi.DWORD]],
	ChangeDisplaySettingsExA: [winapi.LONG, [winapi.LPCSTR, winapi.DEVMODEA, winapi.HWND, winapi.DWORD, winapi.LPVOID]],
	ChangeDisplaySettingsExW: [winapi.LONG, [winapi.LPCWSTR, winapi.DEVMODEW, winapi.HWND, winapi.DWORD, winapi.LPVOID]],
	ChangeDisplaySettingsW: [winapi.LONG, [winapi.DEVMODEW, winapi.DWORD]],
	ChangeWindowMessageFilter: [winapi.BOOL, [winapi.UINT, winapi.DWORD]],
	ChangeWindowMessageFilterEx: [winapi.BOOL, [winapi.HWND, winapi.UINT, winapi.DWORD, winapi.PCHANGEFILTERSTRUCT]],
	CharLowerA: [winapi.LPSTR, [winapi.LPSTR]],
	CharLowerBuffA: [winapi.DWORD, [winapi.LPSTR, winapi.DWORD]],
	CharLowerBuffW: [winapi.DWORD, [winapi.LPWSTR, winapi.DWORD]],
	CharLowerW: [winapi.LPWSTR, [winapi.LPWSTR]],
	CharNextA: [winapi.LPSTR, [winapi.LPCSTR]],
	CharNextExA: [winapi.LPSTR, [winapi.WORD, winapi.LPCSTR, winapi.DWORD]],
	CharNextW: [winapi.LPWSTR, [winapi.LPCWSTR]],
	CharPrevA: [winapi.LPSTR, [winapi.LPCSTR, winapi.LPCSTR]],
	CharPrevExA: [winapi.LPSTR, [winapi.WORD, winapi.LPCSTR, winapi.LPCSTR, winapi.DWORD]],
	CharPrevW: [winapi.LPWSTR, [winapi.LPCWSTR, winapi.LPCWSTR]],
	CharToOemA: [winapi.BOOL, [winapi.LPCSTR, winapi.LPSTR]],
	CharToOemBuffA: [winapi.BOOL, [winapi.LPCSTR, winapi.LPSTR, winapi.DWORD]],
	CharToOemBuffW: [winapi.BOOL, [winapi.LPCWSTR, winapi.LPSTR, winapi.DWORD]],
	CharToOemW: [winapi.BOOL, [winapi.LPCWSTR, winapi.LPSTR]],
	CharUpperA: [winapi.LPSTR, [winapi.LPSTR]],
	CharUpperBuffA: [winapi.DWORD, [winapi.LPSTR, winapi.DWORD]],
	CharUpperBuffW: [winapi.DWORD, [winapi.LPWSTR, winapi.DWORD]],
	CharUpperW: [winapi.LPWSTR, [winapi.LPWSTR]],
	CheckDlgButton: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.UINT]],
	CheckMenuItem: [winapi.DWORD, [winapi.HMENU, winapi.UINT, winapi.UINT]],
	CheckMenuRadioItem: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT, winapi.UINT, winapi.UINT]],
	CheckRadioButton: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.INT, winapi.INT]],
	ChildWindowFromPoint: [winapi.HWND, [winapi.HWND, winapi.POINT]],
	ChildWindowFromPointEx: [winapi.HWND, [winapi.HWND, winapi.POINT, winapi.UINT]],
	ClientToScreen: [winapi.BOOL, [winapi.HWND, winapi.LPPOINT]],
	ClipCursor: [winapi.BOOL, [winapi.RECT]],
	CloseClipboard: [winapi.BOOL, []],
	CloseDesktop: [winapi.BOOL, [winapi.HDESK]],
	CloseGestureInfoHandle: [winapi.BOOL, [winapi.HGESTUREINFO]],
	CloseTouchInputHandle: [winapi.BOOL, [winapi.HTOUCHINPUT]],
	CloseWindow: [winapi.BOOL, [winapi.HWND]],
	CloseWindowStation: [winapi.BOOL, [winapi.HWINSTA]],
	CopyAcceleratorTableA: [winapi.INT, [winapi.HACCEL, winapi.LPACCEL, winapi.INT]],
	CopyAcceleratorTableW: [winapi.INT, [winapi.HACCEL, winapi.LPACCEL, winapi.INT]],
//	CopyCursor: [winapi.VOID, [winapi.HCURSOR]],
	CopyIcon: [winapi.HICON, [winapi.HICON]],
	CopyImage: [winapi.HANDLE, [winapi.HANDLE, winapi.UINT, winapi.INT, winapi.INT, winapi.UINT]],
	CopyRect: [winapi.BOOL, [winapi.LPRECT, winapi.RECT]],
	CopyImage: [winapi.HANDLE, [winapi.HANDLE, winapi.UINT, winapi.INT, winapi.INT, winapi.UINT]],
	CreateAcceleratorTableA: [winapi.HACCEL, [winapi.LPACCEL, winapi.INT]],
	CreateAcceleratorTableW: [winapi.HACCEL, [winapi.LPACCEL, winapi.INT]],
	CreateCaret: [winapi.BOOL, [winapi.HWND, winapi.HBITMAP, winapi.INT, winapi.INT]],
	CreateCursor: [winapi.HCURSOR, [winapi.HINSTANCE, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.VOID, winapi.VOID]],
	CreateDesktopA: [winapi.HDESK, [winapi.LPCSTR, winapi.LPCSTR, winapi.DEVMODEA, winapi.DWORD, winapi.ACCESS_MASK, winapi.LPSECURITY_ATTRIBUTES]],
	CreateDesktopExA: [winapi.HDESK, [winapi.LPCSTR, winapi.LPCSTR, winapi.DEVMODEA, winapi.DWORD, winapi.ACCESS_MASK, winapi.LPSECURITY_ATTRIBUTES, winapi.ULONG, winapi.PVOID]],
	CreateDesktopExW: [winapi.HDESK, [winapi.LPCWSTR, winapi.LPCWSTR, winapi.DEVMODEW, winapi.DWORD, winapi.ACCESS_MASK, winapi.LPSECURITY_ATTRIBUTES, winapi.ULONG, winapi.PVOID]],
	CreateDesktopW: [winapi.HDESK, [winapi.LPCWSTR, winapi.LPCWSTR, winapi.DEVMODEW, winapi.DWORD, winapi.ACCESS_MASK, winapi.LPSECURITY_ATTRIBUTES]],
//	CreateDialogIndirectA: [winapi.VOID, [winapi.HINSTANCE, winapi.LPCDLGTEMPLATE, winapi.HWND, winapi.DLGPROC]],
	CreateDialogIndirectParamA: [winapi.HWND, [winapi.HINSTANCE, winapi.LPCDLGTEMPLATEA, winapi.HWND, winapi.DLGPROC, winapi.LPARAM]],
	CreateDialogIndirectParamW: [winapi.HWND, [winapi.HINSTANCE, winapi.LPCDLGTEMPLATEW, winapi.HWND, winapi.DLGPROC, winapi.LPARAM]],
//	CreateDialogIndirectW: [winapi.VOID, [winapi.HINSTANCE, winapi.LPCDLGTEMPLATE, winapi.HWND, winapi.DLGPROC]],
	CreateDialogParamA: [winapi.HWND, [winapi.HINSTANCE, winapi.LPCSTR, winapi.HWND, winapi.DLGPROC, winapi.LPARAM]],
	CreateDialogParamW: [winapi.HWND, [winapi.HINSTANCE, winapi.LPCWSTR, winapi.HWND, winapi.DLGPROC, winapi.LPARAM]],
//	CreateDialogW: [winapi.VOID, [winapi.HINSTANCE, winapi.LPCTSTR, winapi.HWND, winapi.DLGPROC]],
	CreateIcon: [winapi.HICON, [winapi.HINSTANCE, winapi.INT, winapi.INT, winapi.BYTE, winapi.BYTE, winapi.BYTE, winapi.BYTE]],
	CreateIconFromResource: [winapi.HICON, [winapi.PBYTE, winapi.DWORD, winapi.BOOL, winapi.DWORD]],
	CreateIconFromResourceEx: [winapi.HICON, [winapi.PBYTE, winapi.DWORD, winapi.BOOL, winapi.DWORD, winapi.INT, winapi.INT, winapi.UINT]],
	CreateIconIndirect: [winapi.HICON, [winapi.PICONINFO]],
	CreateMDIWindowA: [winapi.HWND, [winapi.LPCSTR, winapi.LPCSTR, winapi.DWORD, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.HWND, winapi.HINSTANCE, winapi.LPARAM]],
	CreateMDIWindowW: [winapi.HWND, [winapi.LPCWSTR, winapi.LPCWSTR, winapi.DWORD, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.HWND, winapi.HINSTANCE, winapi.LPARAM]],
	CreateMenu: [winapi.HMENU, []],
	CreatePopupMenu: [winapi.HMENU, []],
	CreateSyntheticPointerDevice: [winapi.HSYNTHETICPOINTERDEVICE, [winapi.POINTER_INPUT_TYPE, winapi.ULONG, winapi.POINTER_FEEDBACK_MODE]],
//	CreateWindowA: [winapi.VOID, [winapi.LPCTSTR, winapi.LPCTSTR, winapi.DWORD, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.HWND, winapi.HMENU, winapi.HINSTANCE, winapi.LPVOID]],
	CreateWindowExA: [winapi.HWND, [winapi.DWORD, winapi.LPCSTR, winapi.LPCSTR, winapi.DWORD, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.HWND, winapi.HMENU, winapi.HINSTANCE, winapi.LPVOID]],
	CreateWindowExW: [winapi.HWND, [winapi.DWORD, winapi.LPCWSTR, winapi.LPCWSTR, winapi.DWORD, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.HWND, winapi.HMENU, winapi.HINSTANCE, winapi.LPVOID]],/*
	CreateWindowStationA: [winapi.HWINSTA, [winapi.LPCSTR, winapi.DWORD, winapi.ACCESS_MASK, winapi.LPSECURITY_ATTRIBUTES]],
	CreateWindowStationW: [winapi.HWINSTA, [winapi.LPCWSTR, winapi.DWORD, winapi.ACCESS_MASK, winapi.LPSECURITY_ATTRIBUTES]],
	CreateWindowW: [winapi.VOID, [winapi.LPCTSTR, winapi.LPCTSTR, winapi.DWORD, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.HWND, winapi.HMENU, winapi.HINSTANCE, winapi.LPVOID]],
	DefDlgProcW: [winapi.LRESULT, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	DeferWindowPos: [winapi.HDWP, [winapi.HDWP, winapi.HWND, winapi.HWND, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.UINT]],
	DefFrameProcA: [winapi.LRESULT, [winapi.HWND, winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	DefFrameProcW: [winapi.LRESULT, [winapi.HWND, winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	DefMDIChildProcA: [winapi.LRESULT, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	DefMDIChildProcW: [winapi.LRESULT  [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	DefRawInputProc: [winapi.LRESULT, [winapi.PRAWINPUT, winapi.INT, winapi.UINT]],*/
	DefWindowProcA: [winapi.LRESULT, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	DefWindowProcW: [winapi.LRESULT, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	DeleteMenu: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT]],
	DeregisterShellHookWindow: [winapi.BOOL, [winapi.HWND]],
	DestroyAcceleratorTable: [winapi.BOOL, [winapi.HACCEL]],
	DestroyCaret: [winapi.BOOL, []],
	DestroyCursor: [winapi.BOOL, [winapi.HCURSOR]],
//	DestroyIcon: [winapi.BOOL, [winapi.HICON]],// just crashes?
	DestroyMenu: [winapi.BOOL, [winapi.HMENU]],/*
	DestroySyntheticPointerDevice: [winapi.VOID, [winapi.HSYNTHETICPOINTERDEVICE]],
	DestroyWindow: [winapi.BOOL, [winapi.HWND]],
	DialogBoxA: [winapi.VOID, [winapi.HINSTANCE, winapi.LPCTSTR, winapi.HWND, winapi.DLGPROC]],
	DialogBoxIndirectA: [winapi.VOID, [winapi.HINSTANCE, winapi.LPCDLGTEMPLATE, winapi.HWND, winapi.DLGPROC]],
	DialogBoxIndirectParamA: [winapi.INT_PTR, [winapi.HINSTANCE, winapi.LPCDLGTEMPLATEA, winapi.HWND, winapi.DLGPROC, winapi.LPARAM]],
	DialogBoxIndirectParamW: [winapi.INT_PTR, [winapi.HINSTANCE, winapi.LPCDLGTEMPLATEW, winapi.HWND, winapi.DLGPROC, winapi.LPARAM]],
	DialogBoxIndirectW: [winapi.VOID, [winapi.HINSTANCE, winapi.LPCDLGTEMPLATE, winapi.HWND, winapi.DLGPROC]],*/
	DialogBoxParamA: [winapi.INT_PTR, [winapi.HINSTANCE, winapi.LPCSTR, winapi.HWND, winapi.DLGPROC, winapi.LPARAM]],
	DialogBoxParamW: [winapi.INT_PTR, [winapi.HINSTANCE, winapi.LPCWSTR, winapi.HWND, winapi.DLGPROC, winapi.LPARAM]],
//	DialogBoxW: [winapi.VOID, [winapi.HINSTANCE, winapi.LPCTSTR, winapi.HWND, winapi.DLGPROC]],
	DisableProcessWindowsGhosting: [winapi.VOID, []],
//	DispatchMessage: [winapi.LRESULT, [winapi.MSG]],
	DispatchMessageA: [winapi.LRESULT, [winapi.MSG]],
	DispatchMessageW: [winapi.LRESULT, [winapi.MSG]],/*
	DisplayConfigGetDeviceInfo: [winapi.LONG, [winapi.DISPLAYCONFIG_DEVICE_INFO_HEADER]],
	DisplayConfigSetDeviceInfo: [winapi.LONG, [winapi.DISPLAYCONFIG_DEVICE_INFO_HEADER]],
	DlgDirListA: [winapi.INT, [winapi.HWND, winapi.LPSTR, winapi.INT, winapi.INT, winapi.UINT]],
	DlgDirListComboBoxA: [winapi.INT, [winapi.HWND, winapi.LPSTR, winapi.INT, winapi.INT, winapi.UINT]],
	DlgDirListComboBoxW: [winapi.INT, [winapi.HWND, winapi.LPWSTR, winapi.INT, winapi.INT, winapi.UINT]],
	DlgDirListW: [winapi.INT, [winapi.HWND, winapi.LPWSTR, winapi.INT, winapi.INT, winapi.UINT]],
	DlgDirSelectComboBoxExA: [winapi.BOOL, [winapi.HWND, winapi.LPSTR, winapi.INT, winapi.INT]],
	DlgDirSelectComboBoxExW: [winapi.BOOL, [winapi.HWND, winapi.LPWSTR, winapi.INT, winapi.INT]],
	DlgDirSelectExA: [winapi.BOOL, [winapi.HWND, winapi.LPSTR, winapi.INT, winapi.INT]],
	DlgDirSelectExW: [winapi.BOOL, [winapi.HWND, winapi.LPWSTR, winapi.INT, winapi.INT]],
	DragDetect: [winapi.BOOL, [winapi.HWND, winapi.POINT]],
	DrawAnimatedRects: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.RECT, winapi.RECT]],
	DrawCaption: [winapi.BOOL, [winapi.HWND, winapi.HDC, winapi.RECT, winapi.UINT]],
	DrawEdge: [winapi.BOOL, [winapi.HDC, winapi.LPRECT, winapi.UINT, winapi.UINT]],
	DrawFocusRect: [winapi.BOOL, [winapi.HDC, winapi.RECT]],
	DrawFrameControl: [winapi.BOOL, [winapi.HDC, winapi.LPRECT, winapi.UINT, winapi.UINT]],
	DrawIcon: [winapi.BOOL, [winapi.HDC, winapi.INT, winapi.INT, winapi.HICON]],
	DrawIconEx: [winapi.BOOL, [winapi.HDC, winapi.INT, winapi.INT, winapi.HICON, winapi.INT, winapi.INT, winapi.UINT, winapi.HBRUSH, winapi.UINT]],
	DrawMenuBar: [winapi.BOOL, [winapi.HWND]],
	DrawStateA: [winapi.BOOL, [winapi.HDC, winapi.HBRUSH, winapi.DRAWSTATEPROC, winapi.LPARAM, winapi.WPARAM, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.UINT]],
	DrawStateW: [winapi.BOOL, [winapi.HDC, winapi.HBRUSH, winapi.DRAWSTATEPROC, winapi.LPARAM, winapi.WPARAM, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.UINT]],
	DrawText: [winapi.INT, [winapi.HDC, winapi.LPCTSTR, winapi.INT, winapi.LPRECT, winapi.UINT]],
	DrawTextA: [winapi.INT, [winapi.HDC, winapi.LPCSTR, winapi.INT, winapi.LPRECT, winapi.UINT]],
	DrawTextExA: [winapi.INT, [winapi.HDC, winapi.LPSTR, winapi.INT, winapi.LPRECT, winapi.UINT, winapi.LPDRAWTEXTPARAMS]],
	DrawTextExW: [winapi.INT, [winapi.HDC, winapi.LPWSTR, winapi.INT, winapi.LPRECT, winapi.UINT, winapi.LPDRAWTEXTPARAMS]],*/
	DrawTextW: [winapi.INT, [winapi.HDC, winapi.LPCWSTR, winapi.INT, winapi.LPRECT, winapi.UINT]],
	EmptyClipboard: [winapi.BOOL, []],
	EnableMenuItem: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT]],
	EnableMouseInPointer: [winapi.BOOL, [winapi.BOOL]],
	EnableNonClientDpiScaling: [winapi.BOOL, [winapi.HWND]],
	EnableScrollBar: [winapi.BOOL, [winapi.HWND, winapi.UINT, winapi.UINT]],
	EnableWindow: [winapi.BOOL, [winapi.HWND, winapi.BOOL]],
	EndDeferWindowPos: [winapi.BOOL, [winapi.HDWP]],
	EndDialog: [winapi.BOOL, [winapi.HWND, winapi.INT_PTR]],
	EndMenu: [winapi.BOOL, []],
	EndPaint: [winapi.BOOL, [winapi.HWND, winapi.PAINTSTRUCT]],
	EndTask: [winapi.BOOL, [winapi.HWND, winapi.BOOL, winapi.BOOL]],/*
	EnumChildWindows: [winapi.BOOL, [winapi.HWND, winapi.WNDENUMPROC, winapi.LPARAM]],
	EnumClipboardFormats: [winapi.UINT, [winapi.UINT]],
	EnumDesktopsA: [winapi.BOOL, [winapi.HWINSTA, winapi.DESKTOPENUMPROCA, winapi.LPARAM]],
	EnumDesktopsW: [winapi.BOOL, [winapi.HWINSTA, winapi.DESKTOPENUMPROCW, winapi.LPARAM]],
	EnumDesktopWindows: [winapi.BOOL, [winapi.HDESK, winapi.WNDENUMPROC, winapi.LPARAM]],
	EnumDisplayDevicesA: [winapi.BOOL, [winapi.LPCSTR, winapi.DWORD, winapi.PDISPLAY_DEVICEA, winapi.DWORD]],
	EnumDisplayDevicesW: [winapi.BOOL, [winapi.LPCWSTR, winapi.DWORD, winapi.PDISPLAY_DEVICEW, winapi.DWORD]],
	EnumDisplayMonitors: [winapi.BOOL, [winapi.HDC, winapi.LPCRECT, winapi.MONITORENUMPROC, winapi.LPARAM]],
	EnumDisplaySettingsA: [winapi.BOOL, [winapi.LPCSTR, winapi.DWORD, winapi.DEVMODEA]],
	EnumDisplaySettingsExA: [winapi.BOOL, [winapi.LPCSTR, winapi.DWORD, winapi.DEVMODEA, winapi.DWORD]],
	EnumDisplaySettingsExW: [winapi.BOOL, [winapi.LPCWSTR, winapi.DWORD, winapi.DEVMODEW, winapi.DWORD]],
	EnumDisplaySettingsW: [winapi.BOOL, [winapi.LPCWSTR, winapi.DWORD, winapi.DEVMODEW]],
	EnumPropsA: [winapi.INT, [winapi.HWND, winapi.PROPENUMPROCA]],
	EnumPropsExA: [winapi.INT, [winapi.HWND, winapi.PROPENUMPROCEXA, winapi.LPARAM]],
	EnumPropsExW: [winapi.INT, [winapi.HWND, winapi.PROPENUMPROCEXW, winapi.LPARAM]],
	EnumPropsW: [winapi.INT, [winapi.HWND, winapi.PROPENUMPROCW]],
	EnumThreadWindows: [winapi.BOOL, [winapi.DWORD, winapi.WNDENUMPROC, winapi.LPARAM]],
	EnumWindows: [winapi.BOOL, [winapi.WNDENUMPROC, winapi.LPARAM]],
	EnumWindowStationsA: [winapi.BOOL, [winapi.WINSTAENUMPROCA, winapi.LPARAM]],
	EnumWindowStationsW: [winapi.BOOL, [winapi.WINSTAENUMPROCW, winapi.LPARAM]],
	EqualRect: [winapi.BOOL, [winapi.RECT, winapi.RECT]],
	EvaluateProximityToPolygon: [winapi.BOOL, [winapi.UINT32, winapi.POINT, winapi.TOUCH_HIT_TESTING_INPUT, winapi.TOUCH_HIT_TESTING_PROXIMITY_EVALUATION]],
	EvaluateProximityToRect: [winapi.BOOL, [winapi.RECT, winapi.TOUCH_HIT_TESTING_INPUT, winapi.TOUCH_HIT_TESTING_PROXIMITY_EVALUATION]],*/
	ExcludeUpdateRgn: [winapi.INT, [winapi.HDC, winapi.HWND]],
//	ExitWindows: [winapi.VOID, [winapi.INT, winapi.LONG]],
	ExitWindowsEx: [winapi.BOOL, [winapi.UINT, winapi.DWORD]],
	FillRect: [winapi.INT, [winapi.HDC, winapi.RECT, winapi.HBRUSH]],
	FindWindowA: [winapi.HWND, [winapi.LPCSTR, winapi.LPCSTR]],
	FindWindowExA: [winapi.HWND, [winapi.HWND, winapi.HWND, winapi.LPCSTR, winapi.LPCSTR]],
	FindWindowExW: [winapi.HWND, [winapi.HWND, winapi.HWND, winapi.LPCWSTR, winapi.LPCWSTR]],
	FindWindowW: [winapi.HWND, [winapi.LPCWSTR, winapi.LPCWSTR]],
	FlashWindow: [winapi.BOOL, [winapi.HWND, winapi.BOOL]],/*
	FlashWindowEx: [winapi.BOOL, [winapi.PFLASHWINFO]],
	FrameRect: [winapi.INT, [winapi.HDC, winapi.RECT, winapi.HBRUSH]],
	GetActiveWindow: [winapi.HWND, []],
	GetAltTabInfoA: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.PALTTABINFO, winapi.LPSTR, winapi.UINT]],
	GetAltTabInfoW: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.PALTTABINFO, winapi.LPWSTR, winapi.UINT]],
	GetAncestor: [winapi.HWND, [winapi.HWND, winapi.UINT]],
	GetAsyncKeyState: [winapi.SHORT, [winapi.INT]],
	GetAutoRotationState: [winapi.BOOL, [winapi.PAR_STATE]],
	GetAwarenessFromDpiAwarenessContext: [winapi.DPI_AWARENESS, [winapi.DPI_AWARENESS_CONTEXT]],
	GetCapture: [winapi.HWND, []],
	GetCaretBlinkTime: [winapi.UINT, []],
	GetCaretPos: [winapi.BOOL, [winapi.LPPOINT]],
	GetCIMSSM: [winapi.BOOL, [winapi.INPUT_MESSAGE_SOURCE]],
	GetClassInfoA: [winapi.BOOL, [winapi.HINSTANCE, winapi.LPCSTR, winapi.LPWNDCLASSA]],
	GetClassInfoExA: [winapi.BOOL, [winapi.HINSTANCE, winapi.LPCSTR, winapi.LPWNDCLASSEXA]],
	GetClassInfoExW: [winapi.BOOL, [winapi.HINSTANCE, winapi.LPCWSTR, winapi.LPWNDCLASSEXW]],
	GetClassInfoW: [winapi.BOOL, [winapi.HINSTANCE, winapi.LPCWSTR, winapi.LPWNDCLASSW]],
	GetClassLongA: [winapi.DWORD, [winapi.HWND, winapi.INT]],
	GetClassLongPtrA: [winapi.ULONG_PTR, [winapi.HWND, winapi.INT]],
	GetClassLongPtrW: [winapi.ULONG_PTR, [winapi.HWND, winapi.INT]],
	GetClassLongW: [winapi.DWORD, [winapi.HWND, winapi.INT]],
	GetClassName: [winapi.INT, [winapi.HWND, winapi.LPTSTR, winapi.INT]],
	GetClassNameA: [winapi.INT, [winapi.HWND, winapi.LPSTR, winapi.INT]],
	GetClassNameW: [winapi.INT, [winapi.HWND, winapi.LPWSTR, winapi.INT]],
	GetClassWord: [winapi.WORD, [winapi.HWND, winapi.INT]],
	GetClientRect: [winapi.BOOL, [winapi.HWND, winapi.LPRECT]],
	GetClipboardData: [winapi.HANDLE, [winapi.UINT]],
	GetClipboardFormatNameA: [winapi.INT, [winapi.UINT, winapi.LPSTR, winapi.INT]],
	GetClipboardFormatNameW: [winapi.INT, [winapi.UINT, winapi.LPWSTR, winapi.INT]],
	GetClipboardOwner: [winapi.HWND, []],
	GetClipboardSequenceNumber: [winapi.DWORD, []],
	GetClipboardViewer: [winapi.HWND, []],
	GetClipCursor: [winapi.BOOL, [winapi.LPRECT]],
	GetComboBoxInfo: [winapi.BOOL, [winapi.HWND, winapi.PCOMBOBOXINFO]],
	GetCurrentInputMessageSource: [winapi.BOOL, [winapi.INPUT_MESSAGE_SOURCE]],
	GetCursor: [winapi.HCURSOR, []],
	GetCursorInfo: [winapi.BOOL, [winapi.PCURSORINFO]],
	GetCursorPos: [winapi.BOOL, [winapi.LPPOINT]],
	GetDC: [winapi.HDC, [winapi.HWND]],
	GetDCEx: [winapi.HDC, [winapi.HWND, winapi.HRGN, winapi.DWORD]],
	GetDesktopWindow: [winapi.HWND, []],
	GetDialogBaseUnits: [winapi.LONG, []],
	GetDialogControlDpiChangeBehavior: [winapi.DIALOG_CONTROL_DPI_CHANGE_BEHAVIORS, [winapi.HWND]],
	GetDialogDpiChangeBehavior: [winapi.DIALOG_DPI_CHANGE_BEHAVIORS, [winapi.HWND]],
	GetDisplayAutoRotationPreferences: [winapi.BOOL, [winapi.ORIENTATION_PREFERENCE]],
	GetDisplayAutoRotationPreferencesByProcessId: [winapi.BOOL, [winapi.DWORD, winapi.ORIENTATION_PREFERENCE, winapi.PBOOL]],
	GetDisplayConfigBufferSizes: [winapi.LONG, [winapi.UINT32, winapi.UINT32, winapi.UINT32]],
	GetDlgCtrlID: [winapi.INT, [winapi.HWND]],
	GetDlgItem: [winapi.HWND, [winapi.HWND, winapi.INT]],
	GetDlgItemInt: [winapi.UINT, [winapi.HWND, winapi.INT, winapi.BOOL, winapi.BOOL]],
	GetDlgItemTextA: [winapi.UINT, [winapi.HWND, winapi.INT, winapi.LPSTR, winapi.INT]],
	GetDlgItemTextW: [winapi.UINT, [winapi.HWND, winapi.INT, winapi.LPWSTR, winapi.INT]],
	GetDoubleClickTime: [winapi.UINT, []],
	GetDpiForSystem: [winapi.UINT, []],
	GetDpiForWindow: [winapi.UINT, [winapi.HWND]],
	GetDpiFromDpiAwarenessContext: [winapi.UINT, [winapi.DPI_AWARENESS_CONTEXT]],
	GetFocus: [winapi.HWND, []],
	GetForegroundWindow: [winapi.HWND, []],
	GetGestureConfig: [winapi.BOOL, [winapi.HWND, winapi.DWORD, winapi.DWORD, winapi.PUINT, winapi.PGESTURECONFIG, winapi.UINT]],
	GetGestureExtraArgs: [winapi.BOOL, [winapi.HGESTUREINFO, winapi.UINT, winapi.PBYTE]],
	GetGestureInfo: [winapi.BOOL, [winapi.HGESTUREINFO, winapi.PGESTUREINFO]],
	GetGuiResources: [winapi.DWORD, [winapi.HANDLE, winapi.DWORD]],
	GetGUIThreadInfo: [winapi.BOOL, [winapi.DWORD, winapi.PGUITHREADINFO]],
	GetIconInfo: [winapi.BOOL, [winapi.HICON, winapi.PICONINFO]],
	GetIconInfoExA: [winapi.BOOL, [winapi.HICON, winapi.PICONINFOEXA]],
	GetIconInfoExW: [winapi.BOOL, [winapi.HICON, winapi.PICONINFOEXW]],
	GetInputState: [winapi.BOOL, []],
	GetKBCodePage: [winapi.UINT, []],
	GetKeyboardLayout: [winapi.HKL, [winapi.DWORD]],
	GetKeyboardLayoutList: [winapi.INT, [winapi.INT, winapi.HKL]],
	GetKeyboardLayoutNameA: [winapi.BOOL, [winapi.LPSTR]],
	GetKeyboardLayoutNameW: [winapi.BOOL, [winapi.LPWSTR]],
	GetKeyboardState: [winapi.BOOL, [winapi.PBYTE]],
	GetKeyboardType: [winapi.INT, [winapi.INT]],
	GetKeyNameTextA: [winapi.INT, [winapi.LONG, winapi.LPSTR, winapi.INT]],
	GetKeyNameTextW: [winapi.INT, [winapi.LONG, winapi.LPWSTR, winapi.INT]],
	GetKeyState: [winapi.SHORT, [winapi.INT]],
	GetLastActivePopup: [winapi.HWND, [winapi.HWND]],
	GetLastInputInfo: [winapi.BOOL, [winapi.PLASTINPUTINFO]],
	GetLayeredWindowAttributes: [winapi.BOOL, [winapi.HWND, winapi.COLORREF, winapi.BYTE, winapi.DWORD]],
	GetListBoxInfo: [winapi.DWORD, [winapi.HWND]],
	GetMenu: [winapi.HMENU, [winapi.HWND]],
	GetMenuBarInfo: [winapi.BOOL, [winapi.HWND, winapi.LONG, winapi.LONG, winapi.PMENUBARINFO]],
	GetMenuCheckMarkDimensions: [winapi.LONG, []],
	GetMenuContextHelpId: [winapi.DWORD, [winapi.HMENU]],
	GetMenuDefaultItem: [winapi.UINT, [winapi.HMENU, winapi.UINT, winapi.UINT]],
	GetMenuInfo: [winapi.BOOL, [winapi.HMENU, winapi.LPMENUINFO]],
	GetMenuItemCount: [winapi.INT, [winapi.HMENU]],
	GetMenuItemID: [winapi.UINT, [winapi.HMENU, winapi.INT]],
	GetMenuItemInfoA: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.BOOL, winapi.LPMENUITEMINFOA]],
	GetMenuItemInfoW: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.BOOL, winapi.LPMENUITEMINFOW]],*/
	GetMenuItemRect: [winapi.BOOL, [winapi.HWND, winapi.HMENU, winapi.UINT, winapi.LPRECT]],
	GetMenuState: [winapi.UINT, [winapi.HMENU, winapi.UINT, winapi.UINT]],
	GetMenuStringA: [winapi.INT, [winapi.HMENU, winapi.UINT, winapi.LPSTR, winapi.INT, winapi.UINT]],
	GetMenuStringW: [winapi.INT, [winapi.HMENU, winapi.UINT, winapi.LPWSTR, winapi.INT, winapi.UINT]],
//	GetMessage: [winapi.BOOL, [winapi.LPMSG, winapi.HWND, winapi.UINT, winapi.UINT]],
	GetMessageA: [winapi.BOOL, [winapi.LPMSG, winapi.HWND, winapi.UINT, winapi.UINT]],
	GetMessageExtraInfo: [winapi.LPARAM, []],
	GetMessagePos: [winapi.DWORD, []],
	GetMessageTime: [winapi.LONG, []],
	GetMessageW: [winapi.BOOL, [winapi.LPMSG, winapi.HWND, winapi.UINT, winapi.UINT]],/*
	GetMonitorInfoA: [winapi.BOOL, [winapi.HMONITOR, winapi.LPMONITORINFO]],/*
	GetMonitorInfoW: [winapi.BOOL, [winapi.HMONITOR, winapi.LPMONITORINFO]],
	GetMouseMovePointsEx: [winapi.INT, [winapi.UINT, winapi.LPMOUSEMOVEPOINT, winapi.LPMOUSEMOVEPOINT, winapi.INT, winapi.DWORD]],
	GetNextDlgGroupItem: [winapi.HWND, [winapi.HWND, winapi.HWND, winapi.BOOL]],
	GetNextDlgTabItem: [winapi.HWND, [winapi.HWND, winapi.HWND, winapi.BOOL]],
	GetNextWindow: [winapi.VOID, []],
	GetOpenClipboardWindow: [winapi.HWND, []],
	GetParent: [winapi.HWND, [winapi.HWND]],
	GetPhysicalCursorPos: [winapi.BOOL, [winapi.LPPOINT]],
	GetPointerCursorId: [winapi.BOOL, [winapi.UINT32, winapi.UINT32]],
	GetPointerDevice: [winapi.BOOL, [winapi.HANDLE, winapi.POINTER_DEVICE_INFO]],
	GetPointerDeviceCursors: [winapi.BOOL, [winapi.HANDLE, winapi.UINT32, winapi.POINTER_DEVICE_CURSOR_INFO]],
	GetPointerDeviceProperties: [winapi.BOOL, [winapi.HANDLE, winapi.UINT32, winapi.POINTER_DEVICE_PROPERTY]],
	GetPointerDeviceRects: [winapi.BOOL, [winapi.HANDLE, winapi.RECT, winapi.RECT]],
	GetPointerDevices: [winapi.BOOL, [winapi.UINT32, winapi.POINTER_DEVICE_INFO]],
	GetPointerFrameInfo: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.POINTER_INFO]],
	GetPointerFrameInfoHistory: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.UINT32, winapi.POINTER_INFO]],
	GetPointerFramePenInfo: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.POINTER_PEN_INFO]],
	GetPointerFramePenInfoHistory: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.UINT32, winapi.POINTER_PEN_INFO]],
	GetPointerFrameTouchInfo: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.POINTER_TOUCH_INFO]],
	GetPointerFrameTouchInfoHistory: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.UINT32, winapi.POINTER_TOUCH_INFO]],
	GetPointerInfo: [winapi.BOOL, [winapi.UINT32, winapi.POINTER_INFO]],
	GetPointerInfoHistory: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.POINTER_INFO]],
	GetPointerInputTransform: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.INPUT_TRANSFORM]],
	GetPointerPenInfo: [winapi.BOOL, [winapi.UINT32, winapi.POINTER_PEN_INFO]],
	GetPointerPenInfoHistory: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.POINTER_PEN_INFO]],
	GetPointerTouchInfo: [winapi.BOOL, [winapi.UINT32, winapi.POINTER_TOUCH_INFO]],
	GetPointerTouchInfoHistory: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.POINTER_TOUCH_INFO]],
	GetPointerType: [winapi.BOOL, [winapi.UINT32, winapi.POINTER_INPUT_TYPE]],
	GetPriorityClipboardFormat: [winapi.INT, [winapi.UINT, winapi.INT]],
	GetProcessDefaultLayout: [winapi.BOOL, [winapi.DWORD]],
	GetProcessWindowStation: [winapi.HWINSTA, []],
	GetPropA: [winapi.HANDLE, [winapi.HWND, winapi.LPCSTR]],
	GetPropW: [winapi.HANDLE, [winapi.HWND, winapi.LPCWSTR]],
	GetQueueStatus: [winapi.DWORD, [winapi.UINT]],
	GetRawInputBuffer: [winapi.UINT, [winapi.PRAWINPUT, winapi.PUINT, winapi.UINT]],
	GetRawInputData: [winapi.UINT, [winapi.HRAWINPUT, winapi.UINT, winapi.LPVOID, winapi.PUINT, winapi.UINT]],
	GetRawInputDeviceInfoA: [winapi.UINT, [winapi.HANDLE, winapi.UINT, winapi.LPVOID, winapi.PUINT]],
	GetRawInputDeviceInfoW: [winapi.UINT, [winapi.HANDLE, winapi.UINT, winapi.LPVOID, winapi.PUINT]],
	GetRawInputDeviceList: [winapi.UINT, [winapi.PRAWINPUTDEVICELIST, winapi.PUINT, winapi.UINT]],
	GetRawPointerDeviceData: [winapi.BOOL, [winapi.UINT32, winapi.UINT32, winapi.UINT32, winapi.POINTER_DEVICE_PROPERTY, winapi.LONG]],
	GetRegisteredRawInputDevices: [winapi.UINT, [winapi.PRAWINPUTDEVICE, winapi.PUINT, winapi.UINT]],
	GetScrollBarInfo: [winapi.BOOL, [winapi.HWND, winapi.LONG, winapi.PSCROLLBARINFO]],
	GetScrollInfo: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.LPSCROLLINFO]],
	GetScrollPos: [winapi.INT, [winapi.HWND, winapi.INT]],
	GetScrollRange: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.LPINT, winapi.LPINT]],
	GetShellWindow: [winapi.HWND, []],
	GetSubMenu: [winapi.HMENU, [winapi.HMENU, winapi.INT]],
	GetSysColor: [winapi.DWORD, [winapi.INT]],
	GetSysColorBrush: [winapi.HBRUSH, [winapi.INT]],
	GetSystemDpiForProcess: [winapi.UINT, [winapi.HANDLE]],
	GetSystemMenu: [winapi.HMENU, [winapi.HWND, winapi.BOOL]],
	GetSystemMetrics: [winapi.INT, [winapi.INT]],
	GetSystemMetricsForDpi: [winapi.INT, [winapi.INT, winapi.UINT]],
	GetTabbedTextExtentA: [winapi.DWORD, [winapi.HDC, winapi.LPCSTR, winapi.INT, winapi.INT, winapi.INT]],
	GetTabbedTextExtentW: [winapi.DWORD, [winapi.HDC, winapi.LPCWSTR, winapi.INT, winapi.INT, winapi.INT]],
	GetThreadDesktop: [winapi.HDESK, [winapi.DWORD]],
	GetThreadDpiAwarenessContext: [winapi.DPI_AWARENESS_CONTEXT, []],
	GetThreadDpiHostingBehavior: [winapi.DPI_HOSTING_BEHAVIOR, []],
	GetTitleBarInfo: [winapi.BOOL, [winapi.HWND, winapi.PTITLEBARINFO]],
	GetTopWindow: [winapi.HWND, [winapi.HWND]],
	GetTouchInputInfo: [winapi.BOOL, [winapi.HTOUCHINPUT, winapi.UINT, winapi.PTOUCHINPUT, winapi.INT]],
	GetUnpredictedMessagePos: [winapi.DWORD, []],
	GetUpdatedClipboardFormats: [winapi.BOOL, [winapi.PUINT, winapi.UINT, winapi.PUINT]],
	GetUpdateRect: [winapi.BOOL, [winapi.HWND, winapi.LPRECT, winapi.BOOL]],
	GetUpdateRgn: [winapi.INT, [winapi.HWND, winapi.HRGN, winapi.BOOL]],
	GetUserObjectInformationA: [winapi.BOOL, [winapi.HANDLE, winapi.INT, winapi.PVOID, winapi.DWORD, winapi.LPDWORD]],
	GetUserObjectInformationW: [winapi.BOOL, [winapi.HANDLE, winapi.INT, winapi.PVOID, winapi.DWORD, winapi.LPDWORD]],
	GetUserObjectSecurity: [winapi.BOOL, [winapi.HANDLE, winapi.PSECURITY_INFORMATION, winapi.PSECURITY_DESCRIPTOR, winapi.DWORD, winapi.LPDWORD]],
	GetWindow: [winapi.HWND, [winapi.HWND, winapi.UINT]],
	GetWindowContextHelpId: [winapi.DWORD, [winapi.HWND]],
	GetWindowDC: [winapi.HDC, [winapi.HWND]],
	GetWindowDisplayAffinity: [winapi.BOOL, [winapi.HWND, winapi.DWORD]],
	GetWindowDpiAwarenessContext: [winapi.DPI_AWARENESS_CONTEXT, [winapi.HWND]],
	GetWindowDpiHostingBehavior: [winapi.DPI_HOSTING_BEHAVIOR, [winapi.HWND]],
	GetWindowFeedbackSetting: [winapi.BOOL, [winapi.HWND, winapi.FEEDBACK_TYPE, winapi.DWORD, winapi.UINT32, winapi.VOID]],
	GetWindowInfo: [winapi.BOOL, [winapi.HWND, winapi.PWINDOWINFO]],
	GetWindowLongA: [winapi.LONG, [winapi.HWND, winapi.INT]],
	GetWindowLongPtrA: [winapi.LONG_PTR, [winapi.HWND, winapi.INT]],
	GetWindowLongPtrW: [winapi.LONG_PTR, [winapi.HWND, winapi.INT]],
	GetWindowLongW: [winapi.LONG, [winapi.HWND, winapi.INT]],
	GetWindowModuleFileNameA: [winapi.UINT, [winapi.HWND, winapi.LPSTR, winapi.UINT]],
	GetWindowModuleFileNameW: [winapi.UINT, [winapi.HWND, winapi.LPWSTR, winapi.UINT]],
	GetWindowPlacement: [winapi.BOOL, [winapi.HWND, winapi.WINDOWPLACEMENT]],
	GetWindowRect: [winapi.BOOL, [winapi.HWND, winapi.LPRECT]],
	GetWindowRgn: [winapi.INT, [winapi.HWND, winapi.HRGN]],
	GetWindowRgnBox: [winapi.INT, [winapi.HWND, winapi.LPRECT]],
	GetWindowTextA: [winapi.INT, [winapi.HWND, winapi.LPSTR, winapi.INT]],
	GetWindowTextLengthA: [winapi.INT, [winapi.HWND]],
	GetWindowTextLengthW: [winapi.INT, [winapi.HWND]],
	GetWindowTextW: [winapi.INT, [winapi.HWND, winapi.LPWSTR, winapi.INT]],
	GetWindowThreadProcessId: [winapi.DWORD, [winapi.HWND, winapi.LPDWORD]],
	GrayStringA: [winapi.BOOL, [winapi.HDC, winapi.HBRUSH, winapi.GRAYSTRINGPROC, winapi.LPARAM, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.INT]],
	GrayStringW: [winapi.BOOL, [winapi.HDC, winapi.HBRUSH, winapi.GRAYSTRINGPROC, winapi.LPARAM, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.INT]],
	HideCaret: [winapi.BOOL, [winapi.HWND]],
	HiliteMenuItem: [winapi.BOOL, [winapi.HWND, winapi.HMENU, winapi.UINT, winapi.UINT]],
	InflateRect: [winapi.BOOL, [winapi.LPRECT, winapi.INT, winapi.INT]],
	InitializeTouchInjection: [winapi.BOOL, [winapi.UINT32, winapi.DWORD]],
	InjectSyntheticPointerInput: [winapi.BOOL, [winapi.HSYNTHETICPOINTERDEVICE, winapi.POINTER_TYPE_INFO, winapi.UINT32]],
	InjectTouchInput: [winapi.BOOL, [winapi.UINT32, winapi.POINTER_TOUCH_INFO]],
	InSendMessageEx: [winapi.DWORD, [winapi.LPVOID]],
	InsertMenuA: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT, winapi.UINT_PTR, winapi.LPCSTR]],
	InsertMenuItemA: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.BOOL, winapi.LPCMENUITEMINFOA]],
	InsertMenuItemW: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.BOOL, winapi.LPCMENUITEMINFOW]],
	InsertMenuW: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT, winapi.UINT_PTR, winapi.LPCWSTR]],
	InternalGetWindowText: [winapi.INT, [winapi.HWND, winapi.LPWSTR, winapi.INT]],
	IntersectRect: [winapi.BOOL, [winapi.LPRECT, winapi.RECT, winapi.RECT]],
	InvalidateRect: [winapi.BOOL, [winapi.HWND, winapi.RECT, winapi.BOOL]],
	InvalidateRgn: [winapi.BOOL, [winapi.HWND, winapi.HRGN, winapi.BOOL]],
	InvertRect: [winapi.BOOL, [winapi.HDC, winapi.RECT]],
	IsCharAlphaA: [winapi.BOOL, [winapi.CHAR]],
	IsCharAlphaNumericA: [winapi.BOOL, [winapi.CHAR]],
	IsCharAlphaNumericW: [winapi.BOOL, [winapi.WCHAR]],
	IsCharAlphaW: [winapi.BOOL, [winapi.WCHAR]],
	IsCharLowerA: [winapi.BOOL, [winapi.CHAR]],
	IsCharLowerW: [winapi.BOOL, [winapi.WCHAR]],
	IsCharUpperA: [winapi.BOOL, [winapi.CHAR]],
	IsCharUpperW: [winapi.BOOL, [winapi.WCHAR]],
	IsChild: [winapi.BOOL, [winapi.HWND, winapi.HWND]],
	IsClipboardFormatAvailable: [winapi.BOOL, [winapi.UINT]],
	IsDialogMessageA: [winapi.BOOL, [winapi.HWND, winapi.LPMSG]],
	IsDialogMessageW: [winapi.BOOL, [winapi.HWND, winapi.LPMSG]],
	IsDlgButtonChecked: [winapi.UINT, [winapi.HWND, winapi.INT]],
	IsGUIThread: [winapi.BOOL, [winapi.BOOL]],
	IsHungAppWindow: [winapi.BOOL, [winapi.HWND]],
	IsIconic: [winapi.BOOL, [winapi.HWND]],
	IsImmersiveProcess: [winapi.BOOL, [winapi.HANDLE]],
	IsMenu: [winapi.BOOL, [winapi.HMENU]],
	IsMouseInPointerEnabled: [winapi.BOOL, []],
	IsProcessDPIAware: [winapi.BOOL, []],
	IsRectEmpty: [winapi.BOOL, [winapi.RECT]],
	IsTouchWindow: [winapi.BOOL, [winapi.HWND, winapi.PULONG]],
	IsValidDpiAwarenessContext: [winapi.BOOL, [winapi.DPI_AWARENESS_CONTEXT]],
	IsWindow: [winapi.BOOL, [winapi.HWND]],
	IsWindowEnabled: [winapi.BOOL, [winapi.HWND]],
	IsWindowUnicode: [winapi.BOOL, [winapi.HWND]],
	IsWindowVisible: [winapi.BOOL, [winapi.HWND]],
	IsWinEventHookInstalled: [winapi.BOOL, [winapi.DWORD]],
	IsWow64Message: [winapi.BOOL, []],
	IsZoomed: [winapi.BOOL, [winapi.HWND]],
	keybd_event: [winapi.VOID, [winapi.BYTE, winapi.BYTE, winapi.DWORD, winapi.ULONG_PTR]],
	KillTimer: [winapi.BOOL, [winapi.HWND, winapi.UINT_PTR]],
	LoadAcceleratorsA: [winapi.HACCEL, [winapi.HINSTANCE, winapi.LPCSTR]],
	LoadAcceleratorsW: [winapi.HACCEL, [winapi.HINSTANCE, winapi.LPCWSTR]],
	LoadBitmapA: [winapi.HBITMAP, [winapi.HINSTANCE, winapi.LPCSTR]],
	LoadBitmapW: [winapi.HBITMAP, [winapi.HINSTANCE, winapi.LPCWSTR]],
	LoadCursorA: [winapi.HCURSOR, [winapi.HINSTANCE, winapi.LPCSTR]],
	LoadCursorFromFileA: [winapi.HCURSOR, [winapi.LPCSTR]],
	LoadCursorFromFileW: [winapi.HCURSOR, [winapi.LPCWSTR]],
	LoadCursorW: [winapi.HCURSOR, [winapi.HINSTANCE, winapi.LPCWSTR]],
	LoadIconA: [winapi.HICON, [winapi.HINSTANCE, winapi.LPCSTR]],
	LoadIconW: [winapi.HICON, [winapi.HINSTANCE, winapi.LPCWSTR]],
	LoadImageA: [winapi.HANDLE, [winapi.HINSTANCE, winapi.LPCSTR, winapi.UINT, winapi.INT, winapi.INT, winapi.UINT]],
	LoadImageW: [winapi.HANDLE, [winapi.HINSTANCE, winapi.LPCWSTR, winapi.UINT, winapi.INT, winapi.INT, winapi.UINT]],
	LoadKeyboardLayoutA: [winapi.HKL, [winapi.LPCSTR, winapi.UINT]],
	LoadKeyboardLayoutW: [winapi.HKL, [winapi.LPCWSTR, winapi.UINT]],
	LoadMenuA: [winapi.HMENU, [winapi.HINSTANCE, winapi.LPCSTR]],
	LoadMenuIndirectA: [winapi.HMENU, [winapi.MENUTEMPLATEA]],
	LoadMenuIndirectW: [winapi.HMENU, [winapi.MENUTEMPLATEW]],
	LoadMenuW: [winapi.HMENU, [winapi.HINSTANCE, winapi.LPCWSTR]],
	LoadStringA: [winapi.INT, [winapi.HINSTANCE, winapi.UINT, winapi.LPSTR, winapi.INT]],
	LoadStringW: [winapi.INT, [winapi.HINSTANCE, winapi.UINT, winapi.LPWSTR, winapi.INT]],
	LockSetForegroundWindow: [winapi.BOOL, [winapi.UINT]],
	LockWindowUpdate: [winapi.BOOL, [winapi.HWND]],
	LockWorkStation: [winapi.BOOL, []],
	LogicalToPhysicalPoint: [winapi.BOOL, [winapi.HWND, winapi.LPPOINT]],
	LogicalToPhysicalPointForPerMonitorDPI: [winapi.BOOL, [winapi.HWND, winapi.LPPOINT]],
	LookupIconIdFromDirectory: [winapi.INT, [winapi.PBYTE, winapi.BOOL]],
	LookupIconIdFromDirectoryEx: [winapi.INT, [winapi.PBYTE, winapi.BOOL, winapi.INT, winapi.INT, winapi.UINT]],
	MapDialogRect: [winapi.BOOL, [winapi.HWND, winapi.LPRECT]],
	MapVirtualKeyA: [winapi.UINT, [winapi.UINT, winapi.UINT]],
	MapVirtualKeyExA: [winapi.UINT, [winapi.UINT, winapi.UINT, winapi.HKL]],
	MapVirtualKeyExW: [winapi.UINT, [winapi.UINT, winapi.UINT, winapi.HKL]],
	MapVirtualKeyW: [winapi.UINT, [winapi.UINT, winapi.UINT]],
	MapWindowPoints: [winapi.INT, [winapi.HWND, winapi.HWND, winapi.LPPOINT, winapi.UINT]],
	MenuItemFromPoint: [winapi.INT, [winapi.HWND, winapi.HMENU, winapi.POINT]],
	MessageBeep: [winapi.BOOL, [winapi.UINT]],
	MessageBox: [winapi.INT, [winapi.HWND, winapi.LPCTSTR, winapi.LPCTSTR, winapi.UINT]],
	MessageBoxA: [winapi.INT, [winapi.HWND, winapi.LPCSTR, winapi.LPCSTR, winapi.UINT]],
	MessageBoxExA: [winapi.INT, [winapi.HWND, winapi.LPCSTR, winapi.LPCSTR, winapi.UINT, winapi.WORD]],
	MessageBoxExW: [winapi.INT, [winapi.HWND, winapi.LPCWSTR, winapi.LPCWSTR, winapi.UINT, winapi.WORD]],
	MessageBoxIndirectA: [winapi.INT, [winapi.MSGBOXPARAMSA]],
	MessageBoxIndirectW: [winapi.INT, [winapi.MSGBOXPARAMSW]],
	MessageBoxW: [winapi.INT, [winapi.HWND, winapi.LPCWSTR, winapi.LPCWSTR, winapi.UINT]],
	ModifyMenuA: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT, winapi.UINT_PTR, winapi.LPCSTR]],
	ModifyMenuW: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT, winapi.UINT_PTR, winapi.LPCWSTR]],
	MonitorFromPoint: [winapi.HMONITOR, [winapi.POINT, winapi.DWORD]],
	MonitorFromRect: [winapi.HMONITOR, [winapi.LPCRECT, winapi.DWORD]],
	MonitorFromWindow: [winapi.HMONITOR, [winapi.HWND, winapi.DWORD]],
	mouse_event: [winapi.VOID, [winapi.DWORD, winapi.DWORD, winapi.DWORD, winapi.DWORD, winapi.ULONG_PTR]],
	MoveWindow: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.BOOL]],
	MsgWaitForMultipleObjects: [winapi.DWORD, [winapi.DWORD, winapi.HANDLE, winapi.BOOL, winapi.DWORD, winapi.DWORD]],
	MsgWaitForMultipleObjectsEx: [winapi.DWORD, [winapi.DWORD, winapi.HANDLE, winapi.DWORD, winapi.DWORD, winapi.DWORD]],
	NotifyWinEvent: [winapi.VOID, [winapi.DWORD, winapi.HWND, winapi.LONG, winapi.LONG]],
	OemKeyScan: [winapi.DWORD, [winapi.WORD]],
	OemToCharA: [winapi.BOOL, [winapi.LPCSTR, winapi.LPSTR]],
	OemToCharBuffA: [winapi.BOOL, [winapi.LPCSTR, winapi.LPSTR, winapi.DWORD]],
	OemToCharBuffW: [winapi.BOOL, [winapi.LPCSTR, winapi.LPWSTR, winapi.DWORD]],
	OemToCharW: [winapi.BOOL, [winapi.LPCSTR, winapi.LPWSTR]],
	OffsetRect: [winapi.BOOL, [winapi.LPRECT, winapi.INT, winapi.INT]],
	OpenClipboard: [winapi.BOOL, [winapi.HWND]],
	OpenDesktopA: [winapi.HDESK, [winapi.LPCSTR, winapi.DWORD, winapi.BOOL, winapi.ACCESS_MASK]],
	OpenDesktopW: [winapi.HDESK, [winapi.LPCWSTR, winapi.DWORD, winapi.BOOL, winapi.ACCESS_MASK]],
	OpenIcon: [winapi.BOOL, [winapi.HWND]],
	OpenInputDesktop: [winapi.HDESK, [winapi.DWORD, winapi.BOOL, winapi.ACCESS_MASK]],
	OpenWindowStationA: [winapi.HWINSTA, [winapi.LPCSTR, winapi.BOOL, winapi.ACCESS_MASK]],
	OpenWindowStationW: [winapi.HWINSTA, [winapi.LPCWSTR, winapi.BOOL, winapi.ACCESS_MASK]],
	PackTouchHitTestingProximityEvaluation: [winapi.LRESULT, [winapi.TOUCH_HIT_TESTING_INPUT, winapi.TOUCH_HIT_TESTING_PROXIMITY_EVALUATION]],*/
	PaintDesktop: [winapi.BOOL, [winapi.HDC]],
	PeekMessageA: [winapi.BOOL, [winapi.LPMSG, winapi.HWND, winapi.UINT, winapi.UINT, winapi.UINT]],
	PeekMessageW: [winapi.BOOL, [winapi.LPMSG, winapi.HWND, winapi.UINT, winapi.UINT, winapi.UINT]],
	PhysicalToLogicalPoint: [winapi.BOOL, [winapi.HWND, winapi.LPPOINT]],
	PhysicalToLogicalPointForPerMonitorDPI: [winapi.BOOL, [winapi.HWND, winapi.LPPOINT]],
	PostMessageA: [winapi.BOOL, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	PostMessageW: [winapi.BOOL, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	PostQuitMessage: [winapi.VOID, [winapi.INT]],
	PostThreadMessageA: [winapi.BOOL, [winapi.DWORD, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	PostThreadMessageW: [winapi.BOOL, [winapi.DWORD, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	PrintWindow: [winapi.BOOL, [winapi.HWND, winapi.HDC, winapi.UINT]],
	PrivateExtractIconsA: [winapi.UINT, [winapi.LPCSTR, winapi.INT, winapi.INT, winapi.INT, winapi.HICON, winapi.UINT, winapi.UINT, winapi.UINT]],
	PrivateExtractIconsW: [winapi.UINT, [winapi.LPCWSTR, winapi.INT, winapi.INT, winapi.INT, winapi.HICON, winapi.UINT, winapi.UINT, winapi.UINT]],
	PtInRect: [winapi.BOOL, [winapi.RECT, winapi.POINT]],/*
	QueryDisplayConfig: [winapi.LONG, [winapi.UINT32, winapi.UINT32, winapi.DISPLAYCONFIG_PATH_INFO, winapi.UINT32, winapi.DISPLAYCONFIG_MODE_INFO, winapi.DISPLAYCONFIG_TOPOLOGY_ID]],
	RealChildWindowFromPoint: [winapi.HWND, [winapi.HWND, winapi.POINT]],
	RealGetWindowClassW: [winapi.UINT, [winapi.HWND, winapi.LPWSTR, winapi.UINT]],*/
	RedrawWindow: [winapi.BOOL, [winapi.HWND, winapi.RECT, winapi.HRGN, winapi.UINT]],
	RegisterClassExA: [winapi.ATOM, [winapi.WNDCLASSEXA]],
	RegisterClassExW: [winapi.ATOM, [winapi.WNDCLASSEXW]],
//	RegisterClassW: [winapi.ATOM, [winapi.WNDCLASSW]],
	RegisterClipboardFormatA: [winapi.UINT, [winapi.LPCSTR]],
	RegisterClipboardFormatW: [winapi.UINT, [winapi.LPCWSTR]],
/*	RegisterDeviceNotificationA: [winapi.HDEVNOTIFY, [winapi.HANDLE, winapi.LPVOID, winapi.DWORD]],
	RegisterDeviceNotificationW: [winapi.HDEVNOTIFY, [winapi.HANDLE, winapi.LPVOID, winapi.DWORD]],
	RegisterHotKey: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.UINT, winapi.UINT]],
	RegisterPointerDeviceNotifications: [winapi.BOOL, [winapi.HWND, winapi.BOOL]],
	RegisterPointerInputTarget: [winapi.BOOL, [winapi.HWND, winapi.POINTER_INPUT_TYPE]],
	RegisterPointerInputTargetEx: [winapi.BOOL, [winapi.HWND, winapi.POINTER_INPUT_TYPE, winapi.BOOL]],
	RegisterPowerSettingNotification: [winapi.HPOWERNOTIFY, [winapi.HANDLE, winapi.LPCGUID, winapi.DWORD]],
	RegisterRawInputDevices: [winapi.BOOL, [winapi.PCRAWINPUTDEVICE, winapi.UINT, winapi.UINT]],
	RegisterShellHookWindow: [winapi.BOOL, [winapi.HWND]],
	RegisterSuspendResumeNotification: [winapi.HPOWERNOTIFY, [winapi.HANDLE, winapi.DWORD]],
	RegisterTouchHitTestingWindow: [winapi.BOOL, [winapi.HWND, winapi.ULONG]],
	RegisterTouchWindow: [winapi.BOOL, [winapi.HWND, winapi.ULONG]],
	RegisterWindowMessageA: [winapi.UINT, [winapi.LPCSTR]],
	RegisterWindowMessageW: [winapi.UINT, [winapi.LPCWSTR]],
	ReleaseCapture: [winapi.BOOL, []],
	ReleaseDC: [winapi.INT, [winapi.HWND, winapi.HDC]],
	RemoveClipboardFormatListener: [winapi.BOOL, [winapi.HWND]],
	RemoveMenu: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT]],
	RemovePropA: [winapi.HANDLE, [winapi.HWND, winapi.LPCSTR]],
	RemovePropW: [winapi.HANDLE, [winapi.HWND, winapi.LPCWSTR]],
	ReplyMessage: [winapi.BOOL, [winapi.LRESULT]],
	ScreenToClient: [winapi.BOOL, [winapi.HWND, winapi.LPPOINT]],
	ScrollDC: [winapi.BOOL, [winapi.HDC, winapi.INT, winapi.INT, winapi.RECT, winapi.RECT, winapi.HRGN, winapi.LPRECT]],
	ScrollWindow: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.INT, winapi.RECT, winapi.RECT]],
	ScrollWindowEx: [winapi.INT, [winapi.HWND, winapi.INT, winapi.INT, winapi.RECT, winapi.RECT, winapi.HRGN, winapi.LPRECT, winapi.UINT]],
	SendDlgItemMessageA: [winapi.LRESULT, [winapi.HWND, winapi.INT, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	SendDlgItemMessageW: [winapi.LRESULT, [winapi.HWND, winapi.INT, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	SendInput: [winapi.UINT, [winapi.UINT, winapi.LPINPUT, winapi.INT]],
	SendMessage: [winapi.LRESULT, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	SendMessageA: [winapi.LRESULT, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	SendMessageCallbackA: [winapi.BOOL, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM, winapi.SENDASYNCPROC, winapi.ULONG_PTR]],
	SendMessageCallbackW: [winapi.BOOL, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM, winapi.SENDASYNCPROC, winapi.ULONG_PTR]],
	SendMessageTimeoutA: [winapi.LRESULT, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM, winapi.UINT, winapi.UINT, winapi.PDWORD_PTR]],
	SendMessageTimeoutW: [winapi.LRESULT, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM, winapi.UINT, winapi.UINT, winapi.PDWORD_PTR]],
	SendMessageW: [winapi.LRESULT, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	SendNotifyMessageA: [winapi.BOOL, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	SendNotifyMessageW: [winapi.BOOL, [winapi.HWND, winapi.UINT, winapi.WPARAM, winapi.LPARAM]],
	SetActiveWindow: [winapi.HWND, [winapi.HWND]],
	SetCapture: [winapi.HWND, [winapi.HWND]],
	SetCaretBlinkTime: [winapi.BOOL, [winapi.UINT]],
	SetCaretPos: [winapi.BOOL, [winapi.INT, winapi.INT]],
	SetClassLongA: [winapi.DWORD, [winapi.HWND, winapi.INT, winapi.LONG]],
	SetClassLongPtrA: [winapi.ULONG_PTR, [winapi.HWND, winapi.INT, winapi.LONG_PTR]],
	SetClassLongPtrW: [winapi.ULONG_PTR, [winapi.HWND, winapi.INT, winapi.LONG_PTR]],
	SetClassLongW: [winapi.DWORD, [winapi.HWND, winapi.INT, winapi.LONG]],
	SetClassWord: [winapi.WORD, [winapi.HWND, winapi.INT, winapi.WORD]],
	SetClipboardData: [winapi.HANDLE, [winapi.UINT, winapi.HANDLE]],
	SetClipboardViewer: [winapi.HWND, [winapi.HWND]],
	SetCoalescableTimer: [winapi.UINT_PTR, [winapi.HWND, winapi.UINT_PTR, winapi.UINT, winapi.TIMERPROC, winapi.ULONG]],
	SetCursor: [winapi.HCURSOR, [winapi.HCURSOR]],
	SetCursorPos: [winapi.BOOL, [winapi.INT, winapi.INT]],
	SetDialogControlDpiChangeBehavior: [winapi.BOOL, [winapi.HWND, winapi.DIALOG_CONTROL_DPI_CHANGE_BEHAVIORS, winapi.DIALOG_CONTROL_DPI_CHANGE_BEHAVIORS]],
	SetDialogDpiChangeBehavior: [winapi.BOOL, [winapi.HWND, winapi.DIALOG_DPI_CHANGE_BEHAVIORS, winapi.DIALOG_DPI_CHANGE_BEHAVIORS]],
	SetDisplayAutoRotationPreferences: [winapi.BOOL, [winapi.ORIENTATION_PREFERENCE]],
	SetDisplayConfig: [winapi.LONG, [winapi.UINT32, winapi.DISPLAYCONFIG_PATH_INFO, winapi.UINT32, winapi.DISPLAYCONFIG_MODE_INFO, winapi.UINT32]],
	SetDlgItemInt: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.UINT, winapi.BOOL]],
	SetDlgItemTextA: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.LPCSTR]],
	SetDlgItemTextW: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.LPCWSTR]],
	SetDoubleClickTime: [winapi.BOOL, [winapi.UINT]],
	SetFocus: [winapi.HWND, [winapi.HWND]],
	SetForegroundWindow: [winapi.BOOL, [winapi.HWND]],
	SetGestureConfig: [winapi.BOOL, [winapi.HWND, winapi.DWORD, winapi.UINT, winapi.PGESTURECONFIG, winapi.UINT]],
	SetKeyboardState: [winapi.BOOL, [winapi.LPBYTE]],
	SetLastErrorEx: [winapi.VOID, [winapi.DWORD, winapi.DWORD]],
	SetLayeredWindowAttributes: [winapi.BOOL, [winapi.HWND, winapi.COLORREF, winapi.BYTE, winapi.DWORD]],
	SetMenu: [winapi.BOOL, [winapi.HWND, winapi.HMENU]],
	SetMenuContextHelpId: [winapi.BOOL, [winapi.HMENU, winapi.DWORD]],
	SetMenuDefaultItem: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT]],
	SetMenuInfo: [winapi.BOOL, [winapi.HMENU, winapi.LPCMENUINFO]],
	SetMenuItemBitmaps: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.UINT, winapi.HBITMAP, winapi.HBITMAP]],
	SetMenuItemInfoA: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.BOOL, winapi.LPCMENUITEMINFOA]],
	SetMenuItemInfoW: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.BOOL, winapi.LPCMENUITEMINFOW]],
	SetMessageExtraInfo: [winapi.LPARAM, [winapi.LPARAM]],
	SetParent: [winapi.HWND, [winapi.HWND, winapi.HWND]],
	SetPhysicalCursorPos: [winapi.BOOL, [winapi.INT, winapi.INT]],
	SetProcessDefaultLayout: [winapi.BOOL, [winapi.DWORD]],
	SetProcessDPIAware: [winapi.BOOL, []],
	SetProcessDpiAwarenessContext: [winapi.BOOL, [winapi.DPI_AWARENESS_CONTEXT]],
	SetProcessRestrictionExemption: [winapi.BOOL, [winapi.BOOL]],
	SetProcessWindowStation: [winapi.BOOL, [winapi.HWINSTA]],
	SetPropA: [winapi.BOOL, [winapi.HWND, winapi.LPCSTR, winapi.HANDLE]],
	SetPropW: [winapi.BOOL, [winapi.HWND, winapi.LPCWSTR, winapi.HANDLE]],
	SetRect: [winapi.BOOL, [winapi.LPRECT, winapi.INT, winapi.INT, winapi.INT, winapi.INT]],
	SetRectEmpty: [winapi.BOOL, [winapi.LPRECT]],
	SetScrollInfo: [winapi.INT, [winapi.HWND, winapi.INT, winapi.LPCSCROLLINFO, winapi.BOOL]],
	SetScrollPos: [winapi.INT, [winapi.HWND, winapi.INT, winapi.INT, winapi.BOOL]],
	SetScrollRange: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.INT, winapi.INT, winapi.BOOL]],
	SetSysColors: [winapi.BOOL, [winapi.INT, winapi.INT, winapi.COLORREF]],
	SetSystemCursor: [winapi.BOOL, [winapi.HCURSOR, winapi.DWORD]],
	SetThreadDesktop: [winapi.BOOL, [winapi.HDESK]],
	SetThreadDpiAwarenessContext: [winapi.DPI_AWARENESS_CONTEXT, [winapi.DPI_AWARENESS_CONTEXT]],
	SetThreadDpiHostingBehavior: [winapi.DPI_HOSTING_BEHAVIOR, [winapi.DPI_HOSTING_BEHAVIOR]],
	SetTimer: [winapi.UINT_PTR, [winapi.HWND, winapi.UINT_PTR, winapi.UINT, winapi.TIMERPROC]],
	SetUserObjectInformationA: [winapi.BOOL, [winapi.HANDLE, winapi.INT, winapi.PVOID, winapi.DWORD]],
	SetUserObjectInformationW: [winapi.BOOL, [winapi.HANDLE, winapi.INT, winapi.PVOID, winapi.DWORD]],
	SetUserObjectSecurity: [winapi.BOOL, [winapi.HANDLE, winapi.PSECURITY_INFORMATION, winapi.PSECURITY_DESCRIPTOR]],
	SetWindowContextHelpId: [winapi.BOOL, [winapi.HWND, winapi.DWORD]],
	SetWindowDisplayAffinity: [winapi.BOOL, [winapi.HWND, winapi.DWORD]],
	SetWindowFeedbackSetting: [winapi.BOOL, [winapi.HWND, winapi.FEEDBACK_TYPE, winapi.DWORD, winapi.UINT32, winapi.VOID]],
	SetWindowLongA: [winapi.LONG, [winapi.HWND, winapi.INT, winapi.LONG]],
	SetWindowLongPtrA: [winapi.LONG_PTR, [winapi.HWND, winapi.INT, winapi.LONG_PTR]],
	SetWindowLongPtrW: [winapi.LONG_PTR, [winapi.HWND, winapi.INT, winapi.LONG_PTR]],
	SetWindowLongW: [winapi.LONG, [winapi.HWND, winapi.INT, winapi.LONG]],
	SetWindowPlacement: [winapi.BOOL, [winapi.HWND, winapi.WINDOWPLACEMENT]],
	SetWindowPos: [winapi.BOOL, [winapi.HWND, winapi.HWND, winapi.INT, winapi.INT, winapi.INT, winapi.INT, winapi.UINT]],
	SetWindowRgn: [winapi.INT, [winapi.HWND, winapi.HRGN, winapi.BOOL]],
	SetWindowsHookExA: [winapi.HHOOK, [winapi.INT, winapi.HOOKPROC, winapi.HINSTANCE, winapi.DWORD]],
	SetWindowsHookExW: [winapi.HHOOK, [winapi.INT, winapi.HOOKPROC, winapi.HINSTANCE, winapi.DWORD]],
	SetWindowTextA: [winapi.BOOL, [winapi.HWND, winapi.LPCSTR]],
	SetWindowTextW: [winapi.BOOL, [winapi.HWND, winapi.LPCWSTR]],
	SetWinEventHook: [winapi.HWINEVENTHOOK, [winapi.DWORD, winapi.DWORD, winapi.HMODULE, winapi.WINEVENTPROC, winapi.DWORD, winapi.DWORD, winapi.DWORD]],*/
	ShowCaret: [winapi.BOOL, [winapi.HWND]],
	ShowCursor: [winapi.INT, [winapi.BOOL]],
	ShowOwnedPopups: [winapi.BOOL, [winapi.HWND, winapi.BOOL]],
	ShowScrollBar: [winapi.BOOL, [winapi.HWND, winapi.INT, winapi.BOOL]],
	ShowWindow: [winapi.BOOL, [winapi.HWND, winapi.INT]],
	ShowWindowAsync: [winapi.BOOL, [winapi.HWND, winapi.INT]],
	ShutdownBlockReasonCreate: [winapi.BOOL, [winapi.HWND, winapi.LPCWSTR]],
	ShutdownBlockReasonDestroy: [winapi.BOOL, [winapi.HWND]],
	ShutdownBlockReasonQuery: [winapi.BOOL, [winapi.HWND, winapi.LPWSTR, winapi.DWORD]],
	SkipPointerFrameMessages: [winapi.BOOL, [winapi.UINT]],
	SoundSentry: [winapi.BOOL, []],
	SubtractRect: [winapi.BOOL, [winapi.LPRECT, winapi.RECT, winapi.RECT]],
	SwapMouseButton: [winapi.BOOL, [winapi.BOOL]],
	SwitchDesktop: [winapi.BOOL, [winapi.HDESK]],
	SwitchToThisWindow: [winapi.VOID, [winapi.HWND, winapi.BOOL]],
	SystemParametersInfoA: [winapi.BOOL, [winapi.UINT, winapi.UINT, winapi.PVOID, winapi.UINT]],
	SystemParametersInfoForDpi: [winapi.BOOL, [winapi.UINT, winapi.UINT, winapi.PVOID, winapi.UINT, winapi.UINT]],
	SystemParametersInfoW: [winapi.BOOL, [winapi.UINT, winapi.UINT, winapi.PVOID, winapi.UINT]],
	TabbedTextOutA: [winapi.LONG, [winapi.HDC, winapi.INT, winapi.INT, winapi.LPCSTR, winapi.INT, winapi.INT, winapi.INT, winapi.INT]],
	TabbedTextOutW: [winapi.LONG, [winapi.HDC, winapi.INT, winapi.INT, winapi.LPCWSTR, winapi.INT, winapi.INT, winapi.INT, winapi.INT]],
	TileWindows: [winapi.WORD, [winapi.HWND, winapi.UINT, winapi.RECT, winapi.UINT, winapi.HWND]],
	ToAscii: [winapi.INT, [winapi.UINT, winapi.UINT, winapi.BYTE, winapi.LPWORD, winapi.UINT]],
	ToAsciiEx: [winapi.INT, [winapi.UINT, winapi.UINT, winapi.BYTE, winapi.LPWORD, winapi.UINT, winapi.HKL]],
//	TOUCH_COORD_TO_PIXEL: [winapi.VOID, []],
	ToUnicode: [winapi.INT, [winapi.UINT, winapi.UINT, winapi.BYTE, winapi.LPWSTR, winapi.INT, winapi.UINT]],
	ToUnicodeEx: [winapi.INT, [winapi.UINT, winapi.UINT, winapi.BYTE, winapi.LPWSTR, winapi.INT, winapi.UINT, winapi.HKL]],/*
	TrackMouseEvent: [winapi.BOOL, [winapi.LPTRACKMOUSEEVENT]],
	TrackPopupMenu: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.INT, winapi.INT, winapi.INT, winapi.HWND, winapi.RECT]],
	TrackPopupMenuEx: [winapi.BOOL, [winapi.HMENU, winapi.UINT, winapi.INT, winapi.INT, winapi.HWND, winapi.LPTPMPARAMS]],*/
	TranslateAcceleratorA: [winapi.INT, [winapi.HWND, winapi.HACCEL, winapi.LPMSG]],
	TranslateAcceleratorW: [winapi.INT, [winapi.HWND, winapi.HACCEL, winapi.LPMSG]],
	TranslateMDISysAccel: [winapi.BOOL, [winapi.HWND, winapi.LPMSG]],
	TranslateMessage: [winapi.BOOL, [winapi.MSG]],
	UnhookWindowsHookEx: [winapi.BOOL, [winapi.HHOOK]],/*
	UnhookWinEvent: [winapi.BOOL, [winapi.HWINEVENTHOOK]],
	UnionRect: [winapi.BOOL, [winapi.LPRECT, winapi.RECT, winapi.RECT]],
	UnloadKeyboardLayout: [winapi.BOOL, [winapi.HKL]],
	UnregisterClassA: [winapi.BOOL, [winapi.LPCSTR, winapi.HINSTANCE]],
	UnregisterClassW: [winapi.BOOL, [winapi.LPCWSTR, winapi.HINSTANCE]],
	UnregisterDeviceNotification: [winapi.BOOL, [winapi.HDEVNOTIFY]],
	UnregisterHotKey: [winapi.BOOL, [winapi.HWND, winapi.INT]],
	UnregisterPointerInputTarget: [winapi.BOOL, [winapi.HWND, winapi.POINTER_INPUT_TYPE]],
	UnregisterPointerInputTargetEx: [winapi.BOOL, [winapi.HWND, winapi.POINTER_INPUT_TYPE]],
	UnregisterPowerSettingNotification: [winapi.BOOL, [winapi.HPOWERNOTIFY]],
	UnregisterSuspendResumeNotification: [winapi.BOOL, [winapi.HPOWERNOTIFY]],
	UnregisterTouchWindow: [winapi.BOOL, [winapi.HWND]],/
	UpdateLayeredWindow: [winapi.BOOL, [winapi.HWND, winapi.HDC, winapi.POINT, winapi.SIZE, winapi.HDC, winapi.POINT, winapi.COLORREF, winapi.BLENDFUNCTION, winapi.DWORD]],
	UpdateWindow: [winapi.BOOL, [winapi.HWND]],
	UserHandleGrantAccess: [winapi.BOOL, [winapi.HANDLE, winapi.HANDLE, winapi.BOOL]],
	ValidateRect: [winapi.BOOL, [winapi.HWND, winapi.RECT]],
	ValidateRgn: [winapi.BOOL, [winapi.HWND, winapi.HRGN]],
	VkKeyScanA: [winapi.SHORT, [winapi.CHAR]],
	VkKeyScanExA: [winapi.SHORT, [winapi.CHAR, winapi.HKL]],*/
	VkKeyScanExW: [winapi.SHORT, [winapi.WCHAR, winapi.HKL]],
	VkKeyScanW: [winapi.SHORT, [winapi.WCHAR]],
	WaitForInputIdle: [winapi.DWORD, [winapi.HANDLE, winapi.DWORD]],
	WaitMessage: [winapi.BOOL, []],
	WindowFromDC: [winapi.HWND, [winapi.HDC]],
	WindowFromPhysicalPoint: [winapi.HWND, [winapi.POINT]],
	WindowFromPoint: [winapi.HWND, [winapi.POINT]],
	WinHelpA: [winapi.BOOL, [winapi.HWND, winapi.LPCSTR, winapi.UINT, winapi.ULONG_PTR]],
	WinHelpW: [winapi.BOOL, [winapi.HWND, winapi.LPCWSTR, winapi.UINT, winapi.ULONG_PTR]]
});
//console.log([winapi.HWND, [winapi.HINSTANCE, winapi.LPCDLGTEMPLATEW, winapi.HWND, winapi.DLGPROC, winapi.LPARAM]])
var WindowProc=ffi.Callback(...winapi.fn.WNDPROC,(hwnd,uMsg,wParam,lParam)=>{
	switch(uMsg){
		case 2:
			current.PostQuitMessage(0);
			return 0;
	}
	var r=current.DefWindowProcA(hwnd,uMsg,wParam,lParam);
	console.log('is this executed',uMsg,r);
	return r;
})
//current.MessageBoxA(ref.NULL, ref.allocCString("Mire al cielo"), "un programa muy interesante", 0);
var charp=ref.allocCString("ayy lmao hope this works\0\0\0\0");
var wn=new winapi.WNDCLASSA({lpszClassName:charp,lpfnWndProc:WindowProc,hInstance:ref.NULL});
current.RegisterClassA(wn.ref());
var hwnd=current.CreateWindowExA(0,charp,"hello boris\0\0\0\0",(0x00000000 | 0x00C00000 | 0x00080000 | 0x00040000 | 0x00020000 | 0x00010000),-2147483648,-2147483648,-2147483648,-2147483648,ref.NULL,ref.NULL,ref.NULL,ref.NULL);
console.log("I am okay with this");
if(hwnd==ref.NULL){
console.log("CreateWindow didn't work :/")
}else{
	console.log(hwnd.type)
	current.ShowWindow(hwnd,0);
	//current.ShowWindow(hwnd,0);
	var msg=new winapi.MSG();
	console.log(buf2hex(msg["ref.buffer"]));
	current.GetMessageA.async(msg.ref(),ref.NULL,0,0,(err,res)=>{
		console.log("got message!")
	});
	//console.log("result:",current.GetMessageA(msg.ref(),ref.NULL,0,0),"got message");
/*	console.log(buf2hex(msg["ref.buffer"]));
	current.TranslateMessage(msg.ref());
	console.log(buf2hex(msg["ref.buffer"]));
	current.DispatchMessageA(msg.ref());
	console.log(buf2hex(msg["ref.buffer"]));
	current.GetMessageA(msg.ref(),ref.NULL,0,0);
	//never returns
	console.log("NEVER")
	while(current.GetMessageA(msg.ref(),ref.NULL,0,0)){
		console.log("well")
		current.TranslateMessage(msg.ref());
		console.log("Translated");
		current.DispatchMessageA(msg.ref());
		console.log("Dispatched");
	}*/
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
console.log("WHAT");
