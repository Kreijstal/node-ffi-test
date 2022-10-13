var util=require('node:util');
function addEventUtilsToEventDispatcher(eventdispatcher){

eventdispatcher.conditionalOnce=function(event,cb,condition
	//,addEmitter=_=>_,removeEmitter=_=>_
){
	function eventfn(...args){
		if(condition(...args)){
			cb(...args);
			//removeEmitter();
			this.off(event,eventfn);
		}
	}
	//addEmitter()
	this.on(event,eventfn.bind(this));
}
eventdispatcher.pcodintionalOnce=util.promisify(function(event,condition,cb){
return this.conditionalOnce(event,(...args)=>cb(null,args),condition)
});




}

module.exports={addEventUtilsToEventDispatcher}
