"""Tests for 24h job artifact cleanup (disk only under jobs root)."""

from __future__ import annotations

import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.job import Job
from app.services.job_artifacts import ensure_job_dir, get_jobs_root
from app.worker.tasks import cleanup_expired_artifacts


def test_cleanup_removes_old_keeps_fresh(client, register_payload, artifact_root, monkeypatch):
    assert get_jobs_root() == Path(artifact_root).resolve()

    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200, me.text
    org_id = uuid.UUID(me.json()["organization_id"])
    user_id = uuid.UUID(me.json()["id"])

    old_id = uuid.uuid4()
    fresh_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    db = SessionLocal()
    try:
        db.add(
            Job(
                id=old_id,
                organization_id=org_id,
                created_by=user_id,
                status="done",
                total_rows=1,
                done_rows=1,
                output_format="docx",
                created_at=now - timedelta(hours=48),
                updated_at=now - timedelta(hours=48),
            )
        )
        db.add(
            Job(
                id=fresh_id,
                organization_id=org_id,
                created_by=user_id,
                status="done",
                total_rows=1,
                done_rows=1,
                output_format="docx",
                created_at=now - timedelta(hours=1),
                updated_at=now - timedelta(hours=1),
            )
        )
        db.commit()
    finally:
        db.close()

    old_dir = ensure_job_dir(org_id, old_id)
    fresh_dir = ensure_job_dir(org_id, fresh_id)
    (old_dir / "marker.txt").write_text("old", encoding="utf-8")
    (fresh_dir / "marker.txt").write_text("fresh", encoding="utf-8")

    old_ts = time.time() - 48 * 3600
    os.utime(old_dir, (old_ts, old_ts))

    monkeypatch.setenv("ARTIFACT_TTL_HOURS", "24")
    get_settings.cache_clear()

    result = cleanup_expired_artifacts()
    assert result["ok"] is True
    assert result["removed_dirs"] >= 1

    assert not old_dir.exists()
    assert fresh_dir.exists()
    assert (fresh_dir / "marker.txt").read_text(encoding="utf-8") == "fresh"

    db = SessionLocal()
    try:
        refreshed_old = db.get(Job, old_id)
        refreshed_fresh = db.get(Job, fresh_id)
        assert refreshed_old is not None
        assert refreshed_old.status == "expired"
        assert refreshed_fresh is not None
        assert refreshed_fresh.status == "done"
    finally:
        db.close()
