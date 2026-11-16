# Плагины — Design Clone / Reference Landing

Сценарий: пользователь кидает **URL** или **скрин** понравившегося лендинга → команда снимает дизайн и адаптирует под Doc SaaS.

## MCP (в `.cursor/mcp.json`)

| Name | How | Tools |
|------|-----|--------|
| **design-clone** | local `plugins/design-clone-mcp` ([wplaunchify/design-clone-mcp](https://github.com/wplaunchify/design-clone-mcp)) | `clone_website_design` |
| **source-first-clone** | `npx -y web-embedding@latest mcp` ([web-embedding](https://www.npmjs.com/package/web-embedding)) | inspect / capture / clone / verify |
| playwright ×3 | уже есть | скрины референса и нашего `/` |
| image-compare | уже есть | сверка композиции |
| chrome-devtools | уже есть | точечный DOM/CSS |

После правки `mcp.json` — **перезапустить Cursor MCP** (Settings → MCP → refresh / reload window), иначе новые серверы не появятся.

## Skills

| Skill | Path |
|-------|------|
| **reference-landing-adapt** | `.cursor/skills/reference-landing-adapt/SKILL.md` — оркестратор «кидаю референс» |
| exact-clone-airfare | `.agents/skills/exact-clone-airfare/` |
| web-clone | `.agents/skills/web-clone/` |
| landing-promo | `.cursor/skills/landing-promo/SKILL.md` |
| image-to-luxury-ui | `.cursor/skills/image-to-luxury-ui/SKILL.md` |

## Как пользоваться (для человека)

1. Откройте чат и напишите, например:  
   `Вот референс: https://example.com — сделай наш лендинг в этом духе`  
   или прикрепите скриншоты.
2. Команда сама вызовет MCP clone + Playwright и пересоберёт страницу под наш продукт.
3. Не ждите 1:1 копии чужого бренда — это **адаптация** (закон + наш смысл).

## Local design-clone rebuild

```powershell
$env:PATH = "E:\Applications\Tools\node;" + $env:PATH
cd E:\Applications\OfficeTemp\plugins\design-clone-mcp
npm install
npm run build
```

Chromium для Puppeteer кладётся в кэш пользователя (`~/.cache/puppeteer`).
