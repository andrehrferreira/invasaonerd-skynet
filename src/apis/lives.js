/**
 * API Twitch
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

"use strict"

var request = require('request')

module.exports = (ref) => {
	return new Promise(resolve => {
		request.get({
			url: 'https://api.twitch.tv/kraken/search/streams?query=' + ref,
			headers: {
				'Client-ID': 'u9nb9mn7na02vqxio98smfv0b235vq',
				'Content-Type': 'application/json',
				'User-Agent': 'request'
			}
		  } , (err, response, body) => {
			if (err) {
				console.log(err)
				resolve({ streams: [] })
			} else {
				resolve(JSON.parse(body))
			}
		})
	})
}
