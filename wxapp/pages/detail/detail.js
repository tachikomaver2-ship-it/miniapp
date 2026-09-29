const { T, actVM } = require('../../utils/core.js')
const pay = require('../../utils/pay.js')
const auth = require('../../utils/auth.js')
const app = getApp()

Page({
  data: { t: {}, lang: 'zh', vm: null, lineup: [], tix: [], tixSel: 'pre', has: false, curPrice: 0, paying: false },
  onLoad(q) { this.idx = +q.idx; this.tixSel = 'pre'; this.build() },
  onShow() { this.build() },
  build() {
    const g = app.globalData, t = T()
    const a = g.acts[this.idx]
    if (!a) { wx.navigateBack(); return }
    const vm = actVM(a, this.idx)
    const early = a.price - 30, door = a.price + 50
    const tix = [
      { k: 'early', name: t.tixTypes.early, desc: t.tixDesc.early, price: early },
      { k: 'pre', name: t.tixTypes.pre, desc: t.tixDesc.pre, price: a.price, was: early },
      { k: 'door', name: t.tixTypes.door, desc: t.tixDesc.door, price: door }
    ]
    const has = g.tickets.some(tk => tk.actIdx === this.idx)
    this.setData({
      t, lang: g.lang, vm, lineup: a.lineup, tix, has,
      tixSel: this.tixSel,
      curPrice: this.tixSel === 'early' ? early : this.tixSel === 'pre' ? a.price : door
    })
  },
  selTix(e) { this.tixSel = e.currentTarget.dataset.k; this.build() },
  // —— 购票（微信支付链路）——
  async buy() {
    if (this.data.paying) return
    const t = T()
    // 已有票 → 退票（本地记录）
    if (this.data.has) {
      app.buyTicket(this.idx, this.tixSel)
      wx.showToast({ title: t.cancelOk, icon: 'none' })
      this.build(); return
    }
    // 1. 确保登录态（购票需身份）
    const u = await auth.ensureLogin()
    app.globalData.user = u
    // 2. 拉起支付
    this.setData({ paying: true })
    const price = this.data.curPrice
    const r = await pay.requestPay(app.actAt(this.idx), this.tixSel, price, u.openid)
    this.setData({ paying: false })
    if (!r.ok) {
      if (r.err !== 'cancel') wx.showToast({ title: r.err, icon: 'none' })
      return
    }
    // 3. 出票（生产：由支付回调通知服务端出票；此处本地记录演示票）
    app.buyTicket(this.idx, this.tixSel)
    wx.showToast({ title: (r.demo ? '🎭 ' : '🎉 ') + t.buyOk, icon: 'none' })
    this.build()
  },
  share() { wx.showToast({ title: t_share(), icon: 'none' }) },
  joinGroup() { wx.showToast({ title: t_join(), icon: 'none' }) },
  back() { wx.navigateBack() }
})
function t_share() { return T().shareOk }
function t_join() { return T().joinOk }
