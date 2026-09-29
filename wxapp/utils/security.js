// =====================================================
//  LarkyGO 内容安全模块
//  云开发模式（生产）：云函数 cloud.openapi 云调用
//            msgSecCheck(文本) / imgSecCheck(图片)，免 access_token
//  演示降级：无云端时本地敏感词过滤
// =====================================================
const cfg = require('../config.js')

// 本地兜底敏感词（演示用小词库，生产以微信 API 为准）
const BLOCK = ['赌场', '博彩', '色情', '毒品', '枪支', '代开发票', '洗钱', '传销', '反动', '法轮']

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

/**
 * 检查文本（聊天输入 / 发布活动标题等）
 * @returns {Promise<{pass:boolean, reason?:String}>}
 */
async function checkText(text) {
  const t = (text || '').trim()
  if (!t) return { pass: true }

  // 云开发模式：微信官方内容安全
  if (cfg.USE_CLOUD && wx.cloud) {
    try {
      const u = wx.getStorageSync('larky_user') || {}
      const d = await callCloud({ action: 'text', text: t, openid: u.openid || '' })
      return { pass: !!d.pass, reason: d.reason }
    } catch (e) {
      console.warn('[sec] cloud fail → local', e.message)
    }
  } else if (cfg.CLOUD_SEC_URL) {
    // 旧 HTTP 模式
    return new Promise((resolve) => {
      wx.request({
        url: cfg.CLOUD_SEC_URL,
        method: 'POST',
        timeout: 8000,
        data: { type: 'text', text: t },
        success: (r) => { resolve(r.statusCode === 200 && r.data ? { pass: !!r.data.pass, reason: r.data.reason } : { pass: true }) },
        fail: () => resolve({ pass: true })
      })
    })
  }

  // 本地兜底
  const hit = BLOCK.find(w => t.includes(w))
  return hit ? { pass: false, reason: '内容包含违禁词「' + hit + '」' } : { pass: true }
}

/**
 * 检查图片（识图上传的海报等）
 * 云开发模式：图片先传云存储 → 云函数 imgSecCheck
 * @param {String} filePath 本地图片路径
 * @returns {Promise<{pass:boolean, reason?:String}>}
 */
async function checkImage(filePath) {
  if (!filePath) return { pass: true }

  if (cfg.USE_CLOUD && wx.cloud) {
    try {
      const up = await new Promise((resolve, reject) =>
        wx.cloud.uploadFile({
          cloudPath: 'sec/' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.jpg',
          filePath,
          success: r => resolve(r.fileID),
          fail: e => reject(new Error(e.errMsg))
        }))
      const d = await callCloud({ action: 'image', fileID: up })
      return { pass: !!d.pass, reason: d.reason }
    } catch (e) {
      console.warn('[sec] image cloud fail → pass', e.message)
      return { pass: true }
    }
  }

  if (cfg.CLOUD_SEC_URL) {
    return new Promise((resolve) => {
      wx.uploadFile({
        url: cfg.CLOUD_SEC_URL + '?type=image',
        filePath,
        name: 'image',
        timeout: 10000,
        success: (r) => {
          try {
            const d = JSON.parse(r.data)
            resolve({ pass: !!d.pass, reason: d.reason })
          } catch (e) { resolve({ pass: true }) }
        },
        fail: () => resolve({ pass: true })
      })
    })
  }

  // 演示模式：直接放行
  return { pass: true, demo: true }
}

module.exports = { checkText, checkImage }
