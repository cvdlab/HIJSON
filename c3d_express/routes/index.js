var express = require('express');
var router = express.Router();
var C3D = require('../c3d_server.js');

router.get('/', function(req, res) {
  res.render('index', { title: 'C3D' });
});

module.exports = router;
