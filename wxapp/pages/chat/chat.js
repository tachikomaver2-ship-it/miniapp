const { T, actVM } = require('../../utils/core.js')
const { SUB_KW, SCENE_KW } = require('../../utils/data.js')
const ai = require('../../utils/ai.js')
const sec = require('../../utils/security.js')
const app = getApp()

const IS_ANY = /^[\s,.!！。?？]*(随便|都可以|无所谓|你来|你帮|帮我|帮我想|你定|你决定|你选|想个|起个|起名|你看着|surprise|up to you|you decide|you pick|you choose|whatever|anything)[^]*$/i

Page({
  data: { t: {}, lang: 'zh', msgs: [], input: '', quick: [], typing: false, recording: false, voiceText: '', speaking: -1, autoPlay: false },
  onLoad() {
    this.pub = null; this.draft = null; this.initChat()
    this.initRecorder()
    this.initAudio()
  },
  onShow() {
    const ap = wx.getStorageSync('larky_autoplay') || false
    this.setData({ t: T(), lang: app.globalData.lang, aiOn: ai.hasKey(), autoPlay: ap })
    this.buildQuick()
  },
  onUnload() {
    if (this.recorder) this.recorder.stop()
    if (this.audio) { this.audio.stop(); this.audio.destroy() }
  },

  // ==========================================
  //  TTS 语音输出（AI 消息朗读）
  // ==========================================
  initAudio() {
    this.audio = wx.createInnerAudioContext({ useWebAudioImplement: false })
    this.audio.obeyMuteSwitch = false
    this.audio.onEnded(() => this.setData({ speaking: -1 }))
    this.audio.onStop(() => this.setData({ speaking: -1 }))
    this.audio.onError((e) => { console.warn('[tts]', e); this.setData({ speaking: -1 }) })
  },

  // 缓存 key（客户端按 text+voice hash 复用 fileID，避免重复合成）
  ttsCacheKey(text, voice) {
    let h = 0
    const s = (voice || '') + '|' + text
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0 }
    return 'tts_' + (h >>> 0).toString(36)
  },

  toggleAutoPlay() {
    const next = !this.data.autoPlay
    this.setData({ autoPlay: next })
    wx.setStorageSync('larky_autoplay', next)
    if (next && this.data.lang === 'zh') wx.showToast({ title: '🔊 自动朗读已开', icon: 'none' })
    else if (!next && this.data.lang === 'zh') wx.showToast({ title: '🔇 自动朗读已关', icon: 'none' })
  },

  // 点击气泡上的 🔊 按钮：再次点击同一消息则停止
  async speakTap(e) {
    const { idx, text } = e.currentTarget.dataset
    if (this.data.speaking === idx) {
      this.audio.stop()
      this.setData({ speaking: -1 })
      return
    }
    // 切到当前消息前先停旧的
    if (this.audio) this.audio.stop()
    this.setData({ speaking: idx })
    this.speakText(text, idx)
  },

  async speakText(text, idx) {
    if (!text) return
    const voice = this.data.lang === 'zh' ? 'zh-female' : 'en-female'
    const cacheKey = this.ttsCacheKey(text, voice)
    let fileID = wx.getStorageSync(cacheKey)
    try {
      if (!fileID) {
        wx.showLoading({ title: this.data.lang === 'zh' ? '合成中…' : 'Synthesizing…', mask: true })
        const res = await wx.cloud.callFunction({
          name: 'larky-server',
          data: { action: 'tts', text, voice }
        })
        wx.hideLoading()
        if (res && res.result && res.result.err) {
          wx.showToast({ title: this.data.lang === 'zh' ? '朗读失败' : 'TTS failed', icon: 'none' })
          this.setData({ speaking: -1 })
          return
        }
        fileID = res.result.fileID
        wx.setStorageSync(cacheKey, fileID)
        // 缓存上限 60 条
        const info = wx.getStorageInfoSync()
        if (info.keys.filter(k => k.startsWith('tts_')).length > 60) {
          const old = wx.getStorageSync('larky_tts_keys') || []
          old.push(cacheKey)
          while (old.length > 60) wx.removeStorageSync(old.shift())
          wx.setStorageSync('larky_tts_keys', old)
        }
      }
      const dl = await wx.cloud.downloadFile({ fileID })
      this.audio.src = dl.tempFilePath
      this.audio.play()
    } catch (err) {
      wx.hideLoading()
      console.warn('[tts]', err)
      wx.showToast({ title: this.data.lang === 'zh' ? '朗读出错' : 'TTS error', icon: 'none' })
      this.setData({ speaking: -1 })
    }
  },

  // ==========================================
  //  语音录音模块（按住说话模式）
  // ==========================================
  initRecorder() {
    if (!wx.getRecorderManager) return
    const rm = wx.getRecorderManager()
    this.recorder = rm
    this._recStartY = 0
    this._recCanceled = false
    rm.onStart(() => {
      this._recCanceled = false
      this.setData({ recording: true })
    })
    rm.onStop((res) => {
      // 上滑取消时不上传
      if (this._recCanceled) { this.setData({ recording: false }); return }
      this.setData({ recording: false })
      if (res && res.tempFilePath) this.uploadAndTranscribe(res.tempFilePath, res.duration || 0)
      else wx.showToast({ title: app.globalData.lang === 'zh' ? '录音失败' : 'Rec failed', icon: 'none' })
    })
    rm.onError((err) => {
      console.error('[voice]', err)
      this.setData({ recording: false })
      wx.showToast({ title: app.globalData.lang === 'zh' ? '录音出错' : 'Rec error', icon: 'none' })
    })
  },

  // 按下 → 先权限弹授权 → 开始录音
  micStart(e) {
    if (!this.recorder) {
      wx.showToast({ title: app.globalData.lang === 'zh' ? '当前版本不支持语音' : 'Voice not supported', icon: 'none' })
      return
    }
    if (this.data.recording) return
    // 1. 检查麦克风权限
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.record']) {
          this._doStartRecord(e)
        } else {
          wx.authorize({
            scope: 'scope.record',
            success: () => this._doStartRecord(e),
            fail: () => {
              wx.showModal({
                title: app.globalData.lang === 'zh' ? '需要麦克风权限' : 'Microphone needed',
                content: app.globalData.lang === 'zh' ? '请在设置中开启麦克风权限，以便语音输入活动信息。' : 'Please allow microphone access in Settings.',
                confirmText: app.globalData.lang === 'zh' ? '去设置' : 'Open Settings',
                success: (r) => { if (r.confirm) wx.openSetting() }
              })
            }
          })
        }
      }
    })
  },

  _doStartRecord(e) {
    this._recStartY = (e.touches && e.touches[0] && e.touches[0].clientY) || 0
    this._recCanceled = false
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })
    this.recorder.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    })
  },

  // 松开 → 停止录音并上传识别
  micStop() {
    if (!this.recorder || !this.data.recording) return
    this.recorder.stop()
  },

  // 触摸取消（如系统弹窗打断）
  micCancel() {
    if (!this.recorder) return
    this._recCanceled = true
    this.recorder.stop()
  },

  // 触摸移动 → 上滑一段距离视为取消（不发出去）
  // 用 bindtouchmove 监听时调用：this.micTouchMove(e)
  micTouchMove(e) {
    if (!this.data.recording || !this._recStartY) return
    const y = (e.touches && e.touches[0] && e.touches[0].clientY) || 0
    if (this._recStartY - y > 80) {
      this._recCanceled = true
      // 视觉提示（这里简单做）
      this.setData({ voiceText: app.globalData.lang === 'zh' ? '↑ 松开取消' : '↑ release to cancel' })
    }
  },

  // 上传到云存储 → 调云函数 audio action
  async uploadAndTranscribe(filePath, duration) {
    if (!wx.cloud) {
      wx.showToast({ title: app.globalData.lang === 'zh' ? '请开通云开发' : 'Enable Cloud', icon: 'none' })
      return
    }
    if (duration < 500) {
      wx.showToast({ title: app.globalData.lang === 'zh' ? '说太短啦～' : 'Too short', icon: 'none' })
      return
    }
    const lang = app.globalData.lang
    wx.showLoading({ title: lang === 'zh' ? '识别中…' : 'Transcribing…', mask: true })
    try {
      // 1. 上传 mp3 到云存储
      const ts = Date.now()
      const up = await wx.cloud.uploadFile({
        cloudPath: `voice/${ts}.mp3`,
        filePath
      })
      if (!up.fileID) throw new Error('upload no fileID')
      // 2. 调云函数转写
      const r = await wx.cloud.callFunction({
        name: 'larky-server',
        data: { action: 'audio', fileID: up.fileID }
      })
      wx.hideLoading()
      const text = r && r.result && r.result.text
      if (!text) {
        wx.showToast({ title: lang === 'zh' ? '未听清，再来一次' : 'Try again', icon: 'none' })
        return
      }
      // 3. 把识别结果填到 input 并自动发送
      this.setData({ input: text })
      setTimeout(() => this.send(), 80)
    } catch (e) {
      wx.hideLoading()
      console.error('[voice transcribe]', e)
      wx.showToast({ title: lang === 'zh' ? '识别失败' : 'Failed', icon: 'none' })
    }
  },
  // —— 基础 ——
  T2() { return T() },
  now() {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  },
  push(m) {
    const msgs = this.data.msgs.concat([{ ...m, time: this.now(), id: this.data.msgs.length }])
    this.setData({ msgs })
    this.scroll()
    // 自动朗读：新 bot 消息且 autoPlay 开关打开时自动调用 TTS
    if (this.data.autoPlay && m.role === 'bot' && m.text) {
      const idx = msgs.length - 1
      // 给动画一点时间，避免与 typing 收尾冲突
      setTimeout(() => {
        this.setData({ speaking: idx })
        this.speakText(m.text, idx)
      }, 200)
    }
  },
  scroll() {
    setTimeout(() => this.setData({ scrollId: 'm' + (this.data.msgs.length - 1) }), 60)
  },
  botSay(text, extra, delay) {
    this.setData({ typing: true })
    setTimeout(() => {
      this.setData({ typing: false })
      this.push({ role: 'bot', text, ...extra })
    }, delay || 700)
  },
  initChat() {
    const t = T()
    this.setData({ msgs: [] })
    this.push({ role: 'bot', text: t.chatWelcome + (ai.hasKey() ? '' : '') })
    this.buildQuick()
  },
  buildQuick() {
    this.setData({ quick: T().chatChips })
  },
  onInput(e) { this.setData({ input: e.detail.value }) },
  // 发送（内容安全前置检查）
  send() {
    const text = this.data.input.trim()
    if (!text) return
    this.setData({ input: '' })
    this.sendSafe(text)
  },
  quickTap(e) {
    const text = e.currentTarget.dataset.q
    this.sendSafe(text)
  },
  // 内容安全检查通过后再进主流程
  async sendSafe(text) {
    const r = await sec.checkText(text)
    if (!r.pass) {
      this.push({ role: 'user', text })
      this.botSay('⚠️ ' + (r.reason || (app.globalData.lang === 'zh' ? '内容含违规信息，无法处理' : 'Content violates policy')), null, 300)
      return
    }
    this.push({ role: 'user', text })
    this.handleUser(text)
  },
  // —— 主路由 ——
  handleUser(text) {
    if (this.pub) { this.pubStep(text); return }
    if (/发布|发起|创建|host|create|publish/i.test(text)) { this.startPublish(); return }
    this.botSearch(text)
  },
  // —— 搜索（AI 优先，规则兜底） ——
  async botSearch(text) {
    const t = T(), low = text.toLowerCase()
    const g = app.globalData
    const mc = app.CITIES.find(c => text.includes(c.zh) || low.includes(c.en.toLowerCase()))
    const target = mc ? mc.id : g.city
    if (mc && mc.id !== g.city) app.pickCity(mc.id)
    let list = []
    if (ai.hasKey()) {
      this.setData({ typing: true })
      try {
        const ids = await ai.searchEvents(text, g.acts, g.lang)
        if (ids && ids.length) list = ids.map(i => actVM(g.acts[i], i)).filter(vm => g.acts[vm.idx].city === target)
      } catch (e) { console.warn('[LarkyGO AI] search fallback', e) }
      finally { this.setData({ typing: false }) }
    }
    if (!list.length) {
      let subs = []; for (const [k, kws] of Object.entries(SUB_KW)) if (kws.some(w => low.includes(w))) subs.push(k)
      let sc = null; for (const [k, kws] of Object.entries(SCENE_KW)) if (kws.some(w => low.includes(w))) sc = k
      list = g.acts.map((a, i) => actVM(a, i)).filter(vm => g.acts[vm.idx].city === target).sort((x, y) => x.d - y.d)
      if (subs.length) list = list.filter(a => subs.includes(a.sub))
      else if (sc) list = list.filter(a => a.cat === sc)
    }
    if (!list.length) { this.botSay(t.chatNotFound, null, 600); return }
    const cn = app.globalData.lang === 'zh' ? app.cityOf(target).zh : app.cityOf(target).en
    const cards = list.slice(0, 3)
    this.botSay(t.chatFound.replace('{n}', list.length) + ' ' + cn + ' 👇', { cards, goAll: true }, 800)
  },
  goAll() { wx.switchTab({ url: '/pages/index/index' }) },
  openCard(e) { wx.navigateTo({ url: `/pages/detail/detail?idx=${e.currentTarget.dataset.idx}` }) },
  // —— 发布向导 ——
  startPublish() { this.pub = { step: 'name', draft: {} }; this.botSay(T().chatPubStart) },
  genName() {
    const zh = app.globalData.lang === 'zh'
    const pool = zh
      ? ['霓虹狂想夜', '周末不回家计划', '快乐浓度超标现场', '神秘来宾空降局', '城市漫游奇遇记', '热血开麦派对', '微醺乌托邦', '多巴胺补给站', '人间烟火观测局', '有点上头俱乐部']
      : ['Neon Rhapsody', 'No-Home Weekend', 'Overdose of Fun', 'Mystery Drop-In', 'City Roaming Quest', 'Hype Mic Party', 'Tipsy Utopia', 'Dopamine Refill', 'Fireworks & Feelings', 'Slightly Addicted Club']
    return pool[Math.floor(Math.random() * pool.length)]
  },
  async regenName() {
    if (!this.pub || this.pub.step !== 'scene') return
    const lang = app.globalData.lang
    let zhName = null
    if (ai.hasKey()) {
      this.setData({ typing: true })
      try {
        const r = await ai.genName(this.pub.draft.cat, lang, this.pub.draft)
        if (r && (r.zh || r.en)) zhName = lang === 'zh' ? (r.zh || r.en) : (r.en || r.zh)
      } catch (e) { console.warn('[LarkyGO AI] genName fallback', e) }
      finally { this.setData({ typing: false }) }
    }
    if (!zhName) zhName = this.genName()
    this.pub.draft.title = zhName
    this.push({ role: 'bot', text: '✨ ' + zhName, reroll: true })
  },
  async pubStep(text) {
    const t = T(), pub = this.pub, lang = app.globalData.lang
    if (/取消|退出|算了|cancel|quit|stop/i.test(text)) { this.pub = null; this.botSay(t.chatPubCancel, null, 500); return }
    const isAny = IS_ANY.test(text) && text.length < 30

    // AI 解析当前步骤（失败 / 无 key / "随便" → 走规则）
    let aiResult = null
    if (ai.hasKey() && !isAny) {
      this.setData({ typing: true })
      try { aiResult = await ai.parseStep(text, pub.step, lang, pub.draft) }
      catch (e) { console.warn('[LarkyGO AI] parseStep fallback', e) }
      finally { this.setData({ typing: false }) }
    }

    if (pub.step === 'name') {
      if (isAny || (aiResult && aiResult.fallback)) {
        pub.draft.title = this.genName(); pub.step = 'scene'
        this.botSay(t.chatPubNameGen.replace('{t}', pub.draft.title), { reroll: true }, 700); return
      }
      pub.draft.title = (aiResult && aiResult.value) ? aiResult.value : text.trim(); pub.step = 'scene'
      this.botSay(t.chatPubScene.replace('{t}', pub.draft.title), null, 600); return
    }

    if (pub.step === 'scene') {
      if (isAny || (aiResult && aiResult.fallback)) {
        const sc = app.SCENES[Math.floor(Math.random() * 5)]
        pub.draft.cat = sc.id; pub.step = 'when'
        this.botSay(t.chatPubSceneAny.replace('{t}', t.sceneShort[sc.id] + ' ' + sc.emoji), null, 600); return
      }
      const val = (aiResult && aiResult.value) ? String(aiResult.value) : text
      const v = val.toLowerCase()
      const hit = app.SCENES.find(s => s.id === 'sports' && /运动|滑板|网球|sport|skate|tennis|board/.test(v))
        || app.SCENES.find(s => s.id === 'music' && /音乐|live|techno|house|music|派对|演出|rave|蹦|音乐剧|电音/.test(v))
        || app.SCENES.find(s => s.id === 'outdoor' && /游玩|户外|徒步|登山|hike|nature|爬山|海|河/.test(v))
        || app.SCENES.find(s => s.id === 'shows' && /表演|脱口秀|音乐剧|魔术|comedy|magic|show|演出|戏剧/.test(v))
        || app.SCENES.find(s => s.id === 'food' && /美食|吃|聚餐|火锅|food|dining|餐|酒/.test(v))
      if (!hit) {
        const tag = val.trim().slice(0, 12)
        if (!tag) { this.botSay(t.chatPubSceneRetry, null, 500); return }
        pub.draft.cat = 'custom'; pub.draft.customTag = tag; pub.step = 'when'
        this.botSay(t.chatPubCustom.replace('{t}', tag), null, 600); return
      }
      pub.draft.cat = hit.id; pub.step = 'when'
      this.botSay(t.chatPubWhen, null, 600); return
    }

    if (pub.step === 'when') {
      if (isAny || (aiResult && aiResult.fallback)) {
        pub.draft.whenText = lang === 'zh' ? '下周六 19:00' : 'Next Sat 19:00'
        pub.draft.d = 6; pub.draft.hm = '19:00'
        pub.step = 'venue'
        this.botSay(t.chatPubWhenAny.replace('{t}', pub.draft.whenText), null, 600); return
      }
      pub.draft.whenText = (aiResult && aiResult.value) ? aiResult.value : text.trim()
      const m = pub.draft.whenText.match(/(\d{1,2})\s*月\s*(\d{1,2})/); const h = pub.draft.whenText.match(/(\d{1,2}):(\d{2})/)
      if (m) {
        const now = new Date()
        const tgt = new Date(now.getFullYear(), parseInt(m[1]) - 1, parseInt(m[2]))
        let off = Math.round((tgt - now) / 86400000); if (off < 0) off += 30
        pub.draft.d = off
      }
      if (h) pub.draft.hm = h[1] + ':' + h[2]
      pub.step = 'venue'; this.botSay(t.chatPubVenue, null, 600); return
    }

    if (pub.step === 'venue') {
      pub.draft.venue = (isAny || (aiResult && aiResult.fallback))
        ? (lang === 'zh' ? '待定（发布前可改）' : 'TBD (editable)')
        : ((aiResult && aiResult.value) || text.trim())
      const aiVenue = pub.draft.venue
      const mc = app.CITIES.find(c => aiVenue.includes(c.zh) || aiVenue.toLowerCase().includes(c.en.toLowerCase()))
      if (mc) pub.draft.city = mc.id
      pub.step = 'price'; this.botSay(t.chatPubPrice, null, 600); return
    }

    if (pub.step === 'price') {
      const aiVal = (aiResult && aiResult.value) ? String(aiResult.value) : text
      const p = aiVal.match(/\d+/)
      pub.draft.price = p ? parseInt(p[0]) : 99
      this.draft = pub.draft; this.pub = null
      this.botSay(t.chatPubSummary, { draft: this.draftVM(this.draft) }, 500)
    }
  },
  draftVM(d) {
    const t = T()
    return {
      title: d.title,
      scene: d.cat === 'custom' ? ((d.customTag || t.sceneShort.custom) + ' ✨') : (t.sceneShort[d.cat] + ' ' + app.sceneOf(d.cat).emoji),
      when: d.whenText, venue: d.venue, price: d.price
    }
  },
  async publishDraft() {
    const d = this.draft; if (!d || !d.title) return
    const g = app.globalData
    const lang = g.lang
    // 发布前内容安全检查（标题+场地）
    const r = await sec.checkText((d.title || '') + ' ' + (d.venue || '') + ' ' + (d.customTag || ''))
    if (!r.pass) {
      this.botSay('⚠️ ' + (r.reason || (lang === 'zh' ? '活动信息含违规内容，请修改后再发布' : 'Event info violates policy, please edit')), null, 300)
      return
    }
    const tagTxt = d.cat === 'custom' ? ((d.customTag || 'CUSTOM').toUpperCase().slice(0, 14)) : d.cat.toUpperCase()
    const name = d.title, venue = d.venue, host = t_host()
    app.addAct({
      city: d.city || g.city, cat: d.cat, sub: (app.sceneOf(d.cat).subs[0] || 'custom'),
      emoji: app.sceneOf(d.cat).emoji, grad: app.GRADS[d.cat] || app.GRADS.custom,
      d: d.d != null ? d.d : 7, hm: d.hm || '19:00', price: d.price || 99,
      going: 1, spots: 30, hot: true,
      zh: { t: name, venue, host, tag: tagTxt },
      en: { t: name, venue, host, tag: tagTxt },
      lineup: [['Host', host]]
    })
    this.draft = null
    this.botSay(t_host_done(), null, 600)
    wx.showToast({ title: '🎉 ' + t_host_done(), icon: 'none' })
  },
  redoDraft() { this.draft = null; this.startPublish() },
  draftRedo() {
    if (this.draft && this.draft.fromImg) { this.draft = null; this.pickImg(); return }
    this.redoDraft()
  },
  // —— 识图发布（GLM-4V-Flash 真实 OCR） ——
  async pickImg() {
    try {
      const res = await new Promise((resolve, reject) =>
        wx.chooseMedia({ count: 1, mediaType: ['image'], success: resolve, fail: reject }))
      const filePath = res.tempFiles[0].tempFilePath
      this.push({ role: 'user', img: filePath })
      const t = T(), lang = app.globalData.lang

      // 图片内容安全检查（微信 imgSecCheck，未配服务端则放行）
      const imgCheck = await sec.checkImage(filePath)
      if (!imgCheck.pass) {
        this.botSay('⚠️ ' + (imgCheck.reason || (lang === 'zh' ? '图片未通过安全检测' : 'Image failed safety check')), null, 300)
        return
      }

      if (!ai.hasKey()) {
        // 演示数据
        this.setData({ typing: true })
        setTimeout(() => {
          this.setData({ typing: false })
          const zh = lang === 'zh'
          this.draft = {
            title: zh ? '赛博梵音 Cyber Budha #5 派对' : 'Cyber Budha Rave #5',
            cat: 'music', whenText: zh ? '10月18日 周六 22:00' : 'Oct 18 Sat 22:00',
            d: 20, hm: '22:00', venue: zh ? '上海 万航渡后巷 LIVE' : 'Back-Alley LIVE, Shanghai',
            city: 'shanghai', price: 150, fromImg: true
          }
          this.push({ role: 'bot', text: t.chatImgRead, draft: this.draftVM(this.draft), fromImg: true })
        }, 1400)
        return
      }

      // 真实 GLM 识图
      this.setData({ typing: true })
      const info = await ai.understandPoster(filePath, lang)
      this.setData({ typing: false })
      if (!info) {
        this.botSay(lang === 'zh' ? '😶 海报识别失败，请手动填写吧～' : 'OCR failed, please fill in manually.', null, 500)
        this.startPublish()
        return
      }
      // 解析场景
      const sc = info.scene && app.SCENES.find(s => s.id === info.scene) ? info.scene : (info.scene ? 'custom' : 'custom')
      this.draft = {
        title: info.title || (lang === 'zh' ? '海报活动' : 'Poster Event'),
        cat: sc,
        customTag: sc === 'custom' ? String(info.scene).slice(0, 12) : null,
        whenText: info.whenText || (lang === 'zh' ? '时间待定' : 'TBD'),
        d: 7, hm: '19:00',
        venue: info.venue || (lang === 'zh' ? '场地待定' : 'TBD'),
        city: info.city && app.CITIES.find(c => c.id === info.city) ? info.city : app.globalData.city,
        price: info.price || 99,
        fromImg: true
      }
      this.push({ role: 'bot', text: t.chatImgRead, draft: this.draftVM(this.draft), fromImg: true })
    } catch (e) {
      if (e && e.errMsg && e.errMsg.includes('cancel')) return
      console.warn('[LarkyGO AI] pickImg err', e)
      this.botSay('选图失败', null, 500)
    }
  }
})
function t_host() { return T().chatYouHost }
function t_host_done() { return T().chatPubDone }