# Guards — C-06 analyzer + PDF bridge

## Executable
```bash
cd backend && pytest tests/test_template_analyzer.py tests/test_pdf_convert.py tests/test_generate_api.py -q
```
Expected:
- analyze returns var / tr_for tags (incl. split runs fixture)
- PDF converter invokes LibreOffice `--headless --convert-to pdf` (mocked in unit tests)
- `POST /api/v1/templates/analyze` and generate/pdf wired

## Regression class
Tag list empty due to split `w:t`; PDF in-process UNO; LO missing without clear 503.
