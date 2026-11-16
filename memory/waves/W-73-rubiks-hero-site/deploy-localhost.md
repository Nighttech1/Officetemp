# Deploy localhost W-73 — RubiksCube hero landing

**Дата:** 2026-10-01  
**Цель:** только localhost (не VPS)  
**Gate:** ready for client

## URLs

| Страница | URL | HTTP |
|----------|-----|------|
| Полный сайт (hero) | http://127.0.0.1:3000/ | 200 |
| Demo RubiksCube | http://127.0.0.1:3000/demo/rubiks-cube | 200 |

VPS: нет (не запрошен / не согласован).

## Как поднято

- **Команда:** `npm run dev` в `frontend/`
- **Стек:** Next.js 15.5.25, порт **3000**
- **PID shell:** 17040 (фон)
- **Backend / docker-compose:** не поднимались — для W-73 (landing RubiksCube hero) достаточно фронта; кабинет `/app` и API proxy (`API_PROXY_TARGET=8005`) для этой приёмки не нужны
- **Data-safety:** данные `sputnik_data.db` / `memory_storage` не трогались

## Проверка

```
HOME status=200 len=175157
DEMO status=200 len=53799
```

## Статус

**READY_FOR_CLIENT** — localhost доступен для приёмки Клиента.
