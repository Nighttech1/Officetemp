# W-79 Debug plan — tree folders + lag

## Клиент
- C-220 P0: ИУЛ в дереве как папки / без названий
- C-221 P0: лаги при смене файлов и вкладок шагов

## Гипотезы
| ID | Гипотеза |
|----|----------|
| A | Backend snapshot обнуляет `systemKey` у iul/waybills → `ensureProjectSystemFolders` плодит дубли «ИУЛ»/«Накладные» (десятки пустых папок) |
| B | Документы рендерятся с `data.type=folder` / hasChildren → иконка папки |
| C | Подписи документов пустые (label blank) при живых title в store |
| D | Лаг от размера дерева (N папок) + полный rebuild sidebar на каждый refreshKey |
| E | Hover-scrub SlideTabs → setStep → persist → onChanged → refreshKey → лаг вкладок |

## Инструментация
ProjectSidebar treeData/onNodeClick, docs-store loadStore, workspace-sync applySnapshot, slide-tabs hover, InfoSheetWizard persist.
