"""One-shot localhost acceptance for Phase 2 (no system proxy)."""

from __future__ import annotations

import json
import time
import uuid
from http.client import HTTPConnection
from pathlib import Path

from docx import Document

HOST = "127.0.0.1"
PORT = 8000
ROOT = Path(__file__).resolve().parents[1]
FLAT = ROOT / "tests" / "fixtures" / "docx" / "flat_tags.docx"
TABLE = ROOT / "tests" / "fixtures" / "docx" / "dynamic_table.docx"
OUT = ROOT / ".runtime" / "accept_out.docx"


def _request(
    method: str,
    path: str,
    *,
    body: bytes | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, str], bytes]:
    conn = HTTPConnection(HOST, PORT, timeout=30)
    conn.request(method, path, body=body, headers=headers or {})
    resp = conn.getresponse()
    data = resp.read()
    hdrs = {k.lower(): v for k, v in resp.getheaders()}
    conn.close()
    return resp.status, hdrs, data


def _multipart(
    fields: dict[str, str],
    files: dict[str, tuple[str, bytes, str]],
) -> tuple[bytes, str]:
    boundary = f"----Boundary{uuid.uuid4().hex}"
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.append(f"--{boundary}\r\n".encode())
        chunks.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        chunks.append(value.encode("utf-8"))
        chunks.append(b"\r\n")
    for name, (filename, content, content_type) in files.items():
        chunks.append(f"--{boundary}\r\n".encode())
        chunks.append(
            (
                f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
                f"Content-Type: {content_type}\r\n\r\n"
            ).encode()
        )
        chunks.append(content)
        chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    status, _, body = _request("GET", "/health")
    print("health", status, body)
    assert status == 200 and b'"ok"' in body

    email = f"live_p2_{int(time.time())}@example.com"
    payload = json.dumps(
        {
            "org_name": "Live Doc Org",
            "email": email,
            "password": "password123",
            "full_name": "Live User",
        }
    ).encode()
    status, _, body = _request(
        "POST",
        "/api/v1/auth/register",
        body=payload,
        headers={"Content-Type": "application/json"},
    )
    print("register", status)
    assert status == 201, body
    token = json.loads(body)["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    ctx = json.dumps({"ClientName": "ACME LLC", "ContractDate": "2026-09-22"})
    body_mp, ctype = _multipart(
        {"context": ctx},
        {
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    status, hdrs, body = _request(
        "POST",
        "/api/v1/generate/docx",
        body=body_mp,
        headers={**auth, "Content-Type": ctype},
    )
    print("generate_docx", status, hdrs.get("content-type"), len(body))
    assert status == 200, body
    OUT.write_bytes(body)
    text = " | ".join(p.text for p in Document(OUT).paragraphs if p.text.strip())
    print("docx_text", text)
    assert "ACME LLC" in text

    body_mp, ctype = _multipart(
        {},
        {
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    status, _, body = _request(
        "POST",
        "/api/v1/templates/analyze",
        body=body_mp,
        headers={**auth, "Content-Type": ctype},
    )
    tags = json.loads(body)["tags"]
    print("analyze", status, tags)
    assert status == 200
    assert {t["name"] for t in tags} >= {"ClientName", "ContractDate"}

    body_mp, ctype = _multipart(
        {},
        {
            "template": (
                "dynamic_table.docx",
                TABLE.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    status, _, body = _request(
        "POST",
        "/api/v1/templates/analyze",
        body=body_mp,
        headers={**auth, "Content-Type": ctype},
    )
    kinds = {t["name"]: t["kind"] for t in json.loads(body)["tags"]}
    print("dyn_kinds", kinds)
    assert kinds.get("items") == "tr_for"

    body_mp, ctype = _multipart(
        {"context": ctx},
        {
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    status, _, body = _request(
        "POST",
        "/api/v1/generate/pdf",
        body=body_mp,
        headers={**auth, "Content-Type": ctype},
    )
    print("generate_pdf", status, body[:120] if status != 200 else len(body))
    assert status in (200, 503)

    print("ACCEPT_OK")


if __name__ == "__main__":
    main()
