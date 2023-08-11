({
	execYoutubeRoutine() {
		const { youtube } = this.page
		if (youtube) {
			if (youtube.config) {
				if (youtube.statistics.videoCount > 0) {
					const { id, config } = this.page.youtube
					return Promise.all([
						this.getYoutubeVideosByChannel(id, config ? config.limits.videos : 20),
						this.getYoutubePlaylistsBychannel(id, config ? config.limits.playlists : 30)
					])
				}
			}
		}
		return new Promise(resolve => resolve('ok'))
	},

	getYoutubeVideosByChannel(id, limit) {
		return new Promise(resolve => {
			this.$http.get(`/api/yt-videos-by-channel/${id}?limit=${limit}`).then(res => {
				const {
					page
				} = this
				page.videos = page.videos ? page.videos : []
				page.videos = res.data
				this.setPage(page)
				resolve(true)
			})
		})
	},

	getYoutubePlaylistsBychannel(id, limit) {
		return new Promise(resolve => {
			this.$http.get(`/api/yt-playlists-by-channel/${id}?limit=${limit}`).then(res => {
				const {
					page
				} = this
				page.playlists = page.playlists ? page.playlists : []
				page.playlists = res.data
				this.setPage(page)
				resolve(true)
			})
		})
	}
})
