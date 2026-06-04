# Media Library Migration Notes

Date: 2026-06-03

## Scope

The editor UI now uses WordPress Media Library controls for image selection instead of manual path fields.

Covered areas:

- `new-theme/site-header`: dark logo, light logo.
- `new-theme/hero`: background image.
- `new-theme/offer-list`: attribute-card logos and payment icons.
- `new-theme/offer-card`: logo and payment icons.
- `new-theme/content-section`: section image.
- `new-theme/related-links`: item images.
- `new-theme/news-slider`: item images.
- `new-theme/link-card`: card image.
- `new-theme/site-footer`: logo and external country flag images.
- CPT `casino_offer`: `logo` and `payments` in the admin meta box.

## Implementation

Editor blocks:

- `assets/js/blocks.js` now has shared helpers:
  - `mediaImageControl()` for single images;
  - `mediaImagesControl()` for image lists.
- Manual image path inputs were removed from the editor UI.
- Media Library selections store the selected media URL in the existing string field.
- Single image selections also store attachment IDs in companion fields where the field is top-level:
  - `imageId`;
  - `logoId`;
  - `logoLightId`.
- Repeater item images may store item-level `imageId`.

CPT admin:

- `functions.php` now enqueues media controls only for `casino_offer` edit screens.
- `assets/js/admin-offer-media.js` opens the standard WordPress Media Library.
- `casino_offer.logo` stores a single selected media URL.
- `casino_offer.payments` stores selected media URLs as a newline-separated list.

Metadata updated:

- `blocks/site-header/block.json`
- `blocks/site-footer/block.json`
- `blocks/offer-card/block.json`
- `blocks/content-section/block.json`
- `blocks/link-card/block.json`
- `blocks/hero/block.json`

## Compatibility

Do not remove old path support yet.

Imported templates still contain many values such as `assets/img/...`. Frontend and editor preview compatibility is preserved by:

- `new_theme_asset_url()` in PHP render callbacks;
- `normalizePreviewHtml()` in editor preview code.

New UI selections should come from Media Library. Old path values are a temporary backward-compatibility layer for already imported content and local theme assets.

## Verification

Passed checks:

- `node --check assets/js/blocks.js`
- `node --check assets/js/admin-offer-media.js`
- JSON parse for `theme.json` and all `blocks/*/block.json`
- PHP lint in Docker:
  - `php -l /var/www/html/wp-content/themes/new-theme/functions.php`
- WordPress block registry sees new media attributes.
- Frontend smoke test after Docker sync:
  - `status=200`
  - `page-hero=True`
  - `offer-card=True`
  - `site-footer=True`
  - `localhost.com=False`

## Next Recommended Work

- Migrate actual saved content from theme-relative paths to Media Library attachment URLs when media is imported into WordPress.
- Split `assets/js/blocks.js` into per-block editor bundles.
- Split legacy CSS into global, editor-only, legacy-reference, and block-local files.
- Keep `source-section` hidden until old saved content is audited.
