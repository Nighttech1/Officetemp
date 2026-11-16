"""Workspace models — cloud sync of docs-store (no source PDFs)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON, Uuid

from app.db.base import Base

# JSONB on Postgres; plain JSON on SQLite tests
JsonType = JSON().with_variant(JSONB(), "postgresql")


class WorkspaceProject(Base):
    __tablename__ = "workspace_projects"
    __table_args__ = (
        Index("ix_workspace_projects_organization_id", "organization_id"),
        UniqueConstraint(
            "organization_id",
            "client_id",
            name="uq_workspace_projects_org_client",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    client_id: Mapped[str] = mapped_column(String(64), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # iulSignSettings JSON — роли / алгоритм хэша проекта
    settings: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class WorkspaceFolder(Base):
    __tablename__ = "workspace_folders"
    __table_args__ = (
        Index("ix_workspace_folders_organization_id", "organization_id"),
        Index("ix_workspace_folders_project_id", "project_id"),
        UniqueConstraint(
            "organization_id",
            "client_id",
            name="uq_workspace_folders_org_client",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workspace_projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    parent_client_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    client_id: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    system_key: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class WorkspaceDocument(Base):
    """Filled wizard cards only — never store source PDF bytes here."""

    __tablename__ = "workspace_documents"
    __table_args__ = (
        Index("ix_workspace_documents_organization_id", "organization_id"),
        Index("ix_workspace_documents_project_id", "project_id"),
        UniqueConstraint(
            "organization_id",
            "client_id",
            name="uq_workspace_documents_org_client",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workspace_projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    folder_client_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    client_id: Mapped[str] = mapped_column(String(64), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    parent_client_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    wizard: Mapped[dict] = mapped_column(JsonType, nullable=False, default=dict)
    iul_wizard: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SignatureFolder(Base):
    __tablename__ = "signature_folders"
    __table_args__ = (
        Index("ix_signature_folders_organization_id", "organization_id"),
        UniqueConstraint(
            "organization_id",
            "client_id",
            name="uq_signature_folders_org_client",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_client_id: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    parent_client_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    client_id: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class GlobalSignatureFolder(Base):
    """Общая библиотека подписей — папки, не привязаны к аккаунту/проекту."""

    __tablename__ = "global_signature_folders"
    __table_args__ = (
        UniqueConstraint(
            "client_id",
            name="uq_global_signature_folders_client",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    parent_client_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    client_id: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class GlobalSignatureAsset(Base):
    """Общая библиотека подписей — одна на все аккаунты (preview хранится прямо тут)."""

    __tablename__ = "global_signature_assets"
    __table_args__ = (
        UniqueConstraint(
            "client_id",
            name="uq_global_signature_assets_client",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    folder_client_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    client_id: Mapped[str] = mapped_column(String(64), nullable=False)
    surname: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(128), nullable=False, default="image/png")
    # Для MVP картинка (data URL) хранится прямо здесь — объектного стораджа нет.
    preview_data_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SignatureAsset(Base):
    """Metadata only; image bytes live in object storage."""

    __tablename__ = "signature_assets"
    __table_args__ = (
        Index("ix_signature_assets_organization_id", "organization_id"),
        UniqueConstraint(
            "organization_id",
            "client_id",
            name="uq_signature_assets_org_client",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_client_id: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    folder_client_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    client_id: Mapped[str] = mapped_column(String(64), nullable=False)
    surname: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    content_type: Mapped[str] = mapped_column(String(128), nullable=False, default="image/png")
    # Optional small preview for offline LS mirror (cap enforced in service).
    preview_data_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
