({
  scrollPageTo: ({ commit }, payload) => {
    commit('scrollPageTo', payload)
  },

  setUserPages: ({ commit }, payload) => {
    commit('setUserPages', payload)
  },

  checkUser: ({ commit }, payload) => {
    commit('checkUser', payload)
  },

  setTab: ({ commit }, payload) => {
    commit('setTab', payload)
  },

  setScrollTop: ({ commit }, payload) => {
    commit('setScrollTop', payload)
  },

  setUserMenu: ({ commit }, payload) => {
    commit('setUserMenu', payload)
  },

  setWindowWidth: ({ commit }, payload) => {
    commit('setWindowWidth', payload)
  },

  login:({ commit }, payload) => {
    commit('login', payload)
  },

  logout: ({ commit }, payload) => {
    commit('logout', payload)
  },

  toggleSideBar: ({ commit }, payload) => {
    commit('toggleSideBar', payload)
  },

  showDialog: ({ commit }, payload) => {
    commit('showDialog', payload)
  },

  goTo: ({ commit }, payload) => {
    commit('goTo', payload)
  },

  setUser: ({ commit }, payload) => {
    commit('setUser', payload)
  }
})
