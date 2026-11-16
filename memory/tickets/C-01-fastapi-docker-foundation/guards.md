# Guards — C-01 FastAPI + Docker foundation

## Executable
```bash
cd backend && pytest tests/test_health.py -q
```
Expected: `GET /health` → 200, `status == "ok"`.

## Localhost (after deploy)
```bash
curl -s http://localhost:8000/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs
```
Expected: JSON ok + docs 200.

## Regression class
API process boot + health contract (not a single hardcoded host).
