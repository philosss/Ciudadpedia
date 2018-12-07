var express = require('express');
const wdk = require('wikidata-sdk')
var dps = require('dbpedia-sparql-client').default;
var rp = require('request-promise');
const breq = require('bluereq');
var rdfstore = require('rdfstore');
var fs = require('fs');

var router = express.Router();

function toTitleCase(str) {
	return str.replace(/\w\S*/g, function(txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

router.get('/:idprov_name', function(req, res, next) {
	//Get the province // IDEA:
	idprov = req.params.idprov_name.split('_')[0];
	nameprov = req.params.idprov_name.split('_')[1];


	console.log("Arrived requst for " + nameprov + " (to parse) with id:" + idprov);
	//Doesn't contains special chars
	nameprov_parsed_spaced = nameprov
		.split('-')
		.map((s) => s.charAt(0).toUpperCase() + s.substring(1))
		.join(' ');

	nameprov_parsed_undescored = nameprov_parsed_spaced.replace(" ", "_")
	nameprov_parsed_plus = nameprov_parsed_spaced.replace(" ", "+")


	breq.get(wdk.searchEntities(nameprov_parsed_spaced))
		.then(entities => {
			capitalQid = entities.body.search[0].id;

			const wikidata_query = `
		SELECT ?image ?image_banner WHERE {
			wd:${capitalQid} wdt:P18 ?image.
			wd:${capitalQid} wdt:P948 ?image_banner.
		}`;

			const dbpedia_query = `
	PREFIX dbp: <http://dbpedia.org/resource/>
	SELECT ?abs WHERE {
		dbp:${nameprov_parsed_undescored} dbo:abstract ?abs.
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

							rdfstore.create(function(err, store) {
								var rdf = fs.readFileSync('rdf/towns-csv.ttl').toString();
								store.load('text/turtle', rdf, function(s, d) {
									//console.log(s, d);
									var query = `
									SELECT ?n
									WHERE {
										?town <http://provincepedia.ml/resources/#provcode> ?n.


									}
									`
									//"1" <http://provincepedia.ml/resources/#capital> ?town.

									//<http://provincepedia.ml/resource/ac#4> <http://provincepedia.ml/resources/#name> ?name

									store.execute(query, function(success, results) {
										console.log(results);
									});
								});
							});

							res.render('province', {
								sub: './../',
								prov_idcode: idprov,
								ac_name: "Madrid",
								//prov_name: prov_idcode_parsed_spaced,
								capital_name: "Madrid",
								title: 'Provice of Madrid',
								abstract: abs.split(". ").slice(0, 6).join(". "),
								image: wikidata_result.image,
								image_banner: wikidata_result.image_banner
							});
						})
						.catch(function(e) { console.log(e); });
				});
		});
});

module.exports = router;