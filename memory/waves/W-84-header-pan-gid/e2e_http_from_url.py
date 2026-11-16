"""Call our HTTP /api/v1/data/from-url like the cabinet does."""
from __future__ import annotations

import json
import time
from pathlib import Path

import httpx

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-84-header-pan-gid")
BASE = "http://127.0.0.1:8005"
URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU/edit?usp=sharing"
)
_DBG = Path(r"e:\Applications\OfficeTemp\debug-6cfa5a.log")


def main() -> int:
    t0 = time.time()
    with httpx.Client(timeout=120.0) as c:
        login = c.post(
            f"{BASE}/api/v1/auth/login",
            json={"email": "admin1", "password": "admin1"},
        )
        if login.status_code >= 400:
            login = c.post(
                f"{BASE}/api/v1/auth/login",
                json={"email": "admin2", "password": "admin2"},
            )
        login.raise_for_status()
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        r = c.post(
            f"{BASE}/api/v1/data/from-url",
            headers=headers,
            json={"url": URL, "sheet_name": None},
        )
        body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text[:500]}
    report = {
        "status": r.status_code,
        "ms": int((time.time() - t0) * 1000),
        "ok": r.status_code < 400,
        "columns": body.get("columns") if isinstance(body, dict) else None,
        "row_count": body.get("row_count") or (body.get("meta") or {}).get("row_count"),
        "extra": (body.get("meta") or {}).get("extra") if isinstance(body, dict) else None,
        "error": body.get("detail") if isinstance(body, dict) else None,
    }
    try:
        with _DBG.open("a", encoding="utf-8") as fh:
            fh.write(
                json.dumps(
                    {
                        "sessionId": "6cfa5a",
                        "runId": "post-fix",
                        "hypothesisId": "H4c",
                        "location": "e2e_http_from_url.py",
                        "message": "http from-url",
                        "data": {
                            "status": report["status"],
                            "ms": report["ms"],
                            "cols": len(report["columns"] or []),
                            "via": (report["extra"] or {}).get("via"),
                            "sheets_n": len((report["extra"] or {}).get("sheets") or []),
                        },
                        "timestamp": int(time.time() * 1000),
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
    except Exception:
        pass
    (OUT / "e2e_http_from_url.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2)[:2000])
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
