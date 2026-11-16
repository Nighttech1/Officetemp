# Architect — C-68

## Scope
Frontend only (except no backend change required for removing PDF extract on UI; can leave API crop unused).

## Changes
1. `InfoSheetWizard` receives `projectName`; on load/change and after PDF analyze — force `objectName = projectName` (overwrite stamp object). Field read-only or editable but auto-synced from project.
2. `signature-library.ts` — scope by `projectId` in storage key.
3. `ProjectSidebar` (info_sheet): under each project add item «Подписи»; page shows `SignatureLibraryPanel` when selected.
4. Remove toggle PDF/library and panel from step 4; always `findSignatureImage`.
5. Add `components/ui/tabs.tsx` (radix) + vertical signatory UI in wizard step 4.
6. Add `components/ui/slide-tabs.tsx` (motion/react) — reusable for WaybillWizard + InfoSheetWizard STEPS.

## Deps
`@radix-ui/react-tabs`, `lucide-react` (optional icons). Use existing `motion` package for SlideTabs.

## Chain
Frontend → Тестировщик → Фиксер → Деплоер → Клиент
