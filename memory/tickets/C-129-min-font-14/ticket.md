### [C-129] Минимальный кегль UI сайта ≥ 14px

- **Зона:** `tailwind.config.ts`, `globals.css`, мелкие `text-xs` / `text-[10px]`…`text-[13px]` в UI
- **Факт:** После W-52 диапазон 10–16px — слишком мелко (подсказки, hints PreferencesCard).
- **Ожидание:** Самый мелкий UI-текст ≥ **14px** (xs/sm и absolute px-классы). Потолок 16px сохранить. Факсимиле листа ИУЛ (`.iul-sheet-preview`) может остаться 10pt Times под Word.
- **Приоритет:** P1
- **Статус:** done
- **Волна:** W-53
