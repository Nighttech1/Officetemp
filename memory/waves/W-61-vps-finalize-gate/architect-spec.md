# W-61 — Финальный gate до выкладки на VPS

## Цель
Закрыть всё **до** SSH на VPS: 6.3.6 + пакет 6.4 (compose/secrets/backup/runbook).  
Сам деплой на `155.212.187.181` — только после явного «да» / «согласовано» Клиента (6.4.7).

## Тикеты
| ID | P | Что |
|----|---|-----|
| C-605 | P0 | 6.3.6: login #2 (новый «браузер»/пустой LS) → GET snapshot + download Word по storage_key |
| C-606 | P0 | 6.4 prep: release compose + `.env.production.example` + backup script + RELEASE.md |

## Вне scope этой волны
- SSH/scp на VPS без «да»
- 6.2.6/6.2.7 (желательно после первого prod)
