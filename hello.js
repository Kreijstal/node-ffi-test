var ffi =require('ffi-napi')
var ref = require('ref-napi');
var ArrayType =require('ref-array-di')(ref);
var StructType = require('ref-struct-di')(ref);
var Union = require('ref-union-di')(ref);
var {winapi,user32,gdi32} = require('./winapi.js')
var util=require('util')
//doesn't work because it calls it from another thread, and it's even slower.
//var user32async=Object.fromEntries(Object.entries(user32).map(([k,v])=>[k,util.promisify(v.async)]))
//var gdi32async=Object.fromEntries(Object.entries(gdi32).map(([k,v])=>[k,util.promisify(v.async)]))
Buffer.prototype._toJSON=Buffer.prototype.toJSON
Buffer.prototype.toJSON=function toJSON(){
var obj=this._toJSON();
var size=this.type.size;
var indirection=this.type.indirection;
var type=this.type.name;
var address=this.address();
return {...obj,size,indirection,type,address};
}
function errorHandling(fn,errcondition){
	return (..._)=>{var result;
	result=fn(..._);
	if(errcondition(result)){
		var error=user32.getLastError();
		console.log("function errored",{result,error});
		
	}else{return 0;}
	}	
}
function nonZero(i){return i!==0}
function buf2hex(buffer) { // buffer is an ArrayBuffer
  return buffer.toString('hex')// Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
var  WH_KEYBOARD_LL=13
var WindowProc=ffi.Callback(...winapi.fn.WNDPROC,
	(hwnd, uMsg, wParam, lParam) => {
	  //console.log('WndProc callback',winapi.msg[uMsg],uMsg.toString(16),"wParam:",wParam,"lParam:",ref.address(lParam));
	  let result = 0
	  switch (uMsg) {
		  case winapi.msg.WM_DESTROY:
			  console.log("excuse me?");
			  result =0;
			  user32.PostQuitMessage(0);
			  break;
		  case winapi.msg.WM_PAINT:
			  var ps=new winapi.PAINTSTRUCT();
			  var hdc=user32.BeginPaint(hwnd,ps.ref());
			  //console.log(buf2hex(ps.rcPaint['ref.buffer']));
			  user32.FillRect(hdc,ps.rcPaint.ref(),4);
			  gdi32.TextOutA(hdc,20,20,"this is a test\0",8);
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


console.log("winapi.KBDLLHOOKSTRUCT.size",winapi.KBDLLHOOKSTRUCT.size)
var keyHandler=ffi.Callback(...winapi.fn.HOOKPROC,(nCode,wParam,lParam)=>{
	//console.log(`keyHandler message, 0 means key message: ${nCode} lParam "address":${ref.address(lParam)}`);
	if(nCode==0){

		//console.log(`vkCode:${(new winapi.KBDLLHOOKSTRUCT(ref.reinterpret(lParam,winapi.KBDLLHOOKSTRUCT.size,0))).vkCode}`)
		//lmao=lParam
		var vkCode=(new winapi.KBDLLHOOKSTRUCT(ref.reinterpret(lParam,winapi.KBDLLHOOKSTRUCT.size))).vkCode;
		var key;
		if(vkCode<256)console.log(key=(winapi.keys.get(vkCode)||String.fromCharCode(vkCode)))
		//((KBDLLHOOKSTRUCT *) lParam)->vkCode
		
	}
	//block t
	if(key=="T"){setTimeout(_=>user32.CallNextHookEx(hookHandle, nCode, 
	wParam, lParam),1000);return 1;}
	return user32.CallNextHookEx(hookHandle, nCode, 
            wParam, lParam);
})
var hookHandle= user32.SetWindowsHookExA(WH_KEYBOARD_LL, keyHandler, 0, 0);
var testtt=Buffer.allocUnsafe(4)
var winapi.goodies={}
user32.goodies.GetRawInputDeviceList=errorHandling(user32.GetRawInputDeviceList,nonZero)
user32.goodies.GetRawInputDeviceList(ref.NULL,testtt,winapi.RAWINPUTDEVICELIST.size);
console.log("Number of devices:",testtt.readUint32LE());
var devices=new (ArrayType(winapi.RAWINPUTDEVICELIST))(testtt.readUint32LE())
//var devices=Buffer.allocUnsafe(winapi.RAWINPUTDEVICELIST.size*testtt.readUint32LE());
user32.goodies.GetRawInputDeviceList(devices.buffer,testtt,winapi.RAWINPUTDEVICELIST.size);
console.log("Number of devices read:",testtt.readUint32LE());
devices.toJSON().map(_=>Object.fromEntries(Object.entries(_.toJSON()).map(([k,v])=>[k,(v.toJSON)?v.toJSON():v])))
function* meme(){
var wClass=new winapi.WNDCLASSA();
//wClass.cbSize=wClass.ref().byteLength;
var sclass="test\0"//Buffer.from("Okay let's change this\0",'ucs2');
wClass.lpfnWndProc=WindowProc;
wClass.lpszClassName=sclass;
if(user32.RegisterClassA(wClass.ref())){
	var dStyle= winapi.styles.WS_CAPTION|winapi.styles.WS_SYSMENU;
	var hwnd=user32.CreateWindowExA(0,sclass,Buffer.from("Esta vaina no sirve!\0",'utf-8'),winapi.styles.WS_OVERLAPPEDWINDOW,winapi.styles.CW_USEDEFAULT,winapi.styles.CW_USEDEFAULT,600,400,0,0,0,ref.NULL);
	if(hwnd){
		user32.ShowWindow(hwnd,1);
		//	user32.UpdateWindow(hwnd);
		var msg=new winapi.MSG();
		console.log("WHAT");
		while(true){
			//using PeekMessage instead of GetMessageA because it blocks node :(
		while(user32.PeekMessageA(msg.ref(),0,0,0,winapi.styles.PM_REMOVE)){
			//		console.log("msg")
			user32.TranslateMessage(msg.ref());
			user32.DispatchMessageA(msg.ref());
		}
		if (msg.message==winapi.msg.WM_QUIT){
			console.log('test');
			break;
		}
		yield true;
		}
		console.log("end of while loop");
		yield false;
	}else{
		console.error("CreateWindow failed to create window..");
		yield false;
	}
}else{
	console.error("Register Class Failed User32/RegisterClassEx")
	yield false;
}
}
var x=meme();
/*var isInputBlocked=user32.BlockInput(1);
console.log(`INPUT HAS BEEN BLOCKED? ${isInputBlocked}`)
setTimeout(_=>{user32.BlockInput(0);
console.log("INPUT should HAve BEEN unBLOCKED")
},5000);//5 seconds*/

setInterval(_=>{WindowProc;keyHandler;x.next()},0)
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
//user32.MessageBoxA(0, ref.allocCString("Mire al cielo"), "un programa muy interesante", 0);
/*var charp=ref.allocCString("ayy lmao hope this works\0\0\0\0");
var wn=new winapi.WNDCLASSEXA({lpszClassName:charp,lpfnWndProc:WindowProc,hInstance:0});
wn.cbSize=wn.ref().byteLength;
console.log("aA size",wn.ref().byteLength)
user32.RegisterClassExA(wn.ref());
var hwnd=user32.CreateWindowExA(0,charp,"hello boris\0\0\0\0",winapi.styles.WS_CAPTION|winapi.styles.WS_SYSMENU,winapi.styles.CW_USEDEFAULT,winapi.styles.CW_USEDEFAULT,600,400,0,0,0,ref.NULL);
console.log("I am okay with this");
console.log("THIS IS hwnd!!!!!!!!!!!!!",hwnd)
if(hwnd==ref.NULL){
console.log("CreateWindow didn't work :/")
}else{
	
	user32.ShowWindow(hwnd,1);

}


setTimeout(_=>{
var msg=new winapi.MSG();
console.log("WHAT");
while(user32.GetMessageA(msg.ref(),0,0,0)){
//		console.log("msg")
		user32.TranslateMessage(msg.ref());
		user32.DispatchMessageA(msg.ref());
	}
console.log("END OF WHILE LOOP")
},5000)
*/
