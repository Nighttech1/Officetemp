import json
from pathlib import Path

import urllib.request

base = "http://127.0.0.1:8001"


def req(method: str, path: str, data: bytes | None = None, headers: dict | None = None):
    h = dict(headers or {})
    r = urllib.request.Request(base + path, data=data, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=120) as resp:
        return resp.status, resp.read()


print("health", req("GET", "/health")[1])
body = json.dumps({"email": "admin1", "password": "admin1"}).encode()
st, raw = req("POST", "/api/v1/auth/login", body, {"Content-Type": "application/json"})
print("login", st)
tok = json.loads(raw)["access_token"]
pdf = list(Path(r"E:/Applications/OfficeTemp/templates").glob("*.pdf"))[0]
boundary = "----Boundary7MA4YWxkTrZu0gW"
filename = pdf.name.encode("utf-8").decode("latin-1", errors="replace")
# use ASCII-safe filename in multipart
safe_name = "drawing.pdf"
payload = pdf.read_bytes()
parts = []
parts.append(f"--{boundary}\r\n".encode())
parts.append(
    f'Content-Disposition: form-data; name="file"; filename="{safe_name}"\r\n'.encode()
)
parts.append(b"Content-Type: application/pdf\r\n\r\n")
parts.append(payload)
parts.append(f"\r\n--{boundary}--\r\n".encode())
data = b"".join(parts)
st, raw = req(
    "POST",
    "/api/v1/iul/analyze-pdf",
    data,
    {
        "Authorization": f"Bearer {tok}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    },
)
print("analyze", st)
out = Path(r"E:/Applications/OfficeTemp/memory/tickets/_tmp_api_analyze.json")
out.write_text(raw.decode("utf-8"), encoding="utf-8")
obj = json.loads(raw)
print(obj.get("doc_designation"), [s["surname"] for s in obj.get("signatures", [])])
