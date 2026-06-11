# Architecture — new-theme Block Blocks

## Production Metadata

Все кастомные блоки имеют metadata-файлы:

```
blocks/<block-slug>/block.json
```

PHP хранит render callbacks в `functions.php`, регистрация идёт через `register_block_type( $metadata_path, ... )`.

## Block Types

### SSR Blocks (ServerSideRender)
PHP render callback → REST API → editor preview = frontend output.

| Блок | Редактируемые поля |
|------|--------------------|
| `age-disclaimer` | text, linkText, linkUrl |
| `site-header` | logo, logoId, logoLight, logoLightId, logoAlt |
| `offer-card` | name, logo, logoId, rating, bonus, features, payments, offerUrl, reviewUrl |
| `news-slider` | title, items[]{url, image, title, category, date} |
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
| `hero` | Произвольные core-блоки и функциональные блоки темы |
| `section` | Произвольные core-блоки и функциональные блоки темы |
| `offer-list` | `offer-card` |

`new-theme/section` — универсальная динамическая оболочка для контента. Она хранит только настройки фона, контейнера, отступов и адаптивного поведения. Сам контент сохраняется через `InnerBlocks.Content` и рендерится обычными блоками Gutenberg. Двухколоночный режим вставляет `core/columns`, не создавая отдельную модель контента.

`new-theme/hero` остается отдельным `InnerBlocks`-блоком, потому что у него уникальная геометрия, скошенный нижний край и перекрытие следующей секции. Фон и overlay настраиваются в sidebar, а заголовки, текст, кнопки и другие элементы добавляются обычными Gutenberg-блоками.

## Internal Links Tracking

Маркеры аналитики (бывший `related-links`) хранятся как классы `nt-internal-links` и `nt-internal-link`. Render-фильтры добавляют к итоговой разметке `data-location="internal-links"` и `data-internal-link="true"` без изменения HTML core-блоков.

## Path Normalisation

`new_theme_normalize_source_html()` применяется при рендеринге:
- `assets/` → `get_template_directory_uri() . '/assets/'`
- `localhost.com/` → `home_url('/')`

`new_theme_asset_url()` для атрибутов-изображений:
- Относительный путь → абсолютный URL темы
- Уже абсолютный URL → без изменений

Для новых изображений editor UI использует WordPress Media Library. Header/footer logos, offer logos, payment icons и CPT `casino_offer` logo/payments выбираются через Медиафайлы. Старые theme-relative paths остаются читаемыми через `new_theme_asset_url()` только как backward compatibility для импортированного контента.

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

CSS загружается в следующем порядке: `global.css` → `legacy-reference.css` → `block-theme.css` → `core-blocks-v2.css`. Последний файл является fallback-слоем для стандартных Gutenberg-блоков на установках, где оптимизатор удаляет WordPress `global-styles` или `wp-block-library`. Те же файлы плюс `editor.css` подключаются в editor styles через `add_editor_style`. `styles.css` является совместимым шимом для прямых ссылок; основной frontend стилизации он больше не несёт.

Фронтовые JS-файлы регистрируются заранее, но подключаются только при рендере нужных блоков:

| Script | Когда подключается |
|--------|--------------------|
| `header.js` | `new-theme/site-header` render callback |
| `offer-list.js` | `new-theme/offer-list` render callback |
| `internal-links.js` | `render_block` filter для `new-theme/section` с классом `nt-internal-links` или `render_block_core/button` с классом `nt-internal-link` |
| `news-slider.js` + `slick.js` | `new-theme/news-slider` render callback |
| `liveodds-tips.js` | `new-theme/live-odds` render callback |

`main.js` удалён: глобального фронтового скрипта нет. Все JS подключаются только если соответствующий блок присутствует на странице.

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
