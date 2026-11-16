# Architect — W-15 Documents / Projects / Waybill wizard

## Product model (MVP local-first)

```
DocKind = "waybill" | "info_sheet"
Project { id, kind, name, createdAt }
Document {
  id, projectId, kind, title, version, parentId?,
  status: draft|ready,
  wizard: { step, templateName, tags, columns, rows, mapping,
            dataFilename, dataUrl?, registryUrl?, registryMap? },
  createdAt, updatedAt
}
```

Storage: `localStorage` meta + IndexedDB blobs per document id (template file).
Reuse API: `analyzeTemplate`, `uploadExcel`, `generateDocx`/`generatePdf`.
Auth optional (already open). Cloud registry write — UI + save config; actual push stub message until connectors wired.

## Routes

- `/app/documents/waybills`
- `/app/documents/info-sheet` (same shell; wizard placeholder «скоро» or thin copy of structure)

## UI

1. Nav dropdown «Документы» in LandingNav + AppNav
2. Left sidebar: projects list, «+ проект», expand → docs, search, delete, select
3. Main: empty state / wizard for selected doc

## Chain

Frontend (store + nav + sidebar + pages) → Frontend (wizard) → Тестировщик → Фиксер → Деплоер → Клиент

## Non-goals this wave

Full Google/Yandex registry write; backend Project tables (later Personal-Data/Backend).
