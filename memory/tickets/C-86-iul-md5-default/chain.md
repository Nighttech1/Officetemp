# chain.md — W-37 C-86 / C-87 / C-88

1. **Frontend** (профиль A: Next/React)
   - paths:
     - `frontend/lib/docs-store.ts`
     - `frontend/lib/iul-hash.ts`
     - `frontend/lib/iul-seed.ts`
     - `frontend/lib/iul-pdf.ts`
     - `frontend/components/docs/InfoSheetWizard.tsx`
     - `frontend/components/docs/InfoSheetLivePreview.tsx`
     - `frontend/app/app/documents/info-sheet/page.tsx`
     - `frontend/lib/iul-hash.selftest.ts` (при необходимости)
2. **Tester** — selftest хэша MD5 len=32; guards в tickets
3. **Fixer** — до зелёного
4. **Deployer** — localhost frontend (+ API если уже крутится)
5. **Client** — приёмка

Не звать: Backend DDL, Motion, Security/Hacker.
