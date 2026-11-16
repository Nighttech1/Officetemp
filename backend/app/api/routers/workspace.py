"""Workspace cloud sync API — org-scoped snapshot dual-write with localStorage."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AuthUser, DbSession
from app.schemas.workspace import (
    PutSnapshotRequest,
    PutSnapshotResponse,
    WorkspaceSnapshotResponse,
)
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspace", tags=["workspace"])


@router.get("/snapshot", response_model=WorkspaceSnapshotResponse)
def get_snapshot(current: AuthUser, db: DbSession) -> WorkspaceSnapshotResponse:
    svc = WorkspaceService(db, current.organization_id, current.id)
    empty = svc.is_empty()
    snap = svc.get_snapshot()
    return WorkspaceSnapshotResponse(
        snapshot=snap,
        server_revision=snap.revision,
        empty=empty,
    )


@router.put("/snapshot", response_model=PutSnapshotResponse)
def put_snapshot(
    body: PutSnapshotRequest,
    current: AuthUser,
    db: DbSession,
) -> PutSnapshotResponse:
    svc = WorkspaceService(db, current.organization_id, current.id)
    empty = svc.is_empty()
    imported = False

    if body.migrate_local:
        if not empty:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Server workspace already has data; migrate_local refused",
            )
        imported = True
    elif empty and not body.snapshot.projects and not body.snapshot.signatures:
        # Allow empty put
        pass

    if body.expected_revision is not None and not empty:
        current_rev = svc.get_snapshot().revision
        if body.expected_revision != current_rev:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "revision_conflict",
                    "server_revision": current_rev,
                    "expected_revision": body.expected_revision,
                },
            )

    rev = svc.replace_snapshot(body.snapshot)
    db.commit()
    return PutSnapshotResponse(ok=True, server_revision=rev, imported=imported)
