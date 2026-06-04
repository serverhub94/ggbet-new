# Architecture — new-theme Block Blocks

## Production Metadata

Все кастомные блоки имеют metadata-файлы:

```
blocks/<block-slug>/block.json
```

PHP всё ещё хранит render callbacks в `functions.php`, но регистрация идёт через `register_block_type( $metadata_path, ... )`. Это сохраняет текущий SSR-рендер и совместимость шаблонов, при этом переводит блоки на production-структуру из ТЗ.

`new-theme/source-section` оставлен как legacy block для обратной совместимости, но скрыт из inserter и не используется в текущих шаблонах.

## Block Types

### SSR Blocks (ServerSideRender)
PHP render callback → REST API → editor preview = frontend output.

| Блок | Редактируемые поля |
|------|--------------------|
| `age-disclaimer` | text, linkText, linkUrl |
| `site-header` | logo, logoId, logoLight, logoLightId, logoAlt |
| `hero` | title, text, image, imageId, overlayColor, overlayOpacity, topSpacer, variant |
| `offer-card` | name, logo, logoId, rating, bonus, features, payments, offerUrl, reviewUrl |
| `content-section` | kind, title, text, image, imageId, background, items[] |
| `related-links` | title, background, items[]{title, text, image, url} |
| `data-table` | title, background, headersText, rowsText |
| `news-slider` | title, items[]{url, image, title, category, date} |
| `link-card` | title, text, image, imageId, url |
| `faq-item` | question, answer |
| `site-footer` | logo, logoId, logoAlt, disclaimerText, infoLinks[], moreLinks[], externalLinks[], footerLinks[], copyright |

### File-based Blocks (HTML read from parts/)
Too large for REST GET — PHP reads HTML file and normalises paths.

| Блок | Файл | Редактирование |
|------|------|----------------|
| `site-header` nav | `parts/header-sidebar-nav.html` | Редактировать файл напрямую |
| `site-header` nav | `parts/header-primary-nav.html` | Редактировать файл напрямую |
| `live-odds` | `parts/live-odds.html` | Редактировать файл напрямую |

### InnerBlocks
Контейнеры — дочерние блоки редактируются как обычные блоки Gutenberg.

| Блок | Дочерние блоки |
|------|----------------|
| `page-main` | Любые блоки |
| `offer-list` | `offer-card` |
| `card-grid` | `link-card` |
| `faq` | `faq-item` |

## Path Normalisation

`new_theme_normalize_source_html()` применяется при рендеринге:
- `assets/` → `get_template_directory_uri() . '/assets/'`
- `localhost.com/` → `home_url('/')`

`new_theme_asset_url()` для атрибутов-изображений:
- Относительный путь → абсолютный URL темы
- Уже абсолютный URL → без изменений

`new-theme/hero` сохраняет выбранный Media Library URL в `image` и attachment ID в `imageId`. Старые theme-relative значения `image` продолжают работать через `new_theme_asset_url()`. Overlay, top spacer и dark/light variant рендерятся одинаково в editor preview и на фронте.

Для новых изображений editor UI больше не показывает ручные path-поля. Header/footer logos, offer logos, payment icons, content-section images, related/news/link-card images и CPT `casino_offer` logo/payments выбираются через WordPress Media Library. Старые theme-relative paths остаются читаемыми только как backward compatibility для импортированного контента.

## Template Structure

```
templates/
  front-page.html   — Главная (прямые блоки, без template-part)
  single.html       — Статья (template-part header/footer)
  page.html         — Страница (template-part header/footer)
  archive.html      — Архив/категория (template-part header/footer)
  index.html        — Fallback (= archive.html)

parts/
  header.html               — age-disclaimer + site-header блоки
  footer.html               — site-footer блок
  header-sidebar-nav.html   — мега-меню HTML (36KB)
  header-primary-nav.html   — основная навигация HTML (31KB)
  live-odds.html            — виджет live odds HTML (58KB)
```

## Docker Sync

```powershell
docker cp C:\WorkProjects\wordpress\themes\new-theme wordpress_app:/var/www/html/wp-content/themes/
docker exec wordpress_app chown -R www-data:www-data /var/www/html/wp-content/themes/new-theme
```

Сбросить кэш:
```powershell
# WP object cache
docker exec wordpress_app php -r 'require "/var/www/html/wp-load.php"; wp_cache_flush(); echo "done";'
# Nginx fastcgi cache
docker exec wordpress_nginx sh -c 'find /var/cache/nginx -type f -delete'
```

## Asset Loading

Базовый визуальный слой `assets/css/styles.css` подключается на фронте и в editor styles, потому что текущий HTML зависит от legacy-классов.

Фронтовые JS-файлы регистрируются заранее, но часть подключается только при рендере нужных блоков:

| Script | Когда подключается |
|--------|--------------------|
| `offer-list.js` | `new-theme/offer-list` |
| `internal-links.js` | `new-theme/related-links` |
| `news-slider.js` + `slick.js` | `new-theme/news-slider` |
| `liveodds-tips.js` | `new-theme/live-odds` |

`main.js` остаётся глобальным, потому что header/template parts присутствуют во всех основных шаблонах и текущие меню завязаны на legacy frontend logic.

## Offer Data Model

`casino_offer` — reusable CPT для централизованного управления офферами.

Поддержка CPT:
- `title` — название казино;
- `thumbnail` — запасной источник логотипа, если meta `logo` пустая;
- `page-attributes` — `menu_order` для ручной сортировки;
- REST API и `custom-fields`.

Post meta поля:
- `logo`
- `rating`
- `bonus`
- `features`
- `payments`
- `offer_url`
- `review_url`
- `license_status`
- `is_legal`

В admin meta box для `casino_offer` поля `logo` и `payments` управляются через Media Library. Значения остаются URL/newline URL list, чтобы не ломать существующий render path и REST meta.

`new-theme/offer-list` поддерживает два источника:
- `source=attributes` или отсутствующий `source` — старый режим, рендерит `cards[]` и вложенный контент как раньше;
- `source=query` — делает `WP_Query` по `casino_offer` с настройками `limit`, `orderBy`, `order`, `showLegalLabel`.

Текущий `templates/front-page.html` пока остаётся на attribute cards, чтобы не менять фронтенд до наполнения CPT.
