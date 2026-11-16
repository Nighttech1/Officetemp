# W-80 architect — единое дерево + hover шагов

## Тикеты
- **C-223 P0** Одинаковое поведение дерева ИУЛ/Накладные; expand state не сбрасывать при переключении раздела
- **C-224 P1** Вернуть hover-scrub шагов (как было), без refresh дерева (уже сделано в W-79)

## Гипотезы / причины
| ID | Причина |
|----|---------|
| T1 | `expanded` в `useState` внутри ProjectSidebar — при remount маршрута `/info-sheet` ↔ `/waybills` состояние теряется |
| T2 | Разная логика `onSelectDoc` / кликов по kind (навигация vs multi-select) влияет на ощущение «другого» дерева |
| T3 | Hover-scrub отключён в slide-tabs (W-79) — нужно вернуть `onSelect` на hover; лаг уже снят (persist без onChanged на step) |

## План
1. Persist `expanded` в `sessionStorage` (общий ключ для обоих разделов)
2. Унифицировать клик по узлам: expand/collapse одинаково; не сбрасывать expanded при смене раздела
3. Вернуть hover → onSelect в SlideTabs (логирование оставить)
4. Проверка localhost

## chain
Frontend → Tester smoke → Client
