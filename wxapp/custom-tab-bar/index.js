Component({
  data: {
    active: 'pages/index/index',
    lang: 'zh',
    tabs: []
  },
  attached() { this.build() },
  pageLifetimes: { show() { this.build() } },
  methods: {
    build() {
      const app = getApp()
      const zh = app.globalData.lang === 'zh'
      const t = zh
        ? [{ id: 0, label: '发现', icon: '🧭' }, { id: 1, label: '日历', icon: '📅' }, { id: 2, label: 'AI', icon: '✦' }, { id: 3, label: '票夹', icon: '🎫' }, { id: 4, label: '我的', icon: '🐸' }]
        : [{ id: 0, label: 'Discover', icon: '🧭' }, { id: 1, label: 'Calendar', icon: '📅' }, { id: 2, label: 'AI', icon: '✦' }, { id: 3, label: 'Tickets', icon: '🎫' }, { id: 4, label: 'Me', icon: '🐸' }]
      const routes = ['pages/index/index', 'pages/calendar/calendar', 'pages/chat/chat', 'pages/tickets/tickets', 'pages/me/me']
      const pages = getCurrentPages()
      const cur = pages.length ? pages[pages.length - 1].route : routes[0]
      this.setData({ tabs: t.map((x, i) => ({ ...x, route: routes[i], on: cur === routes[i] })), active: cur, lang: app.globalData.lang })
    },
    go(e) {
      const r = e.currentTarget.dataset.route
      wx.switchTab({ url: '/' + r })
    }
  }
})
