# W-74 Frontend notes (C-202 / C-203 / C-204)

## Files changed / added

### Added
- `frontend/components/ui/multi-button.tsx` — MultiButton, CompactMultiButton, MultiButtonGroup (user source)
- `frontend/components/docs/ResizablePreviewShell.tsx` — width/height drag + localStorage persist
- `frontend/app/app/documents/loading.tsx` — skeleton «Загрузка раздела…»

### Modified
- `frontend/app/globals.css` — shadcn-style CSS var aliases (`--primary`, `--background`, …)
- `frontend/tailwind.config.ts` — primary/background/foreground/secondary/muted/accent/border/ring, `zIndex.base|raised`, `shadow-xs`
- `frontend/components/docs/ProjectSidebar.tsx` — removed DocSaaS header/Home; MultiButton toolbar
- `frontend/components/ui/slide-tabs.tsx` — `flex-nowrap overflow-x-auto`
- `frontend/components/docs/WaybillWizard.tsx` — flex layout + ResizablePreviewShell
- `frontend/components/docs/InfoSheetWizard.tsx` — same
- `frontend/components/docs/WaybillLivePreview.tsx` — fill shell height (no rigid A4 aspect clamp)
- `frontend/components/docs/InfoSheetLivePreview.tsx` — `min-h-0 flex-1 overflow-auto`
- `frontend/components/AuthGate.tsx` — children immediately; auth in background; amber banner only
- `frontend/components/landing/MegaNav.tsx` — `prefetch={true}` + `router.prefetch` for waybills/info-sheet
- `frontend/components/landing/LandingFooter.tsx` — prefetch on document app links
- `frontend/components/landing/ServicesSlideshow.tsx` — Next Link + prefetch for app doc slides

## Checks
- `npx tsc --noEmit`: no new errors from W-74 files; pre-existing errors remain in `text-stagger-hover.tsx` and `workspace-sync.ts`.

## Notes
- Preview size keys: `docsaas_preview_w_{waybill|iul}`, `docsaas_preview_h_{waybill|iul}`
- MultiButton uses `variant="ghost"`, `size="sm"`, `highlightColor="#2fc6f6"`
- Backend / VPS / DB not touched
