# Architect — W-33 (C-76 / C-77)

## C-76
- `info-sheet/page.tsx`: в шапке рядом с `<h1>` кнопка «Библиотека подписей» → `setSignaturesOpen(true)` (нужен `projectId`).
- `ProjectSidebar`: удалить узел «Подписи» из дерева; props `onSelectSignatures` / `signaturesOpen` можно оставить для совместимости или упростить (кнопка только на странице).
- Системная папка в store остаётся (данные библиотеки), просто не показывается в дереве.

## C-77
- `slide-tabs.tsx`: индикатор `bg-transparent border border-white` (или `border-ink` на светлом фоне карточки — на dark card: `border-white/80`), без `bg-ink`.
- Текст табов: активный `text-ink` или `text-white` без конфликта с заливкой — при прозрачном индикаторе оба варианта читаемы; оставить `text-ink` для всех или active чуть ярче.

## Chain
Frontend → Tester → Client
