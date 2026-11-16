from pathlib import Path

p = Path(r"e:\Applications\OfficeTemp\backend\app\services\iul_stamp.py")
t = p.read_text(encoding="utf-8")
start = t.find("def _prefer_designation")
end = t.find("def _pick_object_and_sheet_name")
assert start > 0 and end > start
new = (
    "def _prefer_designation(stamp: str, from_file: str) -> str:\n"
    '    """Prefer filename шифр for uploads; stamp tokens are often split/wrong."""\n'
    '    s = (stamp or "").strip()\n'
    '    f = (from_file or "").strip()\n'
    "\n"
    "    def core(x: str) -> str:\n"
    "        return re.sub(\n"
    '            r"\\s*\\(?\\s*Изм\\.?\\s*\\d+\\s*\\)?",\n'
    '            "",\n'
    "            x,\n"
    "            flags=re.I,\n"
    '        ).strip().rstrip("-")\n'
    "\n"
    "    def ok(x: str) -> bool:\n"
    "        c = core(x)\n"
    "        return bool(c) and len(c) <= 40 and bool(\n"
    '            DESIGNATION_RE.fullmatch(c.replace(" ", ""))\n'
    "        )\n"
    "\n"
    "    if ok(f):\n"
    "        return f\n"
    "    if ok(s):\n"
    "        return s\n"
    "    return f or s\n"
    "\n"
    "\n"
)
p.write_text(t[:start] + new + t[end:], encoding="utf-8")
print("prefer ok")
