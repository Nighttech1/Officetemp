# Guards — C-41 Site chrome

## Assert
1. `GET /`, `/app/documents/waybills`, `/contact`, `/login` — в HTML есть `class="landing-nav"`.
2. Там же есть `aria-label="Подвал"` и ссылки Войти / Регистрация / Контакт / Кабинет.
3. На `/app/documents/waybills` нет кнопки «Выйти» из старого AppNav.
4. Один `landing-nav` на страницу (не два).

## Checked
- 2026-09-23: localhost — landing-nav=1 на waybills; footer «Подвал» присутствует; AppNav убран из app/layout.
