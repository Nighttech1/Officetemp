"""Import all models so metadata is registered."""

from app.models.generation_log import GenerationLog
from app.models.job import Job
from app.models.organization import Organization
from app.models.pii import AccessAudit, UserProfile
from app.models.template import Template
from app.models.user import User
from app.models.workspace import (
    GlobalSignatureAsset,
    GlobalSignatureFolder,
    SignatureAsset,
    SignatureFolder,
    WorkspaceDocument,
    WorkspaceFolder,
    WorkspaceProject,
)

__all__ = [
    "Organization",
    "User",
    "Template",
    "GenerationLog",
    "Job",
    "UserProfile",
    "AccessAudit",
    "WorkspaceProject",
    "WorkspaceFolder",
    "WorkspaceDocument",
    "SignatureFolder",
    "SignatureAsset",
    "GlobalSignatureFolder",
    "GlobalSignatureAsset",
]
