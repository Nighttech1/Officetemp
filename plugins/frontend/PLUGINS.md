# Плагины — frontend (luxury web)

## Реестр

| Name | Type | URL / path | When to use |
|------|------|------------|-------------|
| vercel-react-best-practices | GitHub skill | `.agents/skills/vercel-react-best-practices/` | React/Next кабинет, perf |
| web-design-guidelines | GitHub skill | `.agents/skills/web-design-guidelines/` | UI guidelines |
| next-dev-loop | Next.js skill | `.agents/skills/next-dev-loop/` | цикл next dev / агент |
| **landing-promo** | team orchestrator | `.cursor/skills/landing-promo/SKILL.md` | рекламный лендинг Doc SaaS |
| frontend-design | anthropics | `.agents/skills/frontend-design/` | анти-шаблонная композиция |
| impeccable | pbakaus | `.agents/skills/impeccable/` | polish / animate / audit |
| awwwards-landing | Ga14ctic | `.agents/skills/awwwards-landing/` | elite 9-phase (стек→GSAP) |
| cinematic-scrub-landing | hoodini | `.agents/skills/cinematic-scrub-landing/` | mouse-scrub video hero |
| parallax-landing-page | hoodini | `.agents/skills/parallax-landing-page/` | parallax landing |
| video-to-landing-page | hoodini | `.agents/skills/video-to-landing-page/` | video→landing |
| video-edit | hoodini | `.agents/skills/video-edit/` | нарезка клипов |
| remotion-best-practices | remotion-dev | `.agents/skills/remotion-best-practices/` | React→MP4 |
| vignette | pglevy | `.agents/skills/vignette/` | cinematic HTML demos |
| scroll-scrub-video | team | `.agents/skills/scroll-scrub-video/` | scroll↔video/canvas |
| gsap-* (official) | greensock | `.agents/skills/gsap-*/` | core/timeline/ScrollTrigger/react |
| gsap-choreography | Costumary | `.agents/skills/gsap-choreography/` | product film timeline |
| LANDING_SKILLS_SOURCES | catalog | `.agents/skills/LANDING_SKILLS_SOURCES.md` | реестр источников |
| **DESIGN_EXPERTS_SOURCES** | catalog | `.agents/skills/DESIGN_EXPERTS_SOURCES.md` | color/design/motion experts + 21st |
| **twentyfirst-mcp** | team | `.cursor/skills/twentyfirst-mcp/SKILL.md` | Клиент выбирает / FE тянет с 21st |
| **21st MCP** | MCP | `.cursor/mcp.json` → `21st` | search / get_component / generate |
| 21st-* skills | 21st-dev/skill | `.agents/skills/21st-*/` | explore/build/review/cli/ai |
| color-expert | meodai | `.agents/skills/color-expert/` | OKLCH / a11y color |
| design-engineering | AgentsORG | `.agents/skills/design-engineering/` | craft graph |
| design-motion-principles | kylezantos | `.agents/skills/design-motion-principles/` | Emil/Jakub/Jhey |
| motion-design | LottieFiles | `.agents/skills/motion-design/` | timing/easing |
| **reference-landing-adapt** | team | `.cursor/skills/reference-landing-adapt/SKILL.md` | URL/скрин → адаптация |
| design-clone | MCP | `.cursor/mcp.json` → `plugins/design-clone-mcp` | `clone_website_design` |
| source-first-clone | MCP | `npx web-embedding mcp` | capture / scaffold / verify |
| exact-clone-airfare | skill | `.agents/skills/exact-clone-airfare/` | workflow точного capture |
| web-clone | skill | `.agents/skills/web-clone/` | Playwright capture contracts |
| luxury-web-craft | Cursor skill | `.cursor/skills/luxury-web-craft/SKILL.md` | вёрстка дорогих сайтов |
| image-to-luxury-ui | Cursor skill | `.cursor/skills/image-to-luxury-ui/SKILL.md` | референс-картинка → premium UI |
| create-design-md | Cursor skill | `.cursor/skills/create-design-md/SKILL.md` | DESIGN.md из референса |
| web-motion-engine | Cursor skill | `.cursor/skills/web-motion-engine/SKILL.md` | GSAP / Lenis / CSS motion |
| three-webgl-craft | Cursor skill | `.cursor/skills/three-webgl-craft/SKILL.md` | 3D-герой по chain |
| web-perf-motion | Cursor skill | `.cursor/skills/web-perf-motion/SKILL.md` | джанк, LCP, CLS |
| ui-ux-pro-max | Cursor skill | `.cursor/skills/ui-ux-pro-max/SKILL.md` | направление, не токены |
| taste-skill | Cursor skill | `.cursor/skills/taste-skill/SKILL.md` | anti-slop |
| emil-animate | Cursor skill | `.cursor/skills/emil-animate/SKILL.md` | сборка анимации |
| GSAP | npm | `gsap` | сцены, ScrollTrigger |
| Lenis | npm | `lenis` | гладкий скролл |
| Three | npm | `three` / `@react-three/fiber` | WebGL |
| Lottie | npm | `lottie-web` | редко, не вместо типа |
| anti_slop_scan | CLI | `plugins/frontend/anti_slop_scan.py` | перед сдачей UI |
| Prettier | extension | `esbenp.prettier-vscode` | формат |
| ESLint | extension | `dbaeumer.vscode-eslint` | JS/TS |
| Tailwind CSS IntelliSense | extension | `bradlc.vscode-tailwindcss` | только если проект на TW |
| Playwright | extension | `ms-playwright.playwright` | e2e / скрины |

## CLI

```powershell
python plugins/frontend/anti_slop_scan.py .
```

## npm (в целевом сайте, не в этой папке)

```powershell
npm i gsap lenis
# 3D только по спеке:
npm i three
```

## Secrets

Ключи CDN/fonts не коммитить. `DESIGN.md` — канон.
