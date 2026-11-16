# C-642 — Campaigns + Celery HTML mail

## Done
- Tables `email_campaigns`, `email_campaign_deliveries`
- `POST/GET /api/v1/marketing/campaigns` (owner)
- Celery `send_marketing_campaign`; dry-run without SMTP
- `send_html_email` + `{{unsubscribe_url}}` / auto footer

## Guard
Campaign to opted-in user → stats.recipients=1, dry_run/sent ≥ 1
Without opt-in → recipients=0
