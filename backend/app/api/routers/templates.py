"""Templates API — always scoped by JWT org_id."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.deps import AuthUser, DbSession
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateOut
from app.services.template_analyzer import analyze_template

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("/analyze")
async def analyze_uploaded_template(
    current: AuthUser,
    template: UploadFile = File(...),
) -> dict:
    """Read-only Jinja/docxtpl tag extraction from an uploaded .docx."""
    _ = current  # JWT required for tenant gate; analyze does not persist.
    if not template.filename or not template.filename.lower().endswith(".docx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="template must be a .docx file",
        )
    data = await template.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="template file is empty",
        )
    try:
        tags = analyze_template(data)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to analyze template: {exc}",
        ) from exc
    return {"tags": tags}


@router.get("", response_model=list[TemplateOut])
def list_templates(current: AuthUser, db: DbSession) -> list[TemplateOut]:
    rows = (
        db.query(Template)
        .filter(Template.organization_id == current.organization_id)
        .order_by(Template.created_at.desc())
        .all()
    )
    return [
        TemplateOut(
            id=str(t.id),
            organization_id=str(t.organization_id),
            name=t.name,
            storage_key=t.storage_key,
            created_by=str(t.created_by) if t.created_by else None,
            created_at=t.created_at,
        )
        for t in rows
    ]


@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(
    body: TemplateCreate,
    current: AuthUser,
    db: DbSession,
) -> TemplateOut:
    template = Template(
        id=uuid.uuid4(),
        organization_id=current.organization_id,
        name=body.name.strip(),
        storage_key=body.storage_key.strip(),
        created_by=current.id,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return TemplateOut(
        id=str(template.id),
        organization_id=str(template.organization_id),
        name=template.name,
        storage_key=template.storage_key,
        created_by=str(template.created_by) if template.created_by else None,
        created_at=template.created_at,
    )
