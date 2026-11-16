### [C-149] Hero: атмосфера плоскости (не голый #e8e8e6)

- **Зона / Экран:** `/` Hero
- **Факт:** фон flat grey; нет grain/radial/mesh; мёртвый фон ≫30% viewport; REJECT client-ready.
- **Ожидание по DESIGN.md:** «мягкий radial/grain поверх grey/cream — не голый flat fill».
- **21st.dev:** Floating Gradient **id 19381** (адаптировать под cream/grey/teal, не фиолетовый slop) ИЛИ Grain Gradient Hero **5686** как референс атмосферы.
- **Приоритет:** P0
- **Скрин-улика:** `before-hero-1440.png`, `before-hero-iphone.png`
- **Зона:** Landing Promo + Frontend (+ Motion soft drift)
- **Acceptance:** на after-скрине видна глубина (grain и/или soft blobs); не однотонный прямоугольник.
