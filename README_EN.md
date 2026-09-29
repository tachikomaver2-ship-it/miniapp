# LarkyGO · WeChat Mini Program

> 🎯 **GO OUT · PLAY NOW** — A bilingual entertainment discovery mini program for foreigners living in 12 Chinese cities. AI-powered event search, one-tap publishing, voice input, and poster OCR.

<p align="left">
  <a href="https://github.com/tachikomaver2-ship-it/miniapp/stargazers"><img src="https://img.shields.io/github/stars/tachikomaver2-ship-it/miniapp?style=for-the-badge&logo=github&color=FF5A36" alt="Stars"/></a>
  <a href="https://github.com/tachikomaver2-ship-it/miniapp/network/members"><img src="https://img.shields.io/github/forks/tachikomaver2-ship-it/miniapp?style=for-the-badge&logo=github&color=6C4DFF" alt="Forks"/></a>
  <a href="https://github.com/tachikomaver2-ship-it/miniapp/blob/main/LICENSE"><img src="https://img.shields.io/github/license/tachikomaver2-ship-it/miniapp?style=for-the-badge&color=CFFF3D" alt="License"/></a>
  <img src="https://img.shields.io/badge/wechat-miniprogram-1AAD19?style=for-the-badge&logo=wechat&logoColor=white" alt="WeChat Mini Program"/>
  <img src="https://img.shields.io/badge/version-1.0.0-1C1726?style=for-the-badge" alt="Version"/>
</p>

[🇨🇳 中文文档](./README.md) · [🇬🇧 English Docs](./README_EN.md)

---

## ✨ Highlights

| Feature | Description |
|---|---|
| 🤖 **AI Event Finder** | GLM-4.7-Flash conversational search — ask "any music events in Beijing this week?" and get instant matches |
| 🎤 **Voice Input** | Hold to speak → end-to-end transcription (GLM-4-Voice) → auto-send, effortless event publishing |
| 📷 **Poster OCR** | Upload a poster → GLM-4V-Flash auto-extracts title/time/venue/ticket info |
| 🌐 **Bilingual UI** | 12 cities × 5 categories fully bilingual with seamless EN ⇄ ZH switch |
| 🏙️ **12 Chinese Cities** | Beijing · Shanghai · Hangzhou · Chengdu · Shenzhen · Guangzhou · Suzhou · Xi'an · Nanjing · Wuhan · Xiamen · Chongqing |
| ✦ **Neo-Pop Design** | Cream base × bold outlines × hard shadows × sticker palette (Violet #6C4DFF × Coral #FF5A36 × Lime #CFFF3D) |
| 🔒 **Compliance Ready** | Privacy H5 + WeChat Login + Payment (demo) + Content Security (cloud-side) — all four chains complete |
| ☁️ **Zero-Key Frontend** | GLM API key stored only in cloud function `larky-server` — frontend ships zero secrets, safe to publish |

---

## 📂 Project Structure

```
miniapp/
├── wxapp/                    # WeChat Mini Program native project
│   ├── app.js                # Cloud init / global data / privacy auth
│   ├── app.json              # 8 pages + custom TabBar config
│   ├── config.js             # Cloud mode switch / model names / debug params
│   ├── pages/                # 8 pages
│   │   ├── index/            # Home (event plaza)
│   │   ├── list/             # Event list (filter by category/city)
│   │   ├── detail/           # Event detail + booking
│   │   ├── chat/             # AI Chat (voice + OCR + publish wizard)
│   │   ├── calendar/         # Calendar view
│   │   ├── tickets/          # My tickets
│   │   ├── me/               # Profile (with privacy popup)
│   │   └── agreement/        # Terms & Privacy (embedded version)
│   ├── custom-tab-bar/       # Floating capsule custom TabBar
│   ├── utils/                # core / data / security / ai / pay modules
│   └── cloudfunctions/
│       └── larky-server/     # Cloud function: AI / login / content safety
├── privacy-h5/               # Privacy H5 static page (deploy anywhere over HTTPS)
├── logo/                     # Brand assets (The Spark mark + 9 SVGs + PNGs)
├── index.html                # Early HTML prototype demo
└── extract-data.js           # Event data preprocessing script
```

---

## 🚀 Quick Start

### 1️⃣ Prerequisites

- WeChat DevTools (Stable ≥ 1.06) 👉 https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- Registered Mini Program account (individual developer is fine)
- WeChat Cloud Development enabled (recommended, no domain whitelist needed)
- Zhipu AI account (GLM-4.7-Flash / GLM-4V-Flash / GLM-4-Voice free tier) 👉 https://open.bigmodel.cn

### 2️⃣ Import

```
DevTools → Import Project → Directory: miniapp/wxapp
AppID: your wx… ID (individual developer's own)
Backend: check "WeChat Cloud Development"
```

### 3️⃣ Deploy Cloud Function

```bash
# In DevTools:
Right-click wxapp/cloudfunctions/larky-server
→ "Upload and Deploy: Cloud Install Dependencies"
```

After deployment, **right-click → Cloud Test** with input:
```json
{ "action": "login" }
```
Expected: `{ "openid": "oXXX..." }`

### 4️⃣ Add Your GLM API Key

Edit `wxapp/cloudfunctions/larky-server/index.js`, line 23:
```js
const GLM_KEY = 'your Zhipu API key here'
```
Then **re-upload** this cloud function.

### 5️⃣ Deploy Privacy H5

```bash
cd privacy-h5
# Any HTTPS static hosting: CloudStudio / Vercel / GitHub Pages / Nginx
```

After deploy, fill it at mp.weixin.qq.com → Settings → User Privacy Protection Guidelines.

### 6️⃣ Publish

```
Tool → Upload → Set version 1.0.0 + notes
→ mp.weixin.qq.com → Version Mgmt → Submit for Review
```

---

## 🎨 Design System

### Palette

| Name | HEX | Usage |
|---|---|---|
| Violet | `#6C4DFF` | Primary / brand |
| Coral | `#FF5A36` | Accent / "GO" lettering / primary CTAs |
| Lime | `#CFFF3D` | Highlight / selected state |
| Cream | `#F7F2E9` | Background |
| Ink | `#1C1726` | Text / outlines |

### Logo

- `logo/app-icon.svg` — App icon (The Spark 4-point star + LarkyGO lockup)
- `logo/symbol.svg` — Mark only (violet + coral dot)
- `logo/larkygo-icon-144.png` — WeChat MP backend avatar spec
- `logo/board.svg` — Brand board (5 colors + 4 lockups + app showcase)

---

## 🧠 Tech Stack

| Layer | Tech |
|---|---|
| Client | WeChat Mini Program native (WXML + WXSS + JS) · Custom TabBar |
| AI Models | Zhipu GLM-4.7-Flash / GLM-4V-Flash / GLM-4-Voice |
| Backend | WeChat Cloud Development (wx-server-sdk + cloud.getWXContext) |
| Privacy | Static H5 (no server, deploy to any CDN) |
| Data | 37 preset events + local storage (user-published events) |

---

## 📋 Compliance Checklist

- [x] ✅ Privacy H5 (deployed + filled in WeChat backend)
- [x] ✅ WeChat Login (cloud-side, no AppSecret in app)
- [x] ✅ WeChat Pay (demo fallback, switch to your merchant ID)
- [x] ✅ Content Security (cloud-side msgSecCheck + imgSecCheck, AI input/output both)

---

## 🌟 12 Cities

🇨🇳 Beijing · Shanghai · Hangzhou · Chengdu · Shenzhen · Guangzhou · Suzhou · Xi'an · Nanjing · Wuhan · Xiamen · Chongqing

Each city comes with 3–5 preset events (music festivals, hiking, food crawls, murder mystery, stand-up, etc.).

---

## 🛠 FAQ

<details>
<summary><b>Q: DevTools doesn't show cloudfunctions/larky-server folder?</b></summary>

A: Three fixes:
1. **Most reliable**: Close project → re-import pointing to `miniapp/wxapp` (DevTools re-indexes)
2. In DevTools right-click `cloudfunctions` → New cloud function `larky-server` → overwrite with local files
3. Use web console: https://console.cloud.tencent.com/tcb
</details>

<details>
<summary><b>Q: Phone preview shows "current network unstable"?</b></summary>

A: This is WeChat's system-level loading page (code package failed to download):
1. DevTools → Settings → Proxy → **Direct Connection** (no proxy/VPN interception)
2. Tools → Clear Cache → Clear All → Recompile
3. Phone + computer on same WiFi, phone VPN off, QR expires in 2 min — regenerate
4. If package too large (>2MB), remove `logo/` PNG backups or external-link them via CDN
</details>

<details>
<summary><b>Q: Upload rejected: privacy policy not filled?</b></summary>

A: You must fill mp.weixin.qq.com → Settings → User Privacy Protection Guidelines first (H5 URL + checkbox collect items: openid / user-published-content / device logs), otherwise review will reject immediately.
</details>

---

## 📜 License

MIT License — Free for use and commercial, please keep original author credit.

---

## 💌 Contact

- 👤 Author: [Yichen Shen](https://github.com/tachikomaver2-ship-it)
- 📧 Email: ellacareer@outlook.com
- 🌟 Project: https://github.com/tachikomaver2-ship-it/miniapp

---

<p align="center">
  Made with ✦ in Hangzhou
</p>