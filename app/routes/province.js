const express = require('express');
const wdk = require('wikidata-sdk')
const dps = require('dbpedia-sparql-client').default;
const rp = require('request-promise');
const rdfstore = require('rdfstore');
const fs = require('fs');
const breq = require('bluereq');
const router = express.Router();

router.get('/:idprov_name', function(req, res, next) {

	//get the province ID and name. The latter without special chars
	idprov = req.params.idprov_name.split('_')[0];
	pain_nameprov = req.params.idprov_name.split('_')[1];

	console.log("--> Arrived requst for " + pain_nameprov + " (to parse) with id: " + idprov);


	//For wikidata
	pain_nameprov_parsed_spaced = pain_nameprov.replace("-", " ")
	//For DBpedia
	pain_nameprov_parsed_undescored = pain_nameprov
		.split('-')
		.map((s) => s.charAt(0).toUpperCase() + s.substring(1))
		.join('_');
	//For Google Maps
	pain_nameprov_parsed_plus = pain_nameprov.replace("-", "+")


	breq.get(wdk.searchEntities(pain_nameprov_parsed_spaced))
		.then(entities => {
			//Retrieve the QID of province's capital. We get the first in list
			capitalQid = entities.body.search[0].id;
			//Query retrieve image and image banner from Wikidata
			const wikidata_query = `
			SELECT ?image ?image_banner WHERE {
				wd:${capitalQid} wdt:P18 ?image.
				wd:${capitalQid} wdt:P948 ?image_banner.
			}`;
			//Query retrieve the abstract from dbpedia
			const dbpedia_query = `
			PREFIX dbp: <http://dbpedia.org/resource/>
			SELECT ?abs WHERE {
				dbp:${pain_nameprov_parsed_undescored} dbo:abstract ?abs.
				FILTER (lang(?abs) = 'en')
			}`;
			const rdf_basic = `PREFIX provincepedia: <http://provincepedia.ml/ontology#>
			SELECT ?ac_name ?province_name ?capital_name ?year
			WHERE {
				?towns provincepedia:provcode <http://provincepedia.ml/resources/prov/${idprov}> ;
				provincepedia:name ?capital_name;
				provincepedia:capital ?capital.
				FILTER (?capital = true)
				<http://provincepedia.ml/resources/prov/${idprov}> provincepedia:name ?province_name.
				<http://provincepedia.ml/resources/prov/${idprov}> provincepedia:in ?ac;
				provincepedia:name ?ac_name.
			}`;
			const rdf_pop = `PREFIX provincepedia: <http://provincepedia.ml/ontology#>
			SELECT ?year ?male ?female
			WHERE {
				?pop provincepedia:provcode <http://provincepedia.ml/resources/prov/${idprov}>;
				provincepedia:in ?year;
				provincepedia:malepopulation ?male;
				provincepedia:femalepopulation ?female.
			}`;
			const rdf_debt = `PREFIX provincepedia: <http://provincepedia.ml/ontology#>
			SELECT ?name ?debt
			WHERE {
				?towns provincepedia:provcode <http://provincepedia.ml/resources/prov/${idprov}> ;
				provincepedia:name ?name;
				provincepedia:debtamount ?debt.
			}`;
			const rdf_crime = `PREFIX provincepedia: <http://provincepedia.ml/ontology#>
			SELECT ?crime_type ?amount2015 ?amount2016
			WHERE {
				?crime provincepedia:id <http://provincepedia.ml/resources/prov/${idprov}> ;
				provincepedia:crimeamount2015 ?amount2015;
				provincepedia:crimeamount2016 ?amount2016;
				provincepedia:felony ?felony.
				?felony provincepedia:name ?crime_type.
			}`;

			//Wikidata query execution
			rp(wdk.sparqlQuery(wikidata_query))
				.then(wdk.simplify.sparqlResults)
				.then(wikidata_result => {

					wikidata_result = wikidata_result[0]
					//DBPedia query execution
					dps.client()
						.query(dbpedia_query)
						.timeout(15000) // optional, defaults to 10000
						.asJson() // or asXml()
						.then(function(r) {
							let abs = r["results"]["bindings"][0].abs.value.replace(/\([^)]*\)/g, "")
							rdfstore.create(function(err, store) {
								var rdf = fs.readFileSync('rdf/db.ttl').toString();
								store.load('text/turtle', rdf, function(s, d) {
									//Turle qeury execution


									store.execute(rdf_crime, function(success, results) {
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

function toTitleCase(str) {
	return str.replace(/\w\S*/g, function(txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}
module.exports = router;