# W-60 — Landing handoff (client-ready волны 1/N)

**Цель:** довести `/` до уровня «не стыдно заказчику»  
**Тикеты волны (≤3):** C-148 P0 · C-149 P0 · C-145 P0  
**Сопутствующе закрывается:** C-146 (корневая причина = C-148)  
**URL:** http://127.0.0.1:3000/  
**21st:** atmosphere 19381 · (следующие волны: bento 9594, CTA 27898, FAQ 29935)

## Chain

```
Архитектор (landing-client-ready-gate + ASCII hero)
  → Landing Promo + Frontend (C-148, C-149, C-145)
  → Motion (hero reveal + soft atmosphere drift; reduced-motion)
  → Тестировщик (Playwright fontSize + presence screenshots)
  → Фиксер → Деплоер localhost → Клиент
```

Backend / Security / Hacker — не в этой волне.
