const { T, actVM } = require('../../utils/core.js')
const app = getApp()

Page({
  data: { t: {}, lang: 'zh', days: [], today: [], selLabel: '' },
  onLoad() { this.sel = 0; this.build() },
  onShow() { this.build() },
  build() {
    const g = app.globalData, t = T()
    const zh = g.lang === 'zh'
    const base = new Date()
    const days = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(base.getTime() + i * 86400000)
      const acts = g.acts
        .map((a, idx) => actVM(a, idx))
        .filter(vm => g.acts[vm.idx].city === g.city && vm.d === i)
      days.push({
        i,
        on: this.sel === i,
        num: String(d.getDate()).padStart(2, '0'),
        wd: (zh ? '周' : '') + (zh ? t.weekday[d.getDay()].slice(1) : t.weekday[d.getDay()]),
        count: acts.length,
        acts
      })
    }
    this.setData({
      t, lang: g.lang, days,
      today: days[this.sel] ? days[this.sel].acts : [],
      selLabel: days[this.sel] ? (zh ? `${days[this.sel].num} 日` : `Day ${days[this.sel].num}`) : ''
    })
  },
  pickDay(e) { this.sel = +e.currentTarget.dataset.i; this.build() },
  openDetail(e) { wx.navigateTo({ url: `/pages/detail/detail?idx=${e.currentTarget.dataset.idx}` }) }
})
