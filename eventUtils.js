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
	this.on(event,eventfn.bind(this));
}
eventdispatcher.pcondintionalOnce=util.promisify(function(event,condition,cb){
return this.conditionalOnce(event,(...args)=>cb(null,args),condition)
});




}

module.exports={addEventUtilsToEventDispatcher}
