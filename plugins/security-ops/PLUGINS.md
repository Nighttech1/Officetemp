# Плагины — Security Ops

| Name | Type | Where | When |
|------|------|-------|------|
| audit | skill (oktsec) | `.agents/skills/audit/` | OWASP Top 10 аудит кода |
| api-security-review | OWASP | `.agents/skills/api-security-review/` | API Top 10 |
| code-review-security | OWASP | `.agents/skills/code-review-security/` | code review |
| sca-audit | OWASP | `.agents/skills/sca-audit/` | CVE зависимостей |
| secrets-scan | OWASP | `.agents/skills/secrets-scan/` | утечки секретов |
| web-security-review | OWASP | `.agents/skills/web-security-review/` | web |
| dependency-check | tool | `plugins/security-ops/dependency-check/` | SCA |
| semgrep-rules | rules | `plugins/security-ops/semgrep-rules/` | SAST |

Включать во **втором цикле** по спецкоманде.
