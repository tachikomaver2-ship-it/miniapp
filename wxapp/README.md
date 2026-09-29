# LarkyGO 微信小程序 · 上线手册

> 4 条合规链路（隐私协议 / 登录 / 支付 / 内容安全）已全部搭好，未配置服务端时自动走演示模式，不阻塞调试。

## 一、快速开始（调试）

1. 微信开发者工具 → 导入本目录（appid 已预填 `wx305570d7a22a004a`）
2. AI 功能：`config.js` 填 `GLM_API_KEY`（智谱 [open.bigmodel.cn](https://open.bigmodel.cn)，glm-4.7-flash 永久免费）
3. 本地设置 → ✅ 不校验合法域名（调试用）

## 二、四条合规链路说明

### 1️⃣ 隐私协议
| 层 | 文件 | 说明 |
|---|---|---|
| H5 页 | `privacy-h5/index.html` | 双语隐私政策+用户协议，**先替换文中【填写你的主体名称】等占位**，部署到任意静态托管（CloudStudio 等），把 URL 填进 `config.js` 的 `PRIVACY_URL`，并在 **mp 后台 → 设置 → 服务内容声明 → 用户隐私保护指引** 同步填写 |
| 小程序内 | `pages/agreement/` | 内置双语全文页（不依赖外链） |
| 授权弹窗 | `pages/index/` 弹窗 + `app.js setupPrivacy()` | 对接微信 `onNeedPrivacyAuthorization` 规范；`app.json` 已开 `__usePrivacyCheck__` |

### 2️⃣ 微信登录
- 前端：`utils/auth.js`（我的页 → 微信一键登录 → `wx.login` → 服务端 code2session → openid 存缓存）
- 服务端：云函数 `cloudfunctions/larky-server/` 的 `handleLogin`（微信云开发可免 AppSecret）
- 未配置时：自动生成演示身份 `demo_xxx`，全链路可调试
- **填参**：`config.js → CLOUD_LOGIN_URL`

### 3️⃣ 微信支付
- 前端：`utils/pay.js`（详情页购票 → 云函数统一下单 → `wx.requestPayment` → 出票）
- 服务端：云函数 `handleCreateOrder` + `handlePayNotify`（**金额必须服务端计算**，代码里有安全注释）
- 未配置时：弹「演示支付」确认框直接出票，可完整走通购票链路
- **前置条件**：mp 后台开通微信支付 → 获取商户号 mch_id + APIv3 密钥 + 证书 → 填入云函数配置区 → `config.js → CLOUD_PAY_URL`
- **注意**：支付回调 `NOTIFY_URL` 必须是已 ICP 备案的 HTTPS 域名

### 4️⃣ 内容安全
- 前端：`utils/security.js`，已接入 3 个入口：
  - AI 聊天用户发送的每条文本（`sendSafe`）
  - 识图上传的海报图片（`checkImage`）
  - 发布活动的标题/场地（`publishDraft`）
- 服务端：云函数 `handleSecurity`（msg_sec_check 2.0 文本 / img_sec_check 图片）
- 未配置时：本地敏感词小词库兜底过滤
- **填参**：`config.js → CLOUD_SEC_URL`

## 三、上线操作步骤（你来点按钮）

### 第 1 步：部署服务端（约 20 分钟）
1. 开发者工具 → 云开发 → 开通（有免费额度）→ 新建环境
2. 云函数 → 新建 `larky-server` → 粘贴 `cloudfunctions/larky-server/index.js` → 安装依赖 → 上传部署
3. 在云函数代码里填：AppSecret（mp 后台获取）、商户号/密钥（如做支付）
4. 开启云函数 HTTP 访问服务，拿到 3 个触发 URL → 填入 `config.js` 的 `CLOUD_LOGIN_URL / CLOUD_PAY_URL / CLOUD_SEC_URL`，同时把 `GLM_API_KEY` 挪进云函数（前端清空）

### 第 2 步：部署隐私协议 H5
`privacy-h5/` 目录部署到 CloudStudio（或任意静态托管），替换占位文案，得到 URL

### 第 3 步：公众平台后台配置（[mp.weixin.qq.com](https://mp.weixin.qq.com)）
| 位置 | 填什么 |
|---|---|
| 设置 → 基本设置 | 小程序名称 LarkyGO、简介、头像（Neo-Pop 风格 logo） |
| 开发管理 → 开发设置 → 服务器域名 | request 合法域名：云函数 HTTP 触发域名 + AI 中转域名 |
| 设置 → 服务内容声明 → 用户隐私保护指引 | 按收集的信息逐项勾选（头像昵称/用户生成内容等），生效后前端隐私弹窗才能过审 |
| 设置 → 第三方设置 → 插件管理 | 无需 |

### 第 4 步：上传与提审
1. 开发者工具右上角「上传」→ 填版本号（如 1.0.0）+ 备注
2. mp 后台 → 版本管理 → 开发版本 → 提交审核
3. 审核信息：服务类目建议「生活服务 → 其他生活服务」或「工具 → 效率」（含票务则需补充资质）；标签、截图用你已有的 5 张
4. 审核通过 → 全量发布（1-3 天出结果）

## 四、审核易踩的坑

| 坑 | 对策 |
|---|---|
| 隐私指引未配置或与实际不符 | 只勾选实际用到的权限；本项目用到：用户信息（openid）、头像昵称、相册（识图选图）、用户生成内容 |
| 前端有明文 key | 上线前清空 `config.js` 的 `GLM_API_KEY`（已挪到云函数） |
| 支付金额前端可改 | 云函数已按服务端价格表设计，切勿图省事传前端价格 |
| 无 UGC 审核 | 内容安全三入口已接；审核员会测试发布功能 |
| 页面空白/报错 | 演示模式全部可跑通，确保 `CLOUD_*_URL` 留空时无 js 报错（已验证） |

## 五、目录结构

```
wxapp/
├── config.js               ← 所有 URL / key 配置入口
├── app.js                  ← 隐私授权监听 + 登录态
├── app.json                ← 含 __usePrivacyCheck__
├── custom-tab-bar/         ← Neo-Pop 悬浮 TabBar
├── pages/                  ← 8 页面（含 agreement）
├── utils/                  ← core / data / ai / auth / pay / security
├── cloudfunctions/
│   └── larky-server/       ← 服务端示例（login/pay/security 三合一）
└── privacy-h5/             ← 双语协议 H5（部署用）
```
