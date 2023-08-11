({
	setPage: (state, payload) => {
		Object.entries(payload).map(([key, value]) => {
			if (key !== 'local' && key !== 'temp' && key !== '_id' && key !== 'ref' && key !== 'title' && key !== 'subtitle' && key !== 'status' && key !== 'user' && key !== 'cover' && key !== 'avatar' && key !== 'editRef' && key !== 'miniavatar' && key !== 'id' && key !== 'changes' && key !== 'order' && key !== 'editDate' && key !== 'feedbackDate') {
				if (!payload.order.includes(key)) {
					if (key === 'wiki') {
						payload.order.unshift(key)
					} else {
						payload.order.push(key)
					}
				}
			}
		})
		if (state.editMode) localStorage.setItem('page-' + payload.ref, JSON.stringify(payload))
		state.page = payload
	},

	setPageEntry: (state, payload) => {
		const {
			page
		} = state
		page[payload.entry] = payload.data
		if (state.editMode) localStorage.setItem('page-' + page.ref, JSON.stringify(page))
		state.page = page
	},

	toggleModal: (state, payload) => {
		state.modal = payload
	},

	setEditMode: (state, payload) => {
		state.editMode = payload
	},

	setAdding: (state, payload) => {
		state.adding = payload
	},

	setEditingType: (state, payload) => {
		state.editingType = payload
	},

	setButtonState: (state, payload) => {
		state.buttonState = payload
	},

	removeType: (state, payload) => {
		if (confirm('Deseja mesmo remover este box?')) {
			state.page[payload] = ''
			delete state.page[payload]
			if (!state.page.changes) state.page.changes = []
			state.page.changes.push({
				type: 'remove-box-' + payload
			})
			state.page.order = state.page.order.filter(item => {
				return item !== payload
			})
		}
	},

	setMovieDetails: (state, payload) => {
		state.movieDetails = payload
	},

	setMovieModal: (state, payload) => {
		state.movieModal = payload
	},

	setSeasonDetails: (state, payload) => {
		state.seasonDetails = payload
	},

	setSeasonModal: (state, payload) => {
		state.seasonModal = payload
	},

	setBookDetails: (state, payload) => {
		state.bookDetails = payload
	},

	setBookModal: (state, payload) => {
		state.bookModal = payload
	},

	setBookDetails: (state, payload) => {
		state.bookDetails = payload
	},

	setPageLoading: (state, payload) => {
		state.pageLoading = payload
	}
})
