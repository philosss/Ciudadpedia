var express = require('express');
const wdk = require('wikidata-sdk')
var dps = require('dbpedia-sparql-client').default;
var rp = require('request-promise');

var router = express.Router();

function toTitleCase(str) {
	return str.replace(/\w\S*/g, function(txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

router.get('/:prov_idcode', function(req, res, next) {

	//Doesn't contains special chars
	prov_idcode_parsed_spaced = req.params.prov_idcode
		.split('-')
		.map((s) => s.charAt(0).toUpperCase() + s.substring(1))
		.join(' ');

	prov_idcode_parsed_undescored = prov_idcode_parsed_spaced.replace(" ", "_")

	// Get the url

	const wikidata_query = `
	SELECT ?image ?image_banner WHERE {
		wd:Q2807 wdt:P18 ?image.
		wd:Q2807 wdt:P948 ?image_banner.
	}`;
	const dbpedia_query = `
	PREFIX dbp: <http://dbpedia.org/resource/>
	SELECT ?abs WHERE {
		dbp:` + prov_idcode_parsed_undescored + ` dbo:abstract ?abs.
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
						prov_idcode: req.params.prov_idcode,
						ac_name: "Madrid",
						prov_name: prov_idcode_parsed_spaced,
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