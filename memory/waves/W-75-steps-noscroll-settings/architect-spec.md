# W-75 Architect Spec

## Цель
Убрать дешёвые горизонтальные scrollbar у шагов/хрома; при узком экране — вертикальный список шагов слева; кнопку «Настройки» ИУЛ перенести к «Библиотека подписей».

## C-205
1. `slide-tabs.tsx`: убрать `overflow-x-auto`. Режим **auto**:
   - измерить ширину контейнера vs нужную ширину горизонтального бара;
   - если влезает → горизонтальный pill без scroll;
   - если нет → `flex-col` вертикальный rail слева (cursor по `top`/`height`).
2. Wizard layout (Waybill + InfoSheet): при vertical — `flex-row` с шагами слева (`shrink-0 w-36/40`), контент справа; действия DOCX/PDF остаются сверху контента.
3. Убрать `overflow-x-auto` с обёрток SlideTabs и MultiButton toolbar в `ProjectSidebar`.
4. Таблицы данных: оставить прокрутку контента при необходимости, но скрыть «дешёвый» scrollbar (`scrollbar-none` / webkit hide) — не ломать доступ к широким таблицам.

## C-206
1. На странице `info-sheet/page.tsx` рядом с «Библиотека подписей» добавить «Настройки».
2. В `InfoSheetWizard` убрать кнопку Настройки из ряда с Generate; принять `settingsOpen` / `onOpenSettings` / `onCloseSettings` снаружи ИЛИ `settingsSlot` / callback `requestOpenSettings` + controlled `roleSettingsOpen` from parent.
   Проще: props `roleSettingsOpen` + `onRoleSettingsOpenChange` с страницы; кнопка только на странице.

## Границы
Только Frontend. Backend/VPS не трогать.

## Acceptance
- Нет видимого horizontal scrollbar под шагами.
- Узкое окно: шаги столбиком слева.
- Настройки у Библиотеки подписей (ИУЛ).
