# Chain — W-82

```
Тренер (done) → Архитектор (spec) → Frontend (C-820, C-821, C-822 UX)
  → Google Sheets + Backend (C-822 connect path)
  → Тестировщик → Фиксер → Деплоер (localhost) → Клиент
```

Параллель: Frontend preview и Backend sheets **не** пересекают одни файлы — можно последовательно FE затем BE, или BE после FE UX.

Запрет: монолитный кодер вместо FE+BE; Security/Hacker; prod.