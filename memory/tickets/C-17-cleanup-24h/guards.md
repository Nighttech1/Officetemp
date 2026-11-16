# Guards — C-17 cleanup 24h

```bash
cd backend && pytest tests/test_cleanup.py -q
```
Expected: artifact dirs older than TTL removed; fresh kept; only under `.runtime/jobs` (no User/PII wipe).
