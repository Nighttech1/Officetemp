from pathlib import Path

p = Path(r"e:\Applications\OfficeTemp\backend\app\services\iul_stamp.py")
t = p.read_text(encoding="utf-8")
start = t.find("def _prefer_designation")
end = t.find("def _pick_object_and_sheet_name")
assert start > 0 and end > start, (start, end)
new = '''def _prefer_designation(stamp: str, from_file: str) -> str:
    """Choose fuller шифр: filename often has complete code when PDF splits tokens."""
    s = (stamp or "").strip()
    f = (from_file or "").strip()
    if not s:
        return f
    if not f:
        return s

    def core(x: str) -> str:
        return re.sub(
            r"\\s*\\(?\\s*Изм\\.?\\s*\\d+\\s*\\)?",
            "",
            x,
            flags=re.I,
        ).strip().rstrip("-")

    sc, fc = core(s), core(f)
    # Stamp truncated («…-1-2-»), file has «…-1-2-КЖ6.2»
    if (s.rstrip().endswith("-") or len(fc) > len(sc)) and fc.startswith(sc):
        return f
    return s if len(sc) >= len(fc) else f


'''
# fix double backslashes from this write
new = new.replace("\\\\s*", "\\s*").replace("\\\\(", "\\(").replace("\\\\)", "\\)").replace("\\\\.", "\\.").replace("\\\\d", "\\d").replace("\\\\?", "\\?")
# Actually the raw string in the file content above used \\\\ which becomes \\ in the written Python file for the regex - we need single \ in the .py source for regex.
# Let me rebuild cleanly:
new = (
    "def _prefer_designation(stamp: str, from_file: str) -> str:\n"
    '    """Choose fuller шифр: filename often has complete code when PDF splits tokens."""\n'
    '    s = (stamp or "").strip()\n'
    '    f = (from_file or "").strip()\n'
    "    if not s:\n"
    "        return f\n"
    "    if not f:\n"
    "        return s\n"
    "\n"
    "    def core(x: str) -> str:\n"
    "        return re.sub(\n"
    '            r"\\s*\\(?\\s*Изм\\.?\\s*\\d+\\s*\\)?",\n'
    '            "",\n'
    "            x,\n"
    "            flags=re.I,\n"
    '        ).strip().rstrip("-")\n'
    "\n"
    "    sc, fc = core(s), core(f)\n"
    "    # Stamp truncated; file has fuller code\n"
    '    if (s.rstrip().endswith("-") or len(fc) > len(sc)) and fc.startswith(sc):\n'
    "        return f\n"
    "    return s if len(sc) >= len(fc) else f\n"
    "\n"
    "\n"
)
p.write_text(t[:start] + new + t[end:], encoding="utf-8")
print("ok")
