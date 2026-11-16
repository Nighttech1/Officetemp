# Deploy localhost W-88

- Postgres: `E:\Applications\Tools\postgres\start-postgres.cmd` (:5432)
- Redis: `E:\Applications\Tools\redis\start-redis.cmd` (:6379)
- API: uvicorn `127.0.0.1:8005`
- Frontend: Next.js `127.0.0.1:3001` (**порт 3000 занят Grafana/Docker**)

Открывать: http://127.0.0.1:3001/app/documents/waybills
