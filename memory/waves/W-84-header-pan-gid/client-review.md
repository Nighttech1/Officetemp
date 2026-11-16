# W-84 Client review

## Вердикт (внутренний): ПРИНЯТО для волны (ожидаем «согласовано» пользователя)

### C-821 header image (Накладная1)
- Playwright: `naturalWidth=2480`, `offsetWidth=854`, `offsetHeight=197`, `headerH=197`
- Скрин: `visual/preview-header.png` — логотипы Моспроект/Градостроительный комплекс видны вверху листа
- Probe до фикса: wrapper `width:0;height:0` → offset 0×0; после `fixFloatingHeaderImages` — ок

### C-820 pan document-only
- После жёсткого drag: `x=-360` (= `vw-docW`), `y=0`, `xOk/yOk=true`
- Slack `PAN_EDGE_PX` убран; padding stage снят

### C-822 Google connect
- Root cause: OOXML `sheetId` ≠ Google `gid` → CSV `gid=4` HTTP 400
- Fix: `gviz/tq?tqx=out:csv&sheet={Name}`
- HTTP `/api/v1/data/from-url`: 200, via=`export_csv_gviz`, 14 cols, 23 rows, 13 sheets, ~14s
- UI connect через мастер: ok
- Запись тестовых данных: `W84-TEST-…` внесён в лист «Мастерская №1», подтверждён повторным CSV через наш коннектор (`has_marker=True`)

## Артефакты
- `client_e2e_w84.json`, `e2e_http_from_url.json`, `e2e_google_api.json`, `e2e_write_google.json`
- `probe_real_header.png`, `visual/preview-header.png`, `google-write.png`
