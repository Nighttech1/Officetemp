# DocSaaS portable local stack stopper.
# Stops frontend (3000) and backend (8005). Pass -All to also stop Redis and Postgres.
param([switch]$All)
$ErrorActionPreference = 'SilentlyContinue'

$OfficeTemp   = $PSScriptRoot
$Applications = Split-Path $OfficeTemp -Parent
$Tools        = Join-Path $Applications 'Tools'

function Stop-Port($p) {
  $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Output ("stopped port {0} (PID {1})" -f $p, $c.OwningProcess)
  }
  if (-not $conns) { Write-Output ("port {0} already free" -f $p) }
}

Stop-Port 3000   # frontend
Stop-Port 8005   # backend API

if ($All) {
  Stop-Port 6379  # Redis
  & (Join-Path $Tools 'postgres\pgsql\bin\pg_ctl.exe') -D (Join-Path $Tools 'postgres\data') stop -m fast | Out-Null
  Write-Output "Postgres stop requested"
}
