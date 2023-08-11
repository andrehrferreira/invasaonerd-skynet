/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

module.exports = (app, mongodb, i18n, passport, schema, wallpapers, cache) => {

	app.get(schema.routes.nomatch + '/:search', async (req, res) => {
		var { user, params } = req
		const { search } = params
		if (!user) user = {}
		try {
			const sugestions = await findSugestions(search, mongodb, schema)
			res.render(schema.templates.nomatch, { user, sugestions, search })
		} catch (err) {
			res.sendStatus(500)
			console.log(err)
		}
	})

}

async function findSugestions (search, mongodb, schema) {
	const sugestions =  await mongodb.collection(schema.collections.search)
		.find({
			$text: {
				$search: search.split('-').join(' '),
				$caseSensitive: false,
				$diacriticSensitive: false
			}
		})
		.project({ score: { $meta: "textScore" } })
  	.sort({ score: { $meta:"textScore" } })
		.limit(10)
		.toArray()
	if (sugestions.length === 0 && search !== '') {
		const newSearch = search.split('').filter((letter, index, arr) => index < (arr.length - 1)).join('')
		return await findSugestions(newSearch, mongodb, schema)
	} else {
		return sugestions
	}
}