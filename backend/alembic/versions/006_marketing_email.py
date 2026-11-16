"""Marketing opt-in on profiles + email campaigns.

Revision ID: 006_marketing_email
Revises: 005_password_reset
Create Date: 2026-09-30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "006_marketing_email"
down_revision = "005_password_reset"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    uuid_type = (
        postgresql.UUID(as_uuid=True)
        if bind.dialect.name == "postgresql"
        else sa.String(36)
    )
    schema = "pii" if bind.dialect.name == "postgresql" else None

    op.add_column(
        "user_profiles",
        sa.Column("marketing_opt_in_at", sa.DateTime(timezone=True), nullable=True),
        schema=schema,
    )
    op.add_column(
        "user_profiles",
        sa.Column("marketing_unsub_token_hash", sa.String(64), nullable=True),
        schema=schema,
    )
    op.create_index(
        "ix_user_profiles_marketing_unsub_token_hash",
        "user_profiles",
        ["marketing_unsub_token_hash"],
        unique=True,
        schema=schema,
    )

    op.create_table(
        "email_campaigns",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("html_body", sa.Text(), nullable=False),
        sa.Column("text_body", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("created_by", uuid_type, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("stats_json", sa.JSON(), nullable=True),
    )
    op.create_index("ix_email_campaigns_status", "email_campaigns", ["status"])

    op.create_table(
        "email_campaign_deliveries",
        sa.Column("id", uuid_type, primary_key=True),
        sa.Column(
            "campaign_id",
            uuid_type,
            sa.ForeignKey("email_campaigns.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            uuid_type,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("error", sa.String(512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("campaign_id", "user_id", name="uq_campaign_user_delivery"),
    )
    op.create_index(
        "ix_email_campaign_deliveries_campaign_id",
        "email_campaign_deliveries",
        ["campaign_id"],
    )


def downgrade() -> None:
    bind = op.get_bind()
    schema = "pii" if bind.dialect.name == "postgresql" else None
    op.drop_index("ix_email_campaign_deliveries_campaign_id", table_name="email_campaign_deliveries")
    op.drop_table("email_campaign_deliveries")
    op.drop_index("ix_email_campaigns_status", table_name="email_campaigns")
    op.drop_table("email_campaigns")
    op.drop_index(
        "ix_user_profiles_marketing_unsub_token_hash",
        table_name="user_profiles",
        schema=schema,
    )
    op.drop_column("user_profiles", "marketing_unsub_token_hash", schema=schema)
    op.drop_column("user_profiles", "marketing_opt_in_at", schema=schema)
