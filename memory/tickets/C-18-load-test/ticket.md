### [C-18] Нагрузочный прогон пакетной генерации
- **Зона:** Backend / Doc Engine (фаза 5.4)
- **Факт:** Нет измеримого прогона «много документов за раз».
- **Ожидание:** скрипт `backend/scripts/load_test_jobs.py` — N строк (по умолчанию 100, флаг `--rows 1000`) через jobs API в eager или live; отчёт duration/rows/s в `memory/waves/W-06…/load-report.md`; pytest smoke на 10 rows.
- **Приоритет:** P0
- **Зона:** Backend | Tester
