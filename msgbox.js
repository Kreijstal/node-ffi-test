var {goodies,constants,done} = require('./winapi.js')


done.then(({fn,winapicore})=>{
	const wintypes=winapicore.wintypes;
	
	fn.MessageBoxA(0,Buffer.from( "hello, world\0"), Buffer.from( "caption\0"), 0);
	
})