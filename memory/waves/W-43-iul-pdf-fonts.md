# W-43 — PDF ИУЛ кириллица

- tickets: C-99
- status: done
- agents:
  - Client: тикет — шрифты «летят» при скачивании
  - Architect: встроить DejaVu вместо Helvetica
  - Frontend: `iul-pdf.ts` + `public/fonts/` + await в wizard
  - Tester: selftest + pymupdf text_ok + preview
  - Deployer: шрифты отдаются с `:3000/fonts/…`
