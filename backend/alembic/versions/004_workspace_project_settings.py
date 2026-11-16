"""Add settings JSON to workspace_projects (iulSignSettings).

Revision ID: 004_workspace_project_settings
Revises: 003_workspace
Create Date: 2026-09-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "004_workspace_project_settings"
down_revision = "003_workspace"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    json_type = (
        postgresql.JSONB()
        if dialect == "postgresql"
        else sa.JSON()
    )
    op.add_column(
        "workspace_projects",
        sa.Column("settings", json_type, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("workspace_projects", "settings")
