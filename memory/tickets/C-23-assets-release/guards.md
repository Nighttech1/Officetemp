# Guards — C-23 Assets + release pack

## Checks

1. `frontend/scripts/optimize-assets.mjs` exists; `npm run optimize-assets` writes `public/optimized/*` (webp/avif and/or svg).
2. `frontend/lib/blurhash.ts` exports placeholder constant; `OptimizedImage` uses next/image + blur data URL.
3. `docs/RELEASE.md` documents localhost checklist and **explicit VPS only after Client «да»**.
4. `docker-compose.release.yml` overlay notes present (SMTP env placeholders).
5. `roadmap.md`: **4.5 [x]**, **5.8 [x]**, **5.5 [x]** with note «пакет готов / VPS ждёт согласования».

## Automated companion

```bash
cd frontend
npm run optimize-assets
npm run build
```
