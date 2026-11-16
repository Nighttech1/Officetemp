# Guards W-35 — cloud workspace + 152-ФЗ

## Backend
- `pytest tests/test_workspace.py tests/test_auth.py` — green
- Register without `consent` → 400
- Snapshot roundtrip strips `sourcePdf`
- Org A cannot see Org B projects

## Frontend
- `/register` — checkbox согласия + ссылка `/privacy`
- `AuthGate` вызывает `syncWorkspaceOnLogin`
- Dual-write: `saveStore` → `scheduleWorkspacePush`

## Deploy
- Localhost only this wave. VPS — stop until Client «согласовано» + explicit yes.
