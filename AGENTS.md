# 專案環境相容性與開發準則 (Project Environment Guidelines)

此指令文件定義了本系統開發時，為了相容於「老舊的 Android 電子看板 (Chromium 95以下) 或者功能被限縮的 WebView 環境」，所有新專案網頁開發時**必須強制遵守**的技術規格。

本開發指引針對的硬體痛點：
- 老舊 Chromium 核心不支援最新的現代 CSS (無法解析 `@layer`)，導致網頁樣式徹底裸奔失效。
- Kiosk/Signage 特製化瀏覽器可能受限於憑證或環境 (HTTPContext)，導致現代 JS API 報錯崩潰。
- 電視螢幕實際可用高度 (Viewport Height) 比標準筆電還要短，容易發生垂直溢出的裁切現象。

---

## ⚠️ 核心技術規格限制 (CRITICAL CONSTRAINTS)

### 1. 禁用 Tailwind CSS v4 (必須使用 v3)
專案建構時：
- **禁止使用** `@tailwindcss/vite` 套件。
- **必須使用** Tailwind CSS v3 架構（透過 `postcss` 配置）。
- **必須建立** 標準的 `tailwind.config.js` 與 `postcss.config.js` 檔案，確保在建構時期就能將 CSS 的層級和語意全部扁平化 (Flattening) 為純粹的、保底的通用 CSS 表。
- `index.css` 的寫法只能用 `@tailwind base; @tailwind components; @tailwind utilities;`，絕對禁用 `@import "tailwindcss";` 與 `@theme` 語法。

### 2. 嚴禁使用依賴安全環境的 Web API
- **禁止使用 `crypto.randomUUID()`** 或任何依賴 `window.crypto` 的最新標準。
  - 因為老舊的 Android 播放盒子有可能工作於不安全的情境，調用此 API 會讓整個線程崩潰 (Crash)。
- **替代方案：** 要產生唯一 ID，**必須**使用傳統的 Fallback 寫法，例如 `Math.random()` 搭配 `Date.now()` 的字串拼接。
  ```javascript
  // REQUIRED:
  const safeId = `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  ```

### 3. 排版與高度保護原則 (Anti-Overflow Layout)
設計網頁尺寸時，不能以主流 16:9 筆電的畫面塞滿為基準。在實體大尺寸數位電視上會因為螢幕實際可顯示區域吃緊，而有畫面上下端被「削頭削尾」的風險。
- **安全距離 (Safe Area)：** 主要或清單類的容器，切忌不要將高度 (100vh) 卡得太緊。垂直間距 (Vertical Padding) 需預留安全空間（例如：盡量減少 `py-8`，改用 `py-4`）。
- **慎用強制對齊：** 當內容物具備延展性時，謹慎使用會強迫兩邊頂破容器的 `content-center`，需要預留適當的內容溢出 (Overflow) 的隱藏保護。
