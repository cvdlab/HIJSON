var express = require('express');
var router = express.Router();
var C3D = require('../c3d_server.js');

router.get('/', function(req, res) {
	res.render('main', {
		title: 'C3D - Index',
		enable_2D: true,
		enable_3D: false,
		C3D_server: JSON.stringify(C3D)
	});
});

module.exports = router;
