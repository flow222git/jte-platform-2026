// 本地煙霧檢查——canonical 檢查器為 check-daoliyong-lens-schema.py(python3 環境執行);
// 本機 python 不可用時以本檔做結構把關。用法:node tools/smoke-daoliyong-lens-schema.mjs
import { readFileSync } from 'fs';

let t;
try {
  t = readFileSync(new URL('../octenso/daoliyong-lens-schema-v0.2.yaml', import.meta.url), 'utf8');
} catch (e) {
  console.log('FAIL schema 檔不存在(v0.2)');
  console.log('RESULT pass=0 fail=1');
  process.exit(1);
}

let pass = 0, fail = 0;
const ck = (name, ok) => { if (ok) { pass++; } else { fail++; console.log('FAIL  ' + name); } };
const has = (s) => t.includes(s);
const count = (s) => t.split(s).length - 1;

// meta 與誠實標記
ck('meta.version 0.3-draft', /version:\s*"0\.3-draft"/.test(t));
ck('研究假設標記', has('研究假設'));
ck('guardrails_ref 參照 G1–G8', has('guardrails_ref') && has('G1'));
ck('canonical_ref 指向 data.js', has('canonical_ref') && has('daoliyong-data.js'));

// 三層錨點(萬物對應圖)
ck('理 錨點', has('爻位: "地之位"') && has('價值: "真(客觀)"') && has('四德: "亨(事物通達)"'));
ck('用 錨點', has('爻位: "人之位"') && has('價值: "善(人間美德)"') && has('四德: "利與貞(造福與堅持)"'));
ck('道 錨點', has('爻位: "天之位"') && has('價值: "大美"') && has('四德: "元(萬物創始)"'));

// 三層欄位齊全(各出現 >= 3 次)
for (const f of ['核心提問:', '定位:', '識別信號:', '語言線索:', '行為線索:',
                 '正例引文形狀:', '缺席判定:', '混淆對照:', '禁止推論:']) {
  ck(`欄位 ${f} x3`, count(f) >= 3);
}
ck('行為線索三面 x3', count('會議:') >= 3 && count('文件/BP:') >= 3 && count('制度:') >= 3);

// 三隅箴警示
ck('空談警示', has('空談警示') && has('kongtan'));
ck('自產病警示', has('自產病警示') && has('zichanbing'));
ck('唯用無道警示', has('唯用無道警示') && has('weiyongwudao') && has('皆有料'));
ck('唯用無道守 G1', has('不預測'));

// 輸出規格
ck('第五段規格', has('三角形體檢') && has('一層不可省略'));
ck('第六段規格', has('至多 2') && has('此局面可考慮') && has('寧缺勿濫'));
ck('G7 適用範圍', has('interview') && has('observation'));

// 驗收
ck('acceptance 存在', has('acceptance:') && has('三值回饋'));

// 判卦區塊(v0.2)
ck('guapan 區塊', has('guapan:'));
ck('工作假說標記', has('工作假說·待收斂'));
ck('canonical 聲明', has('此卦由素材判讀推導,非起卦占斷;變爻是處方,不是預言。'));
ck('四律齊', has('非占卜律') && has('機械推導律') && has('主詞律') && has('不預測律'));
ck('成卦門檻', has('成卦門檻') && has('不成卦'));
ck('剛柔判準三爻', has('剛柔判準:') && count('剛:') >= 3 && count('柔:') >= 3 && count('亢:') >= 3 && count('溺:') >= 3);
ck('變爻判定律三源', has('第一源_脈絡優先') && has('第二源_宣告校正') && has('第三源_菜單兜底'));
ck('一爻變', has('一爻變'));
ck('量形圖', has('量形圖') && has('趨韓非形') && has('非分數'));
ck('宣告體系', has('宣告體系') && has('目標') && has('TA'));
ck('反查引用 helpers', has('guaOf') || has('MODES[].yao'));

// 六爻子區塊(v0.3)
ck('liuyao 子區塊', has('liuyao:'));
ck('雙假說印章', has('工作假說·待收斂(與 64 表 v0.1 待終審雙印章)'));
ck('排法 B 寫死', has('下卦=內在運作的理用道') && has('上卦=對外運作的理用道'));
ck('排法 A 學理註', has('排法 A') && has('萬物對應圖'));
ck('64 表真相源', has('docs/superpowers/specs/2026-06-30-bagua-64-energy-demand-table.md'));
ck('分池兩定義', has('內池:') && has('外池:'));
ck('歸池三原則', has('歸池三原則') && has('界隨對象移動') && has('行為的受向'));
ck('升級門檻', has('升級門檻') && has('六爻不成'));
ck('動爻規則四條', has('動爻規則') && has('照實全列') && has('宣告裁決優先') && has('靜卦'));
ck('動爻>=4 加註', has('菜單失焦'));
ck('召喚對照', has('召喚對照') && has('召喚而缺席=首要功課'));
ck('輸出關係', has('輸出關係') && has('三爻版省略'));
ck('剛柔判準註:絕對質性', has('絕對質性') && has('非相對比較'));
ck('剛柔判準註:亢溺判別', has('自驅過極=亢') && has('被外牽走=溺'));

// 防複寫(八態專屬欄位與模式副題不得出現)
for (const bad of ['主稱呼', '雅稱', '分支角色', '低載信號', '成熟表現',
                   '剛健不息', '包容孕育', '柔和爆發', '滲透影響',
                   '度險誠信', '團隊燃燒', '不動如山', '喜悅溝通']) {
  ck(`防複寫:無「${bad}」`, !has(bad));
}

console.log('RESULT pass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);
