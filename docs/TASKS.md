# Task Tracker — new-theme WordPress Migration

> Источник: `C:\WorkProjects\portugal-casino-theme` (статический сайт)
> Цель: `C:\WorkProjects\wordpress\themes\new-theme` (WordPress Block Theme)

---

## Этап 1 — Конвертация source-section → реальные блоки ✅

| # | Задача | Статус | Дата |
|---|--------|--------|------|
| 1.1 | Footer: заменить source-section на `new-theme/site-footer` с редактируемыми полями | ✅ Готово | 2026-05-29 |
| 1.2 | Header: заменить source-section на `age-disclaimer` + `new-theme/site-header` | ✅ Готово | 2026-05-29 |
| 1.3 | Live Odds: создать `new-theme/live-odds` блок, убрать source-section | ✅ Готово | 2026-05-29 |
| +  | Фикс стилей в редакторе: добавить `styles.css` в `add_editor_style()` | ✅ Готово | 2026-05-29 |

### Итог Этапа 1
- `source-section` блоков на фронтенде: **0** (было 3)
- `nt-header` / `nt-footer` классов: **0** (убраны)
- `localhost.com` утечек: **0**
- Размер фронтенда: ~567KB

---

## Этап 2 — Шаблоны внутренних страниц ✅

| # | Задача | Статус | Дата |
|---|--------|--------|------|
| 2.1 | Обновить `parts/header.html` на новую схему атрибутов | ✅ Готово | 2026-05-29 |
| 2.2 | Обновить `parts/footer.html` на новую схему атрибутов | ✅ Готово | 2026-05-29 |
| 2.3 | Создать `templates/single.html` (статья) | ✅ Готово | 2026-05-29 |
| 2.4 | Создать `templates/page.html` (статическая страница) | ✅ Готово | 2026-05-29 |
| 2.5 | Создать `templates/archive.html` (архив/категория) | ✅ Готово | 2026-05-29 |
| 2.6 | Создать `templates/index.html` (fallback) | ✅ Готово | 2026-05-29 |

### Итог Этапа 2
- Все внутренние страницы рендерятся с оригинальной шапкой и подвалом
- Контент оборачивается в `page__content → page__content-area → page__main`
- Статья (single): featured image + H1 + дата + категории + контент
- Архив: заголовок + сетка 3 колонки + пагинация

---

## Этап 3 — Доработка и проверка блоков ✅

| # | Задача | Статус | Дата |
|---|--------|--------|------|
| 3.1 | `card-grid` + `link-card` — проверить регистрацию, CSS, JS | ✅ Готово | 2026-05-30 |
| 3.2 | `faq` + `faq-item` — проверить регистрацию, CSS, JS | ✅ Готово | 2026-05-30 |
| 3.3 | Все 17 блоков — REST API 200, render functions, атрибуты PHP=JS | ✅ Готово | 2026-05-30 |
| 3.4 | Дизайн inner-page — структурная проверка шаблонов | ✅ Готово | 2026-05-30 |

### Итог Этапа 3
- 17 блоков зарегистрированы в JS и PHP ✅
- 17 PHP render functions присутствуют ✅
- 12 SSR блоков: REST API 200 ✅
- Нет конфликтов SSR/InnerBlocks ✅
- Все шаблоны структурно корректны ✅
- CSS для nt-* блоков загружается в редакторе через block-theme.css ✅
- ⚠️ Визуальная проверка в браузере/редакторе — выполнить вручную после запуска Docker

---

## Этап 4 — Финальная верификация 🔲

| # | Задача | Статус |
|---|--------|--------|
| 4.1 | Smoke test: размер, ключевые классы, отсутствие `localhost.com` | ✅ Готово |
| 4.2 | Редактор: все блоки открываются, сохраняются, показывают preview | 🔲 Ожидает |
| 4.3 | Мобильный вид: шапка, подвал, статья | 🔲 Ожидает |

---

## Этап 5 — Production-архитектура по новому ТЗ 🟡

| # | Задача | Статус | Дата |
|---|--------|--------|------|
| 5.1 | Добавить `blocks/*/block.json` для всех существующих кастомных блоков | ✅ Готово | 2026-06-02 |
| 5.2 | Перевести PHP-регистрацию блоков на metadata path + сохранить render callbacks | ✅ Готово | 2026-06-02 |
| 5.3 | Расширить `theme.json`: цвета, font sizes, spacing scale, core block styles, shadow/border tokens | ✅ Готово | 2026-06-02 |
| 5.4 | Добавить production theme supports: responsive embeds, thumbnails, html5 | ✅ Готово | 2026-06-02 |
| 5.5 | Начать условное подключение JS по блокам (`offer-list`, `related-links`, `news-slider`, `live-odds`) | ✅ Готово | 2026-06-02 |
| 5.6 | Добавить первый block pattern `new-theme/page-casino-legal` | ✅ Готово | 2026-06-02 |
| 5.6a | Добавить компактный handoff для продолжения в новом чате | ✅ Готово | 2026-06-02 |
| 5.7 | Перенести editor/frontend JS из одного `assets/js/blocks.js` в per-block `index.js` bundles | 🔲 Ожидает |  |
| 5.8 | Разделить legacy CSS на `global.css`, `legacy-reference.css`, editor-only и block-local CSS | 🔲 Ожидает |  |
| 5.9 | Перевести `offer-list` с page attributes на CPT/query модель | ✅ Готово | 2026-06-02 |
| 5.10 | Сделать mega menu редактируемым через block attributes / Navigation data model | 🔲 Ожидает |  |
| 5.11 | Сделать live odds dynamic/API block с editor fallback и frontend-only initialization | 🔲 Ожидает |  |
| 5.12 | Полностью убрать legacy `source-section` после проверки отсутствия старого сохранённого контента | 🔲 Ожидает |  |
| 5.13 | Улучшить `new-theme/hero`: Media Library background, overlay, top spacer, dark/light variant с fallback на legacy path | ✅ Готово | 2026-06-03 |
| 5.14 | Перевести image/logo/payment controls в блоках и `casino_offer` meta box на Media Library вместо ручных path-полей | ✅ Готово | 2026-06-03 |

### Итог текущего production-прохода
- Блоки получили `block.json`, но визуальный HTML-рендер остался прежним.
- Глобальное подключение JS сокращено там, где это безопасно без переписывания legacy frontend.
- `offer-list` получил CPT `casino_offer`, REST/admin meta поля и опциональный `source=query` без удаления старого `cards` режима.
- `hero` теперь позволяет выбирать background image через Media Library, настраивать overlay, top spacer и dark/light variant, сохраняя совместимость со старыми theme-relative путями.
- Новые изображения в editor UI выбираются через Media Library: header/footer logos, hero, offer logos, payment icons, content-section images, related/news/link-card images и CPT `casino_offer` logo/payments. Старые path-значения остаются только для обратной совместимости.
- Новый spec теперь отражён как отдельный roadmap, а не смешан с уже завершённой визуальной миграцией.

---

## Будущие этапы (низкий приоритет)

- **Шаблон 404** (`templates/404.html`)
- **Шаблон поиска** (`templates/search.html`)
- **Конвертация мега-меню**: сделать `sidebar-nav` редактируемым через блок-атрибуты (сейчас хранится в `parts/header-sidebar-nav.html`)
- **Динамические live odds**: подключить реальный API вместо статического HTML из файла
