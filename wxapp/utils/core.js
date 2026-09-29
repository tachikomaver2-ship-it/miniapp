// 通用：i18n 帮助 + 活动视图模型 + 日期格式化
const app = () => getApp()

function T() { return app().T() }

// 活动日期：d = 距今天数偏移
function actDate(a, base) {
  const d = new Date((base || T0).getTime() + a.d * 86400000)
  return d
}
const T0 = new Date()
const WD = { zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }

function fmtDate(a) {
  const d = actDate(a)
  const lang = app().globalData.lang
  const t = T()
  const dd = `${d.getMonth() + 1}.${d.getDate()}`
  return lang === 'zh' ? `${dd} ${WD.zh[d.getDay()]} ${a.hm}` : `${WD.en[d.getDay()]} ${dd} · ${a.hm}`
}

// 活动视图模型（渲染用，双向字段已展开）
function actVM(a, idx) {
  const lang = app().globalData.lang
  const L = a[lang]
  return {
    idx,
    title: L.t, venue: L.venue, host: L.host, tag: L.tag,
    emoji: a.emoji, grad: a.grad, cat: a.cat, sub: a.sub,
    price: a.price, going: a.going, spots: a.spots, d: a.d, hm: a.hm,
    dateText: fmtDate(a),
    chip: app().sceneOf(a.cat) ? app().sceneOf(a.cat).chip : '#FFC531'
  }
}

module.exports = { T, actVM, fmtDate, actDate, T0, WD }
