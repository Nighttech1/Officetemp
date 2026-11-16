# Trainer grade — W-85 / 2026-10-03

## План хода (кратко)

- Запрос: (1) preview 1:1 Word (без лишних строк сверху/между блоками, шрифты); (2) серая рамка не обрезает + pan без выделения текста; (3) Google ISE / медленно — spreadsheet `1vI8fUt1…`, лист `Журнал выдачи ПД 2026`, gid=`124580750`, CSV by gid, без xlsx, TTL cache, цель 300–800ms.
- Тикеты: C-851 preview fidelity, C-852 pan/clip, C-853 google fast-csv+cache.
- Поверхности: WaybillLivePreview + globals.css; cloud_url.py.

## Грейд команды: B

## Пробелы

| # | Пробел | Роль | Слой | Критичность |
|---|--------|------|------|-------------|
| 1 | `fixFloatingHeaderImages` переводит floating в flow → лишняя высота сверху | Frontend / Doc Engine | skill doc-engine | P0 |
| 2 | Нет чеклиста «шрифты Word в preview» (Times) | Doc Engine | skill | P1 |
| 3 | При `#gid=` всё ещё list tabs → xlsx fallback (медленно/ISE) | Google Sheets | skill google-sheets | P0 |
| 4 | Нет TTL cache на from-url | Google Sheets / Backend | skill | P1 |

## Что добавлено этим ходом

- google-sheets: при url `#gid=` / `?gid=` — сразу `export?format=csv&gid=` без xlsx; TTL 45s.
- doc-engine: floating header держать absolute (не static flow); user-select:none в pan; overflow visible / ширина по content.

## Gap после замечания

- Ожидали: 1:1 Word + быстрый connect по gid.
- Получили: картинка видна, но layout раздут; pan выделяет текст; ISE/медленно из‑за list tabs/xlsx.
- Закрываем skills + фикс кода по TZ пользователя.

## Вердикт

Команда готова: **да** → Архитектор → Frontend + Google Sheets → Tester → Client
