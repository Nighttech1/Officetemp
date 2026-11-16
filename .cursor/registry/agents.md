# Реестр команды агентов — Doc SaaS (генерация документов)

Профиль по умолчанию: **SaaS потоковой генерации DOCX/PDF** (FastAPI + PostgreSQL + Celery + React/Next, 152-ФЗ).  
Шаблон Cortana/Sputnik — опционально, не звать без chain.

## Базовая команда (основной цикл разработки)

| Роль | Правило | Скилл | MCP / плагины |
|------|---------|-------|----------------|
| Клиент | `client.mdc` | `client-review`, `web-visual-critic`, `ticket-engine`, **`twentyfirst-mcp`** (выбор с 21st), … | playwright ×3, chrome-devtools, image-compare, a11y, lighthouse, **`21st`** |
| Оркестратор | `orchestrator.mdc` | реестр + team-org | |
| **Тренер** | `trainer.mdc` | **`trainer`** (+ `gap-playbook`) | `plugins/trainer` · аудит `.cursor/mcp.json` / skills / rules |
| Архитектор | `architect.mdc` | `architect`, `fastapi-saas`, `celery-highload` | `plugins/architect` |
| Фронтендер | `frontend.mdc` | vercel-react / next-dev-loop / responsive-mobile / luxury · **`twentyfirst-mcp`** · `color-expert` · `design-engineering` | `plugins/frontend` · **`21st`** MCP |
| **Landing Promo** | `landing.mdc` | **`landing-promo`** + **`landing-client-ready`** + `frontend-design` / `impeccable` / `awwwards-landing` / **`21st-*`** / video+GSAP | `plugins/frontend` · HF · **`21st`** |
| Motion | `motion.mdc` | только по chain · **gsap-*** + choreography / scrub · **`assembly-figures`** · **`design-motion-principles`** · **`motion-design`** | `plugins/motion` |
| **WebGL** | `webgl.mdc` | **`three-webgl-craft`**; фигурки без Three → **`assembly-figures`** | по chain |
| Бекендер | `backend.mdc` | `backend`, `fastapi-saas`, `safe-db-migrations`, `pydantic-v2`, `celery-highload` | `plugins/backend` |
| **Personal-Data DB** | `personal-data-db.mdc` | **`personal-data-db`**, postgres best practices | `plugins/db-admin`, `plugins/user-accounts` |
| **Payment Processor** | `payment-processor.mdc` | **`payment-processor`**, `api-commerce-stripe` (паттерны) | **`yookassa`**, **`atol-online`** MCP · `plugins/payment-processor` |
| Doc Engine | `doc-engine.mdc` | `doc-engine`, `document-docx`, `celery-highload` | `plugins/doc-engine` |
| Template Analyzer | `template-analyzer.mdc` | `template-analyzer` | |
| Excel / Google / Yandex / Aggregator | соответствующие `.mdc` | соответствующие skills | |
| Кодер | `coder.mdc` | маршрутизатор → Backend / Personal-Data / Payment / Doc / FE | |
| Тестировщик | `tester.mdc` | `tester`, `playwright-e2e` | |
| Фиксер | `fixer.mdc` | `fixer` | |
| Деплоер | `deployer.mdc` | `deployer` | |
| Asset Pipeline / a11y / forms / DevOps / Docs | свои `.mdc` | свои skills | по фазам roadmap |
| AI Bridge | `ai-bridge.mdc` | опционально HF | Hugging Face MCP |

## Второй цикл (только по спецкоманде)

Документ: [`SECOND_SECURITY_CYCLE.md`](../../SECOND_SECURITY_CYCLE.md).  
Команда: **«запускаем второй цикл безопасности»** (синонимы там же).

| Роль | Правило | Скилл | Инструменты |
|------|---------|-------|-------------|
| **Security** | `security.mdc` | `security`, **`audit`**, OWASP `api-security-review`, `code-review-security`, `sca-audit`, `secrets-scan`, `web-security-review` | `plugins/security-ops` |
| **Hacker** | `hacker.mdc` | `hacker` | ZAP, sqlmap · `plugins/hacker` · только localhost/стенд |

Chain: Архитектор (scope) → Security → Hacker → Фиксер → Тестировщик → Деплоер → Клиент.  
Обязательно проверить Personal-Data DB и Payment Processor.

**Не** включать Security/Hacker в фазы 1–5 без спецкоманды.

## Типовые chains основного цикла

**Всегда в начале волны:** **Тренер** (грейд + апгрейд skills/rules/plugins/MCP) → далее по таблице.  
**После правок пользователя:** снова **Тренер** (gap-анализ знаний) → затем инженерия.

| Фаза | Chain |
|------|--------|
| **1** Фундамент | **Тренер** → Архитектор → Backend + **Personal-Data DB** → Тестировщик → Фиксер → Деплоер → Клиент |
| **2** Doc Engine | **Тренер** → Архитектор → Doc Engine → Template Analyzer → Backend → … |
| **3** Коннекторы | **Тренер** → Архитектор → Excel/Google/Yandex → Data Aggregator → Backend → … |
| **4** Frontend | **Тренер** → Архитектор → Frontend → … → Клиент |
| **Landing** (после MVP) | **Тренер** → Архитектор → **Landing Promo** + Frontend → Motion → Asset Pipeline → … → Клиент |
| **Landing + ref URL** | **Тренер** → Архитектор → capture MCP → Landing/FE → Motion (+ **assembly-figures** / WebGL) → … → Клиент |
| **Landing client-ready** | **Тренер** → Архитектор (`landing-client-ready-gate`) → Landing Promo (**density 6–7**) → Frontend → Motion → Asset → Tester → … → Клиент (presence checklist) |
| **5** High-load + биллинг | **Тренер** → Архитектор → Backend + celery + Doc Engine + **Payment Processor** → DevOps → … → Клиент |
| **После MVP** | спецкоманда → **второй цикл Security+Hacker** |

## Скиллы с GitHub / Hugging Face (фрагмент)

| Источник | Скиллы |
|----------|--------|
| oktsec/audit | `audit` |
| OWASP/secure-agent-playbook | api/code/web security, sca, secrets |
| agents-inc/skills | `api-commerce-stripe` (паттерны оплат) |
| supabase | postgres best practices |
| huggingface | hf-cli, hf-mcp, transformers-js, … |
| vercel | react / next / web-design |
| greensock/gsap-skills | `gsap-core` … `gsap-react` |
| Costumary/gsap-choreography | product-demo film |
| anthropics/skills | `frontend-design` |
| pbakaus/impeccable | polish / animate |
| Ga14ctic/awwwards-skill | elite landing pipeline |
| hoodini/ai-agents-skills | cinematic / parallax / video→landing |
| remotion-dev/skills | Remotion video |
| pglevy/agent-skills | `vignette` |
| web-embedding + design-clone MCP | референс URL → capture/adapt |
| acentrist/web-clone-skills | `web-clone` |

Доменные: `personal-data-db`, `payment-processor`, `doc-engine`, **`landing-promo`**, **`reference-landing-adapt`**, … → `.cursor/skills/`.  
Каталог лендинг-скиллов: `.agents/skills/LANDING_SKILLS_SOURCES.md`.  
Clone MCP: `plugins/design-clone-mcp/PLUGINS.md`.

## MCP

playwright ×3, chrome-devtools ×2, image-compare, a11y, lighthouse, **huggingface-skills**, **yookassa**, **atol-online**, **design-clone**, **source-first-clone**, **`21st`** (21st.dev UI catalog — ключ `API_KEY_21ST`).  
21st setup: `plugins/twentyfirst/PLUGINS.md` + skill `.cursor/skills/twentyfirst-mcp/SKILL.md`.  
Секреты ЮKassa/АТОЛ — только в `.env` (см. `plugins/payment-processor/PLUGINS.md`).