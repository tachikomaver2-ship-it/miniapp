// =====================================================
//  LarkyGO AI 客户端 (GLM-4.7-Flash / GLM-4V-Flash)
//  云开发模式（生产）：wx.cloud.callFunction('larky-server')
//  直连模式（仅本地调试）：wx.request 直调智谱
//  - 内置超时、JSON 提取容错，失败一律回退调用方的 fallback
// =====================================================
const cfg = require('../config.js')

function hasKey() {
  return !!(cfg.USE_CLOUD && wx.cloud) || !!(cfg.CLOUD_AI_URL || cfg.GLM_API_KEY)
}

// ────── 文件头检测 → MIME ──────
function detectMime(buf) {
  const u8 = new Uint8Array(buf)
  const b = (i) => u8[i]
  if (b(0) === 0xFF && b(1) === 0xD8) return 'image/jpeg'
  if (b(0) === 0x89 && b(1) === 0x50) return 'image/png'
  if (b(0) === 0x47 && b(1) === 0x49) return 'image/gif'
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46) return 'image/webp'
  return 'image/jpeg'
}

function log(...args) { if (cfg.DEBUG_LOG) console.log('[LarkyGO AI]', ...args) }
function warn(...args) { console.warn('[LarkyGO AI]', ...args) }

// ────── 云函数调用封装 ──────
function callCloud(data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'larky-server',
      data,
      success: (r) => {
        const d = r.result
        if (d && d.err) { warn('cloud err:', d.err); reject(new Error(d.err)) }
        else resolve(d)
      },
      fail: (e) => { warn('callFunction fail', e.errMsg); reject(new Error(e.errMsg)) }
    })
  })
}

// ────── 通用 chat 调用 ──────
async function chat(messages, opts = {}) {
  if (!hasKey()) throw new Error('NO_KEY')

  const payload = {
    model: opts.model || cfg.CHAT_MODEL,
    messages,
    temperature: opts.temperature != null ? opts.temperature : cfg.TEMPERATURE,
    max_tokens: opts.max_tokens || cfg.MAX_TOKENS
  }
  if (cfg.USE_THINKING) payload.thinking = true

  log('→', payload.model, '| msgs:', messages.length, cfg.USE_CLOUD ? '(cloud)' : '(direct)')

  // 云开发模式：key 在云端
  if (cfg.USE_CLOUD && wx.cloud) {
    const d = await callCloud({ action: 'ai', payload })
    const content = d.content || ''
    log('←', content.slice(0, 80) + (content.length > 80 ? '…' : ''))
    return content
  }

  // 直连模式（仅本地调试）
  return new Promise((resolve, reject) => {
    payload.stream = false
    wx.request({
      url: cfg.CLOUD_AI_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        ...(cfg.CLOUD_AI_URL ? {} : { Authorization: 'Bearer ' + cfg.GLM_API_KEY })
      },
      data: payload,
      timeout: cfg.TIMEOUT_MS,
      success: (res) => {
        if (res.statusCode >= 400) {
          warn('HTTP', res.statusCode, JSON.stringify(res.data).slice(0, 200))
          return reject(new Error('HTTP_' + res.statusCode))
        }
        const msg = res.data?.choices?.[0]?.message
        resolve(msg?.content || '')
      },
      fail: (e) => { warn('fail', e.errMsg); reject(e) }
    })
  })
}

// ────── JSON 安全提取 ──────
function extractJSON(text, type) {
  if (!text) return null
  const re = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/
  const m = text.match(re)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

// ────── 1. 语义搜活动 ──────
async function searchEvents(text, events, lang) {
  if (!hasKey()) return null
  try {
    const compact = events.slice(0, 100).map((e, i) => ({
      idx: i,
      t: lang === 'zh' ? e.zh?.t : e.en?.t,
      city: e.city, cat: e.cat, sub: e.sub,
      venue: lang === 'zh' ? e.zh?.venue : e.en?.venue,
      tag: lang === 'zh' ? e.zh?.tag : e.en?.tag
    }))
    const sys = lang === 'zh'
      ? '你是活动匹配助手。用户用自然语言描述想找的活动，下面是候选。请返回最多 3 个最匹配项的 idx 数组（按相关性降序），完全不匹配返回 []。只返回 JSON。'
      : 'Event matching assistant. Return up to 3 best matching indices. JSON only.'
    const out = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: (lang === 'zh' ? '用户搜索：' : 'Query: ') + text + '\n\n' + JSON.stringify(compact) }
    ], { temperature: 0.3, max_tokens: 300 })
    const arr = extractJSON(out, 'array')
    return Array.isArray(arr) ? arr.slice(0, 3) : null
  } catch (e) {
    warn('searchEvents fail → fallback', e.message); return null
  }
}

// ────── 2. 发布向导单步解析 ──────
async function parseStep(text, step, lang, ctx) {
  if (!hasKey()) return null
  try {
    const stepZh = {
      name: '活动名称（用户想搞的活动主题）',
      scene: '活动场景，从 sports(运动) / music(音乐) / outdoor(游玩) / shows(表演) / food(美食) 中选一个，或自定义场景名',
      when: '活动举办时间（自然语言日期 + 时分，如 "10月18日 周六 22:00"）',
      venue: '活动场地（含城市信息）',
      price: '票价（元，纯数字）'
    }
    const stepEn = {
      name: 'event name',
      scene: 'event scene: sports/music/outdoor/shows/food or custom string',
      when: 'event time (e.g. "Oct 18 Sat 22:00")',
      venue: 'venue (with city)',
      price: 'ticket price in CNY (number only)'
    }
    const sys = lang === 'zh'
      ? `你是活动信息解析助手。当前步骤：${stepZh[step]}。把用户回答解析为 JSON：{value:"解析结果", fallback:false}。如果用户说"随便/你帮我想/都可以/surprise/up to you"等不想回答，返回 {value:"", fallback:true, hint:"简短回复文案"}。只返回 JSON，不要解释。`
      : `Parse user's answer for step "${stepEn[step]}". Return JSON {value:"", fallback:bool, hint:""}. If user is vague/dismissive, set fallback:true with a short hint. JSON only.`
    const out = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: (lang === 'zh' ? '用户回答：' : 'Answer: ') + text + (ctx ? '\n已有信息：' + JSON.stringify(ctx) : '') }
    ], { temperature: 0.2, max_tokens: 200 })
    return extractJSON(out, 'object')
  } catch (e) {
    warn('parseStep fail → fallback', e.message); return null
  }
}

// ────── 3. 生成活动名 ──────
async function genName(scene, lang, ctx) {
  if (!hasKey()) return null
  try {
    const sys = lang === 'zh'
      ? `你是活动起名专家。基于场景 "${scene || '不限'}" 和已有信息，生成一个 6-12 字的吸引人活动名（中英各一）。返回 JSON：{zh:"中文名", en:"English name"}。只返回 JSON。`
      : `Generate an attractive event name. Return JSON {zh:"", en:""}.`
    const out = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: ctx ? '已有信息：' + JSON.stringify(ctx) : '无' }
    ], { temperature: 1.0, max_tokens: 200 })
    return extractJSON(out, 'object')
  } catch (e) {
    warn('genName fail → fallback', e.message); return null
  }
}

// ────── 4. 海报识图（OCR + 语义提取） ──────
// 云开发模式：图片先传云存储拿 fileID → 云函数下载 → GLM-4V
// 直连模式：base64 直传
async function understandPoster(imgPath, lang) {
  if (!hasKey()) return null
  try {
    const sys = lang === 'zh'
      ? `你是海报信息提取助手。给定一张活动海报图片，识别并返回 JSON：
{title:"活动名称", scene:"sports/music/outdoor/shows/food 之一", whenText:"自然语言时间，如 10月18日 周六 22:00", venue:"场地名称", price:数字或 null, city:"shanghai/beijing/guangzhou/shenzhen/chengdu/hangzhou/nanjing/wuhan/xian/xiamen/qingdao/sanya 之一"}。
不认识的字段填 null。只返回 JSON。`
      : `Extract event info from poster. Return JSON: {title, scene:"sports/music/outdoor/shows/food", whenText, venue, price:number|null, city:"shanghai/beijing/..."}. JSON only.`
    const prompt = lang === 'zh' ? '请识别这张海报：' : 'Extract from this poster:'

    // 云开发模式：云存储中转（避免 callFunction 参数超限）
    if (cfg.USE_CLOUD && wx.cloud) {
      const up = await new Promise((resolve, reject) =>
        wx.cloud.uploadFile({
          cloudPath: 'posters/' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.jpg',
          filePath: imgPath,
          success: r => resolve(r.fileID),
          fail: e => reject(new Error(e.errMsg))
        }))
      log('poster uploaded →', up)
      const d = await callCloud({ action: 'aiImage', fileID: up, text: sys + '\n' + prompt })
      return extractJSON(d.content, 'object')
    }

    // 直连模式（调试）
    const fs = wx.getFileSystemManager()
    const buf = await new Promise((resolve, reject) =>
      fs.readFile({ filePath: imgPath, success: r => resolve(r.data), fail: reject }))
    const b64 = wx.arrayBufferToBase64(buf)
    const mime = detectMime(buf)
    const out = await chat([
      { role: 'user', content: [
        { type: 'text', text: sys + '\n' + prompt },
        { type: 'image_url', image_url: { url: 'data:' + mime + ';base64,' + b64 } }
      ]}
    ], { model: cfg.VISION_MODEL, max_tokens: 800 })
    return extractJSON(out, 'object')
  } catch (e) {
    warn('understandPoster fail → fallback', e.message); return null
  }
}

module.exports = {
  hasKey,
  chat,
  searchEvents,
  parseStep,
  genName,
  understandPoster
}
