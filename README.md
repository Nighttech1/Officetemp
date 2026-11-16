# OfficeTemp

OfficeTemp (earlier working name: DocSaaS) is a document automation application: Word/Excel templates, DOCX/PDF generation, document registers and a Next.js cabinet.

The repository contains the project imported from the local OfficeTemp folder on 2026-11-17. Application behavior was not changed during the import.

## Continue development in a cloud chat

Connect this repository and use `main` as the starting branch. Read `START_HERE.md`, `CLAUDE.md`, `TEAM_ARCHITECTURE.md`, `CLIENT_ORCHESTRATOR_CYCLE.md`, `architecture.md`, `roadmap.md`, and the latest records under `memory/waves/` before editing. Existing project instructions, skills, plugins, templates, tests, and development history are included.

## Start the backend with Docker

```sh
cp .env.example .env
# Set your own JWT_SECRET and database password in .env.
docker compose up -d --build
```

API: http://localhost:8000; OpenAPI: http://localhost:8000/docs.

## Start the frontend

Requires Node.js 20+ and npm.

```sh
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Frontend: http://localhost:3000. The example API URL uses port 8000 (Docker). The original portable Windows stack uses port 8005; adjust `NEXT_PUBLIC_API_URL` when using it.

## Checks

```sh
cd backend
python -m pip install -r requirements.txt
python -m pytest -q
```

```sh
cd frontend
npm ci
npm run build
```

The existing GitHub Actions workflow runs backend and browser checks. Importing files does not certify that the application tests pass; check the workflow results after import.

## Local-only files

Actual `.env` files, virtual environments, npm dependencies, build outputs, runtime uploads, local databases, browser profiles and logs are excluded. Copy the example configuration and recreate dependencies in a new environment. Original local files are preserved. `start-stack.ps1`, `DocSaaS-autostart.cmd` and `mcp.json` retain their original Windows paths and need adaptation on a different machine. Deployment is not configured by this import.
