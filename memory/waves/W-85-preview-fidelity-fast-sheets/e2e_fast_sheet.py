"""E2E: known book + gid CSV + HTTP + cache timing."""
from __future__ import annotations

import json
import time
from pathlib import Path

import httpx

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-85-preview-fidelity-fast-sheets")
_DBG = Path(r"e:\Applications\OfficeTemp\debug-6cfa5a.log")
URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1vI8fUt1GrdYT1J4xryJl5Mr8MF782hov7dIBdkLR-Mo/edit?usp=sharing"
)
URL_GID = URL.replace("?usp=sharing", "#gid=124580750")


def dbg(msg: str, data: dict) -> None:
    try:
        with _DBG.open("a", encoding="utf-8") as fh:
            fh.write(
                json.dumps(
                    {
                        "sessionId": "6cfa5a",
                        "runId": "post-fix",
                        "hypothesisId": "H-fast",
                        "location": "e2e_fast_sheet.py",
                        "message": msg,
                        "data": data,
                        "timestamp": int(time.time() * 1000),
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
    except Exception:
        pass


def main() -> int:
    report: dict = {"ok": True, "calls": []}
    with httpx.Client(timeout=90.0) as c:
        login = c.post(
            "http://127.0.0.1:8005/api/v1/auth/login",
            json={"email": "admin1", "password": "admin1"},
        )
        if login.status_code >= 400:
            login = c.post(
                "http://127.0.0.1:8005/api/v1/auth/login",
                json={"email": "admin2", "password": "admin2"},
            )
        login.raise_for_status()
        tok = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {tok}"}

        for label, url in (("sharing", URL), ("gid", URL_GID), ("cache", URL)):
            t0 = time.time()
            r = c.post(
                "http://127.0.0.1:8005/api/v1/data/from-url",
                headers=headers,
                json={"url": url, "sheet_name": None},
            )
            ms = int((time.time() - t0) * 1000)
            entry = {
                "label": label,
                "status": r.status_code,
                "ms": ms,
                "nbytes": len(r.content),
            }
            if r.status_code < 400:
                j = r.json()
                extra = (j.get("meta") or {}).get("extra") or {}
                entry.update(
                    {
                        "rows": (j.get("meta") or {}).get("row_count"),
                        "cols": len(j.get("columns") or []),
                        "via": extra.get("via"),
                        "gid": extra.get("gid"),
                        "sheet": extra.get("sheet_name"),
                        "has_cipher": any(
                            "Шифр" in str(c) for c in (j.get("columns") or [])
                        ),
                    }
                )
            else:
                report["ok"] = False
                entry["err"] = r.text[:300]
            report["calls"].append(entry)
            dbg(label, entry)
            print(json.dumps(entry, ensure_ascii=False))

    (OUT / "e2e_fast_sheet.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
