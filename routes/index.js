var express = require('express');
var router = express.Router();
var C3D = require('../c3d_server');

router.get('/', function(req, res) {
	res.render('index', {
		title: 'IoT 3D - Index'
	});
});

router.get('/admin', function(req, res) {
	res.render('admin', {
		title: 'IoT 3D - Admin',
		enable_2D: true,
		enable_3D: true,
		C3D_server: JSON.stringify(C3D)
	});
});

router.get('/user', function(req, res) {
	res.render('user', {
		title: 'IoT 3D - user',
		enable_2D: true,
		enable_3D: true,
		C3D_server: JSON.stringify(C3D)
	});
});

module.exports = router;
