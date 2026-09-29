[🇬🇧 English Docs](./README_EN.md) · [🇨🇳 中文文档](./README.md)

---

# 🌟 LarkyGO · 在华外国人娱乐活动发现平台

> **GO OUT · PLAY NOW** —— 为生活在中国 12 个城市的外国人打造的娱乐活动发现小程序。中英双语 · AI 找活动 · 一键发布。

<p align="left">
  <a href="https://github.com/tachikomaver2-ship-it/miniapp/stargazers"><img src="https://img.shields.io/github/stars/tachikomaver2-ship-it/miniapp?style=for-the-badge&logo=github&color=FF5A36" alt="Stars"/></a>
  <a href="https://github.com/tachikomaver2-ship-it/miniapp/network/members"><img src="https://img.shields.io/github/forks/tachikomaver2-ship-it/miniapp?style=for-the-badge&logo=github&color=6C4DFF" alt="Forks"/></a>
  <a href="https://github.com/tachikomaver2-ship-it/miniapp/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tachikomaver2-ship-it/miniapp?style=for-the-badge&color=CFFF3D" alt="License"/></a>
  <img src="https://img.shields.io/badge/wechat-miniprogram-1AAD19?style=for-the-badge&logo=wechat&logoColor=white" alt="WeChat Mini Program"/>
  <img src="https://img.shields.io/badge/version-1.0.0-1C1726?style=for-the-badge" alt="Version"/>
</p>

---

## ✨ 项目亮点 / Highlights

| 🎯 功能 Feature | 📝 说明 Description |
|---|---|
| 🤖 **AI 找活动** | GLM-4.7-Flash 对话式搜索，说「北京本周有什么音乐活动」秒推结果 |
| 🎤 **语音输入** | 按住说话 → 端到端转写（GLM-4-Voice）→ 自动发问，发布活动更轻量 |
| 📷 **海报识别** | 上传海报图 → GLM-4V-Flash 自动提取活动名/时间/地点/票务 |
| 🌐 **中英双语** | 12 城 / 5 大类全量双语，活动详情支持 EN ⇄ ZH 无缝切换 |
| 🏙️ **12 城覆盖** | 北京 · 上海 · 杭州 · 成都 · 深圳 · 广州 · 苏州 · 西安 · 南京 · 武汉 · 厦门 · 重庆 |
| ✦ **Neo-Pop 视觉** | 奶油底 × 粗描边 × 硬阴影 × 贴纸色（电光紫 #6C4DFF × 珊瑚 #FF5A36 × 柠檬绿 #CFFF3D） |
| 🔒 **合规上线** | 隐私协议 H5 + 微信登录 + 支付（演示）+ 内容安全（云调用）四链路完整 |
| ☁️ **云端密钥** | GLM API Key 只存在云函数 `larky-server`，前端零密钥可发布 |

---

## 📂 项目结构 / Project Structure

```
miniapp/
├── wxapp/                    # 微信小程序原生工程（导入开发者工具）
│   ├── app.js                # 云开发初始化 / 全局数据 / 隐私授权
│   ├── app.json              # 8 页面 + 自定义 TabBar 配置
│   ├── config.js             # 云函数模式开关 + 模型名 + 调试参数
│   ├── pages/                # 8 个页面
│   │   ├── index/            # 首页（活动广场）
│   │   ├── list/             # 活动列表（按类目/城市筛选）
│   │   ├── detail/           # 活动详情 + 报名
│   │   ├── chat/             # AI Chat（语音 + 识图 + 发布向导）
│   │   ├── calendar/         # 日历视图
│   │   ├── tickets/          # 我的票务
│   │   ├── me/               # 个人中心（含隐私弹窗）
│   │   └── agreement/        # 用户协议 / 隐私政策（内嵌版）
│   ├── custom-tab-bar/       # 悬浮胶囊自定义 TabBar
│   ├── utils/                # core / data / security / ai / pay 等模块
│   └── cloudfunctions/
│       └── larky-server/     # 云函数：AI / 登录 / 内容安全（GLM key 存这）
├── privacy-h5/               # 隐私协议 H5 静态页（部署到任意 HTTPS）
├── logo/                     # 品牌资产（The Spark mark + 9 SVG + PNG）
├── index.html                # 早期 HTML 原型 demo
└── extract-data.js           # 活动数据预处理脚本
```

---

## 🚀 快速开始 / Quick Start

### 1️⃣ 准备工作 / Prerequisites

- 微信开发者工具（Stable ≥ 1.06）👉 https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 已注册小程序账号（个人主体即可）
- 微信云开发已开通（推荐免域名白名单）
- 智谱 AI 账号（GLM-4.7-Flash / GLM-4V-Flash / GLM-4-Voice 免费额度）👉 https://open.bigmodel.cn

### 2️⃣ 导入项目 / Import

```
开发者工具 → 导入项目 → 选目录：miniapp/wxapp
填入 AppID：你的小程序 AppID（个人主体填自己的 wx 开头 ID）
后端服务：勾选「微信云开发」
```

### 3️⃣ 配置云函数 / Deploy Cloud Function

```bash
# 在开发者工具里：
右键 wxapp/cloudfunctions/larky-server
→ 「上传并部署：云端安装依赖」
```

部署完成后，**右键 → 云端测试**，输入：
```json
{ "action": "login" }
```
应返回 `{ "openid": "oXXX..." }`

### 4️⃣ 替换 GLM API Key / Add Your Key

编辑 `wxapp/cloudfunctions/larky-server/index.js`，第 23 行：
```js
const GLM_KEY = '你的智谱 API Key'
```
然后**重新上传部署**该云函数。

### 5️⃣ 部署隐私协议 H5 / Privacy Page

```bash
cd privacy-h5
# 任意静态托管即可：CloudStudio / Vercel / GitHub Pages / Nginx
# 必须 HTTPS，公网可访问
```

拿到 URL 后填到微信公众平台后台 → 设置 → 用户隐私保护指引。

### 6️⃣ 上传发布 / Publish

```
工具 → 上传 → 填版本号 1.0.0 + 项目备注
→ mp.weixin.qq.com → 版本管理 → 提交审核
```

---

## 🎨 视觉系统 / Design System

### 配色 / Palette

| 名称 Name | HEX | 用途 Usage |
|---|---|---|
| 电光紫 Violet | `#6C4DFF` | 主色 / 品牌色 |
| 珊瑚 Coral | `#FF5A36` | 强调 / GO 字样 / 关键按钮 |
| 柠檬绿 Lime | `#CFFF3D` | 高亮 / 选中状态 |
| 奶油 Cream | `#F7F2E9` | 背景 |
| 墨黑 Ink | `#1C1726` | 文字 / 描边 |

### Logo / Logo

- `logo/app-icon.svg` —— 应用图标（The Spark 四角星 + LarkyGO 锁版）
- `logo/symbol.svg` —— 单 mark 版（电光紫 + 珊瑚光点）
- `logo/larkygo-icon-144.png` —— 公众平台后台头像规格
- `logo/board.svg` —— 品牌板（5 色 + 4 锁版 + 应用展示）

---

## 🧠 技术栈 / Tech Stack

| 层 Layer | 技术 Tech |
|---|---|
| 客户端 Client | 微信小程序原生（WXML + WXSS + JS）· Custom TabBar |
| AI 大模型 AI | 智谱 GLM-4.7-Flash / GLM-4V-Flash / GLM-4-Voice |
| 后端 Backend | 微信云开发（wx-server-sdk + cloud.getWXContext）|
| 协议 Privacy | 静态 H5（无服务端，部署到任意 CDN）|
| 数据 Data | 内置 37 场预置活动 + 本地 storage（用户发布的活动）|

---

## 📋 4 大合规链路 / Compliance Checklist

- [x] ✅ 隐私协议 H5（部署 + 微信后台填写）
- [x] ✅ 微信登录（云调用免 AppSecret）
- [x] ✅ 微信支付（演示降级，可切商户号）
- [x] ✅ 内容安全（云调用 msgSecCheck + imgSecCheck，AI 输入输出双向检测）

---

## 🌟 12 城 / 12 Cities

🇨🇳 北京 · 上海 · 杭州 · 成都 · 深圳 · 广州 · 苏州 · 西安 · 南京 · 武汉 · 厦门 · 重庆

每城预置 3–5 场真实风格的活动（音乐节、徒步、美食、剧本游、脱口秀等）。

---

## 🛠 常见问题 / FAQ

<details>
<summary><b>Q: 开发者工具左侧看不到 cloudfunctions/larky-server 文件夹？</b></summary>

A: 三种方案：
1. **最有效**：开发者工具 → 关闭项目 → 重新"导入项目"指向 `miniapp/wxapp`（工具重新索引）
2. 工具内右键 `cloudfunctions` → 新建云函数 `larky-server` → 把本地三个文件覆盖进去
3. 用网页云开发控制台粘贴代码：https://console.cloud.tencent.com/tcb
</details>

<details>
<summary><b>Q: 手机预览扫码显示"当前网络不稳定"？</b></summary>

A: 这是微信系统级加载页：
1. 开发者工具 → 设置 → 代理 → **不使用任何代理**（VPN/Clash 会拦截）
2. 工具 → 清除缓存 → 全部清除 → 重新编译
3. 手机与电脑同一 WiFi，关手机 VPN，二维码 2 分钟过期需重新生成
4. 上传时若包体过大（>2MB），删掉 `logo/` 里的 PNG 备份或外链到 CDN
</details>

<details>
<summary><b>Q: 上传时被拒：未填写隐私协议？</b></summary>

A: 必须先在 mp.weixin.qq.com → 设置 → 用户隐私保护指引 填 H5 URL + 勾选收集项（openid / 用户发布内容 / 设备日志），否则审核必拒。
</details>

---

## 📜 协议 / License

MIT License —— 欢迎二次开发与商用，但请保留原作者署名。

---

## 💌 联系方式 / Contact

- 👤 Author: [Yichen Shen](https://github.com/tachikomaver2-ship-it)
- 📧 Email: ellacareer@outlook.com
- 🌟 项目地址: https://github.com/tachikomaver2-ship-it/miniapp

---

<p align="center">
  Made with ✦ in Hangzhou
</p>