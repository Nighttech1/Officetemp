# Guards C-101 — вёрстка как образец

Образец: `reference-iul.png`

## Авто
```text
cd frontend && npx tsx lib/iul-pdf.selftest.ts
```
В PDF: объект label|value; MD5|hash; футер с «Информационно-удостоверяющий лист» + Лист/Листов.

## Ручная
Сравнить скачанный ИУЛ с `reference-iul.png` (ряды и ширины).
