# W-56 architect-spec

## C-136
- `preferences-card.tsx`: каждая row в `border border-line rounded-lg`; ChevronRight/Left `h-[1.3125rem] w-[1.3125rem]` (1.5×3.5); в меню стрелка `self-center` справа в flex row `justify-between`.
- `WaybillLivePreview`: CDN docx-preview ≥0.4 с `renderHeaders/Footers: true`; контейнер `aspect-[210/297] w-full overflow-x-hidden`; внутренний `.docx-wrapper` `max-width:100%; transform-origin:top center; scale` через CSS.

## C-137
- `buildFolderBranch`: при query — оставлять папки, у которых имя match ИЛИ есть потомки-match; документы только match.
- Delete folder: не `disabled` визуально скрытый — если нет selectedFolderId но multiFolderIds[0] — удалять его; всегда показывать кнопку.
- `tailwind.config.ts` fontSize: xs/sm=14, base=16, lg=17, xl/2xl=18; глобально `html { font-size: 16px }` floor.

## C-138
- `autoMapTagsToColumns`: явные связи tag `code`→col `обозначение`, `section name`/`section_name`→`наименование`.
- После `applyIulsFromTree` mapping должен заполниться; preview effect зависит от mapping.
- InfoSheetLivePreview + iul-pdf уже используют hashAlgo — проверить HTML превью нет литерала «MD5» вне algo.

## Paths
preferences-card, WaybillLivePreview, ProjectSidebar, iul-to-waybill, WaybillWizard, tailwind/globals, InfoSheetLivePreview
