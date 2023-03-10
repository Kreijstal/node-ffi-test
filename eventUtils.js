var util=require('node:util');
function addEventUtilsToEventDispatcher(eventdispatcher){

/**
 * Sets up a listener for a specific event that is removed after the first time the given condition is met.
 * @param {string} event - The event to listen for.
 * @param {Function} cb - The callback function to execute when the condition is met.
 * @param {Function} condition - A callback function that takes the event arguments and returns true if the condition is met, false otherwise.
 * @returns {void}
 */
eventdispatcher.conditionalOnce=function conditionalOnce(event,cb,condition){
	var that=this;
	function eventfn(...args){
		if(condition(...args)){
			that.off(event,eventfn);
			console.log(event,"off has been called!")
			cb(...args);
		}
	}

	this.on(event,eventfn);
}
eventdispatcher.pcondintionalOnce=util.promisify(function(event,condition,cb){
return this.conditionalOnce(event,(...args)=>cb(null,args),condition)
});

/**
 * Sets up a listener that creates an emitter Loop for a specific event, when the event has been listened to, using the given starter and remover functions.
 * @param {Function|string} event - The event to listen for. Can be either a function that takes a string or a string representing the event name.
 * @param {Function} starter - A function that sets up the emitter loop.
 * @param {Function} remover - A function that stops the emitter loop.
 * @returns {void}
 * @description This function listens for new listeners where the event is a string or a predicate function that takes a string. If the function predicate returns true, or if the string is equal to the event name being listened, it calls the starter function to begin emitting events of that type. When there are no more listeners for that event, the remover function is called to stop the loop and the events stop being emitted.
 */
eventdispatcher.oneTimeListen = function createEmitterLoopConditionally (event, starter, remover) {
  // If the event is not a function, create a new function that returns true if the event is equal to the given event
  var conditionalFn = typeof event !== "function" ? function(e) { return e === event; } : event;
  
  // Define a function to start the event listener
  function beginEventEmitterLoop() {
    // Call the starter function with the given arguments and save its return value
    var listenerId = starter(arguments);

    // Define a function to remove the event listener when there are no more listeners for this event
    var removeListenerFn = function(events, listener) {
      if (remover(listenerId)) {
        eventdispatcher.conditionalOnce('newListener', beginEventEmitterLoop, conditionalFn);
      }
    };

    // Add the removeListener function as a one-time listener for the 'removeListener' event
    eventdispatcher.conditionalOnce('removeListener', removeListenerFn, function(events) {
      return events === event && eventdispatcher.listenerCount(event) === 0;
    });
  }

  // Add the beginEventEmitterLoop function as a one-time listener for the 'newListener' event
  eventdispatcher.conditionalOnce('newListener', beginEventEmitterLoop, conditionalFn);
};


}

module.exports={addEventUtilsToEventDispatcher}
