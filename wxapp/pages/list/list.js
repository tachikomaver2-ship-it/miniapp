const { T, actVM } = require('../../utils/core.js')
const app = getApp()

Page({
  data: { t: {}, lang: 'zh', title: '', chips: [], rows: [], scene: 'all', sub: 'all' },
  onLoad(q) {
    this.scene = q.scene || 'all'
    this.sub = 'all'
    this.build()
  },
  onShow() { this.build() },
  build() {
    const g = app.globalData, t = T()
    const scene = this.scene
    const sc = scene !== 'all' ? app.sceneOf(scene) : null
    let chips = [{ k: 'all', on: this.sub === 'all', label: t.all }]
    if (sc && sc.subs.length) chips = chips.concat(sc.subs.map(s => ({ k: s, on: this.sub === s, label: t.subs[s] })))
    const rows = g.acts
      .map((a, i) => actVM(a, i))
      .filter(vm => g.acts[vm.idx].city === g.city)
      .filter(vm => scene === 'all' || vm.cat === scene)
      .filter(vm => this.sub === 'all' || vm.sub === this.sub)
      .sort((x, y) => x.d - y.d)
    this.setData({
      t, lang: g.lang, scene, sub: this.sub,
      title: scene === 'all' ? t.listTitle : t.sceneName[scene],
      chips, rows
    })
  },
  pickSub(e) { this.sub = e.currentTarget.dataset.k; this.build() },
  openDetail(e) { wx.navigateTo({ url: `/pages/detail/detail?idx=${e.currentTarget.dataset.idx}` }) },
  back() { wx.navigateBack() }
})
