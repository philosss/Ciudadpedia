var express = require('express');
const wdk = require('wikidata-sdk')
var dps = require('dbpedia-sparql-client').default;
var rp = require('request-promise');

var router = express.Router();

router.get('/:prov_id', function(req, res, next) {

	// Get the url
	const wikidata_query = `
	SELECT ?image ?image_banner WHERE {
		wd:Q2807 wdt:P18 ?image.
		wd:Q2807 wdt:P948 ?image_banner.
	}`;
	const dbpedia_query = `
	PREFIX dbp: <http://dbpedia.org/resource/>
	SELECT ?abs WHERE {
		dbp:Madrid dbo:abstract ?abs.
		FILTER (lang(?abs) = 'en')
	}`;

	rp(wdk.sparqlQuery(wikidata_query))
		.then(wdk.simplify.sparqlResults)
		.then(wikidata_result => { // do awesome stuffs here })
			wikidata_result = wikidata_result[0]

			dps.client()
				.query(dbpedia_query)
				.timeout(15000) // optional, defaults to 10000
				.asJson() // or asXml()
				.then(function(r) {
					let abs = r["results"]["bindings"][0].abs.value.replace(/\([^)]*\)/g, "")

					res.render('province', {
						sub: './../',
						prov_id: req.params.prov_id,
						ac_name: "Madrid",
						prov_name: "Madrid",
						capital_name: "Madrid",
						title: 'Provice of Madrid',
						abstract: abs.split(". ").slice(0, 7).join(". "),
						image: wikidata_result.image,
						image_banner: wikidata_result.image_banner
					});
				})
				.catch(function(e) { console.log(e); });

		});
});

module.exports = router;