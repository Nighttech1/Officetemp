"""Global signature library — one shared set for every account (LWW replace)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models.workspace import GlobalSignatureAsset, GlobalSignatureFolder
from app.schemas.signature_library import (
    SignatureEntryDTO,
    SignatureFolderDTO,
    SignatureLibrary,
)

# Preview (data URL) stored inline — cap to avoid huge rows. Signatures are small.
_MAX_PREVIEW_CHARS = 1_500_000


def _now() -> datetime:
    return datetime.now(timezone.utc)


class GlobalSignatureLibraryService:
    """Single global library, independent of organization/user."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _revision(self) -> int:
        """Cheap revision: max(updated_at) epoch seconds across both tables."""
        stamps: list[datetime] = []
        for model in (GlobalSignatureFolder, GlobalSignatureAsset):
            q = self.db.scalar(select(func.max(model.updated_at)))
            if q is not None:
                stamps.append(q)
        if not stamps:
            return 0
        return int(max(stamps).timestamp())

    def is_empty(self) -> bool:
        n = self.db.scalar(select(func.count()).select_from(GlobalSignatureAsset))
        return int(n or 0) == 0

    def get(self) -> SignatureLibrary:
        folders = self.db.scalars(select(GlobalSignatureFolder)).all()
        assets = self.db.scalars(select(GlobalSignatureAsset)).all()
        out_folders = [
            SignatureFolderDTO(
                id=f.client_id,
                parentId=f.parent_client_id,
                name=f.name,
                createdAt=f.created_at.isoformat(),
            )
            for f in folders
        ]
        out_entries = [
            SignatureEntryDTO(
                id=a.client_id,
                folderId=a.folder_client_id,
                surname=a.surname,
                imageDataUrl=a.preview_data_url or "",
                createdAt=a.created_at.isoformat(),
            )
            for a in assets
        ]
        return SignatureLibrary(
            folders=out_folders,
            entries=out_entries,
            revision=self._revision(),
        )

    def replace(self, lib: SignatureLibrary) -> int:
        """Full replace of the global library (LWW)."""
        now = _now()

        self.db.execute(delete(GlobalSignatureAsset))
        self.db.execute(delete(GlobalSignatureFolder))
        self.db.flush()

        for f in lib.folders:
            self.db.add(
                GlobalSignatureFolder(
                    id=uuid.uuid4(),
                    parent_client_id=f.parentId,
                    client_id=f.id,
                    name=f.name[:255],
                    created_at=datetime.fromisoformat(f.createdAt.replace("Z", "+00:00"))
                    if f.createdAt
                    else now,
                    updated_at=now,
                )
            )

        for e in lib.entries:
            preview = e.imageDataUrl or None
            if preview and len(preview) > _MAX_PREVIEW_CHARS:
                preview = None
            self.db.add(
                GlobalSignatureAsset(
                    id=uuid.uuid4(),
                    folder_client_id=e.folderId,
                    client_id=e.id,
                    surname=e.surname[:255],
                    content_type="image/png",
                    preview_data_url=preview,
                    created_at=datetime.fromisoformat(e.createdAt.replace("Z", "+00:00"))
                    if e.createdAt
                    else now,
                    updated_at=now,
                )
            )

        self.db.flush()
        return self._revision()
