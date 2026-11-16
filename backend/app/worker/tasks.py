"""Celery tasks: batch generation + 24h artifact cleanup."""

from __future__ import annotations

import logging
import shutil
import uuid
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.job import Job
from app.services.doc_engine import convert_docx_to_pdf, render_docx
from app.services.job_artifacts import (
    RESULT_ZIP_NAME,
    ROWS_DIR_NAME,
    TEMPLATE_NAME,
    get_jobs_root,
    is_under_jobs_root,
    job_dir,
    load_rows,
    row_output_paths,
)
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _touch_updated(job: Job) -> None:
    job.updated_at = _utcnow()


@celery_app.task(name="app.worker.tasks.run_generation_job", bind=True)
def run_generation_job(self, job_id: str) -> dict:  # noqa: ARG001
    """Load job payload from disk, render each row, ZIP results."""
    db: Session = SessionLocal()
    try:
        try:
            jid = uuid.UUID(str(job_id))
        except ValueError:
            logger.error("Invalid job_id: %s", job_id)
            return {"ok": False, "error": "invalid job_id"}

        job = db.get(Job, jid)
        if job is None:
            logger.error("Job not found: %s", job_id)
            return {"ok": False, "error": "not found"}

        if job.status in ("done", "expired"):
            return {"ok": True, "status": job.status, "skipped": True}

        job.status = "running"
        job.error = None
        _touch_updated(job)
        db.commit()

        path = job_dir(job.organization_id, job.id)
        template_path = path / TEMPLATE_NAME
        if not template_path.is_file():
            job.status = "failed"
            job.error = "template.docx missing on disk"
            _touch_updated(job)
            db.commit()
            return {"ok": False, "error": job.error}

        try:
            rows = load_rows(path)
        except Exception as exc:  # noqa: BLE001
            job.status = "failed"
            job.error = f"rows.json invalid: {exc}"
            _touch_updated(job)
            db.commit()
            return {"ok": False, "error": job.error}

        template_bytes = template_path.read_bytes()
        output_format = (job.output_format or "docx").lower()
        rows_dir = path / ROWS_DIR_NAME
        rows_dir.mkdir(parents=True, exist_ok=True)

        job.total_rows = len(rows)
        job.done_rows = 0
        _touch_updated(job)
        db.commit()

        try:
            for idx, row in enumerate(rows):
                if not isinstance(row, dict):
                    raise TypeError(f"row {idx} must be a JSON object")

                outs = row_output_paths(path, idx, output_format)
                need_docx = "docx" in outs and not outs["docx"].is_file()
                need_pdf = "pdf" in outs and not outs["pdf"].is_file()

                # Idempotent: skip if all requested outputs already exist.
                if not need_docx and not need_pdf and outs:
                    job.done_rows = idx + 1
                    _touch_updated(job)
                    db.commit()
                    continue

                context = row
                rendered: bytes | None = None
                if need_docx or need_pdf or "docx" in outs or "pdf" in outs:
                    # Re-render if any output missing (or always when producing).
                    if need_docx or need_pdf:
                        rendered = render_docx(template_bytes, context)

                if "docx" in outs and need_docx and rendered is not None:
                    outs["docx"].write_bytes(rendered)

                if "pdf" in outs and need_pdf:
                    if rendered is None:
                        rendered = render_docx(template_bytes, context)
                    pdf_bytes = convert_docx_to_pdf(rendered)
                    outs["pdf"].write_bytes(pdf_bytes)

                job.done_rows = idx + 1
                _touch_updated(job)
                db.commit()

            zip_path = path / RESULT_ZIP_NAME
            if zip_path.exists():
                zip_path.unlink()
            with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                for file_path in sorted(rows_dir.iterdir()):
                    if file_path.is_file():
                        zf.write(file_path, arcname=file_path.name)

            job.zip_path = str(zip_path)
            job.status = "done"
            job.error = None
            _touch_updated(job)
            db.commit()
            return {"ok": True, "status": "done", "done_rows": job.done_rows}
        except Exception as exc:  # noqa: BLE001
            logger.exception("Job %s failed", job_id)
            job.status = "failed"
            job.error = str(exc)[:2000]
            _touch_updated(job)
            db.commit()
            return {"ok": False, "error": job.error}
    finally:
        db.close()


@celery_app.task(name="app.worker.tasks.cleanup_expired_artifacts")
def cleanup_expired_artifacts() -> dict:
    """
    Delete job artifact directories older than ARTIFACT_TTL_HOURS.

    Safety: only removes paths under get_jobs_root() (.runtime/jobs by default).
    Never touches user/PII databases or other tables.
    """
    settings = get_settings()
    ttl = max(1, int(settings.artifact_ttl_hours or 24))
    cutoff = _utcnow() - timedelta(hours=ttl)
    root = get_jobs_root()
    root.mkdir(parents=True, exist_ok=True)

    removed_dirs: list[str] = []
    expired_job_ids: list[str] = []

    db: Session = SessionLocal()
    try:
        # Mark DB jobs past TTL (by created_at) and remove their dirs.
        jobs = (
            db.query(Job)
            .filter(Job.status.in_(("queued", "running", "done", "failed")))
            .all()
        )
        for job in jobs:
            created = job.created_at
            if created is not None and created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            if created is None or created > cutoff:
                continue
            path = job_dir(job.organization_id, job.id)
            if path.is_dir() and is_under_jobs_root(path):
                shutil.rmtree(path, ignore_errors=True)
                removed_dirs.append(str(path))
            job.status = "expired"
            job.zip_path = None
            _touch_updated(job)
            expired_job_ids.append(str(job.id))
        db.commit()

        # Orphan dirs under jobs root with old mtime (no matching open job path).
        if root.is_dir() and is_under_jobs_root(root):
            for org_dir in root.iterdir():
                if not org_dir.is_dir():
                    continue
                if not is_under_jobs_root(org_dir):
                    continue
                for jdir in list(org_dir.iterdir()):
                    if not jdir.is_dir():
                        continue
                    if not is_under_jobs_root(jdir):
                        continue
                    try:
                        mtime = datetime.fromtimestamp(
                            jdir.stat().st_mtime, tz=timezone.utc
                        )
                    except OSError:
                        continue
                    if mtime > cutoff:
                        continue
                    # Skip if still an active (non-expired) job referencing this path.
                    try:
                        jid = uuid.UUID(jdir.name)
                    except ValueError:
                        shutil.rmtree(jdir, ignore_errors=True)
                        removed_dirs.append(str(jdir))
                        continue
                    job = db.get(Job, jid)
                    if job is not None and job.status not in ("expired",):
                        created = job.created_at
                        if created is not None and created.tzinfo is None:
                            created = created.replace(tzinfo=timezone.utc)
                        if created is not None and created > cutoff:
                            continue
                    shutil.rmtree(jdir, ignore_errors=True)
                    removed_dirs.append(str(jdir))
                    if job is not None and job.status != "expired":
                        job.status = "expired"
                        job.zip_path = None
                        _touch_updated(job)
                        expired_job_ids.append(str(job.id))
                # Remove empty org dirs
                try:
                    if org_dir.is_dir() and not any(org_dir.iterdir()):
                        org_dir.rmdir()
                except OSError:
                    pass
        db.commit()
    finally:
        db.close()

    return {
        "ok": True,
        "removed_dirs": len(removed_dirs),
        "expired_jobs": len(expired_job_ids),
    }


@celery_app.task(name="app.worker.tasks.cleanup_pii_retention")
def cleanup_pii_retention() -> dict:
    """Anonymize ПДн older than PII_RETENTION_DAYS (0 = disabled). Never drops audit rows."""
    settings = get_settings()
    days = int(settings.pii_retention_days or 0)
    if days <= 0:
        return {"ok": True, "anonymized": 0, "skipped": True}

    from app.services.pii_service import PiiService

    db: Session = SessionLocal()
    try:
        n = PiiService(db).anonymize_stale_profiles(retention_days=days)
        db.commit()
        return {"ok": True, "anonymized": n, "retention_days": days}
    finally:
        db.close()


@celery_app.task(name="app.worker.tasks.send_marketing_campaign")
def send_marketing_campaign(campaign_id: str) -> dict:
    """Send HTML marketing campaign to all opted-in users."""
    from app.services import marketing_service

    db: Session = SessionLocal()
    try:
        stats = marketing_service.process_campaign(
            db, uuid.UUID(campaign_id), settings=get_settings()
        )
        db.commit()
        return {"ok": True, "campaign_id": campaign_id, **stats}
    except LookupError:
        db.rollback()
        return {"ok": False, "campaign_id": campaign_id, "error": "not_found"}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
