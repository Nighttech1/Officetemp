#!/usr/bin/env bash
# Backup Postgres volume + blobs volume on VPS (run BEFORE destructive ops).
# Usage on VPS (Docker):
#   sudo bash scripts/backup-vps-volumes.sh /var/backups/docsaas
set -euo pipefail

OUT="${1:-/var/backups/docsaas}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="${OUT}/${STAMP}"
mkdir -p "${DEST}"

echo "Backing up to ${DEST}"

# Postgres dump via running db container (preferred)
if docker compose ps db --status running >/dev/null 2>&1; then
  docker compose exec -T db pg_dump -U "${POSTGRES_USER:-docsaas}" "${POSTGRES_DB:-docsaas}" \
    | gzip > "${DEST}/postgres.dump.sql.gz"
  echo "OK postgres.dump.sql.gz"
else
  echo "WARN: db container not running — skip pg_dump" >&2
fi

# File blobs volume
BLOB_VOL="$(docker volume ls -q | grep -E 'docsaas_blobs$' | head -n1 || true)"
if [[ -n "${BLOB_VOL}" ]]; then
  docker run --rm -v "${BLOB_VOL}:/data:ro" -v "${DEST}:/backup" alpine \
    tar czf /backup/blobs.tar.gz -C /data .
  echo "OK blobs.tar.gz"
else
  echo "WARN: docsaas_blobs volume not found" >&2
fi

# Artifacts (jobs) — optional
ART_VOL="$(docker volume ls -q | grep -E 'docsaas_artifacts$' | head -n1 || true)"
if [[ -n "${ART_VOL}" ]]; then
  docker run --rm -v "${ART_VOL}:/data:ro" -v "${DEST}:/backup" alpine \
    tar czf /backup/artifacts.tar.gz -C /data .
  echo "OK artifacts.tar.gz"
fi

echo "DONE ${DEST}"
