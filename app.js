console.log('REMEMBER TO START THIS APPLICATION WITH \'npm start\' and not \'node app.js\'');

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

var router = express.Router();
var data = require('./c3d/c3d_server');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

router.get('/', function(req, res) {
    res.render('index', {
        title: 'FIVE Web Framework'
    });
});

router.get('/admin', function(req, res) {
    res.render('admin', {
        title: 'FIVE Web Framework - Supervisor',
        enable_2D: true,
        enable_3D: true,
        data: JSON.stringify(data)
    });
});

router.get('/user', function(req, res) {
    res.render('user', {
        title: 'FIVE Web Framework - Explorer',
        enable_2D: true,
        enable_3D: true,
        data: JSON.stringify(data)
    });
});

router.get('/user3D', function(req, res) {
    res.render('user', {
        title: 'FIVE Web Framework - Explorer',
        enable_2D: false,
        enable_3D: true,
        data: JSON.stringify(data)
    });
});

router.get('/user2D', function(req, res) {
    res.render('user', {
        title: 'FIVE Web Framework - Explorer',
        enable_2D: true,
        enable_3D: false,
        data: JSON.stringify(data)
    });
});

app.use('/', router);

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

app.data = data;

module.exports = app;
