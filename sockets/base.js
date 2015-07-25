module.exports = function (io,app) {
	
	var admins = io.of('/admins');
	var users = io.of('/users');
	var usersConnected = {};
	
	admins.on('connection', function(socket){
		console.log('Admin connected with id: ' + socket.id);
		socket.emit('updateMapUsersConnected', usersConnected);
		socket.on('disconnect', function() {
			console.log('Admin disconnected with id: ' + socket.id);
		});
	});
	
	users.on('connection', function(socket){
	    console.log('User connected with id: ' + socket.id);
	    var user = {
	        id: socket.id,
	        position: {}
	    };
	    usersConnected[user.id] = user;
	
	    socket.on('disconnect', function(){
	        console.log('User disconnected with id: ' + socket.id);
	        delete usersConnected[socket.id];
	        admins.emit('updateMapUsersConnected', usersConnected);
	    });
	
	    socket.on('updatePosition', function(position){
	        user.position = position;
	        admins.emit('updateMapUsersConnected', usersConnected);
	    });

	    socket.on('initIoT', function(dataObject) {
	    	var proxy = app.data.proxies[dataObject.id];
	    	console.log(proxy);
	    });

	    socket.on('client2server', function(dataObject) {
	    	if(dataObject.type === 'getInitialState') {
	    		socket.emit('server2client', {
	    			type: 'setInitialState',
	    			state: app.data.proxies[dataObject.id].getState()
	    		});
	    	}
	    	if(dataObject.type === 'changeState') {
	    		var proxy = app.data.proxies[dataObject.id];
	    		proxy.setState(dataObject.value);
	    	}
	    });

	});
}