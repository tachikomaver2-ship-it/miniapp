// =====================================================
//  LARKY! 服务端云函数（微信云开发版）
//  一个函数统一处理：
//    ai      — GLM 对话（key 只存在这里，绝不进小程序包）
//    aiImage — GLM 视觉识图（图片经云存储中转，fileID 传入）
//    audio   — GLM-4-Voice 语音转文字（mp3 fileID → 文本）
//    login   — cloud.getWXContext() 免 code2session 拿 openid
//    text    — msgSecCheck 文本内容安全（云调用免 access_token）
//    image   — imgSecCheck 图片内容安全（云调用免 access_token）
//
//  部署（开发者工具）：
//    1. 右键 cloudfunctions/larky-server →「上传并部署：云端安装依赖」
//    2. 无需任何域名配置 / 白名单（云开发内网调用）
// =====================================================
const cloud = require('wx-server-sdk')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// —— 配置区 ——
const GLM_KEY = 'b37ca7986db441f2b087c60987f80c46.hWLJ9qafiGJElNbR'  // 智谱 key：只存在云端
const GLM_CHAT_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const GLM_ASR_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/audio/transcriptions'  // Whisper 兼容
const CHAT_MODEL = 'glm-4.7-flash'
const VISION_MODEL = 'glm-4v-flash'
const VOICE_MODEL = 'glm-4-voice'        // 端到端语音对话模型

exports.main = async (event) => {
  const { action } = event
  try {
    switch (action) {
      case 'ai':      return await handleAI(event)
      case 'aiImage': return await handleAIImage(event)
      case 'audio':   return await handleAudio(event)
      case 'login':   return await handleLogin(event)
      case 'text':    return await handleTextSec(event)
      case 'image':   return await handleImageSec(event)
      default:        return { err: 'unknown action: ' + action }
    }
  } catch (e) {
    console.error('[larky-server]', action, e)
    return { err: e.message }
  }
}

// ────── GLM HTTP 封装（云函数内无 wx.request，用 https 模块） ──────
function glmChat(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const req = https.request(GLM_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + GLM_KEY,
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 25000
    }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error('GLM HTTP_' + res.statusCode + ' ' + data.slice(0, 200)))
        try {
          const j = JSON.parse(data)
          const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || ''
          resolve(content)
        } catch (e) { reject(new Error('GLM parse: ' + e.message)) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('GLM timeout')) })
    req.write(body)
    req.end()
  })
}

// ────── 1. GLM 对话（搜活动 / 起名 / 步骤解析） ──────
async function handleAI({ payload }) {
  if (!payload || !payload.messages) return { err: 'no messages' }
  const p = {
    model: payload.model || CHAT_MODEL,
    messages: payload.messages,
    temperature: payload.temperature != null ? payload.temperature : 0.7,
    max_tokens: payload.max_tokens || 4096,
    stream: false
  }
  if (payload.thinking) p.thinking = { type: 'enabled' }
  const content = await glmChat(p)
  return { content }
}

// ────── 2. GLM 视觉识图（fileID → 下载 → base64 → GLM-4V） ──────
async function handleAIImage({ fileID, text }) {
  if (!fileID) return { err: 'no fileID' }
  const dl = await cloud.downloadFile({ fileID })
  const b64 = dl.fileContent.toString('base64')
  const content = await glmChat({
    model: VISION_MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: text || 'Describe this image.' },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } }
      ]
    }],
    max_tokens: 800,
    stream: false
  })
  return { content }
}

// ────── 3. 语音转文字（GLM-4-Voice 端到端 + system 约束只输出原文） ──────
async function handleAudio({ fileID, lang }) {
  if (!fileID) return { err: 'no fileID' }
  // 1. 下载 mp3
  const dl = await cloud.downloadFile({ fileID })
  const b64 = dl.fileContent.toString('base64')
  // 2. 调 GLM-4-Voice：限定只输出识别到的原文（不掺杂回复）
  const sysPrompt = lang === 'en'
    ? 'You are an ASR engine. Transcribe exactly what you hear. Output ONLY the transcript text, no explanations, no replies.'
    : '你是语音转写引擎。只输出听到的原文字内容，不要做任何解释或回复。'
  const content = await glmChat({
    model: VOICE_MODEL,
    messages: [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: [
        { type: 'audio_url', audio_url: { url: 'data:audio/mp3;base64,' + b64 } }
      ]}
    ],
    modalities: ['text'],   // 只输出文字
    temperature: 0.1,
    max_tokens: 1024,
    stream: false
  })
  // 清理：去掉模型偶发的"以下是听到的内容："等前缀
  const text = (content || '').replace(/^[\s\n]*[「【"'].*?[」】"']\s*/g, '').trim()
  return { text }
}

// ────── 4. 登录：免 code2session，云函数直接拿 openid ──────
async function handleLogin() {
  const ctx = cloud.getWXContext()
  if (!ctx.OPENID) return { err: 'no openid in context' }
  return { openid: ctx.OPENID, unionid: ctx.UNIONID || '' }
}

// ────── 5. 文本内容安全（云调用，免 access_token） ──────
async function handleTextSec({ text, openid }) {
  const ctx = cloud.getWXContext()
  const uid = ctx.OPENID || openid
  if (!uid) return { pass: true, note: 'no openid, skip' }
  try {
    const r = await cloud.openapi.security.msgSecCheck({
      version: 2, scene: 2, openid: uid, content: text || ''
    })
    const suggest = r && r.result && r.result.suggest
    return { pass: suggest === 'pass', reason: suggest !== 'pass' ? '内容含违规信息' : '' }
  } catch (e) {
    // errcode 87014 = 违规；其他错误放行避免阻塞（生产可改严格）
    if (e.errCode === 87014 || (e.errMsg && e.errMsg.includes('87014'))) {
      return { pass: false, reason: '内容含违规信息' }
    }
    console.warn('msgSecCheck error', e.errCode || e.message)
    return { pass: true }
  }
}

// ────── 6. 图片内容安全（云调用 imgSecCheck，≤1M） ──────
async function handleImageSec({ fileID }) {
  if (!fileID) return { pass: true, note: 'no fileID' }
  try {
    const dl = await cloud.downloadFile({ fileID })
    const r = await cloud.openapi.security.imgSecCheck({
      media: { contentType: 'image/png', value: dl.fileContent }
    })
    return { pass: true }
  } catch (e) {
    if (e.errCode === 87014 || (e.errMsg && e.errMsg.includes('87014'))) {
      return { pass: false, reason: '图片含违规内容' }
    }
    console.warn('imgSecCheck error', e.errCode || e.message)
    return { pass: true }
  }
}
