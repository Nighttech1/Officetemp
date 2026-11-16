"""Storage / presign schemas."""

from pydantic import BaseModel, Field


class PresignUploadRequest(BaseModel):
    filename: str | None = Field(default=None, max_length=255)
    content_type: str | None = Field(default=None, max_length=128)


class PresignDownloadRequest(BaseModel):
    key: str = Field(min_length=1, max_length=1024)


class PresignUploadResponse(BaseModel):
    url: str
    key: str
    expires_in: int
    mode: str | None = None
    hint: str | None = None


class StorageObjectResponse(BaseModel):
    key: str
    bytes: int
    backend: str
    content_type: str | None = None
