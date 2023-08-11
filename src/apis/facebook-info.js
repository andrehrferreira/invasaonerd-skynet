/**
 * API Facebook
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

"use strict"

var Crawler = require("crawler")
var crawler = new Crawler({
	maxConnections: 10
})

module.exports = (url, response) => {
	crawler.queue([{
		uri: url,
		rateLimit: 1000,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
		},
		jQuery: true,
		callback: function(error, res, done) {
			if (error) {
				response.send(error)
			}
            else {
				const { $ } = res;

				response.send({
					avatar: $('img')[0].attribs.src
				})
			}

			done();
		}
	}])
}
