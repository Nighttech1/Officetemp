# OfficeTemp import notes

Imported from the local OfficeTemp project on 2026-11-17. Application source and behavior were not changed.

The final project contains 13681 files. Source files are verified using Git blob hashes. The three files transferred in parts are reconstructed and checked with SHA-256 by a one-time GitHub Actions workflow; temporary parts and that workflow are removed from the completed tree.

## Exclusions

Actual environment files, local databases and runtime uploads, browser profiles, credentials/private key files, logs, caches, installed dependencies and build outputs remain local. Use the example environment files and reinstall dependencies in a new environment. No original local files were deleted.

GitHub secret protection rejected credential samples in third-party scanner/payment-library tests. The following 74 sample files are omitted; OfficeTemp application code and its own tests are preserved. Safe scanner rules are included.

- `plugins/payment-processor/stripe-python/tests/test_http_client.py`
- `plugins/payment-processor/stripe-python/tests/test_util.py`
- `plugins/security-ops/semgrep-rules/ai/ai-best-practices/llm-api-key-in-source/llm-api-key-in-source-javascript.js`
- `plugins/security-ops/semgrep-rules/ai/ai-best-practices/llm-api-key-in-source/llm-api-key-in-source-python.py`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/adobe-client-secret.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/authress-service-client-access-key.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/aws-access-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/databricks-api-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/digitalocean-access-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/digitalocean-pat.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/digitalocean-refresh-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/doppler-api-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/flutterwave-public-key.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/flutterwave-secret-key.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/generic-api-key.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/github-app-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/github-fine-grained-pat.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/github-oauth.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/github-pat.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/github-refresh-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/huggingface-access-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/huggingface-organization-api-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/linear-api-key.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/lob-api-key.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/mailchimp-api-key.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/mailgun-private-api-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/mailgun-pub-key.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/mailgun-signing-key.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/openai-api-key.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/postman-api-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/private-key.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/pulumi-api-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/rubygems-api-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/sendinblue-api-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/shippo-api-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/shopify-access-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/shopify-custom-access-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/shopify-private-app-access-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/shopify-shared-secret.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/slack-app-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/slack-bot-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/slack-config-access-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/slack-config-refresh-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/slack-legacy-bot-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/slack-legacy-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/slack-legacy-workspace-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/slack-user-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/slack-webhook-url.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/square-access-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/telegram-bot-api-token.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/gitleaks/twilio-api-key.go`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-aws-access-key-id-value.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-aws-session-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-facebook-access-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-github-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-mailchimp-api-key.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-mailgun-api-key.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-npm-registry-auth-token.npmrc`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-onfido-live-api-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-picatic-api-key.jsx`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-private-key.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-private-key.yaml`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-sendgrid-api-key.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-slack-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-slack-webhook.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-slack-webhook.yaml`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-square-access-token.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-square-oauth-secret.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-stripe-api-key.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-stripe-restricted-api-key.txt`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-telegram-bot-api-key.php`
- `plugins/security-ops/semgrep-rules/generic/secrets/security/detected-twilio-api-key.txt`
- `plugins/security-ops/semgrep-rules/javascript/lang/security/audit/hardcoded-hmac-key.js`
- `plugins/security-ops/semgrep-rules/terraform/aws/security/aws-lambda-environment-credentials.tf`

## Validation scope

Import verification checks file paths and exact file contents. It does not certify a passing application test baseline. The original CI workflow is preserved. Start with START_HERE.md and check the Actions results before making feature changes. Windows-specific scripts and MCP paths need adaptation outside the original machine. No VPS deployment was performed.
