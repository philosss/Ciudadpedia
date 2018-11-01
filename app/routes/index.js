var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	res.render('index', { sub: './', title: 'Welcome' });
});

module.exports = router;