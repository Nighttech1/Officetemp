# Landing / motion skills — источники

Установлено в `.agents/skills/` для волны рекламного лендинга Doc SaaS.

| Папка | Репозиторий | Назначение |
|-------|-------------|------------|
| `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-react`, `gsap-performance`, `gsap-frameworks` | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | Официальный GSAP для агентов |
| `gsap-choreography` | [Costumary/gsap-choreography](https://github.com/Costumary/gsap-choreography) | Скриптовый product demo (курсор/сцены) |
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) | Анти-шаблонная композиция |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Polish / animate / audit craft |
| `awwwards-landing` | [Ga14ctic/awwwards-skill](https://github.com/Ga14ctic/awwwards-skill) | 9-фазный elite pipeline (адаптировать стек) |
| `cinematic-scrub-landing` | [hoodini/ai-agents-skills](https://github.com/hoodini/ai-agents-skills) | Mouse-scrub video hero + narrative |
| `parallax-landing-page` | hoodini/ai-agents-skills | Parallax landing |
| `video-to-landing-page` | hoodini/ai-agents-skills | Video → landing scaffold |
| `video-edit` | hoodini/ai-agents-skills | Нарезка/подготовка клипов |
| `remotion-best-practices` | [remotion-dev/skills](https://github.com/remotion-dev/skills) | Программное видео в React |
| `vignette` | [pglevy/agent-skills](https://github.com/pglevy/agent-skills) | Кинематографичные HTML vignettes |
| `scroll-scrub-video` | team (OfficeTemp) | Scroll ↔ video/canvas + ffmpeg |
| `web-clone` | [acentrist/web-clone-skills](https://github.com/acentrist/web-clone-skills) | Playwright capture + contracts |
| `exact-clone-airfare` | [jongko54/webEmbedding](https://github.com/jongko54/webEmbedding) / npm `web-embedding` | Source-first clone workflow |

Оркестратор команды: `.cursor/skills/landing-promo/SKILL.md`  
Референс URL/скрин: `.cursor/skills/reference-landing-adapt/SKILL.md`  
Правило роли: `.cursor/rules/landing.mdc`  
Cursor rule GSAP film: `.cursor/rules/gsap-choreography.mdc`

## MCP clone

| MCP | Config |
|-----|--------|
| `design-clone` | `plugins/design-clone-mcp` → tool `clone_website_design` |
| `source-first-clone` | `npx -y web-embedding@latest mcp` |

См. `plugins/design-clone-mcp/PLUGINS.md`. После правки `.cursor/mcp.json` — Reload MCP в Cursor.

## Hugging Face

Отдельных «landing skills» на Hub нет (HF skills = ML). Для визуалов лендинга:

- MCP `gr1_z_image_turbo_generate` / `dynamic_space` — черновики кадров
- `.agents/skills/transformers-js` — только если нужен ML в браузере
- Финальные ассеты всегда через `.cursor/skills/asset-pipeline`

| `assembly-figures` | team (OfficeTemp) | Editable assembling hero figures (Dayos-style, JSON) |


| `landing-client-ready` | team (OfficeTemp) | Presence gate density 6-7 / client-sendable |


## Design experts + 21st (2026-09-29)

��. ������ �������: `DESIGN_EXPERTS_SOURCES.md`.
- `color-expert`, `design-engineering`, `design-motion-principles`, `motion-design`
- `21st-*` skills + MCP `21st` + `.cursor/skills/twentyfirst-mcp`
