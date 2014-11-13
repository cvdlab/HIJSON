module.exports = function (io) {
	
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
	});
	
}