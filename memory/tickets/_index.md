# Тикеты Клиента — Doc SaaS

| ID | Суть | Приоритет | Статус | Волна |
|----|------|-----------|--------|-------|
| C-01 | FastAPI + PostgreSQL + Docker Compose фундамент | P0 | done | W-01 |
| C-02 | Схема БД + изоляция ПДн (152-ФЗ) | P0 | done | W-01 |
| C-03 | JWT/RBAC + S3-совместимое хранилище | P0 | done | W-01 |
| C-04 | Базовый рендер DOCX через docxtpl (плоские теги) | P0 | done | W-02 |
| C-05 | Динамические строки таблиц `{% tr for %}` | P0 | done | W-02 |
| C-06 | Анализатор тегов шаблона + мост DOCX→PDF | P0 | done | W-02 |
| C-07 | PDF через dxpdf (без LibreOffice / без облака) | P0 | done | W-02b |
| C-08 | Парсер Excel/CSV → JSON | P0 | done | W-03 |
| C-09 | Коннекторы Google Sheets + Яндекс Таблицы | P0 | done | W-03 |
| C-10 | Data Aggregator — единый JSON для Doc Engine | P0 | done | W-03 |
| C-11 | Авторизация и личный кабинет компании | P0 | done | W-04 |
| C-12 | Библиотека Word-шаблонов | P0 | done | W-04 |
| C-13 | Visual Mapper + дашборд генерации DOCX/PDF | P0 | done | W-04 |
| C-14 | Frontend Asset Pipeline (AVIF/WebP/blurhash) | P2 | done | W-07 |
| C-15 | Celery + Redis: фоновая пакетная генерация | P0 | done | W-05 |
| C-16 | Сборка ZIP-архива готовых документов | P0 | done | W-05 |
| C-17 | Автоочистка артефактов через 24 часа | P0 | done | W-05 |
| C-18 | Нагрузочный прогон пакетной генерации | P0 | done | W-06 |
| C-19 | Playwright E2E + заготовка CI | P0 | done | W-06 |
| C-20 | Аудит и правки доступности (a11y) | P1 | done | W-06 |
| C-21 | Тёмный премиум UI + плавный motion (21st.dev) | P0 | done | W-07 |
| C-22 | Формы + email (антиспам, безопасные вложения) | P0 | done | W-07 |
| C-23 | Asset pipeline + пакет релиза MVP (без VPS) | P0 | done | W-07 |
| C-56 | ��� 4 Failed to fetch ��� ���������� DOCX | P0 | done | W-24 |
| C-57 | ������� �������: ������� ������� �������� � �������� � ���������� | P0 | done | W-24 |
| C-58 | Same-origin proxy: Failed to fetch на generate/docx | P0 | done | W-25 |
| C-61 | Мастер ИУЛ — шаги как у gostcheck | P0 | done | W-26 |
| C-62 | Шаг 1: PDF с ЭЦП → автохэш и метаданные | P0 | done | W-26 |
| C-63 | Сформировать и скачать PDF ИУЛ | P0 | done | W-26 |
| C-64 | Автозаполнение ИУЛ из штампа PDF | P0 | done | W-27 |
| C-65 | Библиотека подписей (фамилия → картинка) | P0 | done | W-27 |
| C-66 | Автоподстановка картинки подписи в ИУЛ | P0 | done | W-27 |
| C-67 | Тумблер: подписи из библиотеки / из PDF | P0 | done | W-28 |
| C-68 | ИУЛ UX: объект=проект, библиотека в сайдбаре, Tabs/SlideTabs | P0 | open | W-29 |
| C-72 | Magic UI дерево + компактный тулбар + DnD | P0 | done | W-31 |
| C-73 | Пакетное создание ИУЛ из нескольких PDF + табы | P0 | done | W-31 |
| C-74 | SlideTabs шагов: клик через раз | P0 | done | W-31 |
| C-75 | Пакет ИУЛ → ZIP + приёмка на PDF из templates | P0 | done | W-32 |
| C-76 | Кнопка «Библиотека подписей» у заголовка | P0 | done | W-33 |
| C-77 | SlideTabs: только обводка, без заливки | P0 | done | W-33 |
| C-78 | Библиотека подписей: папки + живой поиск | P0 | open | W-34 |
| C-79 | Подпись «Добавить подпись» над формой | P1 | open | W-34 |
| C-80 | Облачный ЛК: проекты ИУЛ/накладные → Postgres + dual-write LS | P0 | in_progress | W-35 |
| C-81 | Облако: библиотека подписей + blob накладных (без PDF ИУЛ) | P0 | in_progress | W-35 |
| C-82 | 152-ФЗ: согласие; регистрация без confirm email (MVP) | P0 | in_progress | W-35 |
| C-83 | Пакет ИУЛ: мастер как у одного PDF + вертикальные вкладки + «Сформировать ИУЛы» | P0 | done | W-36 |
| C-84 | Хэш при пакетной загрузке не длиннее одиночного | P0 | done | W-36 |
| C-85 | Подписи: характер работы слева; upload в библиотеку; настройки ролей проекта | P0 | done | W-36 |
| C-86 | Пакетная загрузка ИУЛ: алгоритм хэша MD5 по умолчанию (32 символа) | P0 | done | W-37 |
| C-87 | «Настройки» рядом с PDF + мастер всегда открыт | P0 | done | W-37 |
| C-88 | Даты ИУЛ ДД-ММ-ГГГГ; версия «-» если пусто | P1 | done | W-37 |
| C-89 | ИУЛ: уникальные подписи, порядок из настроек, ГИП эксклюзивен | P0 | done | W-38 |
| C-90 | ИУЛ: обозначение с Изм., наименование документа, версия «-» не «0» | P0 | done | W-38 |
| C-91 | Нормоконтроль: любые сокращения → имя из настроек | P0 | done | W-39 |
| C-92 | Штамп КЖ6.2: полный шифр + наименование | P0 | done | W-39 |
| C-93 | Не стирать iulSignSettings при sync/обновлениях | P0 | done | W-39 |
| C-94 | Наименование документа с титульного листа (не «Общие данные») | P0 | done | W-40 |
| C-95 | Даты всех подписантов = дата изменения ИУЛ | P0 | done | W-41 |
| C-96 | Shift+диапазон выбора документов в иерархии | P0 | done | W-41 |
| C-97 | Confirm-диалоги удаления + rename двойным кликом | P0 | done | W-41 |
| C-98 | Версия ИУЛ = последний номер изменения с титула | P0 | done | W-42 |
| C-99 | PDF ИУЛ: встроить кириллический шрифт (не Helvetica) | P0 | done | W-43 |
| C-100 | PDF ИУЛ: подписи без растяжения, центр ячеек, без «Продолжение УЛ», даты дд.мм.гггг | P0 | done | W-44 |
| C-101 | ИУЛ: вёрстка PDF/превью как образец reference-iul.png | P0 | done | W-45 |
| C-102 | Наименование документа: не примечания чертежа (КЖ10.1) | P0 | done | W-45 |
| C-103 | ИУЛ: drag-drop PDF + лимит 100 МБ с окном | P0 | done | W-46 |
| C-104 | Иерархия: подсветка активной папки; новая папка под ней | P0 | done | W-46 |
| C-106 | TreeView сайдбар + multi-select + анимация | P0 | done | W-47 |
| C-107 | Поле «Дата подписания» пустое (ISO для input) | P0 | done | W-47 |
| C-108 | Имя=шифр УЛ; папки ИУЛ/Накладные; сформировать накладную | P0 | done | W-47 |
| C-121 | ��6.2: ������������ ������� � ������ (�� ������ ���� �� ����� �����) | P0 | done | W-51 |
| C-122 | ���������: ������������� DOCX� ����� � ������������� PDF� | P1 | done | W-51 |
| C-123 | ��� ������: PreferencesCard � Excel / ������ / ��� | P1 | done | W-51 |
| C-124 | ������ ���=����; ��� ������������� ����������; DOCX/PDF ��� � ��� | P0 | done | W-52 |
| C-125 | ������� ��� ������; PDF �� ��� template.docx | P0 | done | W-52 |
| C-126 | Шаг2 поля; шпаргалки; Century Gothic 10–16 | P1 | done | W-52 |
| C-127 | PDF ИУЛ: Times New Roman 10pt + bold как в Word | P0 | done | W-53 |
| C-128 | Preferences: стрелка у текста; help поверх мастера | P0 | done | W-53 |
| C-129 | UI: минимальный кегль ≥ 14px | P1 | done | W-53 |
| C-130 | Дерево: DnD перенос файлов (мультивыбор) | P0 | done | W-54 |
| C-131 | Накладная layout=ИУЛ; SlideTabs hover; подписанты без прыжка | P0 | done | W-54 |
| C-132 | Google Sheet стр.31–39 + авто №п/п + инструкция шаблона | P0 | done | W-54 |
| C-133 | Дерево: create под выделенной; DnD; папка без prompt | P0 | done | W-55 |
| C-134 | Накладная: preview DOCX, стрелки, общий ?, без nag шаблона | P0 | done | W-55 |
| C-135 | ИУЛ: hover-смена подписантов как SlideTabs | P1 | done | W-55 |
| C-136 | Накладная: блоки данных, A4-превью, колонтитулы | P0 | open | W-56 |
| C-137 | Дерево поиск/удаление папки; шрифт 14–18 | P0 | open | W-56 |
| C-138 | ИУЛ→накладная map + hashAlgo не MD5-хардкод | P0 | open | W-56 |

| C-139 | ������� � ���������� Dayos ��� Doc SaaS | P0 | done | W-57 |
| C-140 | ������������� ������������ ������� � hero | P0 | done | W-57 |
| C-141 | Motion Dayos-����� �� �������� | P1 | done | W-57 |

| C-142 | �������� 3D-����� ������������ ������� | P1 | done | W-58 |
| C-143 | Mega-menu ����� � ����� Dayos | P1 | done | W-58 |
| C-144 | ������ logo-strip + polish �������� | P2 | done | W-58 |

| C-145 | Hero presence full-bleed (client-ready) | P0 | done | W-60 |
| C-146 | Display type маркетинг (закрывается с C-148) | P0 | done | W-60 |
| C-147 | Материалы / плоскости витрины | P1 | done | W-62 |
| C-148 | Unlock display type: снять 18px !important с `/` | P0 | done | W-60 |
| C-149 | Hero atmosphere grain/mesh (21st 19381) | P0 | done | W-60 |
| C-150 | Signature scale + clay contrast | P1 | done | W-62 |
| C-151 | Pillars bento 21st 9594 | P1 | done | W-61 |
| C-152 | Brand-first hero signal | P1 | done | W-60 |
| C-153 | Nav dots inconsistency | P2 | done | W-62 |
| C-154 | Mobile hero density | P1 | done | W-61 |
| C-155 | Favicon 404 | P2 | done | W-62 |
| C-156 | Hide Next DevTools on marketing | P2 | done | W-62 |
| C-157 | FAQ handoff accordion 21st 29935 | P1 | done | W-61 |
| C-158 | Use-cases bento polish | P2 | done | W-62 |
| C-159 | CTA shimmer 21st 27898 | P2 | done | W-62 |
| C-160 | Marquee editorial polish | P3 | done | W-62 |
| C-161 | Section plane rhythm (no 3× black) | P1 | done | W-62 |
| C-162 | Ярко-зелёный бренд #22C55E | P0 | done | W-62 |
| C-163 | Nav bg = hero grey, без линии | P1 | done | W-63 |
| C-164 | MegaNav как LoginPopover | P1 | done | W-63 |
| C-165 | Login: только логин/пароль | P1 | done | W-63 |
| C-166 | CTA green + Intro stats ×3 | P1 | done | W-63 |
| C-167 | UseCases drag-carousel без стрелок | P1 | done | W-63 |
| C-168 | Capabilities BWG + vertical switch | P1 | done | W-63 |
| C-169 | FAQ smooth + shimmer | P1 | done | W-63 |
| C-170 | SaaS footer 21st-class | P1 | done | W-63 |
| C-171 | CTA shimmer ×2 slower (5.6s) | P2 | done | W-64 |
| C-172 | UseCases image marquee без стрелок | P1 | done | W-64 |
| C-173 | ProductTrio без больших пробелов | P2 | done | W-64 |
| C-174 | Capabilities hover + стабильная высота | P1 | done | W-64 |
| C-175 | FAQ плавное выпадение 550ms | P2 | done | W-64 |
| C-176 | Услуги: H-scroll lock + smooth + even gaps | P1 | done | W-65 |
| C-177 | FAQ только hover open/close | P1 | done | W-65 |
| C-178 | Login labels жирный чёрный | P2 | done | W-65 |
| C-179 | Единый контур лендинг↔ИУЛ↔накладные | P0 | done | W-66 |
| C-180 | Docs chrome contour-bar + motion | P1 | done | W-66 |
| C-181 | Wizard fade-slide + glass hover | P1 | done | W-66 |
| C-182 | Nav О сервисе / Hero / ProductTrio×2 | P0 | done | W-67 |
| C-183 | Contact redesign + contrast + footer | P0 | done | W-67 |
| C-184 | Marquee seam + Services Slideshow | P1 | done | W-67 |
| C-185 | Услуги: картинка у списка | P1 | done | W-68 |
| C-186 | Marquee gap×2 + hover bold | P1 | done | W-68 |
| C-187 | Footer underline + nav без Кабинет | P2 | done | W-68 |
| C-190 | RubiksCubeHero WebGL 3×3×3 + цикл | P0 | done | W-70 |
| C-191 | Demo Hero: кубик + заголовок + CTA | P0 | done | W-70 |
| C-192 | Rubiks reduced-motion + pause offscreen | P1 | done | W-70 |
| C-193 | Rubiks белый пластик + 1 зелёная грань | P0 | done | W-71 |
| C-194 | Rubiks 10 поворотов граней + reverse | P0 | done | W-71 |
| C-195 | Rubiks стартовая: зелёный верх | P0 | done | W-72 |
| C-196 | Rubiks наклейки: цвет не меняется | P0 | done | W-72 |
| C-197 | Rubiks random 10 scramble → reverse | P0 | done | W-72 |
| C-198 | Rubiks наклейки явно белые | P0 | done | W-73 |
| C-199 | Rubiks фон = цвет хедера | P0 | done | W-73 |
| C-200 | Rubiks в Hero лендинга + подпись | P0 | done | W-73 |
| C-201 | Rubiks естественный белый + тёмные швы | P0 | done | W-74 |
| C-202 | Rubiks сильнее parallax от курсора | P0 | done | W-74 |
| C-203 | Hero: убрать подпись и рамку куба | P0 | done | W-74 |
| C-188 | Услуги: текст ×3, картинка справа ×2 | P1 | done | W-69 |
| C-189 | Marquee без границы, cream отступ | P1 | done | W-69 |
| C-204 | ИУЛ SlideTabs: flush + возврат в horizontal | P0 | done | W-75 |
| C-205 | ИУЛ превью/PDF колонки по новому шаблону | P0 | done | W-75 |
| C-206 | Белый текст: Библиотека / Настройки / Накладные | P1 | done | W-75 |
| C-207 | ИУЛ: смена документа без remount мастера | P0 | done | W-76 |
| C-208 | ИУЛ подписи: без внутреннего вертикального скролла | P1 | done | W-76 |
| C-209 | ИУЛ: низ шагов + кастомный скролл дерева | P1 | done | W-77 |
| C-210 | Дерево: мгновенное раскрытие папок | P1 | done | W-77 |
| C-211 | Rubik: clamp delta после долгого ухода | P0 | done | W-76 |
| C-212 | Накладные: паритет shell UX с ИУЛ | P0 | done | W-77 |
