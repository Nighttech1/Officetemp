"""Probe generate/docx + from-url against local API."""
from __future__ import annotations

import json
import uuid
from http.client import HTTPConnection
from pathlib import Path

BASE_HOST = "127.0.0.1"
BASE_PORT = 8001
TPL = Path(r"E:\Applications\OfficeTemp\memory\waves\W-22-user-google-connect\user_template.docx")
OUT = Path(r"E:\Applications\OfficeTemp\memory\waves\W-24-download-fix\gen_ok.docx")
GOOGLE = "https://docs.google.com/spreadsheets/d/1cucynWgxa3korll0CyESQSSVQXtcCom4XhA8ZmPRMqU/edit?usp=sharing"


def json_req(method: str, path: str, body: dict | None = None, token: str | None = None):
    conn = HTTPConnection(BASE_HOST, BASE_PORT, timeout=180)
    headers = {"Accept": "application/json"}
    payload = None
    if body is not None:
        payload = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    conn.request(method, path, body=payload, headers=headers)
    resp = conn.getresponse()
    data = resp.read()
    conn.close()
    return resp.status, data, dict(resp.getheaders())


def multipart(path: str, fields: dict[str, str], files: dict[str, tuple[str, bytes, str]], token: str):
    boundary = "----bound" + uuid.uuid4().hex
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode()
        )
    for name, (filename, content, ctype) in files.items():
        chunks.append(
            (
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; "
                f"filename=\"{filename}\"\r\nContent-Type: {ctype}\r\n\r\n"
            ).encode()
            + content
            + b"\r\n"
        )
    chunks.append(f"--{boundary}--\r\n".encode())
    body = b"".join(chunks)
    conn = HTTPConnection(BASE_HOST, BASE_PORT, timeout=180)
    conn.request(
        "POST",
        path,
        body=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    resp = conn.getresponse()
    data = resp.read()
    headers = dict(resp.getheaders())
    status = resp.status
    conn.close()
    return status, data, headers


def main() -> None:
    st, raw, _ = json_req("POST", "/api/v1/auth/login", {"email": "admin1", "password": "admin1"})
    print("login", st, raw[:200])
    tok = json.loads(raw)["access_token"]

    ctx = {
        "NN": "1",
        "date": "09.09.26",
        "number": "001",
        "name": "Test",
        "code": "X",
        "rows": [{"n": 1, "name": "A"}],
    }
    st, data, hdrs = multipart(
        "/api/v1/generate/docx",
        {"context": json.dumps(ctx, ensure_ascii=False)},
        {
            "template": (
                "user_template.docx",
                TPL.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        tok,
    )
    print("gen", st, len(data), hdrs.get("Content-Type") or hdrs.get("content-type"))
    if st != 200:
        print(data[:1000].decode("utf-8", "replace"))
    else:
        OUT.write_bytes(data)
        print("saved", OUT, OUT.stat().st_size)

    st, raw, _ = json_req(
        "POST",
        "/api/v1/data/from-url",
        {"url": GOOGLE, "sheet_name": None},
        token=tok,
    )
    print("from-url", st)
    if st != 200:
        print(raw[:800].decode("utf-8", "replace"))
        return
    ds = json.loads(raw)
    print("cols", ds.get("columns"))
    print("row_count", ds.get("meta", {}).get("row_count"))
    print("extra", ds.get("meta", {}).get("extra"))

    # Build mapping from first columns heuristically
    cols = ds.get("columns") or []
    rows = ds.get("rows") or []
    mapping = {
        "NN": cols[0] if cols else "",
        "date": cols[1] if len(cols) > 1 else (cols[0] if cols else ""),
        "number": cols[0] if cols else "",
        "name": cols[2] if len(cols) > 2 else (cols[0] if cols else ""),
        "code": cols[3] if len(cols) > 3 else (cols[0] if cols else ""),
    }
    header = rows[0] if rows else {}
    ctx2 = {k: header.get(v, "") for k, v in mapping.items() if v}
    ctx2["rows"] = rows[:50]
    st, data, _ = multipart(
        "/api/v1/generate/docx",
        {"context": json.dumps(ctx2, ensure_ascii=False)},
        {
            "template": (
                "user_template.docx",
                TPL.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        tok,
    )
    print("gen_sheet", st, len(data))
    if st != 200:
        print(data[:1200].decode("utf-8", "replace"))
    else:
        p = OUT.with_name("gen_from_sheet.docx")
        p.write_bytes(data)
        print("saved", p, p.stat().st_size)


if __name__ == "__main__":
    main()
