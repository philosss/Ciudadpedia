var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	res.render('datasetRequirements', { sub: './', title: 'Dataset Requirements' });
});

module.exports = router;