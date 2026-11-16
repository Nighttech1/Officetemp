# Trainer grade — W-84 / 2026-10-03

## План хода (кратко)

- Запрос пользователя: (1) колонтитул-картинка из `templates/Накладная1 от 09.09.26.docx` обязана быть видна в предпросмотре; (2) pan только по документу, не в чёрную зону; (3) Google connect HTTP 400 gid=4 при доступе «Редактор» — Оркестратор сам проходит connect через наш API, видит все листы/столбцы, пишет тестовые данные.
- Тикеты / волна: C-821 (P0 header image real template), C-820 (pan clamp), C-822 (Google gid≠sheetId).
- Поверхности: WaybillLivePreview + globals.css; cloud_url.py gviz by sheet name; Client Playwright на реальном шаблоне.

## Грейд команды: B

## Пробелы

| # | Пробел | Роль | Слой (skill/rule/plugin/MCP) | Критичность |
|---|--------|------|------------------------------|-------------|
| 1 | Guard принимал синтетический 1×1 PNG вместо реального floating header (`wp:anchor`) | Client / Tester | skill client-review + doc-engine | P0 |
| 2 | OOXML sheetId ошибочно = Google gid; нет пути gviz `sheet=name` | Google Sheets | skill google-sheets | P0 |
| 3 | clampPan допускает 96px пустоты (чёрная зона) | Frontend | skill doc-engine / preview notes | P1 |

## Что добавлено этим ходом

- `google-sheets/SKILL.md`: запрет OOXML sheetId как gid; обязателен CSV/gviz по **имени листа**.
- `doc-engine/SKILL.md` / client-review note: приёмка колонтитулов только на реальном шаблоне с `wp:anchor` + naturalWidth≥100.
- Wave folder `W-84-header-pan-gid` + probes.

## Gap после замечания пользователя

- Ожидали: картинка колонтитула из Накладная1 в preview; pan по листу; connect Google.
- Получили: текст/фейковый 1×1 прошёл guard; pan в void; CSV gid=4 → 400 при Editor access.
- Чего не хватало: знание что xlsx `sheetId` ≠ Google `gid`; что floating header image ≠ inline picture; Client gate на реальный файл.
- Как закрыли: skills + инженерный fix gviz by name + CSS/post-render для anchor + строгий clamp.

## Вердикт

Команда готова к Архитектору / инженерам: **да**  
Следующий агент: Архитектор → Frontend + Google Sheets/Backend → Tester → Fixer → Deployer → Клиент
