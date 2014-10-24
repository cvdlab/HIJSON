var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index', { title: 'C3D' });
});

module.exports = router;
