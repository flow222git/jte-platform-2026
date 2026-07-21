// 本地煙霧檢查——canonical 檢查器為 check-daoliyong-lens-schema.py(python3 環境執行);
// 本機 python 不可用時以本檔做結構把關。用法:node tools/smoke-daoliyong-lens-schema.mjs
import { readFileSync } from 'fs';

let t;
try {
  t = readFileSync(new URL('../octenso/daoliyong-lens-schema-v0.1.yaml', import.meta.url), 'utf8');
} catch (e) {
  console.log('FAIL schema 檔不存在');
  console.log('RESULT pass=0 fail=1');
  process.exit(1);
}

let pass = 0, fail = 0;
const ck = (name, ok) => { if (ok) { pass++; } else { fail++; console.log('FAIL  ' + name); } };
const has = (s) => t.includes(s);
const count = (s) => t.split(s).length - 1;

// meta 與誠實標記
ck('meta.version 0.1', /version:\s*"0\.1"/.test(t));
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

// 防複寫(八態專屬欄位與模式副題不得出現)
for (const bad of ['主稱呼', '雅稱', '分支角色', '低載信號', '成熟表現',
                   '剛健不息', '包容孕育', '柔和爆發', '滲透影響',
                   '度險誠信', '團隊燃燒', '不動如山', '喜悅溝通']) {
  ck(`防複寫:無「${bad}」`, !has(bad));
}

console.log('RESULT pass=' + pass + ' fail=' + fail);
process.exit(fail ? 1 : 0);
