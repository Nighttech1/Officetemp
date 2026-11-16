# 🧑‍💼 КЛИЕНТ — ПРИЁМКА (handoff to real customer)

**Где смотрел:** http://127.0.0.1:3000/  
**Инструменты:** Playwright 1440 · playwright-iphone · playwright-android  
**Скрины:** `before-hero-1440.png`, `before-pillars-1440.png`, `before-usecases-1440.png`, `before-hero-iphone.png`, `before-iphone-mid.png`, `before-hero-android.png`  
**Gate:** `landing-client-ready` density 6–7 + checklist-landing-presence  
**21st picks (для инженеров):** mesh/atmosphere **19381** (Floating Gradient) · bento **9594** · CTA shimmer **27898** · FAQ accordion **29935**

## Вердикт: НЕ ПРИНЯТО

Страницу **нельзя** отдавать реальному заказчику. Это чистый «кабинетный SaaS-каркас» с убитой display-типографикой и плоским серым hero. Presence gate провален.

### Жёсткие REJECT (доказано Playwright)

1. **Тип 18px !important** — правило в `globals.css` (`h1,h2,h3,… { font-size: 18px !important }`) давит `text-[clamp(2.4rem,…)]`. Computed h1 = **18px** при классе clamp до 5.75rem. Display hero мёртв.
2. **Пустой hero** — occupancy ~9%; flat `rgb(232,232,230)` без grain/mesh; signature ~498/1440 ≈ 34% (&lt;40%).
3. **Mobile** — после CTA большая «простыня» серого; фигуры внизу обрезаны; не immersive density 6–7.
4. **Секции black** — три подряд чёрных блока без материалов/глубины; pillars = text columns в вакууме.
5. **Бренд-тест** — убрать nav → generic B2B; «DocSaaS» только tiny eyebrow.
6. **Мелочи:** favicon 404; Next.js DevTools «N» на витрине; nav dots только у Платформа/Решения.

### Presence checklist

- [ ] Hero full-bleed / не островок — FAIL  
- [ ] Headline доминанта — FAIL (18px)  
- [ ] Signature ≥40% — FAIL (~34%)  
- [ ] Атмосфера плоскости — FAIL  
- [ ] CTA без скролла — OK  
- [ ] Client-ready без извинений — FAIL  

### Очередь тикетов

C-148…C-161 (+ уточнение C-145…C-147). Волна W-60: **C-148, C-149, C-145** (P0).
