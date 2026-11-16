# W-53 — ИУЛ Times/bold, стрелки Preferences, min font 14

**before_sha:** (working tree)

## Тикеты (≤3)
- **C-127** P0 — PDF/превью ИУЛ: Times New Roman 10pt + bold как в `ИУЛ template.docx`
- **C-128** P0 — PreferencesCard: chevron у текста; HelpHover не клипается
- **C-129** P1 — UI min font-size 14px

## Chain
1. Архитектор → spec + chain
2. Doc Engine / Frontend (`iul-pdf`) — C-127
3. Frontend — C-128, C-129
4. Тестировщик → Фиксер → Деплоер → Клиент
