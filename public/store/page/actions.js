({
  setPage: ({ commit }, payload) => {
    commit('setPage', payload)
  },

  setPageEntry: ({ commit }, payload) => {
    commit('setPageEntry', payload)
  },

  toggleModal: ({ commit }, payload) => {
    commit('toggleModal', payload)
  },

  setEditMode: ({ commit }, payload) => {
    commit('setEditMode', payload)
  },

  setAdding: ({ commit }, payload) => {
    commit('setAdding', payload)
  },

  setEditingType: ({ commit }, payload) => {
    commit('setEditingType', payload)
  },

  setButtonState: ({ commit }, payload) => {
    commit('setButtonState', payload)
  },

  removeType: ({ commit }, payload) => {
    commit('removeType', payload)
  },

  setMovieDetails: ({ commit }, payload) => {
    commit('setMovieDetails', payload)
  },

  setMovieModal: ({ commit }, payload) => {
    commit('setMovieModal', payload)
  },

  setSeasonDetails: ({ commit }, payload) => {
    commit('setSeasonDetails', payload)
  },

  setSeasonModal: ({ commit }, payload) => {
    commit('setSeasonModal', payload)
  },

  setBookDetails: ({ commit }, payload) => {
    commit('setBookDetails', payload)
  },

  setBookModal: ({ commit }, payload) => {
    commit('setBookModal', payload)
  },

  setMovingBox: ({ commit }, payload) => {
    commit('setMovingBox', payload)
  },

  setPageLoading: ({ commit }, payload) => {
    commit('setPageLoading', payload)
  }
})
