# Plugin notes — 21st.dev MCP

| Item | Value |
|------|--------|
| MCP id | `21st` in `.cursor/mcp.json` |
| Endpoint | `https://21st.dev/api/mcp` |
| Auth A | **OAuth** — только URL в mcp.json, вход в Cursor (см. https://21st.dev/auth.md) |
| Auth B | API-ключ `21st_sk_...` → header `x-api-key` / `Authorization: Bearer` |
| Setup UI | https://21st.dev/mcp |
| CLI | `npx @21st-dev/cli@latest init --client cursor` |
| Agent skill (workflow) | `.cursor/skills/twentyfirst-mcp/SKILL.md` |
| Official skills pack | `.agents/skills/21st-*` from [21st-dev/skill](https://github.com/21st-dev/skill) |

Legacy: `@21st-dev/magic` — proxy; prefer HTTP MCP.

После смены конфига: **Reload MCP** в Cursor. Если выбран OAuth — дождаться кнопки входа на 21st.
