({
  scrollPageTo: (state, payload) => {
    if (typeof payload === 'object') {
      $('html, body').animate({
        scrollTop: $('#' + payload.el).offset().top - payload.offset
      }, 'slow')
    } else {
      $('html, body').animate({
        scrollTop: $('#' + payload).offset().top - 120
      }, 'slow')
    }
  },

  setUserPages: (state, payload) => {
    state.userPages = payload
  },

  checkUser: (state, http) => {
    http.get('/checkuser')
      .then((response) => {
        state.user = response.data
      }, (error) => {
        console.log(error)
        state.user = false
      })
  },

  setUserMenu: (state, payload) => {
    state.userMenu = payload
  },

  setWindowWidth: (state, payload) => {
    state.windowWidth = payload
  },

  login: (state, payload) => {
    const { form, http, setUserMenu } = payload
    http.post('/login', form)
      .then((res) => {
        const { data } = res
        if (data.error) {
          return state.snackbar.push({
            message: data.message,
            color: data.message !== 'Usuário Banido' ? 'warning' : 'danger',
            icon: 'warning',
            show: true
          })
        }
        if (location.pathname === '/') return location.reload()
        state.user = data
        setUserMenu(false)
        state.snackbar.push({
          message: 'Olá ' + data.name,
          color: 'green',
          icon: 'info',
          show: true
        })
      })
  },

  setTab: (state, payload) => {
    state.tab = payload
  },

  setScrollTop: (state, payload) => {
    state.scrollTop = payload
  },

  logout: (state, payload) => {
    const { http, setUserMenu } = payload
    http.get('/logout')
      .then((res) => {
        location.href = '/'
      })
  },

  toggleSideBar: (state, payload) => {
    state.sideBar = payload
  },

  showDialog: (state, payload) => {
    if (payload.remove === 'all') {
      state.snackbar = []
    } else if (payload.remove) {
      state.snackbar = state.snackbar.filter((s, i) => {
        return i !== 0
      })
    } else {
      state.snackbar.push({
        message: payload.message,
        color: payload.color,
        icon: payload.icon,
        timeout: payload.timeout,
        show: true
      })
    }
  },

  goTo: (state, payload) => {
    location.href = payload
  },

  setUser: (state, payload) => {
    if (payload.notifications) {
      if (payload.notifications.some(p => p.new)) {
        payload.pages = payload.pages.sort((a, b) => {
          let anotifys = payload.notifications.filter(n => n.pageId === a && n.new).length
          let bnotifys = payload.notifications.filter(n => n.pageId === b && n.new).length
          return bnotifys - anotifys
        })
      }
    }
    state.user = payload
  }
})
