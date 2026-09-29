// 协议查看页：本地全文（不依赖外链）。H5 版部署后可将 PRIVACY_URL 配置进 config.js，
// 届时可在此页加"在线版本"入口。
const { T } = require('../../utils/core.js')

const DOCS = {
  zh: {
    title: '隐私政策与用户协议',
    tabs: ['隐私政策', '用户协议'],
    privacy: [
      { h: '1. 我们收集的信息', ps: [
        '微信登录凭据（openid）：用于识别您的账号、同步报名与票务记录。',
        '头像与昵称：仅当您主动选择/填写时收集，用于活动页展示。',
        '您主动发布的内容：活动名称、时间、地点、票价、海报图片等。',
        '设备与日志信息：为保障服务安全所必需的基础日志。',
        '我们不收集您的位置、通讯录及其他敏感个人信息。'
      ]},
      { h: '2. 信息的使用', ps: [
        '提供活动发现、报名、票务等核心功能；',
        '对您发布的内容进行安全审核（配合微信内容安全能力）；',
        '向您发送与所报名活动相关的提醒。'
      ]},
      { h: '3. 第三方服务', ps: [
        'AI 功能由第三方大模型服务（智谱 GLM）提供。使用 AI 对话/识图时，您输入的文本或图片将经我们的服务器转发处理。',
        '我们不会将您的微信身份信息提供给任何第三方。'
      ]},
      { h: '4. 存储与保护', ps: [
        '信息存储于中华人民共和国境内的服务器；',
        '采用加密传输（HTTPS）与访问控制；',
        '仅在服务必需期限内保留，注销后 30 日内删除或匿名化。'
      ]},
      { h: '5. 您的权利', ps: [
        '查询、更正、删除您的个人信息；',
        '撤回授权、注销账号：请通过【我的 → 帮助与客服】联系我们；',
        '注销后您的报名/票务数据将同步删除。'
      ]},
      { h: '6. 未成年人保护', ps: ['本小程序面向 18 周岁以上用户。未成年人请在监护人同意后使用。']},
      { h: '7. 联系我们', ps: ['运营者：沈奕辰（个人开发者） · 邮箱：ellacareer@outlook.com']}
    ],
    terms: [
      { h: '1. 协议范围', ps: ['本协议是您与 LarkyGO 运营者之间关于使用本服务的约定，使用即视为同意。']},
      { h: '2. 账号', ps: [
        '基于微信账号体系，需微信授权登录；',
        '您须为 18 周岁以上、具有完全民事行为能力的自然人；',
        '您对账号下的全部行为负责。'
      ]},
      { h: '3. 用户行为规范', ps: [
        '不得发布违反法律法规、危害国家安全与社会稳定的内容；',
        '不得发布色情、暴力、赌博、诈骗、歧视性内容；',
        '不得侵犯他人知识产权、肖像权、隐私权；',
        '不得发布虚假活动信息。违规者我们有权删除内容、限制或终止账号。'
      ]},
      { h: '4. 活动与票务', ps: [
        '活动由用户/主办方发布，我们提供信息展示与报名工具，不对活动真实性与安全性承担担保；',
        '参加线下活动请注意人身与财物安全；',
        '付费票务适用主办方公示的退改规则。'
      ]},
      { h: '5. 知识产权', ps: ['您发布的内容授予我们在本小程序内展示、传播所需的免费许可；LarkyGO 品牌、界面与代码归运营者所有。']},
      { h: '6. 免责声明', ps: ['本服务按"现状"提供。因网络、第三方服务或不可抗力导致的中断，我们不承担责任。']},
      { h: '7. 法律适用', ps: ['本协议适用中华人民共和国法律，争议协商不成提交运营者所在地有管辖权的法院。']}
    ]
  },
  en: {
    title: 'Privacy & Terms',
    tabs: ['Privacy Policy', 'Terms of Service'],
    privacy: [
      { h: '1. What We Collect', ps: [
        'WeChat login credential (openid) for account identification and ticket sync.',
        'Avatar & nickname, only when you actively choose/fill them.',
        'Event content you publish: title, time, venue, price, poster image.',
        'Basic device & log data for security.',
        'We do NOT collect your location, contacts, or sensitive personal info.'
      ]},
      { h: '2. How We Use It', ps: [
        'Provide event discovery, sign-up and ticketing features;',
        'Moderate published content (with WeChat content-safety APIs);',
        'Send reminders about events you joined.'
      ]},
      { h: '3. Third-Party Services', ps: [
        'AI features are powered by a third-party LLM (Zhipu GLM). Text/images you input to AI features are forwarded via our server.',
        'We never share your WeChat identity with third parties.'
      ]},
      { h: '4. Storage & Security', ps: [
        'Data is stored on servers within the PRC;',
        'Protected by HTTPS encryption and access control;',
        'Deleted or anonymized within 30 days after account cancellation.'
      ]},
      { h: '5. Your Rights', ps: [
        'Access, correct or delete your personal data;',
        'Withdraw consent or cancel your account via [Me → Help];',
        'Sign-up/ticket data is deleted upon cancellation.'
      ]},
      { h: '6. Minors', ps: ['This mini program is intended for users aged 18+.']},
      { h: '7. Contact', ps: ['Operator: Yichen Shen (individual developer) · Email: ellacareer@outlook.com']}
    ],
    terms: [
      { h: '1. Scope', ps: ['This agreement governs your use of LarkyGO. Usage constitutes acceptance.']},
      { h: '2. Account', ps: [
        'Based on WeChat accounts; authorization required;',
        'You must be 18+ with full civil capacity;',
        'You are responsible for all actions under your account.'
      ]},
      { h: '3. Code of Conduct', ps: [
        'No content violating laws or endangering national security;',
        'No pornography, violence, gambling, fraud or discrimination;',
        'No infringement of IP, portrait or privacy rights;',
        'No fake events. Violations may result in removal or account termination.'
      ]},
      { h: '4. Events & Tickets', ps: [
        'Events are published by users/organizers; we provide listing & sign-up tools only;',
        'Take care of your personal safety and belongings;',
        'Paid tickets follow the refund rules published by organizers.'
      ]},
      { h: '5. IP', ps: ['You grant us a free license to display your published content; LarkyGO branding, UI and code belong to the operator.']},
      { h: '6. Disclaimer', ps: ['Service is provided "as is". We are not liable for interruptions caused by networks, third parties or force majeure.']},
      { h: '7. Governing Law', ps: ['PRC law applies. Disputes shall be resolved by competent courts at the operator\'s location.']}
    ]
  }
}

Page({
  data: { lang: 'zh', doc: DOCS.zh, tab: 0, fromLogin: false },
  onLoad(opts = {}) {
    const lang = getApp().globalData.lang || 'zh'
    this.setData({
      lang,
      doc: DOCS[lang],
      fromLogin: opts.from === 'login'
    })
    // 从登录流程进来时，修改标题
    if (opts.from === 'login') {
      wx.setNavigationBarTitle({ title: lang === 'zh' ? '阅读协议后继续' : 'Please agree' })
    }
  },
  switchTab(e) {
    this.setData({ tab: Number(e.currentTarget.dataset.i) })
  },
  // 从登录流程进来：用户读完点"同意并继续" → 标记已同意 → 返回上一页
  agreeAndBack() {
    wx.setStorageSync('larky_privacy_agreed', { ts: Date.now(), v: 1 })
    // 同步给 app 的 resolve（如果在监听中）
    const app = getApp()
    if (app.globalData.privacyResolve) app.agreePrivacy()
    app.globalData.privacyNeed = false

    const lang = this.data.lang
    wx.showToast({
      title: lang === 'zh' ? '✅ 已同意，返回登录' : '✅ Accepted',
      icon: 'none', duration: 800
    })
    setTimeout(() => wx.navigateBack({ delta: 1 }), 400)
  }
})