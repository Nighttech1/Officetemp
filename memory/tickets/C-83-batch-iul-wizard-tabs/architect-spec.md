# W-36 — Batch wizard UX + hash fix + signatures roles

## Цель
1. Пакет PDF → тот же мастер, вертикальные вкладки ИУЛ, кнопка «Сформировать ИУЛы».
2. Хэш при batch = той же длины, что при одиночной загрузке.
3. Шаг подписи: вкладки по характеру работы; авто PNG из библиотеки + upload в библиотеку; настройки фиксированных ролей на проект.
4. Библиотека подписей не сбрасывается при доработках (ключ v3 сохраняем).

## План работ
### Frontend
1. **C-83:** Вынести вертикальный список batchDocIds на уровень всего мастера (как Tabs подписантов). Убрать дублирующую обёртку только на теле шага. `generateLabel` → «Сформировать ИУЛы» в batch.
2. **C-84:** В `seedIulFromPdf` / `applyFile`: `const bytes = new Uint8Array(await file.arrayBuffer()); const digest = await hashFile(bytes.buffer.slice(...), algo)`; нормализовать длину по algo; unit-тест длины SHA-256 = 64.
3. **C-85:** 
   - TabsTrigger текст = `role || «Роль N»`
   - Upload input → upsertSignature + updateSig image
   - `Project.iulSignSettings?: { fixedRoles: string[]; overflowRole: string }` в docs-store
   - UI шестерёнки на шаге 3; при seed/applyFile применять `applyRoleSettings(sigs, settings)`

### Не в этой волне
VPS деплой (Клиент подтвердил РФ — отметить в spec; деплой только по «да»).

## Acceptance
- Batch: слева N вкладок ИУЛ, шаги 1–4 как у одного файла, кнопка «Сформировать ИУЛы».
- Хэш batch и single одной длины для одного файла.
- Слева характеры работы; upload сохраняет в библиотеку; настройки ролей влияют на новые seed в проекте.
- Старые записи `docsaas_sign_lib_v3` на месте после правок.
