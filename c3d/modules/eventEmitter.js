// (1) dependencies

// (2) private things
var handlers = {};

// (3) public/exported things
var self = module.exports = {
	on: function (event, handler) {
		var handlers_list = handlers[event];
		
		if (handlers_list === undefined) {
			handlers_list = handlers[event] = [];
		}
		
		handlers_list.push(handler);
	},

	emit: function (event, data) {
		var handlers_list = handlers[event];
		
		if (handlers_list !== undefined) {
			handlers_list.forEach(function (handler) {
				handler(data);
			});
		}
	},

	handlers: handlers
} //close module.exports