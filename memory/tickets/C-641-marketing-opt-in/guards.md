# C-641 — Marketing opt-in / unsubscribe

## Done
- `marketing_opt_in_at` + `marketing_unsub_token_hash` on `pii.user_profiles`
- Register `marketing_opt_in`, PATCH profile, public `POST /marketing/unsubscribe`
- Audit: `marketing.opt_in` / `opt_out` / `unsub`

## Guard
`pytest tests/test_marketing.py -q` — green
