# Guards C-213 — кнопки реестра

## Regression
1. Накладные → шаг «Реестр».
2. Primary справа: «Записать данные в реестр» (не «Далее»).
3. Рядом мелкая secondary: «Сохранить настройки реестра» (`!h-8 !text-xs`).

## Probe
`probe_w78.py` → `registry-primary`, `registry-save-small`.

## Status
PASS 2026-10-02 (W78_PASS)
