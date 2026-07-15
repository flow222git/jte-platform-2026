#!/usr/bin/env python3
# =====================================================
# 練息場 Sitemap 產生器
# 掃描 git 追蹤的所有 .html(排除 *.test.html),抓每頁真實 <title>,
# 依規則分區,輸出 sitemap.html。
#   用法:python3 tools/gen-sitemap.py          # 產生 sitemap.html
#         python3 tools/gen-sitemap.py --check  # 只列出「待歸位」新頁,不寫檔
# 新頁若沒對到規則,會落在「待歸位」區——提醒維護者去 SECTIONS/classify 補一條。
# 視覺沿用宣紙/墨/松綠(見 octenso/DESIGN-PRINCIPLES.md),不用 emoji。
# =====================================================
import subprocess, re, html, datetime, os, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 分區順序與標籤;tag: pub=公開 / priv=私密/內部
SECTIONS = [
    ("platform",      "練息場 · 平台入口",             "pub"),
    ("breathe",       "呼吸 · 覺察",                   "pub"),
    ("hrv",           "心率變異 HRV",                  "pub"),
    ("bsrs",          "心情溫度計 BSRS",               "pub"),
    ("octenso_main",  "八態能格 · 主要體驗",           "priv"),
    ("octenso_doc",   "八態能格 · 說明 / 型錄 / 學理", "priv"),
    ("octenso_art",   "八態能格 · 能量印記 / 藝術稿",  "priv"),
    ("octenso_admin", "八態能格 · 內部管理",           "priv"),
    ("veni",          "問易 Ven-I · 卜卦",             "pub"),
    ("whitepaper",    "平台文件 / 白皮書",             "priv"),
    ("docs_octenso",  "八態能格 · 交付文件 (docs)",    "priv"),
    ("tools",         "管理後台 / 匯入工具",           "priv"),
    ("other",         "其他 / 客戶專案",               "pub"),
    ("unsorted",      "待歸位(新頁自動落此)",         "priv"),
]

ADMIN = {"octenso-admin.html","octenso-ci.html","octenso-feedback.html",
         "octenso-journey.html","octenso-notes.html","octenso-wheel-min.html"}
OCTENSO_DIR_DOC = {"bagua-i18n.html","bagua-brief.html","bagua-concepts.html",
                   "bagua-catalog.html","bagua-guide.html"}
ROOT_OCT_DOC = {"octenso-model-spec.html","octenso-overview.html",
                "octenso-energy-positioning.html","bagua-64-demand.html"}
ROOT_PLATFORM = {"index.html","home-2026-proposal.html","sitemap.html",
                 "hub-demo.html","house-style-demo.html"}
ROOT_WHITEPAPER = {"lianxichang-atlas.html","lianxichang-hub.html",
                   "lianxichang-mindmap.html","lianxichang-tobc.html"}

def classify(p):
    base = p.rsplit('/', 1)[-1]
    if p.startswith('docs/octenso/'): return 'docs_octenso'
    if p.startswith('docs/'):         return 'whitepaper'
    if p.startswith('platform-intro/'): return 'whitepaper'
    if p.startswith('hrv/') or base in ('hrv-research.html','hrv_import.html','activity_import.html'): return 'hrv'
    if p.startswith('bsrs/'): return 'bsrs'
    if p.lower().startswith('breatheaware/') or 'breath-awareness' in base \
       or p.startswith('xiaoqi/') or base == 'energy-helper-demo.html': return 'breathe'
    if p.startswith('ven-i/') or base == 'jingfang-card-demo.html': return 'veni'
    if p.startswith('heavypower-rwd/'): return 'other'
    if re.search(r'demo\.html$', base) and base.startswith('octenso-'): return 'octenso_art'
    if p.startswith('octenso/'):
        if '結構' in base or base.endswith('-v0.1.html'): return 'octenso_doc'
        if base in ADMIN: return 'octenso_admin'
        if base.startswith('octenso-') or base in OCTENSO_DIR_DOC: return 'octenso_doc'
        return 'octenso_main'
    if base in ROOT_OCT_DOC or base.startswith('batai-'): return 'octenso_doc'
    if base in ROOT_PLATFORM: return 'platform'
    if base in ROOT_WHITEPAPER: return 'whitepaper'
    if base == 'admin.html': return 'tools'
    return 'unsorted'

# 顯示名稱時剝掉冗長前綴
PREFIXES = ["Octenso 八態能格 · ", "Octenso ｜ 八態能格 · ", "八態能格 Octenso · ",
            "八態能格 · ", "Octenso · ", "Octenso ｜", "練息場 · ", "練息場 "]

def clean_title(t):
    t = re.sub(r'\s+', ' ', t).strip()
    for pre in PREFIXES:
        if t.startswith(pre):
            t = t[len(pre):]; break
    return t or "(未命名)"

def read_title(path):
    try:
        with open(os.path.join(REPO, path), encoding='utf-8', errors='replace') as fh:
            txt = fh.read(6000)
        m = re.search(r'<title>(.*?)</title>', txt, re.S | re.I)
        return html.unescape(m.group(1)) if m else "(無 title)"
    except Exception as e:
        return f"(讀取失敗:{e})"

def list_pages():
    out = subprocess.check_output(['git', '-C', REPO, 'ls-files', '-z', '*.html'])
    files = [f for f in out.decode('utf-8').split('\0') if f and not f.endswith('.test.html')]
    return sorted(files)

STYLE = """
:root{--bg:#f4efe4;--surface:#f8f4ec;--ink:#23241f;--muted:#6f6657;--line:#d2c7b4;--hair:#bcb09a;
  --pine:#35614f;--gold:#a9823b;--cinnabar:#9d4b34}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:"Noto Sans TC",ui-sans-serif,sans-serif;font-weight:300;
  line-height:1.7;padding:34px 16px 70px;-webkit-font-smoothing:antialiased}
.wrap{max-width:1100px;margin:0 auto}
h1{font-family:"Noto Serif TC",serif;font-weight:600;font-size:22px;letter-spacing:.04em;text-align:center;margin-bottom:4px}
.date{text-align:center;font-family:"Jost",sans-serif;font-size:11px;letter-spacing:.18em;color:var(--muted);text-transform:uppercase;margin-bottom:6px}
.count{text-align:center;font-size:12px;color:var(--muted);margin-bottom:26px}
.cols{columns:2;column-gap:20px}
@media(max-width:760px){.cols{columns:1}}
.island{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px 18px 18px;
  margin-bottom:20px;break-inside:avoid}
.island.priv{border-color:var(--pine)}
.island.unsorted{border-style:dashed;border-color:var(--cinnabar)}
.ihead{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-bottom:12px}
.ihead .nm{font-family:"Noto Serif TC",serif;font-weight:600;font-size:16px;letter-spacing:.03em}
.ihead .tag{font-family:"Jost",sans-serif;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;
  padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}
.tag.pub{color:var(--pine);border-color:var(--pine)}
.tag.priv{color:var(--cinnabar);border-color:var(--cinnabar)}
.node{display:flex;align-items:baseline;gap:8px;background:var(--bg);border:1px solid var(--line);border-radius:10px;
  padding:7px 12px;margin-bottom:6px;text-decoration:none;color:inherit;transition:border-color .2s,transform .12s}
a.node:hover{border-color:var(--pine);transform:translateX(2px)}
.node .n{font-size:13px;color:var(--ink)}
.node .f{font-family:"Jost",sans-serif;font-size:10px;color:var(--hair);margin-left:auto;white-space:nowrap}
.legend{margin-top:8px;font-size:11.5px;color:var(--muted);background:var(--surface);
  border:1px solid var(--line);border-radius:12px;padding:13px 16px;line-height:1.9}
.legend b{color:var(--ink)}
.warn{color:var(--cinnabar)}
"""

def esc(s): return html.escape(s, quote=True)

def build(pages, today):
    buckets = {key: [] for key, _, _ in SECTIONS}
    for p in pages:
        buckets[classify(p)].append((clean_title(read_title(p)), p))
    islands = []
    for key, label, tag in SECTIONS:
        items = buckets[key]
        if not items:
            continue
        cls = "island" + (" priv" if tag == "priv" else "") + (" unsorted" if key == "unsorted" else "")
        tagcls = "tag priv" if tag == "priv" else "tag pub"
        tagtxt = "私密 · 內部" if tag == "priv" else "公開"
        rows = []
        for title, path in items:
            rows.append(
                f'<a class="node" href="{esc(path)}" target="_blank">'
                f'<span class="n">{esc(title)}</span><span class="f">{esc(path)}</span></a>')
        islands.append(
            f'<div class="{cls}"><div class="ihead">'
            f'<span class="nm">{esc(label)}</span><span class="{tagcls}">{tagtxt}</span>'
            f'<span class="tag">{len(items)}</span></div>\n' + "\n".join(rows) + "\n</div>")
    total = sum(len(v) for v in buckets.values())
    unsorted_n = len(buckets["unsorted"])
    warn = ""
    if unsorted_n:
        warn = (f'<br><span class="warn">⚠️ 有 {unsorted_n} 個新頁落在「待歸位」</span>'
                f'——請到 tools/gen-sitemap.py 的 classify() 補規則。')
    return f"""<!DOCTYPE html>
<html lang="zh-Hant"><head>
<meta charset="UTF-8"><meta name="robots" content="noindex,nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>練息場 · Sitemap（{today}）</title>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400&family=Noto+Sans+TC:wght@300;400;500&family=Noto+Serif+TC:wght@500;600&display=swap" rel="stylesheet">
<style>{STYLE}</style></head>
<body>
<!-- 此頁由 tools/gen-sitemap.py 自動產生,請勿手改;要調整分類改該腳本 -->
<div class="wrap">
  <h1>練息場 · 平台 Sitemap</h1>
  <div class="date">auto-generated · {today}</div>
  <div class="count">全站 {total} 頁(不含 *.test.html)</div>
  <div class="cols">
{chr(10).join(islands)}
  </div>
  <div class="legend">
    <b>讀法</b>:綠框＝八態/內部私密島(noindex、需登入);一般框＝公開;虛線紅框＝待歸位新頁。
    右上小數字＝該區頁數。此頁每次由 <b>tools/gen-sitemap.py</b> 掃 git 重生,標題直接取自各頁 &lt;title&gt;。{warn}
  </div>
</div>
</body></html>
"""

def main():
    pages = list_pages()
    if "--check" in sys.argv:
        un = [p for p in pages if classify(p) == "unsorted"]
        print(f"{len(pages)} 頁,待歸位 {len(un)}:")
        for p in un:
            print("  ", p)
        return
    today = datetime.date.today().isoformat()
    out = build(pages, today)
    with open(os.path.join(REPO, "sitemap.html"), "w", encoding="utf-8") as fh:
        fh.write(out)
    print(f"已寫入 sitemap.html — {len(pages)} 頁,{today}")

if __name__ == "__main__":
    main()
