// template for js modules that works both in node and browsers

// (1) initialize library object (namespace)
var eventEmitter = {};

// (2) import any dependencies (in browser must be included before this file)
// example: var dependency = dependency || require('./dependency');

(function(){
	var handlers = {};	

	var on = function (event, handler) {
		var handlers_list = handlers[event];
		
		if (handlers_list === undefined) {
			handlers_list = handlers[event] = [];
		}
		
		handlers_list.push(handler);
	};

	var emit = function (event, data) {
		var handlers_list = handlers[event];
		
		if (handlers_list !== undefined) {
			handlers_list.forEach(function (handler) {
				handler(data);
			});
		};
	};
	// (4) exported things (public)
	eventEmitter.on = on;
	eventEmitter.emit = emit;
	
	// (5) export the namespace object
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = eventEmitter;
	}	
	
})();