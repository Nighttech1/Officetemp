# Trainer grade — W-87 / 2026-10-03

## План хода
- Preview: НЕ fill до явного row range; clip/h-scroll; center cells
- Multi-select листов (колонки+строки); dropdown не обрезать
- Реестр: клик сверху (баг normalize 4→3)
- Дерево: проект обязателен; после DOCX/PDF — файл с номером; клик восстанавливает wizard
- Клиент: Playwright только на живой приёмке после фикса, не «вместо» инженерии

## Gap (почему «не то»)
1. normalizeWaybillStep(4)=3 ломал вкладку Реестр
2. Старые rowFrom/rowTo в localStorage → fill на шаге 1
3. Нет multi-sheet UX; overflow родителя режет FieldSelect
4. Нет snapshot-документа после генерации в дереве

## Грейд: B → после патча skills/guards

## Вердикт
Frontend + docs-store + Backend sheets merge → Tester → Client Playwright
