# W-76 Frontend Notes

## C-207 MultiButton fillWidth
- `components/ui/multi-button.tsx`: added `fillWidth?: boolean` on shared props.
- When `fillWidth`: rail `width: 100%` + `flex w-full`; `ResizeObserver` on rail measures `clientWidth`.
- Rest: equal item widths across measured width (minus 1px dividers).
- Hover: active = `cell + labelWidth`, clamped so others keep ≥ `cell * 0.7`; remainder split.
- `ProjectSidebar` toolbar: `w-full` wrapper, `fillWidth` + `className="w-full"`; removed `overflow-x-auto` / `shrink-0`.

## C-208 No bottom clip
- `ResizablePreviewShell`: `h-full min-h-0 flex-1 lg:self-stretch`; `height: 100%`; `maxHeight` only if user stored a height preference (bottom-handle drag). Inner shell `overflow-hidden`.
- `InfoSheetWizard` / `WaybillWizard`: removed `lg:sticky`; IUL steps dropped `min-h-[26rem]`; DocsStepMotion `overflow-hidden` except waybill step 5 (`overflow-y-auto`).
- Waybill content column: added `min-h-0`.

## C-209 Folder no form reset
- `info-sheet/page.tsx`: `onSelectProject` clears doc/batch/multi only when `id !== projectId`; also `setFolderId(null)` like waybills. Removed `folderId` from ensure-draft effect deps (still used inside `saveDocsTreeUi`).
- `waybills/page.tsx`: removed `folderId` from ensure-draft effect deps.

## Verify
- `npx tsc --noEmit` in `frontend`: **pass** (exit 0).
- Backend / VPS / DB untouched.
