var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', function(req, res) {
  res.sendFile('index.html', { root: path.join(__dirname, '../public') });
});

router.get('/admins', function(req, res) {
  res.sendFile('admin.html', { root: path.join(__dirname, '../public') });
});

router.get('/users', function(req, res) {
  res.sendFile('user.html', { root: path.join(__dirname, '../public') });
});

module.exports = router;
