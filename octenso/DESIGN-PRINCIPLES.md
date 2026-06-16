# Octenso 八態能格 — 整體網站設計原則

> 一份套用到全站每一頁的視覺規範。基準頁是 `index.html`——它就是這套系統的標準範本，其他頁向它看齊。

---

## 0. 設計理念

1. **少即是多。** 每個元素都要有理由；寧可空，不要塞。沒有裝飾性的數字、圖示或色塊。
2. **留白即呼吸。** 靠留白與細線分段，不靠卡片與邊框。
3. **沉靜的色。** 宣紙底 + 墨黑字 + 低彩度點綴。避免漸層與高彩度。
4. **東方的氣質。** 細線幾何（円相、八方、卦象）、克制的襯線符號——**不用 emoji**。

---

## 1. 色彩 Tokens

全站共用，直接放進每頁的 `:root`：

```css
:root{
  /* 基礎 */
  --paper:#f4efe4;     /* 宣紙底（頁面背景） */
  --ink:#23241f;       /* 墨黑（主文字、主按鈕） */
  --ink-soft:#3a3a32;  /* 內文 */
  --muted:#857c6d;     /* 次要文字、標籤、說明 */
  --hair:#bcb09a;      /* 細邊框、淡分隔 */
  --line:#d2c7b4;      /* 區段分隔線 */

  /* 點綴（低彩度，克制使用） */
  --pine:#35614f;      /* 主點綴／雷達合成盤 */
  --cinnabar:#9d4b34;  /* 警示／缺漏（朱） */
  --gold:#a9823b;

  /* 五行色（低彩度，只在需要「分辨能量」時用：雷達點、圖例、能量介紹頁） */
  --metal:#b0996a;  /* 金 */
  --wood:#5f7d4a;   /* 木 */
  --water:#4d6b86;  /* 水 */
  --fire:#9d4b34;   /* 火 */
  --earth:#a98238;  /* 土 */
}
```

**用色規則**
- 一般頁面：宣紙底 + 墨黑 + 灰階即可，幾乎不用顏色。
- 五行五色 **平時收起來**——只在「雷達圖的點 / 圖例 / 八種能量介紹頁」這種真的需要分辨能量的地方展開。
- 不要用五行色當區塊標題、邊框 accent、或大面積底色。

---

## 2. 字體 Type

```html
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400&family=Noto+Sans+TC:wght@200;300;400&display=swap" rel="stylesheet">
```

| 用途 | 字體 | 字重 | 備註 |
|---|---|---|---|
| 內文 / UI | `"Noto Sans TC", sans-serif` | 300 | 全站基底，輕盈 |
| 大標題（中文） | `"Noto Sans TC"` | **200** | 細、字距拉開 `.12–.16em` |
| 英數 / eyebrow | `"Jost", sans-serif` | 400 | 全大寫、字距 `.24–.36em` |
| 卦象符號 ☰☱☲☳☴☵☶☷ | `"Songti TC","Noto Serif TC",serif` | — | **只有符號用襯線** |

- 中文標題用「細 + 寬字距」營造氣質，不要用粗體。
- 強調用 `color` 與 `font-weight:400`，不要用顏色亂跳。

---

## 3. 版面 Layout

- 單欄置中，內容寬度 `max-width:600px`（長文頁可到 680）。
- 區段之間用 **留白 + 1px 細線**（`border-top:1px solid var(--line)`）分隔，不用卡片盒子。
- 區塊標題：小、`--muted`、字距 `.14em`、`font-weight:400`——像 eyebrow，不搶戲。
- 慷慨的行距：內文 `line-height:1.9–2`。

---

## 4. 元件 Components

**區塊標題**
```css
.section-label{font-family:"Noto Sans TC";font-size:13px;letter-spacing:.14em;
  color:var(--muted);font-weight:400;margin-bottom:18px}
```

**主按鈕（線框 pill，hover 反白）**
```css
.btn{font-family:"Noto Sans TC";font-size:14px;font-weight:400;letter-spacing:.06em;
  padding:11px 24px;border:1px solid var(--ink);border-radius:999px;color:var(--ink);
  background:transparent;transition:background .2s,color .2s}
.btn:hover{background:var(--ink);color:var(--paper)}
.btn.ghost{border-color:var(--hair);color:var(--muted)}      /* 次要動作 */
.btn.ghost:hover{border-color:var(--ink);color:var(--ink);background:transparent}
```

**細線分隔**
```css
.rule{height:1px;background:var(--line);margin:48px 0}
```

**輸入框**
```css
.input{background:transparent;border:1px solid var(--hair);border-radius:10px;
  padding:12px 14px;color:var(--ink);transition:border-color .2s}
.input:focus{outline:none;border-color:var(--ink)}
```

**説明 / honest 區**（左細線，不要色塊背景）
```css
.honest{font-size:12.5px;color:var(--muted);line-height:1.95;
  padding-left:15px;border-left:1px solid var(--hair);text-align:left}
```

---

## 5. 圖像與符號

- **不用 emoji。** 需要符號時用卦象 ☰☱☲☳☴☵☶☷（襯線）或細線 SVG（円相、八方輪）。
- 線條圖一律 `stroke:var(--hair)` / `var(--line)`，細（1–1.4px）。
- 雷達合成盤：外框與軸線用 `--line`；資料區塊用 `--pine`（淡填色 `rgba(53,97,79,.16)`）；各能量點用對應五行色，小圓點即可。

---

## 6. 動態 Motion

- 慢、克制。進場用 `fade + 上移 14–18px`，搭配 `IntersectionObserver` 捲動觸發。
- hover 過場 `.2s`，不要位移彈跳。
- 一律尊重 `@media (prefers-reduced-motion:reduce)`：關閉動畫。

---

## 7. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| 宣紙底 + 墨黑 + 一個點綴 | 漸層背景、高彩度 |
| 留白 + 細線分段 | 卡片邊框 + 陰影堆疊 |
| 卦象襯線符號 | emoji 當圖示 |
| 細、寬字距的標題 | 粗體大標、彩色標題 |
| 五行色只在「分辨能量」處 | 五行色當裝飾 / accent 邊條 |
| 線框 pill 按鈕 | 實心高彩度按鈕 |

---

## 8. 各頁套色備忘

| 頁面 | 點綴策略 |
|---|---|
| `index.html` | 純灰階，基準頁（已到位） |
| `bagua-persona.html`（個人測驗結果） | 灰階 + 單一卦象色（該人的能量色） |
| `bagua-team.html`（團隊合盤） | 灰階 + 雷達點五行色（已改版完成） |
| `bagua-map.html`（認識八種能量） | **唯一展開五行五色的頁** |
| 其餘內容頁 | 純灰階 |

---

*此規範對應改版：`bagua-team.html` 已套用，可作為其他頁的實作參考。*
