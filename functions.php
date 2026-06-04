<?php
/**
 * Theme setup and asset loading.
 *
 * @package NewTheme
 */

if (!defined("ABSPATH")) {
    exit();
}

add_action("wp_enqueue_scripts", function (): void {
    wp_dequeue_script("wp-block-template-skip-link");
}, 100);


add_action("after_setup_theme", "new_theme_setup");
function new_theme_setup(): void
{
    add_theme_support("wp-block-styles");
    add_theme_support("editor-styles");
    add_theme_support("responsive-embeds");
    add_theme_support("post-thumbnails");
    add_theme_support("html5", ["comment-form", "comment-list", "gallery", "caption", "style", "script", "navigation-widgets"]);
    add_editor_style(["assets/css/global.css", "assets/css/legacy-reference.css", "assets/css/block-theme.css", "assets/css/editor.css"]);
}

add_action("wp_enqueue_scripts", "new_theme_enqueue_assets");
function new_theme_enqueue_assets(): void
{
    $theme_version = wp_get_theme()->get("Version");
    $asset_uri = get_template_directory_uri() . "/assets";
    $asset_dir = get_template_directory() . "/assets";

    $version = static function (string $relative_path) use ($theme_version, $asset_dir): string {
        $file = $asset_dir . $relative_path;

        return file_exists($file) ? (string) filemtime($file) : $theme_version;
    };

    wp_enqueue_style("new-theme-global", $asset_uri . "/css/global.css", [], $version("/css/global.css"));

    wp_enqueue_style("new-theme-legacy-reference", $asset_uri . "/css/legacy-reference.css", ["new-theme-global"], $version("/css/legacy-reference.css"));

    wp_enqueue_style("new-theme-block-theme", $asset_uri . "/css/block-theme.css", ["new-theme-legacy-reference"], $version("/css/block-theme.css"));

    wp_register_script("new-theme-slick", $asset_uri . "/js/slick.js", ["jquery"], $version("/js/slick.js"), true);

    wp_register_script("new-theme-news-slider", $asset_uri . "/js/news-slider.js", ["jquery", "new-theme-slick"], $version("/js/news-slider.js"), true);

    wp_register_script("new-theme-header", $asset_uri . "/js/header.js", ["jquery"], $version("/js/header.js"), true);

    wp_register_script("new-theme-lazy-media", $asset_uri . "/js/lazy-media.js", ["jquery"], $version("/js/lazy-media.js"), true);

    wp_register_script("new-theme-offer-listing", $asset_uri . "/js/offer-list.js", ["jquery"], $version("/js/offer-list.js"), true);

    wp_register_script("new-theme-internal-links", $asset_uri . "/js/internal-links.js", ["jquery"], $version("/js/internal-links.js"), true);

    wp_register_script("new-theme-liveodds-tips", $asset_uri . "/js/liveodds-tips.js", ["jquery", "new-theme-slick"], $version("/js/liveodds-tips.js"), true);

    wp_add_inline_script(
        "new-theme-liveodds-tips",
        "var liveodds_tips = " .
            wp_json_encode([
                "tipStatuses" => [
                    "live" => "Gyvai",
                    "upcoming" => "Netrukus",
                ],
            ]) .
            ";",
        "before",
    );
}

add_action("wp_head", "new_theme_render_favicons", 1);
function new_theme_render_favicons(): void
{
    $favicon_uri = get_template_directory_uri() . "/assets/img/favicon";

    printf('<link rel="icon" type="image/png" href="%s" sizes="96x96" />' . "\n", esc_url($favicon_uri . "/favicon-96x96.png"));
    printf('<link rel="icon" type="image/svg+xml" href="%s" />' . "\n", esc_url($favicon_uri . "/favicon.svg"));
    printf('<link rel="shortcut icon" href="%s" />' . "\n", esc_url($favicon_uri . "/favicon.ico"));
    printf('<link rel="apple-touch-icon" sizes="180x180" href="%s" />' . "\n", esc_url($favicon_uri . "/apple-touch-icon.png"));
    printf('<link rel="manifest" href="%s" />' . "\n", esc_url($favicon_uri . "/site.webmanifest"));
}

add_action("init", "new_theme_register_blocks");
function new_theme_register_blocks(): void
{
    $asset_dir = get_template_directory() . "/assets";
    $asset_uri = get_template_directory_uri() . "/assets";

    wp_register_script(
        "new-theme-blocks",
        $asset_uri . "/js/blocks.js",
        ["wp-blocks", "wp-block-editor", "wp-components", "wp-element", "wp-i18n", "wp-server-side-render"],
        file_exists($asset_dir . "/js/blocks.js") ? (string) filemtime($asset_dir . "/js/blocks.js") : wp_get_theme()->get("Version"),
        true,
    );

    wp_localize_script("new-theme-blocks", "newThemeEditor", [
        "themeUrl" => get_template_directory_uri(),
        "homeUrl" => home_url("/"),
    ]);

    $blocks = [
        "age-disclaimer" => "new_theme_render_age_disclaimer",
        "site-header" => "new_theme_render_site_header",
        "page-main" => "new_theme_render_page_main",
        "hero" => "new_theme_render_hero",
        "offer-list" => "new_theme_render_offer_list",
        "offer-card" => "new_theme_render_offer_card",
        "two-column-text" => "new_theme_render_two_column_text",
        "about-list" => "new_theme_render_about_list",
        "info-grid" => "new_theme_render_info_grid",
        "content-section" => "new_theme_render_content_section",
        "related-links" => "new_theme_render_related_links",
        "data-table" => "new_theme_render_data_table",
        "news-slider" => "new_theme_render_news_slider",
        "card-grid" => "new_theme_render_card_grid",
        "link-card" => "new_theme_render_link_card",
        "faq" => "new_theme_render_faq",
        "faq-item" => "new_theme_render_faq_item",
        "site-footer" => "new_theme_render_site_footer",
        "live-odds" => "new_theme_render_live_odds",
    ];

    foreach ($blocks as $slug => $callback) {
        $metadata_path = get_template_directory() . "/blocks/" . $slug;

        register_block_type($metadata_path, [
            "editor_script" => "new-theme-blocks",
            "render_callback" => $callback,
            "supports" => [
                "html" => false,
            ],
        ]);
    }
}

add_filter("block_categories_all", "new_theme_register_block_category");
function new_theme_register_block_category(array $categories): array
{
    $category_slugs = wp_list_pluck($categories, "slug");

    if (in_array("new-theme", $category_slugs, true)) {
        return $categories;
    }

    array_unshift($categories, [
        "slug" => "new-theme",
        "title" => __("New Theme", "new-theme"),
        "icon" => "layout",
    ]);

    return $categories;
}

add_action("init", "new_theme_register_pattern_categories");
function new_theme_register_pattern_categories(): void
{
    if (function_exists("register_block_pattern_category")) {
        register_block_pattern_category("new-theme", [
            "label" => __("New Theme", "new-theme"),
        ]);
    }
}

add_action("init", "new_theme_register_offer_model", 0);
function new_theme_register_offer_model(): void
{
    register_post_type("casino_offer", [
        "labels" => [
            "name" => __("Казино-офферы", "new-theme"),
            "singular_name" => __("Казино-оффер", "new-theme"),
            "add_new_item" => __("Добавить казино-оффер", "new-theme"),
            "edit_item" => __("Редактировать казино-оффер", "new-theme"),
        ],
        "public" => true,
        "show_in_rest" => true,
        "menu_icon" => "dashicons-tickets-alt",
        "supports" => ["title", "thumbnail", "excerpt", "page-attributes", "custom-fields"],
        "rewrite" => [
            "slug" => "casino-offers",
            "with_front" => false,
        ],
    ]);

    foreach (new_theme_offer_meta_fields() as $meta_key => $field) {
        register_post_meta("casino_offer", $meta_key, [
            "type" => $field["type"],
            "single" => true,
            "show_in_rest" => [
                "schema" => [
                    "type" => $field["type"],
                ],
            ],
            "sanitize_callback" => $field["sanitize_callback"],
            "auth_callback" => static function (): bool {
                return current_user_can("edit_posts");
            },
        ]);
    }

    register_taxonomy("offer_category", "casino_offer", [
        "labels" => [
            "name" => __("Категории офферов", "new-theme"),
            "singular_name" => __("Категория оффера", "new-theme"),
        ],
        "public" => true,
        "show_in_rest" => true,
        "hierarchical" => false,
        "rewrite" => ["slug" => "offer-category"],
    ]);

    register_taxonomy("country_market", "casino_offer", [
        "labels" => [
            "name" => __("Страна / рынок", "new-theme"),
            "singular_name" => __("Страна / рынок", "new-theme"),
        ],
        "public" => true,
        "show_in_rest" => true,
        "hierarchical" => false,
        "rewrite" => ["slug" => "country-market"],
    ]);
}

function new_theme_offer_meta_fields(): array
{
    return [
        "logo" => [
            "label" => __("Логотип", "new-theme"),
            "type" => "string",
            "control" => "media",
            "sanitize_callback" => "new_theme_sanitize_offer_url_meta",
        ],
        "rating" => [
            "label" => __("Рейтинг", "new-theme"),
            "type" => "string",
            "control" => "text",
            "sanitize_callback" => "new_theme_sanitize_offer_rating_meta",
        ],
        "bonus" => [
            "label" => __("Бонус", "new-theme"),
            "type" => "string",
            "control" => "text",
            "sanitize_callback" => "new_theme_sanitize_offer_text_meta",
        ],
        "features" => [
            "label" => __("Особенности", "new-theme"),
            "type" => "string",
            "control" => "textarea",
            "sanitize_callback" => "new_theme_sanitize_offer_textarea_meta",
        ],
        "payments" => [
            "label" => __("Иконки платежей", "new-theme"),
            "type" => "string",
            "control" => "media_list",
            "sanitize_callback" => "new_theme_sanitize_offer_textarea_meta",
        ],
        "offer_url" => [
            "label" => __("URL оффера", "new-theme"),
            "type" => "string",
            "control" => "text",
            "sanitize_callback" => "new_theme_sanitize_offer_url_meta",
        ],
        "review_url" => [
            "label" => __("URL обзора", "new-theme"),
            "type" => "string",
            "control" => "text",
            "sanitize_callback" => "new_theme_sanitize_offer_url_meta",
        ],
        "license_status" => [
            "label" => __("Статус лицензии", "new-theme"),
            "type" => "string",
            "control" => "text",
            "sanitize_callback" => "new_theme_sanitize_offer_text_meta",
        ],
        "is_legal" => [
            "label" => __("Легальный оффер", "new-theme"),
            "type" => "boolean",
            "control" => "checkbox",
            "sanitize_callback" => "new_theme_sanitize_offer_bool_meta",
        ],
    ];
}

function new_theme_sanitize_offer_text_meta(mixed $value): string
{
    return sanitize_text_field((string) $value);
}

function new_theme_sanitize_offer_textarea_meta(mixed $value): string
{
    return sanitize_textarea_field((string) $value);
}

function new_theme_sanitize_offer_url_meta(mixed $value): string
{
    return esc_url_raw((string) $value);
}

function new_theme_sanitize_offer_rating_meta(mixed $value): string
{
    $value = trim(str_replace(",", ".", (string) $value));

    if ("" === $value) {
        return "";
    }

    $rating = max(0, min(5, (float) $value));

    return rtrim(rtrim(number_format($rating, 1, ".", ""), "0"), ".");
}

function new_theme_sanitize_offer_bool_meta(mixed $value): bool
{
    return (bool) rest_sanitize_boolean($value);
}

add_action("add_meta_boxes", "new_theme_add_offer_meta_box");
function new_theme_add_offer_meta_box(): void
{
    add_meta_box("new-theme-casino-offer-details", __("Детали казино-оффера", "new-theme"), "new_theme_render_offer_meta_box", "casino_offer", "normal", "high");
}

add_action("admin_enqueue_scripts", "new_theme_enqueue_offer_admin_assets");
function new_theme_enqueue_offer_admin_assets(string $hook_suffix): void
{
    if (!in_array($hook_suffix, ["post.php", "post-new.php"], true)) {
        return;
    }

    $screen = get_current_screen();
    if (!$screen || "casino_offer" !== $screen->post_type) {
        return;
    }

    $script_path = get_template_directory() . "/assets/js/admin-offer-media.js";

    wp_enqueue_media();
    wp_enqueue_script(
        "new-theme-offer-media",
        get_template_directory_uri() . "/assets/js/admin-offer-media.js",
        [],
        file_exists($script_path) ? (string) filemtime($script_path) : wp_get_theme()->get("Version"),
        true,
    );
}

function new_theme_render_offer_media_control(string $meta_key, string $value, bool $multiple = false): void
{
    $input_id = "new-theme-offer-" . $meta_key;
    $items = $multiple ? new_theme_csv_lines($value) : array_filter([trim($value)]);

    echo '<input type="hidden" id="' . esc_attr($input_id) . '" name="new_theme_offer_meta[' . esc_attr($meta_key) . ']" value="' . esc_attr($value) . '">';
    echo '<div class="new-theme-media-field" data-target="' . esc_attr($input_id) . '" data-multiple="' . ($multiple ? "1" : "0") . '">';
    echo '<div class="new-theme-media-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">';
    foreach ($items as $item) {
        echo '<img src="' . esc_url(new_theme_asset_url($item)) . '" alt="" style="width:72px;height:48px;object-fit:contain;border:1px solid #dcdcde;border-radius:4px;padding:4px;background:#fff;">';
    }
    echo "</div>";
    echo '<button type="button" class="button js-new-theme-media-select">' . esc_html($multiple ? __("Выбрать изображения", "new-theme") : __("Выбрать изображение", "new-theme")) . "</button> ";
    echo '<button type="button" class="button-link-delete js-new-theme-media-remove">' . esc_html__("Удалить", "new-theme") . "</button>";
    echo "</div>";
}

function new_theme_render_offer_meta_box(WP_Post $post): void
{
    wp_nonce_field("new_theme_save_offer_meta", "new_theme_offer_meta_nonce");

    echo '<table class="form-table"><tbody>';
    foreach (new_theme_offer_meta_fields() as $meta_key => $field) {
        $value = get_post_meta($post->ID, $meta_key, true);

        echo '<tr><th scope="row"><label for="new-theme-offer-' . esc_attr($meta_key) . '">' . esc_html($field["label"]) . "</label></th><td>";
        if ("media" === $field["control"]) {
            new_theme_render_offer_media_control($meta_key, (string) $value, false);
        } elseif ("media_list" === $field["control"]) {
            new_theme_render_offer_media_control($meta_key, (string) $value, true);
        } elseif ("textarea" === $field["control"]) {
            echo '<textarea class="large-text" rows="4" id="new-theme-offer-' .
                esc_attr($meta_key) .
                '" name="new_theme_offer_meta[' .
                esc_attr($meta_key) .
                ']">' .
                esc_textarea((string) $value) .
                "</textarea>";
            echo '<p class="description">' . esc_html__("Указывайте по одному элементу в строке или через запятую.", "new-theme") . "</p>";
        } elseif ("checkbox" === $field["control"]) {
            echo '<label><input type="checkbox" id="new-theme-offer-' .
                esc_attr($meta_key) .
                '" name="new_theme_offer_meta[' .
                esc_attr($meta_key) .
                ']" value="1" ' .
                checked((bool) $value, true, false) .
                "> " .
                esc_html__("Включено", "new-theme") .
                "</label>";
        } else {
            echo '<input class="regular-text" type="text" id="new-theme-offer-' .
                esc_attr($meta_key) .
                '" name="new_theme_offer_meta[' .
                esc_attr($meta_key) .
                ']" value="' .
                esc_attr((string) $value) .
                '">';
        }
        echo "</td></tr>";
    }
    echo "</tbody></table>";
}

add_action("save_post_casino_offer", "new_theme_save_offer_meta_box");
function new_theme_save_offer_meta_box(int $post_id): void
{
    if (defined("DOING_AUTOSAVE") && DOING_AUTOSAVE) {
        return;
    }

    if (empty($_POST["new_theme_offer_meta_nonce"]) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST["new_theme_offer_meta_nonce"])), "new_theme_save_offer_meta")) {
        return;
    }

    if (!current_user_can("edit_post", $post_id)) {
        return;
    }

    $submitted = isset($_POST["new_theme_offer_meta"]) && is_array($_POST["new_theme_offer_meta"]) ? wp_unslash($_POST["new_theme_offer_meta"]) : [];

    foreach (new_theme_offer_meta_fields() as $meta_key => $field) {
        if ("checkbox" === $field["control"]) {
            update_post_meta($post_id, $meta_key, !empty($submitted[$meta_key]));
            continue;
        }

        $value = isset($submitted[$meta_key]) ? call_user_func($field["sanitize_callback"], $submitted[$meta_key]) : "";
        update_post_meta($post_id, $meta_key, $value);
    }
}

function new_theme_normalize_source_html(string $html): string
{
    $html = str_replace(
        ["https://apostalegal.pt/wp-content/uploads/2021/08/betano-square-logo.png", "https://apostalegal.pt/wp-content/uploads/2021/08/betano-square-logo.webp"],
        "assets/img/2021/08/betano-logo.svg",
        $html,
    );
    $theme_path = str_replace('/', '\\/', rtrim(wp_make_link_relative(get_template_directory_uri()), '/'));
    $html = str_replace("assets\\/", $theme_path . "\\/assets\\/", $html);
    $html = str_replace("assets/", get_template_directory_uri() . "/assets/", $html);
    $html = str_replace("localhost.com/", home_url("/"), $html);
    $html = str_replace("localhost.com", home_url("/"), $html);

    return $html;
}

function new_theme_content_html(string $html): string
{
    return wp_kses_post(new_theme_normalize_source_html($html));
}

function new_theme_normalize_url(string $url): string
{
    return new_theme_normalize_source_html($url);
}

function new_theme_nav_url(string $url): string
{
    $url = trim($url);
    if ("" === $url || "#" === $url) {
        return "#";
    }
    if (0 === strpos($url, "http://") || 0 === strpos($url, "https://")) {
        return esc_url($url);
    }
    if ("/" === $url[0]) {
        return esc_url(home_url($url));
    }
    return "#";
}

function new_theme_resolve_srcset(string $srcset): string
{
    return preg_replace_callback("/assets\/\S+/", fn($m) => new_theme_asset_url($m[0]), $srcset);
}

function new_theme_render_nav_icon(array $item): string
{
    $icon = trim($item["icon"] ?? "");
    if ("" === $icon) {
        return "";
    }
    $webp = trim($item["iconWebp"] ?? "");
    $srcset = trim($item["iconSrcset"] ?? "");
    $sizes = trim($item["iconSizes"] ?? "");
    $width = absint($item["iconWidth"] ?? 24);
    $height = absint($item["iconHeight"] ?? 24);
    $ext = strtolower(pathinfo($icon, PATHINFO_EXTENSION));
    $cls = "svg" === $ext ? "_mi _before _svg" : "_mi _before _image";
    $src = esc_url(new_theme_asset_url($icon));

    if ("" !== $webp) {
        $wsrc = new_theme_resolve_srcset($webp);
        $sattr = sprintf('srcset="%s" type="image/webp"', esc_attr($wsrc));
        if ("" !== $sizes) {
            $sattr .= sprintf(' sizes="%s"', esc_attr($sizes));
        }
        $iattr = sprintf('width="%d" height="%d" src="%s" class="%s" alt="" aria-hidden="true" decoding="async"', $width, $height, $src, esc_attr($cls));
        if ("" !== $srcset) {
            $iattr .= sprintf(' srcset="%s"', esc_attr(new_theme_resolve_srcset($srcset)));
        }
        if ("" !== $sizes) {
            $iattr .= sprintf(' sizes="%s"', esc_attr($sizes));
        }
        return sprintf("<picture><source %s><img %s></picture>", $sattr, $iattr);
    }

    $iattr = sprintf('src="%s" class="%s" aria-hidden="true" alt="" width="%d" height="%d"', $src, esc_attr($cls), $width, $height);
    if ("" !== $srcset) {
        $iattr .= sprintf(' srcset="%s" decoding="async"', esc_attr(new_theme_resolve_srcset($srcset)));
    }
    return sprintf("<img %s>", $iattr);
}

function new_theme_render_nav_item(array $item, int $depth, bool $is_mobile): string
{
    $label = $item["label"] ?? "";
    $url = new_theme_nav_url($item["url"] ?? "#");
    $children = array_values(array_filter((array) ($item["children"] ?? []), "is_array"));
    $has_ch = !empty($children);
    $badge = trim($item["badge"] ?? "");
    $is_new = !empty($item["isNew"]);
    $is_mega = !empty($item["isMega"]);
    $is_foot = !empty($item["isFooter"]);
    $is_mob2 = !empty($item["isMobileSecondLevel"]);

    $li = [];
    if ($is_foot) {
        $li[] = "nav-menu__item--footer";
    }
    if (0 === $depth) {
        if ($is_new) {
            $li[] = "nav-menu__item--new";
        }
        if ($is_mega) {
            $li[] = "nav-menu__item--mega";
        }
        if ($is_mob2) {
            $li[] = "nav-menu__item--mobile-second-level";
        }
    } elseif ($has_ch || $is_mob2) {
        $li[] = "nav-menu__item--mobile-second-level";
    }
    $li[] = "nav-menu__item";
    if ($has_ch) {
        $li[] = "nav-menu__item--has-children";
        $li[] = $depth > 0 && $is_mobile ? "nav-menu__submenu-wrapper" : "dropdown";
    }

    $html = sprintf('<li class="%s">', esc_attr(implode(" ", $li)));

    $a = sprintf('title="%s" href="%s"', esc_attr($label), $url);
    if (0 === $depth && $has_ch) {
        $a .= ' data-toggle="dropdown" class="dropdown-toggle" aria-haspopup="true"';
    } elseif ($depth > 0 && $has_ch && $is_mobile) {
        $a .= ' data-toggle="dropdown-submenu" class="nav-menu__submenu-toggle" aria-haspopup="true"';
    }

    $html .= sprintf("<a %s>", $a);
    $html .= new_theme_render_nav_icon($item);
    $html .= sprintf("<span>%s</span>", esc_html($label));

    if ("" !== $badge) {
        $bg = esc_attr($item["badgeBg"] ?? "#12a96a");
        $color = esc_attr($item["badgeColor"] ?? "#FFF");
        $html .= sprintf('<span class="header__badge" data-badge-text="%s" style="--header-badge-bg-color:%s; --header-badge-text-color:%s;"></span>', esc_attr($badge), $bg, $color);
    }

    if ($has_ch) {
        $html .= '<span class="nav-menu__caret"></span>';
    }

    $html .= "</a>";

    if ($has_ch) {
        $ul_cls = $depth > 0 && $is_mobile ? "nav-menu__submenu" : "dropdown-menu";
        $html .= sprintf('<ul role="menu" class="%s">', esc_attr($ul_cls));
        foreach ($children as $child) {
            $html .= new_theme_render_nav_item($child, $depth + 1, $is_mobile);
        }
        $html .= "</ul>";
    }

    $html .= "</li>";
    return $html;
}

function new_theme_asset_url(string $path): string
{
    $path = trim($path);

    if ("" === $path) {
        return "";
    }

    $asset_replacements = [
        "assets/img/2021/08/betano-square-logo.png" => "assets/img/2021/08/betano-logo.svg",
    ];

    $path = $asset_replacements[$path] ?? $path;

    if (0 === strpos($path, "http://") || 0 === strpos($path, "https://") || 0 === strpos($path, "/")) {
        return $path;
    }

    return get_template_directory_uri() . "/" . ltrim($path, "/");
}

function new_theme_csv_lines(string $value): array
{
    $items = preg_split('/\r\n|\r|\n|,/', $value);
    return array_values(array_filter(array_map("trim", is_array($items) ? $items : [])));
}

function new_theme_array_items(mixed $items): array
{
    return is_array($items) ? array_values($items) : [];
}

function new_theme_offer_card_has_content(array $card): bool
{
    $fields = ["name", "logo", "features", "payments", "bonus", "offerUrl", "reviewUrl"];

    foreach ($fields as $field) {
        if (isset($card[$field]) && "" !== trim((string) $card[$field])) {
            return true;
        }
    }

    return isset($card["rating"]) && "" !== trim((string) $card["rating"]);
}

function new_theme_offer_card_is_renderable(array $card): bool
{
    if (empty($card["name"]) || "" === trim((string) $card["name"])) {
        return false;
    }

    return true;
}

function new_theme_compact_attribute_offer_cards(array $cards): array
{
    $compacted = [];
    $current = [];

    foreach ($cards as $card) {
        if (!is_array($card) || !new_theme_offer_card_has_content($card)) {
            continue;
        }

        $has_new_rating =
            isset($card["rating"]) &&
            "" !== trim((string) $card["rating"]) &&
            empty($card["name"]) &&
            empty($card["logo"]) &&
            empty($card["features"]) &&
            empty($card["payments"]) &&
            empty($card["bonus"]);

        if ($has_new_rating && new_theme_offer_card_is_renderable($current)) {
            $compacted[] = $current;
            $current = [];
        }

        foreach (["name", "logo", "features", "payments", "bonus", "offerUrl", "reviewUrl", "rating"] as $field) {
            if (isset($card[$field]) && "" !== trim((string) $card[$field])) {
                $current[$field] = $card[$field];
            }
        }
    }

    if (new_theme_offer_card_is_renderable($current)) {
        $compacted[] = $current;
    }

    if (!empty($compacted)) {
        return $compacted;
    }

    return array_values(array_filter($cards, static fn($card): bool => is_array($card) && new_theme_offer_card_is_renderable($card)));
}

function new_theme_offer_list_limit(mixed $value): int
{
    $limit = absint($value);

    if (0 === $limit) {
        $limit = 15;
    }

    return max(1, min(50, $limit));
}

function new_theme_offer_query_args(array $attributes): array
{
    $order_by = $attributes["orderBy"] ?? "menu_order";
    $order = strtoupper((string) ($attributes["order"] ?? "ASC"));
    $order = in_array($order, ["ASC", "DESC"], true) ? $order : "ASC";

    $args = [
        "post_type" => "casino_offer",
        "post_status" => "publish",
        "posts_per_page" => new_theme_offer_list_limit($attributes["limit"] ?? 15),
        "order" => $order,
        "ignore_sticky_posts" => true,
        "no_found_rows" => true,
    ];

    if ("rating" === $order_by) {
        $args["meta_key"] = "rating";
        $args["orderby"] = "meta_value_num";
    } elseif ("bonus" === $order_by) {
        $args["orderby"] = "menu_order";
    } elseif (in_array($order_by, ["date", "title", "menu_order"], true)) {
        $args["orderby"] = $order_by;
    } else {
        $args["orderby"] = "menu_order";
    }

    return $args;
}

function new_theme_offer_post_to_card(WP_Post $post): array
{
    $logo = (string) get_post_meta($post->ID, "logo", true);
    if ("" === $logo) {
        $logo = (string) get_the_post_thumbnail_url($post->ID, "medium");
    }

    $review_url = (string) get_post_meta($post->ID, "review_url", true);
    if ("" === $review_url) {
        $review_url = get_permalink($post);
    }

    $offer_url = (string) get_post_meta($post->ID, "offer_url", true);
    if ("" === $offer_url) {
        $offer_url = "#";
    }

    return [
        "name" => get_the_title($post),
        "logo" => $logo,
        "rating" => (string) get_post_meta($post->ID, "rating", true),
        "bonus" => (string) get_post_meta($post->ID, "bonus", true),
        "features" => (string) get_post_meta($post->ID, "features", true),
        "payments" => (string) get_post_meta($post->ID, "payments", true),
        "offerUrl" => $offer_url,
        "reviewUrl" => $review_url,
        "licenseStatus" => (string) get_post_meta($post->ID, "license_status", true),
        "isLegal" => (bool) get_post_meta($post->ID, "is_legal", true),
    ];
}

function new_theme_query_offer_cards(array $attributes): array
{
    $query = new WP_Query(new_theme_offer_query_args($attributes));
    $cards = [];

    foreach ($query->posts as $post) {
        if ($post instanceof WP_Post) {
            $cards[] = new_theme_offer_post_to_card($post);
        }
    }

    if ("bonus" === ($attributes["orderBy"] ?? "") && count($cards) > 1) {
        $desc = "DESC" === strtoupper((string) ($attributes["order"] ?? "ASC"));
        usort($cards, static function (array $a, array $b) use ($desc): int {
            $av = (float) preg_replace('/[^0-9.]/', '', $a["bonus"]);
            $bv = (float) preg_replace('/[^0-9.]/', '', $b["bonus"]);
            return $desc ? $bv <=> $av : $av <=> $bv;
        });
    }

    return $cards;
}

function new_theme_hex_to_rgba(string $hex, float $opacity): string
{
    $hex = sanitize_hex_color($hex);
    if (!$hex) {
        $hex = "#000000";
    }

    $opacity = max(0, min(1, $opacity));
    $value = ltrim($hex, "#");

    if (3 === strlen($value)) {
        $value = $value[0] . $value[0] . $value[1] . $value[1] . $value[2] . $value[2];
    }

    $red = hexdec(substr($value, 0, 2));
    $green = hexdec(substr($value, 2, 2));
    $blue = hexdec(substr($value, 4, 2));

    return sprintf("rgba(%d, %d, %d, %.3F)", $red, $green, $blue, $opacity);
}

function new_theme_normalize_schema_value(mixed $value): mixed
{
    if (is_string($value)) {
        if ("http://schema.org" === $value) {
            return "https://schema.org";
        }
        if (str_starts_with($value, "https://apostalegal.pt")) {
            return home_url(substr($value, strlen("https://apostalegal.pt")) ?: "/");
        }
        if (str_starts_with($value, "assets/")) {
            return get_template_directory_uri() . "/" . $value;
        }
        return $value;
    }
    if (is_array($value)) {
        foreach ($value as $k => $v) {
            $value[$k] = new_theme_normalize_schema_value($v);
        }
        return $value;
    }
    return $value;
}

function new_theme_render_page_main(array $attributes, string $content): string
{
    $schema = $attributes["schema"] ?? "";

    $html = '<main id="content" class="page__content"><div class="page__overlay"></div><div id="primary" class="page__content-area">';
    $html .= '<section id="main" class="page__main header--dark" role="main">';
    $html .= $content;
    $html .= "</section><!-- #main --></div><!-- #primary -->";

    if ($schema) {
        $schema_data = json_decode((string) $schema, true) ?: [];
        $schema_data = new_theme_normalize_schema_value($schema_data);
        $html .= '<script class="schema-data" type="application/ld+json">' . wp_json_encode($schema_data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES) . "</script>";
    }

    $html .= "</main>";

    return $html;
}

function new_theme_render_age_disclaimer(array $attributes): string
{
    $text = $attributes["text"] ?? "ZAISKITE ATSAKINGAI";
    $link_text = $attributes["linkText"] ?? "YRA KOMERCINIO TURINIO";
    $link_url = $attributes["linkUrl"] ?? "/sobre-nos/";

    return sprintf(
        '<div class="age-disclaimer"><div class="container"><span>+18</span>%s | <a href="%s">%s</a></div></div>',
        esc_html($text),
        esc_url(new_theme_normalize_url($link_url)),
        esc_html($link_text),
    );
}

function new_theme_render_site_header(array $attributes): string
{
    wp_enqueue_script("new-theme-header");

    $logo = new_theme_asset_url($attributes["logo"] ?? "assets/img/ggbet-logo.svg");
    $logo_light = new_theme_asset_url($attributes["logoLight"] ?? "assets/img/ggbet-logo.svg");
    $logo_alt = $attributes["logoAlt"] ?? "GGBET";
    $items = array_values(array_filter((array) ($attributes["menuItems"] ?? []), "is_array"));

    if (empty($items)) {
        static $sidebar_nav_cache = null, $primary_nav_cache = null;
        if (null === $sidebar_nav_cache) {
            $dir = get_template_directory();
            $sidebar_nav_cache = new_theme_normalize_source_html((string) file_get_contents($dir . "/parts/header-sidebar-nav.html"));
            $primary_nav_cache = new_theme_normalize_source_html((string) file_get_contents($dir . "/parts/header-primary-nav.html"));
        }
        $sidebar_nav = $sidebar_nav_cache;
        $primary_nav = $primary_nav_cache;
    } else {
        $sb = "";
        $pn = "";
        foreach ($items as $item) {
            $sb .= new_theme_render_nav_item($item, 0, true);
            $pn .= new_theme_render_nav_item($item, 0, false);
        }
        $sidebar_nav = '<div class="sidebar-nav layout__row-item-padding"><div class="container"><div class="row" data-location="mega menu"><div id="sidebarNavBar" class="layout__row-item-padding">';
        $sidebar_nav .= '<ul id="sidebar-nav" class="sidebar-nav__list">' . $sb . "</ul>";
        $sidebar_nav .= "</div></div></div></div>";
        $primary_nav = '<nav class="primary-nav header__nav navbar navbar-expand-lg navbar-light section--light layout__row-item-padding">';
        $primary_nav .= '<div id="primaryNavBar" class="nav-menu__header-container">';
        $primary_nav .= '<ul id="primary-menu" class="sidebar-nav__list">' . $pn . "</ul>";
        $primary_nav .= "</div>";
        $primary_nav .=
            '<button class="navbar-toggler" type="button" aria-expanded="false" aria-label="Perjungti navigacija" style="--header-mobile-hamburguer-icon-bg-color:#11a869"><span></span><span></span><span></span></button>';
        $primary_nav .= "</nav>";
    }

    $html = '<header class="header header--initial header--with-disclaimer header--dark">';
    $html .= '<div class="container"><div class="row">';
    $html .= $sidebar_nav;
    $html .= sprintf(
        '<a class="header__brand brand layout__row-item-padding" href="%s"><img class="brand__img" src="%s" alt="%s" width="82" height="32"><img class="brand__img--light" width="82" height="32" src="%s" alt="%s"></a>',
        esc_url(home_url("/")),
        esc_url($logo),
        esc_attr($logo_alt),
        esc_url($logo_light),
        esc_attr($logo_alt),
    );
    $html .= $primary_nav;
    $html .= "</div></div></header>";

    return $html;
}

function new_theme_render_hero(array $attributes): string
{
    $image_path = trim((string) ($attributes["image"] ?? ""));
    if ("" === $image_path) {
        $image_path = "assets/img/2022/01/roleta-casino-online.png";
    }

    $image = new_theme_asset_url($image_path);
    $title = $attributes["title"] ?? "Legalus internetiniai kazino Lietuvoje";
    $text = $attributes["text"] ?? "";
    $variant = ($attributes["variant"] ?? "dark") === "light" ? "light" : "dark";
    $top_spacer = array_key_exists("topSpacer", $attributes) ? min(160, absint($attributes["topSpacer"])) : 48;
    $overlay_opacity = array_key_exists("overlayOpacity", $attributes) ? min(90, absint($attributes["overlayOpacity"])) : 0;
    $overlay_style = "background:url(" . esc_url($image) . ") no-repeat top center;background-size:cover;";

    if ($overlay_opacity > 0) {
        $overlay_style .= "box-shadow:inset 0 0 0 9999px " . new_theme_hex_to_rgba((string) ($attributes["overlayColor"] ?? "#000000"), $overlay_opacity / 100) . ";";
    }

    return sprintf(
        '<header class="page-hero page-hero--%s"><div class="overlay" style="%s"></div><div class="container"><div style="height:%dpx;">&nbsp;</div><div class="row"><div class="page-hero__title layout__row-item-padding"><h1>%s</h1></div><div class="page-hero__text layout__row-item-padding"><p>%s</p></div></div></div></header>',
        esc_attr($variant),
        esc_attr($overlay_style),
        $top_spacer,
        new_theme_content_html($title),
        new_theme_content_html($text),
    );
}

function new_theme_render_live_odds(array $attributes): string
{
    $items = new_theme_array_items($attributes["items"] ?? []);
    $title = $attributes["title"] ?? "Isskirtiniai sporto statymai";
    $enable_slider = (bool) ($attributes["enableSlider"] ?? true);
    $logo_src = $attributes["providerLogoSrc"] ?? "assets/img/2021/08/betano-logo.svg";
    $logo_alt = $attributes["providerLogoAlt"] ?? "Betano";
    $default_cta = $attributes["defaultCtaUrl"] ?? "";
    $cta_label = $attributes["ctaLabel"] ?? "";
    $cta_url = $attributes["ctaUrl"] ?? "";

    if (empty($items)) {
        if (current_user_can("edit_posts")) {
            return '<div style="padding:16px;background:#f0f4f8;border:1px solid #c8d4e0;border-radius:4px;">' .
                esc_html__("Live odds: prognozes nesukonfiguruotos. Pridekite elementus bloko sonineje juostoje.", "new-theme") .
                "</div>";
        }
        return "";
    }

    wp_enqueue_script("new-theme-liveodds-tips");

    $logo_url = "";
    if ($logo_src) {
        if (str_starts_with($logo_src, "/") || str_starts_with($logo_src, "http")) {
            $logo_url = $logo_src;
        } else {
            $logo_url = get_template_directory_uri() . "/" . ltrim($logo_src, "/");
        }
    }

    $svg_prev =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' .
        '<rect width="24" height="24" rx="12" transform="matrix(-1 0 0 1 24 0)" fill="white"/>' .
        '<path d="M14 8L10 12L14 16" stroke="#1D2129" stroke-width="2"/></svg>';

    $svg_next =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' .
        '<rect width="24" height="24" rx="12" transform="matrix(1 0 0 -1 0 24)" fill="white"/>' .
        '<path d="M10 16L14 12L10 8" stroke="#1D2129" stroke-width="2"/></svg>';

    $svg_arrow =
        '<svg class="goto-arrow" width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">' .
        '<path fill-rule="evenodd" clip-rule="evenodd" d="M7.58579 4.00001L5.29289 1.70712L6.70711 0.292908L11.4142 5.00001L6.70711 9.70712L5.29289 8.29291L7.58579 6.00001H0V4.00001H7.58579Z" fill="#FFFFFF"/>' .
        "</svg>";

    $html = '<section class="odds-tips js-odds-tips" data-location="liveodds-priority-tips-list">';
    $html .= '<div class="container">';

    $html .= '<div class="tips-heading">';
    $html .= '<div class="tips-heading-title-wrapper"><h2>' . esc_html($title) . "</h2></div>";
    if ($enable_slider) {
        $html .= '<div class="tips-controller">';
        $html .= '<button class="prev js-prev slick-arrow slick-disabled" aria-label="' . esc_attr__("Ankstesnis", "new-theme") . '" aria-disabled="true">' . $svg_prev . "</button>";
        $html .= '<button class="next js-next slick-arrow" aria-label="' . esc_attr__("Kitas", "new-theme") . '" aria-disabled="false">' . $svg_next . "</button>";
        $html .= "</div>";
    }
    $html .= "</div>";

    $wrapper_class = $enable_slider ? "odds-tips-wrapper js-odds-tips-wrapper" : "odds-tips-wrapper";
    $html .= '<div class="' . esc_attr($wrapper_class) . '">';

    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $team_a = (string) ($item["teamA"] ?? "");
        $team_b = (string) ($item["teamB"] ?? "");
        $league = (string) ($item["league"] ?? "");
        $event_date = (string) ($item["eventDate"] ?? "");
        $market = (string) ($item["market"] ?? "");
        $odd = (string) ($item["odd"] ?? "");
        $item_cta = (string) ($item["ctaUrl"] ?? "") ?: $default_cta;
        $is_live = (bool) ($item["isLiveUpdates"] ?? false);

        $item_class = "tip-item upcoming" . ($is_live ? " lo-live-updates" : "");

        $html .= '<div class="' . esc_attr($item_class) . '"';
        if ($event_date) {
            $html .= ' data-event-date="' . esc_attr($event_date) . '"';
        }
        $html .= ">";

        $html .= '<div class="tip-match">';

        $html .= '<div class="tip-heading"><i class="lo-market-tip"></i>';
        $html .= '<div class="tip-heading-info">';
        if ($event_date) {
            $html .= '<div class="tip-event-date"><time datetime="' . esc_attr($event_date) . '"></time></div>';
        }
        if ($league) {
            $html .= '<div class="tip-league">' . esc_html($league) . "</div>";
        }
        $html .= "</div></div>";

        $html .= '<div class="tip-match-name">';
        $html .= '<div class="team-name-a">' . esc_html($team_a) . "</div>";
        $html .= '<div class="team-name-b">' . esc_html($team_b) . "</div>";
        $html .= "</div>";

        $html .= '<div class="tip-bottom">';
        $html .= '<div class="tip-odd"><div class="tip-odd-market">' . esc_html($market) . "</div></div>";

        if ($item_cta) {
            $html .= '<a class="tip-cta" href="' . esc_url($item_cta) . '" target="_blank" rel="sponsored noopener noreferrer">';
            if ($logo_url) {
                $html .= '<div class="odd-provider"><img src="' . esc_url($logo_url) . '" alt="' . esc_attr($logo_alt) . '" loading="lazy" width="48" height="32"></div>';
            }
            $html .= "<span>" . esc_html($odd) . "</span>";
            $html .= $svg_arrow;
            $html .= "</a>";
        }

        $html .= "</div>";
        $html .= "</div>";
        $html .= "</div>";
    }

    $html .= "</div>";

    if ($cta_label && $cta_url) {
        $html .= '<div class="odds-tips-cta"><a href="' . esc_url($cta_url) . '" class="btn btn-outline" rel="noopener noreferrer">' . esc_html($cta_label) . "</a></div>";
    }

    $html .= "</div></section>";

    return $html;
}

function new_theme_render_offer_list(array $attributes, string $content): string
{
    wp_enqueue_script("new-theme-offer-listing");

    $source = $attributes["source"] ?? "attributes";
    $title = $attributes["title"] ?? "Geriausi legalus internetiniai kazino Lietuvoje";
    $intro = $attributes["intro"] ?? "";

    if ("query" !== $source) {
        $cards = new_theme_compact_attribute_offer_cards(new_theme_array_items($attributes["cards"] ?? []));

        $html = '<section class="offers offers--full offers--legacy" data-location="offer-list" data-old-style="true"><div class="container">';
        $html .= '<div class="offers__controls offers--show-illegal"><div class="offers__legal-label">' . new_theme_content_html($title) . "</div></div>";
        $html .= $intro ? "<p>" . new_theme_content_html($intro) . "</p>" : "";
        $html .= '<div class="offers__list" data-ntoshow="15" data-list_type="custom">';
        foreach ($cards as $card) {
            $html .= new_theme_render_offer_card(is_array($card) ? $card : []);
        }
        if (empty($cards) && current_user_can("edit_posts")) {
            $html .= '<p class="offers__empty">' . esc_html__("Siame bloke nerasta atvaizduojamu kazino pasiulymu korteliu.", "new-theme") . "</p>";
        }
        $html .= $content . "</div>";
        $html .= "</div></section>";

        return $html;
    }

    $cards = new_theme_query_offer_cards($attributes);
    $show_legal_label = !array_key_exists("showLegalLabel", $attributes) || (bool) $attributes["showLegalLabel"];
    $limit = new_theme_offer_list_limit($attributes["limit"] ?? 15);

    $html = '<section class="offers offers--full offers--legacy" data-location="offer-list" data-old-style="true"><div class="container">';
    if ($show_legal_label) {
        $html .= '<div class="offers__controls offers--show-illegal"><div class="offers__legal-label">' . new_theme_content_html($title) . "</div></div>";
    }
    $html .= $intro ? "<p>" . new_theme_content_html($intro) . "</p>" : "";
    $html .= '<div class="offers__list" data-ntoshow="' . esc_attr((string) $limit) . '" data-list_type="custom">';
    foreach ($cards as $card) {
        $html .= new_theme_render_offer_card(is_array($card) ? $card : []);
    }
    if (empty($cards) && current_user_can("edit_posts")) {
        $html .= '<p class="offers__empty">' . esc_html__("Oferu nerasta. Patikrinkite filtrus arba pridekite nauju kazino pasiulymu.", "new-theme") . "</p>";
    }
    $html .= "</div>";
    $html .= "</div></section>";

    return $html;
}

function new_theme_render_offer_card(array $attributes): string
{
    $name = $attributes["name"] ?? "Casino";
    $logo = new_theme_asset_url($attributes["logo"] ?? "");
    $features = new_theme_csv_lines($attributes["features"] ?? "");
    $rating = max(0, min(5, (float) ($attributes["rating"] ?? 4.5)));
    $bonus = $attributes["bonus"] ?? "";
    $offer_url = new_theme_normalize_url($attributes["offerUrl"] ?? "#");
    $review_url = new_theme_normalize_url($attributes["reviewUrl"] ?? "#");
    $payments = new_theme_csv_lines(
        $attributes["payments"] ?? "assets/img/2021/06/mbway-logo.svg, assets/img/2021/06/multibanco-logo.svg, assets/img/2020/12/pm_mastercard.svg, assets/img/2020/12/pm_visa.svg",
    );

    $html = '<div class="offer-card" data-bonus="' . esc_attr(preg_replace("/[^0-9.]/", "", $bonus)) . '" data-rating="' . esc_attr((string) $rating) . '">';
    $html .= '<div class="offer-card__top">';
    $html .= '<a class="offer-card__thumb" title="' . esc_attr($name) . '" href="' . esc_url($offer_url) . '" target="_blank" rel="sponsored noopener noreferrer">';
    $html .= $logo ? '<img decoding="async" width="115" height="30" src="' . esc_url($logo) . '" alt="' . esc_attr($name) . '">' : esc_html($name);
    $html .= "</a>";
    $html .=
        '<div class="offer-card__title-wrapper"><a title="' .
        esc_attr($name) .
        '" href="' .
        esc_url($offer_url) .
        '" target="_blank" rel="sponsored noopener noreferrer"><h2>' .
        esc_html($name) .
        "</h2></a>";
    $html .= '<div class="rating"><span><span>' . esc_html(rtrim(rtrim(number_format($rating, 1), "0"), ".")) . "</span>/5</span></div></div>";
    $html .= '<ul class="offer-card__features is-style-checked-list">';

    foreach ($features as $feature) {
        $html .= "<li>" . esc_html($feature) . "</li>";
    }

    $html .= '</ul><div class="offer-card__payment"><div class="offer-card__label">' . esc_html__("Mokejimo budai", "new-theme") . '</div><div class="payment-list"><div class="payment-list__group">';
    foreach ($payments as $payment) {
        $html .= '<div class="payment-list__img-wrapper"><img decoding="async" src="' . esc_url(new_theme_asset_url($payment)) . '" alt=""></div>';
    }
    $html .= "</div></div></div></div>";
    $html .=
        '<div class="offer-card__bottom"><div class="offer-card__bonus-wrapper"><a href="' .
        esc_url($offer_url) .
        '" target="_blank" rel="sponsored noopener noreferrer"><span class="offer-card__bonus-value"><span class="bonus">' .
        esc_html($bonus) .
        '</span></span><span class="button__label">' . esc_html__("Premija", "new-theme") . '</span></a></div>';
    $html .=
        '<div class="offer-card__links"><div class="offer-card__button-wrapper"><a class="button button--primary" href="' .
        esc_url($offer_url) .
        '" target="_blank" rel="sponsored noopener noreferrer"><span>' . esc_html__("Zaisti", "new-theme") . '</span></a></div><div class="offer-card__button-wrapper"><a class="button button--secondary" href="' .
        esc_url($review_url) .
        '"><span>' . esc_html__("Apzvalga", "new-theme") . '</span></a></div></div></div>';
    $html .= "</div>";

    return $html;
}

function new_theme_render_two_column_text(array $attributes): string
{
    $title = $attributes["title"] ?? "";
    $items = new_theme_array_items($attributes["items"] ?? []);
    $style = !empty($attributes["background"]) ? ' style="background-color:' . esc_attr($attributes["background"]) . '"' : "";

    $html = '<section class="text-block--two-column"' . $style . '><div class="container"><div class="row">';
    if ($title) {
        $html .= '<div class="layout__row-item-padding"><h2>' . new_theme_content_html($title) . "</h2></div>";
    }
    foreach ($items as $item) {
        $item = is_array($item) ? $item : [];
        if (!empty($item["heading"])) {
            $html .=
                '<h3 class="layout__row-item-padding"><img decoding="async" src="' .
                esc_url(new_theme_asset_url("assets/img/theme/green-check.svg")) .
                '" class="mr-2" width="16" height="16" alt="Check">' .
                new_theme_content_html($item["heading"]) .
                "</h3>";
        }
        foreach (["left", "right"] as $col) {
            if (!empty($item[$col])) {
                $html .= '<div class="text-block layout__row-item-padding">' . new_theme_content_html($item[$col]) . "</div>";
            }
        }
    }
    $html .= "</div></div></section>";
    return $html;
}

function new_theme_render_about_list(array $attributes): string
{
    $title = $attributes["title"] ?? "";
    $items = new_theme_array_items($attributes["items"] ?? []);
    $style = !empty($attributes["background"]) ? ' style="background-color:' . esc_attr($attributes["background"]) . '"' : "";

    $icon =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#15A96A"/><path d="M5 8L7 10L11 6" stroke="white"/></svg>';

    $html = '<section class="about"' . $style . '><div class="container"><div class="row">';
    if ($title) {
        $html .= '<div class="about__heading layout__row-item-padding"><h2>' . new_theme_content_html($title) . "</h2></div>";
    }
    $html .= '<div class="about__list layout__row-item-padding"><div>';
    foreach ($items as $item) {
        $item = is_array($item) ? $item : [];
        $item_title = $item["title"] ?? "";
        $item_desc = $item["description"] ?? "";
        $html .= '<div class="about__list-item">';
        $html .= $icon;
        if ($item_title) {
            $html .= "<h3>" . esc_html($item_title) . "</h3>";
        }
        if ($item_desc) {
            $html .= "<p>" . new_theme_content_html($item_desc) . "</p>";
        }
        $html .= "</div>";
    }
    $html .= "</div></div></div></div></section>";
    return $html;
}

function new_theme_render_info_grid(array $attributes): string
{
    $title = $attributes["title"] ?? "";
    $items = new_theme_array_items($attributes["items"] ?? []);
    $style = !empty($attributes["background"]) ? ' style="background-color:' . esc_attr($attributes["background"]) . '"' : "";

    $html = '<section class="info info--top-left"' . $style . '><div class="container"><div class="row">';
    if ($title) {
        $html .= '<div class="info__heading layout__row-item-padding"><h2>' . new_theme_content_html($title) . "</h2></div>";
    }
    $html .= '<div class="info__list layout__row-item-padding">';
    foreach ($items as $item) {
        $item = is_array($item) ? $item : [];
        $text = $item["text"] ?? "";
        $link_label = $item["linkLabel"] ?? "";
        $link_url = $item["linkUrl"] ?? "";
        if ($link_url) {
            $link_url = new_theme_normalize_url($link_url);
        }
        $html .= '<div class="info__block">';
        $html .= "<p>" . new_theme_content_html($text);
        if ($link_url && $link_label) {
            $html .= '<br><br><a href="' . esc_url($link_url) . '" style="font-weight:bold;color:#15a96a;">' . esc_html($link_label) . "</a>";
        }
        $html .= "</p></div>";
    }
    $html .= "</div></div></div></section>";
    return $html;
}

function new_theme_render_content_section(array $attributes): string
{
    $kind = $attributes["kind"] ?? "text";
    $title = $attributes["title"] ?? "";
    $text = $attributes["text"] ?? "";
    $image = $attributes["image"] ?? "";
    $items = new_theme_array_items($attributes["items"] ?? []);
    $style = !empty($attributes["background"]) ? ' style="background-color:' . esc_attr($attributes["background"]) . '"' : "";
    $classes = [
        "text" => "text-block--two-column",
        "about" => "about",
        "info" => "info info--top-left",
    ];
    $class = $classes[$kind] ?? "text-block--two-column";

    $html = '<section class="' . esc_attr($class) . '"' . $style . '><div class="container"><div class="row">';
    if ($title) {
        $html .= '<div class="layout__row-item-padding"><h2>' . new_theme_content_html($title) . "</h2></div>";
    }

    if (in_array($kind, ["about", "info"], true)) {
        if ($image) {
            $html .= '<div class="' . esc_attr($kind) . '__image layout__row-item-padding"><img src="' . esc_url(new_theme_asset_url($image)) . '" alt=""></div>';
        }
        $html .= '<div class="' . esc_attr($kind) . '__content layout__row-item-padding">' . new_theme_content_html($text) . "</div>";
        $html .= "</div></div></section>";
        return $html;
    }

    foreach ($items as $item) {
        $item = is_array($item) ? $item : [];
        if (!empty($item["heading"])) {
            $html .=
                '<h3 class="layout__row-item-padding"><img decoding="async" src="' .
                esc_url(new_theme_asset_url("assets/img/theme/green-check.svg")) .
                '" class="mr-2" width="16" height="16" alt="Check">' .
                new_theme_content_html($item["heading"]) .
                "</h3>";
        }
        foreach (["left", "right"] as $column) {
            if (!empty($item[$column])) {
                $html .= '<div class="text-block layout__row-item-padding">' . new_theme_content_html($item[$column]) . "</div>";
            }
        }
    }

    $html .= "</div></div></section>";
    return $html;
}

function new_theme_render_related_links(array $attributes): string
{
    wp_enqueue_script("new-theme-internal-links");

    $title = $attributes["title"] ?? "";
    $intro_text = $attributes["introText"] ?? "";
    $variant = $attributes["variant"] ?? "cards";
    $items = new_theme_array_items($attributes["items"] ?? []);
    $style = !empty($attributes["background"]) ? ' style="background-color:' . esc_attr($attributes["background"]) . '"' : "";

    $variant_class = "cards" === $variant ? "related-links" : "related-links related-links--" . esc_attr($variant);

    $html = '<section class="' . $variant_class . '"' . $style . ' data-location="internal-links"><div class="container"><div class="row">';
    if ($title || $intro_text) {
        $html .= '<div class="related-links__heading layout__row-item-padding">';
        if ($title) {
            $html .= "<h2>" . new_theme_content_html($title) . "</h2>";
        }
        if ($intro_text) {
            $html .= '<p class="related-links__intro">' . new_theme_content_html($intro_text) . "</p>";
        }
        $html .= "</div>";
    }

    $wrapper_open = "footer" === $variant ? '<div class="related-links__group">' : "";
    $wrapper_close = "footer" === $variant ? "</div>" : "";
    $html .= $wrapper_open;

    foreach ($items as $item) {
        $item = is_array($item) ? $item : [];
        $url = new_theme_normalize_url($item["url"] ?? "#");
        $image = $item["image"] ?? "";
        $link_label = !empty($item["linkLabel"]) ? $item["linkLabel"] : __("Skaityti daugiau", "new-theme");

        $html .= '<div class="related-links__link layout__row-item-padding">';
        if ($image) {
            $html .= '<img decoding="async" width="60" height="60" src="' . esc_url(new_theme_asset_url($image)) . '" alt="' . esc_attr($item["title"] ?? "") . '">';
        }
        $html .= "<h3>" . new_theme_content_html($item["title"] ?? "") . "</h3>";
        $html .= !empty($item["text"]) ? "<p>" . new_theme_content_html($item["text"]) . "</p>" : "";
        $html .= '<a href="' . esc_url($url) . '" class="related-links__url" data-internal-link="true">' . esc_html($link_label) . "</a>";
        $html .= "</div>";
    }

    $html .= $wrapper_close . "</div></div></section>";

    return $html;
}

function new_theme_render_data_table(array $attributes): string
{
    $title = $attributes["title"] ?? "";
    $headers = new_theme_array_items($attributes["headers"] ?? []);
    $rows = new_theme_array_items($attributes["rows"] ?? []);
    $mobile_behavior = $attributes["mobileBehavior"] ?? "scroll";
    $highlighted_rows = array_map("intval", (array) ($attributes["highlightedRows"] ?? []));
    $highlighted_cells = array_map("strval", (array) ($attributes["highlightedCells"] ?? []));
    $style = !empty($attributes["background"]) ? ' style="background-color:' . esc_attr($attributes["background"]) . '"' : "";

    $section_class = "table-responsive" . ("stacked" === $mobile_behavior ? " table-responsive--stacked" : "");

    $html = '<section class="' . esc_attr($section_class) . '"' . $style . ' data-location="table-responsive"><div class="container">';
    if ($title) {
        $html .= '<div class="table-responsive__heading"><h2>' . new_theme_content_html($title) . "</h2></div>";
    }
    $html .= '<div class="table-responsive__wrapper"><table><thead><tr>';
    foreach ($headers as $header) {
        $html .= "<th>" . esc_html((string) $header) . "</th>";
    }
    $html .= "</tr></thead><tbody>";
    foreach ($rows as $row_index => $row) {
        $row_class = in_array($row_index, $highlighted_rows, true) ? ' class="is-highlighted"' : "";
        $html .= "<tr" . $row_class . ">";
        foreach (new_theme_array_items($row) as $col_index => $cell) {
            $cell_key = $row_index . ":" . $col_index;
            $cell_class = in_array($cell_key, $highlighted_cells, true) ? ' class="is-highlighted"' : "";
            $data_label = isset($headers[$col_index]) ? ' data-label="' . esc_attr((string) $headers[$col_index]) . '"' : "";
            $html .= "<td" . $cell_class . $data_label . ">" . new_theme_content_html((string) $cell) . "</td>";
        }
        $html .= "</tr>";
    }
    $html .= "</tbody></table></div></div></section>";

    return $html;
}

function new_theme_render_news_slider(array $attributes): string
{
    $title = $attributes["title"] ?? "Naujausi straipsniai";
    $source = $attributes["source"] ?? "query";
    $post_type = $attributes["postType"] ?? "post";
    $category_slug = $attributes["categorySlug"] ?? "";
    $num_posts = max(1, min(20, (int) ($attributes["numberOfPosts"] ?? 6)));
    $enable_slider = (bool) ($attributes["enableSlider"] ?? true);

    if ("query" === $source) {
        $args = [
            "post_type" => sanitize_key($post_type) ?: "post",
            "posts_per_page" => $num_posts,
            "post_status" => "publish",
            "no_found_rows" => true,
        ];
        if ($category_slug) {
            $args["category_name"] = sanitize_text_field($category_slug);
        }
        $query = new WP_Query($args);
        $items = [];
        while ($query->have_posts()) {
            $query->the_post();
            $cats = get_the_category();
            $thumb_url = get_the_post_thumbnail_url(null, "medium");
            $items[] = [
                "title" => get_the_title(),
                "date" => get_the_date("d/m/Y"),
                "category" => $cats ? $cats[0]->name : "",
                "url" => get_permalink(),
                "image" => $thumb_url ?: "",
            ];
        }
        wp_reset_postdata();
    } else {
        $items = new_theme_array_items($attributes["items"] ?? []);
    }

    if ($enable_slider) {
        wp_enqueue_script("new-theme-news-slider");
    }

    $section_class = "news-slider" . ($enable_slider ? "" : " news-slider--no-slider");
    $degrade_url = esc_url(new_theme_asset_url("assets/img/2023/03/degrade_purple-1.svg"));

    $html = '<section class="' . esc_attr($section_class) . '" data-location="news-slider"><div class="container">';
    $html .= '<div class="news-slider__upper"><h2 class="news-slider__title layout__row-item-padding">' . new_theme_content_html($title) . "</h2></div>";
    $html .= '<div class="news-slider__wrapper"><div class="news-slider__slider">';

    foreach ($items as $item) {
        $item = is_array($item) ? $item : [];
        $image = $item["image"] ?? "";
        $html .= '<div class="news-slider__item-wrapper news-slider__tag--all"><a class="news-slider-item" href="' . esc_url(new_theme_normalize_url($item["url"] ?? "#")) . '">';
        $html .= '<div class="news-slider-item__cover">';
        $html .= '<div class="news-slider-item__cover-image" style="background:url(' . $degrade_url . ') no-repeat 99% bottom;background-size:cover;"></div>';
        $html .= '<div class="news-slider-item__cover-title">' . esc_html($item["category"] ?? "") . "</div>";
        $html .= "</div>";
        if ($image) {
            $html .=
                '<img decoding="async" loading="lazy" class="news-slider-item__thumb" width="339" height="192" src="' .
                esc_url(new_theme_asset_url($image)) .
                '" alt="' .
                esc_attr($item["title"] ?? "") .
                '">';
        }
        $html .= '<time class="news-slider-item__date">' . esc_html($item["date"] ?? "") . "</time>";
        $html .= '<h3 class="news-slider-item__title">' . new_theme_content_html($item["title"] ?? "") . "</h3>";
        $html .= '<span class="news-slider-item__link">' . esc_html__("Skaityti daugiau", "new-theme") . '</span></a></div>';
    }

    if (!$items) {
        $msg = "query" === $source ? __("Irasu nerasta. Patikrinkite iraso tipo ir kategorijos nustatymus.", "new-theme") : __("Elementu nera. Pridekite straipsnius bloko nustatymuose.", "new-theme");
        $html .= '<p class="news-slider__empty" style="padding:1em;color:#888;">' . esc_html($msg) . "</p>";
    }

    $html .= "</div></div></div></section>";
    return $html;
}

function new_theme_render_card_grid(array $attributes, string $content): string
{
    $title = $attributes["title"] ?? "";

    return '<section class="nt-section"><div class="nt-section__inner">' . ($title ? "<h2>" . esc_html($title) . "</h2>" : "") . '<div class="nt-card-grid">' . $content . "</div></div></section>";
}

function new_theme_render_link_card(array $attributes): string
{
    $image = new_theme_asset_url($attributes["image"] ?? "");
    $title = $attributes["title"] ?? "";
    $text = $attributes["text"] ?? "";
    $url = $attributes["url"] ?? "#";

    $html = '<a class="nt-link-card" href="' . esc_url(new_theme_normalize_url($url)) . '">';
    $html .= $image ? '<img class="nt-link-card__image" src="' . esc_url($image) . '" alt="' . esc_attr($title) . '">' : '<span class="nt-link-card__image"></span>';
    $html .= '<span class="nt-link-card__body"><h3>' . esc_html($title) . "</h3>";
    $html .= $text ? "<p>" . esc_html($text) . "</p>" : "";
    $html .= "</span></a>";

    return $html;
}

function new_theme_render_faq(array $attributes, string $content): string
{
    $title = $attributes["title"] ?? "Dazniausiai uzduodami klausimai";

    return '<section class="nt-section"><div class="nt-section__inner"><h2>' . esc_html($title) . '</h2><div class="nt-faq">' . $content . "</div></div></section>";
}

function new_theme_render_faq_item(array $attributes): string
{
    return '<article class="nt-faq-item"><h3>' . esc_html($attributes["question"] ?? "") . "</h3><p>" . new_theme_content_html($attributes["answer"] ?? "") . "</p></article>";
}

function new_theme_render_site_footer(array $attributes): string
{
    $logo = new_theme_asset_url($attributes["logo"] ?? "assets/img/ggbet-logo.svg");
    $logo_alt = $attributes["logoAlt"] ?? "GGBET";
    $disclaimer =
        $attributes["disclaimerText"] ??
        "Kad patirtis butu kuo geresne, svarbu zaisti atsakingai. Rekomenduojame naudotis atsakingo zaidimo irankiais, nusistatyti limitus ir kreiptis pagalbos, jei pajustumete, kad prarandate zaidimo iprociu kontrole. Legalios lazybu bendroves turi siuos irankius, todel raginame rinktis tik musu rekomenduojamas licencijuotas svetaines.";
    $copyright = $attributes["copyright"] ?? "© 2026 - Aposta Legal. Visos teises saugomos.";

    $info_links = new_theme_array_items($attributes["infoLinks"] ?? []);
    if (empty($info_links)) {
        $info_links = [["label" => "Atsakingas zaidimas", "url" => "/jogo-responsavel/"], ["label" => "Musu kriterijai", "url" => "/como-avaliamos-as-casas/"]];
    }

    $more_links = new_theme_array_items($attributes["moreLinks"] ?? []);
    if (empty($more_links)) {
        $more_links = [["label" => "Kontaktai", "url" => "/contactos/"], ["label" => "Apie mus", "url" => "/sobre-nos/"]];
    }

    $ext_links = new_theme_array_items($attributes["externalLinks"] ?? []);

    $footer_links = new_theme_array_items($attributes["footerLinks"] ?? []);
    if (empty($footer_links)) {
        $footer_links = [["label" => "Privatumo ir slapuku politika", "url" => "/politica-privacidade/"], ["label" => "Taisykles ir salygos", "url" => "/termos-e-condicoes/"]];
    }

    $html = '<input type="hidden" value="" id="age-gating">';
    $html .= '<footer id="footer-container" class="site-footer" role="contentinfo">';
    $html .= '<div class="container"><div class="row">';

    // Логотип.
    $html .= sprintf(
        '<a class="brand layout__row-item-padding" href="%s"><img class="brand__img" width="82" height="32" src="%s" alt="%s"/></a>',
        esc_url(home_url("/")),
        esc_url($logo),
        esc_attr($logo_alt),
    );

    // Текст дисклеймера.
    $html .= '<div class="site-footer__text layout__row-item-padding"><p>' . new_theme_content_html($disclaimer) . "</p></div>";

    // Link groups.
    $html .= '<div class="site-footer__link-groups layout__row-item-padding">';

    $html .= '<div class="related-links__group">';
    $html .= '<div class="related-links__group-title">' . esc_html__("INFORMACIJA", "new-theme") . '</div>';
    foreach ($info_links as $link) {
        $link = is_array($link) ? $link : [];
        $html .= sprintf('<a class="related-links__group-link" href="%s"><span>%s</span></a>', esc_url(new_theme_normalize_url($link["url"] ?? "#")), esc_html($link["label"] ?? ""));
    }
    $html .= "</div>";

    $html .= '<div class="related-links__group">';
    $html .= '<div class="related-links__group-title">' . esc_html__("Suzinoti daugiau", "new-theme") . '</div>';
    foreach ($more_links as $link) {
        $link = is_array($link) ? $link : [];
        $html .= sprintf('<a class="related-links__group-link" href="%s"><span>%s</span></a>', esc_url(new_theme_normalize_url($link["url"] ?? "#")), esc_html($link["label"] ?? ""));
    }
    $html .= "</div></div>";

    if (!empty($ext_links)) {
        // External country links.
        $html .= '<div class="site-footer__external-links layout__row-item-padding">';
        foreach ($ext_links as $link) {
            $link = is_array($link) ? $link : [];
            $image = new_theme_asset_url($link["image"] ?? "");
            $html .= sprintf(
                '<a href="%s" target="_blank" rel="noopener noreferrer">%s<span>%s</span></a>',
                esc_url($link["url"] ?? "#"),
                $image ? '<img width="20" height="20" src="' . esc_url($image) . '" alt="' . esc_attr($link["label"] ?? "") . '">' : "",
                esc_html($link["label"] ?? ""),
            );
        }
        $html .= "</div>";
    }

    // Partners 18+ badge (fixed).
    $html .= '<div class="partners layout__row-item-padding">';
    $html .= '<img src="' . esc_url(new_theme_asset_url("assets/img/2021/03/18.svg")) . '" alt="Vyresni nei 18 metu">';
    $html .= "</div>";

    // Footer nav + copyright.
    $html .= '<div class="header__actions">';
    $html .= '<nav class="footer-nav layout__row-item-padding"><div class="nav-menu__footer-container"><ul id="footer-menu" class="nav-menu">';
    foreach ($footer_links as $link) {
        $link = is_array($link) ? $link : [];
        $html .= sprintf(
            '<li class="nav-menu__item"><a title="%s" href="%s">%s</a></li>',
            esc_attr($link["label"] ?? ""),
            esc_url(new_theme_normalize_url($link["url"] ?? "#")),
            esc_html($link["label"] ?? ""),
        );
    }
    $html .= "</ul></div></nav>";
    $html .= '<div class="site-footer__copyright layout__row-item-padding"><p>' . new_theme_content_html($copyright) . "</p></div>";
    $html .= "</div>";

    $html .= "</div></div></footer>";

    return $html;
}
