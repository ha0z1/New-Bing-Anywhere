# AA-WWW（tmux.online）

AI Anywhere 的純靜態官網，Astro 構建，部署在 Cloudflare Workers 靜態資源上。沒有框架運行時、**產物裏一個 JS bundle 都沒有**（`dist/_astro/` 只有 CSS），全部客戶端邏輯都是幾段 `<script is:inline>`。

本站自身無後端。帳號與裝置授權服務跑在 `api.tmux.online`（倉庫在 `../AA-Server`），服務 `/dashboard/*` 與 CLI 登入流程。

## 紅線（必須遵守）

- **commit message 裏不得出現 `Claude` / `AI` 生成標記**：不加 `Co-Authored-By: Claude*`、不加 `Generated with Claude Code` 之類尾註。message 只描述變更本身。
- **不得提交或上傳任何憑據**：API token、Cloudflare/GitHub cookie、`.env`、`~/.wrangler` 下的 OAuth 憑證，一律不進倉庫、不寫進代碼、不貼進 issue/PR。部署憑據只走 `wrangler login` 的本地態或 GitHub repository secrets。`.gitignore` 已擋掉 `.env*` 和 `.wrangler/`，但擋不住手滑寫進源碼——提交前自己過一眼 `git diff`。
- **改完必須 `pnpm lint` 通過**才算完成。

## 常用命令

```bash
pnpm dev        # http://localhost:4321
pnpm build      # → dist/
pnpm preview    # 起本地服務跑 dist/
pnpm lint       # prettier --check . && astro check（提交前必跑）
pnpm format     # prettier --write .
pnpm images     # 重新生成 public/og.png 和各尺寸圖標
pnpm deploy     # astro build && wrangler deploy
```

## 結構

```
src/i18n/en.ts              全站文案，英文（唯一真相源）
src/i18n/zh-Hant.ts         同一個對象，繁體中文
src/i18n/index.ts           locale 表、路徑助手、og:locale 映射
src/lib/llms.ts             llms.txt / llms-full.txt 的內容，由文案表生成
src/lib/api.ts              賬號 API 的類型化客戶端，只被島嶼 import
src/lib/icons.ts            圖標路徑表，Icon.astro 和 islands/Icon.tsx 共用
src/components/Home.astro   整個落地頁，按 locale 參數化
src/components/Schema.astro  JSON-LD，同樣由文案表生成
src/components/Dashboard.astro   /dashboard/*：側邊欄與預渲染外殼
src/components/RouteRedirect.astro  /account、/device 的兼容跳轉
src/islands/AccountPanel.tsx     React：登錄態、裝置、API key、會員
src/islands/DevicePanel.tsx      React：設備碼授權
src/styles/auth.css              島嶼的全局樣式
src/pages/index.astro       /          → <Home lang="en" />
src/pages/dashboard/        /dashboard/* → 各後台能力（noindex）
src/pages/account.astro     /account   → /dashboard/devices 兼容跳轉
src/pages/device.astro      /device    → /dashboard/device 保留 query 的兼容跳轉
src/pages/zh-Hant/          /zh-Hant   → 首頁與後台的繁中版
public/install.sh           https://tmux.online/install.sh（當前是佔位腳本）
public/_headers             CF 響應頭（content-type、緩存、X-Robots-Tag）
worker/index.js             唯一的服務端代碼：www → apex 的 301
wrangler.jsonc              Workers 靜態資源配置
```

## 約定

- **組件裏不寫任何文案字面量**，全部進 `src/i18n/*.ts`。加語言就是加一份數據文件，不是重寫頁面。SEO 的 JSON-LD、llms.txt 也都從這張表推導，改文案不會出現「頁面說 A、結構化數據說 B」。
- **英文是缺省語言、不帶前綴**（`/`），其他語言帶前綴（`/zh-Hant`，末尾不帶斜槓，canonical / hreflang / sitemap 要指向同一個 URL），locale 代碼跟 app 保持一致（用 `zh-Hant` 不用 `zh-TW`）。語言切換器在只有一種語言時自動隱藏。
- **hero 標語不翻譯**，它是品牌的一部分；那個 `<h1>` 上帶 `lang="en"`，好讓它在中文頁裏仍用拉丁字母的字距和行高。
- **語言寫進根域 cookie `L`**（`L=zh-Hant`，`domain=.tmux.online`、`path=/`、一年、`SameSite=Lax`），供根 `/device` 兼容入口、裸 `/` 首頁與 tmux.online 下的其他服務讀取。在客戶端寫（`src/components/LangCookie.astro`），不從 Worker 發 `Set-Cookie`——帶 Set-Cookie 的響應在邊緣不可緩存。裸 `/` 會先按合法的非英文 `L` 跳到對應首頁，再寫入當前語言；語言連結則在導航前先同步更新 `L`，確保仍能主動切回 English。其餘頁面只由 URL 決定渲染語言；未知或缺失值一律回退英文。
- **CJK 的排版覆蓋集中在 `global.css` 底部的 `:lang()` 塊**：拉丁字體的負字距和 1.08 行高對漢字是災難；`ch` 在中日韓字體裏是半個 em，所以所有 `ch` 寬度都乘 `--measure-scale`。新增非拉丁語言時先看這一塊。
- **圖標一律內聯 SVG**（路徑表在 `src/lib/icons.ts`，24px 網格、1.5px 描邊；`.astro` 用 `Icon.astro`、島嶼用 `islands/Icon.tsx`，兩者讀同一張表），不用 emoji 代替圖標，不引圖標字體。
- **只有 `/dashboard/*` 水合**。全部頁面都是構建時預渲染的 HTML，React 只接管這些有狀態的界面。`/account` 和 `/device` 只保留靜態兼容跳轉。營銷頁必須一個框架字節都不發——改完用 `grep -c astro-island dist/index.html`（應為 0）核對。
- **島嶼的樣式不能用 scoped**：Astro 的 `<style>` 靠給 `.astro` 自己產出的元素打 data 屬性來作用域化，而 React 渲染的 DOM 拿不到那個屬性。島嶼樣式放 `src/styles/auth.css`，從 `.tsx` 裏 import，這樣只會被水合的頁面拉取。
- **Header 絕不能 import `src/lib/api.ts`**：它在落地頁上也渲染，import 會把島嶼 bundle 連同 React 一起拖上去，只爲決定一個鏈接的文字。它自己發 fetch，並把 promise 掛在 `window.__aaSession` 上，`getSession()` 復用它——否則賬號頁會把 session 請求兩遍。
- **頭部賬號入口是固定 30px 圓**：未登錄一個用戶圖標、登錄後頭像填滿，兩態同寬所以 session 回來不會讓導航欄回流。暱稱、郵箱、Dashboard 入口與登出都放在頭像的 hover / click 浮層裏。身份與頭像緩存在 `localStorage['aa_avatar']`，刷新時先樂觀畫出來、session 回來再對賬（登出則還原成圖標並清緩存）。
- **GitHub star 數是構建時寫死的 fallback（`GITHUB_STARS_FALLBACK`）+ 客戶端刷新**：不在構建時抓，GitHub 未認證 API 是 60/hr/IP，CI 共用一個 IP 常被限流，訪客各自的瀏覽器不會。fallback 佔住寬度，刷新到相近值不回流；偶爾手動更新一下這個數別讓它漂太遠。
- **暗色單一主題，色板跟 tmux 品牌對齊**（`--accent: #1bb91f`、`--bg: #070907`），定義在 `src/styles/global.css` 的 `:root`。那個綠是直接從 tmux wordmark 取樣的；tmux 沒有自己的官網可參照（`tmux.github.io` 是個跳轉到 wiki 的 302），logo 就是全部品牌。中性色刻意保持**中性**而非板岩藍，否則會跟綠色互斥。
- **綠底上的文字一律用 `var(--on-accent)`，不准用白色**。白字在 `#1bb91f` 上只有 2.62:1，直接不及格；`--on-accent`（頁面底色）是 7.6:1，而且正是 tmux 標識自己的讀法——綠色底承載深色形狀。新增任何 accent 底的元素時照這條走。
- **og.png 是離線生成並提交的**（`pnpm images`），不進構建流程——CI 換台機器字體不同社交卡片就會變形。
- `public/install.sh` 目前是**佔位腳本**，什麼都不裝、exit 1。真腳本就緒後整份替換即可，`_headers` 已按 `text/plain` + 5 分鐘緩存伺服。

## 賬號與裝置授權

- **不引 better-auth 客戶端庫**。那些端點本來就是普通 HTTP，一個類型化的 `src/lib/api.ts` 比一個依賴更好推理。改動前先讀 `../AA-Server/docs/frontend-integration.md`，那是這份實現對應的契約。
- **帳號是必需的**：每台電腦先經 `ai-anywhere login` 授權，`up` 才能啟動。`src/lib/llms.ts` 裏有一段**硬編碼的英文散文**（唯一一處文案不在 i18n 表裏的地方），改帳號相關措辭時它要同步改。
- **`/dashboard/*`、`/account` 和 `/device` 必須保持 noindex**：`<Base noindex>`（同時會跳過 JSON-LD 和 hreflang）、`public/_headers`、`astro.config.mjs` 的 sitemap `filter`，三處都要有。設備授權 URL 上帶一次性設備碼，尤其不能進索引。
- **設備碼授權的順序不能動**：`GET /api/auth/device` 是唯一把設備碼綁定到用戶的動作，且只有在該請求帶著 session cookie 時才算數。跳過它，approve 就會以一個看不懂的 400 失敗。better-auth 文檔裏那個 `/login?redirect=` 路由是 Next.js 的示例，不是庫的要求——這個端點返回 JSON，從不重定向。批准成功後等待 3 秒，再返回同語言的 `/dashboard/devices`。
- **cookie 不需要任何特殊配置**：tmux.online 和 api.tmux.online 同 site，默認的 host-only `SameSite=Lax` cookie 本來就跟著帶憑據的 fetch 走。但 `credentials: 'include'` 仍然必須寫——跨源 fetch 默認不帶 cookie，跟 SameSite 無關。
- **本站目前沒有 CSP**。哪天加了，`connect-src` 必須包含 `https://api.tmux.online`，否則這兩頁會靜默失效。

## 代碼風格

- prettier：**無分號、單引號、兩空格縮進**、printWidth 140、trailingComma all。配置在 `.prettierrc.json`，不要在單個文件裏用 `prettier-ignore` 繞開。
- TypeScript 走 `astro/tsconfigs/strict`；`worker/` 是純 JS，已從 tsconfig 的 include 裏排除。

## 部署

Cloudflare Workers 靜態資源（不是 Pages）。`wrangler.jsonc` 把 `tmux.online` 和 `www.tmux.online` 都聲明為 custom domain，首次部署會自己建 DNS 記錄和域名綁定。

`worker/index.js` 只做一件事：`www` 301 到 apex。zone 級 Redirect Rule 更省，但需要 `zone:write`，wrangler 的 OAuth token 沒有這個 scope。因此開了 `run_worker_first`，每個請求都會走一次 Worker 調用；哪天想換回純靜態，在 dashboard 建條 Redirect Rule，然後把 `main` / `run_worker_first` / `binding` 三行刪掉。

CI 需要兩個 repository secret：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。**不要寫進任何文件。**
