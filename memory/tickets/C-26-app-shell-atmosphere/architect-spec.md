# Architect spec — C-26 App shell atmosphere

## Проблема
`app/layout` — только слабый radial; кабинет выглядит проще публичных экранов.

## Решение
1. Обернуть shell в `AuroraBackground` (или shared subtle variant `intensity="soft"`).
2. `AppNav`: `backdrop-blur-md bg-surface/70 border-b border-line/60`.
3. Контент уже на `GlassCard` — после C-24 станет тёмным.

## Acceptance
Скрин `/app` (после логина или AuthGate redirect на login — проверить layout классами) / публичный parity по токенам.
