const { T, actVM } = require('../../utils/core.js')
const app = getApp()

Page({
  data: { t: {}, lang: 'zh', list: [] },
  onShow() { this.build() },
  build() {
    const g = app.globalData, t = T()
    const list = g.tickets.map(tk => {
      const a = g.acts[tk.actIdx]
      const vm = a ? actVM(a, tk.actIdx) : null
      return {
        no: tk.no, type: t.tixTypes[tk.type], used: tk.used,
        title: vm ? vm.title : '-', venue: vm ? vm.venue : '-',
        dateText: vm ? vm.dateText : '-', grad: vm ? vm.grad : '#ccc',
        emoji: vm ? vm.emoji : '🎫'
      }
    }).reverse()
    this.setData({ t, lang: g.lang, list })
  },
  use(e) {
    const g = app.globalData
    const no = +e.currentTarget.dataset.no
    const tk = g.tickets.find(x => x.no === no)
    if (!tk) return
    tk.used = !tk.used
    app.save()
    this.build()
    wx.showToast({ title: tk.used ? '✅ ' + T().tixStatus.used : T().tixStatus.valid, icon: 'none' })
  }
})
