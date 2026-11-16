# Design / Client / Frontend expert skills — источники

Установлено в `.agents/skills/` (через `npx skills add`). Hugging Face **не** даёт премиум UI-скиллов (там ML: `hf-cli`, trainers…) — для дизайна смотрим GitHub / 21st / skills.sh.

## Дорогой дизайн (Client + Frontend)

| Папка | Репозиторий | Для кого |
|-------|-------------|----------|
| `color-expert` | [meodai/skill.color-expert](https://github.com/meodai/skill.color-expert) | Frontend — палитры, OKLCH, a11y contrast |
| `design-engineering` | [AgentsORG/design-engineering](https://github.com/agentsorg/design-engineering) | Frontend/Client audit — typography, surface, anti-patterns (Emil Kowalski и др.) |
| `design-motion-principles` | [kylezantos/design-motion-principles](https://github.com/kylezantos/design-motion-principles) | Motion/Client — build + audit (Emil / Jakub / Jhey) |
| `motion-design` | [LottieFiles/motion-design-skill](https://github.com/lottiefiles/motion-design-skill) | Motion — timing/easing/choreography |
| `frontend-design` | anthropics/skills (уже было) | Frontend composition |
| `impeccable` | pbakaus/impeccable (уже было) | Polish / audit |
| `awwwards-landing` | Ga14ctic (уже было) | Elite pipeline + 21st inspiration |
| `landing-client-ready` | team | Presence gate density 6–7 |

## 21st.dev (каталог компонентов)

| Артефакт | Путь / URL |
|----------|------------|
| MCP | `.cursor/mcp.json` → server **`21st`** → `https://21st.dev/api/mcp` |
| Auth | **OAuth** (вход в Cursor без ключа) или API-ключ `API_KEY_21ST` · https://21st.dev/mcp · https://21st.dev/auth.md |
| Workflow skill | `.cursor/skills/twentyfirst-mcp/SKILL.md` |
| Plugin notes | `plugins/twentyfirst/PLUGINS.md` |
| Official skills | `21st-ui-explore`, `21st-ui-build`, `21st-ui-review`, `21st-cli-use`, `21st-ai`, `21st-registry`, `21st-design-sync` ← [21st-dev/skill](https://github.com/21st-dev/skill) |
| Docs | https://21st.dev/mcp · https://help.21st.dev/ai/mcp |

**Клиент:** MCP `search` / `get_inspiration` → тикет `C-*` с id компонента.  
**Frontend:** `get_component` → адаптировать под `DESIGN.md` → код в репо.

## Hugging Face

Только ML/Hub skills (уже в `.agents/skills/hf-*`, `transformers-js`, …). Отдельных «дорогой лендинг» skills на Hub нет — кадры через HF image MCP по-прежнему опциональны.
