var ffi = require('ffi-napi')
var ref = require('ref-napi');
var ArrayType = require('ref-array-di')(ref);
var StructType = require('ref-struct-di')(ref);
var Union = require('ref-union-di')(ref);
var {
  winapi,
  user32,
  gdi32,
  constants,
  wintypes,
  kernel32
} = require('./winapi.js')
//var util = require('util');

//doesn't work because it calls it from another thread, and it's even slower.
//var user32async=Object.fromEntries(Object.entries(user32).map(([k,v])=>[k,util.promisify(v.async)]))
//var gdi32async=Object.fromEntries(Object.entries(gdi32).map(([k,v])=>[k,util.promisify(v.async)]))



var mwin = winapi.goodies.createWindow({
  className: "someclass\0",
  ExStyle: 0,
  title: "Title Text\0",
  Style: constants.styles.WS_OVERLAPPEDWINDOW,
  X: 0,
  Y: 0,
  nWidth: 640,
  nHeight: 480,
  hWndParent: 0,
  hMenu: 0,
  hInstance: 0,
  lParam: ref.NULL,
  swflag:constants.ShowWindow.SW_SHOW

});
user32.AddClipboardFormatListener(mwin.hwnd);
mwin.on("WM_CLIPBOARDUPDATE", (obj) => {
  var {
    hwnd,
    wParam,
    lParam
  } = obj;
  console.log("Clipboard has changed mf");
  if (!user32.IsClipboardFormatAvailable(constants.clipboardFormats.CF_TEXT) || !user32.OpenClipboard(hwnd))
    return;
  var clipcount = user32.CountClipboardFormats();
    var clipformats = [];
    var intervalue = 0;
    while (clipcount--) {
      intervalue = user32.EnumClipboardFormats(intervalue)
      clipformats.push(intervalue)
    }

    console.log(clipformats)
    console.log(clipformats.map(_ => constants.clipboardFormats[_]))
  var hglb = user32.GetClipboardData(constants.clipboardFormats.CF_TEXT) //,wintypes.HGLOBAL);	   
  var lptstr = kernel32.GlobalLock(hglb);
  var size = kernel32.GlobalSize(hglb);
  console.log("buffer size:", size)
  console.log(ref.reinterpret(lptstr, size).toString());
  kernel32.GlobalUnlock(hglb)
  user32.CloseClipboard();
});
mwin.on("WM_PAINT", (obj) => {
  var {
    hwnd,
    wParam,
    lParam
  } = obj;
  const DT_SINGLELINE = 0x20;
  const DT_NOCLIP = 0x100;
  var ps = new wintypes.PAINTSTRUCT();
  var rect = new wintypes.RECT();
  var hdc = user32.BeginPaint(hwnd, ps.ref());
  //console.log(buf2hex(ps.rcPaint['ref.buffer']));
  user32.FillRect(hdc, ps.rcPaint.ref(), 4);
  gdi32.TextOutA(hdc, 50, 50, "this is a test\0", 8);
  user32.DrawTextA(hdc, "Hello World!", -1, rect.ref(), DT_SINGLELINE | DT_NOCLIP);
  user32.EndPaint(hwnd, ps.ref());
  obj.preventDefaulted = true;
  obj.result = 0;
});
//winapi.goodies.win32messageHandler.open();
mwin.on("WM_DESTROY", (obj) => {
  console.log("Did you just click the X button on me?");
  user32.PostQuitMessage(0);
  //winapi.goodies.win32messageHandler.close();
  obj.preventDefaulted = true;
  obj.result = 0;
});


console.log("wintypes.KBDLLHOOKSTRUCT.size", wintypes.KBDLLHOOKSTRUCT.size)

var proc = ffi.Callback(...wintypes.fn.ThreadProc, () => {
  user32.MessageBoxA(0, "example", null, constants.msgbox.MB_OK | constants.msgbox.MB_ICONEXCLAMATION);
});
const MOD_ALT = 0x0001;
const MOD_NOREPEAT = 0x4000;
const MOD_CONTROL = 0x2;
const MOD_SHIFT = 0x4;

function registerhotkey() {
  if (user32.RegisterHotKey(0, 1, MOD_CONTROL | MOD_NOREPEAT, 0x42)) {
    console.log("Hotkey 'CTRL+b' registered, using MOD_NOREPEAT flag\n");
  }
}
registerhotkey();
var devices=winapi.goodies.getRawInputDeviceList();
var devecinames=devices._toJSON().map(_=>winapi.goodies.getRawInputDeviceInfo(_.hDevice,constants.RawInputDeviceInformationCommand.RIDI_DEVICENAME))

//console.log(devices.toJSON().map(_=>_.toJSON()).map(_=>winapi.goodies.getRawInputDeviceInfo(_.hDevice,constants.RawInputDeviceInformationCommand.RIDI_DEVICENAME)))
winapi.goodies.callbacks = [mwin, proc];

winapi.goodies.win32messageHandler.on("WM_KEYUP", (l, w) => {
  console.log("WM_KEYUP", l, w, constants.keys[w] || String.fromCharCode(w))
});

function onhotkey(lParam, wParam) {
  //console.log("message..",constants.msg[msg.message],msg.message.toString(16));	
  console.log('hotkey executed')
  const INPUT_MOUSE = 0;
  const INPUT_KEYBOARD = 1;
  const KEYEVENTF_KEYUP = 2;
  const MOUSEEVENTF_MOVE = 1;
  const HWND_BROADCAST = 0xffff;
  //user32.UnregisterHotKey(0,1);
  //user32.PostMessageA(HWND_BROADCAST,constants.msg.WM_HOTKEY,wParam,lParam);
  //registerhotkey();
  if (String.fromCharCode(constants.macros.LOWORD(lParam)) == "B") {
    var bufferarr = [];
    var highorder = constants.macros.HIWORD(lParam);
    if (highorder & MOD_CONTROL) {
      let l = new wintypes.INPUT();
      l.type = INPUT_KEYBOARD;
      l.DUMMYUNIONNAME.ki.wScan = 0;
      l.DUMMYUNIONNAME.ki.time = 0;
      l.DUMMYUNIONNAME.ki.dwExtraInfo = 0;
      l.DUMMYUNIONNAME.ki.wVk = constants.keys.VK_CONTROL;
      l.DUMMYUNIONNAME.ki.dwFlags = 0;
      l.DUMMYUNIONNAME.ki.dwFlags = KEYEVENTF_KEYUP;
      bufferarr.push(l.ref());
    }
    //function onkeyup(lParam,wParam){


    //}
    //winapi.goodies.win32messageHandler.conditionalOnce("WM_KEYUP",onkeyup,(lParam,wParam)=>);
	var hWnd = winapi.goodies.getFocusedHandle();
	winapi.goodies.SendMessageCallbackA(hWnd, constants.msg.WM_COPY, 0, 0,_=>{console.log("I've been called back?")})
    //user32.PostMessageA();
	console.log('copy?')
    var win = new wintypes.INPUT();
    win.type = INPUT_KEYBOARD;
    win.DUMMYUNIONNAME.ki.wScan = 0;
    win.DUMMYUNIONNAME.ki.time = 0;
    win.DUMMYUNIONNAME.ki.dwExtraInfo = 0;
    win.DUMMYUNIONNAME.ki.wVk = 0x41;
    win.DUMMYUNIONNAME.ki.dwFlags = 0;
    bufferarr.push(win.ref());
    var mclick = new wintypes.INPUT();
    //ZeroMemory(&buffer, sizeof(buffer));
    mclick.type = INPUT_MOUSE;
    mclick.DUMMYUNIONNAME.mi.dx = 0;
    mclick.DUMMYUNIONNAME.mi.dy = 10;
    mclick.DUMMYUNIONNAME.mi.mouseData = 0;
    mclick.DUMMYUNIONNAME.mi.dwFlags = MOUSEEVENTF_MOVE;
    mclick.DUMMYUNIONNAME.mi.time = 0;
    mclick.DUMMYUNIONNAME.mi.dwExtraInfo = 0;
    bufferarr.push(mclick.ref());
    //console.log(Buffer.concat(bufferarr))
    //console.log("before sendinput")
    //winapi.goodies.errorHandling(user32.SendInput, _ => _ !== bufferarr.length, "sendInput")(bufferarr.length, Buffer.concat(bufferarr), wintypes.INPUT.size);
    //console.log("after sendinput")
    win.DUMMYUNIONNAME.ki.dwFlags = KEYEVENTF_KEYUP;
    //user32.SendInput(1, win.ref(), wintypes.INPUT.size);
    //winapi.kernel32.CreateThread(null, 0, proc, ref.NULL, 0, ref.NULL);
    //user32.MessageBoxA(0, ref.allocCString("Mire al cielo"), "un programa muy interesante", 0);
  }
}
winapi.goodies.win32messageHandler.on("WM_CLIPBOARDUPDATE",_=>{console.log("wow this executed?")});
winapi.goodies.win32messageHandler.on("WM_HOTKEY", onhotkey);
winapi.goodies.win32messageHandler.on("WH_KEYBOARD_LL",_=>console.log(Object.fromEntries(Object.entries(_).map(([k,v])=>{if(k=="vkCode")return [k,constants.keys[v]||String.fromCharCode(v)]; else return [k,v]}))));
