# W-20 — Wizard E2E (Client ran scenario)

**Status:** done  
**Fixes:** ensureDevSession (Not authenticated), ProjectSidebar hydration  

## Client scenario result (Playwright)
- Step 1 upload template ✅ `waybill_template.docx` · 8 fields
- Step 2 upload excel ✅ sheets `Реквизиты` / `Техдок` → selected Техдок · 5 rows
- Step 3 mapping ✅ template still visible
- Step 4 generate DOCX ✅ download received

Fixtures: `memory/waves/W-20-wizard-e2e/`
