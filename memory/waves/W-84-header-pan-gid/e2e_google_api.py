"""E2E: call our from_cloud_url + list all sheets/columns; write test cell via public Editor."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

# Ensure backend package importable
sys.path.insert(0, r"e:\Applications\OfficeTemp\backend")

from app.services.connectors.cloud_url import from_cloud_url, _list_google_tabs, _download_google_csv
from app.core.config import get_settings

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-84-header-pan-gid")
URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU/edit?usp=sharing"
)
SID = "1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU"

# #region agent log
_DBG = Path(r"e:\Applications\OfficeTemp\debug-6cfa5a.log")


def _dbg(hid: str, loc: str, msg: str, data: dict) -> None:
    try:
        with _DBG.open("a", encoding="utf-8") as fh:
            fh.write(
                json.dumps(
                    {
                        "sessionId": "6cfa5a",
                        "runId": "post-fix",
                        "hypothesisId": hid,
                        "location": loc,
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


# #endregion


def main() -> int:
    report: dict = {"ok": True, "steps": []}

    t0 = time.time()
    tabs = _list_google_tabs(SID)
    report["tabs"] = [{"name": n, "gid": g} for n, g in tabs]
    _dbg("H4c", "e2e_google_api.py:tabs", "listed tabs", {"n": len(tabs), "names": [n for n, _ in tabs]})

    # Download CSV for every sheet via gviz-by-name
    sheet_cols: dict[str, list[str]] = {}
    sheet_rows: dict[str, int] = {}
    for name, gid in tabs:
        try:
            raw = _download_google_csv(SID, sheet_name=name, gid=gid if gid >= 0 else None)
            # parse header line
            text = raw.decode("utf-8-sig", errors="replace")
            first = text.splitlines()[0] if text else ""
            # crude CSV split (enough for column names report)
            cols = [c.strip().strip('"') for c in first.split(",")]
            sheet_cols[name] = cols
            sheet_rows[name] = max(0, len(text.splitlines()) - 1)
            report["steps"].append({"sheet": name, "ok": True, "cols": len(cols), "bytes": len(raw)})
        except Exception as exc:  # noqa: BLE001
            report["ok"] = False
            report["steps"].append({"sheet": name, "ok": False, "err": str(exc)[:200]})

    # Full Dataset via our service path
    ds = from_cloud_url(URL, settings=get_settings())
    report["dataset"] = {
        "columns": list(ds.columns),
        "row_count": ds.meta.row_count,
        "via": (ds.meta.extra or {}).get("via"),
        "sheet_name": (ds.meta.extra or {}).get("sheet_name"),
        "sheets": (ds.meta.extra or {}).get("sheets"),
        "ms": int((time.time() - t0) * 1000),
        "sample_row0": dict(list((ds.rows[0] if ds.rows else {}).items())[:8]),
    }
    _dbg(
        "H4c",
        "e2e_google_api.py:dataset",
        "from_cloud_url ok",
        {
            "cols": len(ds.columns),
            "rows": ds.meta.row_count,
            "via": (ds.meta.extra or {}).get("via"),
            "sheets_n": len((ds.meta.extra or {}).get("sheets") or []),
            "ms": report["dataset"]["ms"],
        },
    )

    report["all_sheet_columns"] = sheet_cols
    report["all_sheet_rows"] = sheet_rows

    # Write test data: public Editor → Google Forms-style not available;
    # use Sheets "edit" via playwright in sibling script. Marker for read-back:
    marker = f"W84-TEST-{int(time.time())}"
    report["write_marker"] = marker

    (OUT / "e2e_google_api.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({k: report[k] for k in ("ok", "dataset", "tabs") if k in report}, ensure_ascii=False, indent=2))
    print("sheets_n", len(tabs), "all_ok", report["ok"])
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
