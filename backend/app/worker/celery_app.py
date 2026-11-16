"""Celery application — broker/backend from settings; eager mode for tests."""

from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "docsaas",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Unit tests: CELERY_TASK_ALWAYS_EAGER=true — no Redis required.
    task_always_eager=settings.celery_task_always_eager,
    task_eager_propagates=True,
    beat_schedule={
        "cleanup-expired-artifacts-hourly": {
            "task": "app.worker.tasks.cleanup_expired_artifacts",
            "schedule": crontab(minute=0),  # every hour
        },
        "cleanup-pii-retention-daily": {
            "task": "app.worker.tasks.cleanup_pii_retention",
            "schedule": crontab(hour=3, minute=15),
        },
    },
)
