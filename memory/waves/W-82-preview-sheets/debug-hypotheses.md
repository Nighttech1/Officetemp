# DEBUG hypotheses — W-82 (session 6cfa5a)

| ID | Гипотеза |
|----|----------|
| H1 | Превью шире окна: Word даёт фиксированные px; CSS width:100% не масштабирует → overflow (клип) |
| H2 | Колонтитулы в DOM есть, но clipped / height 0 / visibility из-за overflow CSS |
| H3 | Колонтитулы не попадают в DOM (docx-preview + breakPages:false / опции) |
| H4 | Google export отдаёт HTML/не-PK; SA fallback нет или падает → connect «не работает» |
| H5 | FE: blur/paste auto-connect держит `busy`, кнопка «не загорается»; connect падает по auth/proxy/dedup |

Инструменты: `WaybillLivePreview`, `WaybillWizard`, `api.ts`, `cloud_url.py` → `debug-6cfa5a.log`.
