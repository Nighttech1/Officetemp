# Guards — C-07 dxpdf

```bash
cd backend && pytest tests/test_pdf_convert.py tests/test_generate_api.py -q
```
Expected: real fixture → `%PDF`; missing engine → PdfConversionUnavailable; API 503 when mocked fail.
