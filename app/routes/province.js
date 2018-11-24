var express = require('express');
var router = express.Router();


router.get('/:prov_id', function(req, res, next) {
	function formatPolulation() {
		var data = '2018,28,3142095,3407885-2017,28,3108811,3367894-2016,28,3084747,3339528-2015,28,3066776,3318521-2014,28,3065576,3312721-2013,28,3086686,3328023-2012,28,3097459,3328114-2011,28,3087772,3306467-2010,28,3082941,3290591-2009,28,3066114,3261480-2008,28,3018293,3207902';

		var splittedLines = data.split('-');
		var toRet = new Object();
		for (var line of splittedLines) {
			toRet.year = parseInt(line[0]);
			toRet.line[0].totalPopulation = (parseInt(line[1]) + parseInt(line[2]));
			toRet.line[0].population = new Object();
			toRet.line[0].population.men = parseInt(line[1]);
			toRet.line[0].population.women = parseInt(line[2]);
		}
		console.log(toRet)
		return toRet
	}


	res.render('province', {
		sub: './../',
		title: 'Provice',
		prov_id: req.params.prov_id,
		capital: "Madrid",
		polulation: formatPolulation()
	});
});

module.exports = router;