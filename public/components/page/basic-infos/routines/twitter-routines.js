({
	twitterRoutine(twitter) {
		if (!twitter.config) {
			twitter.config = { selectedConfigs: [] }
		}
		this.setPageEntry({
			entry: "twitter",
			data: twitter
		})
		return Promise.all([
			this.usingTwitterAvatar(twitter),
			this.usingTwitterCover(twitter),
			this.usingTwitterWidget(twitter)
		])
	},

	getTwitterPageInfo(value) {
		const vm = this
		return new Promise(resolve => {
			vm.$http
				.post("/api/twitter", {
					url: value.url
				})
				.then(response => {
					if (!response.data.error) {
						resolve({
							key: "twitter",
							value: {
								...value,
								...response.data
							}
						})
					} else {
						vm.showDialog({
							message: `Link do Twitter inválido`,
							color: "warning",
							icon: "info"
						})
						resolve({
							key: "twitter",
							value: value,
							fail: true
						})
						vm.$emit("back-to-link")
					}
				})
		})
	},

	usingTwitterWidget (twitter) {
		const vm = this
		return new Promise(resolve => {
			twitter.config.selectedConfigs.map(config => {
				if (config.type === 'url') {
					twitter.embbed = true
					vm.setPageEntry({
						entry: "twitter",
						data: twitter
					})
				}
			})
			resolve()
		})
	},

	usingTwitterAvatar(twitter) {
		const vm = this
		const { images } = vm.page.configs
		return new Promise(resolve => {
			if (
				twitter.config.selectedConfigs.some(
					config => config.type === "avatar"
				) && images.avatar === 'Twitter'
			) {
				vm.$http
					.get(twitter.avatar, {
						responseType: "blob"
					})
					.then(res => {
						res.blob().then(blob => {
							var reader = new FileReader()
							reader.readAsDataURL(blob)
							new Promise((res, rej) => {
								reader.onloadend = function () {
									res(reader.result)
								}
							}).then(twitterAvatar => {
								vm.$http
									.get(vm.page.avatar, {
										responseType: "blob"
									})
									.then(res => {
										res.blob().then(blob => {
											var reader2 = new FileReader()
											reader2.readAsDataURL(blob)
											new Promise((res, rej) => {
												reader2.onloadend = function () {
													res(reader2.result)
												}
											}).then(async pageAvatar => {
												if (twitterAvatar !== pageAvatar) {
													await vm.page.changes.push({
														type: await "avatar"
													})
												}
												await vm.setMiniAvatar(twitterAvatar)
												await vm.setPageEntry({
													entry: "avatar",
													data: await vm.convertImage(twitterAvatar)
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

	usingTwitterCover(twitter) {
		const vm = this
		const { images } = vm.page.configs
		return new Promise(resolve => {
			if (
				twitter.config.selectedConfigs.some(
					config => config.type === "cover"
				) && images.cover === 'Twitter'
			) {
				vm.$http
					.get(twitter.cover, {
						responseType: "blob"
					})
					.then(res => {
						res.blob().then(blob => {
							var reader = new FileReader()
							reader.readAsDataURL(blob)
							new Promise((res, rej) => {
								reader.onloadend = function () {
									res(reader.result)
								}
							}).then(ytCover => {
								vm.$http
									.get(vm.page.cover, {
										responseType: "blob"
									})
									.then(res => {
										res.blob().then(blob => {
											var reader2 = new FileReader()
											reader2.readAsDataURL(blob)
											new Promise((res, rej) => {
												reader2.onloadend = function () {
													res(reader2.result)
												}
											}).then(async pageCover => {
												if (ytCover !== pageCover)
													await vm.page.changes.push({
														type: await "cover"
													})
												await vm.setPageEntry({
													entry: await "cover",
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
	}
})
