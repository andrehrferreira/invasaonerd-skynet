/**
 * API
 * @author André Ferreira <andre@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

const wiki = require("wikijs").default
let Labels = require("./../wiki-types.json")
let Ignore = require("./../wiki-ignore.json")

module.exports = (req, res, mongodb, cache) => {
	var search = req.params.ref;

	cache('api-wiki', search.toLowerCase()).then((wiki) => {
		res.json(wiki);
	}).catch(() => {
		getWiki(search).then((infos) => {
			const wiki = {
				error: false,
				name: search,
				summary: infos[1],
				fullinfo: infos[0]
			}

			cache('api-wiki', search.toLowerCase(), wiki, 'inAday');
			saveWikiToDatabase(mongodb, wiki);
			res.json(wiki);
		})
		.catch((err) => {
			res.json({ error: err });
		})
	})
}

function saveWikiToDatabase(db, data) {
    db.collection('api-wiki').updateOne({ name: data.name }, { $set: data }, { upsert: true });
}

async function getWiki(search) {
	return await Promise.all([
		getFullinfo(search),
		getSummary(search)
	])
}

function getFullinfo(search) {
	return new Promise((resolve, reject) => {
		wiki({ apiUrl: 'https://pt.wikipedia.org/w/api.php' })
		.page(search).then( page => page.fullInfo() )
		.then((data) => {
			let dataReturn = {};

			for (let key in data.general) {
				// if (typeof data.general == "object")
				// 	if (typeof data.general[key].join == "function")
				// 		dataReturn[key] = data.general[key];
				// else
				// 	dataReturn[key] = data.general[key];
				// else
				dataReturn[key] = data.general[key];
			}

			Ignore.forEach(function(key) {
				if (key in dataReturn)
					delete dataReturn[key];
			});

			for (let key in Labels) {
				if (key in dataReturn) {
					dataReturn[Labels[key]] = dataReturn[key];
					delete dataReturn[key];
				}
			}

			resolve(dataReturn)
		}).catch((err) => {
			resolve({})
		});
	})
}

function getSummary(search) {
	return new Promise((resolve, reject) => {
		wiki({ apiUrl: 'https://pt.wikipedia.org/w/api.php' })
		.page(search).then(page => page.summary())
		.then((data) => {
			resolve(data)
		}).catch((err) => {
			console.log(err)
			resolve('')
		})
	})
}
