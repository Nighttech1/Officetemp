### [C-93] Не стирать настройки проекта (iulSignSettings) при sync/обновлениях

- **Статус:** done (W-39)
- **Факт:** Cloud sync не передавал / затирал `iulSignSettings`.
- **Исправление:** snapshot dual-write + `settingsUseful(remote) ? remote : local` на pull; backend `settings` JSON.
- **Guards:** `guards.md`.
