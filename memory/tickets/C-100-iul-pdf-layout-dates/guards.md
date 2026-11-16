# Guards C-100

## Авто
```text
cd frontend
npx tsx lib/iul-hash.selftest.ts
npx tsx lib/iul-formation.selftest.ts
npx tsx lib/iul-pdf.selftest.ts
```
Ожидание:
- даты `11.09.2026` (точка)
- PDF без текста «Продолжение УЛ»
- картинка подписи aspect ≈ исходной (не квадрат на всю ячейку)

## Ручная
Скачать ИУЛ: подписи как в библиотеке; ячейки по центру; даты дд.мм.гггг; нет «Продолжение УЛ…».
