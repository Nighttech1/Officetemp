# W-70 Architect Spec — RubiksCubeHero

## Цель
Изолированный клиентский React Three Fiber компонент кубика Рубика с циклической разборкой/сборкой + демо-Hero на `/demo/rubiks-cube`. Основной лендинг `/` не ломаем (AssemblyScene остаётся).

## Стек
- Next.js 15 App Router → `'use client'`
- `three` + `@react-three/fiber` + `@react-three/drei`
- Анимация: `useFrame` + `THREE.MathUtils.lerp` (gsap уже в проекте, но для кублитов достаточно lerp)
- Стили: Tailwind + локальный `cn` (`frontend/lib/utils.ts`); clsx уже локальный — отдельные npm clsx/tailwind-merge не обязательны
- Portable Node: `E:\Applications\Tools\node`; npm cache → `E:\Applications\Tools\downloads\npm-cache`

## Геометрия
- Решётка `x,y,z ∈ {-1,0,1}`, пропуск `(0,0,0)` → 26 кублитов
- `RoundedBox` (drei) size ~0.88, radius ~0.08
- Цвета: props `colors` / константа `DEFAULT_RUBIKS_COLORS` (plastic + 6 faces SaaS)

## Кинематика (цикл ~12–16s)
1. Assembled: Float + медленный yaw
2. Explode: offset по нормали `(x,y,z)` × factor, random euler
3. Hang: короткая пауза
4. Reassemble: lerp обратно в home

## Интерактив
- Mouse parallax на группу сцены (не на window scroll)
- Lights: ambient + 2 directional + accent pointLight

## Perf / a11y
- Canvas `dpr={[1, 2]}`
- Shared materials / memo cubies
- Pause when `!inView`
- `prefers-reduced-motion` → без explode, статичный Float или постер

## Paths
- `frontend/components/webgl/RubiksCubeHero.tsx`
- `frontend/app/demo/rubiks-cube/page.tsx`
- `frontend/package.json` (deps)

## Out of scope
- Backend, Payment, замена AssemblyScene на `/`
