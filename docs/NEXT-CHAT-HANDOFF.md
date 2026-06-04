# Next Chat Handoff - Production Architecture

Use this document as the compact starting context for a new chat. Do not reload the full migration changelog unless debugging historical decisions.

## Current Goal

Continue implementing `docs/wp-block-theme-technical-spec.md`.

The next logical production steps are:

1. Start splitting editor registration from `assets/js/blocks.js` into per-block bundles.
2. Start splitting CSS into `global.css`, `legacy-reference.css`, editor-only CSS, and block-local CSS.
3. Continue replacing legacy file-backed sections with editable data models, especially mega menu and live odds.

## Current State

- Theme path: `C:\WorkProjects\wordpress\themes\new-theme`
- Running WP container expects sync because Docker fast mode uses a named volume.
- Theme is a WordPress block theme with FSE templates and parts.
- Existing visual output is intentionally preserved via legacy CSS classes from `assets/css/styles.css`.
- All custom blocks have `blocks/<slug>/block.json`.
- PHP block registration uses metadata paths in `functions.php`.
- Render callbacks still live in `functions.php`.
- Editor registration still lives in one file: `assets/js/blocks.js`.
- `new-theme/source-section` is hidden from inserter and not used on the current homepage.
- `offer-list`, `related-links`, `news-slider`, and `live-odds` scripts are registered globally but enqueued from render callbacks.
- Starter pattern exists: `patterns/page-casino-legal.php`.

## What Was Recently Done

- `new-theme/offer-list` now supports reusable CPT/query source through `casino_offer`.
- CPT `casino_offer` has REST-registered meta and an admin meta box.
- `new-theme/hero` now supports:
  - Media Library background image;
  - `imageId`;
  - overlay color and opacity;
  - top spacer;
  - dark/light variant;
  - fallback to the legacy default image if saved image is empty.
- Editor image controls were moved from manual path fields to WordPress Media Library controls.
- New images are now selected via Media Library for:
  - site header dark/light logo;
  - hero background;
  - offer-card logo;
  - offer-list attribute-card logos and payment icons;
  - content-section image;
  - related-links item images;
  - news-slider item images;
  - link-card image;
  - site-footer logo;
  - site-footer external country flag images.
- CPT `casino_offer` meta box now uses Media Library for:
  - `logo`;
  - `payments` image list.
- Added `assets/js/admin-offer-media.js` for CPT media controls.
- Updated `docs/TASKS.md` and `docs/ARCHITECTURE.md`.
- Added `docs/MEDIA-LIBRARY-MIGRATION.md`.

## Important Compatibility Rule

Do not remove legacy theme-relative image path support yet.

The editor UI should no longer expose manual image path fields for new image selection, but old imported content still stores many `assets/...` values. PHP renderers and editor previews must continue accepting those values through `new_theme_asset_url()` and `normalizePreviewHtml()`.

Current storage model:

- Single images store Media Library URL in the existing string attribute/meta field.
- Single images may also store attachment ID in a companion field such as `imageId`, `logoId`, or `logoLightId`.
- Repeated item images store URL plus optional item-level `imageId`.
- Payment icon lists still store newline-separated URLs in `payments`, preserving the existing PHP render path.

## Files To Read First

1. `docs/wp-block-theme-technical-spec.md`
2. `docs/NEXT-CHAT-HANDOFF.md`
3. `docs/MEDIA-LIBRARY-MIGRATION.md`
4. `functions.php`
5. `assets/js/blocks.js`
6. `blocks/hero/block.json`
7. `blocks/offer-card/block.json`
8. `templates/front-page.html`

Optional only if needed:

- `docs/ARCHITECTURE.md`
- `docs/TASKS.md`
- `assets/js/admin-offer-media.js`
- `assets/js/offer-list.js`
- `assets/css/styles.css`

Avoid loading `CHANGELOG-MIGRATION.md` unless historical context is required.

## Verified

These checks passed after syncing into Docker:

- `node --check assets\js\blocks.js`
- `node --check assets\js\admin-offer-media.js`
- JSON parse for `theme.json` and all `blocks/*/block.json`
- `php -l /var/www/html/wp-content/themes/new-theme/functions.php` inside `wordpress_app`
- WordPress block registry sees new media attributes.
- Frontend smoke test:
  - `status=200`
  - `page-hero=True`
  - `offer-card=True`
  - `site-footer=True`
  - `localhost.com=False`

## Sync And Verification Commands

After edits, sync local theme into Docker:

```powershell
docker cp C:\WorkProjects\wordpress\themes\new-theme wordpress_app:/var/www/html/wp-content/themes/
docker exec wordpress_app chown -R www-data:www-data /var/www/html/wp-content/themes/new-theme
```

Check syntax and block registration:

```powershell
node --check C:\WorkProjects\wordpress\themes\new-theme\assets\js\blocks.js
node --check C:\WorkProjects\wordpress\themes\new-theme\assets\js\admin-offer-media.js
docker exec wordpress_app php -l /var/www/html/wp-content/themes/new-theme/functions.php
docker exec wordpress_app php -r 'require "/var/www/html/wp-load.php"; do_action("init"); echo post_type_exists("casino_offer") ? "casino_offer=yes" : "casino_offer=no";'
```

Clear caches and smoke test:

```powershell
docker exec wordpress_app php -r 'require "/var/www/html/wp-load.php"; wp_cache_flush(); echo "wp cache flushed";'
docker exec wordpress_nginx sh -c 'find /var/cache/nginx -type f -delete'
```

```powershell
$r = Invoke-WebRequest -Uri http://localhost:8080/ -UseBasicParsing -TimeoutSec 30
$r.Content -match 'page-hero'
$r.Content -match 'offer-card'
$r.Content -match 'site-footer'
$r.Content -match 'localhost\.com'
```

Expected:

- `page-hero`: true
- `offer-card`: true
- `site-footer`: true
- `localhost.com`: false

## Important Constraints

- Preserve current frontend HTML/classes as much as possible.
- Do not remove `cards` attribute support in `offer-list` yet.
- Do not remove theme-relative image path compatibility until existing imported content is migrated.
- Avoid broad refactors of `blocks.js` unless the task is explicitly the per-block bundle split.
- Avoid reading the full legacy CSS unless a visual regression requires it.
