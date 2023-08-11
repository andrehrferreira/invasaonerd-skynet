/**
 * Criação de paginas
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict";

const objectId = require('mongodb').ObjectID

module.exports = (parses, app, mongodb, settings, passport, schema, notify, cache) => {

	app.get('/sitemap.xml', async (req, res) => {

		const categories = await mongodb.collection(schema.collections.categories).find({
			deleted: {
				$ne: true
			}
		}).toArray()

		var xml = `<?xml version="1.0" encoding="UTF-8"?>
								<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
		xml += `<sitemap>
			<loc>${settings.url}/fixes.xml</loc>
			<lastmod>${new Date().toISOString()}</lastmod>
		</sitemap>`
		xml += categories.map(({
			text,
			date
		}) => {
			return `<sitemap>
								<loc>${settings.url}/${formatCategorie(text)}/sitemap.xml</loc>
								<lastmod>${new Date().toISOString()}</lastmod>
							</sitemap>`
		}).join('')
		xml += '</sitemapindex>'

		res.set('Content-Type', 'text/xml')
		res.end(xml)

	})

	function formatCategorie (text) {
		return encodeURI(text.split('/').join('-'))
	}

	app.get('/:categorie/sitemap.xml', async (req, res) => {

		var {
			categorie
		} = req.params

		categorie = decodeURI(categorie.split('-').join('/'))

		const pages = await mongodb.collection(schema.collections.pages).find({
			$and: [{
				removed: {
					$ne: true
				}
			}, {
				categories: {
					$in: [categorie]
				}
			}]
		}).project({
			feedbackDate: true,
			url: true
		}).toArray()

		var xml = `<?xml version="1.0" encoding="UTF-8"?>
								<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
		xml += pages.map(({
			feedbackDate,
			url
		}) => {
			return `<url>
								<loc>${settings.url}/page/${url}</loc>
								<lastmod>${new Date(feedbackDate).toISOString()}</lastmod>
								<changefreq>always</changefreq>
							</url>
							<url>
								<loc>${settings.url}/page/${url}/community</loc>
								<lastmod>${new Date(feedbackDate).toISOString()}</lastmod>
								<changefreq>always</changefreq>
							</url>`
		}).join('')
		xml += `</urlset>`

		res.set('Content-Type', 'text/xml')
		res.end(xml)

	})

	app.get('/fixes.xml', async (req, res) => {

		var xml = `<?xml version="1.0" encoding="UTF-8"?>
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

		xml += `<url>
							<loc>${settings.url}</loc>
							<lastmod>${new Date().toISOString()}</lastmod>
							<changefreq>always</changefreq>
						</url>`
		xml += `</urlset>`

		res.set('Content-Type', 'text/xml')
		res.end(xml)			

	})

}
