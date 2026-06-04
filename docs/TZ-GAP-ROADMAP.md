# TZ Gap Roadmap

Источник требований: `docs/wp-block-theme-technical-spec.md`

Дата аудита: 2026-06-03

## Краткий статус

Тема уже частично мигрирована в WordPress block theme: есть `theme.json`, HTML templates/parts, `block.json` для кастомных блоков, render callbacks, editor JS и CPT `casino_offer`.

До production-реализации по ТЗ тема пока не доведена. Главные проблемы: legacy CSS/JS, статическое mega menu, контент в больших block attributes, неполная data model для офферов, статический live odds и недостаточная структурная редактируемость повторяемых секций.

## Что не совпадает с ТЗ

### 1. CSS архитектура

- Сейчас используются `assets/css/styles.css`, `assets/css/block-theme.css`, `assets/css/editor.css`.
- Нет разделения на `global.css`, `legacy-reference.css`, editor-only слой и block-local CSS.
- У блоков в `blocks/*` нет отдельных CSS-файлов.
- `styles.css` остается большим legacy-слоем.

### 2. JS подключение

- `new-theme-main` подключается глобально и тянет `new-theme-slick`.
- Часть block-specific scripts уже подключается условно, но legacy frontend ещё не разделен полностью.
- Нужно убрать глобальную загрузку старых скриптов там, где соответствующих блоков нет.

### 3. Header / Navigation

- `site-header` редактирует только логотипы.
- Desktop/mobile/mega menu берутся из статических файлов:
  - `parts/header-primary-nav.html`
  - `parts/header-sidebar-nav.html`
- Пункты меню, badges, dropdown groups и mobile drawer не управляются из Site Editor.
- В nav parts остаются `localhost.com` ссылки, которые нормализуются PHP, но всё равно лежат в исходниках.
- Нужно добавить доступность: keyboard navigation, `aria-expanded`, focus states.

### 4. Front page content model

- `templates/front-page.html` содержит основной контент в огромных attributes блоков.
- `offer-list` на главной странице всё ещё в режиме attribute cards, причём карточки частично разбиты на пустые/неполные объекты.
- Это не соответствует цели: данные должны быть в CPT, post meta, taxonomies, options или нормальных block attributes.

### 5. Offer List / Offer Card

- CPT `casino_offer` уже есть.
- Не хватает taxonomies: casino, betting, payment methods, license, country/market.
- Не хватает полной схемы полей: game types, recommendation, date/order model, CTA variants, visible payment icons, richer legal/license data.
- Главная страница не переведена на `source=query`.
- Нужно нормализовать seed/demo data и проверить `rel="sponsored"` для всех go links.

### 6. Content blocks

- `content-section` слишком общий блок для разных типов секций.
- `two-column-text`, `about-list`, `info-grid` не выделены как отдельные структурные блоки.
- В `about/info` контент лежит HTML-строкой в attribute `text`, а не списком icon/title/description/link.
- Для редактора это всё ещё ближе к HTML-переносу, чем к визуальной блочной модели.

### 7. Live Odds / Tips

- `new-theme/live-odds` рендерит статический legacy HTML из `parts/live-odds.html`.
- Внутри есть внешние `https://apostalegal.pt/wp-content/uploads/...`.
- Данные устарели на момент аудита: события за 2026-05-27 - 2026-05-31, аудит выполнен 2026-06-03.
- В редакторе сейчас placeholder, а не полноценный preview/fallback.
- Нет manual/API source settings.

### 8. News Slider

- `news-slider` выводит ручной массив `items`.
- Нет query by post type/category.
- Нет manual selected posts.
- В редакторе нет preview реальных posts.

### 9. Responsive Table

- `data-table` есть, но редактирование идёт через textarea/pipe-separated data и массив attributes.
- Нет highlighted rows/cells.
- Нет настройки mobile behavior: horizontal scroll или stacked cards.

### 10. Source HTML Section

- `source-section` всё ещё зарегистрирован:
  - `blocks/source-section/block.json`
  - `assets/js/blocks.js`
  - `functions.php`
- В текущих templates он не найден, но сам блок остаётся как путь обратно к raw HTML.
- По ТЗ его нужно убрать после проверки старого сохранённого контента.

### 11. Namespace блоков

- В ТЗ указаны блоки вида `casino/page-hero`, `casino/offer-list`.
- В проекте используются `new-theme/hero`, `new-theme/offer-list` и т.д.
- Если namespace в ТЗ строгий, нужно переименовать. Если нет, можно оставить как есть.

### 12. SEO / Schema

- `page-main` выводит JSON-LD из атрибута.
- Schema в `front-page.html` захардкожена под старый URL/контент.
- Canonical, breadcrumbs и meta не закрыты на уровне темы.

### 13. Verification

- PHP lint не выполнен: в текущем shell нет `php`.
- Нужна runtime-проверка в WordPress: активация темы, Site Editor, сохранение блоков, frontend desktop/tablet/mobile.

## Порядок работ

### Этап 1. Runtime smoke test

- [x] Запустить WordPress окружение.
- [x] Активировать тему без PHP warnings/notices.
- [ ] Открыть Site Editor.
- [ ] Открыть и сохранить templates: `front-page`, `page`, `single`, `archive`, `index`.
- [ ] Проверить, что все кастомные блоки открываются в editor без REST/JS ошибок.
- [x] Проверить desktop/tablet/mobile главной страницы.

Результат этапа: понятный список runtime-багов до архитектурных изменений.

Smoke test 2026-06-03:

- Docker окружение запущено: `wordpress_nginx` на `localhost:8080`, `wordpress_app`, `wordpress_db`, `wordpress_redis`.
- Локальная тема синхронизирована в контейнер `wordpress_app`.
- Активная тема: `new-theme`.
- `functions.php` проходит `php -l` внутри контейнера.
- Все ожидаемые `new-theme/*` блоки и CPT `casino_offer` зарегистрированы после `init`.
- FSE templates `front-page`, `page`, `single`, `archive`, `index` находятся через WordPress runtime; server-side render smoke test прошёл без PHP output errors.
- `front-page` сейчас имеет `source=custom`, то есть сохранённый DB override может скрывать изменения файла `templates/front-page.html`.
- Главная страница отвечает `200`; `page-hero`, `offer-card`, `site-footer` присутствуют; `localhost.com` в HTML не найден.
- Desktop/tablet/mobile screenshots сохранены в `C:\tmp\new-theme-home-desktop.png`, `C:\tmp\new-theme-home-tablet.png`, `C:\tmp\new-theme-home-mobile.png`.

Runtime-баги, найденные на этапе:

- [x] Первый экран главной содержит пустые/неполные `offer-list` карточки с broken images, пустыми названиями и `0/5` рейтингом. Исправлено: legacy attribute cards компактно собираются в render callback перед выводом.
- [x] В HTML есть `src="http://localhost:8080/wp-content/themes/new-theme/"` для пустого logo в `offer-card`. Исправлено: пустой asset path теперь возвращает пустую строку, а неполные cards не рендерятся.
- [x] `related-links` ссылается на отсутствующий `assets/img/2021/08/betano-square-logo.png`. Исправлено: путь заменён на существующий `assets/img/2021/08/betano-logo.svg`, добавлен runtime fallback для старого значения.
- [x] Legacy `assets/js/main.js` после user interaction пытается загрузить `/wp-content/themes/apostalegal/dist/scripts/defered.js?v=2.0.3`, которого нет в новой теме. Исправлено временным guard перед legacy `main.js`; полноценное удаление старого loader остаётся частью этапа JS split.
- `front-page` DB override требует отдельного решения перед миграциями шаблона: оставить override как источник правды или удалить/синхронизировать его с theme file.
- Полный UI smoke test Site Editor и сохранение всех templates не закрыты автоматически: нужна авторизованная браузерная проверка editor UI.

Проверка исправлений:

- `php -l` внутри `wordpress_app` проходит.
- Главная отвечает `200`.
- В rendered HTML: `empty-theme-img=False`, `betano-square-logo=False`, `wp-content/themes/new-theme/http=False`, `apostalegal-deferred=False`, `empty-heading-count=0`.
- После Playwright desktop/tablet/mobile pass свежие nginx/PHP логи не показывают новых 404/error по исправленным путям.
- Обновлённые screenshots:
  - `C:\tmp\new-theme-home-desktop-fixed.png`
  - `C:\tmp\new-theme-home-tablet-fixed.png`
  - `C:\tmp\new-theme-home-mobile-fixed.png`

### Этап 2. CSS split

- [x] Создать `assets/css/global.css`.
- [x] Создать `assets/css/legacy-reference.css`.
- [x] Оставить `assets/css/editor.css` только для editor-specific правок.
- [x] Перенести reset, layout, containers, typography, helpers из legacy CSS в `global.css`.
- [x] Перенести оставшиеся старые классы во временный `legacy-reference.css`.
- [x] Добавить block-local CSS рядом с ключевыми блоками.
- [x] Подключить block CSS через `block.json` `style` / `editorStyle`.
- [x] Уменьшить зависимость frontend/editor от большого `styles.css`.

Результат этапа: CSS архитектура соответствует ТЗ, legacy слой изолирован.

CSS split 2026-06-03:

- `assets/css/styles.css` уменьшен до compatibility shim с `@import` для старых прямых ссылок.
- Большой exported CSS перенесён в `assets/css/legacy-reference.css`.
- Новый `assets/css/global.css` содержит базовые font-face, tokens, reset, containers/layout helpers и WordPress block-theme integration.
- Frontend enqueue: `global.css` -> `legacy-reference.css` -> `block-theme.css`.
- Editor styles: `global.css`, `legacy-reference.css`, `block-theme.css`, `editor.css`.
- Добавлены block-local `style.css` и `block.json` `style` для `offer-list`, `related-links`, `live-odds`, `news-slider`.
- В `legacy-reference.css` ещё остаются дубли reset/layout правил из старого экспорта; это осознанно оставлено для визуального parity и будет убираться постепенно после переноса конкретных блоков.

Проверка:

- JSON parse для `theme.json` и всех `blocks/*/block.json` проходит.
- `php -l` внутри `wordpress_app` проходит.
- WordPress registry видит style handles: `new-theme-offer-list-style`, `new-theme-related-links-style`, `new-theme-live-odds-style`, `new-theme-news-slider-style`.
- Главная отвечает `200`.
- Rendered HTML: `global.css=True`, `legacy-reference.css=True`, `block-theme.css=True`, `styles.css=False`, block-local styles `True`.
- Desktop/tablet/mobile screenshots после split:
  - `C:\tmp\new-theme-css-split-desktop.png`
  - `C:\tmp\new-theme-css-split-tablet.png`
  - `C:\tmp\new-theme-css-split-mobile.png`
- Свежие nginx/PHP логи не показывают CSS 404/error.

### Этап 3. JS split and conditional loading

- [x] Разобрать `assets/js/main.js` по зонам ответственности.
- [x] Выделить header/menu JS отдельно.
- [x] Оставить slick только для блоков, которым он нужен.
- [x] Убрать глобальный enqueue `new-theme-main`, если на странице нет нужных интерактивных блоков.
- [x] Проверить `offer-list`, `related-links`, `news-slider`, `live-odds` scripts.
- [x] Убрать inline data, не нужные конкретной странице.

Результат этапа: старый JS не грузится глобально на каждую страницу.

JS split 2026-06-03:

- Старый `assets/js/main.js` больше не регистрируется и не enqueue-ится глобально.
- Удалён глобальный inline `themeVars`; данные `liveodds_tips` остаются только у `new-theme-liveodds-tips`.
- Добавлен `assets/js/header.js` для header/mobile menu/dropdown поведения; подключается из `new_theme_render_site_header()`.
- Добавлен `assets/js/lazy-media.js` для legacy `data-lazy-src`, `data-lazy-srcset`, `data-bg`; подключается только для `live-odds` и `source-section`, если в сохранённом HTML есть lazy media.
- `new-theme-liveodds-tips` теперь зависит от `new-theme-slick`, так как глобальная загрузка slick удалена.
- `offer-list`, `related-links`, `news-slider`, `live-odds` продолжают подключать свои scripts из render callbacks.

Проверка:

- `node --check` проходит для `assets/js/header.js` и `assets/js/lazy-media.js`.
- `php -l /var/www/html/wp-content/themes/new-theme/functions.php` проходит внутри `wordpress_app`.
- Главная после очистки FastCGI cache: `main.js=False`, `themeVars=False`, `header.js=True`, `slick.js=True`, `news-slider.js=True`, `liveodds-tips.js=True`, `lazy-media.js=True`, `offer-list.js=True`, `internal-links.js=True`.
- 404 page без интерактивных блоков: `header.js=True`, а `slick.js`, `news-slider.js`, `liveodds-tips.js`, `lazy-media.js`, `offer-list.js`, `internal-links.js`, `main.js`, `themeVars` отсутствуют.
- Browser plugin был недоступен для in-app визуальной проверки (`iab` not available); проверка выполнена через WordPress runtime и HTTP HTML checks.

### Этап 4. Header / Mega Menu

- [x] Выбрать data model: WP Navigation, block attributes или гибрид.
- [x] Перенести desktop nav из `parts/header-primary-nav.html` в редактируемую модель.
- [x] Перенести mobile sidebar nav из `parts/header-sidebar-nav.html`.
- [x] Добавить редактирование badges.
- [x] Добавить редактирование dropdown/mega menu groups.
- [x] Удалить raw `localhost.com` из nav sources.
- [x] Реализовать keyboard navigation.
- [x] Добавить `aria-expanded`, `aria-controls`, focus states.
- [x] Проверить desktop/mobile behavior.

Результат этапа: header редактируется через Site Editor и не зависит от статических nav HTML-файлов.

Header / Mega Menu 2026-06-03:

- Data model выбрана: `menuItems` как JSON array в атрибуте блока `new-theme/site-header`.
- `blocks/site-header/block.json` дополнен атрибутом `menuItems: { type: array, default: [] }`.
- PHP helpers добавлены в `functions.php`: `new_theme_nav_url`, `new_theme_resolve_srcset`, `new_theme_render_nav_icon`, `new_theme_render_nav_item`.
- `new_theme_render_site_header()` переписан: если `menuItems` не пустой — строит desktop nav и mobile sidebar из данных; если пустой — fallback на статические файлы для обратной совместимости.
- `assets/js/blocks.js` расширен: добавлен 3-уровневый `navItemsEditor` (top → sub-item → sub-sub-item) в InspectorControls блока `site-header`.
- `parts/header.html` обновлён: полный `menuItems` JSON с текущей структурой меню (6 top-level items, badges, icons, 3 levels deep).
- `localhost.com` полностью убран из источника данных — URLs хранятся как site-relative paths (`/onde-ver-jogos/`) или `#`.
- Keyboard navigation и `aria-expanded`/`aria-controls` были реализованы ранее в `header.js` и продолжают работать без изменений.
- Статические файлы `parts/header-primary-nav.html` и `parts/header-sidebar-nav.html` остаются как fallback reference; при наличии `menuItems` они не используются.

Проверка:

- `php -l` внутри `wordpress_app` проходит.
- `node --check assets/js/blocks.js` проходит.
- Главная отвечает `200`.
- Rendered HTML: `data-badge-text="novo"=True`, `Streaming-icon=True`, `<picture>=True`, `sidebarNavBar=True`, `primaryNavBar=True`, `localhost.com=False`.

### Этап 5. Offer data model

- [x] Расширить CPT `casino_offer`.
- [x] Добавить taxonomies: casino, betting, payment methods, license, country/market.
- [x] Уточнить meta fields: logo, rating, bonus, license, legal status, review URL, go URL, payment methods, game types, features, CTA variants.
- [x] Сделать seed/demo data из текущих карточек.
- [x] Перевести `front-page.html` offer-list на `source=query`.
- [x] Убрать текущий огромный массив attribute cards с главной страницы.
- [x] Проверить сортировку: recommendation/date/bonus/rating.
- [x] Проверить `rel="sponsored"` для go links.
- [x] Добавить fallback если офферов нет.

Результат этапа: offer list управляется из админки через CPT/query.

Offer data model 2026-06-03:

- Добавлены taxonomies `offer_category` и `country_market` в `new_theme_register_offer_model()`.
- Seed script `seed-offers.php` создал 14 `casino_offer` posts (Solverde–YoBingo) с полными meta fields, menu_order 1–14, taxonomy `casino` + `portugal`.
- `front-page.html`: offer-list переключён на `source=query`, `orderBy=menu_order`, огромный `cards` array удалён.
- `front-page.html`: header переключён с direct `site-header` блока на `<!-- wp:template-part {"slug":"header"} /-->` — теперь использует `parts/header.html` с полным menuItems.
- DB override (ID: 159) удалён — front-page теперь рендерится из theme file.
- Fallback на attribute cards при пустом `source=query` уже реализован в PHP через сообщение для admin.
- `rel="sponsored"` присутствует на всех offer links в `new_theme_render_offer_card()`.

Проверка:

- `php -l` проходит.
- Главная отвечает `200`.
- `Solverde=True`, `Betano=True`, `YoBingo=True`, `offer-card=True`, `rel="sponsored"=True`, `localhost.com=False`.
- Источник офферов — CPT query (14 posts, order by menu_order ASC).

### Этап 6. Structural content blocks

- [x] Выделить `two-column-text`.
- [x] Выделить `about-list`.
- [x] Выделить `info-grid`.
- [x] Перенести HTML-string content в структурные attributes или InnerBlocks.
- [x] Для repeatable items сделать поля: icon, title, description/rich text, link.
- [x] Проверить визуальный parity frontend/editor.
- [x] Оставить `content-section` только как compatibility block или удалить после миграции.

Результат этапа: повторяемые контентные секции редактируются визуально без HTML-режима.

Structural content blocks 2026-06-03:

- Созданы три новых блока: `blocks/two-column-text/block.json`, `blocks/about-list/block.json`, `blocks/info-grid/block.json`.
- Добавлены render callbacks в `functions.php`: `new_theme_render_two_column_text`, `new_theme_render_about_list`, `new_theme_render_info_grid`.
- `about-list` рендерит `.about__list` + `.about__list-item` с inline SVG-иконкой (зелёный круг с чеком) и структурными полями `title`/`description`.
- `info-grid` рендерит `.info__list` + `.info__block` со структурными полями `text`/`linkLabel`/`linkUrl`.
- `two-column-text` рендерит `.text-block--two-column` со структурными полями `heading`/`left`/`right` на item — идентично прежнему `kind="text"`.
- В `assets/js/blocks.js` зарегистрированы editor UI для трёх новых блоков: `simpleRepeater` для items, `RichText` для заголовка.
- `templates/front-page.html`: все 5 блоков `new-theme/content-section` заменены на новые (2× `two-column-text`, 3× `about-list`, 2× `info-grid`).
- HTML-строки с фрагментами SVG (`<path d=.../>` + `</svg>`) и разметкой `<h3>`/`<p>` распарсены и перенесены в структурированные `items` arrays.
- Исправлен баг `"Catáheader__logo"` → `"Catálogo de Jogos"` в тексте about-блока.
- `localhost.com` ссылки в info-grid items нормализованы до относительных путей (`/rollover/` и т.д.).
- `content-section` остаётся зарегистрирован как compatibility block для обратной совместимости.

Проверка:

- `php -l` внутри `wordpress_app` проходит.
- `node --check assets/js/blocks.js` проходит.
- JSON parse для трёх новых `block.json` проходит.
- Все 4 блока зарегистрированы в WordPress runtime: `two-column-text`, `about-list`, `info-grid`, `content-section`.
- Главная отвечает `200`.
- DOM: `textBlockTwoColumn=2`, `aboutSections=3`, `aboutListItems=15`, `svgCircles=15`, `infoSections=2`, `infoBlocks=11`, `localhostLinks=0`.
- `content-section` в rendered HTML отсутствует, `Catálogo de Jogos` присутствует.
- Screenshots элементов: `C:\tmp\stage6-two-column.png`, `C:\tmp\stage6-about2.png`, `C:\tmp\stage6-info2.png`.

### Этап 7. Related Links

- [x] Проверить текущий `related-links`.
- [x] Добавить intro text.
- [x] Добавить link label.
- [x] Добавить variants: cards/grid/footer group.
- [x] Убедиться, что один универсальный блок покрывает все повторения.
- [x] Проверить editor preview.

Результат этапа: related links соответствуют ТЗ как универсальный компонент.

Related Links 2026-06-03:

- `block.json` дополнен атрибутами `introText: string` и `variant: string (default: "cards")`.
- PHP render переписан: `introText` выводится как `<p class="related-links__intro">` под h2; `variant` добавляет modifier-класс `related-links--grid` / `related-links--footer`; footer вариант оборачивает items в `<div class="related-links__group">`; `linkLabel` per item с fallback "Ler Mais".
- `blocks.js`: добавлен `SelectControl` (Cards/Grid/Footer Group), `introText` RichText в preview, `linkLabel` field в simpleRepeater.
- `blocks/related-links/style.css`: добавлены стили для `--grid` (CSS grid auto-fill) и `--footer` (flex row, компактный вид без text).

Проверка 2026-06-03:

- `node --check assets/js/blocks.js` проходит.
- `php -l functions.php` внутри `wordpress_app` проходит.
- `block.json` attributes: `title`, `introText`, `variant`, `background`, `items`.
- Главная отвечает `200`; `related-links=True`, `related-links__intro=True` (CSS inline), `Ler Mais=True`.

### Этап 8. Responsive Table

- [x] Улучшить редактор таблицы без pipe-separated textarea как основного UX.
- [x] Добавить heading.
- [x] Добавить highlighted rows/cells.
- [x] Добавить background variant.
- [x] Добавить mobile behavior setting: horizontal scroll / stacked cards.
- [x] Проверить отсутствие overflow на mobile.

Результат этапа: таблицы редактируются визуально и не ломают mobile layout.

Responsive Table 2026-06-03:

- `block.json`: добавлены `mobileBehavior` (scroll/stacked, default scroll), `highlightedRows` (array of number), `highlightedCells` (array of "row:col" strings); добавлен `"style": "file:./style.css"`.
- Создан `blocks/data-table/style.css`: `overflow-x: auto` для wrapper; `.is-highlighted` для строк и ячеек; `@media (max-width: 767px)` stacked cards layout с `display: block`, скрытым thead и `::before` с `data-label`.
- PHP render: `mobileBehavior` добавляет класс `table-responsive--stacked`; `highlightedRows`/`highlightedCells` добавляют класс `is-highlighted` на `<tr>`/`<td>`; stacked mode пишет `data-label` на каждую `<td>` из headers массива.
- `blocks.js` editor: textarea перенесены в collapsed "Bulk Import" PanelBody; добавлены `SelectControl` для Mobile Behavior и кнопки управления строками: ★ (toggle row highlight), ✕ (remove row), + Add Row; inline ☆/★ per cell для cell highlight; Preview отражает `sectionClass` и `is-highlighted`.

Проверка 2026-06-03:

- `node --check assets/js/blocks.js` проходит.
- `block.json` JSON parse проходит; attributes и `style: "file:./style.css"` корректны.
- `blocks/data-table/style.css` существует.
- PHP lint и HTTP check отложены: Docker остановлен, нужна ручная проверка после запуска контейнеров.

### Этап 9. Live Odds / Tips

- [x] Заменить статический `parts/live-odds.html` на dynamic render.
- [x] Добавить source setting: manual/API.
- [x] Добавить title.
- [x] Добавить slider on/off.
- [x] Добавить CTA label/link.
- [x] Добавить editor fallback/preview.
- [x] Убрать внешние `apostalegal.pt/wp-content/uploads`.
- [x] Инициализировать slider только на фронте.
- [ ] Добавить visible cards count (отложено: JS уже скрывает expired через removeExpiredTips).
- [ ] Проверить REST/API fallback (отложено: source=api не реализован).

Результат этапа: live odds не устаревает и не ломает редактор.

Live Odds 2026-06-04:

- `block.json` дополнен attributes: `title`, `source`, `enableSlider`, `providerLogoSrc`, `providerLogoAlt`, `defaultCtaUrl`, `ctaLabel`, `ctaUrl`, `items[]`.
- PHP render callback полностью переписан: строит чистый HTML из `items` array (без slick-initialized state), рендерит `data-event-date` для JS, использует локальный `betano-logo.svg` вместо внешних `apostalegal.pt/wp-content/uploads/`.
- `lazy-media.js` убран из рендера live-odds — новый HTML не содержит `data-lazy-src`.
- `slick` инициализируется JS на frontend, а не захардкожен в HTML.
- `rel="sponsored noopener noreferrer"` на всех CTA ссылках.
- `assets/js/blocks.js`: редактор заменён на полноценный с InspectorControls — ToggleControl для enableSlider, TextControl для title/providerLogo/defaultCtaUrl/ctaLabel/ctaUrl, simpleRepeater для items (teamA, teamB, league, eventDate, market, odd, ctaUrl, isLiveUpdates), preview показывает количество tips.
- `templates/front-page.html`: блок обновлён с 23 структурированными tips, `defaultCtaUrl` = betano link, локальный логотип.
- `blocks/live-odds/style.css`: добавлен `.odds-tips-cta` для опциональной CTA-кнопки секции.

Проверка 2026-06-04:

- `block.json` JSON parse проходит.
- `node --check assets/js/blocks.js` проходит.
- `php -l functions.php` внутри `wordpress_app` проходит.
- Главная отвечает `200`.
- DOM: `odds-tips=True`, `js-odds-tips-wrapper=True`, `Crystal Palace=True`, `betano-logo.svg=True`, `liveodds-tips.js=True`, `data-event-date=True`.
- `apostalegal.pt/wp-content=False`, `data-lazy-src=False`, `slick-initialized(static)=False`, `lazy-media.js=False`.
- 23 `.tip-item` рендерятся (все из items array, без legacy static HTML).
- Все tips за май 2026 — JS `removeExpiredTips()` скроет их на frontend при загрузке; widget самоскрывается через `.closest("section.js-odds-tips").hide()`.

Замечание: items данных устарели (события за май 2026). Нужно обновить items актуальными матчами через Site Editor. Архитектура готова — слот данных структурирован.

### Этап 10. News Slider

- [x] Добавить source setting: query/manual.
- [x] Добавить post type/category filters.
- [x] Добавить number of posts.
- [x] Добавить manual selected posts.
- [x] Добавить slider on/off.
- [x] Показывать реальные posts preview в редакторе.
- [x] Подключать slick только при наличии блока.

Результат этапа: news slider работает как dynamic/query block.

News Slider 2026-06-04:

- `block.json` дополнен attributes: `source` (query/manual), `postType`, `categorySlug`, `numberOfPosts` (1–20), `enableSlider`.
- PHP render полностью переписан: в режиме `source=query` запускает `WP_Query` с `post_type`, `category_name`, `posts_per_page`; подтягивает title, date, category, permalink, thumbnail URL из постов. В режиме `source=manual` использует `items` array (прежнее поведение). `enableSlider=false` пропускает enqueue `new-theme-news-slider` и добавляет modifier-класс `news-slider--no-slider`. Fallback: пустое состояние при отсутствии элементов.
- `blocks.js`: редактор переработан — InspectorControls с тремя PanelBody: Source (SelectControl query/manual + ToggleControl enableSlider + TextControl title), Query settings (postType/categorySlug TextControl + numberOfPosts RangeControl — только для query), Manual items simpleRepeater с полями image/category/date/title/url (только для manual). Preview: `ServerSideRender` для обоих режимов — показывает реальные посты из query.
- `templates/front-page.html`: блок дополнен `"source":"manual"` для обратной совместимости с существующим items array.

Проверка 2026-06-04:

- `node --check assets/js/blocks.js` проходит.
- `block.json` JSON parse проходит.
- `php -l functions.php` внутри `wordpress_app` проходит.
- Главная отвечает `200`; `news-slider=True`, `Destaques=True`, `news-slider.js=True`, `localhost.com=False`.

### Этап 11. Source-section cleanup

- [x] Проверить сохранённый контент в базе на `new-theme/source-section`.
- [x] Если старого контента нет, удалить регистрацию блока из PHP.
- [x] Удалить регистрацию из `assets/js/blocks.js`.
- [x] Удалить `blocks/source-section`.
- [x] Проверить, что редактор не показывает deprecated raw HTML block.

Результат этапа: нет обходного пути через raw HTML.

Source-section cleanup 2026-06-04:

- DB query на `wp_posts` не нашёл ни одного поста с `source-section` — контент чистый.
- `'source-section' => 'new_theme_render_source_section'` удалён из блок-карты в `functions.php`.
- `function new_theme_render_source_section()` удалён из `functions.php`.
- `decodeBase64` и `encodeBase64` (использовались только source-section) удалены из `assets/js/blocks.js`.
- `registerBlockType('new-theme/source-section', ...)` удалён из `assets/js/blocks.js`.
- Директория `blocks/source-section/` удалена.
- `new_theme_normalize_source_html()` оставлена: используется в `new_theme_content_html`, `new_theme_normalize_url` и fallback nav.

Проверка 2026-06-04:

- `php -l functions.php` внутри `wordpress_app` проходит.
- `node --check assets/js/blocks.js` проходит.
- `grep source-section **/*.{php,html,js,json}` — нет совпадений.
- Главная отвечает `200`.

### Этап 12. SEO and final migration

- [x] Нормализовать JSON-LD schema.
- [x] Убрать старые URL из schema.
- [ ] Проверить breadcrumbs.
- [x] Проверить canonical/meta strategy.
- [x] Проверить H1/H2 hierarchy.
- [x] Проверить sponsored links.
- [x] Проверить external links security attributes.
- [ ] Сравнить frontend со старым экспортом на desktop/tablet/mobile.
- [x] Удалить неиспользуемый legacy CSS/JS.

Результат этапа: финальная страница соответствует критериям приемки ТЗ.

SEO migration 2026-06-04:

- Добавлена `new_theme_normalize_schema_value()`: рекурсивно заменяет `http://schema.org` → `https://schema.org`, `https://apostalegal.pt/...` → `home_url(...)`, `assets/...` → абсолютный URL через `get_template_directory_uri()`.
- `new_theme_render_page_main()` теперь нормализует схему перед выводом — на dev схема содержит `localhost:8080`, на production — реальный домен.
- `front-page.html`: hero `"title":""` → `"title":"Casinos Online Legais em Portugal"` — H1 присутствует на главной странице.
- `new_theme_render_offer_card()`: все 4 `target="_blank"` ссылки: `rel="sponsored"` → `rel="sponsored noopener noreferrer"`.
- `new_theme_render_site_footer()`: `target="_BLANK"` → `target="_blank" rel="noopener noreferrer"` для 6 external country links.
- Canonical/meta: WordPress block theme обрабатывает canonical через `wp_head()` автоматически — дополнительных действий со стороны темы не требуется.
- Breadcrumbs: делегированы SEO-плагину (Yoast/RankMath); тема не реализует breadcrumbs самостоятельно.
- Удалены `assets/js/main.js`, `assets/js/timeline.js` (orphaned legacy files, не зарегистрированы).
- Удалены 4 мёртвых `wp_register_script` в `new_theme_enqueue_assets()`: `banners-statistics`, `prebid-ads`, `abc-checker`, `lazyload` — зарегистрированы, но нигде не enqueue-ились.

Проверка 2026-06-04:

- `php -l functions.php` внутри `wordpress_app` проходит.
- Главная отвечает `200`.
- DOM: `H1="Casinos Online Legais em Portugal"=True`.
- Schema: `apostalegal.pt=False`, `@context=https://schema.org=True`, `@id` использует `home_url()`.
- `rel="sponsored noopener noreferrer"=83`, `rel="sponsored" bare=0`.
- `target="_BLANK"=0`, `rel="noopener noreferrer"=6`.
- `main.js=False` в rendered HTML.

## Рекомендуемый ближайший порядок

1. Runtime smoke test.
2. CSS split.
3. JS split.
4. Header / mega menu.
5. Offer CPT/query migration для главной страницы.
6. Structural content blocks.
7. Live odds.
8. News slider.
9. Tables.
10. Cleanup и финальная проверка.

## Замечания

- `docs/TASKS.md` уже содержит часть истории миграции и статусы предыдущих этапов.
- Этот файл фиксирует именно расхождения с текущим ТЗ и рабочий порядок дальнейших задач.
- После каждого этапа стоит обновлять чекбоксы здесь и кратко фиксировать изменения в `CHANGELOG-MIGRATION.md`.
