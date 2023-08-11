/**
 * API Youtube Canais
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

const { search } = require('googleapis').google.youtube('v3');

module.exports = (req, res) => {
	const { ref } = req.params;

	search.list({
		q: ref,
		part: 'id,snippet',
		maxResults: 30,
		auth: 'AIzaSyBPjwU4s4dOPIMkRNXXIoCJnP8pxmYN0NU',
		type: 'channel'
	}, (err, response) => {
		if (err) {
    		res.sendStatus(500);
    		return;
		}

		const {	items } = response.data;

		res.send(items.filter(item => item.id !== undefined).map(item => {
			return {
				id: item.id.channelId,
				link: "https://www.youtube.com/channel/" + item.id.channelId,
				kind: item.id.kind,
				publishedAt: item.snippet.publishedAt,
				channelId: item.snippet.channelId,
				channelTitle: item.snippet.channelTitle,
				title: item.snippet.title,
				description: item.snippet.description,
				thumbnails: item.snippet.thumbnails
			}
		}));
	})
}
