# Плагины — Hacker (пентест)

| Name | Type | Where | When |
|------|------|-------|------|
| hacker | skill | `.cursor/skills/hacker/` | оркестрация пентеста |
| OWASP ZAP | tool | `plugins/hacker/zaproxy/` | динамический скан |
| sqlmap | tool | `plugins/hacker/sqlmap/` | проверка SQLi (стенд!) |
| metasploit | tool | `plugins/hacker/metasploit/` | только по явному разрешению |

## MCP / CLI

Playwright MCP уже в проекте — для ручной проверки UI/auth flows во втором цикле.  
ZAP/sqlmap — локально против localhost.

**Запрет:** prod VPS без явного согласия в чате; wipe данных; публикация рабочих эксплойтов.
