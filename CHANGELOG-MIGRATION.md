# New Theme Migration Log

## Context

Source static site:

`C:\WorkProjects\portugal-casino-theme`

WordPress block theme target:

`C:\WorkProjects\wordpress\themes\new-theme`

Current Docker setup uses `docker-compose.fast.yml`, so WordPress runs from a named volume, not directly from the local `themes` folder. After local theme edits, sync the theme into the container:

```powershell
docker cp C:\WorkProjects\wordpress\themes\new-theme wordpress_app:/var/www/html/wp-content/themes/
docker exec wordpress_app chown -R www-data:www-data /var/www/html/wp-content/themes/new-theme
```

## 2026-06-03 Runtime Smoke Test

Ran stage 1 from `docs/TZ-GAP-ROADMAP.md`.

- Docker WordPress environment was already running on `localhost:8080`.
- Synced `C:\WorkProjects\wordpress\themes\new-theme` into `wordpress_app:/var/www/html/wp-content/themes/`.
- Confirmed active theme is `new-theme`.
- `php -l /var/www/html/wp-content/themes/new-theme/functions.php` passed inside `wordpress_app`.
- Confirmed all expected `new-theme/*` custom blocks are registered after `init`.
- Confirmed CPT `casino_offer` exists.
- Confirmed FSE templates `front-page`, `page`, `single`, `archive`, `index` are visible through WordPress runtime.
- Server-side render smoke test for those templates completed without PHP output errors.
- Frontend HTTP smoke test for `/` returned `200`; `page-hero`, `offer-card`, and `site-footer` were present; `localhost.com` did not appear in rendered HTML.
- Playwright screenshots were captured:
  - `C:\tmp\new-theme-home-desktop.png`
  - `C:\tmp\new-theme-home-tablet.png`
  - `C:\tmp\new-theme-home-mobile.png`

Runtime issues found:

- `front-page` is currently `source=custom`, so a saved DB template override can hide future changes to `templates/front-page.html`.
- The first viewport renders broken/empty `offer-list` cards from the current attribute `cards` data.
- Empty offer logos produce `src="http://localhost:8080/wp-content/themes/new-theme/"`.
- `related-links` references missing `assets/img/2021/08/betano-square-logo.png`.
- Legacy `assets/js/main.js` can still request `/wp-content/themes/apostalegal/dist/scripts/defered.js?v=2.0.3`.
- Full authenticated Site Editor open/save for all templates still needs manual or authenticated browser verification.

## 2026-06-03 Runtime Smoke Fixes

Fixed the runtime issues found during the stage 1 smoke test:

- Added a defensive empty-path guard to `new_theme_asset_url()` so empty image attributes no longer render the theme root URL as an image `src`.
- Added a legacy attribute-card compaction step for `new-theme/offer-list`, merging the fragmented imported `cards` array into renderable cards before output.
- Added a fallback from missing `assets/img/2021/08/betano-square-logo.png` to existing `assets/img/2021/08/betano-logo.svg`.
- Updated `templates/front-page.html` to use the existing Betano SVG in `related-links`.
- Normalized legacy live-odds Betano upload URLs to the local Betano SVG.
- Added a temporary inline guard before legacy `assets/js/main.js` so the old `/wp-content/themes/apostalegal/dist/scripts/defered.js` loader does not run. The proper removal belongs to the JS split stage.

Verification:

- `php -l /var/www/html/wp-content/themes/new-theme/functions.php` passed inside `wordpress_app`.
- Frontend `/` returned `200`.
- Rendered HTML checks: no empty theme-root image `src`, no `betano-square-logo`, no `wp-content/themes/new-theme/http`, no `apostalegal/dist/scripts/defered.js`, no empty offer headings.
- Fresh Playwright desktop/tablet/mobile screenshots passed visual smoke:
  - `C:\tmp\new-theme-home-desktop-fixed.png`
  - `C:\tmp\new-theme-home-tablet-fixed.png`
  - `C:\tmp\new-theme-home-mobile-fixed.png`
- Fresh nginx/PHP logs after the browser pass did not show new 404/error entries for the fixed paths.

## 2026-06-03 CSS Split

Completed stage 2 from `docs/TZ-GAP-ROADMAP.md`.

- Added `assets/css/global.css` for shared foundations: fonts, theme tokens, reset, containers/layout helpers, and basic WordPress block-theme integration.
- Moved the large exported stylesheet into `assets/css/legacy-reference.css`.
- Reduced `assets/css/styles.css` to a compatibility shim that imports `global.css`, `legacy-reference.css`, and `block-theme.css` for any old direct references.
- Updated frontend enqueue order to load:
  - `new-theme-global`
  - `new-theme-legacy-reference`
  - `new-theme-block-theme`
- Updated editor styles to load:
  - `assets/css/global.css`
  - `assets/css/legacy-reference.css`
  - `assets/css/block-theme.css`
  - `assets/css/editor.css`
- Added block-local CSS files and `block.json` `style` references for:
  - `blocks/offer-list/style.css`
  - `blocks/related-links/style.css`
  - `blocks/live-odds/style.css`
  - `blocks/news-slider/style.css`

Verification:

- JSON parse passed for `theme.json` and every `blocks/*/block.json`.
- `php -l /var/www/html/wp-content/themes/new-theme/functions.php` passed inside `wordpress_app`.
- WordPress registered block style handles for `offer-list`, `related-links`, `live-odds`, and `news-slider`.
- Frontend `/` returned `200`.
- Rendered HTML loads `global.css`, `legacy-reference.css`, `block-theme.css`, and block-local styles; it no longer loads the large `assets/css/styles.css` as the main frontend stylesheet.
- Playwright screenshots passed visual smoke:
  - `C:\tmp\new-theme-css-split-desktop.png`
  - `C:\tmp\new-theme-css-split-tablet.png`
  - `C:\tmp\new-theme-css-split-mobile.png`
- Fresh nginx/PHP logs did not show CSS 404/error entries.

## 2026-06-03 JS Split and Conditional Loading

Completed stage 3 from `docs/TZ-GAP-ROADMAP.md`.

- Removed the global frontend enqueue for legacy `assets/js/main.js`.
- Removed the global inline `themeVars`; the only remaining inline frontend data is `liveodds_tips`, scoped to the live odds script handle.
- Added `assets/js/header.js` for header dropdown/mobile menu behavior and enqueue it from `new_theme_render_site_header()`.
- Added `assets/js/lazy-media.js` for legacy lazy media attributes and enqueue it only from `live-odds` or `source-section` when needed.
- Kept `new-theme-slick` registered but no longer global. It now loads through `news-slider` and `liveodds-tips` dependencies.
- Kept `offer-list`, `related-links`, `news-slider`, and `live-odds` scripts loaded from their render callbacks.
- Cleared nginx FastCGI cache after the deploy-to-container sync so the local frontend stopped serving stale HTML with `new-theme-main`.

Verification:

- `node --check assets/js/header.js` passed.
- `node --check assets/js/lazy-media.js` passed.
- `php -l /var/www/html/wp-content/themes/new-theme/functions.php` passed inside `wordpress_app`.
- Runtime registration check: `new-theme-main registered=no queued=no`; split handles registered but not globally queued.
- Front page HTML now has `main.js=False`, `themeVars=False`, and expected block/header scripts present.
- 404 page HTML has `header.js=True` and does not load slick, news slider, live odds, lazy media, offer list, internal links, main.js, or themeVars.
- Browser plugin was unavailable for an in-app visual check (`iab` not available), so verification was limited to runtime and HTTP output checks.

## What Was Done

1. Copied all source assets from:

`C:\WorkProjects\portugal-casino-theme\assets`

to:

`C:\WorkProjects\wordpress\themes\new-theme\assets`

2. Added `functions.php` to enqueue original source assets:

- `assets/css/styles.css`
- original JS files: `slick.js`, `news-slider.js`, `main.js`, `offer-list.js`, `internal-links.js`, `liveodds-tips.js`, `lazyload.min.js`, etc.
- inline `themeVars`
- inline `liveodds_tips`

3. Updated theme metadata:

- `style.css`
- `theme.json`

4. Added custom Gutenberg block registration in:

`assets/js/blocks.js`

Main custom blocks registered:

- `new-theme/source-section`
- `new-theme/age-disclaimer`
- `new-theme/site-header`
- `new-theme/page-main`
- `new-theme/hero`
- `new-theme/offer-list`
- `new-theme/offer-card`
- `new-theme/content-section`
- `new-theme/related-links`
- `new-theme/data-table`
- `new-theme/news-slider`
- `new-theme/card-grid`
- `new-theme/link-card`
- `new-theme/faq`
- `new-theme/faq-item`
- `new-theme/site-footer`

5. Important correction: the simplified `nt-*` redesign was removed from the front page because it changed the visual design too much.

6. Restored visual fidelity by rebuilding:

`templates/front-page.html`

from the original source HTML body, split into three `new-theme/source-section` blocks:

- Original header and navigation
- Original main casino page
- Original footer

The source HTML is stored in the block attribute `htmlBase64` to avoid WordPress block comment parsing problems caused by nested HTML comments in the original source.

7. `new_theme_render_source_section()` decodes `htmlBase64` and normalizes paths at render time:

- `assets/...` becomes `get_template_directory_uri() . '/assets/...'`
- `localhost.com/...` becomes `home_url('/')`

This keeps the frontend close to the original static site while still making the sections available as Gutenberg blocks.

8. Removed the saved WordPress template override that was causing the old simplified front page to keep rendering:

```powershell
docker exec wordpress_app php -r 'require "/var/www/html/wp-load.php"; wp_delete_post(157, true); wp_cache_flush(); echo "deleted template override 157";'
```

The override was a `wp_template` post:

`ID 157`, `post_name front-page`, title `Главная страница`.

9. Added a dedicated Gutenberg inserter category for the theme blocks:

- `New Theme`

This makes the custom blocks easier to find in the admin block inserter instead of being mixed into the generic theme/core groups.

10. Updated the editable block renderers so newly added blocks use the original source CSS classes where it matters most:

- `new-theme/age-disclaimer` renders `.age-disclaimer`
- `new-theme/hero` renders `.page-hero`
- `new-theme/offer-list` renders `.offers.offers--full.offers--legacy`
- `new-theme/offer-card` renders `.offer-card`, `.offer-card__features`, `.offer-card__payment`, `.offer-card__bonus-wrapper`, `.offer-card__links`

The offer card block now has editable sidebar fields for logo, rating, bonus, feature list, payment icons, offer URL, and review URL.

11. Synced local theme edits into the running Docker WordPress container:

```powershell
docker cp C:\WorkProjects\wordpress\themes\new-theme wordpress_app:/var/www/html/wp-content/themes/
docker exec wordpress_app chown -R www-data:www-data /var/www/html/wp-content/themes/new-theme
```

12. Rebuilt `templates/front-page.html` from 3 large `source-section` blocks into smaller page sections.

This first split made sections selectable and movable in the Site Editor, but it still stored most content as raw original HTML.

13. Converted the homepage main content into real field-based Gutenberg blocks so a content manager can edit the page without editing source HTML:

- original header/navigation
- `new-theme/page-main`
- `new-theme/hero`
- `new-theme/offer-list` with editable casino card repeater fields
- `new-theme/content-section` for text, about, and info sections
- `new-theme/related-links` with editable link card repeater fields
- `new-theme/data-table` with editable headers and rows
- `new-theme/news-slider` with editable news item repeater fields
- live odds tips widget
- original footer

The frontend still uses the original CSS class names where possible, but the main page is no longer one raw HTML block. Current `source-section` usage is limited to complex legacy areas that were not yet converted:

- header/navigation
- live odds tips widget
- footer

Current parsed block count in `templates/front-page.html`:

- `new-theme/page-main`: 1
- `new-theme/hero`: 1
- `new-theme/offer-list`: 1
- `new-theme/content-section`: 7
- `new-theme/related-links`: 3
- `new-theme/data-table`: 9
- `new-theme/news-slider`: 1
- `new-theme/source-section`: 3

14. Rewrote `assets/js/blocks.js` to make the block editor WYSIWYG:

**Goal:** editor preview = frontend output. Previously the `edit` functions showed simplified placeholder markup unrelated to what PHP rendered on the frontend.

**Changes to `blocks.js`:**

- Added `wp-server-side-render` as a script dependency in `functions.php`.
- Added `wp_localize_script` to pass `newThemeEditor.themeUrl` and `newThemeEditor.homeUrl` to JS for path normalization in source-section preview.
- Replaced `edit` functions for all pure server-rendered blocks with `ServerSideRender` component — the editor calls the same PHP `render_callback` as the frontend, so the preview is identical:
  - `age-disclaimer`, `site-header`, `hero`, `offer-card`, `content-section`, `related-links`, `data-table`, `news-slider`, `link-card`, `faq-item`, `site-footer`
- `source-section` uses `dangerouslySetInnerHTML` with JS path normalization instead of SSR. Reason: the `htmlBase64` attribute stores hundreds of KB of base64 HTML which would exceed GET request URL limits if sent to the REST API. The editor now shows the actual rendered header/footer/widget HTML visually instead of a green placeholder box.
- Updated `page-main` editor wrapper HTML to match PHP render output structure: `page__content` → `page__overlay` → `page__content-area` → `page__main`.
- Updated `offer-list` editor wrapper HTML to match PHP render output: `offers__controls`, `offers__legal-label`, `offers__list`.

**Sidebar controls remain unchanged** — all fields (text, textarea, repeaters, selects) work exactly as before. The only change is that the visual preview area now shows the real PHP-rendered block instead of a simplified placeholder.

15. Fixed ServerSideRender 400 errors — added PHP attribute schema to all blocks:

**Problem:** After step 14, all SSR blocks showed errors in the editor. The WordPress REST block renderer endpoint (`/wp/v2/block-renderer/{name}`) validates incoming `attributes` against the block type's registered schema. Since `register_block_type` in PHP had no `attributes` key, WordPress had `additionalProperties: false` with no known properties — every attribute object was rejected with `rest_invalid_param`.

**Fix:** Restructured `new_theme_register_blocks()` in `functions.php` to define a per-block `attributes` array matching the JS `registerBlockType` attribute schema. Each attribute is typed (`string`, `array`).

**Also reverted:** `assets/css/styles.css` was temporarily added to `add_editor_style()` but was removed. In WordPress 7.0 block themes the editor iframe already includes all frontend-enqueued stylesheets automatically — explicit `add_editor_style` for `styles.css` would cause a double-load.

**Result after fix:**
- All 11 SSR blocks return HTTP 200 from the REST block renderer.
- Editor preview for every block shows the exact same HTML/CSS as the public frontend.
- Frontend output unchanged (573 714 bytes, `styles.css` loaded once, `offer-card`/`page-hero`/`site-footer` present, no `nt-offer-card` or `localhost.com` leaks).

## Verification Commands

PHP syntax:

```powershell
docker exec wordpress_app php -l /var/www/html/wp-content/themes/new-theme/functions.php
```

JS syntax:

```powershell
node --check C:\WorkProjects\wordpress\themes\new-theme\assets\js\blocks.js
```

Check custom block registration:

```powershell
docker exec wordpress_app php -r 'require "/var/www/html/wp-load.php"; do_action("init"); $names=["new-theme/page-main","new-theme/content-section","new-theme/related-links","new-theme/data-table","new-theme/news-slider","new-theme/offer-list","new-theme/hero","new-theme/source-section"]; foreach($names as $n){ echo $n."=".(WP_Block_Type_Registry::get_instance()->is_registered($n)?"yes":"no").PHP_EOL; }'
```

Clear caches after theme/template changes:

```powershell
docker exec wordpress_app php -r 'require "/var/www/html/wp-load.php"; wp_cache_flush(); echo "cache flushed";'
docker exec wordpress_nginx sh -lc 'find /var/cache/nginx -type f -delete'
```

Test SSR REST API for a block (requires admin user ID 1):

```powershell
docker exec wordpress_app php -r '
require "//var/www/html/wp-load.php";
wp_set_current_user(1);
$req = new WP_REST_Request("GET", "/wp/v2/block-renderer/new-theme/hero");
$req->set_param("context", "edit");
$req->set_param("attributes", ["title"=>"Test","text"=>"Desc","image"=>"assets/img/2022/01/roleta-casino-online.png"]);
$resp = rest_do_request($req);
echo "status: " . $resp->get_status();
'
```

Expected: `status: 200`

Frontend smoke test:

```powershell
$r = Invoke-WebRequest -Uri http://localhost:8080/ -UseBasicParsing -TimeoutSec 30
$r.Content.Length
$r.Content -match 'offer-card'
$r.Content -match 'page-hero'
$r.Content -match 'site-footer'
$r.Content -match 'nt-offer-card'
$r.Content -match 'localhost\.com'
```

Expected after the latest correction:

- page size around `573714` bytes after field-based block conversion and URL normalization
- `offer-card`: true
- `page-hero`: true
- `site-footer`: true
- `nt-offer-card`: false
- `localhost.com`: false
- `schema-data`: true

## Current Important Files

- `functions.php`
- `assets/js/blocks.js`
- `blocks/*/block.json`
- `patterns/page-casino-legal.php`
- `templates/front-page.html`
- `templates/index.html`
- `parts/header.html`
- `parts/footer.html`
- `assets/css/styles.css`
- `theme.json`
- `style.css`

18. Started production architecture pass from `docs/wp-block-theme-technical-spec.md` (2026-06-02):

- Added `blocks/<slug>/block.json` metadata files for all existing custom blocks.
- Changed PHP block registration to use metadata paths while preserving the current render callbacks and block names.
- Kept `new-theme/source-section` as a hidden legacy compatibility block; it is still not used by current templates.
- Expanded `theme.json` with missing production tokens: rating yellow, bonus orange, spacing scale, font sizes, core block styles, border and shadow presets.
- Added production theme supports: responsive embeds, post thumbnails, html5.
- Registered optional frontend JS first, then enqueue selected scripts from render callbacks:
  - `offer-list.js` from `new-theme/offer-list`
  - `internal-links.js` from `new-theme/related-links`
  - `news-slider.js` from `new-theme/news-slider`
  - `liveodds-tips.js` from `new-theme/live-odds`
- Added first starter block pattern: `patterns/page-casino-legal.php`.

## Current State of the Block Editor

### Blocks and how they render in the editor

| Block | Editor preview | Editable via |
|---|---|---|
| `source-section` (header, footer, live odds) | Real HTML via `dangerouslySetInnerHTML` | Sidebar textarea (raw HTML) |
| `hero` | PHP SSR (identical to frontend) | Sidebar: title, text, image |
| `offer-card` | PHP SSR (identical to frontend) | Sidebar: name, logo, rating, bonus, features, payments, URLs |
| `offer-list` | InnerBlocks wrapper (original CSS classes) | Sidebar repeater + add/remove offer-card child blocks |
| `content-section` | PHP SSR | Sidebar: type, title, text, image, background, text groups |
| `related-links` | PHP SSR | Sidebar repeater: title, text, image, URL per link |
| `data-table` | PHP SSR | Sidebar: headers (pipe-separated), rows (one per line) |
| `news-slider` | PHP SSR | Sidebar repeater: title, category, date, image, URL per item |
| `page-main` | InnerBlocks wrapper (original CSS classes) | Schema JSON via sidebar |
| `age-disclaimer` | PHP SSR | Sidebar: text, link text, link URL |
| `site-header` | PHP SSR | Sidebar: logo, links (Label\|/url/ format) |
| `site-footer` | PHP SSR | Sidebar: links (Label\|/url/ format) |
| `faq` | InnerBlocks wrapper | Add/remove faq-item child blocks |
| `faq-item` | PHP SSR | Sidebar: question, answer |
| `card-grid` | InnerBlocks wrapper | Add/remove link-card child blocks |
| `link-card` | PHP SSR | Sidebar: title, text, image, URL |

### SSR technical details

- SSR blocks use `wp.serverSideRender` component → makes authenticated REST GET to `/wp/v2/block-renderer/{name}?attributes={json}&context=edit`
- Requires the user to be logged in as admin (nonce is included automatically by the editor)
- Preview refreshes automatically ~500ms after any attribute change
- `source-section` does NOT use SSR — its htmlBase64 is too large for a URL param; preview uses JS `dangerouslySetInnerHTML` with path normalization

## Important Caveats

1. The homepage main content is field-based Gutenberg blocks editable from the admin without touching source HTML. Header, footer, and live odds widget converted from `source-section` to real blocks.

2. Do not replace `source-section` areas with simplified `nt-*` markup if the goal is 1:1 visual match with the original static site.

3. When adding PHP attribute definitions to `register_block_type`, match the JS `registerBlockType` attribute types exactly. Mismatches cause REST 400 errors for SSR blocks.

4. Because fast-mode uses Docker named volumes, local file changes do not appear in the running WordPress container until `docker cp` sync is run.

5. Nginx fastcgi cache can keep old HTML. If the frontend does not reflect changes, clear `/var/cache/nginx` files and flush WordPress object cache.

6. If the Site Editor saves a template override in the DB, it can hide changes made to `templates/front-page.html`. Check `wp_template` posts and remove the relevant override only when you want WordPress to use theme files again.

7. `styles.css` must be in `add_editor_style()` as well as `wp_enqueue_scripts`. WP 7.0 auto-load into editor iframe is unreliable for SSR block previews — without it blocks show unstyled HTML.

8. Navigation HTML (sidebar-nav, primary-nav) is stored in `parts/header-sidebar-nav.html` and `parts/header-primary-nav.html`. Edit those files to update the navigation. PHP reads and normalizes `localhost.com` → `home_url()` and `assets/` → theme URL at render time.

16. Converted all three remaining `source-section` blocks to real Gutenberg blocks (Этап 1):

**16a. `new-theme/site-footer` (Task 1.1)**

Replaced footer `source-section` (8.8KB base64) with a field-based `new-theme/site-footer` block.

Editable fields: logo, logoAlt, disclaimerText, infoLinks (INFORMAÇÕES group), moreLinks (Saber Mais group), externalLinks (country links with flags), footerLinks (bottom nav), copyright.

PHP renderer outputs original `.site-footer` CSS classes — `nt-footer` removed.

**16b. `new-theme/site-header` (Task 1.2)**

Replaced header `source-section` (68KB base64) with `new-theme/age-disclaimer` + `new-theme/site-header` blocks.

Navigation HTML (mega menu sidebar-nav 36KB + primary-nav 31KB) extracted to:
- `parts/header-sidebar-nav.html`
- `parts/header-primary-nav.html`

PHP reads these files and normalises paths at render time. Editable fields: logo (dark), logoLight (light), logoAlt.

`nt-header` CSS classes removed — PHP now outputs `.header.header--initial.header--with-disclaimer.header--dark`.

**16c. `new-theme/live-odds` (Task 1.3)**

Replaced live-odds `source-section` (58KB base64) with a `new-theme/live-odds` block.

Widget HTML stored in `parts/live-odds.html`. Block has no editable attributes — it renders the static tip data from file and the `liveodds-tips.js` script initialises the slick slider and removes expired tips at runtime. Editor shows a placeholder instead of SSR (HTML is too large for REST GET and the content is dynamic).

Result: `source-section` count on frontend = 0.

**16d. Editor styles fix**

Added `assets/css/styles.css` to `add_editor_style()`. Without this, SSR block previews in the editor showed unstyled HTML. On the frontend `styles.css` is still loaded exactly once (via `wp_enqueue_scripts`).

17. Created inner-page templates (Этап 2):

- `parts/header.html` — updated to new `site-header` attribute schema (logo, logoLight, logoAlt)
- `parts/footer.html` — updated to new `site-footer` attribute schema (all 8 fields)
- `templates/index.html` — fallback blog listing (3-column post grid + pagination)
- `templates/single.html` — single post (featured image + title + date + categories + content)
- `templates/page.html` — static page (title + content)
- `templates/archive.html` — category/tag archive (title + description + 3-column grid + pagination)

All inner-page templates use `wp:template-part` for header and footer, and wrap the content area with `new-theme/page-main` to get the original `.page__content` → `.page__content-area` → `.page__main` wrapper structure.

## Current Important Files

- `functions.php`
- `assets/js/blocks.js`
- `templates/front-page.html`
- `templates/single.html`
- `templates/page.html`
- `templates/archive.html`
- `templates/index.html`
- `parts/header.html`
- `parts/footer.html`
- `parts/header-sidebar-nav.html` — mega menu HTML (read by `new-theme/site-header`)
- `parts/header-primary-nav.html` — primary nav HTML (read by `new-theme/site-header`)
- `parts/live-odds.html` — live odds widget HTML (read by `new-theme/live-odds`)
- `assets/css/styles.css`
- `assets/css/block-theme.css`
- `assets/css/editor.css`
- `theme.json`
- `style.css`
