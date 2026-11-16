# Architect — W-32 (C-75)

## Цель
Пакетное «Скачать ИУЛы» → один ZIP; прогон на `templates/*.pdf`; Клиент сверяет содержимое архива до «согласовано».

## Решение
1. При `batchDocIds.length > 1`: для каждого doc — `buildIulPdfBlob`; собрать ZIP через `fflate` (уже в дереве зависимостей через jspdf) или лёгкий helper `lib/zip-download.ts`.
2. Имена внутри ZIP: `iulPdfFilename(wizard)` (уникальные; при коллизии — суффикс `_2`).
3. Имя архива: `IULy-{date}.zip` или `iul-batch-{n}.zip`.
4. Одиночный режим без изменений (один PDF).
5. E2E/скрипт приёмки: загрузить 4 PDF из templates → batch → скачать ZIP → распаковать → проверить размер > 1KB и наличие строк (объект/хэш) через pdf parse или хотя бы file count + size.

## Chain
Frontend → Тестировщик (прогон + артефакт ZIP в memory/tickets/C-75…/artifacts/) → Фиксер → Деплоер localhost → Клиент (сверка → согласовано)
