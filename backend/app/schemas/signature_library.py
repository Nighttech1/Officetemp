"""Pydantic schemas for the global (account-independent) signature library."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SignatureFolderDTO(BaseModel):
    id: str
    parentId: str | None = None
    name: str
    createdAt: str


class SignatureEntryDTO(BaseModel):
    id: str
    folderId: str | None = None
    surname: str
    # data:image/...;base64,... — для MVP это и есть канонические байты.
    imageDataUrl: str = ""
    createdAt: str


class SignatureLibrary(BaseModel):
    """Mirrors frontend signature-library store shape (camelCase)."""

    folders: list[SignatureFolderDTO] = Field(default_factory=list)
    entries: list[SignatureEntryDTO] = Field(default_factory=list)
    revision: int = 0


class SignatureLibraryResponse(BaseModel):
    library: SignatureLibrary
    server_revision: int
    empty: bool


class PutSignatureLibraryRequest(BaseModel):
    library: SignatureLibrary
    """If true and server empty — first import from a client's localStorage."""
    migrate_local: bool = False
    """Optimistic concurrency: if set and differs from server → 409."""
    expected_revision: int | None = None


class PutSignatureLibraryResponse(BaseModel):
    ok: bool = True
    server_revision: int
    imported: bool = False
