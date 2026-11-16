"""C-18 load smoke — 10 rows via TestClient (eager Celery, no Redis)."""

from __future__ import annotations

import io
import json
import time
import zipfile
from pathlib import Path

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "docx"
FLAT = FIXTURES / "flat_tags.docx"


def _auth_headers(client, register_payload):
    # Unique email so parallel/re-runs do not collide if fixtures change.
    payload = {
        **register_payload,
        "email": f"load_smoke_{int(time.time() * 1000)}@example.com",
    }
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201, reg.text
    return {"Authorization": f"Bearer {reg.json()['access_token']}"}


def test_load_smoke_10_rows_done_zip(client, register_payload, artifact_root):
    assert FLAT.is_file()
    assert artifact_root.is_dir()
    headers = _auth_headers(client, register_payload)
    rows = [
        {"ClientName": f"Smoke {i}", "ContractDate": f"2026-01-{(i % 28) + 1:02d}"}
        for i in range(10)
    ]

    t0 = time.perf_counter()
    create = client.post(
        "/api/v1/jobs",
        headers=headers,
        files={
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"rows": json.dumps(rows), "output": "docx"},
    )
    assert create.status_code == 201, create.text
    job_id = create.json()["id"]

    # Eager mode should finish quickly; always poll JobStatus (create payload is thinner).
    deadline = time.perf_counter() + 60.0
    status_body: dict = {}
    while True:
        assert time.perf_counter() < deadline, f"job timeout: {status_body}"
        status = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
        assert status.status_code == 200, status.text
        status_body = status.json()
        if status_body.get("status") in ("done", "failed", "error"):
            break
        time.sleep(0.05)

    elapsed = time.perf_counter() - t0
    assert status_body["status"] == "done", status_body
    assert status_body["total_rows"] == 10
    assert status_body["done_rows"] == 10
    assert elapsed < 60.0, f"smoke too slow: {elapsed:.2f}s"

    dl = client.get(f"/api/v1/jobs/{job_id}/download", headers=headers)
    assert dl.status_code == 200, dl.text
    assert dl.content[:2] == b"PK"
    assert len(dl.content) > 0

    with zipfile.ZipFile(io.BytesIO(dl.content)) as zf:
        names = zf.namelist()
    assert len(names) == 10
    assert "row_00000.docx" in names
    assert "row_00009.docx" in names
