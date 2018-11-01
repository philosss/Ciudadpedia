var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	res.render('applicationRequirements', { sub: './', title: 'Application Requirements' });
});

module.exports = router;