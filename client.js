var {
	winapi,
	constants,
} = require('./winapi.js')
var udp = require('dgram');
var udps = udp.createSocket({
	type: 'udp4',
	reuseAddr: true // <- NOTE: we are asking OS to let us reuse port
});
require('./eventUtils.js').addEventUtilsToEventDispatcher(udps);
var t={};
const HWND_BROADCAST = 0xffff;
async function msg(msg,expect=_=>true){
	//sending msg
	console.log('sent message',msg);
	var lel=udps.pcondintionalOnce('message',expect)
	udps.send(Buffer.from(msg),2222,require('./input.json').domain,(..._)=>{console.log(_,"was this executing all along?")});
	console.log("after send")
	var res= (await lel)[0].toString();
	return res
}
function onhotkeyApress(arg) {
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
			//			winapi.goodies.win32messageHandler.on("WH_KEYBOARD_LL",console.log)
			//			setTimeout(_=>winapi.goodies.win32messageHandler.off("WH_KEYBOARD_LL",console.log),10000);
			var gen=(i=>`{F}{${i.toString().padStart(2,'0').split('').join('}{')}}{Down}`);
			setTimeout(_=>winapi.goodies.sendInputAhk([...Array(12).keys()].map(i=>gen(i+1)).join('')),1);
			break;
		case 'D':
			(async _=>{
				await msg("sendahkString {Tab 4}{Shift Down}{Tab 4}{Shift Up}{Sleep 1000}");
				await msg('copy');
				var g=await msg('getclipboard 1')
				console.log('g has been obtained: value: '+g.trim())
			})()
			break;
		case "G":
			winapi.goodies.wsendFocus("WM_GETTEXTLENGTH",0,0).then(async ({lresult})=>{
				console.log("length of text is "+lresult);
			})
			break;
		case "Z":
			msg("sendahkString {t}{e}{s}{t}");
			break;
	}
}
winapi.goodies.win32messageHandler.on("WM_HOTKEY:^b",_=>
	winapi.goodies.win32messageHandler.conditionalOnce("WH_KEYBOARD_LL",onhotkeyApress,_=>_.wParam==constants.msg.WM_KEYDOWN&&"ASDZXVBYG".split('').includes(String.fromCharCode(_.vkCode)))
);
winapi.goodies.win32messageHandler.open()
