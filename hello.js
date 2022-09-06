var ffi =require('ffi-napi')
var ref = require('ref-napi');
var ArrayType =require('ref-array-napi');
var StructType = require('ref-struct-napi');
var Union = require('ref-union-di')(ref);
var {winapi,user32,gdi32} = require('./winapi.js')
var util=require('util')
var user32async=Object.fromEntries(Object.entries(user32).map(([k,v])=>[k,util.promisify(v.async)]))
var gdi32async=Object.fromEntries(Object.entries(gdi32).map(([k,v])=>[k,util.promisify(v.async)]))
function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
var  WH_KEYBOARD_LL=13
var WindowProc=ffi.Callback(...winapi.fn.WNDPROC,
	(hwnd, uMsg, wParam, lParam) => {
	  //console.log('WndProc callback',winapi.msg[uMsg],uMsg.toString(16),"wParam:",wParam,"lParam:",ref.address(lParam));
	  let result = 0
	  switch (uMsg) {
		  case winapi.msg.WM_DESTROY:
			  //console.log("excuse me?");
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
var sclass="test\0"//Buffer.from("Okay let's change this\0",'ucs2');
var wClass=new winapi.WNDCLASSA();
//wClass.cbSize=wClass.ref().byteLength;
wClass.lpfnWndProc=WindowProc;
wClass.lpszClassName=sclass;
console.log("winapi.KBDLLHOOKSTRUCT.size",winapi.KBDLLHOOKSTRUCT.size)
var keyHandler=ffi.Callback(...winapi.fn.HOOKPROC,(nCode,wParam,lParam)=>{
	console.log(`keyHandler message, 0 means key message: ${nCode} lParam "address":${ref.address(lParam)}`);
	if(nCode==0){
		lParam.length = 24; 
		//console.log(`vkCode:${(new winapi.KBDLLHOOKSTRUCT(ref.reinterpret(lParam,winapi.KBDLLHOOKSTRUCT.size,0))).vkCode}`)
		console.log((new winapi.KBDLLHOOKSTRUCT(lParam)).vkCode);
		//((KBDLLHOOKSTRUCT *) lParam)->vkCode
		
	}
	return user32.CallNextHookEx(hookHandle, nCode, 
            wParam, lParam);
})
var hookHandle= user32.SetWindowsHookExA(WH_KEYBOARD_LL, keyHandler, 0, 0)

if(user32.RegisterClassA(wClass.ref())){
	var dStyle= winapi.styles.WS_CAPTION|winapi.styles.WS_SYSMENU;
	var hwnd=user32.CreateWindowExA(0,sclass,Buffer.from("Esta vaina no sirve!\0",'utf-8'),winapi.styles.WS_OVERLAPPEDWINDOW,winapi.styles.CW_USEDEFAULT,winapi.styles.CW_USEDEFAULT,600,400,0,0,0,ref.NULL);
	if(hwnd){
		user32.ShowWindow(hwnd,1);
		//	user32.UpdateWindow(hwnd);
		var msg=new winapi.MSG();
		console.log("WHAT");
		while(user32.GetMessageA(msg.ref(),0,0,0)){
			//		console.log("msg")
			user32.TranslateMessage(msg.ref());
			user32.DispatchMessageA(msg.ref());
		}
		console.log("end of while loop");
	}else{
		console.err("CreateWindow failed to create window..");
	}
}else{
	console.err("Register Class Failed User32/RegisterClassEx")
}
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
