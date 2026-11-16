"""Org-scoped file storage: local disk (prod-default) or optional S3/MinIO."""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import Any

import boto3
from botocore.client import BaseClient, Config
from botocore.exceptions import ClientError

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class S3StorageService:
    """Name kept for compatibility; default backend is local disk under LOCAL_BLOB_ROOT."""

    def __init__(self, client: BaseClient | None = None) -> None:
        settings = get_settings()
        self.bucket = settings.s3_bucket
        self._endpoint = settings.s3_endpoint_url
        self._public_endpoint = settings.effective_s3_public_endpoint
        self._blob_root = Path(settings.resolve_local_blob_root()).resolve()
        self._use_local = settings.use_local_storage
        self._client: BaseClient | None = None
        self._public_client: BaseClient | None = None
        if client is not None:
            self._client = client
            self._public_client = client
        elif not self._use_local:
            self._client = boto3.client(
                "s3",
                endpoint_url=settings.s3_endpoint_url,
                aws_access_key_id=settings.s3_access_key,
                aws_secret_access_key=settings.s3_secret_key,
                region_name=settings.s3_region,
                config=Config(connect_timeout=2, read_timeout=2, retries={"max_attempts": 1}),
            )
            self._public_client = (
                self._client
                if self._public_endpoint == self._endpoint
                else boto3.client(
                    "s3",
                    endpoint_url=self._public_endpoint,
                    aws_access_key_id=settings.s3_access_key,
                    aws_secret_access_key=settings.s3_secret_key,
                    region_name=settings.s3_region,
                    config=Config(
                        connect_timeout=2, read_timeout=2, retries={"max_attempts": 1}
                    ),
                )
            )

    def ensure_bucket(self) -> None:
        if self._use_local or self._client is None:
            self._blob_root.mkdir(parents=True, exist_ok=True)
            return
        try:
            self._client.head_bucket(Bucket=self.bucket)
        except ClientError:
            try:
                self._client.create_bucket(Bucket=self.bucket)
                logger.info("Created S3 bucket (name redacted)")
            except ClientError as exc:
                logger.warning(
                    "ensure_bucket failed: %s",
                    exc.response.get("Error", {}).get("Code"),
                )
        except Exception as exc:  # noqa: BLE001
            logger.warning("ensure_bucket skipped (storage unreachable): %s", type(exc).__name__)

    def build_template_key(self, org_id: uuid.UUID | str, filename_hint: str | None = None) -> str:
        suffix = ""
        if filename_hint:
            safe = "".join(c for c in filename_hint if c.isalnum() or c in "._-")[:64]
            if safe:
                suffix = f"_{safe}"
        return f"org/{org_id}/templates/{uuid.uuid4()}{suffix}"

    def build_doc_blob_key(
        self,
        org_id: uuid.UUID | str,
        doc_id: str,
        kind: str,
        filename_hint: str | None = None,
    ) -> str:
        """kind: template | data | signature."""
        safe_kind = "".join(c for c in kind if c.isalnum() or c in "_-")[:32] or "blob"
        safe_doc = "".join(c for c in doc_id if c.isalnum() or c in "_-")[:80] or "doc"
        suffix = ""
        if filename_hint:
            safe = "".join(c for c in filename_hint if c.isalnum() or c in "._-")[:64]
            if safe:
                suffix = f"_{safe}"
        return f"org/{org_id}/docs/{safe_doc}/{safe_kind}/{uuid.uuid4()}{suffix}"

    def org_owns_key(self, org_id: uuid.UUID | str, key: str) -> bool:
        prefix = f"org/{org_id}/"
        return bool(key) and key.startswith(prefix) and ".." not in key and not key.startswith("/")

    def _local_path(self, key: str) -> Path:
        if ".." in key or key.startswith("/") or "\\" in key:
            raise ValueError("invalid key")
        path = (self._blob_root / key).resolve()
        if not str(path).startswith(str(self._blob_root)):
            raise ValueError("path escape")
        return path

    def _put_local(self, key: str, data: bytes, *, content_type: str | None = None) -> str:
        path = self._local_path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        if content_type:
            meta = path.with_suffix(path.suffix + ".content_type")
            meta.write_text(content_type, encoding="utf-8")
        return "local"

    def _get_local(self, key: str) -> tuple[bytes, str | None]:
        path = self._local_path(key)
        if not path.is_file():
            raise FileNotFoundError(key)
        ctype = None
        meta = path.with_suffix(path.suffix + ".content_type")
        if meta.is_file():
            ctype = meta.read_text(encoding="utf-8").strip() or None
        return path.read_bytes(), ctype

    def put_bytes(self, key: str, data: bytes, *, content_type: str | None = None) -> str:
        """Store under org-scoped key. Default: local disk volume."""
        self.ensure_bucket()
        if self._use_local or self._client is None:
            return self._put_local(key, data, content_type=content_type)

        extra: dict[str, Any] = {}
        if content_type:
            extra["ContentType"] = content_type
        try:
            assert self._client is not None
            self._client.put_object(Bucket=self.bucket, Key=key, Body=data, **extra)
            return "s3"
        except Exception as exc:  # noqa: BLE001
            logger.warning("S3 put failed (%s); using local blob fallback", type(exc).__name__)
            return self._put_local(key, data, content_type=content_type)

    def get_bytes(self, key: str) -> tuple[bytes, str | None]:
        if self._use_local or self._client is None:
            return self._get_local(key)
        try:
            assert self._client is not None
            resp = self._client.get_object(Bucket=self.bucket, Key=key)
            body = resp["Body"].read()
            ctype = resp.get("ContentType")
            return body, ctype
        except Exception:  # noqa: BLE001
            return self._get_local(key)

    def presign_upload(
        self,
        key: str,
        *,
        expires_in: int = 3600,
        content_type: str | None = None,
    ) -> dict[str, Any]:
        if self._use_local or self._public_client is None:
            # Browser should use POST /storage/objects (API proxy), not direct PUT.
            return {
                "url": "",
                "key": key,
                "expires_in": 0,
                "mode": "local",
                "hint": "Use POST /api/v1/storage/objects",
            }
        params: dict[str, Any] = {"Bucket": self.bucket, "Key": key}
        if content_type:
            params["ContentType"] = content_type
        url = self._public_client.generate_presigned_url(
            "put_object",
            Params=params,
            ExpiresIn=expires_in,
        )
        return {"url": url, "key": key, "expires_in": expires_in, "mode": "s3"}

    def presign_download(self, key: str, *, expires_in: int = 3600) -> dict[str, Any]:
        if self._use_local or self._public_client is None:
            return {
                "url": "",
                "key": key,
                "expires_in": 0,
                "mode": "local",
                "hint": "Use GET /api/v1/storage/objects?key=…",
            }
        url = self._public_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )
        return {"url": url, "key": key, "expires_in": expires_in, "mode": "s3"}
