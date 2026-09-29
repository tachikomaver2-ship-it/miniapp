// =====================================================
//  LarkyGO 小程序配置（上线版）
//  AI / 登录 / 内容安全 全部走云函数 larky-server
//  GLM key 只存在云端（cloudfunctions/larky-server/index.js）
// =====================================================

module.exports = {

  // ====== 云开发（已开通，生产模式） ======
  // true = 所有服务端调用走 wx.cloud.callFunction（免域名白名单）
  USE_CLOUD: true,
  // 云开发环境 ID：开发者工具 → 云开发控制台 → 右上角「环境」可查看
  // 留空 = 使用默认环境（开通时自动创建的第一个环境）
  CLOUD_ENV: '',

  // ====== 旧模式（留空即可，勿填回 key） ======
  // 直连 GLM（仅本地调试用，key 会暴露在小程序包内——上线版已禁用）
  GLM_API_KEY: '',
  // HTTP 中转 URL（云开发模式下不再需要）
  CLOUD_AI_URL: '',
  CLOUD_LOGIN_URL: '',
  CLOUD_PAY_URL: '',
  CLOUD_SEC_URL: '',

  // ====== 模型名（传给云函数） ======
  CHAT_MODEL: 'glm-4.7-flash',
  VISION_MODEL: 'glm-4v-flash',

  // ====== 高级参数 ======
  USE_THINKING: true,    // 启用深度思考，质量更高、略慢
  MAX_TOKENS: 4096,      // 单次响应上限
  TEMPERATURE: 1.0,      // 创造性 0-1
  TIMEOUT_MS: 25000,     // 请求超时（毫秒）

  // ====== 协议 H5 链接（部署 privacy-h5/ 后填写，用于公众平台后台"协议链接"栏） ======
  PRIVACY_URL: 'https://your-domain.com/privacy/',

  // ====== 调试 ======
  DEBUG_LOG: true,         // 控制台打印请求与响应
}
