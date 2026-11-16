# Плагины — Hugging Face (Hub / MCP)

| Name | Type | Where | When |
|------|------|-------|------|
| hf-cli | skill | `.agents/skills/hf-cli/` | download/upload моделей и датасетов |
| hf-mcp | skill | `.agents/skills/hf-mcp/` | как вызывать HF MCP tools |
| transformers-js | skill | `.agents/skills/transformers-js/` | ML в браузере/Node при нужде |
| train-sentence-transformers | skill | `.agents/skills/train-sentence-transformers/` | эмбеддинги / rerankers |
| Hugging Face MCP | MCP (Cursor plugin) | `plugin-huggingface-skills` / URL `https://huggingface.co/mcp` | поиск моделей, docs, Spaces |

Для Doc SaaS HF не обязателен на MVP; подключать при умном маппинге колонок, OCR или semantic search по шаблонам.

## Лендинг / визуалы

| Tool | When |
|------|------|
| MCP `gr1_z_image_turbo_generate` | черновики кадров/постера для hero |
| MCP `dynamic_space` | Spaces: image edit, background remove и т.п. |
| `.cursor/skills/asset-pipeline` | обязательно после генерации: poster, AVIF/WebP, blurhash |

Полный каталог лендинг-скиллов (GitHub): `.agents/skills/LANDING_SKILLS_SOURCES.md`.

