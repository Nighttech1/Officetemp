"""Application settings via pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Doc SaaS API"
    debug: bool = False

    database_url: str = "postgresql+psycopg2://docsaas:docsaas@localhost:5432/docsaas"
    # Empty string disables PostgreSQL schema for SQLite unit tests.
    pii_schema: str = "pii"
    # 0 = never auto-erase inactive profiles (manual erase API still works).
    pii_retention_days: int = 0

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"

    s3_endpoint_url: str = "http://localhost:9000"
    # Browser-facing endpoint for presigns (host→localhost:9000 while compose uses minio:9000).
    s3_public_endpoint_url: str = ""
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "docsaas"
    s3_region: str = "us-east-1"
    # Prod-default for MVP VPS: local disk volume (not paid Object Storage).
    # Set STORAGE_BACKEND=s3 only when MinIO/Yandex is intentionally configured.
    storage_backend: str = "local"
    # Durable local blob tree (never outside this path). Empty → backend/.runtime/blobs
    local_blob_root: str = ""

    # PDF: in-process dxpdf (no LibreOffice / no external PDF SaaS).
    pdf_engine: str = "dxpdf"

    # Data connectors (Phase 3)
    data_max_rows: int = 5000
    # Path to service-account JSON file, or inline JSON string.
    google_service_account_json: str = ""
    # OAuth token for Yandex Disk / Tables (YANDEX_SHEETS_TOKEN or YANDEX_DISK_TOKEN).
    yandex_sheets_token: str = ""
    yandex_disk_token: str = ""

    # Celery / async jobs (Phase 5)
    celery_broker_url: str = "redis://127.0.0.1:6379/0"
    celery_result_backend: str = "redis://127.0.0.1:6379/0"
    celery_task_always_eager: bool = False
    artifact_ttl_hours: int = 24
    # Empty → backend/.runtime/jobs (never delete outside this tree).
    artifact_root: str = ""

    # Contact forms + optional SMTP (C-22). Empty SMTP_HOST → store only.
    forms_runtime_dir: str = ""
    forms_rate_limit_per_minute: int = 5
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@docsaas.local"
    smtp_to: str = ""
    smtp_use_tls: bool = True

    # Password reset (W-63). Public frontend origin for reset links.
    public_app_url: str = "http://127.0.0.1:3000"
    password_reset_ttl_minutes: int = 60
    password_reset_rate_per_hour: int = 5

    # Marketing campaigns (W-64). Owner can queue broadcasts when enabled.
    marketing_campaigns_enabled: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        # Local cabinets often move port (3000→3010) when ITLearn steals :3000.
        # Always allow common localhost frontends in non-production.
        for extra in (
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3010",
            "http://127.0.0.1:3010",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ):
            if extra not in origins:
                origins.append(extra)
        return origins

    @property
    def effective_yandex_token(self) -> str:
        return (self.yandex_sheets_token or self.yandex_disk_token or "").strip()

    @property
    def effective_pii_schema(self) -> str | None:
        # SQLite has no schemas; keep PII tables in the same DB file for local/dev.
        if self.database_url.startswith("sqlite"):
            return None
        value = (self.pii_schema or "").strip()
        if value.lower() in ("", "none", "off", "false", "0"):
            return None
        return value

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.strip().lower().startswith("sqlite")

    @property
    def effective_s3_public_endpoint(self) -> str:
        public = (self.s3_public_endpoint_url or "").strip()
        return public or self.s3_endpoint_url

    @property
    def use_local_storage(self) -> bool:
        mode = (self.storage_backend or "local").strip().lower()
        return mode in ("local", "disk", "fs", "filesystem")

    def resolve_local_blob_root(self) -> str:
        raw = (self.local_blob_root or "").strip()
        if raw:
            return raw
        from pathlib import Path

        return str(Path(__file__).resolve().parents[2] / ".runtime" / "blobs")


@lru_cache
def get_settings() -> Settings:
    return Settings()
