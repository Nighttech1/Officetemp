# W-59 — Клиент: готовность к VPS

## Вердикт
**ПРИНЯТО С ЗАМЕЧАНИЯМИ** — к **переезду на VPS ещё не готовы** (нужен блок 6.4 + закрытие 6.3.6 + object storage).  
К **продолжению подготовки VPS** — да: ядро бэкенда на Postgres проверено на localhost.

Слово «согласовано» на prod / SSH — **не даём**.

## Где смотрел
- http://127.0.0.1:8005 (API Postgres)
- http://127.0.0.1:3000 (FE)
- Smoke JSON: `smoke-results.json`
- Unit: profile/workspace/storage/auth — 9 passed
- Alembic: `004_workspace_project_settings (head)`

## Smoke (всё 200/201)
health → register → login → profile → export → upload Word → download → workspace put/get; строки в `pii.user_profiles` и `workspace_documents`.

## Что ещё доработать по бэкенду до VPS
1. **P0** 6.3.6 — E2E «другой браузер видит файл Word» (guard)
2. **P0** Object storage на VPS (MinIO / Yandex Object Storage), не только local blobs
3. **P0** 6.4.1–6.4.6 — compose, секреты, HTTPS, бэкап тома, smoke на VPS
4. **Gate** 6.4.7 — явное «да» Клиента
5. **P2** 6.2.6 / 6.2.7 — encryption / RLS (желательно, не блокер первого деплоя если изоляция в коде держится)

## Итог одной фразой
Бэкенд для облачного ЛК на Postgres **готов как продукт на localhost**; **переезд на VPS** — после закрытия хранения файлов в облаке + чеклиста 6.4 и вашего «да».
