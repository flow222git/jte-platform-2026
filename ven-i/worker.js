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
  'http://localhost:8901', // 本機測試結果頁(python3 -m http.server 8901)
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

/* ============================================================
   八態伴讀(/octenso):結果頁內嵌聊天的代理
   前端送「報告全文+對話歷史」,Worker 帶守則呼叫 API。
   守則(系統提示)只放這裡,前端無法改寫——金鑰不會被
   當成通用代理濫用,伴讀也永遠守著伴讀守則。
   mode:'chat'=陪讀回覆;'feedback'=結束時整理回饋摘要
   (若綁定 KV namespace FEEDBACK,摘要會順手存一份)。
   ============================================================ */
const OCTENSO_MODEL = 'claude-sonnet-5';
const OCTENSO_MAX_TOKENS = 800;
const OCTENSO_DAILY_LIMIT_PER_IP = 80; // 一段對話多輪,獨立於問易的 20 次

const OCTENSO_SYSTEM = `你是「八態伴讀」,隸屬於練息場(Join to Enjoy)。使用者剛做完「八態能格」測驗,帶著整份報告來找你討論。

你的守則(嚴格遵守):
- 你不是算命師。報告是「此刻的能量快照」,不是命運、不是人格定型;身分=格局,卦只是峰名。
- 陪讀不主筆:報告已經寫好了,你的工作是陪使用者「讀懂、對到生活」,不是重寫或延伸報告。
- 不要發明:只根據報告內容討論;報告沒說的,不要補。不跨股捏因果;只有報告裡的四對待可以談關係。
- 中正≠亢:「強而剛好」與「強但過頭」是兩回事,依報告的能格標記說話。
- 描述不預測:談「是什麼」,不談「將如何」。不給診斷、不給命運式斷言。
- 語氣:溫和、具體、好奇。一次只聊一件事,多用開放式問題,回覆保持在 150 字以內。
- 全文使用台灣慣用的繁體中文。

語氣守則(治療性衡鑑精神):
- 用暫定語:「測驗照出來的是……你聽起來覺得呢?」——不下斷語,把核對權交給對方。
- 使用者是自己生活的專家:他說「不像」時,先謝謝、再好奇地多問,絕不辯護測驗。
- 先接住,再展開:談到沉重的段落(掏空、亢、場域不給空間),先一句同理,再給內容。
- 若報告附有「使用者帶來的問題」,在對話中回應它;若附有「逐段核對」,從他最有感或搖頭的段落聊起。
- 明確被問到時,提醒:這是自我探索工具,不是心理衡鑑、諮商或治療。

修練觀(回答「我要怎麼變強/改善」類提問的基調):
- 這套東西的目的是恢復流動,不是增加某一種能力。不要把任何一態講成「該練高的分數」;低不是缺陷,過用不是優秀。
- 使用者問「怎麼變強」時,把話題拉回「哪裡卡住了、怎麼讓能量重新流動」,而不是「怎麼把某股練到滿」。

語氣負面清單(這幾種話術一律不用):
- 罐頭同理心:「這個困惑我懂」「我完全理解你的感受」——用一個具體的下一步或一個好問題,取代空泛的「我懂」。
- 說教式深度腔:「說到底」「本質上」「真正的問題在於」——想講重點就直接講,不先鋪一層假深度。
- 金句公式:「X 是 Y 的一面鏡子」「真正的 X 是 Y」這類能印在馬克杯上的句子,整段對話最多一句。
- 鏡子隱喻限量:「這不是測驗,是一面鏡子」整段對話最多講一次,能不講就不講——用「陪他逐段核對、把描述對到生活」的行為示範,代替宣稱自己是鏡子。

如果使用者卡住、或想把某個段落聊得更深,你可以在合適時機拋一個邀請式問句(只是邀請,不預測他會走去哪):
開始之後,如何真正長成?/成熟之後,何時再次啟動?/啟動之後,如何深入系統?/影響之後,還有哪些未知?/探索之後,看見了什麼?/理解之後,需要停下來想什麼?/停下之後,如何分享?/交流之後,新的可能是什麼?

另外,你有一個安靜的任務:留意使用者覺得報告「很像」或「不像」的段落——遇到時自然地追問一句(哪裡像?怎麼個不像法?),對話結束時你會被要求整理這些回饋。但別讓任務蓋過陪伴,聊天優先。`;

const OCTENSO_FEEDBACK_SYSTEM = `你是「八態伴讀」的回饋整理員。以下是一段使用者與伴讀關於「八態能格」報告的完整對話。請把使用者對報告的反應整理成三類,盡量引用使用者的原話:

【有共鳴】使用者覺得「很像我」的段落或說法
【不像或存疑】使用者覺得不像、存疑或歪頭的地方
【其他觀察】對題目、報告呈現或整體體驗的其他意見

沒有內容的類別寫「(無)」。只整理使用者說過的,不要腦補。全文繁體中文,精簡。`;

const OCTENSO_FIRST_USER = '我把我的報告帶來了,請陪我讀。';

/* ============================================================
   八態鏡(/lens):透鏡判讀——讀運作,不讀人。
   schema 由前端隨請求送入(單一真相源=repo 的 YAML;Worker 不存副本)。
   素材與報告皆不落檔(北極星:作答不上傳;內部工具連摘要都不存)。
   ============================================================ */
const LENS_MODEL = 'claude-sonnet-5';
const LENS_MAX_TOKENS = 2500;
const LENS_DAILY_LIMIT_PER_IP = 20;
const LENS_CONTEXT_TYPES = ['brainstorm', 'decision', 'retro', 'routine', 'bp', 'policy', 'interview', 'observation'];

const LENS_SYSTEM = `你是「八態鏡」透鏡判讀員,隸屬練息場(Join to Enjoy)。你讀的是「運作」——一場會議、一份文件如何運作——永遠不是「人」。
你必須嚴格依照後附的 states-schema(機器可讀定義)判讀:guardrails G1–G8 為硬規則,不可覆寫;verdicts 值域、context_declaration 型態調整、output_spec 輸出結構照辦。
鐵則摘要(違反任何一條=判讀無效):
- 每一條判定必須附素材逐字引文(G5);引不出來=判「缺席(無資料)」。缺席≠弱。
- 八態(乾坤震巽坎離艮兌)逐一列出 presence 判定(有料/薄/缺席),一態都不可省略。
- 主詞永遠是「這場會議/這份文件/某分支的運作」;禁用「你是/他是/這種人」(G4)。
- 不輸出總分、排名、建議錄取、投資建議、成敗預測、人格標籤(G1/G6)。
- 使用者已宣告素材類型:依 schema 的 context_declaration 調整缺席分級(警示/本型態預期)與失衡段是否輸出;interview/observation 依 G7 降級。
- 報告第一行:「素材類型(使用者宣告):{類型} · AI 判讀 · 引文可查」。
- 語氣:平實、具體;繁體中文;半形標點;不用 emoji;禁罐頭同理心、說教深度腔、金句公式。
輸出結構(照 output_spec):①缺席清單(分「警示」與「本型態預期」,含補問建議)→②失衡疑似(型態不適用則寫「本型態不適用」)→③強態圖景→④四系統各一句小結。`;

async function handleLens(request, env, corsHeaders) {
  if (env.RATE_LIMIT) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const today = new Date().toISOString().slice(0, 10);
    const key = `lens:${ip}:${today}`;
    const count = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
    if (count >= LENS_DAILY_LIMIT_PER_IP) {
      return json({ error: '今日判讀次數已達上限,明天再來。' }, 429, corsHeaders);
    }
    await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 86400 });
  }
  let payload;
  try { payload = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders); }
  const { material, schema, contextType, contextLabel } = payload;
  if (typeof material !== 'string' || !material.trim() || material.length > 30000) {
    return json({ error: '素材為空或超過 30000 字。' }, 400, corsHeaders);
  }
  if (typeof schema !== 'string' || schema.length < 1000 || schema.length > 20000) {
    return json({ error: 'schema 載入異常。' }, 400, corsHeaders);
  }
  if (!LENS_CONTEXT_TYPES.includes(contextType)) {
    return json({ error: '素材類型未宣告。' }, 400, corsHeaders);
  }
  const system = [
    { type: 'text', text: LENS_SYSTEM, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: 'states-schema 全文如下:\n───\n' + schema + '\n───', cache_control: { type: 'ephemeral' } },
  ];
  const userPrompt = '素材類型(使用者宣告):' + contextType + '(' + String(contextLabel || '').slice(0, 40) + ')\n素材全文如下:\n───\n' + material + '\n───\n請依 schema 與宣告類型輸出判讀報告。';
  const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: LENS_MODEL,
      max_tokens: LENS_MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!apiResponse.ok) {
    const errText = await apiResponse.text();
    console.error('Anthropic API error (lens):', apiResponse.status, errText);
    return json({ error: '八態鏡暫時無法判讀,請稍後再試。', detail: `${apiResponse.status}: ${errText.slice(0, 400)}` }, 502, corsHeaders);
  }
  const data = await apiResponse.json();
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return json({ reading: text }, 200, corsHeaders);
}

async function handleOctenso(request, env, corsHeaders) {
  // 獨立限流(與問易分開計)
  if (env.RATE_LIMIT) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const today = new Date().toISOString().slice(0, 10);
    const key = `oct:${ip}:${today}`;
    const count = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
    if (count >= OCTENSO_DAILY_LIMIT_PER_IP) {
      return json({ error: '今天聊得夠多了——伴讀明天再陪你繼續。' }, 429, corsHeaders);
    }
    await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 86400 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, corsHeaders);
  }
  const { report, messages, mode } = payload;
  // 護欄:長度與型別鎖死,token 成本有天花板
  if (typeof report !== 'string' || !report.trim() || report.length > 24000) {
    return json({ error: 'Bad report' }, 400, corsHeaders);
  }
  if (!Array.isArray(messages) || messages.length > 60) {
    return json({ error: 'Bad messages' }, 400, corsHeaders);
  }
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')
      || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 2000) {
      return json({ error: 'Bad message item' }, 400, corsHeaders);
    }
  }

  const isFeedback = mode === 'feedback';
  const systemText = isFeedback ? OCTENSO_FEEDBACK_SYSTEM : OCTENSO_SYSTEM;
  // 報告全文另立一個 system 區塊並快取:同一段對話每一輪都命中快取
  const system = [
    { type: 'text', text: systemText, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: '使用者的報告全文如下:\n───\n' + report + '\n───', cache_control: { type: 'ephemeral' } },
  ];
  // 開場白由前端在本機生成(assistant 起頭),API 要求第一則是 user → 固定墊一句
  const msgs = [{ role: 'user', content: OCTENSO_FIRST_USER }, ...messages];
  if (isFeedback) {
    msgs.push({ role: 'user', content: '(對話結束)請依守則整理這段對話的回饋摘要。' });
  }

  const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: OCTENSO_MODEL,
      max_tokens: OCTENSO_MAX_TOKENS,
      system,
      messages: msgs,
    }),
  });
  if (!apiResponse.ok) {
    const errText = await apiResponse.text();
    console.error('Anthropic API error (octenso):', apiResponse.status, errText);
    return json({ error: '伴讀暫時無法回應,請稍後再試。', detail: `${apiResponse.status}: ${errText.slice(0, 400)}` }, 502, corsHeaders);
  }
  const data = await apiResponse.json();
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');

  if (isFeedback) {
    // 回饋摘要落檔(選配:綁定 KV namespace FEEDBACK 才會存;沒綁就只回給前端)
    if (env.FEEDBACK) {
      try {
        await env.FEEDBACK.put(`fb:${new Date().toISOString()}`, JSON.stringify({ turns: messages.length, summary: text }));
      } catch (e) {
        console.error('FEEDBACK KV put failed:', e);
      }
    }
    return json({ summary: text }, 200, corsHeaders);
  }
  return json({ reply: text }, 200, corsHeaders);
}

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

    // 八態伴讀(結果頁內嵌聊天)走 /octenso;問易解卦維持原路徑
    if (new URL(request.url).pathname === '/octenso') {
      return handleOctenso(request, env, corsHeaders);
    }

    if (new URL(request.url).pathname === '/lens') {
      return handleLens(request, env, corsHeaders);
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
