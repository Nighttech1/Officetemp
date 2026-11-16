from pathlib import Path

p = Path(__file__).resolve().parents[1] / "app" / "services" / "iul_stamp.py"
t = p.read_text(encoding="utf-8")
old = 'result.ul_code = f"{result.doc_designation}_УЛ"'
new = (
    'base_des = re.sub(r"\\s*\\(?\\s*Изм\\.?\\s*\\d+\\s*\\)?", "", '
    "result.doc_designation, flags=re.I).strip()\n"
    '            result.ul_code = f"{(base_des or result.doc_designation)}_УЛ"'
)
if old not in t:
    raise SystemExit("ul_code pattern not found")
p.write_text(t.replace(old, new), encoding="utf-8")
print("ul_code patched", t.count(old), "→", p.read_text(encoding="utf-8").count("base_des"))
