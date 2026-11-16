"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import (
    auth,
    data,
    forms,
    generate,
    health,
    iul,
    jobs,
    marketing,
    profile,
    signature_library,
    storage,
    templates,
    workspace,
)
from app.core.config import get_settings
from app.db.session import init_db
from app.services.seed_temp_accounts import seed_temp_accounts_on_startup


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    if settings.is_sqlite:
        # Allowed for pytest; warn loudly for accidental local/cloud misuse.
        import logging

        logging.getLogger("app").warning(
            "DATABASE_URL is SQLite — cloud ЛК / stage / VPS require PostgreSQL "
            "(see docs/POSTGRES_DEV.md)."
        )
    init_db()
    # Temporary demo logins (admin1/admin1, admin2/admin2) — local only.
    seed_temp_accounts_on_startup()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(profile.router, prefix="/api/v1")
    app.include_router(templates.router, prefix="/api/v1")
    app.include_router(generate.router, prefix="/api/v1")
    app.include_router(storage.router, prefix="/api/v1")
    app.include_router(data.router, prefix="/api/v1")
    app.include_router(jobs.router, prefix="/api/v1")
    app.include_router(forms.router, prefix="/api/v1")
    app.include_router(iul.router, prefix="/api/v1")
    app.include_router(workspace.router, prefix="/api/v1")
    app.include_router(signature_library.router, prefix="/api/v1")
    app.include_router(marketing.router, prefix="/api/v1")
    return app


app = create_app()
