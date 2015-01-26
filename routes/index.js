var express = require('express');
var router = express.Router();
var data = require('../c3d/c3d_server');

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
		data: JSON.stringify(data)
	});
});

router.get('/user', function(req, res) {
	res.render('user', {
		title: 'IoT 3D - user',
		enable_2D: true,
		enable_3D: true,
		data: JSON.stringify(data)
	});
});

module.exports = router;
