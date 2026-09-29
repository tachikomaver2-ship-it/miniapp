// =====================================================
//  LarkyGO 登录模块
//  云开发模式（生产）：wx.cloud.callFunction('login')
//            云函数 cloud.getWXContext() 直接拿 openid，免 code2session
//  演示降级：无云端时本地生成 guest 身份（调试用）
// =====================================================
const cfg = require('../config.js')

// 云函数调用封装
function callCloud(data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'larky-server',
      data,
      success: r => (r.result && r.result.err) ? reject(new Error(r.result.err)) : resolve(r.result),
      fail: e => reject(new Error(e.errMsg))
    })
  })
}

// 获取登录态（含 openid）。已登录直接返回缓存。
function ensureLogin() {
  return new Promise((resolve) => {
    const cached = wx.getStorageSync('larky_user')
    if (cached && cached.openid && !cached.demo) { resolve(cached); return }

    // 云开发模式：免 code，云端直接拿 openid
    if (cfg.USE_CLOUD && wx.cloud) {
      callCloud({ action: 'login' })
        .then(d => {
          if (d && d.openid) {
            const u = { openid: d.openid, unionid: d.unionid || '', demo: false }
            wx.setStorageSync('larky_user', u)
            resolve(u)
          } else resolve(demoLogin())
        })
        .catch(() => resolve(demoLogin()))
      return
    }

    wx.login({
      success: (res) => {
        if (!res.code || !cfg.CLOUD_LOGIN_URL) { resolve(demoLogin(res.code)); return }
        wx.request({
          url: cfg.CLOUD_LOGIN_URL,
          method: 'POST',
          data: { code: res.code },
          timeout: 8000,
          success: (r) => {
            if (r.statusCode === 200 && r.data && r.data.openid) {
              const u = { openid: r.data.openid, session: r.data.session_key || '', demo: false }
              wx.setStorageSync('larky_user', u)
              resolve(u)
            } else resolve(demoLogin(res.code))
          },
          fail: () => resolve(demoLogin(res.code))
        })
      },
      fail: () => resolve(demoLogin())
    })
  })
}

// 演示登录：本地伪 openid（调试期间保证链路可跑通）
function demoLogin(code) {
  let u = wx.getStorageSync('larky_user_demo')
  if (!u) {
    u = { openid: 'demo_' + Math.random().toString(36).slice(2, 12), demo: true }
    wx.setStorageSync('larky_user_demo', u)
  }
  if (code) u.lastCode = code
  wx.setStorageSync('larky_user', u)
  return u
}

// 是否已登录
function isLogged() {
  const u = wx.getStorageSync('larky_user')
  return !!(u && u.openid)
}

// 退出登录（清登录态，保留业务数据）
function logout() {
  wx.removeStorageSync('larky_user')
}

module.exports = { ensureLogin, isLogged, logout }
