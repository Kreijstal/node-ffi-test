var ffi = require('ffi-napi')
var ref = require('ref-napi');
//var ArrayType = require('ref-array-di')(ref);
//var StructType = require('ref-struct-di')(ref);
//var Union = require('ref-union-di')(ref);
var {
	winapi,
	user32,
	gdi32,
	constants,
	wintypes,
	kernel32
} = require('./winapi.js')
var util=require('node:util')

var udp = require('dgram');

var udps = udp.createSocket({
	type: 'udp4',
	reuseAddr: true // <- NOTE: we are asking OS to let us reuse port
});

var t={};
const HWND_BROADCAST = 0xffff;
var commands={"messagebox":_=>user32.MessageBoxA(0, "example", "something fun here as well", constants.msgbox.MB_OK | constants.msgbox.MB_ICONEXCLAMATION),
"eval":_=>util.inspect(eval(_)),
"getavailableclipboardformats":_=>{
	var clipcount = user32.CountClipboardFormats();
	var clipformats = [];
	var intervalue = 0;
	while (clipcount--) {
		intervalue = user32.EnumClipboardFormats(intervalue)
		clipformats.push(intervalue)
	}
	console.log(clipformats)
	console.log(clipformats.map(_ => constants.clipboardFormats[_]))
},
"getclipboard":_=>{
	return winapi.goodies.getClipboard(+_).toString()
},
"paste":_=>{
	return winapi.goodies.wsendFocus(constants.msg.WM_PASTE,0,0);
},
"setclipboard":_=>{
	var x=splitat(_);
	if(x.length<2){
		return "Err";
	}
	function splitat(str,substr=","){
		var i=str.indexOf(substr);
		if(i==-1)return [str];
		return [str.slice(0,i),str.slice(i+1)]
	}
		return winapi.goodies.setClipboard(+x[0],Buffer.from(x[1]+'\0'))?"Err":"ok";
},
"copy":_=>{
	return winapi.goodies.wsendFocus(constants.msg.WM_COPY,0,0);
},"usetcp":_=>{
	var net = require('net');
	var server = net.createServer(function(socket) {
		socket.write('Echo server\r\n');
		socket.pipe(socket);
	});
	server.listen(1337, '127.0.0.1');
	}
};
udps.on('message',async function(msg,info){
	t[info.address+'/'+info.port]=info;	
	console.log('Data received: ' + msg.toString());
	console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
	/*try{
	  JSON.stringify(msg.toString());
  }catch(x)console.log('not a json command');*/

	var c=msg.toString().match(/^([^ ]*)(?: (.*))?/)
	console.log(c,c[1],c[2])
	if(c[1].trim() in commands){
		var r=await commands[c[1].trim()](c[2]);
		udps.send(Buffer.from(r?.toString()??"ok"),info.port,info.address,console.log)
	}
	else {
		udps.send(Buffer.from(`command ${c[1].trim()} not found`),info.port,info.address,console.log);
	}
});

function msg(msg){
	//sending msg
	Object.entries(t).forEach(([k,v])=>udps.send(Buffer.from(msg),v.port,v.address,console.log));
}
udps.bind(2222);

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
	swflag:constants.ShowWindow.SW_HIDE
});
user32.AddClipboardFormatListener(mwin.hwnd);
mwin.on("WM_CLIPBOARDUPDATE", (obj) => {
	var {
		hwnd,
		wParam,
		lParam
	} = obj;
	msg("Clipboard has changed mf");
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
	msg(ref.reinterpret(lptstr, size).toString());
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
	udps.close();
});
mwin.on("WM_HOTKEY",(..._)=>conole.log(..._,"window hotkey, called"));

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
winapi.goodies.callbacks = [mwin, proc];
asdfg=0;
function onhotkeyApress(arg) {//Log next messages for 10 seconds or something
	arg.defaultPrevent=true;
	console.log("This function has been run, success pressed A after hotkey")
	function logMessage(obj){
		console.log(obj,constants.msg[obj.uMsg])
	}
	switch(String.fromCharCode(arg.vkCode)){
		case "A":
			mwin.on("message",logMessage);
			setTimeout(_=>mwin.off("message",logMessage),10000);
			break;
		case "S":
			winapi.goodies.win32messageHandler.on("WH_KEYBOARD_LL",console.log)
			setTimeout(_=>winapi.goodies.win32messageHandler.off("WH_KEYBOARD_LL",console.log),10000);
			break;
		case "G":
			winapi.goodies.wsendFocus("WM_GETTEXTLENGTH",0,0).then(async ({lresult})=>{
				console.log("length of text is "+lresult);
			})
			break;
		case "Z":
			winapi.goodies.sendInputAhk("{t}{e}{s}{t}");
			break;
	}
		}
function onhotkey(lParam, wParam) {
	//console.log("message..",constants.msg[msg.message],msg.message.toString(16));	
	console.log('hotkey executed')

	//user32.UnregisterHotKey(0,1);
	//user32.PostMessageA(HWND_BROADCAST,constants.msg.WM_HOTKEY,wParam,lParam);
	//registerhotkey();
	if (String.fromCharCode(constants.macros.LOWORD(lParam)) == "B") {
		var bufferarr = [];
		var highorder = constants.macros.HIWORD(lParam);
		if (highorder & MOD_CONTROL) {
			let l = new wintypes.INPUT();
			l.type = constants.input.INPUT_KEYBOARD;
			l.DUMMYUNIONNAME.ki.wScan = 0;
			l.DUMMYUNIONNAME.ki.time = 0;
			l.DUMMYUNIONNAME.ki.dwExtraInfo = 0;
			l.DUMMYUNIONNAME.ki.wVk = constants.keys.VK_CONTROL;
			l.DUMMYUNIONNAME.ki.dwFlags = constants.input.Event.KEYEVENTF_KEYUP;
			bufferarr.push(l.ref());
		}
		winapi.goodies.errorHandling(user32.SendInput, _ => _ !== bufferarr.length, "sendInput")(bufferarr.length, Buffer.concat(bufferarr), wintypes.INPUT.size);
		winapi.goodies.win32messageHandler.conditionalOnce("WH_KEYBOARD_LL",onhotkeyApress,_=>['Z','A','G','S'].includes(String.fromCharCode(_.vkCode)));
	}
}
winapi.goodies.win32messageHandler.on("WM_HOTKEY", onhotkey);
var repl=require('node:repl');
var context=repl.start({prompt:'> ',useGlobal:true});

context.context["udps"]=udps
context.context["commands"]=commands
context.context["msg"]=msg
context.context["mwin"]=mwin
//context.context["w"]=require('./winapi.js');
//{Tab 4}{LShift Down}{Tab}
function l(i){
	if(i>23)return;
	commands.setclipboard("1,Keystone"+String(i).padStart(2, '0'))
	commands.paste().then(async _=>
		{
			var bufferarr=[];
			bufferarr.push((new wintypes.INPUT({type:INPUT_KEYBOARD,DUMMYUNIONNAME:{ki:{wVk:constants.keys.VK_DOWN}}})).ref());
			bufferarr.push((new wintypes.INPUT({type:INPUT_KEYBOARD,DUMMYUNIONNAME:{ki:{wVk:constants.keys.VK_DOWN,dwFlags:KEYEVENTF_KEYUP}}})).ref());
			winapi.goodies.errorHandling(user32.SendInput, _ => _ !== bufferarr.length, "sendInput")(bufferarr.length, Buffer.concat(bufferarr), wintypes.INPUT.size);
			setTimeout(_=>l(i+1),120);

		})
}
