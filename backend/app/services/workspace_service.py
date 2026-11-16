"""Workspace sync service — org-scoped replace snapshot (LWW MVP)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models.workspace import (
    SignatureAsset,
    SignatureFolder,
    WorkspaceDocument,
    WorkspaceFolder,
    WorkspaceProject,
)
from app.schemas.workspace import (
    SnapshotDocument,
    SnapshotFolder,
    SnapshotProject,
    SnapshotSignature,
    SnapshotSignatureFolder,
    WorkspaceSnapshot,
)

# Cap preview in DB to avoid abusing Postgres with huge base64 blobs.
_MAX_PREVIEW_CHARS = 200_000


def _now() -> datetime:
    return datetime.now(timezone.utc)


class WorkspaceService:
    def __init__(self, db: Session, organization_id: uuid.UUID, user_id: uuid.UUID) -> None:
        self.db = db
        self.org_id = organization_id
        self.user_id = user_id

    def _revision(self) -> int:
        """Cheap revision: max(updated_at) epoch seconds across workspace tables."""
        stamps: list[datetime] = []
        for model in (
            WorkspaceProject,
            WorkspaceFolder,
            WorkspaceDocument,
            SignatureFolder,
            SignatureAsset,
        ):
            q = self.db.scalar(
                select(func.max(model.updated_at)).where(model.organization_id == self.org_id)
            )
            if q is not None:
                stamps.append(q)
        if not stamps:
            return 0
        latest = max(stamps)
        return int(latest.timestamp())

    def is_empty(self) -> bool:
        n = self.db.scalar(
            select(func.count())
            .select_from(WorkspaceProject)
            .where(WorkspaceProject.organization_id == self.org_id)
        )
        return int(n or 0) == 0

    def get_snapshot(self) -> WorkspaceSnapshot:
        projects = self.db.scalars(
            select(WorkspaceProject).where(WorkspaceProject.organization_id == self.org_id)
        ).all()
        folders = self.db.scalars(
            select(WorkspaceFolder).where(WorkspaceFolder.organization_id == self.org_id)
        ).all()
        documents = self.db.scalars(
            select(WorkspaceDocument).where(WorkspaceDocument.organization_id == self.org_id)
        ).all()
        sig_folders = self.db.scalars(
            select(SignatureFolder).where(SignatureFolder.organization_id == self.org_id)
        ).all()
        signatures = self.db.scalars(
            select(SignatureAsset).where(SignatureAsset.organization_id == self.org_id)
        ).all()

        project_by_id = {p.id: p for p in projects}
        # Map server UUID → client_id for nested refs
        proj_client = {p.id: p.client_id for p in projects}

        out_projects = [
            SnapshotProject(
                id=p.client_id,
                kind=p.kind,  # type: ignore[arg-type]
                name=p.name,
                createdAt=p.created_at.isoformat(),
                iulSignSettings=(p.settings or None),
            )
            for p in projects
        ]
        out_folders = [
            SnapshotFolder(
                id=f.client_id,
                projectId=proj_client.get(f.project_id, ""),
                parentId=f.parent_client_id,
                name=f.name,
                systemKey=(
                    f.system_key
                    if f.system_key in ("signatures", "iul", "waybills")
                    else None
                ),  # type: ignore[arg-type]
                createdAt=f.created_at.isoformat(),
            )
            for f in folders
            if f.project_id in project_by_id
        ]
        out_docs = [
            SnapshotDocument(
                id=d.client_id,
                projectId=proj_client.get(d.project_id, ""),
                folderId=d.folder_client_id,
                kind=d.kind,  # type: ignore[arg-type]
                title=d.title,
                version=d.version,
                parentId=d.parent_client_id,
                status=d.status,  # type: ignore[arg-type]
                wizard=d.wizard or {},
                iulWizard=d.iul_wizard,
                templateStorageKey=(d.wizard or {}).get("templateStorageKey")
                if isinstance(d.wizard, dict)
                else None,
                dataFileStorageKey=(d.wizard or {}).get("dataFileStorageKey")
                if isinstance(d.wizard, dict)
                else None,
                createdAt=d.created_at.isoformat(),
                updatedAt=d.updated_at.isoformat(),
            )
            for d in documents
            if d.project_id in project_by_id
        ]
        out_sig_folders = [
            SnapshotSignatureFolder(
                id=f.client_id,
                projectId=f.project_client_id,
                parentId=f.parent_client_id,
                name=f.name,
                createdAt=f.created_at.isoformat(),
            )
            for f in sig_folders
        ]
        out_sigs = [
            SnapshotSignature(
                id=s.client_id,
                projectId=s.project_client_id,
                folderId=s.folder_client_id,
                surname=s.surname,
                storageKey=s.storage_key,
                contentType=s.content_type,
                imageDataUrl=s.preview_data_url,
                createdAt=s.created_at.isoformat(),
            )
            for s in signatures
        ]

        rev = self._revision()
        return WorkspaceSnapshot(
            projects=out_projects,
            folders=out_folders,
            documents=out_docs,
            signatureFolders=out_sig_folders,
            signatures=out_sigs,
            revision=rev,
        )

    def replace_snapshot(self, snap: WorkspaceSnapshot) -> int:
        """Full replace for org (LWW). Never accepts source PDF bytes fields."""
        now = _now()

        self.db.execute(
            delete(WorkspaceDocument).where(WorkspaceDocument.organization_id == self.org_id)
        )
        self.db.execute(
            delete(WorkspaceFolder).where(WorkspaceFolder.organization_id == self.org_id)
        )
        self.db.execute(
            delete(WorkspaceProject).where(WorkspaceProject.organization_id == self.org_id)
        )
        self.db.execute(
            delete(SignatureAsset).where(SignatureAsset.organization_id == self.org_id)
        )
        self.db.execute(
            delete(SignatureFolder).where(SignatureFolder.organization_id == self.org_id)
        )
        self.db.flush()

        client_to_uuid: dict[str, uuid.UUID] = {}
        for p in snap.projects:
            pid = uuid.uuid4()
            client_to_uuid[p.id] = pid
            self.db.add(
                WorkspaceProject(
                    id=pid,
                    organization_id=self.org_id,
                    owner_user_id=self.user_id,
                    client_id=p.id,
                    kind=p.kind,
                    name=p.name[:255],
                    settings=p.iulSignSettings if p.iulSignSettings else None,
                    created_at=datetime.fromisoformat(p.createdAt.replace("Z", "+00:00"))
                    if p.createdAt
                    else now,
                    updated_at=now,
                )
            )
        self.db.flush()

        for f in snap.folders:
            project_uuid = client_to_uuid.get(f.projectId)
            if project_uuid is None:
                continue
            self.db.add(
                WorkspaceFolder(
                    id=uuid.uuid4(),
                    organization_id=self.org_id,
                    project_id=project_uuid,
                    parent_client_id=f.parentId,
                    client_id=f.id,
                    name=f.name[:255],
                    system_key=f.systemKey,
                    created_at=datetime.fromisoformat(f.createdAt.replace("Z", "+00:00"))
                    if f.createdAt
                    else now,
                    updated_at=now,
                )
            )

        for d in snap.documents:
            project_uuid = client_to_uuid.get(d.projectId)
            if project_uuid is None:
                continue
            # Strip any accidental binary/pdf keys from wizard payloads
            # Policy 6.3.5: source PDFs for ИУЛ are NEVER stored on server.
            wizard = dict(d.wizard or {})
            for bad in ("sourcePdf", "pdfBytes", "arrayBuffer", "fileBuffer"):
                wizard.pop(bad, None)
            if d.templateStorageKey:
                wizard["templateStorageKey"] = d.templateStorageKey
            if d.dataFileStorageKey:
                wizard["dataFileStorageKey"] = d.dataFileStorageKey
            iul = dict(d.iulWizard) if d.iulWizard else None
            if iul:
                for bad in ("sourcePdf", "pdfBytes", "arrayBuffer", "fileBuffer"):
                    iul.pop(bad, None)
            self.db.add(
                WorkspaceDocument(
                    id=uuid.uuid4(),
                    organization_id=self.org_id,
                    project_id=project_uuid,
                    folder_client_id=d.folderId,
                    client_id=d.id,
                    kind=d.kind,
                    title=d.title[:512],
                    version=d.version,
                    parent_client_id=d.parentId,
                    status=d.status,
                    wizard=wizard,
                    iul_wizard=iul,
                    created_at=datetime.fromisoformat(d.createdAt.replace("Z", "+00:00"))
                    if d.createdAt
                    else now,
                    updated_at=now,
                )
            )

        for sf in snap.signatureFolders:
            self.db.add(
                SignatureFolder(
                    id=uuid.uuid4(),
                    organization_id=self.org_id,
                    project_client_id=sf.projectId,
                    parent_client_id=sf.parentId,
                    client_id=sf.id,
                    name=sf.name[:255],
                    created_at=datetime.fromisoformat(sf.createdAt.replace("Z", "+00:00"))
                    if sf.createdAt
                    else now,
                    updated_at=now,
                )
            )

        for s in snap.signatures:
            preview = s.imageDataUrl
            if preview and len(preview) > _MAX_PREVIEW_CHARS:
                preview = None
            storage_key = s.storageKey or f"org/{self.org_id}/signatures/{s.id}.bin"
            self.db.add(
                SignatureAsset(
                    id=uuid.uuid4(),
                    organization_id=self.org_id,
                    project_client_id=s.projectId,
                    folder_client_id=s.folderId,
                    client_id=s.id,
                    surname=s.surname[:255],
                    storage_key=storage_key,
                    content_type=s.contentType or "image/png",
                    preview_data_url=preview,
                    created_at=datetime.fromisoformat(s.createdAt.replace("Z", "+00:00"))
                    if s.createdAt
                    else now,
                    updated_at=now,
                )
            )

        self.db.flush()
        return self._revision()
