# W-84 chain

## Цель
C-821 header image (Накладная1), C-820 pan document-only, C-822 Google gviz-by-name + E2E.

## Порядок
1. Trainer ✅
2. Architect ✅ (этот файл)
3. Frontend — WaybillLivePreview fixFloatingHeaderImages + clampPan
4. Google Sheets / Backend — cloud_url gviz sheet=name
5. Tester — probe real template + API from-url
6. Fixer — до зелёного
7. Deployer — reload localhost FE/API
8. Client — Playwright на реальном шаблоне + connect

## Не звать
Motion, Landing, Security/Hacker, AI Bridge.
