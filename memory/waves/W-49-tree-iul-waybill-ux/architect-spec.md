# W-49 — дерево wrap + motion, ИУЛ 3 шага, накладная UX

## Тикеты
- **C-112** P1 — TreeView: имена папок/файлов с переносом строки (`break-words`), без `truncate`
- **C-113** P1 — вернуть плавный expand/collapse (`animateExpand` + AnimatePresence); убрать дерганье (не `duration: 0`)
- **C-114** P1 — InfoSheet: поля `ulCode` / `sheetNo` / `sheetsTotal` на шаг «Документ»; STEPS без «PDF» (остаётся Файл → Документ → Подписи); генерация PDF с шага Подписи / верхней кнопки; clamp `step>3 → 3`
- **C-115** P1 — Waybill шаг 1: длинный help → кнопка «?» справа сверху заголовка шага
- **C-116** P1 — Waybill шаг 2 блок ИУЛ: таблица колонок «Наим.» (`docName`), «Код» (`docDesignation`/`ulCode`), «Изм» (`docVersion`)

## Границы
- Только Frontend (+ docs-store clamp step при чтении/persist при необходимости)
- Backend / API не трогаем
- Не удалять `sputnik_data` / memory_storage

## Цепочка
См. `chain.md`
