"""Live accept W-05 jobs API with CELERY_TASK_ALWAYS_EAGER."""

from __future__ import annotations

import io
import json
import time
import uuid
import zipfile
from http.client import HTTPConnection
from pathlib import Path

HOST, PORT = "127.0.0.1", 8000
ROOT = Path(__file__).resolve().parents[1]
FLAT = ROOT / "tests" / "fixtures" / "docx" / "flat_tags.docx"


def _req(method, path, body=None, headers=None):
    c = HTTPConnection(HOST, PORT, timeout=60)
    c.request(method, path, body=body, headers=headers or {})
    r = c.getresponse()
    data = r.read()
    c.close()
    return r.status, data


def _multipart(fields, files):
    b = f"----B{uuid.uuid4().hex}"
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.append(
            f"--{b}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode()
        )
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
    st, body = _req("GET", "/health")
    assert st == 200, body
    email = f"w05_{int(time.time())}@example.com"
    st, body = _req(
        "POST",
        "/api/v1/auth/register",
        body=json.dumps(
            {
                "org_name": "Jobs Org",
                "email": email,
                "password": "password123",
                "full_name": "Jobs User",
            }
        ).encode(),
        headers={"Content-Type": "application/json"},
    )
    assert st == 201, body
    token = json.loads(body)["access_token"]
    auth = {"Authorization": f"Bearer {token}"}
    rows = json.dumps(
        [
            {"ClientName": "One", "ContractDate": "2026-01-01"},
            {"ClientName": "Two", "ContractDate": "2026-02-02"},
        ]
    )
    mp, ctype = _multipart(
        {"rows": rows, "output": "docx"},
        {
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    st, body = _req("POST", "/api/v1/jobs", body=mp, headers={**auth, "Content-Type": ctype})
    print("create", st, body[:200])
    assert st == 201, body
    job_id = json.loads(body)["id"]
    st, body = _req("GET", f"/api/v1/jobs/{job_id}", headers=auth)
    print("status", st, body)
    assert st == 200
    assert json.loads(body)["status"] == "done"
    st, body = _req("GET", f"/api/v1/jobs/{job_id}/download", headers=auth)
    print("download", st, len(body), body[:2])
    assert st == 200 and body[:2] == b"PK"
    with zipfile.ZipFile(io.BytesIO(body)) as zf:
        names = sorted(zf.namelist())
    print("zip", names)
    assert "row_00000.docx" in names and "row_00001.docx" in names
    print("ACCEPT_OK")


if __name__ == "__main__":
    main()
