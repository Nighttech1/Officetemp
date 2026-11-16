"""Load-test POST /api/v1/jobs with flat_tags.docx + N synthetic rows.

Modes:
  live (default) — HTTP against --api (needs uvicorn; prefer CELERY_TASK_ALWAYS_EAGER)
  --inprocess    — FastAPI TestClient + SQLite + eager Celery (CI-friendly, no server)

Examples:
  python scripts/load_test_jobs.py --inprocess --rows 100
  python scripts/load_test_jobs.py --rows 100 --api http://127.0.0.1:8000
  python scripts/load_test_jobs.py --rows 1000   # Redis+worker recommended unless eager
"""

from __future__ import annotations

import argparse
import io
import json
import sys
import time
import uuid
import zipfile
from http.client import HTTPConnection
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
FLAT = ROOT / "tests" / "fixtures" / "docx" / "flat_tags.docx"
DEFAULT_REPORT = (
    Path(__file__).resolve().parents[2]
    / "memory"
    / "waves"
    / "W-06-phase5-hardening"
    / "load-report.md"
)


def _rows(n: int) -> list[dict[str, str]]:
    return [
        {"ClientName": f"Client {i:05d}", "ContractDate": f"2026-{(i % 12) + 1:02d}-15"}
        for i in range(n)
    ]


def _multipart(fields: dict[str, str], files: dict) -> tuple[bytes, str]:
    boundary = f"----B{uuid.uuid4().hex}"
    chunks: list[bytes] = []
    for name, value in fields.items():
        chunks.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode()
        )
    for name, (fn, content, ctype) in files.items():
        chunks.append(
            (
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; "
                f'filename="{fn}"\r\nContent-Type: {ctype}\r\n\r\n'
            ).encode()
        )
        chunks.append(content)
        chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def _http_req(
    host: str, port: int, method: str, path: str, body: bytes | None = None, headers: dict | None = None
) -> tuple[int, bytes]:
    conn = HTTPConnection(host, port, timeout=600)
    conn.request(method, path, body=body, headers=headers or {})
    resp = conn.getresponse()
    data = resp.read()
    conn.close()
    return resp.status, data


def _write_report(
    path: Path,
    *,
    mode: str,
    rows: int,
    seconds: float,
    success: bool,
    job_id: str | None,
    zip_files: int | None,
    api: str | None,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rps = (rows / seconds) if seconds > 0 else 0.0
    lines = [
        "# Load report — W-06 / C-18",
        "",
        f"- **mode:** `{mode}`",
        f"- **rows:** {rows}",
        f"- **wall_seconds:** {seconds:.3f}",
        f"- **rows_per_sec:** {rps:.2f}",
        f"- **success:** {success}",
        f"- **job_id:** {job_id or '—'}",
        f"- **zip_files:** {zip_files if zip_files is not None else '—'}",
        f"- **api:** {api or 'in-process TestClient'}",
        "",
        "Notes:",
        "- In-process / eager Celery does not need Redis.",
        "- For `--rows 1000` against a live worker, Redis + celery worker are recommended unless `CELERY_TASK_ALWAYS_EAGER=true`.",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"report_written {path}")


def run_inprocess(rows_n: int, report_path: Path, timeout_s: float) -> int:
    """CI-friendly path: TestClient + conftest-like SQLite eager setup."""
    import os
    import tempfile

    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))

    os.environ.setdefault("DATABASE_URL", "sqlite://")
    os.environ.setdefault("PII_SCHEMA", "")
    os.environ.setdefault("JWT_SECRET", "load-test-secret-key-only")
    os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")
    os.environ.setdefault("S3_ENDPOINT_URL", "http://localhost:9000")
    os.environ.setdefault("S3_ACCESS_KEY", "testkey")
    os.environ.setdefault("S3_SECRET_KEY", "testsecret")
    os.environ.setdefault("S3_BUCKET", "test-bucket")
    os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
    os.environ.setdefault("PDF_ENGINE", "dxpdf")
    os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"
    os.environ.setdefault("CELERY_BROKER_URL", "memory://")
    os.environ.setdefault("CELERY_RESULT_BACKEND", "cache+memory://")
    os.environ.setdefault("ARTIFACT_TTL_HOURS", "24")

    artifact = Path(tempfile.mkdtemp(prefix="load_jobs_"))
    os.environ["ARTIFACT_ROOT"] = str(artifact)

    # Import after env
    from fastapi.testclient import TestClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.core.config import get_settings

    get_settings.cache_clear()

    from app.db.base import Base
    from app.db import session as db_session
    import app.models  # noqa: F401
    from app.db.session import get_db
    from app.main import create_app
    from app.worker.celery_app import celery_app

    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    db_session.engine = engine
    db_session.SessionLocal = SessionLocal
    db_session._settings = get_settings()
    Base.metadata.create_all(bind=engine)

    def _override_get_db():
        session = SessionLocal()
        try:
            yield session
        finally:
            session.close()

    app = create_app()
    app.dependency_overrides[get_db] = _override_get_db

    assert FLAT.is_file(), f"missing fixture {FLAT}"
    email = f"load_{uuid.uuid4().hex[:12]}@example.com"
    rows = _rows(rows_n)

    t0 = time.perf_counter()
    success = False
    job_id: str | None = None
    zip_files: int | None = None

    with TestClient(app) as client:
        reg = client.post(
            "/api/v1/auth/register",
            json={
                "org_name": "Load Org",
                "email": email,
                "password": "password123",
                "full_name": "Load User",
            },
        )
        if reg.status_code != 201:
            print("register_failed", reg.status_code, reg.text)
            _write_report(
                report_path,
                mode="inprocess",
                rows=rows_n,
                seconds=time.perf_counter() - t0,
                success=False,
                job_id=None,
                zip_files=None,
                api=None,
            )
            return 1
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

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
        if create.status_code != 201:
            print("create_failed", create.status_code, create.text)
            _write_report(
                report_path,
                mode="inprocess",
                rows=rows_n,
                seconds=time.perf_counter() - t0,
                success=False,
                job_id=None,
                zip_files=None,
                api=None,
            )
            return 1

        job_id = create.json()["id"]
        deadline = time.perf_counter() + timeout_s
        status_body = create.json()
        while status_body.get("status") not in ("done", "failed", "error"):
            if time.perf_counter() > deadline:
                print("timeout waiting for job", job_id, status_body)
                break
            st = client.get(f"/api/v1/jobs/{job_id}", headers=headers)
            status_body = st.json()
            if status_body.get("status") in ("done", "failed", "error"):
                break
            time.sleep(0.05)

        elapsed = time.perf_counter() - t0
        if status_body.get("status") == "done":
            dl = client.get(f"/api/v1/jobs/{job_id}/download", headers=headers)
            if dl.status_code == 200 and dl.content[:2] == b"PK":
                with zipfile.ZipFile(io.BytesIO(dl.content)) as zf:
                    zip_files = len(zf.namelist())
                success = zip_files == rows_n and zip_files > 0
            else:
                print("download_failed", dl.status_code)
        else:
            print("job_not_done", status_body)

    print(
        json.dumps(
            {
                "mode": "inprocess",
                "rows": rows_n,
                "seconds": round(elapsed, 3),
                "rows_per_sec": round(rows_n / elapsed, 2) if elapsed else 0,
                "success": success,
                "job_id": job_id,
                "zip_files": zip_files,
            },
            ensure_ascii=False,
        )
    )
    _write_report(
        report_path,
        mode="inprocess",
        rows=rows_n,
        seconds=elapsed,
        success=success,
        job_id=job_id,
        zip_files=zip_files,
        api=None,
    )
    return 0 if success else 1


def run_live(api: str, rows_n: int, report_path: Path, timeout_s: float) -> int:
    parsed = urlparse(api if "://" in api else f"http://{api}")
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 8000
    assert FLAT.is_file(), f"missing fixture {FLAT}"

    st, body = _http_req(host, port, "GET", "/health")
    if st != 200:
        print("health_failed", st, body[:200])
        _write_report(
            report_path,
            mode="live",
            rows=rows_n,
            seconds=0,
            success=False,
            job_id=None,
            zip_files=None,
            api=api,
        )
        return 1

    email = f"load_{uuid.uuid4().hex[:12]}@example.com"
    reg_body = json.dumps(
        {
            "org_name": "Load Org",
            "email": email,
            "password": "password123",
            "full_name": "Load User",
        }
    ).encode()
    st, body = _http_req(
        host,
        port,
        "POST",
        "/api/v1/auth/register",
        body=reg_body,
        headers={"Content-Type": "application/json"},
    )
    if st != 201:
        print("register_failed", st, body[:300])
        return 1
    token = json.loads(body)["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    rows = _rows(rows_n)
    mp, ctype = _multipart(
        {"rows": json.dumps(rows), "output": "docx"},
        {
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    t0 = time.perf_counter()
    st, body = _http_req(
        host,
        port,
        "POST",
        "/api/v1/jobs",
        body=mp,
        headers={**auth, "Content-Type": ctype},
    )
    if st != 201:
        print("create_failed", st, body[:300])
        _write_report(
            report_path,
            mode="live",
            rows=rows_n,
            seconds=time.perf_counter() - t0,
            success=False,
            job_id=None,
            zip_files=None,
            api=api,
        )
        return 1

    job_id = json.loads(body)["id"]
    status_body = json.loads(body)
    deadline = time.perf_counter() + timeout_s
    while status_body.get("status") not in ("done", "failed", "error"):
        if time.perf_counter() > deadline:
            print("timeout", job_id, status_body)
            break
        st, body = _http_req(host, port, "GET", f"/api/v1/jobs/{job_id}", headers=auth)
        status_body = json.loads(body)
        if status_body.get("status") in ("done", "failed", "error"):
            break
        time.sleep(0.2)

    elapsed = time.perf_counter() - t0
    success = False
    zip_files: int | None = None
    if status_body.get("status") == "done":
        st, body = _http_req(host, port, "GET", f"/api/v1/jobs/{job_id}/download", headers=auth)
        if st == 200 and body[:2] == b"PK":
            with zipfile.ZipFile(io.BytesIO(body)) as zf:
                zip_files = len(zf.namelist())
            success = zip_files == rows_n and zip_files > 0

    print(
        json.dumps(
            {
                "mode": "live",
                "rows": rows_n,
                "seconds": round(elapsed, 3),
                "rows_per_sec": round(rows_n / elapsed, 2) if elapsed else 0,
                "success": success,
                "job_id": job_id,
                "zip_files": zip_files,
                "api": api,
            },
            ensure_ascii=False,
        )
    )
    _write_report(
        report_path,
        mode="live",
        rows=rows_n,
        seconds=elapsed,
        success=success,
        job_id=job_id,
        zip_files=zip_files,
        api=api,
    )
    return 0 if success else 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Doc SaaS jobs load test")
    parser.add_argument("--rows", type=int, default=100, help="Number of synthetic rows (default 100)")
    parser.add_argument(
        "--api",
        default="http://127.0.0.1:8000",
        help="Base API URL for live mode (default http://127.0.0.1:8000)",
    )
    parser.add_argument(
        "--inprocess",
        action="store_true",
        help="Use FastAPI TestClient + eager Celery (no live server)",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=DEFAULT_REPORT,
        help="Path to write load-report.md",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=600.0,
        help="Seconds to wait for job completion",
    )
    args = parser.parse_args(argv)

    if args.rows < 1:
        print("--rows must be >= 1")
        return 2

    if args.inprocess:
        return run_inprocess(args.rows, args.report, args.timeout)
    return run_live(args.api, args.rows, args.report, args.timeout)


if __name__ == "__main__":
    sys.exit(main())
