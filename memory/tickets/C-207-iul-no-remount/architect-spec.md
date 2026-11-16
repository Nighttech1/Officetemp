# Architect spec — W-76 (волна 1: C-207, C-208, C-211)

## План волны (≤3)

| ID | Приоритет | Суть |
|----|-----------|------|
| C-207 | P0 | Нет remount/fade при смене ИУЛ в дереве |
| C-208 | P1 | Шаг подписи без внутреннего скролла |
| C-211 | P0 | Rubik clamp delta / resume |

Очередь на W-77: **C-209**, **C-210**.

## C-207

Причины мигания:
1. Внутренний `FadeIn` в `InfoSheetWizard` — при редком remount снова анимирует.
2. `DocsStepMotion` с blur/slide при смене `step` между документами.
3. `useEffect` после paint подменяет данные → возможен кадр со старыми/пустыми значениями.

Фикс:
- Загрузка doc через `useLayoutEffect` (до paint).
- При смене только `docId` — не играть step-motion (флаг `suppressStepMotion` / `stepKey` стабилен + `animate={false}` на один тик).
- Заменить внутренний `FadeIn` мастера на обычный `div` (вход страницы уже в page `FadeIn`).
- Не размонтировать wizard при смене ИУЛ (уже без `key={docId}` — сохранить).

## C-208

Убрать у `TabsContent` на шаге 3: `absolute inset-0`, `min-h-[24rem]`, `overflow-y-auto`.  
Показывать только активную роль (без forceMount absolute stack) или relative flow без скролла.

## C-211

В `RubiksAssembly` useFrame:
```
const dt = Math.min(delta, 1/30);
```
При `active` false→true: `progress=0`, не догонять пропущенное; опционально вернуться в `idle` assembled если gap > 1s.

Файлы: `RubiksCubeHero.tsx`.

## Chain

Frontend → (WebGL в том же FE-файле) → Tester → Fixer → Deployer → Client
