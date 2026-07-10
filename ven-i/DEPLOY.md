# Worker 自動部署 · 一次性設定

`ven-i/worker.js`(問易解卦 + 八態伴讀 共用的 AI 代理)現在會由 GitHub Action
自動部署到 Cloudflare。你只需要做一次以下設定,之後每次改 `worker.js` push 到
main,就自動上線,不用再手動貼。

## 你要做的兩件事

### 1. 產生 Cloudflare API Token

1. Cloudflare Dashboard → 右上頭像 → **My Profile** → **API Tokens**
2. **Create Token** → 用範本 **Edit Cloudflare Workers**(或自訂,權限含
   Account · Workers Scripts · Edit)
3. 建好後複製那串 token(只會顯示一次)

順便記下 **Account ID**:Dashboard 右側欄,或 Workers & Pages 頁都看得到。

### 2. 把兩個值加進 GitHub Repo Secret

GitHub repo → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**,新增兩個:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 上一步產生的 token |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Account ID |

加完就結束了。

## 之後怎麼運作

- 改 `ven-i/worker.js` → push 到 main → Action 自動部署 → 線上生效。
- 也可到 repo **Actions** 分頁 → **Deploy ven-i Worker** → **Run workflow** 手動觸發
  (第一次設好 secret 後想立刻部署,就用這個)。

## 注意

- **Secret 保留**:`ANTHROPIC_API_KEY` 是 Worker 的 Secret,自動部署不會動它,免重設。
- **KV 綁定會被覆寫**:若你有在 Dashboard 手綁 `RATE_LIMIT` / `FEEDBACK`,
  請到 `wrangler.toml` 填上它們的 id 並解除註解——否則部署會把綁定移除。
  (沒綁也能跑,只是沒有限流 / 不落檔回饋摘要。)
- **Worker 名字別改**:`wrangler.toml` 的 `name = "calm-sunset-97f8"` 對應線上網址,
  改名會變成部署到另一顆新 Worker。
