({
	setStep: (state, payload) => {
		state.step = payload
	},

	setValidStep: (state, payload) => {
		state.validStep = payload
	},

	setPageInfos: (state, payload) => {
		Object.entries(payload).map(([key, value]) => {
			if (key !== '_id' && key !== 'ref' && key !== 'title' && key !== 'subtitle' && key !== 'status' && key !== 'user' && key !== 'cover' && key !== 'avatar' && key !== 'editRef' && key !== 'miniavatar' && key !== 'id' && key !== 'changes' && key !== 'order' && key !== 'editDate' && key !== 'feedbackDate') {
				if (!payload.order.includes(key)) {
					if (key === 'wiki') {
						payload.order.unshift(key)
					} else {
						payload.order.push(key)
					}
				}
			}
		})
		state.pageInfos = payload
	}
})