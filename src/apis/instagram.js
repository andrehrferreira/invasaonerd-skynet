/**
 * API - Instagram
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict"

const request = require('request')
const jsdom = require("jsdom")

module.exports = {
	getInstagramInfos: function (url) {
		return new Promise(resolve => {
			const { JSDOM } = jsdom
			request.get({
				url: url,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
					'From': 'webmaster@example.org'
				}
			}, async (err, response, body) => {
				if (!err) {
					try {
						const site = await new JSDOM(body, {
							runScripts: 'dangerously'
						})
						if (site.window.__initialData.data) {
							const instagram = await site.window.__initialData.data.entry_data.ProfilePage[0].graphql.user 
							return resolve(instagram)
						} else if (body.includes('Restricted profile &bull; Instagram')) {
							return resolve({ blocked: true })
						}
					} catch (err) {
						console.log(err)
						return resolve({})
					}
					return resolve({})
				} else {
					console.log(err)
					return resolve({})
				}
			})
		})
	},

	getInstagramUserMidia: function (url) {
		return new Promise(resolve => {
			const { JSDOM } = jsdom
			request.get({
				url: url,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
					'From': 'webmaster@example.org'
				}
			}, (err, response, body) => {
				try {
					return resolve(new JSDOM(body, {
						runScripts: 'dangerously'
					}).window.__initialData.data.entry_data.PostPage[0].graphql.shortcode_media)
				} catch (err) {
					return resolve({})
				}
			})
		})
	}
}
