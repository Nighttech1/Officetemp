"""Pytest fixtures — SQLite in-memory, no Docker / Redis required."""

from __future__ import annotations

import os

# MUST set before importing application modules.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["PII_SCHEMA"] = ""
os.environ["JWT_SECRET"] = "test-secret-key-for-unit-tests-only"
os.environ["JWT_EXPIRE_MINUTES"] = "60"
os.environ["S3_ENDPOINT_URL"] = "http://localhost:9000"
os.environ["S3_ACCESS_KEY"] = "testkey"
os.environ["S3_SECRET_KEY"] = "testsecret"
os.environ["S3_BUCKET"] = "test-bucket"
os.environ["CORS_ORIGINS"] = "http://localhost:3000"
os.environ["PDF_ENGINE"] = "dxpdf"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"
os.environ["CELERY_BROKER_URL"] = "memory://"
os.environ["CELERY_RESULT_BACKEND"] = "cache+memory://"
os.environ["ARTIFACT_TTL_HOURS"] = "24"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings

get_settings.cache_clear()

from app.db.base import Base
from app.db import session as db_session
import app.models  # noqa: F401
from app.db.session import get_db
from app.main import create_app
from app.worker.celery_app import celery_app

celery_app.conf.task_always_eager = True
celery_app.conf.task_eager_propagates = True

_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False)

db_session.engine = _engine
db_session.SessionLocal = TestingSessionLocal
db_session._settings = get_settings()

Base.metadata.create_all(bind=_engine)


@pytest.fixture()
def db():
    connection = _engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client():
    """Fresh tables per test for isolation."""
    Base.metadata.drop_all(bind=_engine)
    Base.metadata.create_all(bind=_engine)

    def _override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app = create_app()
    app.dependency_overrides[get_db] = _override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def register_payload():
    return {
        "org_name": "Acme Corp",
        "email": "owner@acme.example",
        "password": "password123",
        "full_name": "Ada Owner",
        "consent": True,
    }


@pytest.fixture()
def artifact_root(tmp_path, monkeypatch):
    """Isolate job files under a temp tree (cleanup-safe)."""
    root = tmp_path / "jobs"
    root.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("ARTIFACT_ROOT", str(root))
    get_settings.cache_clear()
    yield root
    get_settings.cache_clear()
