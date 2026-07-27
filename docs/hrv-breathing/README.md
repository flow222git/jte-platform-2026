# HRV-breathing 設計提案（藍圖原型）

用手指蓋手機鏡頭量 HRV，看懂身體壓力，馬上練諧振呼吸降壓，再用「原子習慣」讓人每天願意做一個小動作。

## 怎麼看

**打開 `index.html`** 就是總覽首頁，點卡片進每一頁 demo。或直接開單頁：

| 檔案 | 內容 |
|---|---|
| `index.html` | 總覽首頁（給同事看，從這裡進） |
| `ux-flow-map.html` | ★ 整套 UX 動線總覽（先看這個） |
| `plan-recommended.html` | 企劃建議版（附研究來源） |
| `flow-overview.html` | 核心流程草案 |
| `home-twopaths.html` | 首頁：兩種入口＋呼吸 Hub |
| `measure-report-demo.html` | 量測頁＋報告頁（初版） |
| `report-demo-v2.html` | 報告頁（精簡定版） |
| `trend-demo.html` | HRV 趨勢頁＋目標帶 |
| `atomic-habit-demo.html` | 原子習慣：今日一件事 |
| `social-demo.html` | 成就卡＋排行榜 |

## 說明

- 全部是純 HTML、可直接用瀏覽器開，不需要伺服器。
- 手機畫面為示意，數字皆為範例。
- 視覺採「藍圖設計（Apple 風藍白灰）」，屬快速驗證原型，非正式上線視覺。
- 四個指標：**壓力指數｜壓力恢復力｜放鬆能力｜活力指數**。

> 階段：設計討論中。正式設計文件（spec）將另存於 `docs/superpowers/specs/`。
