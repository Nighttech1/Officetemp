"""Pydantic schemas for workspace cloud sync."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class SnapshotProject(BaseModel):
    id: str
    kind: Literal["waybill", "info_sheet"]
    name: str
    createdAt: str
    """Настройки ИУЛ проекта (роли, алгоритм) — не терять при sync."""
    iulSignSettings: dict[str, Any] | None = None


class SnapshotFolder(BaseModel):
    id: str
    projectId: str
    parentId: str | None = None
    name: str
    # FE docs-store: signatures | iul | waybills (не только signatures)
    systemKey: Literal["signatures", "iul", "waybills"] | None = None
    createdAt: str


class SnapshotDocument(BaseModel):
    id: str
    projectId: str
    folderId: str | None = None
    kind: Literal["waybill", "info_sheet"]
    title: str
    version: int = 1
    parentId: str | None = None
    status: Literal["draft", "ready"] = "draft"
    wizard: dict[str, Any] = Field(default_factory=dict)
    iulWizard: dict[str, Any] | None = None
    """S3/local key for Word template binary (not IndexedDB-only)."""
    templateStorageKey: str | None = None
    """S3/local key for Excel/CSV data file."""
    dataFileStorageKey: str | None = None
    createdAt: str
    updatedAt: str


class SnapshotSignatureFolder(BaseModel):
    id: str
    projectId: str
    parentId: str | None = None
    name: str
    createdAt: str


class SnapshotSignature(BaseModel):
    id: str
    projectId: str
    folderId: str | None = None
    surname: str
    storageKey: str = ""
    contentType: str = "image/png"
    # Dual-write mirror for LS; prefer storageKey for canonical bytes later.
    imageDataUrl: str | None = None
    createdAt: str


class WorkspaceSnapshot(BaseModel):
    """Mirrors frontend docs-store + signature-library shape (camelCase)."""

    projects: list[SnapshotProject] = Field(default_factory=list)
    folders: list[SnapshotFolder] = Field(default_factory=list)
    documents: list[SnapshotDocument] = Field(default_factory=list)
    signatureFolders: list[SnapshotSignatureFolder] = Field(default_factory=list)
    signatures: list[SnapshotSignature] = Field(default_factory=list)
    revision: int = 0


class WorkspaceSnapshotResponse(BaseModel):
    snapshot: WorkspaceSnapshot
    server_revision: int
    empty: bool


class PutSnapshotRequest(BaseModel):
    snapshot: WorkspaceSnapshot
    """If true and server empty — first import from localStorage."""
    migrate_local: bool = False
    """Optimistic concurrency: if set and differs from server → 409."""
    expected_revision: int | None = None


class PutSnapshotResponse(BaseModel):
    ok: bool = True
    server_revision: int
    imported: bool = False
