# Guards C-93 — не стирать iulSignSettings

## Код

1. `frontend/lib/workspace-sync.ts` — `buildLocalSnapshot` передаёт `iulSignSettings`.
2. `applySnapshotToLocal` — `settingsUseful(remote) ? remote : local` (пустой remote не затирает local).
3. Backend `SnapshotProject.iulSignSettings` + `WorkspaceProject.settings` + alembic `004_workspace_project_settings`.

## Проверка

1. Задать в проекте fixedRoles + MD5.
2. Сделать sync / перезагрузку / pull.
3. Настройки на месте (роли и алгоритм хэша).
