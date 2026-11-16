### [C-23] Asset pipeline + пакет релиза MVP
- **Зона:** Asset Pipeline / Deployer (4.5 + 5.5 без VPS push)
- **Факт:** Нет AVIF/WebP/blurhash; нет оформленного релиз-пакета.
- **Ожидание:** скрипт `frontend/scripts/optimize-assets.mjs` (sharp) → `public/optimized/`; blurhash util; next/image; `docs/RELEASE.md` + `docker-compose.release.yml` (или profile) для prod-like localhost; checklist. **VPS deploy НЕ выполнять** без явного «да» в чате.
- **Приоритет:** P0
- **Статус:** done
- **Зона:** Asset Pipeline | Deployer | Frontend
