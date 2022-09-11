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
Buffer.prototype._toJSON=Buffer.prototype.toJSON
Buffer.prototype.toJSON=function toJSON(){
var obj=this._toJSON();
var size=this?.type?.size;
var indirection=this.type.indirection;
var type=this?.type?.name;
var address=this.address();
return {...obj,size,indirection,type,address};
}

const  WH_KEYBOARD_LL=13
var WindowProc=ffi.Callback(...wintypes.fn.WNDPROC,
	(hwnd, uMsg, wParam, lParam) => {
	  //console.log('WndProc callback',winapi.msg[uMsg],uMsg.toString(16),"wParam:",wParam,"lParam:",ref.address(lParam));
	  let result = 0
	  switch (uMsg) {
		  case constants.msg.WM_DESTROY:
			  console.log("excuse me?");
			  winapi.goodies.win32messageHandler.off("message",winapi.goodies.defaultMessageCallback);
			  result =0;
			  user32.PostQuitMessage(0);
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
var keyHandler=ffi.Callback(...wintypes.fn.HOOKPROC,(nCode,wParam,lParam)=>{
	//console.log(`keyHandler message, 0 means key message: ${nCode} lParam "address":${ref.address(lParam)}`);
	if(nCode==0){

		//console.log(`vkCode:${(new wintypes.KBDLLHOOKSTRUCT(ref.reinterpret(lParam,wintypes.KBDLLHOOKSTRUCT.size,0))).vkCode}`)
		//lmao=lParam
		var kbldstruct=(new wintypes.KBDLLHOOKSTRUCT(ref.reinterpret(lParam,wintypes.KBDLLHOOKSTRUCT.size)));
		var vkCode=kbldstruct.vkCode
		var key=(constants.keys.get(vkCode)||String.fromCharCode(vkCode));
		console.log({...kbldstruct.toJSON(),key})
		//((KBDLLHOOKSTRUCT *) lParam)->vkCode
		
	}
	//block t
	//if(key=="T"){return 1;}
	return user32.CallNextHookEx(hookHandle, nCode, 
            wParam, lParam);
})

const MOD_ALT=0x0001;
const MOD_NOREPEAT=0x4000;
const MOD_CONTROL=0x2;
const MOD_SHIFT=0x4;
if (user32.RegisterHotKey(0,1,MOD_CONTROL | MOD_NOREPEAT,0x42)){
        console.log("Hotkey 'CTRL+b' registered, using MOD_NOREPEAT flag\n");
}
//var devices=winapi.goodies.getRawInputDeviceList();
//var devecinames=devices._toJSON().map(_=>winapi.goodies.getRawInputDeviceInfo(_.hDevice,constants.RawInputDeviceInformationCommand.RIDI_DEVICENAME))
//console.log(devices.toJSON().map(_=>Object.fromEntries(Object.entries(_.toJSON()).map(([k,v])=>[k,(v.toJSON)?v.toJSON():v]))))
//console.log(devices.toJSON().map(_=>_.toJSON()).map(_=>winapi.goodies.getRawInputDeviceInfo(_.hDevice,constants.RawInputDeviceInformationCommand.RIDI_DEVICENAME)))
//execute message loop on the background
winapi.goodies.win32messageHandler.on("message",winapi.goodies.defaultMessageCallback);
winapi.goodies.callbacks=[keyHandler,WindowProc];
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



function displayMessageNames(msg){
	//console.log("message..",constants.msg[msg.message],msg.message.toString(16));	
	if(constants.msg[msg.message]=="WM_HOTKEY"){
		//console.log(String.fromCharCode(msg.lParam>>16))
		if(String.fromCharCode(msg.lParam>>16)=="B"){
			user32.MessageBoxA(0, ref.allocCString("Mire al cielo"), "un programa muy interesante", 0);
		}
	}
}
winapi.goodies.win32messageHandler.on("message",displayMessageNames);
//winapi.goodies.win32messageHandler.off("message",winapi.goodies.defaultMessageCallback);