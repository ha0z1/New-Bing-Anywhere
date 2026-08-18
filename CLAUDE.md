# AA-WWW（tmux.online）

AI Anywhere 的官網。Astro 靜態站，部署在 Cloudflare Workers 靜態資源上。本站自身無後端；帳號與裝置授權服務跑在 `api.tmux.online`（倉庫在 `../AA-Server`）。

## 紅線（必須遵守）

- **commit message 裏不得出現 `Claude` / `AI` 生成標記**：不加 `Co-Authored-By: Claude*`、不加 `Generated with Claude Code` 之類尾註。message 只描述變更本身。
- **不得提交或上傳任何憑據**：API token、Cloudflare/GitHub cookie、`.env`、`~/.wrangler` 下的 OAuth 憑證，一律不進倉庫、不寫進代碼、不貼進 issue/PR。部署憑據只走 `wrangler login` 的本地態或 GitHub repository secrets。`.gitignore` 擋得住文件，擋不住手滑寫進源碼——提交前自己過一眼 `git diff`。
- **改完必須 `pnpm lint` 通過**才算完成。

## 常用命令

```bash
pnpm dev / build / preview
pnpm lint       # prettier --check . && astro check（提交前必跑）
pnpm format
pnpm images     # 重新生成 og.png 和各尺寸圖標
pnpm deploy     # astro build && wrangler deploy
```

指向本地 API 開發：`PUBLIC_API_URL=http://localhost:51994 pnpm dev`。

## 架構

- **`src/i18n/`** 是文案的唯一真相源，英文是基準、其餘語言是同構的數據文件。頁面、JSON-LD、`llms.txt` 全從它推導。組件裏不寫文案字面量，加語言是加數據不是改頁面。
- **營銷頁零框架字節**。全部頁面構建時預渲染，客戶端邏輯是幾段 `<script is:inline>`。
- **`/dashboard/*` 是唯一水合的地方**，一個 react-router SPA 掛在預渲染的靜態外殼上。`/account`、`/device` 只是靜態兼容跳轉。
- **`worker/index.js` 是唯一的服務端代碼**：origin 規範化、私有派發後台 HTML、修 404。其餘全部走 Workers 靜態資源 + `public/_headers`。

## 約定（都是踩過的坑，別回退）

- **不用 `ClientRouter` / view transitions**，它會給每個頁面注入客戶端 router，毀掉營銷頁零 JS。改完用 `grep -c astro-island dist/index.html` 核對（應為 0）。
- **Header 絕不能 import `src/lib/api.ts`**：它在落地頁上也渲染，import 會把 React 和島嶼 bundle 一起拖上去，只爲決定一個鏈接的文字。它自己發 fetch 並把 promise 掛在 window 上供島嶼復用。
- **島嶼的樣式不能用 scoped**：Astro 的作用域靠給自己產出的元素打 data 屬性，React 渲染的 DOM 拿不到。島嶼樣式走 `src/styles/*.css`，從 `.tsx` 裏 import。
- **URL 一律不帶尾斜槓**，Astro 與 wrangler 兩邊的配置是一對；canonical、hreflang、sitemap 必須都是這個形態。
- **`/dashboard/*`、`/account`、`/device` 必須保持 noindex**，四處都要有：頁面 `<head>`、`_headers`、sitemap filter、Worker 派發後台 HTML 時的響應頭。設備授權 URL 帶一次性設備碼。
- **設備碼授權的順序不能動**：`GET /api/auth/device` 是唯一把設備碼綁定到用戶的動作，且必須帶著 session cookie 發。跳過它 approve 會以一個看不懂的 400 失敗。改動前讀 `../AA-Server/docs/frontend-integration.md`。
- **暗色單一主題**，綠色取樣自 tmux wordmark（tmux 沒有官網，logo 就是全部品牌）。中性色刻意保持中性而非板岩藍，否則跟綠互斥。
- **綠底上的文字一律用 `var(--on-accent)`，不准用白色**。白字在那個綠上只有 2.62:1，不及格。
- **hero 標語不翻譯**，它是品牌的一部分，`<h1>` 上帶 `lang="en"` 保住拉丁字距。
- **CJK 排版覆蓋集中在 `global.css` 底部的 `:lang()` 塊**：拉丁字體的負字距和行高對漢字是災難，`ch` 在 CJK 裏是半個 em。新增非拉丁語言先看這裏。
- **star 數是寫死的 fallback + 客戶端刷新**，不在構建時抓：GitHub 未認證 API 是 60/hr/IP，CI 共用一個 IP 常被限流，訪客的瀏覽器不會。偶爾手動更新一下這個數。
- **og.png 離線生成並提交**（`pnpm images`），不進構建流程——CI 換台機器字體不同社交卡片就會變形。
- **分析默認拒絕**，用戶在橫幅上明確同意才升級。不要為了數據好看改默認值。
- **`public/install.sh` 由核心倉庫的發布流水線同步過來**，改它之前先確認是不是該去那邊改。
- **目前沒有 CSP**。哪天加了要照顧到 `api.tmux.online`、滿地的 `is:inline` 腳本和 GA4。

## 代碼風格

prettier：無分號、單引號、兩空格、printWidth 140、trailingComma all。不用 `prettier-ignore` 繞開。TypeScript 走 `astro/tsconfigs/strict`；`worker/` 是純 JS，已從 tsconfig 排除。

## 部署

Cloudflare Workers 靜態資源（不是 Pages），`tmux.online` 和 `www.tmux.online` 都是 custom domain。CI 只在版本 tag（`v1.2.3`）上部署，外加手動 `workflow_dispatch`。需要 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` 兩個 repository secret——**不要寫進任何文件**。
