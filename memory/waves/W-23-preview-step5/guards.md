# Guard W-23 E2E
- Cause of screenshot: CORS blocked FE :3010 vs API :8000 (stale JWT / no Allow-Origin)
- Fix: API on :8001 + CORS regex localhost + AuthGate clears stale token
- FE: http://127.0.0.1:3010 NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
- Playwright: step1 template, step2 Google connect (12 sheets), preview table rows, step3 map, step4 DOCX, authErr=0
