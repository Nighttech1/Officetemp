# W-79 architect-spec — дерево ИУЛ + лаги

## Вердикт по evidence (Playwright localStorage + backend)

| Hyp | Статус | Evidence |
|-----|--------|----------|
| A | **CONFIRMED** | 297 folders / 27 docs; 144×«ИУЛ» + 144×«Накладные»; `systemKey` почти все `undefined`; backend `workspace_service.py:106` оставляет только `signatures` |
| B | REJECTED | Документы `type=doc` с designation; иконки папок = реальные folder-ноды «ИУЛ» |
| C | REJECTED | У ИУЛ есть `docDesignation` (напр. `56-0321-ОК-1-2-КЖ6.2`) |
| D | **CONFIRMED** | ~100 root-kids на проект → тяжёлый rebuild |
| E | **CONFIRMED** | `persist({step})` → `onChanged` → `refreshKey` → sidebar; hover-scrub SlideTabs дергает `onSelect` |

## Тикеты

- **C-220 P0** ИУЛ как папки / имя «ИУЛ» вместо обозначения
- **C-221 P0** лаги дерева + постоянный refresh
- **C-222 P0** лаги/потеря плавности шагов; снести системные папки ИУЛ/Накладные

## chain.md

1. Backend — не обнулять systemKey (на всякий случай для signatures + legacy)
2. Frontend docs-store — убрать создание iul/waybills; миграция purge дублей; createDocument без sys folder
3. Frontend page/wizard — onChanged только при tree-relevant; step без refresh sidebar
4. SlideTabs — hover не меняет selected (только курсор), select по клику
5. Tester / Deployer localhost
6. Client

## DoD

- В корне проекта нет папок «ИУЛ»/«Накладные» (системных)
- ИУЛ в дереве = файл + label из `docDesignation`
- Переключение шагов/документов не бампит `refreshKey` дерева
- Плавность SlideTabs + DocsStepMotion восстановлена
