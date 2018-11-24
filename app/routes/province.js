var express = require('express');
var router = express.Router();


router.get('/:prov_id', function(req, res, next) {

	res.render('province', {
		sub: './../',
		title: 'Provice',
		prov_id: req.params.prov_id,
		capital: "Madrid"
	});
});

module.exports = router;