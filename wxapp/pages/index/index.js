const { T, actVM } = require('../../utils/core.js')
const app = getApp()

Page({
  data: {
    t: {}, lang: 'zh',
    cityLabel: '', tickerText: '',
    scenes: [], hero: null, statCount: 0,
    rail: [], rows: [],
    citySheet: false, cityGrid: [],
    privacyNeed: false
  },
  onLoad(opts) { this.build(); if (opts && opts.privacy) this.setData({ privacyNeed: true }) },
  onShow() { this.build(); if (app.globalData.privacyNeed) this.setData({ privacyNeed: true }) },
  // —— 隐私授权弹窗 ——
  openAgreement() { wx.navigateTo({ url: '/pages/agreement/agreement' }) },
  agreePrivacy() {
    this.setData({ privacyNeed: false })
    app.agreePrivacy()
  },
  refusePrivacy() {
    this.setData({ privacyNeed: false })
    app.refusePrivacy()
  },
  build() {
    const g = app.globalData, t = T()
    const zh = g.lang === 'zh'
    const list = g.acts.map((a, i) => actVM(a, i)).filter(a => true)
    const inCity = list.filter(a => { const raw = g.acts[a.idx]; return raw.city === g.city })
    const sorted = inCity.slice().sort((x, y) => x.d - y.d)
    const hero = sorted.find(a => g.acts[a.idx].hot) || sorted[0] || null
    const scenes = [{ id: 'all', emoji: '✦', name: t.all }].concat(
      app.SCENES.map(s => ({ id: s.id, emoji: s.emoji, name: t.sceneShort[s.id] }))
    )
    const c = app.cityOf(g.city)
    const cityLabel = zh ? `${c.zh} ${c.py}` : `${c.en} ${c.py}`
    const tickerText = sorted.slice(0, 5).map(a => `${a.tag} · ${a.title} · ¥${a.price}`).join('  ✦  ')
    this.setData({
      t, lang: g.lang, cityLabel,
      tickerText: 'NOW ON SALE ✦ ' + (tickerText || 'LarkyGO') + '  ✦  ',
      scenes, hero,
      statCount: inCity.length,
      rail: sorted.slice(0, 8),
      rows: sorted.slice(0, 20),
      cityGrid: app.CITIES.map(x => ({
        id: x.id, on: x.id === g.city,
        zh: x.zh, en: x.en, py: x.py, label: zh ? x.zh : x.en
      }))
    })
    wx.setNavigationBarTitle && wx.setNavigationBarTitle({ title: 'LarkyGO' })
  },
  toggleLang() { app.toggleLang(); this.build() },
  openCity() { this.setData({ citySheet: true }) },
  closeCity() { this.setData({ citySheet: false }) },
  pickCity(e) {
    app.pickCity(e.currentTarget.dataset.id)
    this.setData({ citySheet: false })
    this.build()
  },
  searchTap() { wx.showToast({ title: T().tSearch, icon: 'none' }) },
  goScene(e) {
    const s = e.currentTarget.dataset.scene
    wx.navigateTo({ url: `/pages/list/list?scene=${s}` })
  },
  openDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?idx=${e.currentTarget.dataset.idx}` })
  },
  goTab(e) {
    const p = e.currentTarget.dataset.page
    wx.switchTab({ url: `/pages/${p}/${p}` })
  },
  noop() {}
})
