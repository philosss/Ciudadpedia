var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	res.render('newpage', { title: 'New page' });
});

module.exports = router;