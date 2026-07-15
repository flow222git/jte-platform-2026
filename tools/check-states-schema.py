#!/usr/bin/env python3
"""states-schema 最小驗證:結構齊全、護欄未動、命名與素材倉一致。
用法:python3 tools/check-states-schema.py
輸出:逐項 PASS/FAIL + RESULT pass=X fail=Y(有 fail 則 exit 1)
"""
import sys, os, yaml

SCHEMA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      "octenso", "octenso-states-schema-v0.1.yaml")

STATES = ["qian", "kun", "zhen", "xun", "kan", "li", "gen", "dui"]

# 素材倉術語對照表(canonical,一字不差)
NAMES = {
    "qian": ("開創者(乾)", "展行"), "kun": ("承接者(坤)", "承載"),
    "zhen": ("行動者(震)", "啟動"), "xun": ("拓展者(巽)", "滲透"),
    "kan": ("沉澱者(坎)", "探索"),  "li":  ("明現者(離)", "照見"),
    "gen": ("喊停者(艮)", "定界"),  "dui": ("交流者(兌)", "共鳴"),
}

# G1–G8 凍結副本(rule 字串一字不差)
GUARDRAILS = {
    "G1": "只診斷能量分佈,不預測成敗",
    "G2": "缺席優先於失衡,失衡優先於滿格",
    "G3": "前瞻檢查表為主,回溯敘事僅供教學且需標明",
    "G4": "分析單位是『運作』,主詞永遠不是『這種人』",
    "G5": "無證據即無判定",
    "G6": "禁止輸出清單",
    "G7": "面試/人事場景降級為觀察筆記",
    "G8": "時間視角可用,因果推移禁止",
}

REQUIRED_FIELDS = ["卦", "主稱呼", "雅稱", "英文候選", "系統", "分支角色",
                   "一句話", "核心提問", "識別信號", "缺席判定", "低載信號",
                   "失衡信號", "成熟表現", "混淆對照", "禁止推論"]

def main():
    ok, bad = 0, 0
    def check(name, cond, detail=""):
        nonlocal ok, bad
        if cond: ok += 1; print(f"PASS  {name}")
        else:    bad += 1; print(f"FAIL  {name}  {detail}")

    with open(SCHEMA, encoding="utf-8") as fh:
        doc = yaml.safe_load(fh)

    check("meta.version == 0.1", str(doc.get("meta", {}).get("version")) == "0.1",
          f"got {doc.get('meta', {}).get('version')!r}")
    check("meta.filled 八態全列", sorted(doc.get("meta", {}).get("filled", [])) == sorted(STATES))
    check("meta.stub 已清空", doc.get("meta", {}).get("stub", ["x"]) == [])

    gr = {g.get("id"): g.get("rule") for g in doc.get("guardrails", [])}
    for gid, rule in GUARDRAILS.items():
        check(f"護欄 {gid} 未動", gr.get(gid) == rule, f"got {gr.get(gid)!r}")

    for s in STATES:
        st = doc.get(s)
        if not isinstance(st, dict) or st.get("status") == "TODO":
            check(f"{s} 已補完", False, "仍是 stub"); continue
        missing = [f for f in REQUIRED_FIELDS if f not in st]
        check(f"{s} 欄位齊全", not missing, f"缺 {missing}")
        check(f"{s} 主稱呼 canonical", st.get("主稱呼") == NAMES[s][0],
              f"got {st.get('主稱呼')!r} want {NAMES[s][0]!r}")
        check(f"{s} 雅稱 canonical", st.get("雅稱") == NAMES[s][1],
              f"got {st.get('雅稱')!r}")
        sig = st.get("識別信號", {})
        check(f"{s} 語言線索>=3", isinstance(sig.get("語言線索"), list) and len(sig["語言線索"]) >= 3)
        check(f"{s} 行為線索三單位", isinstance(sig.get("行為線索"), dict)
              and {"會議", "文件/BP", "制度"} <= set(sig["行為線索"]))
        check(f"{s} 正例引文形狀", bool(sig.get("正例引文形狀")))
        check(f"{s} 混淆對照>=3", isinstance(st.get("混淆對照"), dict) and len(st["混淆對照"]) >= 3)
        check(f"{s} 禁止推論>=2", isinstance(st.get("禁止推論"), list) and len(st["禁止推論"]) >= 2)

    print(f"RESULT pass={ok} fail={bad}")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
