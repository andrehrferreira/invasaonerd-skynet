/**
 * API Livros
 * @author André Ferreira <andre@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

const books = require('google-books-search-2');

module.exports = (req, res, mongodb, cache) => {
	var search = req.params.ref

	cache('api-books', search.toLowerCase()).then((books) => {
		res.json(books)
	}).catch(() => {
		books.search(search, {
    		type: 'books',
    		lang: 'pt-br',
    		limit: 30
		}).then((data) => {
			data.forEach((book, key) => {
				if (book.authors)
	      data[key].authors = book.authors.join(", ")
			});

			cache('api-books', search.toLowerCase(), data, 'inAday');

			//Gravando resultados de API
			data.forEach(d => {
				d.name = d.title
				mongodb.collection('api-books').updateOne({ name: d.title }, { $set: d }, { upsert: true })
			});

			res.send(data)
		}).catch(function(err) {
			res.status(500).send(err)
		});
	})
}
