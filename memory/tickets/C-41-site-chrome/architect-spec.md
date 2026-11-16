# C-41 architect-spec — Site chrome everywhere

## Диагноз
Сейчас два контура:
- `/` — `LandingNav` + `LandingFooter` внутри `LandingPage`
- `/app/*` — `AppNav` + мини-футер «Контакты» в `app/app/layout.tsx`
- `/contact`, `/login` — без лендинг-шапки/футера

## Решение
1. В корневом `app/layout.tsx` всегда рендерить `LandingNav` сверху и `LandingFooter` снизу вокруг `{children}`.
2. Убрать nav/footer из `LandingPage`.
3. Убрать `AppNav` и мини-footer из `app/app/layout.tsx` (оставить AuthGate + Aurora + main).
4. В `LandingNav`: на не-главной (`pathname !== "/"`) сразу сплошной тёмный фон шапки (как scrolled), чтобы не «парить» прозрачной над кабинетом.
5. `AppNav.tsx` не удалять файл (может пригодиться), но не подключать.

## Вне scope
Logout в шапке (остаётся LoginPopover «Личный кабинет»).
