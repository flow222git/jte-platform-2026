#!/usr/bin/env python3
"""daoliyong-lens-schema 最小驗證:三層齊全、錨點正確、三隅箴在位、防複寫。
用法:python3 tools/check-daoliyong-lens-schema.py
輸出:逐項 PASS/FAIL + RESULT pass=X fail=Y(有 fail 則 exit 1)
本機無 python3 時,本地把關用 tools/smoke-daoliyong-lens-schema.mjs(node)。
"""
import sys, os, yaml

SCHEMA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      "octenso", "daoliyong-lens-schema-v0.1.yaml")

LAYERS = ["li", "yong", "dao"]
ANCHORS = {  # 名/爻位/價值/四德(萬物對應圖,一字不差)
    "li":   ("理", "地之位", "真(客觀)", "亨(事物通達)"),
    "yong": ("用", "人之位", "善(人間美德)", "利與貞(造福與堅持)"),
    "dao":  ("道", "天之位", "大美", "元(萬物創始)"),
}
REQUIRED_FIELDS = ["名", "爻位", "價值", "四德", "核心提問", "定位",
                   "識別信號", "正例引文形狀", "缺席判定", "混淆對照", "禁止推論"]
WARNINGS = {"kongtan": "空談警示", "zichanbing": "自產病警示", "weiyongwudao": "唯用無道警示"}
FORBIDDEN = ["主稱呼", "雅稱", "分支角色", "低載信號", "成熟表現",
             "剛健不息", "包容孕育", "柔和爆發", "滲透影響",
             "度險誠信", "團隊燃燒", "不動如山", "喜悅溝通"]

def main():
    ok, bad = 0, 0
    def check(name, cond, detail=""):
        nonlocal ok, bad
        if cond: ok += 1; print(f"PASS  {name}")
        else:    bad += 1; print(f"FAIL  {name}  {detail}")

    with open(SCHEMA, encoding="utf-8") as fh:
        raw = fh.read()
    doc = yaml.safe_load(raw)

    meta = doc.get("meta", {})
    check("meta.version == 0.1", str(meta.get("version")) == "0.1", f"got {meta.get('version')!r}")
    check("meta.status 掛研究假設", "研究假設" in str(meta.get("status", "")))
    check("guardrails_ref 指向 states-schema", "states-schema" in str(meta.get("guardrails_ref", "")))
    check("canonical_ref 指向 data.js", "daoliyong-data.js" in str(meta.get("canonical_ref", "")))

    layers = doc.get("layers", {})
    check("layers 三層齊全", sorted(layers.keys()) == sorted(LAYERS), f"got {sorted(layers.keys())}")
    for k in LAYERS:
        lay = layers.get(k, {})
        for f in REQUIRED_FIELDS:
            check(f"{k}.{f} 在位", f in lay)
        nm, yao, val, de = ANCHORS[k]
        check(f"{k} 錨點正確", lay.get("名") == nm and lay.get("爻位") == yao
              and lay.get("價值") == val and lay.get("四德") == de)
        sig = lay.get("識別信號", {})
        check(f"{k} 語言線索 >= 3", isinstance(sig.get("語言線索"), list) and len(sig["語言線索"]) >= 3)
        beh = sig.get("行為線索", {})
        check(f"{k} 行為線索三面", all(x in beh for x in ["會議", "文件/BP", "制度"]))
        check(f"{k} 混淆對照 >= 2", isinstance(lay.get("混淆對照"), dict) and len(lay["混淆對照"]) >= 2)
        check(f"{k} 禁止推論 >= 2", isinstance(lay.get("禁止推論"), list) and len(lay["禁止推論"]) >= 2)

    warns = doc.get("sanyu_warnings", {})
    check("三隅箴三條", sorted(warns.keys()) == sorted(WARNINGS.keys()), f"got {sorted(warns.keys())}")
    for wid, wname in WARNINGS.items():
        w = warns.get(wid, {})
        check(f"{wid} 名稱", w.get("名") == wname)
        check(f"{wid} 觸發與說法在位", bool(w.get("觸發")) and bool(w.get("說法")))
    check("唯用無道觸發=皆有料", "皆有料" in str(warns.get("weiyongwudao", {}).get("觸發", "")))
    check("唯用無道守 G1", "不預測" in str(warns.get("weiyongwudao", {}).get("說法", "")))

    spec = doc.get("output_spec", {})
    check("第五段規格在位", any("一層不可省略" in s for s in spec.get("第五段_三角形體檢", [])))
    six = " ".join(spec.get("第六段_道理用參考", []))
    check("第六段:至多 2", "至多 2" in six)
    check("第六段:必附死角", "死角" in six and "必附" in six)
    check("第六段:條文四措辭", "此局面可考慮" in six and "寧缺勿濫" in six)
    check("G7 適用範圍", "interview" in str(spec.get("適用範圍", "")))

    check("acceptance >= 3 步", isinstance(doc.get("acceptance"), list) and len(doc["acceptance"]) >= 3)

    for bad_s in FORBIDDEN:
        check(f"防複寫:無「{bad_s}」", bad_s not in raw)

    print(f"RESULT pass={ok} fail={bad}")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
