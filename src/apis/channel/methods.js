/**
 * API - Youtube
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 */

"use strict"

const {
	search,
	channels
} = require('googleapis').google.youtube('v3')
const auth = 'AIzaSyBPjwU4s4dOPIMkRNXXIoCJnP8pxmYN0NU'
const cronjobauth = 'AIzaSyAYRVDyq8PsN7ROKNyBCFF7sGL-jzCtprU'
const Crawler = require("crawler")
const crawler = new Crawler({
	maxConnections: 10
})

module.exports = {
	getChannelByUserName: (ref, url) => {
		return new Promise((resolve, reject) => {
			channels.list({
				auth: auth,
				part: 'id,snippet,brandingSettings,contentDetails,invideoPromotion,statistics,topicDetails',
				forUsername: ref
			}, (err, response) => {
				callbackChannel(err, response, resolve, reject, url)
			})
		})
	},

	getChannelByChannelId: (ref, url) => {
		return new Promise((resolve, reject) => {
			channels.list({
				auth: auth,
				part: 'id,snippet,brandingSettings,contentDetails,invideoPromotion,statistics,topicDetails',
				id: ref
			}, (err, response) => {
				callbackChannel(err, response, resolve, reject, url)
			})
		})
	},

	getPlayListsChannel: (channelId, limit, cronjob) => {
		return new Promise((resolve, reject) => {
			search.list({
				auth: cronjob ? cronjobauth : auth,
				part: 'id,snippet',
				type: 'playlist',
				channelId: channelId,
				maxResults: limit ? parseInt(limit) : 30,
				order: 'date'
			}, (err, response) => {
				if (err) {
					reject({
						message: 'The API returned an error: ' + err,
						status: 500
					})
					return
				}
				const {
					items
				} = response.data
				resolve(items.map(item => {
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
					}
				}))
			})
		})
	},

	getVideosChannel: (channelId, limit, cronjob) => {
		return new Promise((resolve, reject) => {
			search.list({
				auth: cronjob ? cronjobauth : auth,
				part: 'id,snippet',
				type: 'video',
				channelId: channelId,
				maxResults: limit ? parseInt(limit) : 20,
				order: 'date'
			}, (err, response) => {
				if (err) {
					reject({
						message: 'The API returned an error: ' + err,
						status: 500
					})
					return
				}
				const {
					items
				} = response.data
				resolve(items.map(video => {
					return {
						id: video.id.videoId,
						link: "https://www.youtube.com/watch?v=" + video.id.videoId,
						kind: video.id.kind,
						publishedAt: video.snippet.publishedAt,
						channelId: video.snippet.channelId,
						channelTitle: video.snippet.channelTitle,
						title: video.snippet.title,
						description: video.snippet.description,
						thumbnails: video.snippet.thumbnails
					}
				}))
			})
		})
	}
}

function callbackChannel(err, response, resolve, reject, url) {
	if (err) {
		reject({
			message: 'The API returned an error: ' + err,
			status: 500
		})
		return
	}
	const {
		items
	} = response.data

	if (items[0].brandingSettings.channel.featuredChannelsUrls) {
		Promise.all(items[0].brandingSettings.channel.featuredChannelsUrls.map(ftchannel => {
			return new Promise((resolve, reject) => {
				search.list({
					auth: auth,
					part: 'id,snippet',
					type: 'channel',
					channelId: ftchannel
				}, (err, response) => {
					if (err) return resolve([])
					resolve(response.data.items.map(item => {
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
					})[0])
				})
			})
		})).then(featuredChannelsUrls => {
			formatOut(items, featuredChannelsUrls, url).then(channel => {
				resolve(channel)
			})
		})
	} else {
		formatOut(items, false, url).then(channel => {
			resolve(channel)
		})
	}
}

async function formatOut(items, channels, url) {
	const channelInfo = await items.map(ch => {
		return {
			id: ch.id,
			title: ch.snippet.title,
			publishedAt: ch.snippet.publishedAt,
			description: ch.snippet.description,
			avatar: ch.snippet.thumbnails.high.url,
			country: ch.snippet.country,
			statistics: ch.statistics,
			playlistWithAllVideos: ch.contentDetails.relatedPlaylists.uploads,
			keywords: ch.brandingSettings.channel.keywords,
			featuredChannelsTitle: ch.brandingSettings.channel.featuredChannelsTitle,
			featuredChannelsUrls: channels ? channels.filter(ch => ch ? true : false) : ch.brandingSettings.channel.featuredChannelsUrls,
			cover: ch.brandingSettings.image.bannerTvHighImageUrl
		}
	})[0]
	if (url) {
		channelInfo.links = await getYoutubeLinks(url)
	}
	return await new Promise(resolve => {
		resolve(channelInfo)
	})
}

function getYoutubeLinks (url) {
	return new Promise(resolve => {
		const request = require('request')
		const jsdom = require("jsdom")
		const { JSDOM } = jsdom
		request.get({
			url: url,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
				'From': 'webmaster@example.org'
			}
		}, (err, response, body) => {
			var ytLinks = ''
			try {
				ytLinks = new JSDOM(body, {
					runScripts: 'dangerously'
				}).window.ytInitialData.header.c4TabbedHeaderRenderer.headerLinks.channelHeaderLinksRenderer
				const links = []
				if (ytLinks.primaryLinks) {
					ytLinks.primaryLinks.map(link => {
						links.push({
							type: link.title.simpleText,
							link: link.navigationEndpoint.commandMetadata.webCommandMetadata.url
						})
					})
				}
				if (ytLinks.secondaryLinks) {
					ytLinks.secondaryLinks.map(link => {
						links.push({
							type: link.title.simpleText,
							link: link.navigationEndpoint.commandMetadata.webCommandMetadata.url
						})
					})
				}
				return resolve(links)
			} catch (err) {
				return resolve([])
			}
		})
	})
}
