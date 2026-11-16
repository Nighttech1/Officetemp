# W-84 architect-spec

## Гипотезы (runtime)

| ID | Гипотеза | Evidence |
|----|----------|----------|
| H-header-0box | Floating `wp:anchor` → wrapper 0×0 + max-width:100% → offset 0 | probe_real_header.json natural 2480×573, offset 0×0, parentStyle width:0 |
| H-pan-slack | PAN_EDGE_PX=96 пускает чёрную зону | clampPan formula |
| H-gid-sheetId | xlsx sheetId=4 ≠ Google gid → CSV 400 | debug-6cfa5a.log gid=4 status 400, tabs from xlsx zip |

## Фикс
1. `fixFloatingHeaderImages` после renderAsync
2. clampPan без slack
3. `_download_google_csv` → gviz by sheet name; xlsx tabs gid=-1-n
