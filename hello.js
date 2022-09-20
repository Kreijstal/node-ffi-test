var ffi =require('ffi-napi')
var ref = require('ref-napi');
var ArrayType =require('ref-array-di')(ref);
var StructType = require('ref-struct-di')(ref);
var Union = require('ref-union-di')(ref);
var {winapi,user32,gdi32,constants,wintypes} = require('./winapi.js')
var util=require('util')
//doesn't work because it calls it from another thread, and it's even slower.
//var user32async=Object.fromEntries(Object.entries(user32).map(([k,v])=>[k,util.promisify(v.async)]))
//var gdi32async=Object.fromEntries(Object.entries(gdi32).map(([k,v])=>[k,util.promisify(v.async)]))


var WindowProc=ffi.Callback(...wintypes.fn.WNDPROC,
	(hwnd, uMsg, wParam, lParam) => {
	  //console.log('WndProc callback',winapi.msg[uMsg],uMsg.toString(16),"wParam:",wParam,"lParam:",ref.address(lParam));
	  let result = 0
	  switch (uMsg) {
		  case constants.msg.WM_DESTROY:
			  console.log("Did you just click the X button on me?");
			  result =0;
			  user32.PostQuitMessage(0);
			  winapi.goodies.win32messageHandler.close();
			  break;
		  case constants.msg.WM_PAINT:
		  const DT_SINGLELINE=0x20;
		  const DT_NOCLIP=0x100;
			  var ps=new wintypes.PAINTSTRUCT();
			  var rect=new wintypes.RECT();
			  var hdc=user32.BeginPaint(hwnd,ps.ref());
			  //console.log(buf2hex(ps.rcPaint['ref.buffer']));
			  user32.FillRect(hdc,ps.rcPaint.ref(),4);
			  gdi32.TextOutA(hdc,50,50,"this is a test\0",8);
			  user32.DrawTextA(hdc, "Hello World!", -1, rect.ref(), DT_SINGLELINE | DT_NOCLIP);
			  user32.EndPaint(hwnd,ps.ref());
			  //console.log("Finished Painting!")
			  return 0;
		  default:
			  result = user32.DefWindowProcA(hwnd, uMsg, wParam, lParam)
			  break
	  }
	  //console.info('Sending LRESULT: ' + result)
	  return result
  },
);


console.log("wintypes.KBDLLHOOKSTRUCT.size",wintypes.KBDLLHOOKSTRUCT.size)
/*var keyHandler=ffi.Callback(...wintypes.fn.Hookproc,(nCode,wParam,lParam)=>{
	console.log(`keyHandler message, 0 means key message: ${nCode} lParam "address":${lParam}`);
	if(nCode==0){
		//console.log(`vkCode:${(new wintypes.KBDLLHOOKSTRUCT(ref.reinterpret(lParam,wintypes.KBDLLHOOKSTRUCT.size,0))).vkCode}`)
		//lmao=lParam
		var load=Buffer.alloc(8);
		// console.log(lParam,"lParam") 
		load.writeBigUint64LE(BigInt(lParam));
		load.type=ref.refType(wintypes.KBDLLHOOKSTRUCT);
		//console.log(lParam,load)
		//console.log("address",ref.deref(load).address());
		var kbldstruct=load.deref().deref();
		var vkCode=kbldstruct.vkCode;
		var key=(constants.keys[vkCode]||String.fromCharCode(vkCode));
		console.log({...Object.fromEntries(kbldstruct.toJSON()),key})
		//((KBDLLHOOKSTRUCT *) lParam)->vkCode
		
	}
	//block t
	//if(key=="T"){return 1;}
	return user32.CallNextHookEx(hookHandle, nCode, 
            wParam, lParam);
})*/
var proc = ffi.Callback(...wintypes.fn.ThreadProc, () => {
	user32.MessageBoxA(0, "example", null, constants.msgbox.MB_OK | constants.msgbox.MB_ICONEXCLAMATION);
});
const MOD_ALT=0x0001;
const MOD_NOREPEAT=0x4000;
const MOD_CONTROL=0x2;
const MOD_SHIFT=0x4;
function registerhotkey(){
if (user32.RegisterHotKey(0,1,MOD_CONTROL | MOD_NOREPEAT,0x42)){
        console.log("Hotkey 'CTRL+b' registered, using MOD_NOREPEAT flag\n");
}}
registerhotkey();
//var devices=winapi.goodies.getRawInputDeviceList();
//var devecinames=devices._toJSON().map(_=>winapi.goodies.getRawInputDeviceInfo(_.hDevice,constants.RawInputDeviceInformationCommand.RIDI_DEVICENAME))
//console.log(devices.toJSON().map(_=>Object.fromEntries(Object.entries(_.toJSON()).map(([k,v])=>[k,(v.toJSON)?v.toJSON():v]))))
//console.log(devices.toJSON().map(_=>_.toJSON()).map(_=>winapi.goodies.getRawInputDeviceInfo(_.hDevice,constants.RawInputDeviceInformationCommand.RIDI_DEVICENAME)))
//execute message loop on the background
winapi.goodies.win32messageHandler.open();
winapi.goodies.callbacks=[WindowProc,proc];
//var hookHandle= user32.SetWindowsHookExA(WH_KEYBOARD_LL, keyHandler, 0, 0);
var wClass=new wintypes.WNDCLASSA();
//wClass.cbSize=wClass.ref().byteLength;
var sclass="test\0"//Buffer.from("Okay let's change this\0",'ucs2');
wClass.lpfnWndProc=WindowProc;
wClass.lpszClassName=sclass;
if(winapi.goodies.RegisterClassA(wClass.ref())){
	var dStyle= constants.styles.WS_CAPTION|constants.styles.WS_SYSMENU;
	var hwnd=winapi.goodies.CreateWindowExA(0,sclass,Buffer.from("Esta vaina no sirve!\0",'utf-8'),constants.styles.WS_OVERLAPPEDWINDOW,constants.styles.CW_USEDEFAULT,constants.styles.CW_USEDEFAULT,600,400,0,0,0,ref.NULL);
	if(hwnd){
		user32.ShowWindow(hwnd,1);
		//	user32.UpdateWindow(hwnd);
	}else{
		console.error("CreateWindow failed to create window..");
	}
}else{
	console.error("Register Class Failed User32/RegisterClassEx")
}


/*var isInputBlocked=user32.BlockInput(1);
console.log(`INPUT HAS BEEN BLOCKED? ${isInputBlocked}`)
setTimeout(_=>{user32.BlockInput(0);
console.log("INPUT should HAve BEEN unBLOCKED")
},5000);//5 seconds*/


/**	ffi.Callback(...winapi.fn.WNDPROC,async (hwnd,uMsg,wParam,lParam)=>{
	return 0;
	switch(uMsg){
		case winapi.msg.WM_CREATE:
			user32.CreateWindowExA(0, 
				"ChildWClass", 
                               ref.NULL, 
                               0x40000000 | 0x00800000, 
                               0,0,0,0, 
                               hwnd, 
                               100, 
                               0, 
                               ref.NULL);
			return 0;
		case winapi.msg.WM_SIZE:
			return 0;
		case winapi.msg.WM_PAINT:
			console.log("Fianlly a WM_PAINT call!");
			var ps=new winapi.PAINTSTRUCT();
			var hdc=user32.BeginPaint(hwnd,ps.ref());
			console.log(buf2hex(ps.rcPaint['ref.buffer']));
			user32.FillRect(hdc,ps.rcPaint.ref(),5);
			user32.EndPaint(hwnd,ps.ref());
			console.log("Finished Painting!")
			console.log(buf2hex(ps.rcPaint['ref.buffer']));
			return 0;
		case 2:
			user32.PostQuitMessage(0);
			return 0;
		case 0x46:
		case 0x47:
			return 0;
	}
	var r=user32.DefWindowProcW(hwnd,uMsg,wParam,lParam);
	console.log("DefWindowProc returns",winapi.msg[uMsg],r);
	return r;
});*/


winapi.goodies.win32messageHandler.on("WM_KEYUP",(l,w)=>{console.log("WM_KEYUP",l,w,constants.keys[w]||String.fromCharCode(w))});
function displayMessageNames(lParam,wParam){
	//console.log("message..",constants.msg[msg.message],msg.message.toString(16));	
	console.log('hotkey executed')
	const INPUT_MOUSE=0;
	const INPUT_KEYBOARD=1;
	const KEYEVENTF_KEYUP=2;
	const MOUSEEVENTF_MOVE=1;
	const HWND_BROADCAST=0xffff;
		//user32.UnregisterHotKey(0,1);
		//user32.PostMessageA(HWND_BROADCAST,constants.msg.WM_HOTKEY,wParam,lParam);
		//registerhotkey();
	if(String.fromCharCode(lParam>>16)=="B"){
		var bufferarr=[];
		var highorder=lParam&((1<<16)-1);
		if(highorder&MOD_CONTROL){
			let l=new wintypes.INPUT();
			l.type=INPUT_KEYBOARD;
			l.DUMMYUNIONNAME.ki.wScan=0;
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
		var win=new wintypes.INPUT();
		win.type=INPUT_KEYBOARD;
		win.DUMMYUNIONNAME.ki.wScan=0;
		win.DUMMYUNIONNAME.ki.time = 0;
		win.DUMMYUNIONNAME.ki.dwExtraInfo = 0;
		win.DUMMYUNIONNAME.ki.wVk = 0x41;
		win.DUMMYUNIONNAME.ki.dwFlags = 0;
		bufferarr.push(win.ref());
		var mclick=new wintypes.INPUT();
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
		winapi.goodies.errorHandling(user32.SendInput,_=>_!==bufferarr.length,"sendInput")(bufferarr.length, Buffer.concat(bufferarr), wintypes.INPUT.size);
		//console.log("after sendinput")
		win.DUMMYUNIONNAME.ki.dwFlags = KEYEVENTF_KEYUP;
		user32.SendInput(1, win.ref(), wintypes.INPUT.size);
		//winapi.kernel32.CreateThread(null, 0, proc, ref.NULL, 0, ref.NULL);
		//user32.MessageBoxA(0, ref.allocCString("Mire al cielo"), "un programa muy interesante", 0);
	}
}
winapi.goodies.win32messageHandler.on("WM_HOTKEY",displayMessageNames);
//winapi.goodies.win32messageHandler.on("WH_KEYBOARD_LL",_=>console.log(Object.fromEntries(Object.entries(_).map(([k,v])=>{if(k=="vkCode")return [k,constants.keys[v]||String.fromCharCode(v)]; else return [k,v]}))));
//setTimeout(_=>winapi.goodies.win32messageHandler.off("WH_KEYBOARD_LL",console.log),10000)
//winapi.goodies.win32messageHandler.off("message",winapi.goodies.defaultMessageCallback);