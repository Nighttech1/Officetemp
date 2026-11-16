"""API tests for Celery jobs (eager mode — no Redis)."""

from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "docx"
FLAT = FIXTURES / "flat_tags.docx"


def _auth_headers(client, register_payload):
    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_job_eager_done_and_download_zip(client, register_payload, artifact_root):
    assert FLAT.is_file()
    assert artifact_root.is_dir()
    headers = _auth_headers(client, register_payload)
    rows = [
        {"ClientName": "ACME One", "ContractDate": "2026-01-01"},
        {"ClientName": "ACME Two", "ContractDate": "2026-02-02"},
    ]

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
    body = create.json()
    assert "id" in body
    job_id = body["id"]
    # Eager Celery runs inline — expect done (or briefly queued if race; poll once).
    assert body["status"] in ("queued", "running", "done")

    status = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
    assert status.status_code == 200, status.text
    st = status.json()
    assert st["status"] == "done"
    assert st["total_rows"] == 2
    assert st["done_rows"] == 2
    assert st["progress_percent"] == 100.0

    dl = client.get(f"/api/v1/jobs/{job_id}/download", headers=headers)
    assert dl.status_code == 200, dl.text
    assert "zip" in dl.headers.get("content-type", "").lower() or dl.content[:2] == b"PK"

    with zipfile.ZipFile(io.BytesIO(dl.content)) as zf:
        names = sorted(zf.namelist())
    assert "row_00000.docx" in names
    assert "row_00001.docx" in names
    assert len(names) == 2


def test_download_before_done_returns_409(client, register_payload, artifact_root, monkeypatch):
    headers = _auth_headers(client, register_payload)

    # Prevent eager execution so job stays queued.
    from app.worker import tasks as tasks_mod

    monkeypatch.setattr(
        tasks_mod.run_generation_job,
        "delay",
        lambda *_a, **_k: None,
    )

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
        data={
            "rows": json.dumps([{"ClientName": "X", "ContractDate": "Y"}]),
            "output": "docx",
        },
    )
    assert create.status_code == 201, create.text
    job_id = create.json()["id"]
    assert create.json()["status"] == "queued"

    dl = client.get(f"/api/v1/jobs/{job_id}/download", headers=headers)
    assert dl.status_code == 409


def test_jobs_require_auth(client, artifact_root):
    resp = client.post(
        "/api/v1/jobs",
        files={
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"rows": "[]", "output": "docx"},
    )
    assert resp.status_code == 401
