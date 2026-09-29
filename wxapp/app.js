const { CITIES, SCENES, GRADS, ACTS, I18N } = require('./utils/data.js')
const auth = require('./utils/auth.js')
const cfg = require('./config.js')

App({
  globalData: {
    lang: 'zh',
    city: 'shanghai',
    acts: [],          // 运行时活动（含用户发布）
    tickets: [],       // {actIdx, type, no, used}
    tixSeq: 2026,
    pubCount: 0,
    user: null,        // 登录态 {openid, demo}
    privacyNeed: false,   // 是否需要弹隐私授权
    privacyResolve: null,  // 微信隐私授权回调
    pendingLogin: false    // 看完协议返回后是否自动续跑登录
  },
  onLaunch() {
    // —— 云开发初始化（AI / 登录 / 内容安全全走云函数） ——
    if (cfg.USE_CLOUD && wx.cloud) {
      wx.cloud.init(cfg.CLOUD_ENV ? { env: cfg.CLOUD_ENV, traceUser: true } : { traceUser: true })
      console.log('[cloud] init OK', cfg.CLOUD_ENV || '(default env)')
    }

    const s = wx.getStorageSync('larky') || {}
    this.globalData.lang = s.lang || 'zh'
    this.globalData.city = s.city || 'shanghai'
    this.globalData.tickets = s.tickets || []
    this.globalData.tixSeq = s.tixSeq || 2026
    this.globalData.pubCount = s.pubCount || 0
    // 恢复用户发布的活动（追加在预置数据之后）
    this.globalData.acts = ACTS.concat(s.myActs || [])

    // —— 登录态恢复 ——
    if (auth.isLogged()) this.globalData.user = wx.getStorageSync('larky_user')

    // —— 微信隐私授权（2023 基础库规范）——
    this.setupPrivacy()
  },
  // 注册隐私授权监听：任何隐私接口被调用时，微信会回调此函数，
  // 由首页弹出自定义协议弹窗（与 Neo-Pop UI 统一）
  setupPrivacy() {
    if (!wx.onNeedPrivacyAuthorization) return
    wx.onNeedPrivacyAuthorization((resolve) => {
      this.globalData.privacyNeed = true
      this.globalData.privacyResolve = resolve
      // 通知当前页面（首页/我的页已监听 onShow）；若不在这些页，先回首页
      const pages = getCurrentPages()
      const cur = pages[pages.length - 1]
      if (cur && (cur.route.includes('pages/index') || cur.route.includes('pages/me'))) {
        cur.setData({ privacyNeed: true })
      } else {
        wx.reLaunch({ url: '/pages/index/index?privacy=1' })
      }
    })
  },
  // 用户点击"同意"（协议弹窗按钮）
  agreePrivacy() {
    this.globalData.privacyNeed = false
    const r = this.globalData.privacyResolve
    if (r) { r({ buttonId: 'agree-btn', event: 'agree' }); this.globalData.privacyResolve = null }
  },
  // 用户点击"拒绝"
  refusePrivacy() {
    this.globalData.privacyNeed = false
    const r = this.globalData.privacyResolve
    if (r) { r({ event: 'disagree' }); this.globalData.privacyResolve = null }
    wx.showToast({ title: '需同意隐私政策才能使用', icon: 'none' })
  },
  save() {
    const g = this.globalData
    const myActs = g.acts.slice(ACTS.length)
    wx.setStorageSync('larky', {
      lang: g.lang, city: g.city, tickets: g.tickets,
      tixSeq: g.tixSeq, myActs, pubCount: g.pubCount
    })
  },
  // —— 全局工具 ——
  T() { return I18N[this.globalData.lang] },
  cityOf(id) { return CITIES.find(c => c.id === id) },
  sceneOf(id) { return SCENES.find(s => s.id === id) },
  GRADS, CITIES, SCENES,
  toggleLang() {
    this.globalData.lang = this.globalData.lang === 'zh' ? 'en' : 'zh'
    this.save()
  },
  pickCity(id) {
    this.globalData.city = id
    this.save()
  },
  addAct(d) {
    this.globalData.acts.push(d)
    this.globalData.pubCount++
    this.save()
  },
  buyTicket(idx, type) {
    const g = this.globalData
    const i = g.tickets.findIndex(t => t.actIdx === idx)
    if (i > -1) { g.tickets.splice(i, 1); this.save(); return 'cancel' }
    g.tickets.push({ actIdx: idx, type, no: g.tixSeq++, used: false })
    this.save()
    return 'buy'
  },
  actAt(i) { return this.globalData.acts[i] }
})
