var {goodies,constants,done} = require('./winapi.js')


done.then(({fn,winapicore})=>{
	const wintypes=winapicore.wintypes;
	const SW_SHOW=wintypes.SHOW_WINDOW_CMD.values.SW_SHOW;
	const WS_OVERLAPPEDWINDOW=wintypes.WINDOW_STYLE.values.WS_OVERLAPPEDWINDOW;
	const WS_EX_LEFT=wintypes.WINDOW_EX_STYLE.values.WS_EX_LEFT;
	const CW_USEDEFAULT=winapicore.wintypes.Int32.constants.CW_USEDEFAULT;
	const NULL=winapicore.ref.NULL;
	//const DefWindowProcA=winapicore.functions.DefWindowProcA.deref();
	//const GetMessageA=winapicore.functions.GetMessageA.deref();
	//const TranslateMessage=winapicore.functions.TranslateMessage.deref();
	//const DispatchMessageA=winapicore.functions.DispatchMessageA.deref();
	//const CreateWindowExA=winapicore.functions.CreateWindowExA.deref();
	var IGNORE=false;
	const WindowProc=	(hwnd, uMsg, wParam, lParam) => {
		if(IGNORE)return 0;
		IGNORE=true;
			let result = 0;
			var obj={hwnd,wParam,lParam};
			console.log(hwnd, uMsg, wParam, lParam," Window message")
			switch(uMsg){
		case 0xF:
			console.log("Fianlly a WM_PAINT call!")
			break;
		case 2:
		console.log("Quit")
			fn.PostQuitMessage(0);
			IGNORE=false;
			return 0;
		case 0x46:
		case 0x47:
		IGNORE=false;
			return 0;
	}
			
			result = fn.DefWindowProcA(hwnd, uMsg, wParam, lParam);
			IGNORE=false;
			return result
		};
var wClass=new wintypes.WNDCLASSA();
var sclass=Buffer.from("someclass\0")
wClass.lpfnWndProc=WindowProc;
	wClass.lpszClassName=sclass;
	console.log("Registering class!")
fn.RegisterClassA(wClass.ref())
//x.winapicore.functions.CreateWindowExA.deref()(0,sclass,sclass,0,0,0,20,30,0,0,0,x.winapicore.ref.NULL)
console.log("CreateWindowExA After this call it all goes to shit.")
var hwnd = fn.CreateWindowExA(WS_EX_LEFT,
                          sclass,
                          NULL,
                          WS_OVERLAPPEDWINDOW,
                          CW_USEDEFAULT,
                          CW_USEDEFAULT,
                          CW_USEDEFAULT,
                          CW_USEDEFAULT,
                          0,
                          0,
                          0,
                          NULL);
						  
if (!hwnd) {
        console.log("Could not create window");
        return 0;
    }
	console.log("Calling ShowWindow")
	fn.ShowWindow(hwnd, SW_SHOW);
	console.log("Calling UpdateWindow")
	fn.UpdateWindow(hwnd);
	//sucks
	var msg=new wintypes.MSG();
	console.log("Before GetMessage")
	while (fn.GetMessageA(msg.ref(), 0, 0, 0)) {//sucks
	console.log("message received")
        fn.TranslateMessage(msg.ref());
        fn.DispatchMessageA(msg.ref());
    }
	console.log("after loop")
    return 0;
	
})