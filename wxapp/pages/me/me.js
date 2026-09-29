const { T } = require('../../utils/core.js')
const auth = require('../../utils/auth.js')
const app = getApp()

Page({
  data: {
    t: {}, lang: 'zh', meSub: '', stats: [], vibes: [], menu: [],
    logged: false, userName: '', loginBtn: '',
    privacyNeed: false    // 自定义隐私协议弹窗
  },
  onShow() {
    this.build()
    // 同步 app 的隐私授权需求（如 onNeedPrivacyAuthorization 触发）
    if (app.globalData.privacyNeed) this.setData({ privacyNeed: true })
    // 从 agreement 页面同意返回后，若有 pendingLogin 标记则自动继续登录
    if (app.globalData.pendingLogin) {
      app.globalData.pendingLogin = false
      this.continueLogin()
    }
  },
  build() {
    const g = app.globalData, t = T()
    const zh = g.lang === 'zh'
    const c = app.cityOf(g.city)
    const meSub = zh
      ? `📍 ${c.zh} · ${g.tickets.length + g.pubCount} 场活动记录`
      : `📍 ${c.en}, China · ${g.tickets.length + g.pubCount} events joined`
    this.setData({
      t, lang: g.lang, meSub,
      logged: auth.isLogged(),
      userName: g.user && !g.user.demo ? (zh ? '微信用户' : 'WeChatter') : 'Alex Chen',
      loginBtn: auth.isLogged() ? (zh ? '退出登录' : 'Log out') : (zh ? '微信一键登录' : 'Log in with WeChat'),
      stats: [
        { n: g.tickets.length, l: zh ? '已购票' : 'Tickets' },
        { n: g.pubCount, l: zh ? '已发布' : 'Hosted' },
        { n: 12, l: zh ? '城市' : 'Cities' }
      ],
      vibes: zh ? ['🛹 滑板', '🎧 Techno', '⛰️ 徒步', '🎤 开放麦', '🍜 吃货', '🎲 桌游'] : ['🛹 Skate', '🎧 Techno', '⛰️ Hiking', '🎤 Open Mic', '🍜 Foodie', '🎲 Board Games'],
      menu: t.meMenu.map(m => ({ icon: m[0], label: m[1], k: m[2], toast: t.meToast[m[2]] })).concat([
        { icon: '📄', label: zh ? '隐私政策与用户协议' : 'Privacy & Terms', k: 'agreement' }
      ])
    })
  },
  toggleLang() { app.toggleLang(); this.build() },
  menuTap(e) {
    const k = e.currentTarget.dataset.k
    if (k === 'agreement') { wx.navigateTo({ url: '/pages/agreement/agreement?from=login' }); return }
    wx.showToast({ title: e.currentTarget.dataset.toast, icon: 'none' })
  },

  // ====================================================
  //  登录 / 退出  流程：
  //   1. 点击登录 → 弹自定义隐私协议弹窗
  //   2. 用户点"同意并登录" → 标记已同意 → 调云函数登录
  //   3. 用户点"查看完整协议" → 跳 agreement 页面
  //   4. 用户点"不同意" → 关闭弹窗
  // ====================================================
  async loginTap() {
    if (auth.isLogged()) {
      // —— 退出 ——
      wx.showModal({
        title: this.data.lang === 'zh' ? '退出登录' : 'Log out',
        content: this.data.lang === 'zh' ? '票务与报名数据仍会保留在本机。' : 'Tickets & sign-ups stay on this device.',
        success: (r) => {
          if (r.confirm) { auth.logout(); app.globalData.user = null; this.build() }
        }
      })
      return
    }
    // —— 未登录：先弹自定义隐私协议弹窗 ——
    this.setData({ privacyNeed: true })
    app.globalData.privacyNeed = true
  },

  // 打开隐私协议完整页面（弹窗里的链接）
  openAgreement() {
    // 标记：等用户看完同意返回后，自动继续登录
    app.globalData.pendingLogin = true
    wx.navigateTo({ url: '/pages/agreement/agreement?from=login' })
  },

  // 弹窗里点"同意并登录" → 标记已同意 → 调登录
  async agreeAndLogin() {
    // 1. 标记已同意（app.js 会同步给微信 resolve）
    this.setData({ privacyNeed: false })
    if (app.globalData.privacyResolve) app.agreePrivacy()
    app.globalData.privacyNeed = false

    // 2. 记录到 storage（后续其他流程可复用）
    wx.setStorageSync('larky_privacy_agreed', { ts: Date.now(), v: 1 })

    // 3. 真正调登录
    this.continueLogin()
  },

  // 弹窗里点"不同意" / 点遮罩 → 关闭弹窗 + 通知微信拒绝
  refusePrivacy() {
    this.setData({ privacyNeed: false })
    if (app.globalData.privacyResolve) app.refusePrivacy()
    app.globalData.privacyNeed = false
  },

  // 真正执行登录（被 agreeAndLogin 或 onShow 自动续跑使用）
  async continueLogin() {
    wx.showLoading({ title: this.data.lang === 'zh' ? '登录中…' : 'Logging in…' })
    const u = await auth.ensureLogin()
    app.globalData.user = u
    wx.hideLoading()
    const zh = this.data.lang === 'zh'
    wx.showToast({
      title: zh ? (u.demo ? '✅ 已登录（演示身份）' : '✅ 登录成功') : (u.demo ? '✅ Logged in (demo)' : '✅ Logged in'),
      icon: 'none'
    })
    this.build()
  },

  // 兼容旧的回调名（app.js onNeedPrivacyAuthorization 触发时调用）
  agreePrivacy() { this.agreeAndLogin() },

  // WXML 占位（catch:tap 用）
  noop() {}
})