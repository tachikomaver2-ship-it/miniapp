// =====================================================
//  LarkyGO 微信支付模块
//  生产链路：详情页选票 → 云函数统一下单（金额/订单号在服务端生成！）
//            → 返回 payParams → wx.requestPayment → 服务端回调验签 → 出票
//  演示降级：CLOUD_PAY_URL 未配置时，走本地模拟支付（保证调试可跑通）
//
//  ⚠️ 安全铁律：price/金额绝不能由前端传给后端下单——后端必须按
//     服务端票种价格表重新计算金额，否则可被改包低价购高价票。
// =====================================================
const { CLOUD_PAY_URL } = require('../config.js')

/**
 * 发起购票支付
 * @param {Object} act  活动对象（需含 id 或索引可查）
 * @param {String} tier 票种 'early'|'presale'|'door'
 * @param {Number} price 演示模式下使用的价格（生产以服务端为准）
 * @param {String} openid 用户 openid
 * @returns {Promise<{ok:boolean, demo?:boolean, order?:Object, err?:String}>}
 */
function requestPay(act, tier, price, openid) {
  return new Promise((resolve) => {
    if (!CLOUD_PAY_URL) {
      // 演示模式：弹确认后直接视为支付成功
      wx.showModal({
        title: '演示支付',
        content: '微信支付未接入（缺 CLOUD_PAY_URL）。\n将以 ¥' + price + ' 模拟支付成功。',
        confirmText: '模拟支付',
        cancelText: '取消',
        success: (r) => {
          if (r.confirm) resolve({ ok: true, demo: true })
          else resolve({ ok: false, err: 'cancel' })
        }
      })
      return
    }
    // 生产链路：云函数统一下单
    wx.request({
      url: CLOUD_PAY_URL,
      method: 'POST',
      timeout: 15000,
      data: {
        action: 'createOrder',
        openid,
        actId: act.id || act.zh?.t || String(act.zh?.t),
        tier
        // 注意：不传 price！服务端按票种价格表计算
      },
      success: (r) => {
        const p = r.data && r.data.payParams
        if (r.statusCode !== 200 || !p) { resolve({ ok: false, err: r.data && r.data.msg || '下单失败' }); return }
        wx.requestPayment({
          timeStamp: p.timeStamp,
          nonceStr: p.nonceStr,
          package: p.package,       // 'prepay_id=xxx'
          signType: p.signType || 'RSA',
          paySign: p.paySign,
          success: () => resolve({ ok: true, order: r.data.order }),
          fail: (e) => resolve({ ok: false, err: e.errMsg && e.errMsg.includes('cancel') ? 'cancel' : '支付失败' })
        })
      },
      fail: () => resolve({ ok: false, err: '网络异常，下单失败' })
    })
  })
}

module.exports = { requestPay }
