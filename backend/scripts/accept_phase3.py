"""Localhost acceptance for Phase 3 data API (no system proxy)."""

from __future__ import annotations

import json
import time
import uuid
from http.client import HTTPConnection
from pathlib import Path

HOST, PORT = "127.0.0.1", 8000
ROOT = Path(__file__).resolve().parents[1]
SAMPLE = ROOT / "tests" / "fixtures" / "data" / "sample.xlsx"


def _req(method: str, path: str, body: bytes | None = None, headers: dict | None = None):
    c = HTTPConnection(HOST, PORT, timeout=30)
    c.request(method, path, body=body, headers=headers or {})
    r = c.getresponse()
    data = r.read()
    c.close()
    return r.status, data


def _multipart(fields: dict[str, str], files: dict[str, tuple[str, bytes, str]]):
    b = f"----B{uuid.uuid4().hex}"
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.append(f"--{b}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode())
    for name, (fn, content, ctype) in files.items():
        chunks.append(
            f"--{b}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{fn}\"\r\n"
            f"Content-Type: {ctype}\r\n\r\n".encode()
        )
        chunks.append(content)
        chunks.append(b"\r\n")
    chunks.append(f"--{b}--\r\n".encode())
    return b"".join(chunks), f"multipart/form-data; boundary={b}"


def main() -> None:
    assert SAMPLE.is_file(), SAMPLE
    st, body = _req("GET", "/health")
    assert st == 200, body
    email = f"p3_{int(time.time())}@example.com"
    st, body = _req(
        "POST",
        "/api/v1/auth/register",
        body=json.dumps(
            {
                "org_name": "Data Org",
                "email": email,
                "password": "password123",
                "full_name": "Data User",
            }
        ).encode(),
        headers={"Content-Type": "application/json"},
    )
    assert st == 201, body
    token = json.loads(body)["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    mp, ctype = _multipart(
        {},
        {
            "file": (
                "sample.xlsx",
                SAMPLE.read_bytes(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    st, body = _req("POST", "/api/v1/data/excel", body=mp, headers={**auth, "Content-Type": ctype})
    print("excel", st, body[:300])
    assert st == 200, body
    ds = json.loads(body)
    assert ds["source"] in ("excel", "xlsx") or "columns" in ds
    assert ds["meta"]["row_count"] >= 1
    assert len(ds["columns"]) >= 1

    st, body = _req(
        "POST",
        "/api/v1/data/google",
        body=json.dumps({"spreadsheet_id": "x", "range": "Sheet1!A1:B2"}).encode(),
        headers={**auth, "Content-Type": "application/json"},
    )
    print("google_unconfigured", st, body[:200])
    assert st in (400, 503)

    print("ACCEPT_OK")


if __name__ == "__main__":
    main()
