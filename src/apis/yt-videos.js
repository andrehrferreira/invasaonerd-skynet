/**
 * API Youtube
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

"use strict";

const { search } = require('googleapis').google.youtube('v3');

module.exports = (ref) => {
	var limit = 30;
	if (ref.includes('trailer')) limit = 3;

	return new Promise(resolve => {
		search.list({
			q: ref,
			part: 'id,snippet',
			maxResults: limit,
			auth: 'AIzaSyBPjwU4s4dOPIMkRNXXIoCJnP8pxmYN0NU',
			type: 'video'
		}, (err, response) => {
			if (err) {
    			resolve([]);
    			return;
			}

			const { items } = response.data;
			resolve(items.map(item => {
				return {
					id: item.id.videoId,
					link: "https://www.youtube.com/watch?v=" + item.id.videoId,
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
	})
}
