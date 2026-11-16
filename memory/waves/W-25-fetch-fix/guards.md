# Guard W-25 / C-58

- gen URL after fix: `http://127.0.0.1:3010/api/v1/generate/docx` (not :8001)
- Playwright: status 200, uiOk, uiErr=null, download `user_template_filled.docx`
- Artifact: `memory/waves/W-25-fetch-fix/client-downloaded.docx`
- Compare: valid DOCX vs `user_template.docx` (tags filled, file opens)
