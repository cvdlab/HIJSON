var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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



// io.on('connection', function(socket){
//   socket.on('position sent', function(coordinates){
//     console.log('coordinates: ' + coordinates);
//   });
// });

var admins = io.of('/admins');
admins.on('connection', function(socket){
  console.log('admin connected with id: ' + socket.id);
   socket.on('disconnect', function() {
  	console.log('admin disconnected with id: ' + socket.id)
  });
});


var users = io.of('/users');
users.on('connection', function(socket){
  console.log('user connected with id: ' + socket.id);
   socket.on('disconnect', function() {
  	console.log('user disconnected with id: ' + socket.id)
  });
});


users.on('connection', function(socket){
  socket.on('sentCoordinates', function(latlng){
    console.log('latlng: ' + latlng.lat + ';' + latlng.lng);
    
    var newPosition = {}
    newPosition.id = socket.id;
    newPosition.latlng = latlng;
    users.emit('sentCoordinates', newPosition);
    admins.emit('sentCoordinates', newPosition);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});