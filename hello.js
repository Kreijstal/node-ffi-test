var ffi =require('ffi-napi')
var ref = require('ref-napi');
var ArrayType =require('ref-array-napi');
var StructType = require('ref-struct-napi');
var Union = require('ref-union-di')(ref);
var {winapi,user32:current} = require('./winapi.js')

console.log("ref.NULL",ref.NULL,0,ref.NULL==0)
var testi=0;
var WindowProc=ffi.Callback(...winapi.fn.WNDPROC,
  (hwnd, uMsg, wParam, lParam) => {
	  console.log('test',winapi.msg[uMsg],uMsg,testi++);
	  let result = 0
	  switch (uMsg) {
		  case winapi.msg.WM_PAINT:
			  console.log("being asked to paint");
		  default:
			  result = current.DefWindowProcA(hwnd, uMsg, wParam, lParam)
			  break
	  }
	  console.info('Sending LRESULT: ' + result)
	  return result
  },
);
var sclass=Buffer.from("Okay let's change this\0",'ucs2');
var wClass=new winapi.WNDCLASSEXW();
wClass.cbSize=80;
wClass.lpfnWndProc=WindowProc;
wClass.lpszClassName=sclass;
current.RegisterClassExW(wClass.ref());
var dStyle= winapi.styles.WS_CAPTION|winapi.styles.WS_SYSMENU;
hwnd=current.CreateWindowExW(0,sclass,Buffer.from("node WinForms!\0",'ucs2'),dStyle,winapi.styles.CW_USEDEFAULT,winapi.styles.CW_USEDEFAULT,600,400,0,0,0,ref.NULL)
current.ShowWindow(hwnd,1);
/**	ffi.Callback(...winapi.fn.WNDPROC,async (hwnd,uMsg,wParam,lParam)=>{
	return 0;
	switch(uMsg){
		case winapi.msg.WM_CREATE:
			current.CreateWindowExA(0, 
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
			var hdc=current.BeginPaint(hwnd,ps.ref());
			console.log(buf2hex(ps.rcPaint['ref.buffer']));
			current.FillRect(hdc,ps.rcPaint.ref(),5);
			current.EndPaint(hwnd,ps.ref());
			console.log("Finished Painting!")
			console.log(buf2hex(ps.rcPaint['ref.buffer']));
			return 0;
		case 2:
			current.PostQuitMessage(0);
			return 0;
		case 0x46:
		case 0x47:
			return 0;
	}
	var r=current.DefWindowProcW(hwnd,uMsg,wParam,lParam);
	console.log("DefWindowProc returns",winapi.msg[uMsg],r);
	return r;
});*/
//current.MessageBoxA(0, ref.allocCString("Mire al cielo"), "un programa muy interesante", 0);
/*var charp=ref.allocCString("ayy lmao hope this works\0\0\0\0");
var wn=new winapi.WNDCLASSEXA({lpszClassName:charp,lpfnWndProc:WindowProc,hInstance:0});
wn.cbSize=wn.ref().byteLength;
console.log("aA size",wn.ref().byteLength)
current.RegisterClassExA(wn.ref());
var hwnd=current.CreateWindowExA(0,charp,"hello boris\0\0\0\0",winapi.styles.WS_CAPTION|winapi.styles.WS_SYSMENU,winapi.styles.CW_USEDEFAULT,winapi.styles.CW_USEDEFAULT,600,400,0,0,0,ref.NULL);
console.log("I am okay with this");
console.log("THIS IS hwnd!!!!!!!!!!!!!",hwnd)
if(hwnd==ref.NULL){
console.log("CreateWindow didn't work :/")
}else{
	
	current.ShowWindow(hwnd,1);
	current.UpdateWindow(hwnd);

}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
setTimeout(_=>{
var msg=new winapi.MSG();
console.log("WHAT");
while(current.GetMessageA(msg.ref(),0,0,0)){
//		console.log("msg")
		current.TranslateMessage(msg.ref());
		current.DispatchMessageA(msg.ref());
	}
console.log("END OF WHILE LOOP")
},5000)
*/
