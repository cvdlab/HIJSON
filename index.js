var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname));

app.get('/', function(req, res){
  res.sendFile('index.html', { root: __dirname });
});

app.get('/admin', function(req, res){
  res.sendFile('admin.html', { root: __dirname });
});

app.get('/client', function(req, res){
  res.sendFile('client.html', { root: __dirname });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});