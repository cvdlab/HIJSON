var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var usersConnected = {};

app.use(express.static(__dirname));

app.get('/admins', function(req, res){
    res.sendFile('admin.html', { root: __dirname });
});

app.get('/users', function(req, res){
    res.sendFile('user.html', { root: __dirname });
});

app.get('/', function(req, res){
    res.sendFile('index.html', { root: __dirname });
});


var admins = io.of('/admins');

admins.on('connection', function(socket){
    console.log('Admin connected with id: ' + socket.id);
    socket.emit('initMap',usersConnected);
  
  socket.on('disconnect', function(){
    console.log('Admin disconnected with id: ' + socket.id);
  });

});

var users = io.of('/users');

users.on('connection', function(socket){
    console.log('User connected with id: ' + socket.id);
    var socketInfo = {
        id: socket.id,
        latlng: [0, 0]
    };
    usersConnected[socketInfo.id] = socketInfo;
    socket.emit('initSocket', socketInfo);
    admins.emit('updateUsers',usersConnected);

    socket.on('disconnect', function(){
        console.log('User disconnected with id: ' + socket.id);
        delete usersConnected[socket.id];
        admins.emit('userDisconnected',socket.id);
    });

    socket.on('sentCoordinates', function(latlng){
        socketInfo.latlng = latlng;
        socket.emit('refreshCoordinates',socketInfo);
        admins.emit('updateUsers',usersConnected);
    });
});


http.listen(3000, function(){
    console.log('listening on *:3000');
});