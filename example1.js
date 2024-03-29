var {goodies,constants,done} = require('./winapi.js')


done.then(({fn,winapicore})=>{
	const wintypes=winapicore.wintypes;
	goodies.win32messageHandler.open();
	var mwin = goodies.createWindow({
  className: Buffer.from("someclass\0"),
  ExStyle: 0,
  title: Buffer.from("Title Text\0"),
  Style: wintypes.WINDOW_STYLE.values.WS_OVERLAPPEDWINDOW,
  X: 0,
  Y: 0,
  nWidth: 640,
  nHeight: 480,
  hWndParent: 0,
  hMenu: 0,
  hInstance: 0,
  lParam: winapicore.ref.NULL,
  swflag:wintypes.SHOW_WINDOW_CMD.values.SW_SHOW

});
fn.AddClipboardFormatListener(mwin.hwnd);
mwin.on(wintypes.UInt32.constants.WM_CLIPBOARDUPDATE, (obj) => {
  var {
    hwnd,
    wParam,
    lParam
  } = obj;
  console.log("Clipboard has changed mf");
  if (!fn.IsClipboardFormatAvailable(winapicore.wintypes.CLIPBOARD_FORMATS.values.CF_TEXT) || !fn.OpenClipboard(hwnd))
    return;
  var clipcount = fn.CountClipboardFormats();
    var clipformats = [];
    var intervalue = 0;
    while (clipcount--) {
      intervalue = fn.EnumClipboardFormats(intervalue)
      clipformats.push(intervalue)
    }

    console.log(clipformats)
    console.log(clipformats.map(_ => constants.clipboardFormats[_]))
  var hglb = fn.GetClipboardData(winapicore.wintypes.CLIPBOARD_FORMATS.values.CF_TEXT) //,wintypes.HGLOBAL);	   
  var lptstr = fn.GlobalLock(hglb);
  var size = fn.GlobalSize(hglb);
  console.log("buffer size:", size)
  console.log(ref.reinterpret(lptstr, size).toString());
  fn.GlobalUnlock(hglb)
  fn.CloseClipboard();
});
mwin.on(wintypes.UInt32.constants.WM_PAINT, (obj) => {
  var {
    hwnd,
    wParam,
    lParam
  } = obj;
  const DT_SINGLELINE = 0x20;
  const DT_NOCLIP = 0x100;
  var ps = new wintypes.PAINTSTRUCT();
  var rect = new wintypes.RECT();
  var hdc = fn.BeginPaint(hwnd, ps.ref());
  //console.log(buf2hex(ps.rcPaint['ref.buffer']));
  fn.FillRect(hdc, ps.rcPaint.ref(), 4);
  fn.TextOutA(hdc, 50, 50, Buffer.from("this is a test\0"), 8);
  fn.DrawTextA(hdc, Buffer.from("Hello World!"), -1, rect.ref(), DT_SINGLELINE | DT_NOCLIP);
  fn.EndPaint(hwnd, ps.ref());
  obj.preventDefaulted = true;
  obj.result = 0;
});

mwin.on(wintypes.UInt32.constants.WM_DESTROY, (obj) => {
  console.log("Did you just click the X button on me?");
  fn.PostQuitMessage(0);
  goodies.win32messageHandler.close();
  obj.preventDefaulted = true;
  obj.result = 0;
});


//console.log("wintypes.KBDLLHOOKSTRUCT.size", wintypes.KBDLLHOOKSTRUCT.size)

/*var proc = ffi.Callback(...wintypes.fn.ThreadProc, () => {
  fn.MessageBoxA(0, "example", null, constants.msgbox.MB_OK | constants.msgbox.MB_ICONEXCLAMATION);
});*/
const MOD_ALT = 0x0001;
const MOD_NOREPEAT = 0x4000;
const MOD_CONTROL = 0x2;
const MOD_SHIFT = 0x4;

/*function registerhotkey() {
  if (fn.RegisterHotKey(0, 1, MOD_CONTROL | MOD_NOREPEAT, 0x42)) {
    console.log("Hotkey 'CTRL+b' registered, using MOD_NOREPEAT flag\n");
  }
}
registerhotkey();*/
//var devices=goodies.getRawInputDeviceList();
//var devecinames=devices._toJSON().map(_=>goodies.getRawInputDeviceInfo(_.hDevice,wintypes.RAW_INPUT_DEVICE_INFO_COMMAND.values.RIDI_DEVICENAME))

//console.log(devices.toJSON().map(_=>_.toJSON()).map(_=>winapi.goodies.getRawInputDeviceInfo(_.hDevice,constants.RawInputDeviceInformationCommand.RIDI_DEVICENAME)))
goodies.callbacks = [mwin//, proc
];

goodies.win32messageHandler.on(wintypes.UInt32.constants.WM_KEYUP, (l, w) => {
  console.log(wintypes.UInt32.constants.WM_KEYUP, l, w, constants.keys[w] || String.fromCharCode(w))
});

function onhotkey(lParam, wParam) {
  //console.log("message..",constants.msg[msg.message],msg.message.toString(16));	
  console.log('hotkey executed')
  const INPUT_MOUSE = 0;
  const INPUT_KEYBOARD = 1;
  const KEYEVENTF_KEYUP = 2;
  const MOUSEEVENTF_MOVE = 1;
  const HWND_BROADCAST = 0xffff;
  //fn.UnregisterHotKey(0,1);
  //fn.PostMessageA(HWND_BROADCAST,constants.msg.WM_HOTKEY,wParam,lParam);
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
	var hWnd = goodies.getFocusedHandle();
	goodies.SendMessageCallbackA(hWnd, wintypes.UInt32.constants.WM_COPY, 0, 0,_=>{console.log("I've been called back?")})
    //fn.PostMessageA();
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
    //winapi.goodies.errorHandling(fn.SendInput, _ => _ !== bufferarr.length, "sendInput")(bufferarr.length, Buffer.concat(bufferarr), wintypes.INPUT.size);
    //console.log("after sendinput")
    win.DUMMYUNIONNAME.ki.dwFlags = KEYEVENTF_KEYUP;
    //fn.SendInput(1, win.ref(), wintypes.INPUT.size);
    //winapi.kernel32.CreateThread(null, 0, proc, winapicore.ref.NULL, 0, winapicore.ref.NULL);
    //fn.MessageBoxA(0, winapicore.ref.allocCString("Mire al cielo"), "un programa muy interesante", 0);
  }
}
goodies.win32messageHandler.on(wintypes.UInt32.constants.WM_CLIPBOARDUPDATE,_=>{console.log("wow this executed?")});
goodies.win32messageHandler.on(wintypes.UInt32.constants.WM_HOTKEY, onhotkey);
goodies.win32messageHandler.on("WH_KEYBOARD_LL",_=>console.log(Object.fromEntries(Object.entries(_).map(([k,v])=>{if(k=="vkCode")return [k,constants.keys[v]||String.fromCharCode(v)]; else return [k,v]}))));
	
	
	
	
})


