({
	youtubeRoutine(youtube) {
		this.setPageEntry({
			entry: 'youtube',
			data: youtube
		})
		if (!youtube.config) youtube.config = {
			limits: {
				videos: 20,
				playlists: 30
			},
			selectedConfigs: []
		}
		return Promise.all([
			this.getChannelVideos(youtube.id, youtube.config.limits.videos),
			this.getChannnelPlaylists(youtube.id, youtube.config.limits.playlists),
			this.setFeaturedChannels(youtube.config.selectedConfigs, youtube),
			this.usingYoutubeAvatar(youtube), this.usingYoutubeCover(youtube)
		])
	},

	getYoutubeChannel(value) {
		const vm = this
		return new Promise(resolve => {
			var channelId, type
			if (value.url.includes('user')) {
				type = 'username'
				channelId = value.url.split('user')[1].split('/').join('')
			} else if (value.url.includes('channel')) {
				type = 'id'
				channelId = value.url.split('channel')[1].split('/').join('')
			}
			if (channelId && type) {
				vm.$http.get(`/api/yt-channel-by-${type}/${channelId}`).then(res => {
					resolve({
						key: 'youtube',
						value: { ...value,
							...res.data
						}
					})
				})
			} else {
				vm.showDialog({
					message: `Link do Youtube inválido`,
					color: 'orange',
					icon: 'info'
				})
				resolve({
					key: 'youtube',
					value: value,
					fail: true
				})
				vm.$emit('back-to-link')
			}
		})
	},

	setFeaturedChannels(list, youtube) {
		const vm = this
		vm.setPageEntry({
			entry: 'channels',
			data: []
		})
		const types = list.map(type => type.type)
		return new Promise(resolve => {
			var channels = []
			if (youtube.featuredChannelsUrls) {
				channels = youtube.featuredChannelsUrls.filter(channel => {
					return types.includes(channel.channelId)
				})
			}
			vm.setPageEntry({
				entry: 'channels',
				data: channels
			})
			resolve()
		})
	},

	getChannelVideos(id, limit) {
		const vm = this
		const {
			page
		} = vm
		page.videos = []
		vm.setPageEntry({
			entry: 'videos',
			data: page.videos
		})
		return new Promise(resolve => {
			vm.$http.get(`/api/yt-videos-by-channel/${id}?limit=${limit}`).then(res => {
				if (page.youtube.config.limits.videos !== limit) {
					const {
						changes
					} = page
					changes.push({
						type: 'youtube-videos-limit'
					})
					vm.setPageEntry({
						entry: 'changes',
						data: changes
					})
				}
				if (res.data) {
					vm.setPageEntry({
						entry: 'videos',
						data: res.data
					})
				}
				resolve()
			})
		})
	},

	getChannnelPlaylists(id, limit) {
		const vm = this
		const {
			page
		} = vm
		page.playlists = []
		vm.setPageEntry({
			entry: 'playlists',
			data: page.playlists
		})
		return new Promise(resolve => {
			vm.$http.get(`/api/yt-playlists-by-channel/${id}?limit=${limit}`).then(res => {
				if (page.youtube.config.limits.playlists !== limit) {
					const {
						changes
					} = page
					changes.push({
						type: 'youtube-playlists-limit'
					})
					vm.setPageEntry({
						entry: 'changes',
						data: changes
					})
				}
				if (res.data) {
					vm.setPageEntry({
						entry: 'playlists',
						data: res.data
					})
					resolve()
				} else {
					resolve()
				}
			})
		})
	},

	usingYoutubeAvatar(youtube) {
		const vm = this
		const {
			images
		} = vm.page.configs
		return new Promise(resolve => {
			if (youtube.config.selectedConfigs.some(config => config.type === 'avatar') && images.avatar === 'Youtube') {
				vm.$http.get(youtube.avatar, {
					responseType: 'blob'
				}).then(res => {
					res.blob().then(blob => {
						var reader = new FileReader()
						reader.readAsDataURL(blob)
						new Promise((res, rej) => {
							reader.onloadend = function () {
								res(reader.result)
							}
						}).then(ytAvatar => {
							vm.$http.get(vm.page.avatar, {
								responseType: 'blob'
							}).then(res => {
								res.blob().then(blob => {
									var reader2 = new FileReader()
									reader2.readAsDataURL(blob)
									new Promise((res, rej) => {
										reader2.onloadend = function () {
											res(reader2.result)
										}
									}).then(async pageAvatar => {
										if (ytAvatar !== pageAvatar) await vm.page.changes.push({
											type: 'avatar'
										})
										await vm.setMiniAvatar(ytAvatar)
										await vm.setPageEntry({
											entry: await 'avatar',
											data: await vm.convertImage(ytAvatar)
										})
										await resolve()
									})
								})
							})
						})
					})
				})
			} else {
				resolve()
			}
		})
	},

	convertImage (base64) {
		return new Promise(resolve => {
			const img = new Image(),
			canvas = document.createElement('canvas'),
			ctx = canvas.getContext('2d')
			img.src = base64
			img.onload = function (event) {
				canvas.width = event.target.width
				canvas.height = event.target.height
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
				resolve(canvas.toDataURL('image/jpeg', 0.3))
			}
		})
	},

	usingYoutubeCover(youtube) {
		const vm = this
		const {
			images
		} = vm.page.configs
		return new Promise(resolve => {
			if (youtube.config.selectedConfigs.some(config => config.type === 'cover') && images.cover === 'Youtube') {
				vm.$http.get(youtube.cover, {
					responseType: 'blob'
				}).then(res => {
					res.blob().then(blob => {
						var reader = new FileReader()
						reader.readAsDataURL(blob)
						new Promise((res, rej) => {
							reader.onloadend = function () {
								res(reader.result)
							}
						}).then(ytCover => {
							vm.$http.get(vm.page.cover, {
								responseType: 'blob'
							}).then(res => {
								res.blob().then(blob => {
									var reader2 = new FileReader()
									reader2.readAsDataURL(blob)
									new Promise((res, rej) => {
										reader2.onloadend = function () {
											res(reader2.result)
										}
									}).then(async pageCover => {
										if (ytCover !== pageCover) await vm.page.changes.push({
											type: await 'cover'
										})
										await vm.setPageEntry({
											entry: await 'cover',
											data: await vm.convertImage(ytCover)
										})
										await resolve()
									})
								})
							})
						})
					})
				})
			} else {
				resolve()
			}
		})
	},
})
