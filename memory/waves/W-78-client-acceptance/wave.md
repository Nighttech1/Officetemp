# W-78 Client acceptance plan (C-213…C-219)

## Scope
User remarks after W-77 — 7 points. Contour: Doc SaaS localhost FE:3000 + API:8005.

## Checks (Клиент + Playwright)
1. **C-213** ИУЛ предпросмотр: нет текстовых подсказок-комментариев под заголовком.
2. **C-214** Тумблер шагов: плавный fade/slide при смене шага (ИУЛ + накладные).
3. **C-215** Кубик: уход с `/` в приложение и возврат — нет «бешеного» разгона.
4. **C-216** Накладные: DOCX/PDF чёрные+серый текст пока не готово; оба зелёные+чёрный текст когда готово.
5. **C-217** Названия шагов серые пока предыдущие не заполнены; «Далее» disabled тёмно-зелёный.
6. **C-218** Шаг реестр: боковой scrollbar-brand при длинном списке полей.
7. **C-219** «Настройки реестра»: CRUD профилей, зелёная рамка текущего, подстановка в новую накладную.

## Chain
Deployer (health) → Client Playwright desktop 1440 → Tester probes → Client verdict.
Mobile: spot-check waybills if time; hard focus desktop Doc SaaS scenarios.
