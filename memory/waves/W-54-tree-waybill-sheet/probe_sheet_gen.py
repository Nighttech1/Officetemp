"""W-54 C-132: Google Sheet rows 31-39 → DOCX with {{n}}/{{code}}/{{section name}}."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[3]
API = "http://127.0.0.1:8002"
SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU/edit?usp=sharing"
)
TEMPLATE = ROOT / "templates" / "invoice template seq.docx"
OUT = Path(__file__).resolve().parent / "waybill-31-39.docx"
META = Path(__file__).resolve().parent / "sheet-probe.json"


def login(client: httpx.Client) -> None:
    for email, password in (("admin1", "admin1"), ("admin2", "admin2")):
        r = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
            timeout=30,
        )
        if r.status_code < 400:
            client.headers["Authorization"] = f"Bearer {r.json()['access_token']}"
            return
    # register fallback
    email = f"w54.{int(__import__('time').time())}@example.com"
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "localdev1",
            "org_name": "W54",
            "full_name": "W54 Tester",
            "consent": True,
        },
        timeout=30,
    )
    if r.status_code >= 400:
        # try login after partial register
        r = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "localdev1"},
            timeout=30,
        )
    r.raise_for_status()
    client.headers["Authorization"] = f"Bearer {r.json()['access_token']}"


def find_sheet(names: list[str]) -> str | None:
    keys = ("рд", "финанс", "сп")
    scored = []
    for n in names:
        low = n.lower()
        score = sum(1 for k in keys if k in low)
        scored.append((score, n))
    scored.sort(reverse=True)
    return scored[0][1] if scored and scored[0][0] > 0 else (names[0] if names else None)


def main() -> int:
    if not TEMPLATE.is_file():
        print("MISSING template", TEMPLATE)
        return 2

    with httpx.Client(base_url=API, timeout=120.0, trust_env=False) as client:
        login(client)

        # list sheets via from-url without sheet_name
        r = client.post(
            "/api/v1/data/from-url",
            json={"url": SHEET_URL},
        )
        print("from-url status", r.status_code)
        if r.status_code >= 400:
            print(r.text[:800])
            META.write_text(r.text, encoding="utf-8")
            return 1
        ds = r.json()
        sheets = ds.get("sheet_names") or ds.get("meta", {}).get("sheet_names") or []
        extra = (ds.get("meta") or {}).get("extra") or {}
        if not sheets:
            sheets = extra.get("sheet_names") or []
        # DatasetOut shape
        if not sheets and "sheets" in ds:
            sheets = ds["sheets"]
        print("sheets raw keys", list(ds.keys()))
        print("sheets", sheets)
        sheet = find_sheet([str(s) for s in sheets]) if sheets else None
        if sheet:
            r = client.post(
                "/api/v1/data/from-url",
                json={"url": SHEET_URL, "sheet_name": sheet},
            )
            r.raise_for_status()
            ds = r.json()
        columns = ds.get("columns") or []
        rows = ds.get("rows") or []
        print("sheet chosen", sheet or "(default)")
        print("columns", columns[:20], "... total", len(columns))
        print("rows", len(rows))

        # pick code number / section name columns
        def norm(s: str) -> str:
            return "".join(ch for ch in s.lower().replace("ё", "е") if ch.isalnum())

        col_code = next(
            (c for c in columns if "code" in norm(c) or "шифр" in norm(c)),
            None,
        )
        col_sec = next(
            (
                c
                for c in columns
                if "section" in norm(c)
                or "наименован" in norm(c)
                or "комплект" in norm(c)
            ),
            None,
        )
        print("col_code", col_code, "col_sec", col_sec)

        # rows 31-39 are 1-based data rows after header → indices 30..38
        selected = rows[30:39]
        print("selected count", len(selected))
        preview = []
        for i, row in enumerate(selected, start=1):
            preview.append(
                {
                    "n": i,
                    "code": row.get(col_code) if col_code else None,
                    "section": row.get(col_sec) if col_sec else None,
                }
            )
        print(json.dumps(preview, ensure_ascii=False, indent=2))

        items = []
        for i, row in enumerate(selected, start=1):
            items.append(
                {
                    "n": str(i),
                    "code": str(row.get(col_code) or "") if col_code else "",
                    "section name": str(row.get(col_sec) or "") if col_sec else "",
                }
            )
        context = {
            "invoice_number": "001",
            "invoice_date": "29.09.2026",
            "n": "1",
            "code": items[0]["code"] if items else "",
            "section_name": items[0]["section name"] if items else "",
            "items": [
                {
                    "n": it["n"],
                    "code": it["code"],
                    "section_name": it["section name"],
                }
                for it in items
            ],
            "rows": [
                {
                    "n": it["n"],
                    "code": it["code"],
                    "section_name": it["section name"],
                }
                for it in items
            ],
        }

        files = {
            "template": (
                TEMPLATE.name,
                TEMPLATE.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        }
        data = {"context": json.dumps(context, ensure_ascii=False)}
        gr = client.post("/api/v1/generate/docx", files=files, data=data)
        print("generate", gr.status_code, gr.headers.get("content-type"))
        if gr.status_code >= 400:
            print(gr.text[:800])
            META.write_text(
                json.dumps({"error": gr.text, "preview": preview}, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            return 1
        OUT.write_bytes(gr.content)
        META.write_text(
            json.dumps(
                {
                    "sheet": sheet,
                    "columns": columns,
                    "col_code": col_code,
                    "col_sec": col_sec,
                    "row_count": len(rows),
                    "selected": len(selected),
                    "preview": preview,
                    "out": str(OUT),
                    "out_size": OUT.stat().st_size,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        print("saved", OUT, OUT.stat().st_size)
    return 0


if __name__ == "__main__":
    sys.exit(main())
