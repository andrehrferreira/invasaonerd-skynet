/**
 * API Youtube Playlists
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
		type: 'playlist'
	}, (err, response) => {
		if (err) {
			res.sendStatus(500);
			return;
		}

		const { items } = response.data;
		res.send(items.map(item => {
			return {
				id: item.id.playlistId,
				link: "https://www.youtube.com/playlist?list=" + item.id.playlistId,
				kind: item.id.kind,
				publishedAt: item.snippet.publishedAt,
				channelId: item.snippet.channelId,
				channelTitle: item.snippet.channelTitle,
				title: item.snippet.title,
				description: item.snippet.description,
				thumbnails: item.snippet.thumbnails
			};
		}));
	});
}
