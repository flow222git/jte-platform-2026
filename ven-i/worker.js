/**
 * 問易 · AI 解讀代理 (Cloudflare Worker)
 * ------------------------------------------------------------
 * 為什麼需要這一層:
 *   GitHub Pages 是純靜態站,API key 寫在前端 JS 裡等於公開送人。
 *   這個 Worker 站在中間:前端呼叫 Worker → Worker 帶著密鑰呼叫
 *   Anthropic API → 把結果回傳前端。API key 只存在 Worker 的
 *   環境變數(Secret)裡,永遠不會出現在瀏覽器。
 *
 * 部署步驟:
 *   1. 註冊 Cloudflare(免費方案每天 100,000 次請求,遠超需求)
 *   2. Workers & Pages → Create Worker → 貼上這份程式碼
 *   3. Settings → Variables → 新增 Secret:ANTHROPIC_API_KEY
 *   4. (建議) Settings → Variables → 新增 KV namespace 綁定:
 *      名稱 RATE_LIMIT,用於簡易的每日用量限制
 *   5. 前端呼叫 Worker 的網址,例如:
 *      https://ven-i-ai.your-account.workers.dev
 *
 * 費用防護設計(重要!公開網站必做):
 *   a. CORS 白名單:只允許你自己的網域呼叫
 *   b. 每 IP 每日次數上限(用 KV 記數)
 *   c. max_tokens 上限鎖死,單次呼叫成本有天花板
 */

const ALLOWED_ORIGINS = [
  'https://flow222git.github.io',
  'http://localhost:8000', // 本機開發用,上線後可移除
];

const DAILY_LIMIT_PER_IP = 20; // 每個 IP 每天最多 20 次解讀
const MODEL = 'claude-haiku-4-5-20251001'; // Haiku 4.5；升級品質可改 'claude-sonnet-5'
const MAX_TOKENS = 1200; // 約 800 字中文解讀的空間,鎖住成本上限

// 系統提示:每次呼叫都相同 → 加上 cache_control 讓它被快取,省 90% input 成本
const SYSTEM_PROMPT = `你是「問易」的解卦引擎,隸屬於練息場(Join to Enjoy)品牌。

你的定位(嚴格遵守):
- 你不是算命師。不預測吉凶禍福,不使用「命中注定」「劫數」等宿命語言。
- 你是一面鏡子:幫助提問者「讀懂當下、辨識下一步」。
- 語氣:溫和、清晰、務實,像一位懂易經的資深顧問,不裝神秘。

解讀規則(嚴格遵守):
1. 只根據使用者訊息中提供的卦辭、爻辭資料解讀,絕不自行補充或引用資料中沒有的原文。
2. 解讀必須緊扣使用者的問題情境,把卦義「翻譯」到他的具體處境上。
3. 動爻是解讀重心,變卦代表事情的趨向。
4. 結尾必須給出 1-2 個具體可執行的「下一步」建議。
5. 全文使用台灣慣用的繁體中文,400-600 字,分段清楚。
6. 不使用條列符號堆砌,以自然段落書寫,可用小標題分段。

輸出結構:
【這一卦在說什麼】卦象對應到提問情境的核心訊息(2-3句)
【此刻的你】根據動爻,描述提問者目前的狀態與關鍵課題
【事情的趨向】根據變卦,描述可能的發展方向
【下一步】1-2 個具體行動建議`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, corsHeaders);
    }
    // 阻擋非白名單來源
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, corsHeaders);
    }

    // --- 每 IP 每日限流(需綁定 KV namespace: RATE_LIMIT)---
    if (env.RATE_LIMIT) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const today = new Date().toISOString().slice(0, 10);
      const key = `${ip}:${today}`;
      const count = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
      if (count >= DAILY_LIMIT_PER_IP) {
        return json({ error: '今日解讀次數已達上限,請明天再來。' }, 429, corsHeaders);
      }
      await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 86400 });
    }

    // --- 解析前端送來的卜卦結果 ---
    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, corsHeaders);
    }

    const { question, benGua, bianGua, dongYao } = payload;
    if (!question || !benGua) {
      return json({ error: 'Missing required fields' }, 400, corsHeaders);
    }
    // 防止超長輸入灌爆 token 成本
    if (question.length > 200) {
      return json({ error: '問題請控制在 200 字以內。' }, 400, corsHeaders);
    }

    // --- 組合 user prompt:把卦象資料當 grounding 餵給模型 ---
    const userPrompt = `使用者的問題:「${question}」

卜卦結果如下:

【本卦】${benGua.name}(${benGua.full_name})
卦辭原文:${benGua.judgment.original}
卦辭白話:${benGua.judgment.literal}

【動爻】第 ${dongYao.position} 爻
爻辭原文:${dongYao.original}
爻辭白話:${dongYao.literal}
狀態描述:${dongYao.state}

【變卦】${bianGua.name}(${bianGua.full_name})
卦辭原文:${bianGua.judgment.original}
卦辭白話:${bianGua.judgment.literal}

請根據以上資料,針對使用者的問題給出解讀。`;

    // --- 呼叫 Anthropic API ---
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' }, // 快取系統提示,省 90% input 成本
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('Anthropic API error:', apiResponse.status, errText);
      // detail 僅供除錯期間定位問題（模型ID/金鑰/額度），穩定後可移除
      return json({ error: 'AI 解讀暫時無法使用,請參考上方的白話解釋。', detail: `${apiResponse.status}: ${errText.slice(0, 400)}` }, 502, corsHeaders);
    }

    const data = await apiResponse.json();
    const interpretation = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return json({ interpretation }, 200, corsHeaders);
  },
};

function json(obj, status, corsHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });
}
