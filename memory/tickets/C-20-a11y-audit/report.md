# C-20 A11y audit report (W-06)

## Scope
Login, register, app shell (`/app/*`), root layout. Teal DocSaaS tokens kept (no purple).

## Issues found (before)

| # | Issue | Severity | Where |
|---|--------|----------|--------|
| 1 | No skip link to main content | P1 | Root layout |
| 2 | `#main` landmark id missing (skip target) | P1 | Login / register / app shell / home |
| 3 | Focus rings weak on nav links (only global outline) | P2 | `AppNav` links |
| 4 | Home redirect wrapper not a landmark | P3 | `/` |

Already OK before wave:
- `lang="ru"` on `<html>`
- Form fields via `Field`: wrapping `<label htmlFor={id}>` + matching `input id`
- Buttons default `type="button"`; submit buttons pass `type="submit"`
- Global `:focus-visible` outline in teal
- App shell already has `<main>`

## Fixes applied

1. Skip link «Перейти к содержимому» → `#main` (`.skip-link`, visible on focus).
2. `id="main"` + `tabIndex={-1}` on login, register, app shell, home `<main>`.
3. Stronger `:focus-visible` rules for `a` / `button` / form controls; nav links get `focus-visible:ring-*`.
4. Report + guards for regression.

## How to verify

- Keyboard: Tab on `/login` — first focusable is skip link; Enter jumps to form main.
- Labels: click «Email» label focuses email input.
- Contrast: brand `#0f766e` on white remains for primary CTAs.
