var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');
//var bodyParser = require('body-parser');

//var routes = require('./routes/index');
//var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true;

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
//app.use('/users', users);

app.get('/', function(req, res) {
	res.render('main', {
		title: 'C3D - Index',
		enable_2D: true,
		enable_3D: true,
		C3D_server: JSON.stringify(C3D)
	});
});

app.get('/admin', function(req, res) {
	res.render('admin', {
		title: 'C3D - Admin',
		enable_2D: true,
		enable_3D: true,
		C3D_server: JSON.stringify(C3D)
	});
});

app.get('/user', function(req, res) {
	res.render('user', {
		title: 'C3D - user',
		enable_2D: true,
		enable_3D: true,
		C3D_server: JSON.stringify(C3D)
	});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var C3D = require('./c3d_server.js');
C3D.parseJSON();

//var debug = require('debug')('c3d');

app.set('port', process.env.PORT || 3000);

/*
var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
*/

var server = app.listen(app.get('port'));
console.log('Server running on port: '+app.get('port'));

//socket.io
var io = require('socket.io')(server);
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

module.exports = app;