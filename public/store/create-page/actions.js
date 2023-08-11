({
  setStep: ({ commit }, payload) => {
    commit('setStep', payload)
  },

	setValidStep: ({ commit }, payload) => {
    commit('setValidStep', payload)
	},

	setPageInfos: ({ commit }, payload) => {
    commit('setPageInfos', payload)
	}
})