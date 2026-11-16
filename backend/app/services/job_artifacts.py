"""On-disk job artifact layout under ``.runtime/jobs`` (never outside this root)."""

from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any

from app.core.config import get_settings

# backend/ package root (…/backend)
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_JOBS_ROOT = _BACKEND_ROOT / ".runtime" / "jobs"

TEMPLATE_NAME = "template.docx"
ROWS_NAME = "rows.json"
RESULT_ZIP_NAME = "result.zip"
ROWS_DIR_NAME = "rows"


def get_jobs_root() -> Path:
    """Return absolute artifact root. Cleanup MUST only delete under this path."""
    settings = get_settings()
    configured = (settings.artifact_root or "").strip()
    if configured:
        return Path(configured).resolve()
    return _DEFAULT_JOBS_ROOT.resolve()


def job_dir(organization_id: uuid.UUID | str, job_id: uuid.UUID | str) -> Path:
    return get_jobs_root() / str(organization_id) / str(job_id)


def ensure_job_dir(organization_id: uuid.UUID | str, job_id: uuid.UUID | str) -> Path:
    path = job_dir(organization_id, job_id)
    path.mkdir(parents=True, exist_ok=True)
    (path / ROWS_DIR_NAME).mkdir(parents=True, exist_ok=True)
    return path


def save_job_payload(
    organization_id: uuid.UUID | str,
    job_id: uuid.UUID | str,
    *,
    template_bytes: bytes,
    rows: list[dict[str, Any]],
) -> Path:
    path = ensure_job_dir(organization_id, job_id)
    (path / TEMPLATE_NAME).write_bytes(template_bytes)
    (path / ROWS_NAME).write_text(
        json.dumps(rows, ensure_ascii=False, indent=None),
        encoding="utf-8",
    )
    return path


def load_rows(job_path: Path) -> list[dict[str, Any]]:
    raw = json.loads((job_path / ROWS_NAME).read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("rows.json must be a JSON array")
    return raw


def row_output_paths(
    job_path: Path,
    row_index: int,
    output_format: str,
) -> dict[str, Path]:
    """Return expected output paths for a row (idempotency checks)."""
    base = job_path / ROWS_DIR_NAME / f"row_{row_index:05d}"
    paths: dict[str, Path] = {}
    fmt = (output_format or "docx").lower()
    if fmt in ("docx", "both"):
        paths["docx"] = Path(str(base) + ".docx")
    if fmt in ("pdf", "both"):
        paths["pdf"] = Path(str(base) + ".pdf")
    return paths


def is_under_jobs_root(path: Path) -> bool:
    """Safety: path must resolve under get_jobs_root()."""
    root = get_jobs_root()
    try:
        path.resolve().relative_to(root)
        return True
    except ValueError:
        return False
