var util=require('node:util');
function addEventUtilsToEventDispatcher(eventdispatcher){

eventdispatcher.conditionalOnce=function(event,cb,condition
	//,addEmitter=_=>_,removeEmitter=_=>_
){
	var that=this;
	function eventfn(...args){
		if(condition(...args)){
			that.off(event,eventfn);
			console.log(event,"off has been called!")
			cb(...args);
			//removeEmitter();
		}
	}
	//addEmitter()
	
	this.on(event,eventfn);
}
eventdispatcher.pcondintionalOnce=util.promisify(function(event,condition,cb){
return this.conditionalOnce(event,(...args)=>cb(null,args),condition)
});

eventdispatcher.oneTimeListen=function oneTimeListen(event,starter,remover){
	if(typeof event!=="function"){
	var c=e=>e===event;
	}else{
	c=event
	}
	function beginEventLoop(){
		var x=starter(arguments);
		eventdispatcher.conditionalOnce('removeListener',(events,listener)=>{
			if(remover(x))
				eventdispatcher.conditionalOnce('newListener',beginEventLoop,c);
		},(events)=>events==event&eventdispatcher.listenerCount(event)==0);

	}
	eventdispatcher.conditionalOnce('newListener',beginEventLoop,c);
}


}

module.exports={addEventUtilsToEventDispatcher}
