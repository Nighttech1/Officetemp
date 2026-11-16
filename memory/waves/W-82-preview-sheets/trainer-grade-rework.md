# Trainer re-grade — W-82 rework (после замечания пользователя)

## Gap

| Ожидали | Получили | Чего не хватало |
|---------|----------|-----------------|
| Premium preview, toolbar на документе | Вложенные серые рамки, toolbar сбоку «дешево» | REJECT в client.mdc на nested frames |
| Connect + анимация | 500 Internal Server Error; анимация не видна | Знание: parse 96s → proxy timeout; contour не на видном уровне |
| Клиент всегда Playwright до пользователя | Отдали проверку человеку без Playwright | Жёсткий gate в client.mdc / client-review |

## Добавлено

- `client.mdc` + `client-review`: Playwright **до** любого ответа пользователю; REJECT nested preview frames; zoom 50–150%.

Грейд после патча знаний: **B** → инженерия.
