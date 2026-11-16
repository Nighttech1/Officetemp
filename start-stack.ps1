# DocSaaS portable local stack starter.
# Idempotent, no admin, drive-letter independent (paths derived from this script's location).
# Starts PostgreSQL, Redis, backend API (8005), frontend (3000) if not already up.
$ErrorActionPreference = 'SilentlyContinue'

$OfficeTemp   = $PSScriptRoot                       # ...\Applications\OfficeTemp
$Applications = Split-Path $OfficeTemp -Parent      # ...\Applications
$Tools        = Join-Path $Applications 'Tools'

$Py       = Join-Path $OfficeTemp 'backend\.venv.broken-py312\Scripts\python.exe'
$NodeDir  = Join-Path $Tools 'node'
$NodeExe  = Join-Path $NodeDir 'node.exe'
$PgCtl    = Join-Path $Tools 'postgres\pgsql\bin\pg_ctl.exe'
$PgData   = Join-Path $Tools 'postgres\data'
$PgLog    = Join-Path $Tools 'postgres\logfile.txt'
$RedisExe = Join-Path $Tools 'redis\redis-server.exe'
$RedisCfg = Join-Path $Tools 'redis\redis.office.conf'

$logDir = Join-Path $OfficeTemp '.runtime\stack-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-Port($p) {
  [bool](Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue)
}

# 1) PostgreSQL (portable cluster on the same drive)
if (-not (Test-Port 5432)) {
  & $PgCtl -D "$PgData" -l "$PgLog" -o "-p 5432" start | Out-Null
}

# 2) Redis
if (-not (Test-Port 6379)) {
  Start-Process -FilePath $RedisExe -ArgumentList "`"$RedisCfg`"" -WindowStyle Hidden
}

# Wait for the DB (up to ~20s) before starting the API
for ($i = 0; $i -lt 20 -and -not (Test-Port 5432); $i++) { Start-Sleep -Seconds 1 }

# 3) Backend API (FastAPI / uvicorn) on 8005
if (-not (Test-Port 8005)) {
  Start-Process -FilePath $Py `
    -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8005' `
    -WorkingDirectory (Join-Path $OfficeTemp 'backend') `
    -RedirectStandardOutput "$logDir\backend.log" `
    -RedirectStandardError  "$logDir\backend.err.log" `
    -WindowStyle Hidden
}

# 4) Frontend (Next.js) on 3000
if (-not (Test-Port 3000)) {
  $env:PATH = "$NodeDir;" + $env:PATH
  Start-Process -FilePath $NodeExe `
    -ArgumentList 'node_modules\next\dist\bin\next','dev','-p','3000' `
    -WorkingDirectory (Join-Path $OfficeTemp 'frontend') `
    -RedirectStandardOutput "$logDir\frontend.log" `
    -RedirectStandardError  "$logDir\frontend.err.log" `
    -WindowStyle Hidden
}

Write-Output ("DocSaaS @ {0}  PG={1}  Redis={2}  API(8005)={3}  FE(3000)={4}" -f `
  $OfficeTemp, (Test-Port 5432), (Test-Port 6379), (Test-Port 8005), (Test-Port 3000))
Write-Output "Open: http://localhost:3000   (login admin1 / admin1)"
