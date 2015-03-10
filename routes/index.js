var express = require('express');
var router = express.Router();
var data = require('../c3d/c3d_server');

router.get('/', function(req, res) {
	res.render('index', {
		title: 'HIJSON Web Framework'
	});
});

router.get('/admin', function(req, res) {
	res.render('admin', {
		title: 'HIJSON Web Framework - Supervisor',
		enable_2D: true,
		enable_3D: true,
		data: JSON.stringify(data)
	});
});

router.get('/user', function(req, res) {
	res.render('user', {
		title: 'HIJSON Web Framework - Explorer',
		enable_2D: true,
		enable_3D: true,
		data: JSON.stringify(data)
	});
});

router.get('/user3D', function(req, res) {
	res.render('user', {
		title: 'HIJSON Web Framework - Explorer',
		enable_2D: false,
		enable_3D: true,
		data: JSON.stringify(data)
	});
});

router.get('/user2D', function(req, res) {
	res.render('user', {
		title: 'HIJSON Web Framework - Explorer',
		enable_2D: true,
		enable_3D: false,
		data: JSON.stringify(data)
	});
});
module.exports = router;
