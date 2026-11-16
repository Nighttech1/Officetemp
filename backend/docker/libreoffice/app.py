"""Minimal LibreOffice headless convert sidecar."""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response

app = FastAPI(title="LibreOffice Convert Sidecar", docs_url="/docs")

LIBREOFFICE_BIN = os.environ.get("LIBREOFFICE_BIN", "soffice")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "bin": LIBREOFFICE_BIN}


@app.post("/convert")
async def convert(file: UploadFile = File(...)) -> Response:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty file")

    executable = shutil.which(LIBREOFFICE_BIN) or LIBREOFFICE_BIN
    with tempfile.TemporaryDirectory(prefix="lo_sidecar_") as tmp:
        tmp_path = Path(tmp)
        src = tmp_path / f"{uuid.uuid4().hex}.docx"
        src.write_bytes(data)
        out_dir = tmp_path / "out"
        out_dir.mkdir()
        cmd = [
            executable,
            "--headless",
            "--nologo",
            "--nofirststartwizard",
            "--convert-to",
            "pdf",
            "--outdir",
            str(out_dir),
            str(src),
        ]
        try:
            completed = subprocess.run(
                cmd, check=False, capture_output=True, timeout=120
            )
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=503,
                detail=f"LibreOffice not found: {executable}",
            ) from exc
        except subprocess.TimeoutExpired as exc:
            raise HTTPException(status_code=504, detail="conversion timed out") from exc

        if completed.returncode != 0:
            err = (completed.stderr or completed.stdout or b"").decode(
                "utf-8", errors="replace"
            )
            raise HTTPException(
                status_code=500,
                detail=f"conversion failed: {err[:500]}",
            )

        pdfs = list(out_dir.glob("*.pdf"))
        if not pdfs:
            raise HTTPException(status_code=500, detail="no PDF produced")
        return Response(
            content=pdfs[0].read_bytes(),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="converted.pdf"'},
        )
